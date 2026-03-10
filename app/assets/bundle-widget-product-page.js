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


class BundleWidgetProductPage {

  constructor(containerElement) {
    this.container = containerElement;
    this.selectedBundle = null;
    this.selectedProducts = [];
    this.stepProductData = [];
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
      this.showError(error.message);
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

      // Load and validate bundle data
      await this.loadBundleData();

      // Select appropriate bundle
      this.selectBundle();

      if (!this.selectedBundle) {
        this.hideLoadingOverlay();
        this.showFallbackUI();
        return;
      }

      // Initialize data structures
      this.initializeDataStructures();

      // Setup DOM elements
      this.setupDOMElements();

      // Render initial UI
      this.renderUI();

      // Hide overlay now that UI is rendered
      this.hideLoadingOverlay();

      // Attach event listeners
      this.attachEventListeners();

      // Mark as initialized
      this.container.dataset.initialized = 'true';
      this.isInitialized = true;

    } catch (error) {
      this.hideLoadingOverlay();
      this.showErrorUI(error);
    }
  }

  /**
   * Load Design Control Panel CSS settings
   * Injects custom CSS from Design Control Panel into the page
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

  parseConfiguration() {
    const dataset = this.container.dataset;

    this.config = {
      bundleId: dataset.bundleId || null,
      isContainerProduct: dataset.isContainerProduct === 'true',
      containerBundleId: dataset.containerBundleId || null,
      hideDefaultButtons: dataset.hideDefaultButtons === 'true',
      showTitle: dataset.showTitle !== 'false',
      showStepNumbers: dataset.showStepNumbers !== 'false',
      // Quantity selector visibility settings (default: show on card)
      showQuantitySelectorOnCard: dataset.showQuantitySelectorOnCard !== 'false',
      // Messages will be set from bundle.pricing.messages after bundle loads
      discountTextTemplate: 'Add {conditionText} to get {discountText}',
      successMessageTemplate: 'Congratulations! You got {discountText}!',
      currentProductId: window.currentProductId,
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

      // For production/storefront: show proper error
      const errorMsg = 'This widget can only be used on bundle container products. Please ensure:\n1. This product is a bundle container product\n2. Bundle has been saved and published\n3. Product has bundleConfig metafield set';
      throw new Error(errorMsg);
    }

    this.bundleData = bundleData;
  }

  selectBundle() {
    this.selectedBundle = BundleDataManager.selectBundle(this.bundleData, this.config);

    // Update message templates from bundle pricing messages
    this.updateMessagesFromBundle();
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
      addToCartButton: this.container.querySelector('.add-bundle-to-cart') || this.createAddToCartButton(),
      modal: this.ensureModal()
    };

    // Append elements if they were created
    if (!this.container.querySelector('.bundle-header')) {
      this.container.appendChild(this.elements.header);
    }
    if (!this.container.querySelector('.bundle-steps')) {
      this.container.appendChild(this.elements.stepsContainer);
    }
    if (!this.container.querySelector('.add-bundle-to-cart')) {
      this.container.appendChild(this.elements.addToCartButton);
    }
  }

  createHeader() {
    const header = document.createElement('div');
    header.className = 'bundle-header';
    header.innerHTML = `
      <h2 class="bundle-title">${ComponentGenerator.escapeHtml(this.selectedBundle.name)}</h2>
      ${this.selectedBundle.description ? `<p class="bundle-description">${ComponentGenerator.escapeHtml(this.selectedBundle.description)}</p>` : ''}
    `;
    return header;
  }

  createStepsContainer() {
    const container = document.createElement('div');
    container.className = 'bundle-steps';
    return container;
  }

  createFooter() {
    // Footer/progress bar removed by design
    const footer = document.createElement('div');
    footer.className = 'bundle-footer-messaging';
    footer.style.display = 'none';
    return footer;
  }

  createAddToCartButton() {
    const button = document.createElement('button');
    button.className = 'add-bundle-to-cart';
    button.textContent = 'Add Bundle to Cart';
    button.type = 'button';
    return button;
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
              <!-- Total Pill - Sits Above Everything -->
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

              <!-- Discount Messaging Section - Between Price and Buttons -->
              <div class="modal-footer-discount-messaging">
                <div class="footer-discount-text"></div>
              </div>

              <!-- Buttons Row - At Bottom -->
              <div class="modal-footer-buttons-row">
                <button class="modal-nav-button prev-button">BACK</button>
                <button class="modal-nav-button next-button">NEXT</button>
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

  renderUI() {
    this.renderHeader();
    this.renderSteps();
    this.renderFooter();
    this.updateAddToCartButton();
  }

  renderHeader() {
    if (!this.config.showTitle) {
      this.elements.header.style.display = 'none';
      return;
    }

    this.elements.header.style.display = 'block';
  }

  renderSteps() {
    // Clear existing steps
    this.elements.stepsContainer.innerHTML = '';

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

  // Product-page bundle layout (vertical step boxes)
  // New approach: Show one card per selected product instead of grouping by step
  renderProductPageLayout() {
    // Check if there are any selected products across all steps
    const hasAnySelections = this.selectedProducts.some(stepSelections =>
      Object.values(stepSelections || {}).some(qty => qty > 0)
    );

    if (!hasAnySelections) {
      // No selections yet - show empty state cards (one per step)
      this.selectedBundle.steps.forEach((step, index) => {
        const emptyCard = this.createEmptyStateCard(step, index);
        this.elements.stepsContainer.appendChild(emptyCard);
      });
    } else {
      // Has selections - show one card per selected product
      this.renderSelectedProductCards();
    }
  }

  // Create an empty state card for a step (shown when no products selected)
  createEmptyStateCard(step, stepIndex) {
    const stepBox = document.createElement('div');
    stepBox.className = 'step-box';
    stepBox.dataset.stepIndex = stepIndex;

    // Plus icon for empty steps
    const plusIcon = document.createElement('span');
    plusIcon.className = 'plus-icon';
    plusIcon.textContent = '+';
    stepBox.appendChild(plusIcon);

    // Add step name
    const stepName = document.createElement('p');
    stepName.className = 'step-name';
    stepName.textContent = step.name || `Step ${stepIndex + 1}`;
    stepBox.appendChild(stepName);

    // Add click handler to open modal
    stepBox.addEventListener('click', () => this.openModal(stepIndex));

    return stepBox;
  }

  // Render individual cards for each selected product
  renderSelectedProductCards() {
    // Collect all selected products with their step info
    const allSelectedProducts = [];
    const incompleteSteps = [];

    this.selectedProducts.forEach((stepSelections, stepIndex) => {
      const step = this.selectedBundle.steps[stepIndex];
      const products = this.stepProductData[stepIndex] || [];

      // Count total selected in this step
      let stepTotalQuantity = 0;

      Object.entries(stepSelections || {}).forEach(([variantId, quantity]) => {
        if (quantity > 0) {
          stepTotalQuantity += quantity;
          const product = products.find(p => {
            if ((p.variantId || p.id) === variantId) return true;
            if (p.variants) return p.variants.some(v => String(v.id) === String(variantId));
            return false;
          });
          if (product) {
            // Add one entry per quantity unit
            for (let i = 0; i < quantity; i++) {
              allSelectedProducts.push({
                product,
                stepIndex,
                step,
                variantId,
                instanceIndex: i
              });
            }
          }
        }
      });

      // Check if step is incomplete (needs more selections)
      if (!this.validateStep(stepIndex)) {
        incompleteSteps.push({ stepIndex, step, currentCount: stepTotalQuantity });
      }
    });

    // Render a card for each selected product
    allSelectedProducts.forEach((item, cardIndex) => {
      const productCard = this.createSelectedProductCard(item, cardIndex);
      this.elements.stepsContainer.appendChild(productCard);
    });

    // Render "add more" cards for incomplete steps
    incompleteSteps.forEach(({ stepIndex, step, currentCount }) => {
      const addMoreCard = this.createAddMoreCard(step, stepIndex, currentCount);
      this.elements.stepsContainer.appendChild(addMoreCard);
    });
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

    const stepBox = document.createElement('div');
    stepBox.className = 'step-box step-completed product-card-state';
    stepBox.dataset.stepIndex = stepIndex;
    stepBox.dataset.variantId = variantId;
    stepBox.dataset.cardIndex = cardIndex;

    // Add close icon badge to remove this specific product
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

    // Product image container
    const imagesContainer = document.createElement('div');
    imagesContainer.className = 'step-images single-image';

    const img = document.createElement('img');
    img.src = product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
    img.alt = product.title || '';
    img.className = 'step-image';
    imagesContainer.appendChild(img);

    stepBox.appendChild(imagesContainer);

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

  // Remove a specific product from selection (decrease quantity by 1)
  removeProductFromSelection(stepIndex, variantId) {
    const currentQuantity = this.selectedProducts[stepIndex][variantId] || 0;

    if (currentQuantity > 1) {
      // Decrease quantity
      this.selectedProducts[stepIndex][variantId] = currentQuantity - 1;
    } else {
      // Remove completely
      delete this.selectedProducts[stepIndex][variantId];
    }

    // Update UI
    this.renderSteps();
    this.updateAddToCartButton();
    this.updateFooterMessaging();

    // Show toast notification
    ToastManager.show('Product removed from bundle');
  }

  // Full-page bundle layout (horizontal tabs)
  renderFullPageLayout() {
    // TODO: Implement tabs-based layout for full-page bundles
    // For now, use the same layout as product-page until custom UI is provided

    // Temporary: Render same as product-page layout
    // This will be replaced with custom tabs UI later
    this.renderProductPageLayout();

    // Add visual indicator that this is a full-page bundle
    const indicator = document.createElement('div');
    indicator.style.cssText = 'padding: 8px; background: #e3f2fd; border-radius: 4px; margin-bottom: 12px; text-align: center; font-size: 12px; color: #1976d2;';
    indicator.textContent = 'Full-Page Bundle Mode (Custom layout will be applied)';
    this.elements.stepsContainer.insertBefore(indicator, this.elements.stepsContainer.firstChild);
  }

  clearStepSelections(stepIndex) {
    // Clear all product selections for this step
    this.selectedProducts[stepIndex] = {};

    // Update UI
    this.renderSteps();
    this.updateAddToCartButton();
    this.updateFooterMessaging();

    // Show toast notification
    ToastManager.show(`All selections cleared from this step`);
  }

  renderFooter() {
    // Footer/progress bar removed by design
    return;
  }

  updateFooterMessaging() {
    // Footer/progress bar removed by design
    return;
  }

  updateAddToCartButton() {
    const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData
    );

    const discountInfo = PricingCalculator.calculateDiscount(
      this.selectedBundle,
      totalPrice,
      totalQuantity
    );

    const button = this.elements.addToCartButton;

    // Check if all steps are complete (required)
    const allStepsValid = this.selectedBundle.steps.every((_, index) => this.validateStep(index));

    // Disable button if no products selected OR if not all steps are complete
    if (totalQuantity === 0 || !allStepsValid) {
      if (totalQuantity === 0) {
        button.textContent = 'Add Bundle to Cart';
      } else {
        // Some products selected but not all steps complete
        button.textContent = 'Complete All Steps to Continue';
      }
      button.disabled = true;
      button.classList.add('disabled');
      this.updateDiscountPill(null);
    } else {
      // All steps valid and products selected - enable button
      const currencyInfo = CurrencyManager.getCurrencyInfo();
      const formattedPrice = CurrencyManager.formatMoney(discountInfo.finalPrice, currencyInfo.display.format);

      if (discountInfo.hasDiscount && this.selectedBundle.pricing?.messages?.showDiscountDisplay !== false) {
        const originalPrice = CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format);

        // Calculate discount percentage for the top-right pill
        const discountPercentage = Math.round(((totalPrice - discountInfo.finalPrice) / totalPrice) * 100);
        this.updateDiscountPill(discountPercentage > 0 ? discountPercentage : null);

        button.innerHTML = `
          <span class="button-price-wrapper">
            <span class="button-price-strike">${originalPrice}</span>
            <span class="button-price-final">Add Bundle to Cart &bull; ${formattedPrice}</span>
          </span>
        `;
      } else {
        button.textContent = `Add Bundle to Cart \u2022 ${formattedPrice}`;
        this.updateDiscountPill(null);
      }

      button.disabled = false;
      button.classList.remove('disabled');
    }
  }

  // Update or create the discount pill in the top-right of the widget
  updateDiscountPill(discountPercentage) {
    let pill = this.container.querySelector('.bundle-discount-pill');

    if (!discountPercentage) {
      // Remove pill if no discount
      if (pill) pill.remove();
      return;
    }

    if (!pill) {
      pill = document.createElement('span');
      pill.className = 'bundle-discount-pill';
      this.container.appendChild(pill);
    }

    pill.textContent = `${discountPercentage}% off`;
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

    // Show modal immediately
    modal.style.display = 'block';
    modal.classList.add('active');
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
    this.elements.modal.style.display = 'none';
    this.elements.modal.classList.remove('active');
    document.body.style.overflow = '';

    // Update main UI
    this.renderSteps();
    this.updateAddToCartButton();
    this.updateFooterMessaging();
  }

  async loadStepProducts(stepIndex) {
    const step = this.selectedBundle.steps[stepIndex];

    if (this.stepProductData[stepIndex].length > 0) {
      return;
    }

    let allProducts = [];
    let fetchFailed = false;

    const shop = window.Shopify?.shop || window.location.host;
    const apiBaseUrl = window.__BUNDLE_APP_URL__ || window.location.origin;

    // Source 1: product-based step — step.products contains GIDs from StepProduct entries
    if (step.products && Array.isArray(step.products) && step.products.length > 0) {
      const productIds = step.products.map(p => p.id);
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

    // Source 2: collection-based step — step.collections contains { handle, id, title }
    if (step.collections && Array.isArray(step.collections) && step.collections.length > 0) {
      const handles = step.collections.map(c => c.handle).filter(Boolean);
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

    // Store fetch failure state so renderModalProducts can show a proper error
    if (!this._stepFetchFailed) this._stepFetchFailed = {};
    this._stepFetchFailed[stepIndex] = fetchFailed && this.stepProductData[stepIndex].length === 0;
  }

  processProductsForStep(products, step) {
    return products.flatMap(product => {
      if (step.displayVariantsAsIndividual && product.variants && product.variants.length > 0) {
        // Display each variant as separate product - filter out unavailable variants
        // Preserve parent product reference for variant selection and tracking
        const processedVariants = (product.variants || []).map(v => ({
          id: this.extractId(v.id),
          title: v.title,
          price: parseFloat(v.price || '0') * 100,
          compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) * 100 : null,
          available: v.available === true,
          option1: v.option1 || null,
          option2: v.option2 || null,
          option3: v.option3 || null,
          image: v.image || null
        }));

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
        const defaultVariant = product.variants?.[0];

        // Skip product if default variant is not available
        if (defaultVariant && defaultVariant.available !== true) {
          return [];
        }

        // Storefront API: prioritize variant image, fallback to product featured image
        const imageUrl = defaultVariant?.image?.src || product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;

        // Process variants array for variant selection in modal
        const processedVariants = (product.variants || []).map(v => ({
          id: this.extractId(v.id),
          title: v.title,
          price: parseFloat(v.price || '0') * 100,
          compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) * 100 : null,
          available: v.available === true,
          option1: v.option1 || null,
          option2: v.option2 || null,
          option3: v.option3 || null,
          image: v.image || null
        }));

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
          available: defaultVariant?.available === true,
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
        // Re-check accessibility at click time (not stale closure from render time)
        if (!this.isStepAccessible(index)) {
          ToastManager.show('Please complete the previous steps first.');
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

    productGrid.innerHTML = products.map(product => {
      const selectionKey = product.variantId || product.id;
      const currentQuantity = selectedProducts[selectionKey] || 0;
      const currencyInfo = CurrencyManager.getCurrencyInfo();

      return `
        <div class="product-card ${currentQuantity > 0 ? 'selected' : ''}" data-product-id="${selectionKey}">
          ${currentQuantity > 0 ? `
            <div class="selected-overlay">✓</div>
          ` : ''}

          <div class="product-image">
            <img src="${product.imageUrl}" alt="${ComponentGenerator.escapeHtml(product.title)}" loading="lazy">
          </div>

          <div class="product-content-wrapper">
            <div class="product-title">${ComponentGenerator.escapeHtml(product.title)}</div>

            ${product.price ? `
              <div class="product-price-row">
                ${product.compareAtPrice ? `<span class="product-price-strike">${CurrencyManager.formatMoney(product.compareAtPrice, currencyInfo.display.format)}</span>` : ''}
                <span class="product-price">${CurrencyManager.formatMoney(product.price, currencyInfo.display.format)}</span>
              </div>
            ` : ''}

            <div class="product-spacer"></div>

            ${this.renderVariantSelector(product)}

            ${showQuantitySelector ? `
              <div class="product-quantity-wrapper">
                <div class="product-quantity-selector">
                  <button class="qty-btn qty-decrease" data-product-id="${selectionKey}">−</button>
                  <span class="qty-display">${currentQuantity}</span>
                  <button class="qty-btn qty-increase" data-product-id="${selectionKey}">+</button>
                </div>
              </div>
            ` : ''}

            <button class="product-add-btn ${currentQuantity > 0 ? 'added' : ''}" data-product-id="${selectionKey}">
              ${currentQuantity > 0 ? 'Added to Bundle' : 'Add to Bundle'}
            </button>
          </div>
        </div>
      `;
    }).join('');

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
          ${product.variants.map(v => `
            <option value="${v.id}" ${v.id === product.variantId ? 'selected' : ''}>${v.title}</option>
          `).join('')}
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
          const currentQuantity = this.selectedProducts[stepIndex][productId] || 0;
          this.updateProductSelection(stepIndex, productId, currentQuantity > 0 ? 0 : 1);
        }
      }
    });

    // Product image/title click - open variant modal if product has variants
    newProductGrid.addEventListener('click', (e) => {
      const productImage = e.target.closest('.product-image');
      const productTitle = e.target.closest('.product-title');

      if (productImage || productTitle) {
        const productCard = e.target.closest('.product-card');
        if (productCard && this.productModal) {
          const productId = productCard.dataset.productId;
          const product = findProduct(productId);

          if (product && product.variants && product.variants.length > 1 && step) {
            // Product has variants - open modal for selection
            this.productModal.open(product, step);
          }
        }
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
            const oldVariantId = product.variantId;

            // Move quantity from old variant to new variant
            const oldQuantity = this.selectedProducts[stepIndex][oldVariantId] || 0;
            if (oldQuantity > 0) {
              delete this.selectedProducts[stepIndex][oldVariantId];
              this.selectedProducts[stepIndex][newVariantId] = oldQuantity;
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

    // Add cursor pointer styles to product images and titles for products with variants
    newProductGrid.querySelectorAll('.product-card').forEach(card => {
      const productId = card.dataset.productId;
      const product = findProduct(productId);
      if (product && product.variants && product.variants.length > 1 && this.productModal) {
        const imageEl = card.querySelector('.product-image');
        const titleEl = card.querySelector('.product-title');
        if (imageEl) imageEl.style.cursor = 'pointer';
        if (titleEl) titleEl.style.cursor = 'pointer';
      }
    });
  }
  updateProductSelection(stepIndex, productId, newQuantity) {
    const quantity = Math.max(0, newQuantity);

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

    // Update UI without re-rendering the entire modal (prevents event listener duplication)
    this.updateProductQuantityDisplay(stepIndex, productId, quantity);
    this.renderModalTabs();
    this.updateModalNavigation();
    this.updateModalFooterMessaging();
    this.updateAddToCartButton();
    this.updateFooterMessaging();
  }

  updateProductQuantityDisplay(stepIndex, productId, quantity) {
    // Update quantity display without full re-render
    const scope = this.elements.modal?.style.display === 'block'
      ? this.elements.modal
      : this.container;
    const productCard = scope.querySelector(`[data-product-id="${productId}"]`);
    if (productCard) {
      const quantityDisplay = productCard.querySelector('.qty-display');
      const addBtn = productCard.querySelector('.product-add-btn');
      const selectedOverlay = productCard.querySelector('.selected-overlay');

      if (quantityDisplay) {
        quantityDisplay.textContent = quantity;
      }

      if (addBtn) {
        if (quantity > 0) {
          addBtn.textContent = 'Added to Bundle';
          addBtn.classList.add('added');
        } else {
          addBtn.textContent = 'Add to Bundle';
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
    return ConditionValidator.isStepConditionSatisfied(step, currentSelections);
  }

  isStepAccessible(stepIndex) {
    // Check if all previous steps are completed
    for (let i = 0; i < stepIndex; i++) {
      if (!this.validateStep(i)) {
        return false;
      }
    }
    return true;
  }

  updateModalNavigation() {
    const prevButton = this.elements.modal?.querySelector('.prev-button');
    const nextButton = this.elements.modal?.querySelector('.next-button');

    if (!prevButton || !nextButton) return;

    prevButton.disabled = this.currentStepIndex === 0;

    const isCurrentStepValid = this.validateStep(this.currentStepIndex);

    if (this.currentStepIndex === this.selectedBundle.steps.length - 1) {
      nextButton.textContent = 'Done';
      nextButton.disabled = !isCurrentStepValid;
    } else {
      nextButton.textContent = 'Next';
      nextButton.disabled = !isCurrentStepValid;
    }
  }

  updateModalFooterMessaging() {
    const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData
    );

    const discountInfo = PricingCalculator.calculateDiscount(
      this.selectedBundle,
      totalPrice,
      totalQuantity
    );

    const currencyInfo = CurrencyManager.getCurrencyInfo();

    // Update modal header text dynamically
    this.updateModalHeaderText(totalPrice, totalQuantity, discountInfo, currencyInfo);

    // Update cart badge with total item count
    const cartBadge = this.elements.modal.querySelector('.cart-badge-count');
    if (cartBadge) {
      cartBadge.textContent = totalQuantity.toString();
    }

    // Update total prices in the footer pill
    this.updateFooterTotalPrices(totalPrice, discountInfo, currencyInfo);

    // Update discount messaging and progress bar
    this.updateModalDiscountMessaging(totalPrice, totalQuantity, discountInfo, currencyInfo);
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
    const discountSection = this.elements.modal.querySelector('.modal-footer-discount-messaging');

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
      strikePriceEl.textContent = CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format);
      strikePriceEl.style.display = 'inline';
      finalPriceEl.textContent = CurrencyManager.formatMoney(discountInfo.finalPrice, currencyInfo.display.format);
    } else {
      // Show only regular price
      strikePriceEl.style.display = 'none';
      finalPriceEl.textContent = CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format);
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
    requestAnimationFrame(() => overlay.classList.add('is-visible'));
  }

  hideLoadingOverlay() {
    const overlay = this.container?.querySelector('.bundle-loading-overlay');
    if (!overlay) return;
    overlay.classList.remove('is-visible');
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
  }

  // ========================================================================
  // CART OPERATIONS
  // ========================================================================

  async addToCart() {
    try {
      const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
        this.selectedProducts,
        this.stepProductData
      );

      if (totalQuantity === 0) {
        ToastManager.show('Please select products for your bundle before adding to cart.');
        return;
      }

      // Validate all steps
      const allStepsValid = this.selectedBundle.steps.every((_, index) => this.validateStep(index));
      if (!allStepsValid) {
        ToastManager.show('Please complete all bundle steps before adding to cart.');
        return;
      }

      const cartItems = this.buildCartItems();

      // Disable button and show loading overlay during request
      this.elements.addToCartButton.disabled = true;
      this.elements.addToCartButton.textContent = 'Adding to Cart...';
      this.showLoadingOverlay(this.selectedBundle?.loadingGif || null);

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: cartItems })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Cart add failed: ${response.status}`);
      }

      const result = await response.json();

      // Show success message and redirect
      ToastManager.show('Bundle added to cart successfully!');

      setTimeout(() => {
        window.location.href = '/cart';
      }, 1000);

    } catch (error) {
      ToastManager.show(`Failed to add bundle to cart: ${error.message}`);
    } finally {
      // Re-enable button and hide overlay
      this.hideLoadingOverlay();
      this.updateAddToCartButton();
    }
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

    this.selectedProducts.forEach((stepSelections, stepIndex) => {
      const productsInStep = this.stepProductData[stepIndex];

      Object.entries(stepSelections).forEach(([variantId, quantity]) => {
        if (quantity > 0) {
          const product = productsInStep.find(p => (p.variantId || p.id) === variantId);
          if (product) {
            // Check availability before adding to cart
            if (product.available !== true) {
              unavailableProducts.push(product.title);
              return; // Skip this product
            }


            const cartItem = {
              id: parseInt(this.extractId(variantId)),
              quantity: quantity,
              properties: {
                '_bundle_id': bundleInstanceId,
                '_bundle_name': this.selectedBundle.name,
                '_step_index': stepIndex.toString()
              }
            };

            cartItems.push(cartItem);
          }
        }
      });
    });


    // Throw error if any products are unavailable
    if (unavailableProducts.length > 0) {
      const productList = unavailableProducts.join(', ');
      throw new Error(`The following product${unavailableProducts.length > 1 ? 's are' : ' is'} currently unavailable: ${productList}. Please remove ${unavailableProducts.length > 1 ? 'them' : 'it'} from your bundle or try again later.`);
    }

    return cartItems;
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
      // Previous step
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
      } else {
        ToastManager.show('Please meet the quantity conditions for the current step before going back.');
      }
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
}

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
