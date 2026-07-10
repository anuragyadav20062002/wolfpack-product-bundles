---
title: Cart Transform Function
type: architecture
audited: 2026-07-10
source: extensions/bundle-cart-transform-rs/shopify.extension.toml; extensions/bundle-cart-transform-rs/src/merge.rs; app/services/cart-transform-runtime-token.server.ts
---

# Cart Transform Function

## Overview

The cart transform function intercepts Shopify's checkout flow to merge individual product variants into logical bundle line items and apply bundle pricing. The active implementation is the Rust Shopify Function in `extensions/bundle-cart-transform-rs`, compiled to WASM.

As of 2026-07-08, MERGE validation is runtime-token based. Storefront widgets POST the selected component/add-on variants to the signed app-proxy route `/apps/product-bundles/api/cart-transform-runtime-token` immediately before `/cart/add`. The route validates the selected variants against the current DB bundle config, signs a base64url payload with HMAC-SHA256, and returns `_wolfpack_bundle_runtime`. The Cart Transform and Discount Function verify that token with the same CartTransform owner metafield secret before trusting component, quantity, parent, pricing, or add-on discount data.

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

1. **MERGE**: Groups all component lines for a bundle instance into a single parent line after verifying `_wolfpack_bundle_runtime`
   - `parentVariantId`: the bundle variant ID
   - `title`: bundle name (must be **unique per instance** to prevent Shopify's automatic consolidation of duplicate merges — append `" (2)"`, `" (3)"`, etc. via `bundleNameCounts` Map)
2. **EXPAND**: Breaks the merged line back into components at checkout for fulfillment

### Runtime token contract

The token payload contains:
- `offerGroupId` matching the `_wolfpackProductBundle:OfferId` base
- selected base `components` as ProductVariant GIDs plus quantities
- selected `addons` plus authorized percentage discount metadata
- parent bundle variant GID
- price adjustment config copied from current bundle pricing

The HMAC covers the base64url payload string, so Rust verifies the signature before decoding JSON. If `runtime_token_secret` is configured on the CartTransform owner and a line token is missing, tampered, or mismatched against actual cart line variants/quantities, the function emits no merge or add-on discount.

Parent bundle metafields are still written for EXPAND/display paths: `component_reference`, `component_quantities`, `price_adjustment`, and `component_pricing`. Component-variant `$app:component_parents` is no longer the configured MERGE source.

---

## App-Context Diagnostics Gotcha

Cart Transform objects and owner metafields are app-owned. A generic Shopify CLI
store-auth query can authenticate successfully and still return empty
`cartTransforms` / `shopifyFunctions` for this app's Function state. Treat that
as an auth-context limitation, not proof that the transform is absent.

Use this order when a shop's storefront sends valid bundle lines but no merge
happens:

1. Start at the storefront version:
   `window.__BUNDLE_WIDGET_VERSION__`.
2. Confirm the deployed widget asset contains the current cart contract:
   `_wolfpackProductBundle:OfferId`, `_wolfpack_bundle_runtime`, and
   `/apps/product-bundles/api/cart-transform-runtime-token`.
3. Mint a runtime token through the storefront app proxy with real selected
   variants, add the component lines through `/cart/add`, and inspect
   `/cart.js`.
   - If component lines include `_wolfpack_bundle_runtime` but remain unmerged,
     the storefront contract is probably fine and the Function path rejected or
     did not run.
4. Verify active transform state through the embedded app route, not generic
   store auth:
   `https://admin.shopify.com/store/<store-handle>/apps/<app-handle>/api/check-cart-transform`
   then open the app iframe URL directly if the outer Admin shell hides the JSON.
5. If the route reports `activated: true` and no stale transforms but lines
   still do not merge, inspect/resync the CartTransform owner metafield
   `$app.runtime_token_secret` from app-context Admin API. The Rust MERGE path
   emits no operation when this secret is absent or mismatched.

Concrete 2026-07-10 example:

- `wolfpackdemostore.myshopify.com` loaded production widget `5.0.94` from
  `wolfpack-product-bundles-4-254`.
- The deployed asset already included the runtime-token contract.
- The app proxy minted a valid runtime token and `/cart/add` wrote component
  lines with `_wolfpack_bundle_runtime`.
- `/cart.js` still showed raw component lines.
- The embedded app route reported `activated: true`, one Rust transform, and no
  stale transforms.
- A generic `shopify store execute` query authenticated with
  `read_cart_transforms` but returned empty app-owned transforms/functions.

Conclusion for that case: not a widget payload issue; repair by running
`CartTransformService.completeSetup(admin, shopDomain)` in app context so the
active CartTransform is present and the `$app.runtime_token_secret` owner
metafield is synced.

### Repair script

Use `npm run cart-transform:repair` when multiple installed shops need the same
app-context repair. The script is disabled unless exactly one mode flag is set:

```bash
WPB_CART_TRANSFORM_REPAIR_DRY_RUN=true npm run cart-transform:repair
WPB_CART_TRANSFORM_REPAIR_APPLY=true npm run cart-transform:repair
```

Dry-run scans installed shops only and reports the target count. Apply mode
runs `CartTransformService.completeSetup(admin, shopDomain)` through
`unauthenticated.admin(shopDomain)` for every installed shop. That can create or
replace CartTransform objects and sync the `$app.runtime_token_secret` owner
metafield. Do not run apply mode against production without explicit manual
approval for that exact operation.

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

- Each add-to-cart generates one 12-character EB-style session key and writes `_wolfpackProductBundle:OfferId` as `{offerId}_{sessionKey}_{itemIndex}`
- Cart Transform groups component lines by the `{offerId}_{sessionKey}` base and uses `_bundleName` for the parent title
- Shopify's cart line properties still differ per component line because the trailing item index differs
- See [[Features/Bundle Instance Tracking]]
