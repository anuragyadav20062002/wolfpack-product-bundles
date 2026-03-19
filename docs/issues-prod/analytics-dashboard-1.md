# Issue: Analytics Dashboard — Recharts + Full Attribution Rebuild

**Issue ID:** analytics-dashboard-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-03-12
**Last Updated:** 2026-03-20

## Overview

The current `/app/attribution` route is a minimal MVP: three metric cards and static CSS
tables grouped by source / campaign / bundle. No time-series charts, no AOV, no
period-over-period comparison, no landing page analysis.

Research findings (agent `a18bd128c09fb0ec9`) confirmed:
- `OrderAttribution` has `utmSource`, `utmMedium`, `utmCampaign`, `utmContent`, `utmTerm`,
  `landingPage`, `bundleId`, `revenue` (cents), `currency`, `createdAt`
- No charting library was installed → install recharts
- Time-series, AOV, period-over-period, and landing page breakdown are all computable
  from existing data with no schema changes

## What's Being Built

1. **recharts** installed as dependency
2. **Time-series area chart** — daily revenue + order count over selected period
3. **Metric cards with period-over-period growth %** (vs. prior equivalent period)
4. **AOV metric card** (average order value)
5. **Source breakdown table** — existing but enhanced with recharts Pie/BarChart
6. **UTM Medium breakdown** — cpc vs organic vs email vs referral
7. **Landing page performance** — top landing pages by revenue (data was captured, never shown)
8. **Campaign table** — existing, kept
9. **Bundle table** — existing, kept

## Files Modified

- `app/routes/app/app.attribution.tsx` — full rewrite
- `app/styles/routes/app-attribution.module.css` — updated
- `scripts/webhook-worker.ts` — doc fix (SHOPIFY_APP_URL env var)
- `docs/issues-prod/analytics-dashboard-1.md` — this file

## Phases Checklist

- [x] Install recharts
- [x] Fix webhook worker documentation (SHOPIFY_APP_URL)
- [x] Rewrite loader with time-series + AOV + period comparison + landing pages
- [x] Build new dashboard UI with recharts charts
- [x] Update CSS module
- [x] Lint + commit
- [x] Fix X axis: compute numeric interval from timeSeries.length for optimal tick spacing (7d=every day, 30d=every 5th, 90d=every ~11th)
