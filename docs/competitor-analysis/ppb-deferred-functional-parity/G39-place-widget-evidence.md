---
schema_version: 1
id: ppb-g39-place-widget-evidence
title: PPB G39 Place Widget Evidence
type: verification-evidence
status: verified
summary: Classifies PPB Place Widget as a shared admin placement workflow with tested template and parent-product context preservation.
last_audited: 2026-07-15
owners:
  - Wolfpack Product Bundles
domains:
  - admin
  - storefront
systems:
  - product-page-bundle-admin
  - product-page-bundle-widget
source_paths:
  - app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/usePpbPlacementHandlers.ts
  - app/lib/bundle-config/product-page-admin-sections.ts
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - docs/competitor-analysis/19-pdp-widget-placement-parity.md
  - docs/issues-prod/eb-configure-completion-parity-1.md
tags:
  - ppb
  - parity
keywords:
  - Place Widget
  - Theme Editor
  - parent product
---

# PPB G39 Place Widget Evidence

## Classification

`G39 Place Widget` is a shared Admin placement workflow, not a per-template
storefront renderer path. Product List, Product Grid, Horizontal Slots, and
Vertical Slots all use the same Product Page Bundle app block and the same
Theme Editor deep-link builder. The active storefront design is persisted on the
bundle and resolved by the runtime widget after placement.

## Existing live evidence

The PPB placement parity note records the current EB interpretation: the PPB
widget belongs in the native Buy buttons / product-form footprint, and the
Admin `Place Widget` flow opens Shopify Theme Editor with the app block
pre-selected. The same note records Wolfpack's matching deep-link shape:

- `template={selected product template}`;
- `addAppBlockId={apiKey}/bundle-product-page`;
- `target=newAppsSection`;
- `bundleId={bundle id}`;
- `previewPath=/products/{bundle parent product handle}`.

The configure parity issue log records direct SIT Chrome smoke for the fixed
workflow:

- `Place Widget` shows loading on the button first;
- the `Select Product Page Template` dialog opens only after template data is
  ready;
- server-returned product template rows are listed without hardcoded rewriting;
- selecting the returned template opens Shopify Theme Editor with the selected
  `template` parameter;
- the Theme Editor URL includes the bundle parent product in `previewPath`.

## Current focused verification

The focused unit contracts were rerun on 2026-07-15:

```text
npx jest tests/unit/routes/ppb-place-widget-product-context.test.ts tests/unit/lib/product-page-admin-sections.test.ts --runInBand
```

Result: 2 suites passed, 18 tests passed.

The tests lock the behavior that matters for `G39`:

- live `bundleProduct.handle` is preferred before the stored fallback handle;
- selected template handle remains separate from product preview context;
- draft parent products use `onlineStorePreviewUrl` for preview context;
- `assignProductTemplate` is posted before opening Theme Editor;
- `product` maps to a null Shopify template suffix and `product.custom` maps to
  `custom`;
- only merchant theme product templates are listed;
- Theme Editor links preserve arbitrary merchant-selected product template
  handles.

## Resolution

Because the workflow is shared before template rendering begins, and because the
tested contract preserves both selected product template and parent-product
preview context, `G39` is Proven for all four PPB templates. No additional
Product List / Product Grid / Horizontal Slots / Vertical Slots storefront
permutation is required for this row.
