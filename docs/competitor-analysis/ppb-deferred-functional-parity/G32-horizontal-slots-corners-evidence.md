---
schema_version: 1
id: ppb-g32-horizontal-slots-corners-evidence
title: PPB G32 Horizontal Slots Corners Evidence
type: parity-evidence
status: active
summary: Documents Horizontal Slots corner-radius parity for EB and Wolfpack slot, modal, product-card, product-action, footer, and CTA surfaces.
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
  - docs/competitor-analysis/ppb-deferred-functional-parity/G32-vertical-slots-corners-evidence.md
  - docs/competitor-analysis/ppb-deferred-functional-parity/G32-product-grid-corners-evidence.md
tags:
  - ppb
  - horizontal-slots
  - design-tokens
keywords:
  - G32
  - Horizontal Slots
  - corners
  - border-radius
---

# G32 Horizontal Slots Corners

## Result

Row G32 is terminal **P** for Horizontal Slots.

Chrome DevTools MCP was used directly. EB and Wolfpack storefront tabs were Cache Storage cleared and hard reloaded before desktop and mobile passes.

The current EB and Wolfpack Horizontal Slots fixtures match on the relevant corner surfaces:

- selected/empty slot card: `10px`
- product picker card: `10px`
- product Add button: `5px`
- page-level Add Bundle CTA: `5px`
- modal sheet: `15px 15px 0 0`
- modal category tabs: `5px`
- modal footer: `10px`
- modal footer nav buttons: `10px`
- horizontal overflow: `0`

## EB Horizontal Slots proof

- Storefront: `https://yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`
- Admin save request: `POST /api/mixAndMatch/update?shopName=yash-wolfpack.myshopify.com&offerId=MIX-156854` returned `200`.
- Persisted template fields: `bundleDesignTemplate: "PDP_MODAL"`, `bundleDesignTemplateData.templateId: "MODAL"`.
- Runtime attributes: `gbbmix-template-type="PDP_MODAL"`, `gbbmix-template-id="MODAL"`, `gbb-mix-consolidated-design="true"`.
- Stylesheets: `easy-bundle-product-page-min.css`, `easy-bundle-min.css`.

Desktop `1280x800`:

```json
{
  "viewport": { "w": 1280, "h": 800, "dpr": 1 },
  "bodyAttrs": {
    "gbbmix-template-type": "PDP_MODAL",
    "gbbmix-template-id": "MODAL",
    "gbb-mix-consolidated-design": "true"
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
    "gbbmix-template-id": "MODAL",
    "gbb-mix-consolidated-design": "true"
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

EB app-owned requests were healthy during the mobile pass: storefront assets returned `200`, `/apps/gbb/updateMixAndMatchBundleView` returned `200`, and cart endpoints returned `200`. Browser console contained only non-app Shopify noise observed on this test store.

## Wolfpack Horizontal Slots proof

- Storefront: `https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`
- Bundle: `cmrf19c8d0000v0xpj8rz2wgh`
- Temporary template fields: `bundleDesignTemplate: "PDP_MODAL"`, `bundleDesignPresetId: "MODAL"`.
- Storefront sync result: `synced: true`, `storefrontSyncStatus: "synced"`, `storefrontSyncLastError: null`.
- Runtime attributes: `wpbmix-template-type="PDP_MODAL"`, `wpbmix-template-id="MODAL"`, `data-ppb-slot-orientation="horizontal"`.
- Widget version: `5.0.187`.
- Stylesheet ownership: `bundle-widget-product-page-modal.css`.

Desktop `1280x800`:

```json
{
  "viewport": { "w": 1280, "h": 800, "dpr": 1 },
  "version": "5.0.187",
  "bodyAttrs": {
    "wpbmix-template-type": "PDP_MODAL",
    "wpbmix-template-id": "MODAL"
  },
  "appAttrs": {
    "data-ppb-template-type": "PDP_MODAL",
    "data-ppb-design-preset": "MODAL",
    "data-ppb-slot-orientation": "horizontal"
  },
  "slotCard": { "class": "step-box bw-slot-card bw-slot-card--empty", "radius": "10px" },
  "pageAddBundleCta": { "class": "add-bundle-to-cart disabled", "radius": "5px" },
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
  "version": "5.0.187",
  "bodyAttrs": {
    "wpbmix-template-type": "PDP_MODAL",
    "wpbmix-template-id": "MODAL"
  },
  "appAttrs": {
    "data-ppb-template-type": "PDP_MODAL",
    "data-ppb-design-preset": "MODAL",
    "data-ppb-slot-orientation": "horizontal"
  },
  "slotCard": { "class": "step-box bw-slot-card bw-slot-card--empty", "radius": "10px" },
  "pageAddBundleCta": { "class": "add-bundle-to-cart disabled", "radius": "5px" },
  "modalSheet": { "class": "bw-bs-panel bundle-builder-modal bw-bs-panel--open", "radius": "15px 15px 0px 0px" },
  "categoryTab": { "class": "bw-bs-category-tab active", "radius": "5px" },
  "productCard": { "class": "product-card", "radius": "10px" },
  "productAddButton": { "class": "product-add-btn", "radius": "5px" },
  "modalFooter": { "class": "modal-footer bw-bs-footer bw-bs-footer--single-step bw-bs-footer--first-step bw-bs-footer--last-step", "radius": "10px" },
  "footerNavButton": { "class": "modal-nav-button next-button bw-bs-nav-btn", "radius": "10px" },
  "overflowX": 0
}
```

Wolfpack app-owned requests were healthy during the mobile pass:

- `/apps/product-bundles/api/bundle/cmrf19c8d0000v0xpj8rz2wgh.json` returned `200`.
- `/apps/product-bundles/api/bundle/cmrf19c8d0000v0xpj8rz2wgh/view` returned `200`.
- `/apps/product-bundles/api/storefront-products?...` returned `200`.
- `bundle-widget-product-page-modal.css` and `bundle-widget-product-page-bundled.js` returned `200`.

The only console errors were Shopify storefront/account noise (`401` and `404`) unrelated to app-owned endpoints.

## Source fix

Wolfpack initially rendered the Horizontal Slots page-level Add Bundle CTA at `8px` while EB rendered `5px`. The fix scopes the CTA radius to the Horizontal Slots runtime path in `app/assets/widgets/product-page-css/templates/modal-slots.css`, regenerates `extensions/bundle-builder/assets/bundle-widget-product-page-modal.css`, and bumps `WIDGET_VERSION` to `5.0.187` in `scripts/build-widget-bundles.js`.

Verification commands:

```bash
npm run minify:assets css
npm run build:widgets
npm run graphify:rebuild
```

`npm run graphify:rebuild` reported no code-graph topology changes.

## Fixture restore

After this proof, the EB fixture was restored through the EB admin UI to the required Product Grid baseline:

- Step Rules remained `Quantity` `is greater than or equal to` `2`.
- Product Grid was selected in the EB template overlay.
- `POST /api/mixAndMatch/update?shopName=yash-wolfpack.myshopify.com&offerId=MIX-156854` returned `200`.
- The hard-reloaded EB storefront rendered `gbbmix-template-type="PDP_INPAGE"`, `gbbmix-template-id="COGNIVE"`, the restored `Add 2 product(s) to save 5%!` rule text, and `overflowX: 0` at both `390x844x3` and `1280x800`.

The scoped Wolfpack fixture was restored to the required Vertical Slots baseline:

- `bundleDesignTemplate: "PDP_MODAL"`
- `bundleDesignPresetId: "SIMPLIFIED"`
- storefront sync `synced: true`
- hard-reload runtime verification: `wpbmix-template-type="PDP_MODAL"`, `wpbmix-template-id="SIMPLIFIED"`, `data-ppb-slot-orientation="vertical"`, `overflowX: 0`

Promote G32 Horizontal Slots to **P**.
