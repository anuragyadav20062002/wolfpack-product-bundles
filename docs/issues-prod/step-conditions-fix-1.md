# Issue: Step Conditions Not Enforced for New Product Additions

**Issue ID:** step-conditions-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-22
**Last Updated:** 2026-02-22

## Overview

Step conditions (e.g. "quantity equal to 2") are silently bypassed when a customer adds a
product to a step that already satisfies its condition via a DIFFERENT product.

Zero-tolerance requirement — must work perfectly for all operator types and both bundle types.

## Root Cause

In `validateStepCondition()` in both widgets, `totalQuantityWouldBe` is calculated by
iterating over `this.selectedProducts[stepIndex]`. **If the target `productId` is NOT already
in `selectedProducts` (first-time addition), the loop never encounters it, so `newQuantity`
is never included in the total.** The condition check then operates on a stale total.

**Example (EQUAL_TO 2):**
- Step has: `{ 'productA': 2 }` (total = 2, condition met)
- User adds `productB` for the first time with qty=1
- Loop: sees only productA → `totalQuantityWouldBe = 2` (should be 3!)
- `2 <= 2 = true` → **allowed** (BUG — should be blocked)

## Fix

Extract condition validation to `app/assets/widgets/shared/condition-validator.js`.
Fix `calculateStepTotalAfterUpdate()` to always include `newQuantity`:

```javascript
// Correct implementation
let total = newQuantity;  // start with the target product's new quantity
for (const [pid, qty] of Object.entries(currentSelections)) {
  if (pid !== targetProductId) total += qty;  // add all OTHERS
}
```

## Progress Log

### 2026-02-22 - Implementation Complete

- ✅ Phase 1: Created `app/assets/widgets/shared/condition-validator.js`
  - Fixed `calculateStepTotalAfterUpdate`: always starts with `newQuantity`, adds all others
  - `canUpdateQuantity`: pure function, all operators, limitText for toast
  - `isStepConditionSatisfied`: pure function, all operators, `== null` guard (catches undefined)
  - Dual export: local variable for bundle IIFE + `module.exports` for Node.js tests
- ✅ Phase 2: Added `condition-validator.js` first in `SHARED_MODULES` in build script
- ✅ Phase 3: Both widgets now delegate to `ConditionValidator.canUpdateQuantity()` / `.isStepConditionSatisfied()`
  - Removed ~55 lines of duplicated inline logic
  - Both widgets are now consistent and bug-free
- ✅ Phase 4: 58 unit tests pass — all operators, edge cases, null/undefined guards, regression tests
- ✅ Phase 5: Widgets rebuilt (191.1 KB full-page, 114.1 KB product-page), 0 ESLint errors

Files modified:
- `app/assets/widgets/shared/condition-validator.js` (new)
- `scripts/build-widget-bundles.js`
- `app/assets/bundle-widget-product-page.js`
- `app/assets/bundle-widget-full-page.js`
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
- `tests/unit/assets/condition-validator.test.ts` (new)

## Phases Checklist

- [x] Phase 1: Create shared `condition-validator.js` with fixed logic
- [x] Phase 2: Add to build script SHARED_MODULES
- [x] Phase 3: Update both widget files to use ConditionValidator
- [x] Phase 4: Write comprehensive unit tests (all operators, edge cases)
- [x] Phase 5: Build widgets, lint, commit
