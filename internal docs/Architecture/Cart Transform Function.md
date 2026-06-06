---
title: Cart Transform Function
type: architecture
audited: 2026-04-16
source: extensions/bundle-cart-transform-ts/shopify.extension.toml
---

# Cart Transform Function

## Overview

The cart transform function intercepts Shopify's checkout flow to merge individual product variants into logical bundle line items and apply bundle pricing. It is a **TypeScript** function compiled to **WASM** via Shopify's standard TypeScript build toolchain.

> ⚠️ The original `docs/CART_TRANSFORM_FUNCTION.md` contained multiple critical errors. This note is the authoritative reference.

---

## Extension Config (authoritative)

From `extensions/bundle-cart-transform-ts/shopify.extension.toml`:

```toml
api_version = "2025-10"
[[extensions]]
name = "Bundle Cart Transform"
handle = "bundle-cart-transform"
type = "function"
[[extensions.targeting]]
target = "purchase.cart-transform.run"
```

### Migration Note — Target Deprecation

`purchase.cart-transform.run` was **deprecated in the 2025-07 API release**. The new target is:
```
cart.transform.run
```
Migrate before the deprecation sunset. The function still works on `2025-10` with the old target but will break when Shopify removes it.

---

## Language & Build

- **Language**: TypeScript (not Rust — the original doc was wrong)
- **Compiled to**: WASM via Shopify's default TypeScript function build
- **Build command**: `cd extensions/bundle-cart-transform-ts && npm run build`
- **Output**: `extensions/bundle-cart-transform-ts/dist/` (gitignored)

---

## Operation Names (2025-07+ API)

As of API version `2025-07`, the operation names were renamed:

| Old name (pre-2025-07) | New name (2025-07+) |
|---|---|
| `expand` | `lineExpand` |
| `merge` | `linesMerge` |
| `update` | `lineUpdate` |

The codebase uses the new names. Do not use the old names when reading or modifying the function.

---

## MERGE/EXPAND Pattern

The function groups cart lines by EB's public `_easyBundle:OfferId` cart attribute. The item-specific suffix is removed before grouping, so `MIX-894502_K1K_1` and `MIX-894502_K1K_2` become one bundle instance group keyed by `MIX-894502_K1K`:

1. **MERGE**: Groups all component lines for a bundle instance into a single parent line
   - `parentVariantId`: the bundle variant ID
   - `title`: bundle name (must be **unique per instance** to prevent Shopify's automatic consolidation of duplicate merges — append `" (2)"`, `" (3)"`, etc. via `bundleNameCounts` Map)
2. **EXPAND**: Breaks the merged line back into components at checkout for fulfillment

---

## Pricing

- All prices stored and passed in **cents** (integers)
- `calculateDiscountPercentage()` clamps result to 0–100
- Supported discount methods: `percentage_off`, `fixed_amount_off`, `fixed_bundle_price`
- See [[Features/Pricing Pipeline]] for full unit conversion chain

---

## Bundle Instance Tracking

- Each add-to-cart generates one EB session key and writes `_easyBundle:OfferId` as `{offerId}_{sessionKey}_{itemIndex}`
- Cart Transform groups component lines by the `{offerId}_{sessionKey}` base and uses `_bundleName` for the parent title
- Shopify's cart line properties still differ per component line because the trailing item index differs
- See [[Features/Bundle Instance Tracking]]
