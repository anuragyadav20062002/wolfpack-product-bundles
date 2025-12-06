import { type LoaderFunctionArgs } from "@remix-run/node";
import { AppLogger } from "../lib/logger";

// TODO: Import prisma when database integration is ready
// import { prisma } from "../db.server";

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
    // Get bundle type from query params (defaults to product_page)
    const url = new URL(request.url);
    const bundleType = url.searchParams.get("bundleType") || "product_page";

    AppLogger.info("Fetching design settings for CSS", {
      component: "api.design-settings.css",
      shopDomain,
      bundleType,
    });

    // TODO: Fetch from database
    // const designSettings = await prisma.designSettings.findUnique({
    //   where: { shopId_bundleType: { shopId: shopDomain, bundleType } }
    // });

    // Mock data for now - matches the defaults in design-control-panel
    const designSettings = {
      // Product Card
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
      // Button
      buttonBgColor: "#000000",
      buttonTextColor: "#FFFFFF",
      buttonFontSize: 16,
      buttonFontWeight: 600,
      buttonBorderRadius: 8,
      buttonHoverBgColor: "#333333",
      buttonAddToCartText: "Add to cart",
      // Quantity Selector
      quantitySelectorBgColor: "#000000",
      quantitySelectorTextColor: "#FFFFFF",
      quantitySelectorFontSize: 16,
      quantitySelectorBorderRadius: 8,
    };

    // Generate CSS with variables
    const css = generateCSSFromSettings(designSettings, bundleType);

    // Return CSS with proper content type and cache headers
    return new Response(css, {
      status: 200,
      headers: {
        "Content-Type": "text/css; charset=utf-8",
        "Cache-Control": "public, max-age=300", // Cache for 5 minutes
        "Access-Control-Allow-Origin": "*", // Allow cross-origin requests from storefront
      },
    });
  } catch (error) {
    AppLogger.error("Failed to generate design settings CSS", {
      component: "api.design-settings.css",
      shopDomain,
    }, error);

    // Return empty CSS on error so the page doesn't break
    return new Response("/* Error loading design settings */", {
      status: 500,
      headers: {
        "Content-Type": "text/css; charset=utf-8",
      },
    });
  }
}

/**
 * Generates CSS from design settings
 */
function generateCSSFromSettings(settings: any, bundleType: string): string {
  return `
/*
 * Wolfpack Bundle Widget - Design Settings
 * Bundle Type: ${bundleType}
 * Auto-generated from Design Control Panel
 */

:root {
  /* ===================================
   * PRODUCT CARD SETTINGS
   * =================================== */

  /* Background & Layout */
  --bundle-product-card-bg-color: ${settings.productCardBgColor};
  --bundle-product-card-font-color: ${settings.productCardFontColor};
  --bundle-product-card-font-size: ${settings.productCardFontSize}px;
  --bundle-product-card-font-weight: ${settings.productCardFontWeight};
  --bundle-product-card-image-fit: ${settings.productCardImageFit};
  --bundle-product-cards-per-row: ${settings.productCardsPerRow};

  /* Price Visibility */
  --bundle-product-price-display: ${settings.productPriceVisibility ? 'block' : 'none'};

  /* Strikethrough Price */
  --bundle-product-strike-price-color: ${settings.productStrikePriceColor};
  --bundle-product-strike-price-font-size: ${settings.productStrikeFontSize}px;
  --bundle-product-strike-price-font-weight: ${settings.productStrikeFontWeight};

  /* Final Price */
  --bundle-product-final-price-color: ${settings.productFinalPriceColor};
  --bundle-product-final-price-font-size: ${settings.productFinalPriceFontSize}px;
  --bundle-product-final-price-font-weight: ${settings.productFinalPriceFontWeight};

  /* ===================================
   * BUTTON SETTINGS
   * =================================== */

  --bundle-button-bg-color: ${settings.buttonBgColor};
  --bundle-button-text-color: ${settings.buttonTextColor};
  --bundle-button-font-size: ${settings.buttonFontSize}px;
  --bundle-button-font-weight: ${settings.buttonFontWeight};
  --bundle-button-border-radius: ${settings.buttonBorderRadius}px;
  --bundle-button-hover-bg-color: ${settings.buttonHoverBgColor || settings.buttonBgColor};

  /* ===================================
   * QUANTITY SELECTOR SETTINGS
   * =================================== */

  --bundle-quantity-selector-bg-color: ${settings.quantitySelectorBgColor};
  --bundle-quantity-selector-text-color: ${settings.quantitySelectorTextColor};
  --bundle-quantity-selector-font-size: ${settings.quantitySelectorFontSize}px;
  --bundle-quantity-selector-border-radius: ${settings.quantitySelectorBorderRadius}px;
}

/* Apply product card settings to modal product cards */
.modal-product-card {
  background-color: var(--bundle-product-card-bg-color) !important;
  color: var(--bundle-product-card-font-color) !important;
}

.modal-product-card .product-title {
  font-size: var(--bundle-product-card-font-size) !important;
  font-weight: var(--bundle-product-card-font-weight) !important;
  color: var(--bundle-product-card-font-color) !important;
}

.modal-product-card .product-image {
  object-fit: var(--bundle-product-card-image-fit) !important;
}

/* Product price visibility */
.modal-product-card .product-price-wrapper {
  display: var(--bundle-product-price-display) !important;
}

/* Strikethrough price styling */
.modal-product-card .compare-price,
.modal-product-card .product-original-price {
  color: var(--bundle-product-strike-price-color) !important;
  font-size: var(--bundle-product-strike-price-font-size) !important;
  font-weight: var(--bundle-product-strike-price-font-weight) !important;
  text-decoration: line-through !important;
}

/* Final price styling */
.modal-product-card .product-price,
.modal-product-card .product-final-price {
  color: var(--bundle-product-final-price-color) !important;
  font-size: var(--bundle-product-final-price-font-size) !important;
  font-weight: var(--bundle-product-final-price-font-weight) !important;
}

/* Product cards per row */
.bundle-products-grid,
.modal-products-grid {
  grid-template-columns: repeat(var(--bundle-product-cards-per-row), 1fr) !important;
}

/* Button styling */
.add-bundle-to-cart,
.bundle-add-to-cart-button,
button[data-bundle-action="add-to-cart"] {
  background-color: var(--bundle-button-bg-color) !important;
  color: var(--bundle-button-text-color) !important;
  font-size: var(--bundle-button-font-size) !important;
  font-weight: var(--bundle-button-font-weight) !important;
  border-radius: var(--bundle-button-border-radius) !important;
  border: none !important;
}

.add-bundle-to-cart:hover,
.bundle-add-to-cart-button:hover,
button[data-bundle-action="add-to-cart"]:hover {
  background-color: var(--bundle-button-hover-bg-color) !important;
}

/* Quantity selector styling */
.quantity-selector,
.bundle-quantity-selector,
.modal-quantity-selector {
  background-color: var(--bundle-quantity-selector-bg-color) !important;
  color: var(--bundle-quantity-selector-text-color) !important;
  font-size: var(--bundle-quantity-selector-font-size) !important;
  border-radius: var(--bundle-quantity-selector-border-radius) !important;
}

.quantity-selector button,
.bundle-quantity-selector button,
.modal-quantity-selector button {
  background-color: var(--bundle-quantity-selector-bg-color) !important;
  color: var(--bundle-quantity-selector-text-color) !important;
  border-radius: var(--bundle-quantity-selector-border-radius) !important;
}

/* Responsive adjustments for cards per row */
@media (max-width: 768px) {
  .bundle-products-grid,
  .modal-products-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 480px) {
  .bundle-products-grid,
  .modal-products-grid {
    grid-template-columns: 1fr !important;
  }
}
`.trim();
}
