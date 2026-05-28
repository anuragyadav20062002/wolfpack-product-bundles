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
  refreshOfflineSession,
  shouldRefreshOfflineSession,
  type OfflineSessionRecord,
} from "../services/offline-token.server";

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
    if (cached && cached.expiresAt > Date.now() && !this.cachedSessionNeedsRefresh(cached.session)) {
      return cached.session;
    }

    const row = await this.prisma.session.findUnique({ where: { id } });
    if (!row) {
      this.cache.delete(id);
      return undefined;
    }

    const hydratedRow = await this.refreshOfflineRowIfNeeded(row);
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

    return Promise.all(
      rows.map(async (row) => this.rowToSession(await this.refreshOfflineRowIfNeeded(row))),
    );
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

  private async refreshOfflineRowIfNeeded(row: SessionRow): Promise<SessionRow> {
    if (row.isOnline || !shouldRefreshOfflineSession(row)) {
      return row;
    }

    return (await refreshOfflineSession(
      this.prisma,
      row,
      this,
    )) as SessionRow;
  }

  private cachedSessionNeedsRefresh(session: Session): boolean {
    if (session.isOnline) return false;

    const offlineSession = session as SessionWithRefreshFields;
    if (!offlineSession.refreshToken || !offlineSession.expires) {
      return false;
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
    const sessionParams = [
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
    ].filter((entry): entry is [string, string | number | boolean] => entry[1] !== null);

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
