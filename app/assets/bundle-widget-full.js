/**
 * Bundle Widget - Complete Professional Implementation
 * Handles bundle product selection, pricing, and cart operations
 * Supports both cart transform and discount function bundles
 * 
 * @version 3.0.0
 * @author Wolfpack Team
 * 
 */

'use strict';

// ============================================================================
// GLOBAL CONSTANTS AND CONFIGURATION
// ============================================================================

const BUNDLE_WIDGET = {
  VERSION: '3.0.0',
  LOG_PREFIX: '[BUNDLE_WIDGET]',

  // DOM Selectors
  SELECTORS: {
    WIDGET_CONTAINER: '#bundle-builder-app',
    STEPS_CONTAINER: '.bundle-steps',
    MODAL: '#bundle-builder-modal',
    ADD_TO_CART: '.add-bundle-to-cart',
    FOOTER_MESSAGING: '.bundle-footer-messaging'
  },

  // Cart Properties for Bundle Items
  CART_PROPERTIES: {
    BUNDLE_ID: '_bundle_id',
    BUNDLE_CONFIG: '_bundle_config'
  },

  // Bundle Types (Display Modes)
  BUNDLE_TYPES: {
    PRODUCT_PAGE: 'product_page',  // Widget embedded in product page
    FULL_PAGE: 'full_page'         // Dedicated bundle page (future)
  },

  // Step Condition Operators
  CONDITION_OPERATORS: {
    EQUAL_TO: 'equal_to',
    GREATER_THAN: 'greater_than',
    LESS_THAN: 'less_than',
    GREATER_THAN_OR_EQUAL_TO: 'greater_than_or_equal_to',
    LESS_THAN_OR_EQUAL_TO: 'less_than_or_equal_to'
  },

  // Discount Methods
  DISCOUNT_METHODS: {
    PERCENTAGE_OFF: 'percentage_off',
    FIXED_AMOUNT_OFF: 'fixed_amount_off',
    FIXED_BUNDLE_PRICE: 'fixed_bundle_price'
  }
};

// ============================================================================
// CURRENCY MANAGEMENT SYSTEM
// ============================================================================

class CurrencyManager {
  static getShopBaseCurrency() {
    // Shop's base currency - used for calculations
    return {
      code: window.Shopify?.shop?.currency || window.shopCurrency || 'USD',
      format: window.shopMoneyFormat || '{{amount}}'
    };
  }

  static detectCustomerCurrency() {
    // Priority 1: Shopify Markets active currency
    if (window.Shopify?.currency?.active) {
      const currency = {
        code: window.Shopify.currency.active,
        format: window.Shopify.currency.format || window.shopMoneyFormat,
        rate: window.Shopify.currency.rate || 1
      };
      return currency;
    }

    // Priority 2: Currency cookie
    const currencyCookie = this.getCurrencyFromCookie();
    if (currencyCookie) {
      const currency = {
        code: currencyCookie,
        format: window.shopMoneyFormat,
        rate: 1
      };
      return currency;
    }

    // Priority 3: URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const currencyParam = urlParams.get('currency');
    if (currencyParam) {
      const currency = {
        code: currencyParam,
        format: window.shopMoneyFormat,
        rate: 1
      };
      return currency;
    }

    // Priority 4: localStorage
    try {
      const storedCurrency = localStorage.getItem('shopify_currency') || localStorage.getItem('currency');
      if (storedCurrency) {
        const currency = {
          code: storedCurrency,
          format: window.shopMoneyFormat,
          rate: 1
        };
        return currency;
      }
    } catch (e) {
    }

    // Fallback: Shop base currency
    const fallbackCurrency = {
      code: window.shopCurrency || 'USD',
      format: window.shopMoneyFormat,
      rate: 1
    };
    return fallbackCurrency;
  }

  static getCurrencyFromCookie() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'currency' || name === 'shopify_currency') {
        return value;
      }
    }
    return null;
  }

  static convertCurrency(amount, fromCurrency, toCurrency, rate = 1) {
    if (fromCurrency === toCurrency) return amount;

    // Use Shopify's conversion if available
    if (window.Shopify?.currency?.convert) {
      try {
        return window.Shopify.currency.convert(amount, fromCurrency, toCurrency);
      } catch (e) {
      }
    }

    return Math.round(amount * rate);
  }

  static formatMoney(amount, format) {
    if (typeof Shopify !== 'undefined' && window.Shopify.formatMoney) {
      return window.Shopify.formatMoney(amount, format);
    }

    // Fallback formatting
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

    return {
      // For calculations (always use shop's base currency)
      calculation: {
        code: shopBaseCurrency.code,
        symbol: this.getCurrencySymbol(shopBaseCurrency.code),
        format: shopBaseCurrency.format
      },
      // For display (use customer's viewing currency)
      display: {
        code: customerCurrency.code,
        symbol: this.getCurrencySymbol(customerCurrency.code),
        format: customerCurrency.format,
        rate: customerCurrency.rate
      },
      // Multi-currency status
      isMultiCurrency: customerCurrency.code !== shopBaseCurrency.code
    };
  }
}
// ============================================================================
// BUNDLE DATA VALIDATION AND MANAGEMENT
// ============================================================================

class BundleDataManager {
  static validateBundleData(bundle) {
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

    if (bundle.steps.length === 0) {
      return false;
    }

    return true;
  }

  static selectBundle(bundlesData, config) {

    if (!bundlesData || typeof bundlesData !== 'object') {
      return null;
    }

    const bundles = Object.values(bundlesData).filter(bundle =>
      this.validateBundleData(bundle) && bundle.status === 'active'
    );

    if (bundles.length === 0) {
      return null;
    }

    // Selection priority for bundles (both product-page and full-page types)
    for (const bundle of bundles) {
      if (bundle.bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.PRODUCT_PAGE ||
          bundle.bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE) {
        // Priority 1: Manual bundle ID
        if (config.bundleId && bundle.id === config.bundleId) {
          return bundle;
        }

        // Priority 2: Container product bundle ID
        if (config.isContainerProduct && config.containerBundleId && bundle.id === config.containerBundleId) {
          return bundle;
        }

        // Priority 3: Product ID matching
        if (config.currentProductId) {
          const productIdStr = config.currentProductId.toString();
          const productGid = `gid://shopify/Product/${config.currentProductId}`;

          if (bundle.shopifyProductId === productGid || bundle.shopifyProductId === productIdStr) {
            return bundle;
          }

          // Extract numeric ID from GID for comparison
          const bundleProductId = bundle.shopifyProductId ? bundle.shopifyProductId.split('/').pop() : null;
          if (bundleProductId === productIdStr) {
            return bundle;
          }
        }

        // Priority 4: Theme editor context (show any bundle)
        const isThemeEditor = this.isThemeEditorContext();
        if (isThemeEditor) {
          return bundle;
        }
      }
    }

    // Fallback: First active bundle
    const fallbackBundle = bundles[0];
    if (fallbackBundle) {
      return fallbackBundle;
    }
    return null;
  }

  static isThemeEditorContext() {
    return window.isThemeEditorContext ||
      window.location.pathname.includes('/editor') ||
      window.location.search.includes('preview_theme_id') ||
      window.location.search.includes('previewPath') ||
      document.referrer.includes('admin.shopify.com') ||
      window.parent !== window ||
      window.autoDetectedBundleId;
  }

  static extractProductId(productIdString) {
    if (!productIdString) return null;

    // Handle GID format: gid://shopify/Product/123456
    const gidMatch = productIdString.match(/gid:\/\/shopify\/Product\/(\d+)/);
    if (gidMatch) {
      return parseInt(gidMatch[1], 10);
    }

    // Handle numeric string
    const numericId = parseInt(productIdString, 10);
    return isNaN(numericId) ? null : numericId;
  }
}
// ============================================================================
// PRICING AND DISCOUNT CALCULATION ENGINE
// ============================================================================

class PricingCalculator {
  static calculateBundleTotal(selectedProducts, stepProductData) {
    let totalPrice = 0;
    let totalQuantity = 0;

    console.log('[CALCULATE_TOTAL_DEBUG] Starting calculation', {
      selectedProductsLength: selectedProducts.length,
      stepProductDataLength: stepProductData.length,
      step0Length: stepProductData[0]?.length,
      step0FirstProduct: stepProductData[0]?.[0]
    });

    selectedProducts.forEach((stepSelections, stepIndex) => {
      const productsInStep = stepProductData[stepIndex] || [];

      Object.entries(stepSelections).forEach(([variantId, quantity]) => {
        const product = productsInStep.find(p => (p.variantId || p.id) === variantId);

        if (product && quantity > 0) {
          const price = product.price || 0; // Already in cents from processProductsForStep
          totalPrice += price * quantity;
          totalQuantity += quantity;
        }
      });
    });

    console.log('[CALCULATE_TOTAL_DEBUG] Final:', { totalPrice, totalQuantity, step0Data: stepProductData[0] });
    return { totalPrice, totalQuantity };
  }

  static calculateDiscount(bundle, totalPrice, totalQuantity) {
    if (!bundle?.pricing?.enabled || !bundle.pricing.rules?.length) {
      console.log('[DISCOUNT] No pricing enabled or no rules', {
        enabled: bundle?.pricing?.enabled,
        rulesLength: bundle?.pricing?.rules?.length
      });
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

    // Find the best applicable rule using nested structure
    for (const rule of rules) {
      // Access nested condition structure
      const conditionType = rule.condition.type; // 'quantity' or 'amount'
      const conditionOperator = rule.condition.operator; // 'gte', 'gt', 'lte', 'lt', 'eq'
      const conditionValue = rule.condition.value; // threshold

      let conditionMet = false;

      if (conditionType === 'amount') {
        // Amount-based condition (value is in cents)
        conditionMet = this.checkCondition(totalPrice, conditionOperator, conditionValue);
      } else {
        // Quantity-based condition
        conditionMet = this.checkCondition(totalQuantity, conditionOperator, conditionValue);
      }

      if (conditionMet) {
        if (!bestRule || conditionValue > bestRule.condition.value) {
          bestRule = rule;
        }
      }
    }

    if (!bestRule) {
      console.log('[DISCOUNT] No rule matched conditions', {
        totalPrice,
        totalQuantity,
        rulesChecked: rules.length
      });
      return {
        hasDiscount: false,
        discountAmount: 0,
        finalPrice: totalPrice,
        discountPercentage: 0,
        qualifiesForDiscount: false,
        applicableRule: null
      };
    }

    // Calculate discount amount using nested discount structure
    let discountAmount = 0;
    const discountMethod = bestRule.discount.method;
    const discountValue = bestRule.discount.value; // Already in cents for amount methods

    switch (discountMethod) {
      case BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF:
        // discountValue is percentage (e.g., 50 for 50%)
        discountAmount = Math.round(totalPrice * (discountValue / 100));
        break;
      case BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_AMOUNT_OFF:
        // discountValue is already in cents
        discountAmount = discountValue;
        break;
      case BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_BUNDLE_PRICE:
        // discountValue is fixed bundle price in cents
        discountAmount = Math.max(0, totalPrice - discountValue);
        break;
      default:
        discountAmount = 0;
    }

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

    console.log('[DISCOUNT] Calculated discount:', {
      hasDiscount: result.hasDiscount,
      discountAmount: result.discountAmount,
      finalPrice: result.finalPrice,
      originalPrice: totalPrice,
      discountPercentage: result.discountPercentage.toFixed(2) + '%',
      method: discountMethod
    });

    return result;
  }

  static checkCondition(value, condition, targetValue) {
    // Handle different condition formats
    const normalizedCondition = this.normalizeCondition(condition);

    switch (normalizedCondition) {
      case BUNDLE_WIDGET.CONDITION_OPERATORS.EQUAL_TO:
        return value === targetValue;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN:
        return value > targetValue;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN:
        return value < targetValue;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL_TO:
        return value >= targetValue;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN_OR_EQUAL_TO:
        return value <= targetValue;
      default:
        // Default to >= for backward compatibility
        return value >= targetValue;
    }
  }

  static normalizeCondition(condition) {
    // Handle different condition formats from admin
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

    // Sort rules by condition value (ascending)
    const rules = bundle.pricing.rules.sort((a, b) => a.condition.value - b.condition.value);

    for (const rule of rules) {
      const conditionType = rule.condition.type;
      const conditionOperator = rule.condition.operator;
      const conditionValue = rule.condition.value;

      // Check if this rule is not yet satisfied
      let isRuleSatisfied = false;

      if (conditionType === 'amount') {
        isRuleSatisfied = this.checkCondition(currentAmount, conditionOperator, conditionValue);
      } else {
        isRuleSatisfied = this.checkCondition(currentQuantity, conditionOperator, conditionValue);
      }

      // Return the first rule that is not satisfied (next target)
      if (!isRuleSatisfied) {
        return rule;
      }
    }
    return null; // All rules satisfied
  }
}
// ============================================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================================

class ToastManager {
  static show(message, type = 'info', duration = 4000) {
    // Remove any existing toast
    const existingToast = document.getElementById('bundle-toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.id = 'bundle-toast';
    toast.className = `bundle-toast bundle-toast-${type}`;
    toast.innerHTML = `
      <div class="bundle-toast-content">
        <span class="bundle-toast-message">${message}</span>
        <button class="bundle-toast-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
      </div>
    `;

    // Add CSS styles if not already present
    this.ensureStyles();

    // Add to page
    document.body.appendChild(toast);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, duration);
    }
  }

  static ensureStyles() {
    if (document.getElementById('bundle-toast-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'bundle-toast-styles';
    styles.textContent = `
      .bundle-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000001;
        max-width: 400px;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        animation: slideInRight 0.3s ease-out;
      }
      .bundle-toast-info {
        background-color: #f0f8ff;
        border-left: 4px solid #007ace;
        color: #003d82;
      }
      .bundle-toast-warning {
        background-color: #fff8e1;
        border-left: 4px solid #ff9800;
        color: #e65100;
      }
      .bundle-toast-error {
        background-color: #ffebee;
        border-left: 4px solid #f44336;
        color: #c62828;
      }
      .bundle-toast-success {
        background-color: #e8f5e8;
        border-left: 4px solid #4caf50;
        color: #2e7d32;
      }
      .bundle-toast-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }
      .bundle-toast-message {
        flex: 1;
      }
      .bundle-toast-close {
        background: none;
        border: none;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        opacity: 0.7;
      }
      .bundle-toast-close:hover {
        opacity: 1;
      }
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(styles);
  }
}

// ============================================================================
// TEMPLATE VARIABLE REPLACEMENT SYSTEM
// ============================================================================

class TemplateManager {
  static replaceVariables(template, variables) {
    if (!template) return '';

    let result = template;

    // Replace variables with both single and double curly braces
    Object.entries(variables).forEach(([key, value]) => {
      const singleBrace = new RegExp(`\\{${key}\\}`, 'g');
      const doubleBrace = new RegExp(`\\{\\{${key}\\}\\}`, 'g');

      result = result.replace(singleBrace, value);
      result = result.replace(doubleBrace, value);
    });
    return result;
  }

  static createDiscountVariables(bundle, totalPrice, totalQuantity, discountInfo, currencyInfo) {
    const nextRule = PricingCalculator.getNextDiscountRule(bundle, totalQuantity, totalPrice);
    const ruleToUse = discountInfo.applicableRule || nextRule;

    if (!ruleToUse) {
      return this.createEmptyVariables(bundle, totalPrice, totalQuantity, discountInfo, currencyInfo);
    }

    // Extract rule data using nested structure
    const conditionType = ruleToUse.condition.type;
    const targetValue = ruleToUse.condition.value;
    const discountMethod = ruleToUse.discount.method;
    const rawDiscountValue = ruleToUse.discount.value;

    // Calculate condition-specific values
    const conditionData = this.calculateConditionData(conditionType, targetValue, totalPrice, totalQuantity, currencyInfo);

    // Calculate discount-specific values  
    const discountData = this.calculateDiscountData(discountMethod, rawDiscountValue, currencyInfo);

    // Calculate progress
    const currentProgress = conditionType === 'amount' ? totalPrice : totalQuantity;
    const progressPercentage = targetValue > 0 ? Math.min(100, (currentProgress / targetValue) * 100) : 0;

    const variables = {
      // Condition-specific variables
      amountNeeded: conditionData.amountNeeded,
      itemsNeeded: conditionData.itemsNeeded,
      conditionText: conditionData.conditionText,

      // Discount-specific variables
      discountText: discountData.discountText,

      // Qualification status
      alreadyQualified: conditionData.alreadyQualified || false,

      // Progress variables
      currentAmount: CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format),
      currentQuantity: totalQuantity.toString(),
      targetAmount: conditionType === 'amount' ? CurrencyManager.formatMoney(targetValue, currencyInfo.display.format) : '0',
      targetQuantity: conditionType === 'quantity' ? targetValue.toString() : '0',
      progressPercentage: Math.round(progressPercentage).toString(),

      // Bundle information
      bundleName: bundle.name || 'Bundle',

      // Pricing information
      originalPrice: CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format),
      finalPrice: CurrencyManager.formatMoney(discountInfo.finalPrice, currencyInfo.display.format),
      savingsAmount: CurrencyManager.formatMoney(discountInfo.discountAmount, currencyInfo.display.format),
      savingsPercentage: Math.round(discountInfo.discountPercentage).toString(),

      // Currency information
      currencySymbol: currencyInfo.display.symbol,
      currencyCode: currencyInfo.display.code,

      // Status
      isQualified: discountInfo.qualifiesForDiscount ? 'true' : 'false'
    };

    return variables;
  }

  static calculateConditionData(conditionType, targetValue, totalPrice, totalQuantity, currencyInfo) {
    if (conditionType === 'amount') {
      // Amount-based condition - targetValue is already in cents
      const amountNeeded = Math.max(0, targetValue - totalPrice);

      // Convert for display if needed
      const convertedAmountNeeded = CurrencyManager.convertCurrency(
        amountNeeded,
        currencyInfo.calculation.code,
        currencyInfo.display.code,
        currencyInfo.display.rate
      );

      // Format for display (convert from cents to decimal)
      const amountNeededFormatted = (convertedAmountNeeded / 100).toFixed(2);
      const targetValueFormatted = CurrencyManager.convertCurrency(
        targetValue,
        currencyInfo.calculation.code,
        currencyInfo.display.code,
        currencyInfo.display.rate
      );
      const targetValueFormattedDecimal = (targetValueFormatted / 100).toFixed(2);

      // Check if already qualified (amount needed is 0)
      const alreadyQualified = amountNeeded <= 0;

      return {
        amountNeeded: amountNeededFormatted,
        itemsNeeded: '0',
        conditionText: alreadyQualified ?
          `${currencyInfo.display.symbol}${targetValueFormattedDecimal} minimum met` :
          `${currencyInfo.display.symbol}${amountNeededFormatted}`,
        alreadyQualified
      };
    } else {
      // Quantity-based condition
      const itemsNeeded = Math.max(0, targetValue - totalQuantity);

      // Check if already qualified (items needed is 0)
      const alreadyQualified = itemsNeeded <= 0;

      return {
        amountNeeded: '0',
        itemsNeeded: itemsNeeded.toString(),
        conditionText: alreadyQualified ?
          `${targetValue} ${targetValue === 1 ? 'item' : 'items'} minimum met` :
          `${itemsNeeded} ${itemsNeeded === 1 ? 'item' : 'items'}`,
        alreadyQualified
      };
    }
  }

  static calculateDiscountData(discountMethod, rawDiscountValue, currencyInfo) {
    // Add safety check for undefined/null values
    const safeValue = parseFloat(rawDiscountValue) || 0;

    switch (discountMethod) {
      case BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF:
        const percentage = Math.round(safeValue);
        return {
          discountText: `${percentage}% off`
        };

      case BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_AMOUNT_OFF:
        // safeValue is already in cents
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
        // safeValue is already in cents
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
      // Condition-specific variables
      amountNeeded: '0',
      itemsNeeded: '0',
      conditionText: '0 items',
      discountText: 'No discount',

      // Progress variables
      currentAmount: CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format),
      currentQuantity: totalQuantity.toString(),
      targetAmount: '0',
      targetQuantity: '0',
      progressPercentage: '0',

      // Bundle information
      bundleName: bundle.name || 'Bundle',

      // Pricing information
      originalPrice: CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format),
      finalPrice: CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format),
      savingsAmount: '0',
      savingsPercentage: '0',

      // Currency information
      currencySymbol: currencyInfo.display.symbol,
      currencyCode: currencyInfo.display.code,

      // Status
      isQualified: 'false'
    };
  }
}
// ============================================================================
// MAIN BUNDLE WIDGET CLASS
// ============================================================================

class BundleWidget {
  constructor(containerElement) {
    this.container = containerElement;
    this.selectedBundle = null;
    this.selectedProducts = [];
    this.stepProductData = [];
    this.currentStepIndex = 0;
    this.isInitialized = false;
    this.config = {};
    this.elements = {};

    // Call async init but don't block constructor
    this.init().catch(error => {
      console.error('[WIDGET_INIT] ❌ Initialization failed:', error);
      this.showError(error.message);
    });
  }

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  async init() {
    try {
      // Check if already initialized
      if (this.container.dataset.initialized === 'true') {
        return;
      }

      // Parse configuration
      this.parseConfiguration();

      // Load design settings CSS
      await this.loadDesignSettingsCSS();

      // Load and validate bundle data
      await this.loadBundleData();

      // Select appropriate bundle
      this.selectBundle();

      if (!this.selectedBundle) {
        this.showFallbackUI();
        return;
      }

      // Initialize data structures
      this.initializeDataStructures();

      // Setup DOM elements
      this.setupDOMElements();

      // Render initial UI
      this.renderUI();

      // Attach event listeners
      this.attachEventListeners();

      // Mark as initialized
      this.container.dataset.initialized = 'true';
      this.isInitialized = true;

    } catch (error) {
      this.showErrorUI(error);
    }
  }

  /**
   * Load Design Control Panel CSS settings
   * Injects custom CSS from Design Control Panel into the page
   */
  async loadDesignSettingsCSS() {
    try {
      // Get shop domain from bundle data or window
      const shopDomain = window.Shopify?.shop || this.container.dataset.shop;

      if (!shopDomain) {
        console.warn('[BUNDLE_WIDGET] No shop domain found, skipping design settings');
        return;
      }

      // CSS is loaded by the small loader (bundle-widget.js) for better performance
      // No need to load it here - just verify it's present
      const existingLink = document.querySelector('link[href*="design-settings"]');
      if (existingLink) {
        console.log('[BUNDLE_WIDGET] ✅ Design CSS already loaded by loader script');
      } else {
        console.warn('[BUNDLE_WIDGET] ⚠️ Design CSS not found - loader script may have failed');
      }

    } catch (error) {
      console.warn('[BUNDLE_WIDGET] Failed to load design settings CSS:', error);
      // Don't throw - widget should work even if design CSS fails to load
    }
  }

  parseConfiguration() {
    const dataset = this.container.dataset;

    this.config = {
      bundleId: dataset.bundleId || null,
      isContainerProduct: dataset.isContainerProduct === 'true',
      containerBundleId: dataset.containerBundleId || null,
      hideDefaultButtons: dataset.hideDefaultButtons === 'true',
      showTitle: dataset.showTitle !== 'false',
      showStepNumbers: dataset.showStepNumbers !== 'false',
      showFooterMessaging: dataset.showFooterMessaging !== 'false',
      discountTextTemplate: this.normalizeDiscountTemplate(dataset.discountTextTemplate),
      successMessageTemplate: this.normalizeSuccessTemplate(dataset.successMessageTemplate),
      progressTextTemplate: dataset.progressTextTemplate || '{currentQuantity} / {targetQuantity} items',
      currentProductId: window.currentProductId,
      currentProductHandle: window.currentProductHandle,
      currentProductCollections: window.currentProductCollections
    };
  }

  normalizeDiscountTemplate(template) {
    // Professional template normalization with comprehensive old variable detection
    const modernTemplate = 'Add {conditionText} to get {discountText}';

    // If no template provided, use modern default
    if (!template) {
      return modernTemplate;
    }

    // Detect old variable patterns and normalize to modern format
    const oldVariablePatterns = [
      'discountConditionDiff',
      'discountUnit',
      'discountValue',
      'discountValueUnit'
    ];

    const hasOldVariables = oldVariablePatterns.some(pattern => template.includes(pattern));

    if (hasOldVariables) {
      return modernTemplate;
    }

    // Template is already modern, return as-is
    return template;
  }

  normalizeSuccessTemplate(template) {
    // Use template as-is, or fall back to modern default
    const modernTemplate = 'Congratulations! You got {discountText}!';

    if (!template || template.trim() === '') {
      return modernTemplate;
    }

    // Return the template without modification - let merchants control the message
    return template;
  }

  async loadBundleData() {
    let bundleData = null;

    // Single source: data-bundle-config attribute (from product metafield)
    const configValue = this.container.dataset.bundleConfig;
    if (configValue && configValue.trim() !== '' && configValue !== 'null' && configValue !== 'undefined') {
      try {
        const singleBundle = JSON.parse(configValue);
        // Validate parsed result is a valid object with an id
        if (singleBundle && typeof singleBundle === 'object' && singleBundle.id) {
          bundleData = { [singleBundle.id]: singleBundle };
          console.log('[WIDGET_INIT] ✅ Loaded bundle data from data-bundle-config:', singleBundle.id);
        } else {
          console.warn('[WIDGET_INIT] ⚠️ Parsed bundle config is invalid (missing id):', singleBundle);
        }
      } catch (error) {
        console.error('[WIDGET_INIT] ❌ Failed to parse data-bundle-config:', error, 'Value:', configValue.substring(0, 100));
      }
    } else {
      console.warn('[WIDGET_INIT] ⚠️ data-bundle-config is empty, null, or undefined:', configValue);
    }

    // Widget only works on container products with bundleConfig metafield
    if (!bundleData || (typeof bundleData === 'object' && Object.keys(bundleData).length === 0)) {
      // Check if we're in theme editor mode
      const isThemeEditor = window.Shopify?.designMode ||
                           window.isThemeEditorContext ||
                           window.location.pathname.includes('/editor') ||
                           window.location.search.includes('preview_theme_id');

      const bundleIdFromDataset = this.container.dataset.bundleId;

      // Show helpful preview in theme editor instead of error
      if (isThemeEditor && bundleIdFromDataset) {
        console.log('[WIDGET_INIT] 🎨 Theme editor preview mode - showing placeholder');
        this.showThemeEditorPreview(bundleIdFromDataset);
        return; // Don't throw error, just show preview
      }

      // For production/storefront: show proper error
      const errorMsg = 'This widget can only be used on bundle container products. Please ensure:\n1. This product is a bundle container product\n2. Bundle has been saved and published\n3. Product has bundleConfig metafield set';
      console.error('[WIDGET_INIT] ❌', errorMsg);
      console.error('[WIDGET_INIT] 🔍 Debug info:', {
        isContainerProduct: !!configValue,
        configValue: configValue?.substring(0, 100),
        containerDataset: this.container.dataset,
        bundleIdFromDataset: bundleIdFromDataset
      });
      throw new Error(errorMsg);
    }

    this.bundleData = bundleData;
    console.log('[WIDGET_INIT] ✅ Bundle data loaded successfully from container product metafield');
  }

  selectBundle() {
    this.selectedBundle = BundleDataManager.selectBundle(this.bundleData, this.config);
  }

  initializeDataStructures() {
    const stepsCount = this.selectedBundle.steps.length;

    // Initialize selected products array (one object per step)
    this.selectedProducts = Array(stepsCount).fill(null).map(() => ({}));

    // Initialize step product data cache
    this.stepProductData = Array(stepsCount).fill(null).map(() => ([]));
  }

  /**
   * Show a helpful preview in theme editor when testing on non-bundle products
   */
  showThemeEditorPreview(bundleId) {
    console.log('[WIDGET_PREVIEW] Showing theme editor preview for bundle:', bundleId);

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

  // ========================================================================
  // DOM SETUP
  // ========================================================================

  setupDOMElements() {
    // Get or create main UI elements
    this.elements = {
      header: this.container.querySelector('.bundle-header') || this.createHeader(),
      stepsContainer: this.container.querySelector('.bundle-steps') || this.createStepsContainer(),
      footer: this.container.querySelector('.bundle-footer-messaging') || this.createFooter(),
      addToCartButton: this.container.querySelector('.add-bundle-to-cart') || this.createAddToCartButton(),
      modal: this.ensureModal()
    };

    // Append elements if they were created
    if (!this.container.querySelector('.bundle-header')) {
      this.container.appendChild(this.elements.header);
    }
    if (!this.container.querySelector('.bundle-steps')) {
      this.container.appendChild(this.elements.stepsContainer);
    }
    if (!this.container.querySelector('.bundle-footer-messaging')) {
      this.container.appendChild(this.elements.footer);
    }
    if (!this.container.querySelector('.add-bundle-to-cart')) {
      this.container.appendChild(this.elements.addToCartButton);
    }
  }

  createHeader() {
    const header = document.createElement('div');
    header.className = 'bundle-header';
    header.innerHTML = `
      <h2 class="bundle-title">${this.selectedBundle.name}</h2>
      ${this.selectedBundle.description ? `<p class="bundle-description">${this.selectedBundle.description}</p>` : ''}
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
      <div class="footer-progress-container">
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
        <div class="progress-details">
          <span class="progress-text">
            <span class="current-quantity">0</span> / <span class="target-quantity">0</span>
          </span>
        </div>
      </div>
    `;
    return footer;
  }

  createAddToCartButton() {
    const button = document.createElement('button');
    button.className = 'add-bundle-to-cart';
    button.textContent = 'Add Bundle to Cart';
    button.type = 'button';
    return button;
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
            <div class="modal-step-subtitle"></div>
            <div class="modal-tabs"></div>
            <span class="close-button">&times;</span>
          </div>
          <div class="modal-body">
            <div class="product-grid"></div>
          </div>
          <div class="modal-footer">
            <button class="modal-nav-button prev-button">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Prev
            </button>
            <div class="modal-footer-discount-messaging">
              <div class="modal-footer-progress-wrapper">
                <div class="modal-footer-progress-bar">
                  <div class="modal-footer-progress-fill"></div>
                </div>
              </div>
              <div class="modal-footer-discount-text"></div>
            </div>
            <button class="modal-nav-button next-button">
              Next
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
    }

    return modal;
  }
  //========================================================================
  // UI RENDERING
  // ========================================================================

  renderUI() {
    this.renderHeader();
    this.renderSteps();
    this.renderFooter();
    this.updateAddToCartButton();
  }

  renderHeader() {
    if (!this.config.showTitle) {
      this.elements.header.style.display = 'none';
      return;
    }

    this.elements.header.style.display = 'block';
  }

  renderSteps() {
    // Clear existing steps
    this.elements.stepsContainer.innerHTML = '';

    if (!this.selectedBundle || !this.selectedBundle.steps) {
      return;
    }

    this.selectedBundle.steps.forEach((step, index) => {
      const stepElement = this.createStepElement(step, index);
      this.elements.stepsContainer.appendChild(stepElement);
    });
  }

  createStepElement(step, index) {
    const stepBox = document.createElement('div');
    stepBox.className = 'step-box';
    stepBox.dataset.stepIndex = index;

    const selectedProducts = this.selectedProducts[index] || {};
    const hasSelections = Object.values(selectedProducts).some(qty => qty > 0);

    if (hasSelections) {
      stepBox.classList.add('step-completed');

      // Show product images if available
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

        // Add count badge if more than 4 products
        const totalQuantity = Object.values(selectedProducts).reduce((sum, qty) => sum + qty, 0);
        if (productImages.length > 4 || totalQuantity > 4) {
          const countBadge = document.createElement('div');
          countBadge.className = 'image-count-badge';
          countBadge.textContent = totalQuantity.toString();
          stepBox.appendChild(countBadge);
        }
      } else {
        // Fallback checkmark icon
        const checkIcon = document.createElement('span');
        checkIcon.className = 'check-icon';
        checkIcon.textContent = '✓';
        stepBox.appendChild(checkIcon);
      }
    } else {
      // Plus icon for empty steps
      const plusIcon = document.createElement('span');
      plusIcon.className = 'plus-icon';
      plusIcon.textContent = '+';
      stepBox.appendChild(plusIcon);
    }

    // Add step name
    const stepName = document.createElement('p');
    stepName.className = 'step-name';
    if (this.config.showStepNumbers) {
      stepName.textContent = `${index + 1}. ${step.name || `Step ${index + 1}`}`;
    } else {
      stepName.textContent = step.name || `Step ${index + 1}`;
    }
    stepBox.appendChild(stepName);

    // Add selection count
    const selectionCount = document.createElement('div');
    selectionCount.className = 'step-selection-count';
    selectionCount.textContent = this.getStepSelectionText(selectedProducts);
    stepBox.appendChild(selectionCount);

    // Add click handler
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

  renderFooter() {
    if (!this.config.showFooterMessaging) {
      this.elements.footer.style.display = 'none';
      return;
    }

    this.updateFooterMessaging();
    this.elements.footer.style.display = 'block';
  }

  updateFooterMessaging() {
    // Check if discount is enabled before showing messaging
    if (!this.selectedBundle?.pricing?.enabled) {
      this.elements.footer.style.display = 'none';
      return;
    }

    const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData
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
    const progressFill = this.elements.footer.querySelector('.progress-fill');
    const currentQuantitySpan = this.elements.footer.querySelector('.current-quantity');
    const targetQuantitySpan = this.elements.footer.querySelector('.target-quantity');

    if (discountInfo.qualifiesForDiscount) {
      // Success message
      const successMessage = TemplateManager.replaceVariables(
        this.config.successMessageTemplate,
        variables
      );
      footerDiscountText.innerHTML = successMessage;
      this.elements.footer.classList.add('qualified');
    } else {
      // Progress message
      const progressMessage = TemplateManager.replaceVariables(
        this.config.discountTextTemplate,
        variables
      );
      footerDiscountText.innerHTML = progressMessage;
      this.elements.footer.classList.remove('qualified');
    }

    // Update progress bar based on condition type
    const nextRule = PricingCalculator.getNextDiscountRule(this.selectedBundle, totalQuantity, totalPrice);
    const ruleToUse = discountInfo.applicableRule || nextRule;

    let progressPercentage = 0;

    if (ruleToUse) {
      const conditionType = ruleToUse.condition?.type || 'quantity';
      const targetValue = ruleToUse.condition?.value || 0;

      if (conditionType === 'amount') {
        // Amount-based condition
        progressPercentage = targetValue > 0 ? Math.min(100, (totalPrice / targetValue) * 100) : 0;

        // Update text to show formatted currency values
        if (currentQuantitySpan && targetQuantitySpan) {
          const currentFormatted = CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format);
          const targetFormatted = CurrencyManager.formatMoney(targetValue, currencyInfo.display.format);
          currentQuantitySpan.textContent = currentFormatted;
          targetQuantitySpan.textContent = targetFormatted; // No "items" suffix for amount
        }
      } else {
        // Quantity-based condition
        progressPercentage = targetValue > 0 ? Math.min(100, (totalQuantity / targetValue) * 100) : 0;

        // Update text to show quantity values
        if (currentQuantitySpan && targetQuantitySpan) {
          currentQuantitySpan.textContent = totalQuantity.toString();
          targetQuantitySpan.textContent = targetValue.toString(); // Remove "items" suffix, add via CSS
        }
      }
    }

    console.log('[PROGRESS] Progress:', progressPercentage + '%', 'Total:', totalPrice, 'Target:', ruleToUse?.condition?.value);

    if (progressFill) {
      progressFill.style.width = `${progressPercentage}%`;
    }
  }

  updateAddToCartButton() {
    const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData
    );

    const discountInfo = PricingCalculator.calculateDiscount(
      this.selectedBundle,
      totalPrice,
      totalQuantity
    );

    const button = this.elements.addToCartButton;

    // Check if all steps are complete (required)
    const allStepsValid = this.selectedBundle.steps.every((_, index) => this.validateStep(index));

    // Disable button if no products selected OR if not all steps are complete
    if (totalQuantity === 0 || !allStepsValid) {
      if (totalQuantity === 0) {
        button.textContent = 'Add Bundle to Cart';
      } else {
        // Some products selected but not all steps complete
        button.textContent = 'Complete All Steps to Continue';
      }
      button.disabled = true;
      button.classList.add('disabled');
    } else {
      // All steps valid and products selected - enable button
      const currencyInfo = CurrencyManager.getCurrencyInfo();
      const formattedPrice = CurrencyManager.formatMoney(discountInfo.finalPrice, currencyInfo.display.format);

      console.log('[ADD_TO_CART_BUTTON] Discount info:', {
        hasDiscount: discountInfo.hasDiscount,
        showDiscountDisplay: this.selectedBundle.pricing?.messages?.showDiscountDisplay,
        shouldShowStrikethrough: discountInfo.hasDiscount && this.selectedBundle.pricing?.messages?.showDiscountDisplay !== false
      });

      if (discountInfo.hasDiscount && this.selectedBundle.pricing?.messages?.showDiscountDisplay !== false) {
        const originalPrice = CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format);
        console.log('[ADD_TO_CART_BUTTON] Showing strikethrough:', { originalPrice, discountedPrice: formattedPrice });
        button.innerHTML = `
          <span class="button-price-wrapper">
            <span class="button-price-strike">${originalPrice}</span>
            <span class="button-price-final">Add Bundle to Cart • ${formattedPrice}</span>
          </span>
        `;
      } else {
        console.log('[ADD_TO_CART_BUTTON] No strikethrough shown');
        button.textContent = `Add Bundle to Cart • ${formattedPrice}`;
      }

      button.disabled = false;
      button.classList.remove('disabled');
    }
  }
  // ========================================================================
  // MODAL FUNCTIONALITY
  // ========================================================================

  openModal(stepIndex) {
    this.currentStepIndex = stepIndex;
    const step = this.selectedBundle.steps[stepIndex];

    // Update modal header
    const modal = this.elements.modal;
    modal.querySelector('.modal-step-title').textContent = step.name;
    modal.querySelector('.modal-step-subtitle').textContent = `Step ${stepIndex + 1} of ${this.selectedBundle.steps.length}`;

    // Load and render products for this step
    this.loadStepProducts(stepIndex).then(() => {
      this.renderModalTabs();
      this.renderModalProducts(stepIndex);
      this.updateModalNavigation();
      this.updateModalFooterMessaging();

      // Show modal
      modal.style.display = 'block';
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }).catch(error => {
      ToastManager.show('Failed to load products for this step', 'error');
    });
  }

  closeModal() {
    this.elements.modal.style.display = 'none';
    this.elements.modal.classList.remove('active');
    document.body.style.overflow = '';

    // Update main UI
    this.renderSteps();
    this.updateAddToCartButton();
    this.updateFooterMessaging();
  }

  async loadStepProducts(stepIndex) {
    const step = this.selectedBundle.steps[stepIndex];

    if (this.stepProductData[stepIndex].length > 0) {
      return;
    }

    console.log('[LOAD_PRODUCTS] Step data:', {
      stepIndex,
      hasProducts: !!step.products,
      productsLength: step.products?.length,
      hasStepProduct: !!step.StepProduct,
      stepProductLength: step.StepProduct?.length,
      hasCollections: !!step.collections,
      collectionsLength: step.collections?.length,
      fullStep: step
    });

    let allProducts = [];

    // Process explicit products - fetch using Storefront API via our backend
    if (step.products && Array.isArray(step.products) && step.products.length > 0) {
      const productIds = step.products.map(p => p.id); // Keep full GID format
      const shop = window.Shopify?.shop || window.location.host;

      // Get app URL from widget data attribute or window global
      const appUrl = window.__BUNDLE_APP_URL__ || '';
      const apiBaseUrl = appUrl || window.location.origin;

      console.log('[LOAD_PRODUCTS] Fetching products from Storefront API. IDs:', productIds);
      console.log('[LOAD_PRODUCTS] Using API base URL:', apiBaseUrl);

      try {
        const response = await fetch(`${apiBaseUrl}/api/storefront-products?ids=${encodeURIComponent(productIds.join(','))}&shop=${encodeURIComponent(shop)}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[LOAD_PRODUCTS] API request failed:', response.status, errorText);
          return;
        }

        const data = await response.json();
        console.log('[LOAD_PRODUCTS] API response:', data);

        if (data.products && data.products.length > 0) {
          allProducts = allProducts.concat(data.products);
          console.log('[LOAD_PRODUCTS] Added', data.products.length, 'products');
        } else {
          console.warn('[LOAD_PRODUCTS] No products returned');
        }
      } catch (error) {
        console.error('[LOAD_PRODUCTS] Error fetching products:', error);
      }
    }

    if (step.StepProduct && Array.isArray(step.StepProduct) && step.StepProduct.length > 0) {
      const productGids = step.StepProduct.map(sp => sp.productId).filter(Boolean);
      const shop = window.Shopify?.shop || window.location.host;

      if (productGids.length > 0) {
        console.log('[LOAD_PRODUCTS] Fetching StepProduct data. IDs:', productGids);

        // Get app URL (same as above)
        const appUrl = window.__BUNDLE_APP_URL__ || '';
        const apiBaseUrl = appUrl || window.location.origin;

        try {
          const response = await fetch(`${apiBaseUrl}/api/storefront-products?ids=${encodeURIComponent(productGids.join(','))}&shop=${encodeURIComponent(shop)}`);

          if (!response.ok) {
            console.error('[LOAD_PRODUCTS] API request failed for StepProduct:', response.status);
          } else {
            const data = await response.json();
            if (data.products && data.products.length > 0) {
              allProducts = allProducts.concat(data.products);
              console.log('[LOAD_PRODUCTS] Added', data.products.length, 'StepProducts');
            }
          }
        } catch (error) {
          console.error('[LOAD_PRODUCTS] Error fetching StepProduct:', error);
        }
      }
    }

    // Process collection products using Storefront API (not legacy REST endpoint)
    if (step.collections && Array.isArray(step.collections) && step.collections.length > 0) {
      const collectionHandles = step.collections
        .map(c => c.handle)
        .filter(Boolean);

      if (collectionHandles.length > 0) {
        const shop = window.Shopify?.shop || window.location.host;
        const appUrl = window.__BUNDLE_APP_URL__ || '';
        const apiBaseUrl = appUrl || window.location.origin;

        console.log('[LOAD_PRODUCTS] Fetching products from collections via Storefront API:', collectionHandles);

        try {
          const response = await fetch(
            `${apiBaseUrl}/api/storefront-collections?handles=${encodeURIComponent(collectionHandles.join(','))}&shop=${encodeURIComponent(shop)}`
          );

          if (response.ok) {
            const data = await response.json();
            if (data.products && data.products.length > 0) {
              allProducts = allProducts.concat(data.products);
              console.log('[LOAD_PRODUCTS] Added', data.products.length, 'products from collections');
            }
          } else {
            console.error('[LOAD_PRODUCTS] Failed to fetch collection products:', response.status);
          }
        } catch (error) {
          console.error('[LOAD_PRODUCTS] Error fetching collection products:', error);
        }
      }
    }

    // Process and normalize product data
    console.log('[LOAD_PRODUCTS] Raw products for step', stepIndex, ':', allProducts.length, 'products');
    console.log('[LOAD_PRODUCTS] First product sample:', allProducts[0]);

    const processedProducts = this.processProductsForStep(allProducts, step);

    console.log('[LOAD_PRODUCTS] Processed products:', processedProducts.length);
    console.log('[LOAD_PRODUCTS] First processed:', processedProducts[0]);

    // Remove duplicates
    const seen = new Set();
    this.stepProductData[stepIndex] = processedProducts.filter(product => {
      const key = product.variantId || product.id;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    console.log('[LOAD_PRODUCTS] Final stepProductData[' + stepIndex + ']:', this.stepProductData[stepIndex]);
  }

  processProductsForStep(products, step) {
    return products.flatMap(product => {
      if (step.displayVariantsAsIndividual && product.variants && product.variants.length > 0) {
        // Display each variant as separate product - filter out unavailable variants
        return product.variants
          .filter(variant => variant.available === true) // Only show available variants
          .map(variant => {
            // Storefront API: prioritize variant image, fallback to product featured image
            const imageUrl = variant?.image?.src || product.imageUrl || 'https://via.placeholder.com/150';

            return {
              id: this.extractId(variant.id),
              title: `${product.title} - ${variant.title}`,
              imageUrl,
              price: parseFloat(variant.price || '0') * 100,
              variantId: this.extractId(variant.id),
              available: variant.available === true // Store availability (always boolean)
            };
          });
      } else {
        // Display product with default variant - check availability
        const defaultVariant = product.variants?.[0];

        // Skip product if default variant is not available
        if (defaultVariant && defaultVariant.available !== true) {
          return [];
        }

        // Storefront API: prioritize variant image, fallback to product featured image
        const imageUrl = defaultVariant?.image?.src || product.imageUrl || 'https://via.placeholder.com/150';

        return [{
          id: this.extractId(defaultVariant?.id || product.id),
          title: product.title,
          imageUrl,
          price: defaultVariant ? parseFloat(defaultVariant.price || '0') * 100 : 0,
          variantId: this.extractId(defaultVariant?.id || product.id),
          available: defaultVariant?.available === true // Store availability (always boolean from API)
        }];
      }
    });
  }

  extractId(idString) {
    if (!idString) return null;

    // Handle GID format
    const gidMatch = idString.toString().match(/gid:\/\/shopify\/\w+\/(\d+)/);
    if (gidMatch) {
      return gidMatch[1];
    }

    // Handle numeric string
    return idString.toString().split('/').pop();
  }

  renderModalTabs() {
    const tabsContainer = this.elements.modal.querySelector('.modal-tabs');
    tabsContainer.innerHTML = '';

    this.selectedBundle.steps.forEach((step, index) => {
      const stepContainer = document.createElement('div');
      stepContainer.className = 'milestone-step-container';

      const stepTotalQuantity = Object.values(this.selectedProducts[index]).reduce((sum, qty) => sum + qty, 0);
      const isStepCompleted = this.validateStep(index);
      const isStepStarted = stepTotalQuantity > 0;
      const isAccessible = this.isStepAccessible(index);

      stepContainer.innerHTML = `
        <div class="milestone-step ${index === this.currentStepIndex ? 'active' : ''} ${isStepCompleted ? 'completed' : ''} ${isStepStarted && !isStepCompleted ? 'in-progress' : ''} ${!isAccessible ? 'locked' : ''}">
          <div class="milestone-circle">
            <span class="milestone-number">${isStepCompleted ? '✓' : index + 1}</span>
          </div>
          <div class="milestone-label">${step.name || `Step ${index + 1}`}</div>
        </div>
        ${index < this.selectedBundle.steps.length - 1 ? `<div class="milestone-connector ${isStepCompleted ? 'completed' : (isStepStarted ? 'in-progress' : '')}"></div>` : ''}
      `;

      stepContainer.dataset.stepIndex = index.toString();

      // Click handler
      const stepElement = stepContainer.querySelector('.milestone-step');
      stepElement.addEventListener('click', async () => {
        if (!isAccessible) {
          ToastManager.show('Please complete the previous steps first.', 'warning');
          return;
        }

        this.currentStepIndex = index;

        // Update modal header
        this.elements.modal.querySelector('.modal-step-title').textContent = step.name;
        this.elements.modal.querySelector('.modal-step-subtitle').textContent = `Step ${index + 1} of ${this.selectedBundle.steps.length}`;

        // Load products for this step if not already loaded
        await this.loadStepProducts(index);

        // Re-render everything
        this.renderModalTabs();
        this.renderModalProducts(index);
        this.updateModalNavigation();
        this.updateModalFooterMessaging();
      });

      tabsContainer.appendChild(stepContainer);
    });
  }

  renderModalProducts(stepIndex) {
    const products = this.stepProductData[stepIndex];
    const selectedProducts = this.selectedProducts[stepIndex];
    const productGrid = this.elements.modal.querySelector('.product-grid');

    if (products.length === 0) {
      productGrid.innerHTML = '<p style="text-align: center; padding: 20px;">No products configured for this step.</p>';
      return;
    }

    productGrid.innerHTML = products.map(product => {
      const selectionKey = product.variantId || product.id;
      const currentQuantity = selectedProducts[selectionKey] || 0;
      const currencyInfo = CurrencyManager.getCurrencyInfo();

      return `
        <div class="product-card ${currentQuantity > 0 ? 'selected' : ''}" data-product-id="${selectionKey}">
          <div class="image-wrapper">
            <img src="${product.imageUrl}" alt="${product.title}" loading="lazy">
          </div>
          <div class="product-info">
            <p class="product-title">${product.title}</p>
            <p class="product-price">${CurrencyManager.formatMoney(product.price, currencyInfo.display.format)}</p>
            ${this.renderVariantSelector(product)}
          </div>
          ${currentQuantity > 0 ? `<div class="selected-overlay">${currentQuantity}</div>` : ''}
          <div class="quantity-controls">
            <button class="quantity-control-button decrease-quantity" data-product-id="${selectionKey}">-</button>
            <span class="quantity-display">${currentQuantity}</span>
            <button class="quantity-control-button increase-quantity" data-product-id="${selectionKey}">+</button>
          </div>
        </div>
      `;
    }).join('');

    // Attach event handlers
    this.attachProductEventHandlers(productGrid, stepIndex);
  }

  renderVariantSelector(product) {
    if (!product.variants || product.variants.length <= 1) {
      return '';
    }

    return `
      <select class="variant-selector" data-base-product-id="${product.id}">
        ${product.variants.map(v => `
          <option value="${v.id}" ${v.id === product.variantId ? 'selected' : ''}>${v.title}</option>
        `).join('')}
      </select>
    `;
  }

  attachProductEventHandlers(productGrid, stepIndex) {
    // Remove existing event listeners to prevent duplicates
    const newProductGrid = productGrid.cloneNode(true);
    productGrid.parentNode.replaceChild(newProductGrid, productGrid);

    // Quantity button handlers
    newProductGrid.addEventListener('click', (e) => {
      if (e.target.classList.contains('quantity-control-button')) {
        const productId = e.target.dataset.productId;
        const currentQuantity = this.selectedProducts[stepIndex][productId] || 0;
        const isIncrease = e.target.classList.contains('increase-quantity');

        const newQuantity = isIncrease ? currentQuantity + 1 : Math.max(0, currentQuantity - 1);
        this.updateProductSelection(stepIndex, productId, newQuantity);
      }
    });

    // Product card click handler
    newProductGrid.addEventListener('click', (e) => {
      if (!e.target.closest('.quantity-control-button') && !e.target.closest('.variant-selector')) {
        const productCard = e.target.closest('.product-card');
        if (productCard) {
          const productId = productCard.dataset.productId;
          const currentQuantity = this.selectedProducts[stepIndex][productId] || 0;
          this.updateProductSelection(stepIndex, productId, currentQuantity > 0 ? 0 : 1);
        }
      }
    });

    // Variant selector handler
    newProductGrid.addEventListener('change', (e) => {
      if (e.target.classList.contains('variant-selector')) {
        const newVariantId = e.target.value;
        const baseProductId = e.target.dataset.baseProductId;

        // Find the product and update its variant
        const product = this.stepProductData[stepIndex].find(p => p.id === baseProductId);
        if (product) {
          const variantData = product.variants.find(v => v.id === newVariantId);
          if (variantData) {
            // Move quantity from old variant to new variant
            const oldQuantity = this.selectedProducts[stepIndex][product.variantId] || 0;
            if (oldQuantity > 0) {
              delete this.selectedProducts[stepIndex][product.variantId];
              this.selectedProducts[stepIndex][newVariantId] = oldQuantity;
            }

            // Update product properties
            product.variantId = newVariantId;
            product.price = variantData.price;

            // Update UI without full re-render
            this.updateModalNavigation();
            this.updateModalFooterMessaging();
          }
        }
      }
    });
  }
  updateProductSelection(stepIndex, productId, newQuantity) {
    const quantity = Math.max(0, newQuantity);

    // Validate step conditions
    if (!this.validateStepCondition(stepIndex, productId, quantity)) {
      return;
    }

    // Update selection
    if (quantity > 0) {
      this.selectedProducts[stepIndex][productId] = quantity;
    } else {
      delete this.selectedProducts[stepIndex][productId];
    }

    // Update UI without re-rendering the entire modal (prevents event listener duplication)
    this.updateProductQuantityDisplay(stepIndex, productId, quantity);
    this.renderModalTabs();
    this.updateModalNavigation();
    this.updateModalFooterMessaging();
    this.updateAddToCartButton();
    this.updateFooterMessaging();
  }

  updateProductQuantityDisplay(stepIndex, productId, quantity) {
    // Update quantity display without full re-render
    const productCard = document.querySelector(`[data-product-id="${productId}"]`);
    if (productCard) {
      const quantityDisplay = productCard.querySelector('.quantity-display');
      const selectedOverlay = productCard.querySelector('.selected-overlay');

      if (quantityDisplay) {
        quantityDisplay.textContent = quantity;
      }

      if (selectedOverlay) {
        if (quantity > 0) {
          selectedOverlay.textContent = quantity;
          selectedOverlay.style.display = 'block';
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

  validateStepCondition(stepIndex, productId, newQuantity) {
    const step = this.selectedBundle.steps[stepIndex];

    if (!step.conditionType || !step.conditionOperator || step.conditionValue === null) {
      return true; // No conditions to validate
    }

    // Calculate what the total would be with this change
    let totalQuantityWouldBe = 0;
    for (const [pid, qty] of Object.entries(this.selectedProducts[stepIndex])) {
      if (pid === productId) {
        totalQuantityWouldBe += newQuantity;
      } else {
        totalQuantityWouldBe += qty;
      }
    }

    const requiredQuantity = step.conditionValue;
    let allowUpdate = false;

    switch (step.conditionOperator) {
      case BUNDLE_WIDGET.CONDITION_OPERATORS.EQUAL_TO:
        allowUpdate = totalQuantityWouldBe <= requiredQuantity;
        break;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN:
        allowUpdate = totalQuantityWouldBe < requiredQuantity;
        break;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN_OR_EQUAL_TO:
        allowUpdate = totalQuantityWouldBe <= requiredQuantity;
        break;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN:
      case BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL_TO:
        allowUpdate = true; // Allow any increase
        break;
      default:
        allowUpdate = true;
    }

    if (!allowUpdate && newQuantity > (this.selectedProducts[stepIndex][productId] || 0)) {
      const operatorText = {
        [BUNDLE_WIDGET.CONDITION_OPERATORS.EQUAL_TO]: `exactly ${requiredQuantity}`,
        [BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN]: `less than ${requiredQuantity}`,
        [BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN_OR_EQUAL_TO]: `at most ${requiredQuantity}`,
        [BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN]: `more than ${requiredQuantity}`,
        [BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL_TO]: `at least ${requiredQuantity}`
      };

      const limitText = operatorText[step.conditionOperator] || requiredQuantity;
      ToastManager.show(`This step allows ${limitText} product${requiredQuantity !== 1 ? 's' : ''} only.`, 'warning');
      return false;
    }

    return true;
  }

  validateStep(stepIndex) {
    const step = this.selectedBundle.steps[stepIndex];
    const selectedProductsInStep = this.selectedProducts[stepIndex];

    let totalQuantitySelected = 0;
    for (const quantity of Object.values(selectedProductsInStep)) {
      totalQuantitySelected += quantity;
    }

    if (!step.conditionType || !step.conditionOperator || step.conditionValue === null) {
      return totalQuantitySelected > 0; // Any selection is valid
    }

    const requiredQuantity = step.conditionValue;

    switch (step.conditionOperator) {
      case BUNDLE_WIDGET.CONDITION_OPERATORS.EQUAL_TO:
        return totalQuantitySelected === requiredQuantity;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN:
        return totalQuantitySelected > requiredQuantity;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN:
        return totalQuantitySelected < requiredQuantity;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN_OR_EQUAL_TO:
        return totalQuantitySelected >= requiredQuantity;
      case BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN_OR_EQUAL_TO:
        return totalQuantitySelected <= requiredQuantity;
      default:
        return totalQuantitySelected > 0;
    }
  }

  isStepAccessible(stepIndex) {
    // Check if all previous steps are completed
    for (let i = 0; i < stepIndex; i++) {
      if (!this.validateStep(i)) {
        return false;
      }
    }
    return true;
  }

  updateModalNavigation() {
    const prevButton = this.elements.modal.querySelector('.prev-button');
    const nextButton = this.elements.modal.querySelector('.next-button');

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
    const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData
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

    const footerMessaging = this.elements.modal.querySelector('.modal-footer-discount-messaging');
    const progressFill = this.elements.modal.querySelector('.modal-footer-progress-fill');
    const discountText = this.elements.modal.querySelector('.modal-footer-discount-text');

    if (!footerMessaging || !this.selectedBundle.pricing?.enabled) {
      if (footerMessaging) footerMessaging.style.display = 'none';
      return;
    }

    // Show appropriate message
    let messageText = '';
    let messageState = 'progress';

    if (discountInfo.qualifiesForDiscount) {
      messageState = 'success';
      messageText = TemplateManager.replaceVariables(this.config.successMessageTemplate, variables);
    } else {
      messageText = TemplateManager.replaceVariables(this.config.discountTextTemplate, variables);
    }

    if (discountText) {
      discountText.textContent = messageText;
    }

    // Update progress bar based on condition type
    const nextRule = PricingCalculator.getNextDiscountRule(this.selectedBundle, totalQuantity, totalPrice);
    const ruleToUse = discountInfo.applicableRule || nextRule;

    let progressPercentage = 0;

    if (ruleToUse) {
      const conditionType = ruleToUse.condition?.type || 'quantity';
      const targetValue = ruleToUse.condition?.value || 0;

      if (conditionType === 'amount') {
        progressPercentage = targetValue > 0 ? Math.min(100, (totalPrice / targetValue) * 100) : 0;
      } else {
        progressPercentage = targetValue > 0 ? Math.min(100, (totalQuantity / targetValue) * 100) : 0;
      }
    }

    if (progressFill) {
      progressFill.style.width = `${progressPercentage}%`;
    }

    // Apply state class
    footerMessaging.className = `modal-footer-discount-messaging ${messageState}`;
    footerMessaging.style.display = 'flex';
  }

  // ========================================================================
  // CART OPERATIONS
  // ========================================================================

  async addToCart() {
    try {
      const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
        this.selectedProducts,
        this.stepProductData
      );

      if (totalQuantity === 0) {
        ToastManager.show('Please select products for your bundle before adding to cart.', 'warning');
        return;
      }

      // Validate all steps
      const allStepsValid = this.selectedBundle.steps.every((_, index) => this.validateStep(index));
      if (!allStepsValid) {
        ToastManager.show('Please complete all bundle steps before adding to cart.', 'warning');
        return;
      }

      const cartItems = this.buildCartItems();

      // Disable button during request
      this.elements.addToCartButton.disabled = true;
      this.elements.addToCartButton.textContent = 'Adding to Cart...';

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: cartItems })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Cart add failed: ${response.status}`);
      }

      const result = await response.json();

      // Show success message and redirect
      ToastManager.show('Bundle added to cart successfully!', 'success');

      setTimeout(() => {
        window.location.href = '/cart';
      }, 1000);

    } catch (error) {
      ToastManager.show(`Failed to add bundle to cart: ${error.message}`, 'error');
    } finally {
      // Re-enable button
      this.updateAddToCartButton();
    }
  }

  buildCartItems() {
    // Shopify Standard Bundle approach for configurable bundles:
    // Add ACTUAL selected component products to cart with _bundle_id property
    // Cart transform MERGE groups by _bundle_id and combines into bundle parent
    // See: https://shopify.dev/docs/apps/build/product-merchandising/bundles/create-bundle-app

    const cartItems = [];
    const bundleInstanceId = this.generateBundleInstanceId();

    console.log('[CART] Building cart items for bundle:', {
      bundleId: this.selectedBundle.id,
      bundleName: this.selectedBundle.name,
      bundleInstanceId
    });

    // Add ACTUAL selected component products to cart
    // Each component gets _bundle_id property for grouping in cart transform
    const unavailableProducts = []; // Track unavailable products

    this.selectedProducts.forEach((stepSelections, stepIndex) => {
      const productsInStep = this.stepProductData[stepIndex];

      Object.entries(stepSelections).forEach(([variantId, quantity]) => {
        if (quantity > 0) {
          const product = productsInStep.find(p => (p.variantId || p.id) === variantId);
          if (product) {
            // Check availability before adding to cart
            if (product.available !== true) {
              console.warn('[CART] Product not available for sale:', {
                stepIndex,
                variantId,
                productTitle: product.title,
                availabilityStatus: product.available
              });
              unavailableProducts.push(product.title);
              return; // Skip this product
            }

            console.log('[CART] Adding component:', {
              stepIndex,
              variantId,
              quantity,
              productTitle: product.title,
              bundleInstanceId,
              available: product.available
            });

            const cartItem = {
              id: parseInt(variantId),
              quantity: quantity,
              properties: {
                '_bundle_id': bundleInstanceId,
                '_bundle_name': this.selectedBundle.name,
                '_step_index': stepIndex.toString()
              }
            };

            cartItems.push(cartItem);
          }
        }
      });
    });

    console.log('[CART] Cart items to add (components with _bundle_id property):', cartItems);

    // Throw error if any products are unavailable
    if (unavailableProducts.length > 0) {
      const productList = unavailableProducts.join(', ');
      throw new Error(`The following product${unavailableProducts.length > 1 ? 's are' : ' is'} currently unavailable: ${productList}. Please remove ${unavailableProducts.length > 1 ? 'them' : 'it'} from your bundle or try again later.`);
    }

    return cartItems;
  }

  generateBundleInstanceId() {
    // Generate unique bundle instance ID using UUID (recommended by Shopify)
    // This prevents hash collisions and ensures each bundle instance is truly unique
    // Reference: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID

    // Use crypto.randomUUID() if available (modern browsers)
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      const uuid = crypto.randomUUID();
      const bundleInstanceId = `${this.selectedBundle.id}_${uuid}`;

      console.log('[CART] Generated UUID-based bundle instance ID:', bundleInstanceId);
      return bundleInstanceId;
    }

    // Fallback for older browsers: use timestamp + random number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    const bundleInstanceId = `${this.selectedBundle.id}_${timestamp}_${random}`;

    console.warn('[CART] crypto.randomUUID() not available, using fallback ID generation');
    console.log('[CART] Generated fallback bundle instance ID:', bundleInstanceId);
    return bundleInstanceId;
  }
  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================

  attachEventListeners() {
    // Add to cart button
    this.elements.addToCartButton.addEventListener('click', () => this.addToCart());

    // Modal close handlers
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

    // Modal navigation
    if (prevButton) {
      prevButton.addEventListener('click', () => this.navigateModal(-1));
    }

    if (nextButton) {
      nextButton.addEventListener('click', () => this.navigateModal(1));
    }

    // Keyboard handlers
    document.addEventListener('keydown', (e) => {
      if (modal.style.display === 'block' && e.key === 'Escape') {
        this.closeModal();
      }
    });
  }

  async navigateModal(direction) {
    const newStepIndex = this.currentStepIndex + direction;

    if (direction < 0 && newStepIndex >= 0) {
      // Previous step
      if (this.validateStep(this.currentStepIndex)) {
        this.currentStepIndex = newStepIndex;
        const step = this.selectedBundle.steps[newStepIndex];

        // Update modal header
        this.elements.modal.querySelector('.modal-step-title').textContent = step.name;
        this.elements.modal.querySelector('.modal-step-subtitle').textContent = `Step ${newStepIndex + 1} of ${this.selectedBundle.steps.length}`;

        // Load products for this step
        await this.loadStepProducts(newStepIndex);

        this.renderModalTabs();
        this.renderModalProducts(this.currentStepIndex);
        this.updateModalNavigation();
        this.updateModalFooterMessaging();
      } else {
        ToastManager.show('Please meet the quantity conditions for the current step before going back.', 'warning');
      }
    } else if (direction > 0) {
      if (newStepIndex < this.selectedBundle.steps.length) {
        // Next step
        if (this.validateStep(this.currentStepIndex)) {
          this.currentStepIndex = newStepIndex;
          const step = this.selectedBundle.steps[newStepIndex];

          // Update modal header
          this.elements.modal.querySelector('.modal-step-title').textContent = step.name;
          this.elements.modal.querySelector('.modal-step-subtitle').textContent = `Step ${newStepIndex + 1} of ${this.selectedBundle.steps.length}`;

          // Load products for this step
          await this.loadStepProducts(newStepIndex);

          this.renderModalTabs();
          this.renderModalProducts(this.currentStepIndex);
          this.updateModalNavigation();
          this.updateModalFooterMessaging();
        } else {
          ToastManager.show('Please meet the quantity conditions for the current step before proceeding.', 'warning');
        }
      } else {
        // Done button clicked on last step
        if (this.validateStep(this.currentStepIndex)) {
          this.closeModal();
        } else {
          ToastManager.show('Please meet the quantity conditions for the current step before finishing.', 'warning');
        }
      }
    }
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

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

  showErrorUI(error) {
    this.container.innerHTML = `
      <div class="bundle-error">
        <h3>Bundle Widget Error</h3>
        <p>Failed to initialize bundle widget.</p>
        <details>
          <summary>Error Details</summary>
          <pre>${error.message}\n${error.stack}</pre>
        </details>
      </div>
    `;
  }
}

// ============================================================================
// WIDGET MANAGER
// ============================================================================

class BundleWidgetManager {
  static instances = new Map();

  static initialize() {
    // Find all bundle widget containers
    const containers = document.querySelectorAll(BUNDLE_WIDGET.SELECTORS.WIDGET_CONTAINER);

    containers.forEach(container => {
      if (!this.instances.has(container)) {
        try {
          const widget = new BundleWidget(container);
          this.instances.set(container, widget);
        } catch (error) {
        }
      }
    });
  }

  static reinitialize() {
    // Clear existing instances
    this.instances.clear();

    // Initialize again
    this.initialize();
  }

  static getInstance(container) {
    return this.instances.get(container);
  }
}



// ============================================================================
// AUTO-INITIALIZATION AND THEME EDITOR SUPPORT
// ============================================================================

// Handle automatic bundle configuration from URL parameters
function handleAutomaticBundleConfiguration() {
  const urlParams = new URLSearchParams(window.location.search);
  const bundleId = urlParams.get('bundleId');

  if (bundleId && (BundleDataManager.isThemeEditorContext())) {
    // Store for widgets to use
    window.autoDetectedBundleId = bundleId;
    window.isThemeEditorContext = true;

    // Find bundle widget containers and configure them
    const bundleContainers = document.querySelectorAll(BUNDLE_WIDGET.SELECTORS.WIDGET_CONTAINER);
    bundleContainers.forEach(container => {
      if (!container.dataset.bundleId) {
        container.dataset.bundleId = bundleId;
        ToastManager.show(`Bundle widget configured with ID: ${bundleId}`, 'info', 6000);
      }
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    handleAutomaticBundleConfiguration();
    BundleWidgetManager.initialize();
  });
} else {
  // DOM already loaded
  handleAutomaticBundleConfiguration();
  BundleWidgetManager.initialize();
}

// Listen for reload requests from theme editor when bundleId is auto-populated
window.addEventListener('bundleWidgetReload', () => {
  console.log('[BUNDLE_WIDGET] Received reload request, reinitializing widgets...');
  BundleWidgetManager.reinitialize();
});

// Shopify theme editor support
if (BundleDataManager.isThemeEditorContext()) {
  // Watch for theme editor changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' &&
        mutation.target.classList &&
        mutation.target.classList.contains('bundle-widget-container')) {
        setTimeout(() => BundleWidgetManager.reinitialize(), 100);
      }
    });
  });

  observer.observe(document.body, {
    attributes: true,
    subtree: true,
  });

  // Shopify theme editor events
  document.addEventListener('shopify:section:load', () => BundleWidgetManager.reinitialize());
  document.addEventListener('shopify:section:select', () => BundleWidgetManager.reinitialize());
  document.addEventListener('shopify:section:deselect', () => BundleWidgetManager.reinitialize());
  document.addEventListener('shopify:block:select', () => BundleWidgetManager.reinitialize());
  document.addEventListener('shopify:block:deselect', () => BundleWidgetManager.reinitialize());
}

// Global access for debugging and legacy compatibility
window.BundleWidget = BundleWidget;
window.BundleWidgetManager = BundleWidgetManager;
window.CurrencyManager = CurrencyManager;
window.PricingCalculator = PricingCalculator;
window.ToastManager = ToastManager;