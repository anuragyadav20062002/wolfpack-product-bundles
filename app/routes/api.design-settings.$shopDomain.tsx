import { type LoaderFunctionArgs } from "@remix-run/node";
import { AppLogger } from "../lib/logger";
import { prisma } from "../db.server";
import { sanitizeCss } from "../lib/css-sanitizer";

/**
 * API endpoint that returns design settings as CSS variables
 * Usage: <link rel="stylesheet" href="https://your-app.com/api/design-settings/{shopDomain}.css" />
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const { shopDomain } = params;

  if (!shopDomain) {
    return new Response("Shop domain is required", { status: 400 });
  }

  try {
    const url = new URL(request.url);
    const requestedBundleType = url.searchParams.get("bundleType") as "product_page" | "full_page" | null;

    // Unified CSS Strategy: Try product_page first, then full_page, then defaults
    // This allows merchants to use the same design for both bundle types
    const bundleTypesToTry: ("product_page" | "full_page")[] = requestedBundleType
      ? [requestedBundleType, requestedBundleType === "product_page" ? "full_page" : "product_page"]
      : ["product_page", "full_page"];

    AppLogger.info("Fetching design settings for CSS with fallback", {
      component: "api.design-settings.css",
      shopDomain,
      requestedBundleType: requestedBundleType || "not specified (will try product_page first)",
      fallbackOrder: bundleTypesToTry,
    });

    let designSettings = null;
    let usedBundleType = null;

    // Try each bundle type in order until we find settings
    for (const bundleType of bundleTypesToTry) {
      designSettings = await prisma.designSettings.findUnique({
        where: {
          shopId_bundleType: {
            shopId: shopDomain,
            bundleType,
          },
        },
      });

      if (designSettings) {
        usedBundleType = bundleType;
        AppLogger.info("Design settings found", {
          component: "api.design-settings.css",
          shopDomain,
          usedBundleType,
          requestedBundleType,
        });
        break;
      }
    }

    if (!designSettings) {
      AppLogger.info("No design settings found for any bundle type, using defaults", {
        component: "api.design-settings.css",
        shopDomain,
        triedBundleTypes: bundleTypesToTry,
      });
    }

    const defaultSettings = {
      productCardBgColor: "#FFFFFF",
      productCardFontColor: "#000000",
      productCardFontSize: 16,
      productCardFontWeight: 400,
      productCardImageFit: "cover",
      productCardsPerRow: 3,
      productPriceVisibility: true,
      productPriceBgColor: "#F0F8F0",
      productStrikePriceColor: "#8D8D8D",
      productStrikeFontSize: 14,
      productStrikeFontWeight: 400,
      productFinalPriceColor: "#000000",
      productFinalPriceFontSize: 18,
      productFinalPriceFontWeight: 700,
      buttonBgColor: "#000000",
      buttonTextColor: "#FFFFFF",
      buttonFontSize: 16,
      buttonFontWeight: 600,
      buttonBorderRadius: 8,
      buttonHoverBgColor: "#333333",
      buttonAddToCartText: "Add to cart",
      quantitySelectorBgColor: "#000000",
      quantitySelectorTextColor: "#FFFFFF",
      quantitySelectorFontSize: 16,
      quantitySelectorBorderRadius: 8,
      // Product Card Layout & Dimensions (Phase 6)
      productCardWidth: 280,
      productCardHeight: 420,
      productCardSpacing: 20,
      productCardBorderRadius: 8,
      productCardPadding: 12,
      productCardBorderWidth: 1,
      productCardBorderColor: "rgba(0,0,0,0.08)",
      productCardShadow: "0 2px 8px rgba(0,0,0,0.04)",
      productCardHoverShadow: "0 8px 24px rgba(0,0,0,0.12)",
      // Product Image (Phase 6)
      productImageHeight: 280,
      productImageBorderRadius: 6,
      productImageBgColor: "#F8F8F8",
      // Product Modal Styling (Phase 6)
      modalBgColor: "#FFFFFF",
      modalBorderRadius: 12,
      modalTitleFontSize: 28,
      modalTitleFontWeight: 700,
      modalPriceFontSize: 22,
      modalVariantBorderRadius: 8,
      modalButtonBgColor: "#000000",
      modalButtonTextColor: "#FFFFFF",
      modalButtonBorderRadius: 8,
      // Global Colors
      globalPrimaryButtonColor: "#000000",
      globalButtonTextColor: "#FFFFFF",
      globalPrimaryTextColor: "#000000",
      globalSecondaryTextColor: "#6B7280",
      globalFooterBgColor: "#FFFFFF",
      globalFooterTextColor: "#000000",
    };

    let finalSettings = defaultSettings;

    if (designSettings) {
      const globalColorsSettings = (designSettings as any).globalColorsSettings || {};
      const footerSettings = (designSettings as any).footerSettings || {};
      const stepBarSettings = (designSettings as any).stepBarSettings || {};
      const generalSettings = (designSettings as any).generalSettings || {};

      finalSettings = {
        ...defaultSettings,
        productCardBgColor: designSettings.productCardBgColor || defaultSettings.productCardBgColor,
        productCardFontColor: designSettings.productCardFontColor || defaultSettings.productCardFontColor,
        productCardFontSize: designSettings.productCardFontSize || defaultSettings.productCardFontSize,
        productCardFontWeight: designSettings.productCardFontWeight || defaultSettings.productCardFontWeight,
        productCardImageFit: designSettings.productCardImageFit || defaultSettings.productCardImageFit,
        productCardsPerRow: designSettings.productCardsPerRow || defaultSettings.productCardsPerRow,
        productPriceVisibility: designSettings.productPriceVisibility !== undefined ? designSettings.productPriceVisibility : defaultSettings.productPriceVisibility,
        productPriceBgColor: designSettings.productPriceBgColor || defaultSettings.productPriceBgColor,
        productStrikePriceColor: designSettings.productStrikePriceColor || defaultSettings.productStrikePriceColor,
        productStrikeFontSize: designSettings.productStrikeFontSize || defaultSettings.productStrikeFontSize,
        productStrikeFontWeight: designSettings.productStrikeFontWeight || defaultSettings.productStrikeFontWeight,
        productFinalPriceColor: designSettings.productFinalPriceColor || defaultSettings.productFinalPriceColor,
        productFinalPriceFontSize: designSettings.productFinalPriceFontSize || defaultSettings.productFinalPriceFontSize,
        productFinalPriceFontWeight: designSettings.productFinalPriceFontWeight || defaultSettings.productFinalPriceFontWeight,
        buttonBgColor: designSettings.buttonBgColor || defaultSettings.buttonBgColor,
        buttonTextColor: designSettings.buttonTextColor || defaultSettings.buttonTextColor,
        buttonFontSize: designSettings.buttonFontSize || defaultSettings.buttonFontSize,
        buttonFontWeight: designSettings.buttonFontWeight || defaultSettings.buttonFontWeight,
        buttonBorderRadius: designSettings.buttonBorderRadius || defaultSettings.buttonBorderRadius,
        buttonHoverBgColor: designSettings.buttonHoverBgColor || defaultSettings.buttonHoverBgColor,
        buttonAddToCartText: designSettings.buttonAddToCartText || defaultSettings.buttonAddToCartText,
        quantitySelectorBgColor: designSettings.quantitySelectorBgColor || defaultSettings.quantitySelectorBgColor,
        quantitySelectorTextColor: designSettings.quantitySelectorTextColor || defaultSettings.quantitySelectorTextColor,
        quantitySelectorFontSize: designSettings.quantitySelectorFontSize || defaultSettings.quantitySelectorFontSize,
        quantitySelectorBorderRadius: designSettings.quantitySelectorBorderRadius || defaultSettings.quantitySelectorBorderRadius,
        // Product Card Layout & Dimensions (Phase 6)
        productCardWidth: designSettings.productCardWidth || defaultSettings.productCardWidth,
        productCardHeight: designSettings.productCardHeight || defaultSettings.productCardHeight,
        productCardSpacing: designSettings.productCardSpacing || defaultSettings.productCardSpacing,
        productCardBorderRadius: designSettings.productCardBorderRadius || defaultSettings.productCardBorderRadius,
        productCardPadding: designSettings.productCardPadding || defaultSettings.productCardPadding,
        productCardBorderWidth: designSettings.productCardBorderWidth || defaultSettings.productCardBorderWidth,
        productCardBorderColor: designSettings.productCardBorderColor || defaultSettings.productCardBorderColor,
        productCardShadow: designSettings.productCardShadow || defaultSettings.productCardShadow,
        productCardHoverShadow: designSettings.productCardHoverShadow || defaultSettings.productCardHoverShadow,
        // Product Image (Phase 6)
        productImageHeight: designSettings.productImageHeight || defaultSettings.productImageHeight,
        productImageBorderRadius: designSettings.productImageBorderRadius || defaultSettings.productImageBorderRadius,
        productImageBgColor: designSettings.productImageBgColor || defaultSettings.productImageBgColor,
        // Product Modal Styling (Phase 6)
        modalBgColor: designSettings.modalBgColor || defaultSettings.modalBgColor,
        modalBorderRadius: designSettings.modalBorderRadius || defaultSettings.modalBorderRadius,
        modalTitleFontSize: designSettings.modalTitleFontSize || defaultSettings.modalTitleFontSize,
        modalTitleFontWeight: designSettings.modalTitleFontWeight || defaultSettings.modalTitleFontWeight,
        modalPriceFontSize: designSettings.modalPriceFontSize || defaultSettings.modalPriceFontSize,
        modalVariantBorderRadius: designSettings.modalVariantBorderRadius || defaultSettings.modalVariantBorderRadius,
        modalButtonBgColor: designSettings.modalButtonBgColor || defaultSettings.modalButtonBgColor,
        modalButtonTextColor: designSettings.modalButtonTextColor || defaultSettings.modalButtonTextColor,
        modalButtonBorderRadius: designSettings.modalButtonBorderRadius || defaultSettings.modalButtonBorderRadius,
        ...globalColorsSettings,
        ...footerSettings,
        ...stepBarSettings,
        ...generalSettings,
      };
    }

    // Use the bundle type that had settings, or default to product_page for CSS generation
    const bundleTypeForCSS = usedBundleType || requestedBundleType || "product_page";

    // Get custom CSS from design settings and sanitize it to prevent XSS attacks
    const rawCustomCss = designSettings?.customCss || "";
    const { sanitizedCss: customCss, warnings: cssWarnings } = sanitizeCss(rawCustomCss);

    if (cssWarnings.length > 0) {
      AppLogger.warn("Custom CSS contained potentially dangerous patterns", {
        component: "api.design-settings.css",
        shopDomain,
        warnings: cssWarnings,
      });
    }

    const css = generateCSSFromSettings(finalSettings, bundleTypeForCSS, customCss);

    return new Response(css, {
      status: 200,
      headers: {
        "Content-Type": "text/css; charset=utf-8",
        // Cache for 5 minutes (300 seconds) - allows design changes to propagate quickly
        // Combined with timestamp cache-busting in Liquid templates for immediate updates
        // stale-while-revalidate allows serving stale content while fetching fresh
        "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
        "Access-Control-Allow-Origin": "*",
        // Help CDNs cache efficiently
        "Vary": "Origin",
      },
    });
  } catch (error) {
    AppLogger.error("Failed to generate design settings CSS", {
      component: "api.design-settings.css",
      shopDomain,
    }, error);

    return new Response("/* Error loading design settings */", {
      status: 500,
      headers: {
        "Content-Type": "text/css; charset=utf-8",
      },
    });
  }
}

function generateCSSFromSettings(s: any, bundleType: string, customCss: string = ""): string {
  // Extract global colors with defaults
  const globalPrimaryButton = s.globalPrimaryButtonColor || '#000000';
  const globalButtonText = s.globalButtonTextColor || '#FFFFFF';
  const globalPrimaryText = s.globalPrimaryTextColor || '#000000';
  const globalSecondaryText = s.globalSecondaryTextColor || '#6B7280';
  const globalFooterBg = s.globalFooterBgColor || '#FFFFFF';
  const globalFooterText = s.globalFooterTextColor || '#000000';

  return `
/*
 * Wolfpack Bundle Widget - Design Settings
 * Bundle Type: ${bundleType}
 * Auto-generated from Design Control Panel
 *
 * Global Colors System:
 * - Global colors automatically cascade to all relevant components
 * - Component-specific colors override global colors when set
 * - This ensures brand consistency while allowing fine-grained control
 */

:root {
  /* GLOBAL COLORS */
  --bundle-global-primary-button: ${globalPrimaryButton};
  --bundle-global-button-text: ${globalButtonText};
  --bundle-global-primary-text: ${globalPrimaryText};
  --bundle-global-secondary-text: ${globalSecondaryText};
  --bundle-global-footer-bg: ${globalFooterBg};
  --bundle-global-footer-text: ${globalFooterText};

  /* PRODUCT CARD */
  --bundle-product-card-bg: ${s.productCardBgColor || '#FFFFFF'};
  --bundle-product-card-font-color: ${s.productCardFontColor || globalPrimaryText};
  --bundle-product-card-font-size: ${s.productCardFontSize || 16}px;
  --bundle-product-card-font-weight: ${s.productCardFontWeight || 400};
  --bundle-product-card-image-fit: ${s.productCardImageFit || 'cover'};
  --bundle-product-cards-per-row: ${s.productCardsPerRow || 3};
  --bundle-product-price-display: ${s.productPriceVisibility !== false ? 'block' : 'none'};
  --bundle-product-price-bg-color: ${s.productPriceBgColor || '#F0F8F0'};
  --bundle-product-strike-price-color: ${s.productStrikePriceColor || globalSecondaryText};
  --bundle-product-strike-font-size: ${s.productStrikeFontSize || 14}px;
  --bundle-product-strike-font-weight: ${s.productStrikeFontWeight || 400};
  --bundle-product-final-price-color: ${s.productFinalPriceColor || globalPrimaryText};
  --bundle-product-final-price-font-size: ${s.productFinalPriceFontSize || 18}px;
  --bundle-product-final-price-font-weight: ${s.productFinalPriceFontWeight || 700};

  /* BUTTON */
  --bundle-button-bg: ${s.buttonBgColor || globalPrimaryButton};
  --bundle-button-text-color: ${s.buttonTextColor || globalButtonText};
  --bundle-button-font-size: ${s.buttonFontSize || 16}px;
  --bundle-button-font-weight: ${s.buttonFontWeight || 600};
  --bundle-button-border-radius: ${s.buttonBorderRadius || 8}px;
  --bundle-button-hover-bg: ${s.buttonHoverBgColor || s.buttonBgColor || globalPrimaryButton};

  /* VARIANT SELECTOR */
  --bundle-variant-selector-bg: ${s.variantSelectorBgColor || '#FFFFFF'};
  --bundle-variant-selector-text-color: ${s.variantSelectorTextColor || globalPrimaryText};
  --bundle-variant-selector-border-radius: ${s.variantSelectorBorderRadius || 8}px;

  /* QUANTITY SELECTOR */
  --bundle-quantity-selector-bg: ${s.quantitySelectorBgColor || globalPrimaryButton};
  --bundle-quantity-selector-text-color: ${s.quantitySelectorTextColor || globalButtonText};
  --bundle-quantity-selector-font-size: ${s.quantitySelectorFontSize || 16}px;
  --bundle-quantity-selector-border-radius: ${s.quantitySelectorBorderRadius || 8}px;

  /* PRODUCT CARD LAYOUT & DIMENSIONS (Phase 6) */
  --bundle-product-card-width: ${s.productCardWidth || 280}px;
  --bundle-product-card-height: ${s.productCardHeight || 420}px;
  --bundle-product-card-spacing: ${s.productCardSpacing || 20}px;
  --bundle-product-card-border-radius: ${s.productCardBorderRadius || 8}px;
  --bundle-product-card-padding: ${s.productCardPadding || 12}px;
  --bundle-product-card-border-width: ${s.productCardBorderWidth || 1}px;
  --bundle-product-card-border-color: ${s.productCardBorderColor || 'rgba(0,0,0,0.08)'};
  --bundle-product-card-shadow: ${s.productCardShadow || '0 2px 8px rgba(0,0,0,0.04)'};
  --bundle-product-card-hover-shadow: ${s.productCardHoverShadow || '0 8px 24px rgba(0,0,0,0.12)'};

  /* PRODUCT IMAGE (Phase 6) */
  --bundle-product-image-height: ${s.productImageHeight || 280}px;
  --bundle-product-image-border-radius: ${s.productImageBorderRadius || 6}px;
  --bundle-product-image-bg-color: ${s.productImageBgColor || '#F8F8F8'};

  /* PRODUCT MODAL STYLING (Phase 6) */
  --bundle-modal-bg-color: ${s.modalBgColor || '#FFFFFF'};
  --bundle-modal-border-radius: ${s.modalBorderRadius || 12}px;
  --bundle-modal-title-font-size: ${s.modalTitleFontSize || 28}px;
  --bundle-modal-title-font-weight: ${s.modalTitleFontWeight || 700};
  --bundle-modal-price-font-size: ${s.modalPriceFontSize || 22}px;
  --bundle-modal-variant-border-radius: ${s.modalVariantBorderRadius || 8}px;
  --bundle-modal-button-bg-color: ${s.modalButtonBgColor || '#000000'};
  --bundle-modal-button-text-color: ${s.modalButtonTextColor || '#FFFFFF'};
  --bundle-modal-button-border-radius: ${s.modalButtonBorderRadius || 8}px;

  /* PROMO BANNER (Full-Page Bundles) */
  --bundle-promo-banner-enabled: ${s.promoBannerEnabled !== false ? '1' : '0'};
  --bundle-promo-banner-bg: ${s.promoBannerBgColor || '#F3F4F6'};
  --bundle-promo-banner-title-color: ${s.promoBannerTitleColor || '#111827'};
  --bundle-promo-banner-title-font-size: ${s.promoBannerTitleFontSize || 28}px;
  --bundle-promo-banner-title-font-weight: ${s.promoBannerTitleFontWeight || 700};
  --bundle-promo-banner-subtitle-color: ${s.promoBannerSubtitleColor || '#6B7280'};
  --bundle-promo-banner-subtitle-font-size: ${s.promoBannerSubtitleFontSize || 16}px;
  --bundle-promo-banner-note-color: ${s.promoBannerNoteColor || '#9CA3AF'};
  --bundle-promo-banner-note-font-size: ${s.promoBannerNoteFontSize || 14}px;
  --bundle-promo-banner-radius: ${s.promoBannerBorderRadius || 16}px;
  --bundle-promo-banner-padding: ${s.promoBannerPadding || 32}px;

  /* FOOTER */
  --bundle-footer-bg: ${s.footerBgColor || globalFooterBg};
  --bundle-footer-total-bg: ${s.footerTotalBgColor || '#F6F6F6'};
  --bundle-footer-border-radius: ${s.footerBorderRadius || 8}px;
  --bundle-footer-padding: ${s.footerPadding || 16}px;
  --bundle-footer-final-price-color: ${s.footerFinalPriceColor || globalPrimaryText};
  --bundle-footer-final-price-font-size: ${s.footerFinalPriceFontSize || 18}px;
  --bundle-footer-final-price-font-weight: ${s.footerFinalPriceFontWeight || 700};
  --bundle-footer-strike-price-color: ${s.footerStrikePriceColor || globalSecondaryText};
  --bundle-footer-strike-font-size: ${s.footerStrikeFontSize || 14}px;
  --bundle-footer-strike-font-weight: ${s.footerStrikeFontWeight || 400};
  --bundle-footer-price-display: ${s.footerPriceVisibility !== false ? 'flex' : 'none'};
  --bundle-footer-back-button-bg: ${s.footerBackButtonBgColor || '#FFFFFF'};
  --bundle-footer-back-button-text: ${s.footerBackButtonTextColor || globalFooterText};
  --bundle-footer-back-button-border: ${s.footerBackButtonBorderColor || '#E3E3E3'};
  --bundle-footer-back-button-radius: ${s.footerBackButtonBorderRadius || 8}px;
  --bundle-footer-next-button-bg: ${s.footerNextButtonBgColor || globalPrimaryButton};
  --bundle-footer-next-button-text: ${s.footerNextButtonTextColor || globalButtonText};
  --bundle-footer-next-button-border: ${s.footerNextButtonBorderColor || globalPrimaryButton};
  --bundle-footer-next-button-radius: ${s.footerNextButtonBorderRadius || 8}px;
  --bundle-footer-discount-display: ${s.footerDiscountTextVisibility !== false ? 'block' : 'none'};
  --bundle-footer-progress-filled: ${s.footerProgressBarFilledColor || globalPrimaryButton};
  --bundle-footer-progress-empty: ${s.footerProgressBarEmptyColor || '#E3E3E3'};
  --bundle-success-message-font-size: ${s.successMessageFontSize || 16}px;
  --bundle-success-message-font-weight: ${s.successMessageFontWeight || 600};
  --bundle-success-message-text-color: ${s.successMessageTextColor || '#065F46'};
  --bundle-success-message-bg-color: ${s.successMessageBgColor || '#D1FAE5'};

  /* BUNDLE HEADER */
  --bundle-header-tab-active-bg: ${s.headerTabActiveBgColor || globalPrimaryButton};
  --bundle-header-tab-active-text: ${s.headerTabActiveTextColor || globalButtonText};
  --bundle-header-tab-inactive-bg: ${s.headerTabInactiveBgColor || '#FFFFFF'};
  --bundle-header-tab-inactive-text: ${s.headerTabInactiveTextColor || globalPrimaryText};
  --bundle-header-tab-radius: ${s.headerTabRadius || 67}px;
  --modal-step-title-color: ${s.modalStepTitleColor || globalPrimaryText};

  /* BUNDLE STEP BAR */
  --bundle-step-name-font-color: ${s.stepNameFontColor || globalPrimaryText};
  --bundle-step-name-font-size: ${s.stepNameFontSize || 16}px;
  --bundle-completed-step-checkmark-color: ${s.completedStepCheckMarkColor || globalButtonText};
  --bundle-completed-step-bg-color: ${s.completedStepBgColor || globalPrimaryButton};
  --bundle-completed-step-circle-border-color: ${s.completedStepCircleBorderColor || globalPrimaryButton};
  --bundle-completed-step-circle-border-radius: ${s.completedStepCircleBorderRadius || 50}px;
  --bundle-incomplete-step-bg-color: ${s.incompleteStepBgColor || '#FFFFFF'};
  --bundle-incomplete-step-circle-stroke-color: ${s.incompleteStepCircleStrokeColor || globalPrimaryButton};
  --bundle-incomplete-step-circle-stroke-radius: ${s.incompleteStepCircleStrokeRadius || 50}px;
  --bundle-step-bar-progress-filled-color: ${s.stepBarProgressFilledColor || globalPrimaryButton};
  --bundle-step-bar-progress-empty-color: ${s.stepBarProgressEmptyColor || '#C6C6C6'};

  /* TABS */
  --bundle-tabs-active-bg-color: ${s.tabsActiveBgColor || globalPrimaryButton};
  --bundle-tabs-active-text-color: ${s.tabsActiveTextColor || globalButtonText};
  --bundle-tabs-inactive-bg-color: ${s.tabsInactiveBgColor || '#FFFFFF'};
  --bundle-tabs-inactive-text-color: ${s.tabsInactiveTextColor || globalPrimaryText};
  --bundle-tabs-border-color: ${s.tabsBorderColor || globalPrimaryButton};
  --bundle-tabs-border-radius: ${s.tabsBorderRadius || 8}px;

  /* GENERAL */
  /* Empty State */
  --bundle-empty-state-card-bg: ${s.emptyStateCardBgColor || '#FFFFFF'};
  --bundle-empty-state-card-border: ${s.emptyStateCardBorderColor || '#F6F6F6'};
  --bundle-empty-state-text: ${s.emptyStateTextColor || globalSecondaryText};
  --bundle-empty-state-border-style: ${s.emptyStateBorderStyle || 'dashed'};
  /* Drawer */
  --bundle-drawer-bg: ${s.drawerBgColor || '#FFFFFF'};
  /* Add to Cart Button */
  --bundle-add-to-cart-button-bg: ${s.addToCartButtonBgColor || globalPrimaryButton};
  --bundle-add-to-cart-button-text: ${s.addToCartButtonTextColor || globalButtonText};
  --bundle-add-to-cart-button-radius: ${s.addToCartButtonBorderRadius || 8}px;
  /* Toasts */
  --bundle-toast-bg: ${s.toastBgColor || globalPrimaryButton};
  --bundle-toast-text: ${s.toastTextColor || globalButtonText};
  /* Bundle Design */
  --bundle-bg-color: ${s.bundleBgColor || '#FFFFFF'};
  --bundle-footer-scrollbar-color: ${s.footerScrollBarColor || globalPrimaryButton};
  /* Product Page Title */
  --bundle-product-page-title-font-color: ${s.productPageTitleFontColor || globalPrimaryText};
  --bundle-product-page-title-font-size: ${s.productPageTitleFontSize || 24}px;
  /* Bundle Upsell */
  --bundle-upsell-button-bg-color: ${s.bundleUpsellButtonBgColor || globalPrimaryButton};
  --bundle-upsell-border-color: ${s.bundleUpsellBorderColor || globalPrimaryButton};
  --bundle-upsell-text-color: ${s.bundleUpsellTextColor || globalButtonText};
  /* Filters */
  --bundle-filter-icon-color: ${s.filterIconColor || globalPrimaryButton};
  --bundle-filter-bg-color: ${s.filterBgColor || '#FFFFFF'};
  --bundle-filter-text-color: ${s.filterTextColor || globalPrimaryText};
  /* Bundle Header - Header Text */
  --bundle-conditions-text-color: ${s.conditionsTextColor || globalPrimaryText};
  --bundle-conditions-text-font-size: ${s.conditionsTextFontSize || 16}px;
  --bundle-discount-text-color: ${s.discountTextColor || globalPrimaryText};
  --bundle-discount-text-font-size: ${s.discountTextFontSize || 14}px;

  /* ========================================================================
     FULL-PAGE BUNDLE SPECIFIC VARIABLES
     These control the appearance of full-page standalone bundle pages
     ======================================================================== */

  /* Full-Page Layout Colors */
  --bundle-full-page-bg-color: ${s.fullPageBgColor || '#ECF4EC'};
  --bundle-full-page-footer-bg-color: ${s.fullPageFooterBgColor || '#ECF4EC'};
  --bundle-full-page-footer-border-color: ${s.fullPageFooterBorderColor || 'rgba(0, 0, 0, 0.1)'};

  /* Step Timeline */
  --bundle-step-timeline-circle-size: ${s.stepTimelineCircleSize || 69}px;
  --bundle-step-timeline-circle-bg: ${s.stepTimelineCircleBg || '#FFFFFF'};
  --bundle-step-timeline-circle-border: ${s.stepTimelineCircleBorder || globalPrimaryButton};
  --bundle-step-timeline-circle-border-width: ${s.stepTimelineCircleBorderWidth || 3}px;
  --bundle-step-timeline-circle-text-color: ${s.stepTimelineCircleTextColor || globalPrimaryText};
  --bundle-step-timeline-circle-font-size: ${s.stepTimelineCircleFontSize || 20}px;
  --bundle-step-timeline-completed-bg: ${s.stepTimelineCompletedBg || globalPrimaryButton};
  --bundle-step-timeline-completed-text: ${s.stepTimelineCompletedText || globalButtonText};
  --bundle-step-timeline-locked-border: ${s.stepTimelineLockedBorder || '#808080'};
  --bundle-step-timeline-locked-text: ${s.stepTimelineLockedText || '#808080'};
  --bundle-step-timeline-line-color: ${s.stepTimelineLineColor || '#808080'};
  --bundle-step-timeline-line-completed: ${s.stepTimelineLineCompleted || globalPrimaryButton};
  --bundle-step-timeline-line-width: ${s.stepTimelineLineWidth || 308}px;
  --bundle-step-timeline-line-height: ${s.stepTimelineLineHeight || 3}px;
  --bundle-step-timeline-gap: ${s.stepTimelineGap || 308}px;
  --bundle-step-timeline-name-font-size: ${s.stepTimelineNameFontSize || 19.788}px;
  --bundle-step-timeline-name-color: ${s.stepTimelineNameColor || globalPrimaryText};

  /* Bundle Header (Instructions) */
  --bundle-full-page-title-font-size: ${s.fullPageTitleFontSize || 20}px;
  --bundle-full-page-title-color: ${s.fullPageTitleColor || globalPrimaryText};
  --bundle-full-page-instruction-font-size: ${s.fullPageInstructionFontSize || 20}px;
  --bundle-full-page-instruction-color: ${s.fullPageInstructionColor || globalPrimaryText};

  /* Category Tabs */
  --bundle-category-tab-indicator-size: ${s.categoryTabIndicatorSize || 28}px;
  --bundle-category-tab-label-font-size: ${s.categoryTabLabelFontSize || 20}px;
  --bundle-category-tab-label-color: ${s.categoryTabLabelColor || globalPrimaryText};
  --bundle-category-tab-active-underline-width: ${s.categoryTabActiveUnderlineWidth || 177}px;
  --bundle-category-tab-active-underline-height: ${s.categoryTabActiveUnderlineHeight || 5.5}px;
  --bundle-category-tab-active-underline-color: ${s.categoryTabActiveUnderlineColor || globalPrimaryButton};

  /* Product Grid */
  --bundle-full-page-product-grid-columns: ${s.fullPageProductGridColumns || 3};
  --bundle-full-page-product-image-height: ${s.fullPageProductImageHeight || 200}px;
  --bundle-full-page-product-image-bg: ${s.fullPageProductImageBg || '#FFFFFF'};
  --bundle-full-page-product-image-border-radius: ${s.fullPageProductImageBorderRadius || 8}px;
  --bundle-full-page-product-image-border-color: ${s.fullPageProductImageBorderColor || 'rgba(0, 0, 0, 0.04)'};
  --bundle-full-page-selected-badge-bg: ${s.fullPageSelectedBadgeBg || '#DE4139'};
  --bundle-full-page-selected-badge-color: ${s.fullPageSelectedBadgeColor || '#FFFFFF'};
  --bundle-full-page-price-row-gradient-start: ${s.fullPagePriceRowGradientStart || '#F9FAFB'};
  --bundle-full-page-price-row-gradient-end: ${s.fullPagePriceRowGradientEnd || '#F3F4F6'};
  --bundle-full-page-price-row-border: ${s.fullPagePriceRowBorder || 'rgba(0, 0, 0, 0.06)'};
  --bundle-full-page-variant-border: ${s.fullPageVariantBorder || '#E5E7EB'};
  --bundle-full-page-variant-border-hover: ${s.fullPageVariantBorderHover || '#9CA3AF'};
  --bundle-full-page-added-button-gradient-start: ${s.fullPageAddedButtonGradientStart || '#10B981'};
  --bundle-full-page-added-button-gradient-end: ${s.fullPageAddedButtonGradientEnd || '#059669'};

  /* Bottom Footer */
  --bundle-full-page-footer-header-font-size: ${s.fullPageFooterHeaderFontSize || 20}px;
  --bundle-full-page-footer-header-color: ${s.fullPageFooterHeaderColor || globalPrimaryText};
  --bundle-full-page-footer-scrollbar-color: ${s.fullPageFooterScrollbarColor || globalPrimaryButton};
  --bundle-full-page-footer-product-bg: ${s.fullPageFooterProductBg || '#FFFFFF'};
  --bundle-full-page-footer-product-border: ${s.fullPageFooterProductBorder || globalPrimaryButton};
  --bundle-full-page-footer-product-border-radius: ${s.fullPageFooterProductBorderRadius || 8}px;
  --bundle-full-page-footer-quantity-badge-bg: ${s.fullPageFooterQuantityBadgeBg || globalPrimaryButton};
  --bundle-full-page-footer-quantity-badge-color: ${s.fullPageFooterQuantityBadgeColor || globalButtonText};
  --bundle-full-page-footer-product-title-color: ${s.fullPageFooterProductTitleColor || globalPrimaryText};
  --bundle-full-page-footer-product-price-color: ${s.fullPageFooterProductPriceColor || globalPrimaryText};
  --bundle-full-page-footer-remove-color: ${s.fullPageFooterRemoveColor || '#BD0000'};
  --bundle-full-page-footer-total-label-color: ${s.fullPageFooterTotalLabelColor || globalPrimaryText};
  --bundle-full-page-footer-total-label-font-size: ${s.fullPageFooterTotalLabelFontSize || 16}px;
  --bundle-full-page-footer-total-price-color: ${s.fullPageFooterTotalPriceColor || globalPrimaryText};
  --bundle-full-page-footer-total-price-font-size: ${s.fullPageFooterTotalPriceFontSize || 24}px;
  --bundle-full-page-footer-back-btn-bg: ${s.footerBackButtonBgColor || s.fullPageFooterBackBtnBg || '#FFFFFF'};
  --bundle-full-page-footer-back-btn-color: ${s.footerBackButtonTextColor || s.fullPageFooterBackBtnColor || globalPrimaryText};
  --bundle-full-page-footer-back-btn-border: ${s.footerBackButtonBorderColor || '#E5E7EB'};
  --bundle-full-page-footer-back-btn-hover: ${s.fullPageFooterBackBtnHover || '#F3F4F6'};
  --bundle-full-page-footer-next-btn-bg: ${s.footerNextButtonBgColor || s.fullPageFooterNextBtnBg || globalPrimaryButton};
  --bundle-full-page-footer-next-btn-color: ${s.footerNextButtonTextColor || s.fullPageFooterNextBtnColor || globalButtonText};
  --bundle-full-page-footer-next-btn-hover: ${s.fullPageFooterNextBtnHover || '#5F2DD8'};
  --bundle-full-page-footer-nav-btn-font-size: ${s.fullPageFooterNavBtnFontSize || 14}px;
  --bundle-full-page-footer-nav-btn-radius: ${s.footerBackButtonBorderRadius || s.footerNextButtonBorderRadius || s.fullPageFooterNavBtnRadius || 8}px;
  --bundle-full-page-footer-no-selections-color: ${s.fullPageFooterNoSelectionsColor || '#808080'};

  /* Loading State */
  --bundle-full-page-loading-spinner-border: ${s.fullPageLoadingSpinnerBorder || '#F0F3EB'};
  --bundle-full-page-loading-spinner-active: ${s.fullPageLoadingSpinnerActive || globalPrimaryButton};
}

/* PRODUCT CARD STYLING */
#bundle-builder-app .product-card,
.bundle-builder-modal .modal-body .product-card {
  background-color: var(--bundle-product-card-bg);
}

#bundle-builder-app .product-card .product-title,
.bundle-builder-modal .modal-body .product-card .product-title {
  color: var(--bundle-product-card-font-color);
  font-size: var(--bundle-product-card-font-size);
  font-weight: var(--bundle-product-card-font-weight);
}

#bundle-builder-app .product-card .product-image img,
.bundle-builder-modal .modal-body .product-card .product-image img {
  object-fit: var(--bundle-product-card-image-fit);
}

#bundle-builder-app .product-card .product-price,
.bundle-builder-modal .modal-body .product-card .product-price {
  display: var(--bundle-product-price-display);
  color: var(--bundle-product-final-price-color);
  font-size: var(--bundle-product-final-price-font-size);
  font-weight: var(--bundle-product-final-price-font-weight);
}

#bundle-builder-app .product-grid,
.bundle-builder-modal .modal-body .product-grid {
  display: grid;
  grid-template-columns: repeat(var(--bundle-product-cards-per-row), 1fr);
  gap: 16px;
}

/* PRODUCT CARD SUB-ELEMENTS IN MODAL */
.bundle-builder-modal .modal-body .product-card .product-quantity-selector {
  background-color: var(--bundle-quantity-selector-bg);
  color: var(--bundle-quantity-selector-text-color);
  border-radius: var(--bundle-quantity-selector-border-radius);
}

.bundle-builder-modal .modal-body .product-card .variant-selector {
  background-color: var(--bundle-variant-selector-bg);
  color: var(--bundle-variant-selector-text-color);
  border-radius: var(--bundle-variant-selector-border-radius);
}

.bundle-builder-modal .modal-body .product-card .product-add-btn {
  background-color: var(--bundle-button-bg);
  color: var(--bundle-button-text-color);
  font-size: var(--bundle-button-font-size);
  font-weight: var(--bundle-button-font-weight);
  border-radius: var(--bundle-button-border-radius);
}

/* BUTTON STYLING */
#bundle-builder-app .add-bundle-to-cart,
.bundle-builder-modal .quantity-control-button {
  background-color: var(--bundle-button-bg);
  color: var(--bundle-button-text-color);
  font-size: var(--bundle-button-font-size);
  font-weight: var(--bundle-button-font-weight);
  border-radius: var(--bundle-button-border-radius);
  border: none;
}

#bundle-builder-app .add-bundle-to-cart:hover {
  background-color: var(--bundle-button-hover-bg);
}

#bundle-builder-app .add-bundle-to-cart.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

#bundle-builder-app .button-price-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

#bundle-builder-app .button-price-strike {
  text-decoration: line-through;
  font-size: 0.8em;
  opacity: 0.7;
}

#bundle-builder-app .button-price-final {
  font-size: 1em;
}

/* FOOTER STYLING */
.bundle-builder-modal .bundle-footer-messaging,
.bundle-builder-modal .modal-footer-discount-messaging {
  background-color: var(--bundle-footer-bg);
  border-radius: var(--bundle-footer-border-radius);
  padding: var(--bundle-footer-padding);
}

.bundle-builder-modal .modal-footer {
  background-color: var(--bundle-footer-bg);
  border-radius: var(--bundle-footer-border-radius);
  padding: var(--bundle-footer-padding);
  display: flex;
  align-items: center;
  justify-content: center;
}

.bundle-builder-modal .modal-footer-grouped-content {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.bundle-builder-modal .modal-footer-total-pill {
  background-color: var(--bundle-footer-total-bg);
  display: var(--bundle-footer-price-display);
  padding: 6px 16px;
  border-radius: 6px;
  align-items: center;
  gap: 8px;
}

.bundle-builder-modal .modal-footer-buttons-row {
  display: flex;
  gap: 15px;
  align-items: center;
}

.bundle-builder-modal .modal-footer .total-price-strike {
  color: var(--bundle-footer-strike-price-color);
  font-size: var(--bundle-footer-strike-font-size);
  font-weight: var(--bundle-footer-strike-font-weight);
  text-decoration: line-through;
}

.bundle-builder-modal .modal-footer .total-price-final {
  color: var(--bundle-footer-final-price-color);
  font-size: var(--bundle-footer-final-price-font-size);
  font-weight: var(--bundle-footer-final-price-font-weight);
}

.bundle-builder-modal .modal-footer .cart-badge-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.bundle-builder-modal .modal-footer .cart-icon {
  display: inline-block;
  vertical-align: middle;
}

.bundle-builder-modal .modal-footer .modal-nav-button.prev-button {
  background-color: var(--bundle-footer-back-button-bg);
  color: var(--bundle-footer-back-button-text);
  border: 1px solid var(--bundle-footer-back-button-border);
  border-radius: var(--bundle-footer-back-button-radius);
  padding: 12px 56px;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.bundle-builder-modal .modal-footer .modal-nav-button.next-button {
  background-color: var(--bundle-footer-next-button-bg);
  color: var(--bundle-footer-next-button-text);
  border: 1px solid var(--bundle-footer-next-button-border);
  border-radius: var(--bundle-footer-next-button-radius);
  padding: 12px 56px;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.bundle-builder-modal .modal-footer-progress-fill,
.bundle-builder-modal .progress-fill,
#bundle-builder-app .progress-fill {
  background-color: var(--bundle-footer-progress-filled);
}

.bundle-builder-modal .modal-footer-progress-bar,
.bundle-builder-modal .progress-bar,
#bundle-builder-app .progress-bar {
  background-color: var(--bundle-footer-progress-empty);
}

/* EMPTY STATE CARDS IN MODAL */
.bundle-builder-modal .modal-body .empty-state-card {
  background-color: var(--bundle-empty-state-card-bg);
  border: 2.6px var(--bundle-empty-state-border-style) var(--bundle-empty-state-card-border);
}

.bundle-builder-modal .modal-body .empty-state-card-icon,
.bundle-builder-modal .modal-body .empty-state-card-text {
  color: var(--bundle-empty-state-text);
}

/* MODAL HEADER STYLING */
.bundle-builder-modal .modal-step-title {
  color: var(--modal-step-title-color);
}

/* BUNDLE HEADER TABS STYLING */
.bundle-builder-modal .modal-tabs .bundle-header-tab {
  border-radius: var(--bundle-header-tab-radius);
}

.bundle-builder-modal .modal-tabs .bundle-header-tab:not(.active):not(.locked) {
  background-color: var(--bundle-header-tab-inactive-bg);
  color: var(--bundle-header-tab-inactive-text);
}

.bundle-builder-modal .modal-tabs .bundle-header-tab.active {
  background-color: var(--bundle-header-tab-active-bg);
  color: var(--bundle-header-tab-active-text);
  border: 1px solid var(--bundle-header-tab-active-bg);
}

/* GENERAL STYLING */
#bundle-builder-app,
.bundle-builder-modal .modal-content {
  background-color: var(--bundle-bg-color);
}

/* RESPONSIVE */
@media (max-width: 768px) {
  #bundle-builder-app .product-grid,
  .bundle-builder-modal .modal-body .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  #bundle-builder-app .product-grid,
  .bundle-builder-modal .modal-body .product-grid {
    grid-template-columns: 1fr;
  }
}

/* ============================================
   MERCHANT CUSTOM CSS
   Add your own CSS rules below to further
   customize the bundle widget appearance.
   ============================================ */
${customCss ? customCss : '/* No custom CSS defined */'}
`.trim();
}
