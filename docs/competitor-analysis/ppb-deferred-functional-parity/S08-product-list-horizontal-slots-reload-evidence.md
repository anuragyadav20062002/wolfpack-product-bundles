---
schema_version: 1
id: ppb-s08-product-list-horizontal-slots-reload-evidence
title: PPB Product List and Horizontal Slots Hard Reload Selection Evidence
type: parity-evidence
status: active
summary: Documents EB and Wolfpack Product List and Horizontal Slots selected-state persistence across hard reloads for S08.
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
tags:
  - ppb
  - product-list
  - horizontal-slots
  - hard-reload
keywords:
  - S08
  - selected-state
  - session-storage
---

# PPB Product List and Horizontal Slots hard reload selection evidence

## Scope

S08 requires direct EB-first and WPB-equivalent proof that selected product state survives a hard reload after selection. This pass covers Product List and Horizontal Slots, grouped because both use the same single-step quantity-rule fixture and selected-state session storage path.

## EB Product List

- Fixture: `WPB PPB Product List Parity 2026-07-11`, Product List preset.
- Desktop hard reload before selection: `gbbmix-template-type=PDP_INPAGE`, `gbbmix-template-id=CASCADE`.
- Selected `14k Dangling Obsidian Earrings` through `.gbbMixCascadeAddBtn`.
- EB stored `gbbMixSdk-cart-MIX-156854` with `item_count: 1`; visible drawer showed `Selected Products`, `14k Dangling Obsidian Earrings x 1`, and `Add 1 product(s) to save 5%!`.
- Desktop hard reload without clearing session preserved `item_count: 1`, the selected product, and the selected-products drawer text.
- Mobile hard reload at 390 x 844 preserved `item_count: 1`, the same selected product, and the same drawer state. Horizontal overflow was `0`.

## EB Horizontal Slots

- Fixture: same EB PPB bundle, Horizontal Slots preset.
- Desktop hard reload before selection: `gbbmix-template-type=PDP_MODAL`, `gbbmix-template-id=MODAL`, with three empty slots.
- Selected `14k Dangling Obsidian Earrings` from the slot modal.
- EB stored `gbbMixSdk-cart-MIX-156854` with `item_count: 1`.
- Desktop hard reload without clearing session preserved `item_count: 1`, the selected product, and the filled first slot text. Positive horizontal overflow was absent.
- Mobile hard reload at 390 x 844 preserved `item_count: 1`, the same selected product, and the filled first slot text. Horizontal overflow was `0`.

## Wolfpack Product List

- Fixture: `PPB Modal Shared Card Test`, Product List preset.
- Desktop hard reload before selection: `window.__BUNDLE_WIDGET_VERSION__=5.0.186`, `templateType=PDP_INPAGE`, `preset=CASCADE`, with no WPB cart storage.
- Selected the first product, `14k Dangling Obsidian Earrings`.
- WPB stored `wpbPpb-cart-cmrf19c8d0000v0xpj8rz2wgh` with `selectedProducts: [{"48720141091075":1},{}]` and `selectedProductCategoryIndexes: [{"48720141091075":0},{}]`.
- Visible text included `Selected Products`, `14k Dangling Obsidian Earrings x 1`, and `Add 1 product(s) to save 5%!`.
- Desktop hard reload without clearing session preserved the selected-products storage and visible selected-products text. Positive horizontal overflow was absent.
- Mobile hard reload at 390 x 844 preserved the same selected-products storage and visible selected-products text. Horizontal overflow was `0`.

## Wolfpack Horizontal Slots

- Fixture: same WPB PPB bundle, Horizontal Slots preset.
- Desktop hard reload before selection: `window.__BUNDLE_WIDGET_VERSION__=5.0.186`, `templateType=PDP_MODAL`, `preset=MODAL`.
- Selected `14k Dangling Obsidian Earrings` from the slot modal.
- WPB stored `wpbPpb-cart-cmrf19c8d0000v0xpj8rz2wgh` with `selectedProducts: [{"48720141091075":1},{}]`.
- Desktop hard reload without clearing session preserved the selected-products storage and filled first slot text.
- Mobile hard reload at 390 x 844 preserved the same selected-products storage and filled first slot text. Horizontal overflow was `0`.

## Fixture restoration

- WPB was restored to Vertical Slots and hard-reload verified as `templateType=PDP_MODAL`, `preset=SIMPLIFIED`, with no WPB cart storage.
- EB was restored to Product Grid and hard-reload verified as `gbbmix-template-type=PDP_INPAGE`, `gbbmix-template-id=COGNIVE`, with an empty EB cart state.
