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

console.log('[PRODUCT_PAGE_WIDGET] Initializing...');

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
      console.log('[PDP_WIDGET] ✅ BundleProductModal initialized');
    } else {
      console.warn('[PDP_WIDGET] ⚠️ BundleProductModal not loaded, variant modal disabled');
    }

    // Call async init but don't block constructor
    this.init().catch(error => {
      console.error('[WIDGET_INIT] ❌ Initialization failed:', error);
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

      // Load design settings CSS
      await this.loadDesignSettingsCSS();

      // Load and validate bundle data
      await this.loadBundleData();

      // Select appropriate bundle
      this.selectBundle();

      if (!this.selectedBundle) {
        this.showFallbackUI();
        return;
      }

      // Initialize data structures
      this.initializeDataStructures();

      // Setup DOM elements
      this.setupDOMElements();

      // Render initial UI
      this.renderUI();

      // Attach event listeners
      this.attachEventListeners();

      // Mark as initialized
      this.container.dataset.initialized = 'true';
      this.isInitialized = true;

    } catch (error) {
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
        console.warn('[BUNDLE_WIDGET] No shop domain found, skipping design settings');
        return;
      }

      // CSS is loaded by the small loader (bundle-widget.js) for better performance
      // No need to load it here - just verify it's present
      const existingLink = document.querySelector('link[href*="design-settings"]');
      if (existingLink) {
        console.log('[BUNDLE_WIDGET] ✅ Design CSS already loaded by loader script');
      } else {
        console.warn('[BUNDLE_WIDGET] ⚠️ Design CSS not found - loader script may have failed');
      }

    } catch (error) {
      console.warn('[BUNDLE_WIDGET] Failed to load design settings CSS:', error);
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
      showFooterMessaging: dataset.showFooterMessaging !== 'false',
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
          console.log('[WIDGET_INIT] ✅ Loaded bundle data from data-bundle-config:', singleBundle.id);
        } else {
          console.warn('[WIDGET_INIT] ⚠️ Parsed bundle config is invalid (missing id):', singleBundle);
        }
      } catch (error) {
        console.error('[WIDGET_INIT] ❌ Failed to parse data-bundle-config:', error, 'Value:', configValue.substring(0, 100));
      }
    } else {
      console.warn('[WIDGET_INIT] ⚠️ data-bundle-config is empty, null, or undefined:', configValue);
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
        console.log('[WIDGET_INIT] 🎨 Theme editor preview mode - showing placeholder');
        this.showThemeEditorPreview(bundleIdFromDataset);
        return; // Don't throw error, just show preview
      }

      // For production/storefront: show proper error
      const errorMsg = 'This widget can only be used on bundle container products. Please ensure:\n1. This product is a bundle container product\n2. Bundle has been saved and published\n3. Product has bundleConfig metafield set';
      console.error('[WIDGET_INIT] ❌', errorMsg);
      console.error('[WIDGET_INIT] 🔍 Debug info:', {
        isContainerProduct: !!configValue,
        configValue: configValue?.substring(0, 100),
        containerDataset: this.container.dataset,
        bundleIdFromDataset: bundleIdFromDataset
      });
      throw new Error(errorMsg);
    }

    this.bundleData = bundleData;
    console.log('[WIDGET_INIT] ✅ Bundle data loaded successfully from container product metafield');
  }

  selectBundle() {
    this.selectedBundle = BundleDataManager.selectBundle(this.bundleData, this.config);

    // Update message templates from bundle pricing messages
    this.updateMessagesFromBundle();
  }

  updateMessagesFromBundle() {
    // Use bundle pricing messages if available, otherwise keep defaults
    if (this.selectedBundle?.pricing?.messages) {
      const messages = this.selectedBundle.pricing.messages;

      if (messages.progress) {
        this.config.discountTextTemplate = messages.progress;
      }

      if (messages.qualified) {
        this.config.successMessageTemplate = messages.qualified;
      }

      console.log('[BUNDLE_MESSAGES] Using bundle pricing messages:', {
        progress: this.config.discountTextTemplate,
        qualified: this.config.successMessageTemplate
      });
    } else {
      console.log('[BUNDLE_MESSAGES] No pricing messages in bundle, using defaults');
    }
  }

  initializeDataStructures() {
    const stepsCount = this.selectedBundle.steps.length;

    // Initialize selected products array (one object per step)
    this.selectedProducts = Array(stepsCount).fill(null).map(() => ({}));

    // Initialize step product data cache
    this.stepProductData = Array(stepsCount).fill(null).map(() => ([]));
  }

  /**
   * Show a helpful preview in theme editor when testing on non-bundle products
   */
  showThemeEditorPreview(bundleId) {
    console.log('[WIDGET_PREVIEW] Showing theme editor preview for bundle:', bundleId);

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
    if (!this.container.querySelector('.bundle-footer-messaging')) {
      this.container.appendChild(this.elements.footer);
    }
    if (!this.container.querySelector('.add-bundle-to-cart')) {
      this.container.appendChild(this.elements.addToCartButton);
    }
  }

  createHeader() {
    const header = document.createElement('div');
    header.className = 'bundle-header';
    header.innerHTML = `
      <h2 class="bundle-title">${this.selectedBundle.name}</h2>
      ${this.selectedBundle.description ? `<p class="bundle-description">${this.selectedBundle.description}</p>` : ''}
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
      <div class="footer-progress-container">
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
        <div class="progress-details">
          <span class="progress-text">
            <span class="current-quantity">0</span> / <span class="target-quantity">0</span>
          </span>
        </div>
      </div>
    `;
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

              <!-- Progress Bar Section -->
              <div class="modal-footer-progress-section">
                <div class="modal-footer-progress-bar">
                  <div class="modal-footer-progress-fill"></div>
                </div>
                <div class="modal-footer-progress-details">
                  <span class="current-quantity">0</span> / <span class="target-quantity">0</span> items
                </div>
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

    // Add selection instruction
    const selectionCount = document.createElement('div');
    selectionCount.className = 'step-selection-count';
    if (step.conditionValue) {
      selectionCount.textContent = `Select ${step.conditionValue} product${step.conditionValue > 1 ? 's' : ''}`;
    }
    stepBox.appendChild(selectionCount);

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
          const product = products.find(p => (p.variantId || p.id) === variantId);
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
    const requiredCount = step.conditionValue || 1;
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
    img.src = product.imageUrl || 'https://via.placeholder.com/150';
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

    // Add click handler to open modal for editing
    stepBox.addEventListener('click', () => this.openModal(stepIndex));

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
    console.log('[BUNDLE_WIDGET] Full-page bundle detected - using tabs layout');

    // Temporary: Render same as product-page layout
    // This will be replaced with custom tabs UI later
    this.renderProductPageLayout();

    // Add visual indicator that this is a full-page bundle
    const indicator = document.createElement('div');
    indicator.style.cssText = 'padding: 8px; background: #e3f2fd; border-radius: 4px; margin-bottom: 12px; text-align: center; font-size: 12px; color: #1976d2;';
    indicator.textContent = 'Full-Page Bundle Mode (Custom layout will be applied)';
    this.elements.stepsContainer.insertBefore(indicator, this.elements.stepsContainer.firstChild);
  }

  // Legacy method - kept for reference but no longer used
  // New approach uses createEmptyStateCard, createSelectedProductCard, and createAddMoreCard
  getStepSelectionText(selectedProducts) {
    const totalSelected = Object.values(selectedProducts).reduce((sum, qty) => sum + (qty || 0), 0);
    return totalSelected > 0 ? `${totalSelected} selected` : '';
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
    const variables = TemplateManager.createDiscountVariables(
      this.selectedBundle,
      totalPrice,
      totalQuantity,
      discountInfo,
      currencyInfo
    );

    const footerDiscountText = this.elements.footer.querySelector('.footer-discount-text');
    const progressFill = this.elements.footer.querySelector('.progress-fill');
    const currentQuantitySpan = this.elements.footer.querySelector('.current-quantity');
    const targetQuantitySpan = this.elements.footer.querySelector('.target-quantity');

    if (discountInfo.qualifiesForDiscount) {
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

    // Update progress bar based on condition type
    const nextRule = PricingCalculator.getNextDiscountRule(this.selectedBundle, totalQuantity, totalPrice);
    const ruleToUse = discountInfo.applicableRule || nextRule;

    let progressPercentage = 0;

    if (ruleToUse) {
      const conditionType = ruleToUse.condition?.type || 'quantity';
      const targetValue = ruleToUse.condition?.value || 0;

      if (conditionType === 'amount') {
        // Amount-based condition
        progressPercentage = targetValue > 0 ? Math.min(100, (totalPrice / targetValue) * 100) : 0;

        // Update text to show formatted currency values
        if (currentQuantitySpan && targetQuantitySpan) {
          const currentFormatted = CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format);
          const targetFormatted = CurrencyManager.formatMoney(targetValue, currencyInfo.display.format);
          currentQuantitySpan.textContent = currentFormatted;
          targetQuantitySpan.textContent = targetFormatted; // No "items" suffix for amount
        }
      } else {
        // Quantity-based condition
        progressPercentage = targetValue > 0 ? Math.min(100, (totalQuantity / targetValue) * 100) : 0;

        // Update text to show quantity values
        if (currentQuantitySpan && targetQuantitySpan) {
          currentQuantitySpan.textContent = totalQuantity.toString();
          targetQuantitySpan.textContent = targetValue.toString(); // Remove "items" suffix, add via CSS
        }
      }
    }

    console.log('[PROGRESS] Progress:', progressPercentage + '%', 'Total:', totalPrice, 'Target:', ruleToUse?.condition?.value);

    if (progressFill) {
      progressFill.style.width = `${progressPercentage}%`;
    }
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
    } else {
      // All steps valid and products selected - enable button
      const currencyInfo = CurrencyManager.getCurrencyInfo();
      const formattedPrice = CurrencyManager.formatMoney(discountInfo.finalPrice, currencyInfo.display.format);

      console.log('[ADD_TO_CART_BUTTON] Discount info:', {
        hasDiscount: discountInfo.hasDiscount,
        showDiscountDisplay: this.selectedBundle.pricing?.messages?.showDiscountDisplay,
        shouldShowStrikethrough: discountInfo.hasDiscount && this.selectedBundle.pricing?.messages?.showDiscountDisplay !== false
      });

      if (discountInfo.hasDiscount && this.selectedBundle.pricing?.messages?.showDiscountDisplay !== false) {
        const originalPrice = CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format);
        console.log('[ADD_TO_CART_BUTTON] Showing strikethrough:', { originalPrice, discountedPrice: formattedPrice });

        // Calculate discount percentage for the pill
        const discountPercentage = Math.round(((totalPrice - discountInfo.finalPrice) / totalPrice) * 100);
        const showDiscountPill = discountPercentage > 0;

        button.innerHTML = `
          <span class="button-price-wrapper">
            <span class="button-price-strike">${originalPrice}</span>
            <span class="button-price-final">Add Bundle to Cart • ${formattedPrice}</span>
            ${showDiscountPill ? `<span class="discount-pill">${discountPercentage}% off</span>` : ''}
          </span>
        `;
      } else {
        console.log('[ADD_TO_CART_BUTTON] No strikethrough shown');
        button.textContent = `Add Bundle to Cart • ${formattedPrice}`;
      }

      button.disabled = false;
      button.classList.remove('disabled');
    }
  }
  // ========================================================================
  // MODAL FUNCTIONALITY
  // ========================================================================

  // Helper method to get formatted header text
  getFormattedHeaderText() {
    // If discount is not enabled, show step name
    if (!this.selectedBundle?.pricing?.enabled) {
      const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
      return currentStep?.name || `Step ${this.currentStepIndex + 1}`;
    }

    const { totalQuantity, totalPrice } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData
    );
    const discountInfo = PricingCalculator.calculateDiscount(
      this.selectedBundle,
      totalPrice,
      totalQuantity
    );
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const variables = TemplateManager.createDiscountVariables(
      this.selectedBundle,
      totalPrice,
      totalQuantity,
      discountInfo,
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

    // OPTIMISTIC RENDERING: Show modal immediately with loading state
    this.renderModalTabs();
    this.renderModalProductsLoading(stepIndex);
    this.updateModalNavigation();
    this.updateModalFooterMessaging();

    // Show modal immediately
    modal.style.display = 'block';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Load products asynchronously and update
    this.loadStepProducts(stepIndex).then(() => {
      this.renderModalProducts(stepIndex);
      this.updateModalFooterMessaging();

      // PRELOAD NEXT STEP
      this.preloadNextStep();
    }).catch(error => {
      const productGrid = this.elements.modal.querySelector('.product-grid');
      productGrid.innerHTML = '<p class="error-message">Failed to load products. Please try again.</p>';
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

    console.log('[LOAD_PRODUCTS] Step data:', {
      stepIndex,
      hasProducts: !!step.products,
      productsLength: step.products?.length,
      hasStepProduct: !!step.StepProduct,
      stepProductLength: step.StepProduct?.length,
      hasCollections: !!step.collections,
      collectionsLength: step.collections?.length,
      fullStep: step
    });

    let allProducts = [];

    // Process explicit products - fetch using Storefront API via our backend
    if (step.products && Array.isArray(step.products) && step.products.length > 0) {
      const productIds = step.products.map(p => p.id); // Keep full GID format
      const shop = window.Shopify?.shop || window.location.host;

      // Get app URL from widget data attribute or window global
      const appUrl = window.__BUNDLE_APP_URL__ || '';
      const apiBaseUrl = appUrl || window.location.origin;

      console.log('[LOAD_PRODUCTS] Fetching products from Storefront API. IDs:', productIds);
      console.log('[LOAD_PRODUCTS] Using API base URL:', apiBaseUrl);

      try {
        const response = await fetch(`${apiBaseUrl}/api/storefront-products?ids=${encodeURIComponent(productIds.join(','))}&shop=${encodeURIComponent(shop)}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[LOAD_PRODUCTS] API request failed:', response.status, errorText);
          return;
        }

        const data = await response.json();
        console.log('[LOAD_PRODUCTS] API response:', data);

        if (data.products && data.products.length > 0) {
          allProducts = allProducts.concat(data.products);
          console.log('[LOAD_PRODUCTS] Added', data.products.length, 'products');
        } else {
          console.warn('[LOAD_PRODUCTS] No products returned');
        }
      } catch (error) {
        console.error('[LOAD_PRODUCTS] Error fetching products:', error);
      }
    }

    if (step.StepProduct && Array.isArray(step.StepProduct) && step.StepProduct.length > 0) {
      const productGids = step.StepProduct.map(sp => sp.productId).filter(Boolean);
      const shop = window.Shopify?.shop || window.location.host;

      if (productGids.length > 0) {
        console.log('[LOAD_PRODUCTS] Fetching StepProduct data. IDs:', productGids);

        // Get app URL (same as above)
        const appUrl = window.__BUNDLE_APP_URL__ || '';
        const apiBaseUrl = appUrl || window.location.origin;

        try {
          const response = await fetch(`${apiBaseUrl}/api/storefront-products?ids=${encodeURIComponent(productGids.join(','))}&shop=${encodeURIComponent(shop)}`);

          if (!response.ok) {
            console.error('[LOAD_PRODUCTS] API request failed for StepProduct:', response.status);
          } else {
            const data = await response.json();
            if (data.products && data.products.length > 0) {
              allProducts = allProducts.concat(data.products);
              console.log('[LOAD_PRODUCTS] Added', data.products.length, 'StepProducts');
            }
          }
        } catch (error) {
          console.error('[LOAD_PRODUCTS] Error fetching StepProduct:', error);
        }
      }
    }

    // Process collection products using Storefront API (not legacy REST endpoint)
    if (step.collections && Array.isArray(step.collections) && step.collections.length > 0) {
      const collectionHandles = step.collections
        .map(c => c.handle)
        .filter(Boolean);

      if (collectionHandles.length > 0) {
        const shop = window.Shopify?.shop || window.location.host;
        const appUrl = window.__BUNDLE_APP_URL__ || '';
        const apiBaseUrl = appUrl || window.location.origin;

        console.log('[LOAD_PRODUCTS] Fetching products from collections via Storefront API:', collectionHandles);

        try {
          const response = await fetch(
            `${apiBaseUrl}/api/storefront-collections?handles=${encodeURIComponent(collectionHandles.join(','))}&shop=${encodeURIComponent(shop)}`
          );

          if (response.ok) {
            const data = await response.json();
            if (data.products && data.products.length > 0) {
              allProducts = allProducts.concat(data.products);
              console.log('[LOAD_PRODUCTS] Added', data.products.length, 'products from collections');
            }
          } else {
            console.error('[LOAD_PRODUCTS] Failed to fetch collection products:', response.status);
          }
        } catch (error) {
          console.error('[LOAD_PRODUCTS] Error fetching collection products:', error);
        }
      }
    }

    // Process and normalize product data
    console.log('[LOAD_PRODUCTS] Raw products for step', stepIndex, ':', allProducts.length, 'products');
    console.log('[LOAD_PRODUCTS] First product sample:', allProducts[0]);

    const processedProducts = this.processProductsForStep(allProducts, step);

    console.log('[LOAD_PRODUCTS] Processed products:', processedProducts.length);
    console.log('[LOAD_PRODUCTS] First processed:', processedProducts[0]);

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

    console.log('[LOAD_PRODUCTS] Final stepProductData[' + stepIndex + ']:', this.stepProductData[stepIndex]);
  }

  processProductsForStep(products, step) {
    return products.flatMap(product => {
      if (step.displayVariantsAsIndividual && product.variants && product.variants.length > 0) {
        // Display each variant as separate product - filter out unavailable variants
        return product.variants
          .filter(variant => variant.available === true) // Only show available variants
          .map(variant => {
            // Storefront API: prioritize variant image, fallback to product featured image
            const imageUrl = variant?.image?.src || product.imageUrl || 'https://via.placeholder.com/150';

            return {
              id: this.extractId(variant.id),
              title: `${product.title} - ${variant.title}`,
              imageUrl,
              price: parseFloat(variant.price || '0') * 100,
              compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice) * 100 : null,
              variantId: this.extractId(variant.id),
              available: variant.available === true // Store availability (always boolean)
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
        const imageUrl = defaultVariant?.image?.src || product.imageUrl || 'https://via.placeholder.com/150';

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

    if (products.length === 0) {
      // Show empty state cards like in DCP preview
      const currentStep = this.selectedBundle.steps[stepIndex];
      const stepName = currentStep?.name || `Step ${stepIndex + 1}`;
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
            <img src="${product.imageUrl}" alt="${product.title}" loading="lazy">
          </div>

          <div class="product-content-wrapper">
            <div class="product-title">${product.title}</div>

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
      console.log('[PRELOAD] No next step to preload');
      return;
    }

    // Check if next step products are already loaded
    if (this.stepProductData[nextStepIndex]?.length > 0) {
      console.log('[PRELOAD] Next step products already cached');
      return;
    }

    console.log(`[PRELOAD] Preloading products for step ${nextStepIndex + 1} in background`);

    // Load in background (don't await)
    this.loadStepProducts(nextStepIndex)
      .then(() => {
        console.log(`[PRELOAD] ✅ Successfully preloaded step ${nextStepIndex + 1}`);
      })
      .catch(error => {
        console.warn(`[PRELOAD] Failed to preload step ${nextStepIndex + 1}:`, error);
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
    const productCard = document.querySelector(`[data-product-id="${productId}"]`);
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

    if (!step.conditionType || !step.conditionOperator || step.conditionValue === null) {
      return true; // No conditions to validate
    }

    // Calculate what the total would be with this change
    let totalQuantityWouldBe = 0;
    for (const [pid, qty] of Object.entries(this.selectedProducts[stepIndex])) {
      if (pid === productId) {
        totalQuantityWouldBe += newQuantity;
      } else {
        totalQuantityWouldBe += qty;
      }
    }

    const requiredQuantity = step.conditionValue;
    let allowUpdate = false;

    switch (step.conditionOperator) {
      case BUNDLE_WIDGET.CONDITION_OPERATORS.EQUAL_TO:
        allowUpdate = totalQuantityWouldBe <= requiredQuantity;
        break;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN:
        allowUpdate = totalQuantityWouldBe < requiredQuantity;
        break;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN_OR_EQUAL_TO:
        allowUpdate = totalQuantityWouldBe <= requiredQuantity;
        break;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN:
      case BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL_TO:
        allowUpdate = true; // Allow any increase
        break;
      default:
        allowUpdate = true;
    }

    if (!allowUpdate && newQuantity > (this.selectedProducts[stepIndex][productId] || 0)) {
      const operatorText = {
        [BUNDLE_WIDGET.CONDITION_OPERATORS.EQUAL_TO]: `exactly ${requiredQuantity}`,
        [BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN]: `less than ${requiredQuantity}`,
        [BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN_OR_EQUAL_TO]: `at most ${requiredQuantity}`,
        [BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN]: `more than ${requiredQuantity}`,
        [BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL_TO]: `at least ${requiredQuantity}`
      };

      const limitText = operatorText[step.conditionOperator] || requiredQuantity;
      ToastManager.show(`This step allows ${limitText} product${requiredQuantity !== 1 ? 's' : ''} only.`);
      return false;
    }

    return true;
  }

  validateStep(stepIndex) {
    const step = this.selectedBundle.steps[stepIndex];
    const selectedProductsInStep = this.selectedProducts[stepIndex];

    let totalQuantitySelected = 0;
    for (const quantity of Object.values(selectedProductsInStep)) {
      totalQuantitySelected += quantity;
    }

    // If no conditions are set, step is optional - always valid
    if (!step.conditionType || !step.conditionOperator || step.conditionValue === null) {
      return true; // Optional step - can proceed with 0 products
    }

    const requiredQuantity = step.conditionValue;

    switch (step.conditionOperator) {
      case BUNDLE_WIDGET.CONDITION_OPERATORS.EQUAL_TO:
        return totalQuantitySelected === requiredQuantity;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN:
        return totalQuantitySelected > requiredQuantity;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN:
        return totalQuantitySelected < requiredQuantity;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL_TO:
        return totalQuantitySelected >= requiredQuantity;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN_OR_EQUAL_TO:
        return totalQuantitySelected <= requiredQuantity;
      default:
        return true; // No recognized condition - step is optional
    }
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
    const prevButton = this.elements.modal.querySelector('.prev-button');
    const nextButton = this.elements.modal.querySelector('.next-button');

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

    // If discount is not enabled, show step name
    if (!this.selectedBundle?.pricing?.enabled) {
      const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
      modalStepTitle.innerHTML = currentStep?.name || `Step ${this.currentStepIndex + 1}`;
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
    const progressFill = this.elements.modal.querySelector('.modal-footer-progress-fill');
    const progressBar = this.elements.modal.querySelector('.modal-footer-progress-bar');
    const currentQuantitySpan = this.elements.modal.querySelector('.modal-footer-progress-details .current-quantity');
    const targetQuantitySpan = this.elements.modal.querySelector('.modal-footer-progress-details .target-quantity');
    const discountSection = this.elements.modal.querySelector('.modal-footer-discount-messaging');
    const progressSection = this.elements.modal.querySelector('.modal-footer-progress-section');

    if (!footerDiscountText || !progressFill) return;

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

    // Update progress bar
    const nextRule = PricingCalculator.getNextDiscountRule(this.selectedBundle, totalQuantity, totalPrice);
    const ruleToUse = discountInfo.applicableRule || nextRule;

    let progressPercentage = 0;

    if (ruleToUse) {
      const conditionType = ruleToUse.condition?.type || 'quantity';
      const targetValue = ruleToUse.condition?.value || 0;

      if (conditionType === 'amount') {
        progressPercentage = targetValue > 0 ? Math.min(100, (totalPrice / targetValue) * 100) : 0;
        if (currentQuantitySpan && targetQuantitySpan) {
          currentQuantitySpan.textContent = CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format);
          targetQuantitySpan.textContent = CurrencyManager.formatMoney(targetValue, currencyInfo.display.format);
        }
      } else {
        progressPercentage = targetValue > 0 ? Math.min(100, (totalQuantity / targetValue) * 100) : 0;
        if (currentQuantitySpan && targetQuantitySpan) {
          currentQuantitySpan.textContent = totalQuantity.toString();
          targetQuantitySpan.textContent = targetValue.toString();
        }
      }
    }

    if (progressFill) {
      progressFill.style.width = `${progressPercentage}%`;
    }

    // Show/hide sections based on config
    if (discountSection) {
      discountSection.style.display = this.config.showDiscountMessaging ? 'block' : 'none';
    }
    if (progressSection) {
      progressSection.style.display = this.config.showProgressBar ? 'block' : 'none';
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

      // Disable button during request
      this.elements.addToCartButton.disabled = true;
      this.elements.addToCartButton.textContent = 'Adding to Cart...';

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
      // Re-enable button
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

    console.log('[CART] Building cart items for bundle:', {
      bundleId: this.selectedBundle.id,
      bundleName: this.selectedBundle.name,
      bundleInstanceId
    });

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
              console.warn('[CART] Product not available for sale:', {
                stepIndex,
                variantId,
                productTitle: product.title,
                availabilityStatus: product.available
              });
              unavailableProducts.push(product.title);
              return; // Skip this product
            }

            console.log('[CART] Adding component:', {
              stepIndex,
              variantId,
              quantity,
              productTitle: product.title,
              bundleInstanceId,
              available: product.available
            });

            const cartItem = {
              id: parseInt(variantId),
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

    console.log('[CART] Cart items to add (components with _bundle_id property):', cartItems);

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

      console.log('[CART] Generated UUID-based bundle instance ID:', bundleInstanceId);
      return bundleInstanceId;
    }

    // Fallback for older browsers: use timestamp + random number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    const bundleInstanceId = `${this.selectedBundle.id}_${timestamp}_${random}`;

    console.warn('[CART] crypto.randomUUID() not available, using fallback ID generation');
    console.log('[CART] Generated fallback bundle instance ID:', bundleInstanceId);
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

console.log('[PRODUCT_PAGE_WIDGET] Module loaded');
