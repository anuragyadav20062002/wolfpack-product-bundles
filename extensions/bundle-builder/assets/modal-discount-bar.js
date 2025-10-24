/**
 * Modern Modal Discount Card
 * Elegant design with pills, progress tracking, and smooth animations
 */

// Helper function to extract discount value from rule based on discount method
// Updated to use new nested pricing structure
function getDiscountValueFromRule(rule, discountMethod) {
  if (!rule || !rule.discount) return 0;

  const value = parseFloat(rule.discount.value || 0);

  // For percentage, return as-is (already a percentage)
  if (discountMethod === 'percentage_off' || rule.discount.method === 'percentage_off') {
    return value;
  }

  // For monetary values, convert from cents to currency amount
  return value / 100;
}

function updateModalDiscountBar(selectedBundle, totalPrice, selectedQuantity, formatCurrency) {
  const discountCard = document.querySelector('.modal-discount-card');

  if (!discountCard || !selectedBundle?.pricing) {
    if (discountCard) discountCard.style.display = 'none';
    return;
  }

  const pricing = selectedBundle.pricing;

  // Check if discount is enabled (updated to use new field name)
  if (!pricing.enabled || pricing.messages?.showDiscountMessaging === false) {
    discountCard.style.display = 'none';
    return;
  }

  const rules = pricing.rules || [];
  if (rules.length === 0) {
    discountCard.style.display = 'none';
    return;
  }

  // Find applicable discount rule (updated for nested structure)
  let applicableRule = null;
  for (const rule of rules) {
    if (!rule.condition) continue;

    // Handle both quantity and amount-based conditions
    const conditionValue = rule.condition.value || 0;
    const actualValue = rule.condition.type === 'amount' ? totalPrice * 100 : selectedQuantity; // Convert amount to cents

    let conditionMet = false;
    switch (rule.condition.operator) {
      case 'gte':
      case 'greater_than_equal_to':
        conditionMet = actualValue >= conditionValue;
        break;
      case 'gt':
      case 'greater_than':
        conditionMet = actualValue > conditionValue;
        break;
      case 'lte':
      case 'less_than_equal_to':
        conditionMet = actualValue <= conditionValue;
        break;
      case 'lt':
      case 'less_than':
        conditionMet = actualValue < conditionValue;
        break;
      case 'eq':
      case 'equal_to':
        conditionMet = actualValue === conditionValue;
        break;
      default:
        conditionMet = actualValue >= conditionValue;
    }

    if (conditionMet && (!applicableRule || conditionValue > (applicableRule.condition?.value || 0))) {
      applicableRule = rule;
    }
  }

  // Find target quantity for progress (updated for nested structure)
  const sortedRules = rules.sort((a, b) => (a.condition?.value || 0) - (b.condition?.value || 0));
  const nextRule = sortedRules.find(rule => {
    const conditionValue = rule.condition?.value || 0;
    const actualValue = rule.condition?.type === 'amount' ? totalPrice * 100 : selectedQuantity;
    return actualValue < conditionValue;
  });
  const targetQuantity = nextRule
    ? (nextRule.condition?.type === 'amount' ? (nextRule.condition.value / 100) : nextRule.condition?.value || 0)
    : (sortedRules[sortedRules.length - 1]?.condition?.value || 0);

  // Calculate discount (updated for nested structure)
  let discountAmount = 0;
  if (applicableRule && applicableRule.discount) {
    const discountMethod = applicableRule.discount.method || pricing.method || 'percentage_off';
    const discountValue = parseFloat(applicableRule.discount.value || 0);

    if (discountMethod === 'percentage_off') {
      // Percentage is stored as-is
      discountAmount = (totalPrice * discountValue) / 100;
    } else if (discountMethod === 'fixed_amount_off') {
      // Convert from cents to currency amount
      discountAmount = discountValue / 100;
    } else if (discountMethod === 'fixed_bundle_price') {
      // Convert fixed price from cents to currency amount
      const fixedPrice = discountValue / 100;
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

    const discountMethod = applicableRule.discount?.method || pricing.method;
    const discountValue = applicableRule.discount?.value || 0;

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
    const discountMethod = nextRule.discount?.method || pricing.method;

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
