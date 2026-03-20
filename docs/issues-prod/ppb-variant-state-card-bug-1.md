# Issue: PDP Widget — State Cards Missing for Non-Default Variant Selections

**Issue ID:** ppb-variant-state-card-bug-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-21
**Last Updated:** 2026-03-21 18:30

## Overview

After selecting products in the bottom-sheet modal for a multi-step bundle, only 1 of 3 state
cards renders on the product page. The other 2 steps become invisible (no filled card, no empty
card), even though pricing ($15) and the Add to Cart button correctly reflect all 3 selections.

## Root Cause

`renderProductPageLayout` and `buildCartItems` look up selected products using:
```js
products.find(p => (p.variantId || p.id) === variantId)
```
where `products = this.stepProductData[stepIndex]` — the RAW (un-expanded) product list.

`stepProductData` stores one entry per product with `variantId = defaultVariant.id` (first variant).

The modal uses `expandProductsByVariant(rawProducts)` which creates one card per variant.
When a user selects a non-default variant, `selectedProducts[i][nonDefaultVariantId] = 1`.
The raw-list `find` doesn't match that variantId → no state card rendered, product skipped in cart.

`PricingCalculator.calculateBundleTotal` already has a nested-variants fallback (that's why $15
shows correctly), but `renderProductPageLayout` and `buildCartItems` are missing it.

This also causes the stale-state bug: steps 1 & 2 have no state cards (no × button),
so those selections can't be cleared, and re-opening the modal shows them as pre-selected.

## Fix

Use `expandProductsByVariant` before the find in both places, matching how the modal renders:
- `renderProductPageLayout` line ~731
- `buildCartItems` line ~2362 (also use `variantId` directly as `actualVariantId`)

## Progress Log

### 2026-03-21 18:00 - Implementing fix

- `renderProductPageLayout` (line 731): changed `this.stepProductData[stepIndex] || []` to
  `this.expandProductsByVariant(this.stepProductData[stepIndex] || [])` — now matches modal expansion
- `buildCartItems` (line 2358): same expansion applied; also replaced
  `product.variantId ?? product.variants?.[0]?.id` with `variantId` (the key from selectedProducts)
  so the exact user-selected variant is always added to cart, never the default
- Built widget bundle: 150.7 KB

### 2026-03-21 18:30 - Committed

Files changed:
- `app/assets/bundle-widget-product-page.js`
- `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`

## Phases Checklist
- [x] Fix renderProductPageLayout
- [x] Fix buildCartItems
- [x] Build widget bundle
- [ ] Deploy + verify on storefront (manual step)
