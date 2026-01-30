# Issue: Expanded Bundle Items in Checkout

**Issue ID:** expanded-bundle-checkout-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-01-30
**Last Updated:** 2026-01-30

## Overview

Implement expanded bundle items display in checkout/cart with custom line item properties showing:
- Bundle parent with total retail vs bundle price
- Percentage and exact savings
- Expandable child items with individual pricing breakdown
- Per-component retail price, bundle price, and savings

This mirrors the competitor (Flex Bundles) feature for enhanced transparency.

## Technical Approach

### Currency Strategy: Option A (Base Currency Cents)

- Store all prices in **base currency subunits (cents)** as integers
- Shopify handles multi-currency conversion via `presentmentCurrencyRate`
- Cart Transform converts cents → decimal string for `fixedPricePerUnit`

### Data Structure

```typescript
interface ComponentPricing {
  variantId: string;        // "gid://shopify/ProductVariant/123"
  retailPrice: number;      // 9800 (cents) = $98.00
  bundlePrice: number;      // 8820 (cents) = $88.20
  discountPercent: number;  // 10.00 (percentage)
  savingsAmount: number;    // 980 (cents) = $9.80
}
```

---

## Implementation Phases

### Phase 1: Update Metafield Sync Service

**File:** `app/services/bundles/metafield-sync.server.ts`

**Changes:**
1. Add `calculateComponentPricing()` function
2. Store `component_pricing` metafield on bundle variant
3. Calculate per-component discounts based on bundle pricing rules

**New Metafield:**
```json
{
  "namespace": "$app",
  "key": "component_pricing",
  "type": "json",
  "value": "[{\"variantId\":\"gid://...\",\"retailPrice\":9800,\"bundlePrice\":8820,\"discountPercent\":10,\"savingsAmount\":980}]"
}
```

### Phase 2: Enhance Cart Transform Function

**File:** `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts`

**Changes:**
1. Read `component_pricing` metafield in input query
2. Add attributes to expanded items with pricing info
3. Convert cents to decimal string for `fixedPricePerUnit`

**Input Query Addition:**
```graphql
componentPricing: metafield(namespace: "$app", key: "component_pricing") {
  jsonValue
}
```

**Expanded Item Attributes:**
```typescript
attributes: [
  { key: "_bundle_id", value: bundleInstanceId },
  { key: "_bundle_name", value: bundleName },
  { key: "_retail_price_cents", value: "9800" },
  { key: "_bundle_price_cents", value: "8820" },
  { key: "_discount_percent", value: "10.00" },
  { key: "_savings_cents", value: "980" },
  { key: "_is_bundle_component", value: "true" }
]
```

### Phase 3: Create Checkout UI Extension

**Directory:** `extensions/bundle-checkout-ui/`

**Target:** `purchase.checkout.cart-line-item.render-after`

**Features:**
- Detect bundle components via `_is_bundle_component` attribute
- Display retail vs bundle price
- Show savings percentage and amount
- Use `presentmentCurrencyRate` for currency conversion

### Phase 4: Update Theme Cart (Liquid)

**File:** `extensions/bundle-builder/snippets/bundle-cart-item.liquid`

**Features:**
- Read line item properties
- Group items by `_bundle_id`
- Collapsible/expandable bundle view
- Display pricing breakdown with money filters

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `app/services/bundles/metafield-sync.server.ts` | Modify | Add component pricing calculation |
| `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts` | Modify | Add attributes to expanded items |
| `extensions/bundle-cart-transform-ts/input.graphql` | Modify | Query component_pricing metafield |
| `extensions/bundle-checkout-ui/` | Create | New checkout UI extension |
| `extensions/bundle-checkout-ui/src/Checkout.tsx` | Create | React component for bundle display |
| `extensions/bundle-checkout-ui/shopify.extension.toml` | Create | Extension configuration |
| `extensions/bundle-builder/snippets/bundle-cart-item.liquid` | Create | Theme cart snippet |

---

## Pricing Calculation Logic

### Per-Component Discount Allocation

**Method: Proportional (Weight-Based)**

Each component's discount is proportional to its share of the total retail price:

```typescript
function calculateComponentPricing(
  components: Component[],
  discountPercent: number
): ComponentPricing[] {
  // Calculate total retail price (cents)
  const totalRetailCents = components.reduce(
    (sum, c) => sum + (c.price * c.quantity), 0
  );

  return components.map(component => {
    const retailPriceCents = component.price; // Already in cents
    const bundlePriceCents = Math.round(
      retailPriceCents * (1 - discountPercent / 100)
    );
    const savingsCents = retailPriceCents - bundlePriceCents;

    return {
      variantId: component.variantId,
      retailPrice: retailPriceCents,
      bundlePrice: bundlePriceCents,
      discountPercent: discountPercent,
      savingsAmount: savingsCents
    };
  });
}
```

### Bundle Total Calculation

```typescript
// Bundle totals (for parent display)
const bundleTotals = {
  retailTotal: componentPricing.reduce((sum, c) => sum + c.retailPrice, 0),
  bundleTotal: componentPricing.reduce((sum, c) => sum + c.bundlePrice, 0),
  totalSavings: componentPricing.reduce((sum, c) => sum + c.savingsAmount, 0),
  overallDiscountPercent: // calculated from totals
};
```

---

## Cart Transform Output Example

```json
{
  "operations": [
    {
      "expand": {
        "cartLineId": "gid://shopify/CartLine/123",
        "title": "Camping Bundle",
        "expandedCartItems": [
          {
            "merchandiseId": "gid://shopify/ProductVariant/456",
            "quantity": 1,
            "price": {
              "adjustment": {
                "fixedPricePerUnit": { "amount": "22.80" }
              }
            },
            "attributes": [
              { "key": "_bundle_id", "value": "bundle_abc123" },
              { "key": "_bundle_name", "value": "Camping Bundle" },
              { "key": "_retail_price_cents", "value": "2400" },
              { "key": "_bundle_price_cents", "value": "2280" },
              { "key": "_discount_percent", "value": "5.00" },
              { "key": "_savings_cents", "value": "120" },
              { "key": "_is_bundle_component", "value": "true" }
            ]
          },
          {
            "merchandiseId": "gid://shopify/ProductVariant/789",
            "quantity": 1,
            "price": {
              "adjustment": {
                "fixedPricePerUnit": { "amount": "88.20" }
              }
            },
            "attributes": [
              { "key": "_bundle_id", "value": "bundle_abc123" },
              { "key": "_bundle_name", "value": "Camping Bundle" },
              { "key": "_retail_price_cents", "value": "9800" },
              { "key": "_bundle_price_cents", "value": "8820" },
              { "key": "_discount_percent", "value": "10.00" },
              { "key": "_savings_cents", "value": "980" },
              { "key": "_is_bundle_component", "value": "true" }
            ]
          }
        ]
      }
    }
  ]
}
```

---

## Progress Log

### 2026-01-30 - Planning Phase
- Analyzed competitor (Flex Bundles) implementation
- Researched Shopify Cart Transform API and line_item properties
- Explored current codebase cart implementation
- Decided on Option A: Base currency cents storage
- Created detailed implementation plan

### 2026-01-30 14:00 - Phase 1 Complete
- Added `ComponentPricing` interface to `metafield-sync.server.ts`
- Implemented `calculateComponentPricing()` function
- Added `component_pricing` metafield definition
- Updated `batchGetFirstVariantsWithPrices()` in `variant-lookup.server.ts`
- Updated `updateBundleProductMetafields()` to store component pricing
- Files modified:
  - `app/services/bundles/metafield-sync.server.ts`
  - `app/utils/variant-lookup.server.ts`

### 2026-01-30 14:30 - Phase 2 Complete
- Added `component_pricing` to cart transform input query
- Added `ComponentPricingItem` interface
- Updated `CartTransformOperation` interface with `fixedPricePerUnit` and `attributes`
- Modified EXPAND operation to add pricing attributes to expanded items
- Files modified:
  - `extensions/bundle-cart-transform-ts/src/cart-transform-input.graphql`
  - `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts`

### 2026-01-30 15:00 - Phase 4 Complete (Skipped Phase 3)
- Created `bundle-cart-item.liquid` snippet for per-item pricing display
- Created `bundle-cart-summary.liquid` snippet for cart-level savings summary
- Snippets read line item properties and display:
  - Retail vs bundle price comparison
  - Discount percentage badge
  - Savings amount
  - Total bundle savings in cart
- Files created:
  - `extensions/bundle-builder/snippets/bundle-cart-item.liquid`
  - `extensions/bundle-builder/snippets/bundle-cart-summary.liquid`
- Note: Phase 3 (Checkout UI Extension) skipped for now - can be added later for checkout display

---

## Phases Checklist

- [x] Phase 1: Update Metafield Sync Service
- [x] Phase 2: Enhance Cart Transform Function
- [ ] Phase 3: Create Checkout UI Extension (deferred)
- [x] Phase 4: Update Theme Cart (Liquid)
- [ ] Testing & QA
- [ ] Commit changes

---

## Dependencies

- Shopify Functions API (Cart Transform)
- Checkout UI Extensions (Checkout Extensibility)
- Metafield Definitions in `shopify.app.toml`

## References

- [Cart Transform API](https://shopify.dev/docs/api/functions/reference/cart-transform)
- [Line Item Properties](https://shopify.dev/docs/api/liquid/objects/line_item#line_item-properties)
- [Checkout UI Extensions](https://shopify.dev/docs/api/checkout-ui-extensions)
