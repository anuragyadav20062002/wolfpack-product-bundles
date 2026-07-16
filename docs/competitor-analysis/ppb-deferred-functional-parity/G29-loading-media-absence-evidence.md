---
schema_version: 1
id: ppb-g29-loading-media-absence-evidence
title: PPB G29 Loading Media Absence Evidence
type: parity-evidence
status: active
summary: Documents that current EB Product Page Bundle controls and runtime do not expose a loading image or GIF setting.
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
  - internal docs/EB Edit Settings Gap Audit 2026-06-04.md
tags:
  - ppb
  - controls
  - eb-absent
keywords:
  - G29
  - loading GIF
  - loading image
---

# G29 Loading Media Absence

## Result

Row G29 is terminal **E** across Product List, Product Grid, Horizontal Slots,
and Vertical Slots.

Current EB Product Page Bundle settings do not expose or execute a
Product Page loading image/GIF setting. WPB should not invent a PPB loading-media
state for parity.

## Current EB Admin evidence

Chrome DevTools MCP, EB Settings on `yash-wolfpack.myshopify.com`.

Settings → Controls → Product Page Layout → Configuration exposed these PPB
controls:

- Hide Out Of Stock Products
- Track inventory on Add To Cart (in beta)
- Add bundle to cart after the last step is completed
- Display empty state boxes based on bundle condition
- Hide Step Titles in completed state
- Add to cart when product card is clicked
- Redirect Collection Page 'Quick Add' to Bundle
- Cart Messaging
- Discount format
- Redirect Settings
- Execute Script

Settings → Controls → Product Page Layout → CSS & Scripts exposed only:

- Custom CSS for Mix And Match Bundles

No Product Page Layout control was visible for a loading image, loading GIF,
loader image, loader GIF, or final-root loading media.

## Current EB storefront runtime evidence

Chrome DevTools MCP, cache-cleared hard reload with `ignoreCache: true`, EB
storefront
`yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`.

Runtime template state:

```json
{
  "gbbmix-template-id": "COGNIVE",
  "gbbmix-template-type": "PDP_INPAGE",
  "offerId": "MIX-156854"
}
```

The current Product Page runtime exposes PPB control keys under
`window.gbbMix.settings.pageCustomizationSettings.mixAndMatchBundleSettings`.
The available keys include redirect, execute-script, inventory, product-card
click, empty-slot, and compare-at controls, but no loading media controls.

Probe result:

```json
{
  "loadingGif": {},
  "loadingImage": {},
  "loaderImage": {},
  "loaderGif": {},
  "customStyle": { "mmSettings": null },
  "dynamicScriptForHTMLContent": { "mmSettings": "" },
  "executeCustomAfterPageLoad": { "mmSettings": "" },
  "executeDefaultSideCartUpdate": { "mmSettings": true },
  "executeScriptAfterAddToCart": { "mmSettings": "" },
  "redirectToCartEnabled": { "mmSettings": false },
  "redirectToCheckoutEnabled": { "mmSettings": false },
  "isValidateInventoryEnabled": { "mmSettings": false },
  "addBundleToCartOnDone": { "mmSettings": false },
  "addToBundleOnProductCardClick": { "mmSettings": true },
  "hideOutOfStockProducts": { "mmSettings": true },
  "renderSlotsBasedOnCondition": { "mmSettings": true }
}
```

The absence is shared across PPB templates because these Product Page Layout
controls are store-level runtime settings, not template-specific fields.

## Fixture state

No EB or WPB fixture mutation was required for this absence check.
