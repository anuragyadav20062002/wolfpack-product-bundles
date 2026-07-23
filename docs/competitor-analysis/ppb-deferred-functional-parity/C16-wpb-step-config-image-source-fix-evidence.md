---
schema_version: 1
id: ppb-c16-wpb-step-config-image-source-fix-evidence
title: PPB C16 Step Config Image Runtime Evidence
type: parity-evidence
status: active
summary: Documents EB and WPB all-template proof for PPB Step Config images rendered from the public stepImage runtime key.
last_audited: 2026-07-16
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/assets/widgets/product-page/methods/layout-shell-methods.js
  - app/assets/widgets/product-page/methods/inpage-render-methods.js
  - tests/unit/assets/ppb-step-config-banner-image.test.ts
  - test-spec/ppb-step-config-banner-image.spec.md
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md
tags:
  - ppb
  - step-config
  - media
keywords:
  - C16
  - stepImage
  - Step Config
---

# C16 Step Config image runtime evidence

## Result

Terminal status: **P** for Product List, Product Grid, Horizontal Slots, and Vertical Slots.

EB and WPB both render the saved PPB Step Config image from the public `stepImage` runtime key after cache-cleared hard reloads on desktop and mobile. EB in-page templates render the URL in the step-image wrapper. EB modal templates render the same saved URL in empty-state/category image wrappers. WPB renders the same saved URL as the per-step banner image for all four templates.

## Root cause

Existing EB audit evidence proves PPB Step Config upload persists the uploaded URL as `productsData1.stepImage`.

WPB already maps the stored step image to the public runtime key:

```json
{
  "stepImage": "https://..."
}
```

The first WPB defect was that the product-page layout renderer only checked `step.bannerImageUrl`, so the public `stepImage` key never created the storefront banner image.

The second WPB defect appeared during all-template browser replay: in-page product rendering rewrote the step grid with `target.innerHTML`, which deleted any banner appended before product loading completed.

## Source fix

`app/assets/widgets/product-page/methods/layout-shell-methods.js` now resolves the banner image source from:

1. `step.stepImage`
2. `step.bannerImageUrl`

This keeps the existing internal fallback while honoring the EB-aligned public runtime key.

`app/assets/widgets/product-page/methods/inpage-render-methods.js` now prepends the banner after every in-page renderer write, including loading, empty/failure, and final product states. This prevents async product-load rerenders from removing the image.

## Tests

Added `tests/unit/assets/ppb-step-config-banner-image.test.ts` with behavior coverage for:

- `stepImage` creates a banner image.
- `bannerImageUrl` remains a fallback.
- no image key returns `null`.
- final/async in-page renderer states keep the banner.

Focused test:

```text
npx jest --selectProjects unit --runTestsByPath tests/unit/assets/ppb-step-config-banner-image.test.ts
PASS
```

Required raw-widget checks:

```text
node --check app/assets/widgets/product-page/methods/layout-shell-methods.js
node --check app/assets/widgets/product-page/methods/inpage-render-methods.js
npm run build:widgets
PASS
```

## EB browser verification

Scoped EB fixture:

```json
{
  "offerId": "MIX-156854",
  "stepKey": "productsData1",
  "stepImage": "https://d3ks0ngva6go34.cloudfront.net/giftBox/yash-wolfpack.myshopify.com/1779733427094.png"
}
```

Chrome DevTools MCP, cache-cleared hard reload, EB storefront `yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`.

| Template | Desktop proof | Mobile proof |
|---|---|---|
| Product List (`PDP_INPAGE/CASCADE`) | `gbbmix-template-id="CASCADE"`, `gbbMixCascadeStepImage`, parent `gbbMixStepImageWrapper`, `30x30`, overflow `0` | `gbbmix-template-id="CASCADE"`, `gbbMixCascadeStepImage`, parent `gbbMixStepImageWrapper`, `30x30`, overflow `0` |
| Product Grid (`PDP_INPAGE/COGNIVE`) | `gbbmix-template-id="COGNIVE"`, `gbbMixCascadeStepImage`, parent `gbbMixStepImageWrapper`, `30x30`, overflow `0` | `gbbmix-template-id="COGNIVE"`, `gbbMixCascadeStepImage`, parent `gbbMixStepImageWrapper`, `30x30`, overflow `0` |
| Horizontal Slots (`PDP_MODAL/MODAL`) | `gbbmix-template-id="MODAL"`, `gbbMixEmptyStateCardImage`, parent `gbbMixEmptyStateCardImageWrapper`, two rendered `80x80` images, overflow `0` | `gbbmix-template-id="MODAL"`, `gbbMixEmptyStateCardImage`, parent `gbbMixEmptyStateCardImageWrapper`, two rendered `80x80` images, overflow `0` |
| Vertical Slots (`PDP_MODAL/SIMPLIFIED`) | `gbbmix-template-id="SIMPLIFIED"`, `gbbMixEmptyStateCardImage`, parent `gbbMixEmptyStateCardImageWrapper`, two rendered `80x80` images, overflow `0` | `gbbmix-template-id="SIMPLIFIED"`, `gbbMixEmptyStateCardImage`, parent `gbbMixEmptyStateCardImageWrapper`, two rendered `80x80` images, overflow `0` |

EB was restored to `PDP_INPAGE/COGNIVE` with `productsData1.stepImage: null`; cache-cleared hard reload showed `targetImageCount: 0`.

## WPB browser verification

Scoped SIT fixture mutation:

```json
{
  "bundleDesignTemplate": "PDP_MODAL",
  "bundleDesignPresetId": "SIMPLIFIED",
  "stepId": "df23eddb-2623-4379-9a47-7f833db167bb",
  "timelineIconUrl": "https://d3ks0ngva6go34.cloudfront.net/giftBox/yash-wolfpack.myshopify.com/1779733427094.png"
}
```

Chrome DevTools MCP, cache-cleared hard reload, WPB storefront `agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`.

| Template | Desktop proof | Mobile proof |
|---|---|---|
| Product List (`PDP_INPAGE/CASCADE`) | `data-ppb-template-type="PDP_INPAGE"`, `template-id="CASCADE"`, target image parent `step-banner-image`, rect `357x357`, overflow `0` | `data-ppb-template-type="PDP_INPAGE"`, `template-id="CASCADE"`, target image parent `step-banner-image`, rect `358x358`, overflow `0` |
| Product Grid (`PDP_INPAGE/COGNIVE`) | `data-ppb-template-type="PDP_INPAGE"`, `template-id="COGNIVE"`, target image parent `step-banner-image`, rect `104x104`, overflow `0` | `data-ppb-template-type="PDP_INPAGE"`, `template-id="COGNIVE"`, target image parent `step-banner-image`, rect `164x164`, overflow `0` |
| Horizontal Slots (`PDP_MODAL/MODAL`) | `data-ppb-template-type="PDP_MODAL"`, `template-id="MODAL"`, target image parent `step-banner-image`, rect `113x113`, overflow `0` | `data-ppb-template-type="PDP_MODAL"`, `template-id="MODAL"`, target image parent `step-banner-image`, rect `109x109`, overflow `0` |
| Vertical Slots (`PDP_MODAL/SIMPLIFIED`) | `data-ppb-template-type="PDP_MODAL"`, `template-id="SIMPLIFIED"`, target image parent `step-banner-image`, rect `372x372`, overflow `0` | `data-ppb-template-type="PDP_MODAL"`, `template-id="SIMPLIFIED"`, target image parent `step-banner-image`, rect `358x358`, overflow `0` |

## Fixture restore

The temporary Step 1 image fixture was restored and hard-reload verified:

```json
{
  "rootAttrs": {
    "templateType": "PDP_MODAL",
    "preset": "SIMPLIFIED"
  },
  "stepImage": null,
  "bannerCount": 0,
  "overflowX": 0
}
```
