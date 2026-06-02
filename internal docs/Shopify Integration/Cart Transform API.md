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

## See Also
- [[Architecture/Cart Transform Function]] — full implementation reference
- [[Features/Bundle Instance Tracking]]
