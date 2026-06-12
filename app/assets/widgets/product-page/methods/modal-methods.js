import { ConditionValidator } from '../../shared/condition-validator.js';
import { CurrencyManager, ToastManager, ComponentGenerator } from '../../../bundle-widget-components.js';

export function resolveProductPageCardButtonText({
  currentQuantity = 0,
  currentStep = {},
  outOfStock = false,
  defaultAddText = 'Add +',
} = {}) {
  if (outOfStock) return 'Out of stock';

  const rawText = currentQuantity > 0
    ? (currentStep?.addonReplaceText || 'Selected ✓')
    : (currentStep?.addonAddText || defaultAddText);

  return String(rawText)
    .replace(/\{\{\s*allowedQuantity\s*\}\}/g, String(currentQuantity))
    .replace(/\{\{\s*quantity\s*\}\}/g, String(currentQuantity));
}

export const ProductPageModalMethods = {
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
},

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
            ${resolveProductPageCardButtonText({ currentQuantity, currentStep, outOfStock, defaultAddText: 'Add to Cart' })}
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
},

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
},

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
  `;
},

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
},

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
    if (e.target.classList.contains('qty-btn') || e.target.classList.contains('inline-qty-btn')) {
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
    if (e.target.closest('.product-add-btn, .qty-btn, .inline-qty-btn, .variant-selector, button, input, select, a')) return;

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
};
