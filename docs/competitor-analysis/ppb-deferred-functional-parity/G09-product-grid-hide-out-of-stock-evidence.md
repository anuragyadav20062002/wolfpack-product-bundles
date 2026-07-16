---
schema_version: 1
id: ppb-g09-product-grid-hide-out-of-stock-evidence
title: PPB G09 Product Grid Hide Out Of Stock Evidence
type: evidence
status: current
summary: Direct EB and Wolfpack Product Grid evidence for hideOutOfStockProducts true and false states.
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
  - internal docs/EB Implementation Reference.md
tags:
  - ppb
  - product-grid
  - inventory
keywords:
  - G09
  - hideOutOfStockProducts
  - Product Grid
---

# PPB G09 Product Grid Hide Out Of Stock Evidence

## Scope

This pass closes G09 for the Product Grid template only. It verifies the alternate `hideOutOfStockProducts` true/false states against EB and Wolfpack with desktop and mobile hard reloads.

## EB evidence

Fixture:

- Storefront: `yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`
- Template/preset: `PDP_INPAGE` + `COGNIVE`
- Product under test: `Massage Oil`

Observed with Chrome DevTools MCP on 2026-07-16:

| State | Desktop result | Mobile result |
| --- | --- | --- |
| Hide Out Of Stock unchecked | `Massage Oil` exposed `Grapefruit`, `Pepper`, and `Rosemary` variants. | `Massage Oil` exposed `Grapefruit`, `Pepper`, and `Rosemary` variants. |
| Hide Out Of Stock checked | `Massage Oil` exposed only the available `Grapefruit` variant; `Pepper` and `Rosemary` were absent. | `Massage Oil` exposed only the available `Grapefruit` variant; `Pepper` and `Rosemary` were absent. |

Both EB passes kept the Product Grid surface in `PDP_INPAGE` + `COGNIVE`, had no horizontal overflow, and app-owned requests completed successfully. The EB admin fixture was restored to the checked/default state after the replay.

## Wolfpack evidence

Fixture:

- Storefront: `agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`
- Bundle: `cmrf19c8d0000v0xpj8rz2wgh`
- Temporary template/preset: `PDP_INPAGE` + `COGNIVE`
- Temporary Step 2 state: enabled
- Widget version: `5.0.188`
- Product under test: `Selling Plans Ski Wax`
- Fully unavailable products under test: `The Out of Stock Snowboard`, `The Complete Snowboard`

Before each evidence pass, Chrome DevTools MCP cleared Cache Storage/session state and hard reloaded with cache ignored. Bundle JSON fetches were cache-busted with `wpbEvidenceTs`.

### False state: `hideOutOfStockProducts=false`

| Viewport | Result |
| --- | --- |
| Mobile `390x844x3` | `Selling Plans Ski Wax` rendered available and unavailable variants: `Selling Plans Ski Wax — out of stock` disabled, `Special Selling Plans Ski Wax` selected/enabled, and `Sample Selling Plans Ski Wax — out of stock` disabled. `The Out of Stock Snowboard` rendered as an out-of-stock product. `The Complete Snowboard` rendered with all variants disabled: `Ice`, `Dawn`, `Powder`, `Electric`, and `Sunset`. No horizontal overflow. |
| Desktop `1280x800x1` | Same contract as mobile: OOS variants were retained as disabled selector options, fully unavailable products were visible as out-of-stock cards, and no horizontal overflow was present. |

Desktop DOM evidence for `Selling Plans Ski Wax`:

- `Selling Plans Ski Wax — out of stock`: disabled
- `Special Selling Plans Ski Wax`: enabled and selected
- `Sample Selling Plans Ski Wax — out of stock`: disabled

Desktop DOM evidence for `The Complete Snowboard`:

- `Ice — out of stock`: disabled
- `Dawn — out of stock`: disabled
- `Powder — out of stock`: disabled
- `Electric — out of stock`: disabled
- `Sunset — out of stock`: disabled

### True state: `hideOutOfStockProducts=true`

| Viewport | Result |
| --- | --- |
| Desktop `1280x800x1` | `Selling Plans Ski Wax` remained visible as the available product. The unavailable `Selling Plans Ski Wax` / `Sample Selling Plans Ski Wax` variants were absent, fully unavailable snowboard products were absent, out-of-stock buttons were absent, and no horizontal overflow was present. |
| Mobile `390x844x3` | Same contract as desktop: only the available Ski Wax product remained visible, OOS variants/products were absent, out-of-stock buttons were absent, and no horizontal overflow was present. |

Current mobile network proof after hard reload returned 200 for the app-owned bundle JSON, Step 1 product request, Step 2 product request, collection request, and bundle-view request:

- `/apps/product-bundles/api/bundle/cmrf19c8d0000v0xpj8rz2wgh.json?wpbEvidenceTs=1784181785350`
- `/apps/product-bundles/api/storefront-products?...9506413773059...9506414395651...`
- `/apps/product-bundles/api/storefront-products?...9506413576451...9506421833987...`
- `/apps/product-bundles/api/storefront-collections?handles=automated-collection&shop=agent-5sfidg3m.myshopify.com`
- `/apps/product-bundles/api/bundle/cmrf19c8d0000v0xpj8rz2wgh/view`

## Fixture restoration

After the evidence pass, the Wolfpack fixture was restored:

- Bundle template/preset: `PDP_MODAL` + `SIMPLIFIED`
- Step 2: disabled
- `hideOutOfStockProducts`: true
- `trackInventoryOnAddToCart`: true

## Matrix recommendation

Promote G09 Product Grid to **P**. Product List, Horizontal Slots, and Vertical Slots still need direct true/false replay before their G09 cells can be promoted.
