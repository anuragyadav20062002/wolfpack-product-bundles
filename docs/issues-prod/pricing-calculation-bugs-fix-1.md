# Issue: Pricing Calculation Bugs Fix

**Issue ID:** pricing-calculation-bugs-fix-1
**Status:** Completed
**Priority:** High
**Created:** 2026-02-05
**Last Updated:** 2026-02-05

---

## Overview

Fixed multiple pricing calculation bugs found during audit:
1. Discount method string mismatch in `pricing.ts` - `'fixed_amount_off'` and `'fixed_bundle_price'` not matched
2. No percentage clamping in cart transform `calculateDiscountPercentage` - can return >100% or negative
3. Division by zero in `pricing.ts` when all component prices are $0

## Root Cause Analysis

### Problem 1: Method string mismatch
Database enum uses `'fixed_amount_off'` and `'fixed_bundle_price'`, but `calculateComponentPricing()` in `pricing.ts` checks for `'fixed_amount'` and `'fixed'`. Neither matches, so fixed-amount and fixed-bundle-price discounts silently produce 0% discount in the component_pricing metafield.

### Problem 2: Missing percentage clamping
`calculateDiscountPercentage()` in `cart_transform_run.ts` can return >100% (if fixed discount exceeds total) or negative (if fixed_bundle_price exceeds total). No clamping to valid 0-100 range.

### Problem 3: Division by zero
In `pricing.ts`, when `totalRetailCents === 0`, the line `priceWeight = retailPriceCents / totalRetailCents` produces NaN, corrupting the component_pricing metafield.

---

## Progress Log

### 2026-02-05 - All Fixes Completed

**Files Modified:**

1. `app/services/bundles/metafield-sync/utils/pricing.ts`
   - Added `'fixed_amount_off'` to the fixed amount condition check (was only matching `'fixed_amount'` and `'fixed'`)
   - Added new `'fixed_bundle_price'` case with proportional distribution logic
   - Added division-by-zero guard: early return when `totalRetailCents === 0`

2. `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts`
   - Refactored `calculateDiscountPercentage` to use a `result` variable
   - Added `Math.max(0, Math.min(100, result))` clamping before return

3. `extensions/bundle-cart-transform-ts/dist/function.wasm`
   - Rebuilt cart transform WASM successfully

---

## Files Modified

1. `app/services/bundles/metafield-sync/utils/pricing.ts`
2. `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts`
3. `extensions/bundle-cart-transform-ts/dist/function.wasm`

---

## Phases Checklist

- [x] Phase 1: Fix pricing.ts (method strings, fixed_bundle_price case, division-by-zero guard)
- [x] Phase 2: Fix cart_transform_run.ts (percentage clamping)
- [x] Phase 3: Rebuild cart transform WASM
- [x] Phase 4: Verify build passes
