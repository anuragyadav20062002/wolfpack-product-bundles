---
schema_version: 1
id: ppb-g30-g31-product-list-modal-slots-design-typography-evidence
title: PPB G30/G31 Product List and Modal Slots Design Typography Evidence
type: parity-evidence
status: active
summary: Documents Product List, Horizontal Slots, and Vertical Slots brand color and typography parity across EB and Wolfpack desktop and mobile storefronts.
last_audited: 2026-07-16
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/assets/widgets/product-page-css/base/bottom-sheet-modal.css
  - extensions/bundle-builder/assets/bundle-widget.css
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - docs/competitor-analysis/ppb-deferred-functional-parity/G30-product-grid-brand-colors-evidence.md
  - docs/competitor-analysis/ppb-deferred-functional-parity/G31-product-grid-typography-evidence.md
tags:
  - ppb
  - product-list
  - modal-slots
  - brand-colors
  - typography
keywords:
  - G30
  - G31
  - Product List
  - Horizontal Slots
  - Vertical Slots
---

# G30/G31 Product List and Modal Slots Design Typography

## Result

Rows G30 and G31 are terminal **P** for Product List, Horizontal Slots, and Vertical Slots.

Product Grid was already terminal **P** in the linked Product Grid evidence. This pass closes the remaining G30/G31 cells with direct EB-first and WPB desktop/mobile storefront evidence.

## EB Product List evidence

Chrome DevTools MCP, cache-cleared hard reload, EB storefront `yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`.

Desktop `1280x800` rendered Product List/Cascade:

```json
{
  "templateId": "CASCADE",
  "templateType": "PDP_INPAGE",
  "title": {
    "text": "14k Dangling Obsidian Earrings",
    "color": "rgb(30, 30, 30)",
    "fontSize": "14px",
    "fontWeight": "700"
  },
  "price": {
    "text": "₹829",
    "color": "rgb(0, 0, 0)",
    "fontSize": "14px",
    "fontWeight": "700"
  },
  "add": {
    "text": "Add +",
    "color": "rgb(255, 255, 255)",
    "backgroundColor": "rgb(0, 0, 0)",
    "fontSize": "14px",
    "fontWeight": "700"
  },
  "overflowX": 0
}
```

Mobile `390x844x3` rendered the same title/price values and the expected compact controls:

```json
{
  "templateId": "CASCADE",
  "templateType": "PDP_INPAGE",
  "title": {
    "color": "rgb(30, 30, 30)",
    "fontSize": "14px",
    "fontWeight": "700"
  },
  "price": {
    "color": "rgb(0, 0, 0)",
    "fontSize": "14px",
    "fontWeight": "700"
  },
  "add": {
    "color": "rgb(255, 255, 255)",
    "backgroundColor": "rgb(0, 0, 0)",
    "fontSize": "12px",
    "fontWeight": "700"
  },
  "footer": {
    "color": "rgb(255, 255, 255)",
    "backgroundColor": "rgb(0, 0, 0)",
    "fontSize": "12px",
    "fontWeight": "700"
  },
  "overflowX": 0
}
```

## EB Horizontal and Vertical Slots evidence

The same EB fixture was switched through Horizontal Slots and Vertical Slots in Admin. Each storefront pass cleared Cache Storage and hard reloaded before sampling.

Horizontal Slots desktop rendered `PDP_MODAL` + `MODAL`:

```json
{
  "title": {
    "color": "rgba(18, 18, 18, 0.75)",
    "fontSize": "16px",
    "fontWeight": "400"
  },
  "price": {
    "color": "rgba(18, 18, 18, 0.75)",
    "fontSize": "16px",
    "fontWeight": "400"
  },
  "add": {
    "color": "rgba(18, 18, 18, 0.75)",
    "backgroundColor": "rgba(0, 0, 0, 0)",
    "fontSize": "16px",
    "fontWeight": "400"
  },
  "footer": {
    "color": "rgb(255, 255, 255)",
    "backgroundColor": "rgb(0, 0, 0)",
    "fontSize": "16px",
    "fontWeight": "700"
  },
  "overflowX": 0
}
```

Horizontal Slots mobile rendered the same muted modal card surface at `15px` and weight `400`.

Vertical Slots desktop rendered `PDP_MODAL` + `SIMPLIFIED` with the same modal product-card values as Horizontal Slots: muted title/price/add text, transparent Add button, and black/white footer CTA.

Vertical Slots mobile rendered the same muted modal card surface at `15px` and weight `400`.

## WPB Product List evidence

The scoped SIT fixture `cmrf19c8d0000v0xpj8rz2wgh` was temporarily switched to Product List by setting `bundleDesignTemplate: "PDP_INPAGE"` and `bundleDesignPresetId: "CASCADE"`.

Chrome DevTools MCP, cache-cleared hard reload, WPB storefront `agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`.

Desktop `1280x800`, widget `5.0.189`, exact cascade row selector:

```json
{
  "rootAttrs": {
    "templateType": "PDP_INPAGE",
    "preset": "CASCADE",
    "version": "5.0.189"
  },
  "title": {
    "text": "14k Dangling Obsidian Earrings",
    "color": "rgb(30, 30, 30)",
    "fontSize": "14px",
    "fontWeight": "700"
  },
  "price": {
    "text": "$829.00",
    "color": "rgb(0, 0, 0)",
    "fontSize": "14px",
    "fontWeight": "700"
  },
  "add": {
    "text": "Add +",
    "color": "rgb(255, 255, 255)",
    "backgroundColor": "rgb(17, 17, 17)",
    "fontSize": "14px",
    "fontWeight": "700"
  },
  "footer": {
    "text": "Add Bundle to Cart",
    "color": "rgb(255, 255, 255)",
    "backgroundColor": "rgb(17, 17, 17)",
    "fontSize": "14px",
    "fontWeight": "700"
  },
  "overflowX": 0
}
```

Mobile `390x844x3`, widget `5.0.189`:

```json
{
  "rootAttrs": {
    "templateType": "PDP_INPAGE",
    "preset": "CASCADE",
    "version": "5.0.189"
  },
  "title": {
    "color": "rgb(30, 30, 30)",
    "fontSize": "14px",
    "fontWeight": "700"
  },
  "price": {
    "color": "rgb(0, 0, 0)",
    "fontSize": "14px",
    "fontWeight": "700"
  },
  "add": {
    "color": "rgb(255, 255, 255)",
    "backgroundColor": "rgb(17, 17, 17)",
    "fontSize": "14px",
    "fontWeight": "700"
  },
  "footer": {
    "color": "rgb(255, 255, 255)",
    "backgroundColor": "rgb(17, 17, 17)",
    "fontSize": "12px",
    "fontWeight": "700"
  },
  "overflowX": 0
}
```

## WPB Horizontal and Vertical Slots evidence

The scoped SIT fixture was then switched through:

- Horizontal Slots: `bundleDesignTemplate: "PDP_MODAL"`, `bundleDesignPresetId: "MODAL"`
- Vertical Slots: `bundleDesignTemplate: "PDP_MODAL"`, `bundleDesignPresetId: "SIMPLIFIED"`

Each storefront pass cleared Cache Storage and hard reloaded before opening the first slot and sampling the modal product card.

Horizontal Slots desktop, widget `5.0.189`:

```json
{
  "rootAttrs": {
    "templateType": "PDP_MODAL",
    "preset": "MODAL",
    "orientation": "horizontal",
    "version": "5.0.189"
  },
  "title": {
    "color": "rgba(18, 18, 18, 0.75)",
    "fontSize": "16px",
    "fontWeight": "400"
  },
  "price": {
    "color": "rgba(18, 18, 18, 0.75)",
    "fontSize": "16px",
    "fontWeight": "400"
  },
  "add": {
    "color": "rgba(18, 18, 18, 0.75)",
    "backgroundColor": "rgba(0, 0, 0, 0)",
    "fontSize": "16px",
    "fontWeight": "400"
  },
  "overflowX": 0
}
```

Horizontal Slots mobile matched the EB mobile modal-card typography:

```json
{
  "rootAttrs": {
    "templateType": "PDP_MODAL",
    "preset": "MODAL",
    "orientation": "horizontal",
    "version": "5.0.189"
  },
  "title": { "color": "rgba(18, 18, 18, 0.75)", "fontSize": "15px", "fontWeight": "400" },
  "price": { "color": "rgba(18, 18, 18, 0.75)", "fontSize": "15px", "fontWeight": "400" },
  "add": {
    "color": "rgba(18, 18, 18, 0.75)",
    "backgroundColor": "rgba(0, 0, 0, 0)",
    "fontSize": "15px",
    "fontWeight": "400"
  },
  "overflowX": 0
}
```

Vertical Slots desktop, widget `5.0.189`:

```json
{
  "rootAttrs": {
    "templateType": "PDP_MODAL",
    "preset": "SIMPLIFIED",
    "orientation": "vertical",
    "version": "5.0.189"
  },
  "title": { "color": "rgba(18, 18, 18, 0.75)", "fontSize": "16px", "fontWeight": "400" },
  "price": { "color": "rgba(18, 18, 18, 0.75)", "fontSize": "16px", "fontWeight": "400" },
  "add": {
    "color": "rgba(18, 18, 18, 0.75)",
    "backgroundColor": "rgba(0, 0, 0, 0)",
    "fontSize": "16px",
    "fontWeight": "400"
  },
  "overflowX": 0
}
```

Vertical Slots mobile matched the EB mobile modal-card typography:

```json
{
  "rootAttrs": {
    "templateType": "PDP_MODAL",
    "preset": "SIMPLIFIED",
    "orientation": "vertical",
    "version": "5.0.189"
  },
  "title": { "color": "rgba(18, 18, 18, 0.75)", "fontSize": "15px", "fontWeight": "400" },
  "price": { "color": "rgba(18, 18, 18, 0.75)", "fontSize": "15px", "fontWeight": "400" },
  "add": {
    "color": "rgba(18, 18, 18, 0.75)",
    "backgroundColor": "rgba(0, 0, 0, 0)",
    "fontSize": "15px",
    "fontWeight": "400"
  },
  "overflowX": 0
}
```

## Source fix

WPB modal slot product cards initially rendered product title and price as black `700` text and the card Add button as a black filled button. EB renders the modal product card as muted theme text at weight `400` with a transparent Add control.

The fix is scoped to the bottom-sheet modal card surface:

- `app/assets/widgets/product-page-css/base/bottom-sheet-modal.css`
- regenerated by `npm run minify:assets css`
- generated output: `extensions/bundle-builder/assets/bundle-widget.css`

No UI styling unit test was added because this is visual CSS behavior and the repo explicitly bans CSS/class-name unit tests for styling parity.

## Fixture restore

WPB was restored to the known baseline:

```json
{
  "bundleDesignTemplate": "PDP_MODAL",
  "bundleDesignPresetId": "SIMPLIFIED",
  "defaultProductsData": {},
  "validateQuantityPerProduct": {
    "isEnabled": false,
    "allowedQuantity": 1
  }
}
```

EB Admin was returned to the Product Grid template selector state and reached the post-save "Your bundle is ready" overlay. Repeated cache-cleared storefront reloads still rendered Cascade during the same browser session, so future EB batches must continue to verify saved update payload plus storefront runtime before relying on visible template-card state.
