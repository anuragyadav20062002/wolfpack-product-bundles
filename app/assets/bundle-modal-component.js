/**
 * Bundle Product Modal Component
 *
 * Handles the product variant selection modal for full-page bundles.
 * Opens when user clicks "Choose Options" on a product card.
 *
 * Features:
 * - Image gallery with thumbnails
 * - Variant selection dropdowns
 * - Quantity controls
 * - Add To Box functionality
 * - Responsive mobile layout
 *
 * @version 1.0.0
 */

'use strict';

class BundleProductModal {
  constructor(widget) {
    this.widget = widget;
    this.modalElement = null;
    this.currentProduct = null;
    this.currentStep = null;
    this.selectedVariant = null;
    this.selectedQuantity = 1;
    this.selectedImageIndex = 0;

    this.init();
  }

  /**
   * Initialize modal
   */
  init() {
    this.createModalHTML();
    this.attachEventListeners();
    console.log('[MODAL] ✅ Product modal initialized');
  }

  /**
   * Create modal DOM structure
   */
  createModalHTML() {
    const modalHTML = `
      <div class="bundle-modal-overlay" id="bundle-product-modal">
        <div class="bundle-modal-container">
          <button class="bundle-modal-close" aria-label="Close modal">&times;</button>

          <div class="bundle-modal-content">
            <!-- Left Column: Image Gallery -->
            <div class="bundle-modal-images">
              <div class="bundle-modal-main-image">
                <img src="" alt="Product image" id="modal-main-image">
              </div>
              <div class="bundle-modal-thumbnails" id="modal-thumbnails">
                <!-- Thumbnails will be inserted here -->
              </div>
            </div>

            <!-- Right Column: Product Details -->
            <div class="bundle-modal-details">
              <div class="bundle-modal-header">
                <h2 class="bundle-modal-title" id="modal-product-title"></h2>
                <div class="bundle-modal-price" id="modal-product-price"></div>
              </div>

              <div class="bundle-modal-description" id="modal-product-description"></div>

              <div class="bundle-modal-variants" id="modal-variants-container">
                <!-- Variant selectors will be inserted here -->
              </div>

              <div class="bundle-modal-quantity">
                <label class="bundle-modal-quantity-label">Quantity</label>
                <div class="bundle-modal-quantity-controls">
                  <button class="bundle-modal-qty-btn" id="modal-qty-decrease">−</button>
                  <span class="bundle-modal-qty-display" id="modal-qty-display">1</span>
                  <button class="bundle-modal-qty-btn" id="modal-qty-increase">+</button>
                </div>
              </div>

              <button class="bundle-modal-add-btn" id="modal-add-to-box">
                Add To Box
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Insert modal into document body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modalElement = document.getElementById('bundle-product-modal');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button
    const closeBtn = this.modalElement.querySelector('.bundle-modal-close');
    closeBtn.addEventListener('click', () => this.close());

    // Close on overlay click
    this.modalElement.addEventListener('click', (e) => {
      if (e.target === this.modalElement) {
        this.close();
      }
    });

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalElement.classList.contains('active')) {
        this.close();
      }
    });

    // Quantity controls
    document.getElementById('modal-qty-decrease').addEventListener('click', () => {
      this.updateQuantity(Math.max(1, this.selectedQuantity - 1));
    });

    document.getElementById('modal-qty-increase').addEventListener('click', () => {
      this.updateQuantity(this.selectedQuantity + 1);
    });

    // Add To Box button
    document.getElementById('modal-add-to-box').addEventListener('click', () => {
      this.addToBundle();
    });
  }

  /**
   * Open modal with product data
   * @param {Object} product - Product data
   * @param {Object} step - Step data
   */
  open(product, step) {
    console.log('[MODAL] Opening modal for product:', product);

    this.currentProduct = product;
    this.currentStep = step;
    this.selectedQuantity = 1;
    this.selectedImageIndex = 0;

    // Populate modal content
    this.populateModal();

    // Show modal
    this.modalElement.classList.add('active');
    document.body.classList.add('modal-open');
  }

  /**
   * Close modal
   */
  close() {
    this.modalElement.classList.remove('active');
    document.body.classList.remove('modal-open');

    // Reset state
    this.currentProduct = null;
    this.currentStep = null;
    this.selectedVariant = null;
    this.selectedQuantity = 1;
    this.selectedImageIndex = 0;
  }

  /**
   * Populate modal with product data
   */
  populateModal() {
    // Set title
    document.getElementById('modal-product-title').textContent = this.currentProduct.title;

    // Set description (if available)
    const descriptionEl = document.getElementById('modal-product-description');
    if (this.currentProduct.description) {
      descriptionEl.textContent = this.currentProduct.description;
      descriptionEl.style.display = 'block';
    } else {
      descriptionEl.style.display = 'none';
    }

    // Load images
    this.loadImages();

    // Create variant selectors
    this.createVariantSelectors();

    // Set initial price
    this.updatePrice();

    // Show/hide quantity selector based on config
    const quantitySection = this.modalElement.querySelector('.bundle-modal-quantity');
    if (quantitySection) {
      const showQuantitySelector = this.widget?.config?.showQuantitySelectorInModal !== false;
      quantitySection.style.display = showQuantitySelector ? 'flex' : 'none';
    }

    // Reset quantity display
    document.getElementById('modal-qty-display').textContent = this.selectedQuantity;
  }

  /**
   * Load product images
   */
  loadImages() {
    const images = this.currentProduct.images || [];
    const mainImageEl = document.getElementById('modal-main-image');
    const thumbnailsContainer = document.getElementById('modal-thumbnails');

    if (images.length === 0) {
      // Use fallback placeholder
      mainImageEl.src = 'https://via.placeholder.com/600x600?text=No+Image';
      mainImageEl.alt = this.currentProduct.title;
      thumbnailsContainer.innerHTML = '';
      return;
    }

    // Set main image
    mainImageEl.src = images[0];
    mainImageEl.alt = this.currentProduct.title;

    // Create thumbnails
    thumbnailsContainer.innerHTML = images.map((image, index) => `
      <div class="bundle-modal-thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
        <img src="${image}" alt="${this.currentProduct.title} - Image ${index + 1}">
      </div>
    `).join('');

    // Add thumbnail click handlers
    thumbnailsContainer.querySelectorAll('.bundle-modal-thumbnail').forEach((thumbnail) => {
      thumbnail.addEventListener('click', () => {
        const index = parseInt(thumbnail.dataset.index);
        this.selectImage(index);
      });
    });
  }

  /**
   * Select image by index
   * @param {number} index - Image index
   */
  selectImage(index) {
    const images = this.currentProduct.images || [];
    if (index < 0 || index >= images.length) return;

    this.selectedImageIndex = index;

    // Update main image
    const mainImageEl = document.getElementById('modal-main-image');
    mainImageEl.src = images[index];

    // Update active thumbnail
    document.querySelectorAll('.bundle-modal-thumbnail').forEach((thumb, i) => {
      thumb.classList.toggle('active', i === index);
    });
  }

  /**
   * Create variant selector dropdowns
   */
  createVariantSelectors() {
    const variantsContainer = document.getElementById('modal-variants-container');
    const variants = this.currentProduct.variants || [];

    // If only one variant (no options), hide variant selectors
    if (variants.length <= 1) {
      variantsContainer.innerHTML = '';
      this.selectedVariant = variants[0] || this.currentProduct;
      return;
    }

    // Extract option names (e.g., Size, Color)
    const optionNames = this.currentProduct.options || [];

    if (optionNames.length === 0) {
      // No variant options, use first variant
      this.selectedVariant = variants[0];
      variantsContainer.innerHTML = '';
      return;
    }

    // Create dropdown for each option
    variantsContainer.innerHTML = optionNames.map((optionName, optionIndex) => {
      // Get unique values for this option
      const optionValues = [...new Set(variants.map(v => v[`option${optionIndex + 1}`]))];

      return `
        <div class="bundle-modal-variant-group">
          <label class="bundle-modal-variant-label">${optionName}</label>
          <select class="bundle-modal-variant-select" data-option-index="${optionIndex}">
            ${optionValues.map(value => `
              <option value="${value}">${value}</option>
            `).join('')}
          </select>
        </div>
      `;
    }).join('');

    // Add change handlers to variant selectors
    variantsContainer.querySelectorAll('.bundle-modal-variant-select').forEach((select) => {
      select.addEventListener('change', () => {
        this.updateSelectedVariant();
      });
    });

    // Set initial variant
    this.updateSelectedVariant();
  }

  /**
   * Update selected variant based on dropdown selections
   */
  updateSelectedVariant() {
    const variants = this.currentProduct.variants || [];
    const selectors = document.querySelectorAll('.bundle-modal-variant-select');

    // Get selected option values
    const selectedOptions = Array.from(selectors).map(select => select.value);

    // Find matching variant
    this.selectedVariant = variants.find(variant => {
      return selectedOptions.every((value, index) => {
        return variant[`option${index + 1}`] === value;
      });
    });

    // If no match found, use first variant
    if (!this.selectedVariant && variants.length > 0) {
      this.selectedVariant = variants[0];
    }

    // Update price
    this.updatePrice();

    // Check availability
    this.updateAvailability();
  }

  /**
   * Update price display
   */
  updatePrice() {
    const priceEl = document.getElementById('modal-product-price');
    const variant = this.selectedVariant || this.currentProduct;

    // Format price using widget's currency manager
    const price = variant.price || this.currentProduct.price || 0;
    const compareAtPrice = variant.compareAtPrice || this.currentProduct.compareAtPrice;

    let priceHTML = '';

    if (compareAtPrice && compareAtPrice > price) {
      priceHTML = `
        <span class="bundle-modal-price-strike">${this.formatPrice(compareAtPrice)}</span>
        ${this.formatPrice(price)}
      `;
    } else {
      priceHTML = this.formatPrice(price);
    }

    priceEl.innerHTML = priceHTML;
  }

  /**
   * Format price with currency
   * @param {number} price - Price in cents
   * @returns {string} Formatted price
   */
  formatPrice(price) {
    // Use widget's currency formatting if available
    if (this.widget && this.widget.formatPrice) {
      return this.widget.formatPrice(price);
    }

    // Fallback formatting
    const dollars = (price / 100).toFixed(2);
    return `$${dollars}`;
  }

  /**
   * Update availability status
   */
  updateAvailability() {
    const addBtn = document.getElementById('modal-add-to-box');
    const variant = this.selectedVariant || this.currentProduct;

    // Check if variant is available
    const isAvailable = variant.available !== false;

    if (!isAvailable) {
      addBtn.disabled = true;
      addBtn.textContent = 'Out of Stock';
    } else {
      addBtn.disabled = false;
      addBtn.textContent = 'Add To Box';
    }
  }

  /**
   * Update quantity
   * @param {number} quantity - New quantity
   */
  updateQuantity(quantity) {
    this.selectedQuantity = Math.max(1, quantity);
    document.getElementById('modal-qty-display').textContent = this.selectedQuantity;
  }

  /**
   * Add product to bundle
   */
  addToBundle() {
    if (!this.currentProduct || !this.currentStep) {
      console.error('[MODAL] Missing product or step data');
      return;
    }

    const variant = this.selectedVariant || this.currentProduct;
    const stepIndex = this.widget.steps.findIndex(s => s.id === this.currentStep.id);

    console.log('[MODAL] Adding to bundle:', {
      stepIndex,
      productId: variant.id,
      quantity: this.selectedQuantity,
      variant: variant
    });

    // Call widget's method to add product
    this.widget.updateProductSelection(
      stepIndex,
      variant.id,
      this.selectedQuantity
    );

    // Close modal
    this.close();

    // Show success feedback
    this.showSuccessFeedback();
  }

  /**
   * Show success feedback after adding product
   */
  showSuccessFeedback() {
    // Use widget's toast manager if available
    if (this.widget && this.widget.showToast) {
      this.widget.showToast('Product added to bundle!', 'success');
    } else {
      console.log('[MODAL] ✅ Product added to bundle');
    }
  }
}

// Export for use in main widget
window.BundleProductModal = BundleProductModal;
