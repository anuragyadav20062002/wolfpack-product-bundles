/*!
 * Wolfpack Bundle Widget — Full Page
 * Version : 2.6.1
 * Built   : 2026-04-22
 *
 * Cache note: Shopify CDN cache is busted automatically by shopify app deploy.
 * After deploying, allow 2-10 minutes for propagation before testing.
 * Verify live version: console.log(window.__BUNDLE_WIDGET_VERSION__)
 */
window.__BUNDLE_WIDGET_VERSION__ = '2.6.1';
(function() {
  'use strict';

const ConditionValidator = (function () {

  const OPERATORS = {
    EQUAL_TO:                'equal_to',
    GREATER_THAN:            'greater_than',
    LESS_THAN:               'less_than',
    GREATER_THAN_OR_EQUAL_TO: 'greater_than_or_equal_to',
    LESS_THAN_OR_EQUAL_TO:   'less_than_or_equal_to',
  };

  function calculateStepTotalAfterUpdate(currentSelections, targetProductId, newQuantity) {
    const selections = currentSelections || {};

    let total = newQuantity;

    for (const pid of Object.keys(selections)) {
      if (pid !== targetProductId) {
        total += selections[pid] || 0;
      }
    }

    return total;
  }

  function canUpdateQuantity(step, currentSelections, targetProductId, newQuantity) {

    if (!step || !step.conditionType || !step.conditionOperator || step.conditionValue == null) {
      return { allowed: true, limitText: null };
    }

    const totalAfter = calculateStepTotalAfterUpdate(
      currentSelections,
      targetProductId,
      newQuantity,
    );

    const primary = _evaluateCanUpdate(step.conditionOperator, step.conditionValue, totalAfter);
    if (!primary.allowed) return primary;

    if (step.conditionOperator2 != null && step.conditionValue2 != null) {
      const secondary = _evaluateCanUpdate(step.conditionOperator2, step.conditionValue2, totalAfter);
      if (!secondary.allowed) return secondary;
    }

    return { allowed: true, limitText: null };
  }

  function isStepConditionSatisfied(step, currentSelections) {
    if (!step) return true;

    const selections = currentSelections || {};
    let total = 0;
    for (const qty of Object.values(selections)) {
      total += qty || 0;
    }

    if (!step.conditionType || !step.conditionOperator || step.conditionValue == null) {
      const min = step.minQuantity != null ? Number(step.minQuantity) : 1;
      return total >= min;
    }

    if (!_evaluateSatisfied(step.conditionOperator, step.conditionValue, total)) return false;

    if (step.conditionOperator2 != null && step.conditionValue2 != null) {
      return _evaluateSatisfied(step.conditionOperator2, step.conditionValue2, total);
    }

    return true;
  }

  function _evaluateCanUpdate(operator, required, totalAfter) {
    let allowed;
    switch (operator) {
      case OPERATORS.EQUAL_TO:

        allowed = totalAfter <= required;
        break;
      case OPERATORS.LESS_THAN:
        allowed = totalAfter < required;
        break;
      case OPERATORS.LESS_THAN_OR_EQUAL_TO:
        allowed = totalAfter <= required;
        break;
      case OPERATORS.GREATER_THAN:
      case OPERATORS.GREATER_THAN_OR_EQUAL_TO:

        allowed = true;
        break;
      default:
        allowed = true;
    }
    return { allowed, limitText: allowed ? null : _buildLimitText(operator, required) };
  }

  function _evaluateSatisfied(operator, required, total) {
    switch (operator) {
      case OPERATORS.EQUAL_TO:                 return total === required;
      case OPERATORS.GREATER_THAN:             return total > required;
      case OPERATORS.LESS_THAN:               return total < required;
      case OPERATORS.GREATER_THAN_OR_EQUAL_TO: return total >= required;
      case OPERATORS.LESS_THAN_OR_EQUAL_TO:   return total <= required;
      default:                                return true;
    }
  }

  function _buildLimitText(operator, required) {
    const map = {
      [OPERATORS.EQUAL_TO]:                `exactly ${required}`,
      [OPERATORS.LESS_THAN]:               `less than ${required}`,
      [OPERATORS.LESS_THAN_OR_EQUAL_TO]:   `at most ${required}`,
      [OPERATORS.GREATER_THAN]:            `more than ${required}`,
      [OPERATORS.GREATER_THAN_OR_EQUAL_TO]: `at least ${required}`,
    };
    return map[operator] || String(required);
  }

  return {
    OPERATORS,
    calculateStepTotalAfterUpdate,
    canUpdateQuantity,
    isStepConditionSatisfied,
  };
}());

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConditionValidator;
}

const BUNDLE_WIDGET = {
  VERSION: '4.0.0',
  LOG_PREFIX: '[BUNDLE_WIDGET]',

  SELECTORS: {
    WIDGET_CONTAINER: '#bundle-builder-app',
    STEPS_CONTAINER: '.bundle-steps',
    MODAL: '#bundle-builder-modal',
    ADD_TO_CART: '.add-bundle-to-cart',
    FOOTER_MESSAGING: '.bundle-footer-messaging'
  },

  CART_PROPERTIES: {
    BUNDLE_ID: '_bundle_id',
    BUNDLE_CONFIG: '_bundle_config'
  },

  BUNDLE_TYPES: {
    PRODUCT_PAGE: 'product_page',
    FULL_PAGE: 'full_page'
  },

  CONDITION_OPERATORS: {
    EQUAL_TO: 'equal_to',
    GREATER_THAN: 'greater_than',
    LESS_THAN: 'less_than',
    GREATER_THAN_OR_EQUAL_TO: 'greater_than_or_equal_to',
    LESS_THAN_OR_EQUAL_TO: 'less_than_or_equal_to'
  },

  DISCOUNT_METHODS: {
    PERCENTAGE_OFF: 'percentage_off',
    FIXED_AMOUNT_OFF: 'fixed_amount_off',
    FIXED_BUNDLE_PRICE: 'fixed_bundle_price'
  },

  PLACEHOLDER_IMAGE: 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png'
};

class CurrencyManager {
  static getShopBaseCurrency() {

    return {
      code: window.Shopify?.shop?.currency || 'USD',
      format: window.shopMoneyFormat || '{{amount}}'
    };
  }

  static detectCustomerCurrency() {

    if (window.Shopify?.currency?.active) {
      return {
        code: window.Shopify.currency.active,
        format: window.Shopify.currency.format || window.shopMoneyFormat || '{{amount}}',
        rate: window.Shopify.currency.rate || 1
      };
    }

    return { ...this.getShopBaseCurrency(), rate: 1 };
  }

  static convertCurrency(amount, fromCurrency, toCurrency, rate = 1) {
    if (fromCurrency === toCurrency) return amount;

    if (window.Shopify?.currency?.convert) {
      try {
        return window.Shopify.currency.convert(amount, fromCurrency, toCurrency);
      } catch (e) {
        console.warn('[BUNDLE_WIDGET] Shopify.currency.convert failed, using rate fallback:', e);
      }
    }

    return Math.round(amount * rate);
  }

  static formatMoney(amount, format) {
    if (typeof Shopify !== 'undefined' && window.Shopify.formatMoney) {
      return window.Shopify.formatMoney(amount, format);
    }

    const formatted = (amount / 100).toFixed(2);
    return format ? format.replace('{{amount}}', formatted) : `$${formatted}`;
  }

  static getCurrencySymbol(currencyCode) {
    const symbols = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥',
      'CAD': 'C$', 'AUD': 'A$', 'INR': '₹', 'CNY': '¥',
      'CHF': 'CHF', 'SEK': 'kr', 'NOK': 'kr', 'DKK': 'kr',
      'PLN': 'zł', 'CZK': 'Kč', 'HUF': 'Ft', 'RUB': '₽',
      'BRL': 'R$', 'MXN': '$', 'ZAR': 'R', 'SGD': 'S$',
      'HKD': 'HK$', 'NZD': 'NZ$', 'KRW': '₩', 'THB': '฿'
    };
    return symbols[currencyCode] || currencyCode;
  }

  static getCurrencyInfo() {
    const customerCurrency = this.detectCustomerCurrency();
    const shopBaseCurrency = this.getShopBaseCurrency();
    const displaySymbol = this.getCurrencySymbol(customerCurrency.code);

    const displayFormat = window.Shopify?.currency?.format
      || `${displaySymbol}{{amount}}`;

    return {

      calculation: {
        code: shopBaseCurrency.code,
        symbol: this.getCurrencySymbol(shopBaseCurrency.code),
        format: shopBaseCurrency.format
      },

      display: {
        code: customerCurrency.code,
        symbol: displaySymbol,
        format: displayFormat,
        rate: customerCurrency.rate
      },

      isMultiCurrency: customerCurrency.code !== shopBaseCurrency.code
    };
  }

  /**
   * Convert an amount from shop base currency to the customer's display currency,
   * then format it. Use this everywhere a price is rendered to the customer.
   *
   * @param {number} amount  Price in shop base currency cents
   * @param {object} currencyInfo  Result of getCurrencyInfo()
   * @returns {string}  Formatted price string in the display currency
   */
  static convertAndFormat(amount, currencyInfo) {
    const rate = currencyInfo.display.rate;
    const converted = currencyInfo.isMultiCurrency && rate && isFinite(rate)
      ? this.convertCurrency(amount, currencyInfo.calculation.code, currencyInfo.display.code, rate)
      : amount;
    return this.formatMoney(converted, currencyInfo.display.format);
  }
}

class BundleDataManager {
  static validateBundleData(bundles) {
    if (!Array.isArray(bundles) || bundles.length === 0) {
      throw new Error('No bundles available');
    }

    const required = ['id', 'name', 'status', 'bundleType', 'steps'];
    bundles.forEach((bundle, index) => {
      required.forEach(field => {
        if (!bundle[field]) {
          throw new Error(`Bundle ${index} missing required field: ${field}`);
        }
      });

      if (
        bundle.bundleType !== BUNDLE_WIDGET.BUNDLE_TYPES.PRODUCT_PAGE &&
        bundle.bundleType !== BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE
      ) {
        throw new Error(
          `Bundle ${bundle.id} has invalid bundleType: "${bundle.bundleType}". ` +
          `Expected "${BUNDLE_WIDGET.BUNDLE_TYPES.PRODUCT_PAGE}" or "${BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE}".`
        );
      }

      if (!Array.isArray(bundle.steps) || bundle.steps.length === 0) {
        throw new Error(`Bundle ${bundle.id} has no steps`);
      }
    });

    return bundles;
  }

  static validateSingleBundle(bundle) {
    if (!bundle || typeof bundle !== 'object') {
      return false;
    }

    const required = ['id', 'name', 'status', 'bundleType', 'steps'];
    for (const field of required) {
      if (bundle[field] === undefined || bundle[field] === null) {
        return false;
      }
    }

    if (!Array.isArray(bundle.steps)) {
      return false;
    }

    return true;
  }

  static filterActiveBundles(bundles) {

    return bundles.filter(bundle => bundle.status === 'active');
  }

  static getProductPageBundles(bundles) {
    return bundles.filter(bundle =>
      bundle.bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.PRODUCT_PAGE
    );
  }

  static getFullPageBundles(bundles) {
    return bundles.filter(bundle =>
      bundle.bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE
    );
  }

  static getBundleById(bundles, bundleId) {
    return bundles.find(bundle => bundle.id === bundleId);
  }

  static getContainerBundle(bundles, productId) {
    return bundles.find(bundle =>
      bundle.containerProductId &&
      bundle.containerProductId.toString() === productId?.toString()
    );
  }

  static extractStepData(steps) {
    return steps.map(step => ({
      id: step.id,
      name: step.name || 'Unnamed Step',
      required: step.required || false,
      allowMultiple: step.allowMultiple || false,
      products: step.StepProduct || [],
      conditions: step.StepCondition || []
    }));
  }

  static extractProductData(stepProducts) {
    return stepProducts.map(sp => ({
      id: sp.product?.id || sp.productId,
      shopifyProductId: sp.product?.shopifyProductId || sp.shopifyProductId,
      title: sp.product?.title || 'Untitled Product',
      imageUrl: sp.product?.imageUrl || '/placeholder.png',
      price: sp.product?.price || 0,
      compareAtPrice: sp.product?.compareAtPrice || null,
      variants: sp.product?.variants || [],
      variantId: sp.variantId || null,
      quantity: sp.quantity || 1
    }));
  }

  static selectBundle(bundlesData, config) {
    if (!bundlesData || typeof bundlesData !== 'object') {
      return null;
    }

    const bundles = Object.values(bundlesData).filter(bundle =>
      this.validateSingleBundle(bundle) &&
      (bundle.status === 'active' || bundle.status === 'unlisted')
    );

    if (bundles.length === 0) {
      return null;
    }

    for (const bundle of bundles) {
      if (bundle.bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.PRODUCT_PAGE ||
          bundle.bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE) {

        if (config.bundleId && bundle.id === config.bundleId) {
          return bundle;
        }

        if (config.isContainerProduct && config.containerBundleId && bundle.id === config.containerBundleId) {
          return bundle;
        }

        if (config.currentProductId) {
          const productIdStr = config.currentProductId.toString();
          const productGid = `gid://shopify/Product/${config.currentProductId}`;

          if (bundle.shopifyProductId === productGid || bundle.shopifyProductId === productIdStr) {
            return bundle;
          }

          const bundleProductId = bundle.shopifyProductId ? bundle.shopifyProductId.split('/').pop() : null;
          if (bundleProductId === productIdStr) {
            return bundle;
          }
        }

        const isThemeEditor = this.isThemeEditorContext();
        if (isThemeEditor) {
          return bundle;
        }
      }
    }

    console.warn('[BUNDLE_WIDGET] selectBundle: no bundle matched config:', config);
    return null;
  }

  static isThemeEditorContext() {
    return window.Shopify?.designMode ||
      window.isThemeEditorContext ||
      window.location.pathname.includes('/editor') ||
      window.location.search.includes('preview_theme_id') ||
      window.location.search.includes('previewPath') ||
      document.referrer.includes('admin.shopify.com') ||
      window.autoDetectedBundleId;
  }
}

class PricingCalculator {
  static calculateBundleTotal(selectedProducts, stepProductData, steps = null) {
    let totalPrice = 0;
    let totalQuantity = 0;

    selectedProducts.forEach((stepSelections, stepIndex) => {

      if (steps?.[stepIndex]?.isFreeGift) return;

      const productsInStep = stepProductData[stepIndex] || [];

      Object.entries(stepSelections).forEach(([variantId, quantity]) => {

        let product = productsInStep.find(p => String(p.variantId || p.id) === String(variantId));
        let matchedVariant = null;

        if (!product) {
          for (const p of productsInStep) {
            if (p.variants && Array.isArray(p.variants)) {
              const variant = p.variants.find(v => String(v.id) === String(variantId));
              if (variant) {
                product = p;
                matchedVariant = variant;
                break;
              }
            }
          }
        }

        if (product && quantity > 0) {

          const price = matchedVariant
            ? (Number(matchedVariant.price) || 0)
            : (product.price || 0);
          totalPrice += price * quantity;
          totalQuantity += quantity;
        }
      });
    });

    return { totalPrice, totalQuantity };
  }

  static calculateDiscount(bundle, totalPrice, totalQuantity) {
    if (!bundle?.pricing?.enabled || !bundle.pricing.rules?.length) {
      return {
        hasDiscount: false,
        discountAmount: 0,
        finalPrice: totalPrice,
        discountPercentage: 0,
        qualifiesForDiscount: false,
        applicableRule: null
      };
    }

    const rules = bundle.pricing.rules;
    let bestRule = null;

    for (const rule of rules) {

      if (!rule.condition) continue;

      const conditionType = rule.condition.type;
      const conditionOperator = rule.condition.operator;
      const conditionValue = rule.condition.value;

      let conditionMet = false;

      if (conditionType === 'amount') {

        conditionMet = this.checkCondition(totalPrice, conditionOperator, conditionValue);
      } else {

        conditionMet = this.checkCondition(totalQuantity, conditionOperator, conditionValue);
      }

      if (conditionMet) {
        if (!bestRule || conditionValue > bestRule.condition.value) {
          bestRule = rule;
        }
      }
    }

    if (!bestRule) {
      return {
        hasDiscount: false,
        discountAmount: 0,
        finalPrice: totalPrice,
        discountPercentage: 0,
        qualifiesForDiscount: false,
        applicableRule: null
      };
    }

    let discountAmount = 0;
    const discountMethod = bestRule.discount.method;
    const discountValue = bestRule.discount.value;

    switch (discountMethod) {
      case BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF:

        discountAmount = Math.round(totalPrice * (discountValue / 100));
        break;
      case BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_AMOUNT_OFF:

        discountAmount = discountValue;
        break;
      case BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_BUNDLE_PRICE:

        discountAmount = Math.max(0, totalPrice - discountValue);
        break;
      default:
        discountAmount = 0;
    }

    discountAmount = Math.min(discountAmount, totalPrice);
    const finalPrice = Math.max(0, totalPrice - discountAmount);
    const discountPercentage = totalPrice > 0 ? (discountAmount / totalPrice) * 100 : 0;

    const result = {
      hasDiscount: discountAmount > 0,
      discountAmount,
      finalPrice,
      discountPercentage,
      qualifiesForDiscount: true,
      applicableRule: bestRule,
      discountMethod
    };

    return result;
  }

  static checkCondition(value, condition, targetValue) {

    const normalizedCondition = this.normalizeCondition(condition);

    switch (normalizedCondition) {
      case BUNDLE_WIDGET.CONDITION_OPERATORS.EQUAL_TO:

        return value >= targetValue;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN:
        return value > targetValue;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN:
        return value < targetValue;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL_TO:
        return value >= targetValue;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN_OR_EQUAL_TO:
        return value <= targetValue;
      default:

        return value >= targetValue;
    }
  }

  static normalizeCondition(condition) {

    const conditionMap = {
      'gte': BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL_TO,
      'gt': BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN,
      'lte': BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN_OR_EQUAL_TO,
      'lt': BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN,
      'eq': BUNDLE_WIDGET.CONDITION_OPERATORS.EQUAL_TO,
      'equal_to': BUNDLE_WIDGET.CONDITION_OPERATORS.EQUAL_TO,
      'greater_than': BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN,
      'less_than': BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN,
      'greater_than_or_equal_to': BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL_TO,
      'greater_than_equal_to': BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL_TO,
      'less_than_or_equal_to': BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN_OR_EQUAL_TO,
      'less_than_equal_to': BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN_OR_EQUAL_TO
    };

    return conditionMap[condition] || condition || BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL_TO;
  }

  static getNextDiscountRule(bundle, currentQuantity, currentAmount) {
    if (!bundle?.pricing?.rules?.length) return null;

    const rules = [...bundle.pricing.rules].sort((a, b) => a.condition.value - b.condition.value);

    for (const rule of rules) {
      if (!rule.condition) continue;

      const conditionType = rule.condition.type;
      const conditionOperator = rule.condition.operator;
      const conditionValue = rule.condition.value;

      let isRuleSatisfied = false;

      if (conditionType === 'amount') {
        isRuleSatisfied = this.checkCondition(currentAmount, conditionOperator, conditionValue);
      } else {
        isRuleSatisfied = this.checkCondition(currentQuantity, conditionOperator, conditionValue);
      }

      if (!isRuleSatisfied) {
        return rule;
      }
    }
    return null;
  }
}

class ToastManager {

  static _escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  static _isEnterFromBottom() {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--bundle-toast-enter-from-bottom')
      .trim() === '1';
  }

  static show(message, duration = 4000) {

    const existingToast = document.getElementById('bundle-toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.id = 'bundle-toast';
    toast.className = 'bundle-toast';
    if (this._isEnterFromBottom()) {
      toast.classList.add('bundle-toast-from-bottom');
    }
    toast.innerHTML = `
      <span>${this._escapeHtml(message)}</span>
      <svg class="toast-close" width="20" height="20" viewBox="0 0 24 24" fill="none" style="cursor: pointer;">
        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });

    document.body.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, duration);
    }
  }

  static showWithUndo(message, undoCallback, duration = 5000) {

    const existingToast = document.getElementById('bundle-toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.id = 'bundle-toast';
    toast.className = 'bundle-toast bundle-toast-with-undo';
    if (this._isEnterFromBottom()) {
      toast.classList.add('bundle-toast-from-bottom');
    }
    toast.innerHTML = `
      <span class="toast-message">${this._escapeHtml(message)}</span>
      <button class="toast-undo-btn" type="button">Undo</button>
      <svg class="toast-close" width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    const undoBtn = toast.querySelector('.toast-undo-btn');
    const closeBtn = toast.querySelector('.toast-close');
    let undoTriggered = false;

    undoBtn.addEventListener('click', () => {
      if (!undoTriggered && typeof undoCallback === 'function') {
        undoTriggered = true;
        undoCallback();
        toast.remove();
      }
    });

    closeBtn.addEventListener('click', () => {
      toast.remove();
    });

    document.body.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, duration);
    }

    return toast;
  }
}

/**
 * Bundle Widget - Template Manager
 *
 * Handles dynamic message templating with variable replacement.
 * Used for discount messaging, progress text, and bundle information.
 *
 * @version 4.0.0
 */

class TemplateManager {
  static getQualificationGap(currentValue, targetValue, operator, unitStep = 1) {
    const normalizedOp = PricingCalculator.normalizeCondition(operator);

    switch (normalizedOp) {
      case BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN:
        return Math.max(0, (targetValue + unitStep) - currentValue);
      case BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN:
        return Math.max(0, currentValue - (targetValue - unitStep));
      case BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN_OR_EQUAL_TO:
        return Math.max(0, currentValue - targetValue);
      case BUNDLE_WIDGET.CONDITION_OPERATORS.EQUAL_TO:
      case BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL_TO:
      default:

        return Math.max(0, targetValue - currentValue);
    }
  }

  static replaceVariables(template, variables) {
    if (!template) return '';

    let result = template;

    Object.entries(variables).forEach(([key, value]) => {

      let replacementValue = value;
      if (key === 'conditionText') {
        replacementValue = `<span class="bundle-conditions-text" style="color: var(--bundle-conditions-text-color, inherit);">${value}</span>`;
      } else if (key === 'discountText') {
        replacementValue = `<span class="bundle-discount-text" style="color: var(--bundle-discount-text-color, inherit);">${value}</span>`;
      }

      const combined = new RegExp(`\\{\\{${key}\\}\\}|\\{${key}\\}`, 'g');
      result = result.replace(combined, replacementValue);
    });
    return result;
  }

  static createDiscountVariables(bundle, totalPrice, totalQuantity, discountInfo, currencyInfo) {
    const nextRule = PricingCalculator.getNextDiscountRule(bundle, totalQuantity, totalPrice);
    const ruleToUse = discountInfo.applicableRule || nextRule;

    if (!ruleToUse) {
      return this.createEmptyVariables(bundle, totalPrice, totalQuantity, discountInfo, currencyInfo);
    }

    const conditionType = ruleToUse.condition.type;
    const targetValue = ruleToUse.condition.value;
    const conditionOperator = ruleToUse.condition.operator;
    const discountMethod = ruleToUse.discount.method;
    const rawDiscountValue = ruleToUse.discount.value;

    const conditionData = this.calculateConditionData(conditionType, targetValue, conditionOperator, totalPrice, totalQuantity, currencyInfo);

    const discountData = this.calculateDiscountData(discountMethod, rawDiscountValue, currencyInfo);

    const currentProgress = conditionType === 'amount' ? totalPrice : totalQuantity;
    const progressPercentage = targetValue > 0 ? Math.min(100, (currentProgress / targetValue) * 100) : 0;

    const variables = {

      amountNeeded: conditionData.amountNeeded,
      itemsNeeded: conditionData.itemsNeeded,
      conditionText: conditionData.conditionText,

      discountText: discountData.discountText,

      alreadyQualified: conditionData.alreadyQualified || false,

      currentAmount: CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format),
      currentQuantity: totalQuantity.toString(),
      targetAmount: conditionType === 'amount' ? CurrencyManager.formatMoney(targetValue, currencyInfo.display.format) : '0',
      targetQuantity: conditionType === 'quantity' ? targetValue.toString() : '0',
      progressPercentage: Math.round(progressPercentage).toString(),

      bundleName: bundle.name || 'Bundle',

      originalPrice: CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format),
      finalPrice: CurrencyManager.formatMoney(discountInfo.finalPrice, currencyInfo.display.format),
      savingsAmount: CurrencyManager.formatMoney(discountInfo.discountAmount, currencyInfo.display.format),
      savingsPercentage: Math.round(discountInfo.discountPercentage).toString(),

      currencySymbol: currencyInfo.display.symbol,
      currencyCode: currencyInfo.display.code,

      isQualified: discountInfo.qualifiesForDiscount ? 'true' : 'false'
    };

    return variables;
  }

  static formatOperatorText(operator, targetValue, unit) {
    const normalizedOp = PricingCalculator.normalizeCondition(operator);
    const label = targetValue === 1 ? unit : `${unit}s`;

    switch (normalizedOp) {
      case BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN:
        return `more than ${targetValue} ${label}`;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN:
        return `fewer than ${targetValue} ${label}`;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN_OR_EQUAL_TO:
        return `${targetValue} or fewer ${label}`;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.EQUAL_TO:
      case BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL_TO:
      default:

        return `${targetValue} ${label}`;
    }
  }

  static calculateConditionData(conditionType, targetValue, conditionOperator, totalPrice, totalQuantity, currencyInfo) {
    if (conditionType === 'amount') {

      const normalizedOp = PricingCalculator.normalizeCondition(conditionOperator);
      const alreadyQualified = PricingCalculator.checkCondition(totalPrice, conditionOperator, targetValue);
      const amountNeeded = this.getQualificationGap(totalPrice, targetValue, conditionOperator, 1);

      const convertedAmountNeeded = CurrencyManager.convertCurrency(
        amountNeeded,
        currencyInfo.calculation.code,
        currencyInfo.display.code,
        currencyInfo.display.rate
      );

      const amountNeededFormatted = (convertedAmountNeeded / 100).toFixed(2);
      const targetValueFormatted = CurrencyManager.convertCurrency(
        targetValue,
        currencyInfo.calculation.code,
        currencyInfo.display.code,
        currencyInfo.display.rate
      );
      const targetValueFormattedDecimal = (targetValueFormatted / 100).toFixed(2);

      let conditionText;
      if (alreadyQualified) {
        if (normalizedOp === BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN) {
          conditionText = `less than ${currencyInfo.display.symbol}${targetValueFormattedDecimal} met`;
        } else if (normalizedOp === BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN_OR_EQUAL_TO) {
          conditionText = `at most ${currencyInfo.display.symbol}${targetValueFormattedDecimal} met`;
        } else {
          conditionText = `${currencyInfo.display.symbol}${targetValueFormattedDecimal} minimum met`;
        }
      } else if (normalizedOp === BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN) {
        conditionText = `${currencyInfo.display.symbol}${amountNeededFormatted} more`;
      } else if (normalizedOp === BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN) {
        conditionText = `less than ${currencyInfo.display.symbol}${targetValueFormattedDecimal}`;
      } else if (normalizedOp === BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN_OR_EQUAL_TO) {
        conditionText = `at most ${currencyInfo.display.symbol}${targetValueFormattedDecimal}`;
      } else {
        conditionText = `${currencyInfo.display.symbol}${amountNeededFormatted} more`;
      }

      return {
        amountNeeded: amountNeededFormatted,
        itemsNeeded: '0',
        conditionText,
        alreadyQualified
      };
    } else {

      const normalizedOp = PricingCalculator.normalizeCondition(conditionOperator);
      const alreadyQualified = PricingCalculator.checkCondition(totalQuantity, conditionOperator, targetValue);
      const itemsNeeded = this.getQualificationGap(totalQuantity, targetValue, conditionOperator, 1);

      let conditionText;
      if (alreadyQualified) {
        if (
          normalizedOp === BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN ||
          normalizedOp === BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN_OR_EQUAL_TO
        ) {
          conditionText = `${this.formatOperatorText(conditionOperator, targetValue, 'item')} met`;
        } else {
          conditionText = `${targetValue} ${targetValue === 1 ? 'item' : 'items'} minimum met`;
        }
      } else if (
        normalizedOp === BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN ||
        normalizedOp === BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL_TO ||
        normalizedOp === BUNDLE_WIDGET.CONDITION_OPERATORS.EQUAL_TO
      ) {
        conditionText = `${itemsNeeded} more ${itemsNeeded === 1 ? 'item' : 'items'}`;
      } else {
        conditionText = this.formatOperatorText(conditionOperator, targetValue, 'item');
      }

      return {
        amountNeeded: '0',
        itemsNeeded: itemsNeeded.toString(),
        conditionText,
        alreadyQualified
      };
    }
  }

  static calculateDiscountData(discountMethod, rawDiscountValue, currencyInfo) {
    if (rawDiscountValue == null) {
      console.warn('[BUNDLE_WIDGET] calculateDiscountData: rawDiscountValue is', rawDiscountValue);
    }
    const safeValue = parseFloat(rawDiscountValue) || 0;

    switch (discountMethod) {
      case BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF:
        const percentage = Math.round(safeValue);
        return {
          discountText: `${percentage}% off`
        };

      case BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_AMOUNT_OFF:

        const convertedAmount = CurrencyManager.convertCurrency(
          safeValue,
          currencyInfo.calculation.code,
          currencyInfo.display.code,
          currencyInfo.display.rate
        );
        const amountOff = (convertedAmount / 100).toFixed(2);
        return {
          discountText: `${currencyInfo.display.symbol}${amountOff} off`
        };

      case BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_BUNDLE_PRICE:

        const convertedPrice = CurrencyManager.convertCurrency(
          safeValue,
          currencyInfo.calculation.code,
          currencyInfo.display.code,
          currencyInfo.display.rate
        );
        const bundlePrice = (convertedPrice / 100).toFixed(2);
        return {
          discountText: `${currencyInfo.display.symbol}${bundlePrice}`
        };

      default:
        return {
          discountText: 'discount'
        };
    }
  }

  static createEmptyVariables(bundle, totalPrice, totalQuantity, discountInfo, currencyInfo) {
    return {

      amountNeeded: '0',
      itemsNeeded: '0',
      conditionText: '0 items',
      discountText: 'No discount',

      currentAmount: CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format),
      currentQuantity: totalQuantity.toString(),
      targetAmount: '0',
      targetQuantity: '0',
      progressPercentage: '0',

      bundleName: bundle.name || 'Bundle',

      originalPrice: CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format),
      finalPrice: CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format),
      savingsAmount: '0',
      savingsPercentage: '0',

      currencySymbol: currencyInfo.display.symbol,
      currencyCode: currencyInfo.display.code,

      isQualified: 'false'
    };
  }
}

/**
 * Bundle Widget - Component Generator
 *
 * Generates HTML for all UI elements including product cards,
 * modal structure, tabs, progress bars, and footer components.
 *
 * @version 4.0.0
 */

class ComponentGenerator {
  /** Escape HTML special characters to prevent XSS in innerHTML contexts */
  static escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Generates HTML for a product card with variant selector and quantity controls
   * @param {Object} product - Product data
   * @param {number} currentQuantity - Current selected quantity
   * @param {Object} currencyInfo - Currency formatting info
   * @param {Object} options - Optional settings
   * @param {boolean} options.showQuantitySelector - Whether to show quantity selector (default: true)
   */
  static renderProductCard(product, currentQuantity, currencyInfo, options = {}) {
    const selectionKey = product.variantId || product.id;
    const isSelected = currentQuantity > 0;

    const isExpandedVariantCard = product.parentProductId && (!product.variants || product.variants.length === 0);

    const variantSelectorHtml = options.variantSelectorHtml !== undefined
      ? options.variantSelectorHtml
      : (isExpandedVariantCard ? '' : this.renderVariantSelector(product));

    const renderInlineQuantityControls = () => {
      if (!isSelected) return '';
      return `
        <div class="inline-quantity-controls">
          <button class="inline-qty-btn qty-decrease" data-product-id="${selectionKey}">−</button>
          <span class="inline-qty-display">${currentQuantity}</span>
          <button class="inline-qty-btn qty-increase" data-product-id="${selectionKey}">+</button>
        </div>
      `;
    };

    const renderBottomAction = () => {
      if (isSelected) {
        return renderInlineQuantityControls();
      }
      return `<button class="product-add-btn" data-product-id="${selectionKey}">+</button>`;
    };

    const renderVariantBadge = () => {
      if (isExpandedVariantCard && product.variantTitle) {
        return `<div class="product-variant-badge">${this.escapeHtml(product.variantTitle)}</div>`;
      }
      return '';
    };

    return `
      <div class="product-card ${isSelected ? 'selected' : ''}" data-product-id="${selectionKey}">
        ${isSelected ? `
          <div class="selected-overlay">✓</div>
        ` : ''}

        <div class="product-image">
          <img src="${product.imageUrl || product.image?.src || BUNDLE_WIDGET.PLACEHOLDER_IMAGE}" alt="${this.escapeHtml(product.title)}" loading="lazy" onerror="this.src='${BUNDLE_WIDGET.PLACEHOLDER_IMAGE}'">
        </div>

        <div class="product-content-wrapper">
          <div class="product-title">${this.escapeHtml(product.parentTitle || product.title)}</div>
          ${renderVariantBadge()}

          ${product.price ? `
            <div class="product-price-row">
              ${product.compareAtPrice ? `<span class="product-price-strike">${CurrencyManager.formatMoney(product.compareAtPrice, currencyInfo.display.format)}</span>` : ''}
              <span class="product-price">${CurrencyManager.formatMoney(product.price, currencyInfo.display.format)}</span>
            </div>
          ` : ''}

          <div class="product-spacer"></div>

          ${variantSelectorHtml}

          ${renderBottomAction()}
        </div>
      </div>
    `;
  }

  static renderEmptyStateCards(labelText, count = 3) {
    const cards = Array(count).fill(0).map(() => `
      <div class="empty-state-card">
        <svg class="empty-state-card-icon" width="69" height="69" viewBox="0 0 69 69" fill="none">
          <line x1="34.5" y1="15" x2="34.5" y2="54" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
          <line x1="15" y1="34.5" x2="54" y2="34.5" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        </svg>
        <p class="empty-state-card-text">${this.escapeHtml(labelText)}</p>
      </div>
    `).join('');

    return cards;
  }

  static renderVariantSelector(product) {
    if (!product.variants || product.variants.length <= 1) {
      return '';
    }

    const options = product.variants.map(variant => {
      const isAvailable = variant.available !== false;
      const label = this.escapeHtml(variant.title === 'Default Title' ? product.title : variant.title);
      return `<option value="${variant.id}" ${!isAvailable ? 'disabled' : ''}>${label}${!isAvailable ? ' (Out of Stock)' : ''}</option>`;
    }).join('');

    return `
      <select class="variant-selector" data-product-id="${product.variantId || product.id}">
        ${options}
      </select>
    `;
  }

  static createModalHTML() {
    return `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-step-title"></div>
          <div class="modal-tabs-wrapper">
            <button class="tab-arrow tab-arrow-left" aria-label="Scroll tabs left">&lsaquo;</button>
            <div class="modal-tabs"></div>
            <button class="tab-arrow tab-arrow-right" aria-label="Scroll tabs right">&rsaquo;</button>
          </div>
          <span class="close-button">&times;</span>
        </div>
        <div class="modal-body">
          <div class="product-grid"></div>
        </div>
        <div class="modal-footer">
          <div class="modal-footer-grouped-content">
            <div class="modal-footer-total-pill">
              <span class="total-price-strike"></span>
              <span class="total-price-final"></span>
              <span class="price-cart-separator">|</span>
              <span class="cart-badge-wrapper">
                <span class="cart-badge-count">0</span>
                <svg class="cart-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                </svg>
              </span>
            </div>

            <div class="modal-footer-buttons-row">
              <button class="modal-nav-button prev-button">BACK</button>
              <button class="modal-nav-button next-button">NEXT</button>
            </div>

            <div class="modal-footer-discount-messaging">
              <div class="footer-discount-text"></div>
            </div>

            <div class="modal-footer-progress-section">
              <div class="modal-footer-progress-bar">
                <div class="modal-footer-progress-fill"></div>
              </div>
              <div class="modal-footer-progress-details">
                <span class="current-quantity">0</span> / <span class="target-quantity">0</span> items
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static renderTab(step, index, isActive, isCompleted, isLocked) {
    const statusClass = isCompleted ? 'completed' : (isLocked ? 'locked' : '');
    const activeClass = isActive ? 'active' : '';

    return `
      <button
        class="bundle-header-tab ${activeClass} ${statusClass}"
        data-step-index="${index}"
        ${isLocked ? 'disabled' : ''}
      >
        ${step.name || `Step ${index + 1}`}
        ${isCompleted ? '✓' : ''}
      </button>
    `;
  }

  static renderProgressBar(currentValue, targetValue) {
    const percentage = targetValue > 0 ? Math.min(100, (currentValue / targetValue) * 100) : 0;

    return `
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${percentage}%"></div>
      </div>
      <div class="progress-details">
        <span class="progress-text">
          <span class="current-quantity">${currentValue}</span> / <span class="target-quantity">${targetValue}</span>
        </span>
      </div>
    `;
  }
}

function createDefaultLoadingAnimation() {

  if (!document.getElementById('bundle-default-loading-keyframes')) {
    const style = document.createElement('style');
    style.id = 'bundle-default-loading-keyframes';
    style.textContent = `
      @keyframes bundle-dot-pulse {
        0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
        40% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'bundle-loading-overlay__default-animation';

  wrapper.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" width="120" height="40" role="img" aria-label="Loading">
  <circle cx="20" cy="20" r="8" fill="white" style="animation: bundle-dot-pulse 1.4s ease-in-out -0.32s infinite; transform-origin: 20px 20px;" />
  <circle cx="60" cy="20" r="8" fill="white" style="animation: bundle-dot-pulse 1.4s ease-in-out -0.16s infinite; transform-origin: 60px 20px;" />
  <circle cx="100" cy="20" r="8" fill="white" style="animation: bundle-dot-pulse 1.4s ease-in-out 0s infinite; transform-origin: 100px 20px;" />
</svg>`;

  return wrapper;
}

class VariantSelectorComponent {

  static renderHtml(product, primaryOptionName) {
    const variants = product.variants || [];
    const options = product.options || [];

    if (variants.length <= 1 || options.length === 0) return '';

    const primaryIdx = VariantSelectorComponent._primaryIdx(options, primaryOptionName);
    const primaryValues = VariantSelectorComponent._uniqueValues(variants, primaryIdx);
    if (primaryValues.length === 0) return '';

    const selectedVariant = variants.find(v => v.id === product.variantId);
    const selectedPrimaryVal = selectedVariant
      ? (selectedVariant[`option${primaryIdx}`] || primaryValues[0])
      : primaryValues[0];

    const MAX_VISIBLE = 4;
    const visible = primaryValues.slice(0, MAX_VISIBLE);
    const overflowCount = primaryValues.length - MAX_VISIBLE;

    const btnGroupHtml = visible.map(val => {
      const avail = variants.some(v => v[`option${primaryIdx}`] === val && v.available !== false);
      const sel = val === selectedPrimaryVal;
      const cls = ['vs-btn', sel ? 'vs-btn--selected' : '', !avail ? 'vs-btn--oos' : ''].filter(Boolean).join(' ');
      return `<button type="button" class="${cls}" data-primary-opt-idx="${primaryIdx}" data-primary-value="${VariantSelectorComponent._esc(val)}"${!avail ? ' disabled' : ''}>${VariantSelectorComponent._esc(val)}</button>`;
    }).join('');

    const overflowHtml = overflowCount > 0
      ? `<button type="button" class="vs-btn vs-btn--overflow" data-overflow="1" data-primary-opt-idx="${primaryIdx}" data-all-values="${VariantSelectorComponent._esc(JSON.stringify(primaryValues))}">+${overflowCount}</button>`
      : '';

    const secondaryHtml = (() => {
      if (options.length <= 1 || !selectedVariant) return '';
      const pills = options.map((optName, i) => {
        if (i === primaryIdx - 1) return '';
        const optIdx = i + 1;
        const val = selectedVariant[`option${optIdx}`];
        if (!val) return '';
        return `<button type="button" class="vs-secondary-pill" data-opt-idx="${optIdx}"><span class="vs-secondary-label">${VariantSelectorComponent._esc(optName)}:</span> <strong>${VariantSelectorComponent._esc(val)}</strong> <span class="vs-chevron">&#9662;</span></button>`;
      }).filter(Boolean).join('');
      return pills ? `<div class="vs-secondary">${pills}</div>` : '';
    })();

    const productId = product.id || product.variantId;
    return `<div class="vs-wrapper" data-vs-product-id="${productId}"><div class="vs-btn-group">${btnGroupHtml}${overflowHtml}</div>${secondaryHtml}</div>`;
  }

  static attachListeners(cardEl, product, onVariantChange) {
    cardEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.vs-btn, .vs-secondary-pill');
      if (!btn || btn.disabled) return;
      e.stopPropagation();

      if (btn.classList.contains('vs-btn--overflow')) {
        VariantSelectorComponent._openOverflowPanel(btn, cardEl, product, onVariantChange);
        return;
      }

      if (btn.classList.contains('vs-secondary-pill')) {
        VariantSelectorComponent._openSecondaryPanel(btn, cardEl, product, onVariantChange);
        return;
      }

      if (btn.classList.contains('vs-btn')) {
        const primaryOptIdx = parseInt(btn.dataset.primaryOptIdx, 10);
        const val = btn.dataset.primaryValue;
        VariantSelectorComponent._selectPrimary(cardEl, product, primaryOptIdx, val, onVariantChange);
      }
    });
  }

  static _primaryIdx(options, primaryOptionName) {
    if (!primaryOptionName) return 1;
    const idx = options.findIndex(o => o.toLowerCase() === primaryOptionName.toLowerCase());
    return idx >= 0 ? idx + 1 : 1;
  }

  static _uniqueValues(variants, optIdx) {
    const seen = new Set();
    const out = [];
    variants.forEach(v => {
      const val = v[`option${optIdx}`];
      if (val && !seen.has(val)) { seen.add(val); out.push(val); }
    });
    return out;
  }

  static _esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  static _findBestVariant(variants, primaryOptIdx, primaryValue, currentVariantId) {
    const current = variants.find(v => v.id === currentVariantId);
    const candidates = variants.filter(v =>
      v[`option${primaryOptIdx}`] === primaryValue && v.available !== false
    );
    if (candidates.length === 0) {
      return variants.find(v => v[`option${primaryOptIdx}`] === primaryValue) || null;
    }
    if (candidates.length === 1 || !current) return candidates[0];

    for (let i = 1; i <= 3; i++) {
      if (i === primaryOptIdx) continue;
      const curVal = current[`option${i}`];
      if (!curVal) continue;
      const match = candidates.find(v => v[`option${i}`] === curVal);
      if (match) return match;
    }
    return candidates[0];
  }

  static _selectPrimary(cardEl, product, primaryOptIdx, val, onVariantChange) {
    const oldVariantId = product.variantId;
    const newVariant = VariantSelectorComponent._findBestVariant(
      product.variants || [], primaryOptIdx, val, oldVariantId
    );
    if (!newVariant) return;

    const wrapper = cardEl.querySelector('.vs-wrapper');
    if (wrapper) {
      wrapper.querySelectorAll('.vs-btn:not(.vs-btn--overflow)').forEach(b => {
        b.classList.toggle('vs-btn--selected', b.dataset.primaryValue === val);
      });

      wrapper.querySelectorAll('.vs-secondary-pill').forEach(pill => {
        const optIdx = parseInt(pill.dataset.optIdx, 10);
        const label = pill.querySelector('.vs-secondary-label');
        const optName = label ? label.textContent.replace(':', '').trim() : `Option ${optIdx}`;
        const newVal = newVariant[`option${optIdx}`] || '';
        pill.innerHTML = `<span class="vs-secondary-label">${VariantSelectorComponent._esc(optName)}:</span> <strong>${VariantSelectorComponent._esc(newVal)}</strong> <span class="vs-chevron">&#9662;</span>`;
      });
    }

    product.variantId = newVariant.id;
    product.price = newVariant.price;
    product.quantityAvailable = typeof newVariant.quantityAvailable === 'number' ? newVariant.quantityAvailable : null;
    product.currentlyNotInStock = newVariant.currentlyNotInStock === true;

    onVariantChange(newVariant.id, oldVariantId);
  }

  static _openOverflowPanel(overflowBtn, cardEl, product, onVariantChange) {
    VariantSelectorComponent._closePanel(cardEl);

    const primaryOptIdx = parseInt(overflowBtn.dataset.primaryOptIdx, 10);
    let allValues;
    try { allValues = JSON.parse(overflowBtn.dataset.allValues); }
    catch (_) { allValues = VariantSelectorComponent._uniqueValues(product.variants || [], primaryOptIdx); }

    const currentVariant = (product.variants || []).find(v => v.id === product.variantId);
    const currentPrimary = currentVariant ? currentVariant[`option${primaryOptIdx}`] : null;

    const panel = VariantSelectorComponent._makePanel();

    allValues.forEach(val => {
      const avail = (product.variants || []).some(v => v[`option${primaryOptIdx}`] === val && v.available !== false);
      const sel = val === currentPrimary;
      const tile = VariantSelectorComponent._makeTile(val, sel, !avail);
      tile.addEventListener('click', (e) => {
        e.stopPropagation();
        VariantSelectorComponent._selectPrimary(cardEl, product, primaryOptIdx, val, onVariantChange);
        VariantSelectorComponent._closePanel(cardEl);
      });
      panel.appendChild(tile);
    });

    const wrapper = cardEl.querySelector('.vs-wrapper');
    if (wrapper) wrapper.appendChild(panel);
    VariantSelectorComponent._bindOutsideClose(panel, cardEl);
  }

  static _openSecondaryPanel(pill, cardEl, product, onVariantChange) {
    VariantSelectorComponent._closePanel(cardEl);

    const optIdx = parseInt(pill.dataset.optIdx, 10);
    const values = VariantSelectorComponent._uniqueValues(product.variants || [], optIdx);
    const currentVariant = (product.variants || []).find(v => v.id === product.variantId);
    const currentVal = currentVariant ? currentVariant[`option${optIdx}`] : null;

    const wrapper = cardEl.querySelector('.vs-wrapper');
    const primaryBtn = wrapper?.querySelector('.vs-btn--selected');
    const primaryOptIdx = primaryBtn ? parseInt(primaryBtn.dataset.primaryOptIdx, 10) : 1;
    const currentPrimary = currentVariant ? currentVariant[`option${primaryOptIdx}`] : null;

    const panel = VariantSelectorComponent._makePanel('vs-panel--secondary');

    values.forEach(val => {
      const candidate = (product.variants || []).find(v => {
        const matchesPrimary = !currentPrimary || v[`option${primaryOptIdx}`] === currentPrimary;
        return matchesPrimary && v[`option${optIdx}`] === val && v.available !== false;
      });
      const sel = val === currentVal;
      const tile = VariantSelectorComponent._makeTile(val, sel, !candidate);

      tile.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!candidate) return;
        const oldVariantId = product.variantId;
        product.variantId = candidate.id;
        product.price = candidate.price;
        product.quantityAvailable = typeof candidate.quantityAvailable === 'number' ? candidate.quantityAvailable : null;
        product.currentlyNotInStock = candidate.currentlyNotInStock === true;

        const optName = pill.querySelector('.vs-secondary-label')?.textContent?.replace(':', '').trim() || `Option ${optIdx}`;
        pill.innerHTML = `<span class="vs-secondary-label">${VariantSelectorComponent._esc(optName)}:</span> <strong>${VariantSelectorComponent._esc(val)}</strong> <span class="vs-chevron">&#9662;</span>`;
        onVariantChange(candidate.id, oldVariantId);
        VariantSelectorComponent._closePanel(cardEl);
      });

      panel.appendChild(tile);
    });

    if (wrapper) wrapper.appendChild(panel);
    VariantSelectorComponent._bindOutsideClose(panel, cardEl);
  }

  static _makePanel(extraClass) {
    const panel = document.createElement('div');
    panel.className = ['vs-panel', extraClass].filter(Boolean).join(' ');
    panel.dataset.vsPanel = '1';
    return panel;
  }

  static _makeTile(label, isSelected, isOos) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = ['vs-panel-tile', isSelected ? 'vs-panel-tile--selected' : '', isOos ? 'vs-panel-tile--oos' : ''].filter(Boolean).join(' ');
    tile.textContent = label;
    if (isOos) tile.disabled = true;
    return tile;
  }

  static _closePanel(cardEl) {
    cardEl.querySelector('[data-vs-panel]')?.remove();
  }

  static _bindOutsideClose(panel, cardEl) {
    setTimeout(() => {
      const close = (e) => {
        if (!panel.contains(e.target)) {
          VariantSelectorComponent._closePanel(cardEl);
          document.removeEventListener('click', close);
        }
      };
      document.addEventListener('click', close);
    }, 0);
  }
}

/**
 * Bundle Product Modal Component
 *
 * Handles the product variant selection modal for full-page bundles.
 * Opens when user clicks "Choose Options" on a product card.
 *
 * Features:
 * - Image gallery with thumbnails
 * - Variant selection dropdowns
 * - Quantity controls
 * - Add To Box functionality
 * - Responsive mobile layout
 *
 * @version 1.0.0
 */

class BundleProductModal {
  constructor(widget) {
    this.widget = widget;
    this.modalElement = null;
    this.currentProduct = null;
    this.currentStep = null;
    this.selectedVariant = null;
    this.selectedQuantity = 1;
    this.selectedImageIndex = 0;

    this.init();
  }

  /**
   * Initialize modal
   */
  init() {
    this.createModalHTML();
    this.attachEventListeners();
  }

  /**
   * Create modal DOM structure
   */
  createModalHTML() {
    const modalHTML = `
      <div class="bundle-modal-overlay" id="bundle-product-modal">
        <div class="bundle-modal-container">
          <!-- Mobile Drag Handle for Swipe-to-Dismiss -->
          <div class="bundle-modal-drag-handle">
            <div class="bundle-modal-drag-indicator"></div>
          </div>
          <button class="bundle-modal-close" aria-label="Close modal">&times;</button>

          <div class="bundle-modal-content">
            <!-- Left Column: Image Gallery with Carousel -->
            <div class="bundle-modal-images">
              <div class="bundle-modal-main-image-container">
                <button class="bundle-modal-carousel-btn bundle-modal-carousel-prev" id="modal-carousel-prev" aria-label="Previous image">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <div class="bundle-modal-main-image">
                  <img src="" alt="Product image" id="modal-main-image">
                </div>
                <button class="bundle-modal-carousel-btn bundle-modal-carousel-next" id="modal-carousel-next" aria-label="Next image">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
                <div class="bundle-modal-image-counter" id="modal-image-counter">
                  <!-- Image counter will be inserted here (e.g., "1 / 5") -->
                </div>
              </div>
              <div class="bundle-modal-thumbnails" id="modal-thumbnails">
                <!-- Thumbnails will be inserted here -->
              </div>
            </div>

            <!-- Right Column: Product Details -->
            <div class="bundle-modal-details">
              <div class="bundle-modal-header">
                <h2 class="bundle-modal-title" id="modal-product-title"></h2>
                <div class="bundle-modal-selection-summary" id="modal-selection-summary" style="display: none;">
                  <svg class="selection-check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13 4L6 11L3 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>Selected: <strong id="modal-selection-text"></strong></span>
                </div>
                <div class="bundle-modal-price" id="modal-product-price"></div>
              </div>

              <div class="bundle-modal-description" id="modal-product-description"></div>

              <!-- Variant Selectors (above quantity) -->
              <div class="bundle-modal-variants" id="modal-variants-container">
                <!-- Variant selectors will be inserted here -->
              </div>

              <!-- Quantity Selector (below variants) -->
              <div class="bundle-modal-quantity">
                <label class="bundle-modal-quantity-label">Quantity</label>
                <div class="bundle-modal-quantity-controls">
                  <button class="bundle-modal-qty-btn" id="modal-qty-decrease">−</button>
                  <span class="bundle-modal-qty-display" id="modal-qty-display">1</span>
                  <button class="bundle-modal-qty-btn" id="modal-qty-increase">+</button>
                </div>
              </div>

              <button class="bundle-modal-add-btn" id="modal-add-to-box">
                Add To Box
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modalElement = document.getElementById('bundle-product-modal');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {

    const closeBtn = this.modalElement.querySelector('.bundle-modal-close');
    closeBtn.addEventListener('click', () => this.close());

    this.modalElement.addEventListener('click', (e) => {
      if (e.target === this.modalElement) {
        this.close();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalElement.classList.contains('active')) {
        this.close();
      }
    });

    document.getElementById('modal-carousel-prev').addEventListener('click', () => {
      this.navigateCarousel(-1);
    });

    document.getElementById('modal-carousel-next').addEventListener('click', () => {
      this.navigateCarousel(1);
    });

    document.getElementById('modal-qty-decrease').addEventListener('click', () => {
      this.updateQuantity(Math.max(1, this.selectedQuantity - 1));
    });

    document.getElementById('modal-qty-increase').addEventListener('click', () => {
      this.updateQuantity(this.selectedQuantity + 1);
    });

    document.getElementById('modal-add-to-box').addEventListener('click', () => {
      this.addToBundle();
    });

    this.setupSwipeGestures();
  }

  /**
   * Setup swipe gestures for mobile
   * - Swipe down on container to dismiss
   * - Swipe left/right on image to navigate carousel
   */
  setupSwipeGestures() {
    const modalContainer = this.modalElement.querySelector('.bundle-modal-container');
    const imageContainer = this.modalElement.querySelector('.bundle-modal-main-image-container');

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isSwiping = false;

    const dragHandle = this.modalElement.querySelector('.bundle-modal-drag-handle');
    if (dragHandle) {
      dragHandle.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        isSwiping = true;
        modalContainer.style.transition = 'none';
      }, { passive: true });

      dragHandle.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - touchStartY;

        if (deltaY > 0) {
          modalContainer.style.transform = `translateY(${deltaY}px)`;
          modalContainer.style.opacity = Math.max(0.5, 1 - deltaY / 300);
        }
      }, { passive: true });

      dragHandle.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        isSwiping = false;

        const deltaY = e.changedTouches[0].clientY - touchStartY;
        const deltaTime = Date.now() - touchStartTime;

        modalContainer.style.transition = 'transform 0.3s ease, opacity 0.3s ease';

        if ((deltaY > 100 && deltaTime < 300) || deltaY > 150) {
          modalContainer.style.transform = 'translateY(100%)';
          modalContainer.style.opacity = '0';
          setTimeout(() => {
            this.close();
            modalContainer.style.transform = '';
            modalContainer.style.opacity = '';
          }, 300);
        } else {

          modalContainer.style.transform = '';
          modalContainer.style.opacity = '';
        }
      }, { passive: true });
    }

    if (imageContainer) {
      imageContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartTime = Date.now();
      }, { passive: true });

      imageContainer.addEventListener('touchend', (e) => {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaTime = Date.now() - touchStartTime;

        if (Math.abs(deltaX) > 50 && deltaTime < 300) {
          if (deltaX > 0) {

            this.navigateCarousel(-1);
          } else {

            this.navigateCarousel(1);
          }
        }
      }, { passive: true });
    }
  }

  /**
   * Navigate carousel by direction
   * @param {number} direction - -1 for previous, 1 for next
   */
  navigateCarousel(direction) {
    const images = this.getProductImages();
    if (images.length <= 1) return;

    let newIndex = this.selectedImageIndex + direction;

    if (newIndex < 0) {
      newIndex = images.length - 1;
    } else if (newIndex >= images.length) {
      newIndex = 0;
    }

    this.selectImage(newIndex);
  }

  /**
   * Open modal with product data
   * @param {Object} product - Product data
   * @param {Object} step - Step data
   */
  open(product, step) {

    this.currentProduct = product;
    this.currentStep = step;
    this.selectedQuantity = 1;
    this.selectedImageIndex = 0;

    this.populateModal();

    this.modalElement.classList.add('active');
    document.body.classList.add('modal-open');
  }

  /**
   * Close modal
   */
  close() {
    this.modalElement.classList.remove('active');
    document.body.classList.remove('modal-open');

    this.currentProduct = null;
    this.currentStep = null;
    this.selectedVariant = null;
    this.selectedQuantity = 1;
    this.selectedImageIndex = 0;
  }

  /**
   * Populate modal with product data
   */
  populateModal() {

    const displayTitle = this.currentProduct.parentTitle || this.currentProduct.title;
    document.getElementById('modal-product-title').textContent = displayTitle;

    const descriptionEl = document.getElementById('modal-product-description');
    if (this.currentProduct.description) {
      descriptionEl.textContent = this.currentProduct.description;
      descriptionEl.style.display = 'block';
    } else {
      descriptionEl.style.display = 'none';
    }

    this.loadImages();

    this.createVariantSelectors();

    this.updatePrice();

    const quantitySection = this.modalElement.querySelector('.bundle-modal-quantity');
    if (quantitySection) {
      const showQuantitySelector = this.widget?.config?.showQuantitySelectorInModal !== false;
      quantitySection.style.display = showQuantitySelector ? 'flex' : 'none';
    }

    document.getElementById('modal-qty-display').textContent = this.selectedQuantity;
  }

  /**
   * Get normalized images array from product
   * Handles various image data formats: imageUrl, image.src, images array, featuredImage.url
   * @returns {string[]} Array of image URLs
   */
  getProductImages() {
    const product = this.currentProduct;
    const images = [];

    if (product.images && Array.isArray(product.images)) {

      product.images.forEach(img => {
        if (typeof img === 'string') {
          images.push(img);
        } else if (img?.url) {
          images.push(img.url);
        } else if (img?.src) {
          images.push(img.src);
        }
      });
    }

    if (images.length === 0) {
      if (product.imageUrl) {
        images.push(product.imageUrl);
      } else if (product.image?.src) {
        images.push(product.image.src);
      } else if (product.featuredImage?.url) {
        images.push(product.featuredImage.url);
      }
    }

    return images;
  }

  /**
   * Load product images
   */
  loadImages() {
    const images = this.getProductImages();
    const mainImageEl = document.getElementById('modal-main-image');
    const thumbnailsContainer = document.getElementById('modal-thumbnails');
    const imageCounter = document.getElementById('modal-image-counter');
    const prevBtn = document.getElementById('modal-carousel-prev');
    const nextBtn = document.getElementById('modal-carousel-next');

    if (images.length === 0) {

      mainImageEl.src = BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
      mainImageEl.alt = this.currentProduct.title;
      thumbnailsContainer.innerHTML = '';
      imageCounter.style.display = 'none';
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
      return;
    }

    mainImageEl.src = images[0];
    mainImageEl.alt = this.currentProduct.title;

    if (images.length > 1) {
      prevBtn.style.display = 'flex';
      nextBtn.style.display = 'flex';
      imageCounter.style.display = 'block';
      this.updateImageCounter();

      thumbnailsContainer.innerHTML = images.map((image, index) => `
        <div class="bundle-modal-thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
          <img src="${image}" alt="${this.currentProduct.title} - Image ${index + 1}">
        </div>
      `).join('');

      thumbnailsContainer.querySelectorAll('.bundle-modal-thumbnail').forEach((thumbnail) => {
        thumbnail.addEventListener('click', () => {
          const index = parseInt(thumbnail.dataset.index);
          this.selectImage(index);
        });
      });
    } else {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
      imageCounter.style.display = 'none';
      thumbnailsContainer.innerHTML = '';
    }
  }

  /**
   * Update image counter display
   */
  updateImageCounter() {
    const images = this.getProductImages();
    const imageCounter = document.getElementById('modal-image-counter');
    if (imageCounter && images.length > 1) {
      imageCounter.textContent = `${this.selectedImageIndex + 1} / ${images.length}`;
    }
  }

  /**
   * Select image by index
   * @param {number} index - Image index
   */
  selectImage(index) {
    const images = this.getProductImages();
    if (index < 0 || index >= images.length) return;

    this.selectedImageIndex = index;

    const mainImageEl = document.getElementById('modal-main-image');
    mainImageEl.src = images[index];

    document.querySelectorAll('.bundle-modal-thumbnail').forEach((thumb, i) => {
      thumb.classList.toggle('active', i === index);
    });

    this.updateImageCounter();

    const activeThumbnail = document.querySelector('.bundle-modal-thumbnail.active');
    if (activeThumbnail) {
      activeThumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  /**
   * Create variant selector with button/swatch style options
   */
  createVariantSelectors() {
    const variantsContainer = document.getElementById('modal-variants-container');
    const variants = this.currentProduct.variants || [];

    if (variants.length <= 1) {
      variantsContainer.innerHTML = '';
      this.selectedVariant = variants[0] || this.currentProduct;
      return;
    }

    let optionNames = this.currentProduct.options || [];

    if (optionNames.length > 0 && typeof optionNames[0] === 'object' && optionNames[0].name) {
      optionNames = optionNames.map(opt => opt.name);
    }

    if (optionNames.length === 0 && variants.length > 0) {
      const firstVariant = variants[0];

      if (firstVariant.option1) optionNames.push('Option 1');
      if (firstVariant.option2) optionNames.push('Option 2');
      if (firstVariant.option3) optionNames.push('Option 3');
    }

    if (optionNames.length === 0) {

      this.selectedVariant = variants[0];
      variantsContainer.innerHTML = '';
      return;
    }

    this.selectedOptions = {};

    const currentVariantId = this.currentProduct.variantId;
    const currentVariant = variants.find(v => String(v.id) === String(currentVariantId));

    variantsContainer.innerHTML = optionNames.map((optionName, optionIndex) => {

      const optionValues = [...new Set(
        variants
          .map(v => v[`option${optionIndex + 1}`])
          .filter(val => val !== undefined && val !== null && val !== '')
      )];

      if (optionValues.length === 0) return '';

      const preSelectedValue = currentVariant?.[`option${optionIndex + 1}`] || optionValues[0];
      this.selectedOptions[optionIndex] = preSelectedValue;

      const isColorOption = this.isColorOption(optionName, optionValues);

      return `
        <div class="bundle-modal-variant-group">
          <label class="bundle-modal-variant-label">${optionName}: <span class="bundle-modal-variant-selected-value" data-option-index="${optionIndex}">${preSelectedValue}</span></label>
          <div class="bundle-modal-variant-options ${isColorOption ? 'color-options' : ''}" data-option-index="${optionIndex}">
            ${optionValues.map((value) => {
              const isSelected = value === preSelectedValue;
              const colorStyle = isColorOption ? this.getColorStyle(value) : '';
              return `
                <button type="button"
                  class="bundle-modal-variant-btn ${isSelected ? 'selected' : ''} ${isColorOption ? 'color-swatch' : ''}"
                  data-option-index="${optionIndex}"
                  data-value="${value}"
                  ${isColorOption && colorStyle ? `style="${colorStyle}"` : ''}
                  title="${value}">
                  ${isColorOption ? '' : value}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).filter(html => html !== '').join('');

    variantsContainer.querySelectorAll('.bundle-modal-variant-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const optionIndex = parseInt(btn.dataset.optionIndex);
        const value = btn.dataset.value;
        this.selectVariantOption(optionIndex, value);
      });
    });

    this.updateSelectedVariant();
  }

  /**
   * Check if option is likely a color option
   * @param {string} optionName - Option name
   * @param {string[]} values - Option values
   * @returns {boolean}
   */
  isColorOption(optionName, values) {
    const colorKeywords = ['color', 'colour', 'colors', 'colours'];
    if (colorKeywords.some(keyword => optionName.toLowerCase().includes(keyword))) {
      return true;
    }

    const commonColors = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'pink', 'purple', 'orange', 'brown', 'grey', 'gray', 'navy', 'beige', 'cream'];
    const colorMatches = values.filter(v => commonColors.some(c => v.toLowerCase().includes(c)));
    return colorMatches.length > values.length / 2;
  }

  /**
   * Get CSS style for color swatch
   * @param {string} colorName - Color name
   * @returns {string} CSS style string
   */
  getColorStyle(colorName) {

    const colorMap = {
      'red': '#DC2626', 'blue': '#2563EB', 'green': '#16A34A', 'black': '#000000',
      'white': '#FFFFFF', 'yellow': '#EAB308', 'pink': '#EC4899', 'purple': '#9333EA',
      'orange': '#EA580C', 'brown': '#92400E', 'grey': '#6B7280', 'gray': '#6B7280',
      'navy': '#1E3A8A', 'beige': '#D4C4A8', 'cream': '#FFFDD0', 'gold': '#D4AF37',
      'silver': '#C0C0C0', 'teal': '#0D9488', 'coral': '#F87171', 'mint': '#A7F3D0'
    };

    const lowerName = colorName.toLowerCase();
    for (const [key, value] of Object.entries(colorMap)) {
      if (lowerName.includes(key)) {
        return `background-color: ${value}`;
      }
    }

    if (lowerName.startsWith('#') || lowerName.startsWith('rgb')) {
      return `background-color: ${colorName}`;
    }

    return 'background: linear-gradient(135deg, #f0f0f0, #e0e0e0)';
  }

  /**
   * Select a variant option
   * @param {number} optionIndex - Index of the option (0, 1, or 2)
   * @param {string} value - Selected value
   */
  selectVariantOption(optionIndex, value) {

    this.selectedOptions[optionIndex] = value;

    const optionsContainer = document.querySelector(`.bundle-modal-variant-options[data-option-index="${optionIndex}"]`);
    if (optionsContainer) {
      optionsContainer.querySelectorAll('.bundle-modal-variant-btn').forEach((btn) => {
        btn.classList.toggle('selected', btn.dataset.value === value);
      });
    }

    const valueLabel = document.querySelector(`.bundle-modal-variant-selected-value[data-option-index="${optionIndex}"]`);
    if (valueLabel) {
      valueLabel.textContent = value;
    }

    this.updateSelectedVariant();
  }

  /**
   * Update selected variant based on button selections
   */
  updateSelectedVariant() {
    const variants = this.currentProduct.variants || [];

    const selectedOptionValues = Object.keys(this.selectedOptions || {})
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(key => this.selectedOptions[key]);

    this.selectedVariant = variants.find(variant => {
      return selectedOptionValues.every((value, index) => {
        const variantValue = variant[`option${index + 1}`];
        return variantValue === value;
      });
    });

    if (!this.selectedVariant && variants.length > 0) {
      this.selectedVariant = variants[0];
    }

    this.updateSelectionSummary();

    this.updatePrice();

    this.updateAvailability();

    this.updateVariantImage();

    this.updateOptionAvailability();
  }

  /**
   * Update selection summary display
   * Shows current selection like "Blue / Medium"
   */
  updateSelectionSummary() {
    const summaryContainer = document.getElementById('modal-selection-summary');
    const summaryText = document.getElementById('modal-selection-text');

    if (!summaryContainer || !summaryText) return;

    const selectedValues = Object.keys(this.selectedOptions || {})
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(key => this.selectedOptions[key])
      .filter(value => value && value !== 'Default Title');

    if (selectedValues.length === 0) {
      summaryContainer.style.display = 'none';
      return;
    }

    summaryText.textContent = selectedValues.join(' / ');
    summaryContainer.style.display = 'flex';
  }

  /**
   * Update availability state of variant option buttons
   * Marks options as unavailable if no variant exists with that combination
   */
  updateOptionAvailability() {
    const variants = this.currentProduct.variants || [];
    if (!this.selectedOptions) return;

    const optionIndices = Object.keys(this.selectedOptions).map(k => parseInt(k));

    optionIndices.forEach(optionIndex => {
      const optionsContainer = document.querySelector(`.bundle-modal-variant-options[data-option-index="${optionIndex}"]`);
      if (!optionsContainer) return;

      optionsContainer.querySelectorAll('.bundle-modal-variant-btn').forEach(btn => {
        const testValue = btn.dataset.value;

        const hasAvailableVariant = variants.some(variant => {

          if (variant[`option${optionIndex + 1}`] !== testValue) return false;

          for (const [idx, value] of Object.entries(this.selectedOptions)) {
            if (parseInt(idx) === optionIndex) continue;
            if (variant[`option${parseInt(idx) + 1}`] !== value) return false;
          }

          return variant.available !== false && variant.availableForSale !== false;
        });

        btn.classList.toggle('unavailable', !hasAvailableVariant);
        btn.disabled = !hasAvailableVariant;
      });
    });
  }

  /**
   * Update main image when variant changes (if variant has specific image)
   */
  updateVariantImage() {
    if (!this.selectedVariant) return;

    const variantImage = this.selectedVariant.image ||
                         this.selectedVariant.featured_image ||
                         this.selectedVariant.featuredImage;

    if (variantImage) {
      const imageUrl = typeof variantImage === 'string' ? variantImage :
                       variantImage.src || variantImage.url;

      if (imageUrl) {
        const mainImageEl = document.getElementById('modal-main-image');
        if (mainImageEl) {
          mainImageEl.src = imageUrl;
        }
      }
    }
  }

  /**
   * Update price display
   */
  updatePrice() {
    const priceEl = document.getElementById('modal-product-price');
    const variant = this.selectedVariant || this.currentProduct;

    const price = variant.price || this.currentProduct.price || 0;
    const compareAtPrice = variant.compareAtPrice || variant.compare_at_price ||
                           this.currentProduct.compareAtPrice || this.currentProduct.compare_at_price;

    let priceHTML = '';

    if (compareAtPrice && Number(compareAtPrice) > Number(price)) {
      priceHTML = `
        <span class="bundle-modal-price-strike">${this.formatPrice(compareAtPrice)}</span>
        <span class="bundle-modal-price-sale">${this.formatPrice(price)}</span>
      `;
    } else {
      priceHTML = this.formatPrice(price);
    }

    priceEl.innerHTML = priceHTML;
  }

  /**
   * Format price with currency
   * @param {number} price - Price in cents
   * @returns {string} Formatted price
   */
  formatPrice(price) {

    if (this.widget && this.widget.formatPrice) {
      return this.widget.formatPrice(price);
    }

    const dollars = (price / 100).toFixed(2);
    return `$${dollars}`;
  }

  /**
   * Update availability status
   */
  updateAvailability() {
    const addBtn = document.getElementById('modal-add-to-box');
    const variant = this.selectedVariant || this.currentProduct;

    const isAvailable = variant.available !== false &&
                        variant.availableForSale !== false;

    if (!isAvailable) {
      addBtn.disabled = true;
      addBtn.textContent = 'Out of Stock';
      addBtn.classList.add('out-of-stock');
    } else {
      addBtn.disabled = false;
      addBtn.textContent = 'Add To Box';
      addBtn.classList.remove('out-of-stock');
    }
  }

  /**
   * Update quantity
   * @param {number} quantity - New quantity
   */
  updateQuantity(quantity) {
    this.selectedQuantity = Math.max(1, quantity);
    document.getElementById('modal-qty-display').textContent = this.selectedQuantity;
  }

  /**
   * Add product to bundle
   */
  addToBundle() {
    if (!this.currentProduct || !this.currentStep) {
      return;
    }

    const variant = this.selectedVariant || this.currentProduct;

    const isAvailable = variant.available !== false &&
                        variant.availableForSale !== false;

    if (!isAvailable) {
      return;
    }

    const steps = this.widget.selectedBundle?.steps || [];
    const stepIndex = steps.findIndex(s => s.id === this.currentStep.id);

    if (stepIndex === -1) {
      return;
    }

    const productId = variant.variantId || variant.id || this.currentProduct.id;

    if (this.widget.updateProductSelection) {
      this.widget.updateProductSelection(
        stepIndex,
        productId,
        this.selectedQuantity
      );
    } else {
      return;
    }

    this.close();

    this.showSuccessFeedback();
  }

  /**
   * Show success feedback after adding product
   */
  showSuccessFeedback() {

    if (this.widget && this.widget.showToast) {
      this.widget.showToast('Product added to bundle!', 'success');
    } else {
    }
  }
}

  window.BundleProductModal = BundleProductModal;

/**
 * Bundle Widget - Full Page Version
 *
 * This widget is specifically for full page bundles with horizontal tabs layout.
 * It imports shared components and utilities from bundle-widget-components.js.
 *
 * ============================================================================
 * ARCHITECTURE ROLE
 * ============================================================================
 * This is the THIRD file loaded for FULL PAGE bundles:
 * 1. bundle-widget.js (loader) - Detects bundle type as 'full_page'
 * 2. bundle-widget-components.js - Provides shared utilities
 * 3. THIS FILE (full-page widget) - Implements full page UI/UX
 *
 * ============================================================================
 * WHEN THIS FILE IS LOADED
 * ============================================================================
 * This file loads when:
 * - Container explicitly has data-bundle-type="full_page"
 *
 * Example container:
 * <div id="bundle-builder-app" data-bundle-type="full_page"></div>
 *
 * NOTE: This is OPT-IN only. Without the attribute, product-page widget loads instead.
 *
 * ============================================================================
 * UI LAYOUT: HORIZONTAL TABS
 * ============================================================================
 * - Steps displayed as horizontal tabs at the top
 * - All tabs visible simultaneously (overview of all steps)
 * - Click any tab to jump between steps
 * - Modal overlay for product selection
 * - Progress tracked with tab completion indicators
 * - Best for: Dedicated bundle pages with full horizontal space
 *
 * ============================================================================
 * SHARED CODE IMPORTS
 * ============================================================================
 * All business logic is imported from bundle-widget-components.js:
 * - Currency formatting
 * - Price calculations
 * - Discount logic
 * - Product card rendering
 * - Toast notifications
 *
 * This file ONLY contains:
 * - Full page specific UI rendering
 * - Horizontal tabs layout management
 * - Modal-based product selection
 * - Event handlers for full page flow
 *
 * ============================================================================
 * UNIFIED DESIGN WITH PRODUCT PAGE WIDGET
 * ============================================================================
 * Both widgets:
 * - Use the same CSS variables (from unified design settings API)
 * - Import the same utilities (from bundle-widget-components.js)
 * - Implement the same business logic (pricing, discounts, cart)
 * - Differ ONLY in UI layout and interaction patterns
 *
 * Result: Merchants configure design ONCE, applies to BOTH bundle types
 *
 * @version 1.0.0
 * @author Wolfpack Team
 */

class BundleWidgetFullPage {

  constructor(containerElement) {
    this.container = containerElement;
    this.selectedBundle = null;
    this.selectedProducts = [];
    this.stepProductData = [];
    this.stepCollectionProductIds = {};
    this.currentStepIndex = 0;
    this.isInitialized = false;
    this.config = {};
    this.elements = {};

    this.searchQuery = '';
    this.searchDebounceTimer = null;

    this.tierConfig = [];
    this.activeTierIndex = 0;

    this.productModal = null;
    if (window.BundleProductModal) {
      this.productModal = new window.BundleProductModal(this);
    } else {
    }

    this.init().catch(error => {
      this.showError(error.message);
    });
  }

  async init() {
    try {

      if (this.container.dataset.initialized === 'true') {
        return;
      }

      this.hidePageLoadingContent();

      this.parseConfiguration();

      const bundleType = this.container.dataset.bundleType;
      if (bundleType === 'full_page') {
        this.hidePageTitle();
      }

      this.showLoadingOverlay(null);

      this.loadDesignSettingsCSS();

      this._scheduleCartTransformSelfHeal();

      await this.loadBundleData();

      this.selectBundle();

      if (!this.selectedBundle) {
        this.hideLoadingOverlay();
        this.showFallbackUI();
        return;
      }

      this._mergeBundleSettings(this.bundleSettings);

      this.tierConfig = this.resolveTierConfig(
        this.selectedBundle.tierConfig ?? null,
        this.tierConfig
      );
      this.initTierPills(this.tierConfig);

      this.config.showStepTimeline = this.resolveShowStepTimeline(
        this.selectedBundle.showStepTimeline ?? null,
        this.config.showStepTimeline
      );

      this.initializeDataStructures();

      this.setupDOMElements();

      await this.renderUI();

      this.hideLoadingOverlay();

      if (!window.Shopify?.designMode) {
        this._scheduleLayoutRefresh().catch(() => {});
      }

      this.attachEventListeners();

      this._initFloatingBadge();

      this.container.dataset.initialized = 'true';
      this.isInitialized = true;

    } catch (error) {
      this.hideLoadingOverlay();

      console.error('[BundleWidget] Initialization failed:', error);

      this._reportError(error);
      this.showErrorUI(error);
    }
  }

  /**
   * Hide the page body loading content
   * This hides the "Loading bundle builder..." text that was added to the Shopify page body
   */
  hidePageLoadingContent() {
    try {

      const pageContent = this.container.parentElement;

      if (pageContent) {

        const siblings = Array.from(pageContent.children);
        siblings.forEach(sibling => {

          if (sibling !== this.container &&
              (sibling.textContent.includes('Loading bundle builder') ||
               sibling.textContent.includes('Loading...'))) {
            sibling.style.display = 'none';
          }
        });
      }

    } catch (error) {

    }
  }

  /**
   * Load Design Control Panel CSS settings
   * Injects custom CSS from Design Control Panel into the page
   */
  loadDesignSettingsCSS() {
    try {

      const existingLink = document.querySelector('link[href*="design-settings"]');
      if (!existingLink) return;

      const appUrl = window.__BUNDLE_APP_URL__;
      if (!appUrl) return;

      const shop = window.Shopify?.shop || this.container.dataset.shop;
      if (!shop) return;

      existingLink.addEventListener('error', () => {
        const directUrl = `${appUrl}/api/design-settings/${encodeURIComponent(shop)}?bundleType=full_page`;
        const fallback = document.createElement('link');
        fallback.rel = 'stylesheet';
        fallback.type = 'text/css';
        fallback.href = directUrl;
        document.head.appendChild(fallback);
        existingLink.remove();
      }, { once: true });

    } catch (_e) {

    }
  }

  _scheduleCartTransformSelfHeal() {
    try {
      if (window.Shopify?.designMode) return;

      const shop = window.Shopify?.shop || this.container.dataset.shop || window.location.hostname;
      if (!shop) return;

      const storageKey = `wolfpack:cart-transform-heal:${shop}`;
      const lastCheckedAt = Number(window.localStorage?.getItem(storageKey) || 0);
      const now = Date.now();
      const cooldownMs = 24 * 60 * 60 * 1000;

      if (lastCheckedAt && now - lastCheckedAt < cooldownMs) return;

      window.setTimeout(() => {
        fetch('/apps/product-bundles/api/cart-transform-heal', {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
        })
          .then(response => {
            if (response.ok) {
              window.localStorage?.setItem(storageKey, String(now));
            }
          })
          .catch(() => {});
      }, 1500);
    } catch (_error) {

    }
  }

  parseConfiguration() {
    const dataset = this.container.dataset;

    this.config = {
      bundleId: dataset.bundleId || null,
      isContainerProduct: dataset.isContainerProduct === 'true',
      containerBundleId: dataset.containerBundleId || null,
      hideDefaultButtons: dataset.hideDefaultButtons === 'true',
      showTitle: dataset.showTitle === 'true',
      showDescription: dataset.showDescription !== 'false',
      showStepNumbers: dataset.showStepNumbers !== 'false',
      showFooterMessaging: dataset.showFooterMessaging !== 'false',
      showStepTimeline: dataset.showStepTimeline !== 'false',
      showCategoryTabs: dataset.showCategoryTabs !== 'false',

      customTitle: dataset.customTitle || null,
      customDescription: dataset.customDescription || null,

      productCardSpacing: parseInt(dataset.productCardSpacing) || 20,
      productCardsPerRow: parseInt(dataset.productCardsPerRow) || 4,

      showQuantitySelectorOnCard: dataset.showQuantitySelectorOnCard !== 'false',
      showQuantitySelectorInModal: dataset.showQuantitySelectorInModal !== 'false',

      showPromoBanner: dataset.showPromoBanner !== 'false',
      promoBannerSubtitle: dataset.promoBannerSubtitle || 'Mix & Match',
      promoBannerTagline: dataset.promoBannerTagline || 'Create Your Perfect Bundle',
      promoBannerNote: dataset.promoBannerNote || 'Mix & Match Your Favorites',

      discountTextTemplate: 'Add {conditionText} to get {discountText}',
      successMessageTemplate: 'Congratulations! You got {discountText}!',
      currentProductId: window.currentProductId,
      currentProductHandle: window.currentProductHandle,
      currentProductCollections: window.currentProductCollections,
      tierConfig: this.parseTierConfig(dataset.tierConfig || '[]'),
    };

    this.tierConfig = this.config.tierConfig;

    try {
      this.bundleSettings = JSON.parse(dataset.bundleSettings || 'null') || {};
    } catch {
      this.bundleSettings = {};
    }

    this.applyCardLayoutSettings();
  }

  /**
   * Apply card layout settings from Theme Editor as CSS variables
   */
  applyCardLayoutSettings() {
    document.documentElement.style.setProperty(
      '--bundle-product-card-spacing',
      `${this.config.productCardSpacing}px`
    );
    document.documentElement.style.setProperty(
      '--bundle-product-cards-per-row',
      this.config.productCardsPerRow
    );
  }

  async loadBundleData() {
    let bundleData = null;

    const bundleType = this.container.dataset.bundleType;
    const bundleId = this.container.dataset.bundleId;

    if (bundleType === 'full_page' && bundleId) {

      const cachedConfig = this.container.dataset.bundleConfig;
      if (cachedConfig && cachedConfig.trim() !== '' && cachedConfig !== 'null' && cachedConfig !== 'undefined') {
        try {
          const parsed = JSON.parse(cachedConfig);
          if (parsed && typeof parsed === 'object' && parsed.id) {
            bundleData = { [parsed.id]: parsed };
          }
        } catch (_e) {

        }
      }

      if (!bundleData) {

        const RETRY_DELAY_MS = 3000;
        const RETRYABLE_STATUSES = new Set([503, 504]);

        const fetchBundleData = async () => {

          const apiUrl = `/apps/product-bundles/api/bundle/${encodeURIComponent(bundleId)}.json`;

          const response = await fetch(apiUrl);

          if (!response.ok) {

            let errorDetails = `${response.status} ${response.statusText}`;
            try {
              const errorData = await response.json();
              errorDetails = JSON.stringify(errorData);
            } catch (e) {
            }
            const err = new Error(`API request failed: ${errorDetails}`);
            err.status = response.status;
            throw err;
          }

          const data = await response.json();

          if (data.success && data.bundle) {
            return { [data.bundle.id]: data.bundle };
          } else {
            throw new Error('Invalid API response structure');
          }
        };

        try {
          try {
            bundleData = await fetchBundleData();
          } catch (firstErr) {

            if (RETRYABLE_STATUSES.has(firstErr.status)) {
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
              bundleData = await fetchBundleData();
            } else {
              throw firstErr;
            }
          }
        } catch (error) {
          throw error;
        }
      }
    } else {

      const configValue = this.container.dataset.bundleConfig;
      if (configValue && configValue.trim() !== '' && configValue !== 'null' && configValue !== 'undefined') {
        try {
          const singleBundle = JSON.parse(configValue);

          if (singleBundle && typeof singleBundle === 'object' && singleBundle.id) {
            bundleData = { [singleBundle.id]: singleBundle };
          } else {
          }
        } catch (error) {
        }
      } else {
      }

      if (!bundleData || (typeof bundleData === 'object' && Object.keys(bundleData).length === 0)) {

        const isThemeEditor = window.Shopify?.designMode ||
                             window.isThemeEditorContext ||
                             window.location.pathname.includes('/editor') ||
                             window.location.search.includes('preview_theme_id');

        const bundleIdFromDataset = this.container.dataset.bundleId;

        if (isThemeEditor && bundleIdFromDataset) {
          this.showThemeEditorPreview(bundleIdFromDataset);
          return;
        }

        const errorMsg = 'This widget can only be used on bundle container products. Please ensure:\n1. This product is a bundle container product\n2. Bundle has been saved and published\n3. Product has bundleConfig metafield set';
        throw new Error(errorMsg);
      }
    }

    this.bundleData = bundleData;
  }

  selectBundle() {
    this.selectedBundle = BundleDataManager.selectBundle(this.bundleData, this.config);

    this.updateMessagesFromBundle();
  }

  updateMessagesFromBundle() {

    const messaging = this.selectedBundle?.messaging;
    const pricingMessages = this.selectedBundle?.pricing?.messages;

    if (messaging) {
      if (messaging.progressTemplate) {
        this.config.discountTextTemplate = messaging.progressTemplate;
      }
      if (messaging.successTemplate) {
        this.config.successMessageTemplate = messaging.successTemplate;
      }

      this.config.showDiscountMessaging = messaging.showDiscountMessaging !== false;

    } else if (pricingMessages) {

      const ruleMessages = pricingMessages.ruleMessages;
      const firstRuleMsg = ruleMessages && Object.values(ruleMessages)[0];
      if (firstRuleMsg?.discountText) {
        this.config.discountTextTemplate = firstRuleMsg.discountText;
      }
      if (firstRuleMsg?.successMessage) {
        this.config.successMessageTemplate = firstRuleMsg.successMessage;
      }

      this.config.showDiscountMessaging = pricingMessages.showDiscountMessaging || this.selectedBundle?.pricing?.enabled || false;

    } else {
      this.config.showDiscountMessaging = this.selectedBundle?.pricing?.enabled || false;
    }
  }

  initializeDataStructures() {
    const stepsCount = this.selectedBundle.steps.length;

    this.selectedProducts = Array(stepsCount).fill(null).map(() => ({}));

    this._initDefaultProducts();

    this.stepProductData = Array(stepsCount).fill(null).map(() => ([]));
  }

  /**
   * Show a helpful preview in theme editor when testing on non-bundle products
   */
  showThemeEditorPreview(bundleId) {

    this.container.innerHTML = `
      <div style="
        padding: 32px 24px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: 2px dashed #667eea;
        border-radius: 12px;
        text-align: center;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      ">
        <div style="font-size: 48px; margin-bottom: 16px;">📦</div>
        <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600;">Bundle Widget Preview</h3>
        <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">
          Bundle ID: <code style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px; font-family: monospace;">${bundleId}</code>
        </p>
        <div style="
          margin: 20px auto 0;
          padding: 16px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          max-width: 400px;
          text-align: left;
          font-size: 13px;
          line-height: 1.6;
        ">
          <div style="font-weight: 600; margin-bottom: 8px;">✅ Widget Configured Successfully</div>
          <div style="opacity: 0.9;">
            This widget will automatically display on <strong>bundle container products</strong>.
            <br><br>
            <strong>To see it in action:</strong>
            <ol style="margin: 8px 0; padding-left: 20px;">
              <li>Save your theme</li>
              <li>Navigate to a bundle product page</li>
              <li>The widget will appear with product selection steps</li>
            </ol>
          </div>
        </div>
        <div style="
          margin-top: 20px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          font-size: 12px;
          opacity: 0.8;
        ">
          💡 <strong>Tip:</strong> You're currently previewing on a regular product. The widget only activates on products configured as bundle containers.
        </div>
      </div>
    `;
  }

  setupDOMElements() {

    this.elements = {
      header: this.container.querySelector('.bundle-header') || this.createHeader(),
      stepsContainer: this.container.querySelector('.bundle-steps') || this.createStepsContainer(),
      footer: this.container.querySelector('.bundle-footer-messaging') || this.createFooter(),
      modal: this.ensureModal()
    };

    if (!this.container.querySelector('.bundle-header')) {
      this.container.appendChild(this.elements.header);
    }
    if (!this.container.querySelector('.bundle-steps')) {
      this.container.appendChild(this.elements.stepsContainer);
    }
    if (!this.container.querySelector('.bundle-footer-messaging')) {
      this.container.appendChild(this.elements.footer);
    }
  }

  createHeader() {
    const header = document.createElement('div');
    header.className = 'bundle-header';

    const title = this.config.customTitle || this.selectedBundle.name;

    const description = this.config.customDescription || this.selectedBundle.description;

    const titleHTML = `<h2 class="bundle-title">${ComponentGenerator.escapeHtml(title)}</h2>`;
    const descriptionHTML = (description && this.config.showDescription)
      ? `<p class="bundle-description">${ComponentGenerator.escapeHtml(description)}</p>`
      : '';

    header.innerHTML = `
      ${titleHTML}
      ${descriptionHTML}
    `;
    return header;
  }

  createStepsContainer() {
    const container = document.createElement('div');
    container.className = 'bundle-steps';
    return container;
  }

  createFooter() {
    const footer = document.createElement('div');
    footer.className = 'bundle-footer-messaging';
    footer.style.display = 'none';
    footer.innerHTML = `
      <div class="footer-discount-text"></div>
    `;
    return footer;
  }

  ensureModal() {
    let modal = document.getElementById('bundle-builder-modal');

    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'bundle-builder-modal';
      modal.className = 'bundle-builder-modal';
      modal.style.display = 'none';
      modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-step-title"></div>
            <div class="modal-tabs-wrapper">
              <button class="tab-arrow tab-arrow-left" aria-label="Scroll tabs left">&lsaquo;</button>
              <div class="modal-tabs"></div>
              <button class="tab-arrow tab-arrow-right" aria-label="Scroll tabs right">&rsaquo;</button>
            </div>
            <span class="close-button">&times;</span>
          </div>
          <div class="modal-body">
            <div class="product-grid"></div>
          </div>
          <div class="modal-footer">
            <!-- Centered Grouped Content Container -->
            <div class="modal-footer-grouped-content">
              <!-- Total Pill - Sits Above Buttons -->
              <div class="modal-footer-total-pill">
                <span class="total-price-strike"></span>
                <span class="total-price-final"></span>
                <span class="price-cart-separator">|</span>
                <span class="cart-badge-wrapper">
                  <span class="cart-badge-count">0</span>
                  <svg class="cart-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="9" cy="21" r="1" fill="currentColor" stroke="none"/>
                    <circle cx="20" cy="21" r="1" fill="currentColor" stroke="none"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                </span>
              </div>

              <!-- Buttons Row - Below Pill -->
              <div class="modal-footer-buttons-row">
                <button class="modal-nav-button prev-button">BACK</button>
                <button class="modal-nav-button next-button">NEXT</button>
              </div>

              <!-- Discount Messaging Section -->
              <div class="modal-footer-discount-messaging">
                <div class="footer-discount-text"></div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      this.setupTabScrollArrows(modal);
    }

    return modal;
  }

  setupTabScrollArrows(modal) {
    const tabsContainer = modal.querySelector('.modal-tabs');
    const leftArrow = modal.querySelector('.tab-arrow-left');
    const rightArrow = modal.querySelector('.tab-arrow-right');

    if (!tabsContainer || !leftArrow || !rightArrow) return;

    const scrollAmount = 200;

    leftArrow.addEventListener('click', () => {
      tabsContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    rightArrow.addEventListener('click', () => {
      tabsContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    const updateArrowVisibility = () => {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainer;

      leftArrow.style.display = scrollLeft > 0 ? 'flex' : 'none';
      rightArrow.style.display = scrollLeft + clientWidth < scrollWidth - 1 ? 'flex' : 'none';
    };

    tabsContainer.addEventListener('scroll', updateArrowVisibility);

    setTimeout(updateArrowVisibility, 100);

    this.updateTabArrows = updateArrowVisibility;
  }

  async renderUI() {
    this.renderHeader();
    await this.renderSteps();
    this.renderFooter();
  }

  renderHeader() {

    const bundleType = this.selectedBundle?.bundleType || BUNDLE_WIDGET.BUNDLE_TYPES.PRODUCT_PAGE;
    if (bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE) {
      this.elements.header.style.display = 'none';
      return;
    }

    if (!this.config.showTitle) {
      this.elements.header.style.display = 'none';
      return;
    }

    this.elements.header.style.display = 'block';
  }

  async renderSteps() {

    this.elements.stepsContainer.innerHTML = '';

    if (!this.selectedBundle || !this.selectedBundle.steps) {
      return;
    }

    const bundleType = this.selectedBundle.bundleType || BUNDLE_WIDGET.BUNDLE_TYPES.PRODUCT_PAGE;

    if (bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE) {

      const layout = this.selectedBundle.fullPageLayout || 'footer_bottom';
      if (layout === 'footer_side') {
        await this.renderFullPageLayoutWithSidebar();
      } else {
        await this.renderFullPageLayout();
      }
    } else {

      this.renderProductPageLayout();
    }
  }

  renderProductPageLayout() {
    this.selectedBundle.steps.forEach((step, index) => {
      const stepElement = this.createStepElement(step, index);
      this.elements.stepsContainer.appendChild(stepElement);
    });
  }

  async renderFullPageLayout() {

    this.hidePageTitle();

    this.elements.stepsContainer.innerHTML = '';
    this.elements.stepsContainer.classList.add('full-page-layout');

    const contentSection = document.createElement('div');
    contentSection.className = 'full-page-content-section';

    const promoBanner = this.createPromoBanner();
    if (promoBanner) {
      contentSection.appendChild(promoBanner);
    }

    if (this.config.showStepTimeline) {
      const stepTimeline = this.createStepTimeline();
      contentSection.appendChild(stepTimeline);
    }

    const stepBanner = this.createStepBannerImage(this.currentStepIndex);
    if (stepBanner) contentSection.appendChild(stepBanner);

    const searchInput = this.createSearchInput();
    contentSection.appendChild(searchInput);

    if (this.config.showCategoryTabs) {
      const categoryTabs = this.createCategoryTabs(this.currentStepIndex);
      if (categoryTabs) {
        contentSection.appendChild(categoryTabs);
      }
    }

    const productGridContainer = document.createElement('div');
    productGridContainer.className = 'full-page-product-grid-container';
    productGridContainer.innerHTML = this.createProductGridLoadingState();
    contentSection.appendChild(productGridContainer);

    this.elements.stepsContainer.appendChild(contentSection);

    this.renderFullPageFooter();

    if (this.selectedBundle?.loadingGif) {
      this.showLoadingOverlay(this.selectedBundle.loadingGif);
    }
    try {
      await this.loadStepProducts(this.currentStepIndex);

      const productGrid = this.createFullPageProductGrid(this.currentStepIndex);
      productGridContainer.innerHTML = '';
      productGridContainer.appendChild(productGrid);

      this.renderFullPageFooter();

      this.hideLoadingOverlay();

      this.preloadNextStep();
    } catch (error) {
      this.hideLoadingOverlay();
      productGridContainer.innerHTML = '<p class="error-message">Failed to load products. Please try again.</p>';
    }
  }

  async renderFullPageLayoutWithSidebar() {
    this.hidePageTitle();

    this.elements.stepsContainer.innerHTML = '';
    this.elements.stepsContainer.classList.add('full-page-layout', 'layout-sidebar');

    if (this.elements.footer) {
      this.elements.footer.style.display = 'none';
    }

    if (this.config.showStepTimeline) {
      this.elements.stepsContainer.appendChild(this.createStepTimeline());
    }

    const twoColWrapper = document.createElement('div');
    twoColWrapper.className = 'sidebar-layout-wrapper';

    const contentSection = document.createElement('div');
    contentSection.className = 'full-page-content-section sidebar-content';

    const promoBanner = this.createPromoBanner();
    if (promoBanner) contentSection.appendChild(promoBanner);

    const stepBanner = this.createStepBannerImage(this.currentStepIndex);
    if (stepBanner) contentSection.appendChild(stepBanner);

    contentSection.appendChild(this.createSearchInput());

    if (this.config.showCategoryTabs) {
      const categoryTabs = this.createCategoryTabs(this.currentStepIndex);
      if (categoryTabs) contentSection.appendChild(categoryTabs);
    }

    const currentStep = (this.selectedBundle?.steps || [])[this.currentStepIndex];
    if (currentStep?.isFreeGift) {
      const freeHeading = document.createElement('div');
      freeHeading.className = 'fpb-step-free-heading';
      freeHeading.textContent = `Complete the look and get a ${currentStep.freeGiftName || 'gift'} free!`;
      contentSection.appendChild(freeHeading);
    }

    const productGridContainer = document.createElement('div');
    productGridContainer.className = 'full-page-product-grid-container';
    productGridContainer.innerHTML = this.createProductGridLoadingState();
    contentSection.appendChild(productGridContainer);

    twoColWrapper.appendChild(contentSection);

    const sidePanel = document.createElement('div');
    sidePanel.className = 'full-page-side-panel';
    this.renderSidePanel(sidePanel);
    twoColWrapper.appendChild(sidePanel);

    this.elements.stepsContainer.appendChild(twoColWrapper);

    if (this.selectedBundle?.loadingGif) {
      this.showLoadingOverlay(this.selectedBundle.loadingGif);
    }
    try {
      await this.loadStepProducts(this.currentStepIndex);
      const productGrid = this.createFullPageProductGrid(this.currentStepIndex);
      productGridContainer.innerHTML = '';
      productGridContainer.appendChild(productGrid);
      this.renderSidePanel(sidePanel);
      this.hideLoadingOverlay();
      this.preloadNextStep();
      this._renderMobileBottomBar();
    } catch (error) {
      this.hideLoadingOverlay();
      productGridContainer.innerHTML = '<p class="error-message">Failed to load products. Please try again.</p>';
      this._renderMobileBottomBar();
    }
  }

  _renderMobileBottomBar({ preserveOpen = false } = {}) {
    const previousSheet = document.querySelector('.fpb-mobile-bottom-sheet');
    const wasOpen = preserveOpen && previousSheet?.classList.contains('is-open');

    document.querySelector('.fpb-mobile-bottom-bar')?.remove();
    document.querySelector('.fpb-mobile-bottom-sheet')?.remove();
    document.querySelector('.fpb-mobile-backdrop')?.remove();

    const { totalPrice } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData,
      this.selectedBundle?.steps
    );
    const discountInfo = PricingCalculator.calculateDiscount(this.selectedBundle, totalPrice,
      Object.values(this.selectedProducts || {}).reduce((sum, s) =>
        sum + Object.values(s || {}).reduce((n, p) => n + (p.quantity || p || 1), 0), 0)
    );
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const finalPrice = discountInfo.hasDiscount ? discountInfo.finalPrice : totalPrice;
    const selectedCount = this.getAllSelectedProductsData().filter(p => !p.isDefault).length;
    const isLastStep = this.currentStepIndex === (this.selectedBundle?.steps?.length || 1) - 1;
    const isComplete = this.areBundleConditionsMet();

    const backdrop = document.createElement('div');
    backdrop.className = 'fpb-mobile-backdrop';

    const sheet = document.createElement('div');
    sheet.className = 'fpb-mobile-bottom-sheet';
    this._populateMobileSheet(sheet);

    const bar = document.createElement('div');
    bar.className = 'fpb-mobile-bottom-bar';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'fpb-mobile-toggle-btn';
    toggleBtn.setAttribute('aria-label', 'View bundle summary');
    toggleBtn.innerHTML = `<span class="fpb-caret">&#9650;</span><span class="fpb-mobile-toggle-count">${selectedCount}</span>`;
    toggleBtn.addEventListener('click', () => {
      const open = sheet.classList.toggle('is-open');
      backdrop.classList.toggle('is-open', open);
      toggleBtn.querySelector('.fpb-caret').innerHTML = open ? '&#9660;' : '&#9650;';
    });
    backdrop.addEventListener('click', () => {
      sheet.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      toggleBtn.querySelector('.fpb-caret').innerHTML = '&#9650;';
    });

    const totalEl = document.createElement('div');
    totalEl.className = 'fpb-mobile-total';
    totalEl.textContent = CurrencyManager.convertAndFormat(finalPrice, currencyInfo);

    const conditionlessMobile = this.bundleHasNoConditions();
    const hasSelectionMobile = conditionlessMobile && this.getAllSelectedProductsData().filter(p => !p.isDefault).length > 0;
    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'fpb-mobile-cta-btn';
    ctaBtn.textContent = (conditionlessMobile || (isLastStep && isComplete)) ? 'Add to Cart' : 'Next';
    if (conditionlessMobile ? !hasSelectionMobile : (isLastStep && !isComplete)) ctaBtn.disabled = true;
    ctaBtn.addEventListener('click', () => {
      if (conditionlessMobile || (isLastStep && isComplete)) {
        this.addBundleToCart();
      } else if (!isLastStep && this.canNavigateToStep(this.currentStepIndex + 1) && this.canProceedToNextStep()) {
        this.activeCollectionId = null;
        this.searchQuery = '';
        this.currentStepIndex++;
        this.renderFullPageLayoutWithSidebar();
      } else if (!isLastStep && !this.canNavigateToStep(this.currentStepIndex + 1)) {
        ToastManager.show(`Complete all steps to unlock the free ${this.freeGiftStep?.freeGiftName || 'gift'}!`);
      } else {
        ToastManager.show('Please meet the quantity conditions for the current step before proceeding.');
      }
    });

    bar.appendChild(toggleBtn);
    bar.appendChild(totalEl);
    bar.appendChild(ctaBtn);

    document.body.appendChild(backdrop);
    document.body.appendChild(sheet);
    document.body.appendChild(bar);

    if (wasOpen) {
      sheet.classList.add('is-open');
      backdrop.classList.add('is-open');
      toggleBtn.querySelector('.fpb-caret').innerHTML = '&#9660;';
    }
  }

  _populateMobileSheet(sheet) {
    sheet.innerHTML = '';
    this.renderSidePanel(sheet);
  }

  renderSidePanel(panel) {
    if (!panel) return;
    panel.innerHTML = '';

    const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData,
      this.selectedBundle?.steps
    );
    const discountInfo = PricingCalculator.calculateDiscount(
      this.selectedBundle,
      totalPrice,
      totalQuantity
    );
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const finalPrice = discountInfo.hasDiscount ? discountInfo.finalPrice : totalPrice;
    const allSelectedProducts = this.getAllSelectedProductsData();
    const nextRule = PricingCalculator.getNextDiscountRule?.(this.selectedBundle, totalQuantity) || null;
    const isMobileSheet = panel.classList?.contains('fpb-mobile-bottom-sheet');

    const header = document.createElement('div');
    header.className = 'side-panel-header';
    const headerTitle = document.createElement('span');
    headerTitle.className = 'side-panel-title';
    headerTitle.textContent = 'Your Bundle';
    header.appendChild(headerTitle);

    if (allSelectedProducts.length > 0) {
      const clearBtn = document.createElement('button');
      clearBtn.className = 'side-panel-clear-btn';
      clearBtn.innerHTML = `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor"><path d="M6 2h8a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1Zm-2 3h12l-1 13H5L4 5Zm4 2v9m4-9v9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg> Clear`;
      clearBtn.addEventListener('click', () => {
        this.selectedProducts = this.selectedBundle.steps.map(() => ({}));
        this.reRenderFullPage();
      });
      header.appendChild(clearBtn);
    }
    panel.appendChild(header);

    const subtitle = document.createElement('p');
    subtitle.className = 'side-panel-subtitle';
    subtitle.textContent = 'Review your bundle';
    panel.appendChild(subtitle);

    if (this.selectedBundle?.pricing?.enabled) {
      const variables = TemplateManager.createDiscountVariables(
        this.selectedBundle, totalPrice, totalQuantity, discountInfo, currencyInfo
      );
      let discountMessage = '';
      if (discountInfo.hasDiscount) {
        discountMessage = TemplateManager.replaceVariables(
          this.config.successMessageTemplate || '🎉 You unlocked {{discountText}}!',
          variables
        );
      } else if (nextRule) {
        discountMessage = TemplateManager.replaceVariables(
          this.config.discountTextTemplate || 'Add {conditionText} to get {discountText}',
          variables
        );
      }
      if (discountMessage) {
        const msgEl = document.createElement('div');
        msgEl.className = 'side-panel-discount-message';
        msgEl.innerHTML = discountMessage;
        panel.appendChild(msgEl);
      }
    }

    const countLabel = document.createElement('div');
    countLabel.className = 'side-panel-item-count';
    countLabel.textContent = `${allSelectedProducts.length} item${allSelectedProducts.length !== 1 ? 's' : ''}`;
    panel.appendChild(countLabel);

    const productsContainer = document.createElement('div');
    productsContainer.className = 'side-panel-products';

    if (allSelectedProducts.length > 0) {
      allSelectedProducts.forEach(item => {
        const row = document.createElement('div');
        row.className = 'side-panel-product-row';

        const imgSrc = item.image || item.imageUrl || '';
        const variantInfo = item.variantTitle && item.variantTitle !== 'Default Title' ? item.variantTitle : '';

        const isFreeGiftItem = item.isFreeGift === true;
        const qtySpan = `<span class="side-panel-product-qty">×${item.quantity}</span>`;
        const priceHtml = isFreeGiftItem
          ? `<span class="side-panel-product-price free-gift-price">${CurrencyManager.convertAndFormat(0, currencyInfo)}</span><span class="side-panel-product-original-price">${CurrencyManager.convertAndFormat(item.price * item.quantity, currencyInfo)} ${qtySpan}</span>`
          : `<span class="side-panel-product-price">${CurrencyManager.convertAndFormat(item.price * item.quantity, currencyInfo)} ${qtySpan}</span>`;

        row.innerHTML = `
          <div class="side-panel-product-img-wrap">
            ${imgSrc ? `<img src="${imgSrc}" alt="${this._escapeHTML(item.title)}" class="side-panel-product-img">` : '<div class="side-panel-product-img-placeholder"></div>'}
            ${item.quantity > 1 ? `<span class="side-panel-qty-badge">${item.quantity}</span>` : ''}
          </div>
          <div class="side-panel-product-info">
            <span class="side-panel-product-title">${this._escapeHTML(item.title)}</span>
            ${variantInfo ? `<span class="side-panel-product-variant">${this._escapeHTML(variantInfo)}</span>` : ''}
          </div>
          ${priceHtml}
        `;

        if (!item.isDefault) {
          const removeBtn = document.createElement('button');
          removeBtn.className = 'side-panel-product-remove';
          removeBtn.innerHTML = `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"><path d="M6 2h8a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1Zm-2 3h12l-1 13H5L4 5Zm4 2v9m4-9v9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>`;
          removeBtn.addEventListener('click', () => {
            const stepIndex = item.stepIndex;
            const productId = item.variantId || item.productId || item.id;
            const removedItem = { stepIndex, variantId: productId, quantity: item.quantity, title: item.title };
            this.updateProductSelection(stepIndex, productId, 0);
            const truncated = removedItem.title && removedItem.title.length > 25 ? removedItem.title.substring(0, 25) + '...' : (removedItem.title || 'Product');
            ToastManager.showWithUndo(
              `Removed "${truncated}"`,
              () => { this.updateProductSelection(removedItem.stepIndex, removedItem.variantId, removedItem.quantity); },
              5000
            );
          });
          row.appendChild(removeBtn);
        }

        productsContainer.appendChild(row);
      });
    }
    panel.appendChild(productsContainer);

    if (!isMobileSheet && allSelectedProducts.length === 0) {
      const skeletonContainer = document.createElement('div');
      skeletonContainer.className = 'side-panel-skeleton-slots';
      this._renderSidebarProductSkeletons(skeletonContainer);
      panel.appendChild(skeletonContainer);
    }

    this._renderFreeGiftSection(panel);

    const totalSection = document.createElement('div');
    totalSection.className = 'side-panel-total';
    totalSection.innerHTML = `
      <span class="side-panel-total-label">Total</span>
      <div class="side-panel-total-prices">
        ${discountInfo.hasDiscount ? `<span class="side-panel-total-original">${CurrencyManager.convertAndFormat(totalPrice, currencyInfo)}</span>` : ''}
        <span class="side-panel-total-final">${CurrencyManager.convertAndFormat(finalPrice, currencyInfo)}</span>
      </div>
    `;
    if (isMobileSheet) {
      panel.appendChild(totalSection);
      return;
    }

    const actionSection = document.createElement('div');
    actionSection.className = 'side-panel-action-container';
    actionSection.appendChild(totalSection);

    const navSection = document.createElement('div');
    navSection.className = 'side-panel-nav';

    const isLastStep = this.currentStepIndex === this.selectedBundle.steps.length - 1;
    const canProceed = this.canProceedToNextStep();
    const conditionless = this.bundleHasNoConditions();
    const hasSelection = conditionless && this.getAllSelectedProductsData().length > 0;

    const nextBtn = document.createElement('button');
    nextBtn.className = 'side-panel-btn side-panel-btn-next';
    nextBtn.textContent = (conditionless || isLastStep) ? 'Add to Cart' : 'Next Step';
    if (conditionless ? !hasSelection : (isLastStep ? !this.areBundleConditionsMet() : !canProceed)) {
      nextBtn.disabled = true;
    }
    nextBtn.addEventListener('click', () => {
      if (conditionless || isLastStep) {
        this.addBundleToCart();
      } else if (!this.canNavigateToStep(this.currentStepIndex + 1)) {
        const giftName = this.freeGiftStep?.freeGiftName || 'gift';
        ToastManager.show(`Complete all steps to unlock the free ${giftName}!`);
      } else if (this.canProceedToNextStep()) {
        this.activeCollectionId = null;
        this.searchQuery = '';
        this.currentStepIndex++;
        this.renderFullPageLayoutWithSidebar();
      } else {
        ToastManager.show('Please meet the quantity conditions for the current step before proceeding.');
      }
    });

    navSection.appendChild(nextBtn);
    actionSection.appendChild(navSection);
    panel.appendChild(actionSection);
  }

  _escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  _getDefaultTimelineIcon(step) {
    if (step.isDefault) {

      return `<svg class="timeline-step-icon--svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    }
    if (step.isFreeGift) {

      return `<svg class="timeline-step-icon--svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polyline points="20 12 20 22 4 22 4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="2" y="7" width="20" height="5" rx="1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="12" y1="22" x2="12" y2="7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    }

    return `<svg class="timeline-step-icon--svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  createStepTimeline() {
    const timeline = document.createElement('div');
    timeline.className = 'step-timeline';

    if (!this.selectedBundle || !this.selectedBundle.steps) {
      return timeline;
    }

    const steps = this.selectedBundle.steps;

    steps.forEach((step, index) => {
      const stepEl = document.createElement('div');
      stepEl.className = 'timeline-step';
      stepEl.dataset.stepIndex = index;

      const isDefaultStep = step.isDefault === true;
      const isCompleted = this.isStepCompleted(index);
      const isCurrent = index === this.currentStepIndex;
      const isAccessible = this.isStepAccessible(index);

      if (isDefaultStep) stepEl.classList.add('timeline-step--included');
      if (isCurrent) stepEl.classList.add('timeline-step--active');
      if (isCompleted) stepEl.classList.add('timeline-step--completed');
      if (!isCurrent && !isCompleted) stepEl.classList.add('timeline-step--inactive');
      if (!isAccessible) stepEl.classList.add('timeline-step--locked');

      const escapedName = this._escapeHTML(step.name) || `Step ${index + 1}`;

      const iconContent = step.timelineIconUrl
        ? `<img class="timeline-step-icon" src="${step.timelineIconUrl}" alt="${escapedName}">`
        : this._getDefaultTimelineIcon(step);

      const checkmarkSvg = `<svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 6L5 9L10 3" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;

      stepEl.innerHTML = `
        <div class="timeline-icon-wrapper">
          ${iconContent}
          <div class="timeline-checkmark">${checkmarkSvg}</div>
        </div>
        <span class="timeline-step-name">${escapedName}</span>
      `;

      if (isAccessible && !isDefaultStep) {
        stepEl.style.cursor = 'pointer';
        stepEl.addEventListener('click', () => {
          if (!this.isStepAccessible(index)) {
            ToastManager.show('Please complete the previous steps first.');
            return;
          }
          if (index > this.currentStepIndex && !this.canProceedToNextStep()) {
            ToastManager.show('Please meet the step conditions before proceeding.');
            return;
          }
          this.currentStepIndex = index;
          this.searchQuery = '';
          this.activeCollectionId = null;
          this.reRenderFullPage();
        });
      }

      timeline.appendChild(stepEl);

      if (index < steps.length - 1) {
        const connectorEl = document.createElement('div');
        connectorEl.className = 'timeline-connector';
        const isStepCompleted = this.isStepCompleted(index);
        const connectorFill = document.createElement('div');
        connectorFill.className = 'timeline-connector-fill';
        if (isStepCompleted) connectorFill.style.width = '100%';
        connectorEl.appendChild(connectorFill);
        timeline.appendChild(connectorEl);
      }
    });

    return timeline;
  }

  createStepBannerImage(stepIndex) {
    const step = (this.selectedBundle?.steps || [])[stepIndex];
    if (!step?.bannerImageUrl) return null;

    const wrapper = document.createElement('div');
    wrapper.className = 'step-banner-image';
    const img = document.createElement('img');
    img.src = step.bannerImageUrl;
    img.alt = this._escapeHTML(step.name || '');
    wrapper.appendChild(img);
    return wrapper;
  }

  getStepQuantityHint(step) {
    if (!step) return null;

    const { conditionOperator, conditionValue, conditionOperator2, conditionValue2, minQuantity, maxQuantity } = step;
    const OPERATORS = ConditionValidator.OPERATORS;

    if (conditionOperator && conditionValue != null) {
      const val = Number(conditionValue);

      if (conditionOperator2 && conditionValue2 != null) {
        const val2 = Number(conditionValue2);
        const min = Math.min(val, val2);
        const max = Math.max(val, val2);
        return `Pick ${min}–${max}`;
      }

      switch (conditionOperator) {
        case OPERATORS.EQUAL_TO:                  return `Pick ${val}`;
        case OPERATORS.GREATER_THAN:              return `Pick ${val + 1}+`;
        case OPERATORS.GREATER_THAN_OR_EQUAL_TO:  return `Pick ${val}+`;
        case OPERATORS.LESS_THAN:                 return `Up to ${val - 1}`;
        case OPERATORS.LESS_THAN_OR_EQUAL_TO:     return `Up to ${val}`;
        default:                                  return null;
      }
    }

    const min = minQuantity != null ? Number(minQuantity) : null;
    const max = maxQuantity != null ? Number(maxQuantity) : null;
    if (min && max && min !== max) return `Pick ${min}–${max}`;
    if (min && min > 1) return `Pick ${min}+`;
    if (max && max > 1) return `Up to ${max}`;
    return null;
  }

  getStepProductImages(stepIndex) {
    const selectedProducts = this.selectedProducts[stepIndex] || {};
    const productImages = [];

    Object.entries(selectedProducts).forEach(([variantId, quantity]) => {
      if (quantity > 0) {
        const product = this.stepProductData[stepIndex]?.find(p => (p.variantId || p.id) === variantId);
        if (product && product.imageUrl && !productImages.find(img => img.url === product.imageUrl)) {
          productImages.push({
            url: product.imageUrl,
            alt: product.title || 'Product'
          });
        }
      }
    });

    return productImages;
  }

  createSearchInput() {
    const searchContainer = document.createElement('div');
    searchContainer.className = 'step-search-container';

    searchContainer.innerHTML = `
      <div class="step-search-input-wrapper">
        <svg class="step-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          class="step-search-input"
          placeholder="Search products..."
          value="${this.searchQuery}"
          autocomplete="off"
        />
        <button class="step-search-clear" type="button" style="display: ${this.searchQuery ? 'flex' : 'none'}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `;

    const input = searchContainer.querySelector('.step-search-input');
    const clearBtn = searchContainer.querySelector('.step-search-clear');

    input.addEventListener('input', (e) => {
      const value = e.target.value;

      clearBtn.style.display = value ? 'flex' : 'none';

      if (this.searchDebounceTimer) {
        clearTimeout(this.searchDebounceTimer);
      }

      this.searchDebounceTimer = setTimeout(() => {
        this.searchQuery = value;
        this.updateProductGridWithSearch();
      }, 300);
    });

    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.style.display = 'none';
      this.searchQuery = '';
      this.updateProductGridWithSearch();
      input.focus();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        input.value = '';
        clearBtn.style.display = 'none';
        this.searchQuery = '';
        this.updateProductGridWithSearch();
      }
    });

    return searchContainer;
  }

  updateProductGridWithSearch() {
    const gridContainer = this.container.querySelector('.full-page-product-grid-container');
    if (!gridContainer) return;

    const productGrid = this.createFullPageProductGrid(this.currentStepIndex);
    gridContainer.innerHTML = '';
    gridContainer.appendChild(productGrid);
  }

  hidePageTitle() {

    const selectors = [
      '.main-page-title',
      '.page-title',
      'h1.page-title',
      '.page-width h1',
      '.section-template--*__main-padding h1',
      '[class*="main-padding"] h1.h0'
    ];

    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {

          if (el.closest('.promo-banner')) return;

          el.style.display = 'none';
        });
      } catch (e) {

      }
    }

    const pageTitleContainers = document.querySelectorAll('.page-width--narrow');
    pageTitleContainers.forEach(container => {

      const hasPageTitle = container.querySelector('.main-page-title, .page-title, h1.h0');
      const hasOtherContent = container.querySelector('.rte:not(:empty), .bundle-widget, #bundle-builder-app');

      if (hasPageTitle && !hasOtherContent) {
        container.style.display = 'none';
      }
    });
  }

  createPromoBanner() {

    if (this.config.showPromoBanner === false) {
      return null;
    }

    const promoBannerEnabled = getComputedStyle(document.documentElement)
      .getPropertyValue('--bundle-promo-banner-enabled')
      .trim();

    if (promoBannerEnabled === '0') {
      return null;
    }

    const bundleName = this.selectedBundle?.name || 'Build Your Bundle';
    const pricing = this.selectedBundle?.pricing;
    const rules = pricing?.rules || [];
    const currencyInfo = CurrencyManager.getCurrencyInfo();

    let promoTitle = bundleName;
    let promoSubtitle = '';
    let promoNote = '';
    let discountMessage = '';

    if (pricing?.enabled && rules.length > 0) {

      const bestRule = rules.reduce((best, rule) => {
        const discountValue = rule.discount?.method === BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF
          ? rule.discount?.value || 0
          : ((rule.discount?.value || 0) / 100);
        const bestValue = best.discount?.method === BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF
          ? best.discount?.value || 0
          : ((best.discount?.value || 0) / 100);
        return discountValue > bestValue ? rule : best;
      }, rules[0]);

      const targetQty = bestRule.condition?.value || 0;
      const conditionOperator = bestRule.condition?.operator;
      const discountMethod = bestRule.discount?.method;
      const discountValue = bestRule.discount?.value || 0;

      const qtyText = TemplateManager.formatOperatorText(conditionOperator, targetQty, 'item');

      if (discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF && discountValue > 0) {
        discountMessage = `Add ${qtyText} and get ${discountValue}% off!`;
      } else if (discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_AMOUNT_OFF && discountValue > 0) {
        const formattedAmount = CurrencyManager.convertAndFormat(discountValue, currencyInfo);
        discountMessage = `Add ${qtyText} and save ${formattedAmount}!`;
      } else if (discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_BUNDLE_PRICE && discountValue > 0) {
        const formattedPrice = CurrencyManager.convertAndFormat(discountValue, currencyInfo);
        discountMessage = `Add ${qtyText} for just ${formattedPrice}!`;
      }
    }

    if (pricing?.messages?.banner) {
      discountMessage = pricing.messages.banner;
    }

    if (discountMessage) {

      promoSubtitle = this.config.promoBannerSubtitle || 'Mix & Match';
      promoNote = discountMessage;
    } else {

      promoSubtitle = this.config.promoBannerTagline || 'Create Your Perfect Bundle';
      promoNote = this.config.promoBannerNote || 'Mix & Match Your Favorites';
    }

    const banner = document.createElement('div');
    banner.className = 'promo-banner';
    banner.classList.add(discountMessage ? 'has-discount' : 'no-discount');
    banner.innerHTML = `
      ${promoSubtitle ? `<div class="promo-banner-subtitle">${ComponentGenerator.escapeHtml(promoSubtitle)}</div>` : ''}
      <h2 class="promo-banner-title">${ComponentGenerator.escapeHtml(promoTitle)}</h2>
      ${promoNote ? `<div class="promo-banner-note">${ComponentGenerator.escapeHtml(promoNote)}</div>` : ''}
    `;

    const bgImageUrl = this.selectedBundle && this.selectedBundle.promoBannerBgImage;
    if (bgImageUrl) {
      banner.style.backgroundImage = `url('${bgImageUrl}')`;
      banner.style.backgroundSize = 'cover';
      banner.style.backgroundPosition = 'center';

      const cropRaw = this.selectedBundle && this.selectedBundle.promoBannerBgImageCrop;
      if (cropRaw) {
        try {
          const crop = JSON.parse(cropRaw);
          const cw = crop.width / 100;
          const ch = cw * (3 / 16);
          const cx = crop.x / 100;
          const cy = crop.y / 100;
          const bgSize = `${(1 / cw) * 100}%`;
          const posX = (1 - cw) === 0 ? 0 : Math.min(100, Math.max(0, (cx / (1 - cw)) * 100));
          const posY = (1 - ch) === 0 ? 0 : Math.min(100, Math.max(0, (cy / (1 - ch)) * 100));
          banner.style.backgroundSize = bgSize;
          banner.style.backgroundPosition = `${posX}% ${posY}%`;
        } catch (_e) {

        }
      }
    }

    return banner;
  }

  createCategoryTabs(stepIndex) {
    if (!this.selectedBundle || !this.selectedBundle.steps || !this.selectedBundle.steps[stepIndex]) {
      return null;
    }

    const step = this.selectedBundle.steps[stepIndex];

    if (!step.collections || step.collections.length === 0) {
      return null;
    }

    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'category-tabs';

    const allTab = document.createElement('button');
    allTab.className = 'category-tab';
    if (!this.activeCollectionId) {
      allTab.classList.add('active');
    }
    allTab.innerHTML = `<span class="tab-label">All</span>`;
    allTab.addEventListener('click', () => {
      this.activeCollectionId = null;
      this.reRenderFullPage();
    });
    tabsContainer.appendChild(allTab);

    step.collections.forEach(collection => {
      const tab = document.createElement('button');
      tab.className = 'category-tab';
      if (this.activeCollectionId === collection.id) {
        tab.classList.add('active');
      }
      tab.innerHTML = `<span class="tab-label">${ComponentGenerator.escapeHtml(collection.title)}</span>`;
      tab.addEventListener('click', () => {
        this.activeCollectionId = collection.id;
        this.reRenderFullPage();
      });
      tabsContainer.appendChild(tab);
    });

    return tabsContainer;
  }

  createFullPageProductGrid(stepIndex) {
    const grid = document.createElement('div');
    grid.className = 'full-page-product-grid';

    if (!this.selectedBundle || !this.selectedBundle.steps || !this.selectedBundle.steps[stepIndex]) {
      return grid;
    }

    const step = this.selectedBundle.steps[stepIndex];

    let products = this.stepProductData[stepIndex] || [];

    if (this.activeCollectionId && step.collections) {
      const activeCollection = step.collections.find(c => c.id === this.activeCollectionId);
      if (activeCollection && activeCollection.handle) {
        const membershipKey = `${stepIndex}:${activeCollection.handle}`;
        const collectionProductIds = this.stepCollectionProductIds[membershipKey];
        if (collectionProductIds && collectionProductIds.length > 0) {
          products = products.filter(p => {

            const numericPid = p.parentProductId || p.id || '';
            return collectionProductIds.some(cid => {
              const numericCid = this.extractId(cid) || cid;
              return numericPid === numericCid;
            });
          });
        }
      }
    }

    let expandedProducts = this.expandProductsByVariant(products);

    if (this.searchQuery && this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      expandedProducts = expandedProducts.filter(product => {
        const title = (product.title || '').toLowerCase();
        const variantTitle = (product.variantTitle || '').toLowerCase();
        const parentTitle = (product.parentTitle || '').toLowerCase();
        return title.includes(query) || variantTitle.includes(query) || parentTitle.includes(query);
      });
    }

    if (expandedProducts.length === 0) {

      const message = this.searchQuery
        ? `No products match "${ComponentGenerator.escapeHtml(this.searchQuery)}"`
        : 'No products available in this step.';
      grid.innerHTML = `<p class="no-products">${message}</p>`;
      return grid;
    }

    const stepSelections = this.selectedProducts[stepIndex] || {};
    const capacityCheck = ConditionValidator.canUpdateQuantity(step, stepSelections, '__new__', 1);
    const isStepAtCapacity = !capacityCheck.allowed;

    expandedProducts.forEach(product => {
      const productCard = this.createProductCard(product, stepIndex);
      const productId = product.variantId || product.id;
      const currentQty = stepSelections[productId] || 0;

      if (isStepAtCapacity && currentQty === 0) {
        productCard.classList.add('dimmed');
      }
      grid.appendChild(productCard);
    });

    return grid;
  }

  expandProductsByVariant(products) {
    return products.flatMap(product => {

      if (product.parentProductId && product.variantId) {
        return [product];
      }

      if (product.variants && product.variants.length > 1) {
        return product.variants
          .filter(variant => variant.available !== false)
          .map(variant => {

            const imageUrl = variant.image?.src || variant.image || product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;

            return {
              ...product,
              id: variant.id,
              title: variant.title === 'Default Title' ? product.title : `${product.title} - ${variant.title}`,
              variantTitle: variant.title === 'Default Title' ? '' : variant.title,
              imageUrl,
              price: typeof variant.price === 'number' ? variant.price : (parseFloat(variant.price || '0') * 100),
              compareAtPrice: variant.compareAtPrice ? (typeof variant.compareAtPrice === 'number' ? variant.compareAtPrice : parseFloat(variant.compareAtPrice) * 100) : null,
              variantId: variant.id,
              available: variant.available !== false,
              parentProductId: product.id,
              parentTitle: product.title,

              variants: null
            };
          });
      }

      return [product];
    });
  }

  createProductGridLoadingState() {
    return `
      <div class="full-page-product-grid">
        ${Array(6).fill(0).map(() => `
          <div class="product-card skeleton-loading">
            <div class="skeleton-card-content"></div>
          </div>
        `).join('')}
      </div>
      <style>
        /* Skeleton loading state - solid pulsating cards */
        .product-card.skeleton-loading {
          pointer-events: none;
          cursor: default;
          position: relative;
          overflow: hidden;
          min-height: 320px;
          background: var(--bundle-skeleton-base-bg, #f5f5f5);
          border-radius: 12px;
        }

        .product-card.skeleton-loading:hover {
          transform: none;
          box-shadow: none;
        }

        /* Full card pulsating effect */
        .skeleton-card-content {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            110deg,
            var(--bundle-skeleton-shimmer, #f0f0f0) 0%,
            var(--bundle-skeleton-shimmer, #f0f0f0) 40%,
            var(--bundle-skeleton-highlight, #e0e0e0) 50%,
            var(--bundle-skeleton-shimmer, #f0f0f0) 60%,
            var(--bundle-skeleton-shimmer, #f0f0f0) 100%
          );
          background-size: 200% 100%;
          animation: skeleton-pulse 1.5s ease-in-out infinite;
        }

        @keyframes skeleton-pulse {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      </style>
    `;
  }

  preloadAllSteps() {
    const steps = this.selectedBundle?.steps;
    if (!steps) return;

    steps.forEach((_, index) => {

      if (index === this.currentStepIndex) return;

      if (this.stepProductData[index]?.length > 0) return;

      this.loadStepProducts(index).catch(() => {

      });
    });
  }

  preloadNextStep() {
    this.preloadAllSteps();
  }

  createProductCard(product, stepIndex) {
    const productId = product.variantId || product.id;
    const currentQuantity = this.selectedProducts[stepIndex]?.[productId] || 0;

    if (!product.imageUrl || product.imageUrl === '') {
      product.imageUrl = product.image?.src ||
                        product.featuredImage?.url ||
                        product.images?.[0]?.url ||
                        BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
    }

    const currencyInfo = CurrencyManager.getCurrencyInfo();

    const step = (this.selectedBundle?.steps || [])[stepIndex];
    const primaryOptionName = step?.primaryVariantOption || null;
    const variantSelectorHtml = VariantSelectorComponent.renderHtml(product, primaryOptionName);

    const htmlString = ComponentGenerator.renderProductCard(
      product,
      currentQuantity,
      currencyInfo,
      { variantSelectorHtml }
    );

    const wrapper = document.createElement('div');
    wrapper.innerHTML = htmlString.trim();
    const cardElement = wrapper.firstChild;

    const currentStepData = (this.selectedBundle?.steps || [])[stepIndex];
    if (currentStepData?.isDefault) {
      cardElement.classList.add('fpb-card--default-included');
      const imgEl = cardElement.querySelector('.product-image, .product-img, img');
      if (imgEl && imgEl.parentElement) {
        imgEl.parentElement.classList.add('fpb-card-image-wrapper');
        const badge = document.createElement('span');
        badge.className = 'fpb-included-badge';
        const _includedBadgeUrl = (() => {
          const v = getComputedStyle(document.documentElement).getPropertyValue('--bundle-included-badge-url').trim();
          if (!v || v === 'none') return null;
          const m = v.match(/^url\(['"]?(.*?)['"]?\)$/);
          return m ? m[1] : null;
        })();
        if (_includedBadgeUrl) {
          const img = document.createElement('img');
          img.src = _includedBadgeUrl;
          img.alt = 'Included';
          img.className = 'fpb-included-badge-img';
          badge.appendChild(img);
        } else {
          badge.textContent = 'Included';
        }
        imgEl.parentElement.appendChild(badge);
      }
    }

    if (currentStepData?.isFreeGift) {
      const imgEl = cardElement.querySelector('.product-image, .product-img, img');
      if (imgEl && imgEl.parentElement) {
        imgEl.parentElement.classList.add('fpb-card-image-wrapper');
        const badge = document.createElement('span');
        badge.className = 'fpb-free-badge';
        const _badgeUrl = (() => {
          const v = getComputedStyle(document.documentElement).getPropertyValue('--bundle-free-gift-badge-url').trim();
          if (!v || v === 'none') return null;
          const m = v.match(/^url\(['"]?(.*?)['"]?\)$/);
          return m ? m[1] : null;
        })();
        if (_badgeUrl) {
          const img = document.createElement('img');
          img.src = _badgeUrl;
          img.alt = 'Free gift';
          img.className = 'fpb-free-badge-img';
          badge.appendChild(img);
        } else {
          badge.textContent = 'Free';
        }
        imgEl.parentElement.appendChild(badge);
      }
      const priceEl = cardElement.querySelector('.product-price, .price');
      if (priceEl) {
        const originalPriceText = priceEl.textContent;
        const _ci = CurrencyManager.getCurrencyInfo();
        priceEl.innerHTML = `${CurrencyManager.convertAndFormat(0, _ci)} <span class="side-panel-product-original-price">${originalPriceText}</span>`;
      }
    }

    this.attachProductCardListeners(cardElement, product, stepIndex);

    return cardElement;
  }

  attachProductCardListeners(cardElement, product, stepIndex) {

    if ((this.selectedBundle?.steps || [])[stepIndex]?.isDefault) return;

    const getProductId = () => product.variantId || product.id;

    cardElement.addEventListener('click', (e) => {
      const btn = e.target.closest('.inline-qty-btn');
      if (!btn) return;
      e.stopPropagation();
      const productId = getProductId();
      const currentQty = this.selectedProducts[stepIndex]?.[productId] || 0;
      if (btn.classList.contains('qty-increase')) {
        const { available } = this.getVariantAvailable(stepIndex, productId);
        if (available !== null && currentQty >= available) {
          ToastManager.show('Maximum stock reached for this variant.');
          return;
        }
        this.updateProductSelection(stepIndex, productId, currentQty + 1);
      } else if (btn.classList.contains('qty-decrease') && currentQty > 0) {
        this.updateProductSelection(stepIndex, productId, currentQty - 1);
      }
    });

    cardElement.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.product-add-btn');
      if (!addBtn) return;
      e.stopPropagation();
      const productId = getProductId();
      const currentQty = this.selectedProducts[stepIndex]?.[productId] || 0;
      if (currentQty === 0) {
        this.updateProductSelection(stepIndex, productId, 1);
      }
    });

    if (product.variants && product.variants.length > 1) {
      VariantSelectorComponent.attachListeners(cardElement, product, (newVariantId, oldVariantId) => {
        const oldQty = this.selectedProducts[stepIndex]?.[oldVariantId] || 0;

        if (oldQty > 0 && oldVariantId !== newVariantId) {

          if (this.selectedProducts[stepIndex]) {
            delete this.selectedProducts[stepIndex][oldVariantId];
          }

          const newQtyAvail = product.quantityAvailable;
          const newOOS = newQtyAvail === 0 && !product.currentlyNotInStock;
          let migratedQty = oldQty;
          if (newOOS) {
            ToastManager.show('Selected variant is out of stock — selection cleared.');
            migratedQty = 0;
          } else if (newQtyAvail !== null && oldQty > newQtyAvail) {
            migratedQty = newQtyAvail;
            ToastManager.show(`Only ${newQtyAvail} in stock — quantity adjusted.`);
          }
          if (migratedQty > 0) {
            this.selectedProducts[stepIndex][newVariantId] = migratedQty;
          }

          const qtyDisplay = cardElement.querySelector('.inline-qty-display');
          if (qtyDisplay) qtyDisplay.textContent = migratedQty;
        }

        cardElement.dataset.productId = newVariantId;
        cardElement.querySelectorAll('[data-product-id]').forEach(el => {
          if (el !== cardElement) el.dataset.productId = newVariantId;
        });

        this.updateFooterMessaging?.();
        this.updateStepTimeline?.();
        this._refreshSiblingDimState?.(stepIndex);
      });
    }
  }

  updateStepTimeline() {
    if (!this.config.showStepTimeline) return;
    const existing = this.elements.stepsContainer.querySelector('.step-timeline');
    if (!existing) return;
    const fresh = this.createStepTimeline();
    existing.parentNode.replaceChild(fresh, existing);
  }

  renderFullPageFooter() {
    if (!this.elements.footer) {
      return;
    }

    const layout = this.selectedBundle?.fullPageLayout || 'footer_bottom';
    if (layout === 'footer_side') {
      this.elements.footer.style.display = 'none';
      return;
    }

    const allSelectedProducts = this.getAllSelectedProductsData();

    const wasOpen = this.elements.footer.classList.contains('is-open');

    this.elements.footer.innerHTML = '';
    this.elements.footer.className = 'full-page-footer floating-card';
    if (wasOpen) this.elements.footer.classList.add('is-open');
    this.elements.footer.style.display = 'block';

    const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData,
      this.selectedBundle?.steps
    );
    const discountInfo = PricingCalculator.calculateDiscount(
      this.selectedBundle,
      totalPrice,
      totalQuantity
    );
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const finalPrice = discountInfo.hasDiscount ? discountInfo.finalPrice : totalPrice;

    const totalRequired = (this.selectedBundle.steps || []).reduce((sum, step) => {
      if (step.isFreeGift || step.isDefault) return sum;
      return sum + (Number(step.conditionValue) || Number(step.minQuantity) || 1);
    }, 0);

    const isLastStep = this.currentStepIndex === this.selectedBundle.steps.length - 1;

    const discountBanner = this._renderDiscountProgressBanner();
    if (discountBanner) this.elements.footer.appendChild(discountBanner);

    const inner = document.createElement('div');
    inner.className = 'footer-inner';

    const panel = this._createFooterPanel(allSelectedProducts, currencyInfo);
    const backdrop = document.createElement('button');
    backdrop.className = 'footer-backdrop';
    backdrop.setAttribute('type', 'button');
    backdrop.setAttribute('aria-label', 'Close product list');
    backdrop.addEventListener('click', () => {
      this.elements.footer.classList.remove('is-open');
    });
    const bar = this._createFooterBar(
      allSelectedProducts, totalQuantity, totalRequired,
      totalPrice, finalPrice, discountInfo, currencyInfo, isLastStep
    );

    inner.appendChild(panel);
    inner.appendChild(backdrop);
    inner.appendChild(bar);
    this.elements.footer.appendChild(inner);
  }

  _createFooterPanel(allSelectedProducts, currencyInfo) {
    const panel = document.createElement('div');
    panel.className = 'footer-panel';

    const list = document.createElement('ul');
    list.className = 'footer-panel-list';

    allSelectedProducts.forEach(item => {
      const li = document.createElement('li');
      li.className = 'footer-panel-item';

      const formattedPrice = CurrencyManager.convertAndFormat(item.price || 0, currencyInfo);
      const truncatedTitle = this.truncateTitle(item.parentTitle || item.title, 35);

      li.innerHTML = `
        <img src="${item.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE}"
             alt="${ComponentGenerator.escapeHtml(item.title)}"
             class="footer-panel-thumb">
        <div class="footer-panel-info">
          <p class="footer-panel-name">${ComponentGenerator.escapeHtml(truncatedTitle)}</p>
          <p class="footer-panel-price">${formattedPrice} <span class="footer-panel-qty">×${item.quantity}</span></p>
        </div>
        ${!item.isDefault ? `
        <button class="footer-panel-remove" type="button" aria-label="Remove ${ComponentGenerator.escapeHtml(item.title)}">
          <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor">
            <path d="M6 2h8a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1Zm-2 3h12l-1 13H5L4 5Zm4 2v9m4-9v9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          </svg>
        </button>` : ''}
      `;

      if (!item.isDefault) {
        const removeBtn = li.querySelector('.footer-panel-remove');
        if (!removeBtn) return;
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const removedItem = { stepIndex: item.stepIndex, variantId: item.variantId, quantity: item.quantity, title: item.title };
          this.updateProductSelection(item.stepIndex, item.variantId, 0);
          const truncated = removedItem.title.length > 25 ? removedItem.title.substring(0, 25) + '...' : removedItem.title;
          ToastManager.showWithUndo(
            `Removed "${truncated}"`,
            () => { this.updateProductSelection(removedItem.stepIndex, removedItem.variantId, removedItem.quantity); },
            5000
          );
        });
      }

      list.appendChild(li);
    });

    panel.appendChild(list);
    return panel;
  }

  _createFooterBar(allSelectedProducts, totalQuantity, totalRequired, totalPrice, finalPrice, discountInfo, currencyInfo, isLastStep) {
    const bar = document.createElement('div');
    bar.className = 'footer-bar';

    const thumbStrip = document.createElement('div');
    thumbStrip.className = 'footer-thumbstrip';
    const maxThumbs = 3;
    allSelectedProducts.slice(0, maxThumbs).forEach(item => {
      const img = document.createElement('img');
      img.src = item.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
      img.alt = item.title || '';
      img.className = 'footer-thumbstrip-img';
      thumbStrip.appendChild(img);
    });
    if (allSelectedProducts.length > maxThumbs) {
      const overflow = document.createElement('span');
      overflow.className = 'footer-thumbstrip-overflow';
      overflow.textContent = `+${allSelectedProducts.length - maxThumbs}`;
      thumbStrip.appendChild(overflow);
    }

    const centreCol = document.createElement('div');
    centreCol.className = 'footer-centre';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'footer-toggle';
    toggleBtn.setAttribute('type', 'button');
    const hasConditions = !this.bundleHasNoConditions();
    const totalSelected = allSelectedProducts.length;
    const toggleText = hasConditions
      ? `${totalQuantity}/${totalRequired} Steps`
      : `${totalSelected} Product${totalSelected !== 1 ? 's' : ''}`;
    toggleBtn.innerHTML = `
      <span class="footer-toggle-text">${toggleText}</span>
      <svg class="footer-chevron" viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M5 8l5 5 5-5"/>
      </svg>
    `;
    toggleBtn.addEventListener('click', () => {
      this.elements.footer.classList.toggle('is-open');
    });

    const totalArea = document.createElement('div');
    totalArea.className = 'footer-total-area';

    let discountBadgeHTML = '';
    if (discountInfo.hasDiscount && totalPrice > 0 && finalPrice < totalPrice) {
      const discountPct = Math.round((1 - finalPrice / totalPrice) * 100);
      if (discountPct > 0) {
        discountBadgeHTML = `<span class="footer-discount-badge">${discountPct}% OFF</span>`;
      }
    }
    totalArea.innerHTML = `
      <span class="footer-total-label">Total:</span>
      <div class="footer-total-prices">
        ${discountInfo.hasDiscount && finalPrice < totalPrice ? `<span class="footer-total-original">${CurrencyManager.convertAndFormat(totalPrice, currencyInfo)}</span>` : ''}
        <span class="footer-total-final">${CurrencyManager.convertAndFormat(finalPrice, currencyInfo)}</span>
        ${discountBadgeHTML}
      </div>
    `;

    centreCol.appendChild(toggleBtn);
    centreCol.appendChild(totalArea);

    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'footer-cta-btn';
    ctaBtn.setAttribute('type', 'button');
    const conditionless = this.bundleHasNoConditions();
    const hasSelection = conditionless && this.getAllSelectedProductsData().length > 0;
    ctaBtn.textContent = (conditionless || isLastStep) ? (this.config.addToCartText || 'Add to Cart') : 'Next';
    if (conditionless ? !hasSelection : (isLastStep ? !this.areBundleConditionsMet() : !this.canProceedToNextStep())) {
      ctaBtn.disabled = true;
    }
    ctaBtn.addEventListener('click', () => {
      if (conditionless || isLastStep) {
        this.addBundleToCart();
      } else if (this.canProceedToNextStep()) {
        this.activeCollectionId = null;
        this.searchQuery = '';
        this.currentStepIndex++;
        this.renderFullPageLayout();
      } else {
        ToastManager.show('Please meet the quantity conditions for the current step before proceeding.');
      }
    });

    bar.appendChild(thumbStrip);
    bar.appendChild(centreCol);
    bar.appendChild(ctaBtn);
    return bar;
  }

  truncateTitle(title, maxLength) {
    if (!title) return '';
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  }

  getAllSelectedProductsData() {
    const allProducts = [];

    this.selectedBundle.steps.forEach((step, stepIndex) => {
      const stepSelections = this.selectedProducts[stepIndex] || {};
      const productsInStep = this.stepProductData[stepIndex] || [];

      Object.entries(stepSelections).forEach(([variantId, quantity]) => {
        if (quantity > 0) {

          let product = productsInStep.find(p =>
            String(p.variantId) === String(variantId) || String(p.id) === String(variantId)
          );

          let matchedVariant = null;
          if (!product) {
            for (const p of productsInStep) {
              if (p.variants && Array.isArray(p.variants)) {
                const variant = p.variants.find(v => String(v.id) === String(variantId));
                if (variant) {
                  product = p;
                  matchedVariant = variant;
                  break;
                }
              }
            }
          }

          if (product) {

            const variantData = matchedVariant || product;
            const isVariantMatch = !!matchedVariant;

            let variantTitle = '';
            if (isVariantMatch && matchedVariant.title && matchedVariant.title !== 'Default Title') {
              variantTitle = matchedVariant.title;
            } else if (product.variantTitle && product.variantTitle !== 'Default Title') {
              variantTitle = product.variantTitle;
            }

            const imageUrl = isVariantMatch
              ? (matchedVariant.image?.src || matchedVariant.image || product.imageUrl || product.image?.src || '')
              : (product.imageUrl || product.image?.src || '');

            const price = isVariantMatch
              ? (typeof matchedVariant.price === 'number' ? matchedVariant.price : (parseFloat(matchedVariant.price || '0') * 100))
              : (product.price || 0);

            allProducts.push({
              stepIndex,
              variantId,
              quantity,
              title: isVariantMatch
                ? (variantTitle ? `${product.title} - ${variantTitle}` : product.title)
                : (product.title || 'Untitled Product'),
              parentTitle: product.parentTitle || product.title || 'Untitled Product',
              variantTitle: variantTitle,
              imageUrl: imageUrl,
              image: imageUrl,
              price: price,
              isDefault: step.isDefault ?? false,
              isFreeGift: step.isFreeGift ?? false,
            });
          } else {
          }
        }
      });
    });

    return allProducts;
  }

  groupVariantsByProduct(selectedProducts) {
    const productMap = new Map();

    selectedProducts.forEach(item => {

      const product = this.stepProductData[item.stepIndex]?.find(p => {

        return p.variants?.some(v => String(v.id) === String(item.variantId)) || String(p.id) === String(item.variantId);
      });

      if (!product) return;

      const productId = product.id || product.productId;
      const key = `${item.stepIndex}-${productId}`;

      if (!productMap.has(key)) {
        productMap.set(key, {
          productId,
          stepIndex: item.stepIndex,
          title: product.title || item.title,
          image: product.imageUrl || product.image?.src || item.image,
          variants: [],
          totalQuantity: 0,
          totalPrice: 0
        });
      }

      const group = productMap.get(key);
      group.variants.push(item);
      group.totalQuantity += item.quantity;
      group.totalPrice += (item.price * item.quantity);
    });

    return Array.from(productMap.values());
  }

  showVariantBreakdown(productGroup) {
    const overlay = document.createElement('div');
    overlay.className = 'variant-breakdown-overlay';

    const popup = document.createElement('div');
    popup.className = 'variant-breakdown-popup';

    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const variantsHtml = productGroup.variants.map(variant => {
      const product = this.stepProductData[variant.stepIndex]?.find(p =>
        p.variants?.some(v => String(v.id) === String(variant.variantId)) || String(p.id) === String(variant.variantId)
      );
      const variantObj = product?.variants?.find(v => String(v.id) === String(variant.variantId));
      const variantTitle = variantObj?.title || variant.title || 'Variant';

      return `
        <div class="variant-breakdown-item">
          <img src="${variant.image}" alt="${variantTitle}" />
          <div class="variant-info">
            <span class="variant-title">${variantTitle}</span>
            <span class="variant-quantity">Qty: ${variant.quantity} × ${CurrencyManager.convertAndFormat(variant.price, currencyInfo)}</span>
          </div>
          <button class="remove-variant-btn" data-step="${variant.stepIndex}" data-variant-id="${variant.variantId}">Remove</button>
        </div>
      `;
    }).join('');

    popup.innerHTML = `
      <div class="variant-breakdown-header">
        <h3>${productGroup.title}</h3>
        <button class="close-breakdown-btn">&times;</button>
      </div>
      <div class="variant-breakdown-list">
        ${variantsHtml}
      </div>
      <button class="add-another-variant-btn">+ Add Another Variant</button>
    `;

    popup.querySelector('.close-breakdown-btn').addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    popup.querySelectorAll('.remove-variant-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const stepIndex = parseInt(e.target.dataset.step);
        const variantId = e.target.dataset.variantId;
        this.updateProductSelection(stepIndex, variantId, 0);
        document.body.removeChild(overlay);
        this.reRenderFullPage();
      });
    });

    popup.querySelector('.add-another-variant-btn').addEventListener('click', () => {
      document.body.removeChild(overlay);

      const product = this.stepProductData[productGroup.stepIndex]?.find(p => String(p.id) === String(productGroup.productId));
      const step = this.selectedBundle.steps[productGroup.stepIndex];
      if (product && step && this.productModal) {
        this.productModal.open(product, step);
      }
    });

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) document.body.removeChild(overlay);
    });
  }

  findProductByVariantId(step, variantId) {
    return step.products?.find(p =>
      p.variants?.some(v => v.id === variantId) || p.id === variantId
    );
  }

  isStepCompleted(stepIndex) {
    const step = this.selectedBundle.steps[stepIndex];
    const stepSelections = this.selectedProducts[stepIndex] || {};
    return ConditionValidator.isStepConditionSatisfied(step, stepSelections);
  }

  reRenderFullPage() {
    const layout = this.selectedBundle?.fullPageLayout || 'footer_bottom';
    if (layout === 'footer_side') {
      this.renderFullPageLayoutWithSidebar();
    } else {
      this.renderFullPageLayout();
    }
  }

  async _sidebarAdvanceToNextStep() {
    const contentSection = this.elements.stepsContainer.querySelector('.sidebar-content');
    if (!contentSection) {

      this.renderFullPageLayoutWithSidebar();
      return;
    }

    this.updateStepTimeline();

    const existingSearch = contentSection.querySelector('.step-search-container');
    if (existingSearch) existingSearch.replaceWith(this.createSearchInput());

    const existingTabs = contentSection.querySelector('.category-tabs');
    if (this.config.showCategoryTabs) {
      const newTabs = this.createCategoryTabs(this.currentStepIndex);
      if (existingTabs && newTabs) {
        existingTabs.replaceWith(newTabs);
      } else if (existingTabs && !newTabs) {
        existingTabs.remove();
      } else if (!existingTabs && newTabs) {
        const gridContainer = contentSection.querySelector('.full-page-product-grid-container');
        if (gridContainer) contentSection.insertBefore(newTabs, gridContainer);
      }
    } else if (existingTabs) {
      existingTabs.remove();
    }

    const productGridContainer = contentSection.querySelector('.full-page-product-grid-container');
    if (!productGridContainer) {
      this.renderFullPageLayoutWithSidebar();
      return;
    }
    productGridContainer.innerHTML = this.createProductGridLoadingState();

    const sidePanel = this.elements.stepsContainer.querySelector('.full-page-side-panel');
    if (sidePanel) this.renderSidePanel(sidePanel);

    if (this.selectedBundle?.loadingGif) this.showLoadingOverlay(this.selectedBundle.loadingGif);
    try {
      await this.loadStepProducts(this.currentStepIndex);
      const productGrid = this.createFullPageProductGrid(this.currentStepIndex);
      productGridContainer.innerHTML = '';
      productGridContainer.appendChild(productGrid);
      if (sidePanel) this.renderSidePanel(sidePanel);
      this.hideLoadingOverlay();
      this.preloadNextStep();
      this._renderMobileBottomBar();
    } catch (error) {
      this.hideLoadingOverlay();
      productGridContainer.innerHTML = '<p class="error-message">Failed to load products. Please try again.</p>';
      this._renderMobileBottomBar();
    }
  }

  canProceedToNextStep() {
    return this.isStepCompleted(this.currentStepIndex);
  }

  areBundleConditionsMet() {
    return this.selectedBundle.steps.every((step, index) => {
      if (step.isFreeGift || step.isDefault) return true;
      return this.isStepCompleted(index);
    });
  }

  bundleHasNoConditions() {
    if (!this.selectedBundle?.steps?.length) return false;
    return this.selectedBundle.steps.every(step => {
      if (step.isFreeGift || step.isDefault) return true;
      return !step.conditionType && !step.conditionOperator && step.conditionValue == null;
    });
  }

  get freeGiftStep() {
    return (this.selectedBundle?.steps || []).find(s => s.isFreeGift) ?? null;
  }

  get freeGiftStepIndex() {
    return (this.selectedBundle?.steps || []).findIndex(s => s.isFreeGift);
  }

  get paidSteps() {
    return (this.selectedBundle?.steps || []).filter(s => !s.isFreeGift && !s.isDefault);
  }

  get isFreeGiftUnlocked() {
    if (!this.freeGiftStep) return false;
    const steps = this.selectedBundle?.steps || [];
    return this.paidSteps.every(paidStep => {
      const globalIndex = steps.indexOf(paidStep);
      return this.isStepCompleted(globalIndex);
    });
  }

  canNavigateToStep(targetStepIndex) {
    const targetStep = (this.selectedBundle?.steps || [])[targetStepIndex];
    if (targetStep?.isFreeGift && !this.isFreeGiftUnlocked) return false;
    return true;
  }

  _getFreeGiftRemainingCount() {
    const steps = this.selectedBundle?.steps || [];
    const total = this.paidSteps.reduce((sum, s) =>
      sum + (Number(s.conditionValue) || Number(s.minQuantity) || 1), 0);
    const selected = this.paidSteps.reduce((sum, paidStep) => {
      const globalIndex = steps.indexOf(paidStep);
      const stepSel = this.selectedProducts[globalIndex] ?? {};
      return sum + Object.values(stepSel).reduce((s, p) => s + (typeof p === 'number' ? p : (p.quantity || 1)), 0);
    }, 0);
    return Math.max(0, total - selected);
  }

  _initDefaultProducts() {
    const steps = this.selectedBundle?.steps || [];
    steps.forEach((step, stepIndex) => {
      if (!step.isDefault || !step.defaultVariantId) return;
      const allProducts = [...(step.products || []), ...(step.StepProduct || [])];
      const product = allProducts.find(p =>
        p.variantId === step.defaultVariantId ||
        p.id === step.defaultVariantId ||
        p.gid === step.defaultVariantId ||
        (p.variants || []).some(v => v.id === step.defaultVariantId || v.gid === step.defaultVariantId)
      );
      if (product) {
        if (!this.selectedProducts[stepIndex]) this.selectedProducts[stepIndex] = {};

        const normalizedId = this.extractId(step.defaultVariantId) || step.defaultVariantId;
        this.selectedProducts[stepIndex][normalizedId] = 1;
      }
    });
  }

  _syncFreeGiftLock() {
    if (!this.freeGiftStep || this.freeGiftStepIndex < 0) return;
    if (!this.isFreeGiftUnlocked) {
      this.selectedProducts[this.freeGiftStepIndex] = {};
    }
  }

  _renderFreeGiftSection(container) {
    const step = this.freeGiftStep;
    if (!step) return;

    const section = document.createElement('div');
    const giftName = this._escapeHTML(step.freeGiftName || 'gift');

    if (this.isFreeGiftUnlocked) {
      section.className = 'side-panel-free-gift unlocked';
      section.innerHTML = `
        <span class="side-panel-free-gift-icon">✅</span>
        <span class="side-panel-free-gift-text">Congrats! You're eligible for a FREE ${giftName}!</span>
      `;
    } else {
      const remaining = this._getFreeGiftRemainingCount();
      section.className = 'side-panel-free-gift';
      section.innerHTML = `
        <span class="side-panel-free-gift-icon">🔒</span>
        <span class="side-panel-free-gift-text">Add ${remaining} more product${remaining !== 1 ? 's' : ''} to claim a FREE ${giftName}!</span>
      `;
    }
    container.appendChild(section);
  }

  _renderSidebarProductSkeletons(container) {
    for (let i = 0; i < 5; i++) {
      const slot = document.createElement('div');
      slot.className = 'side-panel-product-row side-panel-skeleton-slot';
      slot.innerHTML = `
        <div class="side-panel-product-img-wrap">
          <div class="side-panel-product-img-placeholder side-panel-skeleton-thumb"></div>
        </div>
        <div class="side-panel-product-info side-panel-skeleton-lines">
          <span class="side-panel-product-title side-panel-skeleton-line line-name"></span>
          <span class="side-panel-product-variant side-panel-skeleton-line line-variant"></span>
        </div>
        <span class="side-panel-product-price side-panel-skeleton-line line-price"></span>
        <span class="side-panel-product-remove side-panel-skeleton-remove"></span>
      `;
      container.appendChild(slot);
    }
  }

  async addBundleToCart() {
    try {

      const allStepsValid = this.areBundleConditionsMet();
      if (!allStepsValid) {
        ToastManager.show('Please complete all bundle steps before adding to cart.');
        return;
      }

      const items = [];

      const bundleInstanceId = crypto.randomUUID();
      const bundleName = this.selectedBundle.name || 'Bundle';

      this.selectedBundle.steps.forEach((step, stepIndex) => {
        const stepSelections = this.selectedProducts[stepIndex] || {};

        Object.entries(stepSelections).forEach(([variantId, quantity]) => {
          if (quantity > 0) {

            const numericVariantId = this.extractId(variantId) || variantId;

            const properties = {
              '_bundle_id': bundleInstanceId,
              '_bundle_name': bundleName,
              '_step_index': String(stepIndex),
              '_step_name': step.name
            };
            if (step?.isFreeGift) properties['_bundle_step_type'] = 'free_gift';
            if (step?.isDefault) properties['_bundle_step_type'] = 'default';

            items.push({
              id: numericVariantId,
              quantity: quantity,
              properties
            });
          }
        });
      });

      if (items.length === 0) {
        ToastManager.show('Please select products before adding to cart');
        return;
      }

      const nextBtn = this.container.querySelector('.footer-btn-next');
      if (nextBtn) nextBtn.disabled = true;
      this.showLoadingOverlay(this.selectedBundle?.loadingGif || null);

      try {

        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items })
        });

        if (!response.ok) {
          throw new Error('Failed to add to cart');
        }

        const result = await response.json();

        ToastManager.show('Bundle added to cart successfully!');

        setTimeout(() => {
          window.location.href = '/cart';
        }, 1000);

      } catch (fetchError) {
        ToastManager.show('Failed to add bundle to cart. Please try again.');
      } finally {
        this.hideLoadingOverlay();
        if (nextBtn) nextBtn.disabled = false;
      }

    } catch (error) {
      ToastManager.show('Failed to add bundle to cart. Please try again.');
    }
  }

  createStepElement(step, index) {
    const stepBox = document.createElement('div');
    stepBox.className = 'step-box';
    stepBox.dataset.stepIndex = index;

    const selectedProducts = this.selectedProducts[index] || {};
    const hasSelections = Object.values(selectedProducts).some(qty => qty > 0);

    if (hasSelections) {
      stepBox.classList.add('step-completed');

      const clearBadge = document.createElement('div');
      clearBadge.className = 'step-clear-badge';
      clearBadge.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#f3f4f6"/>
          <path d="M8 8L16 16M16 8L8 16" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      clearBadge.title = 'Remove all products from this step';
      clearBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        this.clearStepSelections(index);
      });
      stepBox.appendChild(clearBadge);

      const productImages = this.getStepProductImages(index);
      if (productImages.length > 0) {
        const imagesContainer = document.createElement('div');
        imagesContainer.className = 'step-images';

        productImages.slice(0, 4).forEach(imageData => {
          const img = document.createElement('img');
          img.src = imageData.url;
          img.alt = imageData.alt;
          img.className = 'step-image';
          imagesContainer.appendChild(img);
        });

        stepBox.appendChild(imagesContainer);

        const totalQuantity = Object.values(selectedProducts).reduce((sum, qty) => sum + qty, 0);
        if (productImages.length > 4 || totalQuantity > 4) {
          const countBadge = document.createElement('div');
          countBadge.className = 'image-count-badge';
          countBadge.textContent = totalQuantity.toString();
          stepBox.appendChild(countBadge);
        }
      } else {

        const checkIcon = document.createElement('span');
        checkIcon.className = 'check-icon';
        checkIcon.textContent = '✓';
        stepBox.appendChild(checkIcon);
      }
    } else {

      const plusIcon = document.createElement('span');
      plusIcon.className = 'plus-icon';
      plusIcon.textContent = '+';
      stepBox.appendChild(plusIcon);
    }

    if (!hasSelections) {

      const stepName = document.createElement('p');
      stepName.className = 'step-name';
      stepName.textContent = step.name || `Step ${index + 1}`;
      stepBox.appendChild(stepName);

      const selectionCount = document.createElement('div');
      selectionCount.className = 'step-selection-count';
      selectionCount.textContent = this.getStepSelectionText(selectedProducts);
      stepBox.appendChild(selectionCount);
    }

    stepBox.addEventListener('click', () => this.openModal(index));

    return stepBox;
  }

  getStepProductImages(stepIndex) {
    const selectedProducts = this.selectedProducts[stepIndex] || {};
    const productImages = [];

    Object.entries(selectedProducts).forEach(([variantId, quantity]) => {
      if (quantity > 0) {
        const product = this.stepProductData[stepIndex].find(p => (p.variantId || p.id) === variantId);
        if (product && product.imageUrl && !productImages.find(img => img.url === product.imageUrl)) {
          productImages.push({
            url: product.imageUrl,
            alt: product.title || ''
          });
        }
      }
    });

    return productImages;
  }

  getStepSelectionText(selectedProducts) {
    const totalSelected = Object.values(selectedProducts).reduce((sum, qty) => sum + (qty || 0), 0);
    return totalSelected > 0 ? `${totalSelected} selected` : '';
  }

  clearStepSelections(stepIndex) {

    this.selectedProducts[stepIndex] = {};

    this.renderSteps();
    this.updateFooterMessaging();

    ToastManager.show(`All selections cleared from this step`);
  }

  renderFooter() {
    const bundleType = this.container.dataset.bundleType;

    if (bundleType === 'full_page') {
      const layout = this.selectedBundle?.fullPageLayout || 'footer_bottom';
      if (layout === 'footer_side') {

        if (this.elements.footer) {
          this.elements.footer.style.display = 'none';
        }
        return;
      }
      this.renderFullPageFooter();
      return;
    }

    if (!this.config.showFooterMessaging) {
      this.elements.footer.style.display = 'none';
      return;
    }

    this.updateFooterMessaging();
    this.elements.footer.style.display = 'block';
  }

  updateFooterMessaging() {

    if (!this.selectedBundle?.pricing?.enabled) {
      this.elements.footer.style.display = 'none';
      return;
    }

    const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData,
      this.selectedBundle?.steps
    );

    const discountInfo = PricingCalculator.calculateDiscount(
      this.selectedBundle,
      totalPrice,
      totalQuantity
    );

    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const variables = TemplateManager.createDiscountVariables(
      this.selectedBundle,
      totalPrice,
      totalQuantity,
      discountInfo,
      currencyInfo
    );

    const footerDiscountText = this.elements.footer.querySelector('.footer-discount-text');

    if (discountInfo.qualifiesForDiscount) {

      const successMessage = TemplateManager.replaceVariables(
        this.config.successMessageTemplate,
        variables
      );
      footerDiscountText.innerHTML = successMessage;
      this.elements.footer.classList.add('qualified');
    } else {

      const progressMessage = TemplateManager.replaceVariables(
        this.config.discountTextTemplate,
        variables
      );
      footerDiscountText.innerHTML = progressMessage;
      this.elements.footer.classList.remove('qualified');
    }

    this._updateDiscountProgressBanner();
  }

  _renderDiscountProgressBanner() {
    if (!this.selectedBundle?.pricing?.enabled) return null;

    const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData,
      this.selectedBundle?.steps
    );
    const discountInfo = PricingCalculator.calculateDiscount(
      this.selectedBundle, totalPrice, totalQuantity
    );
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const variables = TemplateManager.createDiscountVariables(
      this.selectedBundle, totalPrice, totalQuantity, discountInfo, currencyInfo
    );

    let message = '';
    let isReached = false;

    if (discountInfo.hasDiscount) {
      isReached = true;
      message = TemplateManager.replaceVariables(
        this.config.successMessageTemplate || '🎉 You\'ve unlocked {{discountText}}!',
        variables
      );
    } else {
      const nextRule = PricingCalculator.getNextDiscountRule?.(this.selectedBundle, totalQuantity);
      if (!nextRule) return null;
      message = TemplateManager.replaceVariables(
        this.config.discountTextTemplate || 'Add {{conditionText}} to get {{discountText}}',
        variables
      );
    }

    const banner = document.createElement('div');
    banner.className = 'discount-progress-banner' + (isReached ? ' reached' : '');
    banner.innerHTML = message;
    return banner;
  }

  _updateDiscountProgressBanner() {
    if (!this.elements.footer) return;
    const existing = this.elements.footer.querySelector('.discount-progress-banner');
    const fresh = this._renderDiscountProgressBanner();

    if (fresh && existing) {
      existing.className = fresh.className;
      existing.innerHTML = fresh.innerHTML;
    } else if (fresh && !existing) {

      this.elements.footer.insertBefore(fresh, this.elements.footer.firstChild);
    } else if (!fresh && existing) {
      existing.remove();
    }
  }

  getFormattedHeaderText() {

    if (!this.selectedBundle?.pricing?.enabled) {
      const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
      return this._escapeHTML(currentStep?.name) || `Step ${this.currentStepIndex + 1}`;
    }

    const { totalQuantity, totalPrice } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData,
      this.selectedBundle?.steps
    );
    const discountInfo = PricingCalculator.calculateDiscount(
      this.selectedBundle,
      totalPrice,
      totalQuantity
    );
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const variables = TemplateManager.createDiscountVariables(
      this.selectedBundle,
      totalPrice,
      totalQuantity,
      discountInfo,
      currencyInfo
    );

    return TemplateManager.replaceVariables(
      this.config.discountTextTemplate,
      variables
    );
  }

  openModal(stepIndex) {
    this.currentStepIndex = stepIndex;

    const modal = this.elements.modal;
    const headerText = this.getFormattedHeaderText();

    modal.querySelector('.modal-step-title').innerHTML = headerText;

    this.loadStepProducts(stepIndex).then(() => {
      this.renderModalTabs();
      this.renderModalProducts(stepIndex);
      this.updateModalNavigation();
      this.updateModalFooterMessaging();

      modal.style.display = 'block';
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }).catch(error => {
      ToastManager.show('Failed to load products for this step');
    });
  }

  closeModal() {
    this.elements.modal.style.display = 'none';
    this.elements.modal.classList.remove('active');
    document.body.style.overflow = '';

    this.renderSteps();
    this.updateFooterMessaging();
  }

  async loadStepProducts(stepIndex) {
    const step = this.selectedBundle.steps[stepIndex];

    if (this.stepProductData[stepIndex].length > 0) {
      return;
    }

    let allProducts = [];

    const hasEnrichedStepProducts = Array.isArray(step.StepProduct) && step.StepProduct.length > 0
      && step.StepProduct.some(sp => sp.title && sp.imageUrl);

    const stepProductsAlreadyEnriched = Array.isArray(step.products) && step.products.length > 0
      && step.products.some(p => (Array.isArray(p.images) && p.images.length > 0) || p.featuredImage);

    if (stepProductsAlreadyEnriched) {

      const normalizedProducts = step.products.map(p => ({
        ...p,
        price: (p.price || 0) / 100,
        compareAtPrice: p.compareAtPrice ? p.compareAtPrice / 100 : null,
        variants: p.variants?.map(v => ({
          ...v,
          price: (v.price || 0) / 100,
          compareAtPrice: v.compareAtPrice ? v.compareAtPrice / 100 : null,
        }))
      }));
      allProducts = allProducts.concat(normalizedProducts);
    } else if (!hasEnrichedStepProducts && step.products && Array.isArray(step.products) && step.products.length > 0) {
      const productIds = step.products.map(p => p.id);
      const shop = window.Shopify?.shop || window.location.host;

      const appUrl = window.__BUNDLE_APP_URL__ || '';
      const apiBaseUrl = appUrl || window.location.origin;

      const country = window.Shopify?.country
        || (window.Shopify?.locale?.includes('-') ? window.Shopify.locale.split('-')[1] : null)
        || null;

      try {
        const countryParam = country ? `&country=${encodeURIComponent(country)}` : '';
        const response = await fetch(`${apiBaseUrl}/api/storefront-products?ids=${encodeURIComponent(productIds.join(','))}&shop=${encodeURIComponent(shop)}${countryParam}`);

        if (!response.ok) {
          const errorText = await response.text();
          return;
        }

        const data = await response.json();

        if (data.products && data.products.length > 0) {
          allProducts = allProducts.concat(data.products);
        }
      } catch (error) {
      }
    }

    if (step.StepProduct && Array.isArray(step.StepProduct) && step.StepProduct.length > 0) {

      const hasEnrichedData = step.StepProduct.some(sp => sp.title && sp.imageUrl && sp.price);

      if (hasEnrichedData) {

        const enrichedProducts = step.StepProduct.map(sp => ({
          id: sp.productId,
          title: sp.title,
          handle: sp.handle,
          imageUrl: sp.imageUrl,
          price: sp.price,
          compareAtPrice: sp.compareAtPrice,
          available: true,
          variants: sp.variants || [{
            id: sp.productId.replace('Product', 'ProductVariant'),
            title: 'Default Title',
            price: sp.price,
            compareAtPrice: sp.compareAtPrice,
            available: true,
            image: sp.imageUrl ? { src: sp.imageUrl } : null
          }]
        }));

        allProducts = allProducts.concat(enrichedProducts);
      } else {

        const productGids = step.StepProduct.map(sp => sp.productId).filter(Boolean);
        const shop = window.Shopify?.shop || window.location.host;

        if (productGids.length > 0) {

          const appUrl = window.__BUNDLE_APP_URL__ || '';
          const apiBaseUrl = appUrl || window.location.origin;

          const country = window.Shopify?.country
            || (window.Shopify?.locale?.includes('-') ? window.Shopify.locale.split('-')[1] : null)
            || null;

          try {
            const countryParam = country ? `&country=${encodeURIComponent(country)}` : '';
            const response = await fetch(`${apiBaseUrl}/api/storefront-products?ids=${encodeURIComponent(productGids.join(','))}&shop=${encodeURIComponent(shop)}${countryParam}`);

            if (!response.ok) {
            } else {
              const data = await response.json();
              if (data.products && data.products.length > 0) {
                allProducts = allProducts.concat(data.products);
              }
            }
          } catch (error) {
          }
        }
      }
    }

    if (step.collections && Array.isArray(step.collections) && step.collections.length > 0) {
      const collectionHandles = step.collections
        .map(c => c.handle)
        .filter(Boolean);

      if (collectionHandles.length > 0) {
        const shop = window.Shopify?.shop || window.location.host;
        const appUrl = window.__BUNDLE_APP_URL__ || '';
        const apiBaseUrl = appUrl || window.location.origin;

        try {
          const response = await fetch(
            `${apiBaseUrl}/api/storefront-collections?handles=${encodeURIComponent(collectionHandles.join(','))}&shop=${encodeURIComponent(shop)}`
          );

          if (response.ok) {
            const data = await response.json();
            if (data.products && data.products.length > 0) {
              allProducts = allProducts.concat(data.products);
            }

            if (data.byCollection) {
              for (const [handle, productIds] of Object.entries(data.byCollection)) {
                this.stepCollectionProductIds[`${stepIndex}:${handle}`] = productIds;
              }
            }
          } else {
          }
        } catch (error) {
        }
      }
    }

    const processedProducts = this.processProductsForStep(allProducts, step);

    const seen = new Set();
    this.stepProductData[stepIndex] = processedProducts.filter(product => {
      const key = product.variantId || product.id;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

  }

  processProductsForStep(products, step) {

    const normalizeVariant = (v) => ({
      id: this.extractId(v.id),
      title: v.title,
      price: parseFloat(v.price || '0') * 100,
      compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) * 100 : null,
      available: v.available === true,
      quantityAvailable: typeof v.quantityAvailable === 'number' ? v.quantityAvailable : null,
      currentlyNotInStock: v.currentlyNotInStock === true,
      option1: v.option1 || null,
      option2: v.option2 || null,
      option3: v.option3 || null,
      image: v.image || null
    });

    return products.flatMap(product => {
      if (step.displayVariantsAsIndividual && product.variants && product.variants.length > 0) {

        const processedVariants = (product.variants || []).map(normalizeVariant);

        const processedOptions = (product.options || []).map(opt => {
          if (typeof opt === 'string') return opt;
          return opt.name || opt;
        });

        return product.variants
          .filter(variant => variant.available === true)
          .map(variant => {

            const imageUrl = variant?.image?.src || product.imageUrl || product.featuredImage?.url || product.images?.[0]?.url || 'https://via.placeholder.com/150';

            return {
              id: this.extractId(variant.id),
              title: `${product.title} - ${variant.title}`,
              imageUrl,
              price: parseFloat(variant.price || '0') * 100,
              compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice) * 100 : null,
              variantId: this.extractId(variant.id),
              available: variant.available === true,
              quantityAvailable: typeof variant.quantityAvailable === 'number' ? variant.quantityAvailable : null,
              currentlyNotInStock: variant.currentlyNotInStock === true,

              parentProductId: this.extractId(product.id),
              parentTitle: product.title,
              variants: processedVariants,
              options: processedOptions,
              images: product.images || (product.imageUrl ? [{ src: product.imageUrl }] : []),
              description: product.description || ''
            };
          });
      } else {

        const defaultVariant = product.variants?.[0];

        if (defaultVariant && defaultVariant.available !== true) {
          return [];
        }

        const imageUrl = defaultVariant?.image?.src || product.imageUrl || product.featuredImage?.url || product.images?.[0]?.url || 'https://via.placeholder.com/150';

        const processedVariants = (product.variants || []).map(normalizeVariant);

        const processedOptions = (product.options || []).map(opt => {
          if (typeof opt === 'string') return opt;
          return opt.name || opt;
        });

        return [{
          id: this.extractId(product.id),
          title: product.title,
          imageUrl,
          price: defaultVariant ? parseFloat(defaultVariant.price || '0') * 100 : 0,
          compareAtPrice: defaultVariant?.compareAtPrice ? parseFloat(defaultVariant.compareAtPrice) * 100 : null,
          variantId: this.extractId(defaultVariant?.id || product.id),
          available: defaultVariant?.available === true,
          quantityAvailable: typeof defaultVariant?.quantityAvailable === 'number' ? defaultVariant.quantityAvailable : null,
          currentlyNotInStock: defaultVariant?.currentlyNotInStock === true,

          variants: processedVariants,
          options: processedOptions,

          images: product.images || (product.imageUrl ? [{ src: product.imageUrl }] : []),
          description: product.description || ''
        }];
      }
    });
  }

  /**
   * Look up real stock for a variant in a step's product data.
   * Returns:
   *   - available: numeric remaining stock, or null (untracked/unlimited)
   *   - outOfStock: true when the variant is known to be out of stock and does
   *     not accept backorders (available === 0 and currentlyNotInStock is false)
   *   - acceptsBackorder: true when out of stock but backorders are allowed
   *     — in that case the UI should not clamp to zero.
   */
  getVariantAvailable(stepIndex, variantId) {
    const products = this.stepProductData[stepIndex] || [];
    const product = products.find(p => (p.variantId || p.id) === variantId);
    if (!product) {
      return { available: null, outOfStock: false, acceptsBackorder: false };
    }

    const qty = typeof product.quantityAvailable === 'number' ? product.quantityAvailable : null;
    const backorder = product.currentlyNotInStock === true;

    if (qty === 0 && !backorder) {
      return { available: 0, outOfStock: true, acceptsBackorder: false };
    }
    return { available: qty, outOfStock: false, acceptsBackorder: backorder };
  }

  extractId(idString) {
    if (!idString) return null;

    const gidMatch = idString.toString().match(/gid:\/\/shopify\/\w+\/(\d+)/);
    if (gidMatch) {
      return gidMatch[1];
    }

    return idString.toString().split('/').pop();
  }

  renderModalTabs() {
    const tabsContainer = this.elements.modal?.querySelector('.modal-tabs');
    if (!tabsContainer) return;
    tabsContainer.innerHTML = '';

    this.selectedBundle.steps.forEach((step, index) => {
      const isAccessible = this.isStepAccessible(index);
      const isActive = index === this.currentStepIndex;

      const tabButton = document.createElement('button');
      tabButton.className = `bundle-header-tab ${isActive ? 'active' : ''} ${!isAccessible ? 'locked' : ''}`;
      tabButton.textContent = step.name || `Step ${index + 1}`;
      tabButton.dataset.stepIndex = index.toString();

      tabButton.addEventListener('click', async () => {
        if (!isAccessible) {
          ToastManager.show('Please complete the previous steps first.');
          return;
        }

        this.currentStepIndex = index;

        const headerText = this.getFormattedHeaderText();
        this.elements.modal.querySelector('.modal-step-title').innerHTML = headerText;

        await this.loadStepProducts(index);

        this.renderModalTabs();
        this.renderModalProducts(index);
        this.updateModalNavigation();
        this.updateModalFooterMessaging();
      });

      tabsContainer.appendChild(tabButton);
    });

    if (this.updateTabArrows) {
      setTimeout(() => this.updateTabArrows(), 50);
    }
  }

  renderModalProducts(stepIndex, productsToRender = null) {

    const products = productsToRender || this.stepProductData[stepIndex];
    const selectedProducts = this.selectedProducts[stepIndex];
    const productGrid = this.elements.modal.querySelector('.product-grid');

    if (products.length === 0) {

      const currentStep = this.selectedBundle.steps[stepIndex];
      const stepName = this._escapeHTML(currentStep?.name) || `Step ${stepIndex + 1}`;
      const labelText = `Select ${stepName}`;

      const emptyStateCards = Array(3).fill(0).map((_, index) => `
        <div class="empty-state-card">
          <svg class="empty-state-card-icon" width="69" height="69" viewBox="0 0 69 69" fill="none">
            <line x1="34.5" y1="15" x2="34.5" y2="54" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
            <line x1="15" y1="34.5" x2="54" y2="34.5" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
          </svg>
          <p class="empty-state-card-text">${labelText}</p>
        </div>
      `).join('');

      productGrid.innerHTML = emptyStateCards;
      return;
    }

    productGrid.innerHTML = products.map(product => {
      const selectionKey = product.variantId || product.id;
      const currentQuantity = selectedProducts[selectionKey] || 0;
      const currencyInfo = CurrencyManager.getCurrencyInfo();

      const { available, outOfStock } = this.getVariantAvailable(stepIndex, selectionKey);
      const atMaxStock = available !== null && currentQuantity >= available;
      const lowStock = available !== null && available > 0 && available <= 3;
      const increaseDisabled = outOfStock || atMaxStock;
      const addDisabled = outOfStock;

      const stockBadge = outOfStock
        ? `<div class="product-stock-badge product-stock-badge--out">Out of stock</div>`
        : lowStock
          ? `<div class="product-stock-badge product-stock-badge--low">Only ${available} left</div>`
          : '';

      return `
        <div class="product-card ${currentQuantity > 0 ? 'selected' : ''} ${outOfStock ? 'is-out-of-stock' : ''}" data-product-id="${selectionKey}">
          ${currentQuantity > 0 ? `
            <div class="selected-overlay">✓</div>
          ` : ''}

          <div class="product-image">
            <img src="${product.imageUrl}" alt="${ComponentGenerator.escapeHtml(product.title)}" loading="lazy">
            ${stockBadge}
          </div>

          <div class="product-content-wrapper">
            <div class="product-title">${ComponentGenerator.escapeHtml(product.title)}</div>

            ${product.price ? `
              <div class="product-price-row">
                ${product.compareAtPrice ? `<span class="product-price-strike">${CurrencyManager.convertAndFormat(product.compareAtPrice, currencyInfo)}</span>` : ''}
                <span class="product-price">${CurrencyManager.convertAndFormat(product.price, currencyInfo)}</span>
              </div>
            ` : ''}

            <div class="product-spacer"></div>

            ${this.renderVariantSelector(product, this.selectedBundle?.steps?.[stepIndex])}

            <div class="product-quantity-wrapper">
              <div class="product-quantity-selector">
                <button class="qty-btn qty-decrease" data-product-id="${selectionKey}">−</button>
                <span class="qty-display">${currentQuantity}</span>
                <button class="qty-btn qty-increase" data-product-id="${selectionKey}" ${increaseDisabled ? 'disabled aria-disabled="true"' : ''}>+</button>
              </div>
            </div>

            <button class="product-add-btn ${currentQuantity > 0 ? 'added' : ''}"
                    data-product-id="${selectionKey}"
                    data-product-handle="${product.handle || ''}"
                    data-step-id="${step.id}"
                    ${addDisabled ? 'disabled aria-disabled="true"' : ''}>
              ${outOfStock ? 'Out of stock' : (currentQuantity > 0 ? '✓ Added to Bundle' : 'Choose Options')}
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.attachProductEventHandlers(productGrid, stepIndex);
  }

  renderVariantSelector(product, step) {
    if (!product.variants || product.variants.length <= 1) {
      return '';
    }
    const primaryOptionName = step?.primaryVariantOption || null;
    return VariantSelectorComponent.renderHtml(product, primaryOptionName);
  }

  attachProductEventHandlers(productGrid, stepIndex) {

    const newProductGrid = productGrid.cloneNode(true);
    productGrid.parentNode.replaceChild(newProductGrid, productGrid);

    const step = this.selectedBundle.steps[stepIndex];

    const findProduct = (productId) => {
      return this.stepProductData[stepIndex]?.find(p => {
        const selectionKey = p.variantId || p.id;
        return selectionKey === productId;
      });
    };

    newProductGrid.addEventListener('click', (e) => {
      if (e.target.classList.contains('qty-btn')) {
        e.stopPropagation();
        const productId = e.target.dataset.productId;
        const isIncrease = e.target.classList.contains('qty-increase');
        const currentQuantity = this.selectedProducts[stepIndex][productId] || 0;

        const newQuantity = isIncrease ? currentQuantity + 1 : Math.max(0, currentQuantity - 1);
        this.updateProductSelection(stepIndex, productId, newQuantity);
      }
    });

    newProductGrid.addEventListener('click', (e) => {
      if (e.target.classList.contains('product-add-btn')) {
        e.stopPropagation();
        const productId = e.target.dataset.productId;
        const currentQuantity = this.selectedProducts[stepIndex][productId] || 0;

        if (currentQuantity > 0) {
          this.updateProductSelection(stepIndex, productId, 0);
        } else {

          this.updateProductSelection(stepIndex, productId, 1);
        }
      }
    });

    newProductGrid.addEventListener('click', (e) => {
      const productImage = e.target.closest('.product-image');
      const productTitle = e.target.closest('.product-title');

      if (productImage || productTitle) {
        const productCard = e.target.closest('.product-card');
        if (productCard && this.productModal) {
          const productId = productCard.dataset.productId;
          const product = findProduct(productId);

          if (product && step) {
            this.productModal.open(product, step);
          }
        }
      }
    });

    newProductGrid.addEventListener('change', (e) => {
      if (e.target.classList.contains('variant-selector')) {
        e.stopPropagation();
        const newVariantId = e.target.value;
        const baseProductId = e.target.dataset.baseProductId;

        const product = this.stepProductData[stepIndex].find(p => p.id === baseProductId);
        if (product) {
          const variantData = product.variants.find(v => v.id === newVariantId);
          if (variantData) {

            product.quantityAvailable = typeof variantData.quantityAvailable === 'number'
              ? variantData.quantityAvailable
              : null;
            product.currentlyNotInStock = variantData.currentlyNotInStock === true;

            const oldQuantity = this.selectedProducts[stepIndex][product.variantId] || 0;
            if (oldQuantity > 0) {
              delete this.selectedProducts[stepIndex][product.variantId];

              const newQtyAvail = product.quantityAvailable;
              const newOOS = newQtyAvail === 0 && !product.currentlyNotInStock;
              let migratedQty = oldQuantity;
              if (newOOS) {
                ToastManager.show('Selected variant is out of stock — selection cleared.');
                migratedQty = 0;
              } else if (newQtyAvail !== null && oldQuantity > newQtyAvail) {
                migratedQty = newQtyAvail;
                ToastManager.show(`Only ${newQtyAvail} in stock — quantity adjusted.`);
              }
              if (migratedQty > 0) {
                this.selectedProducts[stepIndex][newVariantId] = migratedQty;
              }
            }

            product.variantId = newVariantId;
            product.price = variantData.price;

            this.updateModalNavigation();
            this.updateModalFooterMessaging();
          }
        }
      }
    });

    newProductGrid.querySelectorAll('.product-image, .product-title').forEach(el => {
      el.style.cursor = 'pointer';
    });
  }
  updateProductSelection(stepIndex, productId, newQuantity) {
    let quantity = Math.max(0, newQuantity);

    if (quantity > 0) {
      const { available, outOfStock } = this.getVariantAvailable(stepIndex, productId);
      if (outOfStock) {
        ToastManager.show('This item is out of stock.');
        return;
      }
      if (available !== null && quantity > available) {
        quantity = available;
        ToastManager.show(`Only ${available} in stock — quantity adjusted.`);
      }
    }

    if (!this.validateStepCondition(stepIndex, productId, quantity)) {
      return;
    }

    if (quantity > 0) {
      this.selectedProducts[stepIndex][productId] = quantity;
    } else {
      delete this.selectedProducts[stepIndex][productId];
    }

    this._syncFreeGiftLock();

    this.updateProductQuantityDisplay(stepIndex, productId, quantity);
    this.renderModalTabs();
    this.updateModalNavigation();
    this.updateModalFooterMessaging();

    const bundleType = this.container.dataset.bundleType;
    if (bundleType === 'full_page') {
      const layout = this.selectedBundle?.fullPageLayout || 'footer_bottom';
      if (layout === 'footer_side') {
        const sidePanel = this.elements.stepsContainer.querySelector('.full-page-side-panel');
        this.renderSidePanel(sidePanel);
        if (window.matchMedia?.('(max-width: 767px)').matches) {
          this._renderMobileBottomBar({ preserveOpen: true });
        }
      } else {
        this.renderFullPageFooter();
      }

      this.updateStepTimeline();

      const _autoAdvanceStep = this.selectedBundle?.steps?.[this.currentStepIndex];
      const _hasExplicitCondition = _autoAdvanceStep &&
        _autoAdvanceStep.conditionType &&
        _autoAdvanceStep.conditionOperator &&
        _autoAdvanceStep.conditionValue != null;
      if (quantity > 0 && !this._autoAdvancePending && _hasExplicitCondition) {
        const isLastStep = this.currentStepIndex === this.selectedBundle.steps.length - 1;
        if (!isLastStep && this.isStepCompleted(this.currentStepIndex) && this.canNavigateToStep(this.currentStepIndex + 1)) {
          this._autoAdvancePending = true;
          setTimeout(() => {
            this._autoAdvancePending = false;

            if (this.isStepCompleted(this.currentStepIndex) && this.canNavigateToStep(this.currentStepIndex + 1)) {
              this.activeCollectionId = null;
              this.searchQuery = '';
              this.currentStepIndex++;
              const layout = this.selectedBundle?.fullPageLayout || 'footer_bottom';
              if (layout === 'footer_side') {
                this._sidebarAdvanceToNextStep();
              } else {
                this.reRenderFullPage();
              }
            }
          }, 120);
        }
      }
    } else {
      this.updateFooterMessaging();
    }
  }

  updateProductQuantityDisplay(stepIndex, productId, quantity) {

    const productCard = this.container.querySelector(`[data-product-id="${productId}"]`);
    if (!productCard) return;

    const contentWrapper = productCard.querySelector('.product-content-wrapper');
    if (!contentWrapper) return;

    const existingAddBtn = productCard.querySelector('.product-add-btn');
    const existingQuantityControls = productCard.querySelector('.inline-quantity-controls');
    let selectedOverlay = productCard.querySelector('.selected-overlay');

    if (quantity > 0) {

      if (existingAddBtn) {
        existingAddBtn.remove();
      }

      if (existingQuantityControls) {

        const qtyDisplay = existingQuantityControls.querySelector('.inline-qty-display');
        if (qtyDisplay) {
          qtyDisplay.textContent = quantity;
        }
      } else {

        const quantityControls = document.createElement('div');
        quantityControls.className = 'inline-quantity-controls';
        quantityControls.innerHTML = `
          <button class="inline-qty-btn qty-decrease" data-product-id="${productId}">−</button>
          <span class="inline-qty-display">${quantity}</span>
          <button class="inline-qty-btn qty-increase" data-product-id="${productId}">+</button>
        `;
        contentWrapper.appendChild(quantityControls);

        const increaseBtn = quantityControls.querySelector('.qty-increase');
        const decreaseBtn = quantityControls.querySelector('.qty-decrease');

        if (increaseBtn) {
          increaseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentQty = this.selectedProducts[stepIndex]?.[productId] || 0;
            this.updateProductSelection(stepIndex, productId, currentQty + 1);
          });
        }

        if (decreaseBtn) {
          decreaseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentQty = this.selectedProducts[stepIndex]?.[productId] || 0;
            if (currentQty > 0) {
              this.updateProductSelection(stepIndex, productId, currentQty - 1);
            }
          });
        }
      }

      if (!selectedOverlay) {
        selectedOverlay = document.createElement('div');
        selectedOverlay.className = 'selected-overlay';
        selectedOverlay.textContent = '✓';
        productCard.appendChild(selectedOverlay);
      }
      selectedOverlay.style.display = 'flex';
      productCard.classList.add('selected');

    } else {

      if (existingQuantityControls) {
        existingQuantityControls.remove();
      }

      if (!existingAddBtn) {
        const addButton = document.createElement('button');
        addButton.className = 'product-add-btn';
        addButton.dataset.productId = productId;
        addButton.textContent = '+';
        contentWrapper.appendChild(addButton);

        addButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.updateProductSelection(stepIndex, productId, 1);
        });
      }

      if (selectedOverlay) {
        selectedOverlay.style.display = 'none';
      }
      productCard.classList.remove('selected');
    }

    this._refreshSiblingDimState(stepIndex);
  }

  _refreshSiblingDimState(stepIndex) {

    if (stepIndex !== this.currentStepIndex) return;
    const step = this.selectedBundle?.steps?.[stepIndex];
    if (!step) return;
    const stepSelections = this.selectedProducts[stepIndex] || {};
    const capacityCheck = ConditionValidator.canUpdateQuantity(step, stepSelections, '__new__', 1);
    const isAtCapacity = !capacityCheck.allowed;

    const anyCard = this.container.querySelector('.product-grid .product-card');
    const grid = anyCard?.closest('.product-grid');
    if (!grid) return;
    grid.querySelectorAll('.product-card').forEach(card => {
      const cardProductId = card.dataset.productId;
      const currentQty = cardProductId ? (stepSelections[cardProductId] || 0) : 0;
      if (isAtCapacity && currentQty === 0) {
        card.classList.add('dimmed');
      } else {
        card.classList.remove('dimmed');
      }
    });
  }

  findProductById(stepIndex, productId) {
    const products = this.stepProductData[stepIndex] || [];
    return products.find(p => (p.variantId || p.id) === productId);
  }

  validateStepCondition(stepIndex, productId, newQuantity) {
    const step = this.selectedBundle.steps[stepIndex];
    const currentSelections = this.selectedProducts[stepIndex] || {};
    const currentQty = currentSelections[productId] || 0;

    const { allowed, limitText } = ConditionValidator.canUpdateQuantity(
      step,
      currentSelections,
      productId,
      newQuantity,
    );

    if (!allowed && newQuantity > currentQty) {
      const required = step.conditionValue;
      ToastManager.show(`This step allows ${limitText} product${required !== 1 ? 's' : ''} only.`);
      return false;
    }

    return true;
  }

  validateStep(stepIndex) {
    const step = this.selectedBundle.steps[stepIndex];
    const currentSelections = this.selectedProducts[stepIndex] || {};
    return ConditionValidator.isStepConditionSatisfied(step, currentSelections);
  }

  isStepAccessible(stepIndex) {

    if (this.selectedBundle?.steps[stepIndex]?.isDefault) return true;

    if (!this.canNavigateToStep(stepIndex)) return false;

    for (let i = 0; i < stepIndex; i++) {
      const step = this.selectedBundle?.steps[i];
      if (step?.isFreeGift || step?.isDefault) continue;
      if (!this.validateStep(i)) return false;
    }
    return true;
  }

  updateModalNavigation() {
    const prevButton = this.elements.modal?.querySelector('.prev-button');
    const nextButton = this.elements.modal?.querySelector('.next-button');

    if (!prevButton || !nextButton) return;

    prevButton.disabled = this.currentStepIndex === 0;

    const isCurrentStepValid = this.validateStep(this.currentStepIndex);

    if (this.currentStepIndex === this.selectedBundle.steps.length - 1) {
      nextButton.textContent = 'Done';
      nextButton.disabled = !isCurrentStepValid;
    } else {
      nextButton.textContent = 'Next';
      nextButton.disabled = !isCurrentStepValid;
    }
  }

  updateModalFooterMessaging() {

    if (!this.elements.modal || this.elements.modal.style.display === 'none') return;

    const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData,
      this.selectedBundle?.steps
    );

    const discountInfo = PricingCalculator.calculateDiscount(
      this.selectedBundle,
      totalPrice,
      totalQuantity
    );

    const currencyInfo = CurrencyManager.getCurrencyInfo();

    this.updateModalHeaderText(totalPrice, totalQuantity, discountInfo, currencyInfo);

    const cartBadge = this.elements.modal.querySelector('.cart-badge-count');
    if (cartBadge) {
      cartBadge.textContent = totalQuantity.toString();
    }

    this.updateFooterTotalPrices(totalPrice, discountInfo, currencyInfo);

    this.updateModalDiscountMessaging(totalPrice, totalQuantity, discountInfo, currencyInfo);
  }

  updateModalHeaderText(totalPrice, totalQuantity, discountInfo, currencyInfo) {
    const modalStepTitle = this.elements.modal.querySelector('.modal-step-title');
    if (!modalStepTitle) return;

    if (!this.selectedBundle?.pricing?.enabled) {
      const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
      modalStepTitle.innerHTML = this._escapeHTML(currentStep?.name) || `Step ${this.currentStepIndex + 1}`;
      return;
    }

    const variables = TemplateManager.createDiscountVariables(
      this.selectedBundle,
      totalPrice,
      totalQuantity,
      discountInfo,
      currencyInfo
    );

    const headerText = TemplateManager.replaceVariables(
      this.config.discountTextTemplate,
      variables
    );

    modalStepTitle.innerHTML = headerText;
  }

  updateModalDiscountMessaging(totalPrice, totalQuantity, discountInfo, currencyInfo) {
    const footerDiscountText = this.elements.modal.querySelector('.footer-discount-text');
    const discountSection = this.elements.modal.querySelector('.modal-footer-discount-messaging');

    if (!footerDiscountText) return;

    const variables = TemplateManager.createDiscountVariables(
      this.selectedBundle,
      totalPrice,
      totalQuantity,
      discountInfo,
      currencyInfo
    );

    if (discountInfo.qualifiesForDiscount) {

      const successMessage = TemplateManager.replaceVariables(
        this.config.successMessageTemplate,
        variables
      );
      footerDiscountText.innerHTML = successMessage;
      if (discountSection) discountSection.classList.add('qualified');
    } else {

      const progressMessage = TemplateManager.replaceVariables(
        this.config.discountTextTemplate,
        variables
      );
      footerDiscountText.innerHTML = progressMessage;
      if (discountSection) discountSection.classList.remove('qualified');
    }

    if (discountSection) {
      discountSection.style.display = this.config.showDiscountMessaging ? 'block' : 'none';
    }
  }

  updateFooterTotalPrices(totalPrice, discountInfo, currencyInfo) {
    const strikePriceEl = this.elements.modal.querySelector('.total-price-strike');
    const finalPriceEl = this.elements.modal.querySelector('.total-price-final');

    if (!strikePriceEl || !finalPriceEl) return;

    if (discountInfo.qualifiesForDiscount && discountInfo.finalPrice < totalPrice) {

      strikePriceEl.textContent = CurrencyManager.convertAndFormat(totalPrice, currencyInfo);
      strikePriceEl.style.display = 'inline';
      finalPriceEl.textContent = CurrencyManager.convertAndFormat(discountInfo.finalPrice, currencyInfo);
    } else {

      strikePriceEl.style.display = 'none';
      finalPriceEl.textContent = CurrencyManager.convertAndFormat(totalPrice, currencyInfo);
    }
  }

  showLoadingOverlay(gifUrl) {
    if (!this.container) return;

    const pos = getComputedStyle(this.container).position;
    if (pos !== 'relative' && pos !== 'absolute' && pos !== 'fixed' && pos !== 'sticky') {
      this.container.style.position = 'relative';
    }

    this.container.querySelector('.bundle-loading-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'bundle-loading-overlay';

    if (gifUrl) {
      const img = document.createElement('img');
      img.className = 'bundle-loading-overlay__gif';
      img.src = gifUrl;
      img.alt = '';
      overlay.appendChild(img);
    } else {
      const animation = createDefaultLoadingAnimation();
      overlay.appendChild(animation);
    }

    this.container.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('is-visible'));
  }

  hideLoadingOverlay() {
    const overlay = this.container?.querySelector('.bundle-loading-overlay');
    if (!overlay) return;
    overlay.classList.remove('is-visible');
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
  }

  generateBundleInstanceId() {

    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      const uuid = crypto.randomUUID();
      const bundleInstanceId = `${this.selectedBundle.id}_${uuid}`;

      return bundleInstanceId;
    }

    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    const bundleInstanceId = `${this.selectedBundle.id}_${timestamp}_${random}`;

    return bundleInstanceId;
  }

  parseTierConfig(rawJson) {
    try {
      const parsed = JSON.parse(rawJson);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(t => typeof t?.label === 'string' && typeof t?.bundleId === 'string')
        .map(t => ({ label: t.label.trim(), bundleId: t.bundleId.trim() }))
        .filter(t => t.label !== '' && t.bundleId !== '')
        .slice(0, 4);
    } catch {
      return [];
    }
  }

  resolveTierConfig(apiTierConfig, dataTierConfig) {
    if (apiTierConfig == null) return dataTierConfig;

    const mapped = (Array.isArray(apiTierConfig) ? apiTierConfig : [])
      .filter(
        t =>
          typeof t?.label === 'string' &&
          typeof t?.linkedBundleId === 'string' &&
          t.label.trim() !== '' &&
          t.linkedBundleId.trim() !== ''
      )
      .map(t => ({ label: t.label.trim(), bundleId: t.linkedBundleId.trim() }))
      .slice(0, 4);

    return mapped.length >= 2 ? mapped : [];
  }

  resolveShowStepTimeline(apiValue, dataAttrValue) {
    if (apiValue !== null && apiValue !== undefined) return apiValue;
    return dataAttrValue;
  }

  isTierActive(tierIndex) {
    return tierIndex === this.activeTierIndex;
  }

  initTierPills(tiers) {
    if (tiers.length < 2) return;

    const bar = document.createElement('div');
    bar.className = 'bundle-tier-pill-bar';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Bundle pricing tiers');

    tiers.forEach((tier, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bundle-tier-pill' + (i === 0 ? ' bundle-tier-pill--active' : '');
      btn.dataset.tierIndex = String(i);
      btn.dataset.bundleId = tier.bundleId;
      btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      btn.textContent = tier.label;
      bar.appendChild(btn);
    });

    this.container.insertBefore(bar, this.container.firstChild);
    this.elements.tierPillBar = bar;
  }

  updatePillActiveStates() {
    if (!this.elements.tierPillBar) return;
    this.elements.tierPillBar.querySelectorAll('.bundle-tier-pill').forEach(pill => {
      const idx = parseInt(pill.dataset.tierIndex, 10);
      const active = idx === this.activeTierIndex;
      pill.classList.toggle('bundle-tier-pill--active', active);
      pill.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  async switchTier(bundleId, tierIndex) {
    if (tierIndex === this.activeTierIndex) return;

    const pills = this.elements.tierPillBar
      ? [...this.elements.tierPillBar.querySelectorAll('.bundle-tier-pill')]
      : [];

    pills.forEach(p => p.classList.add('bundle-tier-pill--disabled'));
    if (pills[tierIndex]) pills[tierIndex].classList.add('bundle-tier-pill--loading');

    this.showLoadingOverlay(null);

    try {

      this.selectedProducts = [];
      this.stepProductData = [];
      this.currentStepIndex = 0;
      this.stepCollectionProductIds = {};
      this.searchQuery = '';

      this.config.bundleId = bundleId;
      await this.loadBundleData();
      this.selectBundle();

      if (!this.selectedBundle) {
        throw new Error('Bundle not found for this tier.');
      }

      this.config.showStepTimeline = this.resolveShowStepTimeline(
        this.selectedBundle.showStepTimeline ?? null,
        this.config.showStepTimeline
      );

      this.initializeDataStructures();

      if (this.elements.stepsContainer) {
        this.elements.stepsContainer.innerHTML = '';
      }
      await this.renderUI();

      this.activeTierIndex = tierIndex;
      this.updatePillActiveStates();
    } catch (err) {
      ToastManager.show(`Failed to load tier: ${err.message}`);

      this.updatePillActiveStates();
    } finally {
      this.hideLoadingOverlay();
      pills.forEach(p => {
        p.classList.remove('bundle-tier-pill--disabled', 'bundle-tier-pill--loading');
      });
    }
  }

  _mergeBundleSettings(settings) {
    if (!settings || !this.selectedBundle) return;
    const keys = [
      'promoBannerBgImage', 'promoBannerBgImageCrop', 'loadingGif',
      'showStepTimeline', 'floatingBadgeEnabled', 'floatingBadgeText', 'tierConfig',
    ];
    for (const key of keys) {
      if (settings[key] !== undefined) this.selectedBundle[key] = settings[key];
    }
  }

  _initFloatingBadge() {
    const enabled = this.selectedBundle && this.selectedBundle.floatingBadgeEnabled;
    const text = this.selectedBundle && this.selectedBundle.floatingBadgeText;
    if (!enabled || !text || !text.trim()) return;

    const DISMISS_KEY = `fpb_badge_dismissed_${this.selectedBundle.id}`;
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    const badge = document.createElement('div');
    badge.className = 'floating-promo-badge';
    badge.setAttribute('role', 'status');
    badge.innerHTML = `<span class="floating-promo-badge__text">${this._escapeHtml(text.trim())}</span><button class="floating-promo-badge__close" aria-label="Dismiss">&times;</button>`;

    badge.querySelector('.floating-promo-badge__close').addEventListener('click', () => {
      sessionStorage.setItem(DISMISS_KEY, '1');
      badge.remove();
    });

    document.body.appendChild(badge);
  }

  _escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  attachEventListeners() {

    if (this.elements.tierPillBar) {
      this.elements.tierPillBar.addEventListener('click', e => {
        const pill = e.target.closest('.bundle-tier-pill');
        if (!pill) return;
        this.switchTier(pill.dataset.bundleId, parseInt(pill.dataset.tierIndex, 10));
      });
      this.elements.tierPillBar.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          const pill = e.target.closest('.bundle-tier-pill');
          if (!pill) return;
          e.preventDefault();
          pill.click();
        }
      });
    }

    const modal = this.elements.modal;
    const closeButton = modal.querySelector('.close-button');
    const overlay = modal.querySelector('.modal-overlay');
    const prevButton = modal.querySelector('.prev-button');
    const nextButton = modal.querySelector('.next-button');

    if (closeButton) {
      closeButton.addEventListener('click', () => this.closeModal());
    }

    if (overlay) {
      overlay.addEventListener('click', () => this.closeModal());
    }

    if (prevButton) {
      prevButton.addEventListener('click', () => this.navigateModal(-1));
    }

    if (nextButton) {
      nextButton.addEventListener('click', () => this.navigateModal(1));
    }

    document.addEventListener('keydown', (e) => {
      if (modal.style.display === 'block' && e.key === 'Escape') {
        this.closeModal();
      }
    });
  }

  async navigateModal(direction) {
    const newStepIndex = this.currentStepIndex + direction;

    if (direction < 0 && newStepIndex >= 0) {

      this.currentStepIndex = newStepIndex;

      const headerText = this.getFormattedHeaderText();
      this.elements.modal.querySelector('.modal-step-title').innerHTML = headerText;

      await this.loadStepProducts(newStepIndex);

      this.renderModalTabs();
      this.renderModalProducts(this.currentStepIndex);
      this.updateModalNavigation();
      this.updateModalFooterMessaging();
    } else if (direction > 0) {
      if (newStepIndex < this.selectedBundle.steps.length) {

        if (this.validateStep(this.currentStepIndex)) {
          this.currentStepIndex = newStepIndex;

          const headerText = this.getFormattedHeaderText();
          this.elements.modal.querySelector('.modal-step-title').innerHTML = headerText;

          await this.loadStepProducts(newStepIndex);

          this.renderModalTabs();
          this.renderModalProducts(this.currentStepIndex);
          this.updateModalNavigation();
          this.updateModalFooterMessaging();
        } else {
          ToastManager.show('Please meet the quantity conditions for the current step before proceeding.');
        }
      } else {

        if (this.validateStep(this.currentStepIndex)) {
          this.closeModal();
        } else {
          ToastManager.show('Please meet the quantity conditions for the current step before finishing.');
        }
      }
    }
  }

  showFallbackUI() {
    this.container.innerHTML = `
      <div class="bundle-fallback">
        <h3>Bundle Configuration</h3>
        <p>No active bundles found for this product.</p>
        <details>
          <summary>Debug Information</summary>
          <pre>${JSON.stringify({
      config: this.config,
      bundleDataKeys: this.bundleData ? Object.keys(this.bundleData) : 'No data',
      currentProductId: this.config.currentProductId
    }, null, 2)}</pre>
        </details>
      </div>
    `;
  }

  showErrorUI(_error) {
    this.container.innerHTML = `
      <div class="bundle-error">
        <h3>Bundle unavailable</h3>
        <p>We couldn&apos;t load this bundle right now. Please refresh the page or try again later.</p>
        <p>If the problem persists, please contact the store owner.</p>
      </div>
    `;
  }

  async _scheduleLayoutRefresh() {
    const bundleId = this.container.dataset.bundleId;
    if (!bundleId) return;

    const cachedAttr = this.container.dataset.bundleConfig;
    const usedCache = cachedAttr && cachedAttr !== 'null' && cachedAttr !== 'undefined' && cachedAttr.trim() !== '';
    if (!usedCache) return;

    try {
      const apiUrl = `/apps/product-bundles/api/bundle/${encodeURIComponent(bundleId)}.json`;
      const response = await fetch(apiUrl);
      if (!response.ok) return;

      const data = await response.json();
      if (!data?.bundle) return;

      const freshLayout = data.bundle.fullPageLayout || 'footer_bottom';
      const currentLayout = this.selectedBundle?.fullPageLayout || 'footer_bottom';

      if (freshLayout !== currentLayout && this.selectedBundle) {
        this.selectedBundle.fullPageLayout = freshLayout;
        if (this.bundleData?.[bundleId]) {
          this.bundleData[bundleId].fullPageLayout = freshLayout;
        }
        await this.renderSteps();
      }
    } catch (_e) {

    }
  }

  _reportError(error) {
    try {
      const payload = {
        message: error?.message ?? String(error),
        bundleId: this.config?.bundleId ?? null,
        bundleType: this.container?.dataset?.bundleType ?? null,
        shop: window.Shopify?.shop ?? null,
        url: window.location?.href ?? null,
      };

      fetch('/apps/product-bundles/api/widget-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {  });
    } catch (_) {

    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFullPageWidget);
} else {
  initializeFullPageWidget();
}

function initializeFullPageWidget() {
  const containers = document.querySelectorAll('#bundle-builder-app');
  containers.forEach(container => {
    if (!container.dataset.initialized) {
      const bundleType = container.dataset.bundleType || 'full_page';
      if (bundleType === 'full_page') {
        new BundleWidgetFullPage(container);
      }
    }
  });
}

})();