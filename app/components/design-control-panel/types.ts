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
  footerProgressBarFilledColor: string;
  footerProgressBarEmptyColor: string;

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

  // Additional fields
  [key: string]: string | number | boolean;
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
