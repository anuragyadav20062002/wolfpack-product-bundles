---
schema_version: 1
id: ppb-g09-product-list-horizontal-vertical-hide-out-of-stock-evidence
title: PPB G09 Product List Horizontal And Vertical Hide Out Of Stock Evidence
type: evidence
status: current
summary: Direct EB and Wolfpack evidence for remaining hideOutOfStockProducts template states, including a Product List WPB blocker.
last_audited: 2026-07-16
owners:
  - product-bundles
domains:
  - competitor-analysis
systems:
  - ppb-storefront
source_paths:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - app/assets/widgets/product-page/methods/product-data-methods.js
related_docs:
  - docs/competitor-analysis/ppb-deferred-functional-parity/G09-product-grid-hide-out-of-stock-evidence.md
tags:
  - ppb
  - inventory
  - product-list
  - horizontal-slots
  - vertical-slots
keywords:
  - G09
  - hideOutOfStockProducts
  - Product List
  - Horizontal Slots
  - Vertical Slots
---

# PPB G09 Product List, Horizontal Slots, And Vertical Slots Hide Out Of Stock Evidence

## Scope

This pass covers the remaining G09 cells after the Product Grid pass:

- Product List (`PDP_INPAGE` + `CASCADE`)
- Horizontal Slots (`PDP_MODAL` + `MODAL`)
- Vertical Slots (`PDP_MODAL` + `SIMPLIFIED`)

All storefront checks used Chrome DevTools MCP, cleared Cache Storage/session/local state, and hard reloaded with cache ignored before each desktop and mobile pass.

## EB evidence

Fixture:

- Storefront: `yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`
- Admin bundle: `WPB PPB Product List Parity 2026-07-11`
- Control: Settings -> Controls -> Product Page Layout -> Hide Out Of Stock Products

Observed on 2026-07-16:

| Template | State | Desktop result | Mobile result |
| --- | --- | --- | --- |
| Product List | Checked | Step 2 showed `Massage Oil` and the available `Grapefruit` variant only; `Pepper` and `Rosemary` were absent. | Same as desktop after mobile hard reload. |
| Product List | Unchecked | Step 2 showed `Massage Oil` plus `Grapefruit`, `Pepper`, and `Rosemary`. | Same as desktop after mobile hard reload. |
| Horizontal Slots | Checked | `PDP_MODAL` + `MODAL`; Step 2 showed `Massage Oil` and `Grapefruit`; `Pepper` and `Rosemary` were absent. | Same as desktop after mobile hard reload. |
| Horizontal Slots | Unchecked | `PDP_MODAL` + `MODAL`; Step 2 showed `Massage Oil` plus `Grapefruit`, `Pepper`, and `Rosemary`. | Same as desktop after mobile hard reload. |
| Vertical Slots | Checked | `PDP_MODAL` + `SIMPLIFIED`; Step 2 showed `Massage Oil` and `Grapefruit`; `Pepper` and `Rosemary` were absent. | Same as desktop after mobile hard reload. |
| Vertical Slots | Unchecked | `PDP_MODAL` + `SIMPLIFIED`; Step 2 showed `Massage Oil` plus `Grapefruit`, `Pepper`, and `Rosemary`. | Same as desktop after mobile hard reload. |

No EB pass produced horizontal overflow. The EB fixture was restored to Product Grid after the pass; Hide Out Of Stock Products remained checked.

## Wolfpack evidence

Fixture:

- Storefront: `agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`
- Bundle: `cmrf19c8d0000v0xpj8rz2wgh`
- Design settings: `9fa3c387-fb4e-407d-8d48-c9817ae8c08b`
- Temporary Step 2 state for replay: enabled
- Control pairing: `hideOutOfStockProducts` false/true with `trackInventoryOnAddToCart` true

The fixture was changed through scoped Prisma updates and the PPB storefront metafield sync service before hard reloads. After each template switch, the rendered storefront dataset confirmed the expected template/preset.

### Product List result

Temporary configuration:

- `bundleDesignTemplate: "PDP_INPAGE"`
- `bundleDesignPresetId: "CASCADE"`
- Step 2 enabled

Direct desktop replay showed the Product List runtime still kept Step 2 disabled and changed the footer from `Next` to `Add Bundle to Cart` after Step 1 was satisfied. The Step 2 button had `disabled: true`; clicking it did not reveal Step 2 products. Because the Step 2 product set is where the fixture contains the mixed available/OOS products, Product List cannot be proven from this fixture.

Matrix result: Product List G09 should be **E**, not **P**. EB supports the true/false behavior, but WPB Product List did not expose the required Step 2 state for equivalent replay.

### Horizontal Slots result

Temporary configuration:

- `bundleDesignTemplate: "PDP_MODAL"`
- `bundleDesignPresetId: "MODAL"`
- Rendered dataset: `ppbTemplateType="PDP_MODAL"`, `ppbDesignPreset="MODAL"`, `ppbSlotOrientation="horizontal"`

| State | Desktop result | Mobile result |
| --- | --- | --- |
| `hideOutOfStockProducts=false` | Step 2 included OOS product/variant text, including `The Out of Stock Snowboard` and `Selling Plans Ski Wax — out of stock`. Available Step 2 products such as `14k Intertwined Earrings` and `14k Solid Bloom Earrings` also rendered. No horizontal overflow. | Same as desktop after mobile hard reload. |
| `hideOutOfStockProducts=true` | Step 2 retained available products such as `14k Intertwined Earrings`, `14k Solid Bloom Earrings`, `Selling Plans Ski Wax`, and `Special Selling Plans Ski Wax`; `The Out of Stock Snowboard` and `Ski Wax — out of stock` labels were absent. No horizontal overflow. | Same as desktop after mobile hard reload. |

Matrix result: Horizontal Slots G09 should be **P**.

### Vertical Slots result

Temporary configuration:

- `bundleDesignTemplate: "PDP_MODAL"`
- `bundleDesignPresetId: "SIMPLIFIED"`
- Rendered dataset: `ppbTemplateType="PDP_MODAL"`, `ppbDesignPreset="SIMPLIFIED"`, `ppbSlotOrientation="vertical"`

| State | Desktop result | Mobile result |
| --- | --- | --- |
| `hideOutOfStockProducts=false` | Step 2 included OOS product/variant text, including `The Out of Stock Snowboard` and `Selling Plans Ski Wax — out of stock`. Available Step 2 products also rendered. No horizontal overflow. | Same as desktop after mobile hard reload. |
| `hideOutOfStockProducts=true` | Step 2 retained available products. `The Out of Stock Snowboard` and `Ski Wax — out of stock` labels were absent. No horizontal overflow. | Same as desktop after mobile hard reload; targeted DOM query after scrolling confirmed `14k Intertwined Earrings` and `14k Solid Bloom Earrings` remained present while OOS text stayed absent. |

Matrix result: Vertical Slots G09 should be **P**.

## Fixture restoration

After the evidence pass, the Wolfpack fixture was restored and synced:

- Bundle template/preset: `PDP_MODAL` + `SIMPLIFIED`
- Step 2: disabled
- `hideOutOfStockProducts`: true
- `trackInventoryOnAddToCart`: true

The EB fixture was restored to Product Grid through the EB template picker. The Hide Out Of Stock Products control remained checked.
