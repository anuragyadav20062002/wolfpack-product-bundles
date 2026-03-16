/**
 * Unit Tests for app/lib/cached-session-storage.server.ts
 *
 * TDD — tests written before implementation.
 * Covers: loadSession (hit/miss/expired), storeSession, deleteSession,
 *         deleteSessions, findSessionsByShop, isReady
 */

import { CachedSessionStorage } from '../../../app/lib/cached-session-storage.server';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSession(id = 'offline_test.myshopify.com') {
  return { id, shop: 'test.myshopify.com', accessToken: 'shpat_test', isOnline: false } as any;
}

function makeInner() {
  return {
    loadSession: jest.fn(),
    storeSession: jest.fn().mockResolvedValue(true),
    deleteSession: jest.fn().mockResolvedValue(true),
    deleteSessions: jest.fn().mockResolvedValue(true),
    findSessionsByShop: jest.fn().mockResolvedValue([]),
    isReady: jest.fn().mockResolvedValue(true),
  };
}

// ─── loadSession — cache miss ─────────────────────────────────────────────────

describe('CachedSessionStorage.loadSession', () => {
  it('returns undefined and does not cache when DB returns undefined', async () => {
    const inner = makeInner();
    inner.loadSession.mockResolvedValue(undefined);
    const cache = new CachedSessionStorage(inner as any, 60_000);

    const result = await cache.loadSession('missing-id');

    expect(result).toBeUndefined();
    expect(inner.loadSession).toHaveBeenCalledTimes(1);

    // Second call should also hit DB (nothing to cache)
    await cache.loadSession('missing-id');
    expect(inner.loadSession).toHaveBeenCalledTimes(2);
  });

  it('fetches from DB on first call (cache miss) and caches the result', async () => {
    const session = makeSession();
    const inner = makeInner();
    inner.loadSession.mockResolvedValue(session);
    const cache = new CachedSessionStorage(inner as any, 60_000);

    const result = await cache.loadSession(session.id);

    expect(result).toEqual(session);
    expect(inner.loadSession).toHaveBeenCalledTimes(1);
  });

  it('returns cached value on second call without hitting DB', async () => {
    const session = makeSession();
    const inner = makeInner();
    inner.loadSession.mockResolvedValue(session);
    const cache = new CachedSessionStorage(inner as any, 60_000);

    await cache.loadSession(session.id);
    const result = await cache.loadSession(session.id);

    expect(result).toEqual(session);
    // DB only called once — second returned from cache
    expect(inner.loadSession).toHaveBeenCalledTimes(1);
  });

  it('re-fetches from DB when TTL has expired', async () => {
    const session = makeSession();
    const inner = makeInner();
    inner.loadSession.mockResolvedValue(session);
    // Very short TTL (1ms)
    const cache = new CachedSessionStorage(inner as any, 1);

    await cache.loadSession(session.id);
    // Wait for TTL to expire
    await new Promise((r) => setTimeout(r, 10));

    await cache.loadSession(session.id);
    expect(inner.loadSession).toHaveBeenCalledTimes(2);
  });
});

// ─── storeSession ─────────────────────────────────────────────────────────────

describe('CachedSessionStorage.storeSession', () => {
  it('delegates to inner and returns its result', async () => {
    const session = makeSession();
    const inner = makeInner();
    const cache = new CachedSessionStorage(inner as any, 60_000);

    const result = await cache.storeSession(session);

    expect(result).toBe(true);
    expect(inner.storeSession).toHaveBeenCalledWith(session);
  });

  it('updates cache so subsequent loadSession skips DB', async () => {
    const session = makeSession();
    const inner = makeInner();
    inner.loadSession.mockResolvedValue(session);
    const cache = new CachedSessionStorage(inner as any, 60_000);

    await cache.storeSession(session);
    const result = await cache.loadSession(session.id);

    expect(result).toEqual(session);
    // loadSession should not have hit DB — cache populated by storeSession
    expect(inner.loadSession).not.toHaveBeenCalled();
  });

  it('overwrites a stale cache entry on re-store', async () => {
    const session = makeSession();
    const inner = makeInner();
    const cache = new CachedSessionStorage(inner as any, 60_000);

    await cache.storeSession(session);
    const updated = { ...session, accessToken: 'shpat_new' };
    await cache.storeSession(updated as any);

    const result = await cache.loadSession(session.id);
    expect((result as any).accessToken).toBe('shpat_new');
    expect(inner.loadSession).not.toHaveBeenCalled();
  });
});

// ─── deleteSession ────────────────────────────────────────────────────────────

describe('CachedSessionStorage.deleteSession', () => {
  it('evicts cache entry and delegates to inner', async () => {
    const session = makeSession();
    const inner = makeInner();
    inner.loadSession.mockResolvedValue(session);
    const cache = new CachedSessionStorage(inner as any, 60_000);

    // Populate cache
    await cache.loadSession(session.id);
    expect(inner.loadSession).toHaveBeenCalledTimes(1);

    // Delete evicts cache
    await cache.deleteSession(session.id);
    expect(inner.deleteSession).toHaveBeenCalledWith(session.id);

    // Next loadSession must hit DB again
    await cache.loadSession(session.id);
    expect(inner.loadSession).toHaveBeenCalledTimes(2);
  });
});

// ─── deleteSessions ───────────────────────────────────────────────────────────

describe('CachedSessionStorage.deleteSessions', () => {
  it('evicts all specified ids and delegates to inner', async () => {
    const s1 = makeSession('id-1');
    const s2 = makeSession('id-2');
    const inner = makeInner();
    inner.loadSession
      .mockResolvedValueOnce(s1)
      .mockResolvedValueOnce(s2)
      .mockResolvedValue(undefined);
    const cache = new CachedSessionStorage(inner as any, 60_000);

    // Populate cache
    await cache.loadSession('id-1');
    await cache.loadSession('id-2');
    expect(inner.loadSession).toHaveBeenCalledTimes(2);

    await cache.deleteSessions(['id-1', 'id-2']);
    expect(inner.deleteSessions).toHaveBeenCalledWith(['id-1', 'id-2']);

    // Both must re-hit DB
    await cache.loadSession('id-1');
    await cache.loadSession('id-2');
    expect(inner.loadSession).toHaveBeenCalledTimes(4);
  });
});

// ─── findSessionsByShop ───────────────────────────────────────────────────────

describe('CachedSessionStorage.findSessionsByShop', () => {
  it('always delegates to inner (not cached)', async () => {
    const session = makeSession();
    const inner = makeInner();
    inner.findSessionsByShop.mockResolvedValue([session]);
    const cache = new CachedSessionStorage(inner as any, 60_000);

    const result1 = await cache.findSessionsByShop('test.myshopify.com');
    const result2 = await cache.findSessionsByShop('test.myshopify.com');

    expect(result1).toEqual([session]);
    expect(result2).toEqual([session]);
    expect(inner.findSessionsByShop).toHaveBeenCalledTimes(2);
  });
});

// ─── isReady ──────────────────────────────────────────────────────────────────

describe('CachedSessionStorage.isReady', () => {
  it('delegates to inner storage', async () => {
    const inner = makeInner();
    inner.isReady.mockResolvedValue(true);
    const cache = new CachedSessionStorage(inner as any, 60_000);

    const result = await cache.isReady();

    expect(result).toBe(true);
    expect(inner.isReady).toHaveBeenCalledTimes(1);
  });
});
