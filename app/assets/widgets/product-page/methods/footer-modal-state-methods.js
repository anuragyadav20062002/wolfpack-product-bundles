import { CurrencyManager, PricingCalculator, ToastManager } from '../../../bundle-widget-components.js';

export function shouldDisableIntermediateProductPageCta({
  isGrid = false,
  currentStepValid = false,
} = {}) {
  return Boolean(!isGrid && !currentStepValid);
}

export const ProductPageFooterModalStateMethods = {
renderFullPageLayout() {
  // Current fallback mirrors product-page layout until a dedicated full-page tab UI ships.
  this.renderProductPageLayout();
},

clearStepSelections(stepIndex) {
  // Clear all product selections for this step
  this.selectedProducts[stepIndex] = {};
  if (this.selectedProductCategoryIndexes) {
    this.selectedProductCategoryIndexes[stepIndex] = {};
  }
  if (stepIndex === 0 && this.directDefaultProducts.length > 0) {
    this.directDefaultProducts.forEach(product => {
      this.setSelectedQuantity(0, product.variantId, product.defaultRequiredQuantity || 1);
    });
  }
  this._persistSessionSelections?.();

  // Update UI
  this._renderDirectDefaultProducts();
  this.renderSteps();
  this.updateAddToCartButton();
  this.updateFooterMessaging();

  // Show toast notification
  ToastManager.show('All selections cleared from this step');
},

renderFooter() {
  const el = this.elements.footer;
  if (!el) return;
  if (this._isProductPageCascadeTemplate()) {
    const openDrawer = el.querySelector('.bw-ppb-cascade-selected-drawer--open, .gbbMixCascadeCartDrawerContainer--open');
    if (openDrawer) {
      const drawerHeight = openDrawer.getBoundingClientRect?.().height || 0;
      this.cascadeSelectedDrawerState = {
        ...(this.cascadeSelectedDrawerState || {}),
        isOpen: true,
        height: drawerHeight,
      };
    }
  }
  el.innerHTML = '';

  if (this._isProductPageCascadeTemplate()) {
    this._renderCascadeFooter(el);
    return;
  }

  if (this._isProductPageGridTemplate()) {
    this._renderCogniveFooter(el);
    return;
  }

  const displayOptions = this.selectedBundle?.messaging?.displayOptions;
  const pbConfig = displayOptions?.progressBar;
  if (!pbConfig?.enabled) {
    el.style.display = 'none';
    return;
  }

  const rules = this.selectedBundle?.pricing?.rules || [];
  if (rules.length === 0 || !this.selectedBundle?.pricing?.enabled) {
    el.style.display = 'none';
    return;
  }

  // Calculate current progress toward the first active rule's condition
  const { totalQuantity, totalPrice, unitPrices } = PricingCalculator.calculateBundleTotal(
    this.selectedProducts,
    this.stepProductData,
    this.selectedBundle?.steps
  );

  const rule = rules[0];
  const discountMethod = PricingCalculator.getDiscountMethod(this.selectedBundle);
  const conditionValue = PricingCalculator.getRuleConditionValue(rule, discountMethod);
  const conditionType = PricingCalculator.getRuleConditionType(rule);
  const current = conditionType === 'quantity' ? totalQuantity : totalPrice / 100;
  const progress = conditionValue > 0 ? Math.min(1, current / conditionValue) : 1;
  const met = progress >= 1;

  const discountInfo = PricingCalculator.calculateDiscount(this.selectedBundle, totalPrice, totalQuantity, unitPrices);
  const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);
  const discountText = combinedDiscountInfo.hasDiscount
    ? (this.selectedBundle.pricing.method === 'percentage_off'
        ? `${rule.discountValue ?? 0}% off`
        : CurrencyManager.convertAndFormat(combinedDiscountInfo.savings, CurrencyManager.getCurrencyInfo()))
    : '';

  const template = met
    ? (pbConfig.successText || this.selectedBundle.messaging?.successTemplate || 'You got {discountText}!')
    : (pbConfig.progressText || this.selectedBundle.messaging?.progressTemplate || 'Add {conditionText} more to get {discountText}');

  const diff = Math.max(0, conditionValue - current);
  const conditionText = conditionType === 'quantity'
    ? `${Math.ceil(diff)} item${Math.ceil(diff) !== 1 ? 's' : ''}`
    : CurrencyManager.convertAndFormat(diff * 100, CurrencyManager.getCurrencyInfo());

  const message = template
    .replace(/{discountText}/g, discountText)
    .replace(/{conditionText}/g, conditionText)
    .replace(/{amountNeeded}/g, conditionText)
    .replace(/{itemsNeeded}/g, `${Math.ceil(diff)}`)
    .replace(/{progressPercentage}/g, `${Math.round(progress * 100)}`);

  const primary = getComputedStyle(document.documentElement).getPropertyValue('--bundle-global-primary-button').trim() || '#1e3a8a';
  el.style.display = '';
  const progressData = getDiscountProgressData({
    currentValue: current,
    targetValue: conditionValue,
    message,
  });
  const wrapper = document.createElement('div');
  wrapper.innerHTML = renderDiscountProgress(progressData, {
    className: `bundle-footer-messaging bw-ppb-discount-progress${met ? ' bw-ppb-discount-progress--met' : ''}`,
    messageClassName: 'bw-ppb-discount-progress__message',
    trackClassName: 'bw-ppb-discount-progress__track',
    fillClassName: 'bw-ppb-discount-progress__fill',
  }).trim();
  const progressEl = wrapper.firstElementChild;
  if (!progressEl) return;
  progressEl.style.setProperty('--bw-discount-progress-color', primary);
  el.replaceWith(progressEl);
  this.elements.footer = progressEl;
},

updateFooterMessaging() {
  this.renderFooter();
},

renderQuantityOptionPills() {
  const el = this.elements.qtyPillsEl;
  if (!el) return;
  el.innerHTML = '';

  const displayOptions = this.selectedBundle?.messaging?.displayOptions;
  const qtyOpts = displayOptions?.bundleQuantityOptions;
  const rules = this.selectedBundle?.pricing?.rules || [];

  if (!qtyOpts?.enabled || rules.length === 0) {
    el.style.display = 'none';
    return;
  }

  el.style.display = 'flex';

  const primary = getComputedStyle(document.documentElement).getPropertyValue('--bundle-global-primary-button').trim() || '#1e3a8a';
  el.style.setProperty('--bw-qty-pill-active-color', primary);
  const defaultIndex = qtyOpts.defaultRuleIndex ?? 0;

  rules.forEach((rule, index) => {
    const { label, subtext } = this.getProductPageTierPillContent(rule, index, qtyOpts);
    const isActive = index === defaultIndex;

    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'bw-qty-pill' + (isActive ? ' bw-qty-pill--active' : '');

    const labelEl = document.createElement('span');
    labelEl.className = 'bw-qty-pill__label';
    labelEl.textContent = label;
    pill.appendChild(labelEl);

    if (subtext) {
      const subtextEl = document.createElement('span');
      subtextEl.className = 'bw-qty-pill__subtext';
      subtextEl.textContent = subtext;
      pill.appendChild(subtextEl);
    }

    pill.addEventListener('click', () => {
      el.querySelectorAll('.bw-qty-pill').forEach(p => {
        p.classList.remove('bw-qty-pill--active');
      });
      pill.classList.add('bw-qty-pill--active');
      // Re-render footer/ATC to reflect selected tier's discount context
      this.renderFooter();
      this.updateAddToCartButton();
    });

    el.appendChild(pill);
  });
},

getProductPageTierPillContent(rule, index, qtyOpts) {
  const pricing = this.selectedBundle?.pricing || {};
  const bundleQuantityOptions = this.selectedBundle?.messaging?.displayOptions?.bundleQuantityOptions || qtyOpts || {};
  const optionsByRuleId = bundleQuantityOptions.optionsByRuleId || {};
  const tierTextByRuleId = pricing.messages?.tierTextByRuleId || {};
  const ruleId = String(rule?.id || '');
  const ruleOption = ruleId ? (optionsByRuleId[ruleId] || tierTextByRuleId[ruleId]) : null;

  const configuredLabel =
    (typeof ruleOption?.label === 'string' && ruleOption.label.trim()) ||
    (typeof ruleOption?.tierText === 'string' && ruleOption.tierText.trim()) ||
    '';
  const configuredSubtext =
    (typeof ruleOption?.subtext === 'string' && ruleOption.subtext.trim()) ||
    (typeof ruleOption?.tierSubtext === 'string' && ruleOption.tierSubtext.trim()) ||
    '';

  if (configuredLabel || configuredSubtext) {
    return {
      label: configuredLabel || configuredSubtext,
      subtext: configuredSubtext && configuredSubtext !== configuredLabel ? configuredSubtext : '',
    };
  }

  const indexedLabel = qtyOpts?.labels?.[index] || '';
  const indexedSubtext = qtyOpts?.subtexts?.[index] || '';
  if (indexedLabel || indexedSubtext) {
    return {
      label: indexedLabel || indexedSubtext,
      subtext: indexedSubtext && indexedSubtext !== indexedLabel ? indexedSubtext : '',
    };
  }

  const currencyInfo = CurrencyManager.getCurrencyInfo();
  const threshold = Number(rule?.conditionValue || 0) || 0;
  const discountValue = Number(rule?.discountValue || 0) || 0;
  const thresholdText = rule?.conditionType === 'amount'
    ? CurrencyManager.convertAndFormat(threshold, currencyInfo)
    : String(threshold || index + 1);
  const discountText = pricing.method === BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF
    ? (discountValue ? `${discountValue}%` : '')
    : (discountValue ? CurrencyManager.convertAndFormat(discountValue, currencyInfo) : '');

  return {
    label: discountText ? `${thresholdText} / ${discountText}` : thresholdText,
    subtext: '',
  };
},

updateAddToCartButton() {
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

  const button = this.elements.addToCartButton;
  const usesCascadeStepFlow = this._usesCascadeStepFlow?.() === true;
  const isIntermediateCascadeStep = usesCascadeStepFlow
    && this.currentStepIndex < this.selectedBundle.steps.length - 1;

  // Check if all required steps are complete (free gift and default steps are not required)
  const allStepsValid = this.selectedBundle.steps.every((step, index) => {
    if (step.isFreeGift || step.isDefault) return true;
    return this.validateStep(index);
  });

  // Count only paid (non-free-gift, non-default) step selections for the total check
  const paidTotalQuantity = this.selectedProducts.reduce((sum, stepSelections, i) => {
    const step = this.selectedBundle.steps[i];
    if (step.isFreeGift || step.isDefault) return sum;
    return sum + Object.values(stepSelections || {}).reduce((s, qty) => s + qty, 0);
  }, 0);

  if (isIntermediateCascadeStep) {
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const currentStepValid = this.validateStep(this.currentStepIndex);
    const formattedPrice = totalQuantity > 0
      ? CurrencyManager.convertAndFormat(combinedDiscountInfo.finalPrice, currencyInfo)
      : '';
    const formattedTotalPrice = totalQuantity > 0
      ? CurrencyManager.convertAndFormat(totalPrice, currencyInfo)
      : '';
    const formattedDiscountAmount = combinedDiscountInfo.discountAmount > 0
      ? CurrencyManager.convertAndFormat(combinedDiscountInfo.discountAmount, currencyInfo)
      : '';

    const nextButtonContent = this._getCascadeAddToCartButtonContent?.({
      label: this._resolveText('nextButton', 'Next'),
      totalPriceText: formattedTotalPrice,
      finalPriceText: formattedPrice,
      discountAmountText: formattedDiscountAmount,
      discountInfo: combinedDiscountInfo,
    }) || {
      label: this._resolveText('nextButton', 'Next'),
      separator: formattedPrice ? '\u2022' : '',
      finalPriceText: formattedPrice,
      compareAtPriceText: '',
      discountPillText: '',
    };
    if (!formattedPrice) nextButtonContent.separator = '';
    this._renderCascadeAddToCartButtonContent(button, nextButtonContent);
    const shouldDisable = shouldDisableIntermediateProductPageCta({
      isGrid: this._isProductPageGridTemplate?.() === true,
      currentStepValid,
    });
    button.disabled = shouldDisable;
    button.classList.toggle('disabled', shouldDisable);
  // Disable button if no paid products selected or not all required steps are complete.
  } else if (paidTotalQuantity === 0 || !allStepsValid) {
    if (paidTotalQuantity === 0 || usesCascadeStepFlow) {
      button.textContent = this._resolveText('addToCartButton', 'Add Bundle to Cart');
    } else {
      // Some products selected but not all required steps complete
      button.textContent = this._resolveText('completeSteps', 'Complete All Steps to Continue');
    }
    button.disabled = true;
    button.classList.add('disabled');
  } else {
    // All steps valid and products selected - enable button
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const formattedPrice = CurrencyManager.convertAndFormat(combinedDiscountInfo.finalPrice, currencyInfo);
    const buttonLabel = this._resolveText('addToCartButton', 'Add Bundle to Cart');

    if (this._isProductPageCascadeTemplate?.() === true && this._renderCascadeAddToCartButtonContent) {
      const formattedTotalPrice = CurrencyManager.convertAndFormat(totalPrice, currencyInfo);
      const formattedDiscountAmount = combinedDiscountInfo.discountAmount > 0
        ? CurrencyManager.convertAndFormat(combinedDiscountInfo.discountAmount, currencyInfo)
        : '';

      this._renderCascadeAddToCartButtonContent(button, this._getCascadeAddToCartButtonContent?.({
        label: buttonLabel,
        totalPriceText: formattedTotalPrice,
        finalPriceText: formattedPrice,
        discountAmountText: formattedDiscountAmount,
        discountInfo: combinedDiscountInfo,
      }) || {
        label: buttonLabel,
        separator: '\u2022',
        finalPriceText: formattedPrice,
        compareAtPriceText: '',
        discountPillText: '',
      });
    } else {
      button.textContent = `${buttonLabel} \u2022 ${formattedPrice}`;
    }

    button.disabled = false;
    button.classList.remove('disabled');
  }

  this.syncProductPagePrimaryCtaStyle();

  // Update the modal footer total pill
  const totalPillFinal = this.elements.modal?.querySelector('.total-price-final');
  const totalPillStrike = this.elements.modal?.querySelector('.total-price-strike');
  if (totalPillFinal) {
    if (totalQuantity > 0) {
      const currencyInfo = CurrencyManager.getCurrencyInfo();
      totalPillFinal.textContent = CurrencyManager.convertAndFormat(combinedDiscountInfo.finalPrice, currencyInfo);
      if (combinedDiscountInfo.qualifiesForDiscount && totalPillStrike) {
        totalPillStrike.textContent = CurrencyManager.convertAndFormat(totalPrice, currencyInfo);
      } else if (totalPillStrike) {
        totalPillStrike.textContent = '';
      }
    } else {
      totalPillFinal.textContent = '';
      if (totalPillStrike) totalPillStrike.textContent = '';
    }
  }
}

// ========================================================================
// MODAL FUNCTIONALITY
// ========================================================================

// Helper method to get formatted header text (always step name)
};
