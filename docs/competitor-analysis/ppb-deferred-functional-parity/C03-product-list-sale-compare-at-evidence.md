---
schema_version: 1
id: ppb-c03-product-list-sale-compare-at-evidence
title: PPB C03 Product List Sale Compare At Evidence
type: parity-evidence
status: active
summary: Documents direct EB and Wolfpack Product List sale and compare-at product-card evidence across desktop and mobile.
last_audited: 2026-07-16
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - app/assets/widgets/product-page/templates/cascade-template.js
related_docs:
  - docs/competitor-analysis/ppb-deferred-functional-parity/G11-product-grid-compare-at-visibility-evidence.md
tags:
  - ppb
  - product-list
  - compare-at
keywords:
  - C03
  - Product List
  - sale price
  - compare-at
---

# C03 Product List Sale + Compare-at Evidence

## Result

C03 is terminal **P** for Product List.

Direct Chrome DevTools MCP was used. EB and Wolfpack storefront tabs were Cache
Storage cleared and hard reloaded with cache ignored before desktop and mobile
passes.

## EB Product List proof

- Storefront: `https://yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`
- Saved runtime after EB Admin template update: `PDP_INPAGE` + `CASCADE`
- Save request: `POST /api/mixAndMatch/update?shopName=yash-wolfpack.myshopify.com&offerId=MIX-156854` returned `200`
- Desktop: `1280x800x1`
- Mobile: `390x844x3`

After selecting two Step 1 products and advancing to Step 2, desktop and mobile
both rendered sale/compare-at pairs in Product List:

- `14k Solid Bloom Earrings`: sale `₹489`, compare-at `₹529`
- `Yellow Sofa`: sale `₹99.99`, compare-at `₹150`
- `14k Dangling Pendant Earrings`: sale `₹579`, compare-at `₹629`
- `18k Solid Bloom Earrings`: sale `₹489`, compare-at `₹529`

Both viewports reported `overflowX: 0`.

Runtime detail captured during the pass:

```json
{
  "templateType": "PDP_INPAGE",
  "templateId": "CASCADE",
  "showProductComparedAtPrice": false,
  "comparedAtVisibility": "block"
}
```

That runtime means this pass closes C03's sale/compare-at presentation for
Product List, but it does **not** close G11 Product List. EB Product List visibly
renders compare-at prices even while `showProductComparedAtPrice` is false, so
the saved compare-at visibility toggle still needs a separate terminal decision.

## Wolfpack Product List proof

- Storefront: `https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`
- Bundle: `cmrf19c8d0000v0xpj8rz2wgh`
- Temporary runtime: `PDP_INPAGE` + `CASCADE`
- Temporary fixture product: `14k Solid Bloom Earrings` inserted at the start of
  Step 1 Category 1 with variant price `$489.00` and compare-at `$529.00`
- Temporary `showCompareAtPrices`: `true`
- Widget version: `5.0.188`
- Desktop: `1280x800x1`
- Mobile: `390x844x3`

Desktop and mobile both rendered the Product List card with the compare-at price
and sale price:

```text
14k Solid Bloom Earrings
$529.00
$489.00
Add +
```

Both viewports reported `overflowX: 0`.

Relevant app-owned requests during the pass and restore returned successfully:

- `/apps/product-bundles/api/language-settings/...` -> `200`
- `/apps/product-bundles/api/controls-settings/...` -> `200`
- `/apps/product-bundles/api/bundle/cmrf19c8d0000v0xpj8rz2wgh.json` -> `200` or `304`
- `/apps/product-bundles/api/storefront-products?...` -> `200`
- `/apps/product-bundles/api/bundle/cmrf19c8d0000v0xpj8rz2wgh/view` -> `200`

Console output contained Shopify/theme noise and 404 resource noise, but no
captured widget runtime exception.

## Fixture restoration

After the evidence pass, EB was restored to Product Grid and verified by a
cache-cleared hard reload:

```json
{
  "templateType": "PDP_INPAGE",
  "templateId": "COGNIVE",
  "overflowX": 0
}
```

Wolfpack was restored and synced:

```json
{
  "bundle": {
    "template": "PDP_MODAL",
    "preset": "SIMPLIFIED",
    "showCompareAtPrices": false
  },
  "step1HasSolidBloom": false,
  "step2Enabled": false
}
```

The restored Wolfpack storefront was cache-cleared and hard reloaded:

```json
{
  "widgetVersion": "5.0.188",
  "attrs": {
    "data-ppb-template-type": "PDP_MODAL",
    "data-ppb-design-preset": "SIMPLIFIED",
    "template-id": "SIMPLIFIED",
    "template-type": "PDP_MODAL",
    "data-ppb-slot-orientation": "vertical"
  },
  "hasSolidBloomStep1": false,
  "overflowX": 0
}
```
