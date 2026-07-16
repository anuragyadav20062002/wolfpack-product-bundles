---
schema_version: 1
id: ppb-g32-product-grid-corners-evidence
title: PPB G32 Product Grid Corners Evidence
type: parity-evidence
status: active
summary: Documents Product Grid corner-radius parity for EB and Wolfpack product cards, add controls, category tabs, and primary CTA surfaces.
last_audited: 2026-07-15
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
tags:
  - ppb
  - product-grid
  - design-tokens
keywords:
  - G32
  - Product Grid
  - corners
  - border-radius
---

# G32 Product Grid Corners

## Result

Row G32 is terminal **P** for Product Grid.

EB and Wolfpack Product Grid both render the default saved corner system consistently on the applicable Product Grid surfaces:

- product card: `7px`
- product-card Add control: `5px`
- primary in-page Next/Add Bundle CTA: `5px`
- zero horizontal document overflow at desktop and mobile sizes

Product Grid has no slot or modal sheet surface; those are Horizontal Slots / Vertical Slots concerns and remain unclaimed by this evidence.

## EB Product Grid proof

Chrome DevTools MCP was used directly. The EB storefront was cache-cleared and hard reloaded before each viewport pass:

- URL: `https://yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`
- Runtime: `PDP_INPAGE / COGNIVE`
- Stylesheets: `easy-bundle-product-page-min.css`, `easy-bundle-min.css`

Desktop `1280x800`:

```json
{
  "viewport": { "w": 1280, "h": 800, "dpr": 1 },
  "bodyAttrs": { "type": "PDP_INPAGE", "id": "COGNIVE" },
  "productCard": {
    "class": "gbbMixCascadeProductWrapper",
    "rect": { "w": 97.7, "h": 207.2 },
    "radius": "7px"
  },
  "addControl": {
    "class": "gbbMixCascadeAddBtn",
    "rect": { "w": 97.7, "h": 32 },
    "radius": "5px",
    "background": "rgb(0, 0, 0)"
  },
  "primaryCta": {
    "class": "gbbMixCascadeAddToCartBtn gbbMixCascadeAddToCartBtnV2 gbbMixCascadeNextBtn",
    "text": "Next",
    "rect": { "w": 345, "h": 41.2 },
    "radius": "5px",
    "background": "rgb(0, 0, 0)"
  },
  "overflowX": 0
}
```

Mobile `390x844x3`:

```json
{
  "viewport": { "w": 390, "h": 844, "dpr": 3 },
  "bodyAttrs": { "type": "PDP_INPAGE", "id": "COGNIVE" },
  "productCard": {
    "class": "gbbMixCascadeProductWrapper",
    "rect": { "w": 164.5, "h": 274 },
    "radius": "7px"
  },
  "addControl": {
    "class": "gbbMixCascadeAddBtn",
    "rect": { "w": 164.5, "h": 32 },
    "radius": "5px",
    "background": "rgb(0, 0, 0)"
  },
  "primaryCta": {
    "class": "gbbMixCascadeAddToCartBtn gbbMixCascadeAddToCartBtnV2 gbbMixCascadeNextBtn",
    "text": "Next",
    "rect": { "w": 352, "h": 37.6 },
    "radius": "5px",
    "background": "rgb(0, 0, 0)"
  },
  "overflowX": 0
}
```

## Wolfpack Product Grid proof

Temporary WPB fixture:

- Bundle: `cmrf19c8d0000v0xpj8rz2wgh`
- Storefront: `https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`
- Template: `PDP_INPAGE / COGNIVE`
- Widget version: `5.0.186`

Chrome DevTools MCP cache-cleared hard reload desktop `1280x800`:

```json
{
  "viewport": { "w": 1280, "h": 800, "dpr": 1 },
  "version": "5.0.186",
  "bodyAttrs": { "type": "PDP_INPAGE", "id": "COGNIVE" },
  "categoryTabs": [
    { "text": "Category 1", "radius": "5px" },
    { "text": "Category 2Long Label Empty Category", "radius": "5px" }
  ],
  "productCard": {
    "class": "bw-product-card bw-product-card--mode-grid bw-ppb-cognive-product-card",
    "rect": { "w": 103.8, "h": 253.8 },
    "radius": "7px"
  },
  "addControl": {
    "class": "bw-product-card__add-button product-add-btn",
    "rect": { "w": 103.8, "h": 32 },
    "radius": "5px",
    "background": "rgb(0, 0, 0)"
  },
  "primaryCta": {
    "class": "add-bundle-to-cart disabled",
    "text": "Add Bundle to Cart",
    "rect": { "w": 372.3, "h": 41 },
    "radius": "5px",
    "background": "rgb(0, 0, 0)"
  },
  "overflowX": 0
}
```

Chrome DevTools MCP cache-cleared hard reload mobile `390x844x3`:

```json
{
  "viewport": { "w": 390, "h": 844, "dpr": 3 },
  "version": "5.0.186",
  "bodyAttrs": { "type": "PDP_INPAGE", "id": "COGNIVE" },
  "categoryTabs": [
    { "text": "Category 1", "radius": "5px" },
    { "text": "Category 2Long Label Empty Category", "radius": "5px" }
  ],
  "productCard": {
    "class": "bw-product-card bw-product-card--mode-grid bw-ppb-cognive-product-card",
    "rect": { "w": 163.5, "h": 313.5 },
    "radius": "7px"
  },
  "addControl": {
    "class": "bw-product-card__add-button product-add-btn",
    "rect": { "w": 163.5, "h": 32 },
    "radius": "5px",
    "background": "rgb(0, 0, 0)"
  },
  "primaryCta": {
    "class": "add-bundle-to-cart disabled",
    "text": "Add Bundle to Cart",
    "rect": { "w": 350, "h": 41 },
    "radius": "5px",
    "background": "rgb(0, 0, 0)"
  },
  "overflowX": 0
}
```

App-owned runtime resources returned during the WPB pass:

- `/apps/product-bundles/api/design-settings/agent-5sfidg3m.myshopify.com?bundleType=product_page`
- `/apps/product-bundles/api/language-settings/agent-5sfidg3m.myshopify.com?bundleType=product_page&locale=en`
- `/apps/product-bundles/api/controls-settings/agent-5sfidg3m.myshopify.com?bundleType=product_page`
- `/apps/product-bundles/api/bundle/cmrf19c8d0000v0xpj8rz2wgh.json`
- `/apps/product-bundles/api/storefront-products?...`
- `/apps/product-bundles/api/bundle/cmrf19c8d0000v0xpj8rz2wgh/view`

Console noise was limited to Shopify/theme messages (`content-visibility`, missing form id/name, and non-app-owned 401/404 resources). No app-owned runtime request failure was observed.

## Fixture restore

The WPB bundle was restored after the evidence pass:

```json
{
  "bundleDesignTemplate": "PDP_MODAL",
  "bundleDesignPresetId": "SIMPLIFIED",
  "useSingleStepCategoriesAsBundleSteps": false
}
```

Post-restore cache-cleared hard reload checks:

- Desktop `1280x800`: `PDP_MODAL / SIMPLIFIED`, Vertical Slots markers present, Product Grid card absent, `overflowX: 0`.
- Mobile `390x844x3`: `PDP_MODAL / SIMPLIFIED`, Vertical Slots markers present, Product Grid card absent, `overflowX: 0`.
