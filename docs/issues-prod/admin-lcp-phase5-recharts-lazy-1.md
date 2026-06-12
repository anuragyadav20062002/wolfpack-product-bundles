# Issue: Phase 5 — Recharts behind React.lazy + Suspense
**Issue ID:** admin-lcp-phase5-recharts-lazy-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-06-07
**Last Updated:** 2026-06-07 23:05

## Overview

Phase 5 of the admin-LCP series. Recharts is already isolated into the `vendor-charts` manualChunk (vite.config.ts:101). The remaining problem: `app/routes/app/app.attribution.tsx` imports recharts at module scope, which forces the chart bundle onto the route's critical path — and a leftover dead component (`BundleTrendChart`, L720–826 from `wpb-analytics-revamp-1`) keeps those imports alive even though no JSX references it.

Audit before edit:
- Of the six analytics components rendered on `/app/attribution`, only `EngagementPulse` and `RevenueAttribution` actually use recharts (via direct imports + `shared/KpiTile`). `FunnelHero`, `BundlePerformanceMatrix`, `LiveActivityFeed`, `TopCampaigns` don't touch it — lazy-loading those would be pure overhead.
- `BundleTrendChart` defined in the route file is unreachable code from the analytics revamp commit. Deleting it lets us drop the route-level `from "recharts"` import entirely.

## Progress Log

### 2026-06-07 22:55 - Audit complete, scope locked
- Confirmed dead `BundleTrendChart` + unused inline recharts imports in `app.attribution.tsx`.
- Confirmed `EngagementPulse` + `RevenueAttribution` are the only chart-touching consumers from the route.
- Plan: delete dead code, lazy-load the two recharts components via `app/components/analytics/lazy.ts`, wrap in `<Suspense>` with a generic `ChartCardSkeleton` primitive (new under `app/components/skeletons/`). Skeleton primitive seeds the dir that Phase 6 (`admin-lcp-phase6-defer-skeletons-1`) will extend.

## Related Documentation
- Predecessor: `docs/issues-prod/admin-lcp-phase4-loaders-1.md`
- Vite manual chunks (Phase 2): `vite.config.ts` lines 92–111
- Wrapped components: `app/components/analytics/EngagementPulse.tsx`, `RevenueAttribution.tsx`

### 2026-06-07 23:05 - Implementation + chunking-bug fix
- Deleted dead `BundleTrendChart` + its 3 helpers (`formatRevenueShort`, `formatDateKey`, `chartXFormatter`) + the inline recharts imports from `app/routes/app/app.attribution.tsx`.
- Added `app/components/skeletons/ChartCardSkeleton.tsx` + `.module.css` — fixed-height shimmer fallback. Designed to be reused by Phase 6.
- Added `app/components/analytics/lazy.ts` exporting `LazyEngagementPulse` + `LazyRevenueAttribution` via `React.lazy`.
- Wrapped the two recharts-touching JSX usages in `<Suspense>` boundaries with `<ChartCardSkeleton />` fallback.
- **Bonus chunking fix in `vite.config.ts`:** moved `use-sync-external-store` from the default chunk into `vendor-react`. Without this, Vite was assigning the shim to `vendor-charts` because recharts (via `react-redux`) pulled it — and `react-i18next` (used by every admin route through `useTranslation`) then statically imported `vendor-charts` to pick up the shared shim. That undid the whole isolation goal pre-fix.

**Build verification (before + after, same env):**

| Chunk | Before Phase 5 | After Phase 5 |
| --- | --- | --- |
| `vendor-charts` (gzipped) | 102.36 kB | 100.75 kB |
| `vendor-charts` static importers | 11 chunks (app shell, app.pricing, app.billing, useTranslation, …) | **3 chunks** (`EngagementPulse`, `RevenueAttribution`, `KpiTile`) |
| `EngagementPulse` chunk (gzipped) | inlined in route chunk | **1.03 kB**, lazy |
| `RevenueAttribution` chunk (gzipped) | inlined in route chunk | **1.03 kB**, lazy |
| `KpiTile` chunk (gzipped) | inlined | **0.89 kB**, shared lazy |

Result: non-analytics admin routes shed ~100 kB gzipped per cold load.

- Lint pass: 0 errors. `tsc --noEmit` error count unchanged (354 pre-existing, none new).

## Phases Checklist
- [x] Delete `BundleTrendChart` + inline recharts imports in `app.attribution.tsx`
- [x] Create `app/components/skeletons/ChartCardSkeleton.tsx`
- [x] Create `app/components/analytics/lazy.ts`
- [x] Wire `LazyEngagementPulse` + `LazyRevenueAttribution` with Suspense in route
- [x] Vite manualChunks fix — `use-sync-external-store` → `vendor-react`
- [x] `npm run build` — verified vendor-charts no longer in non-analytics chunks
- [x] Lint pass, commit
