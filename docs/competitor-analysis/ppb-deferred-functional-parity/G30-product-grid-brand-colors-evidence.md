---
schema_version: 1
id: ppb-g30-product-grid-brand-colors-evidence
title: PPB G30 Product Grid Brand Colors Evidence
type: parity-evidence
status: active
summary: Documents Product Grid brand color propagation across EB and Wolfpack desktop and mobile storefronts.
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
  - internal docs/EB Settings Design Reference.md
tags:
  - ppb
  - product-grid
  - brand-colors
keywords:
  - G30
  - Product Grid
  - brand colors
---

# G30 Product Grid Brand Colors

## Result

Row G30 is terminal **P** for Product Grid.

Current EB Product Grid and WPB Product Grid both propagate the saved base PPB brand colors to product title, price, product-card Add button, and footer CTA surfaces on desktop and mobile:

- title color: `rgb(30, 30, 30)`
- price color: `rgb(0, 0, 0)`
- Add button: white text on black background
- footer CTA: white text on black background in WPB; EB Product Grid exposes the same black/white footer color settings in runtime
- no horizontal overflow

This evidence does not close G31 typography. During the same pass, EB mobile Product Grid rendered the product-card Add button at `12px`, while WPB rendered it at `14px`; G31 remains deferred.

## EB Product Grid evidence

Chrome DevTools MCP, cache-cleared hard reload, EB storefront `yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`.

Runtime settings exposed the active Product Grid template:

```json
{
  "template": { "type": "PDP_INPAGE", "id": "COGNIVE" },
  "appearanceSample": {
    "productCardBgColor": "#FFFFFF",
    "productCardTitleColor": "#1E1E1E",
    "productCardTitleFont": "16px",
    "productCardTitleWeight": "700",
    "productCardButtonBgColor": "#000000",
    "productCardButtonTextColor": "#FFFFFF",
    "footerNextBtnBgColor": "#000000",
    "footerNextBtnTextColor": "#ffffff"
  }
}
```

Desktop `1280x800` computed Product Grid values:

```json
{
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

Mobile `390x844x3` computed Product Grid values:

```json
{
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
    "fontSize": "12px",
    "fontWeight": "700"
  },
  "overflowX": 0
}
```

## WPB Product Grid evidence

The scoped SIT fixture `cmrf19c8d0000v0xpj8rz2wgh` was temporarily switched from Vertical Slots to Product Grid by setting `bundleDesignTemplate: "PDP_INPAGE"` and `bundleDesignPresetId: "COGNIVE"`. It was restored after this batch.

Desktop `1280x800`, cache-cleared hard reload, widget `5.0.186`:

```json
{
  "rootAttrs": {
    "templateType": "PDP_INPAGE",
    "preset": "COGNIVE",
    "templateId": "COGNIVE"
  },
  "vars": {
    "cardBg": "#FFFFFF",
    "buttonBg": "#000000",
    "buttonText": "#FFFFFF"
  },
  "computed": {
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
      "backgroundColor": "rgb(0, 0, 0)",
      "fontSize": "14px",
      "fontWeight": "700"
    },
    "footerCta": {
      "text": "Add Bundle to Cart",
      "color": "rgb(255, 255, 255)",
      "backgroundColor": "rgb(0, 0, 0)",
      "fontSize": "14px",
      "fontWeight": "700"
    }
  },
  "overflowX": 0
}
```

Mobile `390x844x3`, cache-cleared hard reload, widget `5.0.186`:

```json
{
  "rootAttrs": {
    "templateType": "PDP_INPAGE",
    "preset": "COGNIVE",
    "templateId": "COGNIVE"
  },
  "computed": {
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
      "backgroundColor": "rgb(0, 0, 0)",
      "fontSize": "14px",
      "fontWeight": "700"
    },
    "footerCta": {
      "text": "Add Bundle to Cart",
      "color": "rgb(255, 255, 255)",
      "backgroundColor": "rgb(0, 0, 0)",
      "fontSize": "14px",
      "fontWeight": "700"
    }
  },
  "overflowX": 0
}
```

## Fixture restore

WPB was restored to the required Vertical Slots baseline after the Product Grid pass:

```json
{
  "bundleDesignTemplate": "PDP_MODAL",
  "bundleDesignPresetId": "SIMPLIFIED"
}
```

The restored storefront was hard reloaded with cache clear and verified:

```json
{
  "rootAttrs": {
    "templateType": "PDP_MODAL",
    "preset": "SIMPLIFIED",
    "templateId": "SIMPLIFIED",
    "orientation": "vertical"
  },
  "widgetVersion": "5.0.186",
  "overflowX": 0
}
```
