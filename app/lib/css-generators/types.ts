/**
 * CSS Generators Types
 *
 * Type definitions for CSS generation from design settings.
 */

/**
 * Design settings interface for CSS generation.
 * This is a flexible type that accepts any settings object.
 */
export interface CSSDesignSettings {
  // Global Colors
  globalPrimaryButtonColor?: string;
  globalButtonTextColor?: string;
  globalPrimaryTextColor?: string;
  globalSecondaryTextColor?: string;
  globalFooterBgColor?: string;
  globalFooterTextColor?: string;

  // Product Card
  productCardBgColor?: string;
  productCardFontColor?: string;
  productCardFontSize?: number;
  productCardFontWeight?: number;
  productCardImageFit?: string;
  productCardsPerRow?: number;
  productPriceBgColor?: string;
  productStrikePriceColor?: string;
  productStrikeFontSize?: number;
  productStrikeFontWeight?: number;
  productFinalPriceColor?: string;
  productFinalPriceFontSize?: number;
  productFinalPriceFontWeight?: number;

  // Product Card Layout & Dimensions
  productCardWidth?: number;
  productCardHeight?: number;
  productCardSpacing?: number;
  productCardBorderRadius?: number;
  productCardPadding?: number;
  productCardBorderWidth?: number;
  productCardBorderColor?: string;
  productCardShadow?: string;
  productCardHoverShadow?: string;
  productCardMargin?: number;

  // Product Image
  productImageHeight?: number;
  productImageBorderRadius?: number;
  productImageBgColor?: string;

  // Button
  buttonBgColor?: string;
  buttonTextColor?: string;
  buttonFontSize?: number;
  buttonFontWeight?: number;
  buttonBorderRadius?: number;
  buttonHoverBgColor?: string;
  buttonAddToCartText?: string;

  // Variant Selector
  variantSelectorBgColor?: string;
  variantSelectorTextColor?: string;
  variantSelectorBorderRadius?: number;

  // Quantity Selector
  quantitySelectorBgColor?: string;
  quantitySelectorTextColor?: string;
  quantitySelectorFontSize?: number;
  quantitySelectorBorderRadius?: number;

  // Modal
  modalBgColor?: string;
  modalBorderRadius?: number;
  modalTitleFontSize?: number;
  modalTitleFontWeight?: number;
  modalPriceFontSize?: number;
  modalVariantBorderRadius?: number;
  modalButtonBgColor?: string;
  modalButtonTextColor?: string;
  modalButtonBorderRadius?: number;
  modalStepTitleColor?: string;

  // Promo Banner
  promoBannerEnabled?: boolean;
  promoBannerBgColor?: string;
  promoBannerTitleColor?: string;
  promoBannerTitleFontSize?: number;
  promoBannerTitleFontWeight?: number;
  promoBannerSubtitleColor?: string;
  promoBannerSubtitleFontSize?: number;
  promoBannerNoteColor?: string;
  promoBannerNoteFontSize?: number;
  promoBannerBorderRadius?: number;
  promoBannerPadding?: number;

  // Footer
  footerBgColor?: string;
  footerTotalBgColor?: string;
  footerBorderRadius?: number;
  footerPadding?: number;
  footerFinalPriceColor?: string;
  footerFinalPriceFontSize?: number;
  footerFinalPriceFontWeight?: number;
  footerStrikePriceColor?: string;
  footerStrikeFontSize?: number;
  footerStrikeFontWeight?: number;
  footerPriceVisibility?: boolean;
  footerBackButtonBgColor?: string;
  footerBackButtonTextColor?: string;
  footerBackButtonBorderColor?: string;
  footerBackButtonBorderRadius?: number;
  footerNextButtonBgColor?: string;
  footerNextButtonTextColor?: string;
  footerNextButtonBorderColor?: string;
  footerNextButtonBorderRadius?: number;
  footerDiscountTextVisibility?: boolean;
  footerScrollBarColor?: string;
  sidebarCardBgColor?: string;
  sidebarCardTextColor?: string;
  sidebarCardBorderColor?: string;
  sidebarCardBorderWidth?: number;
  sidebarCardBorderRadius?: number;
  sidebarCardPadding?: number;
  sidebarCardWidth?: number;
  sidebarStickyOffset?: number;
  sidebarProductListMaxHeight?: number;
  sidebarSkeletonRowCount?: number;
  sidebarDiscountBgColor?: string;
  sidebarDiscountTextColor?: string;
  sidebarButtonBgColor?: string;
  sidebarButtonTextColor?: string;
  sidebarButtonBorderRadius?: number;

  // Success Message
  successMessageFontSize?: number;
  successMessageFontWeight?: number;
  successMessageTextColor?: string;
  successMessageBgColor?: string;

  // Header Tabs
  headerTabActiveBgColor?: string;
  headerTabActiveTextColor?: string;
  headerTabInactiveBgColor?: string;
  headerTabInactiveTextColor?: string;
  headerTabRadius?: number;

  // Step Bar
  stepNameFontColor?: string;
  stepNameFontSize?: number;
  completedStepCheckMarkColor?: string;
  completedStepBgColor?: string;
  completedStepCircleBorderColor?: string;
  completedStepCircleBorderRadius?: number;
  incompleteStepBgColor?: string;
  incompleteStepCircleStrokeColor?: string;
  incompleteStepCircleStrokeRadius?: number;
  stepBarProgressFilledColor?: string;
  stepBarProgressEmptyColor?: string;

  // Tabs
  tabsActiveBgColor?: string;
  tabsActiveTextColor?: string;
  tabsInactiveBgColor?: string;
  tabsInactiveTextColor?: string;
  tabsBorderColor?: string;
  tabsBorderRadius?: number;

  // General
  emptyStateCardBgColor?: string;
  emptyStateCardBorderColor?: string;
  emptyStateTextColor?: string;
  emptyStateBorderStyle?: string;
  drawerBgColor?: string;
  addToCartButtonBgColor?: string;
  addToCartButtonTextColor?: string;
  addToCartButtonBorderRadius?: number;
  discountPillBgColor?: string;
  discountPillTextColor?: string;
  discountPillFontSize?: number;
  discountPillFontWeight?: number;
  discountPillBorderRadius?: number;
  toastBgColor?: string;
  toastTextColor?: string;
  bundleBgColor?: string;
  productPageTitleFontColor?: string;
  productPageTitleFontSize?: number;
  bundleUpsellButtonBgColor?: string;
  bundleUpsellBorderColor?: string;
  bundleUpsellTextColor?: string;
  filterIconColor?: string;
  filterBgColor?: string;
  filterTextColor?: string;
  conditionsTextColor?: string;
  conditionsTextFontSize?: number;
  discountTextColor?: string;
  discountTextFontSize?: number;

  // Full-Page Specific
  fullPageBgColor?: string;
  fullPageFooterBgColor?: string;
  fullPageFooterBorderColor?: string;
  stepTimelineCircleSize?: number;
  stepTimelineCircleBg?: string;
  stepTimelineCircleBorder?: string;
  stepTimelineCircleBorderWidth?: number;
  stepTimelineCircleTextColor?: string;
  stepTimelineCircleFontSize?: number;
  stepTimelineCompletedBg?: string;
  stepTimelineCompletedText?: string;
  stepTimelineLockedBorder?: string;
  stepTimelineLockedText?: string;
  stepTimelineLineColor?: string;
  stepTimelineLineCompleted?: string;
  stepTimelineLineWidth?: number;
  stepTimelineLineHeight?: number;
  stepTimelineGap?: number;
  stepTimelineNameFontSize?: number;
  stepTimelineNameColor?: string;
  stepTimelineActiveColor?: string;
  stepTimelineInactiveColor?: string;
  stepTimelineCompleteColor?: string;
  addBtnColor?: string;
  addBtnRadius?: number;
  discountBannerBg?: string;
  discountBannerText?: string;
  fullPageTitleFontSize?: number;
  fullPageTitleColor?: string;
  fullPageInstructionFontSize?: number;
  fullPageInstructionColor?: string;
  categoryTabIndicatorSize?: number;
  categoryTabLabelFontSize?: number;
  categoryTabLabelColor?: string;
  categoryTabActiveUnderlineWidth?: number;
  categoryTabActiveUnderlineHeight?: number;
  categoryTabActiveUnderlineColor?: string;
  fullPageProductGridColumns?: number;
  fullPageProductImageHeight?: number;
  fullPageProductImageBg?: string;
  fullPageProductImageBorderRadius?: number;
  fullPageProductImageBorderColor?: string;
  fullPageSelectedBadgeBg?: string;
  fullPageSelectedBadgeColor?: string;
  fullPagePriceRowGradientStart?: string;
  fullPagePriceRowGradientEnd?: string;
  fullPagePriceRowBorder?: string;
  fullPageVariantBorder?: string;
  fullPageVariantBorderHover?: string;
  fullPageAddedButtonGradientStart?: string;
  fullPageAddedButtonGradientEnd?: string;
  fullPageFooterHeaderFontSize?: number;
  fullPageFooterHeaderColor?: string;
  fullPageFooterScrollbarColor?: string;
  fullPageFooterProductBg?: string;
  fullPageFooterProductBorder?: string;
  fullPageFooterProductBorderRadius?: number;
  fullPageFooterQuantityBadgeBg?: string;
  fullPageFooterQuantityBadgeColor?: string;
  fullPageFooterProductTitleColor?: string;
  fullPageFooterProductPriceColor?: string;
  fullPageFooterRemoveColor?: string;
  fullPageFooterTotalLabelColor?: string;
  fullPageFooterTotalLabelFontSize?: number;
  fullPageFooterTotalPriceColor?: string;
  fullPageFooterTotalPriceFontSize?: number;
  fullPageFooterBackBtnBg?: string;
  fullPageFooterBackBtnColor?: string;
  fullPageFooterBackBtnHover?: string;
  fullPageFooterNextBtnBg?: string;
  fullPageFooterNextBtnColor?: string;
  fullPageFooterNextBtnHover?: string;
  fullPageFooterNavBtnFontSize?: number;
  fullPageFooterNavBtnRadius?: number;
  fullPageFooterNoSelectionsColor?: string;
  fullPageLoadingSpinnerBorder?: string;
  fullPageLoadingSpinnerActive?: string;

  // Allow additional properties
  [key: string]: any;
}

/**
 * CSS generation context with resolved global colors
 */
export interface CSSGenerationContext {
  settings: CSSDesignSettings;
  globalPrimaryButton: string;
  globalButtonText: string;
  globalPrimaryText: string;
  globalSecondaryText: string;
  globalFooterBg: string;
  globalFooterText: string;
  bundleType: string;
  customCss: string;
}
