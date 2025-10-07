/**
 * Modal Discount Bar - Minimalistic discount progress indicator
 * Shows inside the bundle modal instead of footer
 */

// Update modal discount bar (called when products are selected/deselected)
function updateModalDiscountBar(selectedBundle, totalPrice, selectedQuantity, formatCurrency) {
  const modalDiscountBar = document.querySelector('.modal-discount-bar');

  if (!modalDiscountBar || !selectedBundle?.pricing) {
    if (modalDiscountBar) modalDiscountBar.style.display = 'none';
    return;
  }

  const pricing = selectedBundle.pricing;

  // Check if discount is enabled
  if (!pricing.enableDiscount || pricing.messages?.showDiscountMessaging === false) {
    modalDiscountBar.style.display = 'none';
    return;
  }

  const rules = pricing.rules || [];
  if (rules.length === 0) {
    modalDiscountBar.style.display = 'none';
    return;
  }

  // Find applicable discount rule
  let applicableRule = null;
  for (const rule of rules) {
    const ruleQuantity = rule.value || rule.numberOfProducts || 0;
    const conditionMet = rule.condition === 'greater_than_equal_to' || rule.condition === 'gte'
      ? selectedQuantity >= ruleQuantity
      : selectedQuantity === ruleQuantity;

    if (conditionMet && (!applicableRule || ruleQuantity > (applicableRule.value || applicableRule.numberOfProducts || 0))) {
      applicableRule = rule;
    }
  }

  // Find target quantity for progress
  const sortedRules = rules.sort((a, b) => (a.value || a.numberOfProducts || 0) - (b.value || b.numberOfProducts || 0));
  const nextRule = sortedRules.find(rule => selectedQuantity < (rule.value || rule.numberOfProducts || 0));
  const targetQuantity = nextRule
    ? (nextRule.value || nextRule.numberOfProducts || 0)
    : (sortedRules[sortedRules.length - 1]?.value || sortedRules[sortedRules.length - 1]?.numberOfProducts || 0);

  // Calculate discount
  let discountAmount = 0;
  if (applicableRule) {
    const discountMethod = pricing.method || pricing.discountMethod || 'percentage_off';
    if (discountMethod === 'percentage_off') {
      const percentage = parseFloat(applicableRule.discountValue || 0);
      discountAmount = (totalPrice * percentage) / 100;
    } else if (discountMethod === 'fixed_amount_off') {
      discountAmount = parseFloat(applicableRule.discountValue || 0);
    } else if (discountMethod === 'fixed_bundle_price') {
      const fixedPrice = parseFloat(applicableRule.price || applicableRule.fixedBundlePrice || 0);
      discountAmount = Math.max(0, totalPrice - fixedPrice);
    }
  }

  // Update UI elements
  const progressFill = document.querySelector('.discount-progress-fill');
  const discountMessage = document.querySelector('.discount-message');
  const discountSavings = document.querySelector('.discount-savings');

  if (!progressFill || !discountMessage) return;

  // Show the bar
  modalDiscountBar.style.display = 'flex';

  // Update progress fill
  const progressPercentage = targetQuantity > 0 ? Math.min(100, (selectedQuantity / targetQuantity) * 100) : 0;
  progressFill.style.width = `${progressPercentage}%`;

  // Update message and styling
  if (applicableRule && discountAmount > 0) {
    // Qualified state
    modalDiscountBar.classList.add('qualified');
    const discountMethod = pricing.method || pricing.discountMethod;
    const discountValue = applicableRule.discountValue || 0;
    discountMessage.textContent = `🎉 You got ${discountValue}${discountMethod === 'percentage_off' ? '%' : ''} off!`;

    if (discountSavings) {
      discountSavings.textContent = `Save ${formatCurrency(discountAmount)}`;
      discountSavings.style.display = 'inline-block';
    }
  } else if (nextRule) {
    // Progress state
    modalDiscountBar.classList.remove('qualified');
    const itemsNeeded = Math.max(0, targetQuantity - selectedQuantity);
    const discountValue = nextRule.discountValue || 0;
    const discountMethod = pricing.method || pricing.discountMethod;
    discountMessage.textContent = `Add ${itemsNeeded} more item${itemsNeeded !== 1 ? 's' : ''} to get ${discountValue}${discountMethod === 'percentage_off' ? '%' : ''} off`;

    if (discountSavings) {
      discountSavings.style.display = 'none';
    }
  } else if (selectedQuantity === 0 && sortedRules[0]) {
    // Initial state
    modalDiscountBar.classList.remove('qualified');
    const minRule = sortedRules[0];
    const minQuantity = minRule.value || minRule.numberOfProducts || 0;
    const discountValue = minRule.discountValue || 0;
    const discountMethod = pricing.method || pricing.discountMethod;
    discountMessage.textContent = `Select ${minQuantity} items to get ${discountValue}${discountMethod === 'percentage_off' ? '%' : ''} off`;

    if (discountSavings) {
      discountSavings.style.display = 'none';
    }
  }
}

// Export for use in main widget
if (typeof window !== 'undefined') {
  window.updateModalDiscountBar = updateModalDiscountBar;
}
