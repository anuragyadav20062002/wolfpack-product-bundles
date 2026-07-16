---
schema_version: 1
id: ppb-g31-product-grid-typography-evidence
title: PPB G31 Product Grid Typography Evidence
type: parity-evidence
status: active
summary: Documents Product Grid typography parity across EB and Wolfpack desktop and mobile storefronts.
last_audited: 2026-07-15
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/assets/widgets/product-page-css/templates/inpage-cognive.css
  - extensions/bundle-builder/assets/bundle-widget-product-page-cognive.css
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - docs/competitor-analysis/ppb-deferred-functional-parity/G30-product-grid-brand-colors-evidence.md
tags:
  - ppb
  - product-grid
  - typography
keywords:
  - G31
  - Product Grid
  - typography
---

# G31 Product Grid Typography

## Result

Row G31 is terminal **P** for Product Grid.

Current EB Product Grid and WPB Product Grid both render the core product-card and footer typography without theme leakage:

- product title: `14px`, weight `700`
- product price: `14px`, weight `700`
- product-card Add button: `14px`, weight `700` on desktop
- product-card Add button: `12px`, weight `700` on mobile
- footer CTA: `14px`, weight `700`
- no horizontal overflow

The WPB mobile Product Grid Add button previously rendered at `14px`; the Product Grid COGNIVE stylesheet now owns the mobile override in `app/assets/widgets/product-page-css/templates/inpage-cognive.css`, and `npm run minify:assets css` regenerated `extensions/bundle-builder/assets/bundle-widget-product-page-cognive.css`.

## EB Product Grid evidence

Chrome DevTools MCP, cache-cleared hard reload, EB storefront `yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`.

Runtime settings exposed the active Product Grid template and typography-relevant brand settings:

```json
{
  "template": { "type": "PDP_INPAGE", "id": "COGNIVE" },
  "appearanceSample": {
    "productCardTitleFont": "16px",
    "productCardTitleWeight": "700"
  }
}
```

Desktop `1280x800` computed Product Grid values:

```json
{
  "title": { "fontSize": "14px", "fontWeight": "700" },
  "price": { "fontSize": "14px", "fontWeight": "700" },
  "add": { "text": "Add +", "fontSize": "14px", "fontWeight": "700" },
  "overflowX": 0
}
```

Mobile `390x844x3` computed Product Grid values:

```json
{
  "title": { "fontSize": "14px", "fontWeight": "700" },
  "price": { "fontSize": "14px", "fontWeight": "700" },
  "add": { "text": "Add +", "fontSize": "12px", "fontWeight": "700" },
  "overflowX": 0
}
```

## Wolfpack Product Grid evidence

The scoped SIT fixture `cmrf19c8d0000v0xpj8rz2wgh` was temporarily switched from Vertical Slots to Product Grid by setting `bundleDesignTemplate: "PDP_INPAGE"` and `bundleDesignPresetId: "COGNIVE"`. It was restored after this pass.

Chrome DevTools MCP, cache-cleared hard reload, WPB storefront `agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`.

Desktop `1280x800`, widget `5.0.186`:

```json
{
  "viewport": { "width": 1280, "height": 800 },
  "rootAttrs": {
    "templateType": "PDP_INPAGE",
    "preset": "COGNIVE",
    "version": "5.0.186"
  },
  "title": {
    "text": "14k Dangling Obsidian Earrings",
    "fontSize": "14px",
    "fontWeight": "700"
  },
  "price": {
    "text": "$829.00",
    "fontSize": "14px",
    "fontWeight": "700"
  },
  "add": {
    "text": "Add +",
    "fontSize": "14px",
    "fontWeight": "700"
  },
  "footer": {
    "text": "Add Bundle to Cart",
    "fontSize": "14px",
    "fontWeight": "700"
  },
  "overflowX": 0
}
```

Mobile `390x844x3`, widget `5.0.186`:

```json
{
  "viewport": { "width": 390, "height": 844 },
  "rootAttrs": {
    "templateType": "PDP_INPAGE",
    "preset": "COGNIVE",
    "version": "5.0.186"
  },
  "title": {
    "text": "14k Dangling Obsidian Earrings",
    "fontSize": "14px",
    "fontWeight": "700"
  },
  "price": {
    "text": "$829.00",
    "fontSize": "14px",
    "fontWeight": "700"
  },
  "add": {
    "text": "Add +",
    "fontSize": "12px",
    "fontWeight": "700"
  },
  "footer": {
    "text": "Add Bundle to Cart",
    "fontSize": "14px",
    "fontWeight": "700"
  },
  "overflowX": 0
}
```

App-owned storefront requests returned `200`, including:

- `bundle-widget-product-page-bundled.js`
- `/apps/product-bundles/api/language-settings/agent-5sfidg3m.myshopify.com?bundleType=product_page&locale=en`

The console contained only existing storefront noise: content-visibility verbose logs, Bugsnag load debug, a non-app `404`, and one form-field accessibility issue.

## Fixture restore proof

After the Product Grid pass, WPB was restored to the required Vertical Slots baseline and hard-reload verified:

```json
{
  "viewport": { "width": 390, "height": 844 },
  "rootAttrs": {
    "templateType": "PDP_MODAL",
    "preset": "SIMPLIFIED",
    "version": "5.0.186"
  },
  "hasProductGrid": false,
  "hasVerticalSlots": true,
  "overflowX": 0
}
```

## Matrix update

Promote G31 Product Grid to **P**.
