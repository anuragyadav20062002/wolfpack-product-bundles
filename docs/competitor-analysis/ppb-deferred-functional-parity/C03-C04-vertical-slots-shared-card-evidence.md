---
schema_version: 1
id: ppb-c03-c04-vertical-slots-shared-card-evidence
title: PPB C03 C04 Vertical Slots Shared Card Evidence
type: parity-evidence
status: active
summary: Documents Vertical Slots sale/compare-at and mixed media card parity for EB and Wolfpack across desktop and mobile.
last_audited: 2026-07-16
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/assets/widgets/product-page-css/templates/modal-slots.css
  - extensions/bundle-builder/assets/bundle-widget-product-page-modal.css
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
related_docs:
  - docs/competitor-analysis/ppb-deferred-functional-parity/C04-product-grid-mixed-aspect-evidence.md
tags:
  - ppb
  - vertical-slots
  - product-card
keywords:
  - C03
  - C04
  - Vertical Slots
  - compare-at
  - mixed media
---

# C03/C04 Vertical Slots Shared Card Evidence

## Result

Rows C03 and C04 are terminal **P** for Vertical Slots.

Direct Chrome DevTools MCP was used. EB and Wolfpack storefront tabs were Cache
Storage cleared and hard reloaded before both desktop and mobile passes.

## EB Vertical Slots proof

- Storefront: `https://yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`
- Runtime: `gbbmix-template-type="PDP_MODAL"`, `gbbmix-template-id="SIMPLIFIED"`
- Desktop: `1280x800x1`
- Mobile: `390x844x3`

Desktop and mobile Step 2 both rendered sale/compare-at pairs in the product-card
price cluster:

- `14k Solid Bloom Earrings`: compare-at `₹529`, sale `₹489`
- `Yellow Sofa`: compare-at `₹150`, sale `₹99.99`
- `14k Dangling Pendant Earrings`: compare-at `₹629`, sale `₹579`
- `18k Solid Bloom Earrings`: compare-at `₹529`, sale `₹489`

The same Step 2 card set rendered mixed media/product-card sizes without
overflow:

- Desktop card heights ranged from `348` to `404` px with `overflowX <= 0`.
- Mobile card heights ranged from `245` to `315` px with `overflowX = 0`.
- Variant-heavy products (`Yellow Sofa`, meal subscriptions, ring sizes) stayed
  inside the same Vertical Slots modal card grid.

The EB evidence pass selected two Step 1 products, switched to Step 2, captured
desktop, repeated the flow under mobile emulation, and then restored the EB
fixture to Product Grid. Product Grid restore was verified after Cache Storage
clear and hard reload: the storefront runtime returned to
`PDP_INPAGE + COGNIVE`.

## Wolfpack Vertical Slots proof

- Storefront: `https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test`
- Bundle: `cmrf19c8d0000v0xpj8rz2wgh`
- Runtime: `wpbmix-template-type="PDP_MODAL"`, `wpbmix-template-id="SIMPLIFIED"`,
  `data-ppb-slot-orientation="vertical"`
- Widget version: `5.0.187`
- Desktop: `1280x800x1`
- Mobile: `390x844x3`

The WPB pass temporarily enabled Step 2 with a scoped DB mutation, then hard
reloaded with an init-script cache buster for
`/apps/product-bundles/api/bundle/{id}.json`. The captured bundle fetch returned
both steps enabled on desktop and mobile.

Desktop and mobile Step 2 both rendered sale/compare-at pairs in the product-card
price cluster:

- `14k Solid Bloom Earrings`: compare-at `$529.00`, sale `$489.00`
- `Purely Almonds Original`: compare-at `$30.00`, sale `$20.00`
- `18k Dangling Pendant Earrings`: compare-at `$629.00`, sale `$579.00`
- `Yellow Sofa`: compare-at `$150.00`, sale `$99.99`

The same Step 2 card set rendered mixed media/product-card cases without
overflow:

- Desktop `14k Solid Bloom Earrings` card: `255x420`, image `229x191`.
- Desktop `Selling Plans Ski Wax` card: `255x420`, image `191x191`, with
  `Only 1 left`.
- Mobile Step 2 cards: `165x332`, images ranged from `119x119` to `143x119`,
  with `overflowX = 0`.
- Variant-heavy products (`Yellow Sofa`, meal subscriptions, ring sizes) stayed
  inside the Vertical Slots modal grid.

After capture, the scoped WPB Step 2 mutation was restored to `enabled: false`.

## Scope

This evidence closes only:

- C03 / Vertical Slots
- C04 / Vertical Slots

It does not close:

- C05 missing media
- C10 fully unavailable product
- D01 disabled discounts
- G09 hide out-of-stock true/false
