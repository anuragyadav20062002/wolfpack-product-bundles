# Issue: Offline Token Refresh Failures Crash `/app` SSR with 500

**Issue ID:** offline-token-refresh-resilience-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-10
**Last Updated:** 2026-06-10 23:55

## Overview

`authenticate.admin(request)` in `app/routes/app/app.tsx` throws an unhandled exception when a merchant's stored offline refresh token has been invalidated by Shopify. The Shopify SDK calls `CachedSessionStorage.loadSession()` / `findSessionsByShop()`, which in turn calls `refreshOfflineRowIfNeeded()` → `refreshOfflineSession()` → `requestOfflineToken()`. The OAuth endpoint returns `401 This request requires an active refresh_token`, `requestOfflineToken` throws, and the error propagates all the way up because **no caller swallows it**. Result: Remix shows `500 Unexpected Server Error` on every admin load for that shop until the row is deleted by hand.

Verified live on SIT (`wolfpack-product-bundle-app-sit.onrender.com`) for `test-bundle-store123.myshopify.com`. Render log:

```
[shopify-app/INFO] Authenticating admin request | {shop: test-bundle-store123.myshopify.com}
[APP:INFO][component=offline-token.server] [OFFLINE_TOKEN] Refreshing expiring offline session
Error: Offline token request failed: 401 This request requires an active refresh_token
    at requestOfflineToken (file:///app/build/server/index.js?t=1781110674000:165:11)
```

## Root Cause

`app/lib/cached-session-storage.server.ts:147-157` — `refreshOfflineRowIfNeeded` calls `refreshOfflineSession` with no try/catch:

```ts
private async refreshOfflineRowIfNeeded(row: SessionRow): Promise<SessionRow> {
  if (row.isOnline || !shouldRefreshOfflineSession(row)) {
    return row;
  }
  return (await refreshOfflineSession(this.prisma, row, this)) as SessionRow;
}
```

When the refresh token is invalid (401), the throw propagates through `loadSession`/`findSessionsByShop` → Shopify SDK → `authenticate.admin` → loader → Remix SSR error path → sanitized "Unexpected Server Error" returned to the iframe.

## Fix Strategy

Mirror the resilient pattern already used in `app/services/offline-token.server.ts:262-282` (`getOfflineSessionForShop`):

1. Wrap `refreshOfflineSession` in `try/catch` inside `refreshOfflineRowIfNeeded`.
2. Detect "refresh token is unusable" responses (HTTP 401, or `invalid_grant` in the error message) → **delete the stale session row from the DB, evict from cache, return `null`**. The SDK then sees "no session" and performs fresh token exchange via the `id_token` grant.
3. Other failures (network, 5xx, unknown 4xx) → log warning, return the stale row unchanged. The access token may still be live for read-only requests; if not, downstream code surfaces a clean re-auth.
4. Update `loadSession` to return `undefined` when refresh signals "delete me".
5. Update `findSessionsByShop` to filter out deleted rows.

## Phases Checklist

- [x] Phase 1: Write unit tests for the four refresh-failure paths in `tests/unit/lib/cached-session-storage.test.ts` (Red) ✅
- [x] Phase 2: Implement try/catch + delete-on-invalid-grant in `cached-session-storage.server.ts` (Green) ✅
- [x] Phase 3: Verify lint + run unit tests ✅ (manual SIT re-verification: hand-off to user after deploy)

## Progress Log

### 2026-06-10 23:30 — Planning complete

- Reproduced the 500 on SIT via Chrome DevTools MCP.
- Traced stack via Render log to `requestOfflineToken` throw.
- Confirmed via single-fetch probe (`/app.data`) that the root loader added in `461b1873` is healthy — this bug is independent of the app-bridge change.
- Identified the resilient pattern in `getOfflineSessionForShop:262-282` as the reference to mirror.
- Next: Phase 1 — write failing tests.

### 2026-06-10 23:45 — Phase 1: Failing tests added (Red)

- Added 4 new cases under `CachedSessionStorage refresh resilience` in `tests/unit/lib/cached-session-storage.test.ts:185+`:
  - 401 refresh-token failure → undefined + row deleted
  - `invalid_grant` failure → undefined + row deleted
  - Transient `fetch failed` → stale row returned, no delete
  - `findSessionsByShop` mixed-shop result excludes the bad row
- Confirmed Red: 4 failed, 8 passed (baseline tests still green).

### 2026-06-10 23:50 — Phase 2: Implementation (Green)

- `app/lib/cached-session-storage.server.ts`:
  - Imported `AppLogger`.
  - Changed `refreshOfflineRowIfNeeded` return type to `Promise<SessionRow | null>`.
  - Wrapped `refreshOfflineSession` in try/catch.
  - On `isRefreshTokenUnusable(error)` (HTTP 401 or `invalid_grant`): evict cache, `prisma.session.delete`, return `null`.
  - Other failures: warn-log, return the stale row (read-only requests still proceed).
  - Updated `loadSession` to handle `null` → cache delete + return `undefined`.
  - Updated `findSessionsByShop` to filter out `null` rows.
  - Added `isRefreshTokenUnusable(error: unknown): boolean` helper at file bottom — matches `Offline token request failed:\s*401\b` or `invalid_grant` in the message.
- All 12 tests in `cached-session-storage.test.ts` now pass.

### 2026-06-10 23:55 — Phase 3: Lint + regression check

- `npx eslint --max-warnings 9999 app/lib/cached-session-storage.server.ts tests/unit/lib/cached-session-storage.test.ts` → **0 errors**, 28 warnings (all pre-existing `prefer-nullish-coalescing` / `no-unsafe-argument` patterns identical to baseline).
- Baselined `npx jest tests/unit/` against `main` via `git stash`: pre-existing failures = 29 suites / 105 tests. After my changes: same 29/105 fail + **+4 new tests pass**. Zero regressions.
- Hand-off to user: deploy STAGING to SIT, then refresh the embedded app on `test-bundle-store123.myshopify.com`. SDK should fall through to fresh token exchange via id_token on next load.

## Related Documentation

- `app/services/offline-token.server.ts` — offline token request, refresh, and migration helpers.
- `app/lib/cached-session-storage.server.ts` — Shopify session storage with in-memory TTL cache.
- `app/routes/app/app.tsx` — the route whose loader calls `authenticate.admin(request)`.

## Test Spec

See `test-spec/cached-session-storage-refresh-resilience.spec.md`.
