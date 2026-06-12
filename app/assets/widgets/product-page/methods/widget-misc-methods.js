import { createDefaultLoadingAnimation } from '../../shared/default-loading-animation.js';
import { hideLoadingOverlayElement, markLoadingOverlayVisible } from '../../shared/loading-overlay.js';

export const ProductPageWidgetMiscMethods = {
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
  // Force a synchronous reflow so the browser applies the initial opacity:0
  // before we add 'is-visible'. Using offsetHeight instead of requestAnimationFrame
  // avoids a race condition where hideLoadingOverlay() is called before the rAF
  // fires (which happens when loadBundleData() resolves synchronously from the
  // dataset attribute — microtasks settle before animation frames).
  // eslint-disable-next-line no-unused-expressions
  overlay.offsetHeight;
  markLoadingOverlayVisible(overlay);
},

hideLoadingOverlay() {
  const overlay = this.container?.querySelector('.bundle-loading-overlay');
  hideLoadingOverlayElement(overlay);
},

// ========================================================================
// EVENT HANDLERS
// ========================================================================

attachEventListeners() {
  // Add to cart button
  this.elements.addToCartButton.addEventListener('click', () => this.addToCart());

  // Modal close handlers
  const modal = this.elements.modal;
  const closeButton = modal.querySelector('.close-button');
  const prevButton = modal.querySelector('.prev-button');
  const nextButton = modal.querySelector('.next-button');

  if (closeButton) {
    closeButton.addEventListener('click', () => this.closeModal());
  }

  // Overlay closes bottom-sheet
  if (this.elements.bsOverlay) {
    this.elements.bsOverlay.addEventListener('click', () => this.closeModal());
  }
  if (prevButton) prevButton.addEventListener('click', () => this.navigateModal(-1));
  if (nextButton) nextButton.addEventListener('click', () => this.navigateModal(1));

  // Keyboard: close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('bw-bs-panel--open')) {
      this.closeModal();
    }
  });
},

async navigateModal(direction) {
  const newStepIndex = this.currentStepIndex + direction;

  if (direction < 0 && newStepIndex >= 0) {
    // Previous step — always allowed, no validation required
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
},

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
},

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
},

_resolveText(key, fallback) {
  const locale = window.Shopify?.locale;
  if (locale && this.config?.textOverridesByLocale?.[locale]?.[key]) {
    return this.config.textOverridesByLocale[locale][key];
  }
  if (this.config?.textOverrides?.[key]) {
    return this.config.textOverrides[key];
  }
  return fallback;
},

_recordView() {
  try {
    const bundleId = this.container?.dataset?.bundleId;
    const shop = window.Shopify?.shop;
    if (!bundleId || !shop) return;
    fetch(`/apps/product-bundles/api/bundle/${bundleId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shop }),
      keepalive: true,
    }).catch(() => { /* best-effort */ });
  } catch (_) {
    // Never throw from analytics
  }
}
};
