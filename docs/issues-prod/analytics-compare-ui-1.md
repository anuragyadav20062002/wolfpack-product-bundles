# Issue: Analytics — Period Comparison UI

**Issue ID:** analytics-compare-ui-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-04-26
**Last Updated:** 2026-04-26 10:00

## Overview

The analytics loader already calculates previous-period data (prevTotalRevenue,
prevTotalOrders, prevAov, prevTotalViews) in parallel with the current period.
The data is returned in the loader JSON but only partially surfaced in the UI.

This issue completes the frontend comparison layer:
1. Add `prevFrom`/`prevTo` date strings to the loader return so the UI can label the comparison period
2. Add a "Compare" toggle button next to the date range picker
3. When Compare is ON: show all delta badges + a "vs [prev period]" label
4. When Compare is OFF: hide all delta badges across Bundle Views, Bundle Revenue KPIs, and UTM stat cards
5. `BundleKpiRow` updated to accept a `compare` prop

## Progress Log

### 2026-04-26 10:00 - Starting implementation
- Files to modify: `app/routes/app/app.attribution.tsx`, `app/styles/routes/app-attribution.module.css`
- No backend changes needed — prev period data already queried

## Progress Log

### 2026-04-26 10:30 - Completed
- ✅ Loader: added `prevFromStr`/`prevToStr` to return JSON (`prevFrom`, `prevTo`)
- ✅ CSS: added `.compareToggle`, `.compareToggleActive`, `.comparePill` to `app-attribution.module.css`
- ✅ `BundleKpiRow`: accepts `compare: boolean` prop; all 4 delta badges gated
- ✅ `AttributionDashboard`: `compare` useState (default true), `comparePeriodLabel` useMemo,
     Compare toggle button in header row, "vs [prev period]" pill, gated all growth spans
     in Views + UTM sections

## Phases Checklist
- [x] Loader: add prevFrom / prevTo to return
- [x] CSS: add compareToggle, compareToggleActive, comparePill styles
- [x] BundleKpiRow: accept compare prop, gate badge rendering
- [x] AttributionDashboard: compare state, toggle button, period pill, gate UTM/Views badges
