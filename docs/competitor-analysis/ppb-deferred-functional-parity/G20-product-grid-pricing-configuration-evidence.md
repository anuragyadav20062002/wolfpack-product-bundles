---
schema_version: 1
id: ppb-g20-pricing-configuration-evidence
title: PPB G20 Pricing Configuration Evidence
type: parity-evidence
status: active
summary: Documents Product List, Product Grid, and Horizontal Slots proof that saved quantity-tier pricing displays original, discounted, progress, and CTA pricing states.
last_audited: 2026-07-16
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
related_docs:
  - docs/competitor-analysis/ppb-product-grid-agentic-parity/PG06-discount-pricing-evidence.md
tags:
  - ppb
  - product-grid
  - pricing
keywords:
  - G20
  - Product List
  - Product Grid
  - Horizontal Slots
  - COGNIVE
  - CASCADE
  - MODAL
  - pricing configuration
---

# G20 Pricing Configuration

## Result

G20 is terminal **P** for Product List, Product Grid, and Horizontal Slots.

This evidence verifies the default active quantity-tier pricing configuration on the Product List, Product Grid, and Horizontal Slots fixtures. It does not close Vertical Slots, and it does not close G26's alternate cart-line discount-display formats.

## Product List evidence

`docs/competitor-analysis/ppb-product-list-agentic-parity/PL05-discounts-footer-fixture-evidence.md` used Chrome DevTools MCP for direct EB-first and WPB replay evidence.

EB Product List (`PDP_INPAGE / CASCADE`) persisted the active pricing configuration through `POST /api/mixAndMatch/update?shopName=yash-wolfpack.myshopify.com&offerId=MIX-156854` with status `200`:

- Discount enabled.
- Discount Type: `Percentage Off`.
- Rule #1: quantity greater than or equal to `2`, percentage off `5`.
- Rule #2: quantity greater than or equal to `3`, percentage off `10`.
- Discount Messaging enabled with default EB messages.

EB desktop and mobile:

- Empty selection: `Add 2 product(s) to save 5%!`.
- One selected product: `Add 1 product(s) to save 5%!`.
- Two selected products: discounted total `₹1375.60`, compare-at/original total `₹1448`, `5% off`, and next-tier copy `Congrats! Add 1 more product(s) to save 10%!`.
- Three selected products: discounted total `₹1599.30`, compare-at/original total `₹1777`, `10% off`, and success copy `Success! Your 10% discount has been applied to your cart.`

WPB Product List desktop and mobile on served widget `5.0.144`:

- Empty selection: `Add 2 product(s) to save 5%!`.
- One selected product: `Add 1 product(s) to save 5%!`.
- Two selected products: `Congrats! Add 1 more product(s) to save 10%!`, visible `5% off`, and the compare-at node present.
- Three selected products: `Success! Your 10% discount has been applied to your cart.`, visible `10% off`, and the compare-at node present.

This proves G20 Product List.

## EB Product Grid evidence

Storefront:

- URL: `https://yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`
- Template: `gbbmix-template-type="PDP_INPAGE"`, `gbbmix-template-id="COGNIVE"`.
- Cache Storage cleared and hard reload used before desktop and mobile passes.

Desktop `1280 x 800 x 1`:

- Before selection, visible pricing/progress copy included `Add 2 product(s) to save 5%!` and `Next`.
- After selecting two products, visible pricing showed:
  - selected item prices `₹829` and `₹619`;
  - retail total `₹1448`;
  - discounted total `₹1375.60`;
  - discount badge/copy `5% off`;
  - next-tier copy `Congrats! Add 1 more product(s) to save 10%!`;
  - CTA pricing `Next • ₹1375.60`.
- App-owned requests were healthy: `cart.js`, `updateMixAndMatchBundleView`, and Storefront GraphQL returned `200`.

Mobile `390 x 844 x 3`:

- Before selection, visible pricing/progress copy included `Add 2 product(s) to save 5%!` and `Next`.
- After selecting two products, visible pricing showed:
  - selected item prices `₹829` and `₹619`;
  - retail total `₹1448`;
  - discounted total `₹1375.60`;
  - discount badge/copy `5% off`;
  - next-tier copy `Congrats! Add 1 more product(s) to save 10%!`;
  - CTA pricing `Next • ₹1375.60`.
- Horizontal overflow was `0`.
- App-owned request statuses were `200`.

## Wolfpack Product Grid evidence

Fixture mutation:

- Approved agent-store bundle `cmrf19c8d0000v0xpj8rz2wgh` was temporarily changed from `PDP_MODAL / SIMPLIFIED` to `PDP_INPAGE / COGNIVE`.
- The fixture was restored to `PDP_MODAL / SIMPLIFIED` after evidence capture.
- A post-restore hard reload confirmed `bundle-widget-product-page-modal.css` was served and Cognive CSS was no longer active.

Storefront:

- URL: `https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`
- Widget version: `5.0.189`.
- Cache Storage cleared and hard reload used before desktop and mobile passes.

Desktop `1280 x 800 x 1`:

- Bundle API returned `200`.
- Controls and language settings returned `200`.
- Storefront products API returned `200`.
- Cognive CSS was requested during the temporary Product Grid pass.
- Before selection, visible pricing/progress copy included `$0.00`, `Add 2 product(s) to save 5%!`, and `Add Bundle to Cart`.
- After selecting two products, visible pricing showed:
  - selected item prices `$829.00` and `$619.00`;
  - retail total `$1448.00`;
  - discounted total `$1375.60`;
  - next-tier copy `Add 1 product(s) to save 10%!`;
  - CTA pricing `Add Bundle to Cart • $1375.60`.

Mobile `390 x 844 x 3`:

- Widget version remained `5.0.189`.
- Bundle API returned `200`.
- Controls and language settings returned `200`.
- Storefront products API returned `200`.
- Before selection, visible pricing/progress copy included `$0.00`, `Add 2 product(s) to save 5%!`, and `Add Bundle to Cart`.
- After selecting two products, visible pricing showed:
  - selected item prices `$829.00` and `$619.00`;
  - retail total `$1448.00`;
  - discounted total `$1375.60`;
  - next-tier copy `Add 1 product(s) to save 10%!`;
  - CTA pricing `Add Bundle to Cart • $1375.60`.
- Horizontal overflow was `0`.

This proves G20 Product Grid.

## Horizontal Slots evidence

`docs/competitor-analysis/ppb-horizontal-slots-agentic-parity/HS06-discount-footer-evidence.md` and `docs/competitor-analysis/ppb-horizontal-slots-agentic-parity/HSS1-combined-desktop-stress-evidence.md` provide direct EB-first and WPB replay evidence for the same saved percentage-tier pricing behavior.

Mobile HS06 progression:

| Surface | Count 0 | Count 1 | Count 2 | Count 3 |
| --- | --- | --- | --- | --- |
| EB | `Add 2 product(s) to save 5%!`, `₹0` | `Add 1 product(s) to save 5%!`, `₹829` | `Congrats! Add 1 more product(s) to save 10%!`, `₹1448` original, `₹1375.60` discounted | `Success! Your 10% discount has been applied to your cart.`, `₹1977` original, `₹1779.30` discounted |
| WPB | `Add 2 more items to get 5% off`, `$0.00` | `Add 1 more item to get 5% off`, `$829.00` | `Add 1 more item to get 10% off`, `$1448.00` original, `$1375.60` discounted | `Congratulations! You got 10% off!`, `$1977.00` original, `$1779.30` discounted |

The evidence note classifies currency symbols and progress/success wording as store and bundle text configuration, not pricing-calculation deltas.

Desktop HSS1 stress pass at `1280 x 800`:

- EB Step 1 selected two products and produced original total `₹1228`, discounted total `₹1166.60`, count `2`, and next-tier 10% copy.
- EB Step 2 selected the third product and produced original total `₹1253`, discounted total `₹1127.70`, count `3`, 10% success copy, final CTA `₹1127.70`, `10% off`, and no horizontal overflow.
- WPB replay produced the equivalent Step 1 pricing state with original total `$1228.00`, discounted total `$1166.60`, count `2`, and next-tier 10% copy.
- WPB Step 2 produced original total `$1277.95`, discounted total `$1150.15`, count `3`, 10% success copy, final CTA `$1150.15`, and no horizontal overflow.
- The documented total differences were due only to different Step 2 survivor prices between stores.

This proves G20 Horizontal Slots.

## Matrix update

Promote G20 Product List, Product Grid, and Horizontal Slots to **P**.

Keep G20 Vertical Slots at **T** until desktop plus mobile pricing-visibility proof is captured or a stronger existing evidence note is located.
