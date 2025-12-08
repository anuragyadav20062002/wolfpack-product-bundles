import { type LoaderFunctionArgs } from "@remix-run/node";
import { AppLogger } from "../lib/logger";
import { prisma } from "../db.server";

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
    const bundleType = (url.searchParams.get("bundleType") || "product_page") as "product_page" | "full_page";

    AppLogger.info("Fetching design settings for CSS", {
      component: "api.design-settings.css",
      shopDomain,
      bundleType,
    });

    const designSettings = await prisma.designSettings.findUnique({
      where: {
        shopId_bundleType: {
          shopId: shopDomain,
          bundleType,
        },
      },
    });

    const defaultSettings = {
      productCardBgColor: "#FFFFFF",
      productCardFontColor: "#000000",
      productCardFontSize: 16,
      productCardFontWeight: 400,
      productCardImageFit: "cover",
      productCardsPerRow: 3,
      productPriceVisibility: true,
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
    };

    let finalSettings = defaultSettings;

    if (designSettings) {
      const footerSettings = designSettings.footerSettings as any || {};
      const stepBarSettings = designSettings.stepBarSettings as any || {};
      const generalSettings = designSettings.generalSettings as any || {};
      const imagesSettings = designSettings.imagesSettings as any || {};

      finalSettings = {
        ...defaultSettings,
        productCardBgColor: designSettings.productCardBgColor || defaultSettings.productCardBgColor,
        productCardFontColor: designSettings.productCardFontColor || defaultSettings.productCardFontColor,
        productCardFontSize: designSettings.productCardFontSize || defaultSettings.productCardFontSize,
        productCardFontWeight: designSettings.productCardFontWeight || defaultSettings.productCardFontWeight,
        productCardImageFit: designSettings.productCardImageFit || defaultSettings.productCardImageFit,
        productCardsPerRow: designSettings.productCardsPerRow || defaultSettings.productCardsPerRow,
        productPriceVisibility: designSettings.productPriceVisibility !== undefined ? designSettings.productPriceVisibility : defaultSettings.productPriceVisibility,
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
        ...footerSettings,
        ...stepBarSettings,
        ...generalSettings,
        ...imagesSettings,
      };
    }

    const css = generateCSSFromSettings(finalSettings, bundleType);

    return new Response(css, {
      status: 200,
      headers: {
        "Content-Type": "text/css; charset=utf-8",
        "Cache-Control": "public, max-age=300",
        "Access-Control-Allow-Origin": "*",
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

function generateCSSFromSettings(s: any, bundleType: string): string {
  return `
/*
 * Wolfpack Bundle Widget - Design Settings
 * Bundle Type: ${bundleType}
 * Auto-generated from Design Control Panel
 */

:root {
  /* PRODUCT CARD */
  --bundle-product-card-bg: ${s.productCardBgColor || '#FFFFFF'};
  --bundle-product-card-font-color: ${s.productCardFontColor || '#000000'};
  --bundle-product-card-font-size: ${s.productCardFontSize || 16}px;
  --bundle-product-card-font-weight: ${s.productCardFontWeight || 400};
  --bundle-product-card-image-fit: ${s.productCardImageFit || 'cover'};
  --bundle-product-cards-per-row: ${s.productCardsPerRow || 3};
  --bundle-product-price-display: ${s.productPriceVisibility !== false ? 'block' : 'none'};
  --bundle-product-strike-price-color: ${s.productStrikePriceColor || '#8D8D8D'};
  --bundle-product-strike-font-size: ${s.productStrikeFontSize || 14}px;
  --bundle-product-strike-font-weight: ${s.productStrikeFontWeight || 400};
  --bundle-product-final-price-color: ${s.productFinalPriceColor || '#000000'};
  --bundle-product-final-price-font-size: ${s.productFinalPriceFontSize || 18}px;
  --bundle-product-final-price-font-weight: ${s.productFinalPriceFontWeight || 700};

  /* BUTTON */
  --bundle-button-bg: ${s.buttonBgColor || '#000000'};
  --bundle-button-text-color: ${s.buttonTextColor || '#FFFFFF'};
  --bundle-button-font-size: ${s.buttonFontSize || 16}px;
  --bundle-button-font-weight: ${s.buttonFontWeight || 600};
  --bundle-button-border-radius: ${s.buttonBorderRadius || 8}px;
  --bundle-button-hover-bg: ${s.buttonHoverBgColor || s.buttonBgColor || '#333333'};

  /* QUANTITY SELECTOR */
  --bundle-quantity-selector-bg: ${s.quantitySelectorBgColor || '#000000'};
  --bundle-quantity-selector-text-color: ${s.quantitySelectorTextColor || '#FFFFFF'};
  --bundle-quantity-selector-font-size: ${s.quantitySelectorFontSize || 16}px;
  --bundle-quantity-selector-border-radius: ${s.quantitySelectorBorderRadius || 8}px;

  /* FOOTER */
  --bundle-footer-bg: ${s.footerBgColor || '#FFFFFF'};
  --bundle-footer-total-bg: ${s.footerTotalBgColor || '#F6F6F6'};
  --bundle-footer-border-radius: ${s.footerBorderRadius || 8}px;
  --bundle-footer-padding: ${s.footerPadding || 16}px;
  --bundle-footer-final-price-color: ${s.footerFinalPriceColor || '#000000'};
  --bundle-footer-final-price-font-size: ${s.footerFinalPriceFontSize || 18}px;
  --bundle-footer-final-price-font-weight: ${s.footerFinalPriceFontWeight || 700};
  --bundle-footer-strike-price-color: ${s.footerStrikePriceColor || '#8D8D8D'};
  --bundle-footer-strike-font-size: ${s.footerStrikeFontSize || 14}px;
  --bundle-footer-strike-font-weight: ${s.footerStrikeFontWeight || 400};
  --bundle-footer-price-display: ${s.footerPriceVisibility !== false ? 'flex' : 'none'};
  --bundle-footer-back-button-bg: ${s.footerBackButtonBgColor || '#FFFFFF'};
  --bundle-footer-back-button-text: ${s.footerBackButtonTextColor || '#000000'};
  --bundle-footer-back-button-border: ${s.footerBackButtonBorderColor || '#E3E3E3'};
  --bundle-footer-back-button-radius: ${s.footerBackButtonBorderRadius || 8}px;
  --bundle-footer-next-button-bg: ${s.footerNextButtonBgColor || '#000000'};
  --bundle-footer-next-button-text: ${s.footerNextButtonTextColor || '#FFFFFF'};
  --bundle-footer-next-button-border: ${s.footerNextButtonBorderColor || '#000000'};
  --bundle-footer-next-button-radius: ${s.footerNextButtonBorderRadius || 8}px;
  --bundle-footer-discount-display: ${s.footerDiscountTextVisibility !== false ? 'block' : 'none'};
  --bundle-footer-progress-filled: ${s.footerProgressBarFilledColor || '#000000'};
  --bundle-footer-progress-empty: ${s.footerProgressBarEmptyColor || '#E3E3E3'};

  /* STEP BAR */
  --bundle-step-name-color: ${s.stepNameFontColor || '#000000'};
  --bundle-step-name-font-size: ${s.stepNameFontSize || 16}px;
  --bundle-step-completed-check-color: ${s.completedStepCheckMarkColor || '#FFFFFF'};
  --bundle-step-completed-bg: ${s.completedStepBgColor || '#000000'};
  --bundle-step-completed-border-color: ${s.completedStepCircleBorderColor || '#000000'};
  --bundle-step-completed-border-radius: ${s.completedStepCircleBorderRadius || 50}%;
  --bundle-step-incomplete-bg: ${s.incompleteStepBgColor || '#FFFFFF'};
  --bundle-step-incomplete-stroke: ${s.incompleteStepCircleStrokeColor || '#000000'};
  --bundle-step-incomplete-radius: ${s.incompleteStepCircleStrokeRadius || 50}%;
  --bundle-step-progress-filled: ${s.stepBarProgressFilledColor || '#000000'};
  --bundle-step-progress-empty: ${s.stepBarProgressEmptyColor || '#C6C6C6'};
  --bundle-tabs-active-bg: ${s.tabsActiveBgColor || '#000000'};
  --bundle-tabs-active-text: ${s.tabsActiveTextColor || '#FFFFFF'};
  --bundle-tabs-inactive-bg: ${s.tabsInactiveBgColor || '#FFFFFF'};
  --bundle-tabs-inactive-text: ${s.tabsInactiveTextColor || '#000000'};
  --bundle-tabs-border: ${s.tabsBorderColor || '#000000'};
  --bundle-tabs-border-radius: ${s.tabsBorderRadius || 8}px;

  /* GENERAL */
  --bundle-bg-color: ${s.bundleBgColor || '#FFFFFF'};
  --bundle-scrollbar-color: ${s.footerScrollBarColor || '#F6F6F6'};
  --bundle-title-color: ${s.productPageTitleFontColor || '#000000'};
  --bundle-title-font-size: ${s.productPageTitleFontSize || 16}px;
  --bundle-upsell-button-bg: ${s.bundleUpsellButtonBgColor || '#F6F6F6'};
  --bundle-upsell-border: ${s.bundleUpsellBorderColor || '#F6F6F6'};
  --bundle-upsell-text: ${s.bundleUpsellTextColor || '#F6F6F6'};
  --bundle-toast-bg: ${s.toastBgColor || '#000000'};
  --bundle-toast-text: ${s.toastTextColor || '#FFFFFF'};
  --bundle-filter-icon: ${s.filterIconColor || '#000000'};
  --bundle-filter-bg: ${s.filterBgColor || '#FFFFFF'};
  --bundle-filter-text: ${s.filterTextColor || '#000000'};

  /* IMAGES */
  --bundle-loading-gif: ${s.bundleLoadingGifUrl ? `url('${s.bundleLoadingGifUrl}')` : 'none'};
  --bundle-checkout-gif: ${s.checkoutGifUrl ? `url('${s.checkoutGifUrl}')` : 'none'};
}

/* PRODUCT CARD STYLING */
.product-card {
  background-color: var(--bundle-product-card-bg) !important;
}

.product-card .product-title {
  color: var(--bundle-product-card-font-color) !important;
  font-size: var(--bundle-product-card-font-size) !important;
  font-weight: var(--bundle-product-card-font-weight) !important;
}

.product-card .image-wrapper img {
  object-fit: var(--bundle-product-card-image-fit) !important;
}

.product-card .product-price {
  display: var(--bundle-product-price-display) !important;
  color: var(--bundle-product-final-price-color) !important;
  font-size: var(--bundle-product-final-price-font-size) !important;
  font-weight: var(--bundle-product-final-price-font-weight) !important;
}

.product-grid {
  display: grid !important;
  grid-template-columns: repeat(var(--bundle-product-cards-per-row), 1fr) !important;
  gap: 16px !important;
}

/* BUTTON STYLING */
.add-bundle-to-cart,
.quantity-control-button {
  background-color: var(--bundle-button-bg) !important;
  color: var(--bundle-button-text-color) !important;
  font-size: var(--bundle-button-font-size) !important;
  font-weight: var(--bundle-button-font-weight) !important;
  border-radius: var(--bundle-button-border-radius) !important;
  border: none !important;
}

.add-bundle-to-cart:hover {
  background-color: var(--bundle-button-hover-bg) !important;
}

/* FOOTER STYLING */
.bundle-footer-messaging,
.modal-footer-discount-messaging {
  background-color: var(--bundle-footer-bg) !important;
  border-radius: var(--bundle-footer-border-radius) !important;
  padding: var(--bundle-footer-padding) !important;
}

.modal-footer .modal-nav-button.prev-button {
  background-color: var(--bundle-footer-back-button-bg) !important;
  color: var(--bundle-footer-back-button-text) !important;
  border: 1px solid var(--bundle-footer-back-button-border) !important;
  border-radius: var(--bundle-footer-back-button-radius) !important;
}

.modal-footer .modal-nav-button.next-button {
  background-color: var(--bundle-footer-next-button-bg) !important;
  color: var(--bundle-footer-next-button-text) !important;
  border: 1px solid var(--bundle-footer-next-button-border) !important;
  border-radius: var(--bundle-footer-next-button-radius) !important;
}

.modal-footer-progress-fill,
.progress-fill {
  background-color: var(--bundle-footer-progress-filled) !important;
}

.modal-footer-progress-bar,
.progress-bar {
  background-color: var(--bundle-footer-progress-empty) !important;
}

/* GENERAL STYLING */
.bundle-builder-app,
.bundle-builder-modal {
  background-color: var(--bundle-bg-color) !important;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 480px) {
  .product-grid {
    grid-template-columns: 1fr !important;
  }
}
`.trim();
}
