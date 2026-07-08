import { CurrencyManager, PricingCalculator, ToastManager } from '../../../bundle-widget-components.js';

export const ProductPageModalStateMethods = {
getFormattedHeaderText() {
  const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
  return currentStep?.name || `Step ${this.currentStepIndex + 1}`;
},

openModal(stepIndex) {
  this.currentStepIndex = stepIndex;

  // Update modal header with step name
  const modal = this.elements.modal;
  const headerText = this.getFormattedHeaderText();

  modal.querySelector('.modal-step-title').innerHTML = headerText;

  // OPTIMISTIC RENDERING: Show modal immediately with loading state
  this.renderModalTabs();
  this.renderModalProductsLoading(stepIndex);
  this.updateModalNavigation();
  this.updateModalFooterMessaging();

  // Show bottom-sheet
  this.setBottomSheetVisibility(true);
  if (this.elements.bsOverlay) this.elements.bsOverlay.classList.add('bw-bs-overlay--open');
  requestAnimationFrame(() => {
    modal.classList.add('bw-bs-panel--open');
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
    if (productGrid) productGrid.innerHTML = '<p class="error-message">Failed to load products. Please try again.</p>';
    ToastManager.show('Failed to load products for this step');
  });
},

closeModal() {
  this.elements.modal.classList.remove('bw-bs-panel--open');
  if (this.elements.bsOverlay) this.elements.bsOverlay.classList.remove('bw-bs-overlay--open');
  document.body.style.overflow = '';
  this.setBottomSheetVisibility(false);

  // Update main UI
  this.renderSteps();
  this.updateAddToCartButton();
  this.updateFooterMessaging();
},

validateStepCondition(stepIndex, productId, newQuantity) {
  const step = this.selectedBundle.steps[stepIndex];
  const currentSelections = this.selectedProducts[stepIndex] || {};
  const currentQty = this.getSelectedQuantity(stepIndex, productId);
  const normalizedProductId = this.normalizeSelectionKey(productId);

  const { allowed, limitText } = ConditionValidator.canUpdateQuantity(
    step,
    currentSelections,
    normalizedProductId,
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
      const product = this.findProductBySelectionKey(products, selKey);
      const productId = String((product && (product.parentProductId || product.id)) || selKey);
      translated[productId] = (translated[productId] || 0) + (Number(qty) || 0);
    }
    return ConditionValidator.isStepConditionSatisfied(step, translated);
  }

  return ConditionValidator.isStepConditionSatisfied(step, currentSelections);
},

isStepAccessible(stepIndex) {
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
  modalStepTitle.innerHTML = currentStep?.name || `Step ${this.currentStepIndex + 1}`;
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

  // Hide messaging entirely when no discount rules are configured
  if (discountSection) {
    discountSection.style.display = (this.config.showDiscountMessaging && hasDiscountRules) ? 'block' : 'none';
  }

  if (!hasDiscountRules) return;

  const variables = TemplateManager.createDiscountVariables(
    this.selectedBundle,
    totalPrice,
    totalQuantity,
    discountInfo,
    currencyInfo,
    { messageType: nextRule ? 'progress' : 'success' }
  );

  if (nextRule) {
    const progressMessage = TemplateManager.replaceVariables(
      this.config.discountTextTemplate,
      variables
    );
    footerDiscountText.innerHTML = progressMessage;
    if (discountSection) discountSection.classList.remove('qualified');
  } else if (discountInfo.qualifiesForDiscount) {
    const successMessage = TemplateManager.replaceVariables(
      this.config.successMessageTemplate,
      variables
    );
    footerDiscountText.innerHTML = successMessage;
    if (discountSection) discountSection.classList.add('qualified');
  } else {
    footerDiscountText.innerHTML = '';
    if (discountSection) discountSection.classList.remove('qualified');
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
