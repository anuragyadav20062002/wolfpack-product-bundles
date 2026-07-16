---
schema_version: 1
id: ppb-g22-track-inventory-on-add-to-cart-evidence
title: PPB G22 Track Inventory On Add To Cart Evidence
type: parity-evidence
status: verified
summary: Proves the Product Page inventory-on-add control maps into shared EB and Wolfpack runtime paths and gates tracked zero-stock variants through shared Product Page logic.
last_audited: 2026-07-17
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/lib/settings-controls-runtime.ts
  - app/assets/widgets/product-page/methods/product-data-methods.js
  - app/assets/widgets/product-page/methods/selection-data-methods.js
  - app/assets/widgets/product-page/methods/modal-methods.js
  - tests/unit/lib/settings-controls-runtime.test.ts
  - tests/unit/assets/bundle-widget-product-page-products.test.ts
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - internal docs/EB Implementation Reference.md
tags:
  - ppb
  - g22
  - inventory
  - parity
keywords:
  - Track inventory on Add To Cart
  - isValidateInventoryEnabled
  - trackInventoryOnAddToCart
  - zero stock
---

# PPB G22 Track Inventory On Add To Cart Evidence

## Scope

G22 is a shared Product Page runtime control, not a template-specific visual
surface. The control is saved at the Product Page settings layer and consumed by
the shared product-processing, selection, and modal paths before template
rendering. Therefore one EB Product Page fixture and one WPB Product Page fixture
cover all four PPB templates when the runtime mapping and focused branch tests
are also verified.

The current pass intentionally avoided changing the EB fixture again. EB already
exposed the relevant control and help text in the captured Settings evidence:
`Track inventory on Add To Cart (in beta)` is global to Product Page bundles, and
its help content says Shopify product-level Track Quantity must be enabled; zero
inventory products are not shown, and products without Track Quantity can still
appear but cannot be added when out of stock.

## EB proof

Fixture:

- Storefront:
  `https://yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`
- Offer: `MIX-156854`
- Template at verification time: `PDP_MODAL` + `SIMPLIFIED`

After selecting the EB storefront tab, clearing Cache Storage, and hard
reloading with cache ignored, the desktop pass reported:

```json
{
  "viewport": { "innerWidth": 1280, "innerHeight": 800, "dpr": 1 },
  "bodyMarkers": {
    "templateId": "SIMPLIFIED",
    "templateType": "PDP_MODAL"
  },
  "runtimeScript": {
    "offerId": "MIX-156854",
    "bundleDesignTemplate": "PDP_MODAL",
    "templateId": "SIMPLIFIED",
    "hideOutOfStockProducts": true,
    "isValidateInventoryEnabled": false
  },
  "stylesheetOwnership": [
    "easy-bundle-product-page-min.css",
    "easy-bundle-min.css"
  ],
  "horizontalOverflow": false
}
```

The mobile pass used `390x844x3,mobile,touch`, cleared Cache Storage, and hard
reloaded with cache ignored. It reported:

```json
{
  "viewport": { "innerWidth": 390, "innerHeight": 844, "dpr": 3 },
  "runtime": {
    "isValidateInventoryEnabled": false,
    "hideOutOfStockProducts": true,
    "template": "PDP_MODAL",
    "templateId": "SIMPLIFIED"
  },
  "bodyMarkers": {
    "templateId": "SIMPLIFIED",
    "templateType": "PDP_MODAL"
  },
  "horizontalOverflow": false
}
```

App-owned request health on the EB mobile reload was clean for the relevant
runtime paths:

- `GET /cart.js?app=gbbMixBundleApp` -> 200
- `POST /apps/gbb/updateMixAndMatchBundleView` -> 200
- `GET /cart.js` -> 200

Console health showed only Shopify/theme noise: one generic 404 resource error,
with no EB runtime exception.

## WPB proof

Fixture:

- Storefront:
  `https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`
- Bundle: `cmrf19c8d0000v0xpj8rz2wgh`
- Template at verification time: `PDP_MODAL` + `SIMPLIFIED`
- Widget version: `5.0.189`

After selecting the WPB storefront tab, clearing Cache Storage, resetting to
desktop viewport, and hard reloading with cache ignored, the desktop pass
reported:

```json
{
  "viewport": { "innerWidth": 1280, "innerHeight": 800, "dpr": 1 },
  "widgetVersion": "5.0.189",
  "controlsApi": {
    "status": 200,
    "productPageControls": {
      "redirect": { "action": "side_cart", "executeScript": "" },
      "hideOutOfStockProducts": true,
      "trackInventoryOnAddToCart": true,
      "addToCartWhenProductCardClicked": true,
      "validateConditionsBeforeAddToCart": true,
      "redirectCollectionQuickAddToBundle": true,
      "addBundleToCartAfterLastStepCompleted": false
    }
  },
  "bundleApi": {
    "status": 200,
    "template": {
      "bundleDesignTemplate": "PDP_MODAL",
      "bundleDesignPresetId": "SIMPLIFIED",
      "bundleDesignTemplateData": { "templateId": "SIMPLIFIED" }
    }
  },
  "stylesheetOwnership": [
    "bundle-widget-product-page-modal.css",
    "bundle-widget.css"
  ],
  "horizontalOverflow": false
}
```

The mobile pass used `390x844x3,mobile,touch`, cleared Cache Storage, and hard
reloaded with cache ignored. It reported:

```json
{
  "viewport": { "innerWidth": 390, "innerHeight": 844, "dpr": 3 },
  "widgetVersion": "5.0.189",
  "controlsStatus": 200,
  "productPageControls": {
    "trackInventoryOnAddToCart": true,
    "hideOutOfStockProducts": true,
    "redirectCollectionQuickAddToBundle": true,
    "addBundleToCartAfterLastStepCompleted": false
  },
  "bundleStatus": 200,
  "template": {
    "bundleDesignTemplate": "PDP_MODAL",
    "bundleDesignPresetId": "SIMPLIFIED",
    "bundleDesignTemplateData": { "templateId": "SIMPLIFIED" }
  },
  "horizontalOverflow": false
}
```

App-owned request health on the WPB mobile reload was clean for the relevant
runtime paths:

- `GET /apps/product-bundles/api/language-settings/agent-5sfidg3m.myshopify.com?bundleType=product_page&locale=en` -> 200
- `GET /apps/product-bundles/api/controls-settings/agent-5sfidg3m.myshopify.com?bundleType=product_page` -> 200
- `GET /apps/product-bundles/api/bundle/cmrf19c8d0000v0xpj8rz2wgh.json` -> 200
- `POST /apps/product-bundles/api/bundle/cmrf19c8d0000v0xpj8rz2wgh/view` -> 200

Console health showed only Shopify/theme noise: one generic 404 resource error
and one preload warning for the theme compiled stylesheet. There was no WPB
runtime exception.

## Source and test proof

The Product Page control mapping is shared:

- `app/lib/settings-controls-runtime.ts` maps EB label
  `Track inventory on Add To Cart (in beta)` to
  `settingsControls.productPage.trackInventoryOnAddToCart`.
- `app/assets/widgets/product-page/methods/product-data-methods.js` reads that
  shared Product Page control before filtering tracked zero-stock products.
- `app/assets/widgets/product-page/methods/selection-data-methods.js` uses the
  same control before accepting selected quantities.
- `app/assets/widgets/product-page/methods/modal-methods.js` uses the same
  control before disabling zero-stock variant options and clamping quantities.

Focused verification on 2026-07-17:

```bash
npx jest tests/unit/lib/settings-controls-runtime.test.ts tests/unit/assets/bundle-widget-product-page-products.test.ts --runInBand
```

Result:

```text
Test Suites: 2 passed, 2 total
Tests:       26 passed, 26 total
```

Relevant covered branches include:

- EB alias controls map into runtime toggles.
- Tracked zero-stock variants are blocked when inventory tracking is enabled.
- Tracked zero-stock variants remain unbounded when inventory tracking is
  disabled.
- Zero-stock variant options are disabled only when tracking is enabled.
- Backorderable zero-stock variants remain enabled when tracking is enabled.
- Grouped product-card selection chooses the first sellable variant when
  tracking is enabled.

## Matrix resolution

G22 should be marked **P** for Product List, Product Grid, Horizontal Slots, and
Vertical Slots. The setting is shared before template dispatch, the EB runtime
state and help content establish the competitor behavior, the WPB runtime state
shows the mapped control active on the current SIT fixture, and focused behavior
tests cover the alternate enabled/disabled inventory branch without additional
fixture churn.
