---
schema_version: 1
id: ppb-g18-cta-text-runtime-evidence
title: PPB G18 CTA Text Runtime Evidence
type: parity-evidence
status: verified
summary: Proves saved Product Page CTA and navigation copy reaches EB and WPB Product Page Bundle runtime through the shared language path.
last_audited: 2026-07-16
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/lib/settings-language-runtime.ts
  - app/assets/widgets/product-page/methods/modal-state-methods.js
  - app/assets/widgets/product-page/methods/layout-shell-methods.js
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
related_docs:
  - docs/competitor-analysis/ppb-deferred-functional-parity/G37-bundle-cart-language-runtime-evidence.md
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
tags:
  - ppb
  - g18
  - language
  - cta
keywords:
  - CTA text configuration
  - Add Bundle Cart label
  - Footer Next Button
  - Product Page Layout
---

# G18 CTA Text Runtime Evidence

Date: 2026-07-16

## Current matrix decision

G18 is **P** across Product List, Product Grid, Horizontal Slots, and Vertical
Slots.

This is accepted as shared Product Page language-runtime proof. EB exposes one
PPB Product Page Layout text payload through
`pageCustomizationSettings.customTextSettings`. WPB serves one Product Page
language endpoint and consumes the returned `textOverrides` through the same
runtime families already accepted for G37: Product List/Product Grid use shared
in-page footer and CTA methods, while Horizontal Slots/Vertical Slots use shared
modal footer and CTA methods.

The proof below intentionally changed only the Product Page Layout text fixture,
hard-reloaded EB and WPB storefronts with Cache Storage cleared, then restored
both fixtures to their starting values.

## Temporary text fixture

EB Admin path:

```text
Settings -> Language -> Template Language -> Product Page Layout -> Bundle Cart
```

Original EB values captured before mutation:

```json
{
  "addBundleCartLabel": "Add Bundle to Cart",
  "footerPreviousButton": "Prev",
  "footerNextButton": "Next",
  "footerFinishButton": "Done",
  "addBundleLoadingLabel": "Adding Bundle...",
  "addBundleSuccessLabel": "Bundle Added"
}
```

Temporary G18 values saved for runtime proof:

```json
{
  "addBundleCartLabel": "G18 Add Bundle CTA Long Copy 2026",
  "footerPreviousButton": "G18 Prev",
  "footerNextButton": "G18 Next CTA Long Copy 2026",
  "footerFinishButton": "G18 Done CTA"
}
```

WPB was mirrored by updating the SIT `DesignSettings` row for
`agent-5sfidg3m.myshopify.com` / `product_page` with the Product Page language
field values and rebuilding the runtime settings object through
`buildSettingsLanguageRuntime`. A backup of the starting row was saved at:

```text
/tmp/wpb-g18-design-settings-backup.json
```

The resulting WPB runtime subset was:

```json
{
  "addToCartBundleBtnText": "G18 Add Bundle CTA Long Copy 2026",
  "footerPrevBtnText": "G18 Prev",
  "footerNextBtnText": "G18 Next CTA Long Copy 2026",
  "footerFinishBtnText": "G18 Done CTA",
  "addToCartBundleBtnLoadingText": "Adding Bundle..."
}
```

## EB hard-reload storefront proof

Chrome DevTools MCP selected the EB storefront tab:

```text
https://yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11
```

For desktop and mobile, Cache Storage, local storage, and session storage were
cleared before a hard reload with `ignoreCache: true`.

Desktop proof at `1280 x 800`:

```json
{
  "offerId": "MIX-156854",
  "template": "PDP_INPAGE",
  "templateData": { "templateId": "COGNIVE" },
  "customTextSubset": {
    "addToCartBundleBtnText": "G18 Add Bundle CTA Long Copy 2026",
    "footerPrevBtnText": "G18 Prev",
    "footerNextBtnText": "G18 Next CTA Long Copy 2026",
    "footerFinishBtnText": "G18 Done CTA",
    "addToCartBundleBtnLoadingText": "Adding Bundle..."
  },
  "visibleTextIncluded": "G18 Next CTA Long Copy 2026",
  "overflowX": 0
}
```

Mobile proof used DevTools emulation `390 x 844`, DPR `3`, mobile, touch:

```json
{
  "viewport": { "width": 390, "height": 844, "dpr": 3, "touch": 1 },
  "offerId": "MIX-156854",
  "template": "PDP_INPAGE",
  "templateData": { "templateId": "COGNIVE" },
  "customTextSubset": {
    "addToCartBundleBtnText": "G18 Add Bundle CTA Long Copy 2026",
    "footerPrevBtnText": "G18 Prev",
    "footerNextBtnText": "G18 Next CTA Long Copy 2026",
    "footerFinishBtnText": "G18 Done CTA"
  },
  "visibleTextIncluded": "G18 Next CTA Long Copy 2026",
  "overflowX": 0
}
```

The EB app-owned storefront assets loaded successfully. Console output contained
only unrelated existing storefront noise: two generic `404` resource messages
and one form id/name issue.

## WPB hard-reload storefront proof

Chrome DevTools MCP selected the WPB storefront tab:

```text
https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test
```

For desktop and mobile, Cache Storage, local storage, and session storage were
cleared before a hard reload with `ignoreCache: true`. The language endpoint was
then fetched with `cache: "no-store"`:

```text
/apps/product-bundles/api/language-settings/agent-5sfidg3m.myshopify.com?bundleType=product_page&locale=en
```

Desktop proof at `1280 x 800`:

```json
{
  "languageStatus": 200,
  "version": "5.0.189",
  "textOverrides": {
    "addToCartButton": "G18 Add Bundle CTA Long Copy 2026",
    "nextButton": "G18 Next CTA Long Copy 2026",
    "doneButton": "G18 Done CTA",
    "addingToCart": "Adding Bundle..."
  },
  "visibleTextIncluded": "G18 Add Bundle CTA Long Copy 2026",
  "overflowX": 0
}
```

Mobile proof used DevTools emulation `390 x 844`, DPR `3`, mobile, touch:

```json
{
  "viewport": { "width": 390, "height": 844, "dpr": 3, "touch": 1 },
  "languageStatus": 200,
  "version": "5.0.189",
  "textOverrides": {
    "addToCartButton": "G18 Add Bundle CTA Long Copy 2026",
    "nextButton": "G18 Next CTA Long Copy 2026",
    "doneButton": "G18 Done CTA",
    "addingToCart": "Adding Bundle..."
  },
  "visibleTextIncluded": "G18 Add Bundle CTA Long Copy 2026",
  "overflowX": 0
}
```

The WPB visible body text showed the long Add Bundle CTA on both desktop and
mobile. `nextButton` and `doneButton` were verified in the app-proxy language
payload and are consumed by the same in-page/modal footer methods already mapped
in G37.

The WPB resource list included the Product Page widget bundle, active Product
Page CSS, design settings request, language settings request, controls settings
request, and bundle JSON request. App-owned requests returned successful
responses; console output contained one unrelated theme `404` and preload noise.

## Restore proof

EB was restored through Admin to:

```json
{
  "addBundleCartLabel": "Add Bundle to Cart",
  "footerPreviousButton": "Prev",
  "footerNextButton": "Next",
  "footerFinishButton": "Done"
}
```

After a cache-cleared hard reload, the EB storefront runtime reported:

```json
{
  "customTextSubset": {
    "addToCartBundleBtnText": "Add Bundle to Cart",
    "footerPrevBtnText": "Prev",
    "footerNextBtnText": "Next",
    "footerFinishBtnText": "Done",
    "addToCartBundleBtnLoadingText": "Adding Bundle..."
  },
  "bodyHasG18": false,
  "overflowX": 0
}
```

WPB was restored from `/tmp/wpb-g18-design-settings-backup.json`. The restored
database row returned:

```json
{
  "id": "9fa3c387-fb4e-407d-8d48-c9817ae8c08b",
  "shopId": "agent-5sfidg3m.myshopify.com",
  "buttonAddToCartText": "Add to cart",
  "languageFieldValues": null,
  "ppbCustomTextSettings": null
}
```

After a cache-cleared hard reload, the WPB language endpoint returned defaults:

```json
{
  "languageStatus": 200,
  "version": "5.0.189",
  "textOverrides": {
    "addToCartButton": "Add Bundle to Cart",
    "addingToCart": "Adding Bundle...",
    "nextButton": "Next",
    "doneButton": "Done"
  },
  "bodyHasG18": false,
  "overflowX": 0
}
```
