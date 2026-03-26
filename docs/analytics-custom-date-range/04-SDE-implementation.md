# SDE Implementation Plan: Analytics Custom Date Range

## Overview

Adds a Polaris `DatePicker` calendar inside a `Popover` to the analytics page, replacing the fixed `Select` dropdown. The loader gains `?from`/`?to` URL param support. `buildBundleTrendSeries` gains an optional `until` param.

## Test Plan

| Test File | Tests | Status |
|-----------|-------|--------|
| `tests/unit/lib/analytics-helpers.test.ts` | `buildBundleTrendSeries` with explicit `until`; custom range; same-day range | Pending |

## Phase 1: Update `buildBundleTrendSeries` (TDD)

**Tests (Red):**
- `buildBundleTrendSeries` with `until` 2 days after `since` and `days=2`: produces exactly 2 daily buckets, last bucket date = `since + 1 day`
- `buildBundleTrendSeries` with same-day range (`days=0`, `since === until`): produces 1 bucket for that date
- `buildBundleTrendSeries` with `until` explicitly set, weekly mode: last bucket does not exceed `until`
- All existing tests pass unchanged (no `until` argument)

**Implementation (Green):**
- Add `until?: Date` param to `buildBundleTrendSeries`; default to `new Date(since.getTime() + days * 86400000)` when absent
- Update the weekly bucket fill `while` condition to use the computed `until`
- Update the daily bucket fill `for` loop to iterate until `since + i <= until`

**Refactor:** ensure `days=0` edge case (same-day) is handled cleanly

## Phase 2: Update the loader

**Implementation (no tests — loader parsing):**
- Read `fromParam` / `toParam` from URL search params
- If both present and parseable: derive `since`, `until`, `days`, set `fromStr`/`toStr`
- Otherwise: use existing `days`-based logic; `until = new Date()`
- Update both Prisma queries to add `lte: until` on the current period query
- Pass `until` to `buildBundleTrendSeries` call
- Add `from?: string` and `to?: string` to the `json()` return

## Phase 3: Replace date range UI in component

**Implementation (no tests — Polaris UI):**
- Add `Popover`, `DatePicker`, `Button` to existing Polaris imports
- Delete `dateRangeOptions`, `selectedDays` state, and `handleDaysChange` handler
- Add `DateRangeSelector` sub-component above `AttributionDashboard`
- Wire `DateRangeSelector` into the existing `<div className={styles.datePickerWrap}>` slot

## Phase 4: CSS additions

**Implementation:**
- Add `.presetChips`, `.presetChip`, `.calendarApplyRow` classes to `app-attribution.module.css`

## Build & Verification Checklist
- [ ] All analytics-helpers tests pass (`npm test`)
- [ ] No regressions in existing analytics-helpers tests
- [ ] TypeScript compiles without new errors (`npx tsc --noEmit`)
- [ ] `?days=30` URL still works (manual)
- [ ] `?from=YYYY-MM-DD&to=YYYY-MM-DD` URL works (manual)
- [ ] Preset chips navigate correctly
- [ ] Calendar Apply navigates with correct params
- [ ] Previous period is symmetric (check loader return in network tab)

## Rollback Notes
All changes are in `app.attribution.tsx`, `analytics-helpers.ts`, and the test file. Revert is a single git revert of this commit.
