/**
 * Modern Modal Discount Card
 * Elegant design with pills, progress tracking, and smooth animations
 */

function updateModalDiscountBar(selectedBundle, totalPrice, selectedQuantity, formatCurrency) {
  const discountCard = document.querySelector('.modal-discount-card');

  if (!discountCard || !selectedBundle?.pricing) {
    if (discountCard) discountCard.style.display = 'none';
    return;
  }

  const pricing = selectedBundle.pricing;

  // Check if discount is enabled
  if (!pricing.enableDiscount || pricing.messages?.showDiscountMessaging === false) {
    discountCard.style.display = 'none';
    return;
  }

  const rules = pricing.rules || [];
  if (rules.length === 0) {
    discountCard.style.display = 'none';
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

  // Get UI elements
  const progressFill = document.querySelector('.discount-progress-fill');
  const progressText = document.querySelector('.discount-progress-text');
  const discountMessage = document.querySelector('.discount-message');
  const savingsPill = document.querySelector('.discount-savings-pill');

  if (!progressFill || !discountMessage) return;

  // Show the card
  discountCard.style.display = 'block';

  // Calculate and update progress
  const progressPercentage = targetQuantity > 0 ? Math.min(100, (selectedQuantity / targetQuantity) * 100) : 0;
  progressFill.style.width = `${progressPercentage}%`;

  if (progressText) {
    progressText.textContent = `${Math.round(progressPercentage)}%`;
  }

  // Update UI based on state
  if (applicableRule && discountAmount > 0) {
    // Qualified state - show success styling
    discountCard.classList.add('qualified');

    const discountMethod = pricing.method || pricing.discountMethod;
    const discountValue = applicableRule.discountValue || 0;

    // Custom message if available
    const customMessage = pricing.messages?.successMessage || applicableRule.successMessage;
    if (customMessage) {
      discountMessage.textContent = customMessage;
    } else {
      discountMessage.textContent = `🎉 Discount Unlocked! You're saving ${discountValue}${discountMethod === 'percentage_off' ? '%' : ''}`;
    }

    // Show savings pill
    if (savingsPill) {
      savingsPill.textContent = `Save ${formatCurrency(discountAmount)}`;
      savingsPill.style.display = 'flex';
    }
  } else if (nextRule) {
    // Progress state - show how many items needed
    discountCard.classList.remove('qualified');

    const itemsNeeded = Math.max(0, targetQuantity - selectedQuantity);
    const discountValue = nextRule.discountValue || 0;
    const discountMethod = pricing.method || pricing.discountMethod;

    // Custom message if available
    const customMessage = pricing.messages?.discountText || nextRule.discountText;
    if (customMessage) {
      discountMessage.textContent = customMessage.replace('{items_needed}', itemsNeeded);
    } else {
      discountMessage.textContent = `Add ${itemsNeeded} more item${itemsNeeded !== 1 ? 's' : ''} to unlock ${discountValue}${discountMethod === 'percentage_off' ? '%' : ''} off!`;
    }

    // Hide savings pill
    if (savingsPill) {
      savingsPill.style.display = 'none';
    }
  } else if (selectedQuantity === 0 && sortedRules[0]) {
    // Initial state - show minimum requirement
    discountCard.classList.remove('qualified');

    const minRule = sortedRules[0];
    const minQuantity = minRule.value || minRule.numberOfProducts || 0;
    const discountValue = minRule.discountValue || 0;
    const discountMethod = pricing.method || pricing.discountMethod;

    discountMessage.textContent = `Select ${minQuantity} item${minQuantity !== 1 ? 's' : ''} to get ${discountValue}${discountMethod === 'percentage_off' ? '%' : ''} off`;

    // Hide savings pill
    if (savingsPill) {
      savingsPill.style.display = 'none';
    }
  }
}

// Export for use in main widget
if (typeof window !== 'undefined') {
  window.updateModalDiscountBar = updateModalDiscountBar;
}
