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

### 2026-02-05 - Pricing Fixes Completed

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

### 2026-02-05 - Checkout UI Extension Fixes

**Problem 4: MERGE operation missing attributes**
The MERGE operation in `cart_transform_run.ts` was not setting any `attributes` on the merged parent line. The `MergeOperation` schema does support `attributes` but the code never populated them. The checkout UI extension reads `_is_bundle_parent` and other attributes to render, so MERGE bundles were invisible in checkout.

**Problem 5: EXPAND + no discount returned null**
`Checkout.tsx` returned `null` when `totalSavingsCents <= 0 && discountPercent <= 0`, so bundles with 0% discount showed nothing in checkout.

**Files Modified:**

4. `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts`
   - Added `attributes` to `CartTransformOperation.merge` interface
   - Populated attributes on merge operation with bundle pricing data (`_is_bundle_parent`, `_bundle_components`, savings, etc.)
   - Built component details array from actual cart line prices

5. `extensions/bundle-checkout-ui/src/Checkout.tsx`
   - Removed early `return null` for 0% discount bundles
   - Conditionally show pricing breakdown only when `hasDiscount` is true
   - Show "Bundle (N items)" label when no discount, with expandable component list still available

---

## Files Modified

1. `app/services/bundles/metafield-sync/utils/pricing.ts`
2. `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts`
3. `extensions/bundle-cart-transform-ts/dist/function.wasm`
4. `extensions/bundle-checkout-ui/src/Checkout.tsx`

---

## Phases Checklist

- [x] Phase 1: Fix pricing.ts (method strings, fixed_bundle_price case, division-by-zero guard)
- [x] Phase 2: Fix cart_transform_run.ts (percentage clamping)
- [x] Phase 3: Rebuild cart transform WASM
- [x] Phase 4: Verify build passes
- [x] Phase 5: Add attributes to MERGE operation for checkout UI
- [x] Phase 6: Fix checkout UI to render bundles with 0% discount

### 2026-02-05 - Fix Checkout Extension Build & Duplicate Bundle Consolidation

**Problem 6: Checkout extension build failed with named exports**
Shopify's Preact extension build system requires a default export for all targets. Named exports with `export` field in toml are not supported for Preact extensions. Reverted to default export and removed `export` fields from toml.

**Problem 7: Duplicate bundles consolidated into single line in checkout**
When a customer adds the same bundle twice, Shopify consolidates the MERGE results because they share the same `parentVariantId` + `title`. Added unique title suffixes (e.g., "Sports Kit", "Sports Kit (2)") to prevent consolidation.

**Files Modified:**

6. `extensions/bundle-checkout-ui/src/index.tsx`
   - Reverted to single default export (Preact extensions require this)

7. `extensions/bundle-checkout-ui/shopify.extension.toml`
   - Removed `export` fields from both targets (Preact uses default imports)

8. `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts`
   - Added `bundleNameCounts` map to track bundle name occurrences
   - Appends index suffix to duplicate bundle names to prevent MERGE consolidation

9. `extensions/bundle-cart-transform-ts/dist/function.wasm`
   - Rebuilt WASM with unique title changes

- [x] Phase 7: Fix Preact extension build (restore default export)
- [x] Phase 8: Prevent duplicate bundle consolidation with unique MERGE titles
