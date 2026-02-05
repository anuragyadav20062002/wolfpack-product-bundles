# Issue: Cart Transform Pricing Bug Fix

**Issue ID:** cart-transform-pricing-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-02
**Last Updated:** 2026-02-02 16:00

---

## Overview

Fixed critical bug in cart transform where bundle pricing was broken:
1. When discount is disabled: price showed as $0 instead of sum of component prices
2. When discount is enabled: incorrect price calculations due to missing method fallback

## Root Cause Analysis

### Problem 1: No price field when discount is 0

In `cart_transform_run.ts`, the MERGE operation only included a `price` field when `discountPercentage > 0`:

```typescript
// OLD CODE (broken)
...(discountPercentage > 0 && {
  price: {
    percentageDecrease: {
      value: discountPercentage.toFixed(2)
    }
  }
})
```

When no discount was configured, this meant NO price field was added to the merge operation. Shopify then used the parent variant's price (which is $0 for container products), resulting in bundles showing as $0 in the cart.

### Problem 2: Missing method fallback in component metafield sync

In `component-product.server.ts`, the `priceAdjustment` object was created without a fallback for the `method` field:

```typescript
// OLD CODE (broken)
const priceAdjustment: PriceAdjustment = {
  method: bundleConfig.pricing?.method, // No fallback - could be undefined!
  value: 0
};
```

When `pricing.method` was undefined (e.g., when discount was disabled), the cart transform's `calculateDiscountPercentage` function would fall into the `default` switch case and return 0.

---

## Fixes Applied

### Fix 1: Always include price field in MERGE operation

```typescript
// NEW CODE (fixed)
const mergeOp: CartTransformOperation = {
  merge: {
    cartLines: bundleComponentLines.map(l => ({
      cartLineId: l.id,
      quantity: l.quantity
    })),
    parentVariantId,
    title: bundleName,
    price: {
      percentageDecrease: {
        value: discountPercentage.toFixed(2) // Always include, even when "0.00"
      }
    }
  }
};
```

When `percentageDecrease` is "0.00", Shopify calculates: sum of component prices - 0% = full component total.

### Fix 2: Add fallback for pricing method

```typescript
// NEW CODE (fixed)
const priceAdjustment: PriceAdjustment = {
  method: bundleConfig.pricing?.method || 'percentage_off', // Fallback to percentage_off
  value: 0
};
```

This ensures the cart transform always has a valid method to work with.

---

## Files Modified

1. `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts`
   - Always include `price.percentageDecrease` in MERGE operations
   - Added comment explaining why this is necessary

2. `app/services/bundles/metafield-sync/operations/component-product.server.ts`
   - Added fallback `|| 'percentage_off'` for pricing method

3. `extensions/bundle-cart-transform-ts/dist/function.wasm`
   - Rebuilt cart transform WASM

---

## Testing Notes

After deploying:
1. **Test case 1 (No discount)**: Create a bundle without discount enabled, add to cart → should show sum of component prices
2. **Test case 2 (With discount)**: Create a bundle with 10% discount, add to cart → should show component total minus 10%
3. **Test case 3 (Existing bundles)**: Re-save existing bundles to update component metafields with the new fallback

**IMPORTANT**: Existing bundles need to be re-saved to update the `component_parents` metafield on component products with the corrected `price_adjustment` structure.

---

## Related Files

- `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts`
- `app/services/bundles/metafield-sync/operations/component-product.server.ts`
- `app/services/bundles/metafield-sync/operations/bundle-product.server.ts` (reference)
