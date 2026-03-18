/**
 * Settings Merge Utilities
 *
 * Functions for merging database settings with default values.
 * This ensures that all settings have valid values even if some are missing from the database.
 */

import type { DesignSettings } from "../../../types/state.types";

/**
 * Database settings record type (from Prisma)
 * Uses Record<string, any> to accept Prisma's flexible JSON types
 */
type DbSettings = Record<string, any>;

/**
 * Merge database settings with default values
 *
 * This function takes settings from the database and merges them with defaults,
 * ensuring all fields have valid values. The JSON field settings (globalColorsSettings,
 * footerSettings, stepBarSettings, generalSettings) are spread last to override
 * any duplicates.
 *
 * @param dbSettings - Settings retrieved from database (can be null/undefined)
 * @param defaults - Default settings to use as fallback
 * @returns Complete DesignSettings object with all fields populated
 */
export function mergeSettings(
  dbSettings: DbSettings | null | undefined,
  defaults: DesignSettings
): DesignSettings {
  // If no database settings, return defaults with empty customCss
  if (!dbSettings) {
    return { ...defaults, customCss: "" };
  }

  // Extract JSON field settings (or empty objects if null)
  const globalColorsSettings = (dbSettings.globalColorsSettings as Record<string, any>) || {};
  const footerSettings = (dbSettings.footerSettings as Record<string, any>) || {};
  const stepBarSettings = (dbSettings.stepBarSettings as Record<string, any>) || {};
  const generalSettings = (dbSettings.generalSettings as Record<string, any>) || {};
  const promoBannerSettings = (dbSettings.promoBannerSettings as Record<string, any>) || {};

  return {
    // Start with defaults
    ...defaults,

    // Override with direct database fields (use || to fallback to default for null/undefined)
    customCss: dbSettings.customCss || "",

    // Product Card
    productCardBgColor: dbSettings.productCardBgColor || defaults.productCardBgColor,
    productCardFontColor: dbSettings.productCardFontColor || defaults.productCardFontColor,
    productCardFontSize: dbSettings.productCardFontSize || defaults.productCardFontSize,
    productCardFontWeight: dbSettings.productCardFontWeight || defaults.productCardFontWeight,
    productCardImageFit: dbSettings.productCardImageFit || defaults.productCardImageFit,
    productCardsPerRow: dbSettings.productCardsPerRow || defaults.productCardsPerRow,

    // Use !== undefined for boolean fields to preserve false values
    productPriceVisibility: dbSettings.productPriceVisibility !== undefined && dbSettings.productPriceVisibility !== null
      ? Boolean(dbSettings.productPriceVisibility)
      : defaults.productPriceVisibility,

    productPriceBgColor: dbSettings.productPriceBgColor || defaults.productPriceBgColor,

    // Product Card Typography
    productStrikePriceColor: dbSettings.productStrikePriceColor || defaults.productStrikePriceColor,
    productStrikeFontSize: dbSettings.productStrikeFontSize || defaults.productStrikeFontSize,
    productStrikeFontWeight: dbSettings.productStrikeFontWeight || defaults.productStrikeFontWeight,
    productFinalPriceColor: dbSettings.productFinalPriceColor || defaults.productFinalPriceColor,
    productFinalPriceFontSize: dbSettings.productFinalPriceFontSize || defaults.productFinalPriceFontSize,
    productFinalPriceFontWeight: dbSettings.productFinalPriceFontWeight || defaults.productFinalPriceFontWeight,

    // Button
    buttonBgColor: dbSettings.buttonBgColor || defaults.buttonBgColor,
    buttonTextColor: dbSettings.buttonTextColor || defaults.buttonTextColor,
    buttonFontSize: dbSettings.buttonFontSize || defaults.buttonFontSize,
    buttonFontWeight: dbSettings.buttonFontWeight || defaults.buttonFontWeight,
    buttonBorderRadius: dbSettings.buttonBorderRadius || defaults.buttonBorderRadius,
    buttonHoverBgColor: dbSettings.buttonHoverBgColor || defaults.buttonHoverBgColor,
    buttonAddToCartText: dbSettings.buttonAddToCartText || defaults.buttonAddToCartText,

    // Quantity Selector
    quantitySelectorBgColor: dbSettings.quantitySelectorBgColor || defaults.quantitySelectorBgColor,
    quantitySelectorTextColor: dbSettings.quantitySelectorTextColor || defaults.quantitySelectorTextColor,
    quantitySelectorFontSize: dbSettings.quantitySelectorFontSize || defaults.quantitySelectorFontSize,
    quantitySelectorBorderRadius: dbSettings.quantitySelectorBorderRadius || defaults.quantitySelectorBorderRadius,

    // Product Card Layout & Dimensions
    productCardWidth: dbSettings.productCardWidth || defaults.productCardWidth,
    productCardHeight: dbSettings.productCardHeight || defaults.productCardHeight,
    productCardSpacing: dbSettings.productCardSpacing || defaults.productCardSpacing,
    productCardBorderRadius: dbSettings.productCardBorderRadius || defaults.productCardBorderRadius,
    productCardPadding: dbSettings.productCardPadding || defaults.productCardPadding,
    productCardBorderWidth: dbSettings.productCardBorderWidth || defaults.productCardBorderWidth,
    productCardBorderColor: dbSettings.productCardBorderColor || defaults.productCardBorderColor,
    productCardShadow: dbSettings.productCardShadow || defaults.productCardShadow,
    productCardHoverShadow: dbSettings.productCardHoverShadow || defaults.productCardHoverShadow,

    // Product Image
    productImageHeight: dbSettings.productImageHeight || defaults.productImageHeight,
    productImageBorderRadius: dbSettings.productImageBorderRadius || defaults.productImageBorderRadius,
    productImageBgColor: dbSettings.productImageBgColor || defaults.productImageBgColor,

    // Product Modal Styling
    modalBgColor: dbSettings.modalBgColor || defaults.modalBgColor,
    modalBorderRadius: dbSettings.modalBorderRadius || defaults.modalBorderRadius,
    modalTitleFontSize: dbSettings.modalTitleFontSize || defaults.modalTitleFontSize,
    modalTitleFontWeight: dbSettings.modalTitleFontWeight || defaults.modalTitleFontWeight,
    modalPriceFontSize: dbSettings.modalPriceFontSize || defaults.modalPriceFontSize,
    modalVariantBorderRadius: dbSettings.modalVariantBorderRadius || defaults.modalVariantBorderRadius,
    modalButtonBgColor: dbSettings.modalButtonBgColor || defaults.modalButtonBgColor,
    modalButtonTextColor: dbSettings.modalButtonTextColor || defaults.modalButtonTextColor,
    modalButtonBorderRadius: dbSettings.modalButtonBorderRadius || defaults.modalButtonBorderRadius,

    // Toast extended settings (direct columns)
    toastBorderRadius: dbSettings.toastBorderRadius ?? defaults.toastBorderRadius,
    toastBorderColor: dbSettings.toastBorderColor ?? defaults.toastBorderColor,
    toastBorderWidth: dbSettings.toastBorderWidth ?? defaults.toastBorderWidth,
    toastFontSize: dbSettings.toastFontSize ?? defaults.toastFontSize,
    toastFontWeight: dbSettings.toastFontWeight ?? defaults.toastFontWeight,
    toastAnimationDuration: dbSettings.toastAnimationDuration ?? defaults.toastAnimationDuration,
    toastBoxShadow: dbSettings.toastBoxShadow ?? defaults.toastBoxShadow,
    toastEnterFromBottom: dbSettings.toastEnterFromBottom !== undefined && dbSettings.toastEnterFromBottom !== null
      ? Boolean(dbSettings.toastEnterFromBottom)
      : defaults.toastEnterFromBottom,

    // Spread JSON field settings last (they override any duplicates)
    ...globalColorsSettings,
    ...footerSettings,
    ...stepBarSettings,
    ...generalSettings,
    ...promoBannerSettings,
  };
}

/**
 * Create merged settings for both bundle types
 *
 * @param productPageDbSettings - Product page settings from database
 * @param fullPageDbSettings - Full page settings from database
 * @param defaults - Default settings object containing both bundle type defaults
 * @returns Object with merged settings for both bundle types
 */
export function createMergedSettings(
  productPageDbSettings: DbSettings | null | undefined,
  fullPageDbSettings: DbSettings | null | undefined,
  defaults: { product_page: DesignSettings; full_page: DesignSettings }
): { product_page: DesignSettings; full_page: DesignSettings } {
  return {
    product_page: mergeSettings(productPageDbSettings, defaults.product_page),
    full_page: mergeSettings(fullPageDbSettings, defaults.full_page),
  };
}
