# Issue: Free Gift Critical Bug Fixes

**Issue ID:** free-gift-bugs-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-31
**Last Updated:** 2026-03-31 04:30

## Overview

Comprehensive audit identified 7 bugs across the free gift implementation.
This issue covers the 3 CRITICAL bugs that must be fixed first:

- **Bug #5**: `bundle_ui_config` variant metafield (PPB Stage-1 cache) is built without
  `isFreeGift`, `freeGiftName`, `isDefault`, `defaultVariantId` — the entire free gift
  system is silently broken for PPB on cached page loads.
- **Bug #6**: Cart transform applies 0% discount when no `price_adjustment` is configured,
  meaning free gift items are charged at full retail price.
- **Bug #1**: FPB `addBundleToCart()` validates ALL steps including the free gift step,
  which blocks cart add when the customer hasn't selected a free gift product.

## Phases Checklist

- [x] Phase 1: Fix Bug #5 — add missing fields to `bundle_ui_config` metafield step mapping ✅
- [x] Phase 2: Fix Bug #6 — cart transform: make free gift free when no pricing rule set ✅
- [x] Phase 3: Fix Bug #1 — FPB `addBundleToCart()` skip `isFreeGift`/`isDefault` steps ✅
- [x] Phase 4: Build widgets + rebuild cart transform + lint + commit ✅

## Progress Log

### 2026-03-31 04:00 - All Phases Completed

**Bug #5 — PPB `bundle_ui_config` missing free gift fields**
- ✅ Added `isFreeGift`, `freeGiftName`, `isDefault`, `defaultVariantId` to step mapping
- File: `app/services/bundles/metafield-sync/operations/bundle-product.server.ts` (lines ~231-248)
- Impact: PPB widget can now correctly detect free gift steps from cached metafield (Stage-1 load)

**Bug #6 — Cart transform: free gift charged at full price when no pricing rule**
- ✅ Added fallback `effectivePct` computation when `price_adjustment` is null but `freeGiftTotal > 0`
- Formula: `effectivePct = (1 − paidTotal/originalTotal) × 100` — identical to the pricing-configured path
- File: `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts` (lines ~457-477)
- Impact: Free gift items are always $0 in cart regardless of whether merchant has set a pricing rule

**Bug #1 — FPB `addBundleToCart()` validates free gift step**
- ✅ Replaced `this.selectedBundle.steps.every((_, index) => this.validateStep(index))` with `this.areBundleConditionsMet()`
- `areBundleConditionsMet()` already skips `isFreeGift` and `isDefault` steps
- File: `app/assets/bundle-widget-full-page.js` (line ~2724)

**Bug #2 — FPB `_getFreeGiftRemainingCount()` quantity always 1**
- ✅ Fixed quantity read: `typeof p === 'number' ? p : (p.quantity || 1)`
- `selectedProducts` values are plain numbers, not objects — `p.quantity` was always `undefined`
- File: `app/assets/bundle-widget-full-page.js` (line ~2645)

- ✅ ESLint: 0 errors
- ✅ Widget version bumped: 2.4.3 → 2.4.4
- ✅ `npm run build:widgets` — full-page 253.8 KB, product-page 152.0 KB
- ✅ CSS sizes: 96,061 B (under 100,000 B limit)
- ✅ Cart transform WASM: Function built successfully

**Status:** Ready for deploy + Sync Bundle on affected bundles
