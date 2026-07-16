---
schema_version: 1
id: ppb-g11-product-grid-compare-at-visibility-evidence
title: PPB G11 Product Grid Compare-at Visibility Evidence
type: parity-evidence
status: active
summary: Documents current Product Grid compare-at visibility parity for the hidden state and ties it to existing visible-state Product Grid proof.
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
  - docs/competitor-analysis/ppb-product-grid-agentic-parity/PG01-active-step-and-responsive-width-delta.md
  - docs/competitor-analysis/ppb-product-grid-agentic-parity/PG08-live-reaudit-card-accordion-toast-delta.md
tags:
  - ppb
  - product-grid
  - compare-at
keywords:
  - G11
  - Product Grid
  - displayCompareAtPrices
---

# G11 Product Grid Compare-at Visibility

## Result

Row G11 is terminal **P** for Product Grid.

The current saved Product Page Bundle compare-at setting is hidden in EB and hidden in WPB Product Grid. Existing Product Grid evidence already records the complementary visible compare-at card state, so the Product Grid cell now has both sides needed for the visibility toggle contract.

## Existing visible-state evidence

`docs/competitor-analysis/ppb-product-grid-agentic-parity/PG01-active-step-and-responsive-width-delta.md` records the Product Grid two-product progression and states that Step 2 exposed compare-at prices. `PG08-live-reaudit-card-accordion-toast-delta.md` then revalidated Product Grid complete card hierarchy, including image, title, price, and action, across desktop and mobile with zero overflow.

## Current EB hidden-state evidence

Chrome DevTools MCP, cache-cleared hard reload, EB storefront `yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`.

Desktop `1280x800`:

```json
{
  "templateAttrs": { "bodyType": "PDP_INPAGE", "bodyId": "COGNIVE" },
  "settings": {
    "showProductComparedAtPrice": false,
    "showComparedAtPriceOnATC": false,
    "showPricingOnPurchaseOptionsWidget": true
  },
  "visible": {
    "hasAddPlus": true,
    "hasNext": true,
    "hasViewBundleItems": true,
    "compareAtTextCount": 0
  },
  "overflowX": 0
}
```

Mobile `390x844x3`:

```json
{
  "templateAttrs": { "bodyType": "PDP_INPAGE", "bodyId": "COGNIVE" },
  "settings": {
    "showProductComparedAtPrice": false,
    "showComparedAtPriceOnATC": false,
    "showPricingOnPurchaseOptionsWidget": true
  },
  "visible": {
    "hasAddPlus": true,
    "hasNext": true,
    "hasViewBundleItems": true,
    "compareAtTextCount": 0
  },
  "overflowX": 0
}
```

## Current WPB hidden-state evidence

The scoped SIT fixture `cmrf19c8d0000v0xpj8rz2wgh` was temporarily switched from Vertical Slots to Product Grid by setting `bundleDesignTemplate: "PDP_INPAGE"` and `bundleDesignPresetId: "COGNIVE"`. The original fixture values were restored after this batch.

Pre-batch read-only fixture state:

```json
{
  "bundleDesignTemplate": "PDP_MODAL",
  "bundleDesignPresetId": "SIMPLIFIED",
  "showCompareAtPrices": false
}
```

Desktop `1280x800`, cache-cleared hard reload:

```json
{
  "widgetVersion": "5.0.186",
  "rootAttrs": {
    "bundleId": "cmrf19c8d0000v0xpj8rz2wgh",
    "templateType": "PDP_INPAGE",
    "preset": "COGNIVE",
    "templateId": "COGNIVE"
  },
  "visible": {
    "hasAddPlus": true,
    "hasNext": true,
    "hasViewBundleItems": true,
    "hasAddBundleToCart": true,
    "widgetCompareAtTextCount": 0
  },
  "overflowX": 0
}
```

Mobile `390x844x3`, cache-cleared hard reload:

```json
{
  "widgetVersion": "5.0.186",
  "rootAttrs": {
    "bundleId": "cmrf19c8d0000v0xpj8rz2wgh",
    "templateType": "PDP_INPAGE",
    "preset": "COGNIVE",
    "templateId": "COGNIVE"
  },
  "visible": {
    "hasAddPlus": true,
    "hasNext": true,
    "hasViewBundleItems": true,
    "hasAddBundleToCart": true,
    "widgetCompareAtTextCount": 0
  },
  "overflowX": 0
}
```

## Fixture restore

After the Product Grid pass, WPB was restored to the required Vertical Slots baseline:

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
