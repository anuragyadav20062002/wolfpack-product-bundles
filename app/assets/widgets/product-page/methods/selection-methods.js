import { ConditionValidator } from '../../shared/condition-validator.js';
import { ToastManager } from '../../../bundle-widget-components.js';
import { resolveProductPageCardButtonText } from './modal-methods.js';

function createInlineQuantityControl(productId, quantity, increaseDisabled) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('inline-quantity-controls', 'bw-quantity-control');
  wrapper.dataset.productId = productId;

  const decreaseButton = document.createElement('button');
  decreaseButton.type = 'button';
  decreaseButton.classList.add('inline-qty-btn', 'qty-decrease', 'bw-quantity-control__button');
  decreaseButton.dataset.productId = productId;
  decreaseButton.textContent = '−';

  const display = document.createElement('span');
  display.classList.add('inline-qty-display', 'bw-quantity-control__value');
  display.textContent = String(quantity);

  const increaseButton = document.createElement('button');
  increaseButton.type = 'button';
  increaseButton.classList.add('inline-qty-btn', 'qty-increase', 'bw-quantity-control__button');
  increaseButton.dataset.productId = productId;
  increaseButton.textContent = '+';
  if (increaseDisabled) {
    increaseButton.disabled = true;
    increaseButton.setAttribute('aria-disabled', 'true');
  }

  wrapper.appendChild(decreaseButton);
  wrapper.appendChild(display);
  wrapper.appendChild(increaseButton);

  return wrapper;
}

function createProductPageAddButton(productId, text) {
  const addButton = document.createElement('button');
  addButton.type = 'button';
  addButton.classList.add('product-add-btn', 'bw-product-card__add-button');
  addButton.dataset.productId = productId;
  addButton.textContent = text;
  return addButton;
}

function bsFindNextIncompleteStep(steps, selectedProducts, validateFn, fromIndex) {
  for (let i = fromIndex + 1; i < steps.length; i++) {
    if (steps[i].isDefault || steps[i].isFreeGift) continue;
    if (!validateFn(i)) return i;
  }
  return -1;
}

// Mirrors `shouldAutoAdvanceFullPageStep` in the full-page widget: auto-next is
// an explicit per-category opt-in via `autoNextStepOnConditionMet`. Removals
// and step-rule-only configurations never auto-advance.
export function shouldAutoAdvanceProductPageStep({ quantity = 0, step = null } = {}) {
  const categories = Array.isArray(step?.categories) ? step.categories : [];
  const categoryRuleCategories = categories.filter(category =>
    Array.isArray(category?.conditions) && category.conditions.length > 0
  );

  if (!(quantity > 0) || categoryRuleCategories.length === 0) {
    return false;
  }

  return categoryRuleCategories.some(category => category.autoNextStepOnConditionMet === true);
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
      ToastManager.show('Only ' + available + ' in stock — quantity adjusted.');
    }
  }

  const currentQuantity = this.getSelectedQuantity(stepIndex, selectionKey);
  const productQuantityCheck = ConditionValidator.canUpdateProductQuantity(
    this.selectedBundle?.validateQuantityPerProduct,
    currentQuantity,
    quantity,
  );
  if (!productQuantityCheck.allowed) {
    ToastManager.show('Maximum allowed quantity per product is ' + productQuantityCheck.limit + '.');
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

  // Auto-step progression — gated on the merchant-controlled
  // `autoNextStepOnConditionMet` flag (set per category in the configure UI).
  const currentStep = this.selectedBundle?.steps?.[stepIndex];
  if (shouldAutoAdvanceProductPageStep({ quantity, step: currentStep })) {
    this._autoProgressBottomSheet(stepIndex);
  }
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
    const quantityDisplay = productCard.querySelector('.qty-display')
      || productCard.querySelector('.inline-qty-display');
    const addBtn = productCard.querySelector('.product-add-btn');
    const selectedOverlay = productCard.querySelector('.selected-overlay');
    const increaseBtn = productCard.querySelector('.qty-increase');
    const actionWrapper = productCard.querySelector('.product-card-action')
      || productCard.querySelector('.bw-product-card__action');
    const existingInlineControls = productCard.querySelector('.inline-quantity-controls');
    const cascadeRow = productCard.classList.contains('bw-ppb-cascade-product-row');
    const step = this.selectedBundle?.steps?.[stepIndex];
    const defaultAddText = cascadeRow ? 'Add +' : this._resolveText('productCardAddButton', 'Add to Cart');

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

    if (actionWrapper && quantity > 0) {
      actionWrapper.classList.add('is-expanded');
      if (addBtn) addBtn.remove();
      if (!existingInlineControls) {
        const productQuantityLimit = ConditionValidator.getAllowedQuantityPerProduct(
          this.selectedBundle?.validateQuantityPerProduct
        );
        const { available, outOfStock } = this.getVariantAvailable(stepIndex, productId);
        const atMaxStock = available !== null && quantity >= available;
        const atMaxProductQuantity = productQuantityLimit !== null && quantity >= productQuantityLimit;
        actionWrapper.appendChild(createInlineQuantityControl(
          productId,
          quantity,
          outOfStock || atMaxStock || atMaxProductQuantity,
        ));
      }
    } else if (actionWrapper && quantity <= 0) {
      actionWrapper.classList.remove('is-expanded');
      if (existingInlineControls) existingInlineControls.remove();
      if (!addBtn) {
        actionWrapper.appendChild(createProductPageAddButton(
          productId,
          resolveProductPageCardButtonText({
            currentQuantity: quantity,
            currentStep: step,
            outOfStock: false,
            defaultAddText,
          }),
        ));
      }
    }

    if (addBtn) {
      if (quantity > 0) {
        addBtn.textContent = resolveProductPageCardButtonText({
          currentQuantity: quantity,
          currentStep: step,
          outOfStock: false,
          defaultAddText,
        });
        addBtn.classList.add('added');
      } else {
        addBtn.textContent = resolveProductPageCardButtonText({
          currentQuantity: quantity,
          currentStep: step,
          outOfStock: false,
          defaultAddText,
        });
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
