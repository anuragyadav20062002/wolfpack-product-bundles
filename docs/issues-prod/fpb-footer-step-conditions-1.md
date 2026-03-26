# Issue: FPB Floating Footer Always Visible + Unlimited Products When No Conditions

**Issue ID:** fpb-footer-step-conditions-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-27
**Last Updated:** 2026-03-27 10:30

## Overview

Two bugs in the FPB storefront widget:

1. **Footer visibility**: The floating footer is hidden until a product is selected. It should
   always be visible from page load so users know navigation/cart is available.

2. **Step conditions cap**: When a merchant configures no conditions on a step, users can only
   effectively add 1 product per step because the auto-advance fires immediately after the first
   selection (minQuantity defaults to 1, satisfying the step). Users should be able to add as
   many products as they want when no conditions are set.

## Root Cause Analysis

**Bug 1** — `renderFullPageFooter()` in `bundle-widget-full-page.js` has an early-return guard:
```javascript
if (allSelectedProducts.length === 0) {
  this.elements.footer.style.display = 'none';
  return;
}
```
This hides the footer before any product is selected. Remove this block — the footer renders
correctly with 0 items (shows "0/N Products", disabled CTA button).

**Bug 2** — `updateProductSelection()` triggers auto-advance when `isStepCompleted()` returns
true. `isStepConditionSatisfied()` in condition-validator.js uses `minQuantity || 1` when no
conditions are configured. So 1 product satisfies the step → auto-advance fires → user is moved
to the next step before they can add more products to the current one.

Fix: add `hasExplicitCondition` guard to the auto-advance block — only auto-advance when the
step has a `conditionType + conditionOperator + conditionValue` explicitly set by the merchant.

## Phases Checklist

- [x] Phase 1: Fix footer always visible (Bug 1)
- [x] Phase 2: Fix unlimited products with no conditions (Bug 2)
- [x] Phase 3: Rebuild widget bundles

## Progress Log

### 2026-03-27 10:00 - Starting implementation
- Files to change: `app/assets/bundle-widget-full-page.js`
- Will rebuild: `npm run build:widgets` after both fixes

### 2026-03-27 10:30 - Completed all phases
- ✅ Bug 1: Removed the `allSelectedProducts.length === 0` early-return guard from
  `renderFullPageFooter()`. Footer now renders from page load showing "0/N Products"
  with a disabled CTA; all downstream helpers (`_createFooterPanel`, `_createFooterBar`)
  already handle an empty product list correctly.
- ✅ Bug 2: Added `_hasExplicitCondition` guard to the auto-advance block in
  `updateProductSelection()`. Auto-advance now only fires when the step has an
  explicit `conditionType + conditionOperator + conditionValue` set by the merchant.
  Steps with no conditions configured no longer auto-advance after 1 product, so
  shoppers can add as many products as they want before manually navigating.
- Files changed: `app/assets/bundle-widget-full-page.js`,
  `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`,
  `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`

