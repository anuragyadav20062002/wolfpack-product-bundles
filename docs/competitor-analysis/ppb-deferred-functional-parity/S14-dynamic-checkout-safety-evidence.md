---
schema_version: 1
id: ppb-s14-dynamic-checkout-safety-evidence
title: PPB S14 Dynamic Checkout Safety Evidence
type: evidence
status: active
summary: Documents current Product List and Product Grid EB accelerated-checkout behavior plus verified Product List, Product Grid, and Vertical Slots WPB safety prevention.
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

This note records the current direct evidence for the remaining S14 dynamic-checkout cells.

## EB Product List baseline

Chrome DevTools MCP, desktop `1280x800` and mobile `390x844x3`, Cache Storage cleared, hard reload with `ignoreCache: true`.

Before capture, the authenticated EB Admin Select template overlay was switched from Product Grid to Product List and saved:

- `bundleDesignTemplate="PDP_INPAGE"`
- `bundleDesignTemplateData.templateId="CASCADE"`

Desktop runtime state:

- `gbbmix-template-type="PDP_INPAGE"`
- `gbbmix-template-id="CASCADE"`
- cart before probe: `item_count: 0`
- cart after probe: `item_count: 0`
- Shopify accelerated checkout `Buy it now` remained visible
- clicking visible `Buy it now` did not navigate away from the product URL
- clicking visible `Buy it now` did not mutate cart

Mobile runtime state:

- viewport `390x844x3`
- `gbbmix-template-type="PDP_INPAGE"`
- `gbbmix-template-id="CASCADE"`
- cart before probe: `item_count: 0`
- cart after probe: `item_count: 0`
- Shopify accelerated checkout `Buy it now` remained visible
- clicking visible `Buy it now` did not navigate away from the product URL
- clicking visible `Buy it now` did not mutate cart

The EB fixture was restored to Product Grid after the Product List capture.

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

## WPB Product List safety proof

Chrome DevTools MCP, desktop `1280x800` and mobile `390x844x3`, Cache Storage cleared, hard reload with `ignoreCache: true`, cart cleared before reload, session selection key `wpbPpb-cart-cmrf19c8d0000v0xpj8rz2wgh` cleared before reload.

Before capture, the agent-store fixture was switched to Product List:

- `bundleDesignTemplate="PDP_INPAGE"`
- `bundleDesignPresetId="CASCADE"`

Desktop runtime state:

- widget version `5.0.185`
- `data-ppb-template-type="PDP_INPAGE"`
- Product List/Cascade rows rendered through `.bw-ppb-cascade-product-row`
- cart before probe: `item_count: 0`
- native Shopify accelerated-checkout elements were hidden and marked with `data-wpb-native-dynamic-checkout-hidden="true"`
- WPB visual `Buy it now` surface rendered with disabled state

Activating the WPB visual surface did not navigate and did not mutate cart:

```json
{
  "viewport": { "innerWidth": 1280, "innerHeight": 800, "dpr": 1 },
  "beforeUrl": "https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test",
  "afterUrl": "https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test",
  "beforeCart": { "item_count": 0 },
  "afterCart": { "item_count": 0 }
}
```

Mobile runtime state:

- widget version `5.0.185`
- viewport `390x844x3`
- Product List/Cascade row count: `6`
- cart before probe: `item_count: 0`
- native Shopify accelerated-checkout elements were hidden and marked with `data-wpb-native-dynamic-checkout-hidden="true"`
- WPB visual `Buy it now` surface rendered with disabled state

Activating the WPB visual surface did not navigate and did not mutate cart:

```json
{
  "viewport": { "innerWidth": 390, "innerHeight": 844, "dpr": 3 },
  "beforeUrl": "https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test",
  "afterUrl": "https://agent-5sfidg3m.myshopify.com/products/ppb-modal-shared-card-test",
  "beforeCart": { "item_count": 0 },
  "afterCart": { "item_count": 0 }
}
```

App-owned request health during the mobile Product List pass:

- `/apps/product-bundles/api/design-settings/agent-5sfidg3m.myshopify.com?bundleType=product_page` returned `200`
- extension CSS `bundle-widget.css` returned `200`
- console showed one generic theme 404 warning; no app-owned request failure was observed

The WPB fixture was restored to Vertical Slots after the Product List capture:

- `bundleDesignTemplate="PDP_MODAL"`
- `bundleDesignPresetId="SIMPLIFIED"`

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

Product List, Product Grid, and Vertical Slots S14 are accepted as intentional safety divergences: WPB keeps the visual affordance but prevents native accelerated checkout from bypassing bundle validation and Cart Transform contract requirements.
