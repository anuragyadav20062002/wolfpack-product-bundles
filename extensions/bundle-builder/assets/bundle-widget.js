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