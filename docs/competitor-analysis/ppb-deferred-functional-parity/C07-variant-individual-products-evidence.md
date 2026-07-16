---
schema_version: 1
id: ppb-c07-variant-individual-products-evidence
title: PPB C07 Variant Individual Products Evidence
type: evidence
status: active
summary: Direct EB and Wolfpack evidence for PPB variants-as-individual-products across Product List, Product Grid, and Vertical Slots.
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
  - internal docs/EB Implementation Reference.md
tags:
  - ppb
  - variants
keywords:
  - displayVariantsAsIndividualProducts
  - C07
---

# PPB C07 Variant Individual Products Evidence

## Scope

This pass closes C07 for Product List, Product Grid, and Vertical Slots using one
shared fixture mutation instead of separate per-template fixtures.

Horizontal Slots already had direct HS03 evidence and was not replayed.

## Shared fixture grouping

The replay grouped all cells that require the same category-level variant
fixture:

- EB Category 1: `displayVariantsAsIndividualProducts: true`,
  `displayVariantsAsSwatches: false`.
- Wolfpack Step 1 Category 1:
  `displayVariantsAsIndividualProducts: true`,
  `displayVariantsAsSwatches: false`.
- Product: `18k Pedal Ring` with sizes 6, 7, 8, 9, 10, and 11.

Wolfpack's existing category product payload did not include variant details, so
the SIT fixture temporarily injected the six live `18k Pedal Ring` variant
records into the existing category product payload. No category membership was
changed.

## EB Admin proof

EB stores the feature as category-level PPB fields. The live admin Category 1
checkbox `Display variants as individual products` was enabled and saved with
`Updated Successfully`.

The EB implementation reference already records these fields for PPB categories:

- `displayVariantsAsIndividualProducts`
- `displayVariantsAsSwatches`

## EB storefront proof

All EB passes cleared Cache Storage and used cache-bypassed hard reloads.

| Template | Viewport | Runtime | Category flags | Rendered proof | Overflow | Stylesheets |
| --- | --- | --- | --- | --- | --- | --- |
| Product List | 1280x800 | `PDP_INPAGE + CASCADE` | individual variants true, swatches false, product count 6 | Six `18k Pedal Ring ₹399` rows for sizes 6-11 | x -15 | `easy-bundle-product-page-min.css`, `easy-bundle-min.css` |
| Product List | 390x844x3 | `PDP_INPAGE + CASCADE` | individual variants true, swatches false, product count 6 | Six `18k Pedal Ring ₹399` rows for sizes 6-11 | x 0 | `easy-bundle-product-page-min.css`, `easy-bundle-min.css` |
| Product Grid | 1280x800 | `PDP_INPAGE + COGNIVE` | individual variants true, swatches false, product count 6 | Six `18k Pedal Ring ₹399` cards for sizes 6-11 | x -15 | `easy-bundle-product-page-min.css`, `easy-bundle-min.css` |
| Product Grid | 390x844x3 | `PDP_INPAGE + COGNIVE` | individual variants true, swatches false, product count 6 | Six `18k Pedal Ring ₹399` cards for sizes 6-11 | x 0 | `easy-bundle-product-page-min.css`, `easy-bundle-min.css` |
| Vertical Slots | 1280x800 | `PDP_MODAL + SIMPLIFIED` | individual variants true, swatches false, product count 6 | Six `18k Pedal Ring ₹399` picker cards for sizes 6-11 | x -15 | `easy-bundle-product-page-min.css`, `easy-bundle-min.css` |
| Vertical Slots | 390x844x3 | `PDP_MODAL + SIMPLIFIED` | individual variants true, swatches false, product count 6 | Six `18k Pedal Ring ₹399` picker cards for sizes 6-11 | x 0 | `easy-bundle-product-page-min.css`, `easy-bundle-min.css` |

EB variant identities observed for the six individual cards:

- `45038876557508` size 6
- `45038876590276` size 7
- `45038876623044` size 8
- `45038876655812` size 9
- `45038876688580` size 10
- `45038876721348` size 11

## Wolfpack storefront proof

All Wolfpack passes cleared Cache Storage and used cache-bypassed hard reloads.
Wolfpack served widget `5.0.182`.

| Template | Viewport | Runtime | Category flags | Rendered proof | Overflow | Stylesheets |
| --- | --- | --- | --- | --- | --- | --- |
| Product List | 1280x800 | `PDP_INPAGE + CASCADE` | individual variants true, swatches false, product count 6, Pedal variant count 6 | Six `18k Pedal Ring` rows for sizes 6-11 at `$399.00` | x -11 | `bundle-widget-product-page-cascade.css`, `bundle-widget.css` |
| Product List | 390x844x3 | `PDP_INPAGE + CASCADE` | individual variants true, swatches false, product count 6, Pedal variant count 6 | Six `18k Pedal Ring` rows for sizes 6-11 at `$399.00` | x 0 | `bundle-widget-product-page-cascade.css`, `bundle-widget.css` |
| Product Grid | 1280x800 | `PDP_INPAGE + COGNIVE` | individual variants true, swatches false, product count 6, Pedal variant count 6 | Six `18k Pedal Ring` cards for sizes 6-11 at `$399.00` | x -11 | `bundle-widget-product-page-cognive.css`, `bundle-widget.css` |
| Product Grid | 390x844x3 | `PDP_INPAGE + COGNIVE` | individual variants true, swatches false, product count 6, Pedal variant count 6 | Six `18k Pedal Ring` cards for sizes 6-11 at `$399.00` | x 0 | `bundle-widget-product-page-cognive.css`, `bundle-widget.css` |
| Vertical Slots | 1280x800 | `PDP_MODAL + SIMPLIFIED` | individual variants true, swatches false, product count 6, Pedal variant count 6 | Six modal picker cards `18k Pedal Ring - 6` through `18k Pedal Ring - 11` | x 0 | `bundle-widget-product-page-modal.css`, `bundle-widget.css` |
| Vertical Slots | 390x844x3 | `PDP_MODAL + SIMPLIFIED` | individual variants true, swatches false, product count 6, Pedal variant count 6 | Six visible modal picker cards for sizes 6-11 | x 0 | `bundle-widget-product-page-modal.css`, `bundle-widget.css` |

Wolfpack variant identities used for the six individual cards:

- `48720161145091` size 6
- `48720161177859` size 7
- `48720161210627` size 8
- `48720161243395` size 9
- `48720161276163` size 10
- `48720161308931` size 11

## Runtime health

Wolfpack app-owned runtime requests returned 200 during the final Product List
pass, including:

- `/apps/product-bundles/api/design-settings/...`
- `/apps/product-bundles/api/language-settings/...`
- `bundle-widget-product-page-bundled.js`
- `bundle-widget-product-page-cascade.css`
- `bundle-widget.css`

The remaining console noise was Shopify/theme-side 404/502 activity, not the
bundle API, widget bundle, or active PPB stylesheet path.

## Fixture restore

After the replay:

- EB was restored to `PDP_INPAGE + COGNIVE`.
- EB Category 1 `displayVariantsAsIndividualProducts` was restored to false.
- EB storefront hard reload showed one grouped `18k Pedal Ring` row with a
  variant selector containing sizes 6-11.
- Wolfpack was restored to `PDP_MODAL + SIMPLIFIED`.
- Wolfpack Step 1 Category 1 `displayVariantsAsIndividualProducts` and
  `displayVariantsAsSwatches` were restored to false.
- Wolfpack's temporary injected `18k Pedal Ring` variant/options/handle payload
  was removed from the category JSON.
- Wolfpack storefront bundle JSON verified `pedalVariantCount: 0`,
  `displayVariantsAsIndividualProducts: false`, and Step 2 disabled after
  restore.

## Matrix outcome

C07 is Proven for Product List, Product Grid, Horizontal Slots, and Vertical
Slots.
