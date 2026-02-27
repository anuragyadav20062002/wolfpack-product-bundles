# Issue: Fix All Step Conditions in Full-Page Bundles

**Issue ID:** step-conditions-full-fix-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-02-25
**Last Updated:** 2026-02-25 10:30

## Overview

Step conditions are not working in full-page bundles. Specifically:
1. Step timeline tabs do not update when products are selected — tabs remain locked even after the user meets a step's conditions, meaning users can't click to navigate
2. `maxQuantity` is not enforced when no explicit condition is configured — users can add unlimited items
3. Multiple conditions (AND logic) untestable until fix #1 is resolved

Discount conditions are working correctly. Only step navigation conditions are broken.

## Root Cause Analysis

### Bug 1: Step tabs never re-rendered on selection (PRIMARY)

`updateProductSelection()` re-renders the footer/sidebar after each selection but does NOT update the step timeline tabs (`.step-tabs-container`). The tab click listeners are added only at render time (`createStepTimeline()`) — locked tabs have no listener. Once the user satisfies step 1's condition, step 2's tab should unlock, but it never does because the timeline is not re-rendered.

**Fix:** Add `updateStepTimeline()` helper that replaces the existing `.step-tabs-container` with a fresh render, and call it from `updateProductSelection()` for full-page bundles.

### Bug 2: `maxQuantity` not enforced without explicit condition

In `ConditionValidator.canUpdateQuantity()`, when no explicit `conditionType/conditionOperator/conditionValue` is set, it always returns `{ allowed: true }` — ignoring `maxQuantity`. Similarly, `isStepConditionSatisfied()` only checks `total >= minQuantity` in the fallback path, ignoring `maxQuantity`.

**Fix:** Add `maxQuantity` upper-bound enforcement to both `canUpdateQuantity()` (blocks over-adding) and `isStepConditionSatisfied()` (marks step as not satisfied if over max).

## Files to Modify

- `app/assets/widgets/shared/condition-validator.js` — Add maxQuantity enforcement
- `app/assets/bundle-widget-full-page.js` — Add updateStepTimeline(), call it from updateProductSelection()
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` — Rebuilt output

## Progress Log

### 2026-02-25 10:00 - Investigation Complete, Starting Fixes
- ✅ Traced updateProductSelection → renderFullPageFooter/renderSidePanel — confirmed NO timeline update
- ✅ Confirmed ConditionValidator logic correct for AND conditions
- ✅ Confirmed API returns conditionOperator2/conditionValue2 correctly
- ✅ Identified maxQuantity gap in canUpdateQuantity fallback path
- Will modify: condition-validator.js, bundle-widget-full-page.js
- Next: Implement fixes and rebuild

## Progress Log

### 2026-02-25 10:30 - All Phases Completed
- ✅ `app/assets/widgets/shared/condition-validator.js`
  - `canUpdateQuantity()`: added `maxQuantity` upper-bound check in no-condition fallback (lines 70–76)
  - `isStepConditionSatisfied()`: added `maxQuantity` upper-bound check in no-condition fallback (lines 121–123)
- ✅ `app/assets/bundle-widget-full-page.js`
  - Added `updateStepTimeline()` method (lines 1733–1742) — replaces `.step-tabs-container` in-place
  - `updateProductSelection()`: added `this.updateStepTimeline()` call for full_page bundles (line 3082)
- ✅ Built widgets: `bundle-widget-full-page-bundled.js` (209.5 KB)
- Next: Commit

## Phases Checklist

- [x] Phase 1: Fix ConditionValidator — maxQuantity enforcement ✅
- [x] Phase 2: Add updateStepTimeline() to BundleWidgetFullPage ✅
- [x] Phase 3: Wire updateStepTimeline() into updateProductSelection() ✅
- [x] Phase 4: Build widgets ✅
- [ ] Phase 5: Commit
