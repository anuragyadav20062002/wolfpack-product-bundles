/**
 * Bundle Widget - Full Page Version
 *
 * This widget is specifically for full page bundles with horizontal tabs layout.
 * It imports shared components and utilities from bundle-widget-components.js.
 *
 * ============================================================================
 * ARCHITECTURE ROLE
 * ============================================================================
 * This is the THIRD file loaded for FULL PAGE bundles:
 * 1. bundle-widget.js (loader) - Detects bundle type as 'full_page'
 * 2. bundle-widget-components.js - Provides shared utilities
 * 3. THIS FILE (full-page widget) - Implements full page UI/UX
 *
 * ============================================================================
 * WHEN THIS FILE IS LOADED
 * ============================================================================
 * This file loads when:
 * - Container explicitly has data-bundle-type="full_page"
 *
 * Example container:
 * <div id="bundle-builder-app" data-bundle-type="full_page"></div>
 *
 * NOTE: This is OPT-IN only. Without the attribute, product-page widget loads instead.
 *
 * ============================================================================
 * UI LAYOUT: HORIZONTAL TABS
 * ============================================================================
 * - Steps displayed as horizontal tabs at the top
 * - All tabs visible simultaneously (overview of all steps)
 * - Click any tab to jump between steps
 * - Modal overlay for product selection
 * - Progress tracked with tab completion indicators
 * - Best for: Dedicated bundle pages with full horizontal space
 *
 * ============================================================================
 * SHARED CODE IMPORTS
 * ============================================================================
 * All business logic is imported from bundle-widget-components.js:
 * - Currency formatting
 * - Price calculations
 * - Discount logic
 * - Product card rendering
 * - Toast notifications
 *
 * This file ONLY contains:
 * - Full page specific UI rendering
 * - Horizontal tabs layout management
 * - Modal-based product selection
 * - Event handlers for full page flow
 *
 * ============================================================================
 * UNIFIED DESIGN WITH PRODUCT PAGE WIDGET
 * ============================================================================
 * Both widgets:
 * - Use the same CSS variables (from unified design settings API)
 * - Import the same utilities (from bundle-widget-components.js)
 * - Implement the same business logic (pricing, discounts, cart)
 * - Differ ONLY in UI layout and interaction patterns
 *
 * Result: Merchants configure design ONCE, applies to BOTH bundle types
 *
 * @version 1.0.0
 * @author Wolfpack Team
 */

'use strict';

// Import shared components and utilities
import {
  BUNDLE_WIDGET,
  CurrencyManager,
  BundleDataManager,
  PricingCalculator,
  ToastManager,
  TemplateManager,
  ComponentGenerator
} from './bundle-widget-components.js';
import { createDefaultLoadingAnimation } from './widgets/shared/default-loading-animation.js';
import { hideLoadingOverlayElement, markLoadingOverlayVisible } from './widgets/shared/loading-overlay.js';


class BundleWidgetFullPage {

  constructor(containerElement) {
    this.container = containerElement;
    this.selectedBundle = null;
    this.selectedProducts = [];
    this.stepProductData = [];
    this.stepCollectionProductIds = {}; // { `${stepIndex}:${collectionHandle}`: [productId, ...] }
    this.giftMessageState = { message: '', from: '', to: '', error: false };
    this.selectedBoxSelectionRuleId = null;
    this.currentStepIndex = 0;
    this.isInitialized = false;
    this.config = {};
    this.elements = {};

    // Search state for filtering products within steps
    this.searchQuery = '';
    this.searchDebounceTimer = null;

    // Tier pill state
    this.tierConfig = [];
    this.activeTierIndex = 0;

    // Initialize product modal (if BundleProductModal is available)
    this.productModal = null;
    if (window.BundleProductModal) {
      this.productModal = new window.BundleProductModal(this);
    } else {
    }

    // Call async init but don't block constructor
    this.init().catch(error => {
      this.showErrorUI(error);
    });
  }

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  async init() {
    try {
      // Check if already initialized
      if (this.container.dataset.initialized === 'true') {
        return;
      }

      // Hide page body loading content (if it exists)
      this.hidePageLoadingContent();

      // Parse configuration
      this.parseConfiguration();

      // For full-page bundles, hide the page title immediately to prevent flash
      // This runs before any async operations to ensure smooth UX
      const bundleType = this.container.dataset.bundleType;
      if (bundleType === 'full_page') {
        this.hidePageTitle();
      }

      // Show spinner overlay immediately (no gif url yet — bundle data not loaded)
      this.showLoadingOverlay(null);

      // Load design settings CSS (sync — sets up error listener for proxy fallback)
      this.loadDesignSettingsCSS();

      // Storefront self-heal: make sure the shop has an active CartTransform.
      this._scheduleCartTransformSelfHeal();

      // Load and validate bundle data
      await this.loadBundleData();

      // Select appropriate bundle
      this.selectBundle();

      if (!this.selectedBundle) {
        this.hideLoadingOverlay();
        this.showFallbackUI();
        return;
      }

      // Merge bundle_settings metafield into selectedBundle (DCP display settings)
      this._mergeBundleSettings(this.bundleSettings);
      this.applyPersonalizationAddonProducts();

      // Resolve tier config — prefer admin-saved (API) over legacy Theme Editor (data attribute)
      this.tierConfig = this.resolveTierConfig(
        this.selectedBundle.tierConfig ?? null,
        this.tierConfig
      );
      this.initTierPills(this.tierConfig);

      // Resolve showStepTimeline — prefer admin-saved (API) over Theme Editor data attribute
      this.config.showStepTimeline = this.resolveShowStepTimeline(
        this.selectedBundle.showStepTimeline ?? null,
        this.config.showStepTimeline
      );

      // Initialize data structures
      this.initializeDataStructures();

      // Setup DOM elements
      this.setupDOMElements();

      // Mark template/preset before first render so full-page selectors can
      // resolve immediately for both render paths.
      this.applyFullPageDesignPresetMarker();

      // Render initial UI (async for full-page bundles to load products)
      await this.renderUI();

      // Hide overlay now that UI is fully rendered
      this.hideLoadingOverlay();

      // For full-page bundles using cached config: schedule a background layout
      // refresh so any layout change saved by the merchant since the CDN-cached
      // page HTML was last built is picked up within seconds of page load.
      if (!window.Shopify?.designMode) {
        this._scheduleLayoutRefresh().catch(() => {});
      }

      // Attach event listeners
      this.attachEventListeners();

      // Render floating promo badge (if enabled and not session-dismissed)
      this._initFloatingBadge();

      // Mark as initialized
      this.container.dataset.initialized = 'true';
      this.isInitialized = true;

      // Fire-and-forget: record a view event for analytics (skip in Theme Editor preview)
      if (!window.Shopify?.designMode) {
        this._recordView();
      }

    } catch (error) {
      this.hideLoadingOverlay();
      // Log full error to browser console for developer debugging
      console.error('[BundleWidget] Initialization failed:', error);
      // Fire-and-forget: send error to server for AppLogger tracking
      this._reportError(error);
      this.showErrorUI(error);
    }
  }

  /**
   * Hide the page body loading content
   * This hides the "Loading bundle builder..." text that was added to the Shopify page body
   */
  hidePageLoadingContent() {
    try {
      // Find the parent page element that contains the loading text
      const pageContent = this.container.parentElement;

      if (pageContent) {
        // Hide all sibling divs that contain loading text
        const siblings = Array.from(pageContent.children);
        siblings.forEach(sibling => {
          // Check if this is not the widget container and contains "Loading" text
          if (sibling !== this.container &&
              (sibling.textContent.includes('Loading bundle builder') ||
               sibling.textContent.includes('Loading...'))) {
            sibling.style.display = 'none';
          }
        });
      }

    } catch (error) {
      // Don't throw - this is not critical
    }
  }

  /**
   * Load Design Control Panel CSS settings
   * Injects custom CSS from Design Control Panel into the page
   */
  loadDesignSettingsCSS() {
    try {
      // The Liquid template injects a <link> pointing to the design-settings app proxy URL.
      // On non-production environments the app proxy may not be configured and Shopify
      // returns an HTML error page instead of CSS, causing a MIME-type console error.
      // Register an error listener: if the proxy link fails, fall back to the direct
      // app server URL via window.__BUNDLE_APP_URL__.
      const existingLink = document.querySelector('link[href*="design-settings"]');
      if (!existingLink) return;

      const appUrl = window.__BUNDLE_APP_URL__;
      if (!appUrl) return;

      const shop = window.Shopify?.shop || this.container.dataset.shop;
      if (!shop) return;

      existingLink.addEventListener('error', () => {
        const directUrl = `${appUrl}/api/design-settings/${encodeURIComponent(shop)}?bundleType=full_page`;
        const fallback = document.createElement('link');
        fallback.rel = 'stylesheet';
        fallback.type = 'text/css';
        fallback.href = directUrl;
        document.head.appendChild(fallback);
        existingLink.remove();
      }, { once: true });

    } catch (_e) {
      // Non-critical — widget works without design settings CSS
    }
  }

  _scheduleCartTransformSelfHeal() {
    try {
      if (window.Shopify?.designMode) return;

      const shop = window.Shopify?.shop || this.container.dataset.shop || window.location.hostname;
      if (!shop) return;

      const storageKey = `wolfpack:cart-transform-heal:${shop}`;
      const lastCheckedAt = Number(window.localStorage?.getItem(storageKey) || 0);
      const now = Date.now();
      const cooldownMs = 24 * 60 * 60 * 1000;

      if (lastCheckedAt && now - lastCheckedAt < cooldownMs) return;

      window.setTimeout(() => {
        fetch('/apps/product-bundles/api/cart-transform-heal', {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
        })
          .then(response => {
            if (response.ok) {
              window.localStorage?.setItem(storageKey, String(now));
            }
          })
          .catch(() => {});
      }, 1500);
    } catch (_error) {
      // Non-critical: checkout still works if the self-heal request is blocked.
    }
  }

  parseConfiguration() {
    const dataset = this.container.dataset;

    this.config = {
      bundleId: dataset.bundleId || null,
      isContainerProduct: dataset.isContainerProduct === 'true',
      containerBundleId: dataset.containerBundleId || null,
      hideDefaultButtons: dataset.hideDefaultButtons === 'true',
      showTitle: dataset.showTitle === 'true', // Default to false to avoid duplicate with main header
      showDescription: dataset.showDescription !== 'false',
      showStepNumbers: dataset.showStepNumbers !== 'false',
      showFooterMessaging: dataset.showFooterMessaging !== 'false',
      showStepTimeline: dataset.showStepTimeline !== 'false',
      showCategoryTabs: dataset.showCategoryTabs !== 'false',
      // Custom content from theme editor
      customTitle: dataset.customTitle || null,
      customDescription: dataset.customDescription || null,
      // Card layout settings from theme editor
      productCardSpacing: parseInt(dataset.productCardSpacing) || 20,
      productCardsPerRow: parseInt(dataset.productCardsPerRow) || 4,
      // Quantity selector visibility settings (default: show on both)
      showQuantitySelectorOnCard: dataset.showQuantitySelectorOnCard !== 'false',
      showQuantitySelectorInModal: dataset.showQuantitySelectorInModal !== 'false',
      // Promo banner settings from theme editor
      showPromoBanner: dataset.showPromoBanner !== 'false',
      promoBannerSubtitle: dataset.promoBannerSubtitle || 'Mix & Match',
      promoBannerTagline: dataset.promoBannerTagline || 'Create Your Perfect Bundle',
      promoBannerNote: dataset.promoBannerNote || 'Mix & Match Your Favorites',
      // Messages will be set from bundle.pricing.messages after bundle loads
      discountTextTemplate: 'Add {conditionText} to get {discountText}',
      successMessageTemplate: 'Congratulations! You got {discountText}!',
      showDiscountProgressBar: false,
      discountProgressBarType: 'step_based',
      discountProgressTextTemplate: null,
      discountProgressSuccessTemplate: null,
      currentProductId: window.currentProductId,
      currentProductGid: window.currentProductGid,
      currentProductHandle: window.currentProductHandle,
      currentProductCollections: window.currentProductCollections,
      tierConfig: this.parseTierConfig(dataset.tierConfig || '[]'),
    };

    this.tierConfig = this.config.tierConfig;

    // Parse bundle_settings metafield (DCP display settings — promoBanner, badge, etc.)
    try {
      this.bundleSettings = JSON.parse(dataset.bundleSettings || 'null') || {};
    } catch {
      this.bundleSettings = {};
    }

    // Apply card layout settings as CSS variables
    this.applyCardLayoutSettings();
  }

  /**
   * Apply card layout settings from Theme Editor as CSS variables
   */
  applyCardLayoutSettings() {
    document.documentElement.style.setProperty(
      '--bundle-product-card-spacing',
      `${this.config.productCardSpacing}px`
    );
    document.documentElement.style.setProperty(
      '--bundle-product-cards-per-row',
      this.config.productCardsPerRow
    );
  }

  async loadBundleData() {
    let bundleData = null;

    // Check if this is a full-page bundle (needs to fetch from API)
    const bundleType = this.container.dataset.bundleType;
    const bundleId = this.container.dataset.bundleId;

    if (bundleType === 'full_page' && bundleId) {

      // Prefer metafield cache (data-bundle-config) over proxy API call.
      // The metafield is written by the app when "Place Widget Now" or "Sync Bundle"
      // is clicked — it eliminates the proxy round-trip for first paint.
      const cachedConfig = this.container.dataset.bundleConfig;
      if (cachedConfig && cachedConfig.trim() !== '' && cachedConfig !== 'null' && cachedConfig !== 'undefined') {
        try {
          const parsed = JSON.parse(cachedConfig);
          if (parsed && typeof parsed === 'object' && parsed.id) {
            bundleData = { [parsed.id]: parsed };
          }
        } catch (_e) {
          // Malformed JSON in the attribute — fall through to proxy
        }
      }

      // Fall back to proxy API if metafield cache was absent or unparseable.
      if (!bundleData) {
        // Retry once after a short delay for transient server errors (504/503).
        // This handles Render cold-start: the first request times out while the
        // server is warming up; the retry ~3 s later succeeds.
        const RETRY_DELAY_MS = 3000;
        const RETRYABLE_STATUSES = new Set([503, 504]);

        const fetchBundleData = async () => {
          // Use Shopify app proxy path - Shopify automatically adds signature and auth params
          // App proxy config: /apps/product-bundles -> https://wolfpack-product-bundle-app.onrender.com
          // CRITICAL: URL-encode bundle ID to handle special characters in cuid() format
          const apiUrl = `/apps/product-bundles/api/bundle/${encodeURIComponent(bundleId)}.json`;

          const response = await fetch(apiUrl);

          if (!response.ok) {
            // Try to get error details from response body
            let errorDetails = `${response.status} ${response.statusText}`;
            try {
              const errorData = await response.json();
              errorDetails = JSON.stringify(errorData);
            } catch (e) {
            }
            const err = new Error(`API request failed: ${errorDetails}`);
            err.status = response.status;
            throw err;
          }

          const data = await response.json();

          if (data.success && data.bundle) {
            return { [data.bundle.id]: data.bundle };
          } else {
            throw new Error('Invalid API response structure');
          }
        };

        try {
          try {
            bundleData = await fetchBundleData();
          } catch (firstErr) {
            // Retry once for 504/503 (server cold-start)
            if (RETRYABLE_STATUSES.has(firstErr.status)) {
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
              bundleData = await fetchBundleData();
            } else {
              throw firstErr;
            }
          }
        } catch (error) {
          throw error;
        }
      }
    } else {
      // Product-page bundle: load from data-bundle-config attribute
      const configValue = this.container.dataset.bundleConfig;
      if (configValue && configValue.trim() !== '' && configValue !== 'null' && configValue !== 'undefined') {
        try {
          const singleBundle = JSON.parse(configValue);
          // Validate parsed result is a valid object with an id
          if (singleBundle && typeof singleBundle === 'object' && singleBundle.id) {
            bundleData = { [singleBundle.id]: singleBundle };
          } else {
          }
        } catch (error) {
        }
      } else {
      }

      // Widget only works on container products with bundleConfig metafield
      if (!bundleData || (typeof bundleData === 'object' && Object.keys(bundleData).length === 0)) {
        // Check if we're in theme editor mode
        const isThemeEditor = window.Shopify?.designMode ||
                             window.isThemeEditorContext ||
                             window.location.pathname.includes('/editor') ||
                             window.location.search.includes('preview_theme_id');

        const bundleIdFromDataset = this.container.dataset.bundleId;

        // Show helpful preview in theme editor instead of error
        if (isThemeEditor && bundleIdFromDataset) {
          this.showThemeEditorPreview(bundleIdFromDataset);
          return; // Don't throw error, just show preview
        }

        // For production/storefront: show proper error
        const errorMsg = 'This widget can only be used on bundle container products. Please ensure:\n1. This product is a bundle container product\n2. Bundle has been saved and published\n3. Product has bundleConfig metafield set';
        throw new Error(errorMsg);
      }
    }

    this.bundleData = bundleData;
  }

  selectBundle() {
    this.selectedBundle = BundleDataManager.selectBundle(this.bundleData, this.config);

    // Update message templates from bundle pricing messages
    this.updateMessagesFromBundle();
  }

  updateMessagesFromBundle() {
    // Product-page bundles (metafield path) expose a top-level `messaging` object with
    // camelCase keys (progressTemplate / successTemplate).
    // Full-page bundles (API path) expose messages inside `pricing.messages` with
    // snake-style keys (progress / qualified). Try both shapes.
    const messaging = this.selectedBundle?.messaging;
    const pricingMessages = this.selectedBundle?.pricing?.messages;
    const pricingDisplay = this.selectedBundle?.pricing?.display;
    const displayOptions = messaging?.displayOptions || pricingMessages?.displayOptions || {};
    const progressBarOptions = displayOptions?.progressBar || {};

    if (messaging) {
      if (messaging.progressTemplate) {
        this.config.discountTextTemplate = messaging.progressTemplate;
      }
      if (messaging.successTemplate) {
        this.config.successMessageTemplate = messaging.successTemplate;
      }

      this.config.showDiscountMessaging = messaging.showDiscountMessaging !== false;
      this.config.showDiscountProgressBar = progressBarOptions.enabled === true || messaging.showDiscountProgressBar === true;

    } else if (pricingMessages) {
      // Full-page bundle API path: templates live in ruleMessages (first rule = global template).
      // When ruleMessagesByLocale is present, prefer the locale-specific messages.
      const shopLocale = window.Shopify?.locale;
      const byLocale = pricingMessages.ruleMessagesByLocale;
      const localeRuleMessages = shopLocale && byLocale?.[shopLocale];
      const ruleMessages = localeRuleMessages || pricingMessages.ruleMessages;
      const firstRuleMsg = ruleMessages && Object.values(ruleMessages)[0];
      if (firstRuleMsg?.discountText) {
        this.config.discountTextTemplate = firstRuleMsg.discountText;
      }
      if (firstRuleMsg?.successMessage) {
        this.config.successMessageTemplate = firstRuleMsg.successMessage;
      }

      this.config.showDiscountMessaging = pricingMessages.showDiscountMessaging || this.selectedBundle?.pricing?.enabled || false;
      this.config.showDiscountProgressBar =
        progressBarOptions.enabled === true ||
        pricingMessages.showDiscountProgressBar === true ||
        pricingDisplay?.showDiscountProgressBar === true;

    } else {
      this.config.showDiscountMessaging = this.selectedBundle?.pricing?.enabled || false;
      this.config.showDiscountProgressBar = pricingDisplay?.showDiscountProgressBar === true;
    }

    this.config.discountProgressBarType = progressBarOptions.type === 'simple' ? 'simple' : 'step_based';
    this.config.discountProgressTextTemplate = progressBarOptions.progressText || this.config.discountTextTemplate;
    this.config.discountProgressSuccessTemplate = progressBarOptions.successText || this.config.successMessageTemplate;
  }

  applyPersonalizationAddonProducts() {
    const addonStep = this.buildAddonStepFromPersonalization();
    if (!addonStep) return;

    this.selectedBundle.steps = (this.selectedBundle.steps || []).filter(step => !step.isFreeGift);
    this.selectedBundle.steps = [...(this.selectedBundle.steps || []), addonStep];
  }

  buildAddonStepFromPersonalization() {
    const personalizationData = this.selectedBundle?.personalizationData;
    const addonProducts = personalizationData?.addonProducts;
    if (personalizationData?.isPersonalizationEnabled !== true || addonProducts?.isEnabled !== true) {
      return null;
    }

    const tiers = Array.isArray(addonProducts.tiers) ? addonProducts.tiers : [];
    const selectedAddonProducts = tiers.flatMap(tier =>
      Array.isArray(tier?.selectedAddonProducts)
        ? tier.selectedAddonProducts.map(product => this.normalizePersonalizationAddonProduct(product))
        : []
    );
    if (selectedAddonProducts.length === 0) return null;

    const firstTier = tiers[0] || {};

    return {
      id: 'personalization-addons',
      name: personalizationData.personalizeStepText || addonProducts.title || '',
      position: (this.selectedBundle?.steps?.length || 0) + 1,
      minQuantity: 0,
      maxQuantity: selectedAddonProducts.length,
      enabled: true,
      isFreeGift: true,
      addonLabel: personalizationData.personalizeStepText || addonProducts.title || '',
      freeGiftName: addonProducts.title || personalizationData.personalizeStepText || '',
      addonTitle: addonProducts.title || personalizationData.personalizePageSubtext || '',
      addonIconUrl: personalizationData.stepImage || null,
      addonDisplayFree: Number(firstTier?.discount?.value || 0) >= 100 && firstTier?.discount?.type === 'PERCENTAGE',
      addonUnlockAfterCompletion: true,
      addonTiers: tiers,
      addonEligibilityCondition: firstTier?.eligibilityCondition || null,
      addonDiscount: firstTier?.discount || null,
      addonMessaging: addonProducts.addonsMessaging || null,
      displayVariantsAsIndividual: firstTier?.displayVariantsAsIndividualProducts_addons === true,
      StepProduct: selectedAddonProducts,
      products: selectedAddonProducts,
      collections: [],
    };
  }

  normalizePersonalizationAddonProduct(product) {
    const productGid = product?.graphqlId || product?.id || (product?.productId ? `gid://shopify/Product/${product.productId}` : '');
    const imageUrl = product?.images?.[0]?.originalSrc
      || product?.images?.[0]?.url
      || product?.image?.src
      || product?.imageUrl
      || '';
    const variants = Array.isArray(product?.variants) ? product.variants : [];

    return {
      productId: productGid,
      id: productGid,
      title: product?.title || '',
      handle: product?.handle || '',
      imageUrl,
      price: variants[0]?.price || product?.price || '0',
      compareAtPrice: variants[0]?.compareAtPrice || null,
      variants: variants.map(variant => {
        const variantGid = variant.variantGraphqlId || variant.id || (variant.variantId ? `gid://shopify/ProductVariant/${variant.variantId}` : productGid);
        return {
          id: variantGid,
          title: variant.variantTitle || variant.title || 'Default Title',
          price: variant.price || '0',
          compareAtPrice: variant.compareAtPrice || null,
          available: variant.available !== false,
          quantityAvailable: typeof variant.inventoryQuantity === 'number' ? variant.inventoryQuantity : null,
          currentlyNotInStock: false,
          image: imageUrl ? { src: imageUrl } : null,
        };
      }),
    };
  }

  initializeDataStructures() {
    const stepsCount = this.selectedBundle.steps.length;

    // Initialize selected products array (one object per step)
    this.selectedProducts = Array(stepsCount).fill(null).map(() => ({}));

    // Pre-populate default products (mandatory items like Gift Box)
    this._initDefaultProducts();

    // Initialize step product data cache
    this.stepProductData = Array(stepsCount).fill(null).map(() => ([]));
  }

  /**
   * Show a helpful preview in theme editor when testing on non-bundle products
   */
  showThemeEditorPreview(bundleId) {

    this.container.innerHTML = `
      <div style="
        padding: 32px 24px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: 2px dashed #667eea;
        border-radius: 12px;
        text-align: center;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      ">
        <div style="font-size: 48px; margin-bottom: 16px;">📦</div>
        <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600;">Bundle Widget Preview</h3>
        <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">
          Bundle ID: <code style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px; font-family: monospace;">${bundleId}</code>
        </p>
        <div style="
          margin: 20px auto 0;
          padding: 16px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          max-width: 400px;
          text-align: left;
          font-size: 13px;
          line-height: 1.6;
        ">
          <div style="font-weight: 600; margin-bottom: 8px;">✅ Widget Configured Successfully</div>
          <div style="opacity: 0.9;">
            This widget will automatically display on <strong>bundle container products</strong>.
            <br><br>
            <strong>To see it in action:</strong>
            <ol style="margin: 8px 0; padding-left: 20px;">
              <li>Save your theme</li>
              <li>Navigate to a bundle product page</li>
              <li>The widget will appear with product selection steps</li>
            </ol>
          </div>
        </div>
        <div style="
          margin-top: 20px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          font-size: 12px;
          opacity: 0.8;
        ">
          💡 <strong>Tip:</strong> You're currently previewing on a regular product. The widget only activates on products configured as bundle containers.
        </div>
      </div>
    `;
  }

  // ========================================================================
  // DOM SETUP
  // ========================================================================

  setupDOMElements() {
    // Get or create main UI elements
    this.elements = {
      header: this.container.querySelector('.bundle-header') || this.createHeader(),
      stepsContainer: this.container.querySelector('.bundle-steps') || this.createStepsContainer(),
      footer: this.container.querySelector('.bundle-footer-messaging') || this.createFooter(),
      modal: this.ensureModal()
    };

    // Append elements if they were created
    if (!this.container.querySelector('.bundle-header')) {
      this.container.appendChild(this.elements.header);
    }
    if (!this.container.querySelector('.bundle-steps')) {
      this.container.appendChild(this.elements.stepsContainer);
    }
    if (!this.container.querySelector('.bundle-footer-messaging')) {
      this.container.appendChild(this.elements.footer);
    }
  }

  createHeader() {
    const header = document.createElement('div');
    header.className = 'bundle-header';

    // Use custom title if provided, otherwise use bundle name
    const title = this.config.customTitle || this.selectedBundle.name;

    // Use custom description if provided, otherwise use bundle description
    const description = this.config.customDescription || this.selectedBundle.description;

    // Build header HTML (escape user-provided content)
    const titleHTML = `<h2 class="bundle-title">${ComponentGenerator.escapeHtml(title)}</h2>`;
    const descriptionHTML = (description && this.config.showDescription)
      ? `<p class="bundle-description">${ComponentGenerator.escapeHtml(description)}</p>`
      : '';

    header.innerHTML = `
      ${titleHTML}
      ${descriptionHTML}
    `;
    return header;
  }

  createStepsContainer() {
    const container = document.createElement('div');
    container.className = 'bundle-steps';
    return container;
  }

  createFooter() {
    const footer = document.createElement('div');
    footer.className = 'bundle-footer-messaging';
    footer.style.display = 'none';
    footer.innerHTML = `
      <div class="footer-discount-text"></div>
    `;
    return footer;
  }

  ensureModal() {
    let modal = document.getElementById('bundle-builder-modal');

    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'bundle-builder-modal';
      modal.className = 'bundle-builder-modal';
      modal.style.display = 'none';
      modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-step-title"></div>
            <div class="modal-tabs-wrapper">
              <button class="tab-arrow tab-arrow-left" aria-label="Scroll tabs left">&lsaquo;</button>
              <div class="modal-tabs"></div>
              <button class="tab-arrow tab-arrow-right" aria-label="Scroll tabs right">&rsaquo;</button>
            </div>
            <span class="close-button">&times;</span>
          </div>
          <div class="modal-body">
            <div class="product-grid"></div>
          </div>
          <div class="modal-footer">
            <!-- Centered Grouped Content Container -->
            <div class="modal-footer-grouped-content">
              <!-- Total Pill - Sits Above Buttons -->
              <div class="modal-footer-total-pill">
                <span class="total-price-strike"></span>
                <span class="total-price-final"></span>
                <span class="price-cart-separator">|</span>
                <span class="cart-badge-wrapper">
                  <span class="cart-badge-count">0</span>
                  <svg class="cart-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="9" cy="21" r="1" fill="currentColor" stroke="none"/>
                    <circle cx="20" cy="21" r="1" fill="currentColor" stroke="none"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                </span>
              </div>

              <!-- Buttons Row - Below Pill -->
              <div class="modal-footer-buttons-row">
                <button class="modal-nav-button prev-button">BACK</button>
                <button class="modal-nav-button next-button">NEXT</button>
              </div>

              <!-- Discount Messaging Section -->
              <div class="modal-footer-discount-messaging">
                <div class="footer-discount-text"></div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Setup tab scroll arrows
      this.setupTabScrollArrows(modal);
    }

    return modal;
  }

  setupTabScrollArrows(modal) {
    const tabsContainer = modal.querySelector('.modal-tabs');
    const leftArrow = modal.querySelector('.tab-arrow-left');
    const rightArrow = modal.querySelector('.tab-arrow-right');

    if (!tabsContainer || !leftArrow || !rightArrow) return;

    const scrollAmount = 200;

    // Left arrow click
    leftArrow.addEventListener('click', () => {
      tabsContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    // Right arrow click
    rightArrow.addEventListener('click', () => {
      tabsContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    // Update arrow visibility based on scroll position
    const updateArrowVisibility = () => {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainer;

      leftArrow.style.display = scrollLeft > 0 ? 'flex' : 'none';
      rightArrow.style.display = scrollLeft + clientWidth < scrollWidth - 1 ? 'flex' : 'none';
    };

    // Listen to scroll events
    tabsContainer.addEventListener('scroll', updateArrowVisibility);

    // Initial check
    setTimeout(updateArrowVisibility, 100);

    // Store for later updates
    this.updateTabArrows = updateArrowVisibility;
  }
  //========================================================================
  // UI RENDERING
  // ========================================================================

  async renderUI() {
    this.renderHeader();
    await this.renderSteps();
    this.renderFooter();
  }

  renderHeader() {
    // For full-page bundles, always hide the main header (promo banner handles the display)
    const bundleType = this.selectedBundle?.bundleType || BUNDLE_WIDGET.BUNDLE_TYPES.PRODUCT_PAGE;
    if (bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE) {
      this.elements.header.style.display = 'none';
      return;
    }

    if (!this.config.showTitle) {
      this.elements.header.style.display = 'none';
      return;
    }

    this.elements.header.style.display = 'block';
  }

  async renderSteps() {
    // Clear existing steps
    this.elements.stepsContainer.innerHTML = '';

    if (!this.selectedBundle || !this.selectedBundle.steps) {
      return;
    }

    // Check bundle type and render accordingly
    const bundleType = this.selectedBundle.bundleType || BUNDLE_WIDGET.BUNDLE_TYPES.PRODUCT_PAGE;

    if (bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE) {
      // Wire the preset + template data attributes so the preset-scoped CSS
      // rules in bundle-widget-full-page.css activate.
      FullPagePreset.markContainer(this.container, this.selectedBundle);

      // Full-page bundle: Render with tabs layout (async to load products)
      const layout = this.resolveFullPageLayout();
      if (layout === 'footer_side') {
        await this.renderFullPageLayoutWithSidebar();
      } else {
        await this.renderFullPageLayout();
      }
    } else {
      // Product-page bundle: Render with step boxes (current implementation)
      this.renderProductPageLayout();
    }
  }

  // Product-page bundle layout (original vertical step boxes)
  renderProductPageLayout() {
    this.selectedBundle.steps.forEach((step, index) => {
      const stepElement = this.createStepElement(step, index);
      this.elements.stepsContainer.appendChild(stepElement);
    });
  }

  // Full-page bundle layout (horizontal tabs)
  async renderFullPageLayout() {

    // Hide the page-title element from the theme (shows page name like "StrangeObjectsinmirror")
    this.hidePageTitle();

    // Clear existing content
    this.elements.stepsContainer.innerHTML = '';
    this.elements.stepsContainer.classList.add('full-page-layout');
    this.applyFullPageDesignPresetMarker();

    // Wrap content in full-page-content-section for proper padding
    const contentSection = document.createElement('div');
    contentSection.className = 'full-page-content-section';

    // OPTIMISTIC RENDERING: Render non-product UI immediately
    // 0. Render promo banner at the very top (before step timeline)
    const promoBanner = this.createPromoBanner();
    if (promoBanner) {
      contentSection.appendChild(promoBanner);
    }

    // 1. Render step timeline at top (if enabled in theme settings)
    if (this.config.showStepTimeline) {
      const stepTimeline = this.createStepTimeline();
      contentSection.appendChild(stepTimeline);
    }

    const contentHeader = this.createStepContentHeader(this.currentStepIndex);
    if (contentHeader) contentSection.appendChild(contentHeader);

    // 2. Render per-step banner image (if configured for this step)
    const stepBanner = this.createStepBannerImage(this.currentStepIndex);
    if (stepBanner) contentSection.appendChild(stepBanner);

    // 3. Render search input for filtering products
    if (this.shouldRenderFullPageSearch()) {
      const searchInput = this.createSearchInput();
      contentSection.appendChild(searchInput);
    }

    // 4. Render category/collection tabs if step has collections (and enabled in theme settings)
    if (this.config.showCategoryTabs) {
      const categoryTabs = this.createCategoryTabs(this.currentStepIndex);
      if (categoryTabs) {
        contentSection.appendChild(categoryTabs);
      }
    }

    const activeCategoryTitle = this.createActiveCategoryTitle(this.currentStepIndex);
    if (activeCategoryTitle) contentSection.appendChild(activeCategoryTitle);

    // 5. Create product grid container with loading state
    const productGridContainer = document.createElement('div');
    productGridContainer.className = 'full-page-product-grid-container';
    productGridContainer.innerHTML = this.createProductGridLoadingState();
    contentSection.appendChild(productGridContainer);
    const categoryRows = this.createCategorySectionRows(this.currentStepIndex);
    if (categoryRows) contentSection.appendChild(categoryRows);
    this.renderGiftMessageSection(contentSection);

    this.elements.stepsContainer.appendChild(contentSection);

    // 6. Render fixed footer (will be updated after products load)
    this.renderFullPageFooter();

    // Load products asynchronously and update grid
    // Only show loading overlay when a custom GIF is configured — otherwise the
    // skeleton loading state (already rendered above) is visible and sufficient.
    if (this.selectedBundle?.loadingGif) {
      this.showLoadingOverlay(this.selectedBundle.loadingGif);
    }
    try {
      await this.loadStepProducts(this.currentStepIndex);

      // Replace loading state with actual products
      const productGrid = this.createFullPageProductGrid(this.currentStepIndex);
      productGridContainer.innerHTML = '';
      productGridContainer.appendChild(productGrid);

      // Update footer with correct product data
      this.renderFullPageFooter();

      this.hideLoadingOverlay();

      // PRELOAD NEXT STEP: Load next step's products in the background
      this.preloadNextStep();
    } catch (error) {
      this.hideLoadingOverlay();
      productGridContainer.innerHTML = '<p class="error-message">Failed to load products. Please try again.</p>';
    }
  }

  // Full-page bundle layout with sidebar panel (footer_side)
  async renderFullPageLayoutWithSidebar() {
    this.hidePageTitle();

    this.elements.stepsContainer.innerHTML = '';
    this.elements.stepsContainer.classList.add('full-page-layout', 'layout-sidebar');
    this.applyFullPageDesignPresetMarker();

    // Hide the bottom footer — sidebar replaces it
    if (this.elements.footer) {
      this.elements.footer.style.display = 'none';
    }

    // ABOVE: Step timeline sits above the two-column area (same horizontal position as
    // the floating footer layout) so tabs always appear at the top, not as a left column.
    if (this.config.showStepTimeline) {
      this.elements.stepsContainer.appendChild(this.createStepTimeline());
    }

    const contentHeader = this.createStepContentHeader(this.currentStepIndex);
    if (contentHeader) this.elements.stepsContainer.appendChild(contentHeader);

    // Two-column wrapper: content (center) | sidebar (right)
    const twoColWrapper = document.createElement('div');
    twoColWrapper.className = 'sidebar-layout-wrapper';

    // CENTER: Main content (same as footer_bottom minus the footer)
    const contentSection = document.createElement('div');
    contentSection.className = 'full-page-content-section sidebar-content';

    const promoBanner = this.createPromoBanner();
    if (promoBanner) contentSection.appendChild(promoBanner);

    const stepBanner = this.createStepBannerImage(this.currentStepIndex);
    if (stepBanner) contentSection.appendChild(stepBanner);

    if (this.shouldRenderFullPageSearch()) {
      contentSection.appendChild(this.createSearchInput());
    }

    if (this.config.showCategoryTabs) {
      const categoryTabs = this.createCategoryTabs(this.currentStepIndex);
      if (categoryTabs) contentSection.appendChild(categoryTabs);
    }

    const activeCategoryTitle = this.createActiveCategoryTitle(this.currentStepIndex);
    if (activeCategoryTitle) contentSection.appendChild(activeCategoryTitle);

    // Add-on step custom heading — only shown when merchant explicitly sets addonTitle
    const currentStep = (this.selectedBundle?.steps || [])[this.currentStepIndex];
    if (currentStep?.isFreeGift && currentStep?.addonTitle) {
      const freeHeading = document.createElement('div');
      freeHeading.className = 'fpb-step-free-heading';
      freeHeading.textContent = currentStep.addonTitle;
      contentSection.appendChild(freeHeading);
    }

    const productGridContainer = document.createElement('div');
    productGridContainer.className = 'full-page-product-grid-container';
    productGridContainer.innerHTML = this.createProductGridLoadingState();
    contentSection.appendChild(productGridContainer);
    const categoryRows = this.createCategorySectionRows(this.currentStepIndex);
    if (categoryRows) contentSection.appendChild(categoryRows);
    this.renderGiftMessageSection(contentSection);

    twoColWrapper.appendChild(contentSection);

    // RIGHT: Side panel
    const sidePanel = document.createElement('div');
    sidePanel.className = 'full-page-side-panel';
    this.renderSidePanel(sidePanel);
    twoColWrapper.appendChild(sidePanel);

    this.elements.stepsContainer.appendChild(twoColWrapper);

    // Load products
    // Only show loading overlay when a custom GIF is configured.
    if (this.selectedBundle?.loadingGif) {
      this.showLoadingOverlay(this.selectedBundle.loadingGif);
    }
    try {
      await this.loadStepProducts(this.currentStepIndex);
      const productGrid = this.createFullPageProductGrid(this.currentStepIndex);
      productGridContainer.innerHTML = '';
      productGridContainer.appendChild(productGrid);
      this.renderSidePanel(sidePanel);
      this.hideLoadingOverlay();
      this.preloadNextStep();
      this._renderMobileBottomBar();
    } catch (error) {
      this.hideLoadingOverlay();
      productGridContainer.innerHTML = '<p class="error-message">Failed to load products. Please try again.</p>';
      this._renderMobileBottomBar();
    }
  }

  // Mobile sticky bottom bar + slide-up sheet (replaces sidebar on < 768px)
  _renderMobileBottomBar({ preserveOpen = false } = {}) {
    const previousSheet = document.querySelector('.fpb-mobile-bottom-sheet');
    const wasOpen = preserveOpen && previousSheet?.classList.contains('is-open');

    document.querySelector('.fpb-mobile-bottom-bar')?.remove();
    document.querySelector('.fpb-mobile-bottom-sheet')?.remove();
    document.querySelector('.fpb-mobile-backdrop')?.remove();
    document.body.classList.remove('fpb-compact-mobile-summary-active');

    const { totalPrice, totalQuantity, unitPrices } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData,
      this.selectedBundle?.steps
    );
    const discountInfo = PricingCalculator.calculateDiscount(this.selectedBundle, totalPrice, totalQuantity, unitPrices);
    const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const finalPrice = combinedDiscountInfo.hasDiscount ? combinedDiscountInfo.finalPrice : totalPrice;
    const selectedCount = this.getAllSelectedProductsData().filter(p => !p.isDefault).length;
    const isLastStep = this.currentStepIndex === (this.selectedBundle?.steps?.length || 1) - 1;
    const isComplete = this.areBundleConditionsMet();

    const backdrop = document.createElement('div');
    backdrop.className = 'fpb-mobile-backdrop';

    const sheet = document.createElement('div');
    sheet.className = 'fpb-mobile-bottom-sheet';
    const usesCompactMobileSummaryTray = this.usesCompactMobileSummaryTray();
    if (usesCompactMobileSummaryTray) {
      sheet.classList.add('fpb-mobile-summary-tray');
      this._populateCompactMobileSummaryTray(sheet);
      sheet.classList.add('is-open');
      document.body.classList.add('fpb-compact-mobile-summary-active');
      document.body.appendChild(sheet);
      return;
    }

    this._populateMobileSheet(sheet);

    const bar = document.createElement('div');
    bar.className = 'fpb-mobile-bottom-bar';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'fpb-mobile-toggle-btn';
    toggleBtn.setAttribute('aria-label', 'View bundle summary');
    toggleBtn.innerHTML = `<span class="fpb-caret">&#9650;</span><span class="fpb-mobile-toggle-count">${selectedCount}</span>`;
    toggleBtn.addEventListener('click', () => {
      const open = sheet.classList.toggle('is-open');
      backdrop.classList.toggle('is-open', open);
      toggleBtn.querySelector('.fpb-caret').innerHTML = open ? '&#9660;' : '&#9650;';
    });
    backdrop.addEventListener('click', () => {
      sheet.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      toggleBtn.querySelector('.fpb-caret').innerHTML = '&#9650;';
    });

    const totalEl = document.createElement('div');
    totalEl.className = 'fpb-mobile-total';
    totalEl.textContent = CurrencyManager.convertAndFormat(finalPrice, currencyInfo);

    const conditionlessMobile = this.bundleHasNoConditions();
    const hasSelectionMobile = conditionlessMobile && this.getAllSelectedProductsData().filter(p => !p.isDefault).length > 0;
    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'fpb-mobile-cta-btn';
    ctaBtn.textContent = (conditionlessMobile || (isLastStep && isComplete)) ? this._resolveText('addToCartButton', 'Add to Cart') : this._resolveText('nextButton', 'Next');
    if (conditionlessMobile ? !hasSelectionMobile : (isLastStep && !isComplete)) ctaBtn.disabled = true;
    ctaBtn.addEventListener('click', () => {
      if (conditionlessMobile || (isLastStep && isComplete)) {
        this.addBundleToCart();
      } else if (!isLastStep && this.canNavigateToStep(this.currentStepIndex + 1) && this.canProceedToNextStep()) {
        this.activeCollectionId = null;
        this.searchQuery = '';
        this.currentStepIndex++;
        this.renderFullPageLayoutWithSidebar();
      } else if (!isLastStep && !this.canNavigateToStep(this.currentStepIndex + 1)) {
        ToastManager.show(this.freeGiftStep?.addonLabel || this.freeGiftStep?.freeGiftName ? `Complete all steps to unlock the free ${this.freeGiftStep?.addonLabel || this.freeGiftStep?.freeGiftName}!` : 'Complete all steps first.');
      } else {
        ToastManager.show('Please meet the quantity conditions for the current step before proceeding.');
      }
    });

    bar.appendChild(toggleBtn);
    bar.appendChild(totalEl);
    bar.appendChild(ctaBtn);

    document.body.appendChild(backdrop);
    document.body.appendChild(sheet);
    document.body.appendChild(bar);

    if (wasOpen) {
      sheet.classList.add('is-open');
      backdrop.classList.add('is-open');
      toggleBtn.querySelector('.fpb-caret').innerHTML = '&#9660;';
    }
  }

  _populateMobileSheet(sheet) {
    sheet.innerHTML = '';
    this.renderSidePanel(sheet);
  }

  usesCompactMobileSummaryTray() {
    return this.resolveFullPageLayout() === 'footer_side' && this.getFullPageDesignPreset() === 'DEFAULT';
  }

  _populateCompactMobileSummaryTray(sheet) {
    sheet.innerHTML = '';

    const { totalPrice, totalQuantity, unitPrices } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData,
      this.selectedBundle?.steps
    );
    const discountInfo = PricingCalculator.calculateDiscount(
      this.selectedBundle,
      totalPrice,
      totalQuantity,
      unitPrices
    );
    const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const finalPrice = combinedDiscountInfo.hasDiscount ? combinedDiscountInfo.finalPrice : totalPrice;
    const nextRule = PricingCalculator.getNextDiscountRule?.(this.selectedBundle, totalQuantity) || null;
    const selectedFooterQuantity = this.getAllSelectedProductsData().reduce(
      (sum, item) => sum + (Number(item.quantity) || 1),
      0
    );

    if (selectedFooterQuantity > 0) {
      const countBadge = document.createElement('div');
      countBadge.className = 'fpb-mobile-summary-count-badge';
      countBadge.textContent = String(selectedFooterQuantity);
      sheet.appendChild(countBadge);
    }

    if (this.selectedBundle?.pricing?.enabled) {
      const variables = TemplateManager.createDiscountVariables(
        this.selectedBundle, totalPrice, totalQuantity, combinedDiscountInfo, currencyInfo
      );
      let discountMessage = '';
      if (combinedDiscountInfo.hasDiscount) {
        discountMessage = TemplateManager.replaceVariables(
          this.config.successMessageTemplate || '🎉 You unlocked {{discountText}}!',
          variables
        );
      } else if (nextRule) {
        discountMessage = TemplateManager.replaceVariables(
          this.config.discountTextTemplate || 'Add {conditionText} to get {discountText}',
          variables
        );
      }
      if (discountMessage) {
        const msgEl = document.createElement('div');
        msgEl.className = 'side-panel-discount-message';
        msgEl.innerHTML = discountMessage;
        sheet.appendChild(msgEl);
      }

      if (this.config.showDiscountProgressBar) {
        const progressBar = this._renderDiscountProgress({
          placement: "sidebar",
          combinedDiscountInfo,
          totalPrice,
          totalQuantity,
          unitPrices,
        });
        if (progressBar) {
          progressBar.classList.add('fpb-dp-sidebar');
          sheet.appendChild(progressBar);
        }
      }
    }

    const navSection = document.createElement('div');
    navSection.className = 'side-panel-nav';
    const isLastStep = this.currentStepIndex === (this.selectedBundle?.steps?.length || 1) - 1;
    const conditionlessMobile = this.bundleHasNoConditions();
    const hasSelectionMobile = conditionlessMobile && this.getAllSelectedProductsData().filter(p => !p.isDefault).length > 0;
    const actionButton = this._createMobileSummaryActionButton({
      finalPrice,
      currencyInfo,
      conditionlessMobile,
      hasSelectionMobile,
      isLastStep,
      isComplete: this.areBundleConditionsMet()
    });
    navSection.appendChild(actionButton);
    sheet.appendChild(navSection);
  }

  _createMobileSummaryActionButton({
    finalPrice,
    currencyInfo,
    conditionlessMobile,
    hasSelectionMobile,
    isLastStep,
    isComplete
  }) {
    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'side-panel-btn side-panel-btn-next';
    const hasUpcomingAddonStep = this.freeGiftStepIndex > this.currentStepIndex;
    const shouldAdvance = hasUpcomingAddonStep || (!conditionlessMobile && !isLastStep);
    const shouldAddToCart = !shouldAdvance && (conditionlessMobile || (isLastStep && isComplete));
    const actionText = shouldAddToCart
      ? this._resolveText('addToCartButton', 'Add to Cart')
      : this._resolveText('nextButton', 'Next');
    const priceText = CurrencyManager.convertAndFormat(finalPrice, currencyInfo);
    const labelSpan = document.createElement('span');
    labelSpan.className = 'fpb-mobile-summary-action-label';
    labelSpan.textContent = actionText;
    const separatorSpan = document.createElement('span');
    separatorSpan.className = 'fpb-mobile-summary-action-separator';
    separatorSpan.textContent = '•';
    const priceSpan = document.createElement('span');
    priceSpan.className = 'fpb-mobile-summary-action-price';
    priceSpan.textContent = priceText;
    ctaBtn.append(labelSpan, separatorSpan, priceSpan);
    if (shouldAddToCart && (conditionlessMobile ? !hasSelectionMobile : !isComplete)) ctaBtn.disabled = true;
    ctaBtn.addEventListener('click', () => {
      if (shouldAddToCart) {
        this.addBundleToCart();
      } else {
        const targetStepIndex = hasUpcomingAddonStep ? this.freeGiftStepIndex : this.currentStepIndex + 1;
        if (this.canNavigateToStep(targetStepIndex) && this.canProceedToNextStep()) {
          this.activeCollectionId = null;
          this.searchQuery = '';
          this.currentStepIndex = targetStepIndex;
          this.renderFullPageLayoutWithSidebar();
        } else if (!this.canNavigateToStep(targetStepIndex)) {
          ToastManager.show(this.freeGiftStep?.addonLabel || this.freeGiftStep?.freeGiftName ? `Complete all steps to unlock the free ${this.freeGiftStep?.addonLabel || this.freeGiftStep?.freeGiftName}!` : 'Complete all steps first.');
        } else {
          ToastManager.show('Please meet the quantity conditions for the current step before proceeding.');
        }
      }
    });
    return ctaBtn;
  }

  getBundleSummaryText() {
    const summary = this.selectedBundle?.bundleTextConfig?.bundleSummary || {};
    return {
      title: typeof summary.title === 'string' && summary.title.trim()
        ? summary.title
        : 'Your Bundle',
      subTitle: typeof summary.subTitle === 'string' && summary.subTitle.trim()
        ? summary.subTitle
        : 'Review your bundle'
    };
  }

  getBundleContentSummaryText() {
    const summary = this.selectedBundle?.bundleTextConfig?.bundleSummary || {};
    return {
      title: typeof summary.title === 'string' ? summary.title.trim() : '',
      subTitle: typeof summary.subTitle === 'string' ? summary.subTitle.trim() : ''
    };
  }

  getCurrentStepContentText(stepIndex) {
    const step = this.selectedBundle?.steps?.[stepIndex];
    return {
      subtext: typeof step?.pageTitle === 'string' ? step.pageTitle.trim() : ''
    };
  }

  createStepContentHeader(stepIndex) {
    const contentText = this.getCurrentStepContentText(stepIndex);
    if (!contentText.subtext) return null;

    const header = document.createElement('div');
    header.className = 'fpb-full-page-content-header';

    const subtitle = document.createElement('p');
    subtitle.className = 'fpb-full-page-content-subtitle fpb-step-subtext';
    subtitle.textContent = contentText.subtext;
    header.appendChild(subtitle);

    return header;
  }

  shouldRenderFullPageSearch() {
    return this.resolveFullPageCardCtaMode() !== 'icon';
  }

  usesSelectedQuantityBadge() {
    return this.resolveFullPageCardCtaMode() === 'icon';
  }

  // Render the sidebar panel content (used by footer_side layout)
  renderSidePanel(panel) {
    if (!panel) return;
    panel.innerHTML = '';

    const { totalPrice, totalQuantity, unitPrices } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData,
      this.selectedBundle?.steps
    );
    const discountInfo = PricingCalculator.calculateDiscount(
      this.selectedBundle,
      totalPrice,
      totalQuantity,
      unitPrices
    );
    const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const finalPrice = combinedDiscountInfo.hasDiscount ? combinedDiscountInfo.finalPrice : totalPrice;
    const allSelectedProducts = this.getAllSelectedProductsData();
    const nextRule = PricingCalculator.getNextDiscountRule?.(this.selectedBundle, totalQuantity) || null;
    const isMobileSheet = panel.classList?.contains('fpb-mobile-bottom-sheet');
    const summaryText = this.getBundleSummaryText();

    // Header: "Your Bundle" + Clear
    const header = document.createElement('div');
    header.className = 'side-panel-header';
    const headerTitle = document.createElement('span');
    headerTitle.className = 'side-panel-title';
    headerTitle.textContent = summaryText.title;
    header.appendChild(headerTitle);

    if (allSelectedProducts.length > 0) {
      const clearBtn = document.createElement('button');
      clearBtn.className = 'side-panel-clear-btn';
      clearBtn.innerHTML = `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor"><path d="M6 2h8a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1Zm-2 3h12l-1 13H5L4 5Zm4 2v9m4-9v9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg> Clear`;
      clearBtn.addEventListener('click', () => {
        this.selectedProducts = this.selectedBundle.steps.map(() => ({}));
        this.reRenderFullPage();
      });
      header.appendChild(clearBtn);
    }
    panel.appendChild(header);

    // Subtitle — "Review your bundle"
    const subtitle = document.createElement('p');
    subtitle.className = 'side-panel-subtitle';
    subtitle.textContent = summaryText.subTitle;
    panel.appendChild(subtitle);

    const boxSelection = this.renderBoxSelectionOptions(totalQuantity);
    if (boxSelection) {
      panel.appendChild(boxSelection);
    }

    // Discount messaging
    if (this.selectedBundle?.pricing?.enabled) {
      const variables = TemplateManager.createDiscountVariables(
        this.selectedBundle, totalPrice, totalQuantity, combinedDiscountInfo, currencyInfo
      );
      let discountMessage = '';
      if (combinedDiscountInfo.hasDiscount) {
        discountMessage = TemplateManager.replaceVariables(
          this.config.successMessageTemplate || '🎉 You unlocked {{discountText}}!',
          variables
        );
      } else if (nextRule) {
        discountMessage = TemplateManager.replaceVariables(
          this.config.discountTextTemplate || 'Add {conditionText} to get {discountText}',
          variables
        );
      }
      if (discountMessage) {
        const msgEl = document.createElement('div');
        msgEl.className = 'side-panel-discount-message';
        msgEl.innerHTML = discountMessage;
        panel.appendChild(msgEl);
      }

      if (this.config.showDiscountProgressBar) {
        const progressBar = this._renderDiscountProgress({
          placement: "sidebar",
          combinedDiscountInfo,
          totalPrice,
          totalQuantity,
          unitPrices,
        });
        if (progressBar) {
          progressBar.classList.add('fpb-dp-sidebar');
          panel.appendChild(progressBar);
        }
      }
    }

    // Item count label
    const countLabel = document.createElement('div');
    countLabel.className = 'side-panel-item-count';
    countLabel.textContent = `${allSelectedProducts.length} item${allSelectedProducts.length !== 1 ? 's' : ''}`;
    panel.appendChild(countLabel);

    // Selected products list
    const productsContainer = document.createElement('div');
    productsContainer.className = 'side-panel-products';

    if (allSelectedProducts.length > 0) {
      allSelectedProducts.forEach(item => {
        const row = document.createElement('div');
        row.className = 'side-panel-product-row';

        const imgSrc = item.image || item.imageUrl || '';
        const variantInfo = item.variantTitle && item.variantTitle !== 'Default Title' ? item.variantTitle : '';

        const isFreeGiftItem = item.isFreeGift === true && item.addonDisplayFree === true;
        const qtySpan = `<span class="side-panel-product-qty">×${item.quantity}</span>`;
        const priceHtml = isFreeGiftItem
          ? `<span class="side-panel-product-price free-gift-price">${CurrencyManager.convertAndFormat(0, currencyInfo)}</span><span class="side-panel-product-original-price">${CurrencyManager.convertAndFormat(item.price * item.quantity, currencyInfo)} ${qtySpan}</span>`
          : `<span class="side-panel-product-price">${CurrencyManager.convertAndFormat(item.price * item.quantity, currencyInfo)} ${qtySpan}</span>`;

        row.innerHTML = `
          <div class="side-panel-product-img-wrap">
            ${imgSrc ? `<img src="${imgSrc}" alt="${this._escapeHTML(item.title)}" class="side-panel-product-img">` : '<div class="side-panel-product-img-placeholder"></div>'}
            ${item.quantity > 1 ? `<span class="side-panel-qty-badge">${item.quantity}</span>` : ''}
          </div>
          <div class="side-panel-product-info">
            <span class="side-panel-product-title">${this._escapeHTML(item.title)}</span>
            ${variantInfo ? `<span class="side-panel-product-variant">${this._escapeHTML(variantInfo)}</span>` : ''}
          </div>
          ${priceHtml}
        `;

        // Remove button — hidden for default (mandatory) products
        if (!item.isDefault) {
          const removeBtn = document.createElement('button');
          removeBtn.className = 'side-panel-product-remove';
          removeBtn.innerHTML = `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"><path d="M6 2h8a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1Zm-2 3h12l-1 13H5L4 5Zm4 2v9m4-9v9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>`;
          removeBtn.addEventListener('click', () => {
            const stepIndex = item.stepIndex;
            const productId = item.variantId || item.productId || item.id;
            const removedItem = { stepIndex, variantId: productId, quantity: item.quantity, title: item.title };
            this.updateProductSelection(stepIndex, productId, 0);
            const truncated = removedItem.title && removedItem.title.length > 25 ? removedItem.title.substring(0, 25) + '...' : (removedItem.title || 'Product');
            ToastManager.showWithUndo(
              `Removed "${truncated}"`,
              () => { this.updateProductSelection(removedItem.stepIndex, removedItem.variantId, removedItem.quantity); },
              5000
            );
          });
          row.appendChild(removeBtn);
        }

        productsContainer.appendChild(row);
      });
    }
    panel.appendChild(productsContainer);

    if (!isMobileSheet && allSelectedProducts.length === 0) {
      const skeletonContainer = document.createElement('div');
      skeletonContainer.className = 'side-panel-skeleton-slots';
      this._renderSidebarProductSkeletons(skeletonContainer);
      panel.appendChild(skeletonContainer);
    }

    // Free gift section (locked or unlocked)
    this._renderFreeGiftSection(panel);

    // Total
    const totalSection = document.createElement('div');
    totalSection.className = 'side-panel-total';
    totalSection.innerHTML = `
      <span class="side-panel-total-label">Total</span>
      <div class="side-panel-total-prices">
        ${combinedDiscountInfo.hasDiscount ? `<span class="side-panel-total-original">${CurrencyManager.convertAndFormat(totalPrice, currencyInfo)}</span>` : ''}
        <span class="side-panel-total-final">${CurrencyManager.convertAndFormat(finalPrice, currencyInfo)}</span>
      </div>
    `;
    if (isMobileSheet) {
      panel.appendChild(totalSection);
      return;
    }

    // Action row
    const actionSection = document.createElement('div');
    actionSection.className = 'side-panel-action-container';
    actionSection.appendChild(totalSection);

    const navSection = document.createElement('div');
    navSection.className = 'side-panel-nav';

    const isLastStep = this.currentStepIndex === this.selectedBundle.steps.length - 1;
    const canProceed = this.canProceedToNextStep();
    const conditionless = this.bundleHasNoConditions();
    const hasSelection = conditionless && this.getAllSelectedProductsData().length > 0;

    const nextBtn = document.createElement('button');
    nextBtn.className = 'side-panel-btn side-panel-btn-next';
    nextBtn.textContent = (conditionless || isLastStep) ? 'Add to Cart' : 'Next Step';
    if (conditionless ? !hasSelection : (isLastStep ? !this.areBundleConditionsMet() : !canProceed)) {
      nextBtn.disabled = true;
    }
    nextBtn.addEventListener('click', () => {
      if (conditionless || isLastStep) {
        this.addBundleToCart();
      } else if (!this.canNavigateToStep(this.currentStepIndex + 1)) {
        const giftName = this.freeGiftStep?.addonLabel || this.freeGiftStep?.freeGiftName;
        ToastManager.show(giftName ? `Complete all steps to unlock ${giftName}!` : 'Complete all steps first.');
      } else if (this.canProceedToNextStep()) {
        this.activeCollectionId = null;
        this.searchQuery = '';
        this.currentStepIndex++;
        this.renderFullPageLayoutWithSidebar();
      } else {
        ToastManager.show('Please meet the quantity conditions for the current step before proceeding.');
      }
    });

    navSection.appendChild(nextBtn);
    actionSection.appendChild(navSection);
    panel.appendChild(actionSection);
  }

  getBoxSelectionRules() {
    const boxSelection = this.selectedBundle?.boxSelection;
    if (!boxSelection || boxSelection.isEnabled !== true || !Array.isArray(boxSelection.rules)) {
      return [];
    }

    return boxSelection.rules
      .map(rule => ({
        ruleId: String(rule.ruleId || ''),
        boxQuantity: Number(rule.boxQuantity || 0),
        boxLabel: String(rule.boxLabel || ''),
        boxSubtext: String(rule.boxSubtext || ''),
        isDefaultSelected: rule.isDefaultSelected === true,
      }))
      .filter(rule => rule.ruleId && rule.boxQuantity > 0)
      .sort((a, b) => a.boxQuantity - b.boxQuantity);
  }

  getActiveBoxSelectionRule(rules, totalQuantity) {
    if (!Array.isArray(rules) || rules.length === 0) return null;

    const selected = this.selectedBoxSelectionRuleId
      ? rules.find(rule => rule.ruleId === this.selectedBoxSelectionRuleId)
      : null;
    if (selected) return selected;

    const reachedRule = rules
      .filter(rule => Number(totalQuantity || 0) >= rule.boxQuantity)
      .sort((a, b) => b.boxQuantity - a.boxQuantity)[0];
    if (reachedRule) return reachedRule;

    return rules.find(rule => rule.isDefaultSelected) || rules[0];
  }

  renderBoxSelectionOptions(totalQuantity = 0) {
    const rules = this.getBoxSelectionRules();
    if (rules.length === 0) return null;

    const activeRule = this.getActiveBoxSelectionRule(rules, totalQuantity);
    const wrapper = document.createElement('div');
    wrapper.className = 'fpb-box-selection-wrapper';

    rules.forEach(rule => {
      const option = document.createElement('button');
      const isActive = activeRule?.ruleId === rule.ruleId;
      option.type = 'button';
      option.className = 'fpb-box-selection-option' + (isActive ? ' fpb-box-selection-option-active' : '');
      option.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      option.dataset.ruleId = rule.ruleId;

      const title = document.createElement('span');
      title.className = 'fpb-box-selection-title';
      title.textContent = rule.boxLabel;
      option.appendChild(title);

      if (rule.boxSubtext) {
        const subtext = document.createElement('span');
        subtext.className = 'fpb-box-selection-subtext';
        subtext.textContent = rule.boxSubtext;
        option.appendChild(subtext);
      }

      option.addEventListener('click', () => {
        this.selectedBoxSelectionRuleId = rule.ruleId;
        this.reRenderFullPage();
      });

      wrapper.appendChild(option);
    });

    return wrapper;
  }

  // Escape HTML special characters to prevent innerHTML injection
  _escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Returns default SVG icon markup for a step based on its type
  _getDefaultTimelineIcon(step) {
    if (step.isDefault) {
      // Included/locked step — lock icon
      return `<svg class="timeline-step-icon--svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    }
    if (step.isFreeGift) {
      // Free gift step — gift box icon
      return `<svg class="timeline-step-icon--svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polyline points="20 12 20 22 4 22 4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="2" y="7" width="20" height="5" rx="1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="12" y1="22" x2="12" y2="7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    }
    // Regular step — shopping bag icon
    return `<svg class="timeline-step-icon--svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  _getStepSelectedQuantity(stepIndex) {
    const stepSelections = this.selectedProducts?.[stepIndex] || {};
    return Object.values(stepSelections).reduce((total, qty) => total + (Number(qty) || 0), 0);
  }

  _getStepRequiredQuantity(step) {
    if (!step) return 1;

    const toNumber = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const primaryValue = toNumber(step.conditionValue);
    const secondaryValue = toNumber(step.conditionValue2);
    const minQuantity = toNumber(step.minQuantity);
    const maxQuantity = toNumber(step.maxQuantity);
    const OPERATORS = ConditionValidator.OPERATORS;

    const targetForOperator = (operator, value) => {
      if (value == null) return null;
      switch (operator) {
        case OPERATORS.GREATER_THAN:
          return value + 1;
        case OPERATORS.LESS_THAN:
          return Math.max(1, value - 1);
        case OPERATORS.LESS_THAN_OR_EQUAL_TO:
        case OPERATORS.EQUAL_TO:
        case OPERATORS.GREATER_THAN_OR_EQUAL_TO:
          return value;
        default:
          return null;
      }
    };

    const targets = [
      targetForOperator(step.conditionOperator, primaryValue),
      targetForOperator(step.conditionOperator2, secondaryValue),
      minQuantity,
      maxQuantity,
    ].filter((value) => value != null && value > 0);

    return targets.length > 0 ? Math.max(...targets) : 1;
  }

  _getStepProgressRatio(stepIndex) {
    const step = this.selectedBundle?.steps?.[stepIndex];
    if (!step) return 0;
    if (this.isStepCompleted(stepIndex)) return 1;

    const requiredQuantity = this._getStepRequiredQuantity(step);
    const selectedQuantity = this._getStepSelectedQuantity(stepIndex);
    return Math.max(0, Math.min(1, selectedQuantity / requiredQuantity));
  }

  buildStepTimelineEntries() {
    const steps = Array.isArray(this.selectedBundle?.steps) ? this.selectedBundle.steps : [];
    const entries = [];

    steps.forEach((step, index) => {
      const stepLabel = (step.isFreeGift && step.addonLabel) ? step.addonLabel : step.name;
      entries.push({
        type: 'step',
        step,
        stepIndex: index,
        label: stepLabel,
      });

      if (this.shouldRenderMultipleCategoryTimelineEntry(step)) {
        entries.push({
          type: 'multiple_categories',
          step,
          stepIndex: index,
          label: 'Multiple Categories',
        });
      }
    });

    return entries;
  }

  shouldRenderMultipleCategoryTimelineEntry(step) {
    if (!step || step.isFreeGift === true) return false;
    return this.getStepCategoryTabEntries(step).length > 1;
  }

  // Create circular icon-based step timeline with connecting lines and three icon states
  createStepTimeline() {
    const timeline = document.createElement('div');
    timeline.className = 'step-timeline';

    if (!this.selectedBundle || !this.selectedBundle.steps) {
      return timeline;
    }

    const timelineEntries = this.buildStepTimelineEntries();

    timelineEntries.forEach((entry, displayIndex) => {
      const step = entry.step;
      const index = entry.stepIndex;
      const stepEl = document.createElement('div');
      stepEl.className = 'timeline-step';
      stepEl.dataset.stepIndex = index;
      stepEl.dataset.timelineType = entry.type;

      // Determine step state
      const isDefaultStep = step.isDefault === true;
      const hasMultipleCategoryEntry = this.shouldRenderMultipleCategoryTimelineEntry(step);
      const isCategoryEntry = entry.type === 'multiple_categories';
      const isCompleted = isCategoryEntry ? this.isStepCompleted(index) : this.isStepCompleted(index) || (hasMultipleCategoryEntry && index === this.currentStepIndex);
      const isCurrent = index === this.currentStepIndex && (!hasMultipleCategoryEntry || isCategoryEntry);
      const isAccessible = this.isStepAccessible(index);

      if (isDefaultStep) stepEl.classList.add('timeline-step--included');
      if (isCurrent) stepEl.classList.add('timeline-step--active');
      if (isCompleted) stepEl.classList.add('timeline-step--completed');
      if (!isCurrent && !isCompleted) stepEl.classList.add('timeline-step--inactive');
      if (!isAccessible) stepEl.classList.add('timeline-step--locked');

      const tabLabel = entry.label;
      const escapedName = this._escapeHTML(tabLabel) || `Step ${index + 1}`;

      // Icon: addon-uploaded, then Step Config image, else default SVG.
      const uploadedIconUrl = (step.isFreeGift && step.addonIconUrl) ? step.addonIconUrl : step.stepImage;
      const iconContent = uploadedIconUrl
        ? `<img class="timeline-step-icon" src="${uploadedIconUrl}" alt="${escapedName}">`
        : this._getDefaultTimelineIcon(step);

      // Checkmark badge — always rendered, shown via CSS only when completed
      const checkmarkSvg = `<svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 6L5 9L10 3" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;

      stepEl.innerHTML = `
        <div class="timeline-icon-wrapper">
          ${iconContent}
          <div class="timeline-checkmark">${checkmarkSvg}</div>
        </div>
        <span class="timeline-step-name">${escapedName}</span>
      `;

      // Click handler — accessible steps only
      if (entry.type === 'step' && isAccessible && !isDefaultStep) {
        stepEl.style.cursor = 'pointer';
        stepEl.addEventListener('click', () => {
          if (!this.isStepAccessible(index)) {
            ToastManager.show('Please complete the previous steps first.');
            return;
          }
          if (index > this.currentStepIndex && !this.canProceedToNextStep()) {
            ToastManager.show('Please meet the step conditions before proceeding.');
            return;
          }
          this.currentStepIndex = index;
          this.searchQuery = '';
          this.activeCollectionId = null;
          this.reRenderFullPage();
        });
      }

      timeline.appendChild(stepEl);

      // Connector — sibling between steps (not child), so flex layout drives width
      if (displayIndex < timelineEntries.length - 1) {
        const connectorEl = document.createElement('div');
        connectorEl.className = 'timeline-connector';
        const connectorFill = document.createElement('div');
        connectorFill.className = 'timeline-connector-fill';
        connectorFill.style.display = 'block';
        connectorFill.style.width = `${Math.round(this._getStepProgressRatio(index) * 100)}%`;
        connectorEl.appendChild(connectorFill);
        timeline.appendChild(connectorEl);
      }
    });

    return timeline;
  }

  // Returns a full-width banner image element for the active step, or null if not configured
  createStepBannerImage(stepIndex) {
    const step = (this.selectedBundle?.steps || [])[stepIndex];
    if (!step?.bannerImageUrl) return null;

    const wrapper = document.createElement('div');
    wrapper.className = 'step-banner-image';
    const img = document.createElement('img');
    img.src = step.bannerImageUrl;
    img.alt = this._escapeHTML(step.name || '');
    wrapper.appendChild(img);
    return wrapper;
  }

  // Get a compact quantity hint string for a step tab (e.g. "Pick 2" or "Pick 2–5")
  getStepQuantityHint(step) {
    if (!step) return null;

    const { conditionOperator, conditionValue, conditionOperator2, conditionValue2, minQuantity, maxQuantity } = step;
    const OPERATORS = ConditionValidator.OPERATORS;

    if (conditionOperator && conditionValue != null) {
      const val = Number(conditionValue);

      // Range condition: primary AND secondary
      if (conditionOperator2 && conditionValue2 != null) {
        const val2 = Number(conditionValue2);
        const min = Math.min(val, val2);
        const max = Math.max(val, val2);
        return `Pick ${min}–${max}`;
      }

      switch (conditionOperator) {
        case OPERATORS.EQUAL_TO:                  return `Pick ${val}`;
        case OPERATORS.GREATER_THAN:              return `Pick ${val + 1}+`;
        case OPERATORS.GREATER_THAN_OR_EQUAL_TO:  return `Pick ${val}+`;
        case OPERATORS.LESS_THAN:                 return `Up to ${val - 1}`;
        case OPERATORS.LESS_THAN_OR_EQUAL_TO:     return `Up to ${val}`;
        default:                                  return null;
      }
    }

    // Fallback to minQuantity / maxQuantity
    const min = minQuantity != null ? Number(minQuantity) : null;
    const max = maxQuantity != null ? Number(maxQuantity) : null;
    if (min && max && min !== max) return `Pick ${min}–${max}`;
    if (min && min > 1) return `Pick ${min}+`;
    if (max && max > 1) return `Up to ${max}`;
    return null;
  }

  // Get product images for a step (helper for tabs)
  getStepProductImages(stepIndex) {
    const selectedProducts = this.selectedProducts[stepIndex] || {};
    const productImages = [];

    Object.entries(selectedProducts).forEach(([variantId, quantity]) => {
      if (quantity > 0) {
        const product = this.stepProductData[stepIndex]?.find(p => (p.variantId || p.id) === variantId);
        if (product && product.imageUrl && !productImages.find(img => img.url === product.imageUrl)) {
          productImages.push({
            url: product.imageUrl,
            alt: product.title || 'Product'
          });
        }
      }
    });

    return productImages;
  }

  // Create search input for filtering products within the current step
  createSearchInput() {
    const searchContainer = document.createElement('div');
    searchContainer.className = 'step-search-container';

    searchContainer.innerHTML = `
      <div class="step-search-input-wrapper">
        <svg class="step-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          class="step-search-input"
          placeholder="Search products..."
          value="${this.searchQuery}"
          autocomplete="off"
        />
        <button class="step-search-clear" type="button" style="display: ${this.searchQuery ? 'flex' : 'none'}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `;

    const input = searchContainer.querySelector('.step-search-input');
    const clearBtn = searchContainer.querySelector('.step-search-clear');

    // Handle input with debounce
    input.addEventListener('input', (e) => {
      const value = e.target.value;

      // Show/hide clear button
      clearBtn.style.display = value ? 'flex' : 'none';

      // Debounce the search
      if (this.searchDebounceTimer) {
        clearTimeout(this.searchDebounceTimer);
      }

      this.searchDebounceTimer = setTimeout(() => {
        this.searchQuery = value;
        this.updateProductGridWithSearch();
      }, 300);
    });

    // Handle clear button
    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.style.display = 'none';
      this.searchQuery = '';
      this.updateProductGridWithSearch();
      input.focus();
    });

    // Handle escape key to clear
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        input.value = '';
        clearBtn.style.display = 'none';
        this.searchQuery = '';
        this.updateProductGridWithSearch();
      }
    });

    return searchContainer;
  }

  // Update product grid when search query changes (without full re-render)
  updateProductGridWithSearch() {
    const gridContainer = this.container.querySelector('.full-page-product-grid-container');
    if (!gridContainer) return;

    const productGrid = this.createFullPageProductGrid(this.currentStepIndex);
    gridContainer.innerHTML = '';
    gridContainer.appendChild(productGrid);
  }

  // Hide the page title element from the theme template
  // This prevents showing the page name (e.g., "StrangeObjectsinmirror") above the bundle
  hidePageTitle() {
    // Try multiple selectors to find the page title element
    const selectors = [
      '.main-page-title',
      '.page-title',
      'h1.page-title',
      '.page-width h1',
      '.section-template--*__main-padding h1',
      '[class*="main-padding"] h1.h0'
    ];

    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          // Check if this is a page title element (not our promo banner)
          if (el.closest('.promo-banner')) return;

          // Hide the element
          el.style.display = 'none';
        });
      } catch (e) {
        // Selector might be invalid, continue to next
      }
    }

    // Also hide any parent containers that only contain the title
    const pageTitleContainers = document.querySelectorAll('.page-width--narrow');
    pageTitleContainers.forEach(container => {
      // Only hide if the container has a page title and not much else
      const hasPageTitle = container.querySelector('.main-page-title, .page-title, h1.h0');
      const hasOtherContent = container.querySelector('.rte:not(:empty), .bundle-widget, #bundle-builder-app');

      if (hasPageTitle && !hasOtherContent) {
        container.style.display = 'none';
      }
    });
  }

  // Create promotional banner (Competitor-Inspired with gradient hero style)
  // Shows bundle title with optional discount info from DCP
  createPromoBanner() {
    // Check if promo banner is disabled via theme editor settings
    if (this.config.showPromoBanner === false) {
      return null;
    }

    // Check if promo banner is enabled via DCP CSS variable
    const promoBannerEnabled = getComputedStyle(document.documentElement)
      .getPropertyValue('--bundle-promo-banner-enabled')
      .trim();

    // If explicitly disabled (value is '0'), don't create the banner
    if (promoBannerEnabled === '0') {
      return null;
    }

    const bundleName = this.selectedBundle?.name || 'Build Your Bundle';
    const pricing = this.selectedBundle?.pricing;
    const rules = pricing?.rules || [];
    const currencyInfo = CurrencyManager.getCurrencyInfo();

    // Start with the bundle name as the main title
    let promoTitle = bundleName;
    let promoSubtitle = '';
    let promoNote = '';
    let discountMessage = '';

    if (pricing?.enabled && rules.length > 0) {
      const pricingMethod = pricing.method || 'percentage_off';
      const bestRule = rules.reduce((best, rule) => {
        const dv = rule.discountValue ?? 0;
        const bestDv = best.discountValue ?? 0;
        const isPercent = pricingMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF;
        const discountValue = isPercent ? dv : dv / 100;
        const bestValue = isPercent ? bestDv : bestDv / 100;
        return discountValue > bestValue ? rule : best;
      }, rules[0]);

      const targetQty = bestRule.conditionValue ?? 0;
      const conditionOperator = bestRule.conditionOperator;
      const discountMethod = pricingMethod;
      const discountValue = bestRule.discountValue ?? 0;

      // Build operator-aware quantity text
      const qtyText = TemplateManager.formatOperatorText(conditionOperator, targetQty, 'item');

      if (discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF && discountValue > 0) {
        discountMessage = `Add ${qtyText} and get ${discountValue}% off!`;
      } else if (discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_AMOUNT_OFF && discountValue > 0) {
        const formattedAmount = CurrencyManager.convertAndFormat(discountValue, currencyInfo);
        discountMessage = `Add ${qtyText} and save ${formattedAmount}!`;
      } else if (discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_BUNDLE_PRICE && discountValue > 0) {
        const formattedPrice = CurrencyManager.convertAndFormat(discountValue, currencyInfo);
        discountMessage = `Add ${qtyText} for just ${formattedPrice}!`;
      }
    }

    // Use custom banner message if configured (overrides discount message)
    if (pricing?.messages?.banner) {
      discountMessage = pricing.messages.banner;
    }

    // Determine layout based on whether we have a discount
    // Use theme editor settings for customizable text
    if (discountMessage) {
      // With discount: Use subtitle from theme settings, discount as note
      promoSubtitle = this.config.promoBannerSubtitle || 'Mix & Match';
      promoNote = discountMessage;
    } else {
      // No discount: Use tagline and note from theme settings
      promoSubtitle = this.config.promoBannerTagline || 'Create Your Perfect Bundle';
      promoNote = this.config.promoBannerNote || 'Mix & Match Your Favorites';
    }

    const banner = document.createElement('div');
    banner.className = 'promo-banner';
    banner.classList.add(discountMessage ? 'has-discount' : 'no-discount');
    banner.innerHTML = `
      ${promoSubtitle ? `<div class="promo-banner-subtitle">${ComponentGenerator.escapeHtml(promoSubtitle)}</div>` : ''}
      <h2 class="promo-banner-title">${ComponentGenerator.escapeHtml(promoTitle)}</h2>
      ${promoNote ? `<div class="promo-banner-note">${ComponentGenerator.escapeHtml(promoNote)}</div>` : ''}
    `;

    // Apply per-bundle promo banner background image directly as inline style.
    // Using banner.style.backgroundImage (not a CSS custom property) so the inline style
    // always wins regardless of theme stylesheet specificity.
    const bgImageUrl = this.selectedBundle && this.selectedBundle.promoBannerBgImage;
    if (bgImageUrl) {
      banner.style.backgroundImage = `url('${bgImageUrl}')`;
      banner.style.backgroundSize = 'cover';
      banner.style.backgroundPosition = 'center';

      // Apply crop offsets when crop data is present (overrides cover/center defaults above)
      const cropRaw = this.selectedBundle && this.selectedBundle.promoBannerBgImageCrop;
      if (cropRaw) {
        try {
          const crop = JSON.parse(cropRaw);
          const cw = crop.width / 100;    // normalized crop width (0–1)
          const ch = cw * (3 / 16);       // derived height fraction (same aspect as banner)
          const cx = crop.x / 100;        // normalized left edge
          const cy = crop.y / 100;        // normalized top edge
          const bgSize = `${(1 / cw) * 100}%`;
          const posX = (1 - cw) === 0 ? 0 : Math.min(100, Math.max(0, (cx / (1 - cw)) * 100));
          const posY = (1 - ch) === 0 ? 0 : Math.min(100, Math.max(0, (cy / (1 - ch)) * 100));
          banner.style.backgroundSize = bgSize;
          banner.style.backgroundPosition = `${posX}% ${posY}%`;
        } catch (_e) {
          // Invalid crop JSON — fall back to default cover/center set above
        }
      }
    }

    return banner;
  }

  collectStepProductIds(step) {
    const productIds = [];
    const addProductId = (product) => {
      const id = product?.id || product?.graphqlId || product?.productId;
      if (id && !productIds.includes(id)) productIds.push(id);
    };

    (step.products || []).forEach(addProductId);
    (step.categories || []).forEach(category => {
      (category.products || []).forEach(addProductId);
      (category.selectedProducts || []).forEach(addProductId);
    });

    return productIds;
  }

  collectStepCollectionHandles(step) {
    const handles = [];
    const addCollectionHandle = (collection) => {
      const handle = collection?.handle;
      if (handle && !handles.includes(handle)) handles.push(handle);
    };

    (step.collections || []).forEach(addCollectionHandle);
    (step.categories || []).forEach(category => {
      (category.collections || []).forEach(addCollectionHandle);
      (category.collectionsData || []).forEach(addCollectionHandle);
      (category.collectionsSelectedData || []).forEach(addCollectionHandle);
    });

    return handles;
  }

  getStepCategoryTabEntries(step) {
    if (!Array.isArray(step.categories)) return [];

    return step.categories
      .map((category, index) => {
        const id = category.categoryId || category.id || `category-${index}`;
        const title = category.title || category.name;
        if (!id || !title) return null;

        const handles = [];
        const productIds = [];
        const addHandle = (collection) => {
          const handle = collection?.handle;
          if (handle && !handles.includes(handle)) handles.push(handle);
        };
        const addProductId = (product) => {
          const productId = product?.id || product?.graphqlId || product?.productId;
          if (productId && !productIds.includes(productId)) productIds.push(productId);
        };

        (category.collections || []).forEach(addHandle);
        (category.collectionsData || []).forEach(addHandle);
        (category.collectionsSelectedData || []).forEach(addHandle);
        (category.products || []).forEach(addProductId);
        (category.selectedProducts || []).forEach(addProductId);

        return {
          id,
          title,
          handles,
          productIds,
          displayVariantsAsIndividualProducts: category.displayVariantsAsIndividualProducts === true,
          displayVariantsAsSwatches: category.displayVariantsAsSwatches === true,
        };
      })
      .filter(entry => entry && (entry.handles.length > 0 || entry.productIds.length > 0));
  }

  getActiveStepCategoryId(step) {
    const categoryEntries = this.getStepCategoryTabEntries(step);
    if (categoryEntries.length === 0) return this.activeCollectionId;
    if (this.activeCollectionId && categoryEntries.some(entry => entry.id === this.activeCollectionId)) {
      return this.activeCollectionId;
    }
    return categoryEntries[0].id;
  }

  getActiveStepCategoryEntry(step) {
    const categoryEntries = this.getStepCategoryTabEntries(step);
    const activeCategoryId = this.getActiveStepCategoryId(step);
    return categoryEntries.find(entry => entry.id === activeCategoryId) || null;
  }

  shouldDisplayVariantsAsIndividualForProductGrid(step, activeCategory) {
    if (activeCategory) {
      return activeCategory.displayVariantsAsIndividualProducts === true;
    }

    const hasCategoryEntries = this.getStepCategoryTabEntries(step).length > 0;
    if (hasCategoryEntries) {
      return false;
    }

    return step?.displayVariantsAsIndividualProducts === true || step?.displayVariantsAsIndividual === true;
  }

  createActiveCategoryTitle(stepIndex) {
    if (!this.selectedBundle || !this.selectedBundle.steps || !this.selectedBundle.steps[stepIndex]) {
      return null;
    }

    const activeCategory = this.getActiveStepCategoryEntry(this.selectedBundle.steps[stepIndex]);
    if (!activeCategory?.title) return null;

    const title = document.createElement('div');
    title.className = 'fpb-step-category-title';
    title.textContent = activeCategory.title;
    return title;
  }

  createCategorySectionRows(stepIndex) {
    if (!this.selectedBundle || !this.selectedBundle.steps || !this.selectedBundle.steps[stepIndex]) {
      return null;
    }

    const step = this.selectedBundle.steps[stepIndex];
    const categoryEntries = this.getStepCategoryTabEntries(step);
    if (categoryEntries.length <= 1) return null;

    const activeCategoryId = this.getActiveStepCategoryId(step);
    const inactiveCategoryEntries = categoryEntries.filter(entry => entry.id !== activeCategoryId);
    if (inactiveCategoryEntries.length === 0) return null;

    const categoryRowsContainer = document.createElement('div');
    categoryRowsContainer.className = 'fpb-category-section-rows';

    inactiveCategoryEntries.forEach(entry => {
      const categoryRow = document.createElement('button');
      categoryRow.type = 'button';
      categoryRow.className = 'fpb-category-section-row fpb-category-section-row--collapsed';
      categoryRow.textContent = entry.title;
      categoryRow.addEventListener('click', () => {
        this.activeCollectionId = entry.id;
        this.reRenderFullPage();
      });
      categoryRowsContainer.appendChild(categoryRow);
    });

    return categoryRowsContainer;
  }

  createCategoryTabs(stepIndex) {
    if (!this.selectedBundle || !this.selectedBundle.steps || !this.selectedBundle.steps[stepIndex]) {
      return null;
    }

    const step = this.selectedBundle.steps[stepIndex];
    const categoryEntries = this.getStepCategoryTabEntries(step);
    const hasCategoryEntries = categoryEntries.length > 0;

    if (categoryEntries.length === 0 && (!step.collections || step.collections.length === 0)) {
      return null;
    }

    const customFilters = Array.isArray(step.filters) && step.filters.length > 0
      ? step.filters
      : null;

    let tabEntries;
    if (hasCategoryEntries) {
      tabEntries = categoryEntries;
    } else if (customFilters) {
      tabEntries = customFilters
        .map(f => {
          const col = step.collections.find(c => (c.handle || c.id) === f.collectionHandle);
          return col ? { id: col.id, title: f.label } : null;
        })
        .filter(Boolean);
    } else {
      tabEntries = step.collections.map(c => ({ id: c.id, title: c.title }));
    }

    if (tabEntries.length === 0) {
      return null;
    }

    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'category-tabs';

    const activeCategoryId = hasCategoryEntries ? this.getActiveStepCategoryId(step) : this.activeCollectionId;

    if (!hasCategoryEntries) {
      const allTab = document.createElement('button');
      allTab.className = 'category-tab';
      if (!this.activeCollectionId) {
        allTab.classList.add('active');
      }
      allTab.innerHTML = `<span class="tab-label">All</span>`;
      allTab.addEventListener('click', () => {
        this.activeCollectionId = null;
        this.reRenderFullPage();
      });
      tabsContainer.appendChild(allTab);
    }

    tabEntries.forEach(entry => {
      const tab = document.createElement('button');
      tab.className = 'category-tab';
      if (activeCategoryId === entry.id) {
        tab.classList.add('active');
      }
      tab.innerHTML = `<span class="tab-label">${ComponentGenerator.escapeHtml(entry.title)}</span>`;
      tab.addEventListener('click', () => {
        this.activeCollectionId = entry.id;
        this.reRenderFullPage();
      });
      tabsContainer.appendChild(tab);
    });

    return tabsContainer;
  }

  // Create horizontal scrollable product grid
  createFullPageProductGrid(stepIndex) {
    const grid = document.createElement('div');
    grid.className = 'full-page-product-grid';

    if (!this.selectedBundle || !this.selectedBundle.steps || !this.selectedBundle.steps[stepIndex]) {
      return grid;
    }

    const step = this.selectedBundle.steps[stepIndex];
    // Use processed product data with proper variant IDs
    let products = this.stepProductData[stepIndex] || [];


    const activeCategory = this.getActiveStepCategoryEntry(step);
    const activeCollectionId = activeCategory ? activeCategory.id : this.activeCollectionId;

    // Filter by active category/collection if selected
    if (activeCollectionId) {
      if (activeCategory) {
        const allowedProductIds = new Set();
        activeCategory.productIds.forEach(productId => {
          allowedProductIds.add(this.extractId(productId) || productId);
        });
        activeCategory.handles.forEach(handle => {
          const collectionProductIds = this.stepCollectionProductIds[`${stepIndex}:${handle}`] || [];
          collectionProductIds.forEach(productId => {
            allowedProductIds.add(this.extractId(productId) || productId);
          });
        });

        if (allowedProductIds.size > 0) {
          products = products.filter(p => {
            const numericPid = p.parentProductId || p.id || '';
            return allowedProductIds.has(numericPid);
          });
        }
      } else if (step.collections) {
        const activeCollection = step.collections.find(c => c.id === activeCollectionId);
      if (activeCollection && activeCollection.handle) {
        const membershipKey = `${stepIndex}:${activeCollection.handle}`;
        const collectionProductIds = this.stepCollectionProductIds[membershipKey];
        if (collectionProductIds && collectionProductIds.length > 0) {
          products = products.filter(p => {
            // parentProductId is numeric product ID (set when displayVariantsAsIndividual is true)
            // p.id is numeric product ID otherwise
            const numericPid = p.parentProductId || p.id || '';
            return collectionProductIds.some(cid => {
              const numericCid = this.extractId(cid) || cid;
              return numericPid === numericCid;
            });
          });
        }
      }
      }
    }

    const shouldDisplayVariantsAsIndividual = this.shouldDisplayVariantsAsIndividualForProductGrid(step, activeCategory);
    let expandedProducts = this.expandProductsByVariant(products, shouldDisplayVariantsAsIndividual);

    // Filter by search query if active
    if (this.searchQuery && this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      expandedProducts = expandedProducts.filter(product => {
        const title = (product.title || '').toLowerCase();
        const variantTitle = (product.variantTitle || '').toLowerCase();
        const parentTitle = (product.parentTitle || '').toLowerCase();
        return title.includes(query) || variantTitle.includes(query) || parentTitle.includes(query);
      });
    }

    if (expandedProducts.length === 0) {
      // Show appropriate message based on whether there's a search query
      const message = this.searchQuery
        ? `No products match "${ComponentGenerator.escapeHtml(this.searchQuery)}"`
        : 'No products available in this step.';
      grid.innerHTML = `<p class="no-products">${message}</p>`;
      return grid;
    }


    // Check if step is at capacity (adding 1 more item would be blocked)
    // When at capacity, unselected cards are dimmed
    const stepSelections = this.selectedProducts[stepIndex] || {};
    const capacityCheck = ConditionValidator.canUpdateQuantity(step, stepSelections, '__new__', 1);
    const isStepAtCapacity = !capacityCheck.allowed;

    // Create product cards using ComponentGenerator
    expandedProducts.forEach(product => {
      const productCard = this.createProductCard(product, stepIndex);
      const productId = product.variantId || product.id;
      const currentQty = stepSelections[productId] || 0;
      // Dim unselected cards when step quota is full
      if (isStepAtCapacity && currentQty === 0) {
        productCard.classList.add('dimmed');
      }
      grid.appendChild(productCard);
    });

    return grid;
  }

  // Expand products with multiple variants into separate product entries
  // Each variant becomes its own card showing "Product Title - Variant Name"
  expandProductsByVariant(products, shouldExpand = true) {
    if (!shouldExpand) {
      return products;
    }

    return products.flatMap(product => {
      // If product already has a variantId and parentProductId, it was already expanded
      if (product.parentProductId && product.variantId) {
        return [product];
      }

      // If product has multiple variants, expand into separate cards
      if (product.variants && product.variants.length > 1) {
        return product.variants
          .filter(variant => variant.available !== false) // Only show available variants
          .map(variant => {
            // Use variant image if available, fallback to product image
            const imageUrl = variant.image?.src || variant.image || product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;

            return {
              ...product,
              id: variant.id,
              title: variant.title === 'Default Title' ? product.title : `${product.title} - ${variant.title}`,
              variantTitle: variant.title === 'Default Title' ? '' : variant.title,
              imageUrl,
              price: typeof variant.price === 'number' ? variant.price : (parseFloat(variant.price || '0') * 100),
              compareAtPrice: variant.compareAtPrice ? (typeof variant.compareAtPrice === 'number' ? variant.compareAtPrice : parseFloat(variant.compareAtPrice) * 100) : null,
              variantId: variant.id,
              available: variant.available !== false,
              parentProductId: product.id,
              parentTitle: product.title,
              // Remove variants array from individual cards to prevent showing variant selector
              variants: null
            };
          });
      }

      // Single variant or no variants - return as-is
      return [product];
    });
  }

  // Create loading skeleton for product grid - solid pulsating cards
  // No internal button/quantity skeletons - just clean solid cards
  createProductGridLoadingState() {
    return `
      <div class="full-page-product-grid">
        ${Array(6).fill(0).map(() => `
          <div class="product-card skeleton-loading">
            <div class="skeleton-card-content"></div>
          </div>
        `).join('')}
      </div>
      <style>
        /* Skeleton loading state - solid pulsating cards */
        .product-card.skeleton-loading {
          pointer-events: none;
          cursor: default;
          position: relative;
          overflow: hidden;
          min-height: 320px;
          background: var(--bundle-skeleton-base-bg, #f5f5f5);
          border-radius: 12px;
        }

        .product-card.skeleton-loading:hover {
          transform: none;
          box-shadow: none;
        }

        /* Full card pulsating effect */
        .skeleton-card-content {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            110deg,
            var(--bundle-skeleton-shimmer, #f0f0f0) 0%,
            var(--bundle-skeleton-shimmer, #f0f0f0) 40%,
            var(--bundle-skeleton-highlight, #e0e0e0) 50%,
            var(--bundle-skeleton-shimmer, #f0f0f0) 60%,
            var(--bundle-skeleton-shimmer, #f0f0f0) 100%
          );
          background-size: 200% 100%;
          animation: skeleton-pulse 1.5s ease-in-out infinite;
        }

        @keyframes skeleton-pulse {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      </style>
    `;
  }

  // Preload ALL remaining steps' products in the background (parallel).
  // Called after step 0 renders so subsequent step transitions feel instant.
  // loadStepProducts() is a no-op when data is already cached, so this is safe to call
  // at any step without re-fetching.
  preloadAllSteps() {
    const steps = this.selectedBundle?.steps;
    if (!steps) return;

    steps.forEach((_, index) => {
      // Skip the step already on screen — it's been loaded synchronously
      if (index === this.currentStepIndex) return;
      // Skip steps already cached
      if (this.stepProductData[index]?.length > 0) return;

      this.loadStepProducts(index).catch(() => {
        // Silent — background prefetch; errors here don't affect the user
      });
    });
  }

  // Keep legacy alias so any call sites that still say preloadNextStep() keep working
  preloadNextStep() {
    this.preloadAllSteps();
  }

  // Create a product card DOM element for full-page layout
  createProductCard(product, stepIndex) {
    const productId = product.variantId || product.id;
    const currentQuantity = this.selectedProducts[stepIndex]?.[productId] || 0;
    const renderSelectedQuantityBadge = currentQuantity > 0 && this.usesSelectedQuantityBadge();


    // Ensure product has an image URL (use multiple fallbacks)
    if (!product.imageUrl || product.imageUrl === '') {
      product.imageUrl = product.image?.src ||
                        product.featuredImage?.url ||
                        product.images?.[0]?.url ||
                        BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
    }

    // Get currency info for formatting
    const currencyInfo = CurrencyManager.getCurrencyInfo();

    // Build inline variant selector using the step's merchant-configured primary option
    const step = (this.selectedBundle?.steps || [])[stepIndex];
    const primaryOptionName = step?.primaryVariantOption || null;
    const variantSelectorHtml = VariantSelectorComponent.renderHtml(product, primaryOptionName);

    // Use ComponentGenerator to render HTML (available in same scope after bundling)
    const htmlString = ComponentGenerator.renderProductCard(
      product,
      currentQuantity,
      currencyInfo,
      {
        variantSelectorHtml,
        actionMode: 'expandingQuantity',
        addButtonText: this.getProductAddButtonText(),
      }
    );

    // Convert HTML string to DOM element
    const wrapper = document.createElement('div');
    wrapper.innerHTML = htmlString.trim();
    const cardElement = wrapper.firstChild;

    if (renderSelectedQuantityBadge) {
      this.applySelectedQuantityBadge(cardElement, currentQuantity);
    }

    // Default (included) step: add "Included" badge and disable interaction controls
    const currentStepData = (this.selectedBundle?.steps || [])[stepIndex];
    if (currentStepData?.isDefault) {
      cardElement.classList.add('fpb-card--default-included');
      const imgEl = cardElement.querySelector('.product-image, .product-img, img');
      if (imgEl && imgEl.parentElement) {
        imgEl.parentElement.classList.add('fpb-card-image-wrapper');
        const badge = document.createElement('span');
        badge.className = 'fpb-included-badge';
        const _includedBadgeUrl = (() => {
          const v = getComputedStyle(document.documentElement).getPropertyValue('--bundle-included-badge-url').trim();
          if (!v || v === 'none') return null;
          const m = v.match(/^url\(['"]?(.*?)['"]?\)$/);
          return m ? m[1] : null;
        })();
        if (_includedBadgeUrl) {
          const img = document.createElement('img');
          img.src = _includedBadgeUrl;
          img.alt = 'Included';
          img.className = 'fpb-included-badge-img';
          badge.appendChild(img);
        } else {
          badge.textContent = this._resolveText('includedBadge', 'Included');
        }
        imgEl.parentElement.appendChild(badge);
      }
    }

    // Free gift step: add "Free" badge and override price display to $0.00
    if (currentStepData?.isFreeGift && currentStepData?.addonDisplayFree === true) {
      const imgEl = cardElement.querySelector('.product-image, .product-img, img');
      if (imgEl && imgEl.parentElement) {
        imgEl.parentElement.classList.add('fpb-card-image-wrapper');
        const badge = document.createElement('span');
        badge.className = 'fpb-free-badge';
        const _badgeUrl = (() => {
          const v = getComputedStyle(document.documentElement).getPropertyValue('--bundle-free-gift-badge-url').trim();
          if (!v || v === 'none') return null;
          const m = v.match(/^url\(['"]?(.*?)['"]?\)$/);
          return m ? m[1] : null;
        })();
        if (_badgeUrl) {
          const img = document.createElement('img');
          img.src = _badgeUrl;
          img.alt = 'Free gift';
          img.className = 'fpb-free-badge-img';
          badge.appendChild(img);
        } else {
          badge.textContent = this._resolveText('freeBadge', 'Free');
        }
        imgEl.parentElement.appendChild(badge);
      }
      const priceEl = cardElement.querySelector('.product-price, .price');
      if (priceEl) {
        const originalPriceText = priceEl.textContent;
        const _ci = CurrencyManager.getCurrencyInfo();
        priceEl.innerHTML = `${CurrencyManager.convertAndFormat(0, _ci)} <span class="side-panel-product-original-price">${originalPriceText}</span>`;
      }
    }

    // Attach event listeners for full-page specific interactions
    this.attachProductCardListeners(cardElement, product, stepIndex);

    return cardElement;
  }

  applySelectedQuantityBadge(cardElement, currentQuantity) {
    if (!cardElement) return;
    cardElement.querySelector('.selected-overlay')?.remove();
    const actionWrapper = cardElement.querySelector('.product-card-action');
    if (!actionWrapper) return;

    const priceRow = cardElement.querySelector('.product-price-row');
    const actionRow = document.createElement('div');
    actionRow.className = 'product-selected-action-row';
    if (priceRow) {
      actionRow.appendChild(priceRow);
    }

    const quantityBadge = document.createElement('span');
    quantityBadge.className = 'inline-quantity-display-only';
    quantityBadge.textContent = String(currentQuantity);
    actionRow.appendChild(quantityBadge);

    actionWrapper.classList.remove('is-expanded');
    actionWrapper.classList.add('has-selected-quantity-badge');
    actionWrapper.replaceChildren(actionRow);
  }

  // Attach event listeners to product card
  attachProductCardListeners(cardElement, product, stepIndex) {
    // Default steps are read-only — no add/remove/quantity interaction allowed
    if ((this.selectedBundle?.steps || [])[stepIndex]?.isDefault) return;

    // qty controls use product.variantId dynamically so variant changes are reflected
    const getProductId = () => product.variantId || product.id;

    // Inline quantity increase/decrease buttons (delegated via card element)
    cardElement.addEventListener('click', (e) => {
      const btn = e.target.closest('.inline-qty-btn');
      if (!btn) return;
      e.stopPropagation();
      const productId = getProductId();
      const currentQty = this.selectedProducts[stepIndex]?.[productId] || 0;
      if (btn.classList.contains('qty-increase')) {
        const { available } = this.getVariantAvailable(stepIndex, productId);
        if (available !== null && currentQty >= available) {
          ToastManager.show('Maximum stock reached for this variant.');
          return;
        }
        this.updateProductSelection(stepIndex, productId, currentQty + 1);
      } else if (btn.classList.contains('qty-decrease') && currentQty > 0) {
        this.updateProductSelection(stepIndex, productId, currentQty - 1);
      }
    });

    // Circle add button: qty 0 → 1
    cardElement.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.product-add-btn');
      if (!addBtn) return;
      e.stopPropagation();
      const productId = getProductId();
      const currentQty = this.selectedProducts[stepIndex]?.[productId] || 0;
      if (currentQty === 0) {
        this.updateProductSelection(stepIndex, productId, 1);
      }
    });

    // Inline variant selector (VariantSelectorComponent button group + panels)
    if (product.variants && product.variants.length > 1) {
      VariantSelectorComponent.attachListeners(cardElement, product, (newVariantId, oldVariantId) => {
        const oldQty = this.selectedProducts[stepIndex]?.[oldVariantId] || 0;

        if (oldQty > 0 && oldVariantId !== newVariantId) {
          // Remove old variant qty
          if (this.selectedProducts[stepIndex]) {
            delete this.selectedProducts[stepIndex][oldVariantId];
          }
          // Clamp against new variant's stock
          const newQtyAvail = product.quantityAvailable; // already updated by component
          const newOOS = newQtyAvail === 0 && !product.currentlyNotInStock;
          let migratedQty = oldQty;
          if (newOOS) {
            ToastManager.show('Selected variant is out of stock — selection cleared.');
            migratedQty = 0;
          } else if (newQtyAvail !== null && oldQty > newQtyAvail) {
            migratedQty = newQtyAvail;
            ToastManager.show(`Only ${newQtyAvail} in stock — quantity adjusted.`);
          }
          if (migratedQty > 0) {
            this.selectedProducts[stepIndex][newVariantId] = migratedQty;
          }
          // Update inline qty display
          const qtyDisplay = cardElement.querySelector('.inline-qty-display');
          if (qtyDisplay) qtyDisplay.textContent = migratedQty;
        }

        // Update data-product-id on card + action buttons so subsequent clicks use correct ID
        cardElement.dataset.productId = newVariantId;
        cardElement.querySelectorAll('[data-product-id]').forEach(el => {
          if (el !== cardElement) el.dataset.productId = newVariantId;
        });

        this.updateFooterMessaging?.();
        this.updateStepTimeline?.();
        this._refreshSiblingDimState?.(stepIndex);
      });
    }
  }

  // Refresh the step timeline tabs in-place when product selections change.
  // Called after every updateProductSelection() so tabs reflect current completion
  // state (completed/active/locked classes, click listeners, product images, counts).
  updateStepTimeline() {
    if (!this.config.showStepTimeline) return;
    const existing = this.elements.stepsContainer.querySelector('.step-timeline');
    if (!existing) return;
    const fresh = this.createStepTimeline();
    existing.parentNode.replaceChild(fresh, existing);
  }

  // Render floating footer card with selected products and navigation
  renderFullPageFooter() {
    if (!this.elements.footer) {
      return;
    }

    // Safety guard: sidebar layout uses the side panel, not the bottom footer
    const layout = this.resolveFullPageLayout();
    if (layout === 'footer_side') {
      this.elements.footer.style.display = 'none';
      return;
    }

    const allSelectedProducts = this.getAllSelectedProductsData();

    // Preserve open state across re-renders
    const wasOpen = this.elements.footer.classList.contains('is-open');

    this.elements.footer.innerHTML = '';
    this.elements.footer.className = 'full-page-footer floating-card';
    if (wasOpen) this.elements.footer.classList.add('is-open');
    this.elements.footer.style.display = 'block';

    // Pricing data
    const { totalPrice, totalQuantity, unitPrices } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData,
      this.selectedBundle?.steps
    );
    const discountInfo = PricingCalculator.calculateDiscount(
      this.selectedBundle,
      totalPrice,
      totalQuantity,
      unitPrices
    );
    const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const finalPrice = combinedDiscountInfo.hasDiscount ? combinedDiscountInfo.finalPrice : totalPrice;



    // Total required quantity across paid steps only (free gift and default steps are non-blocking)
    const totalRequired = (this.selectedBundle.steps || []).reduce((sum, step) => {
      if (step.isFreeGift || step.isDefault) return sum;
      return sum + (Number(step.conditionValue) || Number(step.minQuantity) || 1);
    }, 0);

    const isLastStep = this.currentStepIndex === this.selectedBundle.steps.length - 1;

    // Discount progress bar — visual fill bar at top of card, shown only when toggle is on
    if (this.config.showDiscountProgressBar) {
      const progressBar = this._renderDiscountProgress({
        combinedDiscountInfo,
        totalPrice,
        totalQuantity,
        unitPrices,
      });
      if (progressBar) this.elements.footer.appendChild(progressBar);
    }

    // Inner wrapper carries the padding so the banner above sits edge-to-edge
    const inner = document.createElement('div');
    inner.className = 'footer-inner';

    const panel = this._createFooterPanel(allSelectedProducts, currencyInfo);
    const backdrop = document.createElement('button');
    backdrop.className = 'footer-backdrop';
    backdrop.setAttribute('type', 'button');
    backdrop.setAttribute('aria-label', 'Close product list');
    backdrop.addEventListener('click', () => {
      this.elements.footer.classList.remove('is-open');
    });
    const bar = this._createFooterBar(
      allSelectedProducts, totalQuantity, totalRequired,
      totalPrice, finalPrice, combinedDiscountInfo, currencyInfo, isLastStep
    );

    // Stack inside inner: panel → backdrop → bar
    inner.appendChild(panel);
    inner.appendChild(backdrop);
    inner.appendChild(bar);
    this.elements.footer.appendChild(inner);
  }

  // Creates the expandable product-list panel (callout banner is rendered separately above)
  _createFooterPanel(allSelectedProducts, currencyInfo) {
    const panel = document.createElement('div');
    panel.className = 'footer-panel';

    // Product list
    const list = document.createElement('ul');
    list.className = 'footer-panel-list';

    allSelectedProducts.forEach(item => {
      const li = document.createElement('li');
      li.className = 'footer-panel-item';

      const formattedPrice = CurrencyManager.convertAndFormat(item.price || 0, currencyInfo);
      const truncatedTitle = this.truncateTitle(item.parentTitle || item.title, 35);

      li.innerHTML = `
        <img src="${item.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE}"
             alt="${ComponentGenerator.escapeHtml(item.title)}"
             class="footer-panel-thumb">
        <div class="footer-panel-info">
          <p class="footer-panel-name">${ComponentGenerator.escapeHtml(truncatedTitle)}</p>
          <p class="footer-panel-price">${formattedPrice} <span class="footer-panel-qty">×${item.quantity}</span></p>
        </div>
        ${!item.isDefault ? `
        <button class="footer-panel-remove" type="button" aria-label="Remove ${ComponentGenerator.escapeHtml(item.title)}">
          <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor">
            <path d="M6 2h8a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1Zm-2 3h12l-1 13H5L4 5Zm4 2v9m4-9v9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          </svg>
        </button>` : ''}
      `;

      if (!item.isDefault) {
        const removeBtn = li.querySelector('.footer-panel-remove');
        if (!removeBtn) return;
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const removedItem = { stepIndex: item.stepIndex, variantId: item.variantId, quantity: item.quantity, title: item.title };
          this.updateProductSelection(item.stepIndex, item.variantId, 0);
          const truncated = removedItem.title.length > 25 ? removedItem.title.substring(0, 25) + '...' : removedItem.title;
          ToastManager.showWithUndo(
            `Removed "${truncated}"`,
            () => { this.updateProductSelection(removedItem.stepIndex, removedItem.variantId, removedItem.quantity); },
            5000
          );
        });
      }

      list.appendChild(li);
    });

    panel.appendChild(list);
    return panel;
  }

  // Creates the always-visible footer bar
  _createFooterBar(allSelectedProducts, totalQuantity, totalRequired, totalPrice, finalPrice, discountInfo, currencyInfo, isLastStep) {
    const bar = document.createElement('div');
    bar.className = 'footer-bar';

    // ── Left: Thumbnail strip (standalone, circular) ──
    const thumbStrip = document.createElement('div');
    thumbStrip.className = 'footer-thumbstrip';
    const maxThumbs = 3;
    allSelectedProducts.slice(0, maxThumbs).forEach(item => {
      const img = document.createElement('img');
      img.src = item.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
      img.alt = item.title || '';
      img.className = 'footer-thumbstrip-img';
      thumbStrip.appendChild(img);
    });
    if (allSelectedProducts.length > maxThumbs) {
      const overflow = document.createElement('span');
      overflow.className = 'footer-thumbstrip-overflow';
      overflow.textContent = `+${allSelectedProducts.length - maxThumbs}`;
      thumbStrip.appendChild(overflow);
    }

    // ── Centre: Toggle (row 1) + Total + discount badge (row 2) ──
    const centreCol = document.createElement('div');
    centreCol.className = 'footer-centre';

    // Row 1 — toggle
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'footer-toggle';
    toggleBtn.setAttribute('type', 'button');
    const hasConditions = !this.bundleHasNoConditions();
    const totalSelected = allSelectedProducts.length;
    const toggleText = hasConditions
      ? `${totalQuantity}/${totalRequired} Steps`
      : `${totalSelected} Product${totalSelected !== 1 ? 's' : ''}`;
    toggleBtn.innerHTML = `
      <span class="footer-toggle-text">${toggleText}</span>
      <svg class="footer-chevron" viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M5 8l5 5 5-5"/>
      </svg>
    `;
    toggleBtn.addEventListener('click', () => {
      this.elements.footer.classList.toggle('is-open');
    });

    // Row 2 — Total + discount badge
    const totalArea = document.createElement('div');
    totalArea.className = 'footer-total-area';

    let discountBadgeHTML = '';
    if (discountInfo.hasDiscount && totalPrice > 0 && finalPrice < totalPrice) {
      const discountPct = Math.round((1 - finalPrice / totalPrice) * 100);
      if (discountPct > 0) {
        discountBadgeHTML = `<span class="footer-discount-badge">${discountPct}% OFF</span>`;
      }
    }
    totalArea.innerHTML = `
      <span class="footer-total-label">Total:</span>
      <div class="footer-total-prices">
        ${discountInfo.hasDiscount && finalPrice < totalPrice ? `<span class="footer-total-original">${CurrencyManager.convertAndFormat(totalPrice, currencyInfo)}</span>` : ''}
        <span class="footer-total-final">${CurrencyManager.convertAndFormat(finalPrice, currencyInfo)}</span>
        ${discountBadgeHTML}
      </div>
    `;

    centreCol.appendChild(toggleBtn);
    centreCol.appendChild(totalArea);

    // ── Right: CTA button ──
    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'footer-cta-btn';
    ctaBtn.setAttribute('type', 'button');
    const conditionless = this.bundleHasNoConditions();
    const hasSelection = conditionless && this.getAllSelectedProductsData().length > 0;
    ctaBtn.textContent = (conditionless || isLastStep) ? this._resolveText('addToCartButton', this.config.addToCartText || 'Add to Cart') : this._resolveText('nextButton', 'Next');
    if (conditionless ? !hasSelection : (isLastStep ? !this.areBundleConditionsMet() : !this.canProceedToNextStep())) {
      ctaBtn.disabled = true;
    }
    ctaBtn.addEventListener('click', () => {
      if (conditionless || isLastStep) {
        this.addBundleToCart();
      } else if (this.canProceedToNextStep()) {
        this.activeCollectionId = null;
        this.searchQuery = '';
        this.currentStepIndex++;
        this.renderFullPageLayout();
      } else {
        ToastManager.show('Please meet the quantity conditions for the current step before proceeding.');
      }
    });

    bar.appendChild(thumbStrip);
    bar.appendChild(centreCol);
    bar.appendChild(ctaBtn);
    return bar;
  }

  // Helper: Truncate title for compact display
  truncateTitle(title, maxLength) {
    if (!title) return '';
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  }

  // Helper: Get all selected products data for footer display
  getAllSelectedProductsData() {
    const allProducts = [];

    this.selectedBundle.steps.forEach((step, stepIndex) => {
      const stepSelections = this.selectedProducts[stepIndex] || {};
      const productsInStep = this.stepProductData[stepIndex] || [];

      Object.entries(stepSelections).forEach(([variantId, quantity]) => {
        if (quantity > 0) {
          // Find product in processed stepProductData
          // Check multiple ways: direct variantId match, direct id match, or variant within variants array
          let product = productsInStep.find(p =>
            String(p.variantId) === String(variantId) || String(p.id) === String(variantId)
          );

          // If not found directly, search within variants array of each product
          let matchedVariant = null;
          if (!product) {
            for (const p of productsInStep) {
              if (p.variants && Array.isArray(p.variants)) {
                const variant = p.variants.find(v => String(v.id) === String(variantId));
                if (variant) {
                  product = p;
                  matchedVariant = variant;
                  break;
                }
              }
            }
          }

          if (product) {
            // Determine the correct data based on whether we found a variant within a product
            const variantData = matchedVariant || product;
            const isVariantMatch = !!matchedVariant;

            // Build variant title
            let variantTitle = '';
            if (isVariantMatch && matchedVariant.title && matchedVariant.title !== 'Default Title') {
              variantTitle = matchedVariant.title;
            } else if (product.variantTitle && product.variantTitle !== 'Default Title') {
              variantTitle = product.variantTitle;
            }

            // Get the appropriate image - prefer variant image, fallback to product image
            const imageUrl = isVariantMatch
              ? (matchedVariant.image?.src || matchedVariant.image || product.imageUrl || product.image?.src || '')
              : (product.imageUrl || product.image?.src || '');

            // Get the appropriate price - use variant price if available
            const price = isVariantMatch
              ? (typeof matchedVariant.price === 'number' ? matchedVariant.price : (parseFloat(matchedVariant.price || '0') * 100))
              : (product.price || 0);

            allProducts.push({
              stepIndex,
              variantId,
              quantity,
              title: isVariantMatch
                ? (variantTitle ? `${product.title} - ${variantTitle}` : product.title)
                : (product.title || 'Untitled Product'),
              parentTitle: product.parentTitle || product.title || 'Untitled Product',
              variantTitle: variantTitle,
              imageUrl: imageUrl,
              image: imageUrl,
              price: price,
              isDefault: step.isDefault ?? false,
              isFreeGift: step.isFreeGift ?? false,
              addonDisplayFree: step.addonDisplayFree === true,
            });
          } else {
          }
        }
      });
    });

    return allProducts;
  }

  /**
   * Group selected variants by product for multi-variant display
   * @param {Array} selectedProducts - Array of selected product variants
   * @returns {Array} Array of product groups with their variants
   */
  groupVariantsByProduct(selectedProducts) {
    const productMap = new Map();

    selectedProducts.forEach(item => {
      // Find the full product data
      const product = this.stepProductData[item.stepIndex]?.find(p => {
        // Check if this product has this variant
        return p.variants?.some(v => String(v.id) === String(item.variantId)) || String(p.id) === String(item.variantId);
      });

      if (!product) return;

      const productId = product.id || product.productId;
      const key = `${item.stepIndex}-${productId}`;

      if (!productMap.has(key)) {
        productMap.set(key, {
          productId,
          stepIndex: item.stepIndex,
          title: product.title || item.title,
          image: product.imageUrl || product.image?.src || item.image,
          variants: [],
          totalQuantity: 0,
          totalPrice: 0
        });
      }

      const group = productMap.get(key);
      group.variants.push(item);
      group.totalQuantity += item.quantity;
      group.totalPrice += (item.price * item.quantity);
    });

    return Array.from(productMap.values());
  }

  /**
   * Show variant breakdown popup for a product with multiple variants
   * @param {Object} productGroup - Product group with multiple variants
   */
  showVariantBreakdown(productGroup) {
    const overlay = document.createElement('div');
    overlay.className = 'variant-breakdown-overlay';

    const popup = document.createElement('div');
    popup.className = 'variant-breakdown-popup';

    // Get variant details
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const variantsHtml = productGroup.variants.map(variant => {
      const product = this.stepProductData[variant.stepIndex]?.find(p =>
        p.variants?.some(v => String(v.id) === String(variant.variantId)) || String(p.id) === String(variant.variantId)
      );
      const variantObj = product?.variants?.find(v => String(v.id) === String(variant.variantId));
      const variantTitle = variantObj?.title || variant.title || 'Variant';

      return `
        <div class="variant-breakdown-item">
          <img src="${variant.image}" alt="${variantTitle}" />
          <div class="variant-info">
            <span class="variant-title">${variantTitle}</span>
            <span class="variant-quantity">Qty: ${variant.quantity} × ${CurrencyManager.convertAndFormat(variant.price, currencyInfo)}</span>
          </div>
          <button class="remove-variant-btn" data-step="${variant.stepIndex}" data-variant-id="${variant.variantId}">Remove</button>
        </div>
      `;
    }).join('');

    popup.innerHTML = `
      <div class="variant-breakdown-header">
        <h3>${productGroup.title}</h3>
        <button class="close-breakdown-btn">&times;</button>
      </div>
      <div class="variant-breakdown-list">
        ${variantsHtml}
      </div>
      <button class="add-another-variant-btn">+ Add Another Variant</button>
    `;

    // Event handlers
    popup.querySelector('.close-breakdown-btn').addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    popup.querySelectorAll('.remove-variant-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const stepIndex = parseInt(e.target.dataset.step);
        const variantId = e.target.dataset.variantId;
        this.updateProductSelection(stepIndex, variantId, 0);
        document.body.removeChild(overlay);
        this.reRenderFullPage();
      });
    });

    popup.querySelector('.add-another-variant-btn').addEventListener('click', () => {
      document.body.removeChild(overlay);
      // Find the product and open modal for it
      const product = this.stepProductData[productGroup.stepIndex]?.find(p => String(p.id) === String(productGroup.productId));
      const step = this.selectedBundle.steps[productGroup.stepIndex];
      if (product && step && this.productModal) {
        this.productModal.open(product, step);
      }
    });

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) document.body.removeChild(overlay);
    });
  }

  // Helper: Find product by variant ID in a step
  findProductByVariantId(step, variantId) {
    return step.products?.find(p =>
      p.variants?.some(v => v.id === variantId) || p.id === variantId
    );
  }

  // Helper: Check if step is completed (delegates to ConditionValidator)
  isStepCompleted(stepIndex) {
    const step = this.selectedBundle.steps[stepIndex];
    const stepSelections = this.selectedProducts[stepIndex] || {};
    return ConditionValidator.isStepConditionSatisfied(step, stepSelections);
  }

  // Helper: Check if can proceed to next step
  // Layout-aware re-render dispatch for full-page bundles
  reRenderFullPage() {
    const layout = this.resolveFullPageLayout();
    if (layout === 'footer_side') {
      this.renderFullPageLayoutWithSidebar();
    } else {
      this.renderFullPageLayout();
    }
  }

  // Sidebar-only surgical step advance: updates the product grid and tabs in-place
  // without tearing down the entire two-column DOM structure. Prevents the layout
  // shift that occurs when reRenderFullPage() destroys and rebuilds everything.
  async _sidebarAdvanceToNextStep() {
    const contentSection = this.elements.stepsContainer.querySelector('.sidebar-content');
    if (!contentSection) {
      // Fallback: full re-render if DOM structure is unexpected
      this.renderFullPageLayoutWithSidebar();
      return;
    }

    // 1. Update step timeline tabs in-place (active/completed/locked state + click listeners)
    this.updateStepTimeline();

    // 2. Rebuild search input for the new step (search query was cleared by the caller)
    const existingSearch = contentSection.querySelector('.step-search-container');
    if (existingSearch && this.shouldRenderFullPageSearch()) {
      existingSearch.replaceWith(this.createSearchInput());
    } else if (existingSearch) {
      existingSearch.remove();
    } else if (this.shouldRenderFullPageSearch()) {
      const firstAnchor = contentSection.querySelector('.category-tabs, .fpb-step-category-title, .full-page-product-grid-container');
      if (firstAnchor) contentSection.insertBefore(this.createSearchInput(), firstAnchor);
    }

    // 3. Rebuild category tabs for the new step
    const existingTabs = contentSection.querySelector('.category-tabs');
    if (this.config.showCategoryTabs) {
      const newTabs = this.createCategoryTabs(this.currentStepIndex);
      if (existingTabs && newTabs) {
        existingTabs.replaceWith(newTabs);
      } else if (existingTabs && !newTabs) {
        existingTabs.remove();
      } else if (!existingTabs && newTabs) {
        const gridContainer = contentSection.querySelector('.full-page-product-grid-container');
        if (gridContainer) contentSection.insertBefore(newTabs, gridContainer);
      }
    } else if (existingTabs) {
      existingTabs.remove();
    }

    const existingCategoryTitle = contentSection.querySelector('.fpb-step-category-title');
    const newCategoryTitle = this.createActiveCategoryTitle(this.currentStepIndex);
    if (existingCategoryTitle && newCategoryTitle) {
      existingCategoryTitle.replaceWith(newCategoryTitle);
    } else if (existingCategoryTitle && !newCategoryTitle) {
      existingCategoryTitle.remove();
    } else if (!existingCategoryTitle && newCategoryTitle) {
      const gridContainer = contentSection.querySelector('.full-page-product-grid-container');
      if (gridContainer) contentSection.insertBefore(newCategoryTitle, gridContainer);
    }

    const existingCategoryRows = contentSection.querySelector('.fpb-category-section-rows');
    const newCategoryRows = this.createCategorySectionRows(this.currentStepIndex);
    if (existingCategoryRows && newCategoryRows) {
      existingCategoryRows.replaceWith(newCategoryRows);
    } else if (existingCategoryRows && !newCategoryRows) {
      existingCategoryRows.remove();
    } else if (!existingCategoryRows && newCategoryRows) {
      const gridContainer = contentSection.querySelector('.full-page-product-grid-container');
      if (gridContainer) gridContainer.insertAdjacentElement('afterend', newCategoryRows);
    }

    // 4. Show loading skeleton in product grid
    const productGridContainer = contentSection.querySelector('.full-page-product-grid-container');
    if (!productGridContainer) {
      this.renderFullPageLayoutWithSidebar();
      return;
    }
    productGridContainer.innerHTML = this.createProductGridLoadingState();

    // 5. Immediately update side panel to reflect current selections
    const sidePanel = this.elements.stepsContainer.querySelector('.full-page-side-panel');
    if (sidePanel) this.renderSidePanel(sidePanel);

    // 6. Async: load products for the new step and swap in the grid
    if (this.selectedBundle?.loadingGif) this.showLoadingOverlay(this.selectedBundle.loadingGif);
    try {
      await this.loadStepProducts(this.currentStepIndex);
      const productGrid = this.createFullPageProductGrid(this.currentStepIndex);
      productGridContainer.innerHTML = '';
      productGridContainer.appendChild(productGrid);
      if (sidePanel) this.renderSidePanel(sidePanel);
      this.hideLoadingOverlay();
      this.preloadNextStep();
      this._renderMobileBottomBar();
    } catch (error) {
      this.hideLoadingOverlay();
      productGridContainer.innerHTML = '<p class="error-message">Failed to load products. Please try again.</p>';
      this._renderMobileBottomBar();
    }
  }

  canProceedToNextStep() {
    return this.isStepCompleted(this.currentStepIndex);
  }

  // Helper: Check if all bundle conditions are met
  areBundleConditionsMet() {
    return this.selectedBundle.steps.every((step, index) => {
      if (step.isFreeGift || step.isDefault) return true; // non-blocking steps
      return this.isStepCompleted(index);
    });
  }

  // Returns true when every non-free-gift, non-default step has no condition
  // configured at all (conditionType / conditionOperator / conditionValue all absent).
  // In this mode the customer can add to cart at any step without completing all steps.
  bundleHasNoConditions() {
    if (!this.selectedBundle?.steps?.length) return false;
    return this.selectedBundle.steps.every(step => {
      if (step.isFreeGift || step.isDefault) return true;
      return !step.conditionType && !step.conditionOperator && step.conditionValue == null;
    });
  }

  // Free gift helpers

  get freeGiftStep() {
    return (this.selectedBundle?.steps || []).find(s => s.isFreeGift) ?? null;
  }

  get freeGiftStepIndex() {
    return (this.selectedBundle?.steps || []).findIndex(s => s.isFreeGift);
  }

  get paidSteps() {
    return (this.selectedBundle?.steps || []).filter(s => !s.isFreeGift && !s.isDefault);
  }

  get isFreeGiftUnlocked() {
    if (!this.freeGiftStep) return false;
    if (this.freeGiftStep.addonEligibilityCondition || Array.isArray(this.freeGiftStep.addonTiers)) {
      return this.getAddonEligibilityState(this.freeGiftStep).isEligible;
    }
    const steps = this.selectedBundle?.steps || [];
    return this.paidSteps.every(paidStep => {
      const globalIndex = steps.indexOf(paidStep);
      return this.isStepCompleted(globalIndex);
    });
  }

  canNavigateToStep(targetStepIndex) {
    const targetStep = (this.selectedBundle?.steps || [])[targetStepIndex];
    if (targetStep?.isFreeGift && !this.isFreeGiftUnlocked) return false;
    return true;
  }

  _getFreeGiftRemainingCount() {
    if (this.freeGiftStep?.addonEligibilityCondition || Array.isArray(this.freeGiftStep?.addonTiers)) {
      return this.getAddonEligibilityState(this.freeGiftStep).remainingQuantity;
    }
    const steps = this.selectedBundle?.steps || [];
    const total = this.paidSteps.reduce((sum, s) =>
      sum + (Number(s.conditionValue) || Number(s.minQuantity) || 1), 0);
    const selected = this.paidSteps.reduce((sum, paidStep) => {
      const globalIndex = steps.indexOf(paidStep);
      const stepSel = this.selectedProducts[globalIndex] ?? {};
      return sum + Object.values(stepSel).reduce((s, p) => s + (typeof p === 'number' ? p : (p.quantity || 1)), 0);
    }, 0);
    return Math.max(0, total - selected);
  }

  getAddonEligibilityState(step) {
    const tier = Array.isArray(step?.addonTiers) ? step.addonTiers[0] : null;
    const condition = step?.addonEligibilityCondition || tier?.eligibilityCondition || {};
    const discount = step?.addonDiscount || tier?.discount || {};
    const conditionType = String(condition.type || 'QUANTITY').toUpperCase();
    const conditionValue = Number(condition.value || 0);
    const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData,
      this.selectedBundle?.steps
    );
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const thresholdCents = conditionType === 'AMOUNT' ? Math.round(conditionValue * 100) : conditionValue;
    const currentValue = conditionType === 'AMOUNT' ? totalPrice : totalQuantity;
    const remainingRaw = Math.max(0, thresholdCents - currentValue);
    const remainingQuantity = conditionType === 'AMOUNT' ? 0 : remainingRaw;
    const remainingAmount = conditionType === 'AMOUNT' ? remainingRaw : 0;
    const discountValue = Number(discount.value || 0);
    const discountUnit = discount.type === 'PERCENTAGE' ? '%' : currencyInfo.display.symbol;

    return {
      isEligible: remainingRaw <= 0,
      conditionType,
      remainingQuantity,
      remainingAmount,
      variables: {
        addonsConditionDiff: conditionType === 'AMOUNT'
          ? String(Math.ceil(remainingAmount / 100))
          : String(remainingQuantity),
        currencyUnit: currencyInfo.display.symbol,
        addonsDiscountValue: String(discountValue),
        addonsDiscountValueUnit: discountUnit,
      },
    };
  }

  getAddonLineDiscount(step) {
    const tier = Array.isArray(step?.addonTiers) ? step.addonTiers[0] : null;
    const discount = step?.addonDiscount || tier?.discount || {};
    const type = String(discount.type || '').toUpperCase();
    const value = Number(discount.value || 0);
    if (type !== 'PERCENTAGE' || !Number.isFinite(value) || value <= 0) return null;
    return { type, value: Math.min(100, value) };
  }

  getAddonProductSelectionKeys(step) {
    const keys = new Set();
    const addKey = (value) => {
      if (value === null || value === undefined || value === '') return;
      const normalized = this.extractId(value) || value;
      keys.add(String(normalized));
    };
    const products = [
      ...(Array.isArray(step?.StepProduct) ? step.StepProduct : []),
      ...(Array.isArray(step?.products) ? step.products : []),
    ];

    products.forEach(product => {
      addKey(product.id);
      addKey(product.productId);
      addKey(product.graphqlId);
      addKey(product.variantId);
      addKey(product.variantGraphqlId);
      addKey(product.title);
      (Array.isArray(product.variants) ? product.variants : []).forEach(variant => {
        addKey(variant.id);
        addKey(variant.variantId);
        addKey(variant.variantGraphqlId);
        addKey(variant.admin_graphql_api_id);
        addKey(variant.title);
      });
    });

    return keys;
  }

  calculateSelectedAddonDiscountAmount() {
    const steps = this.selectedBundle?.steps || [];
    const chargeableAddonStep = steps.find(candidate => candidate?.isFreeGift === true && candidate?.addonDisplayFree !== true && this.getAddonLineDiscount(candidate));
    const chargeableAddonStepIndex = steps.indexOf(chargeableAddonStep);
    const chargeableAddonProductKeys = this.getAddonProductSelectionKeys(chargeableAddonStep);
    return this.getAllSelectedProductsData().reduce((total, item) => {
      const isChargeableAddonItem = Number(item.stepIndex) === chargeableAddonStepIndex || (item.isFreeGift === true && item.addonDisplayFree !== true);
      const isChargeableAddonProduct = chargeableAddonProductKeys.has(String(this.extractId(item.variantId) || item.variantId))
        || chargeableAddonProductKeys.has(String(this.extractId(item.productId) || item.productId))
        || chargeableAddonProductKeys.has(String(item.title || ''))
        || chargeableAddonProductKeys.has(String(item.parentTitle || ''));
      if (!isChargeableAddonItem && !isChargeableAddonProduct) return total;
      const step = steps[item.stepIndex];
      const addonDiscount = this.getAddonLineDiscount(step) || this.getAddonLineDiscount(chargeableAddonStep);
      if (!addonDiscount) return total;

      const selectedQuantity = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      if (!selectedQuantity || selectedQuantity <= 0 || !Number.isFinite(price) || price <= 0) return total;
      return total + (price * selectedQuantity * addonDiscount.value / 100);
    }, 0);
  }

  getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice) {
    const baseDiscountAmount = Math.max(0, Number(discountInfo?.discountAmount || 0));
    const addonDiscountAmount = this.calculateSelectedAddonDiscountAmount();
    const combinedDiscountAmount = Math.min(totalPrice, baseDiscountAmount + addonDiscountAmount);
    const finalPrice = Math.max(0, totalPrice - combinedDiscountAmount);

    return {
      ...discountInfo,
      hasDiscount: combinedDiscountAmount > 0,
      qualifiesForDiscount: combinedDiscountAmount > 0,
      discountAmount: combinedDiscountAmount,
      addonDiscountAmount,
      finalPrice,
      discountPercentage: totalPrice > 0 ? (combinedDiscountAmount / totalPrice) * 100 : 0,
    };
  }

  renderAddonEligibilityMessage(step, eligibilityState) {
    const messages = step?.addonMessaging || {};
    const tierMessages = messages.tier1 || {};
    const template = eligibilityState.isEligible
      ? tierMessages.eligibleState
      : tierMessages.ineligibleState;
    if (!template) return '';

    return Object.entries(eligibilityState.variables).reduce((message, [key, value]) => {
      return message
        .replaceAll(`##${key}##`, value)
        .replaceAll(`{{${key}}}`, value);
    }, template);
  }

  renderAddonSectionTitle(step) {
    const title = step?.freeGiftName || step?.addonTitle || step?.addonLabel;
    if (typeof title !== 'string' || !title.trim()) return null;

    const titleEl = document.createElement('div');
    titleEl.className = 'side-panel-item-count side-panel-addon-title';
    titleEl.textContent = title.trim();
    return titleEl;
  }

  getGiftMessageConfig() {
    const giftMessage = this.selectedBundle?.personalizationData?.giftMessage;
    if (!giftMessage) return null;
    if (giftMessage.isGiftMessageEnabled === true) return giftMessage;
    return null;
  }

  getGiftMessageProductVariantId(giftMessage) {
    const product = giftMessage?.messageProduct?.product;
    const variant = Array.isArray(product?.variants) ? product.variants[0] : null;
    return variant?.id || variant?.admin_graphql_api_id || variant?.variantGraphqlId || variant?.variantId || null;
  }

  renderGiftMessageSection(container) {
    const giftMessage = this.getGiftMessageConfig();
    if (!giftMessage || !container) return;

    const existing = container.querySelector('.fpb-gift-message-section');
    if (existing) existing.remove();

    const product = giftMessage.messageProduct?.product || {};
    const section = document.createElement('div');
    section.className = 'fpb-gift-message-section';

    const heading = document.createElement('h3');
    heading.className = 'fpb-gift-message-heading';
    heading.textContent = product.title || 'Message';
    section.appendChild(heading);

    if (giftMessage.isSenderAndRecipientNameEnabled === true) {
      const row = document.createElement('div');
      row.className = 'fpb-gift-message-name-row';

      const fromInput = document.createElement('input');
      fromInput.type = 'text';
      fromInput.className = 'gbbGiftMessageV2FromField fpb-gift-message-input';
      fromInput.placeholder = 'From';
      fromInput.value = this.giftMessageState.from;
      fromInput.addEventListener('input', () => {
        this.giftMessageState.from = fromInput.value;
      });

      const toInput = document.createElement('input');
      toInput.type = 'text';
      toInput.className = 'gbbGiftMessageV2ToField fpb-gift-message-input';
      toInput.placeholder = 'To';
      toInput.value = this.giftMessageState.to;
      toInput.addEventListener('input', () => {
        this.giftMessageState.to = toInput.value;
      });

      row.appendChild(fromInput);
      row.appendChild(toInput);
      section.appendChild(row);
    }

    const textarea = document.createElement('textarea');
    textarea.className = 'gbbGiftMessageV2InputField fpb-gift-message-textarea';
    textarea.placeholder = 'Enter a message here...';
    textarea.value = this.giftMessageState.message;
    if (giftMessage.giftMessageCharacterLimit) {
      textarea.maxLength = Number(giftMessage.giftMessageCharacterLimit);
    }
    textarea.addEventListener('input', () => {
      this.giftMessageState.message = textarea.value;
      if (textarea.value.trim()) this.setGiftMessageValidationError(false);
    });
    section.appendChild(textarea);

    const error = document.createElement('p');
    error.className = 'fpb-gift-message-error';
    error.textContent = 'Please enter a message';
    error.style.display = this.giftMessageState.error ? 'block' : 'none';
    section.appendChild(error);

    container.appendChild(section);
  }

  setGiftMessageValidationError(hasError) {
    this.giftMessageState.error = hasError;
    const errorEl = this.container.querySelector('.fpb-gift-message-error');
    if (errorEl) {
      errorEl.style.display = hasError ? 'block' : 'none';
    }
  }

  validateGiftMessageBeforeCart() {
    const giftMessage = this.getGiftMessageConfig();
    if (!giftMessage?.isGiftMessageMandatory) return true;
    if (this.giftMessageState.message.trim()) return true;

    this.setGiftMessageValidationError(true);
    return false;
  }

  buildGiftMessageCartItem(bundleInstanceId, bundleName) {
    const giftMessage = this.getGiftMessageConfig();
    const message = this.giftMessageState.message.trim();
    if (!giftMessage || !message) return null;

    const variantId = this.getGiftMessageProductVariantId(giftMessage);
    const numericVariantId = this.extractId(variantId) || variantId;
    if (!numericVariantId) return null;

    const properties = {
      '_bundle_name': bundleName,
      '_bundle_step_type': 'gift_message',
      '_gift_message': message
    };

    if (giftMessage.isSenderAndRecipientNameEnabled === true) {
      if (this.giftMessageState.from.trim()) properties['_gift_from'] = this.giftMessageState.from.trim();
      if (this.giftMessageState.to.trim()) properties['_gift_to'] = this.giftMessageState.to.trim();
    }

    return {
      id: numericVariantId,
      quantity: 1,
      properties
    };
  }

  _initDefaultProducts() {
    const steps = this.selectedBundle?.steps || [];
    steps.forEach((step, stepIndex) => {
      if (!step.isDefault || !step.defaultVariantId) return;
      const allProducts = [...(step.products || []), ...(step.StepProduct || [])];
      const product = allProducts.find(p =>
        p.variantId === step.defaultVariantId ||
        p.id === step.defaultVariantId ||
        p.gid === step.defaultVariantId ||
        (p.variants || []).some(v => v.id === step.defaultVariantId || v.gid === step.defaultVariantId)
      );
      if (product) {
        if (!this.selectedProducts[stepIndex]) this.selectedProducts[stepIndex] = {};
        // Normalize to numeric ID (strips GID prefix) so the key matches the variantId
        // produced by processProductsForStep() via extractId().
        const normalizedId = this.extractId(step.defaultVariantId) || step.defaultVariantId;
        this.selectedProducts[stepIndex][normalizedId] = 1;
      }
    });
  }

  // Re-lock free gift if paid items no longer satisfy the unlock condition
  _syncFreeGiftLock() {
    if (!this.freeGiftStep || this.freeGiftStepIndex < 0) return;
    if (!this.isFreeGiftUnlocked) {
      this.selectedProducts[this.freeGiftStepIndex] = {};
    }
  }

  // Render the free gift locked/unlocked section in a given container
  _renderFreeGiftSection(container) {
    const step = this.freeGiftStep;
    if (!step) return;

    const section = document.createElement('div');
    const giftName = this._escapeHTML(step.freeGiftName || 'gift');
    const hasDirectAddonTiers = step.addonEligibilityCondition || Array.isArray(step.addonTiers);

    if (hasDirectAddonTiers) {
      const eligibilityState = this.getAddonEligibilityState(step);
      const message = this.renderAddonEligibilityMessage(step, eligibilityState);
      if (!message) return;

      const title = this.renderAddonSectionTitle(step);
      if (title) container.appendChild(title);

      section.className = eligibilityState.isEligible
        ? 'side-panel-addon-message side-panel-free-gift unlocked'
        : 'side-panel-addon-message side-panel-free-gift';
      section.innerHTML = `
        <span class="side-panel-free-gift-icon">${eligibilityState.isEligible ? '✓' : '!'}</span>
        <span class="side-panel-free-gift-text">${this._escapeHTML(message)}</span>
      `;
      container.appendChild(section);
      return;
    }

    if (this.isFreeGiftUnlocked) {
      section.className = 'side-panel-free-gift unlocked';
      section.innerHTML = `
        <span class="side-panel-free-gift-icon">✅</span>
        <span class="side-panel-free-gift-text">Congrats! You're eligible for a FREE ${giftName}!</span>
      `;
    } else {
      const remaining = this._getFreeGiftRemainingCount();
      section.className = 'side-panel-free-gift';
      section.innerHTML = `
        <span class="side-panel-free-gift-icon">🔒</span>
        <span class="side-panel-free-gift-text">Add ${remaining} more product${remaining !== 1 ? 's' : ''} to claim a FREE ${giftName}!</span>
      `;
    }
    container.appendChild(section);
  }

  // Render empty-summary skeleton rows that match selected product rows.
  _renderSidebarProductSkeletons(container) {
    for (let i = 0; i < 5; i++) {
      const slot = document.createElement('div');
      slot.className = 'side-panel-product-row side-panel-skeleton-slot';
      slot.innerHTML = `
        <div class="side-panel-product-img-wrap">
          <div class="side-panel-product-img-placeholder side-panel-skeleton-thumb"></div>
        </div>
        <div class="side-panel-product-info side-panel-skeleton-lines">
          <span class="side-panel-product-title side-panel-skeleton-line line-name"></span>
          <span class="side-panel-product-variant side-panel-skeleton-line line-variant"></span>
        </div>
        <span class="side-panel-product-price side-panel-skeleton-line line-price"></span>
        <span class="side-panel-product-remove side-panel-skeleton-remove"></span>
      `;
      container.appendChild(slot);
    }
  }

  buildCartLineSourceProperties(selectedLines) {
    const { totalPrice, totalQuantity, unitPrices } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData,
      this.selectedBundle?.steps
    );
    const discountInfo = PricingCalculator.calculateDiscount(
      this.selectedBundle,
      totalPrice,
      totalQuantity,
      unitPrices
    );
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);
    const discountAmount = Math.max(0, Number(combinedDiscountInfo.discountAmount || 0));
    const discountPercentage = totalPrice > 0 ? (discountAmount / totalPrice) * 100 : 0;

    const displayProperties = {
      box: '1',
      items: selectedLines
        .map(({ product, quantity }) => `${quantity} x ${product.title || product.id}`)
        .join(', '),
      retailPrice: CurrencyManager.convertAndFormat(totalPrice, currencyInfo)
    };

    if (discountAmount > 0) {
      const amount = CurrencyManager.convertAndFormat(discountAmount, currencyInfo);
      const percentage = `${Math.round(discountPercentage)}%`;
      displayProperties.youSave = {
        amount,
        percentage,
        amountPercentage: `${amount} (${percentage})`
      };
    }

    return this.buildCartLineDisplayProperties(displayProperties);
  }

  buildCartLineDisplayProperties(displayProperties) {
    const properties = {
      Box: displayProperties.box || '1',
      Items: displayProperties.items,
      'Retail Price': displayProperties.retailPrice,
      '_bundle_display_properties': JSON.stringify(displayProperties)
    };

    if (displayProperties.youSave?.amountPercentage) {
      properties['You Save'] = displayProperties.youSave.amountPercentage;
    }

    return properties;
  }

  // Add bundle to cart
  async addBundleToCart() {
    try {
      // Final validation: all paid steps must be satisfied.
      // Free gift and default steps are non-blocking and are intentionally skipped here —
      // the customer may choose not to select a free gift, and default items are pre-seeded.
      const allStepsValid = this.areBundleConditionsMet();
      if (!allStepsValid) {
        ToastManager.show('Please complete all bundle steps before adding to cart.');
        return;
      }
      if (!this.validateGiftMessageBeforeCart()) {
        return;
      }

      // Build cart items from selected products
      const items = [];

      // Generate unique bundle instance ID for this add-to-cart action
      // This allows cart transform to group components and prevents Shopify from
      // consolidating separate bundle instances added at different times
      const bundleInstanceId = crypto.randomUUID();
      const bundleName = this.selectedBundle.name || 'Bundle';
      const selectedLines = [];


      this.selectedBundle.steps.forEach((step, stepIndex) => {
        const stepSelections = this.selectedProducts[stepIndex] || {};
        const productsInStep = this.expandProductsByVariant(this.stepProductData[stepIndex] || []);


        Object.entries(stepSelections).forEach(([variantId, quantity]) => {
          if (quantity > 0) {
            // Ensure we're using a numeric variant ID (extract from GID if needed)
            const numericVariantId = this.extractId(variantId) || variantId;
            const product = productsInStep.find(p => String(p.variantId || p.id) === String(variantId))
              || { id: variantId, title: variantId };


            const properties = {
              '_bundle_id': bundleInstanceId,
              '_bundle_name': bundleName,
              '_step_index': String(stepIndex),
              '_step_name': step.name
            };
            const addonDiscount = this.getAddonLineDiscount(step);
            if (addonDiscount && step?.addonDisplayFree !== true) {
              properties['_bundle_step_type'] = addonDiscount
                ? `addon:${addonDiscount.type}:${addonDiscount.value}`
                : 'addon';
            } else if (step?.isFreeGift && step?.addonDisplayFree === true) {
              properties['_bundle_step_type'] = 'free_gift';
            }
            if (step?.isDefault) properties['_bundle_step_type'] = 'default';

            const cartItem = {
              id: numericVariantId,
              quantity: quantity,
              properties
            };
            const sellingPlanAllocationId = this.getSelectedSellingPlanAllocationId(product, variantId);
            if (sellingPlanAllocationId) {
              cartItem.selling_plan = parseInt(sellingPlanAllocationId);
            }

            items.push(cartItem);
            selectedLines.push({ product, quantity });
          }
        });
      });

      if (items.length === 0) {
        ToastManager.show('Please select products before adding to cart');
        return;
      }

      const sourceProperties = this.buildCartLineSourceProperties(selectedLines);
      items.forEach(item => {
        Object.assign(item.properties, sourceProperties);
      });
      const giftMessageItem = this.buildGiftMessageCartItem(bundleInstanceId, bundleName);
      if (giftMessageItem) {
        items.push(giftMessageItem);
      }

      // Disable the Add to Cart button and show loading overlay
      const nextBtn = this.container.querySelector('.footer-btn-next');
      if (nextBtn) nextBtn.disabled = true;
      this.showLoadingOverlay(this.selectedBundle?.loadingGif || null);

      try {
        // Add to Shopify cart
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items })
        });

        if (!response.ok) {
          throw new Error('Failed to add to cart');
        }

        const result = await response.json();

        // Show success message
        ToastManager.show('Bundle added to cart successfully!');

        // Redirect to cart page after short delay
        setTimeout(() => {
          window.location.href = '/cart';
        }, 1000);

      } catch (fetchError) {
        ToastManager.show('Failed to add bundle to cart. Please try again.');
      } finally {
        this.hideLoadingOverlay();
        if (nextBtn) nextBtn.disabled = false;
      }

    } catch (error) {
      ToastManager.show('Failed to add bundle to cart. Please try again.');
    }
  }

  createStepElement(step, index) {
    const stepBox = document.createElement('div');
    stepBox.className = 'step-box';
    stepBox.dataset.stepIndex = index;

    const selectedProducts = this.selectedProducts[index] || {};
    const hasSelections = Object.values(selectedProducts).some(qty => qty > 0);

    if (hasSelections) {
      stepBox.classList.add('step-completed');

      // Add close icon badge at top right to clear all selections
      const clearBadge = document.createElement('div');
      clearBadge.className = 'step-clear-badge';
      clearBadge.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#f3f4f6"/>
          <path d="M8 8L16 16M16 8L8 16" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      clearBadge.title = 'Remove all products from this step';
      clearBadge.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent opening modal
        this.clearStepSelections(index);
      });
      stepBox.appendChild(clearBadge);

      // Show product images if available
      const productImages = this.getStepProductImages(index);
      if (productImages.length > 0) {
        const imagesContainer = document.createElement('div');
        imagesContainer.className = 'step-images';

        productImages.slice(0, 4).forEach(imageData => {
          const img = document.createElement('img');
          img.src = imageData.url;
          img.alt = imageData.alt;
          img.className = 'step-image';
          imagesContainer.appendChild(img);
        });

        stepBox.appendChild(imagesContainer);

        // Add count badge if more than 4 products
        const totalQuantity = Object.values(selectedProducts).reduce((sum, qty) => sum + qty, 0);
        if (productImages.length > 4 || totalQuantity > 4) {
          const countBadge = document.createElement('div');
          countBadge.className = 'image-count-badge';
          countBadge.textContent = totalQuantity.toString();
          stepBox.appendChild(countBadge);
        }
      } else {
        // Fallback checkmark icon
        const checkIcon = document.createElement('span');
        checkIcon.className = 'check-icon';
        checkIcon.textContent = '✓';
        stepBox.appendChild(checkIcon);
      }
    } else {
      // Plus icon for empty steps
      const plusIcon = document.createElement('span');
      plusIcon.className = 'plus-icon';
      plusIcon.textContent = '+';
      stepBox.appendChild(plusIcon);
    }

    // Only show step name and selection count if no selections made
    if (!hasSelections) {
      // Add step name (without step number)
      const stepName = document.createElement('p');
      stepName.className = 'step-name';
      stepName.textContent = step.name || `Step ${index + 1}`;
      stepBox.appendChild(stepName);

      // Add selection count
      const selectionCount = document.createElement('div');
      selectionCount.className = 'step-selection-count';
      selectionCount.textContent = this.getStepSelectionText(selectedProducts);
      stepBox.appendChild(selectionCount);
    }

    // Add click handler
    stepBox.addEventListener('click', () => this.openModal(index));

    return stepBox;
  }

  getStepProductImages(stepIndex) {
    const selectedProducts = this.selectedProducts[stepIndex] || {};
    const productImages = [];

    Object.entries(selectedProducts).forEach(([variantId, quantity]) => {
      if (quantity > 0) {
        const product = this.stepProductData[stepIndex].find(p => (p.variantId || p.id) === variantId);
        if (product && product.imageUrl && !productImages.find(img => img.url === product.imageUrl)) {
          productImages.push({
            url: product.imageUrl,
            alt: product.title || ''
          });
        }
      }
    });

    return productImages;
  }

  getStepSelectionText(selectedProducts) {
    const totalSelected = Object.values(selectedProducts).reduce((sum, qty) => sum + (qty || 0), 0);
    return totalSelected > 0 ? `${totalSelected} selected` : '';
  }

  clearStepSelections(stepIndex) {
    // Clear all product selections for this step
    this.selectedProducts[stepIndex] = {};

    // Update UI
    this.renderSteps();
    this.updateFooterMessaging();

    // Show toast notification
    ToastManager.show(`All selections cleared from this step`);
  }

  renderFooter() {
    const bundleType = this.container.dataset.bundleType;

    // Full-page bundles: sidebar layout handles its own panel, skip bottom footer entirely
    if (bundleType === 'full_page') {
      const layout = this.resolveFullPageLayout();
      if (layout === 'footer_side') {
        // Sidebar layout — footer is hidden; side panel handles navigation
        if (this.elements.footer) {
          this.elements.footer.style.display = 'none';
        }
        return;
      }
      this.renderFullPageFooter();
      return;
    }

    // Product-page bundles use discount messaging footer
    if (!this.config.showFooterMessaging) {
      this.elements.footer.style.display = 'none';
      return;
    }

    this.updateFooterMessaging();
    this.elements.footer.style.display = 'block';
  }

  updateFooterMessaging() {
    // Check if discount is enabled before showing messaging
    if (!this.selectedBundle?.pricing?.enabled) {
      this.elements.footer.style.display = 'none';
      return;
    }

    const { totalPrice, totalQuantity, unitPrices } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData,
      this.selectedBundle?.steps
    );

    const discountInfo = PricingCalculator.calculateDiscount(
      this.selectedBundle,
      totalPrice,
      totalQuantity,
      unitPrices
    );
    const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);

    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const variables = TemplateManager.createDiscountVariables(
      this.selectedBundle,
      totalPrice,
      totalQuantity,
      combinedDiscountInfo,
      currencyInfo
    );

    const footerDiscountText = this.elements.footer.querySelector('.footer-discount-text');

    if (combinedDiscountInfo.qualifiesForDiscount) {
      // Success message
      const successMessage = TemplateManager.replaceVariables(
        this.config.successMessageTemplate,
        variables
      );
      footerDiscountText.innerHTML = successMessage;
      this.elements.footer.classList.add('qualified');
    } else {
      // Progress message
      const progressMessage = TemplateManager.replaceVariables(
        this.config.discountTextTemplate,
        variables
      );
      footerDiscountText.innerHTML = progressMessage;
      this.elements.footer.classList.remove('qualified');
    }

    this._updateDiscountProgressBanner();
  }

  getDiscountProgressMilestones(totalPrice = 0, totalQuantity = 0) {
    const pricing = this.selectedBundle?.pricing;
    const rules = Array.isArray(pricing?.rules) ? pricing.rules : [];
    const tierTextByRuleId = pricing?.messages?.tierTextByRuleId || {};
    const boxRules = this.getBoxSelectionRules();

    return rules
      .filter(rule => rule && (rule.conditionType === 'quantity' || rule.conditionType === 'amount'))
      .sort((a, b) => (Number(a.conditionValue || 0) || 0) - (Number(b.conditionValue || 0) || 0))
      .map(rule => {
        const ruleId = String(rule.id || '');
        const threshold = Number(rule.conditionValue || 0) || 0;
        const tierText = tierTextByRuleId?.[ruleId] || {};
        const boxRule = boxRules.find(box => box.ruleId === ruleId);
        const isReached = rule.conditionType === 'amount'
          ? Number(totalPrice || 0) >= threshold
          : Number(totalQuantity || 0) >= threshold;

        return {
          ruleId,
          title: tierText.tierText || boxRule?.boxLabel || String(threshold),
          subTitle: tierText.tierSubtext || boxRule?.boxSubtext || '',
          isReached,
        };
      })
      .filter(milestone => milestone.ruleId && milestone.title);
  }

  renderStepBasedDiscountProgress(progressPct, milestones, isReached, placement = "default") {
    const bar = document.createElement('div');
    bar.className = `fpb-discount-progress fpb-dp-step_based` + (isReached ? ' reached' : '');

    const stepList = document.createElement('div');
    stepList.className = 'fpb-discount-step-list';
    milestones.forEach(milestone => {
      const step = document.createElement('div');
      step.className = 'fpb-discount-step' + (milestone.isReached ? ' fpb-discount-step-reached' : '');

      const title = document.createElement('span');
      title.className = 'fpb-discount-step-title';
      title.textContent = milestone.title;
      step.appendChild(title);

      if (placement !== "sidebar" && milestone.subTitle) {
        const subTitle = document.createElement('span');
        subTitle.className = 'fpb-discount-step-subtitle';
        subTitle.textContent = milestone.subTitle;
        step.appendChild(subTitle);
      }

      stepList.appendChild(step);
    });

    const track = document.createElement('div');
    track.className = 'fpb-dp-track';
    const fill = document.createElement('div');
    fill.className = 'fpb-dp-fill';
    fill.style.width = progressPct + '%';
    track.appendChild(fill);

    bar.appendChild(stepList);
    bar.appendChild(track);

    if (placement === "sidebar" && milestones.some(milestone => milestone.subTitle)) {
      const subTitleList = document.createElement('div');
      subTitleList.className = 'fpb-discount-step-subtitle-list';
      milestones.forEach(milestone => {
        const subTitle = document.createElement('span');
        subTitle.className = 'fpb-discount-step-subtitle' + (milestone.isReached ? ' fpb-discount-step-reached' : '');
        subTitle.textContent = milestone.subTitle || '';
        subTitleList.appendChild(subTitle);
      });
      bar.appendChild(subTitleList);
    }

    return bar;
  }

  // Returns a .fpb-discount-progress fill-bar element, or null when pricing is disabled.
  // Used by the FPB floating footer and the sidebar panel (gated by showDiscountProgressBar).
  _renderDiscountProgress(options = {}) {
    const placement = options.placement || "default";
    const providedCombinedDiscountInfo = options.combinedDiscountInfo;
    const providedTotalPrice = options.totalPrice;
    const providedTotalQuantity = options.totalQuantity;
    const providedUnitPrices = options.unitPrices;

    if (!this.selectedBundle?.pricing?.enabled) return null;

    const { totalPrice, totalQuantity, unitPrices } = typeof providedTotalPrice === 'number' && typeof providedTotalQuantity === 'number'
      ? {
          totalPrice: providedTotalPrice,
          totalQuantity: providedTotalQuantity,
          unitPrices: providedUnitPrices || []
        }
      : PricingCalculator.calculateBundleTotal(
          this.selectedProducts,
          this.stepProductData,
          this.selectedBundle?.steps
        );
    const discountInfo = providedCombinedDiscountInfo ?? this.getDiscountInfoWithSelectedAddonDiscount(
      PricingCalculator.calculateDiscount(
        this.selectedBundle, totalPrice, totalQuantity, unitPrices
      ),
      totalPrice
    );
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const variables = TemplateManager.createDiscountVariables(
      this.selectedBundle, totalPrice, totalQuantity, discountInfo, currencyInfo
    );

    const isReached = discountInfo.hasDiscount;
    const progressPct = isReached ? 100 : Math.min(100, Math.max(0, parseInt(variables.progressPercentage, 10) || 0));

    if ((this.config.discountProgressBarType || 'step_based') === 'step_based') {
      const milestones = this.getDiscountProgressMilestones(totalPrice, totalQuantity);
      if (milestones.length > 0) {
        return this.renderStepBasedDiscountProgress(progressPct, milestones, isReached, placement);
      }
    }

    let message = '';
    if (isReached) {
      message = TemplateManager.replaceVariables(
        this.config.discountProgressSuccessTemplate || this.config.successMessageTemplate || '🎉 You\'ve unlocked {{discountText}}!',
        variables
      );
    } else {
      const nextRule = PricingCalculator.getNextDiscountRule?.(this.selectedBundle, totalQuantity);
      if (!nextRule) return null;
      message = TemplateManager.replaceVariables(
        this.config.discountProgressTextTemplate || this.config.discountTextTemplate || 'Add {{conditionText}} to get {{discountText}}',
        variables
      );
    }

    const bar = document.createElement('div');
    bar.className = `fpb-discount-progress fpb-dp-${this.config.discountProgressBarType || 'step_based'}` + (isReached ? ' reached' : '');

    const row = document.createElement('div');
    row.className = 'fpb-dp-row';
    const msgSpan = document.createElement('span');
    msgSpan.className = 'fpb-dp-message';
    msgSpan.innerHTML = message;
    const pctSpan = document.createElement('span');
    pctSpan.className = 'fpb-dp-pct';
    pctSpan.textContent = progressPct + '%';
    row.appendChild(msgSpan);
    row.appendChild(pctSpan);

    const track = document.createElement('div');
    track.className = 'fpb-dp-track';
    const fill = document.createElement('div');
    fill.className = 'fpb-dp-fill';
    fill.style.width = progressPct + '%';
    track.appendChild(fill);

    bar.appendChild(row);
    bar.appendChild(track);
    return bar;
  }

  // Returns a new .discount-progress-banner DOM element, or null when no discount is configured.
  // Used by both the footer and the sidebar panel.
  _renderDiscountProgressBanner() {
    if (!this.selectedBundle?.pricing?.enabled) return null;

    const { totalPrice, totalQuantity, unitPrices } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData,
      this.selectedBundle?.steps
    );
    const discountInfo = this.getDiscountInfoWithSelectedAddonDiscount(
      PricingCalculator.calculateDiscount(
        this.selectedBundle, totalPrice, totalQuantity, unitPrices
      ),
      totalPrice
    );
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const variables = TemplateManager.createDiscountVariables(
      this.selectedBundle, totalPrice, totalQuantity, discountInfo, currencyInfo
    );

    let message = '';
    let isReached = false;

    if (discountInfo.hasDiscount) {
      isReached = true;
      message = TemplateManager.replaceVariables(
        this.config.successMessageTemplate || '🎉 You\'ve unlocked {{discountText}}!',
        variables
      );
    } else {
      const nextRule = PricingCalculator.getNextDiscountRule?.(this.selectedBundle, totalQuantity);
      if (!nextRule) return null;
      message = TemplateManager.replaceVariables(
        this.config.discountTextTemplate || 'Add {{conditionText}} to get {{discountText}}',
        variables
      );
    }

    const banner = document.createElement('div');
    banner.className = 'discount-progress-banner' + (isReached ? ' reached' : '');
    banner.innerHTML = message;
    return banner;
  }

  // Updates the .discount-progress-banner already in the footer in-place (avoids full footer re-render).
  _updateDiscountProgressBanner() {
    if (!this.elements.footer) return;
    const existing = this.elements.footer.querySelector('.discount-progress-banner');
    const fresh = this._renderDiscountProgressBanner();

    if (fresh && existing) {
      existing.className = fresh.className;
      existing.innerHTML = fresh.innerHTML;
    } else if (fresh && !existing) {
      // Insert as first child (full-width slim banner before footer-inner)
      this.elements.footer.insertBefore(fresh, this.elements.footer.firstChild);
    } else if (!fresh && existing) {
      existing.remove();
    }
  }

  // ========================================================================
  // MODAL FUNCTIONALITY
  // ========================================================================

  // Helper method to get formatted header text
  getFormattedHeaderText() {
    // If discount is not enabled, show step name (escaped)
    if (!this.selectedBundle?.pricing?.enabled) {
      const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
      return this._escapeHTML(currentStep?.name) || `Step ${this.currentStepIndex + 1}`;
    }

    const { totalQuantity, totalPrice, unitPrices } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData,
      this.selectedBundle?.steps
    );
    const discountInfo = PricingCalculator.calculateDiscount(
      this.selectedBundle,
      totalPrice,
      totalQuantity,
      unitPrices
    );
    const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const variables = TemplateManager.createDiscountVariables(
      this.selectedBundle,
      totalPrice,
      totalQuantity,
      combinedDiscountInfo,
      currencyInfo
    );

    return TemplateManager.replaceVariables(
      this.config.discountTextTemplate,
      variables
    );
  }

  openModal(stepIndex) {
    this.currentStepIndex = stepIndex;

    // Update modal header
    const modal = this.elements.modal;
    const headerText = this.getFormattedHeaderText();

    modal.querySelector('.modal-step-title').innerHTML = headerText;

    // Load and render products for this step
    this.loadStepProducts(stepIndex).then(() => {
      this.renderModalTabs();
      this.renderModalProducts(stepIndex);
      this.updateModalNavigation();
      this.updateModalFooterMessaging();

      // Show modal
      modal.style.display = 'block';
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }).catch(error => {
      ToastManager.show('Failed to load products for this step');
    });
  }

  closeModal() {
    this.elements.modal.style.display = 'none';
    this.elements.modal.classList.remove('active');
    document.body.style.overflow = '';

    // Update main UI
    this.renderSteps();
    this.updateFooterMessaging();
  }

  resolveStorefrontApiBase() {
    const appProxyPrefix = '/apps/product-bundles';
    if (window.location?.pathname?.startsWith(`${appProxyPrefix}/`)) {
      return appProxyPrefix;
    }

    const configuredAppUrl = window.__BUNDLE_APP_URL__ || '';
    const currentHost = window.location.host;
    const shopDomain = window.Shopify?.shop || this.container?.dataset.shop || '';

    let configuredAppHost = '';
    if (configuredAppUrl) {
      try {
        configuredAppHost = new URL(configuredAppUrl).host;
      } catch (_error) {
        configuredAppHost = '';
      }
    }

    if (shopDomain && configuredAppHost !== currentHost) {
      return appProxyPrefix;
    }

    return configuredAppUrl || window.location.origin;
  }

  async loadStepProducts(stepIndex) {
    const step = this.selectedBundle.steps[stepIndex];

    if (this.stepProductData[stepIndex].length > 0) {
      return;
    }


    let allProducts = [];

    // Process explicit products.
    // When loaded from metafield cache (data-bundle-config), step.products already contains
    // full enriched data (images, variants, prices) — use directly, no API call needed.
    // When loaded from the API response, step.StepProduct carries the enriched data and
    // step.products only has stubs, so skip the fetch to avoid a duplicate call.
    const hasEnrichedStepProducts = Array.isArray(step.StepProduct) && step.StepProduct.length > 0
      && step.StepProduct.some(sp => sp.title && sp.imageUrl);

    const stepProductsAlreadyEnriched = Array.isArray(step.products) && step.products.length > 0
      && step.products.some(p => (Array.isArray(p.images) && p.images.length > 0) || p.featuredImage);

    if (stepProductsAlreadyEnriched) {
      // Metafield cache path: products have full data, use them directly.
      // Prices in metafield are stored as cents (e.g. 82900 = ₹829.00).
      // processProductsForStep multiplies by 100 assuming decimal input, so
      // divide by 100 here to normalise before that multiplication.
      const normalizedProducts = step.products.map(p => ({
        ...p,
        price: (p.price || 0) / 100,
        compareAtPrice: p.compareAtPrice ? p.compareAtPrice / 100 : null,
        variants: p.variants?.map(v => ({
          ...v,
          price: (v.price || 0) / 100,
          compareAtPrice: v.compareAtPrice ? v.compareAtPrice / 100 : null,
        }))
      }));
      allProducts = allProducts.concat(normalizedProducts);
    } else {
      const productIds = this.collectStepProductIds(step);
      if (!hasEnrichedStepProducts && productIds.length > 0) {
        const shop = window.Shopify?.shop || window.location.host;

        // Get app URL from widget data attribute or window global
        const apiBaseUrl = this.resolveStorefrontApiBase();

        // Derive customer's country for @inContext pricing (market-correct prices via Shopify Markets)
        const country = window.Shopify?.country
          || (window.Shopify?.locale?.includes('-') ? window.Shopify.locale.split('-')[1] : null)
          || null;

        try {
          const countryParam = country ? `&country=${encodeURIComponent(country)}` : '';
          const response = await fetch(`${apiBaseUrl}/api/storefront-products?ids=${encodeURIComponent(productIds.join(','))}&shop=${encodeURIComponent(shop)}${countryParam}`);

          if (!response.ok) {
            await response.text();
            return;
          }

          const data = await response.json();

          if (data.products && data.products.length > 0) {
            allProducts = allProducts.concat(data.products);
          }
        } catch (error) {
        }
      }
    }

    if (step.StepProduct && Array.isArray(step.StepProduct) && step.StepProduct.length > 0) {
      // Check if StepProduct already has enriched data (for full-page bundles)
      const hasEnrichedData = step.StepProduct.some(sp => sp.title && sp.imageUrl && sp.price);

      if (hasEnrichedData) {

        // Transform StepProduct to match expected product format
        const enrichedProducts = step.StepProduct.map(sp => ({
          id: sp.productId,
          title: sp.title,
          handle: sp.handle,
          imageUrl: sp.imageUrl,
          price: sp.price,
          compareAtPrice: sp.compareAtPrice,
          available: true,
          variants: sp.variants || [{
            id: sp.productId.replace('Product', 'ProductVariant'),
            title: 'Default Title',
            price: sp.price,
            compareAtPrice: sp.compareAtPrice,
            available: true,
            image: sp.imageUrl ? { src: sp.imageUrl } : null
          }]
        }));

        allProducts = allProducts.concat(enrichedProducts);
      } else {
        // Fetch from storefront API if data is not enriched
        const productGids = step.StepProduct.map(sp => sp.productId).filter(Boolean);
        const shop = window.Shopify?.shop || window.location.host;

        if (productGids.length > 0) {

          const apiBaseUrl = this.resolveStorefrontApiBase();

          // Derive customer's country for @inContext pricing (market-correct prices via Shopify Markets)
          const country = window.Shopify?.country
            || (window.Shopify?.locale?.includes('-') ? window.Shopify.locale.split('-')[1] : null)
            || null;

          try {
            const countryParam = country ? `&country=${encodeURIComponent(country)}` : '';
            const response = await fetch(`${apiBaseUrl}/api/storefront-products?ids=${encodeURIComponent(productGids.join(','))}&shop=${encodeURIComponent(shop)}${countryParam}`);

            if (!response.ok) {
            } else {
              const data = await response.json();
              if (data.products && data.products.length > 0) {
                allProducts = allProducts.concat(data.products);
              }
            }
          } catch (error) {
          }
        }
      }
    }

    const collectionHandles = this.collectStepCollectionHandles(step);
    if (collectionHandles.length > 0) {
      const shop = window.Shopify?.shop || window.location.host;
      const apiBaseUrl = this.resolveStorefrontApiBase();


      try {
        const response = await fetch(
          `${apiBaseUrl}/api/storefront-collections?handles=${encodeURIComponent(collectionHandles.join(','))}&shop=${encodeURIComponent(shop)}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.products && data.products.length > 0) {
            allProducts = allProducts.concat(data.products);
          }
          // Store per-collection product ID membership for tab filtering
          if (data.byCollection) {
            for (const [handle, productIds] of Object.entries(data.byCollection)) {
              this.stepCollectionProductIds[`${stepIndex}:${handle}`] = productIds;
            }
          }
        } else {
        }
      } catch (error) {
      }
    }

    // Process and normalize product data

    const processedProducts = this.processProductsForStep(allProducts, step);


    // Remove duplicates
    const seen = new Set();
    this.stepProductData[stepIndex] = processedProducts.filter(product => {
      const key = product.variantId || product.id;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

  }

  shouldExpandStepProductsDuringLoad(step) {
    const hasCategoryProducts = Array.isArray(step?.categories) && step.categories.some(category =>
      (Array.isArray(category.products) && category.products.length > 0)
      || (Array.isArray(category.selectedProducts) && category.selectedProducts.length > 0)
      || (Array.isArray(category.collections) && category.collections.length > 0)
      || (Array.isArray(category.collectionsData) && category.collectionsData.length > 0)
      || (Array.isArray(category.collectionsSelectedData) && category.collectionsSelectedData.length > 0)
    );

    if (hasCategoryProducts) {
      return false;
    }

    return step?.displayVariantsAsIndividualProducts === true || step?.displayVariantsAsIndividual === true;
  }

  getFirstAvailableVariant(product) {
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    if (variants.length === 0) {
      return null;
    }

    return variants.find(variant => variant.available === true) || null;
  }

  processProductsForStep(products, step) {
    // Normalize per-variant inventory fields from the Storefront API proxy response.
    // quantityAvailable is number | null (null when the inventory scope isn't granted
    // or the variant is untracked — widget treats null as unlimited).
    // currentlyNotInStock is true for backorder-accepting variants that are sold out.
    const normalizeVariant = (v) => ({
      id: this.extractId(v.id),
      title: v.title,
      price: parseFloat(v.price || '0') * 100,
      compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) * 100 : null,
      sellingPlanAllocations: Array.isArray(v.sellingPlanAllocations)
        ? v.sellingPlanAllocations
        : [],
      available: v.available === true,
      quantityAvailable: typeof v.quantityAvailable === 'number' ? v.quantityAvailable : null,
      currentlyNotInStock: v.currentlyNotInStock === true,
      option1: v.option1 || null,
      option2: v.option2 || null,
      option3: v.option3 || null,
      image: v.image || null
    });

    return products.flatMap(product => {
      if (this.shouldExpandStepProductsDuringLoad(step) && product.variants && product.variants.length > 0) {
        // Display each variant as separate product - filter out unavailable variants
        // Preserve parent product reference for variant selection in modal
        const processedVariants = (product.variants || []).map(normalizeVariant);

        const processedOptions = (product.options || []).map(opt => {
          if (typeof opt === 'string') return opt;
          return opt.name || opt;
        });

        return product.variants
          .filter(variant => variant.available === true) // Only show available variants
          .map(variant => {
            // Storefront API: prioritize variant image, fallback to product featured image.
            // product.imageUrl — set by API path; product.featuredImage/images — metafield cache format.
            const imageUrl = variant?.image?.src || product.imageUrl || product.featuredImage?.url || product.images?.[0]?.url || 'https://via.placeholder.com/150';

            return {
              id: this.extractId(variant.id),
              title: `${product.title} - ${variant.title}`,
              imageUrl,
              price: parseFloat(variant.price || '0') * 100,
              compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice) * 100 : null,
              variantId: this.extractId(variant.id),
              available: variant.available === true,
              quantityAvailable: typeof variant.quantityAvailable === 'number' ? variant.quantityAvailable : null,
              currentlyNotInStock: variant.currentlyNotInStock === true,
              sellingPlanAllocations: variant.sellingPlanAllocations || [],
              // Preserve parent product data for variant selection in modal
              parentProductId: this.extractId(product.id),
              parentTitle: product.title,
              variants: processedVariants,
              options: processedOptions,
              images: product.images || (product.imageUrl ? [{ src: product.imageUrl }] : []),
              description: product.description || ''
            };
          });
      } else {
        // Display product with default variant - check availability
        const defaultVariant = this.getFirstAvailableVariant(product);

        if (product.variants?.length > 0 && !defaultVariant) {
          return [];
        }

        // Storefront API: prioritize variant image, fallback to product featured image.
        // product.imageUrl — set by API path; product.featuredImage/images — metafield cache format.
        const imageUrl = defaultVariant?.image?.src || product.imageUrl || product.featuredImage?.url || product.images?.[0]?.url || 'https://via.placeholder.com/150';

        // Process variants array for variant selection in modal
        const processedVariants = (product.variants || []).map(normalizeVariant);

        // Process options array for variant selector labels
        const processedOptions = (product.options || []).map(opt => {
          if (typeof opt === 'string') return opt;
          return opt.name || opt;
        });

        return [{
          id: this.extractId(product.id),
          title: product.title,
          imageUrl,
          price: defaultVariant ? parseFloat(defaultVariant.price || '0') * 100 : 0,
          compareAtPrice: defaultVariant?.compareAtPrice ? parseFloat(defaultVariant.compareAtPrice) * 100 : null,
          variantId: this.extractId(defaultVariant?.id || product.id),
          sellingPlanAllocations: defaultVariant?.sellingPlanAllocations || [],
          available: defaultVariant?.available === true,
          quantityAvailable: typeof defaultVariant?.quantityAvailable === 'number' ? defaultVariant.quantityAvailable : null,
          currentlyNotInStock: defaultVariant?.currentlyNotInStock === true,
          // Preserve variants and options for variant selection in modal
          variants: processedVariants,
          options: processedOptions,
          // Preserve images array for modal gallery
          images: product.images || (product.imageUrl ? [{ src: product.imageUrl }] : []),
          description: product.description || ''
        }];
      }
    });
  }

  /**
   * Look up real stock for a variant in a step's product data.
   * Returns:
   *   - available: positive numeric remaining stock, or null when uncapped
   *   - outOfStock: true only when Shopify marks the variant unavailable
   *   - acceptsBackorder: true when Shopify marks the variant as backorderable
   */
  isVariantOutOfStock(product) {
    if (!product) {
      return false;
    }
    if (product.available === false) {
      return true;
    }
    return false;
  }

  getVariantAvailable(stepIndex, variantId) {
    const products = this.stepProductData[stepIndex] || [];
    const product = products.find(p => (p.variantId || p.id) === variantId);
    if (!product) {
      return { available: null, outOfStock: false, acceptsBackorder: false };
    }

    const qty = typeof product.quantityAvailable === 'number' && product.quantityAvailable > 0
      ? product.quantityAvailable
      : null;
    const backorder = product.currentlyNotInStock === true;
    const outOfStock = this.isVariantOutOfStock(product);

    return { available: qty, outOfStock, acceptsBackorder: backorder };
  }

  extractId(idString) {
    if (!idString) return null;

    // Handle GID format
    const gidMatch = idString.toString().match(/gid:\/\/shopify\/\w+\/(\d+)/);
    if (gidMatch) {
      return gidMatch[1];
    }

    // Handle numeric string
    return idString.toString().split('/').pop();
  }

  shouldApplyIndividualSellingPlanSelection() {
    return this.selectedBundle?.individualSellingPlanSelection?.isEnabled === true;
  }

  shouldApplyIndividualSellingPlanSelectionForProduct(product, variantId) {
    if (!this.shouldApplyIndividualSellingPlanSelection()) {
      return false;
    }

    const showFor = this.selectedBundle?.individualSellingPlanSelection?.showFor;
    if (showFor !== "OOS_PRODUCTS") {
      return true;
    }

    const normalizedSelectedId = this.extractId(variantId) || String(variantId || "");
    const variant = Array.isArray(product?.variants)
      ? product.variants.find((candidate) => this.extractId(candidate.id) === normalizedSelectedId)
      : null;

    const target = variant ?? product;
    if (!target) {
      return false;
    }

    return target.available === false;
  }

  getSelectedSellingPlanAllocationId(product, variantId) {
    if (!this.shouldApplyIndividualSellingPlanSelectionForProduct(product, variantId)) {
      return null;
    }

    const normalizedSelectedId = this.extractId(variantId) || String(variantId || '');
    const variant = Array.isArray(product?.variants)
      ? product.variants.find((candidate) => this.extractId(candidate.id) === normalizedSelectedId)
      : null;

    const normalizedProduct = (variant?.sellingPlanAllocations !== undefined ? variant : product) || {};
    const allocations = Array.isArray(normalizedProduct.sellingPlanAllocations)
      ? normalizedProduct.sellingPlanAllocations
      : [];

    if (allocations.length === 0) {
      return null;
    }

    const firstAllocationId = this.extractId(allocations[0]?.id);
    return firstAllocationId || null;
  }

  renderModalTabs() {
    const tabsContainer = this.elements.modal?.querySelector('.modal-tabs');
    if (!tabsContainer) return; // Modal not active (full-page mode)
    tabsContainer.innerHTML = '';

    this.selectedBundle.steps.forEach((step, index) => {
      const isAccessible = this.isStepAccessible(index);
      const isActive = index === this.currentStepIndex;

      // Create tab button
      const tabButton = document.createElement('button');
      tabButton.className = `bundle-header-tab ${isActive ? 'active' : ''} ${!isAccessible ? 'locked' : ''}`;
      tabButton.textContent = step.name || `Step ${index + 1}`;
      tabButton.dataset.stepIndex = index.toString();

      // Click handler
      tabButton.addEventListener('click', async () => {
        if (!isAccessible) {
          ToastManager.show('Please complete the previous steps first.');
          return;
        }

        this.currentStepIndex = index;

        // Update modal header
        const headerText = this.getFormattedHeaderText();
        this.elements.modal.querySelector('.modal-step-title').innerHTML = headerText;

        // Load products for this step if not already loaded
        await this.loadStepProducts(index);

        // Re-render everything
        this.renderModalTabs();
        this.renderModalProducts(index);
        this.updateModalNavigation();
        this.updateModalFooterMessaging();
      });

      tabsContainer.appendChild(tabButton);
    });

    // Update arrow visibility after rendering tabs
    if (this.updateTabArrows) {
      setTimeout(() => this.updateTabArrows(), 50);
    }
  }

  renderModalProducts(stepIndex, productsToRender = null) {
    // Use all products from step data
    const products = productsToRender || this.stepProductData[stepIndex];
    const selectedProducts = this.selectedProducts[stepIndex];
    const productGrid = this.elements.modal.querySelector('.product-grid');
    const step = this.selectedBundle?.steps?.[stepIndex] || {};

    if (products.length === 0) {
      // Show empty state cards like in DCP preview
      const currentStep = this.selectedBundle.steps[stepIndex];
      const stepName = this._escapeHTML(currentStep?.name) || `Step ${stepIndex + 1}`;
      const labelText = `Select ${stepName}`;

      const emptyStateCards = Array(3).fill(0).map((_, index) => `
        <div class="empty-state-card">
          <svg class="empty-state-card-icon" width="69" height="69" viewBox="0 0 69 69" fill="none">
            <line x1="34.5" y1="15" x2="34.5" y2="54" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
            <line x1="15" y1="34.5" x2="54" y2="34.5" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
          </svg>
          <p class="empty-state-card-text">${labelText}</p>
        </div>
      `).join('');

      productGrid.innerHTML = emptyStateCards;
      return;
    }

    productGrid.innerHTML = products.map(product => {
      const selectionKey = product.variantId || product.id;
      const currentQuantity = selectedProducts[selectionKey] || 0;
      const renderSelectedQuantityBadge = currentQuantity > 0 && this.usesSelectedQuantityBadge();
      const currencyInfo = CurrencyManager.getCurrencyInfo();
      const priceMarkup = product.price ? `
              <div class="product-price-row">
                ${product.compareAtPrice ? `<span class="product-price-strike">${CurrencyManager.convertAndFormat(product.compareAtPrice, currencyInfo)}</span>` : ''}
                <span class="product-price">${CurrencyManager.convertAndFormat(product.price, currencyInfo)}</span>
              </div>
            ` : '';

      // Per-variant stock state derived from Storefront API quantityAvailable
      const { available, outOfStock } = this.getVariantAvailable(stepIndex, selectionKey);
      const atMaxStock = available !== null && available > 0 && currentQuantity >= available;
      const lowStock = available !== null && available > 0 && available <= 3;
      const increaseDisabled = outOfStock || atMaxStock;
      const addDisabled = outOfStock;

      // Low-stock / out-of-stock badge — shown on the image, not in the CTA.
      const stockBadge = outOfStock
        ? `<div class="product-stock-badge product-stock-badge--out">Out of stock</div>`
        : lowStock
          ? `<div class="product-stock-badge product-stock-badge--low">Only ${available} left</div>`
          : '';

      return `
        <div class="product-card ${currentQuantity > 0 ? 'selected' : ''} ${outOfStock ? 'is-out-of-stock' : ''}" data-product-id="${selectionKey}">
          ${currentQuantity > 0 && !renderSelectedQuantityBadge ? `
            <div class="selected-overlay">✓</div>
          ` : ''}

          <div class="product-image">
            <img src="${product.imageUrl}" alt="${ComponentGenerator.escapeHtml(product.title)}" loading="lazy">
            ${stockBadge}
          </div>

          <div class="product-content-wrapper">
            <div class="product-title">${ComponentGenerator.escapeHtml(product.title)}</div>

            ${renderSelectedQuantityBadge ? '' : priceMarkup}

            <div class="product-spacer"></div>

            ${this.renderVariantSelector(product, this.selectedBundle?.steps?.[stepIndex])}

            ${renderSelectedQuantityBadge ? `
              <div class="product-selected-action-row">
                ${priceMarkup}
                <span class="inline-quantity-display-only" data-product-id="${selectionKey}">${currentQuantity}</span>
              </div>
            ` : `
              <div class="product-quantity-wrapper">
                <div class="product-quantity-selector">
                  <button class="qty-btn qty-decrease" data-product-id="${selectionKey}">−</button>
                  <span class="qty-display">${currentQuantity}</span>
                  <button class="qty-btn qty-increase" data-product-id="${selectionKey}" ${increaseDisabled ? 'disabled aria-disabled="true"' : ''}>+</button>
                </div>
              </div>

              <button class="product-add-btn ${currentQuantity > 0 ? 'added' : ''}"
                      data-product-id="${selectionKey}"
                      data-product-handle="${product.handle || ''}"
                      data-step-id="${step.id}"
                      ${addDisabled ? 'disabled aria-disabled="true"' : ''}>
                ${outOfStock ? 'Out of stock' : (currentQuantity > 0 ? '✓ Added to Bundle' : this.getProductAddButtonText())}
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');

    // Attach event handlers
    this.attachProductEventHandlers(productGrid, stepIndex);
  }

  renderVariantSelector(product, step) {
    if (!product.variants || product.variants.length <= 1) {
      return '';
    }
    const primaryOptionName = step?.primaryVariantOption || null;
    return VariantSelectorComponent.renderHtml(product, primaryOptionName);
  }

  attachProductEventHandlers(productGrid, stepIndex) {
    // Remove existing event listeners to prevent duplicates
    const newProductGrid = productGrid.cloneNode(true);
    productGrid.parentNode.replaceChild(newProductGrid, productGrid);

    // Get step data for modal
    const step = this.selectedBundle.steps[stepIndex];

    // Helper to find product by ID
    const findProduct = (productId) => {
      return this.stepProductData[stepIndex]?.find(p => {
        const selectionKey = p.variantId || p.id;
        return selectionKey === productId;
      });
    };

    // Quantity button handlers
    newProductGrid.addEventListener('click', (e) => {
      if (e.target.classList.contains('qty-btn')) {
        e.stopPropagation();
        const productId = e.target.dataset.productId;
        const isIncrease = e.target.classList.contains('qty-increase');
        const currentQuantity = this.selectedProducts[stepIndex][productId] || 0;

        const newQuantity = isIncrease ? currentQuantity + 1 : Math.max(0, currentQuantity - 1);
        this.updateProductSelection(stepIndex, productId, newQuantity);
      }
    });

    // Add to Bundle button handler - adds directly without opening modal
    newProductGrid.addEventListener('click', (e) => {
      if (e.target.classList.contains('product-add-btn')) {
        e.stopPropagation();
        const productId = e.target.dataset.productId;
        const currentQuantity = this.selectedProducts[stepIndex][productId] || 0;

        // Toggle: If already added, remove; otherwise add with quantity 1
        if (currentQuantity > 0) {
          this.updateProductSelection(stepIndex, productId, 0);
        } else {
          // Add product directly to bundle (modal opens only on card image/title click)
          this.updateProductSelection(stepIndex, productId, 1);
        }
      }
    });

    // Product image/title click - open modal
    newProductGrid.addEventListener('click', (e) => {
      const productImage = e.target.closest('.product-image');
      const productTitle = e.target.closest('.product-title');

      if (productImage || productTitle) {
        const productCard = e.target.closest('.product-card');
        if (productCard && this.productModal) {
          const productId = productCard.dataset.productId;
          const product = findProduct(productId);

          if (product && step) {
            this.productModal.open(product, step);
          }
        }
      }
    });

    // Variant selector handler
    newProductGrid.addEventListener('change', (e) => {
      if (e.target.classList.contains('variant-selector')) {
        e.stopPropagation();
        const newVariantId = e.target.value;
        const baseProductId = e.target.dataset.baseProductId;

        // Find the product and update its variant
        const product = this.stepProductData[stepIndex].find(p => p.id === baseProductId);
        if (product) {
          const variantData = product.variants.find(v => v.id === newVariantId);
          if (variantData) {
            // Sync the new variant's stock fields onto the product so
            // getVariantAvailable() reflects post-swap state.
            product.quantityAvailable = typeof variantData.quantityAvailable === 'number'
              ? variantData.quantityAvailable
              : null;
            product.currentlyNotInStock = variantData.currentlyNotInStock === true;
            product.available = variantData.available === true;

            // Move quantity from old variant to new variant, re-clamping against
            // the new variant's quantityAvailable. If the new variant can't hold
            // the old quantity, reduce it and surface a toast.
            const oldQuantity = this.selectedProducts[stepIndex][product.variantId] || 0;
            if (oldQuantity > 0) {
              delete this.selectedProducts[stepIndex][product.variantId];

              const newQtyAvail = product.quantityAvailable;
              const newOOS = this.isVariantOutOfStock(product);
              let migratedQty = oldQuantity;
              if (newOOS) {
                ToastManager.show('Selected variant is out of stock — selection cleared.');
                migratedQty = 0;
              } else if (newQtyAvail !== null && newQtyAvail > 0 && oldQuantity > newQtyAvail) {
                migratedQty = newQtyAvail;
                ToastManager.show(`Only ${newQtyAvail} in stock — quantity adjusted.`);
              }
              if (migratedQty > 0) {
                this.selectedProducts[stepIndex][newVariantId] = migratedQty;
              }
            }

            // Update product properties
            product.variantId = newVariantId;
            product.price = variantData.price;

            // Update UI without full re-render
            this.updateModalNavigation();
            this.updateModalFooterMessaging();
          }
        }
      }
    });

    // Add cursor pointer styles to product images and titles
    newProductGrid.querySelectorAll('.product-image, .product-title').forEach(el => {
      el.style.cursor = 'pointer';
    });
  }
  updateProductSelection(stepIndex, productId, newQuantity) {
    let quantity = Math.max(0, newQuantity);

    // Clamp against real per-variant stock before doing anything else.
    // Uses quantityAvailable from the Storefront API (see getVariantAvailable).
    // Adding 0 always allowed (that is a removal).
    if (quantity > 0) {
      const { available, outOfStock } = this.getVariantAvailable(stepIndex, productId);
      if (outOfStock) {
        ToastManager.show('This item is out of stock.');
        return;
      }
      if (available !== null && available > 0 && quantity > available) {
        quantity = available;
        ToastManager.show(`Only ${available} in stock — quantity adjusted.`);
      }
    }

    // Validate step conditions
    if (!this.validateStepCondition(stepIndex, productId, quantity)) {
      return;
    }

    // Update selection
    if (quantity > 0) {
      this.selectedProducts[stepIndex][productId] = quantity;
    } else {
      delete this.selectedProducts[stepIndex][productId];
    }

    // Re-lock free gift if a paid item was just removed and conditions no longer met
    this._syncFreeGiftLock();

    // Update UI without re-rendering the entire modal (prevents event listener duplication)
    this.updateProductQuantityDisplay(stepIndex, productId, quantity);
    this.renderModalTabs();
    this.updateModalNavigation();
    this.updateModalFooterMessaging();

    // For full-page bundles, re-render the footer/sidebar to show selected products
    const bundleType = this.container.dataset.bundleType;
    if (bundleType === 'full_page') {
      const layout = this.resolveFullPageLayout();
      if (layout === 'footer_side') {
        const sidePanel = this.elements.stepsContainer.querySelector('.full-page-side-panel');
        this.renderSidePanel(sidePanel);
        if (window.matchMedia?.('(max-width: 767px)').matches) {
          this._renderMobileBottomBar({ preserveOpen: true });
        }
      } else {
        this.renderFullPageFooter();
      }
      // Update step timeline tabs so completion state, images, counts, and
      // click listeners all reflect the new selection immediately.
      this.updateStepTimeline();

      // Auto-advance: when the current step becomes complete after an addition,
      // automatically move to the next step after a short delay so the shopper
      // sees the completion state before the view changes.
      // Guard: only on additions (quantity > 0), not removals; skip if a pending
      // advance is already scheduled; skip on the last step; skip when the step
      // has no explicit conditions (no conditionType/conditionOperator/conditionValue)
      // so shoppers can add as many products as they want on unconditioned steps.
      const _autoAdvanceStep = this.selectedBundle?.steps?.[this.currentStepIndex];
      const _hasExplicitCondition = _autoAdvanceStep &&
        _autoAdvanceStep.conditionType &&
        _autoAdvanceStep.conditionOperator &&
        _autoAdvanceStep.conditionValue != null;
      if (quantity > 0 && !this._autoAdvancePending && _hasExplicitCondition) {
        const isLastStep = this.currentStepIndex === this.selectedBundle.steps.length - 1;
        if (!isLastStep && this.isStepCompleted(this.currentStepIndex) && this.canNavigateToStep(this.currentStepIndex + 1)) {
          this._autoAdvancePending = true;
          setTimeout(() => {
            this._autoAdvancePending = false;
            // Re-check in case the shopper removed something during the delay
            if (this.isStepCompleted(this.currentStepIndex) && this.canNavigateToStep(this.currentStepIndex + 1)) {
              this.activeCollectionId = null;
              this.searchQuery = '';
              this.currentStepIndex++;
              const layout = this.resolveFullPageLayout();
              if (layout === 'footer_side') {
                this._sidebarAdvanceToNextStep();
              } else {
                this.reRenderFullPage();
              }
            }
          }, 120);
        }
      }
    } else {
      this.updateFooterMessaging();
    }
  }

  updateProductQuantityDisplay(stepIndex, productId, quantity) {
    if (this.usesSelectedQuantityBadge()) {
      this.refreshCurrentProductGrid(stepIndex);
      if (this.elements?.modal?.querySelector('.product-grid')) {
        this.renderModalProducts(stepIndex);
      }
      this._refreshSiblingDimState(stepIndex);
      return;
    }

    // Update quantity display without full re-render
    const productCard = this.container.querySelector(`[data-product-id="${productId}"]`);
    if (!productCard) return;

    // Find existing action elements
    const contentWrapper = productCard.querySelector('.product-content-wrapper');
    const actionWrapper = productCard.querySelector('.product-card-action');
    if (!contentWrapper && !actionWrapper) return;

    const actionContainer = actionWrapper || contentWrapper;
    const existingAddBtn = productCard.querySelector('.product-add-btn');
    const existingQuantityControls = productCard.querySelector('.inline-quantity-controls');
    let selectedOverlay = productCard.querySelector('.selected-overlay');

    // Toggle between "Add to Bundle" button and quantity controls
    if (quantity > 0) {
      if (actionWrapper) {
        actionWrapper.classList.add('is-expanded');
      }

      if (existingQuantityControls) {
        if (existingAddBtn) {
          existingAddBtn.remove();
        }
        // Just update the quantity display
        const qtyDisplay = existingQuantityControls.querySelector('.inline-qty-display');
        if (qtyDisplay) {
          qtyDisplay.textContent = quantity;
        }
      } else {
        if (existingAddBtn) {
          existingAddBtn.remove();
        }
        // Create quantity controls
        const quantityControls = document.createElement('div');
        quantityControls.className = 'inline-quantity-controls';
        quantityControls.innerHTML = `
          <button class="inline-qty-btn qty-decrease" data-product-id="${productId}">−</button>
          <span class="inline-qty-display">${quantity}</span>
          <button class="inline-qty-btn qty-increase" data-product-id="${productId}">+</button>
        `;
        actionContainer.appendChild(quantityControls);

        // Attach event listeners to the new buttons
        const increaseBtn = quantityControls.querySelector('.qty-increase');
        const decreaseBtn = quantityControls.querySelector('.qty-decrease');

        if (increaseBtn) {
          increaseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentQty = this.selectedProducts[stepIndex]?.[productId] || 0;
            this.updateProductSelection(stepIndex, productId, currentQty + 1);
          });
        }

        if (decreaseBtn) {
          decreaseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentQty = this.selectedProducts[stepIndex]?.[productId] || 0;
            if (currentQty > 0) {
              this.updateProductSelection(stepIndex, productId, currentQty - 1);
            }
          });
        }
      }

      // Show selected overlay
      if (!selectedOverlay) {
        selectedOverlay = document.createElement('div');
        selectedOverlay.className = 'selected-overlay';
        selectedOverlay.textContent = '✓';
        productCard.appendChild(selectedOverlay);
      }
      selectedOverlay.style.display = 'flex';
      productCard.classList.add('selected');

    } else {
      if (actionWrapper) {
        actionWrapper.classList.remove('is-expanded');
      }

      // Show "Add to Bundle" button, hide quantity controls
      if (existingQuantityControls) {
        existingQuantityControls.remove();
      }

      if (!existingAddBtn) {
        const addButton = document.createElement('button');
        addButton.className = 'product-add-btn';
        addButton.dataset.productId = productId;
        addButton.textContent = this.getProductAddButtonText();
        actionContainer.appendChild(addButton);

        // Attach event listener to the new button
        addButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.updateProductSelection(stepIndex, productId, 1);
        });
      }

      // Hide selected overlay
      if (selectedOverlay) {
        selectedOverlay.style.display = 'none';
      }
      productCard.classList.remove('selected');
    }

    // Refresh dimmed state on all sibling cards now that the selection has changed
    this._refreshSiblingDimState(stepIndex);
  }

  refreshCurrentProductGrid(stepIndex) {
    if (this.container.dataset.bundleType !== 'full_page') return false;
    if (stepIndex !== this.currentStepIndex) return false;

    const currentGrid = this.container.querySelector('.full-page-product-grid');
    if (!currentGrid) return false;

    const replacementGrid = this.createFullPageProductGrid(stepIndex);
    currentGrid.replaceWith(replacementGrid);
    return true;
  }

  // Refresh the .dimmed class on every card in the current step's product grid.
  // Called after every real-time selection change so cards gray out (or un-gray)
  // immediately when the step quota is filled or freed — not only on full re-renders.
  _refreshSiblingDimState(stepIndex) {
    // Only update the DOM if this step's grid is currently visible.
    // When a product is removed via the footer while on a different step,
    // skip the DOM update — createFullPageProductGrid will apply the correct
    // dim state when the user navigates to that step.
    if (stepIndex !== this.currentStepIndex) return;
    const step = this.selectedBundle?.steps?.[stepIndex];
    if (!step) return;
    const stepSelections = this.selectedProducts[stepIndex] || {};
    const capacityCheck = ConditionValidator.canUpdateQuantity(step, stepSelections, '__new__', 1);
    const isAtCapacity = !capacityCheck.allowed;
    // Only one step's grid is visible at a time; navigate up from any card in it
    const anyCard = this.container.querySelector('.product-grid .product-card');
    const grid = anyCard?.closest('.product-grid');
    if (!grid) return;
    grid.querySelectorAll('.product-card').forEach(card => {
      const cardProductId = card.dataset.productId;
      const currentQty = cardProductId ? (stepSelections[cardProductId] || 0) : 0;
      if (isAtCapacity && currentQty === 0) {
        card.classList.add('dimmed');
      } else {
        card.classList.remove('dimmed');
      }
    });
  }

  // Helper to find product by ID across all step data
  findProductById(stepIndex, productId) {
    const products = this.stepProductData[stepIndex] || [];
    return products.find(p => (p.variantId || p.id) === productId);
  }

  validateStepCondition(stepIndex, productId, newQuantity) {
    const step = this.selectedBundle.steps[stepIndex];
    const currentSelections = this.selectedProducts[stepIndex] || {};
    const currentQty = currentSelections[productId] || 0;

    const { allowed, limitText } = ConditionValidator.canUpdateQuantity(
      step,
      currentSelections,
      productId,
      newQuantity,
    );

    // Only block and toast on increases — decreases are always permitted.
    if (!allowed && newQuantity > currentQty) {
      const required = step.conditionValue;
      ToastManager.show(`This step allows ${limitText} product${required !== 1 ? 's' : ''} only.`);
      return false;
    }

    return true;
  }

  validateStep(stepIndex) {
    const step = this.selectedBundle.steps[stepIndex];
    const currentSelections = this.selectedProducts[stepIndex] || {};

    // In category-rule mode, selection keys are numeric variant IDs but
    // category product IDs are numeric product IDs (GID-stripped). Translate
    // each variant-ID key → its parent product ID before the validator runs.
    if (ConditionValidator.isCategoryRuleMode(step)) {
      const products = this.stepProductData[stepIndex] || [];
      const translated = {};
      for (const [selKey, qty] of Object.entries(currentSelections)) {
        const product = products.find(p => (p.variantId || p.id) === selKey);
        const productId = String((product && (product.parentProductId || product.id)) || selKey);
        translated[productId] = (translated[productId] || 0) + (Number(qty) || 0);
      }
      return ConditionValidator.isStepConditionSatisfied(step, translated);
    }

    return ConditionValidator.isStepConditionSatisfied(step, currentSelections);
  }

  isStepAccessible(stepIndex) {
    // Default steps are always accessible (read-only, pre-selected)
    if (this.selectedBundle?.steps[stepIndex]?.isDefault) return true;
    // Add-on step: lock until prior steps complete only when addonUnlockAfterCompletion is true (default)
    const addonStep = this.selectedBundle?.steps[stepIndex];
    if (addonStep?.isFreeGift && addonStep?.addonUnlockAfterCompletion === false) {
      // unlock flag disabled — treat as regular step (fall through to standard check)
    } else if (!this.canNavigateToStep(stepIndex)) {
      return false;
    }
    // Check if all previous steps are completed
    for (let i = 0; i < stepIndex; i++) {
      const step = this.selectedBundle?.steps[i];
      if (step?.isFreeGift || step?.isDefault) continue; // skip non-blocking steps
      if (!this.validateStep(i)) return false;
    }
    return true;
  }

  updateModalNavigation() {
    const prevButton = this.elements.modal?.querySelector('.prev-button');
    const nextButton = this.elements.modal?.querySelector('.next-button');

    // In full-page mode the modal may be hidden/empty — skip without crashing
    if (!prevButton || !nextButton) return;

    prevButton.disabled = this.currentStepIndex === 0;

    const isCurrentStepValid = this.validateStep(this.currentStepIndex);

    if (this.currentStepIndex === this.selectedBundle.steps.length - 1) {
      nextButton.textContent = this._resolveText('doneButton', 'Done');
      nextButton.disabled = !isCurrentStepValid;
    } else {
      nextButton.textContent = this._resolveText('nextButton', 'Next');
      nextButton.disabled = !isCurrentStepValid;
    }
  }

  updateModalFooterMessaging() {
    // Skip if modal is not active (full-page mode uses inline footer instead)
    if (!this.elements.modal || this.elements.modal.style.display === 'none') return;

    const { totalPrice, totalQuantity, unitPrices } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData,
      this.selectedBundle?.steps
    );

    const discountInfo = PricingCalculator.calculateDiscount(
      this.selectedBundle,
      totalPrice,
      totalQuantity,
      unitPrices
    );
    const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);

    const currencyInfo = CurrencyManager.getCurrencyInfo();

    // Update modal header text dynamically
    this.updateModalHeaderText(totalPrice, totalQuantity, combinedDiscountInfo, currencyInfo);

    // Update cart badge with total item count
    const cartBadge = this.elements.modal.querySelector('.cart-badge-count');
    if (cartBadge) {
      cartBadge.textContent = totalQuantity.toString();
    }

    // Update total prices in the footer pill
    this.updateFooterTotalPrices(totalPrice, combinedDiscountInfo, currencyInfo);

    // Update discount messaging and progress bar
    this.updateModalDiscountMessaging(totalPrice, totalQuantity, combinedDiscountInfo, currencyInfo);
  }

  updateModalHeaderText(totalPrice, totalQuantity, discountInfo, currencyInfo) {
    const modalStepTitle = this.elements.modal.querySelector('.modal-step-title');
    if (!modalStepTitle) return;

    // If discount is not enabled, show step name (escaped)
    if (!this.selectedBundle?.pricing?.enabled) {
      const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
      modalStepTitle.innerHTML = this._escapeHTML(currentStep?.name) || `Step ${this.currentStepIndex + 1}`;
      return;
    }

    const variables = TemplateManager.createDiscountVariables(
      this.selectedBundle,
      totalPrice,
      totalQuantity,
      discountInfo,
      currencyInfo
    );

    const headerText = TemplateManager.replaceVariables(
      this.config.discountTextTemplate,
      variables
    );

    modalStepTitle.innerHTML = headerText;
  }

  updateModalDiscountMessaging(totalPrice, totalQuantity, discountInfo, currencyInfo) {
    const footerDiscountText = this.elements.modal.querySelector('.footer-discount-text');
    const discountSection = this.elements.modal.querySelector('.modal-footer-discount-messaging');

    if (!footerDiscountText) return;

    const variables = TemplateManager.createDiscountVariables(
      this.selectedBundle,
      totalPrice,
      totalQuantity,
      discountInfo,
      currencyInfo
    );

    if (discountInfo.qualifiesForDiscount) {
      // Success message
      const successMessage = TemplateManager.replaceVariables(
        this.config.successMessageTemplate,
        variables
      );
      footerDiscountText.innerHTML = successMessage;
      if (discountSection) discountSection.classList.add('qualified');
    } else {
      // Progress message
      const progressMessage = TemplateManager.replaceVariables(
        this.config.discountTextTemplate,
        variables
      );
      footerDiscountText.innerHTML = progressMessage;
      if (discountSection) discountSection.classList.remove('qualified');
    }

    // Show/hide discount section based on config
    if (discountSection) {
      discountSection.style.display = this.config.showDiscountMessaging ? 'block' : 'none';
    }
  }

  updateFooterTotalPrices(totalPrice, discountInfo, currencyInfo) {
    const strikePriceEl = this.elements.modal.querySelector('.total-price-strike');
    const finalPriceEl = this.elements.modal.querySelector('.total-price-final');

    if (!strikePriceEl || !finalPriceEl) return;

    if (discountInfo.qualifiesForDiscount && discountInfo.finalPrice < totalPrice) {
      // Show strike-through original price and discounted price
      strikePriceEl.textContent = CurrencyManager.convertAndFormat(totalPrice, currencyInfo);
      strikePriceEl.style.display = 'inline';
      finalPriceEl.textContent = CurrencyManager.convertAndFormat(discountInfo.finalPrice, currencyInfo);
    } else {
      // Show only regular price
      strikePriceEl.style.display = 'none';
      finalPriceEl.textContent = CurrencyManager.convertAndFormat(totalPrice, currencyInfo);
    }
  }

  // ========================================================================
  // LOADING OVERLAY
  // ========================================================================

  showLoadingOverlay(gifUrl) {
    if (!this.container) return;
    // Ensure container is positioned so absolute overlay works
    const pos = getComputedStyle(this.container).position;
    if (pos !== 'relative' && pos !== 'absolute' && pos !== 'fixed' && pos !== 'sticky') {
      this.container.style.position = 'relative';
    }
    // Remove any existing overlay (idempotent)
    this.container.querySelector('.bundle-loading-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'bundle-loading-overlay';

    if (gifUrl) {
      const img = document.createElement('img');
      img.className = 'bundle-loading-overlay__gif';
      img.src = gifUrl;
      img.alt = '';
      overlay.appendChild(img);
    } else {
      const animation = createDefaultLoadingAnimation();
      overlay.appendChild(animation);
    }

    this.container.appendChild(overlay);
    requestAnimationFrame(() => markLoadingOverlayVisible(overlay));
  }

  hideLoadingOverlay() {
    const overlay = this.container?.querySelector('.bundle-loading-overlay');
    hideLoadingOverlayElement(overlay);
  }

  // ========================================================================
  // CART OPERATIONS
  // ========================================================================

  generateBundleInstanceId() {
    // Generate unique bundle instance ID using UUID (recommended by Shopify)
    // This prevents hash collisions and ensures each bundle instance is truly unique
    // Reference: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID

    // Use crypto.randomUUID() if available (modern browsers)
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      const uuid = crypto.randomUUID();
      const bundleInstanceId = `${this.selectedBundle.id}_${uuid}`;

      return bundleInstanceId;
    }

    // Fallback for older browsers: use timestamp + random number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    const bundleInstanceId = `${this.selectedBundle.id}_${timestamp}_${random}`;

    return bundleInstanceId;
  }
  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================

  // ========================================================================
  // TIER PILL SELECTION
  // ========================================================================

  /**
   * Parses the JSON string from data-tier-config into a TierConfig array.
   * Returns [] on any error — pill bar is simply not shown.
   */
  parseTierConfig(rawJson) {
    try {
      const parsed = JSON.parse(rawJson);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(t => typeof t?.label === 'string' && typeof t?.bundleId === 'string')
        .map(t => ({ label: t.label.trim(), bundleId: t.bundleId.trim() }))
        .filter(t => t.label !== '' && t.bundleId !== '')
        .slice(0, 4);
    } catch {
      return [];
    }
  }

  /**
   * Resolves which tier config array to use for pill rendering.
   *
   * Preference order:
   *  1. apiTierConfig (from DB via bundle API) — used when the merchant has saved
   *     tiers in the admin UI (>= 2 valid entries after mapping).
   *  2. dataTierConfig (from data-tier-config HTML attribute) — legacy Theme Editor
   *     source, used as fallback when apiTierConfig is null/undefined.
   *
   * apiTierConfig entries use { label, linkedBundleId } (DB schema).
   * Widget pill entries use { label, bundleId } — this method performs the mapping.
   *
   * Returns [] when fewer than 2 valid tiers exist after filtering.
   */
  resolveTierConfig(apiTierConfig, dataTierConfig) {
    if (apiTierConfig == null) return dataTierConfig;

    const mapped = (Array.isArray(apiTierConfig) ? apiTierConfig : [])
      .filter(
        t =>
          typeof t?.label === 'string' &&
          typeof t?.linkedBundleId === 'string' &&
          t.label.trim() !== '' &&
          t.linkedBundleId.trim() !== ''
      )
      .map(t => ({ label: t.label.trim(), bundleId: t.linkedBundleId.trim() }))
      .slice(0, 4);

    return mapped.length >= 2 ? mapped : [];
  }

  /**
   * Resolves whether to show the step timeline.
   * Admin UI (API) value takes precedence over the theme editor data attribute when non-null.
   *
   * @param {boolean|null} apiValue - From selectedBundle.showStepTimeline (DB, nullable)
   * @param {boolean} dataAttrValue - From data-show-step-timeline attribute (theme editor)
   * @returns {boolean}
   */
  resolveShowStepTimeline(apiValue, dataAttrValue) {
    if (apiValue !== null && apiValue !== undefined) return apiValue;
    return dataAttrValue;
  }

  resolveFullPageLayout(bundle = this.selectedBundle) {
    if (bundle?.bundleDesignTemplate === 'FBP_SIDE_FOOTER') {
      return 'footer_side';
    }

    return bundle?.fullPageLayout || 'footer_bottom';
  }

  getFullPageTemplate(bundle = this.selectedBundle) {
    return bundle?.bundleDesignTemplate || 'FBP_SIDE_FOOTER';
  }

  getFullPageDesignPreset(bundle = this.selectedBundle) {
    const rawPresetId =
      bundle?.bundleDesignPresetId
      || bundle?.bundleDesignPreset
      || bundle?.templateId
      || 'DEFAULT';
    if (typeof rawPresetId !== 'string') return 'DEFAULT';

    const preset = rawPresetId.trim().toUpperCase();
    if (preset === 'STANDARD') return 'DEFAULT';
    return preset || 'DEFAULT';
  }

  resolveFullPageCardCtaMode(bundle = this.selectedBundle) {
    const pricingMethod = String(bundle?.pricing?.method || '').toLowerCase();
    const boxSelection = bundle?.boxSelection;
    const boxSelectionEnabled = boxSelection?.isEnabled === true && Array.isArray(boxSelection.rules) && boxSelection.rules.length > 0;
    if (
      this.resolveFullPageLayout(bundle) === 'footer_side' &&
      this.getFullPageDesignPreset(bundle) === 'DEFAULT' &&
      bundle?.pricing?.enabled === true &&
      pricingMethod === 'fixed_amount_off' &&
      !boxSelectionEnabled
    ) {
      return 'icon';
    }
    return 'text';
  }

  getProductAddButtonText() {
    return this._resolveText('productAddButton', 'Add To Box');
  }

  applyFullPageDesignPresetMarker() {
    if (!this.container || !this.elements?.stepsContainer) return;

    const fullPageTemplate = this.getFullPageTemplate();
    const fullPageDesignPreset = this.getFullPageDesignPreset();

    this.container.dataset.fpbTemplateType = fullPageTemplate;
    this.elements.stepsContainer.dataset.fpbTemplateType = fullPageTemplate;

    this.container.dataset.fpbDesignPreset = fullPageDesignPreset;
    this.elements.stepsContainer.dataset.fpbDesignPreset = fullPageDesignPreset;
    this.elements.stepsContainer.dataset.fpbCardCtaMode = this.resolveFullPageCardCtaMode();
  }

  /** Returns true if the given tier index is the currently active one. */
  isTierActive(tierIndex) {
    return tierIndex === this.activeTierIndex;
  }

  /**
   * Inserts the tier pill bar as the first child of the container.
   * No-op when fewer than 2 tiers are configured (backward-compatible).
   */
  initTierPills(tiers) {
    if (tiers.length < 2) return;

    const bar = document.createElement('div');
    bar.className = 'bundle-tier-pill-bar';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Bundle pricing tiers');

    tiers.forEach((tier, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bundle-tier-pill' + (i === 0 ? ' bundle-tier-pill--active' : '');
      btn.dataset.tierIndex = String(i);
      btn.dataset.bundleId = tier.bundleId;
      btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      btn.textContent = tier.label;
      bar.appendChild(btn);
    });

    this.container.insertBefore(bar, this.container.firstChild);
    this.elements.tierPillBar = bar;
  }

  /** Updates aria-pressed and active CSS class on all pills to match activeTierIndex. */
  updatePillActiveStates() {
    if (!this.elements.tierPillBar) return;
    this.elements.tierPillBar.querySelectorAll('.bundle-tier-pill').forEach(pill => {
      const idx = parseInt(pill.dataset.tierIndex, 10);
      const active = idx === this.activeTierIndex;
      pill.classList.toggle('bundle-tier-pill--active', active);
      pill.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  /** Switches the active bundle tier — fetches new bundle data and re-renders the widget. */
  async switchTier(bundleId, tierIndex) {
    if (tierIndex === this.activeTierIndex) return;

    const pills = this.elements.tierPillBar
      ? [...this.elements.tierPillBar.querySelectorAll('.bundle-tier-pill')]
      : [];

    // Disable all pills while loading
    pills.forEach(p => p.classList.add('bundle-tier-pill--disabled'));
    if (pills[tierIndex]) pills[tierIndex].classList.add('bundle-tier-pill--loading');

    this.showLoadingOverlay(null);

    try {
      // Reset mutable widget state
      this.selectedProducts = [];
      this.stepProductData = [];
      this.currentStepIndex = 0;
      this.stepCollectionProductIds = {};
      this.searchQuery = '';

      // Swap bundle ID and fetch new data
      this.config.bundleId = bundleId;
      await this.loadBundleData();
      this.selectBundle();

      if (!this.selectedBundle) {
        throw new Error('Bundle not found for this tier.');
      }
      this.applyPersonalizationAddonProducts();

      // Re-resolve showStepTimeline from the newly loaded tier bundle's API value
      this.config.showStepTimeline = this.resolveShowStepTimeline(
        this.selectedBundle.showStepTimeline ?? null,
        this.config.showStepTimeline
      );

      this.initializeDataStructures();

      // Clear existing step content and re-render
      if (this.elements.stepsContainer) {
        this.elements.stepsContainer.innerHTML = '';
      }
      await this.renderUI();

      this.activeTierIndex = tierIndex;
      this.updatePillActiveStates();
    } catch (err) {
      ToastManager.show(`Failed to load tier: ${err.message}`);
      // Restore previous active state styling
      this.updatePillActiveStates();
    } finally {
      this.hideLoadingOverlay();
      pills.forEach(p => {
        p.classList.remove('bundle-tier-pill--disabled', 'bundle-tier-pill--loading');
      });
    }
  }

  _mergeBundleSettings(settings) {
    if (!settings || !this.selectedBundle) return;
    const keys = [
      'promoBannerBgImage', 'promoBannerBgImageCrop', 'loadingGif',
      'showStepTimeline', 'floatingBadgeEnabled', 'floatingBadgeText', 'tierConfig',
    ];
    for (const key of keys) {
      if (settings[key] !== undefined) this.selectedBundle[key] = settings[key];
    }
  }

  _initFloatingBadge() {
    const enabled = this.selectedBundle && this.selectedBundle.floatingBadgeEnabled;
    const text = this.selectedBundle && this.selectedBundle.floatingBadgeText;
    if (!enabled || !text || !text.trim()) return;

    const DISMISS_KEY = `fpb_badge_dismissed_${this.selectedBundle.id}`;
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    const badge = document.createElement('div');
    badge.className = 'floating-promo-badge';
    badge.setAttribute('role', 'status');
    badge.innerHTML = `<span class="floating-promo-badge__text">${this._escapeHtml(text.trim())}</span><button class="floating-promo-badge__close" aria-label="Dismiss">&times;</button>`;

    badge.querySelector('.floating-promo-badge__close').addEventListener('click', () => {
      sessionStorage.setItem(DISMISS_KEY, '1');
      badge.remove();
    });

    document.body.appendChild(badge);
  }

  _escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  attachEventListeners() {
    // Tier pill click handler
    if (this.elements.tierPillBar) {
      this.elements.tierPillBar.addEventListener('click', e => {
        const pill = e.target.closest('.bundle-tier-pill');
        if (!pill) return;
        this.switchTier(pill.dataset.bundleId, parseInt(pill.dataset.tierIndex, 10));
      });
      this.elements.tierPillBar.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          const pill = e.target.closest('.bundle-tier-pill');
          if (!pill) return;
          e.preventDefault();
          pill.click();
        }
      });
    }

    // Modal close handlers
    const modal = this.elements.modal;
    const closeButton = modal.querySelector('.close-button');
    const overlay = modal.querySelector('.modal-overlay');
    const prevButton = modal.querySelector('.prev-button');
    const nextButton = modal.querySelector('.next-button');

    if (closeButton) {
      closeButton.addEventListener('click', () => this.closeModal());
    }

    if (overlay) {
      overlay.addEventListener('click', () => this.closeModal());
    }

    // Modal navigation
    if (prevButton) {
      prevButton.addEventListener('click', () => this.navigateModal(-1));
    }

    if (nextButton) {
      nextButton.addEventListener('click', () => this.navigateModal(1));
    }

    // Keyboard handlers
    document.addEventListener('keydown', (e) => {
      if (modal.style.display === 'block' && e.key === 'Escape') {
        this.closeModal();
      }
    });
  }

  async navigateModal(direction) {
    const newStepIndex = this.currentStepIndex + direction;

    if (direction < 0 && newStepIndex >= 0) {
      // Previous step — no validation required, user must be free to correct mistakes
      this.currentStepIndex = newStepIndex;

      // Update modal header
      const headerText = this.getFormattedHeaderText();
      this.elements.modal.querySelector('.modal-step-title').innerHTML = headerText;

      // Load products for this step
      await this.loadStepProducts(newStepIndex);

      this.renderModalTabs();
      this.renderModalProducts(this.currentStepIndex);
      this.updateModalNavigation();
      this.updateModalFooterMessaging();
    } else if (direction > 0) {
      if (newStepIndex < this.selectedBundle.steps.length) {
        // Next step
        if (this.validateStep(this.currentStepIndex)) {
          this.currentStepIndex = newStepIndex;

          // Update modal header
          const headerText = this.getFormattedHeaderText();
          this.elements.modal.querySelector('.modal-step-title').innerHTML = headerText;

          // Load products for this step
          await this.loadStepProducts(newStepIndex);

          this.renderModalTabs();
          this.renderModalProducts(this.currentStepIndex);
          this.updateModalNavigation();
          this.updateModalFooterMessaging();
        } else {
          ToastManager.show('Please meet the quantity conditions for the current step before proceeding.');
        }
      } else {
        // Done button clicked on last step
        if (this.validateStep(this.currentStepIndex)) {
          this.closeModal();
        } else {
          ToastManager.show('Please meet the quantity conditions for the current step before finishing.');
        }
      }
    }
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  showFallbackUI() {
    this.container.innerHTML = `
      <div class="bundle-fallback">
        <h3>Bundle Configuration</h3>
        <p>No active bundles found for this product.</p>
        <details>
          <summary>Debug Information</summary>
          <pre>${JSON.stringify({
      config: this.config,
      bundleDataKeys: this.bundleData ? Object.keys(this.bundleData) : 'No data',
      currentProductId: this.config.currentProductId
    }, null, 2)}</pre>
        </details>
      </div>
    `;
  }

  showErrorUI(_error) {
    this.container.innerHTML = `
      <div class="bundle-error">
        <h3>Bundle unavailable</h3>
        <p>We couldn&apos;t load this bundle right now. Please refresh the page or try again later.</p>
        <p>If the problem persists, please contact the store owner.</p>
      </div>
    `;
  }

  /**
   * Fire-and-forget error report to the server so AppLogger can track widget failures.
   * Does NOT await — never blocks the render path.
   */

  /**
   * Background layout refresh — runs after initial render.
   *
   * The CDN-cached `data-bundle-config` attribute can be stale for minutes-to-hours
   * after the merchant saves a layout change. This method fetches the latest config
   * from the proxy API and, if the layout differs from what was cached, re-renders
   * the steps container so the correct layout is shown within seconds of page load.
   *
   * Only runs when:
   *   1. Cached data was used for first render (data-bundle-config attr was present)
   *   2. Not in the Shopify theme editor (designMode)
   *
   * Fire-and-forget: all errors are silently swallowed.
   */
  async _scheduleLayoutRefresh() {
    const bundleId = this.container.dataset.bundleId;
    if (!bundleId) return;

    // Only needed when we served the first render from the CDN-cached metafield.
    // If the proxy API was used for the first render, the data is already fresh.
    const cachedAttr = this.container.dataset.bundleConfig;
    const usedCache = cachedAttr && cachedAttr !== 'null' && cachedAttr !== 'undefined' && cachedAttr.trim() !== '';
    if (!usedCache) return;

    try {
      const apiUrl = `/apps/product-bundles/api/bundle/${encodeURIComponent(bundleId)}.json`;
      const response = await fetch(apiUrl);
      if (!response.ok) return;

      const data = await response.json();
      if (!data?.bundle) return;

      const freshLayout = this.resolveFullPageLayout(data.bundle);
      const currentLayout = this.resolveFullPageLayout();

      if (freshLayout !== currentLayout && this.selectedBundle) {
        this.selectedBundle.fullPageLayout = data.bundle.fullPageLayout || 'footer_bottom';
        this.selectedBundle.bundleDesignTemplate = data.bundle.bundleDesignTemplate ?? this.selectedBundle.bundleDesignTemplate;
        if (this.bundleData?.[bundleId]) {
          this.bundleData[bundleId].fullPageLayout = data.bundle.fullPageLayout || 'footer_bottom';
          this.bundleData[bundleId].bundleDesignTemplate = data.bundle.bundleDesignTemplate ?? this.bundleData[bundleId].bundleDesignTemplate;
        }
        await this.renderSteps();
      }
    } catch (_e) {
      // Best-effort: silently ignore all errors
    }
  }

  _reportError(error) {
    try {
      const payload = {
        message: error?.message ?? String(error),
        bundleId: this.config?.bundleId ?? null,
        bundleType: this.container?.dataset?.bundleType ?? null,
        shop: window.Shopify?.shop ?? null,
        url: window.location?.href ?? null,
      };
      // Use the app proxy path so the request is authenticated by Shopify
      fetch('/apps/product-bundles/api/widget-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => { /* best-effort — ignore if proxy is also down */ });
    } catch (_) {
      // Never throw from error reporting
    }
  }

  _resolveText(key, fallback) {
    const locale = window.Shopify?.locale;
    if (locale && this.config?.textOverridesByLocale?.[locale]?.[key]) {
      return this.config.textOverridesByLocale[locale][key];
    }
    if (this.config?.textOverrides?.[key]) {
      return this.config.textOverrides[key];
    }
    return fallback;
  }

  _recordView() {
    try {
      const bundleId = this.config?.bundleId ?? this.container?.dataset?.bundleId;
      const shop = window.Shopify?.shop;
      if (!bundleId || !shop) return;
      fetch(`/apps/product-bundles/api/bundle/${bundleId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop }),
        keepalive: true,
      }).catch(() => { /* best-effort */ });
    } catch (_) {
      // Never throw from analytics
    }
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFullPageWidget);
} else {
  initializeFullPageWidget();
}

function initializeFullPageWidget() {
  const containers = document.querySelectorAll('#bundle-builder-app');
  containers.forEach(container => {
    if (!container.dataset.initialized) {
      const bundleType = container.dataset.bundleType || 'full_page';
      if (bundleType === 'full_page') {
        new BundleWidgetFullPage(container);
      }
    }
  });
}
