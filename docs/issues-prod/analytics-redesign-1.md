# Issue: Analytics Page Redesign — Bundle Revenue Section

**Issue ID:** analytics-redesign-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-26
**Last Updated:** 2026-03-26 12:00

## Overview

Redesign `/app/attribution` to add a Bundle Revenue section above the existing UTM attribution section. Introduces Hero KPI bar (4 cards), Revenue by Bundle leaderboard, and Revenue Trend chart (bundle vs total). All data from existing `OrderAttribution` table — no DB migrations.

## Phases Checklist
- [x] Phase 1: Pure helper functions + unit tests (TDD)
- [x] Phase 2: Loader extension (additive)
- [x] Phase 3: CSS additions
- [x] Phase 4: New UI sub-components

## Progress Log

### 2026-03-26 00:00 - Feature pipeline completed (BR → PO → Architect)
- BR: `docs/analytics-redesign/00-BR.md`
- PO Requirements: `docs/analytics-redesign/02-PO-requirements.md`
- Architecture: `docs/analytics-redesign/03-architecture.md`
- Decision: Option A — in-memory aggregation, zero new DB queries

### 2026-03-26 12:00 - All phases complete
- ✅ Phase 1: Created `app/lib/analytics/analytics-helpers.ts` — 4 pure functions (`computeBundleRevenueSummary`, `buildBundleLeaderboard`, `buildBundleTrendSeries`, `formatDelta`). 26/26 unit tests pass.
- ✅ Phase 2: Extended loader in `app/routes/app/app.attribution.tsx` — added `status` to bundle select, added `bundleStatusMap`, called 3 new helpers, added `bundleRevenueSummary` / `bundleLeaderboard` / `bundleRevenueTrend` to `json()` return.
- ✅ Phase 3: Added CSS to `app/styles/routes/app-attribution.module.css` — `.bundleKpiCard`, `.bundleKpiValue`, `.bundleKpiLabel`, `.bundleSplitRow`, `.leaderboardRow`, `.sectionDivider`, `.trendLegend`.
- ✅ Phase 4: Added `BundleKpiRow`, `BundleTrendChart`, `BundleLeaderboardCard` sub-components; wired into `AttributionDashboard`; fixed subtitle to "Bundle revenue & UTM attribution"; added `InlineGrid` + `Tooltip` to Polaris imports.
- Zero new lint errors. Zero new TS errors. Zero test regressions (5 pre-existing failures confirmed unchanged).

## Related Documentation
- `docs/analytics-redesign/00-BR.md`
- `docs/analytics-redesign/02-PO-requirements.md`
- `docs/analytics-redesign/03-architecture.md`
- `docs/analytics-redesign/04-SDE-implementation.md`
