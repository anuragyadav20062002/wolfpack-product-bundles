---
schema_version: 1
id: ppb-g10-g13-g17-global-control-absence-evidence
title: PPB G10 G13-G17 Global Control Absence Evidence
type: parity-evidence
status: active
summary: Documents that current EB PPB admin and runtime do not expose several archived global display and style controls.
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
  - controls
  - eb-absent
keywords:
  - G10
  - G13
  - G14
  - G15
  - G16
  - G17
---

# G10/G13-G17 Global Control Absence

## Result

Rows G10 and G13-G17 are terminal **E** across Product List, Product Grid, Horizontal Slots, and Vertical Slots.

Current EB Product Page Bundle admin and runtime do not expose the archived global controls for:

- `displayPrices`
- `displayConditionDescriptions`
- `cartIconType` / `cartStyle`
- `productCardStyle` / `slotCardStyle`
- `checkoutButtonStyle`
- `bundleAddingAnimation`

Because EB does not expose or execute these controls in the current PPB runtime, WPB should not invent corresponding alternate states for parity.

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

The admin surface did not expose controls for hiding all prices, condition-description display, cart icon/style, product-card style, slot-card style, checkout-button style, or bundle-adding animation.

## Current EB storefront runtime evidence

Test product: `yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`.

After clearing Cache Storage and hard reloading with DevTools `ignoreCache: true`, the runtime settings object was inspected:

```json
{
  "template": { "id": "COGNIVE", "type": "PDP_INPAGE" },
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
  "present": {
    "displayPrices": false,
    "displayConditionDescriptions": false,
    "cartIconType": false,
    "cartStyle": false,
    "productCardStyle": false,
    "slotCardStyle": false,
    "checkoutButtonStyle": false,
    "bundleAddingAnimation": false
  },
  "overflowX": 0
}
```

## Fixture state

No EB or WPB fixture mutation was required for this absence check.
