/**
 * Full-Page Bundle Widget
 * For standalone Shopify pages (not product pages)
 * Fetches bundle configuration from API and renders full-page layout
 */

'use strict';

console.log('[FULL_PAGE_BUNDLE] Loading widget...');

class FullPageBundleWidget {
  constructor(container) {
    this.container = container;
    this.bundleData = null;
    this.selectedProducts = [];
    this.currentStepIndex = 0;
    this.activeCollectionId = null;

    this.init();
  }

  async init() {
    try {
      const bundleId = this.container.dataset.bundleId;

      if (!bundleId || bundleId === 'preview') {
        this.showPreview();
        return;
      }

      // Fetch bundle data from API
      await this.loadBundleFromAPI(bundleId);

      if (!this.bundleData) {
        throw new Error('Failed to load bundle data');
      }

      // Initialize product selections
      this.selectedProducts = Array(this.bundleData.steps.length).fill(null).map(() => ({}));

      // Render the UI
      this.render();

    } catch (error) {
      console.error('[FULL_PAGE_BUNDLE] Initialization error:', error);
      this.showError(error.message);
    }
  }

  async loadBundleFromAPI(bundleId) {
    try {
      const appUrl = this.container.dataset.appUrl || window.__BUNDLE_APP_URL__ || '';
      const shop = window.Shopify?.shop || window.location.hostname;

      console.log('[FULL_PAGE_BUNDLE] Fetching bundle:', bundleId);

      // Use Shopify App Proxy format: /apps/product-bundles/api/bundle/{id}.json
      const apiPath = `/apps/product-bundles/api/bundle/${bundleId}.json`;
      const response = await fetch(apiPath);

      if (!response.ok) {
        throw new Error(`Failed to fetch bundle: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.bundle) {
        throw new Error(data.error || 'Bundle data not found');
      }

      this.bundleData = data.bundle;

      console.log('[FULL_PAGE_BUNDLE] Bundle loaded:', this.bundleData);

    } catch (error) {
      console.error('[FULL_PAGE_BUNDLE] API fetch error:', error);
      throw error;
    }
  }

  render() {
    // Clear container
    this.container.innerHTML = '';

    // Render step timeline
    const timeline = this.createStepTimeline();
    this.container.appendChild(timeline);

    // Render bundle header/instructions
    const header = this.createBundleHeader();
    this.container.appendChild(header);

    // Render category tabs if step has collections
    const currentStep = this.bundleData.steps[this.currentStepIndex];
    if (currentStep.collections && currentStep.collections.length > 0) {
      const tabs = this.createCategoryTabs();
      this.container.appendChild(tabs);
    }

    // Render product grid
    const grid = this.createProductGrid();
    this.container.appendChild(grid);

    // Render footer
    const footer = this.createFooter();
    this.container.appendChild(footer);
  }

  createStepTimeline() {
    const timeline = document.createElement('div');
    timeline.className = 'step-timeline';

    this.bundleData.steps.forEach((step, index) => {
      const stepItem = document.createElement('div');
      stepItem.className = 'timeline-step';

      const isCompleted = this.isStepCompleted(index);
      const isCurrent = index === this.currentStepIndex;
      const isAccessible = this.isStepAccessible(index);

      if (isCompleted) stepItem.classList.add('completed');
      if (isCurrent) stepItem.classList.add('current');
      if (!isAccessible) stepItem.classList.add('locked');

      // Circle with icon
      const circle = document.createElement('div');
      circle.className = 'timeline-circle';

      if (isCompleted) {
        // Checkmark icon
        circle.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13 4L6 11L3 8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      } else if (isCurrent) {
        // Stacked layers icon
        circle.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="3" width="10" height="10" stroke="currentColor" stroke-width="1.5" fill="none"/><rect x="5" y="5" width="6" height="6" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>';
      } else {
        circle.textContent = (index + 1).toString();
      }

      stepItem.appendChild(circle);

      // Connecting line (except for last step)
      if (index < this.bundleData.steps.length - 1) {
        const line = document.createElement('div');
        line.className = 'timeline-line';
        if (isCompleted) line.classList.add('completed');
        stepItem.appendChild(line);
      }

      // Step name
      const stepName = document.createElement('div');
      stepName.className = 'timeline-step-name';
      stepName.textContent = step.name;
      stepItem.appendChild(stepName);

      // Click handler
      if (isAccessible) {
        stepItem.style.cursor = 'pointer';
        stepItem.addEventListener('click', () => {
          this.currentStepIndex = index;
          this.render();
        });
      }

      timeline.appendChild(stepItem);
    });

    return timeline;
  }

  createBundleHeader() {
    const header = document.createElement('div');
    header.className = 'bundle-header';

    const currentStep = this.bundleData.steps[this.currentStepIndex];
    const instructionText = currentStep.description || `Start with choosing your base board to start customization`;

    header.innerHTML = `
      <p class="bundle-instruction">${instructionText}</p>
    `;

    return header;
  }

  createCategoryTabs() {
    const currentStep = this.bundleData.steps[this.currentStepIndex];
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'category-tabs';

    // Add "All" tab
    const allTab = this.createTab('All', null, !this.activeCollectionId);
    tabsContainer.appendChild(allTab);

    // Add collection tabs
    currentStep.collections.forEach((collection, index) => {
      const colors = ['blue', 'red', 'green'];
      const color = colors[index % colors.length];
      const tab = this.createTab(collection.title, collection.id, this.activeCollectionId === collection.id, color);
      tabsContainer.appendChild(tab);
    });

    return tabsContainer;
  }

  createTab(label, collectionId, isActive, color = null) {
    const tab = document.createElement('div');
    tab.className = 'category-tab';
    if (isActive) tab.classList.add('active');
    if (color) tab.dataset.color = color;

    const indicator = document.createElement('div');
    indicator.className = 'tab-indicator';

    const labelEl = document.createElement('span');
    labelEl.className = 'tab-label';
    labelEl.textContent = label;

    tab.appendChild(indicator);
    tab.appendChild(labelEl);

    tab.addEventListener('click', () => {
      this.activeCollectionId = collectionId;
      this.render();
    });

    return tab;
  }

  createProductGrid() {
    const grid = document.createElement('div');
    grid.className = 'full-page-product-grid';

    const currentStep = this.bundleData.steps[this.currentStepIndex];
    let products = currentStep.products || [];

    // Filter by collection if active
    if (this.activeCollectionId && currentStep.collections) {
      const activeCollection = currentStep.collections.find(c => c.id === this.activeCollectionId);
      if (activeCollection && activeCollection.products) {
        products = activeCollection.products;
      }
    }

    if (products.length === 0) {
      grid.innerHTML = '<p style="text-align: center; color: #808080;">No products available</p>';
      return grid;
    }

    products.forEach(product => {
      const card = this.createProductCard(product);
      grid.appendChild(card);
    });

    return grid;
  }

  createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';

    const variantId = product.variants?.[0]?.id || product.id;
    const quantity = this.selectedProducts[this.currentStepIndex][variantId] || 0;

    if (quantity > 0) card.classList.add('selected');

    card.innerHTML = `
      <div class="product-image">
        <img src="${product.images?.[0]?.url || product.featuredImage?.url || ''}" alt="${product.title}">
      </div>
      <div class="product-content-wrapper">
        <div class="product-title">${product.title}</div>
        <div class="product-price">Rs. ${(product.price / 100).toFixed(2)}</div>
        <div class="product-quantity-selector">
          <button class="qty-btn qty-decrease" data-variant-id="${variantId}">−</button>
          <span class="qty-display">${quantity}</span>
          <button class="qty-btn qty-increase" data-variant-id="${variantId}">+</button>
        </div>
        <button class="product-add-btn ${quantity > 0 ? 'added' : ''}" data-variant-id="${variantId}">
          ${quantity > 0 ? 'Added to Bundle' : 'Add to Box'}
        </button>
      </div>
    `;

    // Attach event listeners
    card.querySelector('.qty-decrease').addEventListener('click', () => this.updateQuantity(variantId, -1));
    card.querySelector('.qty-increase').addEventListener('click', () => this.updateQuantity(variantId, 1));
    card.querySelector('.product-add-btn').addEventListener('click', () => this.toggleProduct(variantId));

    return card;
  }

  createFooter() {
    const footer = document.createElement('div');
    footer.className = 'full-page-footer';

    // Left section - selected products
    const leftSection = document.createElement('div');
    leftSection.className = 'footer-left';

    const productsContainer = document.createElement('div');
    productsContainer.className = 'footer-selected-products';

    const allSelected = this.getAllSelectedProducts();

    if (allSelected.length === 0) {
      productsContainer.innerHTML = '<p class="no-selections">No products selected yet</p>';
    } else {
      allSelected.forEach(item => {
        const productItem = this.createFooterProductItem(item);
        productsContainer.appendChild(productItem);
      });
    }

    leftSection.appendChild(productsContainer);

    // Right section - total and navigation
    const rightSection = document.createElement('div');
    rightSection.className = 'footer-right';

    const total = this.calculateTotal();

    rightSection.innerHTML = `
      <div class="footer-total">
        <span class="total-label">Total</span>
        <span class="total-price">Rs. ${(total / 100).toFixed(2)}</span>
      </div>
      <div class="footer-nav-buttons">
        <button class="footer-nav-btn footer-back-btn" ${this.currentStepIndex === 0 ? 'disabled' : ''}>Back</button>
        <button class="footer-nav-btn footer-next-btn">${this.currentStepIndex === this.bundleData.steps.length - 1 ? 'Add to Cart' : 'Next'}</button>
      </div>
    `;

    // Attach navigation listeners
    rightSection.querySelector('.footer-back-btn').addEventListener('click', () => this.navigateBack());
    rightSection.querySelector('.footer-next-btn').addEventListener('click', () => this.navigateNext());

    footer.appendChild(leftSection);
    footer.appendChild(rightSection);

    return footer;
  }

  createFooterProductItem(item) {
    const productItem = document.createElement('div');
    productItem.className = 'footer-product-item';

    productItem.innerHTML = `
      <div class="footer-product-image-wrapper">
        <img src="${item.image}" alt="${item.title}" class="footer-product-image">
        <div class="footer-product-quantity-badge">${item.quantity}</div>
      </div>
      <div class="footer-product-info">
        <div class="footer-product-title">${item.title}</div>
        <div class="footer-product-price">Rs. ${(item.price / 100).toFixed(2)}</div>
        <button class="footer-product-remove" data-step="${item.stepIndex}" data-variant="${item.variantId}">Delete</button>
      </div>
    `;

    productItem.querySelector('.footer-product-remove').addEventListener('click', () => {
      this.selectedProducts[item.stepIndex][item.variantId] = 0;
      this.render();
    });

    return productItem;
  }

  getAllSelectedProducts() {
    const allProducts = [];

    this.bundleData.steps.forEach((step, stepIndex) => {
      const stepSelections = this.selectedProducts[stepIndex] || {};

      Object.entries(stepSelections).forEach(([variantId, quantity]) => {
        if (quantity > 0) {
          const product = step.products?.find(p => p.id === variantId || p.variants?.some(v => v.id === variantId));
          if (product) {
            allProducts.push({
              stepIndex,
              variantId,
              quantity,
              title: product.title,
              image: product.images?.[0]?.url || product.featuredImage?.url || '',
              price: product.price
            });
          }
        }
      });
    });

    return allProducts;
  }

  updateQuantity(variantId, delta) {
    const current = this.selectedProducts[this.currentStepIndex][variantId] || 0;
    const newQuantity = Math.max(0, current + delta);

    this.selectedProducts[this.currentStepIndex][variantId] = newQuantity;
    this.render();
  }

  toggleProduct(variantId) {
    const current = this.selectedProducts[this.currentStepIndex][variantId] || 0;
    this.selectedProducts[this.currentStepIndex][variantId] = current > 0 ? 0 : 1;
    this.render();
  }

  calculateTotal() {
    let total = 0;
    this.bundleData.steps.forEach((step, stepIndex) => {
      const stepSelections = this.selectedProducts[stepIndex] || {};
      Object.entries(stepSelections).forEach(([variantId, quantity]) => {
        const product = step.products?.find(p => p.id === variantId || p.variants?.some(v => v.id === variantId));
        if (product && quantity > 0) {
          total += product.price * quantity;
        }
      });
    });
    return total;
  }

  isStepCompleted(stepIndex) {
    const stepSelections = this.selectedProducts[stepIndex] || {};
    const totalQuantity = Object.values(stepSelections).reduce((sum, qty) => sum + qty, 0);
    const step = this.bundleData.steps[stepIndex];
    return totalQuantity >= (step.minQuantity || 1);
  }

  isStepAccessible(stepIndex) {
    if (stepIndex === 0) return true;
    // Check if all previous steps are completed
    for (let i = 0; i < stepIndex; i++) {
      if (!this.isStepCompleted(i)) return false;
    }
    return true;
  }

  navigateBack() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.render();
    }
  }

  navigateNext() {
    if (this.currentStepIndex < this.bundleData.steps.length - 1) {
      if (this.isStepCompleted(this.currentStepIndex)) {
        this.currentStepIndex++;
        this.render();
      } else {
        alert('Please select at least one product to continue');
      }
    } else {
      // Add to cart
      this.addToCart();
    }
  }

  async addToCart() {
    try {
      const items = [];
      const bundleInstanceId = `${this.bundleData.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.bundleData.steps.forEach((step, stepIndex) => {
        const stepSelections = this.selectedProducts[stepIndex] || {};

        Object.entries(stepSelections).forEach(([variantId, quantity]) => {
          if (quantity > 0) {
            items.push({
              id: parseInt(variantId),
              quantity: quantity,
              properties: {
                '_bundle_id': bundleInstanceId,
                '_bundle_name': this.bundleData.name,
                '_step_index': stepIndex.toString()
              }
            });
          }
        });
      });

      console.log('[FULL_PAGE_BUNDLE] Adding to cart:', items);

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });

      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }

      alert('Bundle added to cart!');
      window.location.href = '/cart';

    } catch (error) {
      console.error('[FULL_PAGE_BUNDLE] Cart error:', error);
      alert('Failed to add bundle to cart: ' + error.message);
    }
  }

  showPreview() {
    this.container.innerHTML = `
      <div style="padding: 60px; text-align: center;">
        <h2>Full-Page Bundle Widget</h2>
        <p>Configure a Bundle ID in the theme editor to see your bundle here.</p>
      </div>
    `;
  }

  showError(message) {
    this.container.innerHTML = `
      <div style="padding: 40px; text-align: center; background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px;">
        <h3 style="color: #856404;">Error Loading Bundle</h3>
        <p style="color: #856404;">${message}</p>
      </div>
    `;
  }
}

// Initialize widget when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFullPageWidget);
} else {
  initFullPageWidget();
}

function initFullPageWidget() {
  const containers = document.querySelectorAll('#bundle-builder-app[data-bundle-type="full_page"]');
  containers.forEach(container => {
    if (!container.dataset.initialized) {
      new FullPageBundleWidget(container);
      container.dataset.initialized = 'true';
    }
  });
}

console.log('[FULL_PAGE_BUNDLE] Module loaded');
