# Bundle Type Separation - Architecture Summary

## Overview

Full-page and product-page bundles are **properly separated** with their own dedicated routes and UI, while sharing core business logic.

---

## ✅ What's SEPARATED (Different)

### 1. Route Files
**Complete separation at the route level**

| Aspect | Product-Page Bundle | Full-Page Bundle |
|--------|-------------------|------------------|
| **Route File** | `app.bundles.product-page-bundle.configure.$bundleId.tsx` | `app.bundles.full-page-bundle.configure.$bundleId.tsx` |
| **URL Pattern** | `/app/bundles/product-page-bundle/configure/:id` | `/app/bundles/full-page-bundle/configure/:id` |

---

### 2. "Place Widget Now" Button Logic
**Completely different widget placement workflows**

#### Product-Page Bundle
```typescript
// Line 1780 in product-page route
const result = await WidgetInstallationService.validateAndPrepareWidgetPlacement(
  admin,
  session.shop,
  apiKey,
  bundleId,
  bundle.templateName || 'product',  // PRODUCT template
  bundle.shopifyProductId            // Container product required
);
```

**Opens**: Product template editor
**Requires**: Container product + product template
**Block**: "Bundle Builder" on product pages

---

#### Full-Page Bundle
```typescript
// Line 1781 in full-page route
const result = await WidgetInstallationService.validateAndPrepareFullPageWidgetPlacement(
  admin,
  session.shop,
  apiKey,
  bundleId,
  bundle.templateName || undefined   // PAGE handle (optional)
);
```

**Opens**: Page template editor
**Requires**: No container product, just Bundle ID
**Block**: "Bundle - Full Page" on pages

---

### 3. Admin UI Fields

#### Product-Page Bundle UI Shows:
- ✅ Bundle Product card (select/sync container product)
- ✅ Bundle Container Template field
- ✅ Pro Tip about custom templates
- ✅ Bundle Status dropdown (inside Bundle Product card)

#### Full-Page Bundle UI Shows:
- ❌ Bundle Product card - **HIDDEN**
- ❌ Bundle Container Template field - **HIDDEN**
- ❌ Pro Tip - **HIDDEN**
- ✅ Bundle Status (separate card)

---

### 4. Widget Installation Service Methods

**Two completely different methods:**

```typescript
// services/widget-installation.server.ts

// For product-page bundles
validateAndPrepareWidgetPlacement(
  admin,
  shop,
  apiKey,
  bundleId,
  templateName,      // Product template
  shopifyProductId   // Container product
)

// For full-page bundles
validateAndPrepareFullPageWidgetPlacement(
  admin,
  shop,
  apiKey,
  bundleId,
  pageHandle?        // Optional page handle
)
```

---

### 5. Theme Extension Blocks

**Different Liquid blocks:**

| Type | Block File | Template Target | Settings |
|------|-----------|----------------|----------|
| Product-Page | `bundle-builder.liquid` | `product` templates | Reads from product metafields |
| Full-Page | `bundle-full-page.liquid` | `page` templates | Requires Bundle ID input |

---

### 6. Widget Loader Scripts

**Different JavaScript loaders:**

| Type | Loader File | Data Source |
|------|------------|-------------|
| Product-Page | `bundle-widget.js` | Product metafields |
| Full-Page | `bundle-widget-full-page-loader.js` | API endpoint `/api/bundle/{id}.json` |

---

### 7. Data Flow

#### Product-Page Bundle
```
Admin saves bundle
    ↓
Updates container product metafields
    ↓
Widget reads from product.metafields
    ↓
Renders on product page
```

#### Full-Page Bundle
```
Admin saves bundle
    ↓
Bundle stored in database
    ↓
Widget fetches from /api/bundle/{id}.json
    ↓
Renders on standalone page
```

---

## ✅ What's SHARED (Same)

### 1. Cart Transform Logic
**Location**: `services/bundles/cart-transform-metafield.server.ts`

Both bundle types use:
- ✅ `buildCartTransformConfig()` - Creates cart transform configuration
- ✅ `updateCartTransformConfigMetafield()` - Updates cart transform metafield
- ✅ Same bundle properties: `_bundle_id`, `_bundle_name`, `_step_index`
- ✅ Same merge logic in cart transform function

**Proof**: Both routes reference the same service
```typescript
// Both files have this comment:
// - buildCartTransformConfig -> services/bundles/cart-transform-metafield.server.ts
// - updateCartTransformConfigMetafield -> services/bundles/cart-transform-metafield.server.ts
```

---

### 2. Discount/Pricing Logic
**Location**: Custom hooks and services

Both bundle types use:
- ✅ `useBundlePricing()` hook - Same pricing state management
- ✅ `DiscountMethod` enum - Same discount types
- ✅ `discountEnabled`, `discountType`, `discountValue` - Same fields
- ✅ `calculateBundlePrice()` - Same pricing calculation
- ✅ `mapDiscountMethod()` - Same discount mapping

**Proof**: Both routes import and use the same pricing logic
```typescript
const pricingState = useBundlePricing({
  initialData: {
    discountEnabled: bundle.pricing?.enabled || false,
    discountType: bundle.pricing?.discountType as DiscountMethod || 'percentage',
    discountValue: bundle.pricing?.discountValue || 0,
    // ... same for both
  }
});
```

---

### 3. DCP (Design Control Panel) Settings
**Location**: `app/routes/app.design-control-panel.tsx`

Both bundle types use:
- ✅ Same design settings API endpoint
- ✅ Same CSS variables and styling system
- ✅ Same color, typography, and layout controls
- ✅ Both widgets load design CSS via `/api/design-settings/{shop}?bundleType={type}`

**Proof**: Widget loaders both call the same design CSS endpoint
```javascript
// bundle-widget.js (both types)
function loadDesignCSS(bundleType) {
  const cssUrl = getAssetUrl(`/api/design-settings/${shopDomain}`) +
                 `?bundleType=${bundleType}&v=${CONFIG.version}`;
  // ...
}
```

---

### 4. Step Configuration
**Location**: `useBundleSteps()` hook

Both bundle types use:
- ✅ Same step structure (id, name, description, products, collections)
- ✅ Same step conditions (minQuantity, maxQuantity)
- ✅ Same product selection logic
- ✅ Same collection selection logic

---

### 5. Database Models
**Location**: `prisma/schema.prisma`

Both bundle types use:
- ✅ Same `Bundle` model
- ✅ Same `BundleStep` model
- ✅ Same `StepProduct` relationships
- ✅ Same `BundlePricing` model
- ✅ Only difference: `bundleType` field ('product_page' vs 'full_page')

---

### 6. Metafield Sync Logic
**Location**: `services/bundles/metafield-sync.server.ts`

Both bundle types use:
- ✅ `updateBundleProductMetafields()` - Same metafield structure
- ✅ `ensureBundleMetafieldDefinitions()` - Same metafield definitions
- ✅ `updateComponentProductMetafields()` - Same component references

**Note**: Full-page bundles don't use product metafields for display, but the structure is the same for cart-transform compatibility.

---

## Summary Table

| Feature | Product-Page | Full-Page | Status |
|---------|-------------|-----------|--------|
| **Route Files** | Separate | Separate | ✅ SEPARATED |
| **"Place Widget Now" Logic** | Different method | Different method | ✅ SEPARATED |
| **UI Fields** | Product-specific | Page-specific | ✅ SEPARATED |
| **Widget Blocks** | Different block | Different block | ✅ SEPARATED |
| **Data Source** | Metafields | API endpoint | ✅ SEPARATED |
| **Template Type** | Product | Page | ✅ SEPARATED |
| **Container Product** | Required | Not needed | ✅ SEPARATED |
| **Cart Transform** | Shared | Shared | ✅ SHARED |
| **Discount Logic** | Shared | Shared | ✅ SHARED |
| **DCP Settings** | Shared | Shared | ✅ SHARED |
| **Step Configuration** | Shared | Shared | ✅ SHARED |
| **Database Models** | Shared | Shared | ✅ SHARED |
| **Pricing Calculation** | Shared | Shared | ✅ SHARED |

---

## Architecture Benefits

### ✅ Clean Separation
- Each bundle type has its own dedicated route
- No conditional logic mixing both types in the same file
- Easy to maintain and extend

### ✅ Code Reusability
- Core business logic (cart-transform, discounts, pricing) is shared
- DCP settings work for both types
- No code duplication

### ✅ Type Safety
- `bundleType` field clearly identifies the type
- TypeScript enforces correct method calls
- Prevents mixing incompatible features

### ✅ Developer Experience
- Easy to understand which code affects which bundle type
- Clear file organization
- Separate concerns

---

## Testing Checklist

### Product-Page Bundle Flow
1. [ ] Navigate to `/app/bundles/product-page-bundle/configure/:id`
2. [ ] Verify Bundle Product card is visible
3. [ ] Verify Template Selection is visible
4. [ ] Click "Place Widget Now" → opens PRODUCT template editor
5. [ ] Add "Bundle Builder" block
6. [ ] Verify cart-transform works with discounts
7. [ ] Verify DCP styling applies

### Full-Page Bundle Flow
1. [ ] Navigate to `/app/bundles/full-page-bundle/configure/:id`
2. [ ] Verify Bundle Product card is HIDDEN
3. [ ] Verify Template Selection is HIDDEN
4. [ ] Click "Place Widget Now" → opens PAGE template editor
5. [ ] Add "Bundle - Full Page" block
6. [ ] Enter Bundle ID
7. [ ] Verify cart-transform works with discounts
8. [ ] Verify DCP styling applies

---

## Conclusion

✅ **"Place Widget Now" button**: Properly separated with different methods
✅ **Everything else**: Properly separated (routes, UI, blocks, data sources)
✅ **Core business logic**: Properly shared (cart-transform, discounts, DCP)

The architecture is **correctly implemented** with clean separation where needed and proper sharing of business logic.
