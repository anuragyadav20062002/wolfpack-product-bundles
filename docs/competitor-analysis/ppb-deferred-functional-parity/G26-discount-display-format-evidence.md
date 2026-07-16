---
schema_version: 1
id: ppb-g26-discount-display-format-evidence
title: PPB G26 Discount Display Format Evidence
type: parity-evidence
status: active
summary: Documents EB passing all cart-line discount-display formats and WPB failing amount-only and percentage-only despite synced Cart Transform settings.
last_audited: 2026-07-16
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
  - cart-transform
source_paths:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - app/assets/widgets/shared/engine/cart-lines.js
  - app/assets/widgets/product-page/methods/cart-methods.js
  - extensions/bundle-cart-transform-rs/src/merge.rs
  - app/routes/app/app.settings.tsx
related_docs:
  - docs/competitor-analysis/ppb-deferred-functional-parity/G06-G25-cart-line-messaging-evidence.md
tags:
  - ppb
  - cart-line
  - cart-transform
  - discount-format
keywords:
  - G26
  - Discount format
  - You Save
  - amount_percentage
  - amount_only
  - percentage_only
---

# G26 Discount Display Format

## Result

G26 is terminal **E** for Product List, Product Grid, Horizontal Slots, and
Vertical Slots.

The EB PPB fixture passed all three saved cart-line discount-display formats.
WPB did not match EB for alternate formats: after syncing `amount_only` and
`percentage_only` into the live Cart Transform owner metafield, the live cart
line still rendered the amount-plus-percentage value.

This is a shared cart-line/runtime blocker, not a per-template layout issue.
The template only determines how products are selected before cart submission.
G06/G25 already proves all four PPB templates reach the same cart-line metadata
and Cart Transform path.

## EB evidence

Fixture:

- Store: `yash-wolfpack.myshopify.com`
- Bundle: `WPB PPB Product List Parity 2026-07-11`
- Offer: `MIX-156854`
- Template during replay: Product Grid, `PDP_INPAGE + COGNIVE`
- Selection: three products qualifying for the 10% tier:
  `14k Dangling Obsidian Earrings`,
  `14k Dangling Pendant Earrings`,
  `14k Intertwined Earrings`

The EB Admin Bundle Settings card was temporarily changed from **Use app
defaults** to **Customize for this bundle** for each format, then restored to
**Use app defaults** after the replay.

### Amount and percentage

Desktop `1280 x 800`, cache cleared and hard reloaded:

- CTA before submit: `Add Bundle to Cart • ₹1779.30 10% off`
- `/cart.js` parent line:
  - `Retail Price`: `₹1977`
  - `You save`: `₹197.70 (10%)`
  - `Items`: `1 x 14k Dangling Obsidian Earrings, 1 x 14k Dangling Pendant Earrings, 1 x 14k Intertwined Earrings`
- Horizontal overflow: `0`

Mobile `390 x 844`, cache cleared and hard reloaded:

- CTA before submit: `Add Bundle to Cart • ₹1779.30 10% off`
- `/cart.js` parent line:
  - `Retail Price`: `₹1977`
  - `You save`: `₹197.70 (10%)`
- Horizontal overflow: `0`

### Amount only

Desktop `1280 x 800`, cache cleared and hard reloaded:

- CTA before submit: `Add Bundle to Cart • ₹1779.30 10% off`
- `/cart.js` parent line:
  - `Retail Price`: `₹1977`
  - `You save`: `₹197.70`
- Horizontal overflow: `0`

Mobile `390 x 844`, cache cleared and hard reloaded:

- CTA before submit: `Add Bundle to Cart • ₹1779.30 10% off`
- `/cart.js` parent line:
  - `Retail Price`: `₹1977`
  - `You save`: `₹197.70`
- Horizontal overflow: `0`

### Percentage only

Desktop `1280 x 800`, cache cleared and hard reloaded:

- CTA before submit: `Add Bundle to Cart • ₹1779.30 10% off`
- `/cart.js` parent line:
  - `Retail Price`: `₹1977`
  - `You save`: `10%`
- Horizontal overflow: `0`

Mobile `390 x 844`, cache cleared and hard reloaded:

- CTA before submit: `Add Bundle to Cart • ₹1779.30 10% off`
- `/cart.js` parent line:
  - `Retail Price`: `₹1977`
  - `You save`: `10%`
- Horizontal overflow: `0`

## WPB evidence

Fixture:

- Store: `agent-5sfidg3m.myshopify.com`
- Bundle ID: `cmrf19c8d0000v0xpj8rz2wgh`
- Bundle: `PPB Modal Shared Card Test`
- Template during replay: Vertical Slots, `PDP_MODAL + SIMPLIFIED`
- Widget version: `5.0.189`
- Selection: two products qualifying for the 5% tier:
  `14k Dangling Obsidian Earrings`,
  `14k Dangling Pendant Earrings`

The source path emits all three candidate display values in
`_bundle_display_properties`:

- amount: formatted discount amount;
- percentage: rounded percent;
- amountPercentage: amount plus percent.

The Cart Transform should then choose the public `You Save` value from the
synced function-owner `bundle_cart_line_messaging` metafield.

### Amount-only replay

The SIT fixture was temporarily updated to:

```json
{
  "isEnabled": true,
  "showBundleContains": true,
  "showOriginalPrice": true,
  "discountDisplay": {
    "isEnabled": true,
    "format": "amount_only"
  }
}
```

`CartTransformService.syncCartLineMessagingSettings` returned success with
Cart Transform `gid://shopify/CartTransform/111771907`.

Desktop `1280 x 800`, cache cleared and hard reloaded:

- CTA before submit: `Add Bundle to Cart • $1375.60`
- `/cart.js` parent line:
  - `Retail Price`: `$1448.00`
  - expected `You Save`: `$72.40`
  - actual `You Save`: `$72.40 (5%)`
- Horizontal overflow: `0`

### Percentage-only replay

The SIT fixture was then temporarily updated to:

```json
{
  "isEnabled": true,
  "showBundleContains": true,
  "showOriginalPrice": true,
  "discountDisplay": {
    "isEnabled": true,
    "format": "percentage_only"
  }
}
```

`CartTransformService.syncCartLineMessagingSettings` again returned success for
Cart Transform `gid://shopify/CartTransform/111771907`.

A direct Admin GraphQL read of the function owner metafield returned:

```json
{
  "namespace": "app--299492081665",
  "key": "bundle_cart_line_messaging",
  "value": "{\"isEnabled\":true,\"showBundleContains\":true,\"showOriginalPrice\":true,\"discountDisplay\":{\"isEnabled\":true,\"format\":\"percentage_only\"}}",
  "type": "json"
}
```

Desktop `1280 x 800`, cache cleared and hard reloaded after propagation wait:

- `/cart.js` parent line:
  - `Retail Price`: `$1448.00`
  - expected `You Save`: `5%`
  - actual `You Save`: `$72.40 (5%)`
- Horizontal overflow: `0`

## Restore

EB was restored to **Use app defaults** and saved.

WPB was restored to baseline:

```json
{
  "isEnabled": true,
  "showBundleContains": true,
  "showOriginalPrice": true,
  "discountDisplay": {
    "isEnabled": true,
    "format": "amount_percentage"
  }
}
```

The WPB storefront cart was cleared after restore.

## Interpretation

EB executes all three saved formats. WPB persists and syncs the alternate
formats, but the live deployed cart line still exposes amount-plus-percentage.
Until the deployed cart-line/Cart Transform path chooses the saved format, G26
must remain terminal **E** across all PPB templates.
