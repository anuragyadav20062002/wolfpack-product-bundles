# Issue: Pricing Calculation Bugs Fix

**Issue ID:** pricing-calculation-bugs-fix-1
**Status:** In Progress
**Priority:** High
**Created:** 2026-02-05
**Last Updated:** 2026-02-06

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

### 2026-02-06 - Add Block Targets for Checkout Editor Placement

**Problem 8: Extension only appears in thank-you page section of checkout editor**
The cart-line-item targets are static and render automatically — they don't appear in the checkout editor as placeable blocks. Added block targets for both checkout and thank-you pages.

**Files Modified:**

10. `extensions/bundle-checkout-ui/shopify.extension.toml`
    - Added `purchase.checkout.block.render` target (checkout page block)
    - Added `purchase.thank-you.block.render` target (thank-you page block)
    - Now has 4 targets: 2 blocks (editor-placeable) + 2 cart-line (static)

11. `extensions/bundle-checkout-ui/src/Checkout.tsx`
    - Refactored to support both cart-line and block targets
    - Added `BundleDisplay` reusable component
    - Added `parseBundleFromLine` helper function
    - Block mode uses `useCartLines()` to show all bundles in cart
    - Cart-line mode uses `useCartLineTarget()` for single line display

- [x] Phase 9: Add block targets for checkout editor placement
- [x] Phase 10: Remove block targets (static cart-line targets auto-render, no editor needed)

### 2026-02-06 - Fix Full-Page Bundle MERGE Not Working

**Problem 9: Full-page bundle MERGE not triggering - cart transform only doing EXPAND**
The full-page widget's `addBundleToCart()` method had two critical issues:
1. Used static `this.selectedBundle.id` (database ID) as `_bundle_id` instead of unique instance ID
2. Missing `_bundle_name` attribute entirely

The cart transform requires both `_bundle_id` (unique per add-to-cart) and `_bundle_name` (for display) to trigger MERGE operation.

**Root Cause:**
- Line 2058: `'_bundle_id': this.selectedBundle.id` - same ID for every add-to-cart
- Missing `_bundle_name` property in cart line properties

**Files Modified:**

12. `app/assets/bundle-widget-full-page.js`
    - Generate unique `_bundle_id` using `crypto.randomUUID()` for each add-to-cart
    - Add `_bundle_name` attribute with `this.selectedBundle.name`

13. `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
    - Rebuilt widget bundle

- [x] Phase 11: Fix full-page widget to set unique `_bundle_id` and `_bundle_name` attributes

### 2026-02-06 - Fix Checkout UI Extension Not Loading

**Problem 10: Checkout UI extension not loading at all**
The extension wasn't executing - no console logs appeared. Root cause: `shopify app build` was failing due to unsupported `[metafields]` and `[shop]` sections in app TOML config.

**Problem 11: Multiple targets in one extension caused issues**
Having two targeting blocks in one extension was problematic. Simplified to single checkout target.

**Files Modified:**

14. `shopify.app.toml` and `shopify.app.wolfpack-product-bundles-sit.toml`
    - Removed unsupported `[metafields]` and `[shop.metafields.*]` sections
    - These metafield definitions should be managed via Admin API instead

15. `extensions/bundle-checkout-ui/shopify.extension.toml`
    - Simplified to single extension with checkout cart-line-item target only
    - Removed thank-you page target to isolate and fix checkout rendering

16. `extensions/bundle-checkout-ui/shopify.d.ts`
    - Updated type declarations to match single-target configuration

- [ ] Phase 12: Fix checkout UI extension build and deployment
