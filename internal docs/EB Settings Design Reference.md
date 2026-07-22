---
schema_version: 1
id: eb-settings-design-reference
title: EB Settings Design Reference
type: reference
status: authoritative
summary: Live EB Settings Design request, state, and storefront-mapping contract used to implement Wolfpack Design settings.
last_audited: 2026-07-22
owners:
  - engineering
domains:
  - admin
  - settings
systems:
  - design-settings
  - storefront-runtime
source_paths:
  - app/lib/settings-design-contract.ts
  - app/lib/settings-design-runtime.ts
  - app/routes/app/app.settings.tsx
related_docs:
  - internal docs/Operations/Admin Performance.md
tags:
  - design-settings
  - runtime-contract
keywords:
  - pageCustomization
  - stylePresets
---

# EB Settings Design Reference

This document records the live Easy Bundles Settings -> Design behavior used as the target for Wolfpack Product Bundles parity.

Evidence sources:
- Live EB Admin page: `https://admin.shopify.com/store/yash-wolfpack/apps/gift-box-builder-1/brandConfig`
- Live EB FPB storefront: `https://yash-wolfpack.myshopify.com/apps/gbb/easybundle/2?page=addProductsPage1&currentFlow=byob`
- Live EB PPB storefront: `https://yash-wolfpack.myshopify.com/products/wpb-research-product-page-bundle-2026-05-22`
- Existing evidence: `docs/competitor-analysis/16-eb-full-data-flow-investigation.md`
- Runtime capture: EB chunk `8587`, which contains the design preset mapper used by the Admin app.

## Store-Level Contract

EB Settings -> Design is store-level, not per bundle. The Admin reads the full
page-customization document from:

```text
GET https://prod.backend.giftbox.giftkart.app/api/pageCustomization/read?shopName={shop}
```

A save from the Design Control Panel posts the full document to:

```text
POST https://prod.backend.giftbox.giftkart.app/api/pageCustomization/update?shopName={shop}
```

The request body contains these design-bearing roots:

```text
productCard
cartFooter
navigationBanner
generalSettings
mixAndMatchConfig
mixAndMatchData
addonProducts
categoryBlock
summaryBlock
landingPage
banners
stylePresets
templateLevelConfig
```

The read response also carries a `quickSettings` bridge and the feature flag
used by the consolidated runtime:

```json
{
  "quickSettings": {
    "isQuickSettingsEnabled": true,
    "colors": {
      "primaryColor": "#000000",
      "buttonBgColor": "#000000",
      "buttonTextColor": "#ffffff"
    }
  },
  "generalSettings": {
    "applyNewPageCustomization": true
  }
}
```

Updates are full-document writes. A Design save must merge its owned fields
into the current document and preserve every unrelated root, including bundle
configuration, add-ons, banners, template configuration, and mix-and-match
data. Wolfpack applies the same merged Design runtime atomically to its
`product_page` and `full_page` DesignSettings rows so both storefront surfaces
receive one store-level state.

The same save also posts loading/control-related data to:

```text
POST https://prod.backend.giftbox.giftkart.app/api/user/updategeneralsettings?shopName={shop}
```

This second endpoint carries GIF/loading-screen settings such as `preparingBundleGif`, loading background, and consolidated design flags. The actual design color, typography, radius, image-fit, category, cart, product card, and upsell values are in the `pageCustomization/update` payload.

## Storefront Propagation

Landing Page bundles receive the full page customization object through:

```text
window.easybundles_ext_data.pageCustomizationData
window.gbb.settings.stepsConfigurationData
```

The FPB page body also carries:

```text
body[gbb-bundle-design-preset-id="{DEFAULT|CLASSIC|COMPACT|HORIZONTAL}"]
#gbbBundle[data-template-id="FBP_SIDE_FOOTER"]
```

Product Page bundles receive a processed subset through:

```text
window.gbbMix.settings.pageCustomizationSettings.mixAndMatchBundleSettings
window.gbbMix.settings.pageCustomizationSettings.appearanceSettings
```

The PPB page body carries:

```text
body[gbb-mix-consolidated-design="true"]
body[gbbmix-template-type="{PDP_INPAGE|PDP_MODAL}"]
body[gbbmix-template-id="{CASCADE|COGNIVE|MODAL|SIMPLIFIED}"]
```

Current PPB templates use these IDs:

| Template | `bundleDesignTemplate` | `templateId` |
| --- | --- | --- |
| Product List | `PDP_INPAGE` | `CASCADE` |
| Product Grid | `PDP_INPAGE` | `COGNIVE` |
| Horizontal Slots | `PDP_MODAL` | `MODAL` |
| Vertical Slots | `PDP_MODAL` | `SIMPLIFIED` |

Current FPB templates use:

| Template | `bundleDesignTemplate` | `bundleDesignPresetId` |
| --- | --- | --- |
| Standard Design | `FBP_SIDE_FOOTER` | `DEFAULT` |
| Classic Design | `FBP_SIDE_FOOTER` | `CLASSIC` |
| Compact Design | `FBP_SIDE_FOOTER` | `COMPACT` |
| Horizontal Design | `FBP_SIDE_FOOTER` | `HORIZONTAL` |

## Help Links

The EB Design page exposes image guide links rather than text docs. All visible guide links were opened in Chrome on 2026-06-04:

| Scope | Guide URL |
| --- | --- |
| Expert General | `https://d3ks0ngva6go34.cloudfront.net/public/BundleDcpPreview.webp` |
| Categories | `https://d3ks0ngva6go34.cloudfront.net/public/CategoriesDcpPreview.webp` |
| Product Card | `https://d3ks0ngva6go34.cloudfront.net/public/ProductCardDcpPreview.webp` |
| Bundle Cart | `https://d3ks0ngva6go34.cloudfront.net/public/BundleCartDcpPreview.webp` |
| Upsell | `https://d3ks0ngva6go34.cloudfront.net/public/UpsellDcpPreview.webp` |

## Style Presets

EB always persists a `stylePresets` object. Defaults:

```json
{
  "colors": {
    "primaryColor": "#000000",
    "buttonTextColor": "#ffffff",
    "primaryTextColor": "#000000",
    "accentColor": "#eeeeee",
    "backgroundColor": "#ffffff"
  },
  "typography": {
    "primaryFontSize": "16px",
    "primaryFontWeight": "Bold",
    "secondaryFontSize": "14px",
    "secondaryFontWeight": "Bold",
    "bodyFontSize": "14px",
    "bodyFontWeight": "Regular"
  },
  "corners": {
    "buttonBorderRadius": "Base",
    "baseBorderRadiusPx": 5,
    "productCardBaseBorderRadius": 10,
    "productCardBorderRadiusStyle": "Base"
  },
  "images": {
    "productImageFit": "cover"
  },
  "isExpertControlsEnabled": false
}
```

Font weights are stored as labels in `stylePresets`, then normalized for storefront CSS as `Bold -> 700` and `Regular -> 400`.

Corner style behavior:

| Control | EB persisted value | Runtime radius |
| --- | --- | --- |
| Sharp | `Sharp` | `0px` |
| Base | `Base` + base px | `{base}px` |
| Round | `Round` | `40px` |

Product card/cart image radius is derived from card/cart base radius:

```text
imageRadius = radius <= 2 ? 2 : radius - 2
```

This is an exact EB helper rule. A `3px` card/cart base radius produces a `1px` image radius.

## Brand Colors Mapping

When Expert Color Controls are disabled, Brand Colors fan out to many component fields.

| Brand setting | Admin key | Storefront/pageCustomization target fields |
| --- | --- | --- |
| Primary Color | `stylePresets.colors.primaryColor` | `productCard.productCardButtonColor`, `navigationBanner.navigationBannerStepProgressBarFilledColor`, `navigationBanner.tabsActiveBgColor`, `categoryBlock.tabActiveBgColor`, `cartFooter.cartFooterNextButtonColor`, `cartFooter.cartFooterNextButtonBorderColor`, `cartFooter.cartFooterBackButtonBorderColor`, `cartFooter.cartFooterDiscountProgressBarFilledColor`, `generalSettings.bundleUpSellButtonBg`, `generalSettings.bundleUpSellButtonBorderColor`, `summaryBlock.summaryBlockAddToCartButtonColor`, `summaryBlock.summaryBuildNewBoxButtonColor`, `landingPage.landingPageButtonBgColor`, `navigationBanner.navigationBannerStepCompletionColor`, `mixAndMatchConfig.productCard.productCardButtonBgColor`, `mixAndMatchConfig.footer.footerNextBtnBgColor`, `mixAndMatchConfig.tabs.tabsActiveBgColor`, `mixAndMatchConfig.emptyStateCard.emptyStateCardBorderColor`, `mixAndMatchConfig.emptyStateCard.emptyStateCardIconColor`, `mixAndMatchConfig.emptyStateCard.emptyStateCardTextColor`, `mixAndMatchConfig.addBundleBtn.addBundleBtnBgColor`, `mixAndMatchConfig.toast.toastBgColor`, `mixAndMatchConfig.generalSettings.bundleUpsellButtonBg`, `mixAndMatchConfig.footer.footerDiscountProgressBarFilledColor` |
| Button Text Color | `stylePresets.colors.buttonTextColor` | `productCard.productCardButtonTextColor`, `productCard.quantitySelectorButtonTextColor`, `navigationBanner.tabsActiveTextColor`, `categoryBlock.tabActiveTextColor`, `generalSettings.bundleUpsellTextColor`, `summaryBlock.summaryBlockAddToCartButtonTextColor`, `summaryBlock.summaryBuildNewBoxTextColor`, `cartFooter.cartFooterNextButtonTextColor`, `navigationBanner.navigationBannerStepDoneColor`, `mixAndMatchConfig.productCard.productCardButtonTextColor`, `mixAndMatchConfig.footer.footerNextBtnTextColor`, `mixAndMatchConfig.tabs.tabsActiveTextColor`, `mixAndMatchConfig.addBundleBtn.addBundleBtnTextColor`, `mixAndMatchConfig.toast.toastTextColor`, `mixAndMatchConfig.footer.footerTotalPriceAndQuantityPillBgColor`, `mixAndMatchConfig.generalSettings.bundleUpsellButtonTextColor` |
| Primary Text Color | `stylePresets.colors.primaryTextColor` | `productCard.productCardTextColor`, `productCard.finalPriceFontColor`, `navigationBanner.navigationBannerStepTextColor`, `generalSettings.productPageTitleColor`, `navigationBanner.tabsInactiveTextColor`, `categoryBlock.tabInactiveTextColor`, `cartFooter.cartFooterBackButtonTextColor`, `cartFooter.cartFooterDiscountTextColor`, `cartFooter.cartFooterTotalLabelColor`, `cartFooter.cartFooterFinalPriceFontColor`, `cartFooter.cartFooterTextColor`, `generalSettings.bundleUpsellFontColor`, `cartFooter.cartFooterDiscountedPriceColor`, `productCard.compareAtPriceColor`, `mixAndMatchConfig.productCard.productCardTitleColor`, `mixAndMatchConfig.productCard.productCardPriceColor`, `mixAndMatchConfig.productCard.productCardQuantityLabelColor`, `mixAndMatchConfig.productCard.productCardVariantSelectorTextColor`, `mixAndMatchConfig.bundleHeader.headerDiscountTextColor`, `mixAndMatchConfig.footer.footerFinalPriceColor`, `mixAndMatchConfig.footer.footerBackBtnTextColor`, `mixAndMatchConfig.tabs.tabsInactiveTextColor`, `mixAndMatchConfig.footer.footerTextColor`, `mixAndMatchConfig.generalSettings.bundleUpsellFontColor`, `mixAndMatchConfig.productCard.productCardComparedAtPriceColor` |
| Secondary Color | `stylePresets.colors.accentColor` | `navigationBanner.navigationBannerStepProgressBarEmptyColor`, `navigationBanner.tabsInactiveBgColor`, `categoryBlock.tabInactiveBgColor`, `cartFooter.cartFooterDiscountProgressBarEmptyColor`, `productCard.productCardQuantitySelectorBgColor`, `mixAndMatchConfig.tabs.tabsInactiveBgColor`, `mixAndMatchConfig.footer.footerDiscountProgressBarEmptyColor` |
| Product Background Color | `stylePresets.colors.backgroundColor` | `productCard.productCardBgColor`, `cartFooter.cartFooterBgColor`, `cartFooter.cartFooterButtonsContainerBgColor`, `mixAndMatchConfig.emptyStateCard.emptyStateCardBgColor`, `mixAndMatchConfig.footer.footerBgColor`, `mixAndMatchConfig.productCard.productCardBgColor` |

## Typography Mapping

| Setting | Storefront/pageCustomization target fields |
| --- | --- |
| Primary Font Size | `productCard.productTitleFontSize`, `navigationBanner.navigationBannerStepFontSize`, `productCard.finalPriceFontSize`, `mixAndMatchConfig.productCard.productCardTitleFont`, `mixAndMatchConfig.productCard.productCardPriceFont`, `mixAndMatchConfig.bundleHeader.headerConditionTextFont` |
| Primary Font Weight | `productCard.productTitleFontWeight`, `productCard.finalPriceFontWeight`, `mixAndMatchConfig.productCard.productCardTitleWeight`, `mixAndMatchConfig.productCard.productCardPriceWeight` |
| Secondary Font Size | `productCard.compareAtPriceFontSize`, `cartFooter.cartFooterDiscountMessageFontSize`, `mixAndMatchConfig.productCard.productCardComparedAtPriceFont`, `mixAndMatchConfig.bundleHeader.headerDiscountTextFont` |
| Secondary Font Weight | `productCard.compareAtPriceFontWeight`, `cartFooter.cartFooterDiscountMessageFontWeight`, `mixAndMatchConfig.productCard.productCardComparedAtPriceWeight`, `mixAndMatchConfig.bundleHeader.headerDiscountTextWeight` |
| Body Font Size | `productCard.productCardVariantSelectorFontSize`, `mixAndMatchConfig.productCard.productCardVariantSelectorFontSize` |
| Body Font Weight | `productCard.productCardVariantSelectorFontWeight`, `mixAndMatchConfig.productCard.productCardVariantSelectorFontWeight` |

PPB `PDP_INPAGE` templates reduce the consolidated font-size variables by `2px`:

```css
body[gbb-mix-consolidated-design="true"][gbbmix-template-type="PDP_INPAGE"] {
  --gbbMix-primary-font-size: calc(var(--product-card-title-font, 16px) - 2px);
  --gbbMix-secondary-font-size: calc(var(--header-discount-text-font, 14px) - 2px);
  --gbbMix-body-font-size: calc(var(--product-card-variant-selector-font-size, 14px) - 2px);
}
```

## Corners And Images Mapping

| Setting | Storefront/pageCustomization target fields |
| --- | --- |
| Bundle Buttons Corner Style + Base | `productCard.buttonBorderRadius`, `productCard.quantitySelectorButtonBorderRadius`, `cartFooter.cartFooterButtonsBorderRadius`, `navigationBanner.tabsCornerRadius`, `mixAndMatchConfig.productCard.productCardButtonBorderRadius`, `mixAndMatchConfig.productCard.productCardQuantityButtonBorderRadius`, `mixAndMatchConfig.footer.footerButtonsBorderRadius`, `mixAndMatchConfig.addBundleBtn.addBundleBtnBorderRadius`, `mixAndMatchConfig.tabs.tabsBorderRadius` |
| Product Card & Cart Corner Style + Base | `productCard.cardBorderRadius`, `cartFooter.cartFooterBorderRadius`, `mixAndMatchConfig.productCard.productCardBorderRadius`, `mixAndMatchConfig.footer.footerBorderRadius`; derived image radii at `productCard.cardImageBorderRadius`, `cartFooter.cartFooterProductImageBorderRadius`, `mixAndMatchConfig.productCard.productCardImageBorderRadius` |
| Image Fit | `productCard.productImageFit`, `mixAndMatchConfig.productCard.productCardImageFit` |

## Expert Controls Mapping

When Expert Color Controls are enabled, EB keeps Brand Colors in `stylePresets` but lets specific expert fields override component fields.

| Expert scope | UI setting | Storefront/pageCustomization field |
| --- | --- | --- |
| General | Completed step color | `navigationBanner.navigationBannerStepCompletionColor` |
| General | Check Mark Color | `navigationBanner.navigationCheckColor` |
| General | Step Text Color | `navigationBanner.navigationBannerStepTextColor` |
| General | Product Page Title Color | `generalSettings.productPageTitleColor` |
| General | Step Progress Bar Empty Color | `navigationBanner.navigationBannerStepProgressBarEmptyColor` |
| General | Loading Screen Background Color | `generalSettings.loadingBgColor` |
| General | Condition Toast Background Color | `generalSettings.conditionToastBgColor`, `mixAndMatchConfig.toast.toastBgColor` |
| General | Condition Toast Text Color | `generalSettings.conditionToastTextColor`, `mixAndMatchConfig.toast.toastTextColor` |
| Categories | Active Tab Background Color | `navigationBanner.tabsActiveBgColor`, `categoryBlock.tabActiveBgColor`, `mixAndMatchConfig.tabs.tabsActiveBgColor` |
| Categories | Active Tab Text Color | `navigationBanner.tabsActiveTextColor`, `categoryBlock.tabActiveTextColor`, `mixAndMatchConfig.tabs.tabsActiveTextColor` |
| Categories | Inactive Tab Background Color | `navigationBanner.tabsInactiveBgColor`, `categoryBlock.tabInactiveBgColor`, `mixAndMatchConfig.tabs.tabsInactiveBgColor` |
| Categories | Inactive Tab Text Color | `navigationBanner.tabsInactiveTextColor`, `categoryBlock.tabInactiveTextColor`, `mixAndMatchConfig.tabs.tabsInactiveTextColor` |
| Product Card | Background Color | `productCard.productCardBgColor`, `mixAndMatchConfig.productCard.productCardBgColor` |
| Product Card | Product Title Text Color | `productCard.productCardTextColor`, `mixAndMatchConfig.productCard.productCardTitleColor` |
| Product Card | Add Product Button Color | `productCard.productCardButtonColor`, `mixAndMatchConfig.productCard.productCardButtonBgColor` |
| Product Card | Add Product Button Text Color | `productCard.productCardButtonTextColor`, `mixAndMatchConfig.productCard.productCardButtonTextColor` |
| Product Card | Empty State Border Color | `mixAndMatchConfig.emptyStateCard.emptyStateCardBorderColor`, `mixAndMatchConfig.emptyStateCard.emptyStateCardIconColor` |
| Product Card | Empty State Text Color | `mixAndMatchConfig.emptyStateCard.emptyStateCardTextColor` |
| Bundle Cart | Cart Background Color | `cartFooter.cartFooterBgColor`, `mixAndMatchConfig.footer.footerBgColor` |
| Bundle Cart | Cart Text Color | `cartFooter.cartFooterTextColor`, `mixAndMatchConfig.footer.footerTextColor` |
| Bundle Cart | Next Button Color | `cartFooter.cartFooterNextButtonColor`, `cartFooter.cartFooterNextButtonBorderColor`, `mixAndMatchConfig.footer.footerNextBtnBgColor` |
| Bundle Cart | Next Button Text Color | `cartFooter.cartFooterNextButtonTextColor`, `mixAndMatchConfig.footer.footerNextBtnTextColor` |
| Bundle Cart | Back Button Color | `cartFooter.cartFooterBackButtonColor` |
| Bundle Cart | Back Button Text Color | `cartFooter.cartFooterBackButtonTextColor`, `mixAndMatchConfig.footer.footerBackBtnTextColor` |
| Bundle Cart | Discount Text Color | `cartFooter.cartFooterDiscountTextColor`, `mixAndMatchConfig.bundleHeader.headerDiscountTextColor` |
| Bundle Cart | Discount Progress Bar Empty Color | `cartFooter.cartFooterDiscountProgressBarEmptyColor`, `mixAndMatchConfig.footer.footerDiscountProgressBarEmptyColor` |
| Bundle Cart | Discount Progress Bar Filled Color | `cartFooter.cartFooterDiscountProgressBarFilledColor`, `mixAndMatchConfig.footer.footerDiscountProgressBarFilledColor` |
| Upsell | Upsell Button Color | `generalSettings.bundleUpSellButtonBg`, `generalSettings.bundleUpSellButtonBorderColor`, `mixAndMatchConfig.generalSettings.bundleUpsellButtonBg` |
| Upsell | Upsell Button Text Color | `generalSettings.bundleUpsellTextColor`, `mixAndMatchConfig.generalSettings.bundleUpsellButtonTextColor` |
| Upsell | Upsell Widget Body Text Color | `generalSettings.bundleUpsellFontColor`, `mixAndMatchConfig.generalSettings.bundleUpsellFontColor` |

## PPB CSS Variable Bridge

EB exposes PPB design values as direct CSS custom properties and then bridges them into widget-internal `--gbbMix-*` variables when consolidated design is enabled.

Important direct variables:

```text
--product-card-bg-color
--product-card-border-radius
--product-card-image-border-radius
--product-card-image-fit
--product-card-title-color
--product-card-title-font
--product-card-title-weight
--product-card-price-color
--product-card-button-bg-color
--product-card-button-text-color
--product-card-button-border-radius
--product-card-variant-selector-font-size
--tabs-active-bg-color
--tabs-active-text-color
--tabs-inactive-bg-color
--tabs-inactive-text-color
--tabs-border-radius
--footer-bg-color
--footer-text-color
--footer-next-btn-bg-color
--footer-next-btn-text-color
--footer-back-btn-bg-color
--footer-back-btn-text-color
--empty-state-card-bg-color
--empty-state-card-border-color
--empty-state-card-text-color
--footer-discount-progress-bar-empty-color
--footer-discount-progress-bar-filled-color
```

Important bridged variables:

```text
--gbbMix-primary-color
--gbbMix-primary-button-text-color
--gbbMix-primary-text-color
--gbbMix-secondary-color
--gbbMix-cart-bg-color
--gbbMix-cart-text-color
--gbbMix-button-border-radius
--gbbMix-card-border-radius
--gbbMix-primary-font-size
--gbbMix-primary-font-weight
--gbbMix-secondary-font-size
--gbbMix-body-font-size
--gbbMix-image-fit
```

## Wolfpack Implementation Target

Wolfpack has separate `DesignSettings` rows for `product_page` and `full_page`, while EB uses one store-level pageCustomization document. For parity, a Settings -> Design save should write the same EB-style runtime data into both rows. This keeps the existing DB schema but matches EB propagation behavior for both FPB and PPB storefronts.

The mapper must preserve:

- `stylePresets` with colors, typography, corners, images, and expert toggle.
- Full brand-color fan-out when Expert Color Controls are disabled.
- Expert field overrides when Expert Color Controls are enabled.
- PPB appearance/settings fields needed by `window.gbbMix.settings.pageCustomizationSettings`.
- CSS aliases for EB PPB variables alongside the existing `--bundle-*` variables.
