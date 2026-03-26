# Issue: Analytics Custom Date Range

**Issue ID:** analytics-custom-date-range-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-26
**Last Updated:** 2026-03-26 15:30

## Overview

Replace the fixed 7/30/90-day Select on the analytics page with a Polaris DatePicker in a Popover, allowing merchants to select any custom date range. Loader gains `?from`/`?to` URL param support.

## Phases Checklist
- [x] Phase 1: Update `buildBundleTrendSeries` with `until` param (TDD)
- [x] Phase 2: Update loader to handle `?from`/`?to` params
- [x] Phase 3: Replace date range UI with `DateRangeSelector` component
- [x] Phase 4: CSS additions

## Related Documentation
- `docs/analytics-custom-date-range/00-BR.md`
- `docs/analytics-custom-date-range/02-PO-requirements.md`
- `docs/analytics-custom-date-range/03-architecture.md`
- `docs/analytics-custom-date-range/04-SDE-implementation.md`

## Progress Log

### 2026-03-26 15:30 - All phases complete
- ✅ Phase 1: `buildBundleTrendSeries` gains `until?: Date`; bucket fill loop uses `windowEnd = until ?? since+days`; 4 new tests added (30 total, all pass)
- ✅ Phase 2: Loader reads `?from`/`?to` first; derives `since`, `until`, `days` from them; falls back to `?days=N`; Prisma current query gains `lte: until`; loader returns `from`/`to` strings
- ✅ Phase 3: `DateRangeSelector` sub-component added; preset chips (7/30/90) navigate immediately; `DatePicker allowRange multiMonth` calendar; Apply button navigates with `?from&to`; trigger label shows "Last N days" or "Mar 1 – Mar 25, 2026"
- ✅ Phase 4: CSS classes added — `.dateRangePopover`, `.presetChips`, `.presetChip`, `.presetChipActive`, `.calendarApplyRow`

### 2026-03-26 14:30 - Starting Phase 1 (TDD on buildBundleTrendSeries)
- Adding `until?: Date` param to `buildBundleTrendSeries`
- Writing failing tests first, then implementing
