---
schema_version: 1
id: ppb-g27-redirect-settings-evidence
title: PPB G27 Redirect Settings Evidence
type: parity-evidence
status: verified
summary: Proves Product Page redirect settings map into shared WPB post-add behavior for side-cart, checkout, and cart modes with current EB/WPB runtime evidence.
last_audited: 2026-07-17
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/lib/settings-controls-runtime.ts
  - app/assets/widgets/product-page/methods/cart-methods.js
  - app/assets/widgets/product-page/methods/config-lifecycle-methods.js
  - tests/unit/lib/settings-controls-runtime.test.ts
  - tests/unit/assets/ppb-post-add-redirect.test.ts
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - docs/competitor-analysis/ppb-deferred-functional-parity/G28-execute-script-runtime-evidence.md
tags:
  - ppb
  - g27
  - redirect
  - parity
keywords:
  - Redirect Settings
  - Execute Default Side Cart Update
  - Redirect to Checkout
  - Redirect to Cart
---

# PPB G27 Redirect Settings Evidence

## Scope

G27 is a shared Product Page post-add lifecycle row. The redirect setting is
mapped before template dispatch and runs from the same Product Page cart success
path for Product List, Product Grid, Horizontal Slots, and Vertical Slots.

The current browser pass uses the existing PPB modal/vertical fixture because no
template-specific renderer owns redirect behavior. Focused tests cover all three
saved redirect modes without needing fixture changes for every template.

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
  "runtime": {
    "executeDefaultSideCartUpdate": true,
    "redirectToCartEnabled": false,
    "redirectToCheckoutEnabled": true,
    "executeScriptAfterAddToCart": "",
    "bundleDesignTemplate": "PDP_MODAL",
    "templateId": "SIMPLIFIED",
    "offerId": "MIX-156854"
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
    "executeDefaultSideCartUpdate": true,
    "redirectToCartEnabled": false,
    "redirectToCheckoutEnabled": true,
    "bundleDesignTemplate": "PDP_MODAL",
    "templateId": "SIMPLIFIED",
    "offerId": "MIX-156854"
  },
  "horizontalOverflow": false
}
```

The EB settings capture already documents the relevant Admin choices in
Settings -> Controls -> Product Page Layout:

- `Execute Default Side Cart Update`
- `Redirect to Checkout`
- `Redirect to Cart`
- `Execute Script`

G28 separately proved the shared execute-script lifecycle after a successful EB
bundle add. G27 uses the adjacent redirect flags from that same EB Product Page
post-add settings group.

## WPB proof

Fixture:

- Storefront:
  `https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`
- Bundle: `cmrf19c8d0000v0xpj8rz2wgh`
- Template at verification time: `PDP_MODAL` + `SIMPLIFIED`
- Widget version: `5.0.189`

After selecting the WPB storefront tab, clearing Cache Storage, and hard
reloading with cache ignored, the desktop pass reported:

```json
{
  "viewport": { "innerWidth": 1280, "innerHeight": 800, "dpr": 1 },
  "widgetVersion": "5.0.189",
  "controlsStatus": 200,
  "redirect": {
    "action": "side_cart",
    "executeScript": ""
  },
  "selectors": {
    "sideCart": "",
    "cartPageItems": "",
    "productPagePrice": "",
    "sideCartSectionId": "",
    "sideCartOpenButton": "",
    "cartPageItemsSectionId": ""
  },
  "bundleStatus": 200,
  "template": {
    "bundleDesignTemplate": "PDP_MODAL",
    "bundleDesignPresetId": "SIMPLIFIED",
    "bundleDesignTemplateData": { "templateId": "SIMPLIFIED" }
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
  "redirect": {
    "action": "side_cart",
    "executeScript": ""
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

## Source and test proof

The Product Page redirect mapping is shared:

- `app/lib/settings-controls-runtime.ts` maps `Redirect Settings` to
  `settingsControls.productPage.redirect.action`:
  - `Redirect to Checkout` -> `checkout`
  - `Redirect to Cart` -> `cart`
  - all other/default values -> `side_cart`
- `app/assets/widgets/product-page/methods/cart-methods.js` calls
  `_handlePostAddToCartAction(this._getProductPageControls()?.redirect)` after a
  successful bundle add.
- `app/assets/widgets/product-page/methods/config-lifecycle-methods.js` runs the
  redirect and custom scripts, then applies the saved action:
  - `checkout` writes `/checkout`
  - `side_cart` clicks the configured side-cart trigger when present
  - missing side-cart trigger or explicit `cart` falls back to `/cart`

Focused verification on 2026-07-17:

```bash
npx jest tests/unit/lib/settings-controls-runtime.test.ts tests/unit/assets/ppb-post-add-redirect.test.ts --runInBand
```

Result:

```text
Test Suites: 2 passed, 2 total
Tests:       13 passed, 13 total
```

The new post-add redirect test covers:

- checkout redirect mode
- cart redirect mode
- side-cart trigger click mode
- redirect script and custom Product Page script execution before redirect

## Matrix resolution

G27 should be marked **P** for Product List, Product Grid, Horizontal Slots, and
Vertical Slots. The redirect setting is shared before template dispatch, EB
runtime exposes the same Product Page redirect flags, WPB runtime exposes the
mapped Product Page redirect action, and focused behavior tests cover every
terminal redirect mode without per-template fixture churn.
