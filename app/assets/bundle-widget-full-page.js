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
import { ConditionValidator } from './widgets/shared/condition-validator.js';
import { createDefaultLoadingAnimation } from './widgets/shared/default-loading-animation.js';
import { hideLoadingOverlayElement, markLoadingOverlayVisible } from './widgets/shared/loading-overlay.js';
import { bundleLevelCssMethods } from './widgets/shared/bundle-level-css-methods.js';
import { standardTemplateMethods } from './widgets/full-page/templates/standard-template.js';
import { classicTemplateMethods } from './widgets/full-page/templates/classic-template.js';
import { compactTemplateMethods } from './widgets/full-page/templates/compact-template.js';
import { horizontalTemplateMethods } from './widgets/full-page/templates/horizontal-template.js';
import { getDiscountProgressData, getSelectedQuantity, getTimelineEntryState } from './widgets/shared/engine/bundle-selectors.js';
import { renderDiscountProgress } from './widgets/shared/components/discount-progress.js';
import {
  createBundleBannerElement,
  createStepBannerImageElement,
} from './widgets/shared/components/bundle-banners.js';
import { renderSharedProductCard } from './widgets/shared/components/product-card.js';
import { renderSelectedProductRow } from './widgets/shared/components/selected-product-row.js';
import { renderSelectedProductSlots } from './widgets/shared/components/selected-product-slots.js';
import { renderStepTimelineEntry } from './widgets/shared/components/step-timeline.js';
import {
  buildCartLineDisplayProperties as buildSharedCartLineDisplayProperties,
  buildCartLineSourceProperties as buildSharedCartLineSourceProperties,
} from './widgets/shared/engine/cart-lines.js';
import { fullPageAnalyticsConfigMethods } from './widgets/full-page/methods/analytics-config-methods.js';
import { fullPageInitialRenderMethods } from './widgets/full-page/methods/initial-render-methods.js';
import { fullPageResponsiveLayoutMethods } from './widgets/full-page/methods/responsive-layout-methods.js';
import { fullPageMobileSummaryMethods } from './widgets/full-page/methods/mobile-summary-methods.js';
import { fullPageSidePanelMethods } from './widgets/full-page/methods/side-panel-methods.js';
import { fullPageBoxSelectionSidebarMethods } from './widgets/full-page/methods/box-selection-sidebar-methods.js';
import { fullPageTimelineBannerMethods } from './widgets/full-page/methods/timeline-banner-methods.js';
import { fullPageSearchCategoryMethods } from './widgets/full-page/methods/search-category-methods.js';
import { fullPageProductGridMethods } from './widgets/full-page/methods/product-grid-methods.js';
import { fullPageProductCardFooterMethods } from './widgets/full-page/methods/product-card-footer-methods.js';
import { fullPageFooterSelectionMethods } from './widgets/full-page/methods/footer-selection-methods.js';
import { fullPageValidationAddonsMethods } from './widgets/full-page/methods/validation-addons-methods.js';
import { fullPageStepFooterMethods } from './widgets/full-page/methods/step-footer-methods.js';
import { fullPageDiscountModalMethods } from './widgets/full-page/methods/discount-modal-methods.js';
import { fullPageClearCartConfirmationMethods } from './widgets/full-page/methods/clear-cart-confirmation-methods.js';
import { fullPageProductProcessingMethods } from './widgets/full-page/methods/product-processing-methods.js';
import { fullPageModalProductMethods } from './widgets/full-page/methods/modal-product-methods.js';
import { fullPageSelectionNavigationMethods } from './widgets/full-page/methods/selection-navigation-methods.js';
import { fullPageRuntimeCartSettingsMethods } from './widgets/full-page/methods/runtime-cart-settings-methods.js';
import { fullPageTierFloatingRuntimeMethods } from './widgets/full-page/methods/tier-floating-runtime-methods.js';


class BundleWidgetFullPage {

  constructor(containerElement) {
    this.container = containerElement;
    this.selectedBundle = null;
    this.selectedProducts = [];
    this.stepProductData = [];
    this.stepCollectionProductIds = {}; // { `${stepIndex}:${collectionHandle}`: [productId, ...] }
    this.selectedBoxSelectionRuleId = null;
    this.currentStepIndex = 0;
    this.isInitialized = false;
    this.config = {};
    this.elements = {};
    this.compactMobileSummaryTrayExpanded = false;
    this.standardTimelineWindowStart = 0;
    this.standardTimelineLastActiveEntryIndex = 0;

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
      await this.loadLanguageSettings();
      await this.loadControlsSettings();

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

      // Merge bundle_settings metafield into selectedBundle (Settings design display settings)
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
      this.applyBundleLevelCss(this.selectedBundle);

      // Render initial UI (async for full-page bundles to load products)
      await this.renderUI();

      // Hide overlay now that UI is fully rendered
      this.hideLoadingOverlay();

      // Storefront analytics: signal that the bundle has rendered and is interactive.
      this._emitStorefrontEvent('bundle-ready', { stepCount: this.selectedBundle?.steps?.length || 0 });

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

  // ========================================================================
  // STOREFRONT ANALYTICS EVENT TAXONOMY
  // ========================================================================
  // wpb:* CustomEvents dispatched on window so themes / GTM / Klaviyo / Meta
  // Pixel can forward to their analytics back-ends without app-side wiring.
  // Mirrors EB's gbb-* event surface (see issue wpb-storefront-analytics-events-1).
  // ========================================================================


}

Object.assign(
  BundleWidgetFullPage.prototype,
  fullPageAnalyticsConfigMethods,
  fullPageInitialRenderMethods,
  fullPageResponsiveLayoutMethods,
  fullPageMobileSummaryMethods,
  fullPageSidePanelMethods,
  fullPageBoxSelectionSidebarMethods,
  fullPageTimelineBannerMethods,
  fullPageSearchCategoryMethods,
  fullPageProductGridMethods,
  fullPageProductCardFooterMethods,
  fullPageFooterSelectionMethods,
  fullPageValidationAddonsMethods,
  fullPageStepFooterMethods,
  fullPageDiscountModalMethods,
  fullPageClearCartConfirmationMethods,
  fullPageProductProcessingMethods,
  fullPageModalProductMethods,
  fullPageSelectionNavigationMethods,
  fullPageRuntimeCartSettingsMethods,
  fullPageTierFloatingRuntimeMethods,
  bundleLevelCssMethods,
  standardTemplateMethods,
  classicTemplateMethods,
  compactTemplateMethods,
  horizontalTemplateMethods,
);

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

window.WolfpackFullPageBundle = window.WolfpackFullPageBundle || {};
window.WolfpackFullPageBundle.init = initializeFullPageWidget;
