---
title: Cart Transform Function
type: architecture
audited: 2026-07-04
source: extensions/bundle-cart-transform-rs/shopify.extension.toml; extensions/bundle-cart-transform-rs/src/merge.rs
---

# Cart Transform Function

## Overview

The cart transform function intercepts Shopify's checkout flow to merge individual product variants into logical bundle line items and apply bundle pricing. The active implementation is the Rust Shopify Function in `extensions/bundle-cart-transform-rs`, compiled to WASM.

> ⚠️ The original `docs/CART_TRANSFORM_FUNCTION.md` contained multiple critical errors. This note is the authoritative reference.

---

## Extension Config (authoritative)

From `extensions/bundle-cart-transform-rs/shopify.extension.toml`:

```toml
api_version = "2025-10"
[[extensions]]
name = "Bundle Cart Transform (Rust)"
handle = "bundle-cart-transform-rs"
type = "function"
[[extensions.targeting]]
target = "cart.transform.run"
```

### Migration Note — Target Deprecation

`purchase.cart-transform.run` was **deprecated in the 2025-07 API release**. The current Rust extension uses:
```
cart.transform.run
```
Migrate before the deprecation sunset. The function still works on `2025-10` with the old target but will break when Shopify removes it.

---

## Language & Build

- **Language**: Rust
- **Compiled to**: WASM via Cargo and Shopify Functions
- **Build command**: `cd extensions/bundle-cart-transform-rs && rustup run stable cargo build --target=wasm32-unknown-unknown --release`
- **Output**: `extensions/bundle-cart-transform-rs/target/wasm32-unknown-unknown/release/`

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

The function groups cart lines by EB's public `_wolfpackProductBundle:OfferId` cart attribute. The item-specific suffix is removed before grouping, so `MIX-894502_K1K_1` and `MIX-894502_K1K_2` become one bundle instance group keyed by `MIX-894502_K1K`:

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

### BXY rounding

Shopify `linesMerge` can apply only one parent `percentageDecrease`, so mixed-price Buy X Get Y bundles use a percentage equivalent to the exact reward value. Component detail rows may need proportional allocation, but parent cart metadata must use whole-bundle cents derived from the rounded discount amount. Do not sum rounded per-component bundle cents into `_bundle_total_price_cents`; that can drift by one cent for mixed-price BXY groups. The authoritative parent attributes are:

- `_bundle_total_retail_cents`
- `_bundle_total_price_cents`
- `_bundle_total_savings_cents`

---

## Bundle Instance Tracking

- Each add-to-cart generates one EB session key and writes `_wolfpackProductBundle:OfferId` as `{offerId}_{sessionKey}_{itemIndex}`
- Cart Transform groups component lines by the `{offerId}_{sessionKey}` base and uses `_bundleName` for the parent title
- Shopify's cart line properties still differ per component line because the trailing item index differs
- See [[Features/Bundle Instance Tracking]]
