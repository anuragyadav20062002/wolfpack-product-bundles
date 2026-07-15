---
schema_version: 1
id: ppb-s14-dynamic-checkout-safety-evidence
title: PPB S14 Dynamic Checkout Safety Evidence
type: evidence
status: active
summary: Documents current Product Grid EB accelerated-checkout bypass behavior and verified Product Grid plus Vertical Slots WPB safety prevention.
last_audited: 2026-07-15
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/assets/bundle-widget-product-page.js
  - app/assets/widgets/product-page/methods/dom-methods.js
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - docs/competitor-analysis/ppb-horizontal-slots-agentic-parity/HS10-dynamic-checkout-unsupported-evidence.md
tags:
  - ppb
  - dynamic-checkout
keywords:
  - S14
  - Buy it now
---

# S14 Dynamic Checkout Safety Evidence

Date: 2026-07-15

## Scope

This note records the current direct evidence for the remaining S14 dynamic-checkout cells. It does not promote Product List until that template-specific EB/WPB state is replayed.

## EB Product Grid baseline

Chrome DevTools MCP, desktop `1280x800`, Cache Storage cleared, hard reload with `ignoreCache: true`.

Runtime state:

- `gbbmix-template-type="PDP_INPAGE"`
- `gbbmix-template-id="COGNIVE"`
- cart cleared before probe: `item_count: 0`, `total_price: 0`
- zero selected products
- EB bundle CTA rendered as disabled native Add to cart with `pointer-events: none` and opacity `0.5`
- Shopify accelerated checkout `Buy it now` remained active with `pointer-events: auto` and opacity `1`

Activating `Buy it now` navigated from the product page to Shopify checkout:

```text
https://yash-wolfpack.myshopify.com/checkouts/...
```

The EB cart was cleared after the probe and confirmed empty.

## WPB Product Grid safety proof

Chrome DevTools MCP, desktop `1280x800`, Cache Storage cleared, hard reload with `ignoreCache: true`, session selection key `wpbPpb-cart-cmrf19c8d0000v0xpj8rz2wgh` cleared before reload.

Runtime state:

- widget version `5.0.185`
- `data-ppb-template-type="PDP_INPAGE"`
- `data-ppb-design-preset="COGNIVE"`
- zero selected products
- cart before probe: `item_count: 0`, `total_price: 0`
- bundle CTA rendered disabled
- native Shopify accelerated-checkout elements were hidden and marked with `data-wpb-native-dynamic-checkout-hidden="true"`
- WPB visual `Buy it now` surface rendered inside `#bundle-builder-app` with `role="button"` and `aria-disabled="true"`

Activating the WPB visual surface did not navigate and did not mutate cart:

```json
{
  "beforeUrl": "https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test",
  "afterUrl": "https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test",
  "beforeCart": { "item_count": 0, "total_price": 0 },
  "afterCart": { "item_count": 0, "total_price": 0 }
}
```

## WPB Vertical Slots safety proof

Chrome DevTools MCP, desktop `1280x800`, Cache Storage cleared, hard reload with `ignoreCache: true`, session selection key `wpbPpb-cart-cmrf19c8d0000v0xpj8rz2wgh` cleared before reload.

Runtime state:

- widget version `5.0.185`
- `data-ppb-template-type="PDP_MODAL"`
- `data-ppb-design-preset="SIMPLIFIED"`
- `data-ppb-slot-orientation="vertical"`
- zero selected products
- cart before probe: `item_count: 0`, `total_price: 0`
- bundle CTA rendered disabled with opacity `0.5`
- native Shopify accelerated-checkout elements were hidden and marked with `data-wpb-native-dynamic-checkout-hidden="true"`
- WPB visual `Buy it now` surface rendered inside `#bundle-builder-app` with `role="button"` and `aria-disabled="true"`

Activating the WPB visual surface did not navigate and did not mutate cart:

```json
{
  "beforeUrl": "https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test",
  "afterUrl": "https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test",
  "beforeCart": { "item_count": 0, "total_price": 0 },
  "afterCart": { "item_count": 0, "total_price": 0 }
}
```

## Decision

Product Grid and Vertical Slots S14 are accepted as intentional safety divergences: WPB keeps the visual affordance but prevents native accelerated checkout from bypassing bundle validation and Cart Transform contract requirements.

Product List remains unpromoted until its own current template-specific replay confirms the same safety behavior.
