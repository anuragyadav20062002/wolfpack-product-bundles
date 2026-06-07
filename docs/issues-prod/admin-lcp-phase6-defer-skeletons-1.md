# Issue: Phase 6 — defer() + per-route skeletons
**Issue ID:** admin-lcp-phase6-defer-skeletons-1
**Status:** Completed (Part A — dashboard)
**Priority:** 🟡 Medium
**Created:** 2026-06-07
**Last Updated:** 2026-06-07 23:30

## Overview

Phase 6 of the admin-LCP series. Today every admin route's loader awaits every dependency before the first byte ships. The plan calls for deferring slow non-critical queries so the shell + above-the-fold content paint first, while the rest streams in behind Suspense fallbacks.

Audit before edit:
- **Dashboard loader (`app.dashboard/route.tsx`)** runs 4 secondary queries via `trackAll`:
  - `embed-check` (cached ~30s) — produces `themeEditorUrl` + `appEmbedEnabled`, consumed inside `useCallback` click handlers at module-level render. Eager required.
  - `billing` (cached ~30s) — produces `subscription`, used by the `<UpgradePromptBanner>` only.
  - `proxy-health` — fetches the shop's proxy URL with a 3s abort timeout. Slowest query.
  - `owner-name` — UNUSED downstream (`ownerFirstName` is returned but never consumed by the component). Delete entirely.
- **Attribution loader** is much more complex (7-query Promise.all + heavy aggregation across them). Restructuring it cleanly requires a larger change than this issue should bundle. Tracked as follow-up: `admin-lcp-phase6b-attribution-defer-1` (TBD).

## Progress Log

### 2026-06-07 23:15 - Scope locked
- Defer scope reduced to dashboard's `billing` + `proxy-health` queries (the two with merchant-facing variance). Embed-check stays eager because callbacks need it synchronously; pre-cached for ~30s so its actual cost is ~10-30ms.
- Dropping the unused `owner-name` query + its return field. No backwards-compat shim (per CLAUDE.md No-Backwards-Compat Rule).
- New skeleton: `DashboardBannerSkeleton` under `app/components/skeletons/` — reserves the height of ProxyHealthBanner + UpgradePromptBanner stack so the bundles list below it doesn't shift (CLS guard).
- Attribution defer deferred (no pun) to a follow-up issue; the wp-analytics-revamp loader needs structural refactoring to split per-chart Promises cleanly.

## Related Documentation
- Predecessor: `docs/issues-prod/admin-lcp-phase5-recharts-lazy-1.md`
- Single-fetch flag in `vite.config.ts:70` (v3_singleFetch) — defer() values must be JSON-serialisable.

### 2026-06-07 23:30 - Dashboard defer shipped
- Pulled `embed-check` out of `trackAll` and awaited it directly; kicked off `billing` + `proxy-health` as standalone promises so they run concurrently with the awaited embed-check.
- Wrapped `{billing, proxy-health}` results in a `banners` promise (subscription shape + proxyHealthy boolean — both JSON-primitive payloads, single-fetch safe).
- Removed dead `owner-name` query + `ownerFirstName` return field (never consumed downstream).
- Loader now returns `defer({ bundles, shop, appUrl, themeEditorUrl, appEmbedEnabled, banners })`.
- Component: imported `Await` + `Suspense`; replaced the static banner block with `<Suspense fallback={<DashboardBannerSkeleton />}><Await resolve={banners}>{(b) => …}</Await></Suspense>`.
- Build verified: vite build passes; defer payload serialises through v3_singleFetch (banner promise carries only primitives + null).
- Lint pass: 0 errors on edited files. TS noEmit: no new errors introduced.

**Server-Timing caveat:** entries for billing + proxy-health no longer appear in the `Server-Timing` header because the header flushes before they resolve. Acceptable loss — those queries are visible via app logs and the deferred-data DevTools breakdown.

## Phases Checklist
- [x] Refactor dashboard loader: defer `{ subscription, proxyHealthy }` promise, drop `ownerFirstName`
- [x] Create `app/components/skeletons/DashboardBannerSkeleton.tsx`
- [x] Wrap banner block in `<Suspense><Await>` in dashboard component
- [x] Build verification: dashboard initial response no longer waits on proxy-health
- [x] Lint + commit
- [ ] Attribution defer → tracked as `admin-lcp-phase6b-attribution-defer-1` follow-up issue (not in this commit)
