# Metafields Architecture Documentation

**Last Updated:** January 2025
**Version:** 2.0 (Post-optimization)

This document provides comprehensive documentation of all metafields used in the Wolfpack Product Bundles app, including their structure, usage, and common issues.

---

## Table of Contents

1. [Overview](#overview)
2. [Metafield Types and Namespaces](#metafield-types-and-namespaces)
3. [Shop-Level Metafields](#shop-level-metafields)
4. [Product-Level Metafields](#product-level-metafields)
5. [Variant-Level Metafields](#variant-level-metafields)
6. [Data Structures](#data-structures)
7. [Write Operations](#write-operations)
8. [Read Operations](#read-operations)
9. [Validation Rules](#validation-rules)
10. [Common Issues and Solutions](#common-issues-and-solutions)
11. [Cleanup Procedures](#cleanup-procedures)

---

## Overview

The app uses Shopify metafields to store bundle configurations and enable cart transformation. Metafields are stored at different levels (shop, product, variant) depending on their scope and usage.

### Critical Principle
**Most errors in this app are caused by metafields not being used properly.** This includes:
- Missing metafields when expected
- Incorrect JSON structure
- Stale/outdated data
- Wrong namespace/key combinations
- GID format mismatches

---

## Metafield Types and Namespaces

### Active Namespaces (Current Architecture)

| Namespace | Owner Type | Purpose | Status |
|-----------|-----------|---------|--------|
| `$app` | Shop, Product, ProductVariant | Primary app metafields (reserved namespace) | ✅ Active |
| `$app:bundle_isolation` | Product | Bundle isolation tracking metafields | ✅ Active |
| `bundle_discounts` | Product | Legacy cart transform config (being phased out) | ⚠️ Legacy |
| `custom` | Product, ProductVariant | Standard Shopify metafields for cart transform | ⚠️ Legacy |

### Deprecated Namespaces

| Namespace | Owner Type | Reason | Status |
|-----------|-----------|--------|--------|
| `$app:bundle_discount` | Product | Replaced by `$app:bundle_config` | ❌ Deprecated |
| `custom.component_reference` | ProductVariant | Using `$app` namespace instead | ❌ Deprecated |

---

## Shop-Level Metafields

### 1. `$app:all_bundles`

**Purpose:** Global registry of all active bundles in the shop

**Owner:** Shop
**Type:** `json`
**Namespace:** `$app`
**Key:** `all_bundles`

#### Data Structure
```json
[
  {
    "id": "cm5abc123def",
    "name": "Summer Bundle",
    "status": "active",
    "bundleType": "cart_transform",
    "shopifyProductId": "gid://shopify/Product/8375848042692",
    "bundleParentVariantId": "gid://shopify/ProductVariant/45678912345678",
    "steps": [
      {
        "id": "step-uuid-1",
        "name": "Choose Main Product",
        "position": 0,
        "minQuantity": 1,
        "maxQuantity": 1,
        "enabled": true,
        "displayVariantsAsIndividual": false,
        "products": [],
        "collections": [],
        "StepProduct": [
          {
            "productId": "gid://shopify/Product/1234567890",
            "title": "Product A",
            "imageUrl": "https://cdn.shopify.com/...",
            "variants": [...],
            "minQuantity": 1,
            "maxQuantity": 1,
            "position": 0
          }
        ],
        "conditionType": null,
        "conditionOperator": null,
        "conditionValue": null
      }
    ],
    "pricing": {
      "enabled": true,
      "method": "fixed_bundle_price",
      "rules": [
        {
          "id": "rule-uuid-1",
          "condition": "gte",
          "value": 3,
          "fixedBundlePrice": 100
        }
      ],
      "showFooter": true,
      "messages": {
        "showDiscountMessaging": true,
        "discountText": "Add {items_needed} more to get bundle at {discountValue}",
        "successMessage": "Discount Unlocked! Bundle price: {discountValue}"
      }
    },
    "componentProductIds": [
      "gid://shopify/Product/1234567890",
      "gid://shopify/Product/9876543210"
    ]
  }
]
```

#### Write Operations
**File:** `app/services/bundle-isolation.server.ts`
**Function:** `updateBundleProductMetafield()`
**Trigger:** When bundle is created/updated/published

**File:** `app/services/metafield-cleanup.server.ts`
**Function:** `updateShopMetafieldsAfterDeletion()`
**Trigger:** When bundle is deleted

#### Read Operations
**File:** `app/services/metafield-validation.server.ts`
**Function:** `validateAndCleanShopMetafields()`
**Purpose:** Validate shop metafield consistency

**File:** `app/routes/api.bundle-product-manager.tsx`
**Purpose:** Get all bundles for product management operations

#### Validation Rules
1. Must be valid JSON array
2. Each bundle must have: `id`, `name`, `status`, `bundleType`, `shopifyProductId`
3. All referenced bundle IDs must exist in database
4. All referenced product IDs must exist in Shopify
5. No duplicate bundle IDs

#### Common Issues
- **Stale bundle references:** Bundles deleted from DB but still in shop metafield
- **Missing products:** Product IDs that no longer exist in Shopify
- **JSON parse errors:** Invalid JSON structure due to incomplete updates

---

## Product-Level Metafields

### 2. `$app:bundle_config`

**Purpose:** Complete bundle configuration stored on the bundle product itself (Primary source of truth for widget and cart transform)

**Owner:** Product (Bundle Container Product)
**Type:** `json`
**Namespace:** `$app`
**Key:** `bundle_config`

#### Data Structure
```json
{
  "id": "cm5abc123def",
  "name": "Summer Bundle",
  "description": "Get 3 products for ₹100",
  "status": "active",
  "bundleType": "cart_transform",
  "shopifyProductId": "gid://shopify/Product/8375848042692",
  "bundleParentVariantId": "gid://shopify/ProductVariant/45678912345678",
  "steps": [...], // Same structure as shop metafield
  "pricing": {
    "enabled": true,
    "method": "percentage_off|fixed_amount_off|fixed_bundle_price",
    "rules": [
      {
        "id": "rule-uuid",
        "condition": "gte",
        "value": 3,
        "discountValue": "10",        // For percentage_off and fixed_amount_off
        "fixedBundlePrice": 100        // For fixed_bundle_price
      }
    ],
    "showFooter": true,
    "messages": {
      "showDiscountMessaging": true,
      "discountText": "Add {items_needed} more items to unlock {discountValue}% off!",
      "successMessage": "Discount Unlocked! You're saving {discountValue}%"
    }
  },
  "componentProductIds": [
    "gid://shopify/Product/1234567890",
    "gid://shopify/Product/9876543210"
  ]
}
```

#### Critical Fields

**Pricing Rules - Standardized Field Names:**
- `discountValue` (string) - Used for `percentage_off` and `fixed_amount_off` methods
- `fixedBundlePrice` (number) - Used for `fixed_bundle_price` method
- `price` (number) - Alias for `fixedBundlePrice` (maintained for compatibility)
- `value` (number) - Quantity condition threshold
- `condition` (string) - Condition type: `"gte"` (greater than or equal) or `"equals"`

**Field Standardization:**
The `transformPricingRules()` function in `bundle-isolation.server.ts:33-60` ensures consistent field naming:
```typescript
// For fixed_bundle_price: uses 'price' and 'fixedBundlePrice'
transformedRule.price = priceValue;
transformedRule.fixedBundlePrice = priceValue;

// For percentage_off and fixed_amount_off: uses 'discountValue'
transformedRule.discountValue = rule.discountValue || "0";
```

#### Write Operations
**File:** `app/services/bundle-isolation.server.ts`
**Function:** `updateBundleProductMetafield()`
**Trigger:** When bundle is saved/published
**Line:** 11-149

**Process:**
1. Parse bundle configuration from database
2. Transform pricing rules to standardized format
3. Extract component product IDs from steps
4. Set metafield via GraphQL mutation
5. Verify metafield was set successfully

#### Read Operations

**Frontend Widget:**
**File:** `extensions/bundle-builder/blocks/bundle.liquid`
**Line:** 448
**Code:**
```liquid
const productBundleConfig = {{ product.metafields['$app'].bundle_config.value | json }};
```

**Cart Transform Function:**
**File:** `extensions/bundle-cart-transform-ts/src/cart-transform-input.graphql`
**Line:** 27-29
**Code:**
```graphql
bundle_config: metafield(namespace: "$app", key: "bundle_config") {
  value
}
```

**Backend Services:**
**File:** `app/services/bundle-isolation.server.ts`
**Function:** `getBundleConfigFromProduct()`
**Line:** 155-190

#### Validation Rules
1. Must be valid JSON object
2. Required fields: `id`, `name`, `status`, `bundleType`, `shopifyProductId`
3. `bundleParentVariantId` must be valid ProductVariant GID
4. Pricing rules must use standardized field names:
   - `discountValue` for percentage_off/fixed_amount_off
   - `fixedBundlePrice` for fixed_bundle_price
5. All component product IDs must exist in Shopify
6. Steps must have valid `minQuantity` and `maxQuantity`

#### Common Issues
- **Missing bundleParentVariantId:** Cart transform cannot merge without valid variant ID
- **Stale component products:** Products that have been deleted
- **Wrong field names in pricing rules:** Using `price` instead of `fixedBundlePrice`, or vice versa
- **Inconsistent discount methods:** Method doesn't match rule fields

---

### 3. `$app:bundle_isolation:owns_bundle_id`

**Purpose:** Links bundle product to specific bundle ID for isolation

**Owner:** Product (Bundle Container Product)
**Type:** `single_line_text_field`
**Namespace:** `$app:bundle_isolation`
**Key:** `owns_bundle_id`

#### Data Structure
```
"cm5abc123def"
```

#### Write Operations
**File:** `app/services/bundle-isolation.server.ts`
**Function:** `createBundleProductIsolationMetafields()`
**Line:** 196-258

#### Read Operations
**File:** `extensions/bundle-builder/blocks/bundle.liquid`
**Line:** 256, 308
**Purpose:** Identify which bundle this product belongs to

**File:** `app/services/bundle-auto-injection.server.ts`
**Function:** `verifyBundleInjection()`
**Line:** 98-100

#### Validation Rules
1. Must match a valid bundle ID in database
2. Should correspond to bundle stored in `$app:bundle_config`

---

### 4. `$app:bundle_isolation:bundle_product_type`

**Purpose:** Identifies product as a cart transform bundle container

**Owner:** Product (Bundle Container Product)
**Type:** `single_line_text_field`
**Namespace:** `$app:bundle_isolation`
**Key:** `bundle_product_type`

#### Data Structure
```
"cart_transform_bundle"
```

#### Write Operations
**File:** `app/services/bundle-isolation.server.ts`
**Function:** `createBundleProductIsolationMetafields()`
**Line:** 196-258

#### Read Operations
**File:** `extensions/bundle-builder/blocks/bundle.liquid`
**Line:** 254, 307
**Purpose:** Auto-inject widget on bundle product pages

---

### 5. `$app:bundle_isolation:isolation_created`

**Purpose:** Timestamp of when isolation metafields were created

**Owner:** Product (Bundle Container Product)
**Type:** `single_line_text_field`
**Namespace:** `$app:bundle_isolation`
**Key:** `isolation_created`

#### Data Structure
```
"2025-01-19T10:30:00.000Z"
```

#### Write Operations
**File:** `app/services/bundle-isolation.server.ts`
**Function:** `createBundleProductIsolationMetafields()`
**Line:** 196-258

---

### 6. `bundle_discounts:cart_transform_config` (Legacy)

**Purpose:** Legacy cart transform configuration (being phased out)

**Owner:** Product (Component Products)
**Type:** `json`
**Namespace:** `bundle_discounts`
**Key:** `cart_transform_config`

**Status:** ⚠️ Legacy - Use `$app:bundle_config` instead

#### Data Structure
```json
{
  "id": "cm5abc123def",
  "bundleId": "cm5abc123def",
  "name": "Summer Bundle",
  "shopifyProductId": "gid://shopify/Product/8375848042692",
  "bundleParentVariantId": "gid://shopify/ProductVariant/45678912345678",
  "pricing": {...}
}
```

#### Read Operations
**File:** `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts`
**Line:** 150-168
**Purpose:** Cart transform fallback when product-level config not found

#### Migration Path
This metafield is being deprecated. New bundles should only use `$app:bundle_config` on the bundle product itself.

---

## Variant-Level Metafields

### 7. `$app:component_reference` (Legacy)

**Purpose:** References to component products in a bundle (official Shopify standard)

**Owner:** ProductVariant (Bundle Container Variant)
**Type:** `list.product_reference`
**Namespace:** `$app`
**Key:** `component_reference`

**Status:** ⚠️ Legacy - Only used for standard Shopify cart transform metafields approach

#### Data Structure
```json
["gid://shopify/Product/1234567890", "gid://shopify/Product/9876543210"]
```

#### Read Operations
**File:** `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts`
**Function:** `buildExpandOperation()`
**Line:** 869-979

---

### 8. `$app:component_quantities` (Legacy)

**Purpose:** Quantities for each component product

**Owner:** ProductVariant (Bundle Container Variant)
**Type:** `list.number_integer`
**Namespace:** `$app`
**Key:** `component_quantities`

**Status:** ⚠️ Legacy

#### Data Structure
```json
[1, 2, 1]
```

---

### 9. `$app:component_parents` (Legacy)

**Purpose:** References from component products back to bundle parents

**Owner:** ProductVariant (Component Product Variant)
**Type:** `json`
**Namespace:** `$app`
**Key:** `component_parents`

**Status:** ⚠️ Legacy

#### Data Structure
```json
[
  {
    "id": "gid://shopify/ProductVariant/45678912345678",
    "component_reference": {
      "value": ["gid://shopify/Product/123", "gid://shopify/Product/456"]
    },
    "component_quantities": {
      "value": [1, 2]
    }
  }
]
```

---

### 10. `$app:price_adjustment` (Legacy)

**Purpose:** Price adjustment percentage for bundle discount

**Owner:** ProductVariant (Bundle or Component)
**Type:** `number_decimal`
**Namespace:** `$app`
**Key:** `price_adjustment`

**Status:** ⚠️ Legacy

#### Data Structure
```
15.5
```

---

## Data Structures

### Pricing Configuration Structure

#### Discount Methods

**1. percentage_off**
```json
{
  "enabled": true,
  "method": "percentage_off",
  "rules": [
    {
      "id": "rule-uuid",
      "condition": "gte",
      "value": 3,
      "discountValue": "10"  // 10% off
    }
  ]
}
```

**2. fixed_amount_off**
```json
{
  "enabled": true,
  "method": "fixed_amount_off",
  "rules": [
    {
      "id": "rule-uuid",
      "condition": "gte",
      "value": 3,
      "discountValue": "50"  // ₹50 off
    }
  ]
}
```

**3. fixed_bundle_price**
```json
{
  "enabled": true,
  "method": "fixed_bundle_price",
  "rules": [
    {
      "id": "rule-uuid",
      "condition": "gte",
      "value": 3,
      "price": 100,
      "fixedBundlePrice": 100  // Bundle costs ₹100 total
    }
  ]
}
```

### Step Configuration Structure

```json
{
  "id": "step-uuid",
  "name": "Choose Product",
  "position": 0,
  "minQuantity": 1,
  "maxQuantity": 3,
  "enabled": true,
  "displayVariantsAsIndividual": false,
  "products": [],  // Legacy field
  "collections": [],  // Legacy field
  "StepProduct": [
    {
      "productId": "gid://shopify/Product/123",
      "title": "Product Name",
      "imageUrl": "https://cdn.shopify.com/...",
      "variants": [
        {
          "id": "gid://shopify/ProductVariant/456",
          "title": "Small / Red",
          "price": "29.99",
          "availableForSale": true
        }
      ],
      "minQuantity": 1,
      "maxQuantity": 1,
      "position": 0
    }
  ],
  "conditionType": null,
  "conditionOperator": null,
  "conditionValue": null
}
```

---

## Write Operations

### Complete Write Flow for Bundle Creation

1. **User creates/edits bundle in admin UI**
   - File: `app/routes/app.bundles.$bundleId.tsx`
   - Data saved to Prisma database

2. **Bundle is published/activated**
   - File: `app/routes/app.bundles.cart-transform.configure.$bundleId.tsx`
   - Triggers cart transform configuration

3. **Bundle product metafield is updated**
   - File: `app/services/bundle-isolation.server.ts`
   - Function: `updateBundleProductMetafield()`
   - Sets `$app:bundle_config` on bundle product
   - Transforms pricing rules to standardized format

4. **Isolation metafields are created**
   - File: `app/services/bundle-isolation.server.ts`
   - Function: `createBundleProductIsolationMetafields()`
   - Sets `$app:bundle_isolation:*` metafields

5. **Shop metafield is updated**
   - File: `app/services/bundle-isolation.server.ts`
   - Updates `$app:all_bundles` shop metafield
   - Adds/updates bundle in global registry

### Write Operation Checklist

✅ Bundle record created/updated in database
✅ `$app:bundle_config` set on bundle product
✅ `$app:bundle_isolation:*` metafields set
✅ `$app:all_bundles` shop metafield updated
✅ Pricing rules transformed to standardized format
✅ Component product IDs extracted and included

---

## Read Operations

### Frontend Widget (Liquid)

**File:** `extensions/bundle-builder/blocks/bundle.liquid`

**Primary Read - Bundle Config:**
```liquid
{% assign bundle_config = product.metafields['$app'].bundle_config.value %}
```
**Line:** 448

**Isolation Check:**
```liquid
{% if product.metafields['$app:bundle_isolation'].bundle_product_type == 'cart_transform_bundle' %}
  {% assign container_bundle_id = product.metafields['$app:bundle_isolation'].owns_bundle_id %}
{% endif %}
```
**Lines:** 254-256

**Purpose:**
- Load bundle configuration
- Display bundle steps and products
- Show pricing and discount messaging
- Handle product selection and cart operations

---

### Cart Transform Function (TypeScript)

**File:** `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts`

**Primary Read Path (Widget-based bundles):**
```typescript
// 1. Check for cart line attributes (bundle instance ID)
const bundleInstanceId = line.attribute?.value;

// 2. Read bundle config from product metafield
const productBundleConfig = JSON.parse(line.merchandise.product.bundle_config.value);

// 3. Extract pricing and apply discounts
const pricingResult = calculateBundlePriceFromConfig(bundleConfig, lines);
```
**Lines:** 137-179

**Fallback Read Path (Legacy metafields):**
```typescript
// Read component_reference and component_quantities
const componentReferences = JSON.parse(merchandise.component_reference.value);
const componentQuantities = JSON.parse(merchandise.component_quantities.value);
```
**Lines:** 892-920

**Purpose:**
- Detect bundle products in cart
- Merge individual products into bundles
- Apply bundle pricing discounts
- Transform cart structure

---

### Backend Services (Admin/API)

**Validation Service:**
**File:** `app/services/metafield-validation.server.ts`
**Function:** `validateAndCleanShopMetafields()`
**Purpose:** Validate consistency of shop-level bundle registry

**Isolation Service:**
**File:** `app/services/bundle-isolation.server.ts`
**Function:** `getBundleConfigFromProduct()`
**Purpose:** Retrieve bundle configuration for backend operations

**Cleanup Service:**
**File:** `app/services/metafield-cleanup.server.ts`
**Function:** `cleanupBundleMetafields()`
**Purpose:** Remove metafields when bundle is deleted

---

## Validation Rules

### Shop Metafield Validation

**File:** `app/services/metafield-validation.server.ts`
**Function:** `validateAndCleanShopMetafields()`

**Rules:**
1. ✅ Shop metafield must be valid JSON array
2. ✅ Each bundle must have required fields: `id`, `name`, `shopifyProductId`
3. ✅ All bundle IDs must exist in database
4. ✅ All product IDs must exist in Shopify
5. ✅ No duplicate bundle IDs
6. ✅ Status must be 'active' for bundles in registry

**Validation Process:**
```typescript
// 1. Parse shop metafield
const allBundles = JSON.parse(shopMetafield.value);

// 2. Get active bundles from database
const dbBundles = await db.bundle.findMany({ where: { shopId, status: 'active' }});

// 3. Compare and identify issues
- Missing in metafield (should be added)
- Extra in metafield (should be removed)
- Mismatched data (should be updated)

// 4. Clean and update
const cleanedBundles = allBundles.filter(isValid);
await admin.graphql(UPDATE_METAFIELD_MUTATION, { value: JSON.stringify(cleanedBundles) });
```

---

### Product Metafield Validation

**File:** `app/services/metafield-validation.server.ts`
**Function:** `validateProductMetafields()`

**Rules:**
1. ✅ Product must have `$app:bundle_config` metafield
2. ✅ Bundle config must be valid JSON
3. ✅ Bundle config `id` must match database bundle `id`
4. ✅ `shopifyProductId` must match product's actual ID
5. ✅ `bundleParentVariantId` must be valid ProductVariant GID
6. ✅ All component product IDs must exist
7. ✅ Pricing rules must use correct field names for method

---

### Pricing Rule Validation

**Standardized Field Requirements:**

**For `percentage_off` and `fixed_amount_off`:**
- ✅ Must have `discountValue` field (string or number)
- ❌ Should NOT have `fixedBundlePrice` field

**For `fixed_bundle_price`:**
- ✅ Must have `fixedBundlePrice` field (number)
- ✅ Must have `price` field (alias for compatibility)
- ❌ Should NOT have `discountValue` field

**Example Validation:**
```typescript
if (pricing.method === 'fixed_bundle_price') {
  if (!rule.fixedBundlePrice) {
    throw new Error('fixed_bundle_price method requires fixedBundlePrice field');
  }
}

if (pricing.method === 'percentage_off' || pricing.method === 'fixed_amount_off') {
  if (!rule.discountValue) {
    throw new Error(`${pricing.method} method requires discountValue field`);
  }
}
```

---

## Common Issues and Solutions

### Issue 1: Progress Bar Not Updating

**Symptom:** Modal footer progress bar shows 0% even when products selected

**Root Cause:** JavaScript calculating percentage correctly but metafield pricing rules have wrong field names

**Solution:**
1. Check bundle's `$app:bundle_config` metafield
2. Verify pricing rules use correct field names:
   - `discountValue` for percentage_off/fixed_amount_off
   - `fixedBundlePrice` for fixed_bundle_price
3. Re-save bundle to update metafield with correct fields

**File:** `app/services/bundle-isolation.server.ts:33-60`
**Function:** `transformPricingRules()`

---

### Issue 2: Cart Transform Not Merging Products

**Symptom:** Products added to cart individually, not merged into bundle

**Root Cause:** Missing `bundleParentVariantId` in bundle config

**Solution:**
1. Check `$app:bundle_config` on bundle product
2. Verify `bundleParentVariantId` field exists and is valid ProductVariant GID
3. If missing, update bundle config:
```typescript
const bundleVariantId = `gid://shopify/ProductVariant/${variantNumericId}`;
```

**File:** `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts:289-318`

---

### Issue 3: Discount Not Applied

**Symptom:** Bundle products merge but no discount applied

**Root Cause:** Pricing rules missing or using wrong field names

**Solution:**
1. Check `pricing.enabled` is `true`
2. Verify `pricing.rules` array exists and has rules
3. Check rule has correct field for method:
   - `percentage_off` → needs `discountValue`
   - `fixed_amount_off` → needs `discountValue`
   - `fixed_bundle_price` → needs `fixedBundlePrice`

**File:** `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts:386-474`
**Function:** `calculateBundlePriceFromConfig()`

---

### Issue 4: Stale Bundle References

**Symptom:** Widget loads incorrect bundle or shows deleted bundles

**Root Cause:** Shop metafield not updated when bundle deleted/changed

**Solution:**
1. Run validation: `/api/metafield-validation`
2. Check shop `$app:all_bundles` metafield
3. Clean up stale references:
```typescript
await MetafieldValidationService.validateAndCleanShopMetafields(admin, shopId);
```

**File:** `app/services/metafield-validation.server.ts:40-102`

---

### Issue 5: Component Products Missing

**Symptom:** Bundle shows "No products available"

**Root Cause:** Component product IDs in metafield don't match actual products

**Solution:**
1. Check `componentProductIds` array in bundle config
2. Verify all product IDs exist in Shopify
3. Re-save bundle to update component product list

**File:** `app/services/bundle-isolation.server.ts:97-99`

---

### Issue 6: Wrong Discount Amount Displayed

**Symptom:** Discount shows "₹0" or wrong amount

**Root Cause:** Using `price` field instead of `fixedBundlePrice` for fixed_bundle_price method

**Solution:**
Transform pricing rules ensures both fields are set:
```typescript
if (discountMethod === 'fixed_bundle_price') {
  const priceValue = rule.fixedBundlePrice || 0;
  transformedRule.price = priceValue;
  transformedRule.fixedBundlePrice = priceValue;
}
```

**File:** `app/services/bundle-isolation.server.ts:47-51`

---

### Issue 7: Multiple Bundle Instances Not Working

**Symptom:** Adding same bundle with different products replaces previous bundle

**Root Cause:** Missing bundle instance ID differentiation

**Solution:**
Ensure cart line attributes include unique bundle instance ID:
```typescript
const bundleInstanceId = `${bundleId}_${hash}`;
cartLine.attribute._wolfpack_bundle_id = bundleInstanceId;
```

**File:** `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts:225-250`

---

## Cleanup Procedures

### When Deleting a Bundle

**File:** `app/services/metafield-cleanup.server.ts`
**Function:** `cleanupBundleMetafields()`

**Steps:**
1. Delete `$app:bundle_config` from bundle product
2. Delete `$app:bundle_isolation:*` metafields from bundle product
3. Delete `bundle_discounts:cart_transform_config` from component products (if exists)
4. Update shop `$app:all_bundles` to remove bundle from registry
5. Clean component product references

**Code:**
```typescript
// 1. Bundle product metafields
await cleanupBundleProductMetafields(admin, bundleProductId);

// 2. Component product metafields
await cleanupComponentProductMetafields(admin, componentProductIds);

// 3. Shop metafield
await updateShopMetafieldsAfterDeletion(admin, bundleId);
```

**Lines:** 13-39

---

### Bulk Cleanup (Emergency)

**File:** `app/services/metafield-cleanup.server.ts`
**Function:** `emergencyCleanupAllBundleMetafields()`

**Purpose:** Remove ALL bundle-related metafields from shop

**Warning:** ⚠️ This is destructive and should only be used in emergencies

**Process:**
1. Get all metafield definitions for bundle namespaces
2. Delete definitions and all associated metafields
3. Clears: `bundle_discounts`, `$app:bundle_discount`

**Lines:** 309-356

---

### Validation and Cleanup Workflow

**Recommended Schedule:**
- Daily: Validate shop metafield consistency
- After bundle changes: Validate product metafields
- Before deployment: Full metafield audit

**API Endpoints:**
```
POST /api/metafield-validation
POST /api/bundle-isolation-audit
```

**Manual Cleanup:**
```typescript
// 1. Validate shop metafields
const shopValidation = await MetafieldValidationService.validateAndCleanShopMetafields(admin, shopId);

// 2. Validate product metafields
const productValidation = await MetafieldValidationService.validateProductMetafields(admin, productId, bundleId);

// 3. Audit bundle isolation
const auditResults = await BundleIsolationService.auditBundleIsolation(admin, shopId);
```

---

## Best Practices

### 1. Always Use Helper Functions

❌ **Don't:**
```typescript
await admin.graphql(`mutation { metafieldsSet(...) }`);
```

✅ **Do:**
```typescript
await BundleIsolationService.updateBundleProductMetafield(admin, productId, bundleConfig);
```

### 2. Validate Before Write

❌ **Don't:**
```typescript
await setMetafield(data);
```

✅ **Do:**
```typescript
const isValid = validateBundleConfig(data);
if (!isValid) throw new Error('Invalid bundle config');
await setMetafield(data);
```

### 3. Handle GID Formats Consistently

❌ **Don't:**
```typescript
const productId = "8375848042692"; // Numeric only
```

✅ **Do:**
```typescript
const productId = "gid://shopify/Product/8375848042692"; // Full GID
const normalizedId = normalizeProductId(productId); // Use helper
```

### 4. Check Metafield Existence

❌ **Don't:**
```typescript
const config = JSON.parse(product.metafield.value);
```

✅ **Do:**
```typescript
if (!product.metafield?.value) {
  console.log('Metafield not found');
  return null;
}
const config = JSON.parse(product.metafield.value);
```

### 5. Use Standardized Field Names

❌ **Don't:**
```typescript
const rule = {
  price: 100,  // Wrong for percentage_off
  discount: "10%"  // Wrong format
};
```

✅ **Do:**
```typescript
// For percentage_off or fixed_amount_off
const rule = {
  discountValue: "10"
};

// For fixed_bundle_price
const rule = {
  fixedBundlePrice: 100,
  price: 100  // Compatibility alias
};
```

---

## Debugging Checklist

When encountering metafield-related errors:

1. ✅ Check if metafield exists on correct owner (shop/product/variant)
2. ✅ Verify namespace and key are correct
3. ✅ Validate JSON structure (use JSON validator)
4. ✅ Check for required fields in metafield value
5. ✅ Verify GID formats are correct and consistent
6. ✅ Ensure pricing rules use correct field names for method
7. ✅ Check database bundle matches metafield bundle ID
8. ✅ Verify all referenced products still exist
9. ✅ Check shop metafield includes bundle
10. ✅ Review recent changes to bundle configuration

---

## File Reference Map

### Services
- `app/services/bundle-isolation.server.ts` - Bundle product metafield management
- `app/services/metafield-validation.server.ts` - Validation and consistency checks
- `app/services/metafield-cleanup.server.ts` - Cleanup on bundle deletion
- `app/services/bundle-auto-injection.server.ts` - Widget injection verification

### Routes
- `app/routes/app.bundles.$bundleId.tsx` - Bundle editor UI
- `app/routes/app.bundles.cart-transform.configure.$bundleId.tsx` - Cart transform configuration
- `app/routes/api.bundle-product-manager.tsx` - Bundle product operations

### Extensions
- `extensions/bundle-builder/blocks/bundle.liquid` - Frontend widget
- `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts` - Cart transformation logic
- `extensions/bundle-cart-transform-ts/src/cart-transform-input.graphql` - GraphQL query for metafields

### Tests
- `tests/metafield-validation.test.cjs` - Metafield validation tests
- `tests/product-metafield-architecture.test.js` - Product metafield tests

---

## Changelog

### Version 2.0 (January 2025)
- Optimized to single `$app:bundle_config` metafield per bundle
- Standardized pricing rule field names
- Removed redundant shop-level bundle storage
- Added bundle isolation metafields for better product identification
- Deprecated `bundle_discounts` namespace

### Version 1.0 (December 2024)
- Initial metafield architecture
- Multiple metafields per bundle (now deprecated)
- Legacy namespace structure

---

## Support

For metafield-related issues:
1. Review this document
2. Check validation service output
3. Run metafield audit
4. Review recent code changes affecting metafields
5. Check Shopify API error logs

**Most importantly:** When making changes to metafield structure, always:
- Update this documentation
- Update validation rules
- Test thoroughly in development
- Run full metafield audit before deploying
