---
schema_version: 1
id: ppb-m10-max-slots-absence-evidence
title: PPB M10 Max Slots Per Row Absence Evidence
type: parity-evidence
status: active
summary: Documents that current EB Product Page Bundle admin and storefront runtime do not expose maxSlotsPerRow.
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
  - internal docs/EB Implementation Reference.md
tags:
  - ppb
  - slots
  - eb-absent
keywords:
  - M10
  - maxSlotsPerRow
  - Horizontal Slots
  - Vertical Slots
---

# M10 Max Slots Per Row

## Result

M10 is terminal **E** for Horizontal Slots and Vertical Slots.

The archived EB schema reference previously listed `maxSlotsPerRow`, but the current live EB PPB Product Page Layout admin surface and storefront runtime do not expose or execute that field.

## Current EB admin evidence

Checked EB Settings → Product Page Layout on `yash-wolfpack.myshopify.com` with Chrome DevTools MCP.

The visible Product Page Layout configuration exposed:

- Hide Out Of Stock Products
- Track inventory on Add To Cart (in beta)
- Add bundle to cart after the last step is completed
- Display empty state boxes based on bundle condition
- Hide Step Titles in completed state
- Add to cart when product card is clicked
- Redirect Collection Page 'Quick Add' to Bundle
- Cart Messaging controls
- Discount format
- Redirect Settings
- Execute Script

No `maxSlotsPerRow`, max-slots, or slots-per-row field was present in the live Product Page Layout panel.

## Current EB storefront runtime evidence

Test product: `yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`.

After clearing Cache Storage and hard reloading with DevTools `ignoreCache: true`, the runtime settings object was inspected:

```json
{
  "template": { "id": "COGNIVE", "type": "PDP_INPAGE" },
  "hasMaxSlotsPerRow": false,
  "maxSlotsPerRow": null,
  "settingsKeys": [
    "addBundleToCartOnDone",
    "addToBundleOnProductCardClick",
    "allowPartialLocaleMatching",
    "cartPageItemsSectionId",
    "cartPageItemsSelector",
    "customPropertiesToAdd",
    "customStyle",
    "dynamicScriptForHTMLContent",
    "executeCustomAfterPageLoad",
    "executeDefaultSideCartUpdate",
    "executeScriptAfterAddToCart",
    "hideOutOfStockProducts",
    "includeDynamicParentVariantID",
    "isExecuteCustomScriptAfterAddToCartEnabled",
    "isValidateInventoryEnabled",
    "metafieldNameSpaceAndKeys",
    "overwriteProductPagePriceWithBundlePrice",
    "productImageTransformConfig",
    "rearrangeVariantImages",
    "redirectToCartEnabled",
    "redirectToCheckoutEnabled",
    "renderFilledSlotsAsHorizontalStacked",
    "renderSlotsBasedOnCondition",
    "showComparedAtPriceOnATC",
    "showDefaultProductUnavailableMessageOnAtc",
    "showOutOfStockOnProductCardButton",
    "showOutOfStockPopup",
    "showPricingOnPurchaseOptionsWidget",
    "showProductComparedAtPrice",
    "sideCartOpenBtnSelector",
    "sideCartSectionId",
    "sideCartSectionSelector",
    "useSingleStepCategoriesAsBundleSteps",
    "validateConditionsBeforeAddToCart"
  ],
  "overflowX": 0
}
```

Because EB does not expose the field in the current admin or runtime settings object, WPB should not invent a PPB max-slots-per-row behavior for parity.

## Fixture state

No EB or WPB fixture mutation was required for this absence check.
