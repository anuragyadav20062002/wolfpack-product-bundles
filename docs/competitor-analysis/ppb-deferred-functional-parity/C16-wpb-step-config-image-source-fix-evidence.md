---
schema_version: 1
id: ppb-c16-wpb-step-config-image-source-fix-evidence
title: PPB C16 WPB Step Config Image Source Fix Evidence
type: parity-evidence
status: active
summary: Documents the WPB source fix that allows PPB Step Config images to render from the public stepImage runtime key.
last_audited: 2026-07-16
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/assets/widgets/product-page/methods/layout-shell-methods.js
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

# C16 WPB Step Config image source fix

## Result

This pass fixes WPB's Product Page Bundle Step Config image source path, but it does **not** promote C16 matrix cells yet.

C16 still requires EB-first desktop/mobile storefront proof for each applicable template plus equivalent WPB template replay before any cell can move from **T** to **P**.

## Root cause

Existing EB audit evidence proves PPB Step Config upload persists the uploaded URL as `productsData1.stepImage`.

WPB already maps the stored step image to the public runtime key:

```json
{
  "stepImage": "https://..."
}
```

The product-page layout renderer only checked `step.bannerImageUrl`, so the public `stepImage` key never created the storefront banner image.

## Source fix

`app/assets/widgets/product-page/methods/layout-shell-methods.js` now resolves the banner image source from:

1. `step.stepImage`
2. `step.bannerImageUrl`

This keeps the existing internal fallback while honoring the EB-aligned public runtime key.

## Tests

Added `tests/unit/assets/ppb-step-config-banner-image.test.ts` with behavior coverage for:

- `stepImage` creates a banner image.
- `bannerImageUrl` remains a fallback.
- no image key returns `null`.

Focused test:

```text
npx jest --selectProjects unit --runTestsByPath tests/unit/assets/ppb-step-config-banner-image.test.ts --runInBand
PASS
```

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

Desktop `1280x800`, Vertical Slots:

```json
{
  "rootAttrs": {
    "templateType": "PDP_MODAL",
    "preset": "SIMPLIFIED",
    "orientation": "vertical",
    "version": "5.0.189"
  },
  "apiStep": {
    "name": "Step 1",
    "stepImage": "https://d3ks0ngva6go34.cloudfront.net/giftBox/yash-wolfpack.myshopify.com/1779733427094.png"
  },
  "banner": {
    "src": "https://d3ks0ngva6go34.cloudfront.net/giftBox/yash-wolfpack.myshopify.com/1779733427094.png",
    "alt": "Step 1",
    "parentClass": "step-banner-image"
  },
  "allBannerCount": 1,
  "overflowX": 0
}
```

Mobile `390x844x3`, Vertical Slots:

```json
{
  "rootAttrs": {
    "templateType": "PDP_MODAL",
    "preset": "SIMPLIFIED",
    "orientation": "vertical",
    "version": "5.0.189"
  },
  "banner": {
    "src": "https://d3ks0ngva6go34.cloudfront.net/giftBox/yash-wolfpack.myshopify.com/1779733427094.png",
    "alt": "Step 1",
    "parentClass": "step-banner-image",
    "rect": {
      "width": 358,
      "height": 358
    }
  },
  "allBannerCount": 1,
  "overflowX": 0
}
```

## Fixture restore

The temporary Step 1 image fixture was restored and hard-reload verified:

```json
{
  "apiStep": {
    "stepImage": null,
    "enabled": true
  },
  "bannerCount": 0,
  "rootAttrs": {
    "templateType": "PDP_MODAL",
    "preset": "SIMPLIFIED",
    "orientation": "vertical"
  }
}
```
