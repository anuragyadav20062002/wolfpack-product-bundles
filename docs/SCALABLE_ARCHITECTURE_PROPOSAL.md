# Scalable Metafield Architecture Proposal

## Research Summary

### Key Findings

**Shopify Metafield Limits (2025)**:
- JSON metafields: Up to 2 million characters storage
- **Cart Transform Input**: Only **10,000 bytes (10KB)** accessible in function queries
- Overall function input: 64,000 bytes limit
- Maximum 200 metafields per resource

**Competitor Analysis**:
- **Shopify Official Sample**: Uses 3 metafields per product variant
  - `component_reference`: List of variant IDs (compact)
  - `component_quantities`: Integer list
  - `component_parents`: JSON with relationship details
- **Kaching Bundles**: Modern, uses Shopify Functions (33k+ installs, 5.0 rating)
- **Bold Bundles**: Older architecture (3.8 rating, 237 reviews)

**Current App Issues**:
- Single massive `shop.custom:all_bundles` metafield (~15KB per bundle)
- With 7+ bundles: **>100KB = EXCEEDS 10KB LIMIT**
- Includes unnecessary data (images, full variants, descriptions)
- No size validation or error handling

---

## Essential Data Analysis

### What Cart Transform Actually Needs

Analyzing `cart_transform_run.ts`, the function ONLY uses:

```typescript
bundleConfig.id                      // Bundle ID for matching
bundleConfig.bundleParentVariantId   // CRITICAL: For merge operation
bundleConfig.name                    // Display name
bundleConfig.pricing.enabled         // Whether pricing rules exist
bundleConfig.pricing.method          // Discount method type
bundleConfig.pricing.rules[]         // Array of pricing rules
  - rule.condition.type              // 'quantity' or 'amount'
  - rule.condition.operator          // 'gte', 'lte', 'eq'
  - rule.condition.value             // Threshold value
  - rule.discount.method             // Discount type
  - rule.discount.value              // Discount value
```

### Data NOT Needed by Cart Transform

❌ `steps[]` - Full step configurations
❌ `StepProduct[]` - Product details, images, variants
❌ `collections[]` - Collection references
❌ `description` - Bundle description
❌ `status` - Bundle status (can filter before storing)
❌ `matching` - Widget-specific data
❌ `messages` - UI display messages
❌ `shopifyProductId` - Already have variant ID

**Size Reduction Potential**: 80-90% smaller!

---

## Proposed Scalable Architecture

### Architecture #1: Per-Product Metafields (RECOMMENDED)

**Concept**: Store ONLY essential cart transform data on each bundle product, following Shopify's official pattern.

#### Metafield Structure

**On Bundle Product Variant**:
```
Namespace: "$app"
Key: "cart_transform_config"
Type: "json"
Max Size: ~500 bytes per bundle
```

**Data Structure**:
```json
{
  "id": "bundle_abc123",
  "parentVariantId": "gid://shopify/ProductVariant/123",
  "name": "Summer Bundle",
  "pricing": {
    "enabled": true,
    "method": "percentage_off",
    "rules": [
      {
        "condition": { "type": "quantity", "operator": "gte", "value": 3 },
        "discount": { "method": "percentage_off", "value": 20 }
      }
    ]
  }
}
```

**Size Calculation**:
- Base config: ~200 bytes
- Per rule: ~100 bytes
- 3 rules: ~500 bytes total
- **Well under 10KB limit even with 15+ bundles in one cart**

#### Cart Transform Input Query

```graphql
query Input {
  cart {
    lines {
      id
      quantity
      bundleId: attribute(key: "_bundle_id") { value }
      merchandise {
        ... on ProductVariant {
          id
          product {
            id
            # Read from bundle product itself
            cartTransformConfig: metafield(
              namespace: "$app"
              key: "cart_transform_config"
            ) {
              value
            }
          }
        }
      }
      cost {
        amountPerQuantity { amount }
        totalAmount { amount }
      }
    }
  }
}
```

#### Cart Transform Logic Changes

```typescript
// NEW: Load configs from product metafields, not shop metafield
const bundleLines = input.cart.lines.filter(line =>
  line.bundleId && line.bundleId.value
);

const bundleConfigs: Record<string, any> = {};

// Extract configs from each line's product metafield
for (const line of bundleLines) {
  const configValue = line.merchandise.product?.cartTransformConfig?.value;
  if (configValue) {
    const config = JSON.parse(configValue);
    bundleConfigs[config.id] = config;
  }
}

// Rest of logic remains the same - uses bundleConfigs map
```

#### Advantages
✅ **Scales indefinitely** - Each bundle's config queried only when in cart
✅ **No 10KB limit issues** - Each product metafield is small
✅ **Follows Shopify patterns** - Matches official bundle sample
✅ **Automatic cleanup** - Deleted products = deleted metafields
✅ **Simpler sync** - Update one metafield when bundle changes
✅ **Widget can use same data** - Single source of truth

#### Disadvantages
❌ Requires GraphQL input query changes
❌ Requires cart transform code rewrite (moderate effort)
❌ Need to query each product's metafield (slight complexity)

---

### Architecture #2: Optimized Shop Metafield (FALLBACK)

**Concept**: Keep current shop metafield approach but drastically reduce data size.

#### Optimized Data Structure

```json
{
  "bundles": [
    {
      "id": "bundle_abc123",
      "v": "gid://shopify/ProductVariant/123",  // Shortened key
      "n": "Summer Bundle",                     // Shortened key
      "p": {                                     // pricing
        "e": true,                               // enabled
        "m": "percentage_off",                   // method
        "r": [                                   // rules
          {
            "c": { "t": "qty", "o": "gte", "v": 3 },      // condition
            "d": { "m": "pct", "v": 20 }                   // discount
          }
        ]
      }
    }
  ]
}
```

**Size Calculation**:
- Per bundle: ~250 bytes (vs 15KB currently)
- 20 bundles: ~5KB
- 40 bundles: ~10KB (at limit)
- **Can support 40+ bundles before hitting limit**

#### Implementation
- Minimal code changes
- Add compression/shortening layer
- Add size validation before saving

#### Advantages
✅ **Minimal code changes** - Keep current architecture
✅ **Immediate fix** - Can implement quickly
✅ **4x improvement** - Support 40+ bundles vs 10 currently

#### Disadvantages
❌ **Still has hard limit** - Can't scale beyond ~40 bundles
❌ **Harder to debug** - Shortened keys less readable
❌ **Redundant storage** - All bundles loaded even if not in cart
❌ **Sync complexity** - Must rebuild entire metafield on each change

---

### Architecture #3: Hybrid Approach (BEST LONG-TERM)

**Concept**: Combine both approaches for optimal scalability and performance.

#### Structure

**Per-Product Metafield** (Primary):
```
$app:cart_transform_config
- Stores essential cart transform data
- Used by cart transform function
- ~500 bytes per bundle
```

**Shop Metafield** (Index):
```
custom:bundle_index
- Stores minimal index/mapping
- Used by widget for quick lookup
- ~50 bytes per bundle
```

```json
{
  "bundles": [
    {
      "id": "bundle_abc123",
      "productId": "gid://shopify/Product/456",
      "status": "active"
    }
  ]
}
```

**Widget Data** (Separate):
```
$app:bundle_config (existing)
- Full configuration for widget UI
- Images, variants, descriptions, etc.
- Not read by cart transform
```

#### Advantages
✅ **Best of both worlds** - Scalability + performance
✅ **Clean separation** - Cart transform data vs widget data
✅ **Unlimited bundles** - Only index in shop metafield
✅ **Fast widget** - Can query index for product discovery

---

## Recommended Implementation Plan

### Phase 1: Immediate Fix (Architecture #2)
**Timeline**: 1-2 days

1. **Add Size Validation**
   ```typescript
   const metafieldValue = JSON.stringify(formattedBundles);
   const sizeBytes = new Blob([metafieldValue]).size;

   if (sizeBytes > 10000) {
     console.error(`Metafield too large: ${sizeBytes} bytes > 10KB limit`);
     // Truncate to active bundles only or fail gracefully
   }
   ```

2. **Reduce Data Size**
   - Remove: images, full variants, descriptions, matching, messages
   - Keep only: id, variantId, name, pricing rules
   - Use shorter key names if needed

3. **Add Proper Logging**
   ```typescript
   console.log(`[SHOP_METAFIELD] Size: ${sizeBytes} bytes`);
   console.log(`[SHOP_METAFIELD] Bundles: ${allBundles.length}`);
   console.log(`[SHOP_METAFIELD] Per bundle avg: ${Math.round(sizeBytes/allBundles.length)} bytes`);
   ```

4. **Test with Multiple Bundles**
   - Create 10+ test bundles
   - Verify size stays under 10KB
   - Test cart transform works

**Expected Outcome**: Support 20-40 bundles reliably

---

### Phase 2: Scalable Architecture (Architecture #1 or #3)
**Timeline**: 1-2 weeks

1. **Update Cart Transform Input Query**
   - Change from shop metafield to product metafields
   - Test query complexity (must be under 30 points)
   - Verify 10KB limit not exceeded per product

2. **Create New Metafield on Bundle Products**
   ```typescript
   // metafield-sync.server.ts
   async function updateBundleProductCartTransformMetafield(
     admin: any,
     bundleProductId: string,
     bundle: Bundle
   ) {
     const essentialConfig = {
       id: bundle.id,
       parentVariantId: await getBundleProductVariantId(admin, bundleProductId),
       name: bundle.name,
       pricing: {
         enabled: bundle.pricing?.enabled || false,
         method: bundle.pricing?.method || 'percentage_off',
         rules: safeJsonParse(bundle.pricing?.rules, []).map(rule => ({
           condition: rule.condition || {},
           discount: rule.discount || {}
         }))
       }
     };

     // Size check
     const size = JSON.stringify(essentialConfig).length;
     console.log(`Cart transform config size: ${size} bytes`);

     if (size > 2000) {
       throw new Error(`Config too large: ${size} bytes. Reduce pricing rules.`);
     }

     await admin.graphql(SET_METAFIELD, {
       variables: {
         metafields: [{
           ownerId: bundleProductId,
           namespace: "$app",
           key: "cart_transform_config",
           type: "json",
           value: JSON.stringify(essentialConfig)
         }]
       }
     });
   }
   ```

3. **Update Cart Transform Function**
   ```typescript
   // Load configs from product metafields
   const bundleConfigs: Record<string, any> = {};

   for (const line of bundleLines) {
     const configValue = line.merchandise.product?.cartTransformConfig?.value;
     if (configValue) {
       try {
         const config = JSON.parse(configValue);
         bundleConfigs[config.id] = config;
       } catch (error) {
         Logger.error('Failed to parse cart transform config', { phase: 'config-loading' }, error);
       }
     }
   }

   // Rest remains same - uses bundleConfigs map for O(1) lookup
   ```

4. **Update Bundle Save Flow**
   ```typescript
   // In bundle save action
   if (updatedBundle.shopifyProductId) {
     // Create/update cart transform metafield on bundle product
     await updateBundleProductCartTransformMetafield(
       admin,
       updatedBundle.shopifyProductId,
       updatedBundle
     );
   }
   ```

5. **Optional: Create Bundle Index**
   - Keep lightweight shop metafield for widget discovery
   - Only store bundle IDs and product IDs
   - ~50 bytes per bundle = 200 bundles in 10KB

6. **Testing**
   - Create 50+ test bundles
   - Add items from multiple bundles to cart
   - Verify cart transform applies discounts correctly
   - Check function execution logs for performance
   - Measure query complexity

**Expected Outcome**: Support 100+ bundles easily, unlimited theoretical limit

---

### Phase 3: Cleanup & Optimization
**Timeline**: 3-5 days

1. **Remove Deprecated Shop Metafield**
   - If using Architecture #1, remove shop metafield entirely
   - Clean up old metafields from existing stores
   - Add migration for existing merchants

2. **Add Deletion Cleanup**
   ```typescript
   // When bundle is deleted
   async function onBundleDelete(bundleId: string) {
     const bundle = await db.bundle.findUnique({
       where: { id: bundleId },
       select: { shopifyProductId: true }
     });

     if (bundle.shopifyProductId) {
       // Delete cart transform metafield from bundle product
       await admin.graphql(DELETE_METAFIELD, {
         variables: {
           input: {
             id: bundle.shopifyProductId,
             metafields: [{
               namespace: "$app",
               key: "cart_transform_config"
             }]
           }
         }
       });
     }

     // Update shop index if using hybrid approach
     await updateBundleIndex(admin, session.shop);
   }
   ```

3. **Add App Uninstall Handler**
   ```typescript
   // shopify.server.ts - Add webhook
   webhooks: {
     APP_UNINSTALLED: {
       deliveryMethod: DeliveryMethod.Http,
       callbackUrl: "/webhooks/app-uninstalled",
       callback: async (topic, shop, body) => {
         // Clean up all metafields
         // Delete cart transform
         // Remove database records
       }
     }
   }
   ```

4. **Performance Monitoring**
   - Add metrics for metafield sizes
   - Monitor function execution time
   - Track query complexity points
   - Alert if approaching limits

---

## Implementation Priority

### IMMEDIATE (Do This First)
1. ✅ Add size logging to understand current usage
2. ✅ Add size validation (fail if > 10KB)
3. ✅ Remove unnecessary data from shop metafield
4. ✅ Test with multiple bundles

### SHORT-TERM (1-2 weeks)
1. Implement Architecture #1 (per-product metafields)
2. Update cart transform input query
3. Update cart transform function logic
4. Migrate existing bundles
5. Test thoroughly

### LONG-TERM (Optional)
1. Implement Architecture #3 (hybrid)
2. Add bundle index for widget
3. Add performance monitoring
4. Optimize for 100+ bundles

---

## Migration Strategy

### For Existing Merchants

1. **Backward Compatibility**
   - Keep shop metafield during transition
   - Cart transform checks both sources
   - Fallback to shop metafield if product metafield missing

2. **Gradual Migration**
   ```typescript
   // During bundle save
   if (updatedBundle.shopifyProductId) {
     // Create NEW per-product metafield
     await updateBundleProductCartTransformMetafield(...);

     // ALSO update OLD shop metafield (for now)
     await updateShopBundlesMetafield(...);
   }
   ```

3. **Deprecation Timeline**
   - Month 1: Add per-product metafields, keep shop metafield
   - Month 2: Cart transform uses product metafields, shop as fallback
   - Month 3: Remove shop metafield dependency
   - Month 4: Clean up old shop metafields

4. **Merchant Communication**
   - No action needed from merchants
   - Automatic migration on bundle save
   - Email notification when complete

---

## Size Comparison

### Current Architecture
```
Bundle 1: 15KB
Bundle 2: 15KB
Bundle 3: 15KB
...
Bundle 7: 15KB
TOTAL: 105KB (EXCEEDS LIMIT)
```

### Architecture #2 (Optimized Shop)
```
Bundle 1: 250 bytes
Bundle 2: 250 bytes
...
Bundle 40: 250 bytes
TOTAL: 10KB (AT LIMIT)
```

### Architecture #1 (Per-Product)
```
Product 1 metafield: 500 bytes
Product 2 metafield: 500 bytes
Product 3 metafield: 500 bytes
...
TOTAL in cart function: Only loaded products (~2KB for 4 bundles)
SCALABILITY: UNLIMITED
```

---

## Risk Analysis

### Architecture #1 Risks
- **Query Complexity**: Each product metafield costs 3 points. With 10 products = 30 points = AT LIMIT
  - **Mitigation**: Most carts have 3-5 items, well below limit
- **Testing Required**: Need to verify with 10+ bundle items in cart
- **Code Changes**: Moderate rewrite of cart transform function
  - **Mitigation**: Can phase implementation

### Architecture #2 Risks
- **Hard Limit**: Still caps at ~40 bundles
  - **Mitigation**: Good enough for 95% of merchants
- **Less Scalable**: Not ideal for very large catalogs
  - **Mitigation**: Can migrate to Architecture #1 later

### Both Architectures
- **Migration Complexity**: Need careful testing
  - **Mitigation**: Gradual rollout with fallbacks
- **Backward Compatibility**: Must support existing stores
  - **Mitigation**: Dual-write during transition period

---

## Conclusion

**Recommended Approach**:

1. **Immediate** (This Week): Implement Architecture #2 optimizations
   - Reduces data size 90%
   - Supports 40+ bundles
   - Minimal code changes
   - Fixes current issues

2. **Short-term** (Next 2 Weeks): Migrate to Architecture #1
   - True scalability
   - Follows Shopify best practices
   - Clean architecture
   - Unlimited bundles

3. **Long-term** (Optional): Add Architecture #3 features
   - Bundle index for widget
   - Performance optimizations
   - Advanced features

This phased approach minimizes risk while providing immediate value and long-term scalability.
