# Issue: Free Gift Steps Charge Wrong Price at Checkout

**Issue ID:** free-gift-checkout-pricing-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-24
**Last Updated:** 2026-03-24 (all phases complete)

## Overview

Bundle steps marked `isFreeGift = true` display as $0 in the widget UI (sidebar, "Free"
badge on product card) but the actual checkout price is wrong: the free gift item is
discounted by the same bundle-level percentage as paid items (e.g. 10%), not 100%.
The $0 display is a cosmetic lie.

See `docs/free-gift-checkout-pricing/implementation-plan.md` for full research,
technology decision, and math audit.

## Root Cause

- `PricingCalculator.calculateBundleTotal` includes the free gift item's retail price in
  `totalPrice`. Widget "Add to Cart" button total is inflated.
- Cart Transform's `calculateDiscountPercentage` computes the discount on the sum of ALL
  component lines (paid + free gift), applying a uniform `percentageDecrease`. Neither
  layer distinguishes free-gift cost from paid cost.
- FPB widget never sets `_bundle_step_type: free_gift` on cart line properties (PDP
  widget already does this correctly).

## Fix (5 phases)

1. **Cart Transform GraphQL**: add `stepType` attribute query
2. **Cart Transform TS**: split paid/free-gift totals; update `calculateDiscountPercentage`
   to compute effective pct that makes free gift $0
3. **Widget PricingCalculator**: add optional `steps` param; skip free-gift steps from total
4. **Both Widgets**: pass `steps` to `calculateBundleTotal` at all call sites
5. **FPB Widget**: add `_bundle_step_type` property to cart line in `addBundleToCart`

## Progress Log

### 2026-03-24 - Implemented all phases, tests passing

- ✅ Phase 1: Added `stepType: attribute(key: "_bundle_step_type")` to `cart-transform-input.graphql`
- ✅ Phase 2: Added `isFreeGiftLine()` helper; split paid/free-gift totals; rewrote
  `calculateDiscountPercentage` with new signature `(paidTotal, originalTotal, totalQty, paidQty, rate)`
  that forces free-gift $0 by including its cost in the denominator only
- ✅ Phase 2: Updated component detail loop — free gift lines get `linePct = 100`, bundleCents = 0
- ✅ Phase 3: Added optional `steps = null` param to `calculateBundleTotal`; skips free-gift steps
- ✅ Phase 4: Updated all 6 FPB widget call sites + 3 PDP widget call sites to pass `this.selectedBundle?.steps`
- ✅ Phase 5: FPB `addBundleToCart` now sets `_bundle_step_type: 'free_gift'` (or `'default'`) on line properties
- ✅ Bumped WIDGET_VERSION: 2.3.2 → 2.3.3 (PATCH — bug fix)
- ✅ Built widget bundles (FP: 247.6 KB, PP: 152.1 KB)
- ✅ Built cart transform WASM (success)
- ✅ Added 9 free-gift test cases to `tests/unit/extensions/cart-transform-run.test.ts`
- ✅ Added 7 free-gift test cases to `tests/unit/assets/pricing-calculator.test.ts`
- ✅ All 127 tests passing (0 failures)
- ✅ Linted all modified files (0 new errors)
- Files changed:
  - `extensions/bundle-cart-transform-ts/src/cart-transform-input.graphql`
  - `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts`
  - `app/assets/widgets/shared/pricing-calculator.js`
  - `app/assets/bundle-widget-full-page.js`
  - `app/assets/bundle-widget-product-page.js`
  - `scripts/build-widget-bundles.js`
  - `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
  - `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
  - `tests/unit/extensions/cart-transform-run.test.ts`
  - `tests/unit/assets/pricing-calculator.test.ts`
- Next: `shopify app deploy` (manual) + validate on live store

## Phases Checklist
- [x] Phase 1: Add `stepType` to GraphQL query
- [x] Phase 2: Update `calculateDiscountPercentage` in cart transform
- [x] Phase 2: Add `isFreeGiftLine` helper
- [x] Phase 2: Split paid/free-gift totals in bundle loop
- [x] Phase 2: Update component details for free gift lines
- [x] Phase 3: Add `steps` param to `calculateBundleTotal`
- [x] Phase 4: Update all call sites in FPB widget (6)
- [x] Phase 4: Update all call sites in PDP widget (3)
- [x] Phase 5: Add `_bundle_step_type` to FPB `addBundleToCart`
- [x] Bump WIDGET_VERSION (2.3.2 → 2.3.3)
- [x] Build widget bundles
- [x] Build cart transform WASM
- [x] Add cart transform tests
- [x] Add pricing calculator tests
- [ ] Validate on live store after deploy
