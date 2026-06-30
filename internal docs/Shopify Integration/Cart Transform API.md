---
title: Cart Transform API
type: shopify-integration
audited: 2026-04-16
sources: extensions/bundle-cart-transform-ts/shopify.extension.toml, Shopify Dev MCP
---

# Cart Transform API

## Current Config

```toml
api_version = "2025-10"
target = "purchase.cart-transform.run"   # ⚠️ deprecated — see below
```

## Target Migration

| Target | Status |
|---|---|
| `purchase.cart-transform.run` | **Deprecated** since 2025-07 API release |
| `cart.transform.run` | **Current** — migrate to this |

The current `shopify.extension.toml` still uses the deprecated target. It works on `2025-10` but should be migrated before Shopify removes support.

## Operation Names (2025-07+)

| Pre-2025-07 | 2025-07+ (current) |
|---|---|
| `merge` | `linesMerge` |
| `expand` | `lineExpand` |
| `update` | `lineUpdate` |

**Always use the new names.** The codebase already uses them.

## MERGE Consolidation Behaviour

Shopify consolidates `linesMerge` results that share the same `parentVariantId` + `title`. The `attributes` field does NOT prevent consolidation.

To keep duplicate bundle instances as separate line items: **append a unique suffix to the title** (e.g., `"Bundle Name (2)"`). Tracked via `bundleNameCounts` Map in the transform function.

## Function Input Metafield Namespacing

The active bundle transform reads bundle component metadata from app-owned product variant metafields. In a Function input query, those fields must include the `$app` namespace explicitly:

```graphql
metafield(namespace: "$app", key: "component_parents") {
  value
}
```

Do not query app-owned component/pricing metafields by key only. The app writers define and write `component_parents`, `component_reference`, `component_quantities`, `price_adjustment`, and `component_pricing` under `$app`; omitting the namespace makes the transform see null metadata and prevents `linesMerge` plus price adjustments from running.

## Checkout Discount Allocation Boundary

`lineUpdate` can set an adjusted fixed unit price, title, or image for a cart
line, but it does not create a named Shopify discount allocation row in cart or
checkout output. For FPB paid add-ons this means Cart Transform can make the
selected add-on charge `74610` instead of `82900`, but checkout will not show an
EB-style native `ADD ON (-...)` discount row or original/discounted price labels
from that operation alone.

Exact EB parity for paid add-on checkout reductions requires a Discount Function
path that emits a product discount candidate/message for the selected add-on
line; otherwise Checkout UI must stay inert and Cart Transform remains only the
price-adjustment source.

2026-06-30 implementation note: `extensions/bundle-discount-function` provides
the product Discount Function query and Rust logic for `_bundle_step_type`
values such as `addon:PERCENTAGE:10` and emits product discount candidates with
message `Add On`. `AddOnDiscountFunctionService` creates the matching automatic
app discount with EB-aligned settings: `discountClasses: ["PRODUCT"]` and
`combinesWith.orderDiscounts/productDiscounts: true`,
`combinesWith.shippingDiscounts: false`. The app config must request both
`read_discounts` and `write_discounts`; Shopify schema validation reports both
scopes for the activation flow. Cart Transform no longer emits a paid add-on
`lineUpdate` fixed unit price for selected add-on lines, otherwise the selected
add-on can be discounted twice once the Discount Function is active.

## See Also
- [[Architecture/Cart Transform Function]] — full implementation reference
- [[Features/Bundle Instance Tracking]]
