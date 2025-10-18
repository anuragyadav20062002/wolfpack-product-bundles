# Cart Transform and Discount Functionality Fix

**Date:** October 17, 2025
**Issue:** Cart transform merge operations and discounts not working
**Status:** ✅ FIXED

---

## Problem Summary

The bundle widget was loading correctly, but:
1. ❌ Cart line items were not merging into bundle products
2. ❌ Discounts were not being applied at checkout
3. ❌ Cart transform function was skipping bundles

### Root Cause

The `$app:bundle_config` metafield was missing the `bundleParentVariantId` field, which is **critical** for cart transform merge operations.

**Cart Transform Logic (cart_transform_run.ts:309-313):**
```typescript
// If we don't have a valid variant ID, skip this bundle
if (!bundleContainerVariantId) {
  console.log(`❌ [WIDGET BUNDLES] Cannot create merge operation: missing bundleParentVariantId`);
  console.log(`❌ [WIDGET BUNDLES] Bundle ${bundleId} will not be merged`);
  continue; // Skip this bundle
}
```

Without `bundleParentVariantId`, the cart transform:
- Cannot create merge operations
- Cannot apply discounts
- Leaves cart items as individual products

---

## What Was Fixed

### 1. Bundle Metafield Data Structure

**File:** `app/services/bundle-isolation.server.ts:46-65`

**Before:**
```typescript
const bundleMetafieldData = {
  id: bundleConfig.id,
  name: bundleConfig.name,
  // ... other fields
  componentProductIds: [...]
  // ❌ Missing bundleParentVariantId
};
```

**After:**
```typescript
const bundleMetafieldData = {
  id: bundleConfig.id,
  name: bundleConfig.name,
  // ... other fields
  bundleParentVariantId: bundleConfig.bundleParentVariantId || null, // ✅ Added
  componentProductIds: [...]
};
```

### 2. Bundle Save Flow

**File:** `app/routes/app.bundles.cart-transform.configure.$bundleId.tsx:1783-1804`

**Before:**
```typescript
await BundleIsolationService.updateBundleProductMetafield(
  admin,
  updatedBundle.shopifyProductId,
  updatedBundle // ❌ Database object doesn't have bundleParentVariantId
);
```

**After:**
```typescript
// Get bundleParentVariantId if not already fetched
const bundleParentVariantId = await getBundleProductVariantId(admin, updatedBundle.shopifyProductId);

// Enrich bundle with bundleParentVariantId for cart transform
const enrichedBundle = {
  ...updatedBundle,
  bundleParentVariantId: bundleParentVariantId // ✅ Add to bundle object
};

await BundleIsolationService.updateBundleProductMetafield(
  admin,
  updatedBundle.shopifyProductId,
  enrichedBundle // ✅ Pass enriched bundle
);
```

### 3. Window Variable Name Fix

**File:** `extensions/bundle-builder/blocks/bundle.liquid:398-439`

Fixed widget data loading mismatch:

**Before:**
```liquid
window.bundleConfig = productBundleConfig; // ❌ Wrong variable name
```

**After:**
```liquid
// Widget expects window.allBundlesData
if (productBundleConfig && productBundleConfig.id) {
  window.allBundlesData = {
    [productBundleConfig.id]: productBundleConfig // ✅ Correct format
  };
}
```

---

## How Cart Transform Works Now

### Data Flow

1. **Bundle Configuration Saved** (Admin)
   ```
   Bundle Form → Save Action → getBundleProductVariantId()
                              ↓
   Enrich bundle with bundleParentVariantId
                              ↓
   Save to $app:bundle_config metafield
   ```

2. **Storefront Widget Loading** (Theme)
   ```
   Product Page → Liquid Template → Read $app:bundle_config
                                   ↓
   Set window.allBundlesData with bundle config (includes bundleParentVariantId)
                                   ↓
   Widget renders bundle builder
   ```

3. **Add to Cart** (Customer Action)
   ```
   Customer selects products → Widget adds to cart with _wolfpack_bundle_id property
                                                        ↓
   Cart line items created with bundle instance ID
   ```

4. **Cart Transform Execution** (Checkout)
   ```
   Cart → Cart Transform Function reads:
          - Cart line attributes (_wolfpack_bundle_id)
          - Product metafield ($app:bundle_config with bundleParentVariantId)
                              ↓
   Groups cart lines by bundle instance
                              ↓
   Calculates discount from pricing rules
                              ↓
   Creates MERGE operation using bundleParentVariantId
                              ↓
   Returns merged bundle product with discount applied
   ```

### Merge Operation Structure

```typescript
{
  merge: {
    parentVariantId: "gid://shopify/ProductVariant/123456", // ✅ Required!
    cartLines: [
      { cartLineId: "line1", quantity: 1 },
      { cartLineId: "line2", quantity: 2 }
    ],
    title: "Bundle Name",
    price: {
      percentageDecrease: { value: 20 } // Discount applied
    },
    attributes: [
      { key: "_bundle_id", value: "bundle_abc123_xyz789" },
      { key: "_bundle_savings", value: "10.00" }
    ]
  }
}
```

---

## Testing Instructions

### For Existing Bundles

**Option 1: Re-save Bundle (Recommended)**

1. Open your bundle in the admin
2. Click "Save Bundle Configuration"
3. The metafield will be automatically updated with `bundleParentVariantId`

**Option 2: Run Fix Script**

```bash
# From app admin, navigate to:
POST /api/fix-bundle-metafields

# This updates all bundles with missing bundleParentVariantId
```

### Verify Fix Works

1. **Check Metafield Data:**
   ```graphql
   query {
     product(id: "gid://shopify/Product/YOUR_BUNDLE_PRODUCT_ID") {
       bundleConfig: metafield(namespace: "$app", key: "bundle_config") {
         value
       }
     }
   }
   ```

   Should include:
   ```json
   {
     "bundleParentVariantId": "gid://shopify/ProductVariant/123456",
     ...
   }
   ```

2. **Test on Storefront:**
   - Go to bundle product page
   - Select products in bundle
   - Add to cart
   - **Expected:** Cart shows merged bundle product (not individual items)

3. **Check Cart Transform Logs:**
   ```
   ✅ [WIDGET BUNDLES] Using bundle container variant: gid://shopify/ProductVariant/123456
   ✅ [WIDGET BUNDLES] Created merge operation for bundle: Bundle Name
   ```

   **NOT:**
   ```
   ❌ [WIDGET BUNDLES] Cannot create merge operation: missing bundleParentVariantId
   ```

4. **Verify Discount Applied:**
   - Cart should show discount badge
   - Checkout should apply bundle pricing
   - Cart transform attributes should include `_bundle_savings`

---

## Files Changed

### Core Fixes
- ✅ `app/services/bundle-isolation.server.ts:53` - Added bundleParentVariantId to metafield
- ✅ `app/routes/app.bundles.cart-transform.configure.$bundleId.tsx:1785-1799` - Enrich bundle before save
- ✅ `extensions/bundle-builder/blocks/bundle.liquid:398-439` - Fix window variable name

### Helper Files
- ✅ `app/routes/api.fix-bundle-metafields.tsx` - Script to fix existing bundles

---

## Architecture Notes

### Why bundleParentVariantId is Critical

Shopify Cart Transform **requires** a ProductVariant ID (not Product ID) for merge operations:

```typescript
// ❌ WRONG - Product ID
parentVariantId: "gid://shopify/Product/123"

// ✅ CORRECT - ProductVariant ID
parentVariantId: "gid://shopify/ProductVariant/456"
```

The merge operation creates a new cart line item representing the bundle product. Without a valid variant ID:
- Shopify rejects the merge operation
- Cart items remain separate
- Discounts cannot be applied
- Bundle appears broken to customer

### Metafield Architecture

**Primary Storage:** `$app:bundle_config` on bundle product
- Fast access (product-level, not shop-level)
- Naturally isolated (each bundle has own config)
- **Must include:** bundleParentVariantId, pricing rules, steps

**Cart Transform Access:**
```typescript
// Widget adds cart line with property
properties: {
  _wolfpack_bundle_id: "bundle_abc_123"
}

// Property becomes attribute in cart transform
line.attribute.value === "bundle_abc_123"

// Cart transform reads bundle config from product metafield
product.bundle_config.value → includes bundleParentVariantId

// Creates merge using bundleParentVariantId
merge: {
  parentVariantId: bundleConfig.bundleParentVariantId
}
```

---

## Future Improvements

1. **Database Field:** Consider adding `bundleParentVariantId` to Prisma schema
   - Avoids repeated GraphQL calls
   - Ensures consistency
   - Faster bundle saves

2. **Validation:** Add validation to ensure bundleParentVariantId exists before saving

3. **Migration Script:** Batch update all existing bundles on deployment

---

## Related Documentation

- [Metafield Inventory](./metafield-inventory.md) - Complete metafield reference
- [Legacy Metafield Cleanup](./legacy-metafield-cleanup-report.md) - Previous cleanup work
- [Cart Transform Setup](./CART_TRANSFORM_SETUP.md) - Cart transform configuration

---

**Status:** ✅ All fixes implemented and tested
**Impact:** 🎯 Cart transform and discounts now working correctly
**Breaking Changes:** None - backward compatible (requires bundle re-save)
