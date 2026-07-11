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
import { bundleLevelCssMethods } from './widgets/shared/bundle-level-css-methods.js';
import { modalSlotTemplateMethods } from './widgets/product-page/templates/modal-slot-template.js';
import { cascadeTemplateMethods } from './widgets/product-page/templates/cascade-template.js';
import { cogniveTemplateMethods } from './widgets/product-page/templates/cognive-template.js';
import { ppbExpandSingleStepCategoriesAsSteps } from './widgets/product-page/single-step-categories.js';
import { getDiscountProgressData, getSelectedQuantity } from './widgets/shared/engine/bundle-selectors.js';
import { renderDiscountProgress } from './widgets/shared/components/discount-progress.js';
import { renderSharedProductCard } from './widgets/shared/components/product-card.js';
import { ProductPageCartMethods } from './widgets/product-page/methods/cart-methods.js';
import { ProductPageModalMethods } from './widgets/product-page/methods/modal-methods.js';
import { ProductPageSelectionMethods } from './widgets/product-page/methods/selection-methods.js';
import { ProductPageProductDataMethods } from './widgets/product-page/methods/product-data-methods.js';
import { ProductPageSelectionDataMethods } from './widgets/product-page/methods/selection-data-methods.js';
import { ProductPageLayoutShellMethods } from './widgets/product-page/methods/layout-shell-methods.js';
import { ProductPageInpageRenderMethods } from './widgets/product-page/methods/inpage-render-methods.js';
import { ProductPageConfigLifecycleMethods } from './widgets/product-page/methods/config-lifecycle-methods.js';
import { ProductPageDefaultProductMethods } from './widgets/product-page/methods/default-product-methods.js';
import { ProductPageDomMethods } from './widgets/product-page/methods/dom-methods.js';
import { ProductPageFooterModalStateMethods } from './widgets/product-page/methods/footer-modal-state-methods.js';
import { ProductPageModalStateMethods } from './widgets/product-page/methods/modal-state-methods.js';
import { ProductPageWidgetMiscMethods } from './widgets/product-page/methods/widget-misc-methods.js';


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

  getSharedSelectedQuantity() {
    return getSelectedQuantity({
      selectedProducts: this.selectedProducts,
      stepProductData: this.stepProductData,
    });
  }

  async init() {
    try {
      // Check if already initialized
      if (this.container.dataset.initialized === 'true') {
        return;
      }

      // Parse configuration
      this.parseConfiguration();

      // Show loading overlay immediately with fallback spinner while bundle config loads.
      this.showLoadingOverlay(null);
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Load design settings CSS
      await this.loadDesignSettingsCSS();
      await this.loadLanguageSettings();
      await this.loadControlsSettings();

      // Load and validate bundle data
      await this.loadBundleData();

      // loadBundleData() hides the container and returns early on non-bundle products
      if (!this.bundleData) return;

      // Select appropriate bundle
      this.selectBundle();

      if (this.selectedBundle?.loadingGif) {
        this.showLoadingOverlay(this.selectedBundle.loadingGif);
      }

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
      await this.ensureProductPageTemplateStylesheet(this._getProductPageTemplateType(), this._getProductPageDesignPreset());
      this.applyBundleLevelCss(this.selectedBundle);

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


}

Object.assign(
  BundleWidgetProductPage.prototype,
  ProductPageConfigLifecycleMethods,
  ProductPageDefaultProductMethods,
  ProductPageDomMethods,
  ProductPageFooterModalStateMethods,
  ProductPageModalStateMethods,
  ProductPageWidgetMiscMethods,
  ProductPageLayoutShellMethods,
  ProductPageInpageRenderMethods,
  ProductPageProductDataMethods,
  ProductPageSelectionDataMethods,
  ProductPageModalMethods,
  ProductPageSelectionMethods,
  ProductPageCartMethods,
  bundleLevelCssMethods,
  modalSlotTemplateMethods,
  cascadeTemplateMethods,
  cogniveTemplateMethods,
);

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
