import { type LoaderFunctionArgs } from "@remix-run/node";
import { AppLogger } from "../../lib/logger";
import { prisma } from "../../db.server";
import { sanitizeCss } from "../../lib/css-sanitizer";
import { generateCSSFromSettings } from "../../lib/css-generators";
import { BundleType } from "../../constants/bundle";

// auth: public — served via <link> tag in storefront theme; browser request, no session available.
// Data is non-sensitive CSS design tokens (colors, fonts, spacing).

/**
 * Shopify's App Proxy sometimes appends its auth params (e.g. ?oseid=VALUE) directly to the
 * URL, which corrupts query param values like bundleType=product_page?oseid=VALUE.
 * This helper strips the corruption and validates against known enum values.
 */
function sanitizeBundleType(raw: string | null): BundleType.PRODUCT_PAGE | BundleType.FULL_PAGE | null {
  if (!raw) return null;
  // Strip anything after the first '?' (proxy appends ?oseid=... directly to the value)
  const stripped = raw.split("?")[0].split("&")[0].trim();
  if (stripped === BundleType.PRODUCT_PAGE || stripped === BundleType.FULL_PAGE) {
    return stripped;
  }
  return null;
}

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
    const requestedBundleType = sanitizeBundleType(url.searchParams.get("bundleType"));

    // Unified CSS Strategy: Try product_page first, then full_page, then defaults
    // This allows merchants to use the same design for both bundle types
    const bundleTypesToTry: (BundleType.PRODUCT_PAGE | BundleType.FULL_PAGE)[] = requestedBundleType
      ? [requestedBundleType, requestedBundleType === BundleType.PRODUCT_PAGE ? BundleType.FULL_PAGE : BundleType.PRODUCT_PAGE]
      : [BundleType.PRODUCT_PAGE, BundleType.FULL_PAGE];

    AppLogger.info("Fetching design settings for CSS with fallback", {
      component: "api.design-settings.css",
      shopDomain,
      requestedBundleType: requestedBundleType || "not specified (will try product_page first)",
      fallbackOrder: bundleTypesToTry,
    });

    let designSettings = null;
    let usedBundleType = null;

    // Wrap all DB queries in a timeout so a cold DB connection never causes a 504.
    // If the timeout fires we fall through to defaults — the widget still renders,
    // just without custom DCP styling until the next page load (when DB is warm).
    const DB_TIMEOUT_MS = 8000;
    const dbTimeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), DB_TIMEOUT_MS)
    );

    // Try each bundle type in order until we find settings
    for (const bundleType of bundleTypesToTry) {
      const queryResult = await Promise.race([
        prisma.designSettings.findUnique({
          where: {
            shopId_bundleType: {
              shopId: shopDomain,
              bundleType,
            },
          },
        }),
        dbTimeout,
      ]);

      if (queryResult === null && !designSettings) {
        // Timeout fired — log and skip to defaults
        AppLogger.warn("Design settings DB query timed out, using defaults", {
          component: "api.design-settings.css",
          shopDomain,
          bundleType,
          timeoutMs: DB_TIMEOUT_MS,
        });
        break;
      }

      if (queryResult) {
        designSettings = queryResult;
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
      // Toast extended
      toastBorderRadius: 8,
      toastBorderColor: "#FFFFFF",
      toastBorderWidth: 0,
      toastFontSize: 13,
      toastFontWeight: 500,
      toastAnimationDuration: 300,
      toastBoxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      toastEnterFromBottom: false,
    };

    let finalSettings = defaultSettings;

    if (designSettings) {
      const globalColorsSettings = (designSettings as any).globalColorsSettings || {};
      const footerSettings = (designSettings as any).footerSettings || {};
      const stepBarSettings = (designSettings as any).stepBarSettings || {};
      const generalSettings = (designSettings as any).generalSettings || {};
      const promoBannerSettings = (designSettings as any).promoBannerSettings || {};

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
        // Toast extended settings (direct columns)
        toastBorderRadius: (designSettings as any).toastBorderRadius ?? defaultSettings.toastBorderRadius,
        toastBorderColor: (designSettings as any).toastBorderColor ?? defaultSettings.toastBorderColor,
        toastBorderWidth: (designSettings as any).toastBorderWidth ?? defaultSettings.toastBorderWidth,
        toastFontSize: (designSettings as any).toastFontSize ?? defaultSettings.toastFontSize,
        toastFontWeight: (designSettings as any).toastFontWeight ?? defaultSettings.toastFontWeight,
        toastAnimationDuration: (designSettings as any).toastAnimationDuration ?? defaultSettings.toastAnimationDuration,
        toastBoxShadow: (designSettings as any).toastBoxShadow ?? defaultSettings.toastBoxShadow,
        toastEnterFromBottom: (designSettings as any).toastEnterFromBottom ?? defaultSettings.toastEnterFromBottom,
        ...globalColorsSettings,
        ...footerSettings,
        ...stepBarSettings,
        ...generalSettings,
        ...promoBannerSettings,
      };
    }

    // Use the bundle type that had settings, or default to product_page for CSS generation
    const bundleTypeForCSS = usedBundleType || requestedBundleType || BundleType.PRODUCT_PAGE;

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

    // Build a stable ETag from the design settings last-modified time.
    // Browsers send If-None-Match on repeat visits; we respond with 304 when unchanged.
    // This allows long max-age caching without stale CSS after a merchant saves settings.
    const settingsUpdatedAt = designSettings?.updatedAt?.getTime() ?? 0;
    const etag = `"ds-${shopDomain}-${bundleTypeForCSS}-${settingsUpdatedAt}"`;

    const ifNoneMatch = request.headers.get("If-None-Match");
    if (ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
          "ETag": etag,
        },
      });
    }

    return new Response(css, {
      status: 200,
      headers: {
        "Content-Type": "text/css; charset=utf-8",
        // Long cache: browser caches for 1 hour, then revalidates via ETag.
        // When a merchant saves settings the ETag changes → browser fetches fresh CSS.
        // stale-while-revalidate allows serving stale while fetching in background.
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "ETag": etag,
        "Access-Control-Allow-Origin": "*",
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
