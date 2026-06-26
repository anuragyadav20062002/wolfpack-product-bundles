import {
  BUNDLE_WIDGET,
  CurrencyManager,
  BundleDataManager,
  PricingCalculator,
  ToastManager,
  TemplateManager,
  ComponentGenerator
} from '../../../bundle-widget-components.js';
import { ConditionValidator } from '../../shared/condition-validator.js';
import { createDefaultLoadingAnimation } from '../../shared/default-loading-animation.js';
import { hideLoadingOverlayElement, markLoadingOverlayVisible } from '../../shared/loading-overlay.js';
import { getDiscountProgressData, getSelectedQuantity, getTimelineEntryState } from '../../shared/engine/bundle-selectors.js';
import { renderDiscountProgress } from '../../shared/components/discount-progress.js';
import { createBundleBannerElement, createStepBannerImageElement } from '../../shared/components/bundle-banners.js';
import { renderSharedProductCard } from '../../shared/components/product-card.js';
import { renderSelectedProductRow } from '../../shared/components/selected-product-row.js';
import { renderSelectedProductSlots } from '../../shared/components/selected-product-slots.js';
import { renderStepTimelineEntry } from '../../shared/components/step-timeline.js';
import {
  buildCartLineDisplayProperties,
  buildCartLineSourceProperties,
} from '../../shared/engine/cart-lines.js';

export function shouldAutoAdvanceFullPageStep({ quantity = 0, step = null } = {}) {
  const categories = Array.isArray(step?.categories) ? step.categories : [];
  const categoryRuleCategories = categories.filter(category =>
    Array.isArray(category?.conditions) && category.conditions.length > 0
  );

  if (!(quantity > 0) || categoryRuleCategories.length === 0) {
    return false;
  }

  return categoryRuleCategories.some(category => category.autoNextStepOnConditionMet === true);
}

export const fullPageSelectionNavigationMethods = {
updateProductSelection(stepIndex, productId, newQuantity) {
  let quantity = Math.max(0, newQuantity);

  // Clamp against real per-variant stock before doing anything else.
  // Uses quantityAvailable from the Storefront API (see getVariantAvailable).
  // Adding 0 always allowed (that is a removal).
  if (quantity > 0) {
    const { available, outOfStock } = this.getVariantAvailable(stepIndex, productId);
    if (outOfStock) {
      ToastManager.show('This item is out of stock.');
      return;
    }
    if (available !== null && available > 0 && quantity > available) {
      quantity = available;
      ToastManager.show('Only ' + available + ' in stock — quantity adjusted.');
    }
  }

  // Validate step conditions
    if (!this.validateStepCondition(stepIndex, productId, quantity)) {
      return;
    }

  const currentQuantity = this.selectedProducts[stepIndex]?.[productId] || 0;
  const productQuantityCheck = ConditionValidator.canUpdateProductQuantity(
    this.selectedBundle?.validateQuantityPerProduct,
    currentQuantity,
    quantity,
  );
  if (!productQuantityCheck.allowed) {
    ToastManager.show('Maximum allowed quantity per product is ' + productQuantityCheck.limit + '.');
    return;
  }

  // Update selection
  if (quantity > 0) {
    this.selectedProducts[stepIndex][productId] = quantity;
  } else {
    delete this.selectedProducts[stepIndex][productId];
  }

  // Storefront analytics: emit selection delta + first-interaction beacon.
  const selectionEventName = (currentQuantity === 0 && quantity > 0) ? 'product-selected'
    : (currentQuantity > 0 && quantity === 0) ? 'product-deselected'
    : 'product-quantity-changed';
  this._emitStorefrontEvent(selectionEventName, { stepIndex, productId, previousQuantity: currentQuantity, quantity });
  this._emitStorefrontEvent('session-engaged', { trigger: selectionEventName });
  this._sendEngagementBeacon('session-engaged');

  // Re-lock free gift if a paid item was just removed and conditions no longer met
  this._syncFreeGiftLock();

  // Update UI without re-rendering the entire modal (prevents event listener duplication)
  this.updateProductQuantityDisplay(stepIndex, productId, quantity);
  this.renderModalTabs();
  this.updateModalNavigation();
  this.updateModalFooterMessaging();

  // For full-page bundles, re-render the footer/sidebar to show selected products
  const bundleType = this.container.dataset.bundleType;
  if (bundleType === 'full_page') {
    const layout = this.resolveFullPageLayout();
    if (layout === 'footer_side') {
      const sidePanel = this.elements.stepsContainer.querySelector('.full-page-side-panel');
      this.renderSidePanel(sidePanel);
      if (window.matchMedia?.('(max-width: 767px)').matches) {
        this._renderMobileBottomBar({ preserveOpen: true });
      }
    } else {
      this.renderFullPageFooter();
    }
    // Update step timeline tabs so completion state, images, counts, and
    // click listeners all reflect the new selection immediately.
    this.updateStepTimeline();

    // Auto-advance is category-rule only. Step rules gate navigation, but the reference
    // exposes the auto-next opt-in only on category rules.
    const _autoAdvanceStep = this.selectedBundle?.steps?.[this.currentStepIndex];
    if (!this._autoAdvancePending && shouldAutoAdvanceFullPageStep({ quantity, step: _autoAdvanceStep })) {
      const isLastStep = this.currentStepIndex === this.selectedBundle.steps.length - 1;
      if (!isLastStep && this.isStepCompleted(this.currentStepIndex) && this.canNavigateToStep(this.currentStepIndex + 1)) {
        this._autoAdvancePending = true;
        setTimeout(() => {
          this._autoAdvancePending = false;
          // Re-check in case the shopper removed something during the delay
          if (this.isStepCompleted(this.currentStepIndex) && this.canNavigateToStep(this.currentStepIndex + 1)) {
            this.activeCollectionId = null;
            this.searchQuery = '';
            this.currentStepIndex++;
            const layout = this.resolveFullPageLayout();
            if (layout === 'footer_side') {
              this._sidebarAdvanceToNextStep();
            } else {
              this.reRenderFullPage();
            }
          }
        }, 120);
      }
    }
  } else {
    this.updateFooterMessaging();
  }
},

_shouldRenderProductSlots() {
  return this.selectedBundle?.productSlotsEnabled === true;
},

updateProductQuantityDisplay(stepIndex, productId, quantity) {
  if (this.usesSelectedQuantityBadge()) {
    this.refreshCurrentProductGrid(stepIndex);
    if (this.elements?.modal?.querySelector('.product-grid')) {
      this.renderModalProducts(stepIndex);
    }
    this._refreshSiblingDimState(stepIndex);
    return;
  }

  // Update quantity display without full re-render
  const productCard = this.container.querySelector('[data-product-id="' + productId + '"]');
  if (!productCard) return;

  // Find existing action elements
  const contentWrapper = productCard.querySelector('.product-content-wrapper');
  const actionWrapper = productCard.querySelector('.product-card-action');
  if (!contentWrapper && !actionWrapper) return;

  const actionContainer = actionWrapper || contentWrapper;
  const existingAddBtn = productCard.querySelector('.product-add-btn');
  const existingQuantityControls = productCard.querySelector('.inline-quantity-controls');

  // Toggle between "Add to Bundle" button and quantity controls
  if (quantity > 0) {
    if (actionWrapper) {
      actionWrapper.classList.add('is-expanded');
    }

    if (existingQuantityControls) {
      if (existingAddBtn) {
        existingAddBtn.remove();
      }
      // Just update the quantity display
      const qtyDisplay = existingQuantityControls.querySelector('.inline-qty-display');
      if (qtyDisplay) {
        qtyDisplay.textContent = quantity;
      }
    } else {
      if (existingAddBtn) {
        existingAddBtn.remove();
      }
      // Create quantity controls
      const quantityControls = document.createElement('div');
      quantityControls.className = 'inline-quantity-controls';
      quantityControls.innerHTML =
        '<button class="inline-qty-btn qty-decrease" data-product-id="' + productId + '">−</button>' +
        '<span class="inline-qty-display">' + quantity + '</span>' +
        '<button class="inline-qty-btn qty-increase" data-product-id="' + productId + '">+</button>';
      actionContainer.appendChild(quantityControls);

      // Attach event listeners to the new buttons
      const increaseBtn = quantityControls.querySelector('.qty-increase');
      const decreaseBtn = quantityControls.querySelector('.qty-decrease');

      if (increaseBtn) {
        increaseBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const currentQty = this.selectedProducts[stepIndex]?.[productId] || 0;
          this.updateProductSelection(stepIndex, productId, currentQty + 1);
        });
      }

      if (decreaseBtn) {
        decreaseBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const currentQty = this.selectedProducts[stepIndex]?.[productId] || 0;
          if (currentQty > 0) {
            this.updateProductSelection(stepIndex, productId, currentQty - 1);
          }
        });
      }
    }

    productCard.classList.add('bw-product-card--selected');

  } else {
    if (actionWrapper) {
      actionWrapper.classList.remove('is-expanded');
    }

    // Show "Add to Bundle" button, hide quantity controls
    if (existingQuantityControls) {
      existingQuantityControls.remove();
    }

    if (!existingAddBtn) {
      const addButton = document.createElement('button');
      addButton.className = 'product-add-btn';
      addButton.dataset.productId = productId;
      addButton.textContent = this.getProductAddButtonText();
      actionContainer.appendChild(addButton);

      // Attach event listener to the new button
      addButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.updateProductSelection(stepIndex, productId, 1);
      });
    }

    productCard.classList.remove('bw-product-card--selected');
  }

  // Refresh dimmed state on all sibling cards now that the selection has changed
  this._refreshSiblingDimState(stepIndex);
},

refreshCurrentProductGrid(stepIndex) {
  if (this.container.dataset.bundleType !== 'full_page') return false;
  if (stepIndex !== this.currentStepIndex) return false;

  const currentGrid = this.container.querySelector('.full-page-product-grid');
  if (!currentGrid) return false;

  const replacementGrid = this.createFullPageProductGrid(stepIndex);
  currentGrid.replaceWith(replacementGrid);
  return true;
},

// Refresh the .dimmed class on every card in the current step's product grid.
// Called after every real-time selection change so cards gray out (or un-gray)
// immediately when the step quota is filled or freed — not only on full re-renders.
_refreshSiblingDimState(stepIndex) {
  // Only update the DOM if this step's grid is currently visible.
  // When a product is removed via the footer while on a different step,
  // skip the DOM update — createFullPageProductGrid will apply the correct
  // dim state when the user navigates to that step.
  if (stepIndex !== this.currentStepIndex) return;
  const step = this.selectedBundle?.steps?.[stepIndex];
  if (!step) return;
  const stepSelections = this.selectedProducts[stepIndex] || {};
  const capacityCheck = ConditionValidator.canUpdateQuantity(step, stepSelections, '__new__', 1);
  const isAtCapacity = !capacityCheck.allowed;
  // Only one step's grid is visible at a time; navigate up from any card in it
  const anyCard = this.container.querySelector('.product-grid .product-card');
  const grid = anyCard?.closest('.product-grid');
  if (!grid) return;
  grid.querySelectorAll('.product-card').forEach(card => {
    const cardProductId = card.dataset.productId;
    const currentQty = cardProductId ? (stepSelections[cardProductId] || 0) : 0;
    if (isAtCapacity && currentQty === 0) {
      card.classList.add('dimmed');
    } else {
      card.classList.remove('dimmed');
    }
  });
},

// Helper to find product by ID across all step data
findProductById(stepIndex, productId) {
  const products = this.stepProductData[stepIndex] || [];
  return products.find(p => (p.variantId || p.id) === productId);
},

validateStepCondition(stepIndex, productId, newQuantity) {
  const step = this.selectedBundle.steps[stepIndex];
  const currentSelections = this.selectedProducts[stepIndex] || {};
  const currentQty = currentSelections[productId] || 0;

  const { allowed, limitText } = ConditionValidator.canUpdateQuantity(
    step,
    currentSelections,
    productId,
    newQuantity,
  );

  // Only block and toast on increases — decreases are always permitted.
  if (!allowed && newQuantity > currentQty) {
    const toastMessage = typeof ConditionValidator._formatStepLimitToast === 'function'
      ? ConditionValidator._formatStepLimitToast(limitText, step.conditionValue)
      : 'This step allows ' + limitText + ' product' + (step.conditionValue !== 1 ? 's' : '') + ' only.';
    ToastManager.show(toastMessage);
    return false;
  }

  return true;
},

validateStep(stepIndex) {
  const step = this.selectedBundle.steps[stepIndex];
  const currentSelections = this.selectedProducts[stepIndex] || {};

  // In category-rule mode, selection keys are numeric variant IDs but
  // category product IDs are numeric product IDs (GID-stripped). Translate
  // each variant-ID key → its parent product ID before the validator runs.
  if (ConditionValidator.isCategoryRuleMode(step)) {
    const products = this.stepProductData[stepIndex] || [];
    const translated = {};
    for (const [selKey, qty] of Object.entries(currentSelections)) {
      const product = products.find(p => (p.variantId || p.id) === selKey);
      const productId = String((product && (product.parentProductId || product.id)) || selKey);
      translated[productId] = (translated[productId] || 0) + (Number(qty) || 0);
    }
    return ConditionValidator.isStepConditionSatisfied(step, translated);
  }

  return ConditionValidator.isStepConditionSatisfied(step, currentSelections);
},

isStepAccessible(stepIndex) {
  // Default steps are always accessible (read-only, pre-selected)
  if (this.selectedBundle?.steps[stepIndex]?.isDefault) return true;
  // Add-on step: lock until prior steps complete only when addonUnlockAfterCompletion is true (default)
  const addonStep = this.selectedBundle?.steps[stepIndex];
  if (addonStep?.isFreeGift && addonStep?.addonUnlockAfterCompletion === false) {
    // unlock flag disabled — treat as regular step (fall through to standard check)
  } else if (!this.canNavigateToStep(stepIndex)) {
    return false;
  }
  // Check if all previous steps are completed
  for (let i = 0; i < stepIndex; i++) {
    const step = this.selectedBundle?.steps[i];
    if (step?.isFreeGift || step?.isDefault) continue; // skip non-blocking steps
    if (!this.validateStep(i)) return false;
  }
  return true;
},

updateModalNavigation() {
  const prevButton = this.elements.modal?.querySelector('.prev-button');
  const nextButton = this.elements.modal?.querySelector('.next-button');

  // In full-page mode the modal may be hidden/empty — skip without crashing
  if (!prevButton || !nextButton) return;

  prevButton.disabled = this.currentStepIndex === 0;

  const isCurrentStepValid = this.validateStep(this.currentStepIndex);

  if (this.currentStepIndex === this.selectedBundle.steps.length - 1) {
    nextButton.textContent = this._resolveText('doneButton', 'Done');
    nextButton.disabled = !isCurrentStepValid;
  } else {
    nextButton.textContent = this._resolveText('nextButton', 'Next');
    nextButton.disabled = !isCurrentStepValid;
  }
},

updateModalFooterMessaging() {
  // Skip if modal is not active (full-page mode uses inline footer instead)
  if (!this.elements.modal || this.elements.modal.style.display === 'none') return;

  const { totalPrice, totalQuantity, unitPrices } = PricingCalculator.calculateBundleTotal(
    this.selectedProducts,
    this.stepProductData,
    this.selectedBundle?.steps
  );

  const discountInfo = PricingCalculator.calculateDiscount(
    this.selectedBundle,
    totalPrice,
    totalQuantity,
    unitPrices
  );
  const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);

  const currencyInfo = CurrencyManager.getCurrencyInfo();

  // Update modal header text dynamically
  this.updateModalHeaderText(totalPrice, totalQuantity, combinedDiscountInfo, currencyInfo);

  // Update cart badge with total item count
  const cartBadge = this.elements.modal.querySelector('.cart-badge-count');
  if (cartBadge) {
    cartBadge.textContent = totalQuantity.toString();
  }

  // Update total prices in the footer pill
  this.updateFooterTotalPrices(totalPrice, combinedDiscountInfo, currencyInfo);

  // Update discount messaging and progress bar
  this.updateModalDiscountMessaging(totalPrice, totalQuantity, combinedDiscountInfo, currencyInfo);
},
};
