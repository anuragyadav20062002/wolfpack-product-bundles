import { CurrencyManager, PricingCalculator, TemplateManager, ToastManager } from '../../../bundle-widget-components.js';
import { ConditionValidator } from '../../shared/condition-validator.js';

export function formatCascadeStepLimitToast(limitText, required) {
  const normalizedRequired = Number(required);
  if (!Number.isFinite(normalizedRequired) || normalizedRequired <= 0) return '';

  const qualifier = String(limitText || '')
    .replace(/\s+-?\d+(?:\.\d+)?\s*$/, '')
    .trim();
  const formattedRequired = String(normalizedRequired).padStart(2, '0');
  return `Add ${qualifier} ${formattedRequired} products on this step`;
}

export function formatProductPageStepValidationToast(step = {}, resolveText = null) {
  const required = Number(step.conditionValue);
  if (!Number.isFinite(required) || required <= 0) return '';

  const qualifierByOperator = {
    equal_to: 'exactly',
    greater_than_or_equal_to: 'at least',
    less_than_or_equal_to: 'at most',
  };
  const qualifier = qualifierByOperator[step.conditionOperator];
  if (!qualifier) return '';

  const operatorKeyByOperator = {
    equal_to: 'EqualTo',
    greater_than_or_equal_to: 'GreaterThanOrEqualTo',
    less_than_or_equal_to: 'LessThanOrEqualTo',
  };
  const operatorKey = operatorKeyByOperator[step.conditionOperator];

  if (step.conditionType === 'quantity') {
    const formattedRequired = String(required).padStart(2, '0');
    const fallback = `Add ${qualifier} ${formattedRequired} products on this step`;
    const template = typeof resolveText === 'function'
      ? resolveText(`conditionQuantity${operatorKey}`, fallback)
      : fallback;
    return String(template)
      .replace(/\{\{\s*conditionQuantity\s*\}\}/g, formattedRequired)
      .replace(/\{conditionQuantity\}/g, formattedRequired);
  }

  if (step.conditionType === 'amount') {
    const formattedRequired = String(required);
    const fallback = `Add products worth ${qualifier === 'at least' ? 'at least ' : qualifier === 'at most' ? 'maximum of ' : ''}${formattedRequired} on this step`;
    const template = typeof resolveText === 'function'
      ? resolveText(`conditionAmount${operatorKey}`, fallback)
      : fallback;
    return String(template)
      .replace(/\{\{\s*conditionAmount\s*\}\}/g, formattedRequired)
      .replace(/\{conditionAmount\}/g, formattedRequired);
  }

  return '';
}

export function getProductPageModalValidationToastOptions() {
  return {
    dismissible: true,
    className: 'bundle-toast--modal',
  };
}

export const ProductPageModalStateMethods = {
_getModalFocusableSelectors() {
  return [
    '.close-button',
    '.prev-button',
    '.next-button',
    '.product-add-btn',
    '.bw-quantity-control__button',
    'button:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];
},

_isElementVisibleForFocus(element) {
  if (!element || typeof element !== 'object') return false;
  if (element.disabled === true) return false;
  if (element.getAttribute && element.getAttribute('aria-hidden') === 'true') return false;
  if (typeof element.getClientRects === 'function' && element.getClientRects().length === 0) return false;

  const modal = this.elements?.modal;
  if (modal && typeof modal.contains === 'function' && !modal.contains(element)) return false;

  return typeof element.focus === 'function';
},

_getModalFocusableControls() {
  const modal = this.elements?.modal;
  if (!modal) return [];

  const controls = [];
  const seen = new Set();
  const selectors = this._getModalFocusableSelectors();

  selectors.forEach((selector) => {
    const list = typeof modal.querySelectorAll === 'function'
      ? modal.querySelectorAll(selector)
      : [];

    if (!list) return;
    list.forEach((el) => {
      if (!this._isElementVisibleForFocus(el) || seen.has(el)) return;
      seen.add(el);
      controls.push(el);
    });
  });

  return controls;
},

_captureActiveElementBeforeModalOpen() {
  const activeElement = globalThis.document?.activeElement;
  if (activeElement && typeof activeElement.focus === 'function') {
    this._modalOriginFocusElement = activeElement;
    this._modalOriginFocusKey = {
      stepIndex: activeElement.dataset?.stepIndex,
      cardIndex: activeElement.dataset?.cardIndex,
      variantId: activeElement.dataset?.variantId,
    };
  } else {
    this._modalOriginFocusElement = null;
    this._modalOriginFocusKey = null;
  }
},

_restoreActiveElementAfterModalClose() {
  const previousFocus = this._modalOriginFocusElement;
  const previousFocusKey = this._modalOriginFocusKey;
  this._modalOriginFocusElement = null;
  this._modalOriginFocusKey = null;

  let nextFocus = previousFocus;
  if (previousFocus?.isConnected === false && previousFocusKey?.stepIndex !== undefined) {
    const candidates = this.elements?.stepsContainer?.querySelectorAll?.('[data-step-index]') || [];
    nextFocus = [...candidates].find((candidate) => (
      candidate.dataset?.stepIndex === previousFocusKey.stepIndex
      && (previousFocusKey.cardIndex === undefined || candidate.dataset?.cardIndex === previousFocusKey.cardIndex)
      && (previousFocusKey.variantId === undefined || candidate.dataset?.variantId === previousFocusKey.variantId)
    ));
  }

  if (nextFocus && typeof nextFocus.focus === 'function') {
    nextFocus.focus();
  }
},

_focusFirstModalControl() {
  const candidates = this._getModalFocusableControls();
  const nextTarget = candidates[0];
  if (nextTarget) {
    nextTarget.focus();
    return true;
  }
  return false;
},

getFormattedHeaderText() {
  const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
  return currentStep?.name || `Step ${this.currentStepIndex + 1}`;
},

openModal(stepIndex) {
  this.currentStepIndex = stepIndex;
  this._captureActiveElementBeforeModalOpen();

  // Update modal header with step name
  const modal = this.elements.modal;
  const headerText = this.getFormattedHeaderText();
  const header = modal.querySelector('.modal-step-title');
  if (header) {
    header.textContent = headerText;
  }

  // OPTIMISTIC RENDERING: Show modal immediately with loading state
  this.renderModalTabs();
  this.renderModalProductsLoading(stepIndex);
  this.updateModalNavigation();
  this.updateModalFooterMessaging();

  // Show bottom-sheet
  this.setBottomSheetVisibility(true);
  if (this.elements.bsOverlay) this.elements.bsOverlay.classList.add('bw-bs-overlay--open');
  const runAfterFrame = (typeof requestAnimationFrame === 'function')
    ? requestAnimationFrame
    : (callback) => {
      callback();
    };

  runAfterFrame(() => {
    modal.classList.add('bw-bs-panel--open');
    this._focusFirstModalControl();
  });
  document.body.style.overflow = 'hidden';

  // Capture stepIndex so async callback doesn't render stale step if user navigates away
  const capturedStepIndex = stepIndex;

  // Load products asynchronously and update
  this.loadStepProducts(stepIndex).then(() => {
    if (this.currentStepIndex !== capturedStepIndex) return; // user navigated away
    this.renderModalProducts(capturedStepIndex);
    this.updateModalFooterMessaging();

    // PRELOAD NEXT STEP
    this.preloadNextStep();
  }).catch(() => {
    if (this.currentStepIndex !== capturedStepIndex) return;
    const productGrid = this.elements.modal.querySelector('.product-grid');
    if (productGrid) {
      productGrid.textContent = '';
      const messageEl = document.createElement('p');
      messageEl.className = 'error-message';
      messageEl.textContent = 'Failed to load products. Please try again.';
      productGrid.appendChild(messageEl);
    }
    ToastManager.show('Failed to load products for this step');
  });
},

closeModal() {
  this.elements.modal.classList.remove('bw-bs-panel--open');
  if (this.elements.bsOverlay) this.elements.bsOverlay.classList.remove('bw-bs-overlay--open');
  document.body.style.overflow = '';
  this.setBottomSheetVisibility(false);
  this._modalSlotReplacementTarget = null;

  // Update main UI
  this.renderSteps();
  this.updateAddToCartButton();
  this.updateFooterMessaging();
  this._restoreActiveElementAfterModalClose();
},

validateStepCondition(stepIndex, productId, newQuantity) {
  const step = this.selectedBundle.steps[stepIndex];
  const currentSelections = this.selectedProducts[stepIndex] || {};
  const currentQty = this.getSelectedQuantity(stepIndex, productId);
  const normalizedProductId = this.normalizeSelectionKey(productId);
  const stepProducts = this.stepProductData[stepIndex] || [];
  const isAmountOrWeight = step.conditionType === 'amount' || step.conditionType === 'weight';
  const conditionSelections = isAmountOrWeight
    ? this._buildConditionAwareStepSelections(stepProducts, currentSelections)
    : currentSelections;
  const targetProduct = isAmountOrWeight ? this.findProductBySelectionKey(stepProducts, normalizedProductId) : null;
  const targetValues = targetProduct
    ? {
      amount: Number(targetProduct?.price || 0),
      weight: Number(targetProduct?.weight || targetProduct?.weightInGrams || targetProduct?.grams || 0),
    }
    : null;

  const { allowed, limitText } = ConditionValidator.canUpdateQuantity(
    step,
    conditionSelections,
    normalizedProductId,
    newQuantity,
    targetValues,
  );

  // Only block and toast on increases — decreases are always permitted.
  if (!allowed && newQuantity > currentQty) {
    const cascadeMessage = this._usesCascadeStepFlow?.()
      ? formatCascadeStepLimitToast(limitText, step.conditionValue)
      : '';
    const toastMessage = cascadeMessage || (typeof ConditionValidator._formatStepLimitToast === 'function'
      ? ConditionValidator._formatStepLimitToast(limitText, step.conditionValue)
      : 'This step allows ' + limitText + ' product' + (step.conditionValue !== 1 ? 's' : '') + ' only.');
    ToastManager.show(toastMessage);
    return false;
  }

  return true;
},

  _buildConditionAwareStepSelections(stepProducts, currentSelections) {
    const selections = currentSelections || {};
    const translated = {};
    for (const [selKey, qty] of Object.entries(selections)) {
      const quantity = Number(qty) || 0;
      if (quantity <= 0) continue;

      const product = this.findProductBySelectionKey(stepProducts, selKey);
      const unitAmount = Number(product?.price || 0);
      const unitWeight = Number(product?.weight || product?.weightInGrams || product?.grams || 0);
      const current = translated[selKey] || { quantity: 0, amount: 0, weight: 0 };
      translated[selKey] = {
        quantity: current.quantity + quantity,
        amount: current.amount + (unitAmount * quantity),
        weight: current.weight + (unitWeight * quantity),
      };
    }
    return translated;
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
      const product = this.findProductBySelectionKey(products, selKey);
      const productId = String((product && (product.parentProductId || product.id)) || selKey);
      const quantity = Number(qty) || 0;
      const price = Number(product?.price || 0);
      const weight = Number(product?.weight || product?.weightInGrams || product?.grams || 0);
      const current = translated[productId] || { quantity: 0, amount: 0, weight: 0 };
      translated[productId] = {
        quantity: current.quantity + quantity,
        amount: current.amount + (price * quantity),
        weight: current.weight + (weight * quantity),
      };
    }
    return ConditionValidator.isStepConditionSatisfied(step, translated);
  }

  if (step.conditionType === 'amount' || step.conditionType === 'weight') {
    return ConditionValidator.isStepConditionSatisfied(
      step,
      this._buildConditionAwareStepSelections(this.stepProductData[stepIndex] || [], currentSelections),
    );
  }

  return ConditionValidator.isStepConditionSatisfied(step, currentSelections);
},

isStepAccessible(stepIndex) {
  if (this._isConditionValidationEnabled?.() === false) {
    return true;
  }

  // Check if all previous required steps are completed.
  // Free gift and default steps are non-blocking — skip them.
  for (let i = 0; i < stepIndex; i++) {
    const step = this.selectedBundle?.steps[i];
    if (step?.isFreeGift || step?.isDefault) continue;
    if (!this.validateStep(i)) return false;
  }
  return true;
},

updateModalNavigation() {
  const prevButton = this.elements.modal?.querySelector('.prev-button');
  const nextButton = this.elements.modal?.querySelector('.next-button');

  if (!prevButton || !nextButton) return;

  // Buttons are never disabled — navigateModal handles invalid steps with a toast.
  prevButton.disabled = false;

  const isLastStep = this.currentStepIndex === this.selectedBundle.steps.length - 1;
  const footer = this.elements.modal?.querySelector('.bw-bs-footer');
  footer?.classList.toggle('bw-bs-footer--single-step', this.selectedBundle.steps.length <= 1);
  footer?.classList.toggle('bw-bs-footer--first-step', this.currentStepIndex === 0);
  footer?.classList.toggle('bw-bs-footer--last-step', isLastStep);

  nextButton.textContent = isLastStep ? this._resolveText('doneButton', 'Done') : this._resolveText('nextButton', 'Next');
  nextButton.disabled = false;
},

updateModalFooterMessaging() {
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

updateModalHeaderText(totalPrice, totalQuantity, discountInfo, currencyInfo) {
  const modalStepTitle = this.elements.modal.querySelector('.modal-step-title');
  if (!modalStepTitle) return;

  // Always show step name in header - discount messaging is in footer only
  const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
  modalStepTitle.textContent = currentStep?.name || `Step ${this.currentStepIndex + 1}`;
},

updateModalDiscountMessaging(totalPrice, totalQuantity, discountInfo, currencyInfo) {
  const footerDiscountText = this.elements.modal.querySelector('.footer-discount-text');
  const discountSection = this.elements.modal.querySelector('.modal-footer-discount-messaging')
    || this.elements.modal.querySelector('.modal-header-discount-messaging');

  if (!footerDiscountText) return;

  // Check if any discount rules exist
  const nextRule = PricingCalculator.getNextDiscountRule(this.selectedBundle, totalQuantity, totalPrice);
  const ruleToUse = discountInfo.applicableRule || nextRule;
  const hasDiscountRules = !!ruleToUse;
  const pbConfig = this.selectedBundle?.messaging?.displayOptions?.progressBar || {};
  const messageType = nextRule
    ? 'progress'
    : (discountInfo.qualifiesForDiscount ? 'success' : 'progress');
  const fallbackTemplate = messageType === 'success'
    ? (pbConfig.successText || this.selectedBundle.messaging?.successTemplate || 'You got {discountText}!')
    : (pbConfig.progressText || this.selectedBundle.messaging?.progressTemplate || 'Add {conditionText} more to get {discountText}');

  // Hide messaging entirely when no discount rules are configured
  if (discountSection) {
    discountSection.style.display = (this.config.showDiscountMessaging && hasDiscountRules) ? 'block' : 'none';
  }

  if (!hasDiscountRules) return;

  const template = TemplateManager.getDiscountMessageTemplate({
    bundle: this.selectedBundle,
    totalQuantity,
    totalPrice,
    discountInfo,
    messageType,
    fallbackTemplate,
    locale: window.Shopify?.locale,
  });
  const variables = TemplateManager.createDiscountVariables(
    this.selectedBundle,
    totalPrice,
    totalQuantity,
    discountInfo,
    currencyInfo,
    { rule: ruleToUse, messageType }
  );
  const message = TemplateManager.replaceVariables(template, variables);

  footerDiscountText.textContent = discountInfo.qualifiesForDiscount && !nextRule
    ? message
    : message || '';
  if (discountSection) {
    if (discountInfo.qualifiesForDiscount && !nextRule) {
      discountSection.classList.add('qualified');
    } else {
      discountSection.classList.remove('qualified');
    }
  }
},

updateFooterTotalPrices(totalPrice, discountInfo, currencyInfo) {
  const strikePriceEl = this.elements.modal.querySelector('.total-price-strike');
  const finalPriceEl = this.elements.modal.querySelector('.total-price-final');

  if (!strikePriceEl || !finalPriceEl) return;

  if (discountInfo.qualifiesForDiscount && discountInfo.finalPrice < totalPrice) {
    // Show strike-through original price and discounted price
    strikePriceEl.textContent = CurrencyManager.convertAndFormat(totalPrice, currencyInfo);
    strikePriceEl.style.display = 'inline';
    finalPriceEl.textContent = CurrencyManager.convertAndFormat(discountInfo.finalPrice, currencyInfo);
  } else {
    // Show only regular price
    strikePriceEl.style.display = 'none';
    finalPriceEl.textContent = CurrencyManager.convertAndFormat(totalPrice, currencyInfo);
  }
}

// ========================================================================
// LOADING OVERLAY
// ========================================================================
};
