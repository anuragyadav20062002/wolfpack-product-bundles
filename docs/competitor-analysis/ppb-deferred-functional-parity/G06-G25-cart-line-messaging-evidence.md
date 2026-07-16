---
schema_version: 1
id: ppb-g06-g25-cart-line-messaging-evidence
title: PPB G06 G25 Cart Line Messaging Evidence
type: parity-evidence
status: active
summary: Aggregates existing EB and Wolfpack proof that cart-line item and discount-message controls reach PPB cart lines across all templates.
last_audited: 2026-07-15
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
  - cart-transform
source_paths:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - docs/competitor-analysis/17-eb-complete-configure-e2e-audit.md
  - tests/unit/lib/settings-controls-runtime.test.ts
  - tests/unit/routes/settings-controls-runtime-route-contract.test.ts
related_docs:
  - docs/competitor-analysis/ppb-product-list-agentic-parity/PL08-cart-lines-evidence.md
  - docs/competitor-analysis/ppb-horizontal-slots-agentic-parity/HS08-cart-contract-evidence.md
  - docs/competitor-analysis/ppb-deferred-functional-parity/S09-S13-product-grid-cart-contract-evidence.md
  - docs/competitor-analysis/ppb-deferred-functional-parity/S09-S13-vertical-slots-cart-contract-evidence.md
tags:
  - ppb
  - cart-line
  - cart-transform
keywords:
  - G06
  - G25
  - bundleCartLineMessaging
  - Retail Price
  - You Save
  - Items
---

# G06/G25 Cart Line Messaging

## Result

Rows G06 and G25 are terminal **P** for Product List, Product Grid, Horizontal Slots, and Vertical Slots.

These rows are global cart-line behavior, not renderer layout behavior:

- G25: saved bundle-cart item messaging reaches the cart line as public `Items`.
- G06: saved retail/savings display reaches the cart line as public `Retail Price` and `You Save`.

The active renderer only determines which child products are selected before cart submission. The cart-line display payload is then produced by the shared PPB cart metadata path and Cart Transform settings. Existing EB and WPB evidence covers both the settings toggle contract and live cart-line output across all four templates.

This evidence does not close G26. G26 requires replaying the individual discount-display formats (`amount_percentage`, amount-only, percentage-only); this batch proves that the saved enabled cart-line discount display reaches cart lines.

## EB source-of-truth controls

The PPB configure audit recorded EB Settings → Product Page Layout / Edit Defaults behavior:

- `Bundle Items` maps to `customSettings.bundleCartLineMessaging.showBundleContains`.
- Saving the off-state posted `showBundleContains: false`; restoring posted `showBundleContains: true`.
- `Original Bundle Price` maps to `customSettings.bundleCartLineMessaging.showOriginalPrice`.
- `Discount Display` maps to `customSettings.bundleCartLineMessaging.discountDisplay.isEnabled`.
- When `Discount Display` was off, the `Discount format` dropdown disappeared; when restored, the dropdown returned with `amount_percentage`.

EB storefront/cart proof from the same audit:

- With `showBundleContains: false`, the cart line had no public `Items` property and no `Items:` cart-page row.
- With `showBundleContains: true`, the cart line included public `Items` and the cart page rendered the `Items:` row.
- With `showOriginalPrice: false` and `discountDisplay.isEnabled: false`, the cart line retained `Box` and `Items` but omitted public `Retail Price` and `You Save`.
- Restoring both switches restored `showOriginalPrice: true` and `discountDisplay.isEnabled: true`.

This proves the EB PPB control-to-cart-line contract for G06 and G25.

## WPB settings and transform path

Focused unit and route tests cover the WPB settings path:

- `tests/unit/lib/settings-controls-runtime.test.ts`
  - maps `Cart Messaging`, `Bundle Items`, `Original Bundle Price`, `Discount Display`, and `Discount format` into `bundleCartLineMessaging`;
  - returns `showBundleContains`, `showOriginalPrice`, `discountDisplay.isEnabled`, and normalized `discountDisplay.format`.
- `tests/unit/routes/settings-controls-runtime-route-contract.test.ts`
  - proves the Settings route saves through `buildSettingsControlsRuntime`;
  - proves the route syncs `controlsRuntime.bundleCartLineMessaging` through `CartTransformService.syncCartLineMessagingSettings`.

The shared widget cart-line test also proves PPB delegates source metadata to the shared cart-line helper:

- `tests/unit/assets/widget-cart-lines-integration.test.ts`
  - PPB source contains `buildCartLineSourceProperties`;
  - PPB returns `buildCartLineSourceProperties(...)` for cart submission metadata.

## Product List cart-line proof

`docs/competitor-analysis/ppb-product-list-agentic-parity/PL08-cart-lines-evidence.md` proves:

- EB Product List public `Items` reached the cart line.
- WPB Product List post-sync public `Items` reached the cart line.
- WPB Product List public `Retail Price` reached the cart line when the SIT setting had Original Bundle Price enabled.
- The two-product replay produced `Items` in both EB and WPB, with the WPB `Retail Price` noted as a settings-state difference rather than a Product List renderer gap.

Product List G25 and G06 are therefore proven.

## Product Grid cart-line proof

`docs/competitor-analysis/ppb-deferred-functional-parity/S09-S13-product-grid-cart-contract-evidence.md` proves:

- EB Product Grid parent line properties included public `Items`, `Retail Price`, and `You Save`.
- WPB Product Grid parent line display properties included public `Items`, `Retail Price`, and `You Save`.
- The same proof captured the successful parent cart line and discount-transform agreement.

Product Grid G25 and G06 are therefore proven.

## Horizontal Slots cart-line proof

`docs/competitor-analysis/ppb-horizontal-slots-agentic-parity/HS08-cart-contract-evidence.md` proves:

- EB Horizontal Slots cart line included visible `Items`, `Retail Price`, and `You Save`.
- WPB Horizontal Slots cart line included visible `Items`, `Retail Price`, and `You Save`.

Horizontal Slots G25 and G06 are therefore proven.

## Vertical Slots cart-line proof

`docs/competitor-analysis/ppb-deferred-functional-parity/S09-S13-vertical-slots-cart-contract-evidence.md` proves:

- EB Vertical Slots cart line properties included public `Items`, `Retail Price`, and `You Save`.
- WPB Vertical Slots display properties and posted cart line properties included public `Items`, `Retail Price`, and `You Save`.

Vertical Slots G25 and G06 are therefore proven.

## Matrix update

Promote G06 and G25 to **P** for Product List, Product Grid, Horizontal Slots, and Vertical Slots.
