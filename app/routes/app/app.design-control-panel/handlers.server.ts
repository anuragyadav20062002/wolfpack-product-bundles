/**
 * Design Control Panel Action Handlers
 *
 * Handles saving design settings to the database
 */

import { json } from "@remix-run/node";
import { prisma } from "../../../db.server";
import { processCss } from "../../../lib/css-sanitizer";

// ─── Utility ─────────────────────────────────────────────────────────────────

function pick(source: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> {
  return Object.fromEntries(keys.map(k => [k, source[k]]));
}

// ─── Grouped JSON-column key lists ───────────────────────────────────────────
// Each list defines exactly which keys belong to the corresponding JSON column
// in DesignSettings. Adding a new field = add it here and nowhere else.

const FOOTER_KEYS = [
  "footerBgColor", "footerTotalBgColor", "footerBorderRadius", "footerPadding",
  "footerFinalPriceColor", "footerFinalPriceFontSize", "footerFinalPriceFontWeight",
  "footerStrikePriceColor", "footerStrikeFontSize", "footerStrikeFontWeight",
  "footerPriceVisibility", "footerBackButtonBgColor", "footerBackButtonTextColor",
  "footerBackButtonBorderColor", "footerBackButtonBorderRadius",
  "footerNextButtonBgColor", "footerNextButtonTextColor",
  "footerNextButtonBorderColor", "footerNextButtonBorderRadius",
  "footerDiscountTextVisibility",
  "sidebarCardBgColor", "sidebarCardTextColor", "sidebarCardBorderColor",
  "sidebarCardBorderWidth", "sidebarCardBorderRadius", "sidebarCardPadding",
  "sidebarCardWidth", "sidebarStickyOffset", "sidebarProductListMaxHeight",
  "sidebarSkeletonRowCount",
  "sidebarDiscountBgColor", "sidebarDiscountTextColor",
  "sidebarButtonBgColor", "sidebarButtonTextColor", "sidebarButtonBorderRadius",
] as const;

const STEP_BAR_KEYS = [
  "stepNameFontColor", "stepNameFontSize",
  "completedStepCheckMarkColor", "completedStepBgColor",
  "completedStepCircleBorderColor", "completedStepCircleBorderRadius",
  "incompleteStepBgColor", "incompleteStepCircleStrokeColor",
  "incompleteStepCircleStrokeRadius",
  "stepBarProgressFilledColor", "stepBarProgressEmptyColor",
  "tabsActiveBgColor", "tabsActiveTextColor",
  "tabsInactiveBgColor", "tabsInactiveTextColor",
  "tabsBorderColor", "tabsBorderRadius",
] as const;

const GLOBAL_COLORS_KEYS = [
  "globalPrimaryButtonColor", "globalButtonTextColor",
  "globalPrimaryTextColor", "globalSecondaryTextColor",
  "globalFooterBgColor", "globalFooterTextColor",
] as const;

const GENERAL_KEYS = [
  // Empty State
  "emptyStateCardBgColor", "emptyStateCardBorderColor",
  "emptyStateTextColor", "emptyStateBorderStyle",
  // Drawer
  "drawerBgColor",
  // Add to Cart Button
  "addToCartButtonBgColor", "addToCartButtonTextColor", "addToCartButtonBorderRadius",
  // Toasts
  "toastBgColor", "toastTextColor", "toastBorderRadius", "toastBorderColor",
  "toastBorderWidth", "toastFontSize", "toastFontWeight",
  "toastAnimationDuration", "toastBoxShadow", "toastEnterFromBottom",
  // Bundle Design
  "bundleBgColor", "footerScrollBarColor",
  // Product Page Title
  "productPageTitleFontColor", "productPageTitleFontSize",
  // Bundle Upsell
  "bundleUpsellButtonBgColor", "bundleUpsellBorderColor", "bundleUpsellTextColor",
  // Filters
  "filterIconColor", "filterBgColor", "filterTextColor",
  // Header Text
  "conditionsTextColor", "conditionsTextFontSize",
  "discountTextColor", "discountTextFontSize",
  // Badges
  "freeGiftBadgeUrl", "freeGiftBadgePosition",
  "includedBadgeUrl", "includedBadgePosition",
] as const;

const PROMO_BANNER_KEYS = [
  "promoBannerEnabled", "promoBannerBgColor",
  "promoBannerTitleColor", "promoBannerTitleFontSize", "promoBannerTitleFontWeight",
  "promoBannerSubtitleColor", "promoBannerSubtitleFontSize",
  "promoBannerNoteColor", "promoBannerNoteFontSize",
  "promoBannerBorderRadius", "promoBannerPadding",
] as const;

// ─── Settings builder ─────────────────────────────────────────────────────────

function buildSettingsData(settings: Record<string, unknown>) {
  return {
    customCss: (settings.customCss as string) || null,
    productCardBgColor: settings.productCardBgColor,
    productCardFontColor: settings.productCardFontColor,
    productCardFontSize: settings.productCardFontSize,
    productCardFontWeight: settings.productCardFontWeight,
    productCardImageFit: settings.productCardImageFit,
    productCardsPerRow: settings.productCardsPerRow,
    productTitleVisibility: settings.productTitleVisibility,
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
    variantSelectorBgColor: settings.variantSelectorBgColor,
    variantSelectorTextColor: settings.variantSelectorTextColor,
    variantSelectorBorderRadius: settings.variantSelectorBorderRadius,
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
    // Toast extended (direct columns — not in JSON blob)
    toastBorderRadius: settings.toastBorderRadius,
    toastBorderColor: settings.toastBorderColor,
    toastBorderWidth: settings.toastBorderWidth,
    toastFontSize: settings.toastFontSize,
    toastFontWeight: settings.toastFontWeight,
    toastAnimationDuration: settings.toastAnimationDuration,
    toastBoxShadow: settings.toastBoxShadow,
    toastEnterFromBottom: settings.toastEnterFromBottom,
    // Button added state & typography
    buttonAddedBgColor: settings.buttonAddedBgColor,
    buttonAddedTextColor: settings.buttonAddedTextColor,
    buttonTextTransform: settings.buttonTextTransform,
    buttonLetterSpacing: settings.buttonLetterSpacing,
    // Product card hover & transitions
    productCardHoverTranslateY: settings.productCardHoverTranslateY,
    productCardTransitionDuration: settings.productCardTransitionDuration,
    // Tile quantity badge
    tileQuantityBadgeBgColor: settings.tileQuantityBadgeBgColor,
    tileQuantityBadgeTextColor: settings.tileQuantityBadgeTextColor,
    // Modal close button
    modalCloseButtonColor: settings.modalCloseButtonColor,
    modalCloseButtonBgColor: settings.modalCloseButtonBgColor,
    modalCloseButtonHoverColor: settings.modalCloseButtonHoverColor,
    // Accessibility / focus
    focusOutlineColor: settings.focusOutlineColor,
    focusOutlineWidth: settings.focusOutlineWidth,
    // Search input
    searchInputBgColor: settings.searchInputBgColor,
    searchInputBorderColor: settings.searchInputBorderColor,
    searchInputFocusBorderColor: settings.searchInputFocusBorderColor,
    searchInputTextColor: settings.searchInputTextColor,
    searchInputPlaceholderColor: settings.searchInputPlaceholderColor,
    searchClearButtonBgColor: settings.searchClearButtonBgColor,
    searchClearButtonColor: settings.searchClearButtonColor,
    // Skeleton loading
    skeletonBaseBgColor: settings.skeletonBaseBgColor,
    skeletonShimmerColor: settings.skeletonShimmerColor,
    skeletonHighlightColor: settings.skeletonHighlightColor,
    // Tier pills
    tierPillActiveBgColor: settings.tierPillActiveBgColor,
    tierPillActiveTextColor: settings.tierPillActiveTextColor,
    tierPillInactiveBgColor: settings.tierPillInactiveBgColor,
    tierPillInactiveTextColor: settings.tierPillInactiveTextColor,
    tierPillHoverBgColor: settings.tierPillHoverBgColor,
    tierPillBorderColor: settings.tierPillBorderColor,
    tierPillBorderRadius: settings.tierPillBorderRadius,
    tierPillHeight: settings.tierPillHeight,
    tierPillGap: settings.tierPillGap,
    tierPillFontSize: settings.tierPillFontSize,
    tierPillFontWeight: settings.tierPillFontWeight,
    // Loading overlay
    loadingOverlayBgColor: settings.loadingOverlayBgColor,
    loadingOverlayTextColor: settings.loadingOverlayTextColor,
    // Widget style & bottom sheet
    widgetStyle: settings.widgetStyle,
    bottomSheetOverlayOpacity: settings.bottomSheetOverlayOpacity,
    bottomSheetAnimationDuration: settings.bottomSheetAnimationDuration,
    emptySlotBorderStyle: settings.emptySlotBorderStyle,
    emptySlotBorderColor: settings.emptySlotBorderColor,
    // JSON blob columns — built from key lists above
    footerSettings: pick(settings, FOOTER_KEYS),
    stepBarSettings: pick(settings, STEP_BAR_KEYS),
    globalColorsSettings: pick(settings, GLOBAL_COLORS_KEYS),
    generalSettings: pick(settings, GENERAL_KEYS),
    promoBannerSettings: pick(settings, PROMO_BANNER_KEYS),
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

/**
 * Handle saving design settings
 */
export async function handleSaveSettings(
  shopId: string,
  formData: { bundleType: "product_page" | "full_page"; settings: Record<string, unknown> }
) {
  const { bundleType, settings } = formData;

  // Validate custom CSS at save time
  const cssWarnings: string[] = [];
  if (settings.customCss) {
    const cssResult = processCss(settings.customCss as string);
    if (cssResult.warnings.length > 0) {
      cssWarnings.push(...cssResult.warnings);
    }
    if (cssResult.syntaxErrors.length > 0) {
      cssWarnings.push(...cssResult.syntaxErrors.map((e: string) => `Syntax: ${e}`));
    }
  }

  const settingsData = buildSettingsData(settings);

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
