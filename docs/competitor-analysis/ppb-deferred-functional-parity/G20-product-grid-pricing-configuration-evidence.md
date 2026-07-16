---
schema_version: 1
id: ppb-g20-product-grid-pricing-configuration-evidence
title: PPB G20 Product Grid Pricing Configuration Evidence
type: parity-evidence
status: active
summary: Documents current EB and Wolfpack Product Grid proof that saved quantity-tier pricing displays original, discounted, progress, and CTA pricing states on desktop and mobile.
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
  - Product Grid
  - COGNIVE
  - pricing configuration
---

# G20 Product Grid Pricing Configuration

## Result

G20 is terminal **P** for Product Grid.

This batch verifies the default active quantity-tier pricing configuration on the current EB and Wolfpack Product Grid fixtures. It does not close Product List, Horizontal Slots, or Vertical Slots, and it does not close G26's alternate cart-line discount-display formats.

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

## Matrix update

Promote G20 Product Grid to **P**.

Keep G20 Product List, Horizontal Slots, and Vertical Slots at **T** until the same pricing-visibility proof is captured on those templates.
