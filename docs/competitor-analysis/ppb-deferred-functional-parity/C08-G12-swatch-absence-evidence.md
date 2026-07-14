---
schema_version: 1
id: ppb-c08-g12-swatch-absence-evidence
title: PPB C08 and G12 Swatch Absence Evidence
type: evidence
status: active
summary: Direct EB evidence that the current Product Page Bundle admin and runtime do not expose or execute swatch controls.
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
  - swatches
keywords:
  - displayVariantsAsSwatches
  - displaySwatchColours
  - displaySwatchImages
---

# PPB C08 and G12 Swatch Absence Evidence

## Scope

This pass resolves:

- C08: category-level variant swatches.
- G12: global swatch colour/image controls.

Both rows are classified as EB-absent for all four Product Page Bundle template
columns. No Wolfpack replay is required because EB does not expose or execute
the behavior in the current PPB configuration.

## Existing durable contract

`internal docs/EB Implementation Reference.md` records the persisted fields:

- PPB category field: `displayVariantsAsSwatches`.
- Global config fields: `displaySwatchColours` and `displaySwatchImages`.

The same document records captured values as false. It does not record a live
PPB admin control or a live storefront swatch state.

## EB Admin evidence

The live EB PPB admin was inspected through Chrome DevTools MCP on
2026-07-15.

Step Setup / expanded Category 1 exposed:

- `Display variants as individual products`

It did not expose:

- `Display variants as swatches`
- `Swatch colours`
- `Swatch images`
- any other visible swatch-labeled category control.

Bundle Settings exposed:

- Pre Selected Product
- Enable Quantity Validation
- Pre-order & Subscription Integration
- Cart line item discount display
- Bundle Level CSS
- Bundle Status

It did not expose:

- `displaySwatchColours`
- `displaySwatchImages`
- any visible swatch-labeled global control.

Browser find for `swatch` on the loaded EB admin surface produced no matching
visible control text.

## EB runtime evidence

The current EB storefront was hard reloaded after clearing Cache Storage.

Runtime extraction returned:

```json
{
  "template": "PDP_INPAGE",
  "templateId": "COGNIVE",
  "displayVariantsAsIndividualProducts": false,
  "displayVariantsAsSwatches": false,
  "displaySwatchColours": null,
  "displaySwatchImages": null,
  "keysWithSwatch": [],
  "designConfigKeysWithSwatch": [],
  "bodyContainsSwatch": false,
  "variantSelectorCount": 1
}
```

The rendered product with variants appeared as one grouped product row with a
standard variant selector, not a swatch presentation.

## Matrix outcome

C08 and G12 are EB-absent for Product List, Product Grid, Horizontal Slots, and
Vertical Slots.
