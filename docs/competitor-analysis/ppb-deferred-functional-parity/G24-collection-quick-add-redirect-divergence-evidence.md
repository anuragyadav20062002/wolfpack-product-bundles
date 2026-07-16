---
schema_version: 1
id: ppb-g24-collection-quick-add-redirect-divergence-evidence
title: PPB G24 Collection Quick Add Redirect Divergence Evidence
type: parity-evidence
status: verified
summary: Documents that WPB maps the collection quick-add redirect setting but currently has no storefront consumer, so theme quick-add remains native cart-add behavior.
last_audited: 2026-07-17
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/lib/settings-controls-runtime.ts
  - app/lib/admin-configuration-surfaces.ts
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - internal docs/EB Implementation Reference.md
tags:
  - ppb
  - g24
  - quick-add
  - divergence
keywords:
  - Redirect Collection Page Quick Add to Bundle
  - redirectCollectionQuickAddToBundle
  - collection quick add
  - cart add
---

# PPB G24 Collection Quick Add Redirect Divergence Evidence

## Scope

G24 checks whether a collection/theme quick-add interaction enters the correct
Product Page Bundle offer/context instead of adding the clicked product directly
to the cart.

This row is shared before template rendering. A collection-page quick-add
redirect would have to run outside the Product Page widget template renderer, so
Product List, Product Grid, Horizontal Slots, and Vertical Slots share the same
pass/fail outcome.

## EB baseline

The captured EB Settings -> Controls -> Product Page Layout evidence exposes
`Redirect Collection Page 'Quick Add' to Bundle` alongside the Product Page
controls. The EB implementation reference documents the Product Page visibility
and add-browsed/redirect family as storefront-entry behavior, not a
template-specific renderer option.

## WPB runtime proof

Storefront:
`https://agent-5sfidg3m.myshopify.com/collections/all`

After selecting the WPB collection tab, clearing Cache Storage, setting desktop
viewport, and hard reloading with cache ignored, the collection pass reported:

```json
{
  "viewport": { "innerWidth": 1280, "innerHeight": 800, "dpr": 1 },
  "controlsStatus": 200,
  "redirectCollectionQuickAddToBundle": true,
  "hasBundleProductTitle": false,
  "overflow": {
    "documentScrollWidth": 1280,
    "clientWidth": 1280,
    "hasHorizontalOverflow": false
  }
}
```

Visible collection quick-add cards remained native Shopify product forms. For
example:

```json
{
  "text": "1 Add 1 $0.00",
  "links": [
    {
      "text": "1",
      "href": "https://agent-5sfidg3m.myshopify.com/products/1?variant=48720370630915"
    }
  ],
  "buttons": [
    {
      "text": "Add",
      "class": "button button quick-add__button quick-add__button--add add-to-cart-button",
      "type": "submit",
      "disabled": false
    }
  ],
  "forms": [
    {
      "action": "https://agent-5sfidg3m.myshopify.com/cart/add",
      "method": "post",
      "id": "48720370630915"
    }
  ]
}
```

A direct click on that quick-add button confirmed the native behavior:

```json
{
  "before": {
    "href": "https://agent-5sfidg3m.myshopify.com/collections/all",
    "cartText": "Cart 0"
  },
  "clicked": true,
  "target": {
    "text": "1 Add 1 $0.00",
    "button": "Add",
    "class": "button button quick-add__button quick-add__button--add add-to-cart-button"
  },
  "after": {
    "href": "https://agent-5sfidg3m.myshopify.com/collections/all",
    "title": "Products – agent",
    "bodyText": "Total items in cart: 1 ... 1 Added Add 1 $0.00",
    "cartText": "1"
  }
}
```

The cart mutation was immediately restored with `POST /cart/clear.js`, which
returned 200 and `item_count: 0`.

## Source proof

Current source only maps and exposes the setting:

- `app/lib/admin-configuration-surfaces.ts` exposes
  `Redirect Collection Page 'Quick Add' to Bundle`.
- `app/lib/settings-controls-runtime.ts` maps that label into
  `settingsControls.productPage.redirectCollectionQuickAddToBundle`.
- `tests/unit/lib/settings-controls-runtime.test.ts` verifies the mapped
  runtime boolean.

There is no storefront consumer in `app/assets/` or route code. A focused search
for `redirectCollectionQuickAddToBundle`, `quickAdd`, and collection quick-add
handlers only finds the Admin/control mapper and tests, not a collection-page
event listener, app-block bridge, or native quick-add interception path.

## Matrix resolution

G24 should be marked **X** for Product List, Product Grid, Horizontal Slots, and
Vertical Slots. The saved runtime control is present and true, but WPB does not
consume it on storefront collection pages. Native Shopify quick-add forms still
post to `/cart/add`, so the quick-add interaction does not enter a Product Page
Bundle offer/context.
