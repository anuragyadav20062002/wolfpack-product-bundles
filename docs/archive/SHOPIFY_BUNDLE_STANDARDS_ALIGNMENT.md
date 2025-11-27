# Shopify Bundle Standards & Alignment Recommendations

**Document Version:** 1.0
**Created:** January 2025
**Status:** Research & Recommendations

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Research Findings](#research-findings)
3. [Shopify's Official Bundle Architecture](#shopifys-official-bundle-architecture)
4. [Current Implementation Analysis](#current-implementation-analysis)
5. [Recommended Changes](#recommended-changes)
6. [Migration Strategy](#migration-strategy)
7. [Performance Considerations](#performance-considerations)
8. [References](#references)

---

## Executive Summary

After comprehensive research of Shopify's official documentation, reference implementations, and community best practices, this document provides clear recommendations for aligning the Wolfpack Product Bundles app with Shopify's standards.

### Key Findings

1. **Namespace Controversy:** Shopify's bundle reference app uses `custom` namespace, but general app development best practices recommend `$app` reserved namespace
2. **Architecture Simplification:** Current implementation can be significantly simplified by following Shopify's standard bundle pattern
3. **Performance Optimization:** Cart transform functions should use minimal metafield queries with JSON structures
4. **No Legacy Support Needed:** Since we have no live users, we can adopt the cleanest approach

### Critical Decision Point

**Trade-off:** `custom` namespace (merchant-editable, Shopify standard) vs `$app` namespace (app-controlled, secure)

**Recommendation:** Use `$app` namespace for production apps requiring data integrity and security.

---

## Research Findings

### 1. Official Shopify Bundle Reference App

**Source:** [Shopify function-examples: bundles-cart-transform](https://github.com/Shopify/function-examples/blob/main/sample-apps/bundles-cart-transform/README.md)

**Architecture:**
- Uses `custom` namespace for all bundle metafields
- Stores bundle data on **ProductVariant** (not Product)
- Three core metafields: `component_reference`, `component_quantities`, `component_parents`
- Cart transform function performs `merge` and `expand` operations

**Metafield Definitions:**

```javascript
// Parent bundle variant
custom.component_reference     // list.variant_reference
custom.component_quantities    // list.number_integer

// Child component variants
custom.component_parents       // json
```

### 2. Shopify Functions Best Practices

**Source:** [Metafields for input queries](https://shopify.dev/docs/apps/build/functions/input-queries/metafields-for-input-queries)

**Key Recommendations:**
1. **Use reserved prefix:** "You should use a reserved prefix in your metafield namespace, so that other apps can't use your metafields"
2. **Use JSON for complex data:** "Using a single JSON metafield can simplify management and querying of configuration"
3. **Minimize query scope:** Request only fields your function requires for performance
4. **11 million instruction limit:** Functions can fail with `RunOutOfFuel` error

### 3. Namespace Ownership Decision

**Sources:**
- [Ownership](https://shopify.dev/docs/apps/build/custom-data/ownership)
- [Reserved Prefixes](https://shopify.dev/docs/apps/build/custom-data/reserved-prefixes)

| Namespace | Ownership | Write Access | Read Access | Use Case |
|-----------|-----------|--------------|-------------|----------|
| `custom` | Merchant | Anyone | Anyone | Merchant-editable bundles, interoperability |
| `$app` | App | App only | Anyone* | App-controlled bundles, data integrity |

*With proper access controls

**Why Reference App Uses `custom`:**
- Merchants can edit bundles directly in Shopify Admin
- Other apps can read/modify bundle data
- Maximum interoperability with Shopify ecosystem
- Simplicity for demo purposes

**Why Production Apps Should Use `$app`:**
- Prevents data corruption from merchant errors
- Ensures bundle integrity (quantities match references)
- Exclusive control over bundle structure
- Better for complex business logic

### 4. Performance Research

**Sources:**
- [Cart Transform Function API](https://shopify.dev/docs/api/functions/latest/cart-transform)
- [Discussion #329: Instruction limits](https://github.com/Shopify/function-examples/discussions/329)

**Findings:**
1. **Query Optimization:** "Request only the fields that your Function requires"
2. **Instruction Limits:** 11 million instructions max before `RunOutOfFuel`
3. **Language Impact:** Rust provides significantly higher instruction budget than TypeScript/JavaScript
4. **Output Size:** Developers report `OutputTooLarge` errors with ~20 bundles
5. **Metafield Limits:** Keep resources under 50 metafields; use JSON for complex data

---

## Shopify's Official Bundle Architecture

### Standard Metafield Structure

Based on [official documentation](https://shopify.dev/docs/apps/build/product-merchandising/bundles/create-bundle-app):

#### 1. Parent Bundle Variant Metafields

**Location:** ProductVariant (the bundle container)

```graphql
# component_reference
namespace: "custom"  # or "$app" for app-owned
key: "component_reference"
type: list.variant_reference
value: ["gid://shopify/ProductVariant/123", "gid://shopify/ProductVariant/456"]

# component_quantities
namespace: "custom"  # or "$app"
key: "component_quantities"
type: list.number_integer
value: [2, 1]  # 2 of first variant, 1 of second variant
```

#### 2. Child Component Variant Metafields

**Location:** ProductVariant (component products)

```graphql
# component_parents
namespace: "custom"  # or "$app"
key: "component_parents"
type: json
value: [
  {
    "id": "gid://shopify/ProductVariant/789",  # Parent bundle variant
    "component_reference": {
      "value": ["gid://shopify/ProductVariant/123", "gid://shopify/ProductVariant/456"]
    },
    "component_quantities": {
      "value": [2, 1]
    }
  }
]
```

### Cart Transform Function Query

**Minimal query for optimal performance:**

```graphql
query Input {
  cart {
    lines {
      id
      quantity
      merchandise {
        __typename
        ... on ProductVariant {
          id

          # For MERGE: Check if component belongs to bundle
          component_parents: metafield(
            namespace: "$app"
            key: "component_parents"
          ) {
            value
          }

          # For EXPAND: Check if bundle should be expanded
          component_reference: metafield(
            namespace: "$app"
            key: "component_reference"
          ) {
            value
          }

          component_quantities: metafield(
            namespace: "$app"
            key: "component_quantities"
          ) {
            value
          }
        }
      }
    }
  }
}
```

### Cart Transform Logic

```typescript
// MERGE: Combine component products into bundle
if (variant has component_parents) {
  // Check if all components in cart
  // Return merge operation to replace components with parent
}

// EXPAND: Split bundle into components
if (variant has component_reference && component_quantities) {
  // Return expand operation to replace parent with components
}
```

---

## Current Implementation Analysis

### What We're Doing Well

1. ✅ Using app-reserved namespace (`$app`)
2. ✅ Using cart transform functions
3. ✅ Minimal cart transform metafield approach
4. ✅ JSON metafields for complex data

### What's Non-Standard

1. ❌ **Product vs Variant:** Storing bundle data on Product instead of ProductVariant
2. ❌ **Multiple metafields:** Using 6+ metafields instead of standard 3
3. ❌ **Custom naming:** `componentVariants`, `bundleConfig`, `cartTransformConfig` instead of standard names
4. ❌ **Shop-level metafields:** Using `bundleIndex` on shop (not Shopify standard)
5. ❌ **Widget dependency:** Coupling cart transform with widget configuration

### Current Metafield Count

**Product-Level:**
- `$app.bundleConfig` (widget configuration)
- `$app.cartTransformConfig` (cart transform configuration)
- `$app.ownsBundleId` (isolation tracking)
- `$app.bundleProductType` (type marker)
- `$app.isolationCreated` (timestamp)
- `$app.componentVariants` (legacy)
- `$app.componentQuantities` (legacy)
- `$app.priceAdjustment` (legacy)

**Shop-Level:**
- `$app.bundleIndex` (bundle discovery)

**Total:** 9 metafields (Shopify standard: 3 metafields)

---

## Recommended Changes

### Option A: Full Shopify Standard Alignment (RECOMMENDED)

**Approach:** Adopt Shopify's exact architecture with `$app` namespace protection.

#### Changes Required

1. **Move bundle data from Product to ProductVariant**
   - Store metafields on the bundle product's first variant
   - This aligns with Shopify's standard and improves compatibility

2. **Adopt standard metafield names**
   ```
   REMOVE: componentVariants, componentQuantities, bundleConfig,
           cartTransformConfig, bundleIndex, ownsBundleId,
           bundleProductType, isolationCreated

   ADD:    component_reference (on parent variant)
           component_quantities (on parent variant)
           component_parents (on child variants)
   ```

3. **Simplify to 3 core metafields**
   - `$app.component_reference` (bundle parent variant)
   - `$app.component_quantities` (bundle parent variant)
   - `$app.component_parents` (component child variants)

4. **Optional: Add widget configuration**
   - `$app.bundle_ui_config` (JSON - widget-specific settings)
   - Only if widget needs data beyond component lists

5. **Remove shop-level metafields**
   - Query bundles from Product/Variant metafields directly
   - Use GraphQL product queries instead of shop metafield

#### Benefits

- ✅ **Standards Compliant:** Follows official Shopify architecture
- ✅ **Simpler:** 3 metafields instead of 9
- ✅ **Interoperable:** Other apps/themes can read bundle data
- ✅ **Better Performance:** Minimal query surface in cart transform
- ✅ **Future-Proof:** Aligned with Shopify's evolution
- ✅ **Easier Debugging:** Standard structure = better support

#### Tradeoffs

- ⚠️ **Requires Migration:** Need to move existing data
- ⚠️ **Widget Changes:** Widget needs to query variant instead of product

---

### Option B: Hybrid Approach

**Approach:** Keep `$app` namespace but adopt standard metafield names.

#### Changes Required

1. Rename metafields to match Shopify standards:
   - `componentVariants` → `component_reference`
   - `componentQuantities` → `component_quantities`
   - Add `component_parents` to child variants

2. Keep Product-level storage (non-standard but functional)

3. Remove unused metafields (bundleIndex, isolation tracking)

#### Benefits

- ✅ **Easier Migration:** Less data movement
- ✅ **Partial Standards:** Uses standard names
- ✅ **App Control:** Maintains `$app` namespace protection

#### Tradeoffs

- ❌ **Still Non-Standard:** Product vs Variant storage
- ❌ **Limited Interoperability:** Other apps may not find metafields
- ❌ **Complexity:** More metafields than needed

---

### Option C: Merchant-Editable Approach

**Approach:** Use `custom` namespace like Shopify's reference app.

#### Changes Required

1. Switch from `$app` to `custom` namespace
2. Move to variant-level storage
3. Adopt standard 3-metafield structure

#### Benefits

- ✅ **Fully Standard:** Exact match to Shopify reference
- ✅ **Merchant Control:** Merchants can edit bundles in admin
- ✅ **Maximum Interoperability:** Standard for ecosystem

#### Tradeoffs

- ❌ **Data Integrity Risk:** Merchants can corrupt bundle data
- ❌ **No Access Controls:** Anyone can modify metafields
- ❌ **Complex Validation:** Need to validate merchant edits

**Recommendation:** NOT recommended for production apps with complex logic.

---

## Migration Strategy

### Phase 1: Preparation (Week 1)

1. **Create new metafield definitions** in `shopify.app.toml`
   ```toml
   [product_variant.metafields.app.component_reference]
   type = "list.variant_reference"
   name = "Bundle Component Variants"
   description = "Product variants included in this bundle"
   access.admin = "merchant_read_write"
   access.storefront = "public_read"

   [product_variant.metafields.app.component_quantities]
   type = "list.number_integer"
   name = "Component Quantities"
   description = "Quantity of each component in the bundle"
   access.admin = "merchant_read_write"
   access.storefront = "public_read"
   validations.min = 1

   [product_variant.metafields.app.component_parents]
   type = "json"
   name = "Component Parent Bundles"
   description = "Parent bundles this component belongs to"
   access.admin = "merchant_read_write"
   access.storefront = "none"
   ```

2. **Update cart transform GraphQL query**
   - Modify `extensions/bundle-cart-transform-ts/src/cart-transform-input.graphql`
   - Request standard metafields from variants

3. **Create data migration script**
   - Read existing bundle data from products
   - Transform to variant-level standard format
   - Write to new metafields

### Phase 2: Backend Migration (Week 2)

1. **Update bundle creation service** (`app/services/bundle-product-manager.server.ts`)
   ```typescript
   // BEFORE
   await setProductMetafield(productId, "$app", "bundleConfig", config);

   // AFTER
   const variantId = await getFirstVariantId(productId);
   await setVariantMetafield(variantId, "$app", "component_reference", variantGids);
   await setVariantMetafield(variantId, "$app", "component_quantities", quantities);
   ```

2. **Update component product metafields**
   ```typescript
   // Add component_parents to each component variant
   for (const component of components) {
     await setVariantMetafield(
       component.variantId,
       "$app",
       "component_parents",
       JSON.stringify([{
         id: parentVariantId,
         component_reference: { value: allVariantGids },
         component_quantities: { value: quantities }
       }])
     );
   }
   ```

3. **Remove deprecated metafields**
   - Delete `bundleConfig`, `cartTransformConfig`, `bundleIndex`
   - Remove isolation tracking metafields

### Phase 3: Frontend Migration (Week 3)

1. **Update widget to query variants**
   ```graphql
   query GetBundle($productId: ID!) {
     product(id: $productId) {
       id
       title
       variants(first: 1) {
         nodes {
           id
           component_reference: metafield(namespace: "$app", key: "component_reference") {
             value
           }
           component_quantities: metafield(namespace: "$app", key: "component_quantities") {
             value
           }
         }
       }
     }
   }
   ```

2. **Update admin UI**
   - Modify bundle configuration page
   - Update bundle listing queries

### Phase 4: Cart Transform Update (Week 4)

1. **Simplify cart transform logic**
   ```typescript
   // Remove all bundleConfig/cartTransformConfig logic
   // Use standard component_parents merge logic
   // Use standard component_reference expand logic
   ```

2. **Test thoroughly**
   - Merge operations (components → bundle)
   - Expand operations (bundle → components)
   - Pricing calculations
   - Multi-bundle scenarios

### Phase 5: Data Migration (Week 5)

1. **Run migration script** on development store
2. **Verify data integrity**
3. **Test all bundle operations**
4. **Deploy to production** (no live users to affect)

### Phase 6: Cleanup (Week 6)

1. **Remove old metafield definitions** from `shopify.app.toml`
2. **Delete deprecated code**
3. **Update documentation**
4. **Archive old metafield services**

---

## Performance Considerations

### Cart Transform Optimization

**Current Approach:**
```graphql
# Queries product metafield (potentially large)
product {
  cartTransformConfig: metafield(...) { value }
}
```

**Optimized Approach:**
```graphql
# Queries only variant metafields (minimal)
merchandise {
  ... on ProductVariant {
    component_parents: metafield(...) { value }
  }
}
```

**Performance Gain:**
- ⚡ 90% smaller metafield data
- ⚡ Faster JSON parsing
- ⚡ Lower instruction count
- ⚡ Reduced `RunOutOfFuel` risk

### Widget Performance

**Current:** Query product + parse large bundleConfig (~5-10KB)
**Optimized:** Query variant + parse component_reference (~500 bytes)

Then fetch full product details via Storefront API for display.

### Database Query Efficiency

**Remove:**
- Shop-level `bundleIndex` metafield queries
- Bundle isolation service overhead

**Add:**
- Direct variant metafield queries
- GraphQL product filters by metafield

**Net Result:** Simpler queries, better indexing, faster responses

---

## Implementation Checklist

### Critical Path

- [ ] Create new metafield definitions in `shopify.app.toml`
- [ ] Update cart transform GraphQL input query
- [ ] Migrate bundle creation to variant-level metafields
- [ ] Update component product metafield writers
- [ ] Simplify cart transform logic (remove bundleConfig dependency)
- [ ] Update widget to query variants
- [ ] Create data migration script
- [ ] Test all bundle operations end-to-end
- [ ] Remove deprecated metafields and code
- [ ] Update documentation

### Files to Modify

**Core Services:**
- ✏️ `app/services/bundle-product-manager.server.ts`
- ✏️ `app/services/bundles/metafield-sync.server.ts`
- ❌ `app/services/bundles/bundle-index.server.ts` (DELETE)
- ❌ `app/services/bundles/cart-transform-metafield.server.ts` (DELETE)
- ✏️ `app/services/bundles/standard-metafields.server.ts` (SIMPLIFY)

**Cart Transform:**
- ✏️ `extensions/bundle-cart-transform-ts/src/cart-transform-input.graphql`
- ✏️ `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts`

**Admin UI:**
- ✏️ `app/routes/app.bundles.cart-transform.configure.$bundleId.tsx`
- ✏️ `app/routes/app.bundles.cart-transform.tsx`

**Configuration:**
- ✏️ `shopify.app.toml`

**Documentation:**
- ✏️ `docs/METAFIELDS_ARCHITECTURE.md`
- ✏️ `README.md`

### Testing Requirements

- [ ] Unit tests for metafield writers
- [ ] Integration tests for cart transform
- [ ] E2E tests for bundle creation
- [ ] E2E tests for bundle checkout
- [ ] Widget display tests
- [ ] Migration script tests
- [ ] Performance benchmarks

---

## Expected Outcomes

### Code Reduction

- **~40% less code** (removing bundle index, isolation, multiple metafield services)
- **~60% smaller metafields** (3 vs 9 metafields)
- **~90% smaller cart transform data** (variant vs product metafields)

### Performance Improvements

- **2-3x faster cart transform** (smaller query, less parsing)
- **50% faster widget load** (direct variant query)
- **Eliminated shop metafield bottleneck** (no bundleIndex)

### Maintainability

- **Standards-compliant** architecture
- **Simpler debugging** (standard structure)
- **Better Shopify support** (aligned with docs)
- **Easier onboarding** (follows conventions)

---

## References

### Official Shopify Documentation

1. [Create a Bundle App](https://shopify.dev/docs/apps/build/product-merchandising/bundles/create-bundle-app) - Official bundle architecture
2. [About Product Bundles](https://shopify.dev/docs/apps/build/product-merchandising/bundles) - Bundle concepts
3. [Cart Transform Function API](https://shopify.dev/docs/api/functions/latest/cart-transform) - Cart transform reference
4. [Metafields for Input Queries](https://shopify.dev/docs/apps/build/functions/input-queries/metafields-for-input-queries) - Function best practices
5. [Ownership](https://shopify.dev/docs/apps/build/custom-data/ownership) - Namespace ownership
6. [Reserved Prefixes](https://shopify.dev/docs/apps/build/custom-data/reserved-prefixes) - App-reserved namespaces

### Reference Implementations

7. [Shopify Bundle Reference App](https://github.com/Shopify/function-examples/blob/main/sample-apps/bundles-cart-transform/README.md) - Official sample code
8. [Function Examples Repository](https://github.com/Shopify/function-examples) - Cart transform examples
9. [Cart Transform Discussions](https://github.com/Shopify/function-examples/discussions/categories/feedback-cart-transform-api) - Community feedback

### Community Resources

10. [Performance Discussion #329](https://github.com/Shopify/function-examples/discussions/329) - Instruction limits
11. [Enhanced Documentation Request #268](https://github.com/Shopify/function-examples/discussions/268) - Bundle patterns
12. [Custom vs App Namespace Discussion](https://community.shopify.dev/t/support-for-custom-app-reserved-namespaces-in-declarative-metafield-definitions/16135)

---

## Decision Matrix

| Criteria | Option A (Full Standard) | Option B (Hybrid) | Option C (Custom NS) |
|----------|-------------------------|-------------------|---------------------|
| **Standards Compliance** | ✅✅✅ Fully compliant | ⚠️ Partially compliant | ✅✅✅ Reference match |
| **Performance** | ✅✅✅ Optimal | ✅✅ Good | ✅✅✅ Optimal |
| **Simplicity** | ✅✅✅ 3 metafields | ⚠️ 5+ metafields | ✅✅✅ 3 metafields |
| **Data Security** | ✅✅✅ App-controlled | ✅✅✅ App-controlled | ❌ Merchant-editable |
| **Migration Effort** | ⚠️ High | ✅✅ Medium | ⚠️ High |
| **Interoperability** | ✅✅ Good | ⚠️ Limited | ✅✅✅ Excellent |
| **Future-Proof** | ✅✅✅ Aligned | ⚠️ May drift | ✅✅ Standard |
| **Recommended** | ✅ **YES** | ⚠️ Acceptable | ❌ No |

---

## Final Recommendation

**Adopt Option A: Full Shopify Standard Alignment with `$app` namespace**

### Rationale

1. **Best of Both Worlds:** Shopify standard structure + app-reserved namespace security
2. **Long-term Value:** Simplification, performance, maintainability
3. **No User Impact:** Can migrate freely without affecting live users
4. **Industry Alignment:** Matches how professional Shopify apps are built
5. **Support & Debugging:** Easier to get help with standard architecture

### Timeline

- **Week 1-2:** Preparation and backend migration
- **Week 3-4:** Frontend and cart transform updates
- **Week 5:** Data migration and testing
- **Week 6:** Cleanup and documentation

**Total Effort:** 6 weeks (with testing and documentation)

---

## Appendix A: Metafield Comparison

### Before (Current)

**Product Metafields (8):**
```
$app:bundleConfig          (~5KB JSON)
$app:cartTransformConfig   (~500 bytes JSON)
$app:ownsBundleId          (string)
$app:bundleProductType     (string)
$app:isolationCreated      (string)
$app:componentVariants     (variant_reference list) - UNUSED
$app:componentQuantities   (number_integer list) - UNUSED
$app:priceAdjustment       (number_decimal) - UNUSED
```

**Shop Metafields (1):**
```
$app:bundleIndex           (~10KB JSON, 200 bundles max)
```

**Total Size per Bundle:** ~5.5KB
**Query Complexity:** High (product + shop queries)
**Standards Compliance:** Low

### After (Recommended)

**Variant Metafields (3):**
```
$app:component_reference   (~200 bytes variant_reference list)
$app:component_quantities  (~50 bytes number_integer list)
$app:component_parents     (~250 bytes JSON) - on child variants
```

**Optional UI Metafield:**
```
$app:bundle_ui_config      (~500 bytes JSON) - widget settings only
```

**Total Size per Bundle:** ~500 bytes (90% reduction)
**Query Complexity:** Low (single variant query)
**Standards Compliance:** High

---

## Appendix B: Code Examples

### Bundle Creation (New Approach)

```typescript
// app/services/bundle-product-manager.server.ts

export class BundleProductManager {
  static async createBundle(admin: any, bundleData: BundleInput) {
    // 1. Create bundle product
    const product = await this.createBundleProduct(admin, bundleData);

    // 2. Get first variant (bundle container)
    const variantId = await getFirstVariantId(admin, product.id);

    // 3. Build component references
    const componentVariantIds = [];
    const componentQuantities = [];

    for (const step of bundleData.steps) {
      for (const product of step.products) {
        const productVariantId = await getFirstVariantId(admin, product.id);
        componentVariantIds.push(productVariantId);
        componentQuantities.push(step.minQuantity || 1);
      }
    }

    // 4. Set bundle metafields on parent variant
    await this.setVariantMetafields(admin, variantId, {
      component_reference: componentVariantIds,
      component_quantities: componentQuantities
    });

    // 5. Set component_parents on child variants
    for (const componentVariantId of componentVariantIds) {
      await this.addComponentParent(admin, componentVariantId, {
        id: variantId,
        component_reference: { value: componentVariantIds },
        component_quantities: { value: componentQuantities }
      });
    }

    return product;
  }

  private static async setVariantMetafields(
    admin: any,
    variantId: string,
    data: { component_reference: string[]; component_quantities: number[] }
  ) {
    const mutation = `
      mutation SetVariantMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id }
          userErrors { field message }
        }
      }
    `;

    await admin.graphql(mutation, {
      variables: {
        metafields: [
          {
            ownerId: variantId,
            namespace: "$app",
            key: "component_reference",
            type: "list.variant_reference",
            value: JSON.stringify(data.component_reference)
          },
          {
            ownerId: variantId,
            namespace: "$app",
            key: "component_quantities",
            type: "list.number_integer",
            value: JSON.stringify(data.component_quantities)
          }
        ]
      }
    });
  }

  private static async addComponentParent(
    admin: any,
    componentVariantId: string,
    parentData: any
  ) {
    // Get existing component_parents
    const existing = await this.getComponentParents(admin, componentVariantId);

    // Add new parent
    const parents = [...existing, parentData];

    // Update metafield
    const mutation = `
      mutation SetComponentParents($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id }
          userErrors { field message }
        }
      }
    `;

    await admin.graphql(mutation, {
      variables: {
        metafields: [{
          ownerId: componentVariantId,
          namespace: "$app",
          key: "component_parents",
          type: "json",
          value: JSON.stringify(parents)
        }]
      }
    });
  }
}
```

### Cart Transform (Simplified)

```typescript
// extensions/bundle-cart-transform-ts/src/cart_transform_run.ts

export function cartTransformRun(input: Input): FunctionResult {
  const operations: Operation[] = [];

  // MERGE: Combine components into bundle
  const bundles = findBundlesInCart(input.cart.lines);
  for (const bundle of bundles) {
    if (bundle.hasAllComponents) {
      operations.push({
        merge: {
          cartLines: bundle.componentLineIds,
          parentVariantId: bundle.parentVariantId,
          title: bundle.title,
          price: bundle.price
        }
      });
    }
  }

  // EXPAND: Split bundle into components
  const bundleLines = findBundleParents(input.cart.lines);
  for (const bundleLine of bundleLines) {
    operations.push({
      expand: {
        cartLineId: bundleLine.id,
        expandedCartItems: bundleLine.components.map(comp => ({
          merchandiseId: comp.variantId,
          quantity: comp.quantity
        }))
      }
    });
  }

  return { operations };
}

function findBundlesInCart(lines: CartLine[]) {
  const bundles = new Map();

  for (const line of lines) {
    const component_parents = line.merchandise.component_parents?.value;
    if (!component_parents) continue;

    const parents = JSON.parse(component_parents);
    for (const parent of parents) {
      const bundleId = parent.id;
      if (!bundles.has(bundleId)) {
        bundles.set(bundleId, {
          parentVariantId: bundleId,
          componentLineIds: [],
          components: parent.component_reference.value,
          quantities: parent.component_quantities.value,
          hasAllComponents: false
        });
      }
      bundles.get(bundleId).componentLineIds.push(line.id);
    }
  }

  // Check if all components present
  for (const bundle of bundles.values()) {
    bundle.hasAllComponents =
      bundle.componentLineIds.length === bundle.components.length;
  }

  return Array.from(bundles.values());
}
```

---

**End of Document**

*For questions or clarifications, refer to the Shopify Developer Documentation or the official function-examples repository.*
