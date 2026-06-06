/**
 * Bundle Widget - Product Page Version
 *
 * This widget is specifically for product page bundles with vertical step boxes layout.
 * It imports shared components and utilities from bundle-widget-components.js.
 *
 * ============================================================================
 * ARCHITECTURE ROLE
 * ============================================================================
 * This is the THIRD file loaded for PRODUCT PAGE bundles:
 * 1. bundle-widget.js (loader) - Detects bundle type as 'product_page'
 * 2. bundle-widget-components.js - Provides shared utilities
 * 3. THIS FILE (product-page widget) - Implements product page UI/UX
 *
 * ============================================================================
 * WHEN THIS FILE IS LOADED
 * ============================================================================
 * This file loads when:
 * - Container has data-bundle-type="product_page", OR
 * - Container has no data-bundle-type attribute (DEFAULT for backward compatibility)
 *
 * Example container:
 * <div id="bundle-builder-app" data-bundle-type="product_page"></div>
 * OR
 * <div id="bundle-builder-app"></div>  <!-- Defaults to product_page -->
 *
 * ============================================================================
 * UI LAYOUT: VERTICAL STEP BOXES
 * ============================================================================
 * - Steps displayed as vertical accordion/collapsible sections
 * - One step visible at a time (step-by-step flow)
 * - Progress tracked with step completion indicators
 * - Best for: Product detail pages with limited vertical space
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
 * - Product page specific UI rendering
 * - Vertical layout management
 * - Step navigation logic
 * - Event handlers for product page flow
 *
 * ============================================================================
 * BACKWARD COMPATIBILITY
 * ============================================================================
 * This is the DEFAULT widget loaded when:
 * - Existing merchants have no data-bundle-type attribute
 * - Ensures existing bundles continue working without changes
 * - No data migration or merchant action required
 *
 * @version 1.0.0
 * @author Wolfpack Team
 */

'use strict';

// ============================================================
// BOTTOM-SHEET HELPER FUNCTIONS (pure — exposed for unit tests)
// ============================================================

/**
 * Find the next incomplete non-default step after `fromIndex`.
 * Returns -1 when all remaining non-default steps are complete.
 */
function bsFindNextIncompleteStep(steps, selectedProducts, validateFn, fromIndex) {
  for (let i = fromIndex + 1; i < steps.length; i++) {
    // Free gift and default steps are non-required — never auto-advance into them.
    // The free gift step has its own unlock flow; default steps are pre-filled.
    if (steps[i].isDefault || steps[i].isFreeGift) continue;
    if (!validateFn(i)) return i;
  }
  return -1;
}

function bsIsDefaultStep(step) { return !!step?.isDefault; }

function bsGetDiscountBadgeLabel(step) { return step?.discountBadgeLabel || null; }

function ppbExpandSingleStepCategoriesAsSteps(bundle) {
  if (!bundle?.useSingleStepCategoriesAsBundleSteps) return bundle;
  if (!Array.isArray(bundle.steps) || bundle.steps.length !== 1) return bundle;

  const [step] = bundle.steps;
  const categories = Array.isArray(step?.categories) ? step.categories : [];
  if (categories.length <= 1 || step?.isDefault || step?.isFreeGift) return bundle;

  return {
    ...bundle,
    steps: categories.map((category, categoryIndex) => {
      const categoryLabel = category?.pageTitle
        || category?.title
        || category?.name
        || `${step.pageTitle || step.name || 'Step'} ${categoryIndex + 1}`;
      const categoryKey = category?.id
        || category?.categoryId
        || category?.title
        || category?.name
        || categoryIndex + 1;

      return {
        ...step,
        id: `${step.id || 'step'}__category_${categoryKey}`,
        name: categoryLabel,
        pageTitle: categoryLabel,
        categories: [category],
        conditions: category?.conditions || step.conditions,
        _sourceStepId: step.id || null,
        _sourceCategoryId: category?.id || category?.categoryId || null,
        _sourceCategoryIndex: categoryIndex,
      };
    }),
  };
}

// Export for unit tests
if (typeof window !== 'undefined') {
  window.__bsHelpers = {
    bsFindNextIncompleteStep,
    bsIsDefaultStep,
    bsGetDiscountBadgeLabel,
    ppbExpandSingleStepCategoriesAsSteps,
  };
}

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
import { ConditionValidator } from './widgets/shared/condition-validator.js';
import { createDefaultLoadingAnimation } from './widgets/shared/default-loading-animation.js';
import { hideLoadingOverlayElement, markLoadingOverlayVisible } from './widgets/shared/loading-overlay.js';
import { installModalSlotTemplate } from './widgets/product-page/templates/modal-slot-template.js';
import { installCascadeTemplate } from './widgets/product-page/templates/cascade-template.js';
import { installCogniveTemplate } from './widgets/product-page/templates/cognive-template.js';


class BundleWidgetProductPage {

  constructor(containerElement) {
    this.container = containerElement;
    this.selectedBundle = null;
    this.selectedProducts = [];
    this.stepProductData = [];
    this.directDefaultProducts = [];
    this.activeInpageCategoryIndexes = {};
    this.currentStepIndex = 0;
    this.isInitialized = false;
    this.config = {};
    this.elements = {};

    // Initialize product modal for variant selection (if BundleProductModal is available)
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

      // Parse configuration
      this.parseConfiguration();

      // Show loading overlay immediately — read gif from dataset before async fetch
      let initialGif = null;
      try { initialGif = JSON.parse(this.container.dataset.bundleConfig || '{}')?.loadingGif || null; } catch {}
      this.showLoadingOverlay(initialGif);

      // Load design settings CSS
      await this.loadDesignSettingsCSS();
      await this.loadLanguageSettings();
      await this.loadControlsSettings();

      // Storefront self-heal: make sure the shop has an active CartTransform.
      this._scheduleCartTransformSelfHeal();

      // Load and validate bundle data
      await this.loadBundleData();

      // loadBundleData() hides the container and returns early on non-bundle products
      if (!this.bundleData) return;

      // Select appropriate bundle
      this.selectBundle();

      if (!this.selectedBundle) {
        this.hideLoadingOverlay();
        this.showFallbackUI();
        return;
      }

      // Initialize data structures
      this.initializeDataStructures();
      this._initDirectDefaultProducts();
      await this._preloadDirectDefaultProducts();

      // Pre-load product data for default steps so filled cards show real image/title
      await this._preloadDefaultStepProducts();

      this._relocateContainerToProductForm();
      this._hideNativeProductPrice();

      // Setup DOM elements
      this.setupDOMElements();
      this._markProductPageTemplate();

      // Render initial UI
      this.renderUI();

      // Hide overlay now that UI is rendered
      this.hideLoadingOverlay();

      // Attach event listeners
      this.attachEventListeners();

      // Mark as initialized
      this.container.dataset.initialized = 'true';
      this.isInitialized = true;

      // Fire-and-forget: record a view event for analytics (skip in Theme Editor preview)
      if (!window.Shopify?.designMode) {
        this._recordView();
      }

    } catch (error) {
      this.hideLoadingOverlay();
      this.showErrorUI(error);
    }
  }

  /**
   * Load Settings design CSS
   * Injects custom CSS from Settings -> Design into the page
   */
  async loadDesignSettingsCSS() {
    try {
      // Get shop domain from bundle data or window
      const shopDomain = window.Shopify?.shop || this.container.dataset.shop;

      if (!shopDomain) {
        return;
      }

      // CSS is loaded by the small loader (bundle-widget.js) for better performance
      // No need to load it here - just verify it's present
      const existingLink = document.querySelector('link[href*="design-settings"]');
      if (existingLink) {
      } else {
      }

    } catch (error) {
      // Don't throw - widget should work even if design CSS fails to load
    }
  }

  async loadLanguageSettings() {
    try {
      const shop = window.Shopify?.shop || this.container.dataset.shop;
      if (!shop) return;

      const locale = window.Shopify?.locale || 'en';
      const endpoint = `/apps/product-bundles/api/language-settings/${encodeURIComponent(shop)}?bundleType=product_page&locale=${encodeURIComponent(locale)}`;
      const response = await fetch(endpoint, { credentials: 'same-origin' });
      if (!response.ok) return;

      const languageSettings = await response.json();
      this.config.languageSettings = languageSettings;
      this.config.languageData = languageSettings.activeLanguageData || null;
      this.config.ppbCustomTextSettings = languageSettings.ppbCustomTextSettings || null;
      this.config.sharedCartLabels = languageSettings.sharedCartLabels || null;
      this.config.textOverrides = {
        ...(this.config.textOverrides || {}),
        ...(languageSettings.textOverrides || {})
      };
    } catch (_) {
      // Non-critical: default and bundle-level text still render.
    }
  }

  async loadControlsSettings() {
    try {
      const shop = window.Shopify?.shop || this.container.dataset.shop;
      if (!shop) return;

      const endpoint = `/apps/product-bundles/api/controls-settings/${encodeURIComponent(shop)}?bundleType=product_page`;
      const response = await fetch(endpoint, { credentials: 'same-origin' });
      if (!response.ok) return;

      this.config.controlsSettings = await response.json();
    } catch (_) {
      // Non-critical: the widget keeps its current default behavior.
    }
  }

  _getProductPageControls() {
    return this.config.controlsSettings?.activeControls
      || this.config.controlsSettings?.settingsControls?.productPage
      || null;
  }

  _isProductCardClickAddEnabled() {
    const controls = this._getProductPageControls();
    return controls?.addToCartWhenProductCardClicked === true;
  }

  _runControlsScript(script) {
    if (!script || typeof script !== 'string') return;
    try {
      new Function(script).call(window);
    } catch (_) {
      // Merchant-authored integration script should not block bundle checkout.
    }
  }

  _handlePostAddToCartAction(actionConfig) {
    const controls = this._getProductPageControls();
    const redirect = actionConfig || controls?.redirect || {};
    this._runControlsScript(redirect.executeScript);
    this._runControlsScript(controls?.scripts?.executeCustomScript);

    const action = redirect.action || 'cart';
    if (action === 'checkout') {
      setTimeout(() => {
        window.location.href = '/checkout';
      }, 1000);
      return;
    }

    if (action === 'side_cart') {
      const selector = redirect.selectors?.sideCartOpenButton
        || controls?.selectors?.sideCartOpenButton
        || controls?.selectors?.sideCart;
      if (selector) {
        const sideCartTrigger = document.querySelector(selector);
        if (sideCartTrigger) {
          setTimeout(() => sideCartTrigger.click(), 300);
          return;
        }
      }
    }

    setTimeout(() => {
      window.location.href = '/cart';
    }, 1000);
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
      showStepNumbers: dataset.showStepNumbers !== 'false',
      // Quantity selector visibility settings (default: show on card)
      showQuantitySelectorOnCard: dataset.showQuantitySelectorOnCard !== 'false',
      // Messages will be set from bundle.pricing.messages after bundle loads
      discountTextTemplate: 'Add {conditionText} to get {discountText}',
      successMessageTemplate: 'Congratulations! You got {discountText}!',
      currentProductId: window.currentProductId,
      currentProductGid: window.currentProductGid,
      currentProductHandle: window.currentProductHandle,
      currentProductCollections: window.currentProductCollections
    };
  }

  async loadBundleData() {
    let bundleData = null;

    // Single source: data-bundle-config attribute (from product metafield)
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

      // Not a bundle product page — silently hide the widget so storefront visitors
      // on non-bundle products don't see an error box.
      this.container.style.display = 'none';
      return;
    }

    this.bundleData = bundleData;
  }

  selectBundle() {
    this.selectedBundle = ppbExpandSingleStepCategoriesAsSteps(
      BundleDataManager.selectBundle(this.bundleData, this.config)
    );

    this.widgetStyle = 'bottom-sheet';

    // Update message templates from bundle pricing messages
    this.updateMessagesFromBundle();
  }

  _getProductPageTemplateType() {
    const templateType = this.selectedBundle?.bundleDesignTemplate;
    return templateType === 'PDP_INPAGE' || templateType === 'PDP_MODAL'
      ? templateType
      : 'PDP_MODAL';
  }

  _getProductPageDesignPreset() {
    const templateType = this._getProductPageTemplateType();
    const rawPresetId = this.selectedBundle?.bundleDesignTemplateData?.templateId
      || this.selectedBundle?.bundleDesignPresetId
      || this.selectedBundle?.templateId;
    const preset = typeof rawPresetId === "string" ? rawPresetId.trim().toUpperCase() : '';

    if (preset) {
      return preset;
    }

    return templateType === 'PDP_MODAL' ? 'MODAL' : 'CASCADE';
  }

  _isProductPageInpageTemplate() {
    return this._getProductPageTemplateType() === 'PDP_INPAGE';
  }

  _shouldShowProductComparedAtPrice() {
    return this.selectedBundle?.showProductComparedAtPrice === true;
  }

  _markProductPageTemplate() {
    if (!this.container || !this.elements?.stepsContainer || !this.selectedBundle) return;

    const templateType = this._getProductPageTemplateType();
    const designPreset = this._getProductPageDesignPreset();

    this.container.classList.toggle(
      'gbbMixPageWrapper',
      templateType === 'PDP_INPAGE' && designPreset === 'CASCADE'
    );
    this.container.classList.toggle(
      'gbbMixProductPageWrapperV2',
      templateType === 'PDP_INPAGE' && designPreset === 'CASCADE'
    );

    this.container.dataset.ppbTemplateType = templateType;
    this.container.dataset.ppbDesignPreset = designPreset;
    this.container.setAttribute('template-id', designPreset);
    this.container.setAttribute('template-type', templateType);
    this.elements.stepsContainer.dataset.ppbTemplateType = templateType;
    this.elements.stepsContainer.dataset.ppbDesignPreset = designPreset;

    document.body?.setAttribute('gbbmix-template-id', designPreset);
    document.body?.setAttribute('gbbmix-template-type', templateType);
    document.body?.setAttribute('gbb-mix-consolidated-design', 'true');

    if (templateType === 'PDP_MODAL') {
      const slotOrientation = this._usesVerticalModalSlotLayout() ? 'vertical' : 'horizontal';
      this.container.dataset.ppbSlotOrientation = slotOrientation;
      this.elements.stepsContainer.dataset.ppbSlotOrientation = slotOrientation;
    } else {
      delete this.container.dataset.ppbSlotOrientation;
      delete this.elements.stepsContainer.dataset.ppbSlotOrientation;
    }
  }

  // ========================================================================
  // STEP TYPE GETTERS
  // ========================================================================

  /** Steps that are neither free gift nor default — require user selection */
  get paidSteps() {
    return this.selectedBundle?.steps?.filter(s => !s.isFreeGift && !s.isDefault) ?? [];
  }

  /** The free gift step, if any */
  get freeGiftStep() {
    return this.selectedBundle?.steps?.find(s => s.isFreeGift) ?? null;
  }

  /** Index of the free gift step, or -1 */
  get freeGiftStepIndex() {
    return this.selectedBundle?.steps?.findIndex(s => s.isFreeGift) ?? -1;
  }

  /** Steps that are pre-filled with a compulsory product */
  get defaultStepsList() {
    return this.selectedBundle?.steps?.filter(s => s.isDefault) ?? [];
  }

  /**
   * True when all paid (non-free-gift, non-default) steps are fully satisfied.
   * Used to unlock the free gift slot.
   */
  get isFreeGiftUnlocked() {
    if (!this.selectedBundle) return false;
    return this.selectedBundle.steps.every((step, i) => {
      if (step.isFreeGift || step.isDefault) return true; // skip these
      return this.validateStep(i);
    });
  }

  updateMessagesFromBundle() {
    const messaging = this.selectedBundle?.messaging;

    if (messaging) {
      if (messaging.progressTemplate) {
        this.config.discountTextTemplate = messaging.progressTemplate;
      }
      if (messaging.successTemplate) {
        this.config.successMessageTemplate = messaging.successTemplate;
      }

      this.config.showDiscountMessaging = messaging.showDiscountMessaging !== false;

    } else {
      this.config.showDiscountMessaging = this.selectedBundle?.pricing?.enabled || false;
    }
  }

  initializeDataStructures() {
    const stepsCount = this.selectedBundle.steps.length;

    // Initialize selected products array (one object per step)
    this.selectedProducts = Array(stepsCount).fill(null).map(() => ({}));

    // Initialize step product data cache
    this.stepProductData = Array(stepsCount).fill(null).map(() => ([]));
    this._stepFetchFailed = {};

    // Seed default steps into selectedProducts regardless of widget style.
    // Default products are always included in the bundle — no user selection required.
    // buildCartItems() reads selectedProducts, so without this the default item is
    // silently excluded from the cart payload on classic modal style bundles.
    this.selectedBundle.steps.forEach((step, i) => {
      if (step.isDefault && step.defaultVariantId) {
        const normalizedDefaultVariantId = this.normalizeSelectionKey(step.defaultVariantId);
        if (normalizedDefaultVariantId) {
          this.setSelectedQuantity(i, normalizedDefaultVariantId, 1);
        }
      }
    });
  }

  _getDirectDefaultProductsData() {
    const data = this.selectedBundle?.defaultProductsData;
    if (!data || data.isDefaultProductsEnabled !== true || !Array.isArray(data.products)) {
      return null;
    }
    return data;
  }

  _normalizeDirectDefaultProduct(product) {
    const variant = Array.isArray(product.variants) ? product.variants[0] : null;
    const variantId = this.extractId(variant?.variantGraphqlId || variant?.variantId);
    if (!variantId) return null;

    const imageUrl = product.images?.[0]?.originalSrc || product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
    const inventoryQuantity = typeof variant?.inventoryQuantity === 'number'
      ? variant.inventoryQuantity
      : null;
    const price = Number.parseFloat(variant?.price || '0') * 100;
    const requiredQuantity = Number(product.requiredQuantity || 1) || 1;
    const explicitlyUnavailable = variant?.availableForSale === false || variant?.available === false;
    const available = !explicitlyUnavailable;
    const quantityAvailable = available && inventoryQuantity === 0 ? null : inventoryQuantity;

    return {
      id: this.extractId(product.graphqlId || product.productId) || product.productId || variantId,
      title: product.title || '',
      handle: product.handle || '',
      imageUrl,
      price,
      compareAtPrice: null,
      variantId,
      available,
      quantityAvailable,
      currentlyNotInStock: false,
      defaultRequiredQuantity: requiredQuantity,
      variants: [{
        id: variantId,
        title: variant?.title || '',
        price,
        compareAtPrice: null,
        available,
        quantityAvailable,
        currentlyNotInStock: false,
      }],
      images: imageUrl ? [{ src: imageUrl }] : [],
      description: '',
    };
  }

  _getDirectDefaultProductItems() {
    const data = this._getDirectDefaultProductsData();
    if (!data) return [];
    return data.products
      .map(product => this._normalizeDirectDefaultProduct(product))
      .filter(Boolean);
  }

  _initDirectDefaultProducts() {
    this.directDefaultProducts = this._getDirectDefaultProductItems();
    if (this.directDefaultProducts.length === 0 || !this.selectedProducts[0]) return;

    this.directDefaultProducts.forEach(product => {
      this.setSelectedQuantity(0, product.variantId, product.defaultRequiredQuantity || 1);
    });
  }

  async _preloadDirectDefaultProducts() {
    if (this.directDefaultProducts.length === 0 || !this.selectedBundle?.steps?.[0]) return;
    await this.loadStepProducts(0).catch(() => {});
  }

  _mergeDirectDefaultProductsIntoStep(stepIndex, products) {
    if (stepIndex !== 0 || this.directDefaultProducts.length === 0) return products;
    return products.concat(this.directDefaultProducts);
  }

  _isDirectDefaultVariant(variantId) {
    const normalizedVariantId = this.extractId(variantId);
    return this.directDefaultProducts.some(product => product.variantId === normalizedVariantId);
  }

  _getDirectDefaultRequiredQuantity(variantId) {
    const normalizedVariantId = this.extractId(variantId);
    const product = this.directDefaultProducts.find(item => item.variantId === normalizedVariantId);
    return product ? (product.defaultRequiredQuantity || 1) : null;
  }

  /**
   * Pre-fetches product data for all steps marked isDefault so that
   * the filled slot card can render with real image and title on first paint.
   * Non-fatal — a failed fetch just leaves the card in a loading placeholder state.
   */
  async _preloadDefaultStepProducts() {
    const promises = this.selectedBundle.steps.map((step, i) => {
      if (step.isDefault && step.defaultVariantId) {
        return this.loadStepProducts(i).catch(() => {});
      }
      return null;
    }).filter(Boolean);
    if (promises.length > 0) await Promise.all(promises);
  }

  /**
   * Returns the product object for a default step from stepProductData,
   * matched by defaultVariantId. Returns null when not yet loaded.
   */
  _getDefaultStepProduct(stepIndex) {
    const step = this.selectedBundle.steps[stepIndex];
    if (!step?.isDefault || !step.defaultVariantId) return null;
    const products = this.stepProductData[stepIndex] || [];
    const variantId = this.normalizeSelectionKey(step.defaultVariantId);
    return this.findProductBySelectionKey(products, variantId) || products[0] || null;
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

  _relocateContainerToProductForm() {
    try {
      if (!this.container || typeof document === 'undefined') return;
      if (this.container.dataset.mountedAfterProductForm === 'true') return;

      const productForm = this._findNativeProductForm();

      if (!productForm) return;

      if (productForm.nextElementSibling !== this.container) {
        productForm.insertAdjacentElement('afterend', this.container);
      }

      this.container.classList.add('bundle-widget-container--product-form-mounted');
      this.container.dataset.mountedAfterProductForm = 'true';
    } catch (_error) {
      // Placement is best-effort; the widget still renders at its original block location.
    }
  }

  _findNativeProductForm() {
    if (typeof document === 'undefined') return null;

    const selectors = [
      'form[action*="/cart/add"]',
      'product-form form',
      '.product-form form',
      '[data-type="add-to-cart-form"]',
      'form[action^="/cart/add"]'
    ];

    return selectors
      .map(selector => document.querySelector(selector))
      .find(form => form && !form.contains(this.container) && !this.container.contains(form)) || null;
  }

  _getNativeProductInfoRoot(productForm) {
    return productForm?.closest?.(
      '[id^="ProductInformation-"], .product-details, .group-block-content, .product-information, .product__info-container, .product__info-wrapper, .product__info, product-info, .product'
    ) || productForm?.parentElement || null;
  }

  _hideNativeProductPrice() {
    try {
      if (!this.container || typeof document === 'undefined') return;

      const productForm = this._findNativeProductForm();
      if (!productForm) return;

      const root = this._getNativeProductInfoRoot(productForm);
      if (!root) return;

      const selectors = [
        '[id^="price-"]',
        '.price.price--large',
        '.product__price',
        '[data-product-price]',
        '.product-price',
        '.price'
      ];

      const priceElements = selectors.flatMap(selector => Array.from(root.querySelectorAll(selector)));
      const uniquePriceElements = Array.from(new Set(priceElements));

      uniquePriceElements
        .filter(element => !this.container.contains(element))
        .filter(element => !element.closest('#bundle-builder-modal'))
        .forEach(element => {
          element.classList.add('wpb-native-product-price--hidden');
          element.setAttribute('data-wpb-native-product-price-hidden', 'true');
          element.style.setProperty('display', 'none', 'important');
        });
    } catch (_error) {
      // Native theme price hiding is best-effort; PPB controls still render if selectors differ.
    }
  }

  setupDOMElements() {
    const modalEl = this.ensureBottomSheet();

    // Get or create main UI elements
    this.elements = {
      defaultProducts: this.container.querySelector('.bw-default-products') || this._createDirectDefaultProductsEl(),
      stepsContainer: this.container.querySelector('.bundle-steps') || this.createStepsContainer(),
      qtyPillsEl: this.container.querySelector('.bw-qty-pills') || this._createQtyPillsEl(),
      footer: this.container.querySelector('.bundle-footer-messaging') || this.createFooter(),
      addToCartButton: this.container.querySelector('.add-bundle-to-cart') || this.createAddToCartButton(),
      dynamicCheckoutVisual: this.container.querySelector('.bw-ppb-dynamic-checkout-visual') || this._createDynamicCheckoutVisual(),
      modal: modalEl,
      bsOverlay: document.getElementById('bw-bs-overlay') || this._createBottomSheetOverlay()
    };

    // Append elements in display order (default products → steps → qty pills → footer → ATC)
    if (!this.container.querySelector('.bw-default-products')) {
      this.container.appendChild(this.elements.defaultProducts);
    }
    if (!this.container.querySelector('.bundle-steps')) {
      this.container.appendChild(this.elements.stepsContainer);
    }
    if (!this.container.querySelector('.bw-qty-pills')) {
      this.container.appendChild(this.elements.qtyPillsEl);
    }
    if (!this.container.querySelector('.bundle-footer-messaging')) {
      this.container.appendChild(this.elements.footer);
    }
    if (!this.container.querySelector('.add-bundle-to-cart')) {
      this.container.appendChild(this.elements.addToCartButton);
    }
    if (!this.container.querySelector('.bw-ppb-dynamic-checkout-visual')) {
      this.container.appendChild(this.elements.dynamicCheckoutVisual);
    }
  }

  _createQtyPillsEl() {
    const el = document.createElement('div');
    el.className = 'bw-qty-pills';
    el.style.display = 'none';
    return el;
  }

  _createDirectDefaultProductsEl() {
    const el = document.createElement('div');
    el.className = 'bw-default-products';
    el.style.display = 'none';
    return el;
  }

  _createBottomSheetOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'bw-bs-overlay';
    overlay.className = 'bw-bs-overlay';
    document.body.appendChild(overlay);
    return overlay;
  }

  /**
   * Creates the bottom-sheet panel using the SAME inner DOM structure as ensureModal()
   * so all existing renderModalProducts / renderModalTabs / tab-arrow code works unchanged.
   */
  ensureBottomSheet() {
    let panel = document.getElementById('bundle-builder-modal');

    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'bundle-builder-modal';
      // bundle-builder-modal class required so Settings design CSS selectors apply to this panel
      panel.className = 'bw-bs-panel bundle-builder-modal';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      panel.setAttribute('aria-hidden', 'true');
      panel.setAttribute('inert', '');
      panel.hidden = true;
      panel.innerHTML = `
        <div class="modal-header bw-bs-header">
          <!-- Desktop close: × absolute top-right -->
          <button class="close-button bw-bs-close-desktop" aria-label="Close">
            <svg viewBox="0 0 20 20" width="20" height="20" focusable="false" aria-hidden="true" fill="currentColor">
              <path d="M13.97 15.03a.75.75 0 1 0 1.06-1.06l-3.97-3.97 3.97-3.97a.75.75 0 0 0-1.06-1.06l-3.97 3.97-3.97-3.97a.75.75 0 0 0-1.06 1.06l3.97 3.97-3.97 3.97a.75.75 0 1 0 1.06 1.06l3.97-3.97 3.97 3.97Z"/>
            </svg>
          </button>
          <!-- Mobile close: chevron-down absolute top-center -->
          <button class="close-button bw-bs-close-mobile" aria-label="Close">
            <svg width="40" height="24" viewBox="0 0 70 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M20.0188 8.6438C21.044 7.6187 22.706 7.6187 23.7312 8.6438L35.875 20.7877L48.0188 8.6438C49.044 7.6187 50.706 7.6187 51.7312 8.6438C52.7563 9.669 52.7563 11.331 51.7312 12.3562L37.7312 26.3562C36.706 27.3813 35.044 27.3813 34.0188 26.3562L20.0188 12.3562C18.9937 11.331 18.9937 9.669 20.0188 8.6438Z" fill="#4A4A4A"/>
            </svg>
          </button>
          <!-- Category tabs — grid layout, equal columns -->
          <div class="modal-tabs-wrapper bw-bs-tabs-wrapper">
            <div class="modal-tabs bw-bs-tabs"></div>
          </div>
          <!-- "Choose X" step title -->
          <div class="modal-step-title bw-bs-choose-title"></div>
          <!-- Discount / progress messaging -->
          <div class="bw-bs-discount-bar footer-discount-text"></div>
        </div>
        <div class="modal-body bw-bs-body">
          <div class="product-grid bw-bs-product-grid"></div>
        </div>
        <div class="modal-footer bw-bs-footer">
          <!-- Cart count pill (white, floats above nav pill) -->
          <div class="bw-bs-cart-pill">
            <span class="bw-bs-cart-price">
              <span class="total-price-strike"></span>
              <span class="total-price-final">$0.00</span>
            </span>
            <span class="bw-bs-cart-divider"></span>
            <span class="cart-badge-count">0</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M3 4.5C3 4.22386 3.22386 4 3.5 4H5.5C5.73 4 5.93 4.16 5.98 4.385L6.52 7H20.5C20.76 7 20.99 7.14 21.1 7.37C21.21 7.6 21.18 7.88 21.02 8.08L17.02 13.08C16.85 13.29 16.6 13.41 16.33 13.41H8.66L8.07 16H19.5C19.78 16 20 16.22 20 16.5C20 16.78 19.78 17 19.5 17H7.5C7.27 17 7.07 16.84 7.02 16.615L5.02 7.615L4.5 5H3.5C3.22 5 3 4.78 3 4.5ZM8 19.5C8 20.33 7.33 21 6.5 21C5.67 21 5 20.33 5 19.5C5 18.67 5.67 18 6.5 18C7.33 18 8 18.67 8 19.5ZM19 19.5C19 20.33 18.33 21 17.5 21C16.67 21 16 20.33 16 19.5C16 18.67 16.67 18 17.5 18C18.33 18 19 18.67 19 19.5Z" fill="#333"/>
            </svg>
          </div>
          <!-- PREV/NEXT nav pill (navy blue) -->
          <div class="bw-bs-nav-pill">
            <button class="modal-nav-button prev-button bw-bs-nav-btn" aria-label="Previous step">
              Prev
            </button>
            <button class="modal-nav-button next-button bw-bs-nav-btn" aria-label="Next step">
              Next
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(panel);
      // No tab scroll arrows needed — tabs use CSS grid layout
    }

    return panel;
  }

  setBottomSheetVisibility(isOpen) {
    const modal = this.elements?.modal;
    if (!modal) return;

    if (isOpen) {
      modal.hidden = false;
      modal.removeAttribute('aria-hidden');
      modal.removeAttribute('inert');
      return;
    }

    const hideModal = () => {
      if (modal.classList.contains('bw-bs-panel--open')) return;
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
      modal.setAttribute('inert', '');
    };

    if (typeof modal.addEventListener === 'function') {
      modal.addEventListener('transitionend', hideModal, { once: true });
    }
    window.setTimeout(hideModal, 350);
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
    return footer;
  }

  createAddToCartButton() {
    const button = document.createElement('button');
    button.className = 'add-bundle-to-cart';
    button.textContent = this._resolveText('addToCartButton', 'Add Bundle to Cart');
    button.type = 'button';
    return button;
  }

  _createDynamicCheckoutVisual() {
    const button = document.createElement('div');
    button.className = 'bw-ppb-dynamic-checkout-visual';
    button.setAttribute('role', 'button');
    button.setAttribute('aria-disabled', 'true');
    button.textContent = 'Buy it now';
    return button;
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

  renderUI() {
    this._renderDirectDefaultProducts();
    this.renderSteps();
    this.renderQuantityOptionPills();
    this.renderFooter();
    this.updateAddToCartButton();
  }

  renderSteps() {
    // Clear existing steps
    this.elements.stepsContainer.innerHTML = '';
    this._markProductPageTemplate();

    if (!this.selectedBundle || !this.selectedBundle.steps) {
      return;
    }

    // Check bundle type and render accordingly
    const bundleType = this.selectedBundle.bundleType || BUNDLE_WIDGET.BUNDLE_TYPES.PRODUCT_PAGE;

    if (bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE) {
      // Full-page bundle: Render with tabs layout
      this.renderFullPageLayout();
    } else {
      // Product-page bundle: Render with step boxes (current implementation)
      this.renderProductPageLayout();
    }
  }

  _renderDirectDefaultProducts() {
    const el = this.elements.defaultProducts;
    if (!el) return;
    el.innerHTML = '';

    const data = this._getDirectDefaultProductsData();
    const products = this.directDefaultProducts || [];
    if (!data || products.length === 0) {
      el.style.display = 'none';
      return;
    }

    el.style.display = 'block';

    if (data.defaultProductsTitle) {
      const title = document.createElement('h3');
      title.className = 'bw-default-products__title';
      title.textContent = data.defaultProductsTitle;
      el.appendChild(title);
    }

    const list = document.createElement('div');
    list.className = 'bw-default-products__list';
    const currencyInfo = CurrencyManager.getCurrencyInfo();

    products.forEach(product => {
      const quantity = this.getSelectedQuantity(0, product.variantId) || product.defaultRequiredQuantity || 1;
      const line = document.createElement('div');
      line.className = 'bw-default-products__line';

      const details = document.createElement('div');
      details.className = 'bw-default-products__details';

      const image = document.createElement('img');
      image.className = 'bw-default-products__image';
      image.src = product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
      image.alt = product.title || '';
      details.appendChild(image);

      const text = document.createElement('div');
      text.className = 'bw-default-products__text';

      const name = document.createElement('span');
      name.className = 'bw-default-products__name';
      name.textContent = `${product.title} x ${quantity}`;
      text.appendChild(name);

      const price = document.createElement('span');
      price.className = 'bw-default-products__price';
      price.textContent = CurrencyManager.convertAndFormat(product.price * quantity, currencyInfo);
      text.appendChild(price);
      details.appendChild(text);
      line.appendChild(details);

      const quantityBadge = document.createElement('span');
      quantityBadge.className = 'bw-default-products__quantity';
      quantityBadge.textContent = `x ${quantity}`;
      line.appendChild(quantityBadge);
      list.appendChild(line);
    });

    el.appendChild(list);
  }

  // Returns a full-width banner image element for a step, or null if not configured
  _createStepBannerImage(step) {
    if (!step?.bannerImageUrl) return null;
    const wrapper = document.createElement('div');
    wrapper.className = 'step-banner-image';
    const img = document.createElement('img');
    img.src = step.bannerImageUrl;
    img.alt = step.name || '';
    img.style.cssText = 'width:100%;display:block;';
    wrapper.appendChild(img);
    return wrapper;
  }

  // Product-page bundle layout: always renders all steps at once.
  // Each step gets the appropriate card variant based on its type and selection state.
  renderProductPageLayout() {
    this.selectedBundle.steps.forEach((step, stepIndex) => {
      if (this._isProductPageInpageTemplate()) {
        const section = this._createInpageStepSection(step, stepIndex);
        const target = section.querySelector('.bw-ppb-inpage-step-grid');
        this.elements.stepsContainer.appendChild(section);

        const banner = this._createStepBannerImage(step);
        if (banner) target.appendChild(banner);

        this._renderInpageStepProducts(stepIndex, target);
        return;
      }

      const section = this._isProductPageModalSlotTemplate()
        ? this._createModalSlotStepSection(step)
        : this._isProductPageCogniveTemplate()
          ? this._createInpageStepSection(step, stepIndex)
        : null;
      const target =
        section?.querySelector('.bw-ppb-modal-slot-grid')
        || section?.querySelector('.bw-ppb-inpage-step-grid')
        || this.elements.stepsContainer;

      if (section) {
        this.elements.stepsContainer.appendChild(section);
      }

      // Inject per-step banner image above this step's card(s)
      const banner = this._createStepBannerImage(step);
      if (banner) target.appendChild(banner);

      if (step.isDefault) {
        // Default/compulsory slot — always pre-filled, not removable
        const product = this._getDefaultStepProduct(stepIndex);
        if (product) {
          const card = this.createDefaultProductCard(step, stepIndex, product);
          target.appendChild(card);
        } else {
          // Product data not yet loaded — show placeholder
          const card = this._createDefaultLoadingCard(step, stepIndex);
          target.appendChild(card);
        }
      } else if (step.isFreeGift) {
        // Free gift slot — ribbon icon, locked until paid steps complete
        const card = this.createFreeGiftSlotCard(step, stepIndex);
        target.appendChild(card);
      } else {
        // Regular selectable step
        const stepSelections = this.selectedProducts[stepIndex] || {};
        const selectedEntries = Object.entries(stepSelections).filter(([, qty]) => qty > 0);

        if (selectedEntries.length > 0) {
          const products = this.expandProductsByVariant(this.stepProductData[stepIndex] || []);
          selectedEntries.forEach(([variantId, qty]) => {
            const product = this.findProductBySelectionKey(products, variantId);
            if (product) {
              for (let i = 0; i < qty; i++) {
                const card = this.createSelectedProductCard(
                  { product, stepIndex, step, variantId, instanceIndex: i },
                  i
                );
                target.appendChild(card);
              }
            }
          });
          // Show "add more" card if step condition not yet met
          if (!this.validateStep(stepIndex)) {
            const totalQty = selectedEntries.reduce((sum, [, qty]) => sum + qty, 0);
            target.appendChild(this.createAddMoreCard(step, stepIndex, totalQty));
          }
        } else {
          // No selection yet — use EB Product Slots when enabled, otherwise show a simple add CTA.
          let card;
          if (this._shouldRenderProductSlots()) {
            card = this.createEmptyStateCard(step, stepIndex, 0);
          } else {
            card = this.createAddMoreCard(step, stepIndex, 0);
          }
          target.appendChild(card);
        }
      }
    });
  }

  _shouldRenderProductSlots() {
    return this.selectedBundle?.productSlotsEnabled === true;
  }

  _createInpageStepSection(step, stepIndex) {
    const section = document.createElement('div');
    const preset = this._getProductPageDesignPreset();
    const isCascade = this._isProductPageCascadeTemplate?.() === true;
    section.className = `bw-ppb-inpage-step-section bw-ppb-inpage-step-section--${preset.toLowerCase()}${isCascade ? ' gbbMixCascadeBodyWrapper' : ''}`;

    const title = document.createElement('div');
    title.className = `bw-ppb-inpage-step-title${isCascade ? ' gbbMixCascadeBodyHeaderCategoryName' : ''}`;
    title.textContent = step.pageTitle || step.name || '';
    section.appendChild(title);

    const tabs = this._createInpageCategoryTabs(step, stepIndex);
    if (tabs) section.appendChild(tabs);

    const grid = document.createElement('div');
    grid.className = 'bw-ppb-inpage-step-grid';
    section.appendChild(grid);

    return section;
  }

  _createInpageCategoryTabs(step, stepIndex) {
    const categories = Array.isArray(step?.categories) ? step.categories : [];
    if (categories.length === 0) return null;

    if (typeof this.activeInpageCategoryIndexes[stepIndex] !== 'number') {
      this.activeInpageCategoryIndexes[stepIndex] = 0;
    }

    const tabs = document.createElement('div');
    const isCascade = this._isProductPageCascadeTemplate?.() === true;
    tabs.className = `bw-ppb-inpage-category-tabs${isCascade ? ' gbbMixCascadeCategoryTabsWrapper' : ''}`;

    categories.forEach((category, categoryIndex) => {
      const button = document.createElement('button');
      button.type = 'button';
      const isActive = categoryIndex === this.activeInpageCategoryIndexes[stepIndex];
      button.className = `bw-ppb-inpage-category-tab${isActive ? ' active' : ''}${isCascade ? ` gbbMixCascadeCategoryTab${isActive ? ' gbbMixCascadeCategoryTab--active' : ''}` : ''}`;
      button.dataset.categoryIndex = String(categoryIndex);
      button.textContent = this._getInpageCategoryLabel(category, categoryIndex);
      button.addEventListener('click', () => {
        this.activeInpageCategoryIndexes[stepIndex] = categoryIndex;
        tabs.querySelectorAll('.bw-ppb-inpage-category-tab').forEach(tab => {
          const active = tab === button;
          tab.classList.toggle('active', active);
          tab.classList.toggle('gbbMixCascadeCategoryTab--active', active);
        });
        const grid = tabs.parentElement?.querySelector('.bw-ppb-inpage-step-grid');
        if (grid) this._renderInpageStepProducts(stepIndex, grid);
      });
      tabs.appendChild(button);
    });

    return tabs;
  }

  _getInpageCategoryLabel(category, categoryIndex) {
    return category?.title || category?.name || `Category ${categoryIndex + 1}`;
  }

  _getCategoryProductIds(category) {
    const ids = new Set();
    const addProductId = (product) => {
      const id = product?.id || product?.graphqlId || product?.productId;
      if (id) ids.add(this.extractId(id));
    };

    (category?.products || []).forEach(addProductId);
    (category?.selectedProducts || []).forEach(addProductId);
    return ids;
  }

  _categoryHasCollections(category) {
    return Boolean(
      category?.collections?.length
      || category?.collectionsData?.length
      || category?.collectionsSelectedData?.length
    );
  }

  _filterProductsForInpageCategory(step, products, stepIndex) {
    const categories = Array.isArray(step?.categories) ? step.categories : [];
    if (categories.length <= 1) return products;

    const activeIndex = this.activeInpageCategoryIndexes[stepIndex] || 0;
    const category = categories[activeIndex];
    const categoryProductIds = this._getCategoryProductIds(category);

    if (categoryProductIds.size === 0) {
      return this._categoryHasCollections(category) ? products : [];
    }

    return products.filter(product => {
      const productId = this.extractId(product.parentProductId || product.id);
      return categoryProductIds.has(productId);
    });
  }

  _renderInpageStepProducts(stepIndex, target) {
    const rawProducts = this.stepProductData[stepIndex] || [];

    if (rawProducts.length === 0 && !(this._stepFetchFailed && this._stepFetchFailed[stepIndex])) {
      target.innerHTML = '<div class="bw-ppb-inpage-loading">Loading products...</div>';
      this.loadStepProducts(stepIndex).then(() => {
        if (target.isConnected) this._renderInpageStepProducts(stepIndex, target);
      }).catch(() => {
        if (!this._stepFetchFailed) this._stepFetchFailed = {};
        this._stepFetchFailed[stepIndex] = true;
        if (target.isConnected) this._renderInpageStepProducts(stepIndex, target);
      });
      return;
    }

    const currentStep = this.selectedBundle?.steps?.[stepIndex];
    const products = this._filterProductsForInpageCategory(
      currentStep,
      this.expandProductsByVariant(rawProducts),
      stepIndex
    );
    if (products.length === 0) {
      target.innerHTML = this._stepFetchFailed?.[stepIndex]
        ? '<p class="modal-fetch-error">Could not load products. Please check your connection and try again.</p>'
        : '<p class="no-products-message">No products are configured for this step.</p>';
      return;
    }

    const usesCascadeCards = this._isProductPageCascadeTemplate();
    const usesGridCards = this._isProductPageGridTemplate();
    target.classList.toggle('bw-ppb-cascade-product-list', usesCascadeCards);
    target.classList.toggle('bw-ppb-cognive-product-grid', this._isProductPageGridTemplate());

    const selectedProducts = this.selectedProducts[stepIndex] || {};
    const showQuantitySelector = !this._usesCompactInpageProductCards()
      && this.config.showQuantitySelectorOnCard;
    const productQuantityLimit = ConditionValidator.getAllowedQuantityPerProduct(
      this.selectedBundle?.validateQuantityPerProduct
    );
    const currencyInfo = CurrencyManager.getCurrencyInfo();

    target.innerHTML = products.map(product => {
      const selectionKey = product.variantId || product.id;
      const currentQuantity = this.getSelectedQuantity(stepIndex, selectionKey);
      const { available, outOfStock } = this.getVariantAvailable(stepIndex, selectionKey);
      const atMaxStock = available !== null && currentQuantity >= available;
      const atMaxProductQuantity = productQuantityLimit !== null && currentQuantity >= productQuantityLimit;
      const increaseDisabled = outOfStock || atMaxStock || atMaxProductQuantity;
      const addDisabled = outOfStock;
      const stockBadge = outOfStock
        ? '<div class="product-stock-badge product-stock-badge--out">Out of stock</div>'
        : '';

      const productContent = `
        <div class="product-title${usesCascadeCards ? ' gbbMixCascadeProductTitle' : ''}">${ComponentGenerator.escapeHtml(product.title)}</div>
        ${product.price ? `
          <div class="product-price-row${usesCascadeCards ? ' gbbMixCascadeProductsPriceWrapper' : ''}">
            ${this._shouldShowProductComparedAtPrice() && product.compareAtPrice ? `<span class="product-price-strike${usesCascadeCards ? ' gbbMixCascadeProductCompareAtPrice' : ''}">${CurrencyManager.convertAndFormat(product.compareAtPrice, currencyInfo)}</span>` : ''}
            <span class="product-price${usesCascadeCards ? ' gbbMixCascadeProductsPrice' : ''}">${CurrencyManager.convertAndFormat(product.price, currencyInfo)}</span>
          </div>
        ` : ''}
        ${this.renderVariantSelector(product)}
        ${showQuantitySelector ? `
          <div class="product-quantity-wrapper">
            <div class="product-quantity-selector">
              <button class="qty-btn qty-decrease" data-product-id="${selectionKey}">−</button>
              <span class="qty-display">${currentQuantity}</span>
              <button class="qty-btn qty-increase" data-product-id="${selectionKey}" ${increaseDisabled ? 'disabled aria-disabled="true"' : ''}>+</button>
            </div>
          </div>
        ` : ''}
      `;
      const addButton = `
        <button class="product-add-btn${usesCascadeCards ? ' gbbMixCascadeAddBtn' : ''} ${currentQuantity > 0 ? 'added' : ''}" data-product-id="${selectionKey}" ${addDisabled ? 'disabled aria-disabled="true"' : ''}>
          ${outOfStock ? 'Out of stock' : (currentQuantity > 0 ? (currentStep?.addonReplaceText || 'Selected ✓') : (currentStep?.addonAddText || 'Add +'))}
        </button>
      `;

      if (usesCascadeCards) {
        return `
          <div class="product-card bw-ppb-cascade-product-row gbbMixCascadeProductWrapper ${currentQuantity > 0 ? 'selected' : ''} ${outOfStock ? 'is-out-of-stock' : ''}" data-product-id="${selectionKey}" data-current-selected-variant-id="${selectionKey}">
            ${currentQuantity > 0 ? '<div class="selected-overlay">✓</div>' : ''}
            <div class="gbbMixCascadeProductLeftSection">
              <div class="product-image gbbMixCascadeProductImageWrapper">
                <img class="gbbMixCascadeProductImage" src="${product.imageUrl}" alt="${ComponentGenerator.escapeHtml(product.title)}" loading="lazy">
                ${stockBadge}
              </div>
              <div class="product-content-wrapper gbbMixCascadeProductsDetailsWrapper">
                ${productContent}
              </div>
            </div>
            <div class="gbbMixCascadeProductRightSection">
              <div class="gbbMixCascadeProductBtnWrapper">${addButton}</div>
            </div>
          </div>
        `;
      }

      return `
        <div class="product-card ${usesGridCards ? 'bw-ppb-cognive-product-card' : ''} ${currentQuantity > 0 ? 'selected' : ''} ${outOfStock ? 'is-out-of-stock' : ''}" data-product-id="${selectionKey}">
          ${currentQuantity > 0 ? '<div class="selected-overlay">✓</div>' : ''}
          <div class="product-image">
            <img src="${product.imageUrl}" alt="${ComponentGenerator.escapeHtml(product.title)}" loading="lazy">
            ${stockBadge}
          </div>
          <div class="product-content-wrapper">
            ${productContent}
            ${addButton}
          </div>
        </div>
      `;
    }).join('');

    this.attachProductEventHandlers(target, stepIndex);
  }

  // Create an "add more" card for incomplete steps
  createAddMoreCard(step, stepIndex, currentCount) {
    const stepBox = document.createElement('div');
    stepBox.className = 'step-box add-more-card';
    stepBox.dataset.stepIndex = stepIndex;

    // Plus icon
    const plusIcon = document.createElement('span');
    plusIcon.className = 'plus-icon';
    plusIcon.textContent = '+';
    stepBox.appendChild(plusIcon);

    // Add step name
    const stepName = document.createElement('p');
    stepName.className = 'step-name';
    stepName.textContent = step.name || `Step ${stepIndex + 1}`;
    stepBox.appendChild(stepName);

    // Add remaining count text
    const selectionCount = document.createElement('div');
    selectionCount.className = 'step-selection-count';
    const operator = step.conditionOperator;
    const rawRequired = step.conditionValue || 1;
    const requiredCount = operator === BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN
      ? rawRequired + 1
      : rawRequired;
    const remaining = requiredCount - currentCount;
    if (remaining > 0) {
      selectionCount.textContent = `Add ${remaining} more`;
    }
    stepBox.appendChild(selectionCount);

    // Add click handler to open modal
    stepBox.addEventListener('click', () => this.openModal(stepIndex));

    return stepBox;
  }

  // Create a state card for a selected product
  createSelectedProductCard(item, cardIndex) {
    const { product, stepIndex, step, variantId, instanceIndex } = item;

    const isDefault = bsIsDefaultStep(step);
    const badgeLabel = bsGetDiscountBadgeLabel(step);

    const stepBox = document.createElement('div');
    stepBox.className = 'step-box step-completed product-card-state bw-slot-card bw-slot-card--filled';
    stepBox.dataset.stepIndex = stepIndex;
    stepBox.dataset.variantId = variantId;
    stepBox.dataset.cardIndex = cardIndex;

    // Remove button — hidden for default (non-removable) steps
    if (!isDefault) {
      const clearBadge = document.createElement('div');
      clearBadge.className = 'step-clear-badge';
      clearBadge.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#f3f4f6"/>
          <path d="M8 8L16 16M16 8L8 16" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      clearBadge.title = 'Remove this product';
      clearBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeProductFromSelection(stepIndex, variantId);
      });
      stepBox.appendChild(clearBadge);
    }

    // Product image container
    const imagesContainer = document.createElement('div');
    imagesContainer.className = 'bw-slot-card__image-wrapper';
    const img = document.createElement('img');
    img.src = product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
    img.alt = product.title || '';
    img.className = 'bw-slot-card__image';
    imagesContainer.appendChild(img);
    stepBox.appendChild(imagesContainer);

    // Discount badge (bottom-sheet mode only, when step has a discountBadgeLabel)
    if (badgeLabel) {
      const badge = document.createElement('span');
      badge.className = 'bw-slot-discount-badge';
      badge.textContent = badgeLabel;
      stepBox.appendChild(badge);
    }

    // Product title at bottom
    const productTitle = document.createElement('p');
    productTitle.className = 'step-name step-name-completed product-title-state';
    // Truncate long titles
    const displayTitle = product.title.length > 25
      ? product.title.substring(0, 25) + '...'
      : product.title;
    productTitle.textContent = displayTitle;
    productTitle.title = product.title; // Full title on hover
    stepBox.appendChild(productTitle);

    // Add click handler - check if step limit is reached before opening modal
    stepBox.addEventListener('click', () => {
      // If step has a limit of 1 and is already fulfilled, show toast instead of opening modal
      const stepData = this.selectedBundle.steps[stepIndex];
      if (stepData && stepData.conditionValue && stepData.conditionOperator) {
        const isLimitOne = stepData.conditionValue === 1 &&
          (stepData.conditionOperator === BUNDLE_WIDGET.CONDITION_OPERATORS.EQUAL_TO ||
           stepData.conditionOperator === BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN_OR_EQUAL_TO);
        if (isLimitOne && this.validateStep(stepIndex)) {
          ToastManager.show('Product limit reached for this step.');
          return;
        }
      }
      this.openModal(stepIndex);
    });

    return stepBox;
  }

  /**
   * Creates a slot card for a default/compulsory product step.
   * Looks like a filled card but has no remove button and shows an "Included" badge.
   */
  createDefaultProductCard(step, stepIndex, product) {
    const stepBox = document.createElement('div');
    stepBox.className = 'step-box bw-slot-card bw-slot-card--filled';
    stepBox.dataset.stepIndex = stepIndex;
    stepBox.dataset.variantId = step.defaultVariantId || '';
    // Default cards are not clickable
    stepBox.style.cursor = 'default';

    // Product image
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'bw-slot-card__image-wrapper';
    const img = document.createElement('img');
    img.src = product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
    img.alt = product.title || '';
    img.className = 'bw-slot-card__image';
    imageWrapper.appendChild(img);
    stepBox.appendChild(imageWrapper);

    // Product title
    const productTitle = document.createElement('p');
    productTitle.className = 'step-name bw-slot-card__label';
    const displayTitle = product.title.length > 25
      ? product.title.substring(0, 25) + '...'
      : product.title;
    productTitle.textContent = displayTitle;
    productTitle.title = product.title;
    stepBox.appendChild(productTitle);

    // "Included" badge — bottom-left
    const badge = document.createElement('span');
    badge.className = 'bw-slot-card__included-badge';
    badge.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> Included`;
    stepBox.appendChild(badge);

    return stepBox;
  }

  /**
   * Placeholder card for a default step while its product data is still loading.
   */
  _createDefaultLoadingCard(step, stepIndex) {
    const stepBox = document.createElement('div');
    stepBox.className = 'step-box bw-slot-card bw-slot-card--filled';
    stepBox.dataset.stepIndex = stepIndex;
    stepBox.style.cursor = 'default';
    stepBox.style.opacity = '0.7';

    const label = document.createElement('p');
    label.className = 'step-name bw-slot-card__label';
    label.textContent = step.name || `Step ${stepIndex + 1}`;
    stepBox.appendChild(label);

    const badge = document.createElement('span');
    badge.className = 'bw-slot-card__included-badge';
    badge.textContent = 'Included';
    stepBox.appendChild(badge);

    return stepBox;
  }

  /**
   * Creates the free gift slot card.
   * Shows a ribbon icon, "Free {name}" label.
   * Non-clickable (locked) until all paid steps are complete.
   */
  createFreeGiftSlotCard(step, stepIndex) {
    const unlocked = this.isFreeGiftUnlocked;
    const stepBox = document.createElement('div');
    stepBox.dataset.stepIndex = stepIndex;

    // Check if free gift step already has a selection
    const stepSelections = this.selectedProducts[stepIndex] || {};
    const selectedEntries = Object.entries(stepSelections).filter(([, qty]) => qty > 0);

    if (selectedEntries.length > 0 && unlocked) {
      // Show selected product for free gift slot
      const products = this.stepProductData[stepIndex] || [];
      const [variantId] = selectedEntries[0];
      const product = this.findProductBySelectionKey(products, variantId);
      if (product) {
        // Show filled state for free gift
        stepBox.className = 'step-box step-completed product-card-state bw-slot-card bw-slot-card--filled';

        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'bw-slot-card__image-wrapper';
        const img = document.createElement('img');
        img.src = product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
        img.alt = product.title || '';
        img.className = 'bw-slot-card__image';
        imageWrapper.appendChild(img);
        stepBox.appendChild(imageWrapper);

        // Remove button
        const clearBadge = document.createElement('div');
        clearBadge.className = 'step-clear-badge';
        clearBadge.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#f3f4f6"/><path d="M8 8L16 16M16 8L8 16" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        clearBadge.addEventListener('click', (e) => {
          e.stopPropagation();
          this.removeProductFromSelection(stepIndex, variantId);
        });
        stepBox.appendChild(clearBadge);

        const productTitle = document.createElement('p');
        productTitle.className = 'step-name step-name-completed product-title-state';
        const displayTitle = product.title.length > 25 ? product.title.substring(0, 25) + '...' : product.title;
        productTitle.textContent = displayTitle;
        stepBox.appendChild(productTitle);

        // Ribbon overlay even in filled state
        stepBox.appendChild(this._createRibbonSvg());
        stepBox.addEventListener('click', () => this.openModal(stepIndex));
        return stepBox;
      }
    }

    // Empty / locked state
    stepBox.className = `step-box bw-slot-card bw-slot-card--empty${!unlocked ? ' bw-slot-card--locked' : ''}`;

    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'bw-slot-card__plus-icon';
    const primaryColorBS = getComputedStyle(document.documentElement)
      .getPropertyValue('--bundle-global-primary-button').trim() || '#1e3a8a';
    iconWrapper.style.cssText = `
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: color-mix(in srgb, ${primaryColorBS} 8%, transparent);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 10px;
    `;
    this._appendSlotIcon(iconWrapper);
    iconWrapper.style.color = primaryColorBS;
    stepBox.appendChild(iconWrapper);

    const label = document.createElement('p');
    label.className = 'step-name bw-slot-card__label';
    label.textContent = step.addonLabel || `Free ${step.name || `Step ${stepIndex + 1}`}`;
    stepBox.appendChild(label);

    // Red ribbon SVG overlay — top-right (free gift differentiator in all modes)
    stepBox.appendChild(this._createRibbonSvg());

    if (unlocked) {
      stepBox.addEventListener('click', () => this.openModal(stepIndex));
    }

    return stepBox;
  }

  /** Returns the red ribbon SVG element for free gift cards */
  _createRibbonSvg() {
    const ribbon = document.createElement('span');
    ribbon.className = 'bw-slot-card__ribbon';
    // Check for a merchant-configured badge image via Settings design CSS variable
    const badgeUrl = getComputedStyle(document.documentElement)
      .getPropertyValue('--bundle-free-gift-badge-url').trim();
    const hasMerchantBadge = badgeUrl && badgeUrl !== 'none' && badgeUrl !== '';
    if (hasMerchantBadge) {
      // Strip the url("...") wrapper to get the raw URL
      const rawUrl = badgeUrl.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
      const img = document.createElement('img');
      img.src = rawUrl;
      img.alt = 'Gift badge';
      img.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block;';
      ribbon.appendChild(img);
    } else {
      ribbon.innerHTML = `<svg viewBox="0 0 24 24" fill="#e53e3e" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M20 7h-1.586l1.293-1.293a1 1 0 0 0-1.414-1.414L16 6.586V5a1 1 0 0 0-2 0v1.586l-1.293-1.293a1 1 0 0 0-1.414 1.414L12.586 8H11a1 1 0 1 0 0 2h1v2h-2a1 1 0 1 0 0 2h2v7l3-1.5 3 1.5V14h2a1 1 0 1 0 0-2h-2v-2h2a1 1 0 1 0 0-2zm-4 2v2h-2V9h2z"/>
      </svg>`;
    }
    return ribbon;
  }

  // Remove a specific product from selection (decrease quantity by 1)
  removeProductFromSelection(stepIndex, variantId) {
    // Guard: default products are compulsory — they must always stay in selectedProducts
    const step = this.selectedBundle?.steps[stepIndex];
    const normalizedVariantId = this.normalizeSelectionKey(variantId);
    if (!normalizedVariantId) return;

    if (step?.isDefault && this.normalizeSelectionKey(step.defaultVariantId) === normalizedVariantId) return;
    if (this._isDirectDefaultVariant(normalizedVariantId)) return;

    const currentQuantity = this.getSelectedQuantity(stepIndex, normalizedVariantId);

    if (currentQuantity > 1) {
      // Decrease quantity
      this.setSelectedQuantity(stepIndex, normalizedVariantId, currentQuantity - 1);
    } else {
      // Remove completely
      this.setSelectedQuantity(stepIndex, normalizedVariantId, 0);
    }

    // Update UI
    this.renderSteps();
    this._renderDirectDefaultProducts();
    this.updateAddToCartButton();
    this.updateFooterMessaging();

    // Show toast notification
    ToastManager.show('Product removed from bundle');
  }

  // Full-page bundle layout (horizontal tabs)
  renderFullPageLayout() {
    // Current fallback mirrors product-page layout until a dedicated full-page tab UI ships.
    this.renderProductPageLayout();
  }

  clearStepSelections(stepIndex) {
    // Clear all product selections for this step
    this.selectedProducts[stepIndex] = {};
    if (stepIndex === 0 && this.directDefaultProducts.length > 0) {
      this.directDefaultProducts.forEach(product => {
        this.setSelectedQuantity(0, product.variantId, product.defaultRequiredQuantity || 1);
      });
    }

    // Update UI
    this._renderDirectDefaultProducts();
    this.renderSteps();
    this.updateAddToCartButton();
    this.updateFooterMessaging();

    // Show toast notification
    ToastManager.show(`All selections cleared from this step`);
  }

  renderFooter() {
    const el = this.elements.footer;
    if (!el) return;
    el.innerHTML = '';

    if (this._isProductPageCascadeTemplate()) {
      this._renderCascadeFooter(el);
      return;
    }

    if (this._isProductPageGridTemplate()) {
      this._renderCogniveFooter(el);
      return;
    }

    const displayOptions = this.selectedBundle?.messaging?.displayOptions;
    const pbConfig = displayOptions?.progressBar;
    if (!pbConfig?.enabled) {
      el.style.display = 'none';
      return;
    }

    const rules = this.selectedBundle?.pricing?.rules || [];
    if (rules.length === 0 || !this.selectedBundle?.pricing?.enabled) {
      el.style.display = 'none';
      return;
    }

    // Calculate current progress toward the first active rule's condition
    const { totalQuantity, totalPrice, unitPrices } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData,
      this.selectedBundle?.steps
    );

    const rule = rules[0];
    const discountMethod = PricingCalculator.getDiscountMethod(this.selectedBundle);
    const conditionValue = PricingCalculator.getRuleConditionValue(rule, discountMethod);
    const conditionType = PricingCalculator.getRuleConditionType(rule);
    const current = conditionType === 'quantity' ? totalQuantity : totalPrice / 100;
    const progress = conditionValue > 0 ? Math.min(1, current / conditionValue) : 1;
    const met = progress >= 1;

    const discountInfo = PricingCalculator.calculateDiscount(this.selectedBundle, totalPrice, totalQuantity, unitPrices);
    const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);
    const discountText = combinedDiscountInfo.hasDiscount
      ? (this.selectedBundle.pricing.method === 'percentage_off'
          ? `${rule.discountValue ?? 0}% off`
          : CurrencyManager.convertAndFormat(combinedDiscountInfo.savings, CurrencyManager.getCurrencyInfo()))
      : '';

    const template = met
      ? (pbConfig.successText || this.selectedBundle.messaging?.successTemplate || 'You got {discountText}!')
      : (pbConfig.progressText || this.selectedBundle.messaging?.progressTemplate || 'Add {conditionText} more to get {discountText}');

    const diff = Math.max(0, conditionValue - current);
    const conditionText = conditionType === 'quantity'
      ? `${Math.ceil(diff)} item${Math.ceil(diff) !== 1 ? 's' : ''}`
      : CurrencyManager.convertAndFormat(diff * 100, CurrencyManager.getCurrencyInfo());

    const message = template
      .replace(/{discountText}/g, discountText)
      .replace(/{conditionText}/g, conditionText)
      .replace(/{amountNeeded}/g, conditionText)
      .replace(/{itemsNeeded}/g, `${Math.ceil(diff)}`)
      .replace(/{progressPercentage}/g, `${Math.round(progress * 100)}`);

    const primary = getComputedStyle(document.documentElement).getPropertyValue('--bundle-global-primary-button').trim() || '#1e3a8a';
    el.style.display = '';
    el.className = 'bundle-footer-messaging bw-ppb-discount-progress' + (met ? ' bw-ppb-discount-progress--met' : '');
    el.style.setProperty('--bw-discount-progress-color', primary);
    el.style.setProperty('--bw-discount-progress-width', `${Math.round(progress * 100)}%`);

    const msgEl = document.createElement('p');
    msgEl.className = 'bw-ppb-discount-progress__message';
    msgEl.textContent = message;
    el.appendChild(msgEl);

    const track = document.createElement('div');
    track.className = 'bw-ppb-discount-progress__track';
    const fill = document.createElement('div');
    fill.className = 'bw-ppb-discount-progress__fill';
    track.appendChild(fill);
    el.appendChild(track);
  }

  updateFooterMessaging() {
    this.renderFooter();
  }

  renderQuantityOptionPills() {
    const el = this.elements.qtyPillsEl;
    if (!el) return;
    el.innerHTML = '';

    const displayOptions = this.selectedBundle?.messaging?.displayOptions;
    const qtyOpts = displayOptions?.bundleQuantityOptions;
    const rules = this.selectedBundle?.pricing?.rules || [];

    if (!qtyOpts?.enabled || rules.length === 0) {
      el.style.display = 'none';
      return;
    }

    el.style.display = 'flex';

    const primary = getComputedStyle(document.documentElement).getPropertyValue('--bundle-global-primary-button').trim() || '#1e3a8a';
    el.style.setProperty('--bw-qty-pill-active-color', primary);
    const defaultIndex = qtyOpts.defaultRuleIndex ?? 0;

    rules.forEach((rule, index) => {
      const { label, subtext } = this.getProductPageTierPillContent(rule, index, qtyOpts);
      const isActive = index === defaultIndex;

      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'bw-qty-pill' + (isActive ? ' bw-qty-pill--active' : '');

      const labelEl = document.createElement('span');
      labelEl.className = 'bw-qty-pill__label';
      labelEl.textContent = label;
      pill.appendChild(labelEl);

      if (subtext) {
        const subtextEl = document.createElement('span');
        subtextEl.className = 'bw-qty-pill__subtext';
        subtextEl.textContent = subtext;
        pill.appendChild(subtextEl);
      }

      pill.addEventListener('click', () => {
        el.querySelectorAll('.bw-qty-pill').forEach(p => {
          p.classList.remove('bw-qty-pill--active');
        });
        pill.classList.add('bw-qty-pill--active');
        // Re-render footer/ATC to reflect selected tier's discount context
        this.renderFooter();
        this.updateAddToCartButton();
      });

      el.appendChild(pill);
    });
  }

  getProductPageTierPillContent(rule, index, qtyOpts) {
    const pricing = this.selectedBundle?.pricing || {};
    const bundleQuantityOptions = this.selectedBundle?.messaging?.displayOptions?.bundleQuantityOptions || qtyOpts || {};
    const optionsByRuleId = bundleQuantityOptions.optionsByRuleId || {};
    const tierTextByRuleId = pricing.messages?.tierTextByRuleId || {};
    const ruleId = String(rule?.id || '');
    const ruleOption = ruleId ? (optionsByRuleId[ruleId] || tierTextByRuleId[ruleId]) : null;

    const configuredLabel =
      (typeof ruleOption?.label === 'string' && ruleOption.label.trim()) ||
      (typeof ruleOption?.tierText === 'string' && ruleOption.tierText.trim()) ||
      '';
    const configuredSubtext =
      (typeof ruleOption?.subtext === 'string' && ruleOption.subtext.trim()) ||
      (typeof ruleOption?.tierSubtext === 'string' && ruleOption.tierSubtext.trim()) ||
      '';

    if (configuredLabel || configuredSubtext) {
      return {
        label: configuredLabel || configuredSubtext,
        subtext: configuredSubtext && configuredSubtext !== configuredLabel ? configuredSubtext : '',
      };
    }

    const indexedLabel = qtyOpts?.labels?.[index] || '';
    const indexedSubtext = qtyOpts?.subtexts?.[index] || '';
    if (indexedLabel || indexedSubtext) {
      return {
        label: indexedLabel || indexedSubtext,
        subtext: indexedSubtext && indexedSubtext !== indexedLabel ? indexedSubtext : '',
      };
    }

    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const threshold = Number(rule?.conditionValue || 0) || 0;
    const discountValue = Number(rule?.discountValue || 0) || 0;
    const thresholdText = rule?.conditionType === 'amount'
      ? CurrencyManager.convertAndFormat(threshold, currencyInfo)
      : String(threshold || index + 1);
    const discountText = pricing.method === BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF
      ? (discountValue ? `${discountValue}%` : '')
      : (discountValue ? CurrencyManager.convertAndFormat(discountValue, currencyInfo) : '');

    return {
      label: discountText ? `${thresholdText} / ${discountText}` : thresholdText,
      subtext: '',
    };
  }

  updateAddToCartButton() {
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

    const button = this.elements.addToCartButton;

    // Check if all required steps are complete (free gift and default steps are not required)
    const allStepsValid = this.selectedBundle.steps.every((step, index) => {
      if (step.isFreeGift || step.isDefault) return true;
      return this.validateStep(index);
    });

    // Count only paid (non-free-gift, non-default) step selections for the total check
    const paidTotalQuantity = this.selectedProducts.reduce((sum, stepSelections, i) => {
      const step = this.selectedBundle.steps[i];
      if (step.isFreeGift || step.isDefault) return sum;
      return sum + Object.values(stepSelections || {}).reduce((s, qty) => s + qty, 0);
    }, 0);

    // Disable button if no paid products selected or not all required steps are complete.
    if (paidTotalQuantity === 0 || !allStepsValid) {
      if (paidTotalQuantity === 0) {
        button.textContent = this._resolveText('addToCartButton', 'Add Bundle to Cart');
      } else {
        // Some products selected but not all required steps complete
        button.textContent = this._resolveText('completeSteps', 'Complete All Steps to Continue');
      }
      button.disabled = true;
      button.classList.add('disabled');
    } else {
      // All steps valid and products selected - enable button
      const currencyInfo = CurrencyManager.getCurrencyInfo();
      const formattedPrice = CurrencyManager.convertAndFormat(combinedDiscountInfo.finalPrice, currencyInfo);

      button.textContent = `${this._resolveText('addToCartButton', 'Add Bundle to Cart')} \u2022 ${formattedPrice}`;

      button.disabled = false;
      button.classList.remove('disabled');
    }

    this.syncProductPagePrimaryCtaStyle();

    // Update the modal footer total pill
    const totalPillFinal = this.elements.modal?.querySelector('.total-price-final');
    const totalPillStrike = this.elements.modal?.querySelector('.total-price-strike');
    if (totalPillFinal) {
      if (totalQuantity > 0) {
        const currencyInfo = CurrencyManager.getCurrencyInfo();
        totalPillFinal.textContent = CurrencyManager.convertAndFormat(combinedDiscountInfo.finalPrice, currencyInfo);
        if (combinedDiscountInfo.qualifiesForDiscount && totalPillStrike) {
          totalPillStrike.textContent = CurrencyManager.convertAndFormat(totalPrice, currencyInfo);
        } else if (totalPillStrike) {
          totalPillStrike.textContent = '';
        }
      } else {
        totalPillFinal.textContent = '';
        if (totalPillStrike) totalPillStrike.textContent = '';
      }
    }
  }

  // ========================================================================
  // MODAL FUNCTIONALITY
  // ========================================================================

  // Helper method to get formatted header text (always step name)
  getFormattedHeaderText() {
    const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
    return currentStep?.name || `Step ${this.currentStepIndex + 1}`;
  }

  openModal(stepIndex) {
    this.currentStepIndex = stepIndex;

    // Update modal header with step name
    const modal = this.elements.modal;
    const headerText = this.getFormattedHeaderText();

    modal.querySelector('.modal-step-title').innerHTML = headerText;

    // OPTIMISTIC RENDERING: Show modal immediately with loading state
    this.renderModalTabs();
    this.renderModalProductsLoading(stepIndex);
    this.updateModalNavigation();
    this.updateModalFooterMessaging();

    // Show bottom-sheet
    this.setBottomSheetVisibility(true);
    if (this.elements.bsOverlay) this.elements.bsOverlay.classList.add('bw-bs-overlay--open');
    requestAnimationFrame(() => {
      modal.classList.add('bw-bs-panel--open');
    });
    document.body.style.overflow = 'hidden';

    // Capture stepIndex so async callback doesn't render stale step if user navigates away
    const capturedStepIndex = stepIndex;

    // Load products asynchronously and update
    this.loadStepProducts(stepIndex).then(() => {
      if (this.currentStepIndex !== capturedStepIndex) return; // user navigated away
      this.renderModalProducts(capturedStepIndex);
      this.updateModalFooterMessaging();

      // PRELOAD NEXT STEP
      this.preloadNextStep();
    }).catch(() => {
      if (this.currentStepIndex !== capturedStepIndex) return;
      const productGrid = this.elements.modal.querySelector('.product-grid');
      if (productGrid) productGrid.innerHTML = '<p class="error-message">Failed to load products. Please try again.</p>';
      ToastManager.show('Failed to load products for this step');
    });
  }

  closeModal() {
    this.elements.modal.classList.remove('bw-bs-panel--open');
    if (this.elements.bsOverlay) this.elements.bsOverlay.classList.remove('bw-bs-overlay--open');
    document.body.style.overflow = '';
    this.setBottomSheetVisibility(false);

    // Update main UI
    this.renderSteps();
    this.updateAddToCartButton();
    this.updateFooterMessaging();
  }

  resolveStorefrontApiBase() {
    const appProxyPrefix = '/apps/product-bundles';
    if (window.location?.pathname?.startsWith(`${appProxyPrefix}/`)) {
      return appProxyPrefix;
    }

    const configuredAppUrl = window.__BUNDLE_APP_URL__ || '';
    const currentOrigin = window.location.origin;
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

    if (!configuredAppUrl) {
      return appProxyPrefix;
    }

    if (shopDomain && configuredAppHost !== currentHost) {
      return appProxyPrefix;
    }

    return configuredAppUrl || currentOrigin;
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

  async loadStepProducts(stepIndex) {
    const step = this.selectedBundle.steps[stepIndex];

    const cachedProducts = this.stepProductData[stepIndex] || [];
    const hasHydratedProducts = cachedProducts.some(product =>
      product?.variantId
      || product?.imageUrl
      || (Array.isArray(product?.variants) && product.variants.length > 0)
      || typeof product?.price === 'number'
    );

    if (cachedProducts.length > 0 && hasHydratedProducts) {
      return;
    }

    let allProducts = [];
    let fetchFailed = false;

    const shop = window.Shopify?.shop || window.location.host;
    const apiBaseUrl = this.resolveStorefrontApiBase();

    const productIds = this.collectStepProductIds(step);
    if (productIds.length > 0) {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/storefront-products?ids=${encodeURIComponent(productIds.join(','))}&shop=${encodeURIComponent(shop)}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.products?.length > 0) allProducts = allProducts.concat(data.products);
        } else {
          fetchFailed = true;
        }
      } catch (_e) {
        fetchFailed = true;
      }
    }

    const handles = this.collectStepCollectionHandles(step);
    if (handles.length > 0) {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/storefront-collections?handles=${encodeURIComponent(handles.join(','))}&shop=${encodeURIComponent(shop)}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.products?.length > 0) allProducts = allProducts.concat(data.products);
        } else {
          fetchFailed = true;
        }
      } catch (_e) {
        fetchFailed = true;
      }
    }

    // Process and normalize product data
    const processedProducts = this._mergeDirectDefaultProductsIntoStep(
      stepIndex,
      this.processProductsForStep(allProducts, step)
    );

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

    // Store fetch failure state so renderModalProducts can show a proper error
    if (!this._stepFetchFailed) this._stepFetchFailed = {};
    this._stepFetchFailed[stepIndex] = fetchFailed && this.stepProductData[stepIndex].length === 0;
  }

  processProductsForStep(products, step) {
    // See full-page widget for the same fields. quantityAvailable is number|null
    // (null = untracked / scope ungranted → treat as unlimited in the clamp).
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
      if (step.displayVariantsAsIndividual && product.variants && product.variants.length > 0) {
        // Display each variant as separate product - filter out unavailable variants
        // Preserve parent product reference for variant selection and tracking
        const processedVariants = (product.variants || []).map(normalizeVariant);

        const processedOptions = (product.options || []).map(opt => {
          if (typeof opt === 'string') return opt;
          return opt.name || opt;
        });

        return product.variants
          .filter(variant => variant.available === true) // Only show available variants
          .map(variant => {
            // Storefront API: prioritize variant image, fallback to product featured image
            const imageUrl = variant?.image?.src || product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;

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
        // Display product with the first available variant when variants are not separate cards.
        // If all variants are unavailable, keep the configured product visible and
        // render it as out of stock instead of turning a valid DTO into a load error.
        const defaultVariant = product.variants?.find(variant => variant.available === true) || product.variants?.[0];

        // Storefront API: prioritize variant image, fallback to product featured image
        const imageUrl = defaultVariant?.image?.src || product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;

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
   * Look up real stock for a variant. See full-page widget's getVariantAvailable
   * for field semantics.
   */
  getVariantAvailable(stepIndex, variantId) {
    const products = this.stepProductData[stepIndex] || [];
    const product = this.findProductBySelectionKey(products, variantId);
    if (!product) {
      return { available: null, outOfStock: false, acceptsBackorder: false };
    }
    if (product.available === false) {
      return { available: 0, outOfStock: true, acceptsBackorder: false };
    }
    const qty = typeof product.quantityAvailable === 'number' ? product.quantityAvailable : null;
    const backorder = product.currentlyNotInStock === true;
    if (qty === 0 && !backorder) {
      return { available: 0, outOfStock: true, acceptsBackorder: false };
    }
    return { available: qty, outOfStock: false, acceptsBackorder: backorder };
  }

  findProductBySelectionKey(products, selectionKey) {
    const normalized = this.normalizeSelectionKey(selectionKey);
    if (!normalized) return null;

    return products.find((product) => {
      const ids = [product.variantId, product.id, product.productId];
      if (Array.isArray(product.variants)) {
        ids.push(...product.variants.map((variant) => variant.id));
      }

      return ids.some((id) => this.normalizeSelectionKey(id) === normalized);
    }) || null;
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

  normalizeSelectionKey(variantId) {
    const normalized = this.extractId(variantId);
    if (normalized == null) return '';
    return String(normalized);
  }

  getSelectedQuantity(stepIndex, variantId) {
    const selectedProducts = this.selectedProducts[stepIndex] || {};
    const normalized = this.normalizeSelectionKey(variantId);
    if (!normalized) return 0;

    if (Object.prototype.hasOwnProperty.call(selectedProducts, normalized)) {
      return Number(selectedProducts[normalized]) || 0;
    }

    const alias = Object.entries(selectedProducts).find(([productId]) =>
      this.normalizeSelectionKey(productId) === normalized
    );
    return alias ? Number(alias[1]) || 0 : 0;
  }

  setSelectedQuantity(stepIndex, variantId, quantity) {
    const selectedProducts = this.selectedProducts[stepIndex];
    if (!selectedProducts) return;

    const normalized = this.normalizeSelectionKey(variantId);
    if (!normalized) return;

    Object.keys(selectedProducts).forEach((productId) => {
      if (this.normalizeSelectionKey(productId) === normalized) {
        delete selectedProducts[productId];
      }
    });

    if (quantity > 0) {
      selectedProducts[normalized] = quantity;
    }
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
      ...(Array.isArray(step?.productsData1?.products) ? step.productsData1.products : []),
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
      savings: combinedDiscountAmount,
      addonDiscountAmount,
      finalPrice,
      discountPercentage: totalPrice > 0 ? (combinedDiscountAmount / totalPrice) * 100 : 0,
    };
  }

  getAllSelectedProductsData() {
    const allProducts = [];

    this.selectedBundle.steps.forEach((step, stepIndex) => {
      const stepSelections = this.selectedProducts[stepIndex] || {};
      const productsInStep = this.stepProductData[stepIndex] || [];

      Object.entries(stepSelections).forEach(([variantId, quantity]) => {
        if (quantity > 0) {
          const normalizedVariantId = this.normalizeSelectionKey(variantId);
          let product = this.findProductBySelectionKey(productsInStep, normalizedVariantId);
          if (!product && normalizedVariantId) {
            product = this.findProductBySelectionKey(productsInStep, variantId);
          }

          let matchedVariant = null;
          if (!product) {
            for (const p of productsInStep) {
              if (p.variants && Array.isArray(p.variants)) {
                const variant = p.variants.find(v =>
                  this.normalizeSelectionKey(v.id) === normalizedVariantId
                  || String(v.id) === String(variantId)
                );
                if (variant) {
                  product = p;
                  matchedVariant = variant;
                  break;
                }
              }
            }
          }

          if (product) {
            const variantData = matchedVariant || product;
            const isVariantMatch = !!matchedVariant;
            const variantTitle = isVariantMatch && matchedVariant.title && matchedVariant.title !== 'Default Title'
              ? matchedVariant.title
              : (product.variantTitle && product.variantTitle !== 'Default Title' ? product.variantTitle : '');
            const imageUrl = isVariantMatch
              ? (matchedVariant.image?.src || matchedVariant.image || product.imageUrl || product.image?.src || '')
              : (product.imageUrl || product.image?.src || '');
            const price = isVariantMatch
              ? (typeof variantData.price === 'number' ? variantData.price : (parseFloat(variantData.price || '0') * 100))
              : (product.price || 0);

            allProducts.push({
              stepIndex,
              variantId,
              quantity,
              title: isVariantMatch
                ? (variantTitle ? `${product.title} - ${variantTitle}` : product.title)
                : (product.title || 'Untitled Product'),
              parentTitle: product.parentTitle || product.title || 'Untitled Product',
              variantTitle,
              imageUrl,
              image: imageUrl,
              price,
              productId: product.productId || product.id,
              isDefault: step.isDefault ?? false,
              isFreeGift: step.isFreeGift ?? false,
              addonDisplayFree: step.addonDisplayFree === true,
            });
          }
        }
      });
    });

    return allProducts;
  }

  // Expand products with multiple variants into separate product entries
  // Each variant becomes its own card showing "Product Title - Variant Name"
  // This matches the full-page widget behavior for consistent UX
  expandProductsByVariant(products) {
    return products.flatMap(product => {
      // If product already has a parentProductId, it was already expanded
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

  renderModalTabs() {
    const tabsContainer = this.elements.modal.querySelector('.modal-tabs');
    tabsContainer.innerHTML = '';

    // Set CSS variable for equal-column grid (bottom-sheet mode)
    const stepCount = this.selectedBundle.steps.length;
    tabsContainer.style.setProperty('--bw-tab-count', stepCount.toString());

    this.selectedBundle.steps.forEach((step, index) => {
      const isAccessible = this.isStepAccessible(index);
      const isActive = index === this.currentStepIndex;
      const isFreeGift = !!step.isFreeGift;
      // Free gift tab is only accessible when all paid steps are complete
      const freeGiftAccessible = !isFreeGift || this.isFreeGiftUnlocked;

      // Create tab button
      const tabButton = document.createElement('button');
      const freeGiftClass = isFreeGift ? ' bw-free-gift-tab' : '';
      tabButton.className = `bundle-header-tab${freeGiftClass} ${isActive ? 'active' : ''} ${(!isAccessible || !freeGiftAccessible) ? 'locked' : ''}`;
      tabButton.textContent = (step.isFreeGift && step.addonLabel) ? step.addonLabel : (step.name || `Step ${index + 1}`);
      tabButton.dataset.stepIndex = index.toString();

      // Click handler
      tabButton.addEventListener('click', async () => {
        // Re-check accessibility at click time (not stale closure from render time)
        if (!this.isStepAccessible(index)) {
          ToastManager.show('Please complete the previous steps first.');
          return;
        }
        // Free gift tab requires all paid steps complete
        if (step.isFreeGift && !this.isFreeGiftUnlocked) {
          ToastManager.show('Complete all required steps to unlock the free gift.');
          return;
        }
        // Block forward navigation if current step condition is not met
        if (index > this.currentStepIndex && !this.validateStep(this.currentStepIndex)) {
          ToastManager.show('Please meet the step conditions before proceeding.');
          return;
        }

        this.currentStepIndex = index;

        // Update modal header
        const headerText = this.getFormattedHeaderText();
        this.elements.modal.querySelector('.modal-step-title').innerHTML = headerText;

        // Load products for this step if not already loaded
        this.showLoadingOverlay(this.selectedBundle?.loadingGif || null);
        try {
          await this.loadStepProducts(index);
        } finally {
          this.hideLoadingOverlay();
        }

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
    const rawProducts = productsToRender || this.stepProductData[stepIndex];
    // Expand variants into separate cards like full-page widget
    const products = this.expandProductsByVariant(rawProducts);
    const selectedProducts = this.selectedProducts[stepIndex];
    const productGrid = this.elements.modal.querySelector('.product-grid');
    const currentStep = this.selectedBundle?.steps?.[stepIndex];
    const isFreeGiftStep = !!currentStep?.isFreeGift;

    // Inject free gift promo heading above the grid
    const bodyEl = this.elements.modal.querySelector('.bw-bs-body') || this.elements.modal.querySelector('.modal-body');
    const existingPromo = bodyEl?.querySelector('.bw-bs-free-gift-promo');
    if (existingPromo) existingPromo.remove();
    if (isFreeGiftStep && bodyEl) {
      const promo = document.createElement('div');
      promo.className = 'bw-bs-free-gift-promo';
      const stepName = currentStep.name || 'gift';
      const firstProduct = rawProducts?.[0];
      const priceStr = firstProduct?.price
        ? CurrencyManager.convertAndFormat(firstProduct.price, CurrencyManager.getCurrencyInfo())
        : '';
      promo.innerHTML = `
        <p class="bw-bs-free-gift-heading">Free ${ComponentGenerator.escapeHtml(stepName)}!</p>
        <p class="bw-bs-free-gift-subheading">Add ${this.paidSteps.length} items to unlock</p>
      `;
      bodyEl.insertBefore(promo, productGrid);
    }

    if (products.length === 0) {
      // Show error state if the fetch failed, otherwise a neutral "no products" message
      if (this._stepFetchFailed && this._stepFetchFailed[stepIndex]) {
        productGrid.innerHTML = `
          <div class="modal-fetch-error">
            <p>Could not load products. Please check your connection and try again.</p>
            <button class="modal-retry-btn">Retry</button>
          </div>
        `;
        const retryBtn = productGrid.querySelector('.modal-retry-btn');
        if (retryBtn) {
          retryBtn.addEventListener('click', () => {
            // Clear cached failure so loadStepProducts re-fetches
            this._stepFetchFailed[stepIndex] = false;
            this.stepProductData[stepIndex] = [];
            this.renderModalProductsLoading(stepIndex);
            this.loadStepProducts(stepIndex).then(() => {
              this.renderModalProducts(stepIndex);
            });
          });
        }
      } else {
        productGrid.innerHTML = `<p class="no-products-message">No products are configured for this step.</p>`;
      }
      return;
    }

    const showQuantitySelector = this.config.showQuantitySelectorOnCard;

    // Free gift product cards use a different border (gray instead of gold)
    const freeGiftCardClass = isFreeGiftStep ? ' bw-product-card--free-gift' : '';
    const productQuantityLimit = ConditionValidator.getAllowedQuantityPerProduct(
      this.selectedBundle?.validateQuantityPerProduct
    );

    productGrid.innerHTML = products.map(product => {
      const selectionKey = product.variantId || product.id;
      const currentQuantity = this.getSelectedQuantity(stepIndex, selectionKey);
      const currencyInfo = CurrencyManager.getCurrencyInfo();

      // Per-variant stock state derived from Storefront API quantityAvailable
      const { available, outOfStock } = this.getVariantAvailable(stepIndex, selectionKey);
      const atMaxStock = available !== null && currentQuantity >= available;
      const lowStock = available !== null && available > 0 && available <= 3;
      const atMaxProductQuantity = productQuantityLimit !== null && currentQuantity >= productQuantityLimit;
      const increaseDisabled = outOfStock || atMaxStock || atMaxProductQuantity;
      const addDisabled = outOfStock;

      // Low-stock / out-of-stock badge — shown on the image, not in the CTA.
      const stockBadge = outOfStock
        ? `<div class="product-stock-badge product-stock-badge--out">Out of stock</div>`
        : lowStock
          ? `<div class="product-stock-badge product-stock-badge--low">Only ${available} left</div>`
          : '';

      return `
        <div class="product-card${freeGiftCardClass} ${currentQuantity > 0 ? 'selected' : ''} ${outOfStock ? 'is-out-of-stock' : ''}" data-product-id="${selectionKey}">
          ${currentQuantity > 0 ? `
            <div class="selected-overlay">✓</div>
          ` : ''}

          <div class="product-image">
            <img src="${product.imageUrl}" alt="${ComponentGenerator.escapeHtml(product.title)}" loading="lazy">
            ${stockBadge}
          </div>

          <div class="product-content-wrapper">
            <div class="product-title">${ComponentGenerator.escapeHtml(product.title)}</div>

            ${product.price ? `
              <div class="product-price-row">
                ${this._shouldShowProductComparedAtPrice() && product.compareAtPrice ? `<span class="product-price-strike">${CurrencyManager.convertAndFormat(product.compareAtPrice, currencyInfo)}</span>` : ''}
                <span class="product-price">${CurrencyManager.convertAndFormat(product.price, currencyInfo)}</span>
              </div>
            ` : ''}

            <div class="product-spacer"></div>

            ${this.renderVariantSelector(product)}

            ${showQuantitySelector ? `
              <div class="product-quantity-wrapper">
                <div class="product-quantity-selector">
                  <button class="qty-btn qty-decrease" data-product-id="${selectionKey}">−</button>
                  <span class="qty-display">${currentQuantity}</span>
                  <button class="qty-btn qty-increase" data-product-id="${selectionKey}" ${increaseDisabled ? 'disabled aria-disabled="true"' : ''}>+</button>
                </div>
              </div>
            ` : ''}

            <button class="product-add-btn ${currentQuantity > 0 ? 'added' : ''}" data-product-id="${selectionKey}" ${addDisabled ? 'disabled aria-disabled="true"' : ''}>
              ${outOfStock ? 'Out of stock' : (currentQuantity > 0 ? (currentStep?.addonReplaceText || 'Selected ✓') : (currentStep?.addonAddText || 'Add to Cart'))}
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Trigger slide-up animation for cards
    productGrid.classList.remove('bw-animate-in');
    void productGrid.offsetWidth; // force reflow
    productGrid.classList.add('bw-animate-in');

    // Attach event handlers
    this.attachProductEventHandlers(productGrid, stepIndex);
  }

  renderVariantSelector(product) {
    if (!product.variants || product.variants.length <= 1) {
      return '';
    }

    return `
      <div class="variant-selector-wrapper">
        <select class="variant-selector" data-base-product-id="${product.id}">
          ${product.variants.map(v => {
            // Grey out variants that are hard out of stock. quantityAvailable === 0
            // only disables when the variant does NOT accept backorders
            // (currentlyNotInStock === true means "sold out but backorderable").
            const isHardOOS = v.available !== true
              || (v.quantityAvailable === 0 && v.currentlyNotInStock !== true);
            const label = isHardOOS ? `${v.title} — out of stock` : v.title;
            const selected = v.id === product.variantId ? 'selected' : '';
            const disabled = isHardOOS ? 'disabled' : '';
            return `<option value="${v.id}" ${selected} ${disabled}>${label}</option>`;
          }).join('')}
        </select>
      </div>
    `;
  }

  // Render loading skeleton for modal product grid - solid pulsating cards
  // No internal button/quantity skeletons - just clean solid cards
  renderModalProductsLoading(stepIndex) {
    const productGrid = this.elements.modal.querySelector('.product-grid');

    productGrid.innerHTML = `
      ${Array(6).fill(0).map(() => `
        <div class="product-card skeleton-loading">
          <div class="skeleton-card-content"></div>
        </div>
      `).join('')}
      <style>
        /* Skeleton loading state - solid pulsating cards */
        .product-card.skeleton-loading {
          pointer-events: none;
          cursor: default;
          position: relative;
          overflow: hidden;
          min-height: 320px;
          background: #f5f5f5;
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
            #f0f0f0 0%,
            #f0f0f0 40%,
            #e0e0e0 50%,
            #f0f0f0 60%,
            #f0f0f0 100%
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

  // Preload next step's products in the background
  preloadNextStep() {
    const nextStepIndex = this.currentStepIndex + 1;

    // Check if there is a next step
    if (nextStepIndex >= this.selectedBundle.steps.length) {
      return;
    }

    // Check if next step products are already loaded
    if (this.stepProductData[nextStepIndex]?.length > 0) {
      return;
    }


    // Load in background (don't await)
    this.loadStepProducts(nextStepIndex)
      .then(() => {
      })
      .catch(error => {
        // Don't show error to user - preloading is optimization only
      });
  }

  attachProductEventHandlers(productGrid, stepIndex) {
    // Remove existing event listeners to prevent duplicates
    const newProductGrid = productGrid.cloneNode(true);
    productGrid.parentNode.replaceChild(newProductGrid, productGrid);

    // Get step data for modal
    const step = this.selectedBundle.steps[stepIndex];

    // Helper to find product by ID
    const findProduct = (productId) => {
      return this.findProductBySelectionKey(this.stepProductData[stepIndex] || [], productId);
    };

    // Quantity button handlers
    newProductGrid.addEventListener('click', (e) => {
      if (e.target.classList.contains('qty-btn')) {
        e.stopPropagation();
        const productId = e.target.dataset.productId;
        const isIncrease = e.target.classList.contains('qty-increase');
        const currentQuantity = this.getSelectedQuantity(stepIndex, productId);

        const newQuantity = isIncrease ? currentQuantity + 1 : Math.max(0, currentQuantity - 1);
        this.updateProductSelection(stepIndex, productId, newQuantity);
      }
    });

    // Add to Bundle button handler
    newProductGrid.addEventListener('click', (e) => {
      if (e.target.classList.contains('product-add-btn')) {
        e.stopPropagation();
        const productId = e.target.dataset.productId;
        const product = findProduct(productId);

        // If product has variants and modal is available, open the modal
        if (product && product.variants && product.variants.length > 1 && this.productModal) {
          this.productModal.open(product, step);
        } else {
          // No variants or modal not available - toggle directly
          const currentQuantity = this.getSelectedQuantity(stepIndex, productId);
          this.updateProductSelection(stepIndex, productId, currentQuantity > 0 ? 0 : 1);
        }
      }
    });

    // Product card click follows Settings -> Controls. Product image/title still opens variants when card add is disabled.
    newProductGrid.addEventListener('click', (e) => {
      const productCard = e.target.closest('.product-card');
      if (!productCard) return;
      if (e.target.closest('.product-add-btn, .qty-btn, .variant-selector, button, input, select, a')) return;

      const productImage = e.target.closest('.product-image');
      const productTitle = e.target.closest('.product-title');
      const canClickCardToAdd = this._isProductCardClickAddEnabled();
      if (!canClickCardToAdd && !productImage && !productTitle) return;

      const productId = productCard.dataset.productId;
      const product = findProduct(productId);
      if (!product) return;

      if (product.variants && product.variants.length > 1 && this.productModal && step) {
        this.productModal.open(product, step);
        return;
      }

      if (canClickCardToAdd) {
        const currentQuantity = this.getSelectedQuantity(stepIndex, productId);
        this.updateProductSelection(stepIndex, productId, currentQuantity > 0 ? 0 : 1);
      }
    });

    // Add cursor pointer styles to clickable product cards, images, and titles.
    newProductGrid.querySelectorAll('.product-card').forEach(card => {
      const productId = card.dataset.productId;
      const product = findProduct(productId);
      const canClickCardToAdd = this._isProductCardClickAddEnabled();
      if (canClickCardToAdd) {
        card.style.cursor = 'pointer';
      }
      if (product && product.variants && product.variants.length > 1 && this.productModal) {
        const imageEl = card.querySelector('.product-image');
        const titleEl = card.querySelector('.product-title');
        if (imageEl) imageEl.style.cursor = 'pointer';
        if (titleEl) titleEl.style.cursor = 'pointer';
      }
    });

    // Variant selector handler (for inline dropdown if used)
    newProductGrid.addEventListener('change', (e) => {
      if (e.target.classList.contains('variant-selector')) {
        e.stopPropagation();
        const newVariantId = e.target.value;
        const baseProductId = e.target.dataset.baseProductId;

        // Find the product and update its variant
        const product = this.stepProductData[stepIndex].find(p => p.id === baseProductId);
        if (product && product.variants) {
          const variantData = product.variants.find(v => v.id === newVariantId);
          if (variantData) {
            // Sync the new variant's stock fields onto the product so
            // getVariantAvailable() reflects post-swap state.
            product.quantityAvailable = typeof variantData.quantityAvailable === 'number'
              ? variantData.quantityAvailable
              : null;
            product.currentlyNotInStock = variantData.currentlyNotInStock === true;

            // Move quantity from old variant to new variant, re-clamping against
            // the new variant's quantityAvailable. If the new variant can't hold
            // the old quantity, reduce it and surface a toast.
            const oldQuantity = this.getSelectedQuantity(stepIndex, product.variantId);
            if (oldQuantity > 0) {
              this.setSelectedQuantity(stepIndex, product.variantId, 0);

              const newQtyAvail = product.quantityAvailable;
              const newOOS = newQtyAvail === 0 && !product.currentlyNotInStock;
              let migratedQty = oldQuantity;
              if (newOOS) {
                ToastManager.show('Selected variant is out of stock — selection cleared.');
                migratedQty = 0;
              } else if (newQtyAvail !== null && oldQuantity > newQtyAvail) {
                migratedQty = newQtyAvail;
                ToastManager.show(`Only ${newQtyAvail} in stock — quantity adjusted.`);
              }
              if (migratedQty > 0) {
                this.setSelectedQuantity(stepIndex, newVariantId, migratedQty);
              }
            }

            // Update product properties
            product.variantId = newVariantId;
            product.price = variantData.price;

            // CRITICAL: Update all data-product-id attributes in the card to use the new variant ID
            // This fixes the bug where quantity controls would use the old variant ID
            const productCard = e.target.closest('.product-card');
            if (productCard) {
              productCard.dataset.productId = newVariantId;
              productCard.querySelectorAll('[data-product-id]').forEach(el => {
                el.dataset.productId = newVariantId;
              });
            }

            // Update UI without full re-render
            this.updateModalNavigation();
            this.updateModalFooterMessaging();
          }
        }
      }
    });
  }
  updateProductSelection(stepIndex, productId, newQuantity) {
    const selectionKey = this.normalizeSelectionKey(productId);
    let quantity = Math.max(0, newQuantity);
    const directDefaultRequiredQuantity = this._getDirectDefaultRequiredQuantity(selectionKey);
    if (directDefaultRequiredQuantity !== null && quantity < directDefaultRequiredQuantity) {
      quantity = directDefaultRequiredQuantity;
    }

    // Clamp against real per-variant stock before doing anything else.
    // Uses quantityAvailable from the Storefront API (see getVariantAvailable).
    // Adding 0 always allowed (that is a removal).
    if (quantity > 0) {
      const { available, outOfStock } = this.getVariantAvailable(stepIndex, selectionKey);
      if (outOfStock) {
        ToastManager.show('This item is out of stock.');
        return;
      }
      if (available !== null && quantity > available) {
        quantity = available;
        ToastManager.show(`Only ${available} in stock — quantity adjusted.`);
      }
    }

    const currentQuantity = this.getSelectedQuantity(stepIndex, selectionKey);
    const productQuantityCheck = ConditionValidator.canUpdateProductQuantity(
      this.selectedBundle?.validateQuantityPerProduct,
      currentQuantity,
      quantity,
    );
    if (!productQuantityCheck.allowed) {
      ToastManager.show(`Maximum allowed quantity per product is ${productQuantityCheck.limit}.`);
      return;
    }

    // Validate step conditions
    if (!this.validateStepCondition(stepIndex, selectionKey, quantity)) {
      return;
    }

    this.setSelectedQuantity(stepIndex, selectionKey, quantity);

    // Update UI without re-rendering the entire modal (prevents event listener duplication)
    this.updateProductQuantityDisplay(stepIndex, selectionKey, quantity);
    this._renderDirectDefaultProducts();
    this.renderModalTabs();
    this.updateModalNavigation();
    this.updateModalFooterMessaging();
    this.updateAddToCartButton();
    this.updateFooterMessaging();
    // Sync free gift slot lock/unlock state — selection changes on paid steps can cross
    // the unlock threshold, so the slot card must reflect the current isFreeGiftUnlocked state.
    this._syncFreeGiftSlotCard();

    // Auto-step progression
    this._autoProgressBottomSheet(stepIndex);
    this._maybeAutoAddAfterLastStep();
  }

  _maybeAutoAddAfterLastStep() {
    const controls = this._getProductPageControls();
    if (controls?.addBundleToCartAfterLastStepCompleted !== true) return;
    if (this._autoAddingFromControls) return;
    if (!this.selectedBundle?.steps?.length) return;

    const allStepsValid = this.selectedBundle.steps.every((step, index) => {
      if (step.isFreeGift || step.isDefault) return true;
      return this.validateStep(index);
    });
    if (!allStepsValid) return;

    this._autoAddingFromControls = true;
    this.addToCart().finally(() => {
      this._autoAddingFromControls = false;
    });
  }

  /**
   * Re-render only the free gift slot card in the main stepsContainer to reflect
   * the current isFreeGiftUnlocked state. Called after every paid-step selection
   * change so the lock/unlock state stays in sync without a full renderSteps() pass.
   */
  _syncFreeGiftSlotCard() {
    const freeGiftIdx = this.freeGiftStepIndex;
    if (freeGiftIdx === -1 || !this.elements.stepsContainer) return;
    const existing = this.elements.stepsContainer.querySelector(`[data-step-index="${freeGiftIdx}"]`);
    if (!existing) return;
    const step = this.selectedBundle?.steps[freeGiftIdx];
    if (!step?.isFreeGift) return;
    const fresh = this.createFreeGiftSlotCard(step, freeGiftIdx);
    existing.replaceWith(fresh);
  }

  /**
   * Bottom-sheet auto-step progression.
   * Called after every product selection update.
   * If the current step's condition is now met, advances to the next incomplete step,
   * or closes the modal if all steps are complete.
   */
  _autoProgressBottomSheet(stepIndex) {
    if (!this.validateStep(stepIndex)) return; // current step not yet complete

    const next = bsFindNextIncompleteStep(
      this.selectedBundle.steps,
      this.selectedProducts,
      (i) => this.validateStep(i),
      stepIndex
    );

    if (next === -1) {
      // All steps complete — refresh tabs with checkmarks, then close
      this.renderModalTabs();
      setTimeout(() => this.closeModal(), 500);
    } else {
      // Advance to next incomplete step tab
      this.renderModalTabs();
      setTimeout(() => {
        this.currentStepIndex = next;
        const modal = this.elements.modal;
        const headerText = this.getFormattedHeaderText();
        modal.querySelector('.modal-step-title').innerHTML = headerText;
        this.renderModalProductsLoading(next);
        this.renderModalTabs();
        this.updateModalNavigation();
        this.loadStepProducts(next).then(() => {
          if (this.currentStepIndex !== next) return;
          this.renderModalProducts(next);
          this.updateModalFooterMessaging();
          this.preloadNextStep();
        }).catch(() => {});
      }, 300);
    }
  }

  updateProductQuantityDisplay(stepIndex, productId, quantity) {
    // Update quantity display without full re-render
    const scope = this.elements.modal?.classList.contains('bw-bs-panel--open')
      ? this.elements.modal
      : this.container;
    const productCard = scope.querySelector(`[data-product-id="${productId}"]`);
    if (productCard) {
      const quantityDisplay = productCard.querySelector('.qty-display');
      const addBtn = productCard.querySelector('.product-add-btn');
      const selectedOverlay = productCard.querySelector('.selected-overlay');
      const increaseBtn = productCard.querySelector('.qty-increase');

      if (quantityDisplay) {
        quantityDisplay.textContent = quantity;
      }

      if (increaseBtn) {
        const productQuantityLimit = ConditionValidator.getAllowedQuantityPerProduct(
          this.selectedBundle?.validateQuantityPerProduct
        );
        const { available, outOfStock } = this.getVariantAvailable(stepIndex, productId);
        const atMaxStock = available !== null && quantity >= available;
        const atMaxProductQuantity = productQuantityLimit !== null && quantity >= productQuantityLimit;
        const shouldDisableIncrease = outOfStock || atMaxStock || atMaxProductQuantity;
        increaseBtn.disabled = shouldDisableIncrease;
        if (shouldDisableIncrease) {
          increaseBtn.setAttribute('aria-disabled', 'true');
        } else {
          increaseBtn.removeAttribute('aria-disabled');
        }
      }

      if (addBtn) {
        const cascadeRow = productCard.classList.contains('bw-ppb-cascade-product-row');
        const step = this.selectedBundle?.steps?.[stepIndex];
        if (quantity > 0) {
          addBtn.textContent = cascadeRow
            ? (step?.addonReplaceText || this._resolveText('includedBadge', 'Selected ✓'))
            : this._resolveText('includedBadge', 'Selected ✓');
          addBtn.classList.add('added');
        } else {
          addBtn.textContent = cascadeRow
            ? (step?.addonAddText || 'Add +')
            : this._resolveText('productCardAddButton', 'Add to Cart');
          addBtn.classList.remove('added');
        }
      }

      if (selectedOverlay) {
        if (quantity > 0) {
          selectedOverlay.style.display = 'flex';
        } else {
          selectedOverlay.style.display = 'none';
        }
      }

      // Update card visual state
      if (quantity > 0) {
        productCard.classList.add('selected');
      } else {
        productCard.classList.remove('selected');
      }
    }
  }

  validateStepCondition(stepIndex, productId, newQuantity) {
    const step = this.selectedBundle.steps[stepIndex];
    const currentSelections = this.selectedProducts[stepIndex] || {};
    const currentQty = this.getSelectedQuantity(stepIndex, productId);
    const normalizedProductId = this.normalizeSelectionKey(productId);

    const { allowed, limitText } = ConditionValidator.canUpdateQuantity(
      step,
      currentSelections,
      normalizedProductId,
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
        const product = this.findProductBySelectionKey(products, selKey);
        const productId = String((product && (product.parentProductId || product.id)) || selKey);
        translated[productId] = (translated[productId] || 0) + (Number(qty) || 0);
      }
      return ConditionValidator.isStepConditionSatisfied(step, translated);
    }

    return ConditionValidator.isStepConditionSatisfied(step, currentSelections);
  }

  isStepAccessible(stepIndex) {
    // Check if all previous required steps are completed.
    // Free gift and default steps are non-blocking — skip them.
    for (let i = 0; i < stepIndex; i++) {
      const step = this.selectedBundle?.steps[i];
      if (step?.isFreeGift || step?.isDefault) continue;
      if (!this.validateStep(i)) return false;
    }
    return true;
  }

  updateModalNavigation() {
    const prevButton = this.elements.modal?.querySelector('.prev-button');
    const nextButton = this.elements.modal?.querySelector('.next-button');

    if (!prevButton || !nextButton) return;

    // Buttons are never disabled — navigateModal handles invalid steps with a toast.
    prevButton.disabled = false;

    const isLastStep = this.currentStepIndex === this.selectedBundle.steps.length - 1;
    const footer = this.elements.modal?.querySelector('.bw-bs-footer');
    footer?.classList.toggle('bw-bs-footer--single-step', this.selectedBundle.steps.length <= 1);
    footer?.classList.toggle('bw-bs-footer--first-step', this.currentStepIndex === 0);
    footer?.classList.toggle('bw-bs-footer--last-step', isLastStep);

    nextButton.textContent = isLastStep ? this._resolveText('doneButton', 'Done') : this._resolveText('nextButton', 'Next');
    nextButton.disabled = false;
  }

  updateModalFooterMessaging() {
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

    // Always show step name in header - discount messaging is in footer only
    const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
    modalStepTitle.innerHTML = currentStep?.name || `Step ${this.currentStepIndex + 1}`;
  }

  updateModalDiscountMessaging(totalPrice, totalQuantity, discountInfo, currencyInfo) {
    const footerDiscountText = this.elements.modal.querySelector('.footer-discount-text');
    const discountSection = this.elements.modal.querySelector('.modal-footer-discount-messaging')
      || this.elements.modal.querySelector('.modal-header-discount-messaging');

    if (!footerDiscountText) return;

    // Check if any discount rules exist
    const nextRule = PricingCalculator.getNextDiscountRule(this.selectedBundle, totalQuantity, totalPrice);
    const ruleToUse = discountInfo.applicableRule || nextRule;
    const hasDiscountRules = !!ruleToUse;

    // Hide messaging entirely when no discount rules are configured
    if (discountSection) {
      discountSection.style.display = (this.config.showDiscountMessaging && hasDiscountRules) ? 'block' : 'none';
    }

    if (!hasDiscountRules) return;

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
    // Force a synchronous reflow so the browser applies the initial opacity:0
    // before we add 'is-visible'. Using offsetHeight instead of requestAnimationFrame
    // avoids a race condition where hideLoadingOverlay() is called before the rAF
    // fires (which happens when loadBundleData() resolves synchronously from the
    // dataset attribute — microtasks settle before animation frames).
    // eslint-disable-next-line no-unused-expressions
    overlay.offsetHeight;
    markLoadingOverlayVisible(overlay);
  }

  hideLoadingOverlay() {
    const overlay = this.container?.querySelector('.bundle-loading-overlay');
    hideLoadingOverlayElement(overlay);
  }

  // ========================================================================
  // CART OPERATIONS
  // ========================================================================

  async addToCart() {
    try {
      const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
        this.selectedProducts,
        this.stepProductData,
        this.selectedBundle?.steps
      );

      if (totalQuantity === 0) {
        ToastManager.show('Please select products for your bundle before adding to cart.');
        return;
      }

      // Validate all required steps (free gift and default steps are not required)
      const allStepsValid = this.selectedBundle.steps.every((step, index) => {
        if (step.isFreeGift || step.isDefault) return true;
        return this.validateStep(index);
      });
      if (!allStepsValid) {
        ToastManager.show('Please complete all bundle steps before adding to cart.');
        return;
      }

      const cartItems = this.buildCartItems();

      // Disable button and show loading overlay during request
      this.elements.addToCartButton.disabled = true;
      this.elements.addToCartButton.textContent = this._resolveText('addingToCart', 'Adding to Cart...');
      this.showLoadingOverlay(this.selectedBundle?.loadingGif || null);

      const cartContext = this.buildProductPageCartFormData(cartItems);
      await this.syncBundleDetailsCartMetafield(cartContext.bundleDetailsKey, cartContext.sourceProperties);

      const response = await fetch('/cart/add', {
        method: 'POST',
        body: cartContext.formData
      });

      // Read body as text first — Shopify can return HTML on password-protected stores
      // or on certain error conditions. JSON.parse on HTML would surface a confusing error.
      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = `Cart add failed (${response.status})`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.description || errorMessage;
        } catch {
          // Response wasn't JSON (e.g., HTML login/password page) — use status-code message
        }
        throw new Error(errorMessage);
      }

      try {
        JSON.parse(responseText);
      } catch {
        // Shopify often returns an HTML cart page after a successful multipart
        // /cart/add redirect. A 2xx response is enough for this path; JSON is
        // only parsed above to preserve detailed non-OK error messages.
      }

      // Show success message and redirect
      ToastManager.show('Bundle added to cart successfully!');
      this._handlePostAddToCartAction(this._getProductPageControls()?.redirect);

    } catch (error) {
      ToastManager.show(`Failed to add bundle to cart: ${error.message}`);
    } finally {
      // Re-enable button and hide overlay
      this.hideLoadingOverlay();
      this.updateAddToCartButton();
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
    const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const discountAmount = Math.max(0, Number(combinedDiscountInfo.discountAmount || 0));
    const discountPercentage = combinedDiscountInfo.discountPercentage
      || (totalPrice > 0 ? (discountAmount / totalPrice) * 100 : 0);

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

    return {
      '_bundle_display_properties': JSON.stringify(displayProperties)
    };
  }

  buildCartItems() {
    // Shopify Standard Bundle approach for configurable bundles:
    // Add ACTUAL selected component products to cart with _bundle_id property
    // Cart transform MERGE groups by _bundle_id and combines into bundle parent
    // See: https://shopify.dev/docs/apps/build/product-merchandising/bundles/create-bundle-app

    const cartItems = [];
    const bundleInstanceId = this.generateBundleInstanceId();


    // Add ACTUAL selected component products to cart
    // Each component gets _bundle_id property for grouping in cart transform
    const unavailableProducts = []; // Track unavailable products
    const selectedLines = [];

    this.selectedProducts.forEach((stepSelections, stepIndex) => {
      const productsInStep = this.expandProductsByVariant(this.stepProductData[stepIndex] || []);

      Object.entries(stepSelections).forEach(([variantId, quantity]) => {
        if (quantity > 0) {
          const product = this.findProductBySelectionKey(productsInStep, variantId);
          if (product) {
            // Check availability before adding to cart
            if (product.available !== true) {
              unavailableProducts.push(product.title);
              return; // Skip this product
            }

            // variantId is already the user-selected variant ID from selectedProducts
            const actualVariantId = variantId;

            const step = this.selectedBundle.steps[stepIndex];
            const addonDiscount = this.getAddonLineDiscount(step);
            const properties = {};
            if (addonDiscount && step?.addonDisplayFree !== true) {
              properties['_bundle_step_type'] = addonDiscount
                ? `addon:${addonDiscount.type}:${addonDiscount.value}`
                : 'addon';
            } else if (step?.isFreeGift && step?.addonDisplayFree === true) {
              properties['_bundle_step_type'] = 'free_gift';
            }
            if (step?.isDefault) properties['_bundle_step_type'] = 'default';
            if (this._isDirectDefaultVariant(variantId)) properties['_bundle_step_type'] = 'default';

            const cartItem = {
              id: parseInt(this.extractId(actualVariantId)),
              quantity: quantity,
              properties
            };
            const sellingPlanAllocationId = this.getSelectedSellingPlanAllocationId(product, variantId);
            if (sellingPlanAllocationId) {
              cartItem.selling_plan = parseInt(sellingPlanAllocationId);
            }

            cartItems.push(cartItem);
            selectedLines.push({ product, quantity });
          }
        }
      });
    });


    // Throw error if any products are unavailable
    if (unavailableProducts.length > 0) {
      const productList = unavailableProducts.join(', ');
      throw new Error(`The following product${unavailableProducts.length > 1 ? 's are' : ' is'} currently unavailable: ${productList}. Please remove ${unavailableProducts.length > 1 ? 'them' : 'it'} from your bundle or try again later.`);
    }

    const sourceProperties = this.buildCartLineSourceProperties(selectedLines);
    cartItems.forEach(item => {
      Object.assign(item.properties, sourceProperties);
    });

    return cartItems;
  }

  buildProductPageCartFormData(cartItems) {
    const formData = new FormData();
    const sessionKey = this.generateBundleSessionKey();
    const offerId = this.resolveProductPageOfferId();

    cartItems.forEach((item, index) => {
      const itemNumber = index + 1;
      formData.append(`items[${index}][id]`, String(item.id));
      formData.append(`items[${index}][quantity]`, String(item.quantity));

      if (item.selling_plan) {
        formData.append(`items[${index}][selling_plan]`, String(item.selling_plan));
      }

      Object.entries(item.properties || {}).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        formData.append(`items[${index}][properties][${key}]`, String(value));
      });
      formData.append(`items[${index}][properties][Box]`, String(itemNumber));
      formData.append(`items[${index}][properties][_bundleName]`, this.selectedBundle?.name || '');
      formData.append(`items[${index}][properties][_easyBundle:OfferId]`, `${offerId}_${sessionKey}_${itemNumber}`);
      formData.append(`items[${index}][properties][_easyBundle:prodQty]`, String(item.quantity));
    });

    return {
      formData,
      bundleDetailsKey: `${offerId}_${sessionKey}`,
      sourceProperties: this.extractBundleDetailsSourceProperties(cartItems)
    };
  }

  extractBundleDetailsSourceProperties(cartItems) {
    const firstItem = cartItems.find(item => item?.properties?._bundle_display_properties);
    return firstItem?.properties || {};
  }

  async syncBundleDetailsCartMetafield(bundleDetailsKey, sourceProperties) {
    try {
      const displayProperties = this.buildBundleDetailsDisplayProperties(sourceProperties);
      if (!bundleDetailsKey || Object.keys(displayProperties).length === 0) return;

      const cartToken = await this.getBundleDetailsCartToken();
      if (!cartToken) return;

      const response = await fetch('/apps/product-bundles/api/cart-bundle-details', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cartToken,
          bundleDetailsKey,
          displayProperties
        })
      });

      if (!response.ok) {
        throw new Error(`bundle_details sync failed (${response.status})`);
      }

      const data = await response.json().catch(() => null);
      if (data?.ok !== true) {
        throw new Error(data?.error || 'bundle_details sync failed');
      }
    } catch (error) {
      console.warn('[Wolfpack Bundles] Failed to sync bundle_details cart metafield', error);
    }
  }

  buildBundleDetailsDisplayProperties(sourceProperties) {
    const displayProperties = {};
    const raw = sourceProperties?._bundle_display_properties;
    const cartLineLabels = this.getCartLineLabels();

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.box) displayProperties.Box = String(parsed.box);
        if (parsed?.items) displayProperties[cartLineLabels.items] = String(parsed.items);
        if (parsed?.retailPrice) displayProperties[cartLineLabels.retailPrice] = String(parsed.retailPrice);
        if (parsed?.youSave?.amountPercentage) displayProperties[cartLineLabels.youSave] = String(parsed.youSave.amountPercentage);
      } catch {
        // Ignore malformed display metadata; cart add must remain non-blocking.
      }
    }

    ['Box', cartLineLabels.items, cartLineLabels.retailPrice, cartLineLabels.youSave, 'Items', 'Retail Price', 'You Save'].forEach((key) => {
      if (sourceProperties?.[key] && !displayProperties[key]) {
        displayProperties[key] = String(sourceProperties[key]);
      }
    });

    return displayProperties;
  }

  getCartLineLabels() {
    const labels = this.config?.sharedCartLabels || {};
    return {
      items: labels.bundleContainsLabel || 'Items',
      retailPrice: labels.bundleOriginalPriceLabel || 'Retail Price',
      youSave: labels.bundleDiscountDisplayLabel || 'You Save',
    };
  }

  async getBundleDetailsCartToken() {
    const response = await fetch('/cart.js?app=wolfpackProductBundles', {
      credentials: 'same-origin'
    });
    if (!response.ok) return null;
    const cart = await response.json();
    return cart?.token || null;
  }

  resolveProductPageOfferId() {
    const rawOfferId = this.selectedBundle?.offerId
      || this.selectedBundle?.bundleOfferId
      || this.selectedBundle?.id
      || 'UNKNOWN';
    const offerId = String(rawOfferId);
    return offerId.startsWith('MIX-') ? offerId : `MIX-${offerId}`;
  }

  generateBundleSessionKey() {
    return Math.random().toString(36).slice(2, 5).toUpperCase();
  }

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

  attachEventListeners() {
    // Add to cart button
    this.elements.addToCartButton.addEventListener('click', () => this.addToCart());

    // Modal close handlers
    const modal = this.elements.modal;
    const closeButton = modal.querySelector('.close-button');
    const prevButton = modal.querySelector('.prev-button');
    const nextButton = modal.querySelector('.next-button');

    if (closeButton) {
      closeButton.addEventListener('click', () => this.closeModal());
    }

    // Overlay closes bottom-sheet
    if (this.elements.bsOverlay) {
      this.elements.bsOverlay.addEventListener('click', () => this.closeModal());
    }
    if (prevButton) prevButton.addEventListener('click', () => this.navigateModal(-1));
    if (nextButton) nextButton.addEventListener('click', () => this.navigateModal(1));

    // Keyboard: close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('bw-bs-panel--open')) {
        this.closeModal();
      }
    });
  }

  async navigateModal(direction) {
    const newStepIndex = this.currentStepIndex + direction;

    if (direction < 0 && newStepIndex >= 0) {
      // Previous step — always allowed, no validation required
      this.currentStepIndex = newStepIndex;

      // Update modal header
      const headerText = this.getFormattedHeaderText();
      this.elements.modal.querySelector('.modal-step-title').innerHTML = headerText;

      // OPTIMISTIC RENDERING: Update UI immediately with loading state
      this.renderModalTabs();
      this.renderModalProductsLoading(newStepIndex);
      this.updateModalNavigation();
      this.updateModalFooterMessaging();

      // Load products asynchronously
      await this.loadStepProducts(newStepIndex);
      this.renderModalProducts(this.currentStepIndex);
      this.updateModalFooterMessaging();
    } else if (direction > 0) {
      if (newStepIndex < this.selectedBundle.steps.length) {
        // Next step
        if (this.validateStep(this.currentStepIndex)) {
          this.currentStepIndex = newStepIndex;

          // Update modal header
          const headerText = this.getFormattedHeaderText();
          this.elements.modal.querySelector('.modal-step-title').innerHTML = headerText;

          // OPTIMISTIC RENDERING: Update UI immediately with loading state
          this.renderModalTabs();
          this.renderModalProductsLoading(newStepIndex);
          this.updateModalNavigation();
          this.updateModalFooterMessaging();

          // Load products asynchronously
          await this.loadStepProducts(newStepIndex);
          this.renderModalProducts(this.currentStepIndex);
          this.updateModalFooterMessaging();

          // PRELOAD NEXT STEP
          this.preloadNextStep();
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

  showErrorUI(error) {
    this.container.innerHTML = `
      <div class="bundle-error">
        <h3>Bundle Widget Error</h3>
        <p>Failed to initialize bundle widget.</p>
        <details>
          <summary>Error Details</summary>
          <pre>${error.message}\n${error.stack}</pre>
        </details>
      </div>
    `;
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
      const bundleId = this.container?.dataset?.bundleId;
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

installModalSlotTemplate(BundleWidgetProductPage);
installCascadeTemplate(BundleWidgetProductPage);
installCogniveTemplate(BundleWidgetProductPage);

// ============================================================================
// INITIALIZATION
// ============================================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeProductPageWidget);
} else {
  initializeProductPageWidget();
}

function initializeProductPageWidget() {
  const containers = document.querySelectorAll('#bundle-builder-app');
  containers.forEach(container => {
    if (!container.dataset.initialized) {
      const bundleType = container.dataset.bundleType || 'product_page';
      if (bundleType === 'product_page') {
        new BundleWidgetProductPage(container);
      }
    }
  });
}
