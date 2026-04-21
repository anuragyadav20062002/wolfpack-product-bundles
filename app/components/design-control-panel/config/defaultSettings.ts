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
  productCardsPerRow: 4,
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
  buttonAddedBgColor: "#10B981",
  buttonAddedTextColor: "#FFFFFF",

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
  conditionsTextColor: "#000000",
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

  // Discount Text
  footerDiscountTextVisibility: true,

  // Success Message Styling
  successMessageFontSize: 16,
  successMessageFontWeight: 600,
  successMessageTextColor: "#065F46",
  successMessageBgColor: "#D1FAE5",

  // Discount Progress Banner (slim stripe at top of floating footer)
  discountBannerBg: "#1a1a1a",
  discountBannerText: "#ffffff",

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
  toastBorderRadius: 8,
  toastBorderColor: "#FFFFFF",
  toastBorderWidth: 0,
  toastFontSize: 13,
  toastFontWeight: 500,
  toastAnimationDuration: 300,
  toastBoxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  toastEnterFromBottom: false,

  // Bundle Design
  bundleBgColor: "",
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
  productCardSpacing: 12,
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
  promoBannerTitleColor: "#111827",
  promoBannerTitleFontSize: 24,
  promoBannerTitleFontWeight: 700,
  promoBannerSubtitleColor: "#6B7280",
  promoBannerSubtitleFontSize: 14,
  promoBannerNoteColor: "#9CA3AF",
  promoBannerNoteFontSize: 12,
  promoBannerBorderRadius: 12,
  promoBannerPadding: 24,

  // Search Input
  searchInputBgColor: "#F8F8F8",
  searchInputBorderColor: "#E0E0E0",
  searchInputFocusBorderColor: "#5C6AC4",
  searchInputTextColor: "#333333",
  searchInputPlaceholderColor: "#999999",
  searchClearButtonBgColor: "rgba(0,0,0,0.08)",
  searchClearButtonColor: "#666666",

  // Skeleton Loading
  skeletonBaseBgColor: "#F0F0F0",
  skeletonShimmerColor: "#E8E8E8",
  skeletonHighlightColor: "#FFFFFF",

  // Card Hover & Transitions
  productCardHoverTranslateY: 2,
  productCardTransitionDuration: 200,

  // Tile Quantity Badge
  tileQuantityBadgeBgColor: "#000000",
  tileQuantityBadgeTextColor: "#FFFFFF",

  // Modal Close Button
  modalCloseButtonColor: "#777777",
  modalCloseButtonBgColor: "rgba(255,255,255,0.9)",
  modalCloseButtonHoverColor: "#333333",

  // Typography
  buttonTextTransform: "none",
  buttonLetterSpacing: 0,

  // Focus / Accessibility
  focusOutlineColor: "#5C6AC4",
  focusOutlineWidth: 2,

  // Pricing Tier Pills (not shown on product page — use neutral defaults)
  tierPillActiveBgColor: "#111111",
  tierPillActiveTextColor: "#FFFFFF",
  tierPillInactiveBgColor: "#F2FAE6",
  tierPillInactiveTextColor: "#333333",
  tierPillHoverBgColor: "#DCF5D2",
  tierPillBorderColor: "#000000",
  tierPillBorderRadius: 8,
  tierPillHeight: 52,
  tierPillGap: 12,
  tierPillFontSize: 14,
  tierPillFontWeight: 600,

  // Loading overlay
  loadingOverlayBgColor: "rgba(255,255,255,0.85)",
  loadingOverlayTextColor: "#333333",

  // Widget style
  widgetStyle: "bottom-sheet",
  bottomSheetOverlayOpacity: 0.5,
  bottomSheetAnimationDuration: 400,
  emptySlotBorderStyle: "dashed",
  emptySlotBorderColor: "#007AFF",
  freeGiftBadgeUrl: "",

  freeGiftBadgePosition: "top-left",
  includedBadgeUrl: "",
  includedBadgePosition: "top-left",

  // Step Timeline
  stepTimelineCircleSize: 44,
  stepTimelineCircleBg: "#FFFFFF",
  stepTimelineCircleBorder: "#D1D5DB",
  stepTimelineCircleBorderWidth: 2,
  stepTimelineCompletedBg: "#000000",
  stepTimelineCompletedText: "#FFFFFF",
  stepTimelineLineColor: "#E5E7EB",
  stepTimelineLineCompleted: "#000000",
  stepTimelineLineHeight: 2,
  stepTimelineNameFontSize: 11,
  stepTimelineNameColor: "#374151",
  stepTimelineActiveColor: "#000000",
  stepTimelineInactiveColor: "#9CA3AF",
  stepTimelineCompleteColor: "#000000",

  // Custom CSS (empty by default)
  customCss: "",
};

/**
 * Default settings for full_page bundle type
 * Default settings for full-page bundles — theme-agnostic neutral palette
 */
export const FULL_PAGE_DEFAULTS: DesignSettings = {
  // Global Colors
  globalPrimaryButtonColor: "#111111",
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
  buttonAddedBgColor: "#10B981",
  buttonAddedTextColor: "#FFFFFF",

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
  conditionsTextColor: "#000000",
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
  footerNextButtonBgColor: "#111111",
  footerNextButtonTextColor: "#FFFFFF",
  footerNextButtonBorderColor: "#111111",
  footerNextButtonBorderRadius: 12,

  // Discount Text
  footerDiscountTextVisibility: true,

  // Success Message Styling
  successMessageFontSize: 16,
  successMessageFontWeight: 600,
  successMessageTextColor: "#065F46",
  successMessageBgColor: "#D1FAE5",

  // Discount Progress Banner (slim stripe at top of floating footer)
  discountBannerBg: "#1a1a1a",
  discountBannerText: "#ffffff",

  // Bundle Step Bar - Step Name
  stepNameFontColor: "#111827",
  stepNameFontSize: 18,

  // Completed Step
  completedStepCheckMarkColor: "#FFFFFF",
  completedStepBgColor: "#111111",
  completedStepCircleBorderColor: "#111111",
  completedStepCircleBorderRadius: 50,

  // Incomplete Step
  incompleteStepBgColor: "#F9FAFB",
  incompleteStepCircleStrokeColor: "#9CA3AF",
  incompleteStepCircleStrokeRadius: 50,

  // Step Bar Progress Bar
  stepBarProgressFilledColor: "#111111",
  stepBarProgressEmptyColor: "#E5E7EB",

  // Tabs
  tabsActiveBgColor: "#111111",
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
  addToCartButtonBgColor: "#111111",
  addToCartButtonTextColor: "#FFFFFF",
  addToCartButtonBorderRadius: 67,

  // Discount Pill (on Add to Cart button)
  discountPillBgColor: "#22C55E",
  discountPillTextColor: "#FFFFFF",
  discountPillFontSize: 12,
  discountPillFontWeight: 600,
  discountPillBorderRadius: 20,

  // Toasts
  toastBgColor: "#111111",
  toastTextColor: "#FFFFFF",
  toastBorderRadius: 8,
  toastBorderColor: "#FFFFFF",
  toastBorderWidth: 0,
  toastFontSize: 13,
  toastFontWeight: 500,
  toastAnimationDuration: 300,
  toastBoxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  toastEnterFromBottom: false,

  // Bundle Design
  bundleBgColor: "#F9FAFB",
  footerScrollBarColor: "#111111",

  // Product Page Title
  productPageTitleFontColor: "#111827",
  productPageTitleFontSize: 28,

  // Bundle Upsell
  bundleUpsellButtonBgColor: "#111111",
  bundleUpsellBorderColor: "#111111",
  bundleUpsellTextColor: "#FFFFFF",

  // Filters
  filterIconColor: "#111827",
  filterBgColor: "#F9FAFB",
  filterTextColor: "#111827",

  // Product Card Layout & Dimensions
  productCardWidth: 280,
  productCardHeight: 420,
  productCardSpacing: 12,
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
  promoBannerTitleColor: "#111827",
  promoBannerTitleFontSize: 28,
  promoBannerTitleFontWeight: 700,
  promoBannerSubtitleColor: "#6B7280",
  promoBannerSubtitleFontSize: 16,
  promoBannerNoteColor: "#9CA3AF",
  promoBannerNoteFontSize: 14,
  promoBannerBorderRadius: 16,
  promoBannerPadding: 32,

  // Search Input
  searchInputBgColor: "#F8F8F8",
  searchInputBorderColor: "#E0E0E0",
  searchInputFocusBorderColor: "#111111",
  searchInputTextColor: "#333333",
  searchInputPlaceholderColor: "#999999",
  searchClearButtonBgColor: "rgba(0,0,0,0.08)",
  searchClearButtonColor: "#666666",

  // Skeleton Loading
  skeletonBaseBgColor: "#F0F0F0",
  skeletonShimmerColor: "#E8E8E8",
  skeletonHighlightColor: "#FFFFFF",

  // Card Hover & Transitions
  productCardHoverTranslateY: 2,
  productCardTransitionDuration: 200,

  // Tile Quantity Badge
  tileQuantityBadgeBgColor: "#111111",
  tileQuantityBadgeTextColor: "#FFFFFF",

  // Modal Close Button
  modalCloseButtonColor: "#777777",
  modalCloseButtonBgColor: "rgba(255,255,255,0.9)",
  modalCloseButtonHoverColor: "#333333",

  // Typography
  buttonTextTransform: "none",
  buttonLetterSpacing: 0,

  // Focus / Accessibility
  focusOutlineColor: "#000000",
  focusOutlineWidth: 2,

  // Pricing Tier Pills (Full-Page Bundles)
  tierPillActiveBgColor: "#111111",
  tierPillActiveTextColor: "#FFFFFF",
  tierPillInactiveBgColor: "#F2FAE6",
  tierPillInactiveTextColor: "#333333",
  tierPillHoverBgColor: "#DCF5D2",
  tierPillBorderColor: "#000000",
  tierPillBorderRadius: 8,
  tierPillHeight: 52,
  tierPillFontSize: 14,
  tierPillFontWeight: 600,
  tierPillGap: 12,

  // Loading overlay
  loadingOverlayBgColor: "rgba(255,255,255,0.85)",
  loadingOverlayTextColor: "#333333",

  // Widget style
  widgetStyle: "classic",
  bottomSheetOverlayOpacity: 0.5,
  bottomSheetAnimationDuration: 400,
  emptySlotBorderStyle: "dashed",
  emptySlotBorderColor: "#007AFF",
  freeGiftBadgeUrl: "",
  freeGiftBadgePosition: "top-left",
  includedBadgeUrl: "",
  includedBadgePosition: "top-left",

  // Step Timeline
  stepTimelineCircleSize: 44,
  stepTimelineCircleBg: "#1F2937",
  stepTimelineCircleBorder: "#374151",
  stepTimelineCircleBorderWidth: 2,
  stepTimelineCompletedBg: "#F9FAFB",
  stepTimelineCompletedText: "#111827",
  stepTimelineLineColor: "#374151",
  stepTimelineLineCompleted: "#F9FAFB",
  stepTimelineLineHeight: 2,
  stepTimelineNameFontSize: 11,
  stepTimelineNameColor: "#F9FAFB",
  stepTimelineActiveColor: "#F9FAFB",
  stepTimelineInactiveColor: "#6B7280",
  stepTimelineCompleteColor: "#F9FAFB",

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
 * Get default settings for a specific bundle type
 */
export function getDefaultSettings(bundleType: keyof typeof DEFAULT_SETTINGS): DesignSettings {
  return DEFAULT_SETTINGS[bundleType];
}
