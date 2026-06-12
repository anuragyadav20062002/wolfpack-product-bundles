'use strict';

export const BundleModalVariantMethods = {
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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

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

    if (compareAtPrice && Number(compareAtPrice) > Number(price)) {
      priceHTML = `
        <span class="bundle-modal-price-strike">${this.formatPrice(compareAtPrice)}</span>
        <span class="bundle-modal-price-sale">${this.formatPrice(price)}</span>
      `;
    } else {
      priceHTML = this.formatPrice(price);
    }

    priceEl.innerHTML = priceHTML;
  },

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
  },

  /**
   * Update availability status
   */
  updateAvailability() {
    const addBtn = document.getElementById('modal-add-to-box');
    const variant = this.selectedVariant || this.currentProduct;

    // Check if variant is available (handle different property names from Storefront API)
    const isAvailable = variant.available !== false &&
                        variant.availableForSale !== false;

    if (!isAvailable) {
      addBtn.disabled = true;
      addBtn.textContent = 'Out of Stock';
      addBtn.classList.add('out-of-stock');
    } else {
      addBtn.disabled = false;
      addBtn.textContent = 'Add To Box';
      addBtn.classList.remove('out-of-stock');
    }
  },

  /**
   * Update quantity
   * @param {number} quantity - New quantity
   */
};
