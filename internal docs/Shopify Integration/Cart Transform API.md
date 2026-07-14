---
schema_version: 1
id: cart-transform-api
title: Cart Transform API
type: shopify-integration
status: authoritative
summary: Shopify Cart Transform API target, activation, failure policy, inputs, and checkout-pricing boundaries.
last_audited: 2026-07-14
owners:
  - engineering
domains:
  - checkout
systems:
  - bundle-cart-transform-rs
  - cart-transform-service
source_paths:
  - extensions/bundle-cart-transform-rs/shopify.extension.toml
  - extensions/bundle-cart-transform-rs/src/run.graphql
  - app/services/cart-transform-service.server.ts
related_docs:
  - Architecture/Cart Transform Function.md
tags:
  - shopify-api
  - cart-transform
keywords:
  - blockOnFailure
  - cart.transform.run
---

# Cart Transform API

## Current Config

```toml
api_version = "2025-10"
target = "cart.transform.run"
```

## Failure policy

`CartTransformService` creates the active transform with `blockOnFailure: true`. This is a checkout-pricing safety requirement: when Shopify cannot execute the Function within its runtime or resource limits, cart and checkout operations must return an error instead of continuing with unmodified component prices. Omitting the argument uses Shopify's `false` default and is unsafe for a bundle app whose Function owns the payable price.

The setup flow queries `blockOnFailure` together with the active Function ID. A matching Rust transform is reusable only when the value is `true`; an older transform with `false` is deleted and recreated fail-closed. `completeSetup()` runs during install, explicit storefront sync, and the separately approved Cart Transform repair operation.

## Target status

| Target | Status |
|---|---|
| `purchase.cart-transform.run` | Deprecated since 2025-07 |
| `cart.transform.run` | Current and configured |

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

## Function Input Runtime Token

The configured MERGE path reads `_wolfpack_bundle_runtime` from each selected cart line and verifies it with the CartTransform owner metafield:

```graphql
cartTransform {
  runtimeTokenSecret: metafield(namespace: "$app", key: "runtime_token_secret") {
    value
  }
}
cart {
  lines {
    runtimeToken: attribute(key: "_wolfpack_bundle_runtime") {
      value
    }
  }
}
```

The token is issued only by the signed app-proxy route `/apps/product-bundles/api/cart-transform-runtime-token`. It validates the current DB bundle config before signing selected component/add-on variant GIDs, quantities, parent variant, and pricing config.

## Function Input Metafield Namespacing

The EXPAND/display path still reads parent bundle metadata from app-owned product variant metafields. In a Function input query, those fields must include the `$app` namespace explicitly:

```graphql
metafield(namespace: "$app", key: "component_parents") {
  value
}
```

Do not query app-owned component/pricing metafields by key only. The app writers define and write `component_reference`, `component_quantities`, `price_adjustment`, and `component_pricing` under `$app`; omitting the namespace makes EXPAND/display metadata unavailable.

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

2026-07-08 correction: add-on percentage markers are honored only when `_wolfpack_bundle_runtime` verifies that the selected add-on variant, quantity, and percentage are authorized. Unsigned or tampered add-on markers emit no product discount candidate.

## See Also
- [[Architecture/Cart Transform Function]] — full implementation reference
- [[Features/Bundle Instance Tracking]]
