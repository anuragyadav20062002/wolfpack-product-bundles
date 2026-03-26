# Issue: FPB Default Product Never Added to Cart

**Issue ID:** fpb-default-product-not-added-to-cart-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-24
**Last Updated:** 2026-03-24

## Overview

In the full-page bundle widget, steps marked `isDefault: true` (mandatory pre-selected
products) are silently dropped from the cart submission, missing from the footer/sidebar
panel display, and their price is excluded from the displayed bundle total.

The PDP widget is unaffected — it stores the correct numeric quantity `1`.

## Root Cause

`_initDefaultProducts()` stores a full product **object** as the value in
`selectedProducts[stepIndex][variantId]`, but every downstream consumer (`addBundleToCart`,
`getAllSelectedProductsData`, `PricingCalculator.calculateBundleTotal`) checks
`if (quantity > 0)`. In JavaScript `{...object} > 0` coerces to `NaN > 0 = false`,
so all three consumers silently skip the default product.

Secondary: `areBundleConditionsMet()` skips `isFreeGift` but not `isDefault`, so if a
default step has an explicit `equal_to: 1` condition it would block the Add to Cart button.

## Impact

| Area | Expected | Actual |
|------|----------|--------|
| Cart submission | Default product added to cart | Silently dropped |
| Footer/sidebar panel | Default product shown | Missing |
| Displayed price | Includes default item cost | Understated |
| Add to Cart gate | Default step non-blocking | Fragile (NaN quirk) |

## Fix

**Fix 1** — `_initDefaultProducts`: store `1` (number) not the full product object.
**Fix 2** — `areBundleConditionsMet`: add `|| step.isDefault` skip alongside `isFreeGift`.

## Progress Log

### 2026-03-24 - Implemented and committed

- ✅ Fix 1: `_initDefaultProducts` — store `1` (number) instead of full product object so every
  `if (quantity > 0)` consumer (`addBundleToCart`, `getAllSelectedProductsData`,
  `PricingCalculator.calculateBundleTotal`) correctly includes the default product.
- ✅ Fix 2: `areBundleConditionsMet` — added `|| step.isDefault` guard to skip default
  steps, consistent with `isStepAccessible` which already had this guard.
- ✅ Bumped WIDGET_VERSION: 2.3.3 → 2.3.4 (PATCH — bug fix)
- ✅ Built widget bundles (FP: 247.7 KB, PP: 152.1 KB)
- ✅ Linted — 0 errors
- ✅ 127/127 relevant tests passing
- Files changed:
  - `app/assets/bundle-widget-full-page.js`
  - `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
  - `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
  - `scripts/build-widget-bundles.js`
- Next: `shopify app deploy` (manual) + validate on live store with a default-step bundle

## Phases Checklist
- [x] Fix 1: `_initDefaultProducts` store `1` not object
- [x] Fix 2: `areBundleConditionsMet` skip default steps
- [x] Bump WIDGET_VERSION (2.3.3 → 2.3.4)
- [x] Build widget bundles
- [x] Lint + commit
- [ ] Validate on live store after deploy
