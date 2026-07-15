---
schema_version: 1
id: ppb-g32-vertical-slots-corners-evidence
title: PPB G32 Vertical Slots Corners Evidence
type: parity-evidence
status: active
summary: Documents Vertical Slots corner-radius parity for EB and Wolfpack slot, modal, product-card, product-action, footer, and CTA surfaces.
last_audited: 2026-07-15
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/assets/widgets/product-page-css/templates/modal-slots.css
  - extensions/bundle-builder/assets/bundle-widget-product-page-modal.css
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
related_docs:
  - docs/competitor-analysis/ppb-deferred-functional-parity/G32-product-grid-corners-evidence.md
  - internal docs/EB Settings Design Reference.md
tags:
  - ppb
  - vertical-slots
  - design-tokens
keywords:
  - G32
  - Vertical Slots
  - corners
  - border-radius
---

# G32 Vertical Slots Corners

## Result

Row G32 is terminal **P** for Vertical Slots.

Chrome DevTools MCP was used directly. Both EB and Wolfpack storefront tabs were Cache Storage cleared and hard reloaded before desktop and mobile passes.

The current EB and Wolfpack Vertical Slots fixtures match on the relevant corner surfaces:

- selected/empty slot card: `10px`
- product picker card: `10px`
- product Add button: `5px`
- page-level Add Bundle CTA: `5px`
- modal sheet: `15px 15px 0 0`
- modal category tabs: `5px`
- modal footer: `10px`
- modal footer nav buttons: `10px`
- horizontal overflow: `0`

## EB Vertical Slots proof

- Storefront: `https://yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`
- Runtime attributes: `gbbmix-template-type="PDP_MODAL"`, `gbbmix-template-id="SIMPLIFIED"`
- Stylesheets: `easy-bundle-product-page-min.css`, `easy-bundle-min.css`

Desktop `1280x800`:

```json
{
  "viewport": { "w": 1280, "h": 800, "dpr": 1 },
  "bodyAttrs": {
    "gbbmix-template-type": "PDP_MODAL",
    "gbbmix-template-id": "SIMPLIFIED"
  },
  "cssVars": {
    "--product-card-border-radius": "10px",
    "--product-card-button-border-radius": "5px",
    "--footer-border-radius": "10px",
    "--footer-buttons-border-radius": "10px",
    "--add-bundle-btn-border-radius": "5px",
    "--drawer-border-radius": "15px 15px 0 0"
  },
  "emptySlotCard": { "class": "gbbMixEmptyStateCard", "radius": "10px" },
  "pageAddBundleCta": { "class": "gbbMixAddtoCartBtn gbbMixAddtoCartBtnV2 gbbMixAddtoCartBtnDisabled", "radius": "5px" },
  "modalSheet": { "class": "gbbMixProductsModal", "radius": "15px 15px 0px 0px" },
  "categoryTab": { "class": "gbbMixCategory gbbMixCategorySelected", "radius": "5px" },
  "productCard": { "class": "gbbMixProductItem", "radius": "10px" },
  "productAddButton": { "class": "gbbMixProductAddButton", "radius": "5px" },
  "modalFooter": { "class": "gbbMixModalFooter", "radius": "10px" },
  "footerNavButton": { "class": "gbbMixFooterNextButton", "radius": "10px" },
  "overflowX": 0
}
```

Mobile `390x844x3`:

```json
{
  "viewport": { "w": 390, "h": 844, "dpr": 3 },
  "bodyAttrs": {
    "gbbmix-template-type": "PDP_MODAL",
    "gbbmix-template-id": "SIMPLIFIED"
  },
  "emptySlotCard": { "class": "gbbMixEmptyStateCard", "radius": "10px" },
  "pageAddBundleCta": { "class": "gbbMixAddtoCartBtn gbbMixAddtoCartBtnV2 gbbMixAddtoCartBtnDisabled", "radius": "5px" },
  "modalSheet": { "class": "gbbMixProductsModal", "radius": "15px 15px 0px 0px" },
  "categoryTab": { "class": "gbbMixCategory gbbMixCategorySelected", "radius": "5px" },
  "productCard": { "class": "gbbMixProductItem", "radius": "10px" },
  "productAddButton": { "class": "gbbMixProductAddButton", "radius": "5px" },
  "modalFooter": { "class": "gbbMixModalFooter", "radius": "10px" },
  "footerNavButton": { "class": "gbbMixFooterNextButton", "radius": "10px" },
  "overflowX": 0
}
```

## Wolfpack Vertical Slots proof

- Storefront: `https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`
- Bundle: `cmrf19c8d0000v0xpj8rz2wgh`
- Runtime attributes: `wpbmix-template-type="PDP_MODAL"`, `wpbmix-template-id="SIMPLIFIED"`, `data-ppb-slot-orientation="vertical"`
- Widget version: `5.0.186`
- Stylesheet ownership: `bundle-widget-product-page-modal.css`

Desktop `1280x800`:

```json
{
  "viewport": { "w": 1280, "h": 800, "dpr": 1 },
  "bodyAttrs": {
    "wpbmix-template-type": "PDP_MODAL",
    "wpbmix-template-id": "SIMPLIFIED"
  },
  "slotOrientation": "vertical",
  "widgetVersion": "5.0.186",
  "slotCard": { "class": "step-box bw-slot-card bw-slot-card--empty", "radius": "10px" },
  "pageAddBundleCta": { "class": "add-bundle-to-cart disabled bw-ppb-primary-cta--modal-vertical", "radius": "5px" },
  "modalSheet": { "class": "bw-bs-panel bundle-builder-modal bw-bs-panel--open", "radius": "15px 15px 0px 0px" },
  "categoryTab": { "class": "bw-bs-category-tab active", "radius": "5px" },
  "productCard": { "class": "product-card", "radius": "10px" },
  "productAddButton": { "class": "product-add-btn", "radius": "5px" },
  "modalFooter": { "class": "modal-footer bw-bs-footer bw-bs-footer--single-step bw-bs-footer--first-step bw-bs-footer--last-step", "radius": "10px" },
  "footerNavButton": { "class": "modal-nav-button next-button bw-bs-nav-btn", "radius": "10px" },
  "overflowX": 0
}
```

Mobile `390x844x3`:

```json
{
  "viewport": { "w": 390, "h": 844, "dpr": 3 },
  "bodyAttrs": {
    "wpbmix-template-type": "PDP_MODAL",
    "wpbmix-template-id": "SIMPLIFIED"
  },
  "slotOrientation": "vertical",
  "widgetVersion": "5.0.186",
  "slotCard": { "class": "step-box bw-slot-card bw-slot-card--empty", "radius": "10px" },
  "pageAddBundleCta": { "class": "add-bundle-to-cart disabled bw-ppb-primary-cta--modal-vertical", "radius": "5px" },
  "modalSheet": { "class": "bw-bs-panel bundle-builder-modal", "radius": "15px 15px 0px 0px" },
  "categoryTab": { "class": "bw-bs-category-tab active", "radius": "5px" },
  "productCard": { "class": "product-card", "radius": "10px" },
  "productAddButton": { "class": "product-add-btn", "radius": "5px" },
  "modalFooter": { "class": "modal-footer bw-bs-footer bw-bs-footer--single-step bw-bs-footer--first-step bw-bs-footer--last-step", "radius": "10px" },
  "footerNavButton": { "class": "modal-nav-button next-button bw-bs-nav-btn", "radius": "10px" },
  "overflowX": 0
}
```

## Scope

This evidence only promotes the Vertical Slots cell for G32. Horizontal Slots still requires a separate confirmed EB save and storefront replay because the EB template-picker action did not emit a confirmed save request in the current Chrome DevTools session.
