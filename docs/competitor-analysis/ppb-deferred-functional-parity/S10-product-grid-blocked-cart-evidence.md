---
schema_version: 1
id: ppb-s10-product-grid-blocked-cart-evidence
title: PPB Product Grid Blocked Cart Evidence
type: parity-evidence
status: active
summary: Documents direct EB and Wolfpack Product Grid invalid-cart proof for S10.
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
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - docs/competitor-analysis/ppb-deferred-functional-parity/S09-S13-product-grid-cart-contract-evidence.md
tags:
  - ppb
  - product-grid
  - cart-contract
keywords:
  - S10
  - blocked-cart
  - COGNIVE
---

# PPB Product Grid Blocked Cart Evidence

## Scope

Row covered:

- S10 Product Grid: invalid selection cannot create a cart mutation.

Template covered: Product Grid (`PDP_INPAGE` + `COGNIVE`).

This closes the only Product Grid cart-contract gap left after the successful cart, parent transform, `bundle_details`, and discount proof in `S09-S13-product-grid-cart-contract-evidence.md`.

## Fixture and reload protocol

EB fixture:

- Storefront: `https://yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`
- Verified after Cache Storage clear, cart clear, session clear, and hard reload.
- Runtime attrs:
  - `document.body.getAttribute("gbbmix-template-type") === "PDP_INPAGE"`
  - `document.body.getAttribute("gbbmix-template-id") === "COGNIVE"`

Wolfpack fixture:

- Storefront: `https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`
- The approved test fixture was temporarily switched to Product Grid with only:
  - `bundleDesignTemplate: "PDP_INPAGE"`
  - `bundleDesignPresetId: "COGNIVE"`
- Verified after Cache Storage clear, cart clear, session clear, and hard reload.
- Runtime attrs:
  - `data-ppb-template-type="PDP_INPAGE"`
  - `data-ppb-design-preset="COGNIVE"`
  - `window.__BUNDLE_WIDGET_VERSION__ === "5.0.186"`

## EB Product Grid proof

With zero selected products:

- EB rendered the visible Product Grid CTA as:
  - text: `Next`
  - class includes `gbbMixCascadeAddToCartBtn--disabled`
  - class includes `gbbMixCascadeAddToCartBtn--disabled-conditionsNotMet`
- A direct click on the visible disabled/incomplete CTA did not mutate the cart.
- EB surfaced validation copy after click:
  - `Add at least 02 products on this step`
- `/cart.js` before click:
  - `item_count: 0`
  - `items.length: 0`
- `/cart.js` after click:
  - `item_count: 0`
  - `items.length: 0`

This proves EB Product Grid blocks the invalid step/cart progression without creating a Shopify cart mutation.

## Wolfpack Product Grid proof

With zero selected products:

- WPB rendered the Product Grid CTA as:
  - text: `Add Bundle to Cart`
  - class: `add-bundle-to-cart disabled`
  - native disabled state: `disabled === true`
- A direct click on the disabled CTA did not mutate the cart.
- `/cart.js` before click:
  - `item_count: 0`
  - `items.length: 0`
- `/cart.js` after click:
  - `item_count: 0`
  - `items.length: 0`

This proves WPB Product Grid blocks invalid cart submission and does not call through to a Shopify cart mutation when the bundle is incomplete.

## Matrix decision

Promote Product Grid S10 to `P`.
