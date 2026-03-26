# SDE Implementation Plan: Analytics Page Redesign

**Issue ID:** analytics-redesign-1
**Status:** In Progress
**Created:** 2026-03-26

## Overview

Implements the Bundle Revenue section on `/app/attribution`. Four phases:
1. Pure helper functions + unit tests (TDD)
2. Loader extension (additive — no existing fields change)
3. CSS additions
4. New UI sub-components

All new code is additive. Zero DB migrations. Zero changes to existing UTM attribution UI.

---

## Test Plan

| Test File | Tests | Status |
|---|---|---|
| `tests/unit/lib/analytics-helpers.test.ts` | `computeBundleRevenueSummary` (6), `buildBundleLeaderboard` (7), `buildBundleTrendSeries` (7), `formatDelta` (6) | Pending |

---

## Phase 1: Pure helpers + unit tests

**Tests (Red → Green):**
- `tests/unit/lib/analytics-helpers.test.ts` — all cases from architecture doc Section 8

**Implementation:**
- `app/lib/analytics/analytics-helpers.ts` — 4 exported functions
- `app/lib/analytics/index.ts` — barrel re-export

## Phase 2: Loader extension

**Implementation:**
- `app/routes/app/app.attribution.tsx` — extend bundle select, add bundleStatusMap, call 3 new helpers, extend json() return

## Phase 3: CSS

**Implementation:**
- `app/styles/routes/app-attribution.module.css` — new CSS classes for KPI grid, split row, leaderboard, section divider

## Phase 4: New UI sub-components

**Implementation:**
- `app/routes/app/app.attribution.tsx` — BundleKpiRow, BundleTrendChart, BundleLeaderboardCard components + wiring

---

## Progress Log

### 2026-03-26 — Starting Phase 1
- Writing pure helper functions and unit tests (TDD)
- Files: `app/lib/analytics/analytics-helpers.ts`, `app/lib/analytics/index.ts`, `tests/unit/lib/analytics-helpers.test.ts`

## Phases Checklist
- [ ] Phase 1: Pure helpers + tests
- [ ] Phase 2: Loader extension
- [ ] Phase 3: CSS additions
- [ ] Phase 4: UI sub-components
- [ ] Build verification & commit
