---
schema_version: 1
id: ppb-g02-add-browsed-product-preselection-divergence-evidence
title: PPB G02 Add Browsed Product Preselection Divergence Evidence
type: parity-evidence
status: verified
summary: Documents that WPB persists add-browsed Product Page visibility flags but does not consume them to preselect the current product in storefront selectedProducts.
last_audited: 2026-07-17
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/usePpbSaveHandlers.ts
  - app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/usePpbVisibilityState.ts
  - app/assets/widgets/shared/bundle-data-manager.js
  - app/assets/widgets/product-page/methods/config-lifecycle-methods.js
  - tests/unit/routes/ppb-bundle-visibility.test.ts
  - tests/unit/assets/bundle-data-manager.test.ts
  - tests/unit/routes/ppb-save-bundle.test.ts
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - internal docs/EB Implementation Reference.md
tags:
  - ppb
  - g02
  - preselection
  - divergence
keywords:
  - Add browsed product
  - useLinkProductAsDefaultProduct
  - autoSelectBrowsedProduct
  - selectedProducts
---

# PPB G02 Add Browsed Product Preselection Divergence Evidence

## Scope

G02 checks whether the product the shopper browsed before entering the Product
Page Bundle is automatically preselected when eligible.

This behavior is shared before template rendering. The current product context
and selected-products state are common to Product List, Product Grid, Horizontal
Slots, and Vertical Slots.

## EB baseline

The EB implementation reference records the expected behavior:

> The Add Browsed Product option preselects the product the shopper was viewing
> before clicking the widget/redirect.

The EB configure evidence for Bundle Widget and Bundle Embed also confirmed the
saved payload shape:

- `bundleUpsellConfig.widgetConfiguration.useLinkProductAsDefaultProduct`
- `bundleUpsellConfig.upsellConfiguration.useLinkProductAsDefaultProduct`

## WPB runtime proof

Storefront:
`https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`

After selecting the WPB product page tab, clearing Cache Storage, setting
desktop viewport, and hard reloading with cache ignored, the desktop pass
reported:

```json
{
  "viewport": { "innerWidth": 1280, "innerHeight": 800, "dpr": 1 },
  "currentProduct": {
    "id": 9536113705219,
    "gid": null,
    "handle": "ppb-modal-shared-card-test"
  },
  "widgetVersion": "5.0.189",
  "bundleStatus": 200,
  "bundleUpsellConfig": {
    "upsellConfiguration": {
      "isEnabled": false,
      "displayConfiguration": {
        "showOnAllBundleProducts": true,
        "selectedProducts": [],
        "collectionsSelectedData": [],
        "showOnSpecificProductPages": [],
        "showOnSpecificCollectionPages": []
      },
      "useLinkProductAsDefaultProduct": false
    },
    "widgetConfiguration": {
      "type": "OFFER_WIDGET",
      "isEnabled": false,
      "displayConfiguration": {
        "showOnAllBundleProducts": true,
        "selectedProducts": [],
        "collectionsSelectedData": [],
        "showOnSpecificProductPages": [],
        "showOnSpecificCollectionPages": []
      },
      "useLinkProductAsDefaultProduct": false
    }
  },
  "defaultProductsData": {},
  "template": {
    "bundleDesignTemplate": "PDP_MODAL",
    "bundleDesignPresetId": "SIMPLIFIED",
    "bundleDesignTemplateData": { "templateId": "SIMPLIFIED" }
  },
  "appText": "Step 1 Product 1 Product 2 Add Bundle to Cart Buy it now",
  "horizontalOverflow": false
}
```

The mobile pass used `390x844x3,mobile,touch`, cleared Cache Storage, and hard
reloaded with cache ignored. It reported:

```json
{
  "viewport": { "innerWidth": 390, "innerHeight": 844, "dpr": 3 },
  "currentProduct": {
    "id": 9536113705219,
    "handle": "ppb-modal-shared-card-test"
  },
  "widgetVersion": "5.0.189",
  "bundleStatus": 200,
  "useLink": {
    "upsell": false,
    "widget": false
  },
  "defaultProductsData": {},
  "template": {
    "bundleDesignTemplate": "PDP_MODAL",
    "bundleDesignPresetId": "SIMPLIFIED",
    "bundleDesignTemplateData": { "templateId": "SIMPLIFIED" }
  },
  "appText": "Step 1 Product 1 Product 2 Add Bundle to Cart Buy it now",
  "horizontalOverflow": false
}
```

The runtime has the current product context needed for add-browsed behavior, but
the saved add-browsed flags are false on the current fixture and no
`defaultProductsData` preselection is present.

## Source proof

WPB persists the Admin controls:

- `usePpbVisibilityState.ts` reads
  `widgetConfiguration.useLinkProductAsDefaultProduct` into
  `autoSelectBrowsedProduct`.
- `usePpbVisibilityState.ts` reads
  `upsellConfiguration.useLinkProductAsDefaultProduct` into
  `bundleEmbedAddBrowsedProduct`.
- `usePpbSaveHandlers.ts` writes both values back into `bundleUpsellConfig`.

The storefront runtime does not consume those flags:

- `bundle-data-manager.js` uses current product context for visibility/targeting
  and selecting the active bundle, but not for seeding `selectedProducts`.
- `config-lifecycle-methods.js` copies `window.currentProductId`,
  `window.currentProductGid`, and `window.currentProductHandle` into widget
  config.
- No Product Page widget method reads `useLinkProductAsDefaultProduct`,
  `autoSelectBrowsedProduct`, or `bundleEmbedAddBrowsedProduct` to preselect the
  current product.
- Actual selected-product seeding is owned by
  `defaultProductsData` in `default-product-methods.js`, which is a separate
  explicit default-products feature and not the add-browsed visibility flag.

Focused verification on 2026-07-17:

```bash
npx jest tests/unit/routes/ppb-bundle-visibility.test.ts tests/unit/assets/bundle-data-manager.test.ts tests/unit/routes/ppb-save-bundle.test.ts --runInBand
```

Result:

```text
Test Suites: 3 passed, 3 total
Tests:       40 passed, 40 total
```

The tests confirm:

- Admin visibility parsing supports `autoSelectBrowsedProduct`.
- PPB save persists direct Bundle Visibility / `bundleUpsellConfig` state.
- Runtime bundle selection uses current product context for targeting.

They do not cover storefront add-browsed preselection because no current
storefront consumer exists.

## Matrix resolution

G02 should be marked **X** for Product List, Product Grid, Horizontal Slots, and
Vertical Slots. EB defines add-browsed as current-product preselection, WPB
persists the corresponding flags, but the Product Page widget does not consume
those flags to seed `selectedProducts`.
