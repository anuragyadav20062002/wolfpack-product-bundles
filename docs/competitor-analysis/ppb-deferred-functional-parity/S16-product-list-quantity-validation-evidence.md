---
schema_version: 1
id: ppb-s16-product-list-quantity-validation-evidence
title: PPB S16 Product List Quantity Validation Evidence
type: parity-evidence
status: active
summary: Documents Product List per-product quantity validation parity for EB and Wolfpack using the same preselected single-product fixture.
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
  - docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md
tags:
  - ppb
  - product-list
  - quantity-validation
keywords:
  - S16
  - Product List
  - validateQuantityPerProduct
---

# S16 Product List Quantity Validation

## Result

Row S16 is terminal **P** for Product List.

EB and Wolfpack Product List both enforce `validateQuantityPerProduct.isEnabled: true` with `allowedQuantity: 1` independently of the normal step condition. In both implementations, the selected/default product remains at `x 1` after attempting to select the same product again.

This pass also observed valid default-product rendering, but it does **not** close S06 because S06 still requires invalid/unavailable default resolution evidence.

## EB Product List evidence

`docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md` records the EB PPB Product List fixture:

- Bundle: `WPB Complete Audit Product Page 2026-05-25`
- Offer: `MIX-519528`
- Product page: `https://yash-wolfpack.myshopify.com/products/wpb-complete-audit-product-page-2026-05-25`
- Runtime template before Bundle Settings proof: `gbbmix-template-type="PDP_INPAGE"` and `gbbmix-template-id="CASCADE"`
- Saved payload: `validateQuantityPerProduct.isEnabled: true`
- Saved payload: `validateQuantityPerProduct.allowedQuantity: 1`
- Desktop/mobile storefront effect: selecting `18k Bloom Earrings` changed the product card from `Add +` to `Added x1`, and the selected-products list showed `18k Bloom Earrings x 1`.

## WPB Product List evidence

Chrome DevTools MCP was used directly. No deploy was run.

Temporary WPB fixture:

- Bundle: `cmrf19c8d0000v0xpj8rz2wgh`
- Storefront: `https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`
- Template: `PDP_INPAGE / CASCADE`
- Widget version: `5.0.186`
- `validateQuantityPerProduct: { "isEnabled": true, "allowedQuantity": 1 }`
- `defaultProductsData.isDefaultProductsEnabled: true`
- Default product: `18k Bloom Earrings`, variant `48720171467011`, required quantity `1`

Desktop `1280x800`, cache-cleared hard reload:

```json
{
  "viewport": { "w": 1280, "h": 800, "dpr": 1 },
  "version": "5.0.186",
  "hasPreselectedTitle": true,
  "selectedLine": "18k Bloom Earrings x 1",
  "productCardBefore": "18k Bloom Earrings $579.00 - 1 +",
  "afterSameCardClick": {
    "selectedLine": "18k Bloom Earrings x 1",
    "containsX2": false
  },
  "overflowX": 0
}
```

Mobile `390x844x3`, cache-cleared hard reload:

```json
{
  "viewport": { "w": 390, "h": 844, "dpr": 3 },
  "version": "5.0.186",
  "hasPreselectedTitle": true,
  "selectedLine": "18k Bloom Earrings x 1",
  "productCardBefore": "18k Bloom Earrings $579.00 - 1 +",
  "afterSameCardClick": {
    "selectedLine": "18k Bloom Earrings x 1",
    "containsX2": false
  },
  "overflowX": 0
}
```

App-owned runtime resources observed during the mobile pass:

- `/apps/product-bundles/api/design-settings/agent-5sfidg3m.myshopify.com?bundleType=product_page`
- `/apps/product-bundles/api/language-settings/agent-5sfidg3m.myshopify.com?bundleType=product_page&locale=en`
- `/apps/product-bundles/api/controls-settings/agent-5sfidg3m.myshopify.com?bundleType=product_page`
- `/apps/product-bundles/api/bundle/cmrf19c8d0000v0xpj8rz2wgh.json`
- `/apps/product-bundles/api/storefront-products?...`
- `/apps/product-bundles/api/bundle/cmrf19c8d0000v0xpj8rz2wgh/view`

Console noise was limited to theme/Shopify platform messages (`content-visibility`, missing form id/name, and non-app-owned 401/404 resources). The app-owned runtime requests listed above returned successfully.

## Fixture restore

The WPB bundle was restored after the evidence pass:

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

Post-restore cache-cleared hard reload checks:

- Desktop `1280x800`: Vertical Slots markers returned, Product List rows were absent, `Preselected audit products` was absent, `18k Bloom Earrings x 1` was absent, `overflowX: 0`.
- Mobile `390x844x3`: Vertical Slots markers returned, Product List rows were absent, `Preselected audit products` was absent, `18k Bloom Earrings x 1` was absent, `overflowX: 0`.
