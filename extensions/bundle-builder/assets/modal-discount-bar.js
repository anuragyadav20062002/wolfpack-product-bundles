/**
 * Modern Modal Discount Card
 * Elegant design with pills, progress tracking, and smooth animations
 */

// Helper function to extract discount value from rule based on discount method
function getDiscountValueFromRule(rule, discountMethod) {
  if (!rule) return 0;

  switch (discountMethod) {
    case 'fixed_amount_off':
      // For fixed amount off, return the discount amount
      return parseFloat(rule.discountValue || 0);

    case 'percentage_off':
      // For percentage off, return the percentage value
      return parseFloat(rule.discountValue || 0);

    case 'fixed_bundle_price':
      // For fixed bundle price, return the target bundle price
      const fixedPrice = parseFloat(rule.fixedBundlePrice || 0);
      return fixedPrice;

    default:
      return parseFloat(rule.discountValue || 0);
  }
}

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
    const ruleQuantity = rule.value || 0;
    const conditionMet = rule.condition === 'greater_than_equal_to' || rule.condition === 'gte'
      ? selectedQuantity >= ruleQuantity
      : selectedQuantity === ruleQuantity;

    if (conditionMet && (!applicableRule || ruleQuantity > (applicableRule.value || 0))) {
      applicableRule = rule;
    }
  }

  // Find target quantity for progress
  const sortedRules = rules.sort((a, b) => (a.value || 0) - (b.value || 0));
  const nextRule = sortedRules.find(rule => selectedQuantity < (rule.value || 0));
  const targetQuantity = nextRule
    ? (nextRule.value || 0)
    : (sortedRules[sortedRules.length - 1]?.value || 0);

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
      const fixedPrice = parseFloat(applicableRule.fixedBundlePrice || 0);
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
      // Format the discount display based on method
      let discountDisplay;
      if (discountMethod === 'percentage_off') {
        discountDisplay = `${discountValue}%`;
      } else {
        // For fixed_amount_off and fixed_bundle_price, show the actual savings amount
        discountDisplay = formatCurrency(discountAmount);
      }
      discountMessage.textContent = `🎉 Discount Unlocked! You're saving ${discountDisplay}`;
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
    const discountMethod = pricing.method || pricing.discountMethod;

    // Get discount value using helper function
    const discountValue = getDiscountValueFromRule(nextRule, discountMethod);

    // Determine value unit based on discount method
    let valueDisplay;
    if (discountMethod === 'percentage_off') {
      valueDisplay = `${discountValue}% off`;
    } else if (discountMethod === 'fixed_bundle_price') {
      valueDisplay = formatCurrency(discountValue); // Show target price
    } else if (discountMethod === 'fixed_amount_off') {
      valueDisplay = `${formatCurrency(discountValue)} off`;
    } else {
      valueDisplay = `${discountValue} off`;
    }

    // Custom message if available
    const customMessage = pricing.messages?.discountText || nextRule.discountText;
    if (customMessage) {
      // Replace variables in custom message
      let message = customMessage
        .replace(/{items_needed}/g, itemsNeeded)
        .replace(/{discountConditionDiff}/g, itemsNeeded)
        .replace(/{discountValue}/g, discountValue)
        .replace(/{discountValueUnit}/g, discountMethod === 'percentage_off' ? '% off' : (discountMethod === 'fixed_bundle_price' ? formatCurrency('').replace(/[0-9.,]/g, '') : formatCurrency('').replace(/[0-9.,]/g, '') + ' off'));
      discountMessage.textContent = message;
    } else {
      // Default message - different wording for fixed_bundle_price
      if (discountMethod === 'fixed_bundle_price') {
        discountMessage.textContent = `Add ${itemsNeeded} more item${itemsNeeded !== 1 ? 's' : ''} to get bundle at ${valueDisplay}`;
      } else {
        discountMessage.textContent = `Add ${itemsNeeded} more item${itemsNeeded !== 1 ? 's' : ''} to unlock ${valueDisplay}!`;
      }
    }

    // Hide savings pill
    if (savingsPill) {
      savingsPill.style.display = 'none';
    }
  } else if (selectedQuantity === 0 && sortedRules[0]) {
    // Initial state - show minimum requirement
    discountCard.classList.remove('qualified');

    const minRule = sortedRules[0];
    const minQuantity = minRule.value || 0;
    const discountMethod = pricing.method || pricing.discountMethod;

    // Get discount value using helper function
    const discountValue = getDiscountValueFromRule(minRule, discountMethod);

    // Determine value display based on discount method
    let valueDisplay;
    if (discountMethod === 'percentage_off') {
      valueDisplay = `${discountValue}% off`;
    } else if (discountMethod === 'fixed_bundle_price') {
      valueDisplay = formatCurrency(discountValue); // Show target price
    } else if (discountMethod === 'fixed_amount_off') {
      valueDisplay = `${formatCurrency(discountValue)} off`;
    } else {
      valueDisplay = `${discountValue} off`;
    }

    // Different wording for fixed_bundle_price
    if (discountMethod === 'fixed_bundle_price') {
      discountMessage.textContent = `Select ${minQuantity} item${minQuantity !== 1 ? 's' : ''} to get bundle at ${valueDisplay}`;
    } else {
      discountMessage.textContent = `Select ${minQuantity} item${minQuantity !== 1 ? 's' : ''} to get ${valueDisplay}`;
    }

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
