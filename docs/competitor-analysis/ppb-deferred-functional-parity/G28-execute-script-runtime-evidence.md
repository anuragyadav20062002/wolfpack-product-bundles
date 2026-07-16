---
schema_version: 1
id: ppb-g28-execute-script-runtime-evidence
title: PPB G28 Execute Script Runtime Evidence
type: parity-evidence
status: verified
summary: Proves Product Page execute-script settings run once after bundle add in EB and WPB shared Product Page post-add paths.
last_audited: 2026-07-16
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/assets/widgets/product-page/methods/config-lifecycle-methods.js
  - app/assets/widgets/product-page/methods/cart-methods.js
  - app/lib/settings-controls-runtime.ts
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
tags:
  - ppb
  - g28
  - execute-script
  - parity
keywords:
  - Execute Script
  - Product Page Layout
  - post add to cart
  - shared path
---

# PPB G28 Execute Script Runtime Evidence

## Scope

G28 is a shared Product Page post-add lifecycle control, not a visual or
template-specific placement row. EB and WPB both persist the execute-script value
as a Product Page setting and run it after a successful bundle add.

The live replay used EB Product Grid and WPB modal/shared-card fixtures because
the row is owned by the shared Product Page post-add path. Desktop/mobile visual
screenshots are not material for this non-visual lifecycle proof.

## EB proof

EB Admin Product Page Layout Controls temporarily saved this sentinel script:

```js
window.__ppbG28ExecuteScriptCount = (window.__ppbG28ExecuteScriptCount || 0) + 1;
```

After clearing Cache Storage, local/session state, and hard reloading the EB
storefront, runtime state under
`window.gbbMix.settings.pageCustomizationSettings.mixAndMatchBundleSettings`
reported:

- `executeScriptAfterAddToCart`: the sentinel script above
- `isExecuteCustomScriptAfterAddToCartEnabled`: `true`
- `executeDefaultSideCartUpdate`: `true`
- `offerId`: `MIX-156854`
- template: `PDP_INPAGE`
- counter before interaction: `0`

The valid EB flow selected three Step 1 products, clicked the EB-owned Next
button, selected `14k Intertwined Earrings` in Step 2, and clicked the enabled
`Add Bundle to Cart` button.

Result:

- `window.__ppbG28ExecuteScriptCount === 1`
- URL stayed on the product page after the add
- Add/update cart network calls returned 200:
  - `cart/update.js?app=gbbMixBundleApp`
  - `cart/add`
  - `cart.js`
  - `apps/gbb/updateMixAndMatchBundleView`

The EB fixture was restored after the replay. A cache-cleared hard reload then
reported:

```json
{
  "executeScriptAfterAddToCart": "",
  "isExecuteCustomScriptAfterAddToCartEnabled": false,
  "executeDefaultSideCartUpdate": true,
  "offerId": "MIX-156854",
  "template": "PDP_INPAGE",
  "count": 0
}
```

## WPB proof

The SIT fixture was temporarily updated in the `DesignSettings` `product_page`
row for shop `agent-5sfidg3m.myshopify.com`. The backup was saved at
`/tmp/wpb-g28-design-settings-backup.json`.

Only these two persisted fields were changed for the replay:

- `generalSettings.settingsPage.controls["Execute Script"]`
- `generalSettings.settingsControls.productPage.redirect.executeScript`

The temporary WPB sentinel incremented both page and session counters:

```js
window.__wpbG28ExecuteScriptCount = (window.__wpbG28ExecuteScriptCount || 0) + 1; sessionStorage.setItem('wpbG28ExecuteScriptCount', String(Number(sessionStorage.getItem('wpbG28ExecuteScriptCount') || '0') + 1));
```

After clearing cart/session state and hard reloading
`https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`, the
valid WPB flow selected two products and clicked the enabled final
`Add Bundle to Cart` button.

Result:

```json
{
  "marker": "1",
  "windowCount": 1,
  "bodyTail": "Bundle added to cart successfully!"
}
```

The WPB fixture was restored from `/tmp/wpb-g28-design-settings-backup.json`.
Database verification then reported both execute-script fields empty, and a
cache-cleared hard reload reported no session marker and `windowCount: 0`.

## Source path evidence

- `app/lib/settings-controls-runtime.ts` maps the Product Page `Execute Script`
  control into `settingsControls.productPage.redirect.executeScript`.
- `app/assets/widgets/product-page/methods/cart-methods.js` invokes
  `_handlePostAddToCartAction(this._getProductPageControls()?.redirect)` after
  a successful cart add.
- `app/assets/widgets/product-page/methods/config-lifecycle-methods.js` runs the
  configured script through `_runControlsScript(script)` once and catches script
  errors so merchant code cannot break the widget flow.

## Classification

Classify all four G28 cells as **P**. Only one EB template and one WPB template
were replayed because the tested behavior is the shared, non-visual Product Page
post-add lifecycle. The handler is template-agnostic, matching the shared-path
classification already used for G38 and G39.
