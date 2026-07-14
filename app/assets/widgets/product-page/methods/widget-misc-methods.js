import { createDefaultLoadingAnimation } from '../../shared/default-loading-animation.js';
import { hideLoadingOverlayElement, markLoadingOverlayVisible } from '../../shared/loading-overlay.js';
import { ToastManager } from '../../../bundle-widget-components.js';
import {
  formatProductPageStepValidationToast,
  getProductPageModalValidationToastOptions,
} from './modal-state-methods.js';
import { getLastRequiredProductPageStepIndex } from './step-validation.js';

const MIN_LOADING_OVERLAY_VISIBLE_MS = 180;

export const ProductPageWidgetMiscMethods = {
showLoadingOverlay(gifUrl, options = {}) {
  if (!this.container) return;
  if (options.bootstrap === true) {
    this.container.dataset.wpbBootstrapLoading = 'true';
  }
  // Ensure container is positioned so absolute overlay works
  const pos = getComputedStyle(this.container).position;
  if (pos !== 'relative' && pos !== 'absolute' && pos !== 'fixed' && pos !== 'sticky') {
    this.container.style.position = 'relative';
  }
  // Remove any existing overlay (idempotent)
  this.container.querySelector('.bundle-loading-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'bundle-loading-overlay';
  overlay.style.minHeight = 'var(--bundle-ppb-loading-overlay-min-height, 180px)';
  overlay.style.minWidth = 'var(--bundle-ppb-loading-overlay-min-width, 180px)';

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

  // Keep overlay visible briefly so we avoid a flash that never renders.
  this._bundleLoadingOverlayToken = (this._bundleLoadingOverlayToken || 0) + 1;
  this._loadingOverlayShownAt = performance.now();
  overlay.dataset.wpbLoadingToken = String(this._bundleLoadingOverlayToken);
  markLoadingOverlayVisible(overlay);
},

hideLoadingOverlay() {
  const overlay = this.container?.querySelector('.bundle-loading-overlay');
  if (!overlay) return;
  const overlayToken = Number(overlay.dataset.wpbLoadingToken || 0);
  if (!overlayToken || overlayToken !== this._bundleLoadingOverlayToken) return;

  const visibleMs = performance.now() - (this._loadingOverlayShownAt || 0);
  const delayMs = Math.max(0, MIN_LOADING_OVERLAY_VISIBLE_MS - visibleMs);

  window.setTimeout(() => {
    if (this._bundleLoadingOverlayToken !== overlayToken) return;
    this._bundleLoadingOverlayToken = 0;
    delete this.container.dataset.wpbBootstrapLoading;
    hideLoadingOverlayElement(overlay);
  }, delayMs);
},

// ========================================================================
// EVENT HANDLERS
// ========================================================================

attachEventListeners() {
  // Add to cart button
  this.elements.addToCartButton.addEventListener('click', () => {
    const lastRequiredStepIndex = getLastRequiredProductPageStepIndex(this.selectedBundle?.steps);
    const isIntermediateCascadeStep = this._usesCascadeStepFlow?.()
      && this.currentStepIndex < lastRequiredStepIndex;
    if (isIntermediateCascadeStep) {
      const navigated = this.navigateCascadeStep(1);
      if (!navigated && this._isProductPageGridTemplate?.() === true) {
        const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
        ToastManager.show(
          formatProductPageStepValidationToast(currentStep)
            || 'Please meet the quantity conditions for the current step before proceeding.',
          4000,
          {
            dismissible: false,
            className: 'bundle-toast--cognive',
          },
        );
      }
      return;
    }
    this.addToCart();
  });

  // Modal close handlers
  const modal = this.elements.modal;
  const closeButtons = modal.querySelectorAll('.close-button');
  const prevButton = modal.querySelector('.prev-button');
  const nextButton = modal.querySelector('.next-button');

  closeButtons.forEach((closeButton) => {
    closeButton.addEventListener('click', () => this.closeModal());
  });

  // Overlay closes bottom-sheet
  if (this.elements.bsOverlay) {
    this.elements.bsOverlay.addEventListener('click', () => this.closeModal());
  }
  if (prevButton) prevButton.addEventListener('click', () => this.navigateModal(-1));
  if (nextButton) nextButton.addEventListener('click', () => this.navigateModal(1));

  // Keyboard: close on Escape
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('bw-bs-panel--open')) return;

    const target = e.target;
    if (target && (target.tagName === 'INPUT' || target.isContentEditable)) return;

    if (e.key === 'Escape') {
      this.closeModal();
      return;
    }

    if (e.key === 'ArrowLeft' && prevButton) {
      e.preventDefault();
      prevButton.click?.();
      return;
    }

    if (e.key === 'ArrowRight' && nextButton) {
      e.preventDefault();
      nextButton.click?.();
      return;
    }

    if (e.key === 'Tab') {
      const controls = typeof this._getModalFocusableControls === 'function'
        ? this._getModalFocusableControls()
        : [];
      if (!controls.length) return;

      const current = controls.indexOf(globalThis.document?.activeElement);
      const isActiveInModal = current >= 0;
      const fromIndex = isActiveInModal ? current : -1;
      const nextIndex = e.shiftKey
        ? (fromIndex > 0 ? fromIndex - 1 : controls.length - 1)
        : (fromIndex >= 0 && fromIndex < controls.length - 1 ? fromIndex + 1 : 0);

      e.preventDefault();
      controls[nextIndex]?.focus?.();
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
    const header = this.elements.modal.querySelector('.modal-step-title');
    if (header) {
      header.textContent = headerText;
    }

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
    const shouldValidateConditions = this._isConditionValidationEnabled?.() !== false;

    if (newStepIndex < this.selectedBundle.steps.length) {
      // Next step
      if (!shouldValidateConditions || this.validateStep(this.currentStepIndex)) {
        this.currentStepIndex = newStepIndex;

        // Update modal header
        const headerText = this.getFormattedHeaderText();
        const header = this.elements.modal.querySelector('.modal-step-title');
        if (header) {
          header.textContent = headerText;
        }

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
        const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
        const message = formatProductPageStepValidationToast(currentStep)
          || 'Please meet the quantity conditions for the current step before proceeding.';
        ToastManager.show(message, 4000, getProductPageModalValidationToastOptions());
      }
    } else {
      // Done button clicked on last step
      if (!shouldValidateConditions || this.validateStep(this.currentStepIndex)) {
        this.closeModal();
      } else {
        const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
        const message = formatProductPageStepValidationToast(currentStep)
          || 'Please meet the quantity conditions for the current step before finishing.';
        ToastManager.show(message, 4000, getProductPageModalValidationToastOptions());
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
