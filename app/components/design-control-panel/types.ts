export interface DesignSettings {
  // Global Colors
  globalPrimaryButtonColor: string;
  globalButtonTextColor: string;
  globalPrimaryTextColor: string;
  globalSecondaryTextColor: string;
  globalFooterBgColor: string;
  globalFooterTextColor: string;

  // Product Card
  productCardBgColor: string;
  productCardFontColor: string;
  productCardFontSize: number;
  productCardFontWeight: number;
  productCardImageFit: string;
  productCardsPerRow: number;
  productTitleVisibility: boolean;
  productPriceVisibility: boolean;
  productPriceBgColor: string;
  productStrikePriceColor: string;
  productStrikeFontSize: number;
  productStrikeFontWeight: number;
  productFinalPriceColor: string;
  productFinalPriceFontSize: number;
  productFinalPriceFontWeight: number;

  // Button
  buttonBgColor: string;
  buttonTextColor: string;
  buttonFontSize: number;
  buttonFontWeight: number;
  buttonBorderRadius: number;
  buttonHoverBgColor: string;
  buttonAddToCartText: string;
  // Button — Added/Selected State
  buttonAddedBgColor: string;
  buttonAddedTextColor: string;

  // Quantity Selector
  quantitySelectorBgColor: string;
  quantitySelectorTextColor: string;
  quantitySelectorFontSize: number;
  quantitySelectorBorderRadius: number;

  // Variant Selector
  variantSelectorBgColor: string;
  variantSelectorTextColor: string;
  variantSelectorBorderRadius: number;

  // Bundle Footer
  footerBgColor: string;
  footerTotalBgColor: string;
  footerBorderRadius: number;
  footerPadding: number;
  footerFinalPriceColor: string;
  footerFinalPriceFontSize: number;
  footerFinalPriceFontWeight: number;
  footerStrikePriceColor: string;
  footerStrikeFontSize: number;
  footerStrikeFontWeight: number;
  footerPriceVisibility: boolean;
  footerBackButtonBgColor: string;
  footerBackButtonTextColor: string;
  footerBackButtonBorderColor: string;
  footerBackButtonBorderRadius: number;
  footerNextButtonBgColor: string;
  footerNextButtonTextColor: string;
  footerNextButtonBorderColor: string;
  footerNextButtonBorderRadius: number;
  footerDiscountTextVisibility: boolean;

  // Bundle Header - Tabs
  headerTabActiveBgColor: string;
  headerTabActiveTextColor: string;
  headerTabInactiveBgColor: string;
  headerTabInactiveTextColor: string;
  headerTabRadius: number;

  // Bundle Header - Header Text
  conditionsTextColor: string;
  conditionsTextFontSize: number;
  discountTextColor: string;
  discountTextFontSize: number;

  // Search Input (full-page widget)
  searchInputBgColor: string;
  searchInputBorderColor: string;
  searchInputFocusBorderColor: string;
  searchInputTextColor: string;
  searchInputPlaceholderColor: string;
  searchClearButtonBgColor: string;
  searchClearButtonColor: string;

  // Skeleton Loading
  skeletonBaseBgColor: string;
  skeletonShimmerColor: string;
  skeletonHighlightColor: string;

  // Card Hover & Transitions
  productCardHoverTranslateY: number;
  productCardTransitionDuration: number;

  // Tile Quantity Badge
  tileQuantityBadgeBgColor: string;
  tileQuantityBadgeTextColor: string;

  // Modal Close Button
  modalCloseButtonColor: string;
  modalCloseButtonBgColor: string;
  modalCloseButtonHoverColor: string;

  // Typography
  buttonTextTransform: string;
  buttonLetterSpacing: number;

  // Focus / Accessibility
  focusOutlineColor: string;
  focusOutlineWidth: number;

  // Bottom-Sheet Widget Style (skai-lama-bottom-sheet-redesign)
  widgetStyle?: 'classic' | 'bottom-sheet';
  bottomSheetOverlayOpacity?: number;    // 0–0.8, default 0.5
  bottomSheetAnimationDuration?: number; // 200–600ms, default 400
  emptySlotBorderStyle?: 'dashed' | 'solid'; // default 'dashed'
  emptySlotBorderColor?: string;         // default = primary button color
  freeGiftBadgeUrl?: string;             // optional merchant badge PNG/SVG; falls back to built-in ribbon SVG

  // Pricing Tier Pills (Full-Page Bundles — fpb-tier-selection-1)
  tierPillActiveBgColor?: string;        // active pill background
  tierPillActiveTextColor?: string;      // active pill text
  tierPillInactiveBgColor?: string;      // inactive pill background
  tierPillInactiveTextColor?: string;    // inactive pill text
  tierPillHoverBgColor?: string;         // hover background for inactive pills
  tierPillBorderColor?: string;          // pill border color
  tierPillBorderRadius?: number;         // 0–50px
  tierPillHeight?: number;               // 32–80px
  tierPillFontSize?: number;             // 12–24px
  tierPillFontWeight?: number;           // 400 | 600 | 700
  tierPillGap?: number;                  // 4–32px gap between pills

  // Additional fields
  [key: string]: string | number | boolean | undefined;
}

export interface NavigationItemProps {
  label: string;
  sectionKey: string;
  hasChildren?: boolean;
  isChild?: boolean;
  onClick?: () => void;
  isExpanded?: boolean;
  isActive?: boolean;
}
