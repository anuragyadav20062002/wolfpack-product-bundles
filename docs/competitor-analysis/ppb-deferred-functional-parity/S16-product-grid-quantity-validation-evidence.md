---
schema_version: 1
id: ppb-s16-product-grid-quantity-validation-evidence
title: PPB S16 Product Grid Quantity Validation Evidence
type: parity-evidence
status: active
summary: Documents Product Grid per-product quantity validation parity for EB and Wolfpack using the same maximum-one-product fixture.
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
  - docs/competitor-analysis/ppb-deferred-functional-parity/S16-product-list-quantity-validation-evidence.md
  - docs/competitor-analysis/ppb-vertical-slots-agentic-parity/VS06-quantity-validation-current-state.md
tags:
  - ppb
  - product-grid
  - quantity-validation
keywords:
  - S16
  - Product Grid
  - validateQuantityPerProduct
---

# S16 Product Grid Quantity Validation

## Result

Row S16 is terminal **P** for Product Grid.

EB and Wolfpack Product Grid both served `validateQuantityPerProduct: { "isEnabled": true, "allowedQuantity": 1 }` and prevented the same product from increasing to quantity 2 on desktop and mobile. The visible second-activation behavior is not identical: EB leaves the selected card at `Added x1`, while Wolfpack toggles the selected product off. That still satisfies this row because S16 tests maximum-per-product enforcement, and neither implementation permits `x 2`.

Chrome DevTools MCP was used directly. Each storefront pass cleared Cache Storage and session/local selection state, then hard reloaded with `ignoreCache: true`. No deploy was run.

## EB Product Grid evidence

Fixture:

- Storefront: `https://yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`
- Offer: `MIX-156854`
- Template attributes: `gbbmix-template-type="PDP_INPAGE"` and `gbbmix-template-id="COGNIVE"`
- Runtime validation: `validateQuantityPerProduct: { "isEnabled": true, "allowedQuantity": 1 }`

Desktop `1280x800`, cache-cleared hard reload:

```json
{
  "viewport": { "w": 1280, "h": 800, "dpr": 1 },
  "product": "14k Dangling Obsidian Earrings",
  "before": "14k Dangling Obsidian Earrings\n₹829\nAdd +",
  "afterFirstWrapper": "14k Dangling Obsidian Earrings\n₹829\nAdded x1",
  "afterSecondWrapper": "14k Dangling Obsidian Earrings\n₹829\nAdded x1",
  "selectedLine": "14k Dangling Obsidian Earrings x 1",
  "containsX2": false
}
```

Mobile `390x844x3`, cache-cleared hard reload:

```json
{
  "viewport": { "w": 390, "h": 844, "dpr": 3 },
  "product": "14k Dangling Obsidian Earrings",
  "before": "14k Dangling Obsidian Earrings\n₹829\nAdd +",
  "afterFirstWrapper": "14k Dangling Obsidian Earrings\n₹829\nAdded x1",
  "afterSecondWrapper": "14k Dangling Obsidian Earrings\n₹829\nAdded x1",
  "hasX2": false,
  "overflowX": 0
}
```

## WPB Product Grid evidence

Temporary WPB fixture:

- Bundle: `cmrf19c8d0000v0xpj8rz2wgh`
- Storefront: `https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`
- Template: `PDP_INPAGE / COGNIVE`
- Runtime validation: `validateQuantityPerProduct: { "isEnabled": true, "allowedQuantity": 1 }`
- Original fixture restored after the pass.

Desktop `1280x800`, cache-cleared hard reload:

```json
{
  "viewport": { "w": 1280, "h": 800, "dpr": 1 },
  "apiStatus": 200,
  "config": {
    "id": "cmrf19c8d0000v0xpj8rz2wgh",
    "bundleDesignTemplate": "PDP_INPAGE",
    "bundleDesignPresetId": "COGNIVE",
    "validateQuantityPerProduct": {
      "isEnabled": true,
      "allowedQuantity": 1
    }
  },
  "rootAttrs": {
    "data-ppb-template-type": "PDP_INPAGE",
    "data-ppb-design-preset": "COGNIVE",
    "template-id": "COGNIVE",
    "template-type": "PDP_INPAGE"
  },
  "product": "14k Dangling Obsidian Earrings",
  "before": "14k Dangling Obsidian Earrings $829.00 Add +",
  "afterFirstCard": "14k Dangling Obsidian Earrings $829.00 Added x1",
  "afterFirstSummary": "Selected Products 14k Dangling Obsidian Earrings x 1 $829.00 x 1",
  "afterSecondCard": "14k Dangling Obsidian Earrings $829.00 Add to Cart",
  "cardHasQty2": false,
  "summaryHasQty2": false
}
```

Mobile `390x844x3`, cache-cleared hard reload:

```json
{
  "viewport": { "w": 390, "h": 844, "dpr": 3 },
  "apiStatus": 200,
  "config": {
    "id": "cmrf19c8d0000v0xpj8rz2wgh",
    "bundleDesignTemplate": "PDP_INPAGE",
    "bundleDesignPresetId": "COGNIVE",
    "validateQuantityPerProduct": {
      "isEnabled": true,
      "allowedQuantity": 1
    }
  },
  "product": "14k Dangling Obsidian Earrings",
  "before": "14k Dangling Obsidian Earrings $829.00 Add +",
  "afterFirstCard": "14k Dangling Obsidian Earrings $829.00 Added x1",
  "afterFirstSummary": "Selected Products 14k Dangling Obsidian Earrings x 1 $829.00 x 1",
  "afterSecondCard": "14k Dangling Obsidian Earrings $829.00 Add to Cart",
  "cardHasQty2": false,
  "summaryHasQty2": false,
  "overflowX": 0
}
```

App-owned runtime resources observed during the mobile pass:

- `/apps/product-bundles/api/language-settings/agent-5sfidg3m.myshopify.com?bundleType=product_page&locale=en` — 200
- `/apps/product-bundles/api/controls-settings/agent-5sfidg3m.myshopify.com?bundleType=product_page` — 200
- `/apps/product-bundles/api/bundle/cmrf19c8d0000v0xpj8rz2wgh.json` — 200
- `/apps/product-bundles/api/storefront-products?...` — 200
- `/apps/product-bundles/api/bundle/cmrf19c8d0000v0xpj8rz2wgh/view` — 200

## Fixture restore

The WPB bundle was restored after the evidence pass:

```json
{
  "bundleDesignTemplate": "PDP_MODAL",
  "bundleDesignPresetId": "SIMPLIFIED",
  "validateQuantityPerProduct": {
    "isEnabled": false,
    "allowedQuantity": 1
  },
  "defaultProductsData": {}
}
```

Post-restore mobile cache-cleared hard reload proof:

```json
{
  "viewport": { "w": 390, "h": 844, "dpr": 3 },
  "apiStatus": 200,
  "config": {
    "bundleDesignTemplate": "PDP_MODAL",
    "bundleDesignPresetId": "SIMPLIFIED",
    "validateQuantityPerProduct": {
      "isEnabled": false,
      "allowedQuantity": 1
    },
    "defaultProductsData": {}
  },
  "rootAttrs": {
    "ppbTemplateType": "PDP_MODAL",
    "ppbPreset": "SIMPLIFIED"
  },
  "hasProductGridCards": false,
  "hasVerticalSlotsMarker": true
}
```
