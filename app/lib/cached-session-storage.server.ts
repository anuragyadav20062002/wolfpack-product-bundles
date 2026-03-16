/**
 * CachedSessionStorage — in-memory TTL cache wrapping PrismaSessionStorage.
 *
 * Problem it solves:
 * The Shopify SDK calls `sessionStorage.loadSession(id)` on every storefront
 * App Proxy request to retrieve the shop's offline access token.  With
 * PrismaSessionStorage that is a live Postgres query on every storefront page
 * load — a major contributor to pool exhaustion and 504 gateway timeouts.
 *
 * Solution:
 * Cache the session in memory for `ttlMs` milliseconds (default 10 min).
 * The offline token is essentially static (changes only on app re-install /
 * OAuth re-auth), so 10 min is very safe and eliminates ~99 % of session DB
 * queries on the hot path.
 *
 * Multi-process safety:
 * Each Render instance has its own cache.  A re-install clears only the local
 * process cache; other processes will see a DB miss on their next request and
 * re-populate — acceptable because re-installs are extremely rare.
 */

import type { Session } from "@shopify/shopify-api";
import type { PrismaSessionStorageInterface } from "@shopify/shopify-app-session-storage-prisma";

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // evict expired entries every 5 min

interface CacheEntry {
  session: Session;
  expiresAt: number;
}

export class CachedSessionStorage implements PrismaSessionStorageInterface {
  private readonly inner: PrismaSessionStorageInterface;
  private readonly ttlMs: number;
  private readonly cache = new Map<string, CacheEntry>();
  private readonly cleanupTimer: ReturnType<typeof setInterval>;

  constructor(inner: PrismaSessionStorageInterface, ttlMs = DEFAULT_TTL_MS) {
    this.inner = inner;
    this.ttlMs = ttlMs;

    // Periodic cleanup prevents unbounded Map growth in long-running processes
    this.cleanupTimer = setInterval(
      () => this.evictExpired(),
      CLEANUP_INTERVAL_MS,
    );

    // Don't prevent Node from exiting cleanly
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  async loadSession(id: string): Promise<Session | undefined> {
    const entry = this.cache.get(id);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.session;
    }

    // Cache miss or stale — fetch from DB
    const session = await this.inner.loadSession(id);
    if (session) {
      this.cache.set(id, { session, expiresAt: Date.now() + this.ttlMs });
    } else {
      // Remove stale entry if one existed
      this.cache.delete(id);
    }
    return session;
  }

  async storeSession(session: Session): Promise<boolean> {
    const result = await this.inner.storeSession(session);
    // Keep cache consistent — re-install writes new token here
    this.cache.set(session.id, {
      session,
      expiresAt: Date.now() + this.ttlMs,
    });
    return result;
  }

  async deleteSession(id: string): Promise<boolean> {
    this.cache.delete(id);
    return this.inner.deleteSession(id);
  }

  async deleteSessions(ids: string[]): Promise<boolean> {
    for (const id of ids) {
      this.cache.delete(id);
    }
    return this.inner.deleteSessions(ids);
  }

  // findSessionsByShop is used for token rotation / cleanup — always bypass cache
  async findSessionsByShop(shop: string): Promise<Session[]> {
    return this.inner.findSessionsByShop(shop);
  }

  async isReady(): Promise<boolean> {
    return this.inner.isReady();
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
