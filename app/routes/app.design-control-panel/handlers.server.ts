/**
 * Design Control Panel Action Handlers
 *
 * Handles saving design settings to the database
 */

import { json } from "@remix-run/node";
import { prisma } from "../../db.server";
import { processCss } from "../../lib/css-sanitizer";

/**
 * Extract footer settings from form data
 */
function extractFooterSettings(settings: any) {
  return {
    footerBgColor: settings.footerBgColor,
    footerTotalBgColor: settings.footerTotalBgColor,
    footerBorderRadius: settings.footerBorderRadius,
    footerPadding: settings.footerPadding,
    footerFinalPriceColor: settings.footerFinalPriceColor,
    footerFinalPriceFontSize: settings.footerFinalPriceFontSize,
    footerFinalPriceFontWeight: settings.footerFinalPriceFontWeight,
    footerStrikePriceColor: settings.footerStrikePriceColor,
    footerStrikeFontSize: settings.footerStrikeFontSize,
    footerStrikeFontWeight: settings.footerStrikeFontWeight,
    footerPriceVisibility: settings.footerPriceVisibility,
    footerBackButtonBgColor: settings.footerBackButtonBgColor,
    footerBackButtonTextColor: settings.footerBackButtonTextColor,
    footerBackButtonBorderColor: settings.footerBackButtonBorderColor,
    footerBackButtonBorderRadius: settings.footerBackButtonBorderRadius,
    footerNextButtonBgColor: settings.footerNextButtonBgColor,
    footerNextButtonTextColor: settings.footerNextButtonTextColor,
    footerNextButtonBorderColor: settings.footerNextButtonBorderColor,
    footerNextButtonBorderRadius: settings.footerNextButtonBorderRadius,
    footerDiscountTextVisibility: settings.footerDiscountTextVisibility,
    footerProgressBarFilledColor: settings.footerProgressBarFilledColor,
    footerProgressBarEmptyColor: settings.footerProgressBarEmptyColor,
  };
}

/**
 * Extract step bar settings from form data
 */
function extractStepBarSettings(settings: any) {
  return {
    stepNameFontColor: settings.stepNameFontColor,
    stepNameFontSize: settings.stepNameFontSize,
    completedStepCheckMarkColor: settings.completedStepCheckMarkColor,
    completedStepBgColor: settings.completedStepBgColor,
    completedStepCircleBorderColor: settings.completedStepCircleBorderColor,
    completedStepCircleBorderRadius: settings.completedStepCircleBorderRadius,
    incompleteStepBgColor: settings.incompleteStepBgColor,
    incompleteStepCircleStrokeColor: settings.incompleteStepCircleStrokeColor,
    incompleteStepCircleStrokeRadius: settings.incompleteStepCircleStrokeRadius,
    stepBarProgressFilledColor: settings.stepBarProgressFilledColor,
    stepBarProgressEmptyColor: settings.stepBarProgressEmptyColor,
    tabsActiveBgColor: settings.tabsActiveBgColor,
    tabsActiveTextColor: settings.tabsActiveTextColor,
    tabsInactiveBgColor: settings.tabsInactiveBgColor,
    tabsInactiveTextColor: settings.tabsInactiveTextColor,
    tabsBorderColor: settings.tabsBorderColor,
    tabsBorderRadius: settings.tabsBorderRadius,
  };
}

/**
 * Extract global colors settings from form data
 */
function extractGlobalColorsSettings(settings: any) {
  return {
    globalPrimaryButtonColor: settings.globalPrimaryButtonColor,
    globalButtonTextColor: settings.globalButtonTextColor,
    globalPrimaryTextColor: settings.globalPrimaryTextColor,
    globalSecondaryTextColor: settings.globalSecondaryTextColor,
    globalFooterBgColor: settings.globalFooterBgColor,
    globalFooterTextColor: settings.globalFooterTextColor,
  };
}

/**
 * Extract general settings from form data
 */
function extractGeneralSettings(settings: any) {
  return {
    // Empty State
    emptyStateCardBgColor: settings.emptyStateCardBgColor,
    emptyStateCardBorderColor: settings.emptyStateCardBorderColor,
    emptyStateTextColor: settings.emptyStateTextColor,
    emptyStateBorderStyle: settings.emptyStateBorderStyle,
    // Drawer
    drawerBgColor: settings.drawerBgColor,
    // Add to Cart Button
    addToCartButtonBgColor: settings.addToCartButtonBgColor,
    addToCartButtonTextColor: settings.addToCartButtonTextColor,
    addToCartButtonBorderRadius: settings.addToCartButtonBorderRadius,
    // Toasts
    toastBgColor: settings.toastBgColor,
    toastTextColor: settings.toastTextColor,
    // Bundle Design
    bundleBgColor: settings.bundleBgColor,
    footerScrollBarColor: settings.footerScrollBarColor,
    // Product Page Title
    productPageTitleFontColor: settings.productPageTitleFontColor,
    productPageTitleFontSize: settings.productPageTitleFontSize,
    // Bundle Upsell
    bundleUpsellButtonBgColor: settings.bundleUpsellButtonBgColor,
    bundleUpsellBorderColor: settings.bundleUpsellBorderColor,
    bundleUpsellTextColor: settings.bundleUpsellTextColor,
    // Filters
    filterIconColor: settings.filterIconColor,
    filterBgColor: settings.filterBgColor,
    filterTextColor: settings.filterTextColor,
    // Header Text
    conditionsTextColor: settings.conditionsTextColor,
    conditionsTextFontSize: settings.conditionsTextFontSize,
    discountTextColor: settings.discountTextColor,
    discountTextFontSize: settings.discountTextFontSize,
  };
}

/**
 * Extract promo banner settings from form data
 */
function extractPromoBannerSettings(settings: any) {
  return {
    promoBannerEnabled: settings.promoBannerEnabled,
    promoBannerBgColor: settings.promoBannerBgColor,
    promoBannerTitleColor: settings.promoBannerTitleColor,
    promoBannerTitleFontSize: settings.promoBannerTitleFontSize,
    promoBannerTitleFontWeight: settings.promoBannerTitleFontWeight,
    promoBannerSubtitleColor: settings.promoBannerSubtitleColor,
    promoBannerSubtitleFontSize: settings.promoBannerSubtitleFontSize,
    promoBannerNoteColor: settings.promoBannerNoteColor,
    promoBannerNoteFontSize: settings.promoBannerNoteFontSize,
    promoBannerBorderRadius: settings.promoBannerBorderRadius,
    promoBannerPadding: settings.promoBannerPadding,
  };
}

/**
 * Build the settings data object for database upsert
 */
function buildSettingsData(settings: any, groupedSettings: {
  footerSettings: ReturnType<typeof extractFooterSettings>;
  stepBarSettings: ReturnType<typeof extractStepBarSettings>;
  globalColorsSettings: ReturnType<typeof extractGlobalColorsSettings>;
  generalSettings: ReturnType<typeof extractGeneralSettings>;
  promoBannerSettings: ReturnType<typeof extractPromoBannerSettings>;
}) {
  return {
    customCss: settings.customCss || null,
    productCardBgColor: settings.productCardBgColor,
    productCardFontColor: settings.productCardFontColor,
    productCardFontSize: settings.productCardFontSize,
    productCardFontWeight: settings.productCardFontWeight,
    productCardImageFit: settings.productCardImageFit,
    productCardsPerRow: settings.productCardsPerRow,
    productPriceVisibility: settings.productPriceVisibility,
    productPriceBgColor: settings.productPriceBgColor,
    productStrikePriceColor: settings.productStrikePriceColor,
    productStrikeFontSize: settings.productStrikeFontSize,
    productStrikeFontWeight: settings.productStrikeFontWeight,
    productFinalPriceColor: settings.productFinalPriceColor,
    productFinalPriceFontSize: settings.productFinalPriceFontSize,
    productFinalPriceFontWeight: settings.productFinalPriceFontWeight,
    buttonBgColor: settings.buttonBgColor,
    buttonTextColor: settings.buttonTextColor,
    buttonFontSize: settings.buttonFontSize,
    buttonFontWeight: settings.buttonFontWeight,
    buttonBorderRadius: settings.buttonBorderRadius,
    buttonHoverBgColor: settings.buttonHoverBgColor,
    buttonAddToCartText: settings.buttonAddToCartText,
    quantitySelectorBgColor: settings.quantitySelectorBgColor,
    quantitySelectorTextColor: settings.quantitySelectorTextColor,
    quantitySelectorFontSize: settings.quantitySelectorFontSize,
    quantitySelectorBorderRadius: settings.quantitySelectorBorderRadius,
    productCardWidth: settings.productCardWidth,
    productCardHeight: settings.productCardHeight,
    productCardSpacing: settings.productCardSpacing,
    productCardBorderRadius: settings.productCardBorderRadius,
    productCardPadding: settings.productCardPadding,
    productCardBorderWidth: settings.productCardBorderWidth,
    productCardBorderColor: settings.productCardBorderColor,
    productCardShadow: settings.productCardShadow,
    productCardHoverShadow: settings.productCardHoverShadow,
    productImageHeight: settings.productImageHeight,
    productImageBorderRadius: settings.productImageBorderRadius,
    productImageBgColor: settings.productImageBgColor,
    modalBgColor: settings.modalBgColor,
    modalBorderRadius: settings.modalBorderRadius,
    modalTitleFontSize: settings.modalTitleFontSize,
    modalTitleFontWeight: settings.modalTitleFontWeight,
    modalPriceFontSize: settings.modalPriceFontSize,
    modalVariantBorderRadius: settings.modalVariantBorderRadius,
    modalButtonBgColor: settings.modalButtonBgColor,
    modalButtonTextColor: settings.modalButtonTextColor,
    modalButtonBorderRadius: settings.modalButtonBorderRadius,
    ...groupedSettings,
  };
}

/**
 * Handle saving design settings
 */
export async function handleSaveSettings(
  shopId: string,
  formData: { bundleType: "product_page" | "full_page"; settings: any }
) {
  const { bundleType, settings } = formData;

  // Validate custom CSS at save time
  const cssWarnings: string[] = [];
  if (settings.customCss) {
    const cssResult = processCss(settings.customCss);
    if (cssResult.warnings.length > 0) {
      cssWarnings.push(...cssResult.warnings);
    }
    if (cssResult.syntaxErrors.length > 0) {
      cssWarnings.push(...cssResult.syntaxErrors.map((e: string) => `Syntax: ${e}`));
    }
  }

  // Extract grouped settings
  const footerSettings = extractFooterSettings(settings);
  const stepBarSettings = extractStepBarSettings(settings);
  const globalColorsSettings = extractGlobalColorsSettings(settings);
  const generalSettings = extractGeneralSettings(settings);
  const promoBannerSettings = extractPromoBannerSettings(settings);

  // Build settings data
  const settingsData = buildSettingsData(settings, {
    footerSettings,
    stepBarSettings,
    globalColorsSettings,
    generalSettings,
    promoBannerSettings,
  });

  await prisma.designSettings.upsert({
    where: {
      shopId_bundleType: {
        shopId,
        bundleType,
      },
    },
    create: {
      shopId,
      bundleType,
      ...settingsData,
    },
    update: settingsData,
  });

  // Build response message with any CSS warnings
  let message = "Design settings saved successfully!";
  if (cssWarnings.length > 0) {
    message = `Settings saved with CSS warnings: ${cssWarnings.join("; ")}`;
  }

  return json({
    success: true,
    message,
    cssWarnings: cssWarnings.length > 0 ? cssWarnings : undefined
  });
}
