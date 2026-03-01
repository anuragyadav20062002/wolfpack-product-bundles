# Architecture #3: Hybrid Approach - Complete Implementation Plan
## With Stale Product Data Handling

---

## Table of Contents
1. [Validation](#validation)
2. [Architecture Overview](#architecture-overview)
3. [Stale Data Problem & Solution](#stale-data-problem--solution)
4. [Variable Name Mapping](#variable-name-mapping)
5. [Implementation Steps](#implementation-steps)
6. [Testing Plan](#testing-plan)
7. [Success Criteria](#success-criteria)

---

## Validation

### Why Hybrid + Webhook Sync is Best

**Current Issues**:
1. ❌ Shop metafield >100KB with 7+ bundles
2. ❌ Cart transform reads null (exceeds 10KB limit)
3. ❌ Widget queries Storefront API for fresh product data (titles, prices, images)
4. ❌ If product data stored in metafields, becomes stale when merchant updates products

**Research Findings**:
- Shopify metafield limit: 2M characters storage, but **10KB limit for cart transform queries**
- `products/update` webhook fires on title, price, inventory changes
- Webhooks **don't include metafield data** - must query separately
- Best practice: Store minimal data in metafields, query fresh data when needed
- Competitor apps (Kaching): Use per-product metafields + dynamic queries

**Hybrid + Webhook Solution**:
1. ✅ Cart transform config on products (~500 bytes, never stale)
2. ✅ Widget queries Storefront API for fresh data (current approach)
3. ✅ Webhooks sync component products when updated
4. ✅ Bundle index for discovery (~50 bytes per bundle)

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                         BUNDLE PRODUCT                              │
├────────────────────────────────────────────────────────────────────┤
│  $app:bundle_config (3-5KB)                                        │
│  ├─ Full widget config (steps, collections, messages, etc.)        │
│  ├─ Product IDs only (not full product data)                       │
│  └─ Used by: Widget for structure                                  │
│                                                                     │
│  $app:cart_transform_config (500 bytes)                            │
│  ├─ Minimal: id, parentVariantId, name, pricing rules              │
│  ├─ No product data (never stale)                                  │
│  └─ Used by: Cart Transform Function                               │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                         COMPONENT PRODUCTS                          │
├────────────────────────────────────────────────────────────────────┤
│  $app:component_parents (JSON array)                               │
│  ├─ List of bundle IDs this product belongs to                     │
│  ├─ Updated via product webhook when component changes             │
│  └─ Used for: Reverse lookup, cleanup                              │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                            SHOP OBJECT                              │
├────────────────────────────────────────────────────────────────────┤
│  custom:bundle_index (5KB for 100 bundles)                         │
│  ├─ Minimal: [{id, productId, status}]                             │
│  ├─ Used by: Widget for discovery                                  │
│  └─ Updated: On bundle create/update/delete                        │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                       STOREFRONT API QUERY                          │
├────────────────────────────────────────────────────────────────────┤
│  Widget calls: /api/storefront-products?ids=...                    │
│  ├─ Returns: Fresh title, price, image, availability               │
│  ├─ Always up-to-date (real-time query)                            │
│  └─ No stale data issues                                           │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                        WEBHOOK HANDLERS                             │
├────────────────────────────────────────────────────────────────────┤
│  products/update webhook                                            │
│  ├─ Triggers: On title, price, variant, inventory changes          │
│  ├─ Action: Verify bundle integrity                                │
│  ├─ Updates: component_parents if needed                           │
│  └─ Logs: Product changes affecting bundles                        │
│                                                                     │
│  products/delete webhook                                            │
│  ├─ Triggers: When product deleted                                 │
│  ├─ Action: Find bundles using this product                        │
│  ├─ Updates: Remove from bundle steps, mark bundle needs review    │
│  └─ Notifies: Merchant via admin notification                      │
└────────────────────────────────────────────────────────────────────┘
```

---

## Stale Data Problem & Solution

### The Problem

**Scenario**: Merchant adds "Summer T-Shirt" to bundle
1. Widget stores product ID in bundle config
2. Merchant later renames to "Beach T-Shirt" and updates price
3. Bundle config still references old product ID (✅ good)
4. **BUT** if we cached title/price in metafield → STALE ❌

### Current Approach (Best Practice ✅)

Your app **already handles this correctly**:
1. Bundle config stores **product IDs only**, not full data
2. Widget queries Storefront API dynamically for fresh product data
3. No caching of product titles, prices, images in metafields
4. Always displays current product information

**File**: `api.storefront-products.tsx` (lines 32-61)
- Queries Storefront API in real-time
- Gets: title, price, image, availableForSale
- Always fresh, never stale

### Enhanced Solution with Webhooks

Add webhook handlers for:
1. **Product Updates**: Verify bundle integrity when products change
2. **Product Deletions**: Remove deleted products from bundles
3. **Variant Changes**: Handle variant additions/removals

**Benefits**:
- Proactive monitoring of product changes
- Automatic cleanup when products deleted
- Merchant notifications for bundle issues
- maintains data integrity

---

## Variable Name Mapping

### Critical Variables (Consistency Check)

#### 1. Bundle ID
```typescript
// Database
bundle.id                           // "cmhhrtnjp0000v7zc022iqe2z"

// Widget Attribute
'_bundle_id'                        // "cmhhrtnjp0000v7zc022iqe2z_1643775239"

// Cart Transform
bundleInstanceId                    // "cmhhrtnjp0000v7zc022iqe2z_1643775239"
baseBundleId                        // "cmhhrtnjp0000v7zc022iqe2z" (normalized)

// Metafields
config.id                           // "cmhhrtnjp0000v7zc022iqe2z"
```

#### 2. Parent Variant ID
```typescript
// Metafield Key (NEW - consistent)
parentVariantId                     // "gid://shopify/ProductVariant/123"

// Cart Transform (maps from above)
bundleConfig.bundleParentVariantId  // "gid://shopify/ProductVariant/123"

// Merge Operation
parentVariantId                     // "gid://shopify/ProductVariant/123"
```

#### 3. Metafield Namespaces
```typescript
// Widget Config (existing)
namespace: "$app"
key: "bundle_config"

// Cart Transform Config (NEW)
namespace: "$app"
key: "cart_transform_config"

// Component Parents (existing)
namespace: "$app"
key: "component_parents"

// Shop Index (NEW)
namespace: "custom"
key: "bundle_index"
```

---

## Implementation Steps

### Phase 1: Create Cart Transform Config Service

**File**: `app/services/bundles/cart-transform-metafield.server.ts` (NEW)

```typescript
/**
 * Cart Transform Metafield Service
 * Manages lightweight cart transform config on bundle products
 */

import { safeJsonParse } from "./metafield-sync.server";

export interface CartTransformConfig {
  id: string;
  parentVariantId: string;  // Changed from bundleParentVariantId for consistency
  name: string;
  pricing: {
    enabled: boolean;
    method: 'percentage_off' | 'fixed_amount_off' | 'fixed_bundle_price';
    rules: Array<{
      condition: {
        type: 'quantity' | 'amount';
        operator: 'gte' | 'lte' | 'eq';
        value: number;
      };
      discount: {
        method: 'percentage_off' | 'fixed_amount_off' | 'fixed_bundle_price';
        value: number;
      };
    }>;
  };
}

export async function updateCartTransformConfigMetafield(
  admin: any,
  bundleProductId: string,
  config: CartTransformConfig
): Promise<void> {
  const configJson = JSON.stringify(config);
  const sizeBytes = new Blob([configJson]).size;

  console.log(`📊 [CART_TRANSFORM_CONFIG] Bundle: ${config.id}, Size: ${sizeBytes} bytes`);

  if (sizeBytes > 2000) {
    throw new Error(`Cart transform config too large: ${sizeBytes} bytes`);
  }

  const SET_METAFIELD = `
    mutation SetCartTransformConfig($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id namespace key value }
        userErrors { field message code }
      }
    }
  `;

  const response = await admin.graphql(SET_METAFIELD, {
    variables: {
      metafields: [{
        ownerId: bundleProductId,
        namespace: "$app",
        key: "cart_transform_config",
        type: "json",
        value: configJson
      }]
    }
  });

  const data = await response.json();

  if (data.data?.metafieldsSet?.userErrors?.length > 0) {
    const error = data.data.metafieldsSet.userErrors[0];
    console.error("❌ [CART_TRANSFORM_CONFIG] Error:", error);
    throw new Error(`Failed to set cart transform config: ${error.message}`);
  }

  console.log("✅ [CART_TRANSFORM_CONFIG] Metafield created successfully");
}

export async function deleteCartTransformConfigMetafield(
  admin: any,
  bundleProductId: string
): Promise<void> {
  const GET_METAFIELD = `
    query GetCartTransformConfig($ownerId: ID!) {
      product(id: $ownerId) {
        metafield(namespace: "$app", key: "cart_transform_config") {
          id
        }
      }
    }
  `;

  const getResponse = await admin.graphql(GET_METAFIELD, {
    variables: { ownerId: bundleProductId }
  });

  const getData = await getResponse.json();
  const metafieldId = getData.data?.product?.metafield?.id;

  if (!metafieldId) {
    console.log("ℹ️ [CART_TRANSFORM_CONFIG] No metafield to delete");
    return;
  }

  const DELETE_METAFIELD = `
    mutation DeleteMetafield($input: MetafieldDeleteInput!) {
      metafieldDelete(input: $input) {
        deletedId
        userErrors { field message }
      }
    }
  `;

  const deleteResponse = await admin.graphql(DELETE_METAFIELD, {
    variables: { input: { id: metafieldId } }
  });

  const deleteData = await deleteResponse.json();

  if (deleteData.data?.metafieldDelete?.userErrors?.length > 0) {
    console.error("❌ [CART_TRANSFORM_CONFIG] Delete error:", deleteData.data.metafieldDelete.userErrors);
    throw new Error("Failed to delete cart transform config metafield");
  }

  console.log("✅ [CART_TRANSFORM_CONFIG] Metafield deleted successfully");
}

export function buildCartTransformConfig(
  bundleId: string,
  bundleName: string,
  parentVariantId: string,
  pricing: any
): CartTransformConfig {
  return {
    id: bundleId,
    parentVariantId: parentVariantId,  // Consistent naming
    name: bundleName,
    pricing: {
      enabled: pricing?.enabled || false,
      method: pricing?.method || 'percentage_off',
      rules: (safeJsonParse(pricing?.rules, []) as any[]).map(rule => ({
        condition: {
          type: rule.condition?.type || 'quantity',
          operator: rule.condition?.operator || 'gte',
          value: parseInt(rule.condition?.value) || 0
        },
        discount: {
          method: rule.discount?.method || pricing?.method || 'percentage_off',
          value: parseFloat(rule.discount?.value) || 0
        }
      }))
    }
  };
}
```

---

### Phase 2: Create Bundle Index Service

**File**: `app/services/bundles/bundle-index.server.ts` (NEW)

```typescript
/**
 * Bundle Index Service
 * Manages lightweight shop-level bundle index for discovery
 */

import db from "../../db.server";

export interface BundleIndexEntry {
  id: string;
  productId: string;
  status: 'active' | 'draft';
}

export interface BundleIndex {
  bundles: BundleIndexEntry[];
  updatedAt: string;
}

export async function updateBundleIndex(
  admin: any,
  shopId: string
): Promise<void> {
  console.log("🔄 [BUNDLE_INDEX] Starting update for shop:", shopId);

  try {
    const GET_SHOP_ID = `query { shop { id } }`;

    const shopResponse = await admin.graphql(GET_SHOP_ID);
    const shopData = await shopResponse.json();
    const shopGlobalId = shopData.data?.shop?.id;

    if (!shopGlobalId) {
      throw new Error('Failed to get shop global ID');
    }

    const bundles = await db.bundle.findMany({
      where: {
        shopId: shopId,
        bundleType: 'cart_transform',
        shopifyProductId: { not: null }
      },
      select: {
        id: true,
        shopifyProductId: true,
        status: true
      }
    });

    console.log(`📦 [BUNDLE_INDEX] Found ${bundles.length} bundles`);

    const index: BundleIndex = {
      bundles: bundles.map(bundle => ({
        id: bundle.id,
        productId: bundle.shopifyProductId!,
        status: bundle.status as 'active' | 'draft'
      })),
      updatedAt: new Date().toISOString()
    };

    const indexJson = JSON.stringify(index);
    const sizeBytes = new Blob([indexJson]).size;

    console.log(`📏 [BUNDLE_INDEX] Size: ${sizeBytes} bytes (${bundles.length} bundles)`);

    if (sizeBytes > 10000) {
      throw new Error(`Bundle index too large: ${sizeBytes} bytes > 10KB limit`);
    }

    const SET_METAFIELD = `
      mutation SetBundleIndex($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id namespace key value }
          userErrors { field message code }
        }
      }
    `;

    const response = await admin.graphql(SET_METAFIELD, {
      variables: {
        metafields: [{
          ownerId: shopGlobalId,
          namespace: "custom",
          key: "bundle_index",
          type: "json",
          value: indexJson
        }]
      }
    });

    const data = await response.json();

    if (data.data?.metafieldsSet?.userErrors?.length > 0) {
      const error = data.data.metafieldsSet.userErrors[0];
      console.error("❌ [BUNDLE_INDEX] Error:", error);
      throw new Error(`Failed to set bundle index: ${error.message}`);
    }

    console.log(`✅ [BUNDLE_INDEX] Index updated: ${bundles.length} bundles indexed`);

  } catch (error) {
    console.error("❌ [BUNDLE_INDEX] Error:", error);
    throw error;
  }
}

export async function deleteBundleIndex(admin: any): Promise<void> {
  const GET_METAFIELD = `
    query {
      shop {
        id
        metafield(namespace: "custom", key: "bundle_index") {
          id
        }
      }
    }
  `;

  const getResponse = await admin.graphql(GET_METAFIELD);
  const getData = await getResponse.json();
  const metafieldId = getData.data?.shop?.metafield?.id;

  if (!metafieldId) {
    console.log("ℹ️ [BUNDLE_INDEX] No index to delete");
    return;
  }

  const DELETE_METAFIELD = `
    mutation DeleteMetafield($input: MetafieldDeleteInput!) {
      metafieldDelete(input: $input) {
        deletedId
        userErrors { field message }
      }
    }
  `;

  const deleteResponse = await admin.graphql(DELETE_METAFIELD, {
    variables: { input: { id: metafieldId } }
  });

  const deleteData = await deleteResponse.json();

  if (deleteData.data?.metafieldDelete?.userErrors?.length > 0) {
    console.error("❌ [BUNDLE_INDEX] Delete error:", deleteData.data.metafieldDelete.userErrors);
    throw new Error("Failed to delete bundle index");
  }

  console.log("✅ [BUNDLE_INDEX] Index deleted successfully");
}
```

---

### Phase 3: Create Webhook Handler for Product Updates

**File**: `app/routes/webhooks.products.update.tsx` (NEW)

```typescript
import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

/**
 * Product Update Webhook Handler
 *
 * Triggers when:
 * - Product title changed
 * - Product price changed
 * - Variant added/removed
 * - Inventory updated
 * - Product availability changed
 *
 * Purpose:
 * - Verify bundles using this product are still valid
 * - Log changes affecting bundles
 * - Optionally notify merchant if bundle needs review
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, webhook, payload } = await authenticate.webhook(request);

  if (!payload || !payload.id) {
    console.error("[PRODUCT_WEBHOOK] Invalid payload");
    return json({ success: false }, { status: 400 });
  }

  const productId = `gid://shopify/Product/${payload.id}`;

  console.log(`📢 [PRODUCT_WEBHOOK] Product updated: ${productId}`);
  console.log(`📄 [PRODUCT_WEBHOOK] Title: ${payload.title}`);
  console.log(`💰 [PRODUCT_WEBHOOK] Variants: ${payload.variants?.length || 0}`);

  try {
    // Find bundles using this product as component
    const stepsWithProduct = await db.stepProduct.findMany({
      where: {
        productId: productId
      },
      include: {
        step: {
          include: {
            bundle: {
              select: {
                id: true,
                name: true,
                shopId: true,
                shopifyProductId: true
              }
            }
          }
        }
      }
    });

    if (stepsWithProduct.length === 0) {
      console.log(`ℹ️ [PRODUCT_WEBHOOK] Product not used in any bundles`);
      return json({ success: true, bundlesAffected: 0 });
    }

    const affectedBundles = stepsWithProduct.map(sp => sp.step.bundle);
    const uniqueBundles = Array.from(new Map(affectedBundles.map(b => [b.id, b])).values());

    console.log(`🎯 [PRODUCT_WEBHOOK] Product used in ${uniqueBundles.length} bundles:`);
    uniqueBundles.forEach(bundle => {
      console.log(`   - ${bundle.name} (${bundle.id})`);
    });

    // Check for critical changes
    const criticalChanges: string[] = [];

    // Check if product became unavailable
    if (payload.status === 'draft' || payload.status === 'archived') {
      criticalChanges.push(`Product status changed to ${payload.status}`);
    }

    // Check if all variants became unavailable
    const availableVariants = payload.variants?.filter((v: any) =>
      v.available !== false && v.inventory_policy !== 'deny'
    );

    if (availableVariants?.length === 0 && payload.variants?.length > 0) {
      criticalChanges.push('No variants available for purchase');
    }

    // Check for significant price changes (>50% increase/decrease)
    // Note: We query Storefront API for fresh prices, so this is just logging
    const priceChanges = payload.variants?.filter((v: any) => {
      const oldPrice = v.old_inventory_quantity;  // This is not the actual field, need to track separately
      return false;  // Skip price change detection for now (Storefront API handles it)
    });

    if (criticalChanges.length > 0) {
      console.warn(`⚠️ [PRODUCT_WEBHOOK] Critical changes detected:`);
      criticalChanges.forEach(change => console.warn(`   - ${change}`));

      // TODO: Create admin notification or email for merchant
      // Consider adding a "needs_review" flag to bundles
    }

    // Update component_parents metafield if needed
    // (This ensures reverse lookup is up-to-date)
    // This is optional - component_parents is mainly for cleanup

    return json({
      success: true,
      bundlesAffected: uniqueBundles.length,
      criticalChanges: criticalChanges.length
    });

  } catch (error) {
    console.error("[PRODUCT_WEBHOOK] Error processing webhook:", error);
    return json({ success: false, error: String(error) }, { status: 500 });
  }
};
```

---

### Phase 4: Create Webhook Handler for Product Deletions

**File**: `app/routes/webhooks.products.delete.tsx` (NEW)

```typescript
import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { updateBundleIndex } from "../services/bundles/bundle-index.server";

/**
 * Product Deletion Webhook Handler
 *
 * Triggers when: Product is deleted from store
 *
 * Actions:
 * - Remove product from bundle steps
 * - Update bundle metafields
 * - Mark bundles for merchant review
 * - Update bundle index
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, webhook, payload, admin } = await authenticate.webhook(request);

  if (!payload || !payload.id) {
    console.error("[PRODUCT_DELETE_WEBHOOK] Invalid payload");
    return json({ success: false }, { status: 400 });
  }

  const productId = `gid://shopify/Product/${payload.id}`;

  console.log(`🗑️ [PRODUCT_DELETE_WEBHOOK] Product deleted: ${productId}`);
  console.log(`📄 [PRODUCT_DELETE_WEBHOOK] Title: ${payload.title}`);

  try {
    // Find and delete StepProduct entries using this product
    const deletedStepProducts = await db.stepProduct.deleteMany({
      where: {
        productId: productId
      }
    });

    if (deletedStepProducts.count === 0) {
      console.log(`ℹ️ [PRODUCT_DELETE_WEBHOOK] Product not used in any bundles`);
      return json({ success: true, bundlesAffected: 0 });
    }

    console.log(`🗑️ [PRODUCT_DELETE_WEBHOOK] Deleted ${deletedStepProducts.count} StepProduct entries`);

    // Find affected bundles
    const affectedBundles = await db.bundle.findMany({
      where: {
        shopId: shop,
        steps: {
          some: {
            StepProduct: {
              none: {}  // Steps that now have no products
            }
          }
        }
      },
      include: {
        steps: true
      }
    });

    console.log(`⚠️ [PRODUCT_DELETE_WEBHOOK] ${affectedBundles.length} bundles affected`);

    // Optionally: Mark bundles as needing review or draft
    for (const bundle of affectedBundles) {
      const emptySteps = bundle.steps.filter(step => step.StepProduct.length === 0);

      if (emptySteps.length > 0) {
        console.warn(`⚠️ [PRODUCT_DELETE_WEBHOOK] Bundle "${bundle.name}" has ${emptySteps.length} empty steps`);

        // Consider marking bundle as draft or needs_review
        // await db.bundle.update({
        //   where: { id: bundle.id },
        //   data: { status: 'draft', needsReview: true }
        // });
      }
    }

    // Update bundle index (if bundle products still exist)
    if (admin) {
      try {
        await updateBundleIndex(admin, shop);
        console.log(`✅ [PRODUCT_DELETE_WEBHOOK] Bundle index updated`);
      } catch (error) {
        console.error(`⚠️ [PRODUCT_DELETE_WEBHOOK] Failed to update index:`, error);
      }
    }

    // TODO: Send notification to merchant about affected bundles

    return json({
      success: true,
      bundlesAffected: affectedBundles.length,
      stepProductsDeleted: deletedStepProducts.count
    });

  } catch (error) {
    console.error("[PRODUCT_DELETE_WEBHOOK] Error processing webhook:", error);
    return json({ success: false, error: String(error) }, { status: 500 });
  }
};
```

---

### Phase 5: Register Webhooks in App Configuration

**File**: `app/shopify.server.ts`

**Add webhook configurations**:

```typescript
import { DeliveryMethod } from "@shopify/shopify-api";

const shopify = shopifyApp({
  // ... existing config ...

  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/app-uninstalled",
      callback: async (topic, shop, body, webhookId) => {
        // Existing uninstall handler
      }
    },
    // NEW: Product update webhook
    PRODUCTS_UPDATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/products/update",
      callback: async (topic, shop, body, webhookId) => {
        console.log(`[WEBHOOK] products/update received for shop: ${shop}`);
      }
    },
    // NEW: Product delete webhook
    PRODUCTS_DELETE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/products/delete",
      callback: async (topic, shop, body, webhookId) => {
        console.log(`[WEBHOOK] products/delete received for shop: ${shop}`);
      }
    }
  },

  // ... rest of config ...
});
```

---

### Phase 6: Update Bundle Save Flow

**File**: `app/routes/app.bundles.cart-transform.configure.$bundleId.tsx`

**Replace lines 546-713 with**:

```typescript
if (updatedBundle.shopifyProductId) {
  const bundleParentVariantId = await getBundleProductVariantId(
    admin,
    updatedBundle.shopifyProductId
  );

  AppLogger.debug(`🔍 [BUNDLE_CONFIG] Bundle parent variant ID: ${bundleParentVariantId}`);

  // 1. Create/update WIDGET configuration (existing, unchanged)
  const fullWidgetConfig = {
    // ... existing full config ...
  };

  try {
    AppLogger.debug("🔧 [WIDGET_CONFIG] Creating $app:bundle_config");
    await BundleIsolationService.updateBundleProductMetafield(
      admin,
      updatedBundle.shopifyProductId,
      fullWidgetConfig
    );
    AppLogger.debug("✅ [WIDGET_CONFIG] Widget config created");
  } catch (error) {
    AppLogger.error("❌ [WIDGET_CONFIG] Failed:", {}, error as any);
    throw error;
  }

  // 2. Create/update CART TRANSFORM configuration (NEW, minimal)
  try {
    AppLogger.debug("🔧 [CART_TRANSFORM_CONFIG] Creating $app:cart_transform_config");

    const cartTransformConfig = buildCartTransformConfig(
      updatedBundle.id,
      updatedBundle.name,
      bundleParentVariantId,
      updatedBundle.pricing
    );

    await updateCartTransformConfigMetafield(
      admin,
      updatedBundle.shopifyProductId,
      cartTransformConfig
    );

    AppLogger.debug("✅ [CART_TRANSFORM_CONFIG] Created successfully");
  } catch (error) {
    AppLogger.error("❌ [CART_TRANSFORM_CONFIG] Failed:", {}, error as any);
    throw error;
  }

  // 3. Update component products (existing, unchanged)
  try {
    AppLogger.debug("🔧 [COMPONENT_METAFIELD] Updating components");
    const fullBundleConfig = {
      ...fullWidgetConfig,
      steps: updatedBundle.steps
    };
    await updateComponentProductMetafields(
      admin,
      updatedBundle.shopifyProductId,
      fullBundleConfig
    );
    AppLogger.debug("✅ [COMPONENT_METAFIELD] Updated");
  } catch (error) {
    AppLogger.error("❌ [COMPONENT_METAFIELD] Failed:", {}, error as any);
  }
}

// 4. Update shop-level bundle index (NEW, replaces old metafield)
try {
  AppLogger.debug("🔄 [BUNDLE_INDEX] Updating shop bundle index");
  await updateBundleIndex(admin, session.shop);
  AppLogger.debug("✅ [BUNDLE_INDEX] Updated successfully");
} catch (error) {
  AppLogger.error("❌ [BUNDLE_INDEX] Failed:", {}, error as any);
}

// REMOVE these lines (old approach):
// await updateCartTransformMetafield(admin, session.shop);  // DELETE
// await updateShopBundlesMetafield(admin, session.shop);    // DELETE
```

---

### Phase 7: Update Cart Transform GraphQL Query

**File**: `extensions/bundle-cart-transform-ts/src/cart-transform-input.graphql`

**Replace entire file**:

```graphql
query Input {
  cart {
    lines {
      id
      quantity
      bundleId: attribute(key: "_bundle_id") {
        value
      }
      merchandise {
        __typename
        ... on ProductVariant {
          id
          product {
            id
            # NEW: Read cart transform config from product
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
        amountPerQuantity {
          amount
        }
        totalAmount {
          amount
        }
      }
    }
  }
}
```

**Removed**:
- `shop.all_bundles` (no longer exists)
- `product.bundle_config` (widget data only)

---

### Phase 8: Update Cart Transform Function Logic

**File**: `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts`

**Replace lines 587-608**:

```typescript
// NEW: Load configs from product metafields
Logger.info('Configuration loading started', { phase: 'config-loading' });

const bundleConfigs: Record<string, any> = {};
let configsLoadedCount = 0;

for (const line of bundleLines) {
  const configValue = line.merchandise?.product?.cartTransformConfig?.value;

  if (configValue) {
    try {
      const config = JSON.parse(configValue);

      if (!config.id || !config.parentVariantId) {
        Logger.warn('Invalid config structure', { phase: 'config-loading' }, {
          lineId: line.id,
          hasId: !!config.id,
          hasParentVariantId: !!config.parentVariantId
        });
        continue;
      }

      // Map to expected field name
      bundleConfigs[config.id] = {
        ...config,
        bundleParentVariantId: config.parentVariantId  // Map for compatibility
      };

      configsLoadedCount++;

      Logger.debug('Config loaded', { phase: 'config-loading' }, {
        bundleId: config.id,
        productId: line.merchandise?.product?.id
      });
    } catch (error) {
      Logger.error('Failed to parse config', { phase: 'config-loading' }, { error });
    }
  }
}

Logger.info('Configuration loading completed', { phase: 'config-loading' }, {
  bundleConfigsFound: configsLoadedCount,
  uniqueBundles: Object.keys(bundleConfigs).length
});

if (Object.keys(bundleConfigs).length === 0) {
  Logger.warn('No bundle configurations found', { phase: 'config-loading' });
  return { operations: [] };
}

Logger.debug('Bundle configuration map ready', { phase: 'config-loading' }, {
  availableBundleIds: Object.keys(bundleConfigs)
});

// Rest of function unchanged - already uses bundleConfigs map
```

**Update Type Definition (lines 30-38)**:

```typescript
product?: {
  id: string;
  title: string;
  cartTransformConfig?: {  // NEW
    value: string;
  };
  // REMOVED: bundle_config
};
```

---

### Phase 9: Rebuild Cart Transform

```bash
cd extensions/bundle-cart-transform-ts
npm run build

# Verify build successful
# Check dist/function.wasm created
```

---

### Phase 10: Update Bundle Deletion Handler

**File**: Bundle deletion route

```typescript
import { deleteCartTransformConfigMetafield } from "../services/bundles/cart-transform-metafield.server";
import { updateBundleIndex } from "../services/bundles/bundle-index.server";

// In deletion action
const bundle = await db.bundle.findUnique({
  where: { id: bundleId, shopId: session.shop },
  select: { shopifyProductId: true }
});

if (!bundle) {
  throw new Error("Bundle not found");
}

// Delete from database
await db.bundle.delete({
  where: { id: bundleId, shopId: session.shop }
});

// Clean up metafields
if (bundle.shopifyProductId) {
  try {
    await deleteCartTransformConfigMetafield(admin, bundle.shopifyProductId);
    console.log("✅ Cart transform config deleted");
  } catch (error) {
    console.error("⚠️ Failed to delete config:", error);
  }
}

// Update bundle index
try {
  await updateBundleIndex(admin, session.shop);
  console.log("✅ Bundle index updated");
} catch (error) {
  console.error("⚠️ Failed to update index:", error);
}
```

---

## Testing Plan

### Test 1: Single Bundle with Fresh Data
1. Create bundle with 2 steps, 3 products
2. Save bundle
3. Verify metafields:
   - `$app:bundle_config` (widget)
   - `$app:cart_transform_config` (cart transform)
   - `custom:bundle_index` (shop)
4. Add items to cart
5. Check cart transform logs - verify config loaded
6. Verify discount applied
7. **Change product price in Shopify admin**
8. Reload widget - verify price updated (Storefront API)
9. Cart transform still works (price doesn't affect bundle ID)

### Test 2: Product Title Change
1. Create bundle with "Summer T-Shirt"
2. Widget displays "Summer T-Shirt"
3. Rename product to "Beach T-Shirt" in admin
4. **Webhook fires** - logs bundle affected
5. Reload widget - displays "Beach T-Shirt" (fresh from Storefront API)
6. Cart transform still works (uses product ID, not name)

### Test 3: Product Deletion
1. Create bundle with 3 products
2. Delete one product from Shopify
3. **Webhook fires** - removes from StepProduct
4. **Logs warning** - bundle has incomplete step
5. Bundle index still includes bundle (manual review needed)
6. Widget shows remaining 2 products
7. Cart transform works with remaining products

### Test 4: Multiple Bundles Scale Test
1. Create 20 bundles
2. Verify bundle index < 10KB
3. Each cart transform config < 2KB
4. Add items from 5 different bundles to cart
5. Verify only 5 configs loaded in cart transform
6. All 5 discounts applied correctly

### Test 5: Webhook Integration
1. Create bundle
2. Update component product price
3. Check webhook logs - product/update received
4. Verify bundle logged as affected
5. Reload widget - new price shown
6. Delete component product
7. Check webhook logs - products/delete received
8. Verify StepProduct entry removed

### Test 6: Bundle Deletion Cleanup
1. Create bundle
2. Verify all metafields created
3. Delete bundle
4. Verify cart transform config deleted
5. Verify widget config deleted
6. Verify bundle removed from index
7. Component products still exist (not deleted)

---

## Success Criteria

✅ **Scalability**
- [ ] Support 100+ bundles
- [ ] Cart transform config < 2KB per bundle
- [ ] Bundle index < 10KB for 100 bundles
- [ ] No 10KB limit errors

✅ **Fresh Data**
- [ ] Widget always shows current prices
- [ ] Widget always shows current titles
- [ ] Widget always shows current availability
- [ ] Product changes don't break bundles

✅ **Webhook Integration**
- [ ] Product updates logged with affected bundles
- [ ] Product deletions clean up StepProduct entries
- [ ] Webhooks registered in app config
- [ ] Webhook handlers process correctly

✅ **Functionality**
- [ ] Widget loads correctly
- [ ] Cart transform applies discounts
- [ ] Bundle deletion cleans up
- [ ] No null metafield errors

✅ **Performance**
- [ ] Bundle save < 2 seconds
- [ ] Cart transform < 1 second
- [ ] Storefront API query < 500ms
- [ ] Webhook processing < 1 second

✅ **Code Quality**
- [ ] No duplicate metafield syncs
- [ ] Clean separation of concerns
- [ ] Consistent variable naming
- [ ] Comprehensive logging

---

## Rollout Checklist

**Day 1: Services & Infrastructure**
- [ ] Create `cart-transform-metafield.server.ts`
- [ ] Create `bundle-index.server.ts`
- [ ] Create `webhooks.products.update.tsx`
- [ ] Create `webhooks.products.delete.tsx`
- [ ] Register webhooks in `shopify.server.ts`
- [ ] Add imports to bundle save route

**Day 2: Bundle Save Flow**
- [ ] Update bundle save action
- [ ] Add cart transform config creation
- [ ] Add bundle index update
- [ ] Remove old metafield sync calls
- [ ] Test bundle creation

**Day 3: Cart Transform**
- [ ] Update GraphQL input query
- [ ] Update cart transform function
- [ ] Update type definitions
- [ ] Rebuild extension
- [ ] Test with sample data

**Day 4: Cleanup & Deletion**
- [ ] Update bundle deletion handler
- [ ] Add metafield cleanup
- [ ] Add index update
- [ ] Test deletion flow

**Day 5: Integration Testing**
- [ ] Run all 6 test cases
- [ ] Test webhooks with real product changes
- [ ] Test with 20+ bundles
- [ ] Verify Storefront API freshness
- [ ] Check all logs

**Day 6: Documentation & Monitoring**
- [ ] Document new architecture
- [ ] Add monitoring for metafield sizes
- [ ] Add alerts for webhook failures
- [ ] Update README
- [ ] Create troubleshooting guide

---

## Monitoring & Debugging

### Key Metrics to Track

```typescript
// Log these on every bundle save
console.log(`[METRICS] Cart transform config size: ${size} bytes`);
console.log(`[METRICS] Bundle index size: ${indexSize} bytes`);
console.log(`[METRICS] Total bundles: ${bundleCount}`);
```

### Debug Queries

```graphql
# Check cart transform config
query {
  product(id: "gid://shopify/Product/XXX") {
    metafield(namespace: "$app", key: "cart_transform_config") {
      value
    }
  }
}

# Check bundle index
query {
  shop {
    metafield(namespace: "custom", key: "bundle_index") {
      value
    }
  }
}
```

### Webhook Testing

```bash
# Trigger webhook manually via Shopify CLI
shopify webhook trigger --topic=products/update
shopify webhook trigger --topic=products/delete
```

---

## Conclusion

This implementation provides:

1. **✅ Scalability**: Support 100+ bundles (only 500 bytes per bundle in cart transform)
2. **✅ Fresh Data**: Storefront API ensures current prices/titles/availability
3. **✅ Proactive Monitoring**: Webhooks detect product changes affecting bundles
4. **✅ Clean Architecture**: Separation of widget data vs cart transform data
5. **✅ No Migration**: Development stage - clean implementation
6. **✅ Consistent Naming**: All variables mapped and documented

**Why This is Best**:
- Per-product metafields scale infinitely
- Storefront API eliminates stale data issues
- Webhooks provide proactive bundle integrity monitoring
- Follows Shopify best practices (like Kaching Bundles)
- Minimal cart transform data (10KB limit never exceeded)

Ready to implement! 🚀
