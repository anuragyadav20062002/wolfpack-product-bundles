(function() {
  'use strict';

  // ============================================================================
  // BUNDLE WIDGET COMPONENTS
  // ============================================================================

/**
 * Bundle Widget - Global Constants and Configuration
 *
 * Central configuration used across all bundle widget modules.
 *
 * @version 4.0.0
 */


const BUNDLE_WIDGET = {
  VERSION: '4.0.0',
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
    FULL_PAGE: 'full_page'         // Dedicated bundle page
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


/**
 * Bundle Widget - Currency Management System
 *
 * Handles multi-currency detection, conversion, and formatting.
 * Integrates with Shopify Markets for automatic currency handling.
 *
 * @version 4.0.0
 */


class CurrencyManager {
  static getShopBaseCurrency() {
    // Shop's base currency from Shopify object (official source)
    return {
      code: window.Shopify?.shop?.currency || 'USD',
      format: window.shopMoneyFormat || '{{amount}}'
    };
  }

  static detectCustomerCurrency() {
    // Primary: Shopify Markets active currency (official method)
    // Shopify Markets handles geolocation and user preferences automatically
    if (window.Shopify?.currency?.active) {
      return {
        code: window.Shopify.currency.active,
        format: window.Shopify.currency.format || window.shopMoneyFormat || '{{amount}}',
        rate: window.Shopify.currency.rate || 1
      };
    }

    // Fallback: Shop base currency
    return this.getShopBaseCurrency();
  }

  static convertCurrency(amount, fromCurrency, toCurrency, rate = 1) {
    if (fromCurrency === toCurrency) return amount;

    // Use Shopify's conversion if available
    if (window.Shopify?.currency?.convert) {
      try {
        return window.Shopify.currency.convert(amount, fromCurrency, toCurrency);
      } catch (e) {
        // Fallback to manual conversion
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


/**
 * Bundle Widget - Bundle Data Manager
 *
 * Handles validation, filtering, and selection of bundle data.
 * Provides utilities for extracting step and product data.
 *
 * @version 4.0.0
 */


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

      // Validate bundle type
      if (bundle.bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.PRODUCT_PAGE ||
          bundle.bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE) {
        // Valid bundle type
      } else {
      }

      // Validate steps
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

  static filterActivePublishedBundles(bundles) {
    return bundles.filter(bundle =>
      bundle.status === 'active' || bundle.status === 'published'
    );
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
      this.validateSingleBundle(bundle) && bundle.status === 'active'
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
}


/**
 * Bundle Widget - Pricing Calculator
 *
 * Handles bundle pricing calculations, discount rules, and condition checking.
 *
 * @version 4.0.0
 */


class PricingCalculator {
  static calculateBundleTotal(selectedProducts, stepProductData) {
    let totalPrice = 0;
    let totalQuantity = 0;


    selectedProducts.forEach((stepSelections, stepIndex) => {
      const productsInStep = stepProductData[stepIndex] || [];

      Object.entries(stepSelections).forEach(([variantId, quantity]) => {
        // First try direct match on variantId or id
        let product = productsInStep.find(p => String(p.variantId || p.id) === String(variantId));
        let matchedVariant = null;

        // If not found, search within nested variants array of each product
        // This handles the case where displayVariantsAsIndividual is false
        // and user selects a non-default variant from dropdown
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
          // Use variant price if found within nested variants, otherwise use product price
          const price = matchedVariant
            ? (typeof matchedVariant.price === 'number' ? matchedVariant.price : parseFloat(matchedVariant.price || '0') * 100)
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


/**
 * Bundle Widget - Toast Notification System
 *
 * Provides user notifications and feedback with support for
 * simple messages and undo actions.
 *
 * @version 4.0.0
 */


class ToastManager {
  static show(message, duration = 4000) {
    // Remove any existing toast
    const existingToast = document.getElementById('bundle-toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Create toast element - uses DCP CSS variables
    const toast = document.createElement('div');
    toast.id = 'bundle-toast';
    toast.className = `bundle-toast`;
    toast.innerHTML = `
      <span>${message}</span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="cursor: pointer;" onclick="this.parentElement.remove()">
        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    // Add to page (styles come from bundle-widget.css with DCP CSS variables)
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

  // Show toast with undo action button
  static showWithUndo(message, undoCallback, duration = 5000) {
    // Remove any existing toast
    const existingToast = document.getElementById('bundle-toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Create toast element with undo button
    const toast = document.createElement('div');
    toast.id = 'bundle-toast';
    toast.className = 'bundle-toast bundle-toast-with-undo';
    toast.innerHTML = `
      <span class="toast-message">${message}</span>
      <button class="toast-undo-btn" type="button">Undo</button>
      <svg class="toast-close" width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    // Attach event listeners
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
  static replaceVariables(template, variables) {
    if (!template) return '';

    let result = template;

    // Replace variables with both single and double curly braces
    Object.entries(variables).forEach(([key, value]) => {
      const singleBrace = new RegExp(`\\{${key}\\}`, 'g');
      const doubleBrace = new RegExp(`\\{\\{${key}\\}\\}`, 'g');

      // Wrap conditionText and discountText with styled spans
      let replacementValue = value;
      if (key === 'conditionText') {
        replacementValue = `<span class="bundle-conditions-text" style="color: var(--bundle-conditions-text-color, inherit);">${value}</span>`;
      } else if (key === 'discountText') {
        replacementValue = `<span class="bundle-discount-text" style="color: var(--bundle-discount-text-color, inherit);">${value}</span>`;
      }

      result = result.replace(singleBrace, replacementValue);
      result = result.replace(doubleBrace, replacementValue);
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


/**
 * Bundle Widget - Component Generator
 *
 * Generates HTML for all UI elements including product cards,
 * modal structure, tabs, progress bars, and footer components.
 *
 * @version 4.0.0
 */


class ComponentGenerator {
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
    const showQuantitySelector = options.showQuantitySelector !== false;
    const isSelected = currentQuantity > 0;

    // Check if this is an expanded variant card (has parentProductId and no variants array)
    // In this case, don't show variant selector - each card IS a variant
    const isExpandedVariantCard = product.parentProductId && (!product.variants || product.variants.length === 0 || product.variants === null);

    // Render inline quantity controls when item is selected (competitor-inspired design)
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

    // Render button or quantity controls based on selection state
    const renderBottomAction = () => {
      if (isSelected) {
        // Show inline quantity controls when selected
        return renderInlineQuantityControls();
      } else {
        // For expanded variant cards, always show "Add to Bundle"
        // For regular products with variants, show "Choose Size"
        const hasVariants = !isExpandedVariantCard && product.variants && product.variants.length > 1;
        const buttonText = hasVariants ? 'Choose Size' : 'Add to Bundle';
        return `
          <button class="product-add-btn" data-product-id="${selectionKey}">
            ${buttonText}
          </button>
        `;
      }
    };

    // Render variant badge if this is an expanded variant card
    const renderVariantBadge = () => {
      if (isExpandedVariantCard && product.variantTitle) {
        return `<div class="product-variant-badge">${product.variantTitle}</div>`;
      }
      return '';
    };

    return `
      <div class="product-card ${isSelected ? 'selected' : ''}" data-product-id="${selectionKey}">
        ${isSelected ? `
          <div class="selected-overlay">✓</div>
        ` : ''}

        <div class="product-image">
          <img src="${product.imageUrl || product.image?.src || 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png'}" alt="${product.title}" loading="lazy" onerror="this.src='https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png'">
        </div>

        <div class="product-content-wrapper">
          <div class="product-title">${product.parentTitle || product.title}</div>
          ${renderVariantBadge()}

          ${product.price ? `
            <div class="product-price-row">
              ${product.compareAtPrice ? `<span class="product-price-strike">${CurrencyManager.formatMoney(product.compareAtPrice, currencyInfo.display.format)}</span>` : ''}
              <span class="product-price">${CurrencyManager.formatMoney(product.price, currencyInfo.display.format)}</span>
            </div>
          ` : ''}

          <div class="product-spacer"></div>

          ${isExpandedVariantCard ? '' : this.renderVariantSelector(product)}

          ${renderBottomAction()}
        </div>
      </div>
    `;
  }

  /**
   * Generates HTML for empty state cards
   */
  static renderEmptyStateCards(labelText, count = 3) {
    const cards = Array(count).fill(0).map(() => `
      <div class="empty-state-card">
        <svg class="empty-state-card-icon" width="69" height="69" viewBox="0 0 69 69" fill="none">
          <line x1="34.5" y1="15" x2="34.5" y2="54" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
          <line x1="15" y1="34.5" x2="54" y2="34.5" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        </svg>
        <p class="empty-state-card-text">${labelText}</p>
      </div>
    `).join('');

    return cards;
  }

  /**
   * Generates variant selector HTML if product has variants
   */
  static renderVariantSelector(product) {
    if (!product.variants || product.variants.length <= 1) {
      return '';
    }

    const options = product.variants.map(variant => {
      const isAvailable = variant.available !== false;
      const label = variant.title === 'Default Title' ? product.title : variant.title;
      return `<option value="${variant.id}" ${!isAvailable ? 'disabled' : ''}>${label}${!isAvailable ? ' (Out of Stock)' : ''}</option>`;
    }).join('');

    return `
      <select class="variant-selector" data-product-id="${product.variantId || product.id}">
        ${options}
      </select>
    `;
  }

  /**
   * Generates modal structure HTML
   */
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

  /**
   * Generates tab HTML for modal navigation
   */
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

  /**
   * Generates progress bar HTML
   */
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


  // ============================================================================
  // BUNDLE PRODUCT MODAL COMPONENT
  // ============================================================================

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

    // Insert modal into document body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modalElement = document.getElementById('bundle-product-modal');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button
    const closeBtn = this.modalElement.querySelector('.bundle-modal-close');
    closeBtn.addEventListener('click', () => this.close());

    // Close on overlay click
    this.modalElement.addEventListener('click', (e) => {
      if (e.target === this.modalElement) {
        this.close();
      }
    });

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalElement.classList.contains('active')) {
        this.close();
      }
    });

    // Carousel navigation buttons
    document.getElementById('modal-carousel-prev').addEventListener('click', () => {
      this.navigateCarousel(-1);
    });

    document.getElementById('modal-carousel-next').addEventListener('click', () => {
      this.navigateCarousel(1);
    });

    // Quantity controls
    document.getElementById('modal-qty-decrease').addEventListener('click', () => {
      this.updateQuantity(Math.max(1, this.selectedQuantity - 1));
    });

    document.getElementById('modal-qty-increase').addEventListener('click', () => {
      this.updateQuantity(this.selectedQuantity + 1);
    });

    // Add To Box button
    document.getElementById('modal-add-to-box').addEventListener('click', () => {
      this.addToBundle();
    });

    // Swipe gesture detection for mobile
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

    // Swipe state
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isSwiping = false;

    // Swipe-to-dismiss on modal container (drag handle area)
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

        // Only allow downward swipe
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

        // Close if swiped down > 100px within 300ms (quick swipe) or > 150px (slow swipe)
        if ((deltaY > 100 && deltaTime < 300) || deltaY > 150) {
          modalContainer.style.transform = 'translateY(100%)';
          modalContainer.style.opacity = '0';
          setTimeout(() => {
            this.close();
            modalContainer.style.transform = '';
            modalContainer.style.opacity = '';
          }, 300);
        } else {
          // Reset position
          modalContainer.style.transform = '';
          modalContainer.style.opacity = '';
        }
      }, { passive: true });
    }

    // Swipe left/right on image for carousel navigation
    if (imageContainer) {
      imageContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartTime = Date.now();
      }, { passive: true });

      imageContainer.addEventListener('touchend', (e) => {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaTime = Date.now() - touchStartTime;

        // Minimum 50px swipe within 300ms
        if (Math.abs(deltaX) > 50 && deltaTime < 300) {
          if (deltaX > 0) {
            // Swipe right = previous image
            this.navigateCarousel(-1);
          } else {
            // Swipe left = next image
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

    // Wrap around
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

    // Populate modal content
    this.populateModal();

    // Show modal
    this.modalElement.classList.add('active');
    document.body.classList.add('modal-open');
  }

  /**
   * Close modal
   */
  close() {
    this.modalElement.classList.remove('active');
    document.body.classList.remove('modal-open');

    // Reset state
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
    // Set title - use parent title if this is a flattened variant
    const displayTitle = this.currentProduct.parentTitle || this.currentProduct.title;
    document.getElementById('modal-product-title').textContent = displayTitle;

    // Set description (if available)
    const descriptionEl = document.getElementById('modal-product-description');
    if (this.currentProduct.description) {
      descriptionEl.textContent = this.currentProduct.description;
      descriptionEl.style.display = 'block';
    } else {
      descriptionEl.style.display = 'none';
    }

    // Load images
    this.loadImages();

    // Create variant selectors
    this.createVariantSelectors();

    // Set initial price
    this.updatePrice();

    // Show/hide quantity selector based on config
    const quantitySection = this.modalElement.querySelector('.bundle-modal-quantity');
    if (quantitySection) {
      const showQuantitySelector = this.widget?.config?.showQuantitySelectorInModal !== false;
      quantitySection.style.display = showQuantitySelector ? 'flex' : 'none';
    }

    // Reset quantity display
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

    // Try various image formats
    if (product.images && Array.isArray(product.images)) {
      // Handle images array (can be strings or objects with url/src)
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

    // If no images from array, try single image properties
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
      // Use fallback placeholder
      mainImageEl.src = 'https://via.placeholder.com/600x600?text=No+Image';
      mainImageEl.alt = this.currentProduct.title;
      thumbnailsContainer.innerHTML = '';
      imageCounter.style.display = 'none';
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
      return;
    }

    // Set main image
    mainImageEl.src = images[0];
    mainImageEl.alt = this.currentProduct.title;

    // Show/hide carousel controls based on number of images
    if (images.length > 1) {
      prevBtn.style.display = 'flex';
      nextBtn.style.display = 'flex';
      imageCounter.style.display = 'block';
      this.updateImageCounter();

      // Create thumbnails
      thumbnailsContainer.innerHTML = images.map((image, index) => `
        <div class="bundle-modal-thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
          <img src="${image}" alt="${this.currentProduct.title} - Image ${index + 1}">
        </div>
      `).join('');

      // Add thumbnail click handlers
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

    // Update main image with smooth transition
    const mainImageEl = document.getElementById('modal-main-image');
    mainImageEl.src = images[index];

    // Update active thumbnail
    document.querySelectorAll('.bundle-modal-thumbnail').forEach((thumb, i) => {
      thumb.classList.toggle('active', i === index);
    });

    // Update image counter
    this.updateImageCounter();

    // Scroll active thumbnail into view
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


    // If only one variant (no options) or no variants, hide variant selectors
    if (variants.length <= 1) {
      variantsContainer.innerHTML = '';
      this.selectedVariant = variants[0] || this.currentProduct;
      return;
    }

    // Extract option names (e.g., Size, Color)
    // Handle different data structures: options can be array of strings or array of objects
    let optionNames = this.currentProduct.options || [];

    // If options is array of objects with name property, extract names
    if (optionNames.length > 0 && typeof optionNames[0] === 'object' && optionNames[0].name) {
      optionNames = optionNames.map(opt => opt.name);
    }

    // If still no option names, try to infer from first variant
    if (optionNames.length === 0 && variants.length > 0) {
      const firstVariant = variants[0];
      // Check for option1, option2, option3 properties
      if (firstVariant.option1) optionNames.push('Option 1');
      if (firstVariant.option2) optionNames.push('Option 2');
      if (firstVariant.option3) optionNames.push('Option 3');
    }

    if (optionNames.length === 0) {
      // No variant options, use first variant
      this.selectedVariant = variants[0];
      variantsContainer.innerHTML = '';
      return;
    }


    // Store selected options for tracking
    this.selectedOptions = {};

    // Find the current variant to pre-select its options
    const currentVariantId = this.currentProduct.variantId;
    const currentVariant = variants.find(v => String(v.id) === String(currentVariantId));

    // Create button-style selector for each option
    variantsContainer.innerHTML = optionNames.map((optionName, optionIndex) => {
      // Get unique values for this option, filtering out undefined/null
      const optionValues = [...new Set(
        variants
          .map(v => v[`option${optionIndex + 1}`])
          .filter(val => val !== undefined && val !== null && val !== '')
      )];

      if (optionValues.length === 0) return '';

      // Pre-select current variant's option value, or fall back to first value
      const preSelectedValue = currentVariant?.[`option${optionIndex + 1}`] || optionValues[0];
      this.selectedOptions[optionIndex] = preSelectedValue;

      // Detect if this is likely a color option
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

    // Add click handlers to variant buttons
    variantsContainer.querySelectorAll('.bundle-modal-variant-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const optionIndex = parseInt(btn.dataset.optionIndex);
        const value = btn.dataset.value;
        this.selectVariantOption(optionIndex, value);
      });
    });

    // Set initial variant
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
    // Check if values look like color names
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
    // Map common color names to CSS colors
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

    // If no match, try to use the value directly as a color
    if (lowerName.startsWith('#') || lowerName.startsWith('rgb')) {
      return `background-color: ${colorName}`;
    }

    // Default gradient for unknown colors
    return 'background: linear-gradient(135deg, #f0f0f0, #e0e0e0)';
  }

  /**
   * Select a variant option
   * @param {number} optionIndex - Index of the option (0, 1, or 2)
   * @param {string} value - Selected value
   */
  selectVariantOption(optionIndex, value) {
    // Update selected options
    this.selectedOptions[optionIndex] = value;

    // Update button states
    const optionsContainer = document.querySelector(`.bundle-modal-variant-options[data-option-index="${optionIndex}"]`);
    if (optionsContainer) {
      optionsContainer.querySelectorAll('.bundle-modal-variant-btn').forEach((btn) => {
        btn.classList.toggle('selected', btn.dataset.value === value);
      });
    }

    // Update selected value label
    const valueLabel = document.querySelector(`.bundle-modal-variant-selected-value[data-option-index="${optionIndex}"]`);
    if (valueLabel) {
      valueLabel.textContent = value;
    }

    // Update selected variant
    this.updateSelectedVariant();
  }

  /**
   * Update selected variant based on button selections
   */
  updateSelectedVariant() {
    const variants = this.currentProduct.variants || [];

    // Get selected option values from our stored selections
    const selectedOptionValues = Object.keys(this.selectedOptions || {})
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(key => this.selectedOptions[key]);


    // Find matching variant
    this.selectedVariant = variants.find(variant => {
      return selectedOptionValues.every((value, index) => {
        const variantValue = variant[`option${index + 1}`];
        return variantValue === value;
      });
    });

    // If no match found, use first variant
    if (!this.selectedVariant && variants.length > 0) {
      this.selectedVariant = variants[0];
    }


    // Update selection summary
    this.updateSelectionSummary();

    // Update price
    this.updatePrice();

    // Check availability
    this.updateAvailability();

    // Update variant image if available
    this.updateVariantImage();

    // Update unavailable option buttons
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

    // Get selected option values
    const selectedValues = Object.keys(this.selectedOptions || {})
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(key => this.selectedOptions[key])
      .filter(value => value && value !== 'Default Title');

    if (selectedValues.length === 0) {
      summaryContainer.style.display = 'none';
      return;
    }

    // Show the summary
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

        // Check if any variant exists with this option value + current other selections
        const hasAvailableVariant = variants.some(variant => {
          // Check if variant has this option value
          if (variant[`option${optionIndex + 1}`] !== testValue) return false;

          // Check if variant matches other selected options
          for (const [idx, value] of Object.entries(this.selectedOptions)) {
            if (parseInt(idx) === optionIndex) continue;
            if (variant[`option${parseInt(idx) + 1}`] !== value) return false;
          }

          // Check if variant is available
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

    // Check if variant has a specific image
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

    // Format price using widget's currency manager
    const price = variant.price || this.currentProduct.price || 0;
    const compareAtPrice = variant.compareAtPrice || variant.compare_at_price ||
                           this.currentProduct.compareAtPrice || this.currentProduct.compare_at_price;

    let priceHTML = '';

    if (compareAtPrice && parseFloat(compareAtPrice) > parseFloat(price)) {
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
    // Use widget's currency formatting if available
    if (this.widget && this.widget.formatPrice) {
      return this.widget.formatPrice(price);
    }

    // Fallback formatting
    const dollars = (price / 100).toFixed(2);
    return `$${dollars}`;
  }

  /**
   * Update availability status
   */
  updateAvailability() {
    const addBtn = document.getElementById('modal-add-to-box');
    const variant = this.selectedVariant || this.currentProduct;

    // Check if variant is available (handle different property names)
    const isAvailable = variant.available !== false &&
                        variant.availableForSale !== false &&
                        variant.inventory_quantity !== 0;

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

    // Check availability before adding
    const isAvailable = variant.available !== false &&
                        variant.availableForSale !== false;

    if (!isAvailable) {
      return;
    }

    // Use selectedBundle.steps (not widget.steps which doesn't exist)
    const steps = this.widget.selectedBundle?.steps || [];
    const stepIndex = steps.findIndex(s => s.id === this.currentStep.id);

    if (stepIndex === -1) {
      return;
    }

    // Use variantId if available, otherwise fall back to id
    // This matches how the widget stores product selections
    const productId = variant.variantId || variant.id || this.currentProduct.id;


    // Call widget's method to add product
    if (this.widget.updateProductSelection) {
      this.widget.updateProductSelection(
        stepIndex,
        productId,
        this.selectedQuantity
      );
    } else {
      return;
    }

    // Close modal
    this.close();

    // Show success feedback
    this.showSuccessFeedback();
  }

  /**
   * Show success feedback after adding product
   */
  showSuccessFeedback() {
    // Use widget's toast manager if available
    if (this.widget && this.widget.showToast) {
      this.widget.showToast('Product added to bundle!', 'success');
    } else {
    }
  }
}

// Export for use in main widget


  // Export modal to window for widget access
  window.BundleProductModal = BundleProductModal;

  // ============================================================================
  // BUNDLE WIDGET FULL PAGE
  // ============================================================================

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


// Import shared components and utilities

class BundleWidgetFullPage {

  constructor(containerElement) {
    this.container = containerElement;
    this.selectedBundle = null;
    this.selectedProducts = [];
    this.stepProductData = [];
    this.currentStepIndex = 0;
    this.isInitialized = false;
    this.config = {};
    this.elements = {};

    // Search state for filtering products within steps
    this.searchQuery = '';
    this.searchDebounceTimer = null;

    // Initialize product modal (if BundleProductModal is available)
    this.productModal = null;
    if (window.BundleProductModal) {
      this.productModal = new window.BundleProductModal(this);
    } else {
    }

    // Call async init but don't block constructor
    this.init().catch(error => {
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

      // Hide page body loading content (if it exists)
      this.hidePageLoadingContent();

      // Parse configuration
      this.parseConfiguration();

      // For full-page bundles, hide the page title immediately to prevent flash
      // This runs before any async operations to ensure smooth UX
      const bundleType = this.container.dataset.bundleType;
      if (bundleType === 'full_page') {
        this.hidePageTitle();
      }

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

      // Render initial UI (async for full-page bundles to load products)
      await this.renderUI();

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
   * Hide the page body loading content
   * This hides the "Loading bundle builder..." text that was added to the Shopify page body
   */
  hidePageLoadingContent() {
    try {
      // Find the parent page element that contains the loading text
      const pageContent = this.container.parentElement;

      if (pageContent) {
        // Hide all sibling divs that contain loading text
        const siblings = Array.from(pageContent.children);
        siblings.forEach(sibling => {
          // Check if this is not the widget container and contains "Loading" text
          if (sibling !== this.container &&
              (sibling.textContent.includes('Loading bundle builder') ||
               sibling.textContent.includes('Loading...'))) {
            sibling.style.display = 'none';
          }
        });
      }

    } catch (error) {
      // Don't throw - this is not critical
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
        return;
      }

      // CSS is loaded by the small loader (bundle-widget.js) for better performance
      // No need to load it here - just verify it's present
      const existingLink = document.querySelector('link[href*="design-settings"]');
      if (existingLink) {
      } else {
      }

    } catch (error) {
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
      showTitle: dataset.showTitle === 'true', // Default to false to avoid duplicate with main header
      showDescription: dataset.showDescription !== 'false',
      showStepNumbers: dataset.showStepNumbers !== 'false',
      showFooterMessaging: dataset.showFooterMessaging !== 'false',
      showStepTimeline: dataset.showStepTimeline !== 'false',
      showCategoryTabs: dataset.showCategoryTabs !== 'false',
      // Custom content from theme editor
      customTitle: dataset.customTitle || null,
      customDescription: dataset.customDescription || null,
      customInstruction: dataset.customInstruction || null,
      // Card layout settings from theme editor
      productCardSpacing: parseInt(dataset.productCardSpacing) || 20,
      productCardsPerRow: parseInt(dataset.productCardsPerRow) || 4,
      // Quantity selector visibility settings (default: show on both)
      showQuantitySelectorOnCard: dataset.showQuantitySelectorOnCard !== 'false',
      showQuantitySelectorInModal: dataset.showQuantitySelectorInModal !== 'false',
      // Promo banner settings from theme editor
      showPromoBanner: dataset.showPromoBanner !== 'false',
      promoBannerSubtitle: dataset.promoBannerSubtitle || 'Mix & Match',
      promoBannerTagline: dataset.promoBannerTagline || 'Create Your Perfect Bundle',
      promoBannerNote: dataset.promoBannerNote || 'Mix & Match Your Favorites',
      // Messages will be set from bundle.pricing.messages after bundle loads
      discountTextTemplate: 'Add {conditionText} to get {discountText}',
      successMessageTemplate: 'Congratulations! You got {discountText}!',
      currentProductId: window.currentProductId,
      currentProductHandle: window.currentProductHandle,
      currentProductCollections: window.currentProductCollections
    };

    // Apply card layout settings as CSS variables
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

    // Check if this is a full-page bundle (needs to fetch from API)
    const bundleType = this.container.dataset.bundleType;
    const bundleId = this.container.dataset.bundleId;

    if (bundleType === 'full_page' && bundleId) {

      try {
        // Use Shopify app proxy path - Shopify automatically adds signature and auth params
        // App proxy config: /apps/product-bundles -> https://wolfpack-product-bundle-app.onrender.com
        // CRITICAL: URL-encode bundle ID to handle special characters in cuid() format
        const apiUrl = `/apps/product-bundles/api/bundle/${encodeURIComponent(bundleId)}.json`;


        const response = await fetch(apiUrl);


        if (!response.ok) {
          // Try to get error details from response body
          let errorDetails = `${response.status} ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorDetails = JSON.stringify(errorData);
          } catch (e) {
          }
          throw new Error(`API request failed: ${errorDetails}`);
        }

        const data = await response.json();

        if (data.success && data.bundle) {
          bundleData = { [data.bundle.id]: data.bundle };
        } else {
          throw new Error('Invalid API response structure');
        }
      } catch (error) {
        throw error;
      }
    } else {
      // Product-page bundle: load from data-bundle-config attribute
      const configValue = this.container.dataset.bundleConfig;
      if (configValue && configValue.trim() !== '' && configValue !== 'null' && configValue !== 'undefined') {
        try {
          const singleBundle = JSON.parse(configValue);
          // Validate parsed result is a valid object with an id
          if (singleBundle && typeof singleBundle === 'object' && singleBundle.id) {
            bundleData = { [singleBundle.id]: singleBundle };
          } else {
          }
        } catch (error) {
        }
      } else {
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
          this.showThemeEditorPreview(bundleIdFromDataset);
          return; // Don't throw error, just show preview
        }

        // For production/storefront: show proper error
        const errorMsg = 'This widget can only be used on bundle container products. Please ensure:\n1. This product is a bundle container product\n2. Bundle has been saved and published\n3. Product has bundleConfig metafield set';
        throw new Error(errorMsg);
      }
    }

    this.bundleData = bundleData;
  }

  selectBundle() {
    this.selectedBundle = BundleDataManager.selectBundle(this.bundleData, this.config);

    // Update message templates from bundle pricing messages
    this.updateMessagesFromBundle();
  }

  updateMessagesFromBundle() {
    const messaging = this.selectedBundle?.messaging;

    if (messaging) {
      if (messaging.progressTemplate) {
        this.config.discountTextTemplate = messaging.progressTemplate;
      }
      if (messaging.successTemplate) {
        this.config.successMessageTemplate = messaging.successTemplate;
      }

      this.config.showDiscountMessaging = messaging.showDiscountMessaging !== false;
      this.config.showProgressBar = messaging.showProgressBar || false;

    } else {
      this.config.showDiscountMessaging = this.selectedBundle?.pricing?.enabled || false;
      this.config.showProgressBar = false;
    }
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
  }

  createHeader() {
    const header = document.createElement('div');
    header.className = 'bundle-header';

    // Use custom title if provided, otherwise use bundle name
    const title = this.config.customTitle || this.selectedBundle.name;

    // Use custom description if provided, otherwise use bundle description
    const description = this.config.customDescription || this.selectedBundle.description;

    // Build header HTML
    const titleHTML = `<h2 class="bundle-title">${title}</h2>`;
    const descriptionHTML = (description && this.config.showDescription)
      ? `<p class="bundle-description">${description}</p>`
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

              <!-- Progress Bar Section -->
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

      document.body.appendChild(modal);

      // Setup tab scroll arrows
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

    // Left arrow click
    leftArrow.addEventListener('click', () => {
      tabsContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    // Right arrow click
    rightArrow.addEventListener('click', () => {
      tabsContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    // Update arrow visibility based on scroll position
    const updateArrowVisibility = () => {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainer;

      leftArrow.style.display = scrollLeft > 0 ? 'flex' : 'none';
      rightArrow.style.display = scrollLeft + clientWidth < scrollWidth - 1 ? 'flex' : 'none';
    };

    // Listen to scroll events
    tabsContainer.addEventListener('scroll', updateArrowVisibility);

    // Initial check
    setTimeout(updateArrowVisibility, 100);

    // Store for later updates
    this.updateTabArrows = updateArrowVisibility;
  }
  //========================================================================
  // UI RENDERING
  // ========================================================================

  async renderUI() {
    this.renderHeader();
    await this.renderSteps();
    this.renderFooter();
  }

  renderHeader() {
    // For full-page bundles, always hide the main header (promo banner handles the display)
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
    // Clear existing steps
    this.elements.stepsContainer.innerHTML = '';

    if (!this.selectedBundle || !this.selectedBundle.steps) {
      return;
    }

    // Check bundle type and render accordingly
    const bundleType = this.selectedBundle.bundleType || BUNDLE_WIDGET.BUNDLE_TYPES.PRODUCT_PAGE;

    if (bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE) {
      // Full-page bundle: Render with tabs layout (async to load products)
      await this.renderFullPageLayout();
    } else {
      // Product-page bundle: Render with step boxes (current implementation)
      this.renderProductPageLayout();
    }
  }

  // Product-page bundle layout (original vertical step boxes)
  renderProductPageLayout() {
    this.selectedBundle.steps.forEach((step, index) => {
      const stepElement = this.createStepElement(step, index);
      this.elements.stepsContainer.appendChild(stepElement);
    });
  }

  // Full-page bundle layout (horizontal tabs)
  async renderFullPageLayout() {

    // Hide the page-title element from the theme (shows page name like "StrangeObjectsinmirror")
    this.hidePageTitle();

    // Clear existing content
    this.elements.stepsContainer.innerHTML = '';
    this.elements.stepsContainer.classList.add('full-page-layout');

    // Wrap content in full-page-content-section for proper padding
    const contentSection = document.createElement('div');
    contentSection.className = 'full-page-content-section';

    // OPTIMISTIC RENDERING: Render non-product UI immediately
    // 0. Render promo banner at the very top (before step timeline)
    const promoBanner = this.createPromoBanner();
    if (promoBanner) {
      contentSection.appendChild(promoBanner);
    }

    // 1. Render step timeline at top (if enabled in theme settings)
    if (this.config.showStepTimeline) {
      const stepTimeline = this.createStepTimeline();
      contentSection.appendChild(stepTimeline);
    }

    // 2. Render bundle header (instruction text)
    const bundleHeader = this.createBundleInstructions();
    contentSection.appendChild(bundleHeader);

    // 3. Render search input for filtering products
    const searchInput = this.createSearchInput();
    contentSection.appendChild(searchInput);

    // 4. Render category/collection tabs if step has collections (and enabled in theme settings)
    if (this.config.showCategoryTabs) {
      const categoryTabs = this.createCategoryTabs(this.currentStepIndex);
      if (categoryTabs) {
        contentSection.appendChild(categoryTabs);
      }
    }

    // 5. Create product grid container with loading state
    const productGridContainer = document.createElement('div');
    productGridContainer.className = 'full-page-product-grid-container';
    productGridContainer.innerHTML = this.createProductGridLoadingState();
    contentSection.appendChild(productGridContainer);

    this.elements.stepsContainer.appendChild(contentSection);

    // 6. Render fixed footer (will be updated after products load)
    this.renderFullPageFooter();

    // Load products asynchronously and update grid
    try {
      await this.loadStepProducts(this.currentStepIndex);

      // Replace loading state with actual products
      const productGrid = this.createFullPageProductGrid(this.currentStepIndex);
      productGridContainer.innerHTML = '';
      productGridContainer.appendChild(productGrid);

      // Update footer with correct product data
      this.renderFullPageFooter();

      // PRELOAD NEXT STEP: Load next step's products in the background
      this.preloadNextStep();
    } catch (error) {
      productGridContainer.innerHTML = '<p class="error-message">Failed to load products. Please try again.</p>';
    }
  }

  // Create horizontal step tabs - clickable tabs showing step names
  createStepTimeline() {
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'step-tabs-container';

    if (!this.selectedBundle || !this.selectedBundle.steps) {
      return tabsContainer;
    }

    this.selectedBundle.steps.forEach((step, index) => {
      const tab = document.createElement('div');
      tab.className = 'step-tab';
      tab.dataset.stepIndex = index;

      // Determine step state
      const isCompleted = this.isStepCompleted(index);
      const isCurrent = index === this.currentStepIndex;
      const isAccessible = this.isStepAccessible(index);

      if (isCompleted) tab.classList.add('completed');
      if (isCurrent) tab.classList.add('active');
      if (!isAccessible) tab.classList.add('locked');

      // Get selection info for this step
      const selectedProducts = this.selectedProducts[index] || {};
      const hasSelections = Object.values(selectedProducts).some(qty => qty > 0);
      const totalQuantity = Object.values(selectedProducts).reduce((sum, qty) => sum + qty, 0);

      // Tab content structure
      let tabContent = '';

      if (hasSelections) {
        // Show product images if available
        const productImages = this.getStepProductImages(index);
        if (productImages.length > 0) {
          const imagesHtml = productImages.slice(0, 3).map(img =>
            `<img src="${img.url}" alt="${img.alt}" class="tab-product-image">`
          ).join('');
          tabContent = `
            <div class="tab-images">${imagesHtml}</div>
            <div class="tab-info">
              <span class="tab-name">${step.name || `Step ${index + 1}`}</span>
              <span class="tab-count">${totalQuantity} selected</span>
            </div>
            <div class="tab-check">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13 4L6 11L3 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          `;
        } else {
          // No images, just show checkmark
          tabContent = `
            <div class="tab-info">
              <span class="tab-name">${step.name || `Step ${index + 1}`}</span>
              <span class="tab-count">${totalQuantity} selected</span>
            </div>
            <div class="tab-check">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13 4L6 11L3 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          `;
        }
      } else {
        // Empty step - show step number and name
        // Get previous step name for locked tooltip
        const prevStepName = index > 0 ? (this.selectedBundle.steps[index - 1]?.name || `Step ${index}`) : '';

        tabContent = `
          <div class="tab-number">${index + 1}</div>
          <div class="tab-info">
            <span class="tab-name">${step.name || `Step ${index + 1}`}</span>
            <span class="tab-hint">${step.minQuantity ? `Select ${step.minQuantity}+` : 'Choose items'}</span>
          </div>
          ${!isAccessible ? `
            <div class="tab-lock">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M12 7H11V5C11 3.34 9.66 2 8 2C6.34 2 5 3.34 5 5V7H4C3.45 7 3 7.45 3 8V13C3 13.55 3.45 14 4 14H12C12.55 14 13 13.55 13 13V8C13 7.45 12.55 7 12 7ZM8 11C7.45 11 7 10.55 7 10C7 9.45 7.45 9 8 9C8.55 9 9 9.45 9 10C9 10.55 8.55 11 8 11ZM9.1 7H6.9V5C6.9 4.39 7.39 3.9 8 3.9C8.61 3.9 9.1 4.39 9.1 5V7Z" fill="currentColor"/>
              </svg>
            </div>
            <div class="tab-locked-tooltip">Complete "${prevStepName}" first</div>
          ` : ''}
        `;
      }

      tab.innerHTML = tabContent;

      // Make clickable if accessible
      if (isAccessible) {
        tab.style.cursor = 'pointer';
        tab.addEventListener('click', () => {
          this.currentStepIndex = index;
          this.searchQuery = ''; // Clear search when changing steps
          this.renderFullPageLayout();
        });
      }

      tabsContainer.appendChild(tab);
    });

    return tabsContainer;
  }

  // Get product images for a step (helper for tabs)
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

  // Create bundle instructions header (only shows step instruction, not bundle title)
  createBundleInstructions() {
    const header = document.createElement('div');
    header.className = 'bundle-header bundle-step-instruction';

    if (!this.selectedBundle || !this.selectedBundle.steps || !this.selectedBundle.steps[this.currentStepIndex]) {
      return header;
    }

    const currentStep = this.selectedBundle.steps[this.currentStepIndex];

    // Use custom instruction if provided, otherwise use step instruction or auto-generated text
    const defaultInstruction = currentStep.instruction || `Select ${currentStep.minQuantity || 1} or more items from ${currentStep.name}`;
    const instructionText = this.config.customInstruction || defaultInstruction;

    // Only show instruction text (title is shown in promo banner)
    header.innerHTML = `
      <p class="bundle-instruction">${instructionText}</p>
    `;

    return header;
  }

  // Create search input for filtering products within the current step
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

    // Handle input with debounce
    input.addEventListener('input', (e) => {
      const value = e.target.value;

      // Show/hide clear button
      clearBtn.style.display = value ? 'flex' : 'none';

      // Debounce the search
      if (this.searchDebounceTimer) {
        clearTimeout(this.searchDebounceTimer);
      }

      this.searchDebounceTimer = setTimeout(() => {
        this.searchQuery = value;
        this.updateProductGridWithSearch();
      }, 300);
    });

    // Handle clear button
    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.style.display = 'none';
      this.searchQuery = '';
      this.updateProductGridWithSearch();
      input.focus();
    });

    // Handle escape key to clear
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

  // Update product grid when search query changes (without full re-render)
  updateProductGridWithSearch() {
    const gridContainer = this.container.querySelector('.full-page-product-grid-container');
    if (!gridContainer) return;

    const productGrid = this.createFullPageProductGrid(this.currentStepIndex);
    gridContainer.innerHTML = '';
    gridContainer.appendChild(productGrid);
  }

  // Hide the page title element from the theme template
  // This prevents showing the page name (e.g., "StrangeObjectsinmirror") above the bundle
  hidePageTitle() {
    // Try multiple selectors to find the page title element
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
          // Check if this is a page title element (not our promo banner)
          if (el.closest('.promo-banner')) return;

          // Hide the element
          el.style.display = 'none';
        });
      } catch (e) {
        // Selector might be invalid, continue to next
      }
    }

    // Also hide any parent containers that only contain the title
    const pageTitleContainers = document.querySelectorAll('.page-width--narrow');
    pageTitleContainers.forEach(container => {
      // Only hide if the container has a page title and not much else
      const hasPageTitle = container.querySelector('.main-page-title, .page-title, h1.h0');
      const hasOtherContent = container.querySelector('.rte:not(:empty), .bundle-widget, #bundle-builder-app');

      if (hasPageTitle && !hasOtherContent) {
        container.style.display = 'none';
      }
    });
  }

  // Create promotional banner (Competitor-Inspired with gradient hero style)
  // Shows bundle title with optional discount info from DCP
  createPromoBanner() {
    // Check if promo banner is disabled via theme editor settings
    if (this.config.showPromoBanner === false) {
      return null;
    }

    // Check if promo banner is enabled via DCP CSS variable
    const promoBannerEnabled = getComputedStyle(document.documentElement)
      .getPropertyValue('--bundle-promo-banner-enabled')
      .trim();

    // If explicitly disabled (value is '0'), don't create the banner
    if (promoBannerEnabled === '0') {
      return null;
    }

    const bundleName = this.selectedBundle?.name || 'Build Your Bundle';
    const pricing = this.selectedBundle?.pricing;
    const rules = pricing?.rules || [];
    const currencyInfo = CurrencyManager.getCurrencyInfo();

    // Start with the bundle name as the main title
    let promoTitle = bundleName;
    let promoSubtitle = '';
    let promoNote = '';
    let discountMessage = '';

    // Check for discount rules and build discount message
    if (pricing?.enabled && rules.length > 0) {
      // Find the best discount to highlight (use nested structure)
      const bestRule = rules.reduce((best, rule) => {
        const discountValue = rule.discount?.method === 'percentage'
          ? rule.discount?.value || 0
          : ((rule.discount?.value || 0) / 100);
        const bestValue = best.discount?.method === 'percentage'
          ? best.discount?.value || 0
          : ((best.discount?.value || 0) / 100);
        return discountValue > bestValue ? rule : best;
      }, rules[0]);

      // Build discount message based on best rule (using nested structure)
      const targetQty = bestRule.condition?.value || bestRule.minQuantity || 0;
      const discountMethod = bestRule.discount?.method || bestRule.discountType;
      const discountValue = bestRule.discount?.value || bestRule.discountValue || 0;

      if (discountMethod === 'percentage' && discountValue > 0) {
        discountMessage = `Add ${targetQty} items and get ${discountValue}% off!`;
      } else if (discountMethod === 'fixed_amount' && discountValue > 0) {
        const formattedAmount = CurrencyManager.formatMoney(discountValue * 100, currencyInfo.display.format);
        discountMessage = `Add ${targetQty} items and save ${formattedAmount}!`;
      } else if (discountMethod === 'fixed_price' && discountValue > 0) {
        const formattedPrice = CurrencyManager.formatMoney(discountValue * 100, currencyInfo.display.format);
        discountMessage = `Add ${targetQty} items for just ${formattedPrice}!`;
      }
    }

    // Use custom banner message if configured (overrides discount message)
    if (pricing?.messages?.banner) {
      discountMessage = pricing.messages.banner;
    }

    // Determine layout based on whether we have a discount
    // Use theme editor settings for customizable text
    if (discountMessage) {
      // With discount: Use subtitle from theme settings, discount as note
      promoSubtitle = this.config.promoBannerSubtitle || 'Mix & Match';
      promoNote = discountMessage;
    } else {
      // No discount: Use tagline and note from theme settings
      promoSubtitle = this.config.promoBannerTagline || 'Create Your Perfect Bundle';
      promoNote = this.config.promoBannerNote || 'Mix & Match Your Favorites';
    }

    const banner = document.createElement('div');
    banner.className = 'promo-banner';
    banner.classList.add(discountMessage ? 'has-discount' : 'no-discount');
    banner.innerHTML = `
      ${promoSubtitle ? `<div class="promo-banner-subtitle">${promoSubtitle}</div>` : ''}
      <h2 class="promo-banner-title">${promoTitle}</h2>
      ${promoNote ? `<div class="promo-banner-note">${promoNote}</div>` : ''}
    `;

    // Apply per-bundle promo banner background image
    const bgImageUrl = this.selectedBundle && this.selectedBundle.promoBannerBgImage;
    banner.style.setProperty(
      '--bundle-promo-banner-bg-image',
      bgImageUrl ? `url('${bgImageUrl}')` : 'none'
    );

    // Apply crop offsets when crop data is present
    const cropRaw = this.selectedBundle && this.selectedBundle.promoBannerBgImageCrop;
    if (bgImageUrl && cropRaw) {
      try {
        const crop = JSON.parse(cropRaw);
        const cw = crop.width / 100;    // normalized crop width (0–1)
        const ch = cw * (3 / 16);       // derived height fraction (same aspect as banner)
        const cx = crop.x / 100;        // normalized left edge
        const cy = crop.y / 100;        // normalized top edge
        const bgSize = `${(1 / cw) * 100}%`;
        const posX = (1 - cw) === 0 ? 0 : Math.min(100, Math.max(0, (cx / (1 - cw)) * 100));
        const posY = (1 - ch) === 0 ? 0 : Math.min(100, Math.max(0, (cy / (1 - ch)) * 100));
        banner.style.backgroundSize = bgSize;
        banner.style.backgroundPosition = `${posX}% ${posY}%`;
      } catch (_e) {
        // Invalid crop JSON — fall back to default cover/center
      }
    }

    return banner;
  }

  // Create category/collection tabs (Pill Button Style)
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

    // Add "All" tab - Pill button style
    const allTab = document.createElement('button');
    allTab.className = 'category-tab';
    if (!this.activeCollectionId) {
      allTab.classList.add('active');
    }
    allTab.innerHTML = `<span class="tab-label">All</span>`;
    allTab.addEventListener('click', () => {
      this.activeCollectionId = null;
      this.renderFullPageLayout();
    });
    tabsContainer.appendChild(allTab);

    // Add collection tabs - Pill button style
    step.collections.forEach(collection => {
      const tab = document.createElement('button');
      tab.className = 'category-tab';
      if (this.activeCollectionId === collection.id) {
        tab.classList.add('active');
      }
      tab.innerHTML = `<span class="tab-label">${collection.title}</span>`;
      tab.addEventListener('click', () => {
        this.activeCollectionId = collection.id;
        this.renderFullPageLayout();
      });
      tabsContainer.appendChild(tab);
    });

    return tabsContainer;
  }

  // Create horizontal scrollable product grid
  createFullPageProductGrid(stepIndex) {
    const grid = document.createElement('div');
    grid.className = 'full-page-product-grid';

    if (!this.selectedBundle || !this.selectedBundle.steps || !this.selectedBundle.steps[stepIndex]) {
      return grid;
    }

    const step = this.selectedBundle.steps[stepIndex];
    // Use processed product data with proper variant IDs
    let products = this.stepProductData[stepIndex] || [];


    // Filter by active collection if selected
    if (this.activeCollectionId && step.collections) {
      const activeCollection = step.collections.find(c => c.id === this.activeCollectionId);
      if (activeCollection && activeCollection.products) {
        products = activeCollection.products;
      }
    }

    // Expand products with variants into separate cards (one card per variant)
    let expandedProducts = this.expandProductsByVariant(products);

    // Filter by search query if active
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
      // Show appropriate message based on whether there's a search query
      const message = this.searchQuery
        ? `No products match "${this.searchQuery}"`
        : 'No products available in this step.';
      grid.innerHTML = `<p class="no-products">${message}</p>`;
      return grid;
    }


    // Create product cards using ComponentGenerator
    expandedProducts.forEach(product => {
      const productCard = this.createProductCard(product, stepIndex);
      grid.appendChild(productCard);
    });

    return grid;
  }

  // Expand products with multiple variants into separate product entries
  // Each variant becomes its own card showing "Product Title - Variant Name"
  expandProductsByVariant(products) {
    return products.flatMap(product => {
      // If product already has a variantId and parentProductId, it was already expanded
      if (product.parentProductId && product.variantId) {
        return [product];
      }

      // If product has multiple variants, expand into separate cards
      if (product.variants && product.variants.length > 1) {
        return product.variants
          .filter(variant => variant.available !== false) // Only show available variants
          .map(variant => {
            // Use variant image if available, fallback to product image
            const imageUrl = variant.image?.src || variant.image || product.imageUrl || 'https://via.placeholder.com/150';

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
              // Remove variants array from individual cards to prevent showing variant selector
              variants: null
            };
          });
      }

      // Single variant or no variants - return as-is
      return [product];
    });
  }

  // Create loading skeleton for product grid - solid pulsating cards
  // No internal button/quantity skeletons - just clean solid cards
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
          background: #f5f5f5;
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
            #f0f0f0 0%,
            #f0f0f0 40%,
            #e0e0e0 50%,
            #f0f0f0 60%,
            #f0f0f0 100%
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

  // Preload next step's products in the background
  preloadNextStep() {
    const nextStepIndex = this.currentStepIndex + 1;

    // Check if there is a next step
    if (nextStepIndex >= this.selectedBundle.steps.length) {
      return;
    }

    // Check if next step products are already loaded
    if (this.stepProductData[nextStepIndex]?.length > 0) {
      return;
    }


    // Load in background (don't await)
    this.loadStepProducts(nextStepIndex)
      .then(() => {
      })
      .catch(error => {
        // Don't show error to user - preloading is optimization only
      });
  }

  // Create a product card DOM element for full-page layout
  createProductCard(product, stepIndex) {
    const productId = product.variantId || product.id;
    const currentQuantity = this.selectedProducts[stepIndex]?.[productId] || 0;


    // Ensure product has an image URL (use multiple fallbacks)
    if (!product.imageUrl || product.imageUrl === '') {
      product.imageUrl = product.image?.src ||
                        product.featuredImage?.url ||
                        product.images?.[0]?.url ||
                        'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png';
    }

    // Get currency info for formatting
    const currencyInfo = {
      display: {
        currency: window.shopCurrency || 'USD',
        format: window.shopMoneyFormat || '${{amount}}'
      }
    };

    // Use ComponentGenerator to render HTML (available in same scope after bundling)
    const htmlString = ComponentGenerator.renderProductCard(
      product,
      currentQuantity,
      currencyInfo,
      { showQuantitySelector: this.config.showQuantitySelectorOnCard }
    );

    // Convert HTML string to DOM element
    const wrapper = document.createElement('div');
    wrapper.innerHTML = htmlString.trim();
    const cardElement = wrapper.firstChild;

    // Attach event listeners for full-page specific interactions
    this.attachProductCardListeners(cardElement, product, stepIndex);

    return cardElement;
  }

  // Attach event listeners to product card
  attachProductCardListeners(cardElement, product, stepIndex) {
    const productId = product.variantId || product.id;

    // Quantity controls (both old-style and inline-style buttons)
    const increaseBtns = cardElement.querySelectorAll('.qty-increase');
    const decreaseBtns = cardElement.querySelectorAll('.qty-decrease');
    const addBtn = cardElement.querySelector('.product-add-btn');

    increaseBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card click from triggering
        const currentQty = this.selectedProducts[stepIndex]?.[productId] || 0;
        this.updateProductSelection(stepIndex, productId, currentQty + 1);
      });
    });

    decreaseBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card click from triggering
        const currentQty = this.selectedProducts[stepIndex]?.[productId] || 0;
        if (currentQty > 0) {
          this.updateProductSelection(stepIndex, productId, currentQty - 1);
        }
      });
    });

    if (addBtn) {
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card click from triggering
        const currentQty = this.selectedProducts[stepIndex]?.[productId] || 0;
        if (currentQty === 0) {
          // Add product directly to bundle (modal opens only on card image/title click)
          this.updateProductSelection(stepIndex, productId, 1);
        } else {
          // Toggle off if already added
          this.updateProductSelection(stepIndex, productId, 0);
        }
      });
    }

    // Variant selector
    const variantSelector = cardElement.querySelector('.variant-selector');
    if (variantSelector) {
      variantSelector.addEventListener('change', (e) => {
        e.stopPropagation(); // Prevent card click from triggering
        const newVariantId = e.target.value;
        // Update product object with new variant
        product.variantId = newVariantId;
        // Re-render this card
        const currentQty = this.selectedProducts[stepIndex]?.[productId] || 0;
        this.updateProductSelection(stepIndex, newVariantId, currentQty);
      });
    }

    // Product card click - open modal (clicking on image or title area)
    const productImage = cardElement.querySelector('.product-image');
    const productTitle = cardElement.querySelector('.product-title');

    const openModalHandler = (e) => {
      e.stopPropagation();
      if (this.productModal) {
        const step = this.selectedBundle.steps[stepIndex];
        this.productModal.open(product, step);
      }
    };

    if (productImage) {
      productImage.style.cursor = 'pointer';
      productImage.addEventListener('click', openModalHandler);
    }

    if (productTitle) {
      productTitle.style.cursor = 'pointer';
      productTitle.addEventListener('click', openModalHandler);
    }
  }

  // Render fixed footer with selected products and navigation (Competitor-Inspired Design)
  renderFullPageFooter() {
    if (!this.elements.footer) {
      return;
    }

    this.elements.footer.innerHTML = '';
    this.elements.footer.className = 'full-page-footer redesigned';
    this.elements.footer.style.display = 'block';

    // Calculate pricing data
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
    const finalPrice = discountInfo.hasDiscount ? discountInfo.finalPrice : totalPrice;
    const allSelectedProducts = this.getAllSelectedProductsData();

    // Calculate progress for discount (if applicable)
    const nextRule = PricingCalculator.getNextDiscountRule?.(this.selectedBundle, totalQuantity) || null;
    const progressPercent = this.calculateDiscountProgress(totalQuantity);

    // === SECTION 1: Progress Bar with Discount Messaging ===
    const progressSection = document.createElement('div');
    progressSection.className = 'footer-progress-section';

    // Build discount messaging
    let discountMessage = '';
    if (this.selectedBundle?.pricing?.enabled) {
      if (discountInfo.hasDiscount) {
        const variables = TemplateManager.createDiscountVariables(
          this.selectedBundle,
          totalPrice,
          totalQuantity,
          discountInfo,
          currencyInfo
        );
        discountMessage = TemplateManager.replaceVariables(
          this.config.successMessageTemplate || '🎉 You unlocked {{discountText}}!',
          variables
        );
      } else if (nextRule) {
        // Calculate remaining items needed from nested rule structure
        const targetQuantity = nextRule.condition?.value || 0;
        const remaining = Math.max(0, targetQuantity - totalQuantity);

        // Build discount text from nested discount structure
        let discountText = '';
        const discountMethod = nextRule.discount?.method;
        const discountValue = nextRule.discount?.value || 0;

        if (discountMethod === 'percentage') {
          discountText = `${discountValue}% off`;
        } else if (discountMethod === 'fixed_amount') {
          discountText = CurrencyManager.formatMoney(discountValue * 100, currencyInfo.display.format) + ' off';
        } else if (discountMethod === 'fixed_price') {
          discountText = 'a special price of ' + CurrencyManager.formatMoney(discountValue * 100, currencyInfo.display.format);
        } else {
          discountText = 'a discount';
        }

        // Improved messaging with encouraging copy
        if (remaining === 1) {
          discountMessage = `Almost there! Add 1 more item to unlock ${discountText}`;
        } else if (remaining <= 3) {
          discountMessage = `Just ${remaining} more items to unlock ${discountText}!`;
        } else {
          discountMessage = `Add ${remaining} more items to get ${discountText}`;
        }
      }
    }

    progressSection.innerHTML = `
      ${discountMessage ? `<div class="footer-discount-message">${discountMessage}</div>` : ''}
    `;

    // === SECTION 2: Scrollable Product Tiles (centered above navigation) ===
    const productsSection = this.createFooterProductTiles(allSelectedProducts, currencyInfo);

    // === SECTION 3: Navigation with Total between buttons ===
    const navSection = document.createElement('div');
    navSection.className = 'footer-nav-section';

    const isLastStep = this.currentStepIndex === this.selectedBundle.steps.length - 1;
    const canProceed = this.canProceedToNextStep();

    // Create Back button
    const backBtn = document.createElement('button');
    backBtn.className = 'footer-btn footer-btn-back';
    backBtn.textContent = 'Back';
    if (this.currentStepIndex === 0) {
      backBtn.disabled = true;
    }

    backBtn.addEventListener('click', () => {
      if (this.currentStepIndex > 0) {
        this.currentStepIndex--;
        this.renderFullPageLayout();
      }
    });

    // Create Total section (between buttons)
    const totalSection = document.createElement('div');
    totalSection.className = 'footer-total-section';
    totalSection.innerHTML = `
      <span class="total-label">Total</span>
      <div class="total-prices">
        ${discountInfo.hasDiscount ? `<span class="total-original">${CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format)}</span>` : ''}
        <span class="total-final">${CurrencyManager.formatMoney(finalPrice, currencyInfo.display.format)}</span>
      </div>
    `;

    // Create Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'footer-btn footer-btn-next';
    nextBtn.textContent = isLastStep ? 'Add to Cart' : 'Next';
    if (isLastStep ? !this.areBundleConditionsMet() : !canProceed) {
      nextBtn.disabled = true;
    }

    nextBtn.addEventListener('click', () => {
      if (isLastStep) {
        this.addBundleToCart();
      } else if (canProceed) {
        this.currentStepIndex++;
        this.renderFullPageLayout();
      }
    });

    // Assemble nav section: Back | Total | Next
    navSection.appendChild(backBtn);
    navSection.appendChild(totalSection);
    navSection.appendChild(nextBtn);

    // Assemble footer: Progress -> Products (centered) -> Navigation
    this.elements.footer.appendChild(progressSection);
    this.elements.footer.appendChild(productsSection);
    this.elements.footer.appendChild(navSection);
  }

  // Create scrollable product tiles component for footer
  // Shows product image, name, variant (if any), and remove button
  createFooterProductTiles(allSelectedProducts, currencyInfo) {
    const container = document.createElement('div');
    container.className = 'footer-products-tiles-container';

    if (allSelectedProducts.length === 0) {
      return container;
    }

    // Create scrollable tiles wrapper
    const tilesWrapper = document.createElement('div');
    tilesWrapper.className = 'footer-products-tiles-wrapper';

    // Show each selected item as its own tile (already expanded by variant)
    allSelectedProducts.forEach(item => {
      const tile = document.createElement('div');
      tile.className = 'footer-product-tile';

      // Determine if this is a variant
      const variantInfo = item.variantTitle && item.variantTitle !== 'Default Title'
        ? item.variantTitle
        : '';

      // Truncate product name for compact display
      const displayTitle = this.truncateTitle(item.parentTitle || item.title, 20);

      tile.innerHTML = `
        <div class="tile-image-wrapper">
          <img src="${item.imageUrl || 'https://via.placeholder.com/50'}" alt="${item.title}" class="tile-image">
          <span class="tile-quantity-badge">${item.quantity}</span>
        </div>
        <div class="tile-info">
          <span class="tile-product-name">${displayTitle}</span>
          ${variantInfo ? `<span class="tile-variant-name">${variantInfo}</span>` : ''}
        </div>
        <button class="tile-remove" data-step="${item.stepIndex}" data-variant-id="${item.variantId}" aria-label="Remove ${item.title}">×</button>
      `;

      // Attach remove handler with undo support
      const removeBtn = tile.querySelector('.tile-remove');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        // Store item data for undo
        const removedItem = {
          stepIndex: item.stepIndex,
          variantId: item.variantId,
          quantity: item.quantity,
          title: item.title
        };

        // Remove the product
        this.updateProductSelection(item.stepIndex, item.variantId, 0);

        // Show undo toast
        const truncatedTitle = removedItem.title.length > 25
          ? removedItem.title.substring(0, 25) + '...'
          : removedItem.title;

        ToastManager.showWithUndo(
          `Removed "${truncatedTitle}"`,
          () => {
            // Undo callback - restore the product
            this.updateProductSelection(removedItem.stepIndex, removedItem.variantId, removedItem.quantity);
          },
          5000
        );
      });

      tilesWrapper.appendChild(tile);
    });

    container.appendChild(tilesWrapper);
    return container;
  }

  // Helper: Calculate discount progress percentage
  calculateDiscountProgress(currentQuantity) {
    if (!this.selectedBundle?.pricing?.enabled) return 0;

    const rules = this.selectedBundle.pricing.rules || [];
    if (rules.length === 0) return 0;

    // Find the highest threshold
    const maxThreshold = Math.max(...rules.map(r => r.minQuantity || 0));
    if (maxThreshold === 0) return 0;

    return Math.min(100, (currentQuantity / maxThreshold) * 100);
  }

  // Helper: Truncate title for compact display
  truncateTitle(title, maxLength) {
    if (!title) return '';
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  }

  // Helper: Get all selected products data for footer display
  getAllSelectedProductsData() {
    const allProducts = [];

    this.selectedBundle.steps.forEach((step, stepIndex) => {
      const stepSelections = this.selectedProducts[stepIndex] || {};
      const productsInStep = this.stepProductData[stepIndex] || [];

      Object.entries(stepSelections).forEach(([variantId, quantity]) => {
        if (quantity > 0) {
          // Find product in processed stepProductData
          // Check multiple ways: direct variantId match, direct id match, or variant within variants array
          let product = productsInStep.find(p =>
            String(p.variantId) === String(variantId) || String(p.id) === String(variantId)
          );

          // If not found directly, search within variants array of each product
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
            // Determine the correct data based on whether we found a variant within a product
            const variantData = matchedVariant || product;
            const isVariantMatch = !!matchedVariant;

            // Build variant title
            let variantTitle = '';
            if (isVariantMatch && matchedVariant.title && matchedVariant.title !== 'Default Title') {
              variantTitle = matchedVariant.title;
            } else if (product.variantTitle && product.variantTitle !== 'Default Title') {
              variantTitle = product.variantTitle;
            }

            // Get the appropriate image - prefer variant image, fallback to product image
            const imageUrl = isVariantMatch
              ? (matchedVariant.image?.src || matchedVariant.image || product.imageUrl || product.image?.src || '')
              : (product.imageUrl || product.image?.src || '');

            // Get the appropriate price - use variant price if available
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
              price: price
            });
          } else {
          }
        }
      });
    });

    return allProducts;
  }

  /**
   * Group selected variants by product for multi-variant display
   * @param {Array} selectedProducts - Array of selected product variants
   * @returns {Array} Array of product groups with their variants
   */
  groupVariantsByProduct(selectedProducts) {
    const productMap = new Map();

    selectedProducts.forEach(item => {
      // Find the full product data
      const product = this.stepProductData[item.stepIndex]?.find(p => {
        // Check if this product has this variant
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

  /**
   * Show variant breakdown popup for a product with multiple variants
   * @param {Object} productGroup - Product group with multiple variants
   */
  showVariantBreakdown(productGroup) {
    const overlay = document.createElement('div');
    overlay.className = 'variant-breakdown-overlay';

    const popup = document.createElement('div');
    popup.className = 'variant-breakdown-popup';

    // Get variant details
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
            <span class="variant-quantity">Qty: ${variant.quantity} × ${CurrencyManager.formatMoney(variant.price, currencyInfo.display.format)}</span>
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

    // Event handlers
    popup.querySelector('.close-breakdown-btn').addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    popup.querySelectorAll('.remove-variant-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const stepIndex = parseInt(e.target.dataset.step);
        const variantId = e.target.dataset.variantId;
        this.updateProductSelection(stepIndex, variantId, 0);
        document.body.removeChild(overlay);
        this.renderFullPageLayout();
      });
    });

    popup.querySelector('.add-another-variant-btn').addEventListener('click', () => {
      document.body.removeChild(overlay);
      // Find the product and open modal for it
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

  // Helper: Find product by variant ID in a step
  findProductByVariantId(step, variantId) {
    return step.products?.find(p =>
      p.variants?.some(v => v.id === variantId) || p.id === variantId
    );
  }

  // Helper: Check if step is completed
  isStepCompleted(stepIndex) {
    const stepSelections = this.selectedProducts[stepIndex] || {};
    const totalQuantity = Object.values(stepSelections).reduce((sum, qty) => sum + qty, 0);
    const step = this.selectedBundle.steps[stepIndex];

    // If no conditions are set, step is optional - user can skip without selecting products
    if (!step.conditionType || !step.conditionOperator || step.conditionValue === null) {
      return true; // Optional step - always valid, can proceed with 0 products
    }

    // Otherwise use minQuantity for step completion
    return totalQuantity >= (step.minQuantity || 1);
  }

  // Helper: Check if step is accessible
  isStepAccessible(stepIndex) {
    if (stepIndex === 0) return true;

    // Check if all previous steps meet minimum requirements
    for (let i = 0; i < stepIndex; i++) {
      if (!this.isStepCompleted(i)) {
        return false;
      }
    }

    return true;
  }

  // Helper: Check if can proceed to next step
  canProceedToNextStep() {
    return this.isStepCompleted(this.currentStepIndex);
  }

  // Helper: Check if all bundle conditions are met
  areBundleConditionsMet() {
    return this.selectedBundle.steps.every((step, index) => this.isStepCompleted(index));
  }

  // Add bundle to cart
  async addBundleToCart() {
    try {
      // Build cart items from selected products
      const items = [];

      // Generate unique bundle instance ID for this add-to-cart action
      // This allows cart transform to group components and prevents Shopify from
      // consolidating separate bundle instances added at different times
      const bundleInstanceId = crypto.randomUUID();
      const bundleName = this.selectedBundle.name || 'Bundle';


      this.selectedBundle.steps.forEach((step, stepIndex) => {
        const stepSelections = this.selectedProducts[stepIndex] || {};


        Object.entries(stepSelections).forEach(([variantId, quantity]) => {
          if (quantity > 0) {
            // Ensure we're using a numeric variant ID (extract from GID if needed)
            const numericVariantId = this.extractId(variantId) || variantId;


            items.push({
              id: numericVariantId,
              quantity: quantity,
              properties: {
                '_bundle_id': bundleInstanceId,
                '_bundle_name': bundleName,
                '_step_index': String(stepIndex),
                '_step_name': step.name
              }
            });
          }
        });
      });

      if (items.length === 0) {
        ToastManager.show('Please select products before adding to cart');
        return;
      }


      // Add to Shopify cart
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

      // Show success message
      ToastManager.show('Bundle added to cart successfully!');

      // Redirect to cart page after short delay
      setTimeout(() => {
        window.location.href = '/cart';
      }, 1000);

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

      // Add close icon badge at top right to clear all selections
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
        e.stopPropagation(); // Prevent opening modal
        this.clearStepSelections(index);
      });
      stepBox.appendChild(clearBadge);

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

    // Only show step name and selection count if no selections made
    if (!hasSelections) {
      // Add step name (without step number)
      const stepName = document.createElement('p');
      stepName.className = 'step-name';
      stepName.textContent = step.name || `Step ${index + 1}`;
      stepBox.appendChild(stepName);

      // Add selection count
      const selectionCount = document.createElement('div');
      selectionCount.className = 'step-selection-count';
      selectionCount.textContent = this.getStepSelectionText(selectedProducts);
      stepBox.appendChild(selectionCount);
    }

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

  clearStepSelections(stepIndex) {
    // Clear all product selections for this step
    this.selectedProducts[stepIndex] = {};

    // Update UI
    this.renderSteps();
    this.updateFooterMessaging();

    // Show toast notification
    ToastManager.show(`All selections cleared from this step`);
  }

  renderFooter() {
    const bundleType = this.container.dataset.bundleType;

    // Full-page bundles use their own footer with selected products, totals, and navigation
    if (bundleType === 'full_page') {
      this.renderFullPageFooter();
      return;
    }

    // Product-page bundles use discount messaging footer
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


    if (progressFill) {
      progressFill.style.width = `${progressPercentage}%`;
    }
  }

  // ========================================================================
  // MODAL FUNCTIONALITY
  // ========================================================================

  // Helper method to get formatted header text
  getFormattedHeaderText() {
    // If discount is not enabled, show step name
    if (!this.selectedBundle?.pricing?.enabled) {
      const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
      return currentStep?.name || `Step ${this.currentStepIndex + 1}`;
    }

    const { totalQuantity, totalPrice } = PricingCalculator.calculateBundleTotal(
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

    return TemplateManager.replaceVariables(
      this.config.discountTextTemplate,
      variables
    );
  }

  openModal(stepIndex) {
    this.currentStepIndex = stepIndex;

    // Update modal header
    const modal = this.elements.modal;
    const headerText = this.getFormattedHeaderText();

    modal.querySelector('.modal-step-title').innerHTML = headerText;

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
      ToastManager.show('Failed to load products for this step');
    });
  }

  closeModal() {
    this.elements.modal.style.display = 'none';
    this.elements.modal.classList.remove('active');
    document.body.style.overflow = '';

    // Update main UI
    this.renderSteps();
    this.updateFooterMessaging();
  }

  async loadStepProducts(stepIndex) {
    const step = this.selectedBundle.steps[stepIndex];

    if (this.stepProductData[stepIndex].length > 0) {
      return;
    }


    let allProducts = [];

    // Process explicit products - fetch using Storefront API via our backend
    if (step.products && Array.isArray(step.products) && step.products.length > 0) {
      const productIds = step.products.map(p => p.id); // Keep full GID format
      const shop = window.Shopify?.shop || window.location.host;

      // Get app URL from widget data attribute or window global
      const appUrl = window.__BUNDLE_APP_URL__ || '';
      const apiBaseUrl = appUrl || window.location.origin;


      try {
        const response = await fetch(`${apiBaseUrl}/api/storefront-products?ids=${encodeURIComponent(productIds.join(','))}&shop=${encodeURIComponent(shop)}`);

        if (!response.ok) {
          const errorText = await response.text();
          return;
        }

        const data = await response.json();

        if (data.products && data.products.length > 0) {
          allProducts = allProducts.concat(data.products);
        } else {
        }
      } catch (error) {
      }
    }

    if (step.StepProduct && Array.isArray(step.StepProduct) && step.StepProduct.length > 0) {
      // Check if StepProduct already has enriched data (for full-page bundles)
      const hasEnrichedData = step.StepProduct.some(sp => sp.title && sp.imageUrl && sp.price);

      if (hasEnrichedData) {

        // Transform StepProduct to match expected product format
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
        // Fetch from storefront API if data is not enriched
        const productGids = step.StepProduct.map(sp => sp.productId).filter(Boolean);
        const shop = window.Shopify?.shop || window.location.host;

        if (productGids.length > 0) {

          const appUrl = window.__BUNDLE_APP_URL__ || '';
          const apiBaseUrl = appUrl || window.location.origin;

          try {
            const response = await fetch(`${apiBaseUrl}/api/storefront-products?ids=${encodeURIComponent(productGids.join(','))}&shop=${encodeURIComponent(shop)}`);

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

    // Process collection products using Storefront API (not legacy REST endpoint)
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
          } else {
          }
        } catch (error) {
        }
      }
    }

    // Process and normalize product data

    const processedProducts = this.processProductsForStep(allProducts, step);


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

  }

  processProductsForStep(products, step) {
    return products.flatMap(product => {
      if (step.displayVariantsAsIndividual && product.variants && product.variants.length > 0) {
        // Display each variant as separate product - filter out unavailable variants
        // Preserve parent product reference for variant selection in modal
        const processedVariants = (product.variants || []).map(v => ({
          id: this.extractId(v.id),
          title: v.title,
          price: parseFloat(v.price || '0') * 100,
          compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) * 100 : null,
          available: v.available === true,
          option1: v.option1 || null,
          option2: v.option2 || null,
          option3: v.option3 || null,
          image: v.image || null
        }));

        const processedOptions = (product.options || []).map(opt => {
          if (typeof opt === 'string') return opt;
          return opt.name || opt;
        });

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
              compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice) * 100 : null,
              variantId: this.extractId(variant.id),
              available: variant.available === true,
              // Preserve parent product data for variant selection in modal
              parentProductId: this.extractId(product.id),
              parentTitle: product.title,
              variants: processedVariants,
              options: processedOptions,
              images: product.images || (product.imageUrl ? [{ src: product.imageUrl }] : []),
              description: product.description || ''
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

        // Process variants array for variant selection in modal
        const processedVariants = (product.variants || []).map(v => ({
          id: this.extractId(v.id),
          title: v.title,
          price: parseFloat(v.price || '0') * 100,
          compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) * 100 : null,
          available: v.available === true,
          option1: v.option1 || null,
          option2: v.option2 || null,
          option3: v.option3 || null,
          image: v.image || null
        }));

        // Process options array for variant selector labels
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
          // Preserve variants and options for variant selection in modal
          variants: processedVariants,
          options: processedOptions,
          // Preserve images array for modal gallery
          images: product.images || (product.imageUrl ? [{ src: product.imageUrl }] : []),
          description: product.description || ''
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
      const isAccessible = this.isStepAccessible(index);
      const isActive = index === this.currentStepIndex;

      // Create tab button
      const tabButton = document.createElement('button');
      tabButton.className = `bundle-header-tab ${isActive ? 'active' : ''} ${!isAccessible ? 'locked' : ''}`;
      tabButton.textContent = step.name || `Step ${index + 1}`;
      tabButton.dataset.stepIndex = index.toString();

      // Click handler
      tabButton.addEventListener('click', async () => {
        if (!isAccessible) {
          ToastManager.show('Please complete the previous steps first.');
          return;
        }

        this.currentStepIndex = index;

        // Update modal header
        const headerText = this.getFormattedHeaderText();
        this.elements.modal.querySelector('.modal-step-title').innerHTML = headerText;

        // Load products for this step if not already loaded
        await this.loadStepProducts(index);

        // Re-render everything
        this.renderModalTabs();
        this.renderModalProducts(index);
        this.updateModalNavigation();
        this.updateModalFooterMessaging();
      });

      tabsContainer.appendChild(tabButton);
    });

    // Update arrow visibility after rendering tabs
    if (this.updateTabArrows) {
      setTimeout(() => this.updateTabArrows(), 50);
    }
  }

  renderModalProducts(stepIndex, productsToRender = null) {
    // Use all products from step data
    const products = productsToRender || this.stepProductData[stepIndex];
    const selectedProducts = this.selectedProducts[stepIndex];
    const productGrid = this.elements.modal.querySelector('.product-grid');

    if (products.length === 0) {
      // Show empty state cards like in DCP preview
      const currentStep = this.selectedBundle.steps[stepIndex];
      const stepName = currentStep?.name || `Step ${stepIndex + 1}`;
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

      return `
        <div class="product-card ${currentQuantity > 0 ? 'selected' : ''}" data-product-id="${selectionKey}">
          ${currentQuantity > 0 ? `
            <div class="selected-overlay">✓</div>
          ` : ''}

          <div class="product-image">
            <img src="${product.imageUrl}" alt="${product.title}" loading="lazy">
          </div>

          <div class="product-content-wrapper">
            <div class="product-title">${product.title}</div>

            ${product.price ? `
              <div class="product-price-row">
                ${product.compareAtPrice ? `<span class="product-price-strike">${CurrencyManager.formatMoney(product.compareAtPrice, currencyInfo.display.format)}</span>` : ''}
                <span class="product-price">${CurrencyManager.formatMoney(product.price, currencyInfo.display.format)}</span>
              </div>
            ` : ''}

            <div class="product-spacer"></div>

            ${this.renderVariantSelector(product)}

            <div class="product-quantity-wrapper">
              <div class="product-quantity-selector">
                <button class="qty-btn qty-decrease" data-product-id="${selectionKey}">−</button>
                <span class="qty-display">${currentQuantity}</span>
                <button class="qty-btn qty-increase" data-product-id="${selectionKey}">+</button>
              </div>
            </div>

            <button class="product-add-btn ${currentQuantity > 0 ? 'added' : ''}"
                    data-product-id="${selectionKey}"
                    data-product-handle="${product.handle || ''}"
                    data-step-id="${step.id}">
              ${currentQuantity > 0 ? '✓ Added to Bundle' : 'Choose Options'}
            </button>
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
      <div class="variant-selector-wrapper">
        <select class="variant-selector" data-base-product-id="${product.id}">
          ${product.variants.map(v => `
            <option value="${v.id}" ${v.id === product.variantId ? 'selected' : ''}>${v.title}</option>
          `).join('')}
        </select>
      </div>
    `;
  }

  attachProductEventHandlers(productGrid, stepIndex) {
    // Remove existing event listeners to prevent duplicates
    const newProductGrid = productGrid.cloneNode(true);
    productGrid.parentNode.replaceChild(newProductGrid, productGrid);

    // Get step data for modal
    const step = this.selectedBundle.steps[stepIndex];

    // Helper to find product by ID
    const findProduct = (productId) => {
      return this.stepProductData[stepIndex]?.find(p => {
        const selectionKey = p.variantId || p.id;
        return selectionKey === productId;
      });
    };

    // Quantity button handlers
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

    // Add to Bundle button handler - adds directly without opening modal
    newProductGrid.addEventListener('click', (e) => {
      if (e.target.classList.contains('product-add-btn')) {
        e.stopPropagation();
        const productId = e.target.dataset.productId;
        const currentQuantity = this.selectedProducts[stepIndex][productId] || 0;

        // Toggle: If already added, remove; otherwise add with quantity 1
        if (currentQuantity > 0) {
          this.updateProductSelection(stepIndex, productId, 0);
        } else {
          // Add product directly to bundle (modal opens only on card image/title click)
          this.updateProductSelection(stepIndex, productId, 1);
        }
      }
    });

    // Product image/title click - open modal
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

    // Variant selector handler
    newProductGrid.addEventListener('change', (e) => {
      if (e.target.classList.contains('variant-selector')) {
        e.stopPropagation();
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

    // Add cursor pointer styles to product images and titles
    newProductGrid.querySelectorAll('.product-image, .product-title').forEach(el => {
      el.style.cursor = 'pointer';
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

    // For full-page bundles, re-render the footer to show selected products
    const bundleType = this.container.dataset.bundleType;
    if (bundleType === 'full_page') {
      this.renderFullPageFooter();
    } else {
      this.updateFooterMessaging();
    }
  }

  updateProductQuantityDisplay(stepIndex, productId, quantity) {
    // Update quantity display without full re-render
    const productCard = document.querySelector(`[data-product-id="${productId}"]`);
    if (!productCard) return;

    const contentWrapper = productCard.querySelector('.product-content-wrapper');
    if (!contentWrapper) return;

    // Find existing action elements
    const existingAddBtn = productCard.querySelector('.product-add-btn');
    const existingQuantityControls = productCard.querySelector('.inline-quantity-controls');
    let selectedOverlay = productCard.querySelector('.selected-overlay');

    // Toggle between "Add to Bundle" button and quantity controls
    if (quantity > 0) {
      // Show quantity controls, hide button
      if (existingAddBtn) {
        existingAddBtn.remove();
      }

      if (existingQuantityControls) {
        // Just update the quantity display
        const qtyDisplay = existingQuantityControls.querySelector('.inline-qty-display');
        if (qtyDisplay) {
          qtyDisplay.textContent = quantity;
        }
      } else {
        // Create quantity controls
        const quantityControls = document.createElement('div');
        quantityControls.className = 'inline-quantity-controls';
        quantityControls.innerHTML = `
          <button class="inline-qty-btn qty-decrease" data-product-id="${productId}">−</button>
          <span class="inline-qty-display">${quantity}</span>
          <button class="inline-qty-btn qty-increase" data-product-id="${productId}">+</button>
        `;
        contentWrapper.appendChild(quantityControls);

        // Attach event listeners to the new buttons
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

      // Show selected overlay
      if (!selectedOverlay) {
        selectedOverlay = document.createElement('div');
        selectedOverlay.className = 'selected-overlay';
        selectedOverlay.textContent = '✓';
        productCard.appendChild(selectedOverlay);
      }
      selectedOverlay.style.display = 'flex';
      productCard.classList.add('selected');

    } else {
      // Show "Add to Bundle" button, hide quantity controls
      if (existingQuantityControls) {
        existingQuantityControls.remove();
      }

      if (!existingAddBtn) {
        // Find product info to determine button text
        const product = this.findProductById(stepIndex, productId);
        const hasVariants = product?.variants && product.variants.length > 1;
        const buttonText = hasVariants ? 'Choose Size' : 'Add to Bundle';

        const addButton = document.createElement('button');
        addButton.className = 'product-add-btn';
        addButton.dataset.productId = productId;
        addButton.textContent = buttonText;
        contentWrapper.appendChild(addButton);

        // Attach event listener to the new button
        addButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.updateProductSelection(stepIndex, productId, 1);
        });
      }

      // Hide selected overlay
      if (selectedOverlay) {
        selectedOverlay.style.display = 'none';
      }
      productCard.classList.remove('selected');
    }
  }

  // Helper to find product by ID across all step data
  findProductById(stepIndex, productId) {
    const products = this.stepProductData[stepIndex] || [];
    return products.find(p => (p.variantId || p.id) === productId);
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
      ToastManager.show(`This step allows ${limitText} product${requiredQuantity !== 1 ? 's' : ''} only.`);
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

    // If no conditions are set, step is optional - always valid
    if (!step.conditionType || !step.conditionOperator || step.conditionValue === null) {
      return true; // Optional step - can proceed with 0 products
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
        return true; // No recognized condition - step is optional
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

    // Update modal header text dynamically
    this.updateModalHeaderText(totalPrice, totalQuantity, discountInfo, currencyInfo);

    // Update cart badge with total item count
    const cartBadge = this.elements.modal.querySelector('.cart-badge-count');
    if (cartBadge) {
      cartBadge.textContent = totalQuantity.toString();
    }

    // Update total prices in the footer pill
    this.updateFooterTotalPrices(totalPrice, discountInfo, currencyInfo);

    // Update discount messaging and progress bar
    this.updateModalDiscountMessaging(totalPrice, totalQuantity, discountInfo, currencyInfo);
  }

  updateModalHeaderText(totalPrice, totalQuantity, discountInfo, currencyInfo) {
    const modalStepTitle = this.elements.modal.querySelector('.modal-step-title');
    if (!modalStepTitle) return;

    // If discount is not enabled, show step name
    if (!this.selectedBundle?.pricing?.enabled) {
      const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
      modalStepTitle.innerHTML = currentStep?.name || `Step ${this.currentStepIndex + 1}`;
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
    const progressFill = this.elements.modal.querySelector('.modal-footer-progress-fill');
    const progressBar = this.elements.modal.querySelector('.modal-footer-progress-bar');
    const currentQuantitySpan = this.elements.modal.querySelector('.modal-footer-progress-details .current-quantity');
    const targetQuantitySpan = this.elements.modal.querySelector('.modal-footer-progress-details .target-quantity');
    const discountSection = this.elements.modal.querySelector('.modal-footer-discount-messaging');
    const progressSection = this.elements.modal.querySelector('.modal-footer-progress-section');

    if (!footerDiscountText || !progressFill) return;

    const variables = TemplateManager.createDiscountVariables(
      this.selectedBundle,
      totalPrice,
      totalQuantity,
      discountInfo,
      currencyInfo
    );

    if (discountInfo.qualifiesForDiscount) {
      // Success message
      const successMessage = TemplateManager.replaceVariables(
        this.config.successMessageTemplate,
        variables
      );
      footerDiscountText.innerHTML = successMessage;
      if (discountSection) discountSection.classList.add('qualified');
    } else {
      // Progress message
      const progressMessage = TemplateManager.replaceVariables(
        this.config.discountTextTemplate,
        variables
      );
      footerDiscountText.innerHTML = progressMessage;
      if (discountSection) discountSection.classList.remove('qualified');
    }

    // Update progress bar
    const nextRule = PricingCalculator.getNextDiscountRule(this.selectedBundle, totalQuantity, totalPrice);
    const ruleToUse = discountInfo.applicableRule || nextRule;

    let progressPercentage = 0;

    if (ruleToUse) {
      const conditionType = ruleToUse.condition?.type || 'quantity';
      const targetValue = ruleToUse.condition?.value || 0;

      if (conditionType === 'amount') {
        progressPercentage = targetValue > 0 ? Math.min(100, (totalPrice / targetValue) * 100) : 0;
        if (currentQuantitySpan && targetQuantitySpan) {
          currentQuantitySpan.textContent = CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format);
          targetQuantitySpan.textContent = CurrencyManager.formatMoney(targetValue, currencyInfo.display.format);
        }
      } else {
        progressPercentage = targetValue > 0 ? Math.min(100, (totalQuantity / targetValue) * 100) : 0;
        if (currentQuantitySpan && targetQuantitySpan) {
          currentQuantitySpan.textContent = totalQuantity.toString();
          targetQuantitySpan.textContent = targetValue.toString();
        }
      }
    }

    if (progressFill) {
      progressFill.style.width = `${progressPercentage}%`;
    }

    // Show/hide sections based on config
    if (discountSection) {
      discountSection.style.display = this.config.showDiscountMessaging ? 'block' : 'none';
    }
    if (progressSection) {
      progressSection.style.display = this.config.showProgressBar ? 'block' : 'none';
    }
  }

  updateFooterTotalPrices(totalPrice, discountInfo, currencyInfo) {
    const strikePriceEl = this.elements.modal.querySelector('.total-price-strike');
    const finalPriceEl = this.elements.modal.querySelector('.total-price-final');

    if (!strikePriceEl || !finalPriceEl) return;

    if (discountInfo.qualifiesForDiscount && discountInfo.finalPrice < totalPrice) {
      // Show strike-through original price and discounted price
      strikePriceEl.textContent = CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format);
      strikePriceEl.style.display = 'inline';
      finalPriceEl.textContent = CurrencyManager.formatMoney(discountInfo.finalPrice, currencyInfo.display.format);
    } else {
      // Show only regular price
      strikePriceEl.style.display = 'none';
      finalPriceEl.textContent = CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format);
    }
  }

  // ========================================================================
  // CART OPERATIONS
  // ========================================================================

  // NOTE: Add to cart functionality removed from full-page bundles
  // Full-page bundles use modal-based product selection only
  // Products are added to cart individually via modal's "Add to Cart" button
  /*
  async addToCart() {
    try {
      const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
        this.selectedProducts,
        this.stepProductData
      );

      if (totalQuantity === 0) {
        ToastManager.show('Please select products for your bundle before adding to cart.');
        return;
      }

      // Validate all steps
      const allStepsValid = this.selectedBundle.steps.every((_, index) => this.validateStep(index));
      if (!allStepsValid) {
        ToastManager.show('Please complete all bundle steps before adding to cart.');
        return;
      }

      const cartItems = this.buildCartItems();

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
      ToastManager.show('Bundle added to cart successfully!');

      setTimeout(() => {
        window.location.href = '/cart';
      }, 1000);

    } catch (error) {
      ToastManager.show(`Failed to add bundle to cart: ${error.message}`);
    }
  }
  */

  buildCartItems() {
    // Shopify Standard Bundle approach for configurable bundles:
    // Add ACTUAL selected component products to cart with _bundle_id property
    // Cart transform MERGE groups by _bundle_id and combines into bundle parent
    // See: https://shopify.dev/docs/apps/build/product-merchandising/bundles/create-bundle-app

    const cartItems = [];
    const bundleInstanceId = this.generateBundleInstanceId();


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
              unavailableProducts.push(product.title);
              return; // Skip this product
            }


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

      return bundleInstanceId;
    }

    // Fallback for older browsers: use timestamp + random number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    const bundleInstanceId = `${this.selectedBundle.id}_${timestamp}_${random}`;

    return bundleInstanceId;
  }
  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================

  attachEventListeners() {
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

        // Update modal header
        const headerText = this.getFormattedHeaderText();
        this.elements.modal.querySelector('.modal-step-title').innerHTML = headerText;

        // Load products for this step
        await this.loadStepProducts(newStepIndex);

        this.renderModalTabs();
        this.renderModalProducts(this.currentStepIndex);
        this.updateModalNavigation();
        this.updateModalFooterMessaging();
      } else {
        ToastManager.show('Please meet the quantity conditions for the current step before going back.');
      }
    } else if (direction > 0) {
      if (newStepIndex < this.selectedBundle.steps.length) {
        // Next step
        if (this.validateStep(this.currentStepIndex)) {
          this.currentStepIndex = newStepIndex;

          // Update modal header
          const headerText = this.getFormattedHeaderText();
          this.elements.modal.querySelector('.modal-step-title').innerHTML = headerText;

          // Load products for this step
          await this.loadStepProducts(newStepIndex);

          this.renderModalTabs();
          this.renderModalProducts(this.currentStepIndex);
          this.updateModalNavigation();
          this.updateModalFooterMessaging();
        } else {
          ToastManager.show('Please meet the quantity conditions for the current step before proceeding.');
        }
      } else {
        // Done button clicked on last step
        if (this.validateStep(this.currentStepIndex)) {
          this.closeModal();
        } else {
          ToastManager.show('Please meet the quantity conditions for the current step before finishing.');
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
// INITIALIZATION
// ============================================================================
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
