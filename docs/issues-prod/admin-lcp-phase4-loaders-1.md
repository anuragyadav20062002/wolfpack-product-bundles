# Issue: Admin LCP Phase 4 — Loader Parallelisation + Caching + N+1 Consolidation

**Issue ID:** admin-lcp-phase4-loaders-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-06-07
**Last Updated:** 2026-06-07

## Overview

Phase 4 of the Admin LCP minimisation plan (`.claude/plans/plan-out-how-we-velvet-patterson.md`). Phase 1 baseline showed **TTFB 4 104 ms accounted for 93 % of LCP** on `/app/dashboard`. The audits pointed at two specific patterns:

1. Dashboard loader serialises 4+ independent async calls (`checkAppEmbedEnabled` → `BillingService.getSubscriptionInfo` → proxy-health → shop billingAddress GraphQL).
2. Attribution loader does 3 separate `db.bundle.findMany` calls for overlapping ID sets.

This phase fixes both, plus adds a reusable in-process LRU+TTL cache for cross-route lookups.

## Changes

### 1. `app/lib/loader-cache.server.ts` (new) + 7 tests

In-process LRU + TTL cache with `memo()` helper:

```ts
const subscriptionInfo = await loaderCache.memo(
  `billing:${session.shop}`,
  () => BillingService.getSubscriptionInfo(session.shop),
  30_000, // ttl ms
);
```

Features:
- Per-key TTL (default 30 s), LRU eviction at 256 entries.
- **In-flight deduplication** — concurrent misses for the same key share one promise.
- `invalidate(key)` and `invalidatePrefix(prefix)` for webhook-driven invalidation.
- Singleton instance shared across all loaders on the process.

### 2. Dashboard loader parallelisation (`app/routes/app/app.dashboard/route.tsx`)

Before — sequential awaits:
```
auth -> db.bundles -> checkAppEmbedEnabled -> BillingService -> proxy-health fetch -> shop GraphQL
```

After — bundles still first (rest depend on shop), then four independent calls run in `trackAll`:
```
auth -> db.bundles -> Promise.all { embed-check, billing, proxy-health, owner-name }
```

Three of the four are wrapped in `loaderCache.memo`:
- `embed-check:${shop}` — 30 s TTL
- `billing:${shop}` — 30 s TTL
- `owner-name:${shop}` — 60 s TTL (shop owner name changes very rarely)
- `proxy-health` — NOT cached (its job is to detect a real-time outage)

`ServerTiming` instrumentation now emits per-span timings as `Server-Timing` headers (visible in Chrome DevTools' Network tab).

Expected p75 TTFB drop on `/app/dashboard`: 400–800 ms (the four parallel calls become limited by the slowest, not the sum).

### 3. Attribution loader N+1 consolidation (`app/routes/app/app.attribution.tsx`)

Before — 3 separate `db.bundle.findMany` calls executed sequentially:

```
findMany(bundleIds from currentAttributions)
  -> later: findMany(viewOnlyBundleIds from viewEvents)
  -> later: findMany(extraBundleIds from engagement + activity)
```

After — one consolidated query with the union of every bundle id the page needs:

```ts
const allBundleIds = [...new Set([
  ...attributionBundleIds,
  ...viewBundleIds,
  ...engagementBundleIds,
  ...activityBundleIds,
])];
const allBundles = await db.bundle.findMany({ where: { id: { in: allBundleIds } }, select: { id, name, status } });
```

`bundleNameMap`, `bundleStatusMap`, and `fullBundleMap` all derive from the single result. Removes 2 sequential DB round-trips on every analytics page load.

Expected p75 TTFB drop on `/app/attribution`: 200–400 ms (2 DB round-trips saved at ~100–200 ms each).

## Files

| Path | Change |
|---|---|
| `app/lib/loader-cache.server.ts` | New — LRU+TTL cache with `get`/`set`/`memo`/`invalidate`/`invalidatePrefix` |
| `tests/unit/lib/loader-cache.test.ts` | New — 7 cases (cache hit/miss/expiry, memo dedup, invalidate, prefix invalidation) |
| `app/routes/app/app.dashboard/route.tsx` | Parallelised 4 independent calls, 3 cached via memo, ServerTiming instrumentation |
| `app/routes/app/app.attribution.tsx` | Consolidated 3 `db.bundle.findMany` into 1 |

## Phases Checklist

- [x] `loaderCache` helper + tests.
- [x] Dashboard loader parallelisation + cache wiring + ServerTiming.
- [x] Attribution N+1 consolidation.
- [ ] Deploy (`npm run deploy:sit`).
- [ ] Re-record `/app/dashboard` and `/app/attribution` metrics via `?perf=1`; append a new H2 in `docs/perf/baseline-2026-06-07.md`. Open DevTools Network tab and read the `Server-Timing` header on the dashboard loader response — confirm `embed-check`, `billing`, `proxy-health`, `owner-name` overlap in time (their durations sum is much larger than the slowest one).
- [ ] Phase 5 (next issue): Recharts behind `React.lazy` + `<Suspense>` — TBT win on `/app/attribution`.

## Verification (post-deploy)

1. Hard reload `/app/dashboard?perf=1` — overlay TTFB and LCP should drop relative to the Phase 1 baseline (4 104 / 4 416 ms). Expect the drop to scale with how slow the four parallel calls were individually.
2. Chrome DevTools → Network → click the dashboard route response → "Timing" tab → "Server-Timing" — entries `auth`, `db.bundles`, `embed-check`, `billing`, `proxy-health`, `owner-name` are listed with their individual durations. The four parallelised ones should be visually concurrent.
3. Navigate Dashboard → Settings → Dashboard within 30 s. The second Dashboard render's `embed-check` and `billing` Server-Timing durations should be < 1 ms (cache hits).
4. Hard reload `/app/attribution?perf=1` — TTFB should drop. Network panel should show ONE `bundle.findMany` SQL query (visible via Prisma logs if `?debug=1` enabled) instead of three.
