---
schema_version: 1
id: ppb-g23-hide-completed-step-titles-ui-only-evidence
title: PPB G23 Hide Completed Step Titles UI-Only Evidence
type: parity-evidence
status: active
summary: Proves EB Product Page Layout exposes Hide Step Titles in completed state in Admin but the current PPB storefront runtime does not execute it.
last_audited: 2026-07-16
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - docs/competitor-analysis/18-eb-settings-integrations-replication-evidence.md
related_docs:
  - internal docs/EB Implementation Reference.md
tags:
  - ppb
  - eb
  - global-controls
keywords:
  - G23
  - hideStepTitlesInCompletedState
  - Hide Step Titles in completed state
---

# G23 Hide Completed Step Titles

## Result

G23 is terminal **E** for Product List, Product Grid, Horizontal Slots, and Vertical Slots.

EB currently exposes `Hide Step Titles in completed state` in Settings → Product Page Layout → Configuration, but the current EB product-page storefront runtime does not execute the behavior.

This row is therefore an EB no-op execution case, not a Wolfpack implementation gap.

## Evidence

Live EB Admin on `yash-wolfpack` showed Product Page Layout controls with:

- `Hide Step Titles in completed state` present.
- The control was toggled on and saved; Shopify Admin unsaved changes cleared.
- The fixture was restored afterward to the prior unchecked state and saved; the control now shows unchecked again.

Cache-cleared EB Product Grid storefront proof at `1280 x 800`:

- URL: `https://yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`
- Body template attributes: `gbbmix-template-type="PDP_INPAGE"`, `gbbmix-template-id="COGNIVE"`.
- After hard reload with Cache Storage cleared, visible headings still included `1 Step 1` and `Step 1`.
- After selecting products through the live EB controls, the same visible heading samples remained; no completed-step title hiding was observed.
- App-owned storefront requests were healthy: `cart.js`, `updateMixAndMatchBundleView`, and Storefront GraphQL requests returned `200`.

Runtime/script probe from the same EB storefront:

- Loaded `easy-bundle-product-page-min.js` length: `521760`.
- Loaded `easy-bundle-min.js` length: `109641`.
- Neither loaded script contained `hideStepTitlesInCompletedState`.
- Neither loaded script contained `Hide Step Titles`.
- Neither loaded script contained `completed state`.
- The product-page script did contain template heading selectors/classes such as `gbbMixCascadeStepTitle` and `gbbMixCascadeStep`, so the probe covered the active product-page renderer bundle rather than a missing script.

Mobile cache-cleared EB Product Grid storefront proof at `390 x 844 x 3`:

- Body template attributes remained `gbbmix-template-type="PDP_INPAGE"`, `gbbmix-template-id="COGNIVE"`.
- Visible headings included `1 Step 1`, `Step 1`, `2 Step 2`, and `Step 2`.
- Loaded script probes matched desktop: `easy-bundle-product-page-min.js` still lacked `hideStepTitlesInCompletedState`, `Hide Step Titles`, and `completed state`, while containing `gbbMixCascadeStepTitle`.
- Horizontal overflow was `0`.

## Matrix update

Mark G23 as **E** for all four PPB templates. The EB Admin control is present, but the current EB PPB storefront runtime does not expose or execute the behavior for product-page templates.
