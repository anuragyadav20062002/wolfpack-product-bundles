'use strict';

function getDisplayPrice(state, PricingCalculator, CurrencyManager) {
  if (!state.isReady || !state.bundleData) {
    return { original: 0, discounted: 0, savings: 0, savingsPercent: 0, formatted: '' };
  }

  var totals = PricingCalculator.calculateBundleTotal(
    // Build selectedProducts array (array-of-objects indexed by step position, matching widget format)
    state.steps.map(function (step) { return state.selections[step.id] || {}; }),
    state.stepProductData || [],
    state.steps
  );

  var discountInfo = PricingCalculator.calculateDiscount(
    state.bundleData,
    totals.totalPrice,
    totals.totalQuantity
  );

  var original = totals.totalPrice;
  var discounted = discountInfo.finalPrice;
  var savings = original - discounted;
  var savingsPercent = original > 0 ? Math.min(100, (savings / original) * 100) : 0;

  var formatted;
  if (CurrencyManager) {
    try {
      var currencyInfo = CurrencyManager.getCurrencyInfo();
      formatted = CurrencyManager.convertAndFormat(discounted, currencyInfo);
    } catch (_) {
      formatted = '$' + (discounted / 100).toFixed(2);
    }
  } else {
    formatted = '$' + (discounted / 100).toFixed(2);
  }

  return {
    original: original,
    discounted: discounted,
    savings: savings,
    savingsPercent: Math.round(savingsPercent * 10) / 10,
    formatted: formatted,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getDisplayPrice };
}
