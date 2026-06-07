/**
 * Loader-level cache — tiny in-process LRU + TTL for cross-route lookups.
 *
 * Use this to wrap expensive but slow-changing fetches that get repeated on
 * every admin navigation: subscription info, app-embed status, shop owner
 * name, etc. These rarely change inside a 30-second window so a short TTL
 * is safe and saves an entire Shopify GraphQL round-trip per navigation.
 *
 * **Not for** anything mutated by the admin UI itself — bundle counts,
 * settings, etc. Those rebuild on every render.
 *
 * Issue: docs/issues-prod/admin-lcp-phase4-loaders-1.md.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 30_000;
const DEFAULT_MAX_ENTRIES = 256;

/**
 * Singleton in-memory LRU. Shared across loaders on the same process so
 * navigating Dashboard -> Settings -> Dashboard re-uses the same cached
 * billing / embed-check entries.
 */
class LoaderCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private inflight = new Map<string, Promise<unknown>>();
  private maxEntries: number;

  constructor(maxEntries = DEFAULT_MAX_ENTRIES) {
    this.maxEntries = maxEntries;
  }

  /** Returns the cached value if present and unexpired, else `undefined`. */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    // LRU touch — re-insert moves the key to the end of the map's iteration order.
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value as T;
  }

  /** Inserts a value with a TTL window (defaults to 30 s). Evicts oldest if over cap. */
  set<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS): void {
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  /** Forces removal — call from webhook handlers when the underlying data changes. */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /** Removes every key matching the prefix — useful for "all entries for shop X". */
  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  /**
   * Returns the cached value if fresh; otherwise calls `fn`, caches its
   * result, and returns it. Concurrent calls for the same key share the
   * same in-flight promise so duplicate misses don't fan-out to the
   * backend.
   */
  async memo<T>(key: string, fn: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;

    const existing = this.inflight.get(key);
    if (existing) return existing as Promise<T>;

    const promise = (async () => {
      try {
        const value = await fn();
        this.set(key, value, ttlMs);
        return value;
      } finally {
        this.inflight.delete(key);
      }
    })();
    this.inflight.set(key, promise);
    return promise;
  }

  /** For tests + debug. */
  size(): number {
    return this.store.size;
  }

  /** For tests. */
  reset(): void {
    this.store.clear();
    this.inflight.clear();
  }
}

export const loaderCache = new LoaderCache();

/** Default TTL (30 s) exported for callers that want to make it explicit. */
export const LOADER_CACHE_DEFAULT_TTL_MS = DEFAULT_TTL_MS;
