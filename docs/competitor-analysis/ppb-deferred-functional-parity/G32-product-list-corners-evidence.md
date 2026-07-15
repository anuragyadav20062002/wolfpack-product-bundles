---
schema_version: 1
id: ppb-g32-product-list-corners-evidence
title: PPB G32 Product List Corners Evidence
type: parity-evidence
status: active
summary: Documents Product List corner-radius parity for EB and Wolfpack product rows, add controls, category tabs, and primary CTA surfaces.
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
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - docs/competitor-analysis/ppb-deferred-functional-parity/G32-product-grid-corners-evidence.md
tags:
  - ppb
  - product-list
  - design-tokens
keywords:
  - G32
  - Product List
  - corners
  - border-radius
---

# G32 Product List Corners

## Result

Row G32 is terminal **P** for Product List.

EB and Wolfpack Product List both render the current saved corner system on the applicable in-page surfaces:

- product row/card: `7px`
- product-row image container: `8px` / clipped where applicable
- product-card Add control: `5px`
- category tab: `5px`
- primary in-page CTA: `5px`
- zero horizontal document overflow at desktop and mobile sizes

Product List has no modal sheet or slot-card surface; those are Horizontal Slots / Vertical Slots concerns and are covered by their own G32 evidence notes.

## EB Product List proof

Chrome DevTools MCP was used directly. The EB template was temporarily switched through the EB Admin template overlay to Product List. The EB storefront was cache-cleared and hard reloaded before each viewport pass:

- URL: `https://yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`
- Runtime: `PDP_INPAGE / CASCADE`
- Body markers: `gbbmix-template-type="PDP_INPAGE"`, `gbbmix-template-id="CASCADE"`

Desktop `1280x800`:

```json
{
  "viewport": { "w": 1280, "h": 800, "dpr": 1 },
  "runtime": { "template": { "id": "CASCADE", "type": "PDP_INPAGE" } },
  "cssVars": {
    "--product-card-border-radius": "10px",
    "--product-card-button-border-radius": "5px",
    "--footer-border-radius": "10px",
    "--tabs-border-radius": "8px"
  },
  "productWrapper": {
    "class": "gbbMixCascadeProductWrapper",
    "text": "14k Dangling Obsidian Earrings₹829Add +",
    "radius": "7px"
  },
  "imageWrapper": {
    "class": "gbbMixCascadeProductImageWrapper",
    "radius": "8px",
    "overflow": "hidden"
  },
  "addControl": {
    "class": "gbbMixCascadeAddBtn",
    "text": "Add +",
    "radius": "5px",
    "background": "rgb(0, 0, 0)"
  },
  "activeCategoryTab": {
    "class": "gbbMixCascadeCategoryTab--active",
    "text": "Category 1",
    "radius": "5px",
    "background": "rgb(30, 30, 30)"
  },
  "stepBadge": {
    "class": "gbbMixCascadeStepIconBadge",
    "text": "1",
    "radius": "50%"
  },
  "overflowX": 0
}
```

Mobile `390x844x3`:

```json
{
  "viewport": { "w": 390, "h": 844, "dpr": 3 },
  "runtime": { "template": { "id": "CASCADE", "type": "PDP_INPAGE" } },
  "cssVars": {
    "--product-card-border-radius": "10px",
    "--product-card-button-border-radius": "5px",
    "--footer-border-radius": "10px",
    "--tabs-border-radius": "8px"
  },
  "productWrapper": {
    "class": "gbbMixCascadeProductWrapper",
    "text": "14k Dangling Obsidian Earrings₹829Add +",
    "radius": "7px"
  },
  "imageWrapper": {
    "class": "gbbMixCascadeProductImageWrapper",
    "radius": "8px",
    "overflow": "hidden"
  },
  "addControl": {
    "class": "gbbMixCascadeAddBtn",
    "text": "Add +",
    "radius": "5px",
    "background": "rgb(0, 0, 0)"
  },
  "activeCategoryTab": {
    "class": "gbbMixCascadeCategoryTab--active",
    "text": "Category 1",
    "radius": "5px",
    "background": "rgb(30, 30, 30)"
  },
  "stepBadge": {
    "class": "gbbMixCascadeStepIconBadge",
    "text": "1",
    "radius": "50%"
  },
  "overflowX": 0
}
```

## Wolfpack Product List proof

Temporary WPB fixture:

- Bundle: `cmrf19c8d0000v0xpj8rz2wgh`
- Storefront: `https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`
- Template: `PDP_INPAGE / CASCADE`
- Widget version: `5.0.187`

The scoped fixture was temporarily switched through Prisma:

```json
{
  "bundleDesignTemplate": "PDP_INPAGE",
  "bundleDesignPresetId": "CASCADE",
  "useSingleStepCategoriesAsBundleSteps": false
}
```

Chrome DevTools MCP cache-cleared hard reload desktop `1280x800` with bundle JSON cache-busting:

```json
{
  "viewport": { "w": 1280, "h": 800, "dpr": 1 },
  "version": "5.0.187",
  "fetches": [
    {
      "status": 200,
      "template": "PDP_INPAGE",
      "preset": "CASCADE",
      "steps": [
        { "name": "Step 1", "enabled": true },
        { "name": "Step 2", "enabled": false }
      ]
    }
  ],
  "rootAttrs": {
    "data-ppb-template-type": "PDP_INPAGE",
    "data-ppb-design-preset": "CASCADE",
    "template-id": "CASCADE",
    "template-type": "PDP_INPAGE"
  },
  "bodyAttrs": {
    "wpbmix-template-id": "CASCADE",
    "wpbmix-template-type": "PDP_INPAGE"
  },
  "productCard": {
    "class": "bw-product-card product-card bw-product-card--mode-row bw-ppb-cascade-product-row wpbMixCascadeProductWrapper",
    "rect": { "w": 357.3, "h": 70 },
    "radius": "7px",
    "overflow": "hidden"
  },
  "addControl": {
    "class": "bw-product-card__add-button product-add-btn",
    "rect": { "w": 90, "h": 32 },
    "radius": "5px",
    "background": "rgb(17, 17, 17)"
  },
  "activeCategoryTab": {
    "class": "bw-ppb-inpage-category-tab active wpbMixCascadeCategoryTab wpbMixCascadeCategoryTab--active",
    "text": "Category 1",
    "radius": "5px",
    "background": "rgb(30, 30, 30)"
  },
  "primaryCta": {
    "class": "add-bundle-to-cart disabled",
    "text": "Add Bundle to Cart",
    "rect": { "w": 372.3, "h": 41 },
    "radius": "5px",
    "background": "rgb(17, 17, 17)"
  },
  "overflowX": 0
}
```

Chrome DevTools MCP cache-cleared hard reload mobile `390x844x3` with bundle JSON cache-busting:

```json
{
  "viewport": { "w": 390, "h": 844, "dpr": 3 },
  "version": "5.0.187",
  "fetches": [
    {
      "status": 200,
      "template": "PDP_INPAGE",
      "preset": "CASCADE",
      "steps": [
        { "name": "Step 1", "enabled": true },
        { "name": "Step 2", "enabled": false }
      ]
    }
  ],
  "rootAttrs": {
    "data-ppb-template-type": "PDP_INPAGE",
    "data-ppb-design-preset": "CASCADE",
    "template-id": "CASCADE",
    "template-type": "PDP_INPAGE"
  },
  "bodyAttrs": {
    "wpbmix-template-id": "CASCADE",
    "wpbmix-template-type": "PDP_INPAGE"
  },
  "productCard": {
    "class": "bw-product-card product-card bw-product-card--mode-row bw-ppb-cascade-product-row wpbMixCascadeProductWrapper",
    "rect": { "w": 358, "h": 70 },
    "radius": "7px",
    "overflow": "hidden"
  },
  "addControl": {
    "class": "bw-product-card__add-button product-add-btn",
    "rect": { "w": 90, "h": 32 },
    "radius": "5px",
    "background": "rgb(17, 17, 17)"
  },
  "activeCategoryTab": {
    "class": "bw-ppb-inpage-category-tab active wpbMixCascadeCategoryTab wpbMixCascadeCategoryTab--active",
    "text": "Category 1",
    "rect": { "w": 174, "h": 54 },
    "radius": "5px",
    "background": "rgb(30, 30, 30)"
  },
  "primaryCta": {
    "class": "add-bundle-to-cart disabled",
    "text": "Add Bundle to Cart",
    "rect": { "w": 350, "h": 38 },
    "radius": "5px",
    "background": "rgb(17, 17, 17)"
  },
  "overflowX": 0
}
```

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

- Desktop `1280x800`: served JSON and DOM returned `PDP_MODAL / SIMPLIFIED`, `data-ppb-slot-orientation="vertical"`, no Cascade row, `overflowX: 0`.
- Mobile `390x844x3`: served JSON and DOM returned `PDP_MODAL / SIMPLIFIED`, `data-ppb-slot-orientation="vertical"`, no Cascade row, `overflowX: 0`.

The EB fixture was restored through the EB Admin template overlay to Product Grid. Post-restore cache-cleared hard reload checks:

- Desktop `1280x800`: `gbbmix-template-type="PDP_INPAGE"`, `gbbmix-template-id="COGNIVE"`, runtime `{ "id": "COGNIVE", "type": "PDP_INPAGE" }`, `overflowX: 0`.
- Mobile `390x844x3`: `gbbmix-template-type="PDP_INPAGE"`, `gbbmix-template-id="COGNIVE"`, runtime `{ "id": "COGNIVE", "type": "PDP_INPAGE" }`, `overflowX: 0`.

Promote G32 Product List to **P**.
