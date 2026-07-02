# Test Spec: CachedSessionStorage — Refresh Resilience

**Spec ID:** cached-session-storage-refresh-resilience
**Issue:** [offline-token-refresh-resilience-1]
**Created:** 2026-06-10

## Purpose

Cover the failure paths of `refreshOfflineRowIfNeeded` so a Shopify-side refresh-token rejection no longer cascades to a Remix 500. Three behaviours need to hold:

1. A 401 (`Offline token request failed: 401 …`) means the refresh token is unusable. The bad row must be deleted from the DB, evicted from cache, and the caller must observe "no session" so the SDK falls back to fresh token exchange.
2. An `invalid_grant` failure has the same meaning — drop the row.
3. Any other failure (network error, 5xx, unknown 4xx) is treated as transient. The stale row must be returned unchanged so the SDK can proceed; the access token may still be valid.
4. A stale Prisma connection during the initial session row read must be retried once so an otherwise healthy app load does not turn into a Remix 500.

## Test Cases

### CachedSessionStorage.loadSession — refresh failures

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | 401 refresh-token failure | row with expiring offline session + refreshOfflineSession throws `Offline token request failed: 401 This request requires an active refresh_token` | `loadSession` returns `undefined`; `prisma.session.delete` called with the row's id; cache no longer holds the row | Mirrors the Render-log error seen in production |
| 2 | `invalid_grant` failure | refreshOfflineSession throws `Offline token request failed: 400 invalid_grant` | `loadSession` returns `undefined`; row deleted | OAuth standard "refresh token invalidated" code |
| 3 | Transient network failure | refreshOfflineSession throws `Error: fetch failed` (no HTTP status, no `invalid_grant`) | `loadSession` returns a `Session` built from the stale row; `prisma.session.delete` NOT called | Preserves uptime when Shopify is briefly unreachable |
| 4 | Successful refresh | refreshOfflineSession resolves with a refreshed row | `loadSession` returns the refreshed session (existing behavior — must not regress) | Already covered by the existing test in this file |
| 5 | Stale Prisma connection on initial session read | `prisma.session.findUnique` first throws `Server has closed the connection`, then resolves the row | `loadSession` retries once and returns the session; no row deletion | Matches Chrome Admin failure captured during FPB parity verification |

### CachedSessionStorage.findSessionsByShop — refresh failures

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 6 | 401 refresh-token failure for one row in a multi-row shop | Two rows returned; one needs refresh and that refresh fails with 401 | Result contains only the healthy row; bad row deleted | Ensures the bad row doesn't poison the whole shop's session list |

## Acceptance Criteria

- [ ] All six test cases pass
- [ ] No regression in the existing 8 tests of `cached-session-storage.test.ts`
- [ ] No new ESLint errors introduced in `cached-session-storage.server.ts`
