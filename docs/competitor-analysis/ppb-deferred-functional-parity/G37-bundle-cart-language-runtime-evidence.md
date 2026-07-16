---
schema_version: 1
id: ppb-g37-bundle-cart-language-runtime-partial-evidence
title: PPB G37 Bundle Cart Language Runtime Evidence
type: evidence
status: accepted
summary: Documents the G37 language runtime aliases, WPB validation-copy source fix, and shared-template acceptance used to close the matrix row.
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

# G37 Bundle Cart Language Runtime Evidence

Date: 2026-07-16

## Current matrix decision

G37 is **P** across Product List, Product Grid, Horizontal Slots, and Vertical
Slots.

This is accepted as shared-runtime proof rather than four independent fixture
mutations. EB exposes one PPB
`pageCustomizationSettings.customTextSettings` object for the active bundle
runtime. WPB serves one Product Page language endpoint and consumes the returned
`textOverrides` through shared Product Page methods. Product List/Product Grid
use the shared in-page footer/drawer/validation methods; Horizontal
Slots/Vertical Slots use the shared modal footer/navigation/validation methods.
The text document and call sites are independent of template preset.

## Chrome DevTools MCP viewport note

Use `mcp__chrome_devtools.emulate({ viewport: "390x844x1,mobile,touch" })` for
mobile passes. `resize_page` alone only changed the outer Chrome window during
this investigation and did not change `window.innerWidth`.

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

The final 2026-07-16 retry repeated this desktop hard reload at `1280 x 800`
after clearing Cache Storage. EB still reported `PDP_INPAGE + COGNIVE`,
offer `MIX-156854`, the same custom text subset, and visible
`View Bundle Items` plus `Next`.

After applying DevTools mobile emulation and hard reloading again, the same EB
Product Grid storefront reported:

```json
{
  "viewport": { "width": 390, "height": 844, "dpr": 1, "touch": true },
  "template": "PDP_INPAGE",
  "templateData": { "templateId": "COGNIVE" },
  "customTextSubset": {
    "addToCartBundleBtnText": "Add Bundle to Cart",
    "addToCartBundleBtnLoadingText": "Adding Bundle...",
    "footerNextBtnText": "Next",
    "footerFinishBtnText": "Done",
    "noProductsAvailable": "No Products Available",
    "boxSelectionEligibilityToast_inPage": "Remove {{boxSelectionDifference}} item(s) to select this box",
    "bundleCartDrawerBtnText_inPage": "View Bundle Items",
    "bundleCartSelectedProductsText_inPage": "Selected Products",
    "conditionQuantityGreaterThanOrEqualTo": "Add at least {{conditionQuantity}} products on this step",
    "conditionAmountGreaterThanOrEqualTo": "Add products worth at least {{conditionAmount}} on this step"
  }
}
```

Visible EB mobile text again included `View Bundle Items` and `Next`.

The final 2026-07-16 retry repeated this mobile hard reload with
`mcp__chrome_devtools.emulate({ viewport: "390x844x1,mobile,touch" })`. EB
again reported `PDP_INPAGE + COGNIVE`, the same custom text subset, and visible
`View Bundle Items` plus `Next`.

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

The final 2026-07-16 retry repeated this desktop hard reload at `1280 x 800`
after clearing Cache Storage. WPB still reported widget `5.0.189`,
`PDP_MODAL`, active locale `en`, selected language `English`, and the same
bundle CTA/loading, next/done, selected-products, drawer, toast, and condition
message overrides. Visible text included `Step 1`, `Add Bundle to Cart`,
`Prev`, and `Next`.

After applying DevTools mobile emulation and hard reloading again, the WPB
Vertical Slots storefront reported:

```json
{
  "viewport": { "width": 390, "height": 844, "dpr": 1, "touch": true },
  "version": "5.0.189",
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
    "conditionAmountGreaterThanOrEqualTo": "Add products worth at least {{conditionAmount}} on this step"
  }
}
```

Visible WPB mobile text included `Step 1`, `Add Bundle to Cart`, `Prev`, and
`Next`.

The final 2026-07-16 retry repeated this mobile hard reload with
`mcp__chrome_devtools.emulate({ viewport: "390x844x1,mobile,touch" })`. WPB
again reported widget `5.0.189`, `PDP_MODAL`, active locale `en`, selected
language `English`, the same text override subset, and visible `Step 1`,
`Add Bundle to Cart`, `Prev`, and `Next`.

## Shared-template acceptance

WPB template selection maps the four matrix templates into two runtime families:

| Matrix template | Runtime family | Shared language consumers |
| --- | --- | --- |
| Product List | `PDP_INPAGE + CASCADE` | in-page footer/drawer/validation methods |
| Product Grid | `PDP_INPAGE + COGNIVE` | in-page footer/drawer/validation methods |
| Horizontal Slots | `PDP_MODAL + MODAL` | modal footer/navigation/validation methods |
| Vertical Slots | `PDP_MODAL + SIMPLIFIED` | modal footer/navigation/validation methods |

The relevant source paths are:

- `app/assets/widgets/product-page/templates/list.config.js`
- `app/assets/widgets/product-page/templates/grid.config.js`
- `app/assets/widgets/product-page/templates/horizontal-slots.config.js`
- `app/assets/widgets/product-page/templates/vertical-slots.config.js`
- `app/assets/widgets/product-page/methods/footer-modal-state-methods.js`
- `app/assets/widgets/product-page/methods/layout-shell-methods.js`
- `app/assets/widgets/product-page/methods/modal-state-methods.js`
- `app/assets/widgets/product-page/methods/widget-misc-methods.js`
- `app/assets/widgets/product-page/templates/cascade-template.js`

The shared runtime covers the G37 surfaces:

- CTA/loading: `_resolveText('addToCartButton')` and
  `_resolveText('addingToCart')`
- navigation: `_resolveText('nextButton')` and `_resolveText('doneButton')`
- bundle drawer/summary labels: `_resolveText('viewBundleItems')` and
  `_resolveText('bundleCartSelectedProductsText')`
- validation/toast text:
  `formatProductPageStepValidationToast(step, this._resolveText.bind(this))`
  and `_resolveText('boxSelectionEligibilityToast_inPage')`

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

## Matrix decision

Promote G37 to **P** across all four templates. This row is closed by shared
PPB language runtime proof, EB/WPB desktop+mobile hard reloads covering both
template families, and focused tests for the active locale response plus
validation-copy interpolation.
