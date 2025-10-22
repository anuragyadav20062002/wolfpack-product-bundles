/**
 * Bundle Widget - Complete Professional Implementation
 * Handles bundle product selection, pricing, and cart operations
 * Supports both cart transform and discount function bundles
 * 
 * @version 3.0.0
 * @author Wolfpack Team
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

  // Bundle Types
  BUNDLE_TYPES: {
    CART_TRANSFORM: 'cart_transform',
    DISCOUNT_FUNCTION: 'discount_function'
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
// PROFESSIONAL LOGGING SYSTEM
// ============================================================================

class BundleLogger {
  static log(level, category, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = `${BUNDLE_WIDGET.LOG_PREFIX} [${level.toUpperCase()}] [${category}]`;

    if (data !== null) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  static info(category, message, data = null) {
    this.log('info', category, message, data);
  }

  static warn(category, message, data = null) {
    this.log('warn', category, message, data);
  }

  static error(category, message, data = null) {
    this.log('error', category, message, data);
  }

  static debug(category, message, data = null) {
    this.log('debug', category, message, data);
  }
}
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
    BundleLogger.debug('CURRENCY', 'Detecting customer currency');

    // Priority 1: Shopify Markets active currency
    if (window.Shopify?.currency?.active) {
      const currency = {
        code: window.Shopify.currency.active,
        format: window.Shopify.currency.format || window.shopMoneyFormat,
        rate: window.Shopify.currency.rate || 1
      };
      BundleLogger.info('CURRENCY', 'Using Shopify Markets currency', currency);
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
      BundleLogger.info('CURRENCY', 'Using currency from cookie', currency);
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
      BundleLogger.info('CURRENCY', 'Using currency from URL parameter', currency);
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
        BundleLogger.info('CURRENCY', 'Using currency from localStorage', currency);
        return currency;
      }
    } catch (e) {
      BundleLogger.warn('CURRENCY', 'localStorage not available', e);
    }

    // Fallback: Shop base currency
    const fallbackCurrency = {
      code: window.shopCurrency || 'USD',
      format: window.shopMoneyFormat,
      rate: 1
    };
    BundleLogger.info('CURRENCY', 'Using fallback shop currency', fallbackCurrency);
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
        BundleLogger.warn('CURRENCY', 'Shopify conversion failed, using rate', { error: e, rate });
      }
    }

    return Math.round(amount * rate);
  }

  static formatMoney(amount, format) {
    if (typeof Shopify !== 'undefined' && Shopify.formatMoney) {
      return Shopify.formatMoney(amount, format);
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
      BundleLogger.error('VALIDATION', 'Invalid bundle data - not an object', bundle);
      return false;
    }

    const required = ['id', 'name', 'status', 'bundleType', 'steps'];
    for (const field of required) {
      if (!bundle[field]) {
        BundleLogger.error('VALIDATION', `Missing required field: ${field}`, bundle);
        return false;
      }
    }

    if (!Array.isArray(bundle.steps) || bundle.steps.length === 0) {
      BundleLogger.error('VALIDATION', 'Bundle must have at least one step', bundle);
      return false;
    }

    BundleLogger.debug('VALIDATION', 'Bundle data validation passed', { bundleId: bundle.id, bundleName: bundle.name });
    return true;
  }

  static selectBundle(bundlesData, config) {
    BundleLogger.info('SELECTION', 'Starting bundle selection process', config);

    if (!bundlesData || typeof bundlesData !== 'object') {
      BundleLogger.error('SELECTION', 'No bundle data available');
      return null;
    }

    const bundles = Object.values(bundlesData).filter(bundle =>
      this.validateBundleData(bundle) && bundle.status === 'active'
    );

    if (bundles.length === 0) {
      BundleLogger.warn('SELECTION', 'No active bundles found');
      return null;
    }

    BundleLogger.info('SELECTION', `Found ${bundles.length} active bundles`);

    // Selection priority for cart transform bundles
    for (const bundle of bundles) {
      if (bundle.bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.CART_TRANSFORM) {
        // Priority 1: Manual bundle ID
        if (config.bundleId && bundle.id === config.bundleId) {
          BundleLogger.info('SELECTION', 'Selected bundle by manual ID', { bundleId: config.bundleId, bundleName: bundle.name });
          return bundle;
        }

        // Priority 2: Container product bundle ID
        if (config.isContainerProduct && config.containerBundleId && bundle.id === config.containerBundleId) {
          BundleLogger.info('SELECTION', 'Selected bundle by container ID', { bundleId: config.containerBundleId, bundleName: bundle.name });
          return bundle;
        }

        // Priority 3: Product ID matching
        if (config.currentProductId) {
          const productIdStr = config.currentProductId.toString();
          const productGid = `gid://shopify/Product/${config.currentProductId}`;

          if (bundle.shopifyProductId === productGid || bundle.shopifyProductId === productIdStr) {
            BundleLogger.info('SELECTION', 'Selected bundle by product ID match', { productId: config.currentProductId, bundleName: bundle.name });
            return bundle;
          }

          // Extract numeric ID from GID for comparison
          const bundleProductId = bundle.shopifyProductId ? bundle.shopifyProductId.split('/').pop() : null;
          if (bundleProductId === productIdStr) {
            BundleLogger.info('SELECTION', 'Selected bundle by extracted product ID match', { productId: config.currentProductId, bundleName: bundle.name });
            return bundle;
          }
        }

        // Priority 4: Theme editor context (show any bundle)
        const isThemeEditor = this.isThemeEditorContext();
        if (isThemeEditor) {
          BundleLogger.info('SELECTION', 'Selected bundle in theme editor context', { bundleName: bundle.name });
          return bundle;
        }
      }

      // Selection logic for discount function bundles
      if (bundle.bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.DISCOUNT_FUNCTION) {
        // Priority 1: Manual bundle ID
        if (config.bundleId && bundle.id === config.bundleId) {
          BundleLogger.info('SELECTION', 'Selected discount function bundle by manual ID', { bundleId: config.bundleId, bundleName: bundle.name });
          return bundle;
        }

        // Priority 2: Product/Collection matching
        if (this.matchesDiscountFunctionBundle(bundle, config)) {
          BundleLogger.info('SELECTION', 'Selected discount function bundle by matching', { bundleName: bundle.name });
          return bundle;
        }
      }
    }

    // Fallback: First active bundle
    const fallbackBundle = bundles[0];
    if (fallbackBundle) {
      BundleLogger.info('SELECTION', 'Using fallback bundle (first active)', { bundleName: fallbackBundle.name });
      return fallbackBundle;
    }

    BundleLogger.warn('SELECTION', 'No suitable bundle found');
    return null;
  }

  static matchesDiscountFunctionBundle(bundle, config) {
    let parsedMatching = null;

    if (bundle.matching) {
      if (typeof bundle.matching === 'string') {
        try {
          parsedMatching = JSON.parse(bundle.matching);
        } catch (e) {
          BundleLogger.error('SELECTION', 'Failed to parse bundle matching data', { bundleId: bundle.id, error: e });
          return false;
        }
      } else if (typeof bundle.matching === 'object') {
        parsedMatching = bundle.matching;
      }
    }

    if (!parsedMatching) {
      BundleLogger.debug('SELECTION', 'No matching data for discount function bundle', { bundleId: bundle.id });
      return false;
    }

    // Check product matches
    const productMatches = parsedMatching.selectedVisibilityProducts &&
      Array.isArray(parsedMatching.selectedVisibilityProducts) &&
      parsedMatching.selectedVisibilityProducts.some(p => {
        const productIdFromGid = p.id.split('/').pop();
        return productIdFromGid === config.currentProductId.toString();
      });

    // Check collection matches
    const collectionMatches = parsedMatching.selectedVisibilityCollections &&
      Array.isArray(parsedMatching.selectedVisibilityCollections) &&
      config.currentProductCollections &&
      Array.isArray(config.currentProductCollections) &&
      parsedMatching.selectedVisibilityCollections.some(bundleCollection => {
        const bundleCollectionIdFromGid = bundleCollection.id.split('/').pop();
        return config.currentProductCollections.some(productCollection =>
          productCollection.id.toString() === bundleCollectionIdFromGid
        );
      });

    BundleLogger.debug('SELECTION', 'Discount function bundle matching results', {
      bundleId: bundle.id,
      productMatches,
      collectionMatches
    });

    return productMatches || collectionMatches;
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

    BundleLogger.debug('PRICING', 'Calculating bundle total', { selectedProducts, stepProductData });

    selectedProducts.forEach((stepSelections, stepIndex) => {
      const productsInStep = stepProductData[stepIndex] || [];

      Object.entries(stepSelections).forEach(([variantId, quantity]) => {
        const product = productsInStep.find(p => (p.variantId || p.id) === variantId);
        if (product && quantity > 0) {
          const price = parseFloat(product.price) || 0;
          totalPrice += price * quantity;
          totalQuantity += quantity;

          BundleLogger.debug('PRICING', 'Added product to total', {
            variantId,
            quantity,
            price,
            productTitle: product.title
          });
        }
      });
    });

    BundleLogger.info('PRICING', 'Bundle total calculated', { totalPrice, totalQuantity });
    return { totalPrice, totalQuantity };
  }

  static calculateDiscount(bundle, totalPrice, totalQuantity) {
    BundleLogger.debug('PRICING', 'Calculating discount', {
      bundleId: bundle?.id,
      totalPrice,
      totalQuantity,
      hasPricing: !!bundle?.pricing,
      pricingEnabled: bundle?.pricing?.enabled
    });

    if (!bundle?.pricing?.enabled || !bundle.pricing.rules?.length) {
      BundleLogger.debug('PRICING', 'No discount - pricing disabled or no rules');
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

    // Find the best applicable rule
    for (const rule of rules) {
      const ruleValue = rule.value || 0;
      const conditionType = rule.conditionType || 'quantity';

      let conditionMet = false;
      let currentValue, comparisonText;

      if (conditionType === 'amount') {
        // Amount-based condition
        currentValue = totalPrice;
        conditionMet = this.checkCondition(totalPrice, rule.condition, ruleValue);
        comparisonText = `Rs. ${totalPrice / 100} ${rule.condition || 'gte'} Rs. ${ruleValue / 100}`;
      } else {
        // Quantity-based condition (default)
        currentValue = totalQuantity;
        conditionMet = this.checkCondition(totalQuantity, rule.condition, ruleValue);
        comparisonText = `${totalQuantity} items ${rule.condition || 'gte'} ${ruleValue} items`;
      }

      BundleLogger.info('PRICING', 'Rule evaluation with detailed comparison', {
        ruleId: rule.id,
        conditionType,
        condition: rule.condition || 'gte',
        ruleValue,
        currentValue,
        conditionMet,
        comparisonText,
        discountValue: rule.discountValue || rule.fixedBundlePrice
      });

      if (conditionMet) {
        if (!bestRule || ruleValue > (bestRule.value || 0)) {
          bestRule = rule;
          BundleLogger.info('PRICING', 'New best rule selected', { 
            ruleId: rule.id,
            conditionType,
            qualifiesForDiscount: true
          });
        }
      }
    }

    if (!bestRule) {
      BundleLogger.debug('PRICING', 'No applicable discount rule found');
      return {
        hasDiscount: false,
        discountAmount: 0,
        finalPrice: totalPrice,
        discountPercentage: 0,
        qualifiesForDiscount: false,
        applicableRule: null
      };
    }

    // Calculate discount amount - Handle decimal values properly
    let discountAmount = 0;
    const discountMethod = bundle.pricing.method;
    
    // Get discount value using clean field structure
    let discountValue = 0;
    if (discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_BUNDLE_PRICE) {
      discountValue = parseFloat(bestRule.fixedBundlePrice || 0);
    } else {
      discountValue = parseFloat(bestRule.discountValue || 0);
    }

    BundleLogger.info('PRICING', 'Discount calculation with decimal support', {
      discountMethod,
      discountValue,
      totalPriceInCents: totalPrice,
      totalPriceInDollars: totalPrice / 100,
      totalQuantity,
      rule: bestRule
    });

    switch (discountMethod) {
      case BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF:
        // Percentage calculation remains the same
        discountAmount = Math.round(totalPrice * (discountValue / 100));
        break;
      case BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_AMOUNT_OFF:
        // Convert decimal amount to cents for calculation
        discountAmount = Math.round(discountValue * 100);
        break;
      case BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_BUNDLE_PRICE:
        // Convert decimal fixed price to cents, then calculate discount
        const fixedPriceInCents = Math.round(discountValue * 100);
        discountAmount = Math.max(0, totalPrice - fixedPriceInCents);
        break;
      default:
        BundleLogger.error('PRICING', 'Unknown discount method', { discountMethod });
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

    BundleLogger.info('PRICING', 'Discount calculated', result);
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

    const rules = bundle.pricing.rules.sort((a, b) => (a.value || 0) - (b.value || 0));

    for (const rule of rules) {
      const ruleValue = rule.value || 0;
      const conditionType = rule.conditionType || 'quantity';

      // Check if this rule is not yet satisfied
      let isRuleSatisfied = false;

      if (conditionType === 'amount') {
        isRuleSatisfied = this.checkCondition(currentAmount, rule.condition, ruleValue);
      } else {
        isRuleSatisfied = this.checkCondition(currentQuantity, rule.condition, ruleValue);
      }

      // Return the first rule that is not satisfied (next target)
      if (!isRuleSatisfied) {
        BundleLogger.debug('PRICING', 'Found next discount rule', {
          ruleId: rule.id,
          conditionType,
          ruleValue,
          currentQuantity,
          currentAmount,
          condition: rule.condition
        });
        return rule;
      }
    }

    BundleLogger.debug('PRICING', 'All discount rules satisfied');
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

    BundleLogger.info('TOAST', `Showed ${type} toast: ${message}`);
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

    BundleLogger.debug('TEMPLATE', 'Variables replaced', { template, variables, result });
    return result;
  }

  static createDiscountVariables(bundle, totalPrice, totalQuantity, discountInfo, currencyInfo) {
    BundleLogger.debug('VARIABLES', 'Creating discount variables', {
      bundleId: bundle.id,
      totalPrice,
      totalQuantity,
      hasDiscount: discountInfo.hasDiscount,
      discountMethod: bundle.pricing?.method
    });

    const nextRule = PricingCalculator.getNextDiscountRule(bundle, totalQuantity, totalPrice);
    const ruleToUse = discountInfo.applicableRule || nextRule;

    if (!ruleToUse) {
      BundleLogger.debug('VARIABLES', 'No applicable rule found, using empty variables');
      return this.createEmptyVariables(bundle, totalPrice, totalQuantity, discountInfo, currencyInfo);
    }

    // Extract rule data using clean field structure - NO BACKWARD COMPATIBILITY
    const conditionType = ruleToUse.conditionType;
    const targetValue = ruleToUse.value; // This comes from cart transform mapping
    const discountMethod = bundle.pricing?.method;
    
    // Get discount value using clean field mapping
    let rawDiscountValue = 0;
    if (discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_BUNDLE_PRICE) {
      rawDiscountValue = ruleToUse.fixedBundlePrice;
    } else {
      rawDiscountValue = ruleToUse.discountValue;
    }

    BundleLogger.debug('VARIABLES', 'Rule analysis', {
      conditionType,
      targetValue,
      discountMethod,
      rawDiscountValue
    });

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

    BundleLogger.info('VARIABLES', 'Discount variables created successfully', {
      conditionType,
      conditionText: conditionData.conditionText,
      discountText: discountData.discountText,
      progressPercentage: Math.round(progressPercentage)
    });

    return variables;
  }

  static calculateConditionData(conditionType, targetValue, totalPrice, totalQuantity, currencyInfo) {
    if (conditionType === 'amount') {
      // Amount-based condition - targetValue is decimal, totalPrice is in cents
      const targetValueInCents = Math.round(targetValue * 100);
      const amountNeeded = Math.max(0, targetValueInCents - totalPrice);
      
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
        targetValueInCents,
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
    switch (discountMethod) {
      case BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF:
        const percentage = Math.round(rawDiscountValue);
        return {
          discountText: `${percentage}% off`
        };
        
      case BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_AMOUNT_OFF:
        const convertedAmount = CurrencyManager.convertCurrency(
          rawDiscountValue * 100,
          currencyInfo.calculation.code,
          currencyInfo.display.code,
          currencyInfo.display.rate
        );
        const amountOff = Math.round(convertedAmount / 100);
        return {
          discountText: `${currencyInfo.display.symbol}${amountOff} off`
        };
        
      case BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_BUNDLE_PRICE:
        const convertedPrice = CurrencyManager.convertCurrency(
          rawDiscountValue * 100,
          currencyInfo.calculation.code,
          currencyInfo.display.code,
          currencyInfo.display.rate
        );
        const bundlePrice = Math.round(convertedPrice / 100);
        return {
          discountText: `${currencyInfo.display.symbol}${bundlePrice}`
        };
        
      default:
        BundleLogger.warn('VARIABLES', 'Unknown discount method', { discountMethod });
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

    BundleLogger.info('INIT', 'Creating new bundle widget instance', { containerId: containerElement.id });

    this.init();
  }

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  init() {
    try {
      BundleLogger.info('INIT', 'Starting widget initialization');

      // Check if already initialized
      if (this.container.dataset.initialized === 'true') {
        BundleLogger.warn('INIT', 'Widget already initialized, skipping');
        return;
      }

      // Parse configuration
      this.parseConfiguration();

      // Load and validate bundle data
      this.loadBundleData();

      // Select appropriate bundle
      this.selectBundle();

      if (!this.selectedBundle) {
        BundleLogger.warn('INIT', 'No bundle selected, showing fallback UI');
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

      BundleLogger.info('INIT', 'Widget initialization completed successfully', {
        bundleName: this.selectedBundle.name,
        bundleType: this.selectedBundle.bundleType,
        stepsCount: this.selectedBundle.steps.length
      });

    } catch (error) {
      BundleLogger.error('INIT', 'Widget initialization failed', error);
      this.showErrorUI(error);
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

    BundleLogger.debug('INIT', 'Configuration parsed', this.config);
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
      BundleLogger.info('CONFIG', 'Normalizing legacy discount template to modern format', {
        oldTemplate: template,
        newTemplate: modernTemplate
      });
      return modernTemplate;
    }
    
    // Template is already modern, return as-is
    return template;
  }

  normalizeSuccessTemplate(template) {
    // Professional success template normalization
    const modernTemplate = 'Congratulations! You got {discountText}!';
    
    if (!template) {
      return modernTemplate;
    }
    
    // Check for old patterns in success messages
    if (template.includes('best offer on your bundle') || template.includes('🎉 you have gotten')) {
      BundleLogger.info('CONFIG', 'Normalizing legacy success template to modern format', {
        oldTemplate: template,
        newTemplate: modernTemplate
      });
      return modernTemplate;
    }
    
    return template;
  }

  loadBundleData() {
    let bundleData = null;

    // Source 1: data-bundle-config attribute
    if (this.container.dataset.bundleConfig) {
      try {
        const singleBundle = JSON.parse(this.container.dataset.bundleConfig);
        bundleData = { [singleBundle.id]: singleBundle };
        BundleLogger.info('DATA', 'Loaded bundle data from data-bundle-config');
      } catch (error) {
        BundleLogger.error('DATA', 'Failed to parse data-bundle-config', error);
      }
    }

    // Source 2: window.allBundlesData
    if (!bundleData && window.allBundlesData) {
      bundleData = window.allBundlesData;
      BundleLogger.info('DATA', 'Loaded bundle data from window.allBundlesData');
    }

    if (!bundleData) {
      throw new Error('No bundle data available');
    }

    this.bundleData = bundleData;
    BundleLogger.debug('DATA', 'Bundle data loaded', { bundleCount: Object.keys(bundleData).length });
  }

  selectBundle() {
    this.selectedBundle = BundleDataManager.selectBundle(this.bundleData, this.config);

    if (this.selectedBundle) {
      BundleLogger.info('SELECTION', 'Bundle selected successfully', {
        id: this.selectedBundle.id,
        name: this.selectedBundle.name,
        type: this.selectedBundle.bundleType
      });
    }
  }

  initializeDataStructures() {
    const stepsCount = this.selectedBundle.steps.length;

    // Initialize selected products array (one object per step)
    this.selectedProducts = Array(stepsCount).fill(null).map(() => ({}));

    // Initialize step product data cache
    this.stepProductData = Array(stepsCount).fill(null).map(() => ([]));

    BundleLogger.debug('DATA', 'Data structures initialized', {
      stepsCount,
      selectedProductsLength: this.selectedProducts.length,
      stepProductDataLength: this.stepProductData.length
    });
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

    BundleLogger.debug('DOM', 'DOM elements setup completed');
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
      <div class="footer-progress-container">
        <div class="progress-bar-wrapper">
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <div class="progress-text">
            <span class="current-quantity">0</span> / <span class="target-quantity">0</span> items
          </div>
        </div>
        <div class="footer-discount-text"></div>
        <div class="footer-savings-display" style="display: none;">
          <span class="savings-badge">You save: <span class="savings-amount"></span></span>
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
      BundleLogger.debug('DOM', 'Modal created and appended to body');
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

    BundleLogger.debug('RENDER', 'UI rendering completed');
  }

  renderHeader() {
    if (!this.config.showTitle) {
      this.elements.header.style.display = 'none';
      return;
    }

    this.elements.header.style.display = 'block';
  }

  renderSteps() {
    BundleLogger.info('RENDER', 'Rendering bundle steps', { stepsCount: this.selectedBundle.steps.length });

    // Clear existing steps
    this.elements.stepsContainer.innerHTML = '';

    this.selectedBundle.steps.forEach((step, index) => {
      const stepElement = this.createStepElement(step, index);
      this.elements.stepsContainer.appendChild(stepElement);

      BundleLogger.debug('RENDER', `Step ${index + 1} rendered`, { stepName: step.name });
    });

    BundleLogger.info('RENDER', 'All steps rendered successfully');
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
    return totalSelected > 0 ? `${totalSelected} selected` : 'Click to select';
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
      footerDiscountText.style.color = 'var(--footer-success-color, #28a745)';
    } else {
      // Progress message
      const progressMessage = TemplateManager.replaceVariables(
        this.config.discountTextTemplate,
        variables
      );
      
      BundleLogger.debug('FOOTER', 'Discount message rendered', {
        template: this.config.discountTextTemplate,
        variables: variables,
        result: progressMessage
      });
      
      footerDiscountText.innerHTML = progressMessage;
      footerDiscountText.style.color = 'var(--footer-text-color, #2d3748)';
    }

    // Update progress bar based on condition type
    const nextRule = PricingCalculator.getNextDiscountRule(this.selectedBundle, totalQuantity, totalPrice);
    const ruleToUse = discountInfo.applicableRule || nextRule;
    
    let progressPercentage = 0;
    let currentValue = 0;
    let targetValue = 0;
    
    if (ruleToUse) {
      const conditionType = ruleToUse.conditionType || 'quantity';
      targetValue = ruleToUse.value || 0;
      
      if (conditionType === 'amount') {
        currentValue = totalPrice;
        progressPercentage = targetValue > 0 ? Math.min(100, (currentValue / targetValue) * 100) : 0;
      } else {
        currentValue = totalQuantity;
        progressPercentage = targetValue > 0 ? Math.min(100, (currentValue / targetValue) * 100) : 0;
      }
    }

    if (progressFill) {
      progressFill.style.width = `${progressPercentage}%`;
    }

    if (currentQuantitySpan) {
      currentQuantitySpan.textContent = totalQuantity.toString();
    }

    if (targetQuantitySpan) {
      targetQuantitySpan.textContent = targetValue.toString();
    }

    BundleLogger.debug('FOOTER', 'Footer messaging updated', {
      totalQuantity,
      totalPrice,
      targetValue,
      currentValue,
      progressPercentage,
      conditionType: ruleToUse?.conditionType || 'quantity',
      qualifiesForDiscount: discountInfo.qualifiesForDiscount
    });
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

    if (totalQuantity === 0) {
      button.textContent = 'Add Bundle to Cart';
      button.disabled = true;
    } else {
      const currencyInfo = CurrencyManager.getCurrencyInfo();
      const formattedPrice = CurrencyManager.formatMoney(discountInfo.finalPrice, currencyInfo.display.format);

      if (discountInfo.hasDiscount && this.selectedBundle.pricing?.messages?.showDiscountDisplay !== false) {
        const originalPrice = CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format);
        button.innerHTML = `
          <span style="display: flex; flex-direction: column; align-items: center;">
            <span style="text-decoration: line-through; font-size: 0.8em; opacity: 0.7;">${originalPrice}</span>
            <span>Add Bundle to Cart • ${formattedPrice}</span>
          </span>
        `;
      } else {
        button.textContent = `Add Bundle to Cart • ${formattedPrice}`;
      }

      button.disabled = false;
    }
  }
  // ========================================================================
  // MODAL FUNCTIONALITY
  // ========================================================================

  openModal(stepIndex) {
    BundleLogger.info('MODAL', 'Opening modal for step', { stepIndex, stepName: this.selectedBundle.steps[stepIndex].name });

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

      BundleLogger.debug('MODAL', 'Modal opened successfully');
    }).catch(error => {
      BundleLogger.error('MODAL', 'Failed to load step products', error);
      ToastManager.show('Failed to load products for this step', 'error');
    });
  }

  closeModal() {
    BundleLogger.debug('MODAL', 'Closing modal');

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
      BundleLogger.debug('MODAL', 'Step products already loaded', { stepIndex, productsCount: this.stepProductData[stepIndex].length });
      return;
    }

    BundleLogger.info('MODAL', 'Loading products for step', {
      stepIndex,
      stepName: step.name,
      hasProducts: !!step.products,
      hasStepProduct: !!step.StepProduct,
      hasCollections: !!step.collections,
      productsCount: step.products?.length || 0,
      stepProductCount: step.StepProduct?.length || 0,
      collectionsCount: step.collections?.length || 0
    });

    let allProducts = [];

    // Process explicit products from both products and StepProduct arrays
    if (step.products && Array.isArray(step.products) && step.products.length > 0) {
      BundleLogger.debug('MODAL', 'Adding products from step.products', { count: step.products.length });
      allProducts = allProducts.concat(step.products);
    }

    if (step.StepProduct && Array.isArray(step.StepProduct) && step.StepProduct.length > 0) {
      BundleLogger.debug('MODAL', 'Adding products from step.StepProduct', { count: step.StepProduct.length });
      const stepProducts = step.StepProduct.map(sp => ({
        id: sp.productId,
        title: sp.title,
        images: sp.imageUrl ? [{ originalSrc: sp.imageUrl }] : [],
        variants: sp.variants || [],
        handle: sp.handle || null
      }));
      allProducts = allProducts.concat(stepProducts);
    }

    // Process collection products
    if (step.collections && Array.isArray(step.collections) && step.collections.length > 0) {
      BundleLogger.debug('MODAL', 'Loading products from collections', { collectionsCount: step.collections.length });

      const collectionPromises = step.collections.map(async (collection) => {
        if (!collection.handle) {
          BundleLogger.warn('MODAL', 'Collection missing handle', { collection });
          return [];
        }

        try {
          BundleLogger.debug('MODAL', 'Fetching collection products', { handle: collection.handle });
          const response = await fetch(`/collections/${collection.handle}/products.json?limit=250`);

          if (!response.ok) {
            BundleLogger.warn('MODAL', 'Collection fetch failed', { handle: collection.handle, status: response.status });
            return [];
          }

          const data = await response.json();
          const products = data.products || [];
          BundleLogger.debug('MODAL', 'Collection products loaded', { handle: collection.handle, count: products.length });
          return products;
        } catch (error) {
          BundleLogger.error('MODAL', 'Failed to fetch collection products', { collectionHandle: collection.handle, error });
          return [];
        }
      });

      const collectionProducts = (await Promise.all(collectionPromises)).flat();
      BundleLogger.debug('MODAL', 'Total collection products loaded', { count: collectionProducts.length });
      allProducts = allProducts.concat(collectionProducts);
    }

    BundleLogger.debug('MODAL', 'Total products before processing', { count: allProducts.length });

    // Process and normalize product data
    const processedProducts = this.processProductsForStep(allProducts, step);

    BundleLogger.debug('MODAL', 'Products after processing', { count: processedProducts.length });

    // Remove duplicates
    const seen = new Set();
    this.stepProductData[stepIndex] = processedProducts.filter(product => {
      const key = product.variantId || product.id;
      if (seen.has(key)) {
        BundleLogger.debug('MODAL', 'Removing duplicate product', { key, title: product.title });
        return false;
      }
      seen.add(key);
      return true;
    });

    BundleLogger.info('MODAL', 'Step products loaded successfully', {
      stepIndex,
      stepName: step.name,
      finalCount: this.stepProductData[stepIndex].length,
      productTitles: this.stepProductData[stepIndex].map(p => p.title)
    });

    // If no products found, log detailed debug info
    if (this.stepProductData[stepIndex].length === 0) {
      BundleLogger.warn('MODAL', 'No products found for step', {
        stepIndex,
        stepName: step.name,
        stepConfig: {
          hasProducts: !!step.products,
          hasStepProduct: !!step.StepProduct,
          hasCollections: !!step.collections,
          productsLength: step.products?.length,
          stepProductLength: step.StepProduct?.length,
          collectionsLength: step.collections?.length
        },
        rawStep: step
      });
    }
  }

  processProductsForStep(products, step) {
    return products.flatMap(product => {
      if (step.displayVariantsAsIndividual && product.variants && product.variants.length > 0) {
        // Display each variant as separate product
        return product.variants.map(variant => ({
          id: this.extractId(variant.id),
          title: `${product.title} - ${variant.title}`,
          imageUrl: product.images?.[0]?.originalSrc || product.images?.[0]?.src || 'https://via.placeholder.com/150',
          price: parseFloat(variant.price || '0') * 100, // Convert to cents
          variantId: this.extractId(variant.id)
        }));
      } else {
        // Display product with default variant
        const defaultVariant = product.variants?.[0];
        return [{
          id: this.extractId(defaultVariant?.id || product.id),
          title: product.title,
          imageUrl: product.images?.[0]?.originalSrc || product.images?.[0]?.src || product.image?.src || 'https://via.placeholder.com/150',
          price: defaultVariant ? parseFloat(defaultVariant.price || '0') * 100 : 0,
          variantId: this.extractId(defaultVariant?.id || product.id),
          variants: (product.variants || []).map(v => ({
            id: this.extractId(v.id),
            title: v.title,
            price: parseFloat(v.price || '0') * 100
          }))
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

        BundleLogger.info('MODAL_NAV', `Navigating to step ${index + 1}`, { stepName: step.name });

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

    BundleLogger.debug('MODAL', 'Rendering modal products', { stepIndex, productsCount: products.length });

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
    BundleLogger.debug('SELECTION', 'Updating product selection', { stepIndex, productId, newQuantity });

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
      
      BundleLogger.debug('MODAL_FOOTER', 'Discount message rendered', {
        template: this.config.discountTextTemplate,
        variables: variables,
        result: messageText
      });
    }

    if (discountText) {
      discountText.textContent = messageText;
    }

    // Update progress bar based on condition type
    const nextRule = PricingCalculator.getNextDiscountRule(this.selectedBundle, totalQuantity, totalPrice);
    const ruleToUse = discountInfo.applicableRule || nextRule;
    
    let progressPercentage = 0;
    
    if (ruleToUse) {
      const conditionType = ruleToUse.conditionType || 'quantity';
      const targetValue = ruleToUse.value || 0;
      
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

    BundleLogger.debug('MODAL_FOOTER', 'Modal footer messaging updated', {
      messageState,
      progressPercentage,
      totalQuantity,
      totalPrice,
      conditionType: ruleToUse?.conditionType || 'quantity',
      targetValue: ruleToUse?.value || 0
    });
  }

  // ========================================================================
  // CART OPERATIONS
  // ========================================================================

  async addToCart() {
    BundleLogger.info('CART', 'Starting add to cart process');

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

      BundleLogger.debug('CART', 'Cart items prepared', { itemsCount: cartItems.length, totalQuantity });

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

      BundleLogger.info('CART', 'Bundle added to cart successfully', { itemsAdded: cartItems.length });

      // Show success message and redirect
      ToastManager.show('Bundle added to cart successfully!', 'success');

      setTimeout(() => {
        window.location.href = '/cart';
      }, 1000);

    } catch (error) {
      BundleLogger.error('CART', 'Failed to add bundle to cart', error);
      ToastManager.show(`Failed to add bundle to cart: ${error.message}`, 'error');
    } finally {
      // Re-enable button
      this.updateAddToCartButton();
    }
  }

  buildCartItems() {
    const cartItems = [];
    const bundleInstanceId = this.generateBundleInstanceId();

    BundleLogger.info('CART', 'Building cart items', {
      bundleId: this.selectedBundle.id,
      bundleInstanceId,
      selectedProductsCount: this.selectedProducts.length
    });

    this.selectedProducts.forEach((stepSelections, stepIndex) => {
      const productsInStep = this.stepProductData[stepIndex];

      Object.entries(stepSelections).forEach(([variantId, quantity]) => {
        if (quantity > 0) {
          const product = productsInStep.find(p => (p.variantId || p.id) === variantId);
          if (product) {
            const cartItem = {
              id: parseInt(variantId),
              quantity: quantity,
              properties: {
                [BUNDLE_WIDGET.CART_PROPERTIES.BUNDLE_ID]: bundleInstanceId,
                [BUNDLE_WIDGET.CART_PROPERTIES.BUNDLE_CONFIG]: JSON.stringify(this.selectedBundle)
              }
            };
            
            cartItems.push(cartItem);
            
            BundleLogger.debug('CART', 'Added cart item', {
              variantId,
              quantity,
              productTitle: product.title,
              bundleProperty: BUNDLE_WIDGET.CART_PROPERTIES.BUNDLE_ID,
              bundleInstanceId
            });
          }
        }
      });
    });

    BundleLogger.info('CART', 'Cart items built successfully', {
      totalItems: cartItems.length,
      bundleInstanceId,
      cartProperties: {
        bundleIdProperty: BUNDLE_WIDGET.CART_PROPERTIES.BUNDLE_ID,
        bundleConfigProperty: BUNDLE_WIDGET.CART_PROPERTIES.BUNDLE_CONFIG
      }
    });

    return cartItems;
  }

  generateBundleInstanceId() {
    // Create deterministic ID based on bundle + selected products
    const itemsSignature = this.selectedProducts
      .map((stepSelections, stepIndex) => {
        const sortedItems = Object.entries(stepSelections)
          .filter(([_, qty]) => qty > 0)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([variantId, quantity]) => `${variantId}:${quantity}`)
          .join('|');
        return `step${stepIndex}:${sortedItems}`;
      })
      .filter(step => step !== `step${this.selectedProducts.indexOf(step)}:`)
      .join('||');

    // Simple hash function
    let hash = 0;
    const str = `${this.selectedBundle.id}_${itemsSignature}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    const bundleInstanceId = `${this.selectedBundle.id}_${Math.abs(hash)}`;

    BundleLogger.debug('CART', 'Generated bundle instance ID', {
      bundleId: this.selectedBundle.id,
      itemsSignature,
      bundleInstanceId
    });

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

    BundleLogger.debug('EVENTS', 'Event listeners attached');
  }

  async navigateModal(direction) {
    const newStepIndex = this.currentStepIndex + direction;

    if (direction < 0 && newStepIndex >= 0) {
      // Previous step
      if (this.validateStep(this.currentStepIndex)) {
        BundleLogger.info('MODAL_NAV', `Navigating to previous step ${newStepIndex + 1}`);

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
          BundleLogger.info('MODAL_NAV', `Navigating to next step ${newStepIndex + 1}`);

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
    BundleLogger.info('MANAGER', 'Initializing bundle widget manager');

    // Find all bundle widget containers
    const containers = document.querySelectorAll(BUNDLE_WIDGET.SELECTORS.WIDGET_CONTAINER);

    BundleLogger.info('MANAGER', `Found ${containers.length} bundle widget containers`);

    containers.forEach(container => {
      if (!this.instances.has(container)) {
        try {
          const widget = new BundleWidget(container);
          this.instances.set(container, widget);
          BundleLogger.debug('MANAGER', 'Widget instance created', { containerId: container.id });
        } catch (error) {
          BundleLogger.error('MANAGER', 'Failed to create widget instance', { containerId: container.id, error });
        }
      }
    });

    BundleLogger.info('MANAGER', `Initialized ${this.instances.size} widget instances`);
  }

  static reinitialize() {
    BundleLogger.info('MANAGER', 'Reinitializing all widgets');

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
// LEGACY COMPATIBILITY FUNCTIONS
// ============================================================================

// Legacy function for backward compatibility
function initializeBundleWidget(containerElement) {
  BundleLogger.info('LEGACY', 'Legacy initializeBundleWidget called');

  if (!containerElement) {
    BundleLogger.error('LEGACY', 'No container element provided');
    return;
  }

  try {
    const widget = new BundleWidget(containerElement);
    BundleLogger.info('LEGACY', 'Legacy widget initialized successfully');
    return widget;
  } catch (error) {
    BundleLogger.error('LEGACY', 'Legacy widget initialization failed', error);
    return null;
  }
}

// Legacy function for theme editor
function reinitializeAllBundleWidgets() {
  BundleLogger.info('LEGACY', 'Legacy reinitializeAllBundleWidgets called');
  BundleWidgetManager.reinitialize();
}

// Legacy toast function
function showToast(message, type = 'info', duration = 4000) {
  ToastManager.show(message, type, duration);
}

// ============================================================================
// AUTO-INITIALIZATION AND THEME EDITOR SUPPORT
// ============================================================================

// Handle automatic bundle configuration from URL parameters
function handleAutomaticBundleConfiguration() {
  const urlParams = new URLSearchParams(window.location.search);
  const bundleId = urlParams.get('bundleId');

  if (bundleId && (BundleDataManager.isThemeEditorContext())) {
    BundleLogger.info('CONFIG', `Theme editor detected bundle ID parameter: ${bundleId}`);

    // Store for widgets to use
    window.autoDetectedBundleId = bundleId;
    window.isThemeEditorContext = true;

    // Find bundle widget containers and configure them
    const bundleContainers = document.querySelectorAll(BUNDLE_WIDGET.SELECTORS.WIDGET_CONTAINER);
    bundleContainers.forEach(container => {
      if (!container.dataset.bundleId) {
        container.dataset.bundleId = bundleId;
        BundleLogger.info('CONFIG', `Automatically configured bundle ID: ${bundleId}`);
        ToastManager.show(`Bundle widget configured with ID: ${bundleId}`, 'info', 6000);
      }
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    BundleLogger.info('INIT', 'DOM loaded, initializing bundle widgets');
    handleAutomaticBundleConfiguration();
    BundleWidgetManager.initialize();
  });
} else {
  // DOM already loaded
  BundleLogger.info('INIT', 'DOM already loaded, initializing bundle widgets immediately');
  handleAutomaticBundleConfiguration();
  BundleWidgetManager.initialize();
}

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
    attributeFilter: ['data-show-title', 'data-show-step-numbers', 'data-show-footer-messaging', 'style']
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
window.BundleLogger = BundleLogger;
window.CurrencyManager = CurrencyManager;
window.PricingCalculator = PricingCalculator;
window.ToastManager = ToastManager;

// Legacy global functions
window.initializeBundleWidget = initializeBundleWidget;
window.reinitializeAllBundleWidgets = reinitializeAllBundleWidgets;
window.showToast = showToast;

BundleLogger.info('SYSTEM', `Bundle Widget System v${BUNDLE_WIDGET.VERSION} loaded successfully`);