---
schema_version: 1
id: ppb-g36-product-card-language-runtime-evidence
title: PPB G36 Product Card Language Runtime Evidence
type: evidence
status: verified
summary: Verifies EB and WPB expose and consume Product Page product-card language fields through the active PPB locale runtime.
last_audited: 2026-07-16
owners:
  - product-bundles
domains:
  - competitor-analysis
systems:
  - product-page-bundle
source_paths:
  - app/lib/settings-language-runtime.ts
  - app/assets/widgets/product-page/methods/modal-methods.js
  - app/assets/widgets/product-page/methods/inpage-render-methods.js
  - app/assets/widgets/product-page/methods/selection-methods.js
  - tests/unit/lib/settings-language-runtime.test.ts
  - tests/unit/assets/product-page-card-copy.test.ts
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - internal docs/EB Settings Language Reference.md
tags:
  - ppb
  - language
  - product-card
keywords:
  - G36
  - productCardAddBtnText
  - productCardAddBtnText_inPage
  - productVariantLabelText
---

# G36 Product Card Language Runtime Evidence

Date: 2026-07-16

## EB hard-reload baseline

Chrome DevTools MCP selected the EB storefront tab
`https://yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`,
cleared Cache Storage, and reloaded with `ignoreCache: true`.

The active EB Product Page runtime remained:

```json
{
  "offerId": "MIX-156854",
  "template": "PDP_INPAGE",
  "templateData": { "templateId": "COGNIVE" }
}
```

`window.gbbMix.settings.pageCustomizationSettings.customTextSettings` exposed the
Product Card language fields:

```json
{
  "productCardAddBtnText": "Add to Cart",
  "productCardAddBtnText_inPage": "Add +",
  "productVariantLabelText": "Select variant",
  "productAddedBtnText": "Added x{{allowedQuantity}}"
}
```

Visible EB product-card copy included the inline Product Page add label `Add +`.
The same runtime also exposed the active PPB locale document at
`window.gbbMix.settings.languageData`.

## WPB source correction

WPB already returned EB-shaped PPB language data from the app-proxy language
endpoint, but the Product Page widget consumed only a subset of product-card
keys. This pass added the missing runtime aliases and consumers:

- `productCardInlineAddButton` maps from EB `productCardAddBtnText_inPage`;
- `productVariantLabel` maps from EB `productVariantLabelText`;
- Cascade/Product Grid inline cards now resolve `productCardInlineAddButton`
  instead of hardcoding `Add +`;
- variant selectors now receive the active `productVariantLabel` as an
  accessible label;
- selected product-card text remains tokenized through `productAddedBtnText`.

The Bundle Cart aliases `viewBundleItems`, `bundleCartSelectedProductsText`, and
`boxSelectionEligibilityToast_inPage` were also mapped because those keys are
already consumed by Product Page storefront code, but this document closes only
G36.

## WPB hard-reload proof

After `npm run build:widgets`, Chrome DevTools MCP selected the WPB storefront
tab `https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`,
cleared Cache Storage, and reloaded with `ignoreCache: true`.

The app-proxy language endpoint returned HTTP `200`:

```text
/apps/product-bundles/api/language-settings/agent-5sfidg3m.myshopify.com?bundleType=product_page&locale=en
```

Relevant response subset:

```json
{
  "activeLocale": "en",
  "selectedLanguage": "English",
  "ppbCustomTextSettings": {
    "productCardAddBtnText": "Add to Cart",
    "productCardAddBtnText_inPage": "Add +",
    "productVariantLabelText": "Select variant",
    "productAddedBtnText": "Added x{{allowedQuantity}}"
  },
  "textOverrides": {
    "productCardAddButton": "Add to Cart",
    "productCardInlineAddButton": "Add +",
    "productVariantLabel": "Select variant",
    "includedBadge": "Added x{{allowedQuantity}}"
  }
}
```

The hard-reloaded storefront still rendered the active PPB surface with visible
`Step 1` and `Add Bundle to Cart` content on widget version `5.0.189`.

## Test coverage

Focused checks:

```bash
npx jest --selectProjects unit --runTestsByPath tests/unit/lib/settings-language-runtime.test.ts tests/unit/assets/product-page-card-copy.test.ts
node --check app/assets/widgets/product-page/methods/modal-methods.js
node --check app/assets/widgets/product-page/methods/inpage-render-methods.js
node --check app/assets/widgets/product-page/methods/selection-methods.js
npm run build:widgets
```

Results:

- `tests/unit/lib/settings-language-runtime.test.ts`: pass
- `tests/unit/assets/product-page-card-copy.test.ts`: pass
- raw Product Page widget JS syntax checks: pass
- widget bundle build/minification: pass

## Matrix decision

G36 is closed across Product List, Product Grid, Horizontal Slots, and Vertical
Slots because the Product Card language fields are supplied by the shared PPB
language endpoint and consumed by shared Product Page card/selector code used by
the PPB template surfaces.

G37 remains open. This pass mapped some Bundle Cart/toast aliases, but it did
not fully prove every summary, validation, and toast copy surface.
