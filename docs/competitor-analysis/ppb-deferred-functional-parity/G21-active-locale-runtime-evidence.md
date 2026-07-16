---
schema_version: 1
id: ppb-g21-active-locale-runtime-evidence
title: PPB G21 Active Locale Runtime Evidence
type: parity-evidence
status: active
summary: Documents shared PPB proof that EB and WPB use the active storefront locale for CTA, validation, and bundle-control text.
last_audited: 2026-07-16
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
  - language-runtime
source_paths:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - docs/competitor-analysis/ppb-deferred-functional-parity/G37-bundle-cart-language-runtime-evidence.md
  - app/lib/settings-language-runtime.ts
  - app/assets/widgets/product-page/methods/layout-shell-methods.js
  - app/assets/widgets/product-page/methods/modal-state-methods.js
  - app/assets/widgets/product-page/methods/widget-misc-methods.js
related_docs:
  - docs/competitor-analysis/ppb-deferred-functional-parity/G36-product-card-language-runtime-evidence.md
  - docs/competitor-analysis/ppb-deferred-functional-parity/G37-bundle-cart-language-runtime-evidence.md
tags:
  - ppb
  - language
  - locale
keywords:
  - G21
  - activeLocale
  - selectedLanguage
  - CTA
  - validation
---

# G21 Active Locale Runtime

## Result

G21 is terminal **P** for Product List, Product Grid, Horizontal Slots, and
Vertical Slots.

This row's storefront contract is that PPB controls, validation, and CTA copy
use the active storefront locale. The 2026-07-16 G37 hard-reload replay already
captured that runtime path directly on EB and WPB desktop and mobile, and the
source call sites map the four matrix templates into the same two PPB language
runtime families.

## EB proof reused from G37

Chrome DevTools MCP selected the EB storefront, cleared Cache Storage, and
hard-reloaded with `ignoreCache: true` on desktop `1280 x 800` and mobile
`390 x 844`.

The EB runtime reported Product Grid `PDP_INPAGE + COGNIVE`, offer
`MIX-156854`, and a single active
`window.gbbMix.settings.pageCustomizationSettings.customTextSettings` object.

The captured active text subset included:

```json
{
  "addToCartBundleBtnText": "Add Bundle to Cart",
  "addToCartBundleBtnLoadingText": "Adding Bundle...",
  "footerNextBtnText": "Next",
  "footerFinishBtnText": "Done",
  "bundleCartDrawerBtnText_inPage": "View Bundle Items",
  "bundleCartSelectedProductsText_inPage": "Selected Products",
  "conditionQuantityGreaterThanOrEqualTo": "Add at least {{conditionQuantity}} products on this step",
  "conditionAmountGreaterThanOrEqualTo": "Add products worth at least {{conditionAmount}} on this step"
}
```

Visible EB desktop and mobile text included `View Bundle Items` and `Next`.

## WPB proof reused from G37

Chrome DevTools MCP selected the WPB storefront, cleared Cache Storage, and
hard-reloaded with `ignoreCache: true` on desktop `1280 x 800` and mobile
`390 x 844`.

The WPB language endpoint returned HTTP `200`:

```text
/apps/product-bundles/api/language-settings/agent-5sfidg3m.myshopify.com?bundleType=product_page&locale=en
```

The captured response reported:

```json
{
  "activeLocale": "en",
  "selectedLanguage": "English",
  "textOverrides": {
    "addToCartButton": "Add Bundle to Cart",
    "addingToCart": "Adding Bundle...",
    "nextButton": "Next",
    "doneButton": "Done",
    "viewBundleItems": "View Bundle Items",
    "bundleCartSelectedProductsText": "Selected Products",
    "conditionQuantityGreaterThanOrEqualTo": "Add at least {{conditionQuantity}} products on this step",
    "conditionAmountGreaterThanOrEqualTo": "Add products worth at least {{conditionAmount}} on this step"
  }
}
```

The hard-reloaded WPB storefront reported widget `5.0.189`, active locale
`en`, selected language `English`, and visible `Step 1`, `Add Bundle to Cart`,
`Prev`, and `Next` on both desktop and mobile.

## Shared-template acceptance

G21 is accepted as shared runtime proof for all templates because the language
document and consumers are template-family scoped, not per-template copies:

| Matrix template | Runtime family | Locale/text consumers |
| --- | --- | --- |
| Product List | `PDP_INPAGE + CASCADE` | in-page footer, drawer, and validation methods |
| Product Grid | `PDP_INPAGE + COGNIVE` | in-page footer, drawer, and validation methods |
| Horizontal Slots | `PDP_MODAL + MODAL` | modal footer, navigation, and validation methods |
| Vertical Slots | `PDP_MODAL + SIMPLIFIED` | modal footer, navigation, and validation methods |

G37 provides the underlying live evidence and source call-site list. G21 is
therefore closed without another fixture mutation.
