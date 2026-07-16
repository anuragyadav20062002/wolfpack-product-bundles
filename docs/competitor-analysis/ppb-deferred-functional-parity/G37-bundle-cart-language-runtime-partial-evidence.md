---
schema_version: 1
id: ppb-g37-bundle-cart-language-runtime-partial-evidence
title: PPB G37 Bundle Cart Language Runtime Partial Evidence
type: evidence
status: in_progress
summary: Documents the G37 language runtime aliases and the WPB validation-copy source fix while leaving the matrix row open pending full desktop/mobile template proof.
last_audited: 2026-07-16
owners:
  - product-bundles
domains:
  - competitor-analysis
systems:
  - product-page-bundle
source_paths:
  - app/lib/settings-language-runtime.ts
  - app/assets/widgets/product-page/methods/modal-state-methods.js
  - app/assets/widgets/product-page/methods/layout-shell-methods.js
  - app/assets/widgets/product-page/methods/widget-misc-methods.js
  - tests/unit/lib/settings-language-runtime.test.ts
  - tests/unit/assets/ppb-product-list-step-conditions.test.ts
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - docs/competitor-analysis/ppb-deferred-functional-parity/G36-product-card-language-runtime-evidence.md
tags:
  - ppb
  - language
  - bundle-cart
keywords:
  - G37
  - bundleCartDrawerBtnText_inPage
  - conditionQuantityGreaterThanOrEqualTo
  - conditionAmountGreaterThanOrEqualTo
---

# G37 Bundle Cart Language Runtime Partial Evidence

Date: 2026-07-16

## Current matrix decision

G37 remains **T** across all templates. This pass fixed and verified a real WPB
runtime consumption gap, but it does not yet provide the full desktop/mobile
template-cycle proof required to promote the row.

## EB hard-reload runtime proof

Chrome DevTools MCP selected the EB storefront tab
`https://yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`,
cleared Cache Storage, and reloaded with `ignoreCache: true`.

The active EB PPB runtime returned:

```json
{
  "offerId": "MIX-156854",
  "template": "PDP_INPAGE",
  "templateData": { "templateId": "COGNIVE" },
  "viewport": { "width": 1280, "height": 800 }
}
```

Relevant `window.gbbMix.settings.pageCustomizationSettings.customTextSettings`
fields:

```json
{
  "addToCartBundleBtnText": "Add Bundle to Cart",
  "addToCartBundleBtnLoadingText": "Adding Bundle...",
  "footerNextBtnText": "Next",
  "footerFinishBtnText": "Done",
  "noProductsAvailable": "No Products Available",
  "boxSelectionEligibilityToast_inPage": "Remove {{boxSelectionDifference}} item(s) to select this box",
  "bundleCartDrawerBtnText_inPage": "View Bundle Items",
  "bundleCartSelectedProductsText_inPage": "Selected Products",
  "conditions": {
    "quantity": {
      "greaterThanOrEqualTo": { "value": "Add at least {{conditionQuantity}} products on this step" },
      "lessThanOrEqualTo": { "value": "Add a maximum of {{conditionQuantity}} products to continue" },
      "equalTo": { "value": "Add exactly {{conditionQuantity}} products on this step" }
    },
    "amount": {
      "greaterThanOrEqualTo": { "value": "Add products worth at least {{conditionAmount}} on this step" },
      "lessThanOrEqualTo": { "value": "Add products worth maximum of {{conditionAmount}} on this step" },
      "equalTo": { "value": "Add products worth {{conditionAmount}} on this step" }
    }
  }
}
```

Visible EB text included `View Bundle Items` and `Next`.

## WPB source correction

Before this pass, WPB mapped CTA/loading and selected-products labels, but modal
and in-page step-validation toasts still formatted hardcoded fallback text.

The fix adds PPB language aliases for:

- `conditionQuantityGreaterThanOrEqualTo`
- `conditionQuantityLessThanOrEqualTo`
- `conditionQuantityEqualTo`
- `conditionAmountGreaterThanOrEqualTo`
- `conditionAmountLessThanOrEqualTo`
- `conditionAmountEqualTo`

`formatProductPageStepValidationToast` now accepts the active `_resolveText`
function and interpolates EB-style `{{conditionQuantity}}` and
`{{conditionAmount}}` tokens. The in-page shell and modal navigation call sites
now pass the active resolver.

## WPB hard-reload runtime proof

Chrome DevTools MCP selected the WPB storefront tab
`https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`,
cleared Cache Storage, and reloaded with `ignoreCache: true`.

The language endpoint returned HTTP `200`:

```text
/apps/product-bundles/api/language-settings/agent-5sfidg3m.myshopify.com?bundleType=product_page&locale=en
```

Relevant response subset:

```json
{
  "activeLocale": "en",
  "selectedLanguage": "English",
  "textOverrides": {
    "addToCartButton": "Add Bundle to Cart",
    "addingToCart": "Adding Bundle...",
    "nextButton": "Next",
    "doneButton": "Done",
    "noProductsAvailable": "No Products Available",
    "viewBundleItems": "View Bundle Items",
    "bundleCartSelectedProductsText": "Selected Products",
    "boxSelectionEligibilityToast_inPage": "Remove {{boxSelectionDifference}} item(s) to select this box",
    "conditionQuantityGreaterThanOrEqualTo": "Add at least {{conditionQuantity}} products on this step",
    "conditionQuantityLessThanOrEqualTo": "Add a maximum of {{conditionQuantity}} products to continue",
    "conditionQuantityEqualTo": "Add exactly {{conditionQuantity}} products on this step",
    "conditionAmountGreaterThanOrEqualTo": "Add products worth at least {{conditionAmount}} on this step",
    "conditionAmountLessThanOrEqualTo": "Add products worth maximum of {{conditionAmount}} on this step",
    "conditionAmountEqualTo": "Add products worth {{conditionAmount}} on this step"
  }
}
```

The hard-reloaded storefront remained on widget version `5.0.189` and visible
widget text included `Step 1`, `Add Bundle to Cart`, `Prev`, and `Next`.

## Tests and build

Focused checks:

```bash
npx jest --selectProjects unit --runTestsByPath tests/unit/lib/settings-language-runtime.test.ts tests/unit/assets/ppb-product-list-step-conditions.test.ts
node --check app/assets/widgets/product-page/methods/modal-state-methods.js
node --check app/assets/widgets/product-page/methods/layout-shell-methods.js
node --check app/assets/widgets/product-page/methods/widget-misc-methods.js
npm run build:widgets
```

Results:

- `tests/unit/lib/settings-language-runtime.test.ts`: pass
- `tests/unit/assets/ppb-product-list-step-conditions.test.ts`: pass
- raw Product Page widget JS syntax checks: pass
- widget bundle build/minification: pass

## Remaining proof required

Do not promote G37 yet. Remaining requirements:

- capture the same G37 runtime/visible proof at a real mobile viewport;
- cycle all four PPB templates after a saved language payload, or document why
  the shared runtime path is accepted for every template;
- prove summary, CTA, validation, and toast copy on EB first and equivalent WPB
  behavior after the full template pass.

During this pass, `resize_page({ width: 390, height: 844 })` changed the outer
Chrome window, but the selected tab continued reporting
`innerWidth=1280` / `innerHeight=800`. That is why the matrix row remains open.
