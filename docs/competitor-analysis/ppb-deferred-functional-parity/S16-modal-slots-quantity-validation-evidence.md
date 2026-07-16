---
schema_version: 1
id: ppb-s16-modal-slots-quantity-validation-evidence
title: PPB S16 Modal Slots Quantity Validation Evidence
type: parity-evidence
status: active
summary: Documents Horizontal Slots and Vertical Slots per-product quantity validation parity for EB and Wolfpack.
last_audited: 2026-07-16
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
  - docs/competitor-analysis/ppb-deferred-functional-parity/S16-product-grid-quantity-validation-evidence.md
  - docs/competitor-analysis/ppb-deferred-functional-parity/S16-product-list-quantity-validation-evidence.md
tags:
  - ppb
  - horizontal-slots
  - vertical-slots
  - quantity-validation
keywords:
  - S16
  - Horizontal Slots
  - Vertical Slots
  - validateQuantityPerProduct
---

# PPB S16 Modal Slots Quantity Validation Evidence

## Scope

S16 verifies that `validateQuantityPerProduct` enforces the per-product maximum
independently of the step rule. This pass covers the two modal-slot PPB
templates:

- Horizontal Slots: `PDP_MODAL` + `MODAL`
- Vertical Slots: `PDP_MODAL` + `SIMPLIFIED`

The fixture used `validateQuantityPerProduct.isEnabled: true`,
`allowedQuantity: 1`, and a step rule requiring two total products.

## EB admin save proof

EB was switched through the template picker and saved before each storefront
pass.

| Template | Save endpoint | Status | Saved template fields |
| --- | --- | ---: | --- |
| Horizontal Slots | `POST /api/mixAndMatch/update?offerId=MIX-156854` | 200 | `bundleDesignTemplate: "PDP_MODAL"`, `bundleDesignTemplateData.templateId: "MODAL"` |
| Vertical Slots | `POST /api/mixAndMatch/update?offerId=MIX-156854` | 200 | `bundleDesignTemplate: "PDP_MODAL"`, `bundleDesignTemplateData.templateId: "SIMPLIFIED"` |

## EB storefront proof

Before each viewport pass, Cache Storage, session storage, and local storage
were cleared, then the storefront was hard reloaded with `ignoreCache: true`.

| Template | Viewport | Runtime fields | Duplicate-add result |
| --- | --- | --- | --- |
| Horizontal Slots | 1280×800, DPR 1 | `PDP_MODAL` + `MODAL`; `validateQuantityPerProduct: { isEnabled: true, allowedQuantity: 1 }` | `14k Dangling Obsidian Earrings` changed from `Add to Cart` to `Added x1`; a second click left no quantity-2 state. |
| Horizontal Slots | 390×844, DPR 3 | `PDP_MODAL` + `MODAL`; same validation fields | Same result; no quantity-2 state and no horizontal overflow. |
| Vertical Slots | 1280×800, DPR 1 | `PDP_MODAL` + `SIMPLIFIED`; `validateQuantityPerProduct: { isEnabled: true, allowedQuantity: 1 }` | `14k Dangling Obsidian Earrings` changed from `Add to Cart` to `Added x1`; a second click left no quantity-2 state. |
| Vertical Slots | 390×844, DPR 3 | `PDP_MODAL` + `SIMPLIFIED`; same validation fields | Same result; no quantity-2 state and no horizontal overflow. |

## Wolfpack storefront proof

Wolfpack SIT was tested against
`cmrf19c8d0000v0xpj8rz2wgh` on the `PPB Modal Shared Card Test` product. The
local fixture was switched to each modal template with
`validateQuantityPerProduct: { isEnabled: true, allowedQuantity: 1 }`.

Before each viewport pass, Cache Storage, session storage, and local storage
were cleared, then the storefront was hard reloaded with `ignoreCache: true`.

| Template | Viewport | Runtime fields | Duplicate-add result |
| --- | --- | --- | --- |
| Horizontal Slots | 1280×800, DPR 1 | API 200; `PDP_MODAL` + `MODAL`; validation enabled with max 1; root attrs matched `PDP_MODAL` + `MODAL` | Opening slot Product 1 loaded the product grid. `14k Dangling Obsidian Earrings` changed from `Add to Cart` to `Added x1`; a second click toggled back to `Add to Cart`. No quantity-2 state appeared. |
| Horizontal Slots | 390×844, DPR 3 | API 200; `PDP_MODAL` + `MODAL`; validation enabled with max 1; root attrs matched `PDP_MODAL` + `MODAL` | Same result; no quantity-2 state and no horizontal overflow. |
| Vertical Slots | 1280×800, DPR 1 | API 200; `PDP_MODAL` + `SIMPLIFIED`; validation enabled with max 1; root attrs matched `PDP_MODAL` + `SIMPLIFIED` | Opening slot Product 1 loaded the product grid. `14k Dangling Obsidian Earrings` changed from `Add to Cart` to `Added x1`; a second click toggled back to `Add to Cart`. No quantity-2 state appeared. |
| Vertical Slots | 390×844, DPR 3 | API 200; `PDP_MODAL` + `SIMPLIFIED`; validation enabled with max 1; root attrs matched `PDP_MODAL` + `SIMPLIFIED` | Same result; no quantity-2 state and no horizontal overflow. |

## Fixture restore proof

- EB was restored to Product Grid. The restore save hit
  `POST /api/mixAndMatch/update?offerId=MIX-156854` with status 200, and a
  hard-reloaded storefront showed the Product Grid layout again.
- Wolfpack was restored to its pre-test baseline:
  `bundleDesignTemplate: "PDP_MODAL"`,
  `bundleDesignPresetId: "SIMPLIFIED"`,
  `validateQuantityPerProduct: { isEnabled: false, allowedQuantity: 1 }`, and
  `defaultProductsData: {}`. A hard-reloaded storefront API check returned the
  same baseline values and matching root attrs.

## Result

S16 is **P** for Horizontal Slots and Vertical Slots. Both EB and Wolfpack
enforce a one-per-product maximum in the modal-slot picker while the step rule
continues to require two total products.
