---
schema_version: 1
id: ppb-g01-bundle-visibility-targeting-evidence
title: PPB Bundle Visibility Targeting Evidence
type: parity-evidence
status: active
summary: Documents EB and Wolfpack Product Page Bundle target-product visibility behavior for G01.
last_audited: 2026-07-15
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - docs/competitor-analysis/ppb-deferred-functional-parity/G08-bundle-active-inactive-status-evidence.md
tags:
  - ppb
  - bundle-visibility
  - targeting
keywords:
  - G01
  - product targeting
  - visibility
---

# PPB bundle visibility targeting evidence

## Scope

G01 covers bundle visibility by product context. The storefront gate runs before the template-specific PPB UI mounts: the configured parent product renders the bundle, while unrelated product pages must not render Product Page Bundle controls.

Because this visibility gate is upstream of template dispatch, one target/non-target replay closes Product List, Product Grid, Horizontal Slots, and Vertical Slots when EB and WPB show the same behavior on desktop and mobile.

No EB or WPB persisted fixture settings were changed for this batch.

## EB evidence

Verified with Chrome DevTools MCP on 2026-07-15. Cache Storage was cleared and each evidence page was hard reloaded with `ignoreCache: true`.

Target product:

- URL: `https://yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`
- Desktop viewport: `1280 x 844`, DPR `1`.
- Mobile viewport: `390 x 844`, DPR `3`.
- Runtime markers on both viewports:
  - `document.body[gbbmix-template-type] = "PDP_INPAGE"`
  - `document.body[gbbmix-template-id] = "COGNIVE"`
  - Product Page Bundle scripts loaded:
    - `easy-bundle-product-page-min.js`
    - `easy-bundle-min.js`
  - Bundle text was present, including `Step 1`, `Category 1`, `View Bundle Items`, and `Next`.
  - Horizontal overflow was `0`.

Non-target product:

- URL: `https://yash-wolfpack.myshopify.com/products/yellow-sofa`
- Desktop viewport: `1280 x 844`, DPR `1`.
- Mobile viewport: `390 x 844`, DPR `3`.
- Runtime markers on both viewports:
  - No `gbbmix-template-type`.
  - No `gbbmix-template-id`.
  - No rendered elements matching `[class*="gbbMix"]` or `[gbbmix-template-type]`.
  - No bundle text such as `Step 1`, `Category 1`, `View Bundle Items`, `Add 2 product(s) to save`, or `Next`.
  - Only the generic EB embed loader script was present on the page.
  - Horizontal overflow was `0`.

## WPB evidence

Verified with Chrome DevTools MCP on 2026-07-15. Cache Storage was cleared and each evidence page was hard reloaded with `ignoreCache: true`.

Target product:

- URL: `https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`
- Desktop viewport: `1280 x 844`, DPR `1`.
- Mobile viewport: `390 x 844`, DPR `3`.
- Runtime markers on both viewports:
  - `data-ppb-template-type = "PDP_MODAL"`
  - `data-ppb-design-preset = "SIMPLIFIED"`
  - `window.__BUNDLE_WIDGET_VERSION__ = "5.0.186"`
  - Product Page Bundle script loaded from Shopify extension assets:
    - `bundle-widget-product-page-bundled.js`
  - Bundle text was present, including `Step 1`, `Category 1`, `View Bundle Items`, and `Next`.
  - Horizontal overflow was `0`.

Non-target product:

- URL: `https://agent-5sfidg3m.myshopify.com/products/14k-dangling-obsidian-earrings`
- Desktop viewport: `1280 x 844`, DPR `1`.
- Mobile viewport: `390 x 844`, DPR `3`.
- Runtime markers on both viewports:
  - No `data-ppb-template-type`.
  - No `data-ppb-design-preset`.
  - No rendered bundle root matching `[data-wpb-product-page-bundle]`, `[data-ppb-template-type]`, `.wpb-product-page-bundle`, or `.bundle-builder-widget`.
  - No Product Page Bundle script loaded.
  - `window.__BUNDLE_WIDGET_VERSION__` was absent.
  - No bundle text such as `Step 1`, `Category 1`, `View Bundle Items`, `Add 2 product(s) to save`, `Next`, or `Build your bundle`.
  - Horizontal overflow was `0`.

## Matrix decision

G01 is terminal `P` for Product List, Product Grid, Horizontal Slots, and Vertical Slots.

The evidence proves the configured parent-product visibility gate before template dispatch. The same target/non-target behavior is present in EB and WPB across desktop and mobile, and no fixture mutation was required.
