---
schema_version: 1
id: ppb-s09-s13-vertical-slots-cart-contract-evidence
title: PPB Vertical Slots Cart Contract Evidence
type: parity-evidence
status: active
summary: Documents EB and Wolfpack Vertical Slots blocked cart, cart-add, parent-line, bundle_details, and discount-transform proof for S09-S13.
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
  - vertical-slots
  - cart-contract
keywords:
  - S09
  - S10
  - S11
  - S12
  - S13
---

# PPB Vertical Slots Cart Contract Evidence

## Scope

Rows covered:

- S09 Successful cart add
- S10 Blocked cart add
- S11 Child properties and parent transform
- S12 `bundle_details` accumulation
- S13 Discount transform proof

Template covered: Vertical Slots (`PDP_MODAL` + `SIMPLIFIED`).

## Fixture and reload protocol

EB fixture:

- Storefront: `https://yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`
- Verified after Cache Storage clear, cart clear, session clear, and hard reload.
- Runtime attrs:
  - `document.body.getAttribute("gbbmix-template-type") === "PDP_MODAL"`
  - `document.body.getAttribute("gbbmix-template-id") === "SIMPLIFIED"`

Wolfpack fixture:

- Storefront: `https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`
- Verified after Cache Storage clear, cart clear, session clear, and hard reload.
- Runtime attrs:
  - `data-ppb-template-type="PDP_MODAL"`
  - `data-ppb-design-preset="SIMPLIFIED"`
  - `window.__BUNDLE_WIDGET_VERSION__ === "5.0.186"`

## EB Vertical Slots proof

### S10 blocked cart add

With zero selected products:

- EB rendered the page CTA as `.gbbMixAddtoCartBtn.gbbMixAddtoCartBtnV2.gbbMixAddtoCartBtnDisabled`.
- A direct click on the disabled CTA did not mutate cart state.
- `/cart.js` before click: `item_count: 0`, `items.length: 0`.
- `/cart.js` after click: `item_count: 0`, `items.length: 0`.

### S09, S11, S12, S13 successful add

Selection:

- EB Vertical Slots modal accepted selected products from the Product Page Bundle modal.
- Final enabled CTA displayed a discounted subtotal:
  - Retail subtotal: `₹1687`
  - Discounted subtotal: `₹1518.30`
  - Displayed savings: `10% off`

Cart/network proof:

- `POST /cart/add` returned `200`.
- Request used multipart `items[n]` child rows with `_easyBundle:OfferId` values:
  - `MIX-156854_3MR_1`
  - `MIX-156854_3MR_2`
  - `MIX-156854_3MR_3`
- Storefront API `cartMetafieldsSet` wrote `bundle_details` with key `MIX-156854_3MR` and `displayProperties`.
- Final `/cart.js` contained one parent bundle line:
  - `title: "WPB PPB Product List Parity 2026-07-11"`
  - `variant_id: 46378864672964`
  - `quantity: 1`
  - `final_line_price: 151830`
  - `properties._EasyBundleId: "MIX-156854"`
  - `properties._originalOfferId: "MIX-156854_663"`
  - `properties.Box: "1"`
  - `properties.Items: "1 x 14k Dangling Obsidian Earrings, 1 x 14k Interlinked Earrings, 1 x 14k Intertwined Earrings"`
  - `properties["Retail Price"]: "₹1687"`
  - `properties["You Save"]: "₹168.70 (10%)"`

This proves EB Vertical Slots blocks invalid cart mutation, submits the selected children through the EB multipart child-row cart contract, writes cart `bundle_details`, and produces a discounted parent cart line.

## Wolfpack Vertical Slots proof

### S10 blocked cart add

With zero selected products:

- WPB rendered the page CTA as `button.add-bundle-to-cart.disabled.bw-ppb-primary-cta--modal-vertical`.
- The CTA was natively disabled: `disabled === true`.
- A direct click on the disabled CTA did not mutate cart state.
- `/cart.js` before click: `item_count: 0`, `items.length: 0`.
- `/cart.js` after click: `item_count: 0`, `items.length: 0`.

### S09, S11, S12, S13 successful add

Selection:

- Selected `14k Dangling Obsidian Earrings`.
- Selected `14k Interlinked Earrings`.
- CTA became enabled and displayed `Add Bundle to Cart • $1100.10`.

App-owned request proof:

- `POST /apps/product-bundles/api/cart-transform-runtime-token` returned `200`.
- Runtime-token request body:
  - `bundleId: "cmrf19c8d0000v0xpj8rz2wgh"`
  - `bundleType: "product_page"`
  - `offerGroupId: "MIX-cmrf19c8d0000v0xpj8rz2wgh_RP2UOARM8OQE"`
  - `components[0]: { variantId: 48720141091075, productId: "9506413773059", quantity: 1 }`
  - `components[1]: { variantId: 48720137715971, productId: "9506413609219", quantity: 1 }`
- `POST /apps/product-bundles/api/cart-bundle-details` returned `200`.
- `cart-bundle-details` request body wrote:
  - `bundleDetailsKey: "MIX-cmrf19c8d0000v0xpj8rz2wgh_RP2UOARM8OQE"`
  - `displayProperties.Box: "1"`
  - `displayProperties.Items: "1 x 14k Dangling Obsidian Earrings, 1 x 14k Interlinked Earrings"`
  - `displayProperties["Retail Price"]: "$1158.00"`
  - `displayProperties["You Save"]: "$57.90 (5%)"`
- `POST /cart/add` returned `302` to `/cart`.
- `/cart/add` multipart body included child rows with:
  - `_wolfpackProductBundle:OfferId` values ending `_1` and `_2`
  - `_wolfpackProductBundle:prodQty: 1`
  - signed `_wolfpack_bundle_runtime`
  - `_bundle_display_properties`

Final cart proof:

- `/cart.js` contained one parent bundle line:
  - `title: "PPB Modal Shared Card Test"`
  - `variant_id: 49248299811075`
  - `quantity: 1`
  - `final_line_price: 110010`
  - `properties._is_bundle_parent: "true"`
  - `properties._bundle_component_count: "2"`
  - `properties._bundle_total_retail_cents: "115800"`
  - `properties._bundle_total_price_cents: "110010"`
  - `properties._bundle_total_savings_cents: "5790"`
  - `properties._bundle_discount_percent: "5.00"`
  - `properties.Items: "1 x 14k Dangling Obsidian Earrings, 1 x 14k Interlinked Earrings"`
  - `properties["Retail Price"]: "$1158.00"`
  - `properties["You Save"]: "$57.90 (5%)"`

This proves WPB Vertical Slots blocks invalid cart mutation, obtains a valid runtime token, writes cart `bundle_details`, posts child component rows, and produces a discounted parent cart line equivalent to EB semantics.

## Matrix decision

Promote Vertical Slots cells:

- S09 VS: `P`
- S10 VS: `P`
- S11 VS: `P`
- S12 VS: `P`
- S13 VS: `P`
