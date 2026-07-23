---
schema_version: 1
id: ppb-c04-product-grid-mixed-aspect-evidence
title: PPB C04 Product Grid Mixed Aspect Evidence
type: parity-evidence
status: active
summary: Documents Product Grid square, tall, and wide product media containment for EB and Wolfpack at desktop and mobile sizes.
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
  - media
keywords:
  - C04
  - Product Grid
  - mixed aspect ratios
---

# C04 Product Grid Mixed Aspect Evidence

## Result

Row C04 is terminal **P** for Product Grid.

EB and Wolfpack Product Grid both contain square, tall, and wide source images inside equal product-card media boxes at desktop and mobile sizes, with `object-fit: cover` and zero document horizontal overflow.

## EB Product Grid proof

Chrome DevTools MCP was used directly. The EB storefront was cache-cleared and hard reloaded before each viewport pass:

- URL: `https://yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`
- Runtime: `PDP_INPAGE / COGNIVE`
- Interaction: select two Step 1 products, then advance to Step 2.

Desktop `1280x800` Step 2 Product Grid:

```json
{
  "uniqueNaturals": ["400x400", "333x400", "400x274"],
  "cards": [
    { "text": "14k Intertwined Earrings", "natural": [400, 400], "media": [98, 98], "fit": "cover" },
    { "text": "Massage Oil", "natural": [333, 400], "media": [98, 98], "fit": "cover" },
    { "text": "Yellow Sofa", "natural": [400, 274], "media": [98, 98], "fit": "cover" }
  ],
  "overflowX": 0
}
```

Mobile `390x844x3` Step 2 Product Grid:

```json
{
  "uniqueNaturals": ["400x400", "333x400", "400x274"],
  "cards": [
    { "text": "14k Intertwined Earrings", "natural": [400, 400], "media": [165, 165], "fit": "cover" },
    { "text": "Massage Oil", "natural": [333, 400], "media": [165, 165], "fit": "cover" },
    { "text": "Yellow Sofa", "natural": [400, 274], "media": [165, 165], "fit": "cover" }
  ],
  "overflowX": 0
}
```

EB app-owned requests were healthy during the pass: `/apps/gbb/updateMixAndMatchBundleView`, `/cart.js`, `/cart/update.js?app=gbbMixBundleApp`, and Shopify GraphQL requests returned `200`. Console output contained existing EB/theme noise only: EB logs, Shopify form-field issues, and unrelated `404` resources.

## Wolfpack Product Grid proof

The scoped SIT fixture `cmrf19c8d0000v0xpj8rz2wgh` was temporarily switched from Vertical Slots to Product Grid and Step 2 was temporarily enabled with a square/tall/wide product set:

- square: `14k Intertwined Earrings`, `900x900`
- tall: `Body Care Kit Gift Set`, `896x1152`
- wide: `Yellow Sofa`, `1216x832`

Desktop `1280x800`, cache-cleared hard reload, widget `5.0.186`, visible in-page Step 2 Product Grid:

```json
{
  "uniqueNaturals": ["900x900", "896x1152", "1216x832"],
  "cards": [
    { "text": "14k Intertwined Earrings", "natural": [900, 900], "media": [103.8, 103.8], "fit": "cover" },
    { "text": "Body Care Kit Gift Set", "natural": [896, 1152], "media": [103.8, 103.8], "fit": "cover" },
    { "text": "Yellow Sofa", "natural": [1216, 832], "media": [103.8, 103.8], "fit": "cover" }
  ],
  "overflowX": 0
}
```

Mobile `390x844x3`, cache-cleared hard reload, widget `5.0.186`, visible in-page Step 2 Product Grid:

```json
{
  "uniqueNaturals": ["900x900", "896x1152", "1216x832"],
  "cards": [
    { "text": "14k Intertwined Earrings", "natural": [900, 900], "media": [163.5, 163.5], "fit": "cover" },
    { "text": "Body Care Kit Gift Set", "natural": [896, 1152], "media": [163.5, 163.5], "fit": "cover" },
    { "text": "Yellow Sofa", "natural": [1216, 832], "media": [163.5, 163.5], "fit": "cover" }
  ],
  "overflowX": 0
}
```

Wolfpack app-owned requests were healthy during the temporary Product Grid pass:

- `/apps/product-bundles/api/bundle/cmrf19c8d0000v0xpj8rz2wgh.json`: `304` during fixture pass, `200` after restore reload.
- `/apps/product-bundles/api/storefront-products?...`: `200` for the temporary mixed-media product IDs.
- `/apps/product-bundles/api/bundle/cmrf19c8d0000v0xpj8rz2wgh/view`: `200`.

Console output contained theme/Shopify noise only: Bugsnag debug output, Shopify form-field issues, content-visibility verbose messages, and unrelated `404` resources.

## Fixture restore

After verification, the scoped SIT fixture was restored from backup:

```json
{
  "bundleDesignTemplate": "PDP_MODAL",
  "bundleDesignPresetId": "SIMPLIFIED",
  "useSingleStepCategoriesAsBundleSteps": false,
  "step2Enabled": false
}
```

The restored storefront was cache-cleared and hard reloaded. It served widget `5.0.186`, rendered Vertical Slots with `data-ppb-slot-orientation="vertical"`, had no Product Grid DOM, no temporary `Body Care Kit Gift Set` text, no Step 2 text, and `overflowX: 0`.
