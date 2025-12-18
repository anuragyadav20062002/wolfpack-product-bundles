/**
 * Bundle Widget Minimal Loader (< 10KB)
 *
 * This is a tiny loader script that stays within Shopify's 10KB app block limit.
 * It dynamically loads the full bundle widget from the app server.
 *
 * ============================================================================
 * ARCHITECTURE OVERVIEW
 * ============================================================================
 *
 * THREE-TIER LOADING SYSTEM:
 * 1. This Loader (< 10KB) - Embedded in Shopify theme, detects bundle type
 * 2. Components Library - Shared utilities (CurrencyManager, PricingCalculator, etc.)
 * 3. Widget Files - Product-page or full-page specific implementations
 *
 * LOADING SEQUENCE:
 * 1. Loader detects bundle type from container data-bundle-type attribute
 * 2. Loads unified CSS (same design for both bundle types)
 * 3. Loads components library (shared code)
 * 4. Loads appropriate widget (product-page or full-page)
 * 5. Widget initializes, imports from components library, renders UI
 *
 * ============================================================================
 * BACKWARD COMPATIBILITY STRATEGY
 * ============================================================================
 *
 * WIDGET TYPE DETECTION:
 * - Default: product_page (for existing merchants without data-bundle-type)
 * - Opt-in: full_page (requires explicit data-bundle-type="full_page")
 * - Result: Existing bundles continue working without any changes
 *
 * CSS LOADING:
 * - Single CSS file serves both bundle types (unified design)
 * - API tries product_page settings first (most common)
 * - Falls back to full_page settings if needed
 * - Finally uses hardcoded defaults if no settings exist
 * - Result: No data migration needed, existing designs preserved
 *
 * WIDGET FILES:
 * - Product-page widget: Original functionality, vertical layout
 * - Full-page widget: New functionality, horizontal tabs layout
 * - Both import from shared components library
 * - Result: No code duplication, consistent behavior
 *
 * ============================================================================
 * BENEFITS OF THIS ARCHITECTURE
 * ============================================================================
 *
 * 1. FILE SIZE: Passes Shopify's 10KB app block limit
 * 2. UPDATES: Faster updates without redeploying extension
 * 3. FLEXIBILITY: No file size restrictions for main logic
 * 4. MAINTAINABILITY: Shared code reduces duplication
 * 5. CONSISTENCY: Same CSS and utilities for both bundle types
 * 6. COMPATIBILITY: Existing merchants' bundles work without changes
 * 7. SCALABILITY: Easy to add new bundle types in the future
 *
 * ============================================================================
 */
(function () {
  "use strict";

  console.log("[Bundle Widget] 🚀 Small loader script executing...");

  // Prevent multiple initializations
  if (window.__bundleWidgetLoading || window.__bundleWidgetLoaded) {
    console.log("[Bundle Widget] Already loading or loaded");
    return;
  }
  window.__bundleWidgetLoading = true;
  console.log("[Bundle Widget] ✅ Initialization flag set");

  // Dynamic app URL detection
  function getAppUrl() {
    // Check if we're in Shopify admin/theme editor (development context)
    const isDevelopment =
      window.location.host.includes('myshopify') ||
      window.location.search.includes('preview_theme_id') ||
      window.location.search.includes('preview_key') ||
      window.location.pathname.includes('/editor');

    // 1. Check global variable from Liquid (auto-updated from shop metafield)
    if (window.__BUNDLE_APP_URL__) {
      console.log('[Bundle Widget] Using app URL from server config:', window.__BUNDLE_APP_URL__);
      return window.__BUNDLE_APP_URL__;
    }

    // 2. Fallback to production URL (will show warning)
    const productionUrl = "https://wolfpack-product-bundle-app.onrender.com";
    console.warn('[Bundle Widget] ⚠️ No app URL configured in shop metafield or theme settings, using production fallback');

    return productionUrl;
  }

  // Configuration
  const CONFIG = {
    // App server URL - dynamically determined based on environment
    appUrl: getAppUrl(),

    // Script path on app server
    scriptPath: "/assets/bundle-widget-full",

    // Widget version - increment this when deploying updates to force cache invalidation
    // Format: MAJOR.MINOR.PATCH (following semantic versioning)
    version: "1.0.4",

    // Retry configuration
    maxRetries: 3,
    retryDelay: 1000, // 1 second
  };

  /**
   * Generates the appropriate URL for loading external assets
   *
   * Hybrid Strategy for Optimal Performance & Scale:
   * -------------------------------------------------
   * 1. PRIMARY: App Proxy (for production storefronts)
   *    - Same-origin requests through Shopify's infrastructure
   *    - Benefits: CDN caching, no CORS, better DDoS protection
   *    - Used when window.Shopify exists (live storefront)
   *
   * 2. FALLBACK: Direct URL (for development/testing)
   *    - Direct connection to app server
   *    - Used when outside Shopify environment or on dev stores
   *
   * Development Store Detection:
   * - Dev stores have mandatory password protection (cannot be removed)
   * - App proxy returns 302 redirect on password-protected stores
   * - Solution: Use direct URLs for dev stores (detected by domain pattern)
   *
   * Scale Considerations:
   * - App proxy routes through Shopify's CDN and edge network
   * - Handles thousands of concurrent users during sales/traffic spikes
   * - Reduces load on your app server (only unique CSS fetches hit backend)
   *
   * @param {string} path - API path (e.g., "/api/design-settings/shop")
   * @returns {string} - Full URL to use for the request
   */
  function getAssetUrl(path) {
    const isShopifyStorefront = window.Shopify && window.Shopify.shop;
    const shopDomain = window.Shopify?.shop || '';

    // Detect development store (pattern: xxx.myshopify.com without custom domain)
    // Dev stores have mandatory password protection, so app proxy won't work
    const isDevelopmentStore = shopDomain.includes('.myshopify.com');

    if (isShopifyStorefront && !isDevelopmentStore) {
      // PRODUCTION: Use app proxy for better scale and performance
      console.log('[Bundle Widget] 🚀 Using Shopify App Proxy (CDN-cached)');
      return `/apps/product-bundles${path}`;
    } else {
      // DEVELOPMENT: Use direct URL for dev stores or testing outside Shopify
      const reason = isDevelopmentStore ? 'development store (password protected)' : 'testing outside Shopify';
      console.log(`[Bundle Widget] 🔧 Using direct app URL (${reason})`);
      return `${CONFIG.appUrl}${path}`;
    }
  }

  /**
   * Loads design settings CSS from the app server (via app proxy for scale)
   * @param {string} bundleType - The bundle type ('product_page' or 'full_page')
   */
  function loadDesignCSS(bundleType) {
    const shopDomain = window.Shopify?.shop || null;

    if (!shopDomain) {
      console.warn("[Bundle Widget] ⚠️ Cannot load design CSS: Shopify.shop not available");
      return;
    }

    if (!bundleType) {
      console.error("[Bundle Widget] ❌ Cannot load design CSS: bundleType is required");
      return;
    }

    // Use app proxy path (without .css) - route will set Content-Type: text/css
    // Add bundleType and version parameters for cache control
    const cssUrl = getAssetUrl(`/api/design-settings/${shopDomain}`) + `?bundleType=${bundleType}&v=${CONFIG.version}`;

    console.log("[Bundle Widget] Loading design CSS from:", cssUrl, "for bundle type:", bundleType);

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssUrl;
    link.type = "text/css";

    link.onload = function () {
      console.log("[Bundle Widget] ✅ Design CSS loaded successfully");
    };

    link.onerror = function () {
      console.warn("[Bundle Widget] ⚠️ Failed to load design CSS, using default styles");
    };

    document.head.appendChild(link);
  }

  /**
   * Detects which bundle type is needed based on container attributes
   *
   * BACKWARD COMPATIBILITY:
   * ------------------------
   * - If data-bundle-type="full_page" is found, loads full-page widget
   * - If data-bundle-type is missing or set to "product_page", loads product-page widget
   * - Default: product_page (for existing merchants without data-bundle-type attribute)
   *
   * This ensures:
   * 1. Existing product-page bundles continue working without changes
   * 2. New full-page bundles explicitly opt-in with data-bundle-type="full_page"
   * 3. No breaking changes for merchants who deployed before this refactor
   *
   * Container Example:
   * <div id="bundle-builder-app" data-bundle-type="full_page"></div>
   */
  function detectBundleType() {
    const containers = document.querySelectorAll("#bundle-builder-app");

    for (const container of containers) {
      const bundleType = container.dataset.bundleType;
      if (bundleType === 'full_page') {
        return 'full_page';
      }
    }

    // Default to product_page for backward compatibility
    // This ensures existing merchants' bundles continue working
    return 'product_page';
  }

  /**
   * Loads the shared components library first (required by both widgets)
   *
   * NEW ARCHITECTURE (Post-Refactor):
   * ----------------------------------
   * Components library contains all shared utilities and UI generators:
   * - BUNDLE_WIDGET constants
   * - CurrencyManager
   * - BundleDataManager
   * - PricingCalculator
   * - ToastManager
   * - TemplateManager
   * - ComponentGenerator
   *
   * This library is loaded BEFORE the widget-specific files to ensure:
   * 1. No code duplication between product-page and full-page widgets
   * 2. Consistent behavior across both bundle types
   * 3. Easier maintenance - fix bugs in one place
   * 4. Smaller bundle sizes for each widget file
   *
   * Uses ES6 modules (import/export) for proper dependency management
   */
  function loadComponentsLibrary(callback) {
    const scriptUrl = getAssetUrl('/assets/bundle-widget-components') + `?v=${CONFIG.version}`;

    console.log('[Bundle Widget] Loading components library:', scriptUrl);

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.type = "module"; // ES6 module with exports

    script.onload = function () {
      console.log("[Bundle Widget] ✅ Components library loaded");
      callback();
    };

    script.onerror = function (error) {
      console.error("[Bundle Widget] ❌ Failed to load components library", error);
      showLoadError();
    };

    document.head.appendChild(script);
  }

  /**
   * Loads the appropriate widget based on bundle type (product-page or full-page)
   *
   * WIDGET SELECTION LOGIC:
   * -----------------------
   * - Product Page Widget: Vertical step boxes layout (default)
   * - Full Page Widget: Horizontal tabs layout (when data-bundle-type="full_page")
   *
   * Both widgets:
   * 1. Import shared utilities from bundle-widget-components.js
   * 2. Use the same CSS variables (unified design)
   * 3. Implement the same business logic
   * 4. Differ only in UI layout and interaction patterns
   *
   * Loading sequence:
   * 1. Detect bundle type from container attribute
   * 2. Load appropriate widget file from app server
   * 3. Widget initializes and imports from components library
   * 4. Widget fetches bundle data and renders UI
   *
   * BACKWARD COMPATIBILITY:
   * - Defaults to product-page widget if no bundle type specified
   * - Existing merchants' bundles continue working without changes
   */
  function loadAppropriateWidget(retryCount = 0) {
    const bundleType = detectBundleType();
    const widgetPath = bundleType === 'full_page'
      ? '/assets/bundle-widget-full-page'
      : '/assets/bundle-widget-product-page';

    const scriptUrl = getAssetUrl(widgetPath) + `?v=${CONFIG.version}`;

    console.log(
      `[Bundle Widget] Loading ${bundleType} widget from: ${scriptUrl} (attempt ${retryCount + 1}/${CONFIG.maxRetries})`
    );

    // Create script element
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.type = "module"; // ES6 module (imports from components library)

    // Success handler
    script.onload = function () {
      console.log(`[Bundle Widget] ✅ ${bundleType} widget loaded successfully`);
      window.__bundleWidgetLoaded = true;
      window.__bundleWidgetLoading = false;

      // Trigger custom event for any listeners
      window.dispatchEvent(new CustomEvent("bundleWidgetLoaded"));
    };

    // Error handler with retry logic
    script.onerror = function (error) {
      console.error(
        `[Bundle Widget] ❌ Failed to load ${bundleType} widget (attempt ${retryCount + 1}/${CONFIG.maxRetries})`,
        error
      );

      // Retry if we haven't exceeded max retries
      if (retryCount < CONFIG.maxRetries - 1) {
        console.log(
          `[Bundle Widget] Retrying in ${CONFIG.retryDelay}ms...`
        );
        setTimeout(
          () => loadAppropriateWidget(retryCount + 1),
          CONFIG.retryDelay * (retryCount + 1)
        );
      } else {
        console.error(
          "[Bundle Widget] ❌ Max retries exceeded. Widget failed to load."
        );
        window.__bundleWidgetLoading = false;

        // Show user-friendly error message
        showLoadError();
      }
    };

    // Append to document head
    document.head.appendChild(script);
  }

  /**
   * Shows a user-friendly error message if the widget fails to load
   */
  function showLoadError() {
    const containers = document.querySelectorAll("#bundle-builder-app");

    containers.forEach((container) => {
      container.innerHTML = `
        <div style="padding: 20px; background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; color: #856404; text-align: center;">
          <h3 style="margin: 0 0 10px 0; color: #856404;">Bundle Widget Unavailable</h3>
          <p style="margin: 0;">Please refresh the page or contact support if the issue persists.</p>
        </div>
      `;
    });
  }

  /**
   * Initialize with retry logic
   */
  function init(retryCount = 0, maxRetries = 3) {
    console.log(`[Bundle Widget] Init called (attempt ${retryCount + 1}/${maxRetries + 1})`);

    const hasContainer = document.querySelector("#bundle-builder-app");
    console.log("[Bundle Widget] Container check result:", hasContainer ? "FOUND" : "NOT FOUND");

    if (hasContainer) {
      console.log("[Bundle Widget] ✅ Container found, detecting bundle type...");
      // Detect bundle type first
      const bundleType = detectBundleType();
      console.log("[Bundle Widget] Bundle type detected:", bundleType);

      // Load design CSS with the detected bundle type
      loadDesignCSS(bundleType);

      // Load components library first, then appropriate widget
      loadComponentsLibrary(() => {
        loadAppropriateWidget();
      });
    } else if (retryCount < maxRetries) {
      console.log(`[Bundle Widget] ⏳ Retrying in 300ms... (attempt ${retryCount + 2}/${maxRetries + 1})`);
      setTimeout(() => init(retryCount + 1, maxRetries), 300);
    } else {
      console.log("[Bundle Widget] ❌ No container found after all retries");
      window.__bundleWidgetLoading = false;
    }
  }

  // Wait for DOM, then initialize
  console.log("[Bundle Widget] 📋 DOM ready state:", document.readyState);

  if (document.readyState === "loading") {
    console.log("[Bundle Widget] ⏳ Waiting for DOMContentLoaded...");
    document.addEventListener("DOMContentLoaded", () => {
      console.log("[Bundle Widget] 🎯 DOMContentLoaded fired, starting init...");
      init();
    });
  } else {
    console.log("[Bundle Widget] ✅ DOM already ready, starting init...");
    init();
  }
})();
