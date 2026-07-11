
export const ProductPageDomMethods = {
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
      <div style="
        font-size: 48px;
        margin-bottom: 16px;
      ">📦</div>
      <h3 style="
        margin: 0 0 12px 0;
        font-size: 20px;
        font-weight: 600;
      ">Bundle Widget Preview</h3>
      <p style="
        margin: 0 0 8px 0;
        font-size: 14px;
        opacity: 0.9;
      ">
        Bundle ID: <code style="
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 8px;
          border-radius: 4px;
          font-family: monospace;
        ">${bundleId}</code>
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
        <div style="
          font-weight: 600;
          margin-bottom: 8px;
        ">✅ Widget Configured Successfully</div>
        <div style="
          opacity: 0.9;
        ">
          This widget will automatically display on <strong>bundle container products</strong>.
          <br><br>
          <strong>To see it in action:</strong>
          <ol style="
            margin: 8px 0;
            padding-left: 20px;
          ">
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
},

// ========================================================================
// DOM SETUP
// ========================================================================

_relocateContainerToProductForm() {
  try {
    if (!this.container || typeof document === 'undefined') return;
    if (this.container.dataset.mountedAfterProductForm === 'true') return;

    const productForm = this._findNativeProductForm();

    if (!productForm) return;

    if (productForm.nextElementSibling !== this.container) {
      productForm.insertAdjacentElement('afterend', this.container);
    }

    this.container.classList.add('bundle-widget-container--product-form-mounted');
    this.container.dataset.mountedAfterProductForm = 'true';
  } catch (_error) {
    // Placement is best-effort; the widget still renders at its original block location.
  }
},

_findNativeProductForm() {
  if (typeof document === 'undefined') return null;

  const selectors = [
    'form[action*="/cart/add"]',
    'product-form form',
    '.product-form form',
    '[data-type="add-to-cart-form"]',
    'form[action^="/cart/add"]'
  ];

  return selectors
    .map(selector => document.querySelector(selector))
    .find(form => form && !form.contains(this.container) && !this.container.contains(form)) || null;
},

_getNativeProductInfoRoot(productForm) {
  return productForm?.closest?.(
    '[id^="ProductInformation-"], .product-details, .group-block-content, .product-information, .product__info-container, .product__info-wrapper, .product__info, product-info, .product'
  ) || productForm?.parentElement || null;
},

_hideNativeProductPrice() {
  try {
    if (!this.container || typeof document === 'undefined') return;

    const productForm = this._findNativeProductForm();
    if (!productForm) return;

    const root = this._getNativeProductInfoRoot(productForm);
    if (!root) return;

    const selectors = [
      '[id^="price-"]',
      '.price.price--large',
      '.product__price',
      '[data-product-price]',
      '.product-price',
      '.price'
    ];

    const priceElements = selectors.flatMap(selector => Array.from(root.querySelectorAll(selector)));
    const uniquePriceElements = Array.from(new Set(priceElements));

    uniquePriceElements
      .filter(element => !this.container.contains(element))
      .filter(element => !element.closest('#bundle-builder-modal'))
      .forEach(element => {
        element.classList.add('wpb-native-product-price--hidden');
        element.setAttribute('data-wpb-native-product-price-hidden', 'true');
        element.style.setProperty('display', 'none', 'important');
      });
  } catch (_error) {
    // Native theme price hiding is best-effort; PPB controls still render if selectors differ.
  }
},

setupDOMElements() {
  const modalEl = this.ensureBottomSheet();

  // Get or create main UI elements
  this.elements = {
    defaultProducts: this.container.querySelector('.bw-default-products') || this._createDirectDefaultProductsEl(),
    stepsContainer: this.container.querySelector('.bundle-steps') || this.createStepsContainer(),
    qtyPillsEl: this.container.querySelector('.bw-qty-pills') || this._createQtyPillsEl(),
    footer: this.container.querySelector('.bundle-footer-messaging') || this.createFooter(),
    addToCartButton: this.container.querySelector('.add-bundle-to-cart') || this.createAddToCartButton(),
    dynamicCheckoutVisual: this.container.querySelector('.bw-ppb-dynamic-checkout-visual') || this._createDynamicCheckoutVisual(),
    modal: modalEl,
    bsOverlay: document.getElementById('bw-bs-overlay') || this._createBottomSheetOverlay()
  };

  // Append elements in display order (default products → steps → qty pills → footer → ATC)
  if (!this.container.querySelector('.bw-default-products')) {
    this.container.appendChild(this.elements.defaultProducts);
  }
  if (!this.container.querySelector('.bundle-steps')) {
    this.container.appendChild(this.elements.stepsContainer);
  }
  if (!this.container.querySelector('.bw-qty-pills')) {
    this.container.appendChild(this.elements.qtyPillsEl);
  }
  if (!this.container.querySelector('.bundle-footer-messaging')) {
    this.container.appendChild(this.elements.footer);
  }
  if (!this.container.querySelector('.add-bundle-to-cart')) {
    this.container.appendChild(this.elements.addToCartButton);
  }
  if (!this.container.querySelector('.bw-ppb-dynamic-checkout-visual')) {
    this.container.appendChild(this.elements.dynamicCheckoutVisual);
  }

  [
    this.elements.defaultProducts,
    this.elements.stepsContainer,
    this.elements.qtyPillsEl,
    this.elements.footer,
    this.elements.addToCartButton,
    this.elements.dynamicCheckoutVisual,
  ].forEach(element => {
    element?.removeAttribute?.('hidden');
    element?.removeAttribute?.('aria-hidden');
  });
},

_createQtyPillsEl() {
  const el = document.createElement('div');
  el.className = 'bw-qty-pills';
  el.style.display = 'none';
  return el;
},

_createDirectDefaultProductsEl() {
  const el = document.createElement('div');
  el.className = 'bw-default-products';
  el.style.display = 'none';
  return el;
},

_createBottomSheetOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'bw-bs-overlay';
  overlay.className = 'bw-bs-overlay';
  document.body.appendChild(overlay);
  return overlay;
},

/**
 * Creates the bottom-sheet panel using the SAME inner DOM structure as ensureModal()
 * so all existing renderModalProducts / renderModalTabs / tab-arrow code works unchanged.
 */
ensureBottomSheet() {
  let panel = document.getElementById('bundle-builder-modal');

  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'bundle-builder-modal';
    // bundle-builder-modal class required so Settings design CSS selectors apply to this panel
    panel.className = 'bw-bs-panel bundle-builder-modal';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-hidden', 'true');
    panel.setAttribute('inert', '');
    panel.hidden = true;
    panel.innerHTML = `
      <div class="modal-header bw-bs-header">
        <!-- Desktop close: × absolute top-right -->
        <button class="close-button bw-bs-close-desktop" aria-label="Close">
          <svg viewBox="0 0 20 20" width="20" height="20" focusable="false" aria-hidden="true" fill="currentColor">
            <path d="M13.97 15.03a.75.75 0 1 0 1.06-1.06l-3.97-3.97 3.97-3.97a.75.75 0 0 0-1.06-1.06l-3.97 3.97-3.97-3.97a.75.75 0 0 0-1.06 1.06l3.97 3.97-3.97 3.97a.75.75 0 1 0 1.06 1.06l3.97-3.97 3.97 3.97Z"/>
          </svg>
        </button>
        <!-- Mobile close: chevron-down absolute top-center -->
        <button class="close-button bw-bs-close-mobile" aria-label="Close">
          <svg width="40" height="24" viewBox="0 0 70 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M20.0188 8.6438C21.044 7.6187 22.706 7.6187 23.7312 8.6438L35.875 20.7877L48.0188 8.6438C49.044 7.6187 50.706 7.6187 51.7312 8.6438C52.7563 9.669 52.7563 11.331 51.7312 12.3562L37.7312 26.3562C36.706 27.3813 35.044 27.3813 34.0188 26.3562L20.0188 12.3562C18.9937 11.331 18.9937 9.669 20.0188 8.6438Z" fill="#4A4A4A"/>
          </svg>
        </button>
        <!-- Category tabs — grid layout, equal columns -->
        <div class="modal-tabs-wrapper bw-bs-tabs-wrapper">
          <div class="modal-tabs bw-bs-tabs"></div>
        </div>
        <!-- "Choose X" step title -->
        <div class="modal-step-title bw-bs-choose-title"></div>
        <!-- Discount / progress messaging -->
        <div class="bw-bs-discount-bar footer-discount-text"></div>
      </div>
      <div class="modal-body bw-bs-body">
        <div class="product-grid bw-bs-product-grid"></div>
      </div>
      <div class="modal-footer bw-bs-footer">
        <!-- Cart count pill (white, floats above nav pill) -->
        <div class="bw-bs-cart-pill">
          <span class="bw-bs-cart-price">
            <span class="total-price-strike"></span>
            <span class="total-price-final">$0.00</span>
          </span>
          <span class="bw-bs-cart-divider"></span>
          <span class="cart-badge-count">0</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M3 4.5C3 4.22386 3.22386 4 3.5 4H5.5C5.73 4 5.93 4.16 5.98 4.385L6.52 7H20.5C20.76 7 20.99 7.14 21.1 7.37C21.21 7.6 21.18 7.88 21.02 8.08L17.02 13.08C16.85 13.29 16.6 13.41 16.33 13.41H8.66L8.07 16H19.5C19.78 16 20 16.22 20 16.5C20 16.78 19.78 17 19.5 17H7.5C7.27 17 7.07 16.84 7.02 16.615L5.02 7.615L4.5 5H3.5C3.22 5 3 4.78 3 4.5ZM8 19.5C8 20.33 7.33 21 6.5 21C5.67 21 5 20.33 5 19.5C5 18.67 5.67 18 6.5 18C7.33 18 8 18.67 8 19.5ZM19 19.5C19 20.33 18.33 21 17.5 21C16.67 21 16 20.33 16 19.5C16 18.67 16.67 18 17.5 18C18.33 18 19 18.67 19 19.5Z" fill="#333"/>
          </svg>
        </div>
        <!-- PREV/NEXT nav pill (navy blue) -->
        <div class="bw-bs-nav-pill">
          <button class="modal-nav-button prev-button bw-bs-nav-btn" aria-label="Previous step">
            Prev
          </button>
          <button class="modal-nav-button next-button bw-bs-nav-btn" aria-label="Next step">
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(panel);
    // No tab scroll arrows needed — tabs use CSS grid layout
  }

  return panel;
},

setBottomSheetVisibility(isOpen) {
  const modal = this.elements?.modal;
  if (!modal) return;

  if (isOpen) {
    modal.hidden = false;
    modal.removeAttribute('aria-hidden');
    modal.removeAttribute('inert');
    return;
  }

  const hideModal = () => {
    if (modal.classList.contains('bw-bs-panel--open')) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('inert', '');
  };

  if (typeof modal.addEventListener === 'function') {
    modal.addEventListener('transitionend', hideModal, { once: true });
  }
  window.setTimeout(hideModal, 350);
},

createStepsContainer() {
  const container = document.createElement('div');
  container.className = 'bundle-steps';
  return container;
},

createFooter() {
  const footer = document.createElement('div');
  footer.className = 'bundle-footer-messaging';
  footer.style.display = 'none';
  return footer;
},

createAddToCartButton() {
  const button = document.createElement('button');
  button.className = 'add-bundle-to-cart';
  button.textContent = this._resolveText('addToCartButton', 'Add Bundle to Cart');
  button.type = 'button';
  return button;
},

_createDynamicCheckoutVisual() {
  const button = document.createElement('div');
  button.className = 'bw-ppb-dynamic-checkout-visual';
  button.setAttribute('role', 'button');
  button.setAttribute('aria-disabled', 'true');
  button.textContent = 'Buy it now';
  return button;
},

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
};
