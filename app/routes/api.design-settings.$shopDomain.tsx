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
        ...globalColorsSettings,
        ...footerSettings,
        ...stepBarSettings,
        ...generalSettings,
      };
    }

    const css = generateCSSFromSettings(finalSettings, bundleType);

    return new Response(css, {
      status: 200,
      headers: {
        "Content-Type": "text/css; charset=utf-8",
        // Cache for 1 hour (3600 seconds) - balances performance with design updates
        // Shopify's CDN/edge network will cache this when using app proxy
        // Reduces load on your app server during traffic spikes (sales, promotions)
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
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

function generateCSSFromSettings(s: any, bundleType: string): string {
  return `
/*
 * Wolfpack Bundle Widget - Design Settings
 * Bundle Type: ${bundleType}
 * Auto-generated from Design Control Panel
 */

:root {
  /* GLOBAL COLORS */
  --bundle-global-primary-button: ${s.globalPrimaryButtonColor || '#000000'};
  --bundle-global-button-text: ${s.globalButtonTextColor || '#FFFFFF'};
  --bundle-global-primary-text: ${s.globalPrimaryTextColor || '#000000'};
  --bundle-global-secondary-text: ${s.globalSecondaryTextColor || '#6B7280'};
  --bundle-global-footer-bg: ${s.globalFooterBgColor || '#FFFFFF'};
  --bundle-global-footer-text: ${s.globalFooterTextColor || '#000000'};

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

  /* BUNDLE HEADER */
  --bundle-header-tab-active-bg: ${s.headerTabActiveBgColor || '#000000'};
  --bundle-header-tab-active-text: ${s.headerTabActiveTextColor || '#FFFFFF'};
  --bundle-header-tab-inactive-bg: ${s.headerTabInactiveBgColor || '#FFFFFF'};
  --bundle-header-tab-inactive-text: ${s.headerTabInactiveTextColor || '#000000'};
  --bundle-header-tab-radius: ${s.headerTabRadius || 67}px;

  /* BUNDLE STEP BAR */
  --bundle-step-name-font-color: ${s.stepNameFontColor || '#000000'};
  --bundle-step-name-font-size: ${s.stepNameFontSize || 16}px;
  --bundle-completed-step-checkmark-color: ${s.completedStepCheckMarkColor || '#FFFFFF'};
  --bundle-completed-step-bg-color: ${s.completedStepBgColor || '#000000'};
  --bundle-completed-step-circle-border-color: ${s.completedStepCircleBorderColor || '#000000'};
  --bundle-completed-step-circle-border-radius: ${s.completedStepCircleBorderRadius || 50}px;
  --bundle-incomplete-step-bg-color: ${s.incompleteStepBgColor || '#FFFFFF'};
  --bundle-incomplete-step-circle-stroke-color: ${s.incompleteStepCircleStrokeColor || '#000000'};
  --bundle-incomplete-step-circle-stroke-radius: ${s.incompleteStepCircleStrokeRadius || 50}px;
  --bundle-step-bar-progress-filled-color: ${s.stepBarProgressFilledColor || '#000000'};
  --bundle-step-bar-progress-empty-color: ${s.stepBarProgressEmptyColor || '#C6C6C6'};

  /* TABS */
  --bundle-tabs-active-bg-color: ${s.tabsActiveBgColor || '#000000'};
  --bundle-tabs-active-text-color: ${s.tabsActiveTextColor || '#FFFFFF'};
  --bundle-tabs-inactive-bg-color: ${s.tabsInactiveBgColor || '#FFFFFF'};
  --bundle-tabs-inactive-text-color: ${s.tabsInactiveTextColor || '#000000'};
  --bundle-tabs-border-color: ${s.tabsBorderColor || '#000000'};
  --bundle-tabs-border-radius: ${s.tabsBorderRadius || 8}px;

  /* GENERAL */
  /* Empty State */
  --bundle-empty-state-card-bg: ${s.emptyStateCardBgColor || '#FFFFFF'};
  --bundle-empty-state-card-border: ${s.emptyStateCardBorderColor || '#F6F6F6'};
  --bundle-empty-state-text: ${s.emptyStateTextColor || '#9CA3AF'};
  --bundle-empty-state-border-style: ${s.emptyStateBorderStyle || 'dashed'};
  /* Drawer */
  --bundle-drawer-bg: ${s.drawerBgColor || '#FFFFFF'};
  /* Add to Cart Button */
  --bundle-add-to-cart-button-bg: ${s.addToCartButtonBgColor || '#000000'};
  --bundle-add-to-cart-button-text: ${s.addToCartButtonTextColor || '#FFFFFF'};
  /* Toasts */
  --bundle-toast-bg: ${s.toastBgColor || '#000000'};
  --bundle-toast-text: ${s.toastTextColor || '#FFFFFF'};
  /* Bundle Design */
  --bundle-bg-color: ${s.bundleBgColor || '#FFFFFF'};
  --bundle-footer-scrollbar-color: ${s.footerScrollBarColor || '#000000'};
  /* Product Page Title */
  --bundle-product-page-title-font-color: ${s.productPageTitleFontColor || '#000000'};
  --bundle-product-page-title-font-size: ${s.productPageTitleFontSize || 24}px;
  /* Bundle Upsell */
  --bundle-upsell-button-bg-color: ${s.bundleUpsellButtonBgColor || '#000000'};
  --bundle-upsell-border-color: ${s.bundleUpsellBorderColor || '#000000'};
  --bundle-upsell-text-color: ${s.bundleUpsellTextColor || '#FFFFFF'};
  /* Filters */
  --bundle-filter-icon-color: ${s.filterIconColor || '#000000'};
  --bundle-filter-bg-color: ${s.filterBgColor || '#FFFFFF'};
  --bundle-filter-text-color: ${s.filterTextColor || '#000000'};
  /* Bundle Header - Header Text */
  --bundle-conditions-text-color: ${s.conditionsTextColor || '#FFFFFF'};
  --bundle-conditions-text-font-size: ${s.conditionsTextFontSize || 16}px;
  --bundle-discount-text-color: ${s.discountTextColor || '#000000'};
  --bundle-discount-text-font-size: ${s.discountTextFontSize || 14}px;
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

.add-bundle-to-cart.disabled {
  opacity: 0.6 !important;
  cursor: not-allowed !important;
}

.button-price-wrapper {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
}

.button-price-strike {
  text-decoration: line-through !important;
  font-size: 0.8em !important;
  opacity: 0.7 !important;
}

.button-price-final {
  font-size: 1em !important;
}

/* FOOTER STYLING */
.bundle-footer-messaging,
.modal-footer-discount-messaging {
  background-color: var(--bundle-footer-bg) !important;
  border-radius: var(--bundle-footer-border-radius) !important;
  padding: var(--bundle-footer-padding) !important;
}

.modal-footer {
  background-color: var(--bundle-footer-bg) !important;
  border-radius: var(--bundle-footer-border-radius) !important;
  padding: var(--bundle-footer-padding) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.modal-footer-grouped-content {
  display: inline-flex !important;
  flex-direction: column !important;
  align-items: center !important;
  gap: 15px !important;
}

.modal-footer-total-pill {
  background-color: var(--bundle-footer-total-bg) !important;
  display: var(--bundle-footer-price-display) !important;
  padding: 6px 16px !important;
  border-radius: 6px !important;
  align-items: center !important;
  gap: 8px !important;
}

.modal-footer-buttons-row {
  display: flex !important;
  gap: 15px !important;
  align-items: center !important;
}

.total-price-strike {
  color: var(--bundle-footer-strike-price-color) !important;
  font-size: var(--bundle-footer-strike-font-size) !important;
  font-weight: var(--bundle-footer-strike-font-weight) !important;
  text-decoration: line-through !important;
}

.total-price-final {
  color: var(--bundle-footer-final-price-color) !important;
  font-size: var(--bundle-footer-final-price-font-size) !important;
  font-weight: var(--bundle-footer-final-price-font-weight) !important;
}

.cart-badge-wrapper {
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
}

.cart-icon {
  display: inline-block !important;
  vertical-align: middle !important;
}

.modal-footer .modal-nav-button.prev-button {
  background-color: var(--bundle-footer-back-button-bg) !important;
  color: var(--bundle-footer-back-button-text) !important;
  border: 1px solid var(--bundle-footer-back-button-border) !important;
  border-radius: var(--bundle-footer-back-button-radius) !important;
  padding: 12px 56px !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.5px !important;
}

.modal-footer .modal-nav-button.next-button {
  background-color: var(--bundle-footer-next-button-bg) !important;
  color: var(--bundle-footer-next-button-text) !important;
  border: 1px solid var(--bundle-footer-next-button-border) !important;
  border-radius: var(--bundle-footer-next-button-radius) !important;
  padding: 12px 56px !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.5px !important;
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
