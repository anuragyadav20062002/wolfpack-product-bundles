# Bundle Architecture Approaches: Comprehensive Comparison

**Document Version:** 1.0
**Created:** January 2025
**Purpose:** Compare three architecture approaches considering cart transform discounting and widget requirements

---

## Executive Summary

All three approaches must support:
- **Cart Transform:** Apply bundle discounts at checkout (percentage_off, fixed_amount_off, fixed_bundle_price)
- **Widget:** Display bundle UI with progress bars, discount messaging, product selection
- **Performance:** Fast cart transform execution (<11M instructions)
- **Standards:** Align with Shopify's bundle conventions

---

## Data Requirements Analysis

### Cart Transform Function Needs

The cart transform function runs at **checkout** and needs:

```typescript
{
  // Bundle Structure
  parentVariantId: "gid://shopify/ProductVariant/123",
  componentVariantIds: ["gid://...", "gid://..."],
  componentQuantities: [2, 1],

  // Pricing/Discount Data
  pricingMethod: "percentage_off" | "fixed_amount_off" | "fixed_bundle_price",
  discountValue: 10,           // for percentage_off or fixed_amount_off
  fixedBundlePrice: 99.99,     // for fixed_bundle_price

  // Optional: Conditional Rules
  conditions: {
    type: "quantity" | "amount",
    operator: "gte" | "lte",
    value: 3
  }
}
```

**Size:** ~300-500 bytes per bundle
**Access Pattern:** Read on every cart update (high frequency)
**Performance Critical:** YES (runs during checkout)

### Widget Needs

The widget runs on **product page** and needs:

```typescript
{
  // Everything cart transform needs PLUS:
  bundleId: "cm5abc123",
  bundleName: "Summer Bundle",
  description: "Get 3 products for $100",

  // Step Configuration
  steps: [{
    id: "step-1",
    name: "Choose Shirt",
    position: 0,
    minQuantity: 1,
    maxQuantity: 1,
    products: [...]  // Can fetch from Storefront API
  }],

  // UI Messaging
  discountMessaging: {
    progressText: "Add {items} more to unlock discount",
    successText: "Discount unlocked!",
    showProgressBar: true
  },

  // Display Settings
  showFooter: true,
  layout: "grid",
  // ... more UI config
}
```

**Size:** ~3-5KB per bundle
**Access Pattern:** Read once on page load (low frequency)
**Performance Critical:** NO (user is browsing, not checking out)

---

## Approach 1: Hybrid (3 Standard + 1 UI Config)

### Architecture

**Variant Metafields (Shopify Standard):**
```graphql
# Parent bundle variant
$app.component_reference      # list.variant_reference  (~200 bytes)
$app.component_quantities     # list.number_integer     (~50 bytes)
$app.price_adjustment         # json                    (~150 bytes)

# Child component variants
$app.component_parents        # json                    (~250 bytes)
```

**Price Adjustment Structure (Shopify Standard):**
```json
{
  "percentageDecrease": 10,        // For percentage discounts
  "fixedAmountDecrease": 5.00,     // For fixed amount off
  "fixedPrice": 99.99,             // For bundle pricing
  "condition": {                    // Optional conditional discount
    "type": "quantity",
    "operator": "gte",
    "value": 3
  }
}
```

**Additional Widget Config (Non-Standard):**
```graphql
# Parent bundle variant - ONLY for widget
$app.bundle_ui_config         # json                    (~2KB)
```

**Bundle UI Config Structure:**
```json
{
  "bundleId": "cm5abc123",
  "name": "Summer Bundle",
  "description": "Get 3 items for $100",
  "steps": [
    {
      "id": "step-1",
      "name": "Choose Shirt",
      "position": 0,
      "minQuantity": 1,
      "maxQuantity": 1,
      "productIds": ["gid://shopify/Product/123"]
      // Widget fetches full product details via Storefront API
    }
  ],
  "messaging": {
    "progressTemplate": "Add {items} more items",
    "successTemplate": "Discount unlocked!",
    "showProgressBar": true,
    "showFooter": true
  }
}
```

### Cart Transform Query

```graphql
query Input {
  cart {
    lines {
      id
      quantity
      merchandise {
        ... on ProductVariant {
          id

          # Standard metafields - minimal data
          component_parents: metafield(namespace: "$app", key: "component_parents") {
            value
          }
          component_reference: metafield(namespace: "$app", key: "component_reference") {
            value
          }
          component_quantities: metafield(namespace: "$app", key: "component_quantities") {
            value
          }
          price_adjustment: metafield(namespace: "$app", key: "price_adjustment") {
            value
          }
        }
      }
    }
  }
}
```

**Query Size:** ~400 bytes per variant
**Data Transfer:** ~400-600 bytes total per bundle

### Widget Query (Liquid)

```liquid
{% assign variant = product.variants.first %}
{% assign app_metafields = variant.metafields[app_namespace] %}

{%- comment -%} Bundle structure (standard) {%- endcomment -%}
{% assign component_reference = app_metafields['component_reference'] %}
{% assign component_quantities = app_metafields['component_quantities'] %}
{% assign price_adjustment = app_metafields['price_adjustment'] %}

{%- comment -%} Widget UI config {%- endcomment -%}
{% assign bundle_ui_config = app_metafields['bundle_ui_config'] %}
```

**Widget fetches product details via Storefront API** for images, titles, prices.

### Pros

✅ **Cart Transform Performance:** 90% smaller than current (500 bytes vs 5KB)
✅ **Fast Widget Load:** Single metafield read, no API roundtrip
✅ **Mostly Standard:** 3 of 4 metafields are Shopify standard
✅ **Offline Widget:** Works without app server connection
✅ **Flexible Discounting:** Supports all discount types with conditions
✅ **Simple Implementation:** No complex server-side logic

### Cons

⚠️ **One Extra Metafield:** `bundle_ui_config` is custom (but clearly separated)
⚠️ **Storefront API Calls:** Widget needs to fetch product details
⚠️ **Metafield Size:** UI config can grow to 2-3KB

### Metrics

| Metric | Value |
|--------|-------|
| **Cart Transform Data** | 500 bytes |
| **Widget Data** | 2.5KB |
| **Total Metafields** | 4 (3 standard + 1 custom) |
| **Standards Compliance** | 75% |
| **Cart Performance** | ⭐⭐⭐⭐⭐ Excellent |
| **Widget Performance** | ⭐⭐⭐⭐ Very Good |
| **Complexity** | ⭐⭐ Low |

---

## Approach 2: Pure API (Widget Fetches Config)

### Architecture

**Variant Metafields (100% Shopify Standard):**
```graphql
# Parent bundle variant
$app.component_reference      # list.variant_reference
$app.component_quantities     # list.number_integer
$app.price_adjustment         # json

# Child component variants
$app.component_parents        # json
```

**Widget API Endpoint:**
```
GET /api/bundles/{bundleId}/config
```

**API Response:**
```json
{
  "bundleId": "cm5abc123",
  "name": "Summer Bundle",
  "steps": [...],
  "messaging": {...},
  "products": [...]  // Full product details from Shopify API
}
```

### Cart Transform Query

**Same as Approach 1** - Standard metafields only

### Widget Loading Flow

1. Widget reads `component_reference` from metafield
2. Extracts bundle ID from variant or URL parameter
3. Makes API call to `/api/bundles/{bundleId}/config`
4. Renders UI with fetched data

### Pros

✅ **100% Shopify Standard:** All metafields follow conventions
✅ **Smallest Metafields:** Only essential data in metafields
✅ **Cart Transform Performance:** Same as Approach 1
✅ **Flexible Config:** No metafield size limits for widget data
✅ **Easy Updates:** Change widget config without metafield updates

### Cons

❌ **Extra HTTP Request:** Widget load time +200-500ms
❌ **Server Dependency:** Widget breaks if app server is down
❌ **Complexity:** Requires API endpoint and error handling
❌ **Caching Needed:** Must cache responses for performance
❌ **Development Harder:** Need app server running for local testing

### Metrics

| Metric | Value |
|--------|-------|
| **Cart Transform Data** | 500 bytes |
| **Widget Data** | 0 bytes (API) |
| **Total Metafields** | 3 (all standard) |
| **Standards Compliance** | 100% |
| **Cart Performance** | ⭐⭐⭐⭐⭐ Excellent |
| **Widget Performance** | ⭐⭐⭐ Good (API latency) |
| **Complexity** | ⭐⭐⭐⭐ High |

---

## Approach 3: Widget Reconstructs from Minimal Data

### Architecture

**Variant Metafields (Shopify Standard):**
```graphql
# Same as Approach 2 - 100% standard
$app.component_reference
$app.component_quantities
$app.price_adjustment
$app.component_parents
```

**Widget Logic:**
1. Read `component_reference` and `component_quantities`
2. Query Storefront API for each product's details
3. Build steps dynamically based on product IDs
4. Use default messaging templates from theme settings

### Pros

✅ **100% Shopify Standard:** All metafields follow conventions
✅ **No API Dependency:** Widget works offline
✅ **Cart Transform Performance:** Same as other approaches
✅ **Simplest Backend:** No custom metafields or API endpoints

### Cons

❌ **Multiple API Calls:** Widget makes N Storefront API calls (1 per product)
❌ **Slow Widget Load:** Can take 1-3 seconds for 5+ products
❌ **Limited Customization:** Can't store custom step names/order
❌ **No Discount Messaging:** Can't store custom progress templates
❌ **Poor UX:** Generic bundle experience, not customizable per bundle

### Metrics

| Metric | Value |
|--------|-------|
| **Cart Transform Data** | 500 bytes |
| **Widget Data** | 0 bytes |
| **Total Metafields** | 3 (all standard) |
| **Standards Compliance** | 100% |
| **Cart Performance** | ⭐⭐⭐⭐⭐ Excellent |
| **Widget Performance** | ⭐⭐ Poor (multiple API calls) |
| **Complexity** | ⭐⭐⭐ Medium |

---

## Feature Comparison Matrix

| Feature | Approach 1: Hybrid | Approach 2: Pure API | Approach 3: Reconstruct |
|---------|-------------------|---------------------|------------------------|
| **Discounting** |
| Percentage Discount | ✅ `price_adjustment` | ✅ `price_adjustment` | ✅ `price_adjustment` |
| Fixed Amount Off | ✅ `price_adjustment` | ✅ `price_adjustment` | ✅ `price_adjustment` |
| Fixed Bundle Price | ✅ `price_adjustment` | ✅ `price_adjustment` | ✅ `price_adjustment` |
| Conditional Discounts | ✅ In `price_adjustment` | ✅ In `price_adjustment` | ✅ In `price_adjustment` |
| **Widget Features** |
| Custom Step Names | ✅ In UI config | ✅ From API | ❌ Default names |
| Progress Messaging | ✅ In UI config | ✅ From API | ⚠️ Theme settings only |
| Discount Templates | ✅ In UI config | ✅ From API | ⚠️ Generic only |
| Product Images | ✅ Storefront API | ✅ From API response | ✅ Storefront API |
| Custom Step Order | ✅ In UI config | ✅ From API | ❌ Not possible |
| **Performance** |
| Cart Transform Speed | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Widget Initial Load | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Widget Offline | ✅ Yes | ❌ No | ✅ Yes |
| **Development** |
| Backend Complexity | ⭐⭐ Low | ⭐⭐⭐⭐ High | ⭐⭐ Low |
| Frontend Complexity | ⭐⭐⭐ Medium | ⭐⭐ Low | ⭐⭐⭐⭐ High |
| Testing Complexity | ⭐⭐ Low | ⭐⭐⭐⭐ High | ⭐⭐⭐ Medium |
| **Maintenance** |
| Update Bundle Config | Metafield write | API update | Not possible |
| Update Discount Rules | Metafield write | Metafield write | Metafield write |
| Debug Issues | Easy | Hard (server logs) | Medium |

---

## Discount Implementation Comparison

### Approach 1 & 2: `price_adjustment` Metafield

**Structure:**
```json
{
  "method": "percentage_off",
  "value": 10,
  "conditions": {
    "type": "quantity",
    "operator": "gte",
    "value": 3
  }
}
```

**Cart Transform Logic:**
```typescript
const priceAdj = JSON.parse(variant.price_adjustment.value);

switch (priceAdj.method) {
  case "percentage_off":
    return { percentageDecrease: { value: priceAdj.value } };

  case "fixed_amount_off":
    // Calculate percentage from fixed amount
    const percentage = (priceAdj.value / totalPrice) * 100;
    return { percentageDecrease: { value: percentage } };

  case "fixed_bundle_price":
    // Calculate percentage to reach fixed price
    const discount = ((totalPrice - priceAdj.value) / totalPrice) * 100;
    return { percentageDecrease: { value: discount } };
}
```

**Pros:**
- ✅ Compact (~150 bytes)
- ✅ Supports all discount types
- ✅ Conditional rules supported
- ✅ Fast to parse

### Approach 3: Same as 1 & 2

Same implementation - discount logic is identical across all approaches.

---

## Widget Implementation Comparison

### Approach 1: Read from UI Config Metafield

```javascript
// In bundle.liquid
const uiConfig = JSON.parse(variantMetafield.bundle_ui_config.value);

// Initialize widget
const widget = new BundleWidget({
  bundleId: uiConfig.bundleId,
  steps: uiConfig.steps,
  messaging: uiConfig.messaging,
  componentReferences: variantMetafield.component_reference.value,
  componentQuantities: variantMetafield.component_quantities.value,
  priceAdjustment: variantMetafield.price_adjustment.value
});

// Widget fetches product details
await widget.fetchProductDetails(uiConfig.steps);
```

**Load Time:** ~200-400ms (Storefront API calls)

### Approach 2: Fetch from API

```javascript
// In bundle.liquid
const componentRef = variantMetafield.component_reference.value;
const bundleId = extractBundleId(componentRef);

// Fetch full config
const config = await fetch(`${appUrl}/api/bundles/${bundleId}/config`);

// Initialize widget
const widget = new BundleWidget(config);
```

**Load Time:** ~400-700ms (API roundtrip + Storefront API calls on server)

### Approach 3: Reconstruct

```javascript
// In bundle.liquid
const productIds = variantMetafield.component_reference.value;
const quantities = variantMetafield.component_quantities.value;

// Fetch all products
const products = await Promise.all(
  productIds.map(id => storefrontAPI.product(id))
);

// Build steps dynamically
const steps = products.map((product, index) => ({
  name: `Step ${index + 1}`,  // Generic name
  products: [product],
  quantity: quantities[index]
}));

// Initialize widget
const widget = new BundleWidget({
  steps,
  messaging: getDefaultMessaging()  // From theme settings
});
```

**Load Time:** ~800-1500ms (N Storefront API calls)

---

## Recommendation Matrix

### Use Approach 1 (Hybrid) If:

- ✅ You want the best **balance** of performance and features
- ✅ You need **custom step names** and **discount messaging**
- ✅ You want widget to work **without app server**
- ✅ You're okay with **75% standards compliance** (3/4 standard metafields)
- ✅ You prioritize **fast widget load times**
- ✅ You want **simpler debugging** (data in metafields)

**Best For:** Production apps prioritizing UX and reliability

### Use Approach 2 (Pure API) If:

- ✅ You want **100% Shopify standards** compliance
- ✅ You have a **reliable app server** with good uptime
- ✅ You need **unlimited widget config** flexibility
- ✅ You're okay with **slower widget load** (+300-500ms)
- ✅ You have **good caching** infrastructure
- ✅ You can handle **API endpoint maintenance**

**Best For:** Apps with strong backend infrastructure

### Use Approach 3 (Reconstruct) If:

- ✅ You want **100% Shopify standards** compliance
- ✅ You're okay with **basic bundle UX** (no custom messaging)
- ✅ You don't mind **slow widget load** (1-3 seconds)
- ✅ You want **minimal backend complexity**
- ✅ Bundles have **few products** (<3 items)
- ❌ You **don't need** customizable step names/order

**Best For:** Simple bundles with minimal customization needs

---

## Final Recommendation

**Approach 1: Hybrid (3 Standard + 1 UI Config)**

### Rationale

1. **Cart Transform Performance:** Same as all approaches (90% improvement)
2. **Widget UX:** Fast, offline, fully customizable
3. **Complexity:** Low implementation and maintenance burden
4. **Reliability:** No dependency on app server uptime
5. **Debugging:** Easy to inspect metafield data
6. **Pragmatic:** 75% standards compliance is acceptable for production

### Implementation Plan

1. **Week 1:** Migrate to 3 standard metafields for cart transform
2. **Week 2:** Add `bundle_ui_config` metafield for widget
3. **Week 3:** Update widget to fetch product details from Storefront API
4. **Week 4:** Test and optimize

### Performance Metrics (Expected)

| Metric | Current | After Migration | Improvement |
|--------|---------|----------------|-------------|
| Cart Transform Data | 5.5KB | 500 bytes | 91% smaller |
| Widget Load Time | 300ms | 400ms | Acceptable |
| Metafield Count | 9 | 4 | 56% reduction |
| Code Complexity | High | Low | Significant |

---

## Appendix: Shopify Standard `price_adjustment` Reference

Based on [Shopify's bundle reference app](https://github.com/Shopify/function-examples/blob/main/sample-apps/bundles-cart-transform/):

```json
{
  "price": {
    "percentageDecrease": {
      "value": 10.5
    }
  }
}
```

**Our Enhanced Version** (supports all discount types):
```json
{
  "method": "percentage_off" | "fixed_amount_off" | "fixed_bundle_price",
  "value": 10,
  "conditions": {
    "type": "quantity" | "amount",
    "operator": "gte" | "lte" | "eq",
    "value": 3
  }
}
```

This extends Shopify's standard while remaining compatible with the cart transform API.

---

**End of Comparison Document**