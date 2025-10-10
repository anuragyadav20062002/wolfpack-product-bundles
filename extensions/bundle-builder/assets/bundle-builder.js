/**
 * Wolfpack Full-Page Bundle Builder
 * Handles product selection, pricing, and add-to-cart
 */

console.log('🎁 Bundle Builder Script Loaded');

class WolfpackBundleBuilder {
  constructor(container) {
    console.log('🚀 Initializing Bundle Builder...');
    console.log('Container:', container);

    this.container = container;
    this.bundleId = container.dataset.bundleId;

    console.log('Bundle ID:', this.bundleId);
    console.log('Config data:', container.dataset.config);

    try {
      this.config = JSON.parse(container.dataset.config);
      console.log('✅ Config parsed:', this.config);
    } catch (error) {
      console.error('❌ Error parsing config:', error);
      return;
    }

    this.selections = {}; // { tabId: productId }
    this.quantities = {}; // { productId: quantity }
    this.currentTab = 0;

    this.init();
  }

  init() {
    console.log('🔧 Initializing UI...');

    // Render tabs and content
    this.renderTabs();
    this.renderTabContent(0);

    // Setup event listeners
    this.setupTabs();
    this.setupProductSelection();
    this.setupQuantityControls();
    this.setupAddToCart();
    this.setupClearAll();

    // Initial preview update
    this.updatePreview();

    console.log('✅ Bundle Builder Ready');
  }

  renderTabs() {
    const tabsContainer = this.container.querySelector('.bundle-tabs');
    if (!tabsContainer) {
      console.error('❌ .bundle-tabs container not found');
      return;
    }

    const tabs = this.config.tabs || [];
    console.log('📑 Rendering tabs:', tabs.length);

    const tabsHTML = tabs.map(function(tab, index) {
      return '<button class="bundle-tab ' + (index === 0 ? 'active' : '') + '" data-tab-id="' + index + '">' +
        '<span class="tab-icon">' + (tab.icon || '📦') + '</span>' +
        '<span class="tab-name">' + tab.name + '</span>' +
        '<span class="tab-badge" style="display: none;">0 selected</span>' +
        '</button>';
    }).join('');

    tabsContainer.innerHTML = tabsHTML;
    console.log('✅ Tabs rendered');
  }

  renderTabContent(tabIndex) {
    const contentsContainer = this.container.querySelector('.bundle-tab-contents');
    if (!contentsContainer) {
      console.error('❌ .bundle-tab-contents container not found');
      return;
    }

    const tab = this.config.tabs[tabIndex];
    console.log('🎨 Rendering tab content:', tab.name);

    const products = tab.products || [];
    const self = this;

    const productsHTML = products.map(function(product) {
      const isSelected = self.selections[tabIndex] === product.id;
      const quantity = self.quantities[product.id] || 1;

      // Get price from variants if available, fallback to product.price
      let price = product.price;
      if (!price && product.variants && product.variants.length > 0) {
        price = product.variants[0].price;
      }

      return '<div class="bundle-product-card ' + (isSelected ? 'selected' : '') + '" data-product-id="' + product.id + '">' +
        '<div class="product-image-wrapper">' +
          (product.image ?
            '<img src="' + product.image + '" alt="' + product.title + '" width="300" height="300">' :
            '<div class="product-image-placeholder">No Image</div>') +
        '</div>' +
        '<div class="product-info">' +
          '<h4 class="product-title">' + product.title + '</h4>' +
          '<p class="product-price">' + self.formatMoney(price) + '</p>' +
        '</div>' +
        '<div class="product-actions">' +
          '<button class="product-select-btn ' + (isSelected ? 'selected' : '') + '" data-product-id="' + product.id + '" data-tab-id="' + tabIndex + '">' +
            '<span class="btn-text">' + (isSelected ? 'Selected' : 'Select') + '</span>' +
          '</button>' +
          '<div class="product-quantity-controls" style="display: ' + (isSelected ? 'flex' : 'none') + ';">' +
            '<button class="qty-decrease" data-product-id="' + product.id + '">-</button>' +
            '<input type="number" class="qty-input" value="' + quantity + '" min="1" max="10" data-product-id="' + product.id + '">' +
            '<button class="qty-increase" data-product-id="' + product.id + '">+</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    contentsContainer.innerHTML = '<div class="bundle-tab-content active" data-tab-id="' + tabIndex + '">' +
      '<div class="tab-content-header">' +
        '<h3>' + tab.name + '</h3>' +
        '<p class="tab-requirements">' +
          (tab.requireSelection ?
            'Select at least ' + (tab.minQuantity || 1) + ' item(s)' :
            'Optional') +
        '</p>' +
      '</div>' +
      '<div class="bundle-products-grid">' + productsHTML + '</div>' +
    '</div>';

    console.log('✅ Tab content rendered');
  }

  formatMoney(cents) {
    if (!cents) return '$0.00';
    const amount = parseFloat(cents) / 100;
    return '$' + amount.toFixed(2);
  }

  setupTabs() {
    const self = this;
    const tabsContainer = this.container.querySelector('.bundle-tabs');
    if (!tabsContainer) return;

    tabsContainer.addEventListener('click', function(e) {
      const tabBtn = e.target.closest('.bundle-tab');
      if (tabBtn) {
        const tabIndex = parseInt(tabBtn.dataset.tabId);
        self.switchTab(tabIndex);
      }
    });
  }

  switchTab(tabIndex) {
    console.log('🔄 Switching to tab ' + tabIndex);
    this.currentTab = tabIndex;

    // Update tab buttons
    const tabButtons = this.container.querySelectorAll('.bundle-tab');
    tabButtons.forEach(function(btn, index) {
      if (index === tabIndex) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Render new content
    this.renderTabContent(tabIndex);
    this.updatePreview();
  }

  setupProductSelection() {
    const self = this;
    const contentsContainer = this.container.querySelector('.bundle-tab-contents');
    if (!contentsContainer) return;

    contentsContainer.addEventListener('click', function(e) {
      const selectBtn = e.target.closest('.product-select-btn');
      if (selectBtn) {
        const productId = selectBtn.dataset.productId;
        const tabId = parseInt(selectBtn.dataset.tabId);
        self.toggleProductSelection(tabId, productId);
      }
    });
  }

  toggleProductSelection(tabId, productId) {
    console.log('🎯 Toggling product selection: tab=' + tabId + ', product=' + productId);

    const wasSelected = this.selections[tabId] === productId;
    const previousProductId = this.selections[tabId]; // Store previous selection before changing

    if (wasSelected) {
      // Deselect
      delete this.selections[tabId];
      delete this.quantities[productId];
    } else {
      // Select
      this.selections[tabId] = productId;
      this.quantities[productId] = 1;
    }

    // Update preview immediately
    this.updatePreview();
    this.updateTabBadge(tabId);

    // Update UI for the specific product card instead of re-rendering entire tab
    const productCard = this.container.querySelector('.bundle-product-card[data-product-id="' + productId + '"]');
    if (productCard) {
      const selectBtn = productCard.querySelector('.product-select-btn');
      const qtyControls = productCard.querySelector('.product-quantity-controls');
      const btnText = selectBtn ? selectBtn.querySelector('.btn-text') : null;

      if (!wasSelected) {
        // Product was just selected
        productCard.classList.add('selected');
        if (selectBtn) selectBtn.classList.add('selected');
        if (btnText) btnText.textContent = 'Selected';
        if (qtyControls) qtyControls.style.display = 'flex';
      } else {
        // Product was just deselected
        productCard.classList.remove('selected');
        if (selectBtn) selectBtn.classList.remove('selected');
        if (btnText) btnText.textContent = 'Select';
        if (qtyControls) qtyControls.style.display = 'none';
      }
    }

    // If there was a previously selected product in this tab (and it's different), deselect it
    if (!wasSelected && previousProductId && previousProductId !== productId) {
      const previousCard = this.container.querySelector('.bundle-product-card[data-product-id="' + previousProductId + '"]');
      if (previousCard) {
        const selectBtn = previousCard.querySelector('.product-select-btn');
        const qtyControls = previousCard.querySelector('.product-quantity-controls');
        const btnText = selectBtn ? selectBtn.querySelector('.btn-text') : null;

        previousCard.classList.remove('selected');
        if (selectBtn) selectBtn.classList.remove('selected');
        if (btnText) btnText.textContent = 'Select';
        if (qtyControls) qtyControls.style.display = 'none';
      }
    }
  }

  updateTabBadge(tabId) {
    const tab = this.container.querySelector('.bundle-tab[data-tab-id="' + tabId + '"]');
    if (!tab) return;

    const badge = tab.querySelector('.tab-badge');
    const count = this.selections[tabId] ? 1 : 0;

    badge.textContent = count + ' selected';
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }

  setupQuantityControls() {
    const self = this;
    const contentsContainer = this.container.querySelector('.bundle-tab-contents');
    if (!contentsContainer) return;

    contentsContainer.addEventListener('click', function(e) {
      const qtyBtn = e.target.closest('.qty-btn');
      if (qtyBtn) {
        const productId = qtyBtn.dataset.productId;
        if (qtyBtn.classList.contains('qty-decrease')) {
          self.decreaseQuantity(productId);
        } else if (qtyBtn.classList.contains('qty-increase')) {
          self.increaseQuantity(productId);
        }
      }
    });

    contentsContainer.addEventListener('change', function(e) {
      if (e.target.classList.contains('qty-input')) {
        const productId = e.target.dataset.productId;
        const value = parseInt(e.target.value) || 1;
        self.setQuantity(productId, value);
      }
    });
  }

  increaseQuantity(productId) {
    const currentQty = this.quantities[productId] || 1;
    this.quantities[productId] = currentQty + 1;

    // Update input field directly
    const input = this.container.querySelector('.qty-input[data-product-id="' + productId + '"]');
    if (input) input.value = this.quantities[productId];

    this.updatePreview();
  }

  decreaseQuantity(productId) {
    const currentQty = this.quantities[productId] || 1;
    if (currentQty > 1) {
      this.quantities[productId] = currentQty - 1;

      // Update input field directly
      const input = this.container.querySelector('.qty-input[data-product-id="' + productId + '"]');
      if (input) input.value = this.quantities[productId];

      this.updatePreview();
    }
  }

  setQuantity(productId, quantity) {
    this.quantities[productId] = Math.max(1, quantity);
    this.updatePreview();
  }

  updatePreview() {
    const previewList = this.container.querySelector('.preview-items-list');
    const emptyState = previewList ? previewList.querySelector('.preview-empty-state') : null;
    if (!previewList) return;

    // Clear current preview items
    const oldItems = previewList.querySelectorAll('.preview-item');
    oldItems.forEach(function(item) {
      item.remove();
    });

    const hasSelections = Object.keys(this.selections).length > 0;

    if (!hasSelections) {
      if (emptyState) emptyState.style.display = 'block';
      this.updatePricingSummary(0, 0, 0);
      this.updateAddToCartButton(false);
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    // Build preview items
    let subtotal = 0;
    const self = this;

    Object.keys(this.selections).forEach(function(tabId) {
      const productId = self.selections[tabId];
      const tab = self.config.tabs[parseInt(tabId)];
      if (!tab || !tab.products) return;

      const product = tab.products.find(function(p) {
        return p.id === productId;
      });

      if (!product) return;

      const quantity = self.quantities[productId] || 1;
      // Get price from variants if available, fallback to product.price
      let priceValue = product.price;
      if (!priceValue && product.variants && product.variants.length > 0) {
        priceValue = product.variants[0].price;
      }
      const price = parseFloat(priceValue || 0) / 100;
      const itemTotal = price * quantity;
      subtotal += itemTotal;

      const previewItem = document.createElement('div');
      previewItem.className = 'preview-item';
      previewItem.innerHTML = '<div class="preview-item-image">' +
          (product.image ? '<img src="' + product.image + '" alt="' + product.title + '">' : '<div class="no-image">📦</div>') +
        '</div>' +
        '<div class="preview-item-details">' +
          '<h4>' + product.title + '</h4>' +
          '<p class="item-quantity">Qty: ' + quantity + '</p>' +
        '</div>' +
        '<div class="preview-item-price">$' + itemTotal.toFixed(2) + '</div>' +
        '<button class="preview-item-remove" data-tab-id="' + tabId + '" data-product-id="' + productId + '">×</button>';

      previewList.appendChild(previewItem);
    });

    // Calculate discount
    const totalItems = Object.keys(this.selections).length;
    const discount = this.calculateDiscount(totalItems, subtotal);
    const total = subtotal - discount;

    this.updatePricingSummary(subtotal, discount, total);
    this.validateSelections();
  }

  calculateDiscount(totalItems, subtotal) {
    if (!this.config.discount || !this.config.discount.enabled) {
      return 0;
    }

    const rules = this.config.discount.rules || [];
    const sortedRules = rules.sort(function(a, b) {
      return b.minItems - a.minItems;
    });
    const applicableRule = sortedRules.find(function(rule) {
      return totalItems >= rule.minItems;
    });

    if (!applicableRule) return 0;

    const method = this.config.discount.method;

    if (method === 'percentage_off') {
      return (subtotal * applicableRule.value) / 100;
    } else if (method === 'fixed_amount_off') {
      return applicableRule.value / 100;
    } else if (method === 'fixed_bundle_price') {
      return Math.max(0, subtotal - (applicableRule.value / 100));
    }

    return 0;
  }

  updatePricingSummary(subtotal, discount, total) {
    const subtotalEl = this.container.querySelector('.subtotal-amount');
    const totalEl = this.container.querySelector('.total-amount');
    const discountRow = this.container.querySelector('.summary-row.discount');
    const discountEl = this.container.querySelector('.discount-amount');

    if (subtotalEl) subtotalEl.textContent = '$' + subtotal.toFixed(2);
    if (totalEl) totalEl.textContent = '$' + total.toFixed(2);

    if (discountRow && discountEl) {
      if (discount > 0) {
        discountRow.style.display = 'flex';
        discountEl.textContent = '-$' + discount.toFixed(2);
      } else {
        discountRow.style.display = 'none';
      }
    }
  }

  validateSelections() {
    let valid = true;
    let message = '';
    const self = this;

    this.config.tabs.forEach(function(tab, index) {
      if (tab.requireSelection) {
        const selectedCount = self.selections[index] ? 1 : 0;
        const minQty = tab.minQuantity || 1;

        if (selectedCount < minQty) {
          valid = false;
          message = 'Please select at least ' + minQty + ' item(s) from "' + tab.name + '"';
        }
      }
    });

    this.updateAddToCartButton(valid, message);
    return valid;
  }

  updateAddToCartButton(enabled, message) {
    const btn = this.container.querySelector('.bundle-add-to-cart-btn');
    const validationMsg = this.container.querySelector('.validation-message');

    if (btn) btn.disabled = !enabled;

    if (validationMsg) {
      if (message) {
        validationMsg.textContent = message;
        validationMsg.style.display = 'block';
      } else {
        validationMsg.style.display = 'none';
      }
    }
  }

  setupClearAll() {
    const self = this;
    const clearBtn = this.container.querySelector('.preview-clear-all');
    if (!clearBtn) return;

    clearBtn.addEventListener('click', function() {
      self.selections = {};
      self.quantities = {};
      self.renderTabContent(self.currentTab);
      self.updatePreview();

      // Reset all badges
      const badges = self.container.querySelectorAll('.tab-badge');
      badges.forEach(function(badge) {
        badge.textContent = '0 selected';
        badge.style.display = 'none';
      });
    });

    // Individual item remove
    const previewList = this.container.querySelector('.preview-items-list');
    if (!previewList) return;

    previewList.addEventListener('click', function(e) {
      if (e.target.classList.contains('preview-item-remove')) {
        const tabId = parseInt(e.target.dataset.tabId);
        const productId = e.target.dataset.productId;

        delete self.selections[tabId];
        delete self.quantities[productId];

        self.renderTabContent(self.currentTab);
        self.updatePreview();
        self.updateTabBadge(tabId);
      }
    });
  }

  setupAddToCart() {
    const self = this;
    const btn = this.container.querySelector('.bundle-add-to-cart-btn');
    if (!btn) return;

    btn.addEventListener('click', function() {
      if (!self.validateSelections()) return;

      btn.disabled = true;
      const btnLoading = btn.querySelector('.btn-loading');
      const btnText = btn.querySelector('.btn-text');
      if (btnLoading) btnLoading.style.display = 'inline-block';
      if (btnText) btnText.style.display = 'none';

      self.addToCart()
        .then(function() {
          self.showSuccessMessage();
          setTimeout(function() {
            window.location.href = '/cart';
          }, 1500);
        })
        .catch(function(error) {
          console.error('Add to cart error:', error);
          alert('Failed to add bundle to cart. Please try again.');
        })
        .finally(function() {
          btn.disabled = false;
          if (btnLoading) btnLoading.style.display = 'none';
          if (btnText) btnText.style.display = 'inline-block';
        });
    });
  }

  addToCart() {
    const items = [];
    const self = this;

    // Generate unique bundle instance ID (bundleId + timestamp hash)
    const timestamp = Date.now();
    const bundleInstanceId = self.bundleId + '_' + timestamp;
    console.log('📦 Bundle Instance ID:', bundleInstanceId);

    // Calculate discount for cart attributes
    const totalItems = Object.keys(this.selections).length;
    const subtotal = this.calculateSubtotal();
    const discount = this.calculateDiscount(totalItems, subtotal);

    // Add all selected products with bundle metadata
    Object.keys(this.selections).forEach(function(tabId) {
      const productId = self.selections[tabId];
      const quantity = self.quantities[productId] || 1;

      // Extract variant ID from GID
      let variantId = productId;
      if (productId.includes('gid://shopify/Product/')) {
        // Find the first variant for this product
        const tab = self.config.tabs[parseInt(tabId)];
        const product = tab.products.find(function(p) {
          return p.id === productId;
        });
        if (product && product.variants && product.variants.length > 0) {
          variantId = product.variants[0].id.replace('gid://shopify/ProductVariant/', '');
        }
      }

      items.push({
        id: variantId,
        quantity: quantity,
        properties: {
          '_wolfpack_bundle_id': bundleInstanceId, // CRITICAL: This key must match the GraphQL query
          '_bundle_type': 'full_page',
          '_bundle_name': self.config.name || 'Bundle',
          '_tab_id': tabId
        }
      });
    });

    console.log('🛒 Adding to cart:', items);

    // Add to cart via Shopify API
    return fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items: items })
    })
    .then(function(response) {
      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }
      return response.json();
    });
  }

  calculateSubtotal() {
    let subtotal = 0;
    const self = this;

    Object.keys(this.selections).forEach(function(tabId) {
      const productId = self.selections[tabId];
      const quantity = self.quantities[productId] || 1;

      const tab = self.config.tabs[parseInt(tabId)];
      if (!tab || !tab.products) return;

      const product = tab.products.find(function(p) {
        return p.id === productId;
      });

      if (product) {
        // Get price from variants if available, fallback to product.price
        let priceValue = product.price;
        if (!priceValue && product.variants && product.variants.length > 0) {
          priceValue = product.variants[0].price;
        }
        if (priceValue) {
          const price = parseFloat(priceValue) / 100;
          subtotal += price * quantity;
        }
      }
    });

    return subtotal;
  }

  showSuccessMessage() {
    const successMsg = this.container.querySelector('.bundle-success-message');
    if (!successMsg) return;

    successMsg.style.display = 'block';

    setTimeout(function() {
      successMsg.style.display = 'none';
    }, 3000);
  }
}

// Initialize all bundle builders on page
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOM ready, initializing bundle builders...');
  const builders = document.querySelectorAll('.wolfpack-bundle-builder');
  console.log('📦 Found ' + builders.length + ' bundle builder container(s)');

  builders.forEach(function(container, index) {
    console.log('Initializing container ' + (index + 1) + '...');
    new WolfpackBundleBuilder(container);
  });
});
