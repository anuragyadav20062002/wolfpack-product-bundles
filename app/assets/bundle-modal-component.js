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
  }

  /**
   * Create modal DOM structure
   */
  createModalHTML() {
    const modalHTML = `
      <div class="bundle-modal-overlay" id="bundle-product-modal">
        <div class="bundle-modal-container">
          <!-- Mobile Drag Handle for Swipe-to-Dismiss -->
          <div class="bundle-modal-drag-handle">
            <div class="bundle-modal-drag-indicator"></div>
          </div>
          <button class="bundle-modal-close" aria-label="Close modal">&times;</button>

          <div class="bundle-modal-content">
            <!-- Left Column: Image Gallery with Carousel -->
            <div class="bundle-modal-images">
              <div class="bundle-modal-main-image-container">
                <button class="bundle-modal-carousel-btn bundle-modal-carousel-prev" id="modal-carousel-prev" aria-label="Previous image">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <div class="bundle-modal-main-image">
                  <img src="" alt="Product image" id="modal-main-image">
                </div>
                <button class="bundle-modal-carousel-btn bundle-modal-carousel-next" id="modal-carousel-next" aria-label="Next image">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
                <div class="bundle-modal-image-counter" id="modal-image-counter">
                  <!-- Image counter will be inserted here (e.g., "1 / 5") -->
                </div>
              </div>
              <div class="bundle-modal-thumbnails" id="modal-thumbnails">
                <!-- Thumbnails will be inserted here -->
              </div>
            </div>

            <!-- Right Column: Product Details -->
            <div class="bundle-modal-details">
              <div class="bundle-modal-header">
                <h2 class="bundle-modal-title" id="modal-product-title"></h2>
                <div class="bundle-modal-selection-summary" id="modal-selection-summary" style="display: none;">
                  <svg class="selection-check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13 4L6 11L3 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>Selected: <strong id="modal-selection-text"></strong></span>
                </div>
                <div class="bundle-modal-price" id="modal-product-price"></div>
              </div>

              <div class="bundle-modal-description" id="modal-product-description"></div>

              <!-- Variant Selectors (above quantity) -->
              <div class="bundle-modal-variants" id="modal-variants-container">
                <!-- Variant selectors will be inserted here -->
              </div>

              <!-- Quantity Selector (below variants) -->
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

    // Carousel navigation buttons
    document.getElementById('modal-carousel-prev').addEventListener('click', () => {
      this.navigateCarousel(-1);
    });

    document.getElementById('modal-carousel-next').addEventListener('click', () => {
      this.navigateCarousel(1);
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

    // Swipe gesture detection for mobile
    this.setupSwipeGestures();
  }

  /**
   * Setup swipe gestures for mobile
   * - Swipe down on container to dismiss
   * - Swipe left/right on image to navigate carousel
   */
  setupSwipeGestures() {
    const modalContainer = this.modalElement.querySelector('.bundle-modal-container');
    const imageContainer = this.modalElement.querySelector('.bundle-modal-main-image-container');

    // Swipe state
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isSwiping = false;

    // Swipe-to-dismiss on modal container (drag handle area)
    const dragHandle = this.modalElement.querySelector('.bundle-modal-drag-handle');
    if (dragHandle) {
      dragHandle.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        isSwiping = true;
        modalContainer.style.transition = 'none';
      }, { passive: true });

      dragHandle.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - touchStartY;

        // Only allow downward swipe
        if (deltaY > 0) {
          modalContainer.style.transform = `translateY(${deltaY}px)`;
          modalContainer.style.opacity = Math.max(0.5, 1 - deltaY / 300);
        }
      }, { passive: true });

      dragHandle.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        isSwiping = false;

        const deltaY = e.changedTouches[0].clientY - touchStartY;
        const deltaTime = Date.now() - touchStartTime;

        modalContainer.style.transition = 'transform 0.3s ease, opacity 0.3s ease';

        // Close if swiped down > 100px within 300ms (quick swipe) or > 150px (slow swipe)
        if ((deltaY > 100 && deltaTime < 300) || deltaY > 150) {
          modalContainer.style.transform = 'translateY(100%)';
          modalContainer.style.opacity = '0';
          setTimeout(() => {
            this.close();
            modalContainer.style.transform = '';
            modalContainer.style.opacity = '';
          }, 300);
        } else {
          // Reset position
          modalContainer.style.transform = '';
          modalContainer.style.opacity = '';
        }
      }, { passive: true });
    }

    // Swipe left/right on image for carousel navigation
    if (imageContainer) {
      imageContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartTime = Date.now();
      }, { passive: true });

      imageContainer.addEventListener('touchend', (e) => {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaTime = Date.now() - touchStartTime;

        // Minimum 50px swipe within 300ms
        if (Math.abs(deltaX) > 50 && deltaTime < 300) {
          if (deltaX > 0) {
            // Swipe right = previous image
            this.navigateCarousel(-1);
          } else {
            // Swipe left = next image
            this.navigateCarousel(1);
          }
        }
      }, { passive: true });
    }
  }

  /**
   * Navigate carousel by direction
   * @param {number} direction - -1 for previous, 1 for next
   */
  navigateCarousel(direction) {
    const images = this.getProductImages();
    if (images.length <= 1) return;

    let newIndex = this.selectedImageIndex + direction;

    // Wrap around
    if (newIndex < 0) {
      newIndex = images.length - 1;
    } else if (newIndex >= images.length) {
      newIndex = 0;
    }

    this.selectImage(newIndex);
  }

  /**
   * Open modal with product data
   * @param {Object} product - Product data
   * @param {Object} step - Step data
   */
  open(product, step) {

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
    // Set title - use parent title if this is a flattened variant
    const displayTitle = this.currentProduct.parentTitle || this.currentProduct.title;
    document.getElementById('modal-product-title').textContent = displayTitle;

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
   * Get normalized images array from product
   * Handles various image data formats: imageUrl, image.src, images array, featuredImage.url
   * @returns {string[]} Array of image URLs
   */
  getProductImages() {
    const product = this.currentProduct;
    const images = [];

    // Try various image formats
    if (product.images && Array.isArray(product.images)) {
      // Handle images array (can be strings or objects with url/src)
      product.images.forEach(img => {
        if (typeof img === 'string') {
          images.push(img);
        } else if (img?.url) {
          images.push(img.url);
        } else if (img?.src) {
          images.push(img.src);
        }
      });
    }

    // If no images from array, try single image properties
    if (images.length === 0) {
      if (product.imageUrl) {
        images.push(product.imageUrl);
      } else if (product.image?.src) {
        images.push(product.image.src);
      } else if (product.featuredImage?.url) {
        images.push(product.featuredImage.url);
      }
    }

    return images;
  }

  /**
   * Load product images
   */
  loadImages() {
    const images = this.getProductImages();
    const mainImageEl = document.getElementById('modal-main-image');
    const thumbnailsContainer = document.getElementById('modal-thumbnails');
    const imageCounter = document.getElementById('modal-image-counter');
    const prevBtn = document.getElementById('modal-carousel-prev');
    const nextBtn = document.getElementById('modal-carousel-next');


    if (images.length === 0) {
      // Use fallback placeholder
      mainImageEl.src = 'https://via.placeholder.com/600x600?text=No+Image';
      mainImageEl.alt = this.currentProduct.title;
      thumbnailsContainer.innerHTML = '';
      imageCounter.style.display = 'none';
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
      return;
    }

    // Set main image
    mainImageEl.src = images[0];
    mainImageEl.alt = this.currentProduct.title;

    // Show/hide carousel controls based on number of images
    if (images.length > 1) {
      prevBtn.style.display = 'flex';
      nextBtn.style.display = 'flex';
      imageCounter.style.display = 'block';
      this.updateImageCounter();

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
    } else {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
      imageCounter.style.display = 'none';
      thumbnailsContainer.innerHTML = '';
    }
  }

  /**
   * Update image counter display
   */
  updateImageCounter() {
    const images = this.getProductImages();
    const imageCounter = document.getElementById('modal-image-counter');
    if (imageCounter && images.length > 1) {
      imageCounter.textContent = `${this.selectedImageIndex + 1} / ${images.length}`;
    }
  }

  /**
   * Select image by index
   * @param {number} index - Image index
   */
  selectImage(index) {
    const images = this.getProductImages();
    if (index < 0 || index >= images.length) return;

    this.selectedImageIndex = index;

    // Update main image with smooth transition
    const mainImageEl = document.getElementById('modal-main-image');
    mainImageEl.src = images[index];

    // Update active thumbnail
    document.querySelectorAll('.bundle-modal-thumbnail').forEach((thumb, i) => {
      thumb.classList.toggle('active', i === index);
    });

    // Update image counter
    this.updateImageCounter();

    // Scroll active thumbnail into view
    const activeThumbnail = document.querySelector('.bundle-modal-thumbnail.active');
    if (activeThumbnail) {
      activeThumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  /**
   * Create variant selector with button/swatch style options
   */
  createVariantSelectors() {
    const variantsContainer = document.getElementById('modal-variants-container');
    const variants = this.currentProduct.variants || [];


    // If only one variant (no options) or no variants, hide variant selectors
    if (variants.length <= 1) {
      variantsContainer.innerHTML = '';
      this.selectedVariant = variants[0] || this.currentProduct;
      return;
    }

    // Extract option names (e.g., Size, Color)
    // Handle different data structures: options can be array of strings or array of objects
    let optionNames = this.currentProduct.options || [];

    // If options is array of objects with name property, extract names
    if (optionNames.length > 0 && typeof optionNames[0] === 'object' && optionNames[0].name) {
      optionNames = optionNames.map(opt => opt.name);
    }

    // If still no option names, try to infer from first variant
    if (optionNames.length === 0 && variants.length > 0) {
      const firstVariant = variants[0];
      // Check for option1, option2, option3 properties
      if (firstVariant.option1) optionNames.push('Option 1');
      if (firstVariant.option2) optionNames.push('Option 2');
      if (firstVariant.option3) optionNames.push('Option 3');
    }

    if (optionNames.length === 0) {
      // No variant options, use first variant
      this.selectedVariant = variants[0];
      variantsContainer.innerHTML = '';
      return;
    }


    // Store selected options for tracking
    this.selectedOptions = {};

    // Find the current variant to pre-select its options
    const currentVariantId = this.currentProduct.variantId;
    const currentVariant = variants.find(v => String(v.id) === String(currentVariantId));

    // Create button-style selector for each option
    variantsContainer.innerHTML = optionNames.map((optionName, optionIndex) => {
      // Get unique values for this option, filtering out undefined/null
      const optionValues = [...new Set(
        variants
          .map(v => v[`option${optionIndex + 1}`])
          .filter(val => val !== undefined && val !== null && val !== '')
      )];

      if (optionValues.length === 0) return '';

      // Pre-select current variant's option value, or fall back to first value
      const preSelectedValue = currentVariant?.[`option${optionIndex + 1}`] || optionValues[0];
      this.selectedOptions[optionIndex] = preSelectedValue;

      // Detect if this is likely a color option
      const isColorOption = this.isColorOption(optionName, optionValues);

      return `
        <div class="bundle-modal-variant-group">
          <label class="bundle-modal-variant-label">${optionName}: <span class="bundle-modal-variant-selected-value" data-option-index="${optionIndex}">${preSelectedValue}</span></label>
          <div class="bundle-modal-variant-options ${isColorOption ? 'color-options' : ''}" data-option-index="${optionIndex}">
            ${optionValues.map((value) => {
              const isSelected = value === preSelectedValue;
              const colorStyle = isColorOption ? this.getColorStyle(value) : '';
              return `
                <button type="button"
                  class="bundle-modal-variant-btn ${isSelected ? 'selected' : ''} ${isColorOption ? 'color-swatch' : ''}"
                  data-option-index="${optionIndex}"
                  data-value="${value}"
                  ${isColorOption && colorStyle ? `style="${colorStyle}"` : ''}
                  title="${value}">
                  ${isColorOption ? '' : value}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).filter(html => html !== '').join('');

    // Add click handlers to variant buttons
    variantsContainer.querySelectorAll('.bundle-modal-variant-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const optionIndex = parseInt(btn.dataset.optionIndex);
        const value = btn.dataset.value;
        this.selectVariantOption(optionIndex, value);
      });
    });

    // Set initial variant
    this.updateSelectedVariant();
  }

  /**
   * Check if option is likely a color option
   * @param {string} optionName - Option name
   * @param {string[]} values - Option values
   * @returns {boolean}
   */
  isColorOption(optionName, values) {
    const colorKeywords = ['color', 'colour', 'colors', 'colours'];
    if (colorKeywords.some(keyword => optionName.toLowerCase().includes(keyword))) {
      return true;
    }
    // Check if values look like color names
    const commonColors = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'pink', 'purple', 'orange', 'brown', 'grey', 'gray', 'navy', 'beige', 'cream'];
    const colorMatches = values.filter(v => commonColors.some(c => v.toLowerCase().includes(c)));
    return colorMatches.length > values.length / 2;
  }

  /**
   * Get CSS style for color swatch
   * @param {string} colorName - Color name
   * @returns {string} CSS style string
   */
  getColorStyle(colorName) {
    // Map common color names to CSS colors
    const colorMap = {
      'red': '#DC2626', 'blue': '#2563EB', 'green': '#16A34A', 'black': '#000000',
      'white': '#FFFFFF', 'yellow': '#EAB308', 'pink': '#EC4899', 'purple': '#9333EA',
      'orange': '#EA580C', 'brown': '#92400E', 'grey': '#6B7280', 'gray': '#6B7280',
      'navy': '#1E3A8A', 'beige': '#D4C4A8', 'cream': '#FFFDD0', 'gold': '#D4AF37',
      'silver': '#C0C0C0', 'teal': '#0D9488', 'coral': '#F87171', 'mint': '#A7F3D0'
    };

    const lowerName = colorName.toLowerCase();
    for (const [key, value] of Object.entries(colorMap)) {
      if (lowerName.includes(key)) {
        return `background-color: ${value}`;
      }
    }

    // If no match, try to use the value directly as a color
    if (lowerName.startsWith('#') || lowerName.startsWith('rgb')) {
      return `background-color: ${colorName}`;
    }

    // Default gradient for unknown colors
    return 'background: linear-gradient(135deg, #f0f0f0, #e0e0e0)';
  }

  /**
   * Select a variant option
   * @param {number} optionIndex - Index of the option (0, 1, or 2)
   * @param {string} value - Selected value
   */
  selectVariantOption(optionIndex, value) {
    // Update selected options
    this.selectedOptions[optionIndex] = value;

    // Update button states
    const optionsContainer = document.querySelector(`.bundle-modal-variant-options[data-option-index="${optionIndex}"]`);
    if (optionsContainer) {
      optionsContainer.querySelectorAll('.bundle-modal-variant-btn').forEach((btn) => {
        btn.classList.toggle('selected', btn.dataset.value === value);
      });
    }

    // Update selected value label
    const valueLabel = document.querySelector(`.bundle-modal-variant-selected-value[data-option-index="${optionIndex}"]`);
    if (valueLabel) {
      valueLabel.textContent = value;
    }

    // Update selected variant
    this.updateSelectedVariant();
  }

  /**
   * Update selected variant based on button selections
   */
  updateSelectedVariant() {
    const variants = this.currentProduct.variants || [];

    // Get selected option values from our stored selections
    const selectedOptionValues = Object.keys(this.selectedOptions || {})
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(key => this.selectedOptions[key]);


    // Find matching variant
    this.selectedVariant = variants.find(variant => {
      return selectedOptionValues.every((value, index) => {
        const variantValue = variant[`option${index + 1}`];
        return variantValue === value;
      });
    });

    // If no match found, use first variant
    if (!this.selectedVariant && variants.length > 0) {
      this.selectedVariant = variants[0];
    }


    // Update selection summary
    this.updateSelectionSummary();

    // Update price
    this.updatePrice();

    // Check availability
    this.updateAvailability();

    // Update variant image if available
    this.updateVariantImage();

    // Update unavailable option buttons
    this.updateOptionAvailability();
  }

  /**
   * Update selection summary display
   * Shows current selection like "Blue / Medium"
   */
  updateSelectionSummary() {
    const summaryContainer = document.getElementById('modal-selection-summary');
    const summaryText = document.getElementById('modal-selection-text');

    if (!summaryContainer || !summaryText) return;

    // Get selected option values
    const selectedValues = Object.keys(this.selectedOptions || {})
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(key => this.selectedOptions[key])
      .filter(value => value && value !== 'Default Title');

    if (selectedValues.length === 0) {
      summaryContainer.style.display = 'none';
      return;
    }

    // Show the summary
    summaryText.textContent = selectedValues.join(' / ');
    summaryContainer.style.display = 'flex';
  }

  /**
   * Update availability state of variant option buttons
   * Marks options as unavailable if no variant exists with that combination
   */
  updateOptionAvailability() {
    const variants = this.currentProduct.variants || [];
    if (!this.selectedOptions) return;

    const optionIndices = Object.keys(this.selectedOptions).map(k => parseInt(k));

    optionIndices.forEach(optionIndex => {
      const optionsContainer = document.querySelector(`.bundle-modal-variant-options[data-option-index="${optionIndex}"]`);
      if (!optionsContainer) return;

      optionsContainer.querySelectorAll('.bundle-modal-variant-btn').forEach(btn => {
        const testValue = btn.dataset.value;

        // Check if any variant exists with this option value + current other selections
        const hasAvailableVariant = variants.some(variant => {
          // Check if variant has this option value
          if (variant[`option${optionIndex + 1}`] !== testValue) return false;

          // Check if variant matches other selected options
          for (const [idx, value] of Object.entries(this.selectedOptions)) {
            if (parseInt(idx) === optionIndex) continue;
            if (variant[`option${parseInt(idx) + 1}`] !== value) return false;
          }

          // Check if variant is available
          return variant.available !== false && variant.availableForSale !== false;
        });

        btn.classList.toggle('unavailable', !hasAvailableVariant);
        btn.disabled = !hasAvailableVariant;
      });
    });
  }

  /**
   * Update main image when variant changes (if variant has specific image)
   */
  updateVariantImage() {
    if (!this.selectedVariant) return;

    // Check if variant has a specific image
    const variantImage = this.selectedVariant.image ||
                         this.selectedVariant.featured_image ||
                         this.selectedVariant.featuredImage;

    if (variantImage) {
      const imageUrl = typeof variantImage === 'string' ? variantImage :
                       variantImage.src || variantImage.url;

      if (imageUrl) {
        const mainImageEl = document.getElementById('modal-main-image');
        if (mainImageEl) {
          mainImageEl.src = imageUrl;
        }
      }
    }
  }

  /**
   * Update price display
   */
  updatePrice() {
    const priceEl = document.getElementById('modal-product-price');
    const variant = this.selectedVariant || this.currentProduct;

    // Format price using widget's currency manager
    const price = variant.price || this.currentProduct.price || 0;
    const compareAtPrice = variant.compareAtPrice || variant.compare_at_price ||
                           this.currentProduct.compareAtPrice || this.currentProduct.compare_at_price;

    let priceHTML = '';

    if (compareAtPrice && parseFloat(compareAtPrice) > parseFloat(price)) {
      priceHTML = `
        <span class="bundle-modal-price-strike">${this.formatPrice(compareAtPrice)}</span>
        <span class="bundle-modal-price-sale">${this.formatPrice(price)}</span>
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

    // Check if variant is available (handle different property names)
    const isAvailable = variant.available !== false &&
                        variant.availableForSale !== false &&
                        variant.inventory_quantity !== 0;

    if (!isAvailable) {
      addBtn.disabled = true;
      addBtn.textContent = 'Out of Stock';
      addBtn.classList.add('out-of-stock');
    } else {
      addBtn.disabled = false;
      addBtn.textContent = 'Add To Box';
      addBtn.classList.remove('out-of-stock');
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
      return;
    }

    const variant = this.selectedVariant || this.currentProduct;

    // Check availability before adding
    const isAvailable = variant.available !== false &&
                        variant.availableForSale !== false;

    if (!isAvailable) {
      return;
    }

    // Use selectedBundle.steps (not widget.steps which doesn't exist)
    const steps = this.widget.selectedBundle?.steps || [];
    const stepIndex = steps.findIndex(s => s.id === this.currentStep.id);

    if (stepIndex === -1) {
      return;
    }

    // Use variantId if available, otherwise fall back to id
    // This matches how the widget stores product selections
    const productId = variant.variantId || variant.id || this.currentProduct.id;


    // Call widget's method to add product
    if (this.widget.updateProductSelection) {
      this.widget.updateProductSelection(
        stepIndex,
        productId,
        this.selectedQuantity
      );
    } else {
      return;
    }

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
    }
  }
}

// Export for use in main widget
window.BundleProductModal = BundleProductModal;
