import { ConditionValidator } from '../../shared/condition-validator.js';
import { ToastManager } from '../../../bundle-widget-components.js';

function bsFindNextIncompleteStep(steps, selectedProducts, validateFn, fromIndex) {
  for (let i = fromIndex + 1; i < steps.length; i++) {
    if (steps[i].isDefault || steps[i].isFreeGift) continue;
    if (!validateFn(i)) return i;
  }
  return -1;
}

export const ProductPageSelectionMethods = {
updateProductSelection(stepIndex, productId, newQuantity) {
  const selectionKey = this.normalizeSelectionKey(productId);
  let quantity = Math.max(0, newQuantity);
  const directDefaultRequiredQuantity = this._getDirectDefaultRequiredQuantity(selectionKey);
  if (directDefaultRequiredQuantity !== null && quantity < directDefaultRequiredQuantity) {
    quantity = directDefaultRequiredQuantity;
  }

  // Clamp against real per-variant stock before doing anything else.
  // Uses quantityAvailable from the Storefront API (see getVariantAvailable).
  // Adding 0 always allowed (that is a removal).
  if (quantity > 0) {
    const { available, outOfStock } = this.getVariantAvailable(stepIndex, selectionKey);
    if (outOfStock) {
      ToastManager.show('This item is out of stock.');
      return;
    }
    if (available !== null && quantity > available) {
      quantity = available;
      ToastManager.show(`Only ${available} in stock — quantity adjusted.`);
    }
  }

  const currentQuantity = this.getSelectedQuantity(stepIndex, selectionKey);
  const productQuantityCheck = ConditionValidator.canUpdateProductQuantity(
    this.selectedBundle?.validateQuantityPerProduct,
    currentQuantity,
    quantity,
  );
  if (!productQuantityCheck.allowed) {
    ToastManager.show(`Maximum allowed quantity per product is ${productQuantityCheck.limit}.`);
    return;
  }

  // Validate step conditions
  if (!this.validateStepCondition(stepIndex, selectionKey, quantity)) {
    return;
  }

  this.setSelectedQuantity(stepIndex, selectionKey, quantity);

  // Update UI without re-rendering the entire modal (prevents event listener duplication)
  this.updateProductQuantityDisplay(stepIndex, selectionKey, quantity);
  this._renderDirectDefaultProducts();
  this.renderModalTabs();
  this.updateModalNavigation();
  this.updateModalFooterMessaging();
  this.updateAddToCartButton();
  this.updateFooterMessaging();
  // Sync free gift slot lock/unlock state — selection changes on paid steps can cross
  // the unlock threshold, so the slot card must reflect the current isFreeGiftUnlocked state.
  this._syncFreeGiftSlotCard();

  // Auto-step progression
  this._autoProgressBottomSheet(stepIndex);
  this._maybeAutoAddAfterLastStep();
},

_maybeAutoAddAfterLastStep() {
  const controls = this._getProductPageControls();
  if (controls?.addBundleToCartAfterLastStepCompleted !== true) return;
  if (this._autoAddingFromControls) return;
  if (!this.selectedBundle?.steps?.length) return;

  const allStepsValid = this.selectedBundle.steps.every((step, index) => {
    if (step.isFreeGift || step.isDefault) return true;
    return this.validateStep(index);
  });
  if (!allStepsValid) return;

  this._autoAddingFromControls = true;
  this.addToCart().finally(() => {
    this._autoAddingFromControls = false;
  });
},

/**
 * Re-render only the free gift slot card in the main stepsContainer to reflect
 * the current isFreeGiftUnlocked state. Called after every paid-step selection
 * change so the lock/unlock state stays in sync without a full renderSteps() pass.
 */
_syncFreeGiftSlotCard() {
  const freeGiftIdx = this.freeGiftStepIndex;
  if (freeGiftIdx === -1 || !this.elements.stepsContainer) return;
  const existing = this.elements.stepsContainer.querySelector(`[data-step-index="${freeGiftIdx}"]`);
  if (!existing) return;
  const step = this.selectedBundle?.steps[freeGiftIdx];
  if (!step?.isFreeGift) return;
  const fresh = this.createFreeGiftSlotCard(step, freeGiftIdx);
  existing.replaceWith(fresh);
},

/**
 * Bottom-sheet auto-step progression.
 * Called after every product selection update.
 * If the current step's condition is now met, advances to the next incomplete step,
 * or closes the modal if all steps are complete.
 */
_autoProgressBottomSheet(stepIndex) {
  if (!this.validateStep(stepIndex)) return; // current step not yet complete

  const next = bsFindNextIncompleteStep(
    this.selectedBundle.steps,
    this.selectedProducts,
    (i) => this.validateStep(i),
    stepIndex
  );

  if (next === -1) {
    // All steps complete — refresh tabs with checkmarks, then close
    this.renderModalTabs();
    setTimeout(() => this.closeModal(), 500);
  } else {
    // Advance to next incomplete step tab
    this.renderModalTabs();
    setTimeout(() => {
      this.currentStepIndex = next;
      const modal = this.elements.modal;
      const headerText = this.getFormattedHeaderText();
      modal.querySelector('.modal-step-title').innerHTML = headerText;
      this.renderModalProductsLoading(next);
      this.renderModalTabs();
      this.updateModalNavigation();
      this.loadStepProducts(next).then(() => {
        if (this.currentStepIndex !== next) return;
        this.renderModalProducts(next);
        this.updateModalFooterMessaging();
        this.preloadNextStep();
      }).catch(() => {});
    }, 300);
  }
},

updateProductQuantityDisplay(stepIndex, productId, quantity) {
  // Update quantity display without full re-render
  const scope = this.elements.modal?.classList.contains('bw-bs-panel--open')
    ? this.elements.modal
    : this.container;
  const productCard = scope.querySelector(`[data-product-id="${productId}"]`);
  if (productCard) {
    const quantityDisplay = productCard.querySelector('.qty-display');
    const addBtn = productCard.querySelector('.product-add-btn');
    const selectedOverlay = productCard.querySelector('.selected-overlay');
    const increaseBtn = productCard.querySelector('.qty-increase');

    if (quantityDisplay) {
      quantityDisplay.textContent = quantity;
    }

    if (increaseBtn) {
      const productQuantityLimit = ConditionValidator.getAllowedQuantityPerProduct(
        this.selectedBundle?.validateQuantityPerProduct
      );
      const { available, outOfStock } = this.getVariantAvailable(stepIndex, productId);
      const atMaxStock = available !== null && quantity >= available;
      const atMaxProductQuantity = productQuantityLimit !== null && quantity >= productQuantityLimit;
      const shouldDisableIncrease = outOfStock || atMaxStock || atMaxProductQuantity;
      increaseBtn.disabled = shouldDisableIncrease;
      if (shouldDisableIncrease) {
        increaseBtn.setAttribute('aria-disabled', 'true');
      } else {
        increaseBtn.removeAttribute('aria-disabled');
      }
    }

    if (addBtn) {
      const cascadeRow = productCard.classList.contains('bw-ppb-cascade-product-row');
      const step = this.selectedBundle?.steps?.[stepIndex];
      if (quantity > 0) {
        addBtn.textContent = cascadeRow
          ? (step?.addonReplaceText || this._resolveText('includedBadge', 'Selected ✓'))
          : this._resolveText('includedBadge', 'Selected ✓');
        addBtn.classList.add('added');
      } else {
        addBtn.textContent = cascadeRow
          ? (step?.addonAddText || 'Add +')
          : this._resolveText('productCardAddButton', 'Add to Cart');
        addBtn.classList.remove('added');
      }
    }

    if (selectedOverlay) {
      if (quantity > 0) {
        selectedOverlay.style.display = 'flex';
      } else {
        selectedOverlay.style.display = 'none';
      }
    }

    // Update card visual state
    if (quantity > 0) {
      productCard.classList.add('selected');
    } else {
      productCard.classList.remove('selected');
    }
  }
}
};
