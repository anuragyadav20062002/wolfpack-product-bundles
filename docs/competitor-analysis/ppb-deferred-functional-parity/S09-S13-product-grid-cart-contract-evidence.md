---
schema_version: 1
id: ppb-s09-s13-product-grid-cart-contract-evidence
title: PPB Product Grid Cart Contract Evidence
type: parity-evidence
status: active
summary: Documents EB and Wolfpack Product Grid cart-add, parent-line, bundle_details, and discount-transform proof for S09 and S11-S13.
last_audited: 2026-07-15
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
  - cart-transform
source_paths:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - app/assets/widgets/product-page/methods/cart-methods.js
  - app/services/cart-transform-runtime-token.server.ts
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
tags:
  - ppb
  - product-grid
  - cart-contract
keywords:
  - S09
  - S11
  - S12
  - S13
---

# S09-S13 Product Grid Cart Contract Evidence

**Date:** 2026-07-15
**Template:** Product Grid / `PDP_INPAGE + COGNIVE`
**Verification method:** Chrome DevTools MCP, desktop `1280x800`, Cache Storage cleared, hard reload with `ignoreCache: true`, cart cleared before the replay.

## EB Product Grid

Persisted EB runtime/template state:

- `gbbmix-template-type="PDP_INPAGE"`
- `gbbmix-template-id="COGNIVE"`

Selection path:

1. Step 1 selected `14k Dangling Obsidian Earrings` at `₹829`.
2. Step 1 selected `14k Dangling Pendant Earrings` at `₹619`.
3. EB advanced to Step 2 but final CTA remained blocked until one more product was selected.
4. Step 2 selected `14k Intertwined Earrings` at `₹529`.
5. Final CTA enabled as `Add Bundle to Cart • ₹1779.30 10% off`.

Cart result from `/cart.js`:

- parent line title: `WPB PPB Product List Parity 2026-07-11`
- quantity: `1`
- final/original line price: `177930`
- properties:
  - `_EasyBundleId`: `MIX-156854`
  - `_Items`: empty string
  - `_originalOfferId`: `MIX-156854_3MR`
  - `Box`: `1`
  - `Items`: `1 x 14k Dangling Obsidian Earrings, 1 x 14k Dangling Pendant Earrings, 1 x 14k Intertwined Earrings`
  - `Retail Price`: `₹1977`
  - `You Save`: `₹197.70 (10%)`
- line discounts: `[]`

Network proof:

- `POST /api/2025-04/graphql.json` returned `200`.
- Request mutation: `cartMetafieldsSet`.
- Metafield key: `bundle_details`.
- Metafield type: `json`.
- Value recorded:

```json
{
  "MIX-156854_3MR": {
    "displayProperties": {
      "Items": "1 x 14k Dangling Obsidian Earrings, 1 x 14k Dangling Pendant Earrings, 1 x 14k Intertwined Earrings",
      "Retail Price": "₹1977",
      "You Save": "₹197.70 (10%)"
    }
  }
}
```

- Response `userErrors`: `[]`.

## Wolfpack Product Grid

Persisted WPB state:

- `bundleDesignTemplate="PDP_INPAGE"`
- `bundleDesignPresetId="COGNIVE"`

Hard reload result:

- loaded widget version: `5.0.186`
- Product Grid CTA after two selected Step 1 products: `Add Bundle to Cart • $1375.60`

Selection path:

1. Selected `14k Dangling Obsidian Earrings` at `$829`.
2. Selected `14k Dangling Pendant Earrings` at `$619`.
3. Clicked `Add Bundle to Cart • $1375.60`.

Network proof:

- `POST /apps/product-bundles/api/cart-transform-runtime-token` returned `200`.
- Runtime-token request body:

```json
{
  "bundleId": "cmrf19c8d0000v0xpj8rz2wgh",
  "bundleType": "product_page",
  "offerGroupId": "MIX-cmrf19c8d0000v0xpj8rz2wgh_ZYE32IQAWSTW",
  "components": [
    {
      "variantId": 48720141091075,
      "productId": "9506413773059",
      "quantity": 1
    },
    {
      "variantId": 48720137748739,
      "productId": "9506413641987",
      "quantity": 1
    }
  ],
  "addons": []
}
```

- `POST /apps/product-bundles/api/cart-bundle-details` returned `200`.
- Bundle-details request body:

```json
{
  "cartToken": "hWNE5xrdWS79WqvUTcWhpMyC?key=72447ef94ed54cfdb1c4bab7b666e7e2",
  "bundleDetailsKey": "MIX-cmrf19c8d0000v0xpj8rz2wgh_ZYE32IQAWSTW",
  "displayProperties": {
    "Box": "1",
    "Items": "1 x 14k Dangling Obsidian Earrings, 1 x 14k Dangling Pendant Earrings",
    "Retail Price": "$1448.00",
    "You Save": "$72.40 (5%)"
  }
}
```

- `POST /cart/add` completed and redirected to `/cart`.

Cart result from `/cart.js`:

- `item_count`: `1`
- `total_price`: `137560`
- parent line title/product title: `PPB Modal Shared Card Test`
- quantity: `1`
- final/original line price: `137560`
- properties:
  - `_is_bundle_parent`: `true`
  - `_bundle_name`: `PPB Modal Shared Card Test`
  - `_bundle_component_count`: `2`
  - `_bundle_components`: component payload with two child components, retail cents, discounted cents, `5.0` discount, and savings cents
  - `_bundle_total_retail_cents`: `144800`
  - `_bundle_total_price_cents`: `137560`
  - `_bundle_total_savings_cents`: `7240`
  - `_bundle_discount_percent`: `5.00`
  - `_Items`: empty string
  - `Box`: `1`
  - `Items`: `1 x 14k Dangling Obsidian Earrings, 1 x 14k Dangling Pendant Earrings`
  - `Retail Price`: `$1448.00`
  - `You Save`: `$72.40 (5%)`
- line discounts: `[]`

Console/network notes:

- App-owned post-fix cart path was healthy: runtime token `200`, bundle-details `200`, and cart add completed.
- Preserved console retained the earlier pre-fix runtime-token `400`; that request was superseded by the verified `5.0.186` hard-reload replay.
- The dev extension also logged a non-cart-blocking missing `bundle-widget-product-page-cognive.css` stylesheet warning.

## Matrix cells closed

- S09 Product Grid: valid Product Grid selection created the expected parent cart line.
- S11 Product Grid: parent line includes offer/session-derived bundle metadata and visible display properties.
- S12 Product Grid: EB writes `bundle_details`; WPB posts the equivalent bundle-details display payload successfully.
- S13 Product Grid: cart total and line metadata agree with the displayed discount in each app.

S10 Product Grid remains open because blocked cart mutation needs a clean isolated replay with the cart empty before and after an invalid action probe.
