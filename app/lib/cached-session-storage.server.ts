/**
 * CachedSessionStorage — Prisma-backed Shopify session storage with an in-memory
 * TTL cache for hot app-proxy/storefront reads.
 *
 * We own the row mapping here instead of delegating to PrismaSessionStorage so
 * we can persist Shopify's expiring offline token metadata and refresh tokens
 * before the SDK serves a stale offline session back to callers.
 */

import { Session } from "@shopify/shopify-api";
import type { PrismaClient } from "@prisma/client";
import {
  migrateOfflineSessionToExpiring,
  refreshOfflineSession,
  shouldRefreshOfflineSession,
  type OfflineSessionRecord,
} from "../services/offline-token.server";
import { AppLogger } from "./logger";

const DEFAULT_TTL_MS = 10 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const READY_RETRIES = 2;
const READY_RETRY_INTERVAL_MS = 5_000;

type SessionWithRefreshFields = Session & {
  refreshToken?: string;
  refreshTokenExpiresAt?: Date;
};

type SessionRow = OfflineSessionRecord & {
  storefrontAccessToken: string | null;
  userId: bigint | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  accountOwner: boolean | null;
  locale: string | null;
  collaborator: boolean | null;
  emailVerified: boolean | null;
};

interface CacheEntry {
  session: Session;
  expiresAt: number;
}

export class CachedSessionStorage {
  private readonly prisma: PrismaClient;
  private readonly ttlMs: number;
  private readonly cache = new Map<string, CacheEntry>();
  private readonly cleanupTimer: ReturnType<typeof setInterval>;

  constructor(prisma: PrismaClient, ttlMs = DEFAULT_TTL_MS) {
    this.prisma = prisma;
    this.ttlMs = ttlMs;

    this.cleanupTimer = setInterval(() => this.evictExpired(), CLEANUP_INTERVAL_MS);
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  async loadSession(id: string): Promise<Session | undefined> {
    const cached = this.cache.get(id);
    if (cached && cached.expiresAt > Date.now() && !this.cachedSessionNeedsHydration(cached.session)) {
      return cached.session;
    }

    const row = await this.loadSessionRow(id);
    if (!row) {
      this.cache.delete(id);
      return undefined;
    }

    const hydratedRow = await this.hydrateOfflineRowIfNeeded(row);
    if (!hydratedRow) {
      // The offline row could not be made compliant with Shopify's expiring-token
      // contract. Return undefined so callers do not use a legacy offline token.
      this.cache.delete(id);
      return undefined;
    }
    const session = this.rowToSession(hydratedRow);
    this.cache.set(id, {
      session,
      expiresAt: Date.now() + this.ttlMs,
    });
    return session;
  }

  async storeSession(session: Session): Promise<boolean> {
    await this.prisma.session.upsert({
      where: { id: session.id },
      update: this.sessionToRow(session),
      create: this.sessionToRow(session),
    });

    this.cache.set(session.id, {
      session,
      expiresAt: Date.now() + this.ttlMs,
    });
    return true;
  }

  async deleteSession(id: string): Promise<boolean> {
    this.cache.delete(id);

    try {
      await this.prisma.session.delete({ where: { id } });
    } catch {
      return true;
    }

    return true;
  }

  async deleteSessions(ids: string[]): Promise<boolean> {
    for (const id of ids) {
      this.cache.delete(id);
    }

    await this.prisma.session.deleteMany({
      where: { id: { in: ids } },
    });

    return true;
  }

  async findSessionsByShop(shop: string): Promise<Session[]> {
    const rows = await this.prisma.session.findMany({
      where: { shop },
      take: 25,
      orderBy: [{ expires: "desc" }],
    });

    const hydrated = await Promise.all(
      rows.map((row) => this.hydrateOfflineRowIfNeeded(row)),
    );
    return hydrated
      .filter((row): row is SessionRow => row !== null)
      .map((row) => this.rowToSession(row));
  }

  async isReady(): Promise<boolean> {
    for (let attempt = 0; attempt < READY_RETRIES; attempt += 1) {
      try {
        await this.prisma.session.count();
        return true;
      } catch {
        if (attempt < READY_RETRIES - 1) {
          await sleep(READY_RETRY_INTERVAL_MS);
        }
      }
    }

    return false;
  }

  private async loadSessionRow(id: string): Promise<SessionRow | null> {
    try {
      return await this.prisma.session.findUnique({ where: { id } });
    } catch (error) {
      if (!isTransientPrismaConnectionError(error)) {
        throw error;
      }

      AppLogger.warn(
        "[CachedSessionStorage] Prisma session read failed on a stale connection; retrying once",
        { component: "cached-session-storage", sessionId: id },
        error as Error,
      );

      await this.reconnectPrisma();
      return await this.prisma.session.findUnique({ where: { id } });
    }
  }

  private async reconnectPrisma(): Promise<void> {
    const prismaWithConnection = this.prisma as PrismaClient & {
      $disconnect?: () => Promise<void>;
      $connect?: () => Promise<void>;
    };

    try {
      await prismaWithConnection.$disconnect?.();
    } catch {
      // The connection is already unhealthy; continue to the reconnect attempt.
    }

    await prismaWithConnection.$connect?.();
  }

  private async hydrateOfflineRowIfNeeded(row: SessionRow): Promise<SessionRow | null> {
    if (row.isOnline) {
      return row;
    }

    if (!row.refreshToken) {
      try {
        return (await migrateOfflineSessionToExpiring(this.prisma, row, this)) as SessionRow;
      } catch (error) {
        return await this.handleOfflineTokenHydrationFailure(row, error, {
          action: "migration",
          deleteUnusableCredential: true,
        });
      }
    }

    if (!row.expires || !row.refreshTokenExpiresAt || shouldRefreshOfflineSession(row)) {
      try {
        return (await refreshOfflineSession(this.prisma, row, this)) as SessionRow;
      } catch (error) {
        if (isOfflineCredentialUnusable(error)) {
          return await this.handleOfflineTokenHydrationFailure(row, error, {
            action: "refresh",
            deleteUnusableCredential: true,
          });
        }

        if (row.expires && row.refreshTokenExpiresAt) {
          AppLogger.warn(
            "[CachedSessionStorage] Offline session refresh failed; serving current expiring row",
            { component: "cached-session-storage", shop: row.shop, sessionId: row.id },
            error as Error,
          );
          return row;
        }

        return await this.handleOfflineTokenHydrationFailure(row, error, {
          action: "refresh",
          deleteUnusableCredential: false,
        });
      }
    }

    return row;
  }

  private async handleOfflineTokenHydrationFailure(
    row: SessionRow,
    error: unknown,
    options: { action: "migration" | "refresh"; deleteUnusableCredential: boolean },
  ): Promise<null> {
    if (options.deleteUnusableCredential && isOfflineCredentialUnusable(error)) {
      // Shopify rejected the stored credential. Drop the row so the SDK falls
      // back to a fresh token exchange instead of looping on the bad credential.
      AppLogger.warn(
        `[CachedSessionStorage] Dropping session — offline token ${options.action} rejected by Shopify`,
        { component: "cached-session-storage", shop: row.shop, sessionId: row.id },
        error as Error,
      );
      this.cache.delete(row.id);
      try {
        await this.prisma.session.delete({ where: { id: row.id } });
      } catch {
        // Row may already be gone; nothing to do.
      }
      return null;
    }

    AppLogger.warn(
      `[CachedSessionStorage] Offline session ${options.action} failed; not serving non-compliant offline row`,
      { component: "cached-session-storage", shop: row.shop, sessionId: row.id },
      error as Error,
    );
    return null;
  }

  private cachedSessionNeedsHydration(session: Session): boolean {
    if (session.isOnline) return false;

    const offlineSession = session as SessionWithRefreshFields;
    if (!offlineSession.refreshToken || !offlineSession.expires || !offlineSession.refreshTokenExpiresAt) {
      return true;
    }

    return offlineSession.expires.getTime() <= Date.now() + 5 * 60 * 1000;
  }

  private sessionToRow(session: Session) {
    const sessionParams = session.toObject();
    const offlineSession = session as SessionWithRefreshFields;

    return {
      id: session.id,
      shop: session.shop,
      state: session.state,
      isOnline: session.isOnline,
      scope: session.scope || null,
      expires: session.expires || null,
      accessToken: session.accessToken || "",
      refreshToken: offlineSession.refreshToken || null,
      refreshTokenExpiresAt: offlineSession.refreshTokenExpiresAt || null,
      userId: sessionParams.onlineAccessInfo?.associated_user.id
        ? BigInt(sessionParams.onlineAccessInfo.associated_user.id)
        : null,
      firstName: sessionParams.onlineAccessInfo?.associated_user.first_name || null,
      lastName: sessionParams.onlineAccessInfo?.associated_user.last_name || null,
      email: sessionParams.onlineAccessInfo?.associated_user.email || null,
      accountOwner: sessionParams.onlineAccessInfo?.associated_user.account_owner || false,
      locale: sessionParams.onlineAccessInfo?.associated_user.locale || null,
      collaborator: sessionParams.onlineAccessInfo?.associated_user.collaborator || false,
      emailVerified: sessionParams.onlineAccessInfo?.associated_user.email_verified || false,
    };
  }

  private rowToSession(row: SessionRow): Session {
    const sessionParamsInput: Array<[string, string | number | boolean | null]> = [
      ["id", row.id],
      ["shop", row.shop],
      ["state", row.state],
      ["isOnline", row.isOnline],
      ["accessToken", row.accessToken],
      ["scope", row.scope],
      ["expires", row.expires ? row.expires.getTime() : null],
      ["userId", row.userId ? row.userId.toString() : null],
      ["firstName", row.firstName],
      ["lastName", row.lastName],
      ["email", row.email],
      ["accountOwner", row.accountOwner],
      ["locale", row.locale],
      ["collaborator", row.collaborator],
      ["emailVerified", row.emailVerified],
    ];
    const sessionParams = sessionParamsInput.filter(
      (entry): entry is [string, string | number | boolean] =>
        entry[1] !== null,
    );

    const session = Session.fromPropertyArray(sessionParams, true);
    const offlineSession = session as SessionWithRefreshFields;
    offlineSession.refreshToken = row.refreshToken || undefined;
    offlineSession.refreshTokenExpiresAt = row.refreshTokenExpiresAt || undefined;
    return session;
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [id, entry] of this.cache) {
      if (entry.expiresAt <= now) {
        this.cache.delete(id);
      }
    }
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// requestOfflineToken formats errors as "Offline token request failed: {status} {description}".
// A 401, or any response that explicitly names `invalid_grant`, signals that the
// stored offline credential itself is no longer accepted — the row must be dropped.
function isOfflineCredentialUnusable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Offline token request failed:\s*401\b/.test(message) || /invalid_grant/i.test(message);
}

function isTransientPrismaConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const prismaError = error as Error & { code?: unknown };
  const code = typeof prismaError.code === "string"
    ? prismaError.code
    : "";
  const message = error.message.toLowerCase();

  return code === "P1017" || message.includes("server has closed the connection");
}
