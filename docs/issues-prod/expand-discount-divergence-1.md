# Issue: EXPAND Path Charged vs Displayed Discount Can Diverge

**Issue ID:** expand-discount-divergence-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-02-16
**Last Updated:** 2026-02-16 15:00

## Overview

In the EXPAND path, two different discount calculations coexist:

1. **Charged discount** (`discountPercentage`, line 580-603): Calculated from `price_adjustment` metafield. Used in `percentageDecrease` (line 677-683) — this is what Shopify actually charges.

2. **Displayed discount** (`overallDiscountPercent`, line 640-642): Calculated from `component_pricing` metafield totals. Written to `_bundle_discount_percent` attribute — this is what the checkout UI shows.

Both metafields are set simultaneously in `bundle-product.server.ts`, so they should normally agree. However:
- If one metafield update fails, they drift
- For `fixed_amount_off` and `fixed_bundle_price` methods, the percentage is derived from absolute values and rounding differences can cause divergence
- The `overallDiscountPercent` falls back to `discountPercentage` when `totalRetailCents === 0`, acknowledging they could differ

## Fix Strategy

Use `discountPercentage` (from `price_adjustment`) as the single source of truth for the displayed `_bundle_discount_percent` attribute. Recalculate totals from `price_adjustment` when `component_pricing` is empty.

## Phases Checklist

- [x] Phase 1: Use price_adjustment-derived discount for display attribute
- [x] Phase 2: Review and commit

## Progress Log

### 2026-02-16 15:00 - Issue Created
- Identified two independent discount calculation paths in EXPAND
- Both metafields set in same operation, but can theoretically drift
- Rounding differences in fixed_amount and fixed_bundle_price methods
- Next: Unify discount source

### 2026-02-16 15:15 - Phase 1 (Initial Approach)
- Replaced `overallDiscountPercent` with `discountPercentage` from price_adjustment
- Added fabricated totals fallback when component_pricing empty
- Commit: dfc5073

### 2026-02-16 15:20 - Phase 1 (Revised: No Fabricated Data)
- Kept `discountPercentage` as single source of truth for `_bundle_discount_percent`
- Removed fabricated totals fallback — if pricing is missing, totals stay at 0
- Checkout UI handles this: `hasDiscount = false` shows simple "Bundle (N items)" view
- Principle: never invent display data from incomplete sources
- Files Modified:
  - `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts` (lines 649-662)

**Status:** Completed
