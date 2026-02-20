/**
 * Default Design Settings for Bundle Widget
 *
 * These settings define the default appearance for both product_page and full_page bundle types.
 * Each setting key maps to a specific visual property in the bundle widget.
 */

import type { DesignSettings } from "../../../types/state.types";

/**
 * Default settings for product_page bundle type
 * A more minimal, neutral design that integrates well with existing product pages
 */
export const PRODUCT_PAGE_DEFAULTS: DesignSettings = {
  // Global Colors
  globalPrimaryButtonColor: "#000000",
  globalButtonTextColor: "#FFFFFF",
  globalPrimaryTextColor: "#000000",
  globalSecondaryTextColor: "#6B7280",
  globalFooterBgColor: "#FFFFFF",
  globalFooterTextColor: "#000000",

  // Product Card - Basic
  productCardBgColor: "#FFFFFF",
  productCardFontColor: "#000000",
  productCardFontSize: 20,
  productCardFontWeight: 600,
  productCardImageFit: "cover",
  productCardsPerRow: 3,
  productTitleVisibility: true,
  productPriceVisibility: true,
  productPriceBgColor: "#F0F8F0",

  // Product Card - Typography
  productStrikePriceColor: "#8D8D8D",
  productStrikeFontSize: 14,
  productStrikeFontWeight: 400,
  productFinalPriceColor: "#000000",
  productFinalPriceFontSize: 18,
  productFinalPriceFontWeight: 700,

  // Button
  buttonBgColor: "#FF9000",
  buttonTextColor: "#FFFFFF",
  buttonFontSize: 16,
  buttonFontWeight: 600,
  buttonBorderRadius: 8,
  buttonHoverBgColor: "#E68200",
  buttonAddToCartText: "Add to bundle",

  // Quantity Selector
  quantitySelectorBgColor: "#5f5d5d",
  quantitySelectorTextColor: "#FFFFFF",
  quantitySelectorFontSize: 16,
  quantitySelectorBorderRadius: 8,

  // Variant Selector
  variantSelectorBgColor: "#FFFFFF",
  variantSelectorTextColor: "#000000",
  variantSelectorBorderRadius: 8,

  // Bundle Footer
  footerBgColor: "#FFFFFF",
  footerTotalBgColor: "#F6F6F6",
  footerBorderRadius: 8,
  footerPadding: 16,

  // Bundle Header - Tabs
  headerTabActiveBgColor: "#000000",
  headerTabActiveTextColor: "#FFFFFF",
  headerTabInactiveBgColor: "#FFFFFF",
  headerTabInactiveTextColor: "#000000",
  headerTabRadius: 67,

  // Bundle Header - Header Text
  conditionsTextColor: "#FFFFFF",
  conditionsTextFontSize: 16,
  discountTextColor: "#000000",
  discountTextFontSize: 14,

  // Footer Price
  footerFinalPriceColor: "#000000",
  footerFinalPriceFontSize: 18,
  footerFinalPriceFontWeight: 700,
  footerStrikePriceColor: "#8D8D8D",
  footerStrikeFontSize: 14,
  footerStrikeFontWeight: 400,
  footerPriceVisibility: true,

  // Footer Buttons
  footerBackButtonBgColor: "#FFFFFF",
  footerBackButtonTextColor: "#000000",
  footerBackButtonBorderColor: "#E3E3E3",
  footerBackButtonBorderRadius: 8,
  footerNextButtonBgColor: "#000000",
  footerNextButtonTextColor: "#FFFFFF",
  footerNextButtonBorderColor: "#000000",
  footerNextButtonBorderRadius: 8,

  // Discount & Progress Bar
  footerDiscountTextVisibility: true,
  footerProgressBarFilledColor: "#000000",
  footerProgressBarEmptyColor: "#E3E3E3",

  // Success Message Styling
  successMessageFontSize: 16,
  successMessageFontWeight: 600,
  successMessageTextColor: "#065F46",
  successMessageBgColor: "#D1FAE5",

  // Bundle Step Bar - Step Name
  stepNameFontColor: "#000000",
  stepNameFontSize: 16,

  // Completed Step
  completedStepCheckMarkColor: "#FFFFFF",
  completedStepBgColor: "#000000",
  completedStepCircleBorderColor: "#000000",
  completedStepCircleBorderRadius: 50,

  // Incomplete Step
  incompleteStepBgColor: "#FFFFFF",
  incompleteStepCircleStrokeColor: "#000000",
  incompleteStepCircleStrokeRadius: 50,

  // Step Bar Progress Bar
  stepBarProgressFilledColor: "#000000",
  stepBarProgressEmptyColor: "#C6C6C6",

  // Tabs
  tabsActiveBgColor: "#000000",
  tabsActiveTextColor: "#FFFFFF",
  tabsInactiveBgColor: "#FFFFFF",
  tabsInactiveTextColor: "#000000",
  tabsBorderColor: "#000000",
  tabsBorderRadius: 8,

  // Empty State
  emptyStateCardBgColor: "#FFFFFF",
  emptyStateCardBorderColor: "#F6F6F6",
  emptyStateTextColor: "#9CA3AF",
  emptyStateBorderStyle: "dashed",

  // Drawer
  drawerBgColor: "#FFFFFF",

  // Add to Cart Button
  addToCartButtonBgColor: "#000000",
  addToCartButtonTextColor: "#FFFFFF",
  addToCartButtonBorderRadius: 67,

  // Discount Pill (on Add to Cart button)
  discountPillBgColor: "#22C55E",
  discountPillTextColor: "#FFFFFF",
  discountPillFontSize: 12,
  discountPillFontWeight: 600,
  discountPillBorderRadius: 20,

  // Toasts
  toastBgColor: "#000000",
  toastTextColor: "#FFFFFF",

  // Bundle Design
  bundleBgColor: "#FFFFFF",
  footerScrollBarColor: "#000000",

  // Product Page Title
  productPageTitleFontColor: "#000000",
  productPageTitleFontSize: 24,

  // Bundle Upsell
  bundleUpsellButtonBgColor: "#000000",
  bundleUpsellBorderColor: "#000000",
  bundleUpsellTextColor: "#FFFFFF",

  // Filters
  filterIconColor: "#000000",
  filterBgColor: "#FFFFFF",
  filterTextColor: "#000000",

  // Product Card Layout & Dimensions
  productCardWidth: 280,
  productCardHeight: 420,
  productCardSpacing: 20,
  productCardBorderRadius: 8,
  productCardPadding: 0,
  productCardMargin: 0,
  productCardBorderWidth: 1,
  productCardBorderColor: "#E5E7EB",
  productCardShadow: "0 2px 8px rgba(0,0,0,0.04)",
  productCardHoverShadow: "0 8px 24px rgba(0,0,0,0.12)",

  // Product Image
  productImageHeight: 280,
  productImageBorderRadius: 6,
  productImageBgColor: "#F8F8F8",

  // Product Modal Styling
  modalBgColor: "#FFFFFF",
  modalBorderRadius: 12,
  modalTitleFontSize: 28,
  modalTitleFontWeight: 700,
  modalPriceFontSize: 22,
  modalVariantBorderRadius: 8,
  modalButtonBgColor: "#000000",
  modalButtonTextColor: "#FFFFFF",
  modalButtonBorderRadius: 8,

  // Promo Banner (disabled for product page by default)
  promoBannerEnabled: false,
  promoBannerBgColor: "#F3F4F6",
  promoBannerBgImage: null,
  promoBannerTitleColor: "#111827",
  promoBannerTitleFontSize: 24,
  promoBannerTitleFontWeight: 700,
  promoBannerSubtitleColor: "#6B7280",
  promoBannerSubtitleFontSize: 14,
  promoBannerNoteColor: "#9CA3AF",
  promoBannerNoteFontSize: 12,
  promoBannerBorderRadius: 12,
  promoBannerPadding: 24,

  // Custom CSS (empty by default)
  customCss: "",
};

/**
 * Default settings for full_page bundle type
 * A more vibrant, branded design with purple accents for standalone bundle pages
 */
export const FULL_PAGE_DEFAULTS: DesignSettings = {
  // Global Colors
  globalPrimaryButtonColor: "#7132FF",
  globalButtonTextColor: "#FFFFFF",
  globalPrimaryTextColor: "#111827",
  globalSecondaryTextColor: "#9CA3AF",
  globalFooterBgColor: "#F9FAFB",
  globalFooterTextColor: "#111827",

  // Product Card - Basic
  productCardBgColor: "#F9FAFB",
  productCardFontColor: "#111827",
  productCardFontSize: 20,
  productCardFontWeight: 600,
  productCardImageFit: "contain",
  productCardsPerRow: 4,
  productTitleVisibility: true,
  productPriceVisibility: true,
  productPriceBgColor: "#F9FAFB",

  // Product Card - Typography
  productStrikePriceColor: "#9CA3AF",
  productStrikeFontSize: 16,
  productStrikeFontWeight: 400,
  productFinalPriceColor: "#111827",
  productFinalPriceFontSize: 20,
  productFinalPriceFontWeight: 700,

  // Button
  buttonBgColor: "#FF9000",
  buttonTextColor: "#FFFFFF",
  buttonFontSize: 18,
  buttonFontWeight: 700,
  buttonBorderRadius: 12,
  buttonHoverBgColor: "#E68200",
  buttonAddToCartText: "Add to bundle",

  // Quantity Selector
  quantitySelectorBgColor: "#5f5d5d",
  quantitySelectorTextColor: "#FFFFFF",
  quantitySelectorFontSize: 18,
  quantitySelectorBorderRadius: 12,

  // Variant Selector
  variantSelectorBgColor: "#FFFFFF",
  variantSelectorTextColor: "#111827",
  variantSelectorBorderRadius: 12,

  // Bundle Footer
  footerBgColor: "#FFFFFF",
  footerTotalBgColor: "#F9FAFB",
  footerBorderRadius: 12,
  footerPadding: 20,

  // Bundle Header - Tabs
  headerTabActiveBgColor: "#000000",
  headerTabActiveTextColor: "#FFFFFF",
  headerTabInactiveBgColor: "#FFFFFF",
  headerTabInactiveTextColor: "#000000",
  headerTabRadius: 67,

  // Bundle Header - Header Text
  conditionsTextColor: "#FFFFFF",
  conditionsTextFontSize: 16,
  discountTextColor: "#111827",
  discountTextFontSize: 14,

  // Footer Price
  footerFinalPriceColor: "#111827",
  footerFinalPriceFontSize: 20,
  footerFinalPriceFontWeight: 700,
  footerStrikePriceColor: "#9CA3AF",
  footerStrikeFontSize: 16,
  footerStrikeFontWeight: 400,
  footerPriceVisibility: true,

  // Footer Buttons
  footerBackButtonBgColor: "#FFFFFF",
  footerBackButtonTextColor: "#111827",
  footerBackButtonBorderColor: "#E5E7EB",
  footerBackButtonBorderRadius: 12,
  footerNextButtonBgColor: "#7132FF",
  footerNextButtonTextColor: "#FFFFFF",
  footerNextButtonBorderColor: "#7132FF",
  footerNextButtonBorderRadius: 12,

  // Discount & Progress Bar
  footerDiscountTextVisibility: true,
  footerProgressBarFilledColor: "#7132FF",
  footerProgressBarEmptyColor: "#E5E7EB",

  // Success Message Styling
  successMessageFontSize: 16,
  successMessageFontWeight: 600,
  successMessageTextColor: "#065F46",
  successMessageBgColor: "#D1FAE5",

  // Bundle Step Bar - Step Name
  stepNameFontColor: "#111827",
  stepNameFontSize: 18,

  // Completed Step
  completedStepCheckMarkColor: "#FFFFFF",
  completedStepBgColor: "#7132FF",
  completedStepCircleBorderColor: "#7132FF",
  completedStepCircleBorderRadius: 50,

  // Incomplete Step
  incompleteStepBgColor: "#F9FAFB",
  incompleteStepCircleStrokeColor: "#9CA3AF",
  incompleteStepCircleStrokeRadius: 50,

  // Step Bar Progress Bar
  stepBarProgressFilledColor: "#7132FF",
  stepBarProgressEmptyColor: "#E5E7EB",

  // Tabs
  tabsActiveBgColor: "#7132FF",
  tabsActiveTextColor: "#FFFFFF",
  tabsInactiveBgColor: "#F9FAFB",
  tabsInactiveTextColor: "#111827",
  tabsBorderColor: "#E5E7EB",
  tabsBorderRadius: 12,

  // Empty State
  emptyStateCardBgColor: "#F9FAFB",
  emptyStateCardBorderColor: "#E5E7EB",
  emptyStateTextColor: "#9CA3AF",
  emptyStateBorderStyle: "dashed",

  // Drawer
  drawerBgColor: "#F9FAFB",

  // Add to Cart Button
  addToCartButtonBgColor: "#7132FF",
  addToCartButtonTextColor: "#FFFFFF",
  addToCartButtonBorderRadius: 67,

  // Discount Pill (on Add to Cart button)
  discountPillBgColor: "#22C55E",
  discountPillTextColor: "#FFFFFF",
  discountPillFontSize: 12,
  discountPillFontWeight: 600,
  discountPillBorderRadius: 20,

  // Toasts
  toastBgColor: "#7132FF",
  toastTextColor: "#FFFFFF",

  // Bundle Design
  bundleBgColor: "#F9FAFB",
  footerScrollBarColor: "#7132FF",

  // Product Page Title
  productPageTitleFontColor: "#111827",
  productPageTitleFontSize: 28,

  // Bundle Upsell
  bundleUpsellButtonBgColor: "#7132FF",
  bundleUpsellBorderColor: "#7132FF",
  bundleUpsellTextColor: "#FFFFFF",

  // Filters
  filterIconColor: "#111827",
  filterBgColor: "#F9FAFB",
  filterTextColor: "#111827",

  // Product Card Layout & Dimensions
  productCardWidth: 280,
  productCardHeight: 420,
  productCardSpacing: 20,
  productCardBorderRadius: 8,
  productCardPadding: 0,
  productCardMargin: 0,
  productCardBorderWidth: 1,
  productCardBorderColor: "#E5E7EB",
  productCardShadow: "0 2px 8px rgba(0,0,0,0.04)",
  productCardHoverShadow: "0 8px 24px rgba(0,0,0,0.12)",

  // Product Image
  productImageHeight: 280,
  productImageBorderRadius: 6,
  productImageBgColor: "#F8F8F8",

  // Product Modal Styling
  modalBgColor: "#FFFFFF",
  modalBorderRadius: 12,
  modalTitleFontSize: 28,
  modalTitleFontWeight: 700,
  modalPriceFontSize: 22,
  modalVariantBorderRadius: 8,
  modalButtonBgColor: "#000000",
  modalButtonTextColor: "#FFFFFF",
  modalButtonBorderRadius: 8,

  // Promo Banner (enabled for full-page bundles with light-gray background)
  promoBannerEnabled: true,
  promoBannerBgColor: "#F3F4F6",
  promoBannerBgImage: null,
  promoBannerTitleColor: "#111827",
  promoBannerTitleFontSize: 28,
  promoBannerTitleFontWeight: 700,
  promoBannerSubtitleColor: "#6B7280",
  promoBannerSubtitleFontSize: 16,
  promoBannerNoteColor: "#9CA3AF",
  promoBannerNoteFontSize: 14,
  promoBannerBorderRadius: 16,
  promoBannerPadding: 32,

  // Custom CSS (empty by default)
  customCss: "",
};

/**
 * Combined default settings object for both bundle types
 */
export const DEFAULT_SETTINGS = {
  product_page: PRODUCT_PAGE_DEFAULTS,
  full_page: FULL_PAGE_DEFAULTS,
} as const;

/**
 * Type for bundle types
 */
export type BundleType = keyof typeof DEFAULT_SETTINGS;

/**
 * Get default settings for a specific bundle type
 */
export function getDefaultSettings(bundleType: BundleType): DesignSettings {
  return DEFAULT_SETTINGS[bundleType];
}
