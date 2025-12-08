/**
 * Bundle Widget Minimal Loader (< 10KB)
 *
 * This is a tiny loader script that stays within Shopify's 10KB app block limit.
 * It dynamically loads the full bundle widget from the app server.
 *
 * Architecture:
 * 1. This file (< 10KB) - Embedded in Shopify theme
 * 2. Full widget (no size limit) - Hosted at app server
 *
 * Benefits:
 * - Passes Shopify's file size validation
 * - Faster updates without redeploying extension
 * - No file size restrictions for main logic
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
    version: "1.0.3",

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
   *    - Used when outside Shopify environment
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

    if (isShopifyStorefront) {
      // PRODUCTION: Use app proxy for better scale and performance
      console.log('[Bundle Widget] 🚀 Using Shopify App Proxy (CDN-cached)');
      return `/apps/product-bundles${path}`;
    } else {
      // DEVELOPMENT: Use direct URL for testing outside Shopify
      console.log('[Bundle Widget] 🔧 Using direct app URL');
      return `${CONFIG.appUrl}${path}`;
    }
  }

  /**
   * Loads design settings CSS from the app server (via app proxy for scale)
   */
  function loadDesignCSS() {
    const shopDomain = window.Shopify?.shop || null;

    if (!shopDomain) {
      console.warn("[Bundle Widget] ⚠️ Cannot load design CSS: Shopify.shop not available");
      return;
    }

    // Use app proxy path (without .css) - route will set Content-Type: text/css
    // Add version parameter for cache control (static per deployment for optimal CDN caching)
    const cssUrl = getAssetUrl(`/api/design-settings/${shopDomain}`) + `?v=${CONFIG.version}`;

    console.log("[Bundle Widget] Loading design CSS from:", cssUrl);

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
   * Loads the full bundle widget script from the app server (via app proxy for scale)
   */
  function loadFullWidget(retryCount = 0) {
    // Add static version parameter for cache control
    // Version stays the same for all users = optimal CDN caching
    // Increment CONFIG.version when deploying updates to invalidate cache
    const scriptUrl = getAssetUrl(CONFIG.scriptPath) + `?v=${CONFIG.version}`;

    console.log(
      `[Bundle Widget] Loading full widget from: ${scriptUrl} (attempt ${retryCount + 1}/${CONFIG.maxRetries})`
    );

    // Create script element
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.defer = true; // Use defer instead of async for proper execution order
    script.type = "text/javascript";

    // Note: crossOrigin NOT needed for app proxy (same-origin requests)
    // Adding it can interfere with caching and CORS handling

    // Success handler
    script.onload = function () {
      console.log("[Bundle Widget] ✅ Full widget loaded successfully");
      window.__bundleWidgetLoaded = true;
      window.__bundleWidgetLoading = false;

      // Trigger custom event for any listeners
      window.dispatchEvent(new CustomEvent("bundleWidgetLoaded"));
    };

    // Error handler with retry logic
    script.onerror = function (error) {
      console.error(
        `[Bundle Widget] ❌ Failed to load full widget (attempt ${retryCount + 1}/${CONFIG.maxRetries})`,
        error
      );

      // Retry if we haven't exceeded max retries
      if (retryCount < CONFIG.maxRetries - 1) {
        console.log(
          `[Bundle Widget] Retrying in ${CONFIG.retryDelay}ms...`
        );
        setTimeout(
          () => loadFullWidget(retryCount + 1),
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
      console.log("[Bundle Widget] ✅ Container found, loading design CSS and full widget...");
      loadDesignCSS();
      loadFullWidget();
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
