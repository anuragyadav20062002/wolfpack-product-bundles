---
schema_version: 1
id: ppb-r07-category-steps-evidence
title: PPB R07 Category-As-Step Evidence
type: verification-evidence
status: verified
summary: Records the current EB-absent category-as-step control and the accepted Wolfpack category-step extension across all four PPB templates.
last_audited: 2026-07-14
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/assets/widgets/product-page
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
tags:
  - ppb
  - category-steps
keywords:
  - useSingleStepCategoriesAsBundleSteps
  - category navigation
---

# PPB R07 Category-As-Step Evidence

## Resolution

R07 is an accepted product divergence (**X**) for all four Product Page Bundle
templates. The current EB merchant configuration does not expose a
category-as-step control, and its storefront runtime keeps
`useSingleStepCategoriesAsBundleSteps` disabled. Wolfpack deliberately supports
the enabled state and was replayed directly on every template.

## EB evidence

Direct Chrome DevTools inspection on 2026-07-14 established:

- The authenticated Product Page Layout Configuration page contained no
  category-as-step control and no associated setup or learn-more link.
- `window.easybundles_ext_data.pageCustomizationData.mixAndMatchData.useSingleStepCategoriesAsBundleSteps`
  was `false` on the EB Product List fixture.
- `window.gbbMix.settings.pageCustomizationSettings.mixAndMatchBundleSettings.useSingleStepCategoriesAsBundleSteps`
  was also `false` after EB runtime processing.

This evidence supersedes the older inferred Admin-location note. It does not
claim that EB never had the field; it records that merchants cannot enable it
through the current captured surface.

## Wolfpack fixture

- Store: `agent-5sfidg3m.myshopify.com`
- Bundle: `PPB Modal Shared Card Test`
- Bundle ID: `cmrf19c8d0000v0xpj8rz2wgh`
- Widget version: `5.0.178`
- Enabled Step 1 contained a populated `Category 1` and an empty long-label
  category.
- The original Step 2 was disabled and did not render as a storefront step.

Every storefront pass cleared Cache Storage and used a cache-bypassed hard
reload before evidence collection.

| Template | Desktop 1280x800 | Mobile 390x844 | Direct interaction result |
| --- | --- | --- | --- |
| Product List | Pass | Pass | Two selections enabled Next; the empty category-step rendered its empty message; Previous restored the populated category and selections. |
| Product Grid | Pass | Pass | Two selections enabled Next; the empty category-step rendered once without recursive loading; Previous restored the populated category and selections. |
| Horizontal Slots | Pass | Pass | The populated category owned three horizontal slots, the empty long-label category owned two slots, and disabled Step 2 was absent. |
| Vertical Slots | Pass | Pass | The populated category owned three vertical slots, the empty long-label category owned two slots, and disabled Step 2 was absent. |

The template-save requests returned `200` with `success: true` for the deployed
Product List, Horizontal Slots, and Vertical Slots contracts. Product Grid was
the initial saved template for the replay.

## Regression coverage

- `tests/unit/assets/bundle-widget-product-page-single-step-categories.test.ts`
  covers category expansion and disabled-step removal.
- `tests/unit/assets/ppb-inpage-empty-step-loading.test.ts` covers the loaded
  empty category-step termination path that the direct Product List and Product
  Grid replays exercised.

No screenshots were written to the repository.
