# Issue: Sidebar layout footer override + step conditions not enforced

**Issue ID:** sidebar-layout-conditions-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-24
**Last Updated:** 2026-02-24 21:00

## Overview
Two bugs in full-page bundles:
1. Footer-at-side layout: bottom footer still appears because `renderUI()` → `renderFooter()` → `renderFullPageFooter()` unconditionally sets `display: block`, overriding the sidebar's hide.
2. Step conditions not enforced: `isStepConditionSatisfied()` returns `true` when no explicit `conditionType` is configured, even when `minQuantity` is set. Steps are always passable with 0 products.

## Root Cause
1. **Sidebar footer override:** `renderFullPageFooter()` has no layout guard — always sets `display: block`. `renderFooter()` also had no sidebar branch.
2. **Conditions:** `ConditionValidator.isStepConditionSatisfied()` early-returns `true` when `conditionType`/`conditionOperator`/`conditionValue` are null. There is no fallback to the step's `minQuantity` field.

## Fix
1. `renderFooter()`: Added sidebar layout check — returns early with `display: none` for `footer_side`.
2. `renderFullPageFooter()`: Added safety guard at top — returns early for `footer_side` layout.
3. `condition-validator.js`: When no explicit condition is configured, falls back to `step.minQuantity` (default 1). `total >= minQuantity` must be satisfied before navigation.

## Files Changed
- `app/assets/bundle-widget-full-page.js` — `renderFooter()` sidebar branch, `renderFullPageFooter()` safety guard
- `app/assets/widgets/shared/condition-validator.js` — `isStepConditionSatisfied()` minQuantity fallback
- Both bundled widget files rebuilt

## Phases Checklist
- [x] Root cause analysis
- [x] Fix renderFooter() for sidebar layout
- [x] Fix renderFullPageFooter() safety guard
- [x] Fix isStepConditionSatisfied() minQuantity fallback
- [x] Build widgets
- [x] Lint
- [x] Commit
