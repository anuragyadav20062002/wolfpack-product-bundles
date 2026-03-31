# Issue: Default Product Critical Bug Fixes

**Issue ID:** default-product-bugs-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-04-01
**Last Updated:** 2026-04-01 01:30

## Overview

Audit of the default product/default step implementation identified 3 bugs:

- **Bug #1 (CRITICAL)**: PPB `initializeDataStructures()` only seeds default products when
  `widgetStyle === 'bottom-sheet'`. Classic modal style never populates `selectedProducts`
  for the default step → default product silently excluded from cart.
- **Bug #2 (Medium)**: `removeProductFromSelection()` has no guard against removing default
  products — a future code path or edge case can silently wipe the pre-seeded default from
  `selectedProducts`.
- **Bug #3 (Low)**: Cart transform has no `isDefaultLine()` utility function (behavior is
  correct, code clarity only).

## Phases Checklist

- [x] Phase 1: Fix Bug #1 — remove widgetStyle guard from default product seeding ✅
- [x] Phase 2: Fix Bug #2 — guard removeProductFromSelection() against default products ✅
- [x] Phase 3: Fix Bug #3 — add isDefaultLine() to cart transform for code clarity ✅
- [x] Phase 4: Build + lint + commit ✅

## Progress Log

### 2026-04-01 01:00 - All Phases Completed

**Bug #1 — PPB classic modal: default product excluded from cart**
- ✅ Removed `if (this.widgetStyle === 'bottom-sheet')` guard from default product seeding
- Default variant ID now always seeded into `selectedProducts[i]` regardless of widget style
- File: `app/assets/bundle-widget-product-page.js` (line ~354)

**Bug #2 — removeProductFromSelection() can wipe default products**
- ✅ Added guard at start of method: returns immediately when `step.isDefault && step.defaultVariantId === variantId`
- File: `app/assets/bundle-widget-product-page.js` (line ~1124)

**Bug #3 — Cart transform: no isDefaultLine() utility**
- ✅ Added `isDefaultLine()` function alongside `isFreeGiftLine()` for code clarity
- Default lines are correctly treated as paid items (behavior unchanged)
- File: `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts`

- ✅ ESLint: 0 errors
- ✅ Widget version bumped: 2.4.5 → 2.4.6
- ✅ `npm run build:widgets` — full-page 253.8 KB, product-page 153.7 KB
- ✅ CSS sizes: 96,061 B (under 100,000 B limit)
- ✅ Cart transform WASM: Function built successfully

**Status:** Completed. Deploy + Sync Bundle on affected bundles.
