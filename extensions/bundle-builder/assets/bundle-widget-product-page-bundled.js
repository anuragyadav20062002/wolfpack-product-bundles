/*!
 * Wolfpack Bundle Widget — Product Page
 * Version : 2.4.6
 * Built   : 2026-04-02
 *
 * Cache note: Shopify CDN cache is busted automatically by shopify app deploy.
 * After deploying, allow 2-10 minutes for propagation before testing.
 * Verify live version: console.log(window.__BUNDLE_WIDGET_VERSION__)
 */
window.__BUNDLE_WIDGET_VERSION__ = '2.4.6';
(function() {
  'use strict';

  // ============================================================================
  // BUNDLE WIDGET COMPONENTS
  // ============================================================================

/**
 * Step Condition Validator
 *
 * Pure functions for evaluating step conditions in bundle widgets.
 * Used by both the product-page and full-page bundle widgets.
 *
 * Exported as a single `ConditionValidator` object so that:
 *  - The bundle build (IIFE) can access it as a local variable in scope
 *  - Node.js test environments can require() it via module.exports
 *
 * @version 1.0.0
 */


// NOTE: This file intentionally uses an IIFE + module.exports pattern (not ES module export)
// so that Jest/Node.js tests can require() it without a transform step. All other files in
// this directory use ES module syntax. Do not convert without updating the test config.
const ConditionValidator = (function () {
  // ─── Operator constants ───────────────────────────────────────────────────
  const OPERATORS = {
    EQUAL_TO:                'equal_to',
    GREATER_THAN:            'greater_than',
    LESS_THAN:               'less_than',
    GREATER_THAN_OR_EQUAL_TO: 'greater_than_or_equal_to',
    LESS_THAN_OR_EQUAL_TO:   'less_than_or_equal_to',
  };

  /**
   * Calculate the total quantity in a step AFTER a proposed update.
   *
   * Correctly handles both:
   *  - Existing products: replaces their current quantity with newQuantity
   *  - New products (not yet in currentSelections): adds newQuantity to existing total
   *
   * @param {Record<string, number>} currentSelections  Current { productId → qty } map
   * @param {string}  targetProductId  The product whose quantity is being changed
   * @param {number}  newQuantity      The proposed new quantity (0 = remove)
   * @returns {number}  Total quantity across all products in the step after the update
   */
  function calculateStepTotalAfterUpdate(currentSelections, targetProductId, newQuantity) {
    const selections = currentSelections || {};

    // Start with the target product's new quantity (handles new products correctly).
    let total = newQuantity;

    // Add every OTHER product's existing quantity unchanged.
    for (const pid of Object.keys(selections)) {
      if (pid !== targetProductId) {
        total += selections[pid] || 0;
      }
    }

    return total;
  }

  /**
   * Determine whether a proposed quantity update is permitted by the step's condition.
   *
   * Only blocks INCREASES that would violate an upper-bound operator.
   * Decreases are always permitted regardless of the condition state (so the
   * customer can switch products without getting permanently stuck).
   *
   * @param {object}  step              Step config object (conditionType, conditionOperator, conditionValue)
   * @param {Record<string, number>} currentSelections  Current selections for this step
   * @param {string}  targetProductId   Product being updated
   * @param {number}  newQuantity       Proposed quantity (0 = remove)
   * @returns {{ allowed: boolean, limitText: string|null }}
   */
  function canUpdateQuantity(step, currentSelections, targetProductId, newQuantity) {
    // No explicit condition configured → no upper bound; always allow increases
    if (!step || !step.conditionType || !step.conditionOperator || step.conditionValue == null) {
      return { allowed: true, limitText: null };
    }

    const totalAfter = calculateStepTotalAfterUpdate(
      currentSelections,
      targetProductId,
      newQuantity,
    );

    // Primary condition
    const primary = _evaluateCanUpdate(step.conditionOperator, step.conditionValue, totalAfter);
    if (!primary.allowed) return primary;

    // Secondary condition — AND logic (only when both fields are non-null)
    if (step.conditionOperator2 != null && step.conditionValue2 != null) {
      const secondary = _evaluateCanUpdate(step.conditionOperator2, step.conditionValue2, totalAfter);
      if (!secondary.allowed) return secondary;
    }

    return { allowed: true, limitText: null };
  }

  /**
   * Check whether a step's current selection fully satisfies its condition(s).
   * Called at navigation time (Next / Add to Cart) to gate step completion.
   *
   * When a second condition is present, both must be satisfied (AND logic).
   *
   * @param {object}  step              Step config object
   * @param {Record<string, number>} currentSelections  Current selections for this step
   * @returns {boolean}
   */
  function isStepConditionSatisfied(step, currentSelections) {
    if (!step) return true;

    const selections = currentSelections || {};
    let total = 0;
    for (const qty of Object.values(selections)) {
      total += qty || 0;
    }

    // No explicit condition configured → only enforce minQuantity; no upper bound
    if (!step.conditionType || !step.conditionOperator || step.conditionValue == null) {
      const min = step.minQuantity != null ? Number(step.minQuantity) : 1;
      return total >= min;
    }

    // Primary condition
    if (!_evaluateSatisfied(step.conditionOperator, step.conditionValue, total)) return false;

    // Secondary condition — AND logic
    if (step.conditionOperator2 != null && step.conditionValue2 != null) {
      return _evaluateSatisfied(step.conditionOperator2, step.conditionValue2, total);
    }

    return true;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Evaluate a single condition's "can update" rule for the proposed total.
   * Lower-bound operators never block increases (no upper cap from them alone).
   */
  function _evaluateCanUpdate(operator, required, totalAfter) {
    let allowed;
    switch (operator) {
      case OPERATORS.EQUAL_TO:
        // Allow building up to exactly N; prevent exceeding N.
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
        // Lower-bound: no upper cap — always allow increases.
        allowed = true;
        break;
      default:
        allowed = true;
    }
    return { allowed, limitText: allowed ? null : _buildLimitText(operator, required) };
  }

  /**
   * Evaluate whether a total satisfies a single condition at step-completion time.
   */
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

  // ─── Public API ───────────────────────────────────────────────────────────
  return {
    OPERATORS,
    calculateStepTotalAfterUpdate,
    canUpdateQuantity,
    isStepConditionSatisfied,
  };
}());

// CommonJS export for Node.js / Jest test environment.
// Harmless in browsers (no `module` global in IIFE context).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConditionValidator;
}


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
  },

  // Shared asset URLs
  PLACEHOLDER_IMAGE: 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png'
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

    // Fallback: Shop base currency (include rate: 1 so downstream math doesn't produce NaN)
    return { ...this.getShopBaseCurrency(), rate: 1 };
  }

  static convertCurrency(amount, fromCurrency, toCurrency, rate = 1) {
    if (fromCurrency === toCurrency) return amount;

    // Use Shopify's conversion if available
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
    const displaySymbol = this.getCurrencySymbol(customerCurrency.code);
    // Use Shopify's currency format if available (set by currency switcher apps).
    // Otherwise build a symbol-prefixed format from the display currency so we never
    // inherit the shop's base-currency format string (e.g. ₹{{amount}}) for a customer
    // viewing in a different currency (e.g. GBP).
    const displayFormat = window.Shopify?.currency?.format
      || `${displaySymbol}{{amount}}`;

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
        symbol: displaySymbol,
        format: displayFormat,
        rate: customerCurrency.rate
      },
      // Multi-currency status
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
      if (
        bundle.bundleType !== BUNDLE_WIDGET.BUNDLE_TYPES.PRODUCT_PAGE &&
        bundle.bundleType !== BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE
      ) {
        throw new Error(
          `Bundle ${bundle.id} has invalid bundleType: "${bundle.bundleType}". ` +
          `Expected "${BUNDLE_WIDGET.BUNDLE_TYPES.PRODUCT_PAGE}" or "${BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE}".`
        );
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

  static filterActiveBundles(bundles) {
    // BundleStatus enum: draft | active | archived — 'published' is not a valid status
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

    // No bundle matched the config criteria — return null so the widget hides itself
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


/**
 * Bundle Widget - Pricing Calculator
 *
 * Handles bundle pricing calculations, discount rules, and condition checking.
 *
 * @version 4.0.0
 */


class PricingCalculator {
  static calculateBundleTotal(selectedProducts, stepProductData, steps = null) {
    let totalPrice = 0;
    let totalQuantity = 0;

    selectedProducts.forEach((stepSelections, stepIndex) => {
      // Skip free gift steps — their retail cost is not charged to the customer.
      // The cart transform handles making them $0 at checkout via adjusted discount math.
      if (steps?.[stepIndex]?.isFreeGift) return;

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
          // All prices in our pipeline are in cents (see MEMORY.md pricing pipeline).
          // Use variant price if matched via nested lookup, otherwise use product-level price.
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

    // Find the best applicable rule using nested structure
    for (const rule of rules) {
      // Skip rules with no condition (can happen if saved without one)
      if (!rule.condition) continue;

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

    // Clamp discount so it never exceeds total (prevents >100% display)
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
    // Handle different condition formats
    const normalizedCondition = this.normalizeCondition(condition);

    switch (normalizedCondition) {
      case BUNDLE_WIDGET.CONDITION_OPERATORS.EQUAL_TO:
        // For discount pricing rules, "equal to N" means "at N or more" (threshold).
        // For step conditions, the ConditionValidator handles exact matching separately.
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

    // Sort rules by condition value (ascending) — copy to avoid mutating the original
    const rules = [...bundle.pricing.rules].sort((a, b) => a.condition.value - b.condition.value);

    for (const rule of rules) {
      if (!rule.condition) continue;

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
  /** Escape HTML to prevent XSS in toast messages */
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
    // Remove any existing toast
    const existingToast = document.getElementById('bundle-toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Create toast element - uses DCP CSS variables
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

    // Attach close listener (consistent with showWithUndo pattern)
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });

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
        // For pricing rules, equal_to is treated as a threshold (>= target).
        return Math.max(0, targetValue - currentValue);
    }
  }

  static replaceVariables(template, variables) {
    if (!template) return '';

    let result = template;

    // Replace variables — double braces first to prevent single-brace partial matches
    Object.entries(variables).forEach(([key, value]) => {
      // Wrap conditionText and discountText with styled spans
      let replacementValue = value;
      if (key === 'conditionText') {
        replacementValue = `<span class="bundle-conditions-text" style="color: var(--bundle-conditions-text-color, inherit);">${value}</span>`;
      } else if (key === 'discountText') {
        replacementValue = `<span class="bundle-discount-text" style="color: var(--bundle-discount-text-color, inherit);">${value}</span>`;
      }

      // Single pass: match {{key}} or {key} (double-brace variant matched first)
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

    // Extract rule data using nested structure
    const conditionType = ruleToUse.condition.type;
    const targetValue = ruleToUse.condition.value;
    const conditionOperator = ruleToUse.condition.operator;
    const discountMethod = ruleToUse.discount.method;
    const rawDiscountValue = ruleToUse.discount.value;

    // Calculate condition-specific values
    const conditionData = this.calculateConditionData(conditionType, targetValue, conditionOperator, totalPrice, totalQuantity, currencyInfo);

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
        // "equal_to" acts as a threshold (>= N) in discount rules,
        // and "greater_than_or_equal_to" is the most common default.
        // Both render as plain "N items" for natural-sounding text.
        return `${targetValue} ${label}`;
    }
  }

  static calculateConditionData(conditionType, targetValue, conditionOperator, totalPrice, totalQuantity, currencyInfo) {
    if (conditionType === 'amount') {
      // Amount-based condition - targetValue is already in cents
      const normalizedOp = PricingCalculator.normalizeCondition(conditionOperator);
      const alreadyQualified = PricingCalculator.checkCondition(totalPrice, conditionOperator, targetValue);
      const amountNeeded = this.getQualificationGap(totalPrice, targetValue, conditionOperator, 1);

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

      // Build operator-aware condition text for amount
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
      // Quantity-based condition
      const normalizedOp = PricingCalculator.normalizeCondition(conditionOperator);
      const alreadyQualified = PricingCalculator.checkCondition(totalQuantity, conditionOperator, targetValue);
      const itemsNeeded = this.getQualificationGap(totalQuantity, targetValue, conditionOperator, 1);

      // Build operator-aware condition text for quantity
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
    const showQuantitySelector = options.showQuantitySelector !== false;
    const isSelected = currentQuantity > 0;

    // Check if this is an expanded variant card (has parentProductId and no variants array)
    // In this case, don't show variant selector - each card IS a variant
    const isExpandedVariantCard = product.parentProductId && (!product.variants || product.variants.length === 0);

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
        <p class="empty-state-card-text">${this.escapeHtml(labelText)}</p>
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
      const label = this.escapeHtml(variant.title === 'Default Title' ? product.title : variant.title);
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



/**
 * Default Loading Animation
 *
 * A polished three-dot pulsing loader rendered as inline SVG with CSS animations.
 * Designed from a Lottie JSON source (see default-loading-animation.json).
 * Used as the fallback when merchants have not uploaded a custom loading GIF.
 */

/**
 * Creates and returns the default loading animation DOM element.
 * The animation is a three-dot pulse rendered as inline SVG.
 * CSS keyframes are injected once on first call (idempotent).
 *
 * @returns {HTMLDivElement} A wrapper div containing the animated SVG
 */
function createDefaultLoadingAnimation() {
  // Inject CSS keyframes once (idempotent check)
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


  // ============================================================================
  // BUNDLE WIDGET PRODUCT PAGE
  // ============================================================================

/**
 * Bundle Widget - Product Page Version
 *
 * This widget is specifically for product page bundles with vertical step boxes layout.
 * It imports shared components and utilities from bundle-widget-components.js.
 *
 * ============================================================================
 * ARCHITECTURE ROLE
 * ============================================================================
 * This is the THIRD file loaded for PRODUCT PAGE bundles:
 * 1. bundle-widget.js (loader) - Detects bundle type as 'product_page'
 * 2. bundle-widget-components.js - Provides shared utilities
 * 3. THIS FILE (product-page widget) - Implements product page UI/UX
 *
 * ============================================================================
 * WHEN THIS FILE IS LOADED
 * ============================================================================
 * This file loads when:
 * - Container has data-bundle-type="product_page", OR
 * - Container has no data-bundle-type attribute (DEFAULT for backward compatibility)
 *
 * Example container:
 * <div id="bundle-builder-app" data-bundle-type="product_page"></div>
 * OR
 * <div id="bundle-builder-app"></div>  <!-- Defaults to product_page -->
 *
 * ============================================================================
 * UI LAYOUT: VERTICAL STEP BOXES
 * ============================================================================
 * - Steps displayed as vertical accordion/collapsible sections
 * - One step visible at a time (step-by-step flow)
 * - Progress tracked with step completion indicators
 * - Best for: Product detail pages with limited vertical space
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
 * - Product page specific UI rendering
 * - Vertical layout management
 * - Step navigation logic
 * - Event handlers for product page flow
 *
 * ============================================================================
 * BACKWARD COMPATIBILITY
 * ============================================================================
 * This is the DEFAULT widget loaded when:
 * - Existing merchants have no data-bundle-type attribute
 * - Ensures existing bundles continue working without changes
 * - No data migration or merchant action required
 *
 * @version 1.0.0
 * @author Wolfpack Team
 */


// ============================================================
// BOTTOM-SHEET HELPER FUNCTIONS (pure — exposed for unit tests)
// ============================================================

/**
 * Find the next incomplete non-default step after `fromIndex`.
 * Returns -1 when all remaining non-default steps are complete.
 */
function bsFindNextIncompleteStep(steps, selectedProducts, validateFn, fromIndex) {
  for (let i = fromIndex + 1; i < steps.length; i++) {
    // Free gift and default steps are non-required — never auto-advance into them.
    // The free gift step has its own unlock flow; default steps are pre-filled.
    if (steps[i].isDefault || steps[i].isFreeGift) continue;
    if (!validateFn(i)) return i;
  }
  return -1;
}

function bsIsDefaultStep(step) { return !!step?.isDefault; }

function bsGetDiscountBadgeLabel(step) { return step?.discountBadgeLabel || null; }

// Export for unit tests
if (typeof window !== 'undefined') {
  window.__bsHelpers = { bsFindNextIncompleteStep, bsIsDefaultStep, bsGetDiscountBadgeLabel };
}

// Import shared components and utilities



class BundleWidgetProductPage {

  constructor(containerElement) {
    this.container = containerElement;
    this.selectedBundle = null;
    this.selectedProducts = [];
    this.stepProductData = [];
    this.currentStepIndex = 0;
    this.isInitialized = false;
    this.config = {};
    this.elements = {};

    // Initialize product modal for variant selection (if BundleProductModal is available)
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

      // Parse configuration
      this.parseConfiguration();

      // Show loading overlay immediately — read gif from dataset before async fetch
      let initialGif = null;
      try { initialGif = JSON.parse(this.container.dataset.bundleConfig || '{}')?.loadingGif || null; } catch {}
      this.showLoadingOverlay(initialGif);

      // Load design settings CSS
      await this.loadDesignSettingsCSS();

      // Load and validate bundle data
      await this.loadBundleData();

      // Select appropriate bundle
      this.selectBundle();

      if (!this.selectedBundle) {
        this.hideLoadingOverlay();
        this.showFallbackUI();
        return;
      }

      // Initialize data structures
      this.initializeDataStructures();

      // Pre-load product data for default steps so filled cards show real image/title
      await this._preloadDefaultStepProducts();

      // Setup DOM elements
      this.setupDOMElements();

      // Render initial UI
      this.renderUI();

      // Hide overlay now that UI is rendered
      this.hideLoadingOverlay();

      // Attach event listeners
      this.attachEventListeners();

      // Mark as initialized
      this.container.dataset.initialized = 'true';
      this.isInitialized = true;

    } catch (error) {
      this.hideLoadingOverlay();
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
      showStepNumbers: dataset.showStepNumbers !== 'false',
      // Quantity selector visibility settings (default: show on card)
      showQuantitySelectorOnCard: dataset.showQuantitySelectorOnCard !== 'false',
      // Messages will be set from bundle.pricing.messages after bundle loads
      discountTextTemplate: 'Add {conditionText} to get {discountText}',
      successMessageTemplate: 'Congratulations! You got {discountText}!',
      currentProductId: window.currentProductId,
      currentProductHandle: window.currentProductHandle,
      currentProductCollections: window.currentProductCollections
    };
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

    this.bundleData = bundleData;
  }

  selectBundle() {
    this.selectedBundle = BundleDataManager.selectBundle(this.bundleData, this.config);

    // Determine widget style: 'bottom-sheet' or 'classic' (default for backward compat)
    this.widgetStyle = this.selectedBundle?.widgetStyle ?? 'classic';

    // Update message templates from bundle pricing messages
    this.updateMessagesFromBundle();
  }

  // ========================================================================
  // STEP TYPE GETTERS
  // ========================================================================

  /** Steps that are neither free gift nor default — require user selection */
  get paidSteps() {
    return this.selectedBundle?.steps?.filter(s => !s.isFreeGift && !s.isDefault) ?? [];
  }

  /** The free gift step, if any */
  get freeGiftStep() {
    return this.selectedBundle?.steps?.find(s => s.isFreeGift) ?? null;
  }

  /** Index of the free gift step, or -1 */
  get freeGiftStepIndex() {
    return this.selectedBundle?.steps?.findIndex(s => s.isFreeGift) ?? -1;
  }

  /** Steps that are pre-filled with a compulsory product */
  get defaultStepsList() {
    return this.selectedBundle?.steps?.filter(s => s.isDefault) ?? [];
  }

  /**
   * True when all paid (non-free-gift, non-default) steps are fully satisfied.
   * Used to unlock the free gift slot.
   */
  get isFreeGiftUnlocked() {
    if (!this.selectedBundle) return false;
    return this.selectedBundle.steps.every((step, i) => {
      if (step.isFreeGift || step.isDefault) return true; // skip these
      return this.validateStep(i);
    });
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

    } else {
      this.config.showDiscountMessaging = this.selectedBundle?.pricing?.enabled || false;
    }
  }

  initializeDataStructures() {
    const stepsCount = this.selectedBundle.steps.length;

    // Initialize selected products array (one object per step)
    this.selectedProducts = Array(stepsCount).fill(null).map(() => ({}));

    // Initialize step product data cache
    this.stepProductData = Array(stepsCount).fill(null).map(() => ([]));
    this._stepFetchFailed = {};

    // Seed default steps into selectedProducts regardless of widget style.
    // Default products are always included in the bundle — no user selection required.
    // buildCartItems() reads selectedProducts, so without this the default item is
    // silently excluded from the cart payload on classic modal style bundles.
    this.selectedBundle.steps.forEach((step, i) => {
      if (step.isDefault && step.defaultVariantId) {
        this.selectedProducts[i][step.defaultVariantId] = 1;
      }
    });
  }

  /**
   * Pre-fetches product data for all steps marked isDefault so that
   * the filled slot card can render with real image and title on first paint.
   * Non-fatal — a failed fetch just leaves the card in a loading placeholder state.
   */
  async _preloadDefaultStepProducts() {
    const promises = this.selectedBundle.steps.map((step, i) => {
      if (step.isDefault && step.defaultVariantId) {
        return this.loadStepProducts(i).catch(() => {});
      }
      return null;
    }).filter(Boolean);
    if (promises.length > 0) await Promise.all(promises);
  }

  /**
   * Returns the product object for a default step from stepProductData,
   * matched by defaultVariantId. Returns null when not yet loaded.
   */
  _getDefaultStepProduct(stepIndex) {
    const step = this.selectedBundle.steps[stepIndex];
    if (!step?.isDefault || !step.defaultVariantId) return null;
    const products = this.stepProductData[stepIndex] || [];
    const variantId = String(step.defaultVariantId);
    return products.find(p =>
      String(p.variantId || p.id) === variantId
    ) || products[0] || null;
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
    // Determine which modal to use based on widget style
    const modalEl = this.widgetStyle === 'bottom-sheet'
      ? this.ensureBottomSheet()
      : this.ensureModal();

    // Get or create main UI elements
    this.elements = {
      stepsContainer: this.container.querySelector('.bundle-steps') || this.createStepsContainer(),
      footer: this.container.querySelector('.bundle-footer-messaging') || this.createFooter(),
      addToCartButton: this.container.querySelector('.add-bundle-to-cart') || this.createAddToCartButton(),
      modal: modalEl,
      bsOverlay: this.widgetStyle === 'bottom-sheet'
        ? (document.getElementById('bw-bs-overlay') || this._createBottomSheetOverlay())
        : null
    };

    // Append elements if they were created
    if (!this.container.querySelector('.bundle-steps')) {
      this.container.appendChild(this.elements.stepsContainer);
    }
    if (!this.container.querySelector('.add-bundle-to-cart')) {
      this.container.appendChild(this.elements.addToCartButton);
    }
  }

  _createBottomSheetOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'bw-bs-overlay';
    overlay.className = 'bw-bs-overlay';
    document.body.appendChild(overlay);
    return overlay;
  }

  /**
   * Creates the bottom-sheet panel using the SAME inner DOM structure as ensureModal()
   * so all existing renderModalProducts / renderModalTabs / tab-arrow code works unchanged.
   */
  ensureBottomSheet() {
    let panel = document.getElementById('bundle-builder-modal');

    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'bundle-builder-modal';
      panel.className = 'bw-bs-panel';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      panel.innerHTML = `
        <div class="modal-header bw-bs-header">
          <!-- Desktop close: × absolute top-right -->
          <button class="close-button bw-bs-close-desktop" aria-label="Close">
            <svg viewBox="0 0 20 20" width="20" height="20" focusable="false" aria-hidden="true" fill="currentColor">
              <path d="M13.97 15.03a.75.75 0 1 0 1.06-1.06l-3.97-3.97 3.97-3.97a.75.75 0 0 0-1.06-1.06l-3.97 3.97-3.97-3.97a.75.75 0 0 0-1.06 1.06l3.97 3.97-3.97 3.97a.75.75 0 1 0 1.06 1.06l3.97-3.97 3.97 3.97Z"/>
            </svg>
          </button>
          <!-- Mobile close: chevron-down absolute top-center -->
          <button class="close-button bw-bs-close-mobile" aria-label="Close">
            <svg width="40" height="24" viewBox="0 0 70 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M20.0188 8.6438C21.044 7.6187 22.706 7.6187 23.7312 8.6438L35.875 20.7877L48.0188 8.6438C49.044 7.6187 50.706 7.6187 51.7312 8.6438C52.7563 9.669 52.7563 11.331 51.7312 12.3562L37.7312 26.3562C36.706 27.3813 35.044 27.3813 34.0188 26.3562L20.0188 12.3562C18.9937 11.331 18.9937 9.669 20.0188 8.6438Z" fill="#4A4A4A"/>
            </svg>
          </button>
          <!-- Category tabs — grid layout, equal columns -->
          <div class="modal-tabs-wrapper bw-bs-tabs-wrapper">
            <div class="modal-tabs bw-bs-tabs"></div>
          </div>
          <!-- "Choose X" step title -->
          <div class="modal-step-title bw-bs-choose-title"></div>
          <!-- Discount / progress messaging -->
          <div class="bw-bs-discount-bar footer-discount-text"></div>
        </div>
        <div class="modal-body bw-bs-body">
          <div class="product-grid bw-bs-product-grid"></div>
        </div>
        <div class="modal-footer bw-bs-footer">
          <!-- Cart count pill (white, floats above nav pill) -->
          <div class="bw-bs-cart-pill">
            <span class="cart-badge-count">0</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M3 4.5C3 4.22386 3.22386 4 3.5 4H5.5C5.73 4 5.93 4.16 5.98 4.385L6.52 7H20.5C20.76 7 20.99 7.14 21.1 7.37C21.21 7.6 21.18 7.88 21.02 8.08L17.02 13.08C16.85 13.29 16.6 13.41 16.33 13.41H8.66L8.07 16H19.5C19.78 16 20 16.22 20 16.5C20 16.78 19.78 17 19.5 17H7.5C7.27 17 7.07 16.84 7.02 16.615L5.02 7.615L4.5 5H3.5C3.22 5 3 4.78 3 4.5ZM8 19.5C8 20.33 7.33 21 6.5 21C5.67 21 5 20.33 5 19.5C5 18.67 5.67 18 6.5 18C7.33 18 8 18.67 8 19.5ZM19 19.5C19 20.33 18.33 21 17.5 21C16.67 21 16 20.33 16 19.5C16 18.67 16.67 18 17.5 18C18.33 18 19 18.67 19 19.5Z" fill="#333"/>
            </svg>
          </div>
          <!-- PREV/NEXT nav pill (navy blue) -->
          <div class="bw-bs-nav-pill">
            <button class="modal-nav-button prev-button bw-bs-nav-btn" aria-label="Previous step">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Prev
            </button>
            <button class="modal-nav-button next-button bw-bs-nav-btn" aria-label="Next step">
              Next
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(panel);
      // No tab scroll arrows needed — tabs use CSS grid layout
    }

    return panel;
  }

  createStepsContainer() {
    const container = document.createElement('div');
    container.className = 'bundle-steps';
    return container;
  }

  createFooter() {
    // Footer/progress bar removed by design
    const footer = document.createElement('div');
    footer.className = 'bundle-footer-messaging';
    footer.style.display = 'none';
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
            <div class="modal-tabs-wrapper">
              <button class="tab-arrow tab-arrow-left" aria-label="Scroll tabs left">&lsaquo;</button>
              <div class="modal-tabs"></div>
              <button class="tab-arrow tab-arrow-right" aria-label="Scroll tabs right">&rsaquo;</button>
            </div>
            <div class="modal-header-discount-messaging">
              <div class="footer-discount-text"></div>
            </div>
            <span class="close-button">&times;</span>
          </div>
          <div class="modal-body">
            <div class="product-grid"></div>
          </div>
          <div class="modal-footer">
            <!-- Cart count pill -->
            <div class="modal-footer-cart-pill">
              <span class="cart-badge-count">0</span>
              <svg class="cart-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1" fill="currentColor" stroke="none"/>
                <circle cx="20" cy="21" r="1" fill="currentColor" stroke="none"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </div>
            <!-- Nav pill with Back/Next -->
            <div class="modal-footer-nav-pill">
              <button class="modal-nav-button prev-button">Back</button>
              <button class="modal-nav-button next-button">Next</button>
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

  renderUI() {
    this.renderSteps();
    this.renderFooter();
    this.updateAddToCartButton();
  }

  renderSteps() {
    // Clear existing steps
    this.elements.stepsContainer.innerHTML = '';

    if (!this.selectedBundle || !this.selectedBundle.steps) {
      return;
    }

    // Check bundle type and render accordingly
    const bundleType = this.selectedBundle.bundleType || BUNDLE_WIDGET.BUNDLE_TYPES.PRODUCT_PAGE;

    if (bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE) {
      // Full-page bundle: Render with tabs layout
      this.renderFullPageLayout();
    } else {
      // Product-page bundle: Render with step boxes (current implementation)
      this.renderProductPageLayout();
    }
  }

  // Product-page bundle layout: always renders all steps at once.
  // Each step gets the appropriate card variant based on its type and selection state.
  renderProductPageLayout() {
    this.selectedBundle.steps.forEach((step, stepIndex) => {
      if (step.isDefault) {
        // Default/compulsory slot — always pre-filled, not removable
        const product = this._getDefaultStepProduct(stepIndex);
        if (product) {
          const card = this.createDefaultProductCard(step, stepIndex, product);
          this.elements.stepsContainer.appendChild(card);
        } else {
          // Product data not yet loaded — show placeholder
          const card = this._createDefaultLoadingCard(step, stepIndex);
          this.elements.stepsContainer.appendChild(card);
        }
      } else if (step.isFreeGift) {
        // Free gift slot — ribbon icon, locked until paid steps complete
        const card = this.createFreeGiftSlotCard(step, stepIndex);
        this.elements.stepsContainer.appendChild(card);
      } else {
        // Regular selectable step
        const stepSelections = this.selectedProducts[stepIndex] || {};
        const selectedEntries = Object.entries(stepSelections).filter(([, qty]) => qty > 0);

        if (selectedEntries.length > 0) {
          const products = this.expandProductsByVariant(this.stepProductData[stepIndex] || []);
          selectedEntries.forEach(([variantId, qty]) => {
            const product = products.find(p => (p.variantId || p.id) === variantId);
            if (product) {
              for (let i = 0; i < qty; i++) {
                const card = this.createSelectedProductCard(
                  { product, stepIndex, step, variantId, instanceIndex: i },
                  i
                );
                this.elements.stepsContainer.appendChild(card);
              }
            }
          });
          // Show "add more" card if step condition not yet met
          if (!this.validateStep(stepIndex)) {
            const totalQty = selectedEntries.reduce((sum, [, qty]) => sum + qty, 0);
            this.elements.stepsContainer.appendChild(this.createAddMoreCard(step, stepIndex, totalQty));
          }
        } else {
          // No selection yet — empty slot card
          const card = this.createEmptyStateCard(step, stepIndex);
          this.elements.stepsContainer.appendChild(card);
        }
      }
    });
  }

  // Create an empty state card for a step (shown when no products selected)
  createEmptyStateCard(step, stepIndex) {
    const stepBox = document.createElement('div');
    stepBox.dataset.stepIndex = stepIndex;

    if (this.widgetStyle === 'bottom-sheet') {
      // Bottom-sheet mode: dashed-border slot card
      stepBox.className = 'step-box bw-slot-card bw-slot-card--empty';

      // Category image as CSS background-image (fills background, icon overlaid on top)
      const imgUrl = step.categoryImageUrl || null;
      if (imgUrl) {
        stepBox.style.backgroundImage = `url('${imgUrl}')`;
        stepBox.style.backgroundSize = 'contain';
        stepBox.style.backgroundRepeat = 'no-repeat';
        stepBox.style.backgroundPosition = 'center';
      }

      // Circular background wrapper for the plus icon (80×80px)
      const iconWrapper = document.createElement('div');
      iconWrapper.className = 'bw-slot-card__plus-icon';
      iconWrapper.style.cssText = `
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: rgba(30, 58, 138, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 10px;
      `;
      iconWrapper.innerHTML = `<svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.202 3.06152V37.0082M37.1753 20.0348H3.22864" stroke="currentColor" stroke-width="5.09199" stroke-linecap="square" stroke-linejoin="round"/>
      </svg>`;
      iconWrapper.style.color = getComputedStyle(document.documentElement)
        .getPropertyValue('--bundle-global-primary-button').trim() || '#1e3a8a';
      stepBox.appendChild(iconWrapper);

      // Step name label below icon
      const label = document.createElement('p');
      label.className = 'step-name bw-slot-card__label';
      label.textContent = step.name || `Step ${stepIndex + 1}`;
      stepBox.appendChild(label);
    } else {
      // Classic mode: existing "+" icon behavior
      stepBox.className = 'step-box';

      const plusIcon = document.createElement('span');
      plusIcon.className = 'plus-icon';
      plusIcon.textContent = '+';
      stepBox.appendChild(plusIcon);

      const stepName = document.createElement('p');
      stepName.className = 'step-name';
      stepName.textContent = step.name || `Step ${stepIndex + 1}`;
      stepBox.appendChild(stepName);
    }

    // Click handler to open modal
    stepBox.addEventListener('click', () => this.openModal(stepIndex));

    return stepBox;
  }


  // Create an "add more" card for incomplete steps
  createAddMoreCard(step, stepIndex, currentCount) {
    const stepBox = document.createElement('div');
    stepBox.className = 'step-box add-more-card';
    stepBox.dataset.stepIndex = stepIndex;

    // Plus icon
    const plusIcon = document.createElement('span');
    plusIcon.className = 'plus-icon';
    plusIcon.textContent = '+';
    stepBox.appendChild(plusIcon);

    // Add step name
    const stepName = document.createElement('p');
    stepName.className = 'step-name';
    stepName.textContent = step.name || `Step ${stepIndex + 1}`;
    stepBox.appendChild(stepName);

    // Add remaining count text
    const selectionCount = document.createElement('div');
    selectionCount.className = 'step-selection-count';
    const operator = step.conditionOperator;
    const rawRequired = step.conditionValue || 1;
    const requiredCount = operator === BUNDLE_WIDGET.CONDITION_OPERATORS.GREATER_THAN
      ? rawRequired + 1
      : rawRequired;
    const remaining = requiredCount - currentCount;
    if (remaining > 0) {
      selectionCount.textContent = `Add ${remaining} more`;
    }
    stepBox.appendChild(selectionCount);

    // Add click handler to open modal
    stepBox.addEventListener('click', () => this.openModal(stepIndex));

    return stepBox;
  }

  // Create a state card for a selected product
  createSelectedProductCard(item, cardIndex) {
    const { product, stepIndex, step, variantId, instanceIndex } = item;

    const isDefault = bsIsDefaultStep(step);
    const badgeLabel = this.widgetStyle === 'bottom-sheet' ? bsGetDiscountBadgeLabel(step) : null;

    const stepBox = document.createElement('div');
    const extraClass = this.widgetStyle === 'bottom-sheet' ? ' bw-slot-card bw-slot-card--filled' : '';
    stepBox.className = `step-box step-completed product-card-state${extraClass}`;
    stepBox.dataset.stepIndex = stepIndex;
    stepBox.dataset.variantId = variantId;
    stepBox.dataset.cardIndex = cardIndex;

    // Remove button — hidden for default (non-removable) steps
    if (!isDefault) {
      const clearBadge = document.createElement('div');
      clearBadge.className = 'step-clear-badge';
      clearBadge.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#f3f4f6"/>
          <path d="M8 8L16 16M16 8L8 16" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      clearBadge.title = 'Remove this product';
      clearBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeProductFromSelection(stepIndex, variantId);
      });
      stepBox.appendChild(clearBadge);
    }

    // Product image container
    const imagesContainer = document.createElement('div');
    if (this.widgetStyle === 'bottom-sheet') {
      imagesContainer.className = 'bw-slot-card__image-wrapper';
      const img = document.createElement('img');
      img.src = product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
      img.alt = product.title || '';
      img.className = 'bw-slot-card__image';
      imagesContainer.appendChild(img);
    } else {
      imagesContainer.className = 'step-images single-image';
      const img = document.createElement('img');
      img.src = product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
      img.alt = product.title || '';
      img.className = 'step-image';
      imagesContainer.appendChild(img);
    }

    stepBox.appendChild(imagesContainer);

    // Discount badge (bottom-sheet mode only, when step has a discountBadgeLabel)
    if (badgeLabel) {
      const badge = document.createElement('span');
      badge.className = 'bw-slot-discount-badge';
      badge.textContent = badgeLabel;
      stepBox.appendChild(badge);
    }

    // Product title at bottom
    const productTitle = document.createElement('p');
    productTitle.className = 'step-name step-name-completed product-title-state';
    // Truncate long titles
    const displayTitle = product.title.length > 25
      ? product.title.substring(0, 25) + '...'
      : product.title;
    productTitle.textContent = displayTitle;
    productTitle.title = product.title; // Full title on hover
    stepBox.appendChild(productTitle);

    // Add click handler - check if step limit is reached before opening modal
    stepBox.addEventListener('click', () => {
      // If step has a limit of 1 and is already fulfilled, show toast instead of opening modal
      const stepData = this.selectedBundle.steps[stepIndex];
      if (stepData && stepData.conditionValue && stepData.conditionOperator) {
        const isLimitOne = stepData.conditionValue === 1 &&
          (stepData.conditionOperator === BUNDLE_WIDGET.CONDITION_OPERATORS.EQUAL_TO ||
           stepData.conditionOperator === BUNDLE_WIDGET.CONDITION_OPERATORS.LESS_THAN_OR_EQUAL_TO);
        if (isLimitOne && this.validateStep(stepIndex)) {
          ToastManager.show('Product limit reached for this step.');
          return;
        }
      }
      this.openModal(stepIndex);
    });

    return stepBox;
  }

  /**
   * Creates a slot card for a default/compulsory product step.
   * Looks like a filled card but has no remove button and shows an "Included" badge.
   */
  createDefaultProductCard(step, stepIndex, product) {
    const stepBox = document.createElement('div');
    stepBox.className = 'step-box bw-slot-card bw-slot-card--filled';
    stepBox.dataset.stepIndex = stepIndex;
    stepBox.dataset.variantId = step.defaultVariantId || '';
    // Default cards are not clickable
    stepBox.style.cursor = 'default';

    // Product image
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'bw-slot-card__image-wrapper';
    const img = document.createElement('img');
    img.src = product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
    img.alt = product.title || '';
    img.className = 'bw-slot-card__image';
    imageWrapper.appendChild(img);
    stepBox.appendChild(imageWrapper);

    // Product title
    const productTitle = document.createElement('p');
    productTitle.className = 'step-name bw-slot-card__label';
    const displayTitle = product.title.length > 25
      ? product.title.substring(0, 25) + '...'
      : product.title;
    productTitle.textContent = displayTitle;
    productTitle.title = product.title;
    stepBox.appendChild(productTitle);

    // "Included" badge — bottom-left
    const badge = document.createElement('span');
    badge.className = 'bw-slot-card__included-badge';
    badge.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> Included`;
    stepBox.appendChild(badge);

    return stepBox;
  }

  /**
   * Placeholder card for a default step while its product data is still loading.
   */
  _createDefaultLoadingCard(step, stepIndex) {
    const stepBox = document.createElement('div');
    stepBox.className = 'step-box bw-slot-card bw-slot-card--filled';
    stepBox.dataset.stepIndex = stepIndex;
    stepBox.style.cursor = 'default';
    stepBox.style.opacity = '0.7';

    const label = document.createElement('p');
    label.className = 'step-name bw-slot-card__label';
    label.textContent = step.name || `Step ${stepIndex + 1}`;
    stepBox.appendChild(label);

    const badge = document.createElement('span');
    badge.className = 'bw-slot-card__included-badge';
    badge.textContent = 'Included';
    stepBox.appendChild(badge);

    return stepBox;
  }

  /**
   * Creates the free gift slot card.
   * Shows a ribbon icon, "Free {name}" label.
   * Non-clickable (locked) until all paid steps are complete.
   */
  createFreeGiftSlotCard(step, stepIndex) {
    const unlocked = this.isFreeGiftUnlocked;
    const stepBox = document.createElement('div');
    stepBox.dataset.stepIndex = stepIndex;

    // Check if free gift step already has a selection
    const stepSelections = this.selectedProducts[stepIndex] || {};
    const selectedEntries = Object.entries(stepSelections).filter(([, qty]) => qty > 0);

    if (selectedEntries.length > 0 && unlocked) {
      // Show selected product for free gift slot
      const products = this.stepProductData[stepIndex] || [];
      const [variantId] = selectedEntries[0];
      const product = products.find(p => (p.variantId || p.id) === variantId);
      if (product) {
        // Show filled state for free gift
        stepBox.className = 'step-box bw-slot-card bw-slot-card--filled';

        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'bw-slot-card__image-wrapper';
        const img = document.createElement('img');
        img.src = product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
        img.alt = product.title || '';
        img.className = 'bw-slot-card__image';
        imageWrapper.appendChild(img);
        stepBox.appendChild(imageWrapper);

        // Remove button
        const clearBadge = document.createElement('div');
        clearBadge.className = 'step-clear-badge';
        clearBadge.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#f3f4f6"/><path d="M8 8L16 16M16 8L8 16" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        clearBadge.addEventListener('click', (e) => {
          e.stopPropagation();
          this.removeProductFromSelection(stepIndex, variantId);
        });
        stepBox.appendChild(clearBadge);

        const productTitle = document.createElement('p');
        productTitle.className = 'step-name bw-slot-card__label';
        const displayTitle = product.title.length > 25 ? product.title.substring(0, 25) + '...' : product.title;
        productTitle.textContent = displayTitle;
        stepBox.appendChild(productTitle);

        // Ribbon overlay even in filled state
        stepBox.appendChild(this._createRibbonSvg());
        stepBox.addEventListener('click', () => this.openModal(stepIndex));
        return stepBox;
      }
    }

    // Empty / locked state — mirror createEmptyStateCard structure for each widget style
    if (this.widgetStyle === 'bottom-sheet') {
      stepBox.className = `step-box bw-slot-card bw-slot-card--empty${!unlocked ? ' bw-slot-card--locked' : ''}`;

      const iconWrapper = document.createElement('div');
      iconWrapper.className = 'bw-slot-card__plus-icon';
      iconWrapper.style.cssText = `
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: rgba(30, 58, 138, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 10px;
      `;
      iconWrapper.innerHTML = `<svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.202 3.06152V37.0082M37.1753 20.0348H3.22864" stroke="currentColor" stroke-width="5.09199" stroke-linecap="square" stroke-linejoin="round"/>
      </svg>`;
      iconWrapper.style.color = getComputedStyle(document.documentElement)
        .getPropertyValue('--bundle-global-primary-button').trim() || '#1e3a8a';
      stepBox.appendChild(iconWrapper);

      const label = document.createElement('p');
      label.className = 'step-name bw-slot-card__label';
      label.textContent = `Free ${step.name || `Step ${stepIndex + 1}`}`;
      stepBox.appendChild(label);
    } else {
      // Classic mode — same structure as a normal empty step card
      stepBox.className = 'step-box';

      const plusIcon = document.createElement('span');
      plusIcon.className = 'plus-icon';
      plusIcon.textContent = '+';
      stepBox.appendChild(plusIcon);

      const label = document.createElement('p');
      label.className = 'step-name';
      label.textContent = `Free ${step.name || `Step ${stepIndex + 1}`}`;
      stepBox.appendChild(label);
    }

    // Red ribbon SVG overlay — top-right (free gift differentiator in all modes)
    stepBox.appendChild(this._createRibbonSvg());

    if (unlocked) {
      stepBox.addEventListener('click', () => this.openModal(stepIndex));
    }

    return stepBox;
  }

  /** Returns the red ribbon SVG element for free gift cards */
  _createRibbonSvg() {
    const ribbon = document.createElement('span');
    ribbon.className = 'bw-slot-card__ribbon';
    // Check for a merchant-configured badge image via DCP CSS variable
    const badgeUrl = getComputedStyle(document.documentElement)
      .getPropertyValue('--bundle-free-gift-badge-url').trim();
    const hasMerchantBadge = badgeUrl && badgeUrl !== 'none' && badgeUrl !== '';
    if (hasMerchantBadge) {
      // Strip the url("...") wrapper to get the raw URL
      const rawUrl = badgeUrl.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
      const img = document.createElement('img');
      img.src = rawUrl;
      img.alt = 'Gift badge';
      img.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block;';
      ribbon.appendChild(img);
    } else {
      ribbon.innerHTML = `<svg viewBox="0 0 24 24" fill="#e53e3e" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M20 7h-1.586l1.293-1.293a1 1 0 0 0-1.414-1.414L16 6.586V5a1 1 0 0 0-2 0v1.586l-1.293-1.293a1 1 0 0 0-1.414 1.414L12.586 8H11a1 1 0 1 0 0 2h1v2h-2a1 1 0 1 0 0 2h2v7l3-1.5 3 1.5V14h2a1 1 0 1 0 0-2h-2v-2h2a1 1 0 1 0 0-2zm-4 2v2h-2V9h2z"/>
      </svg>`;
    }
    return ribbon;
  }

  // Remove a specific product from selection (decrease quantity by 1)
  removeProductFromSelection(stepIndex, variantId) {
    // Guard: default products are compulsory — they must always stay in selectedProducts
    const step = this.selectedBundle?.steps[stepIndex];
    if (step?.isDefault && step?.defaultVariantId === variantId) return;

    const currentQuantity = this.selectedProducts[stepIndex][variantId] || 0;

    if (currentQuantity > 1) {
      // Decrease quantity
      this.selectedProducts[stepIndex][variantId] = currentQuantity - 1;
    } else {
      // Remove completely
      delete this.selectedProducts[stepIndex][variantId];
    }

    // Update UI
    this.renderSteps();
    this.updateAddToCartButton();
    this.updateFooterMessaging();

    // Show toast notification
    ToastManager.show('Product removed from bundle');
  }

  // Full-page bundle layout (horizontal tabs)
  renderFullPageLayout() {
    // TODO: Implement tabs-based layout for full-page bundles
    // For now, use the same layout as product-page until custom UI is provided

    // Temporary: Render same as product-page layout
    // This will be replaced with custom tabs UI later
    this.renderProductPageLayout();

    // Add visual indicator that this is a full-page bundle
    const indicator = document.createElement('div');
    indicator.style.cssText = 'padding: 8px; background: #e3f2fd; border-radius: 4px; margin-bottom: 12px; text-align: center; font-size: 12px; color: #1976d2;';
    indicator.textContent = 'Full-Page Bundle Mode (Custom layout will be applied)';
    this.elements.stepsContainer.insertBefore(indicator, this.elements.stepsContainer.firstChild);
  }

  clearStepSelections(stepIndex) {
    // Clear all product selections for this step
    this.selectedProducts[stepIndex] = {};

    // Update UI
    this.renderSteps();
    this.updateAddToCartButton();
    this.updateFooterMessaging();

    // Show toast notification
    ToastManager.show(`All selections cleared from this step`);
  }

  renderFooter() {
    // Footer/progress bar removed by design
    return;
  }

  updateFooterMessaging() {
    // Footer/progress bar removed by design
    return;
  }

  updateAddToCartButton() {
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

    const button = this.elements.addToCartButton;

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

    // Disable button if no paid products selected OR if not all required steps are complete
    if (paidTotalQuantity === 0 || !allStepsValid) {
      if (paidTotalQuantity === 0) {
        button.textContent = 'Add Bundle to Cart';
      } else {
        // Some products selected but not all required steps complete
        button.textContent = 'Complete All Steps to Continue';
      }
      button.disabled = true;
      button.classList.add('disabled');
    } else {
      // All steps valid and products selected - enable button
      const currencyInfo = CurrencyManager.getCurrencyInfo();
      const formattedPrice = CurrencyManager.convertAndFormat(discountInfo.finalPrice, currencyInfo);

      button.textContent = `Add Bundle to Cart \u2022 ${formattedPrice}`;

      button.disabled = false;
      button.classList.remove('disabled');
    }

    // Update the modal footer total pill
    const totalPillFinal = this.elements.modal?.querySelector('.total-price-final');
    const totalPillStrike = this.elements.modal?.querySelector('.total-price-strike');
    if (totalPillFinal) {
      if (totalQuantity > 0) {
        const currencyInfo = CurrencyManager.getCurrencyInfo();
        totalPillFinal.textContent = CurrencyManager.convertAndFormat(discountInfo.finalPrice, currencyInfo);
        if (discountInfo.hasDiscount && totalPillStrike) {
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
  getFormattedHeaderText() {
    const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
    return currentStep?.name || `Step ${this.currentStepIndex + 1}`;
  }

  openModal(stepIndex) {
    this.currentStepIndex = stepIndex;

    // Update modal header with step name
    const modal = this.elements.modal;
    const headerText = this.getFormattedHeaderText();

    modal.querySelector('.modal-step-title').innerHTML = headerText;

    // OPTIMISTIC RENDERING: Show modal immediately with loading state
    this.renderModalTabs();
    this.renderModalProductsLoading(stepIndex);
    this.updateModalNavigation();
    this.updateModalFooterMessaging();

    // Show modal / bottom-sheet
    if (this.widgetStyle === 'bottom-sheet') {
      if (this.elements.bsOverlay) this.elements.bsOverlay.classList.add('bw-bs-overlay--open');
      requestAnimationFrame(() => {
        modal.classList.add('bw-bs-panel--open');
      });
    } else {
      modal.style.display = 'block';
      modal.classList.add('active');
    }
    document.body.style.overflow = 'hidden';

    // Capture stepIndex so async callback doesn't render stale step if user navigates away
    const capturedStepIndex = stepIndex;

    // Load products asynchronously and update
    this.loadStepProducts(stepIndex).then(() => {
      if (this.currentStepIndex !== capturedStepIndex) return; // user navigated away
      this.renderModalProducts(capturedStepIndex);
      this.updateModalFooterMessaging();

      // PRELOAD NEXT STEP
      this.preloadNextStep();
    }).catch(() => {
      if (this.currentStepIndex !== capturedStepIndex) return;
      const productGrid = this.elements.modal.querySelector('.product-grid');
      if (productGrid) productGrid.innerHTML = '<p class="error-message">Failed to load products. Please try again.</p>';
      ToastManager.show('Failed to load products for this step');
    });
  }

  closeModal() {
    if (this.widgetStyle === 'bottom-sheet') {
      this.elements.modal.classList.remove('bw-bs-panel--open');
      if (this.elements.bsOverlay) this.elements.bsOverlay.classList.remove('bw-bs-overlay--open');
    } else {
      this.elements.modal.style.display = 'none';
      this.elements.modal.classList.remove('active');
    }
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

    let allProducts = [];
    let fetchFailed = false;

    const shop = window.Shopify?.shop || window.location.host;
    const apiBaseUrl = window.__BUNDLE_APP_URL__ || window.location.origin;

    // Source 1: product-based step — step.products contains GIDs from StepProduct entries
    if (step.products && Array.isArray(step.products) && step.products.length > 0) {
      const productIds = step.products.map(p => p.id);
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/storefront-products?ids=${encodeURIComponent(productIds.join(','))}&shop=${encodeURIComponent(shop)}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.products?.length > 0) allProducts = allProducts.concat(data.products);
        } else {
          fetchFailed = true;
        }
      } catch (_e) {
        fetchFailed = true;
      }
    }

    // Source 2: collection-based step — step.collections contains { handle, id, title }
    if (step.collections && Array.isArray(step.collections) && step.collections.length > 0) {
      const handles = step.collections.map(c => c.handle).filter(Boolean);
      if (handles.length > 0) {
        try {
          const response = await fetch(
            `${apiBaseUrl}/api/storefront-collections?handles=${encodeURIComponent(handles.join(','))}&shop=${encodeURIComponent(shop)}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.products?.length > 0) allProducts = allProducts.concat(data.products);
          } else {
            fetchFailed = true;
          }
        } catch (_e) {
          fetchFailed = true;
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

    // Store fetch failure state so renderModalProducts can show a proper error
    if (!this._stepFetchFailed) this._stepFetchFailed = {};
    this._stepFetchFailed[stepIndex] = fetchFailed && this.stepProductData[stepIndex].length === 0;
  }

  processProductsForStep(products, step) {
    return products.flatMap(product => {
      if (step.displayVariantsAsIndividual && product.variants && product.variants.length > 0) {
        // Display each variant as separate product - filter out unavailable variants
        // Preserve parent product reference for variant selection and tracking
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
            const imageUrl = variant?.image?.src || product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;

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
        const imageUrl = defaultVariant?.image?.src || product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;

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

  // Expand products with multiple variants into separate product entries
  // Each variant becomes its own card showing "Product Title - Variant Name"
  // This matches the full-page widget behavior for consistent UX
  expandProductsByVariant(products) {
    return products.flatMap(product => {
      // If product already has a parentProductId, it was already expanded
      if (product.parentProductId && product.variantId) {
        return [product];
      }

      // If product has multiple variants, expand into separate cards
      if (product.variants && product.variants.length > 1) {
        return product.variants
          .filter(variant => variant.available !== false) // Only show available variants
          .map(variant => {
            // Use variant image if available, fallback to product image
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
              // Remove variants array from individual cards to prevent showing variant selector
              variants: null
            };
          });
      }

      // Single variant or no variants - return as-is
      return [product];
    });
  }

  renderModalTabs() {
    const tabsContainer = this.elements.modal.querySelector('.modal-tabs');
    tabsContainer.innerHTML = '';

    // Set CSS variable for equal-column grid (bottom-sheet mode)
    const stepCount = this.selectedBundle.steps.length;
    tabsContainer.style.setProperty('--bw-tab-count', stepCount.toString());

    this.selectedBundle.steps.forEach((step, index) => {
      const isAccessible = this.isStepAccessible(index);
      const isActive = index === this.currentStepIndex;
      const isFreeGift = !!step.isFreeGift;
      // Free gift tab is only accessible when all paid steps are complete
      const freeGiftAccessible = !isFreeGift || this.isFreeGiftUnlocked;

      // Create tab button
      const tabButton = document.createElement('button');
      const freeGiftClass = isFreeGift ? ' bw-free-gift-tab' : '';
      tabButton.className = `bundle-header-tab${freeGiftClass} ${isActive ? 'active' : ''} ${(!isAccessible || !freeGiftAccessible) ? 'locked' : ''}`;
      tabButton.textContent = step.name || `Step ${index + 1}`;
      tabButton.dataset.stepIndex = index.toString();

      // Click handler
      tabButton.addEventListener('click', async () => {
        // Re-check accessibility at click time (not stale closure from render time)
        if (!this.isStepAccessible(index)) {
          ToastManager.show('Please complete the previous steps first.');
          return;
        }
        // Free gift tab requires all paid steps complete
        if (step.isFreeGift && !this.isFreeGiftUnlocked) {
          ToastManager.show('Complete all required steps to unlock the free gift.');
          return;
        }
        // Block forward navigation if current step condition is not met
        if (index > this.currentStepIndex && !this.validateStep(this.currentStepIndex)) {
          ToastManager.show('Please meet the step conditions before proceeding.');
          return;
        }

        this.currentStepIndex = index;

        // Update modal header
        const headerText = this.getFormattedHeaderText();
        this.elements.modal.querySelector('.modal-step-title').innerHTML = headerText;

        // Load products for this step if not already loaded
        this.showLoadingOverlay(this.selectedBundle?.loadingGif || null);
        try {
          await this.loadStepProducts(index);
        } finally {
          this.hideLoadingOverlay();
        }

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
    const rawProducts = productsToRender || this.stepProductData[stepIndex];
    // Expand variants into separate cards like full-page widget
    const products = this.expandProductsByVariant(rawProducts);
    const selectedProducts = this.selectedProducts[stepIndex];
    const productGrid = this.elements.modal.querySelector('.product-grid');
    const currentStep = this.selectedBundle?.steps?.[stepIndex];
    const isFreeGiftStep = !!currentStep?.isFreeGift;

    // Inject free gift promo heading above the grid
    const bodyEl = this.elements.modal.querySelector('.bw-bs-body') || this.elements.modal.querySelector('.modal-body');
    const existingPromo = bodyEl?.querySelector('.bw-bs-free-gift-promo');
    if (existingPromo) existingPromo.remove();
    if (isFreeGiftStep && bodyEl && this.widgetStyle === 'bottom-sheet') {
      const promo = document.createElement('div');
      promo.className = 'bw-bs-free-gift-promo';
      const stepName = currentStep.name || 'gift';
      const firstProduct = rawProducts?.[0];
      const priceStr = firstProduct?.price
        ? CurrencyManager.convertAndFormat(firstProduct.price, CurrencyManager.getCurrencyInfo())
        : '';
      promo.innerHTML = `
        <p class="bw-bs-free-gift-heading">Get a ${ComponentGenerator.escapeHtml(stepName)} worth ${priceStr} absolutely free!</p>
        <p class="bw-bs-free-gift-subheading">Add ${this.paidSteps.length} product(s) to get 1 of them at 100% off!</p>
      `;
      bodyEl.insertBefore(promo, productGrid);
    }

    if (products.length === 0) {
      // Show error state if the fetch failed, otherwise a neutral "no products" message
      if (this._stepFetchFailed && this._stepFetchFailed[stepIndex]) {
        productGrid.innerHTML = `
          <div class="modal-fetch-error">
            <p>Could not load products. Please check your connection and try again.</p>
            <button class="modal-retry-btn">Retry</button>
          </div>
        `;
        const retryBtn = productGrid.querySelector('.modal-retry-btn');
        if (retryBtn) {
          retryBtn.addEventListener('click', () => {
            // Clear cached failure so loadStepProducts re-fetches
            this._stepFetchFailed[stepIndex] = false;
            this.stepProductData[stepIndex] = [];
            this.renderModalProductsLoading(stepIndex);
            this.loadStepProducts(stepIndex).then(() => {
              this.renderModalProducts(stepIndex);
            });
          });
        }
      } else {
        productGrid.innerHTML = `<p class="no-products-message">No products are configured for this step.</p>`;
      }
      return;
    }

    const showQuantitySelector = this.config.showQuantitySelectorOnCard;

    // Free gift product cards use a different border (gray instead of gold)
    const freeGiftCardClass = isFreeGiftStep ? ' bw-product-card--free-gift' : '';

    productGrid.innerHTML = products.map(product => {
      const selectionKey = product.variantId || product.id;
      const currentQuantity = selectedProducts[selectionKey] || 0;
      const currencyInfo = CurrencyManager.getCurrencyInfo();

      return `
        <div class="product-card${freeGiftCardClass} ${currentQuantity > 0 ? 'selected' : ''}" data-product-id="${selectionKey}">
          ${currentQuantity > 0 ? `
            <div class="selected-overlay">✓</div>
          ` : ''}

          <div class="product-image">
            <img src="${product.imageUrl}" alt="${ComponentGenerator.escapeHtml(product.title)}" loading="lazy">
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

            ${this.renderVariantSelector(product)}

            ${showQuantitySelector ? `
              <div class="product-quantity-wrapper">
                <div class="product-quantity-selector">
                  <button class="qty-btn qty-decrease" data-product-id="${selectionKey}">−</button>
                  <span class="qty-display">${currentQuantity}</span>
                  <button class="qty-btn qty-increase" data-product-id="${selectionKey}">+</button>
                </div>
              </div>
            ` : ''}

            <button class="product-add-btn ${currentQuantity > 0 ? 'added' : ''}" data-product-id="${selectionKey}">
              ${currentQuantity > 0 ? 'Selected ✓' : 'Add to Cart'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Trigger slide-up animation for cards
    productGrid.classList.remove('bw-animate-in');
    void productGrid.offsetWidth; // force reflow
    productGrid.classList.add('bw-animate-in');

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

  // Render loading skeleton for modal product grid - solid pulsating cards
  // No internal button/quantity skeletons - just clean solid cards
  renderModalProductsLoading(stepIndex) {
    const productGrid = this.elements.modal.querySelector('.product-grid');

    productGrid.innerHTML = `
      ${Array(6).fill(0).map(() => `
        <div class="product-card skeleton-loading">
          <div class="skeleton-card-content"></div>
        </div>
      `).join('')}
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

    // Add to Bundle button handler
    newProductGrid.addEventListener('click', (e) => {
      if (e.target.classList.contains('product-add-btn')) {
        e.stopPropagation();
        const productId = e.target.dataset.productId;
        const product = findProduct(productId);

        // If product has variants and modal is available, open the modal
        if (product && product.variants && product.variants.length > 1 && this.productModal) {
          this.productModal.open(product, step);
        } else {
          // No variants or modal not available - toggle directly
          const currentQuantity = this.selectedProducts[stepIndex][productId] || 0;
          this.updateProductSelection(stepIndex, productId, currentQuantity > 0 ? 0 : 1);
        }
      }
    });

    // Product image/title click - open variant modal if product has variants
    newProductGrid.addEventListener('click', (e) => {
      const productImage = e.target.closest('.product-image');
      const productTitle = e.target.closest('.product-title');

      if (productImage || productTitle) {
        const productCard = e.target.closest('.product-card');
        if (productCard && this.productModal) {
          const productId = productCard.dataset.productId;
          const product = findProduct(productId);

          if (product && product.variants && product.variants.length > 1 && step) {
            // Product has variants - open modal for selection
            this.productModal.open(product, step);
          }
        }
      }
    });

    // Variant selector handler (for inline dropdown if used)
    newProductGrid.addEventListener('change', (e) => {
      if (e.target.classList.contains('variant-selector')) {
        e.stopPropagation();
        const newVariantId = e.target.value;
        const baseProductId = e.target.dataset.baseProductId;

        // Find the product and update its variant
        const product = this.stepProductData[stepIndex].find(p => p.id === baseProductId);
        if (product && product.variants) {
          const variantData = product.variants.find(v => v.id === newVariantId);
          if (variantData) {
            const oldVariantId = product.variantId;

            // Move quantity from old variant to new variant
            const oldQuantity = this.selectedProducts[stepIndex][oldVariantId] || 0;
            if (oldQuantity > 0) {
              delete this.selectedProducts[stepIndex][oldVariantId];
              this.selectedProducts[stepIndex][newVariantId] = oldQuantity;
            }

            // Update product properties
            product.variantId = newVariantId;
            product.price = variantData.price;

            // CRITICAL: Update all data-product-id attributes in the card to use the new variant ID
            // This fixes the bug where quantity controls would use the old variant ID
            const productCard = e.target.closest('.product-card');
            if (productCard) {
              productCard.dataset.productId = newVariantId;
              productCard.querySelectorAll('[data-product-id]').forEach(el => {
                el.dataset.productId = newVariantId;
              });
            }

            // Update UI without full re-render
            this.updateModalNavigation();
            this.updateModalFooterMessaging();
          }
        }
      }
    });

    // Add cursor pointer styles to product images and titles for products with variants
    newProductGrid.querySelectorAll('.product-card').forEach(card => {
      const productId = card.dataset.productId;
      const product = findProduct(productId);
      if (product && product.variants && product.variants.length > 1 && this.productModal) {
        const imageEl = card.querySelector('.product-image');
        const titleEl = card.querySelector('.product-title');
        if (imageEl) imageEl.style.cursor = 'pointer';
        if (titleEl) titleEl.style.cursor = 'pointer';
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
    // Sync free gift slot lock/unlock state — selection changes on paid steps can cross
    // the unlock threshold, so the slot card must reflect the current isFreeGiftUnlocked state.
    this._syncFreeGiftSlotCard();

    // Auto-step progression
    if (this.widgetStyle === 'bottom-sheet') {
      this._autoProgressBottomSheet(stepIndex);
    } else {
      this._autoProgressClassicModal(stepIndex);
    }
  }

  /**
   * Re-render only the free gift slot card in the main stepsContainer to reflect
   * the current isFreeGiftUnlocked state. Called after every paid-step selection
   * change so the lock/unlock state stays in sync without a full renderSteps() pass.
   */
  _syncFreeGiftSlotCard() {
    const freeGiftIdx = this.freeGiftStepIndex;
    if (freeGiftIdx === -1 || !this.elements.stepsContainer) return;
    const existing = this.elements.stepsContainer.querySelector(`[data-step-index="${freeGiftIdx}"]`);
    if (!existing) return;
    const step = this.selectedBundle?.steps[freeGiftIdx];
    if (!step?.isFreeGift) return;
    const fresh = this.createFreeGiftSlotCard(step, freeGiftIdx);
    existing.replaceWith(fresh);
  }

  /**
   * Bottom-sheet auto-step progression.
   * Called after every product selection update.
   * If the current step's condition is now met, advances to the next incomplete step,
   * or closes the modal if all steps are complete.
   */
  _autoProgressBottomSheet(stepIndex) {
    if (!this.validateStep(stepIndex)) return; // current step not yet complete

    const next = bsFindNextIncompleteStep(
      this.selectedBundle.steps,
      this.selectedProducts,
      (i) => this.validateStep(i),
      stepIndex
    );

    if (next === -1) {
      // All steps complete — refresh tabs with checkmarks, then close
      this.renderModalTabs();
      setTimeout(() => this.closeModal(), 500);
    } else {
      // Advance to next incomplete step tab
      this.renderModalTabs();
      setTimeout(() => {
        this.currentStepIndex = next;
        const modal = this.elements.modal;
        const headerText = this.getFormattedHeaderText();
        modal.querySelector('.modal-step-title').innerHTML = headerText;
        this.renderModalProductsLoading(next);
        this.renderModalTabs();
        this.updateModalNavigation();
        this.loadStepProducts(next).then(() => {
          if (this.currentStepIndex !== next) return;
          this.renderModalProducts(next);
          this.updateModalFooterMessaging();
          this.preloadNextStep();
        }).catch(() => {});
      }, 300);
    }
  }

  /**
   * Classic modal auto-close.
   * When all steps are complete, auto-close the modal after a short delay.
   */
  _autoProgressClassicModal(stepIndex) {
    if (!this.validateStep(stepIndex)) return;

    const steps = this.selectedBundle.steps;
    // Check if any required step is still incomplete.
    // Free gift and default steps are non-blocking — skip them.
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].isFreeGift || steps[i].isDefault) continue;
      if (!this.validateStep(i)) return; // at least one paid step incomplete
    }

    // All steps complete — refresh tabs with checkmarks, then auto-close
    this.renderModalTabs();
    setTimeout(() => this.closeModal(), 500);
  }

  updateProductQuantityDisplay(stepIndex, productId, quantity) {
    // Update quantity display without full re-render
    const scope = this.elements.modal?.style.display === 'block'
      ? this.elements.modal
      : this.container;
    const productCard = scope.querySelector(`[data-product-id="${productId}"]`);
    if (productCard) {
      const quantityDisplay = productCard.querySelector('.qty-display');
      const addBtn = productCard.querySelector('.product-add-btn');
      const selectedOverlay = productCard.querySelector('.selected-overlay');

      if (quantityDisplay) {
        quantityDisplay.textContent = quantity;
      }

      if (addBtn) {
        if (quantity > 0) {
          addBtn.textContent = 'Selected ✓';
          addBtn.classList.add('added');
        } else {
          addBtn.textContent = 'Add to Cart';
          addBtn.classList.remove('added');
        }
      }

      if (selectedOverlay) {
        if (quantity > 0) {
          selectedOverlay.style.display = 'flex';
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
    const currentSelections = this.selectedProducts[stepIndex] || {};
    const currentQty = currentSelections[productId] || 0;

    const { allowed, limitText } = ConditionValidator.canUpdateQuantity(
      step,
      currentSelections,
      productId,
      newQuantity,
    );

    // Only block and toast on increases — decreases are always permitted.
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
    // Check if all previous required steps are completed.
    // Free gift and default steps are non-blocking — skip them.
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

    // Buttons are never disabled — navigateModal handles invalid steps with a toast.
    prevButton.disabled = false;

    const isLastStep = this.currentStepIndex === this.selectedBundle.steps.length - 1;
    nextButton.textContent = isLastStep ? 'Done' : 'Next';
    nextButton.disabled = false;
  }

  updateModalFooterMessaging() {
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

    // Always show step name in header - discount messaging is in footer only
    const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
    modalStepTitle.innerHTML = currentStep?.name || `Step ${this.currentStepIndex + 1}`;
  }

  updateModalDiscountMessaging(totalPrice, totalQuantity, discountInfo, currencyInfo) {
    const footerDiscountText = this.elements.modal.querySelector('.footer-discount-text');
    const discountSection = this.elements.modal.querySelector('.modal-footer-discount-messaging')
      || this.elements.modal.querySelector('.modal-header-discount-messaging');

    if (!footerDiscountText) return;

    // Check if any discount rules exist
    const nextRule = PricingCalculator.getNextDiscountRule(this.selectedBundle, totalQuantity, totalPrice);
    const ruleToUse = discountInfo.applicableRule || nextRule;
    const hasDiscountRules = !!ruleToUse;

    // Hide messaging entirely when no discount rules are configured
    if (discountSection) {
      discountSection.style.display = (this.config.showDiscountMessaging && hasDiscountRules) ? 'block' : 'none';
    }

    if (!hasDiscountRules) return;

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
  }

  updateFooterTotalPrices(totalPrice, discountInfo, currencyInfo) {
    const strikePriceEl = this.elements.modal.querySelector('.total-price-strike');
    const finalPriceEl = this.elements.modal.querySelector('.total-price-final');

    if (!strikePriceEl || !finalPriceEl) return;

    if (discountInfo.qualifiesForDiscount && discountInfo.finalPrice < totalPrice) {
      // Show strike-through original price and discounted price
      strikePriceEl.textContent = CurrencyManager.convertAndFormat(totalPrice, currencyInfo);
      strikePriceEl.style.display = 'inline';
      finalPriceEl.textContent = CurrencyManager.convertAndFormat(discountInfo.finalPrice, currencyInfo);
    } else {
      // Show only regular price
      strikePriceEl.style.display = 'none';
      finalPriceEl.textContent = CurrencyManager.convertAndFormat(totalPrice, currencyInfo);
    }
  }

  // ========================================================================
  // LOADING OVERLAY
  // ========================================================================

  showLoadingOverlay(gifUrl) {
    if (!this.container) return;
    // Ensure container is positioned so absolute overlay works
    const pos = getComputedStyle(this.container).position;
    if (pos !== 'relative' && pos !== 'absolute' && pos !== 'fixed' && pos !== 'sticky') {
      this.container.style.position = 'relative';
    }
    // Remove any existing overlay (idempotent)
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
    // Force a synchronous reflow so the browser applies the initial opacity:0
    // before we add 'is-visible'. Using offsetHeight instead of requestAnimationFrame
    // avoids a race condition where hideLoadingOverlay() is called before the rAF
    // fires (which happens when loadBundleData() resolves synchronously from the
    // dataset attribute — microtasks settle before animation frames).
    // eslint-disable-next-line no-unused-expressions
    overlay.offsetHeight;
    overlay.classList.add('is-visible');
  }

  hideLoadingOverlay() {
    const overlay = this.container?.querySelector('.bundle-loading-overlay');
    if (!overlay) return;
    overlay.classList.remove('is-visible');
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
  }

  // ========================================================================
  // CART OPERATIONS
  // ========================================================================

  async addToCart() {
    try {
      const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
        this.selectedProducts,
        this.stepProductData,
        this.selectedBundle?.steps
      );

      if (totalQuantity === 0) {
        ToastManager.show('Please select products for your bundle before adding to cart.');
        return;
      }

      // Validate all required steps (free gift and default steps are not required)
      const allStepsValid = this.selectedBundle.steps.every((step, index) => {
        if (step.isFreeGift || step.isDefault) return true;
        return this.validateStep(index);
      });
      if (!allStepsValid) {
        ToastManager.show('Please complete all bundle steps before adding to cart.');
        return;
      }

      const cartItems = this.buildCartItems();

      // Disable button and show loading overlay during request
      this.elements.addToCartButton.disabled = true;
      this.elements.addToCartButton.textContent = 'Adding to Cart...';
      this.showLoadingOverlay(this.selectedBundle?.loadingGif || null);

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: cartItems })
      });

      // Read body as text first — Shopify can return HTML on password-protected stores
      // or on certain error conditions. JSON.parse on HTML would surface a confusing error.
      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = `Cart add failed (${response.status})`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.description || errorMessage;
        } catch {
          // Response wasn't JSON (e.g., HTML login/password page) — use status-code message
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        // Successful HTTP status but non-JSON body — store may be password-protected
        throw new Error('Cart add failed: Store may be password protected or temporarily unavailable.');
      }

      // Show success message and redirect
      ToastManager.show('Bundle added to cart successfully!');

      setTimeout(() => {
        window.location.href = '/cart';
      }, 1000);

    } catch (error) {
      ToastManager.show(`Failed to add bundle to cart: ${error.message}`);
    } finally {
      // Re-enable button and hide overlay
      this.hideLoadingOverlay();
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


    // Add ACTUAL selected component products to cart
    // Each component gets _bundle_id property for grouping in cart transform
    const unavailableProducts = []; // Track unavailable products

    this.selectedProducts.forEach((stepSelections, stepIndex) => {
      const productsInStep = this.expandProductsByVariant(this.stepProductData[stepIndex] || []);

      Object.entries(stepSelections).forEach(([variantId, quantity]) => {
        if (quantity > 0) {
          const product = productsInStep.find(p => (p.variantId || p.id) === variantId);
          if (product) {
            // Check availability before adding to cart
            if (product.available !== true) {
              unavailableProducts.push(product.title);
              return; // Skip this product
            }

            // variantId is already the user-selected variant ID from selectedProducts
            const actualVariantId = variantId;

            const step = this.selectedBundle.steps[stepIndex];
            const properties = {
              '_bundle_id': bundleInstanceId,
              '_bundle_name': this.selectedBundle.name,
              '_step_index': stepIndex.toString()
            };
            if (step?.isFreeGift) properties['_bundle_step_type'] = 'free_gift';
            if (step?.isDefault) properties['_bundle_step_type'] = 'default';

            const cartItem = {
              id: parseInt(this.extractId(actualVariantId)),
              quantity: quantity,
              properties
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
    // Add to cart button
    this.elements.addToCartButton.addEventListener('click', () => this.addToCart());

    // Modal close handlers
    const modal = this.elements.modal;
    const closeButton = modal.querySelector('.close-button');
    const prevButton = modal.querySelector('.prev-button');
    const nextButton = modal.querySelector('.next-button');

    if (closeButton) {
      closeButton.addEventListener('click', () => this.closeModal());
    }

    if (this.widgetStyle === 'bottom-sheet') {
      // Overlay closes modal
      if (this.elements.bsOverlay) {
        this.elements.bsOverlay.addEventListener('click', () => this.closeModal());
      }
      // PREV/NEXT enabled in bottom-sheet — styled as pill buttons in footer
      if (prevButton) prevButton.addEventListener('click', () => this.navigateModal(-1));
      if (nextButton) nextButton.addEventListener('click', () => this.navigateModal(1));
    } else {
      // Classic mode: overlay is inside the modal
      const overlay = modal.querySelector('.modal-overlay');
      if (overlay) {
        overlay.addEventListener('click', () => this.closeModal());
      }
      if (prevButton) {
        prevButton.addEventListener('click', () => this.navigateModal(-1));
      }
      if (nextButton) {
        nextButton.addEventListener('click', () => this.navigateModal(1));
      }
    }

    // Keyboard: close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const isOpen = this.widgetStyle === 'bottom-sheet'
          ? modal.classList.contains('bw-bs-panel--open')
          : modal.style.display === 'block';
        if (isOpen) this.closeModal();
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

        // OPTIMISTIC RENDERING: Update UI immediately with loading state
        this.renderModalTabs();
        this.renderModalProductsLoading(newStepIndex);
        this.updateModalNavigation();
        this.updateModalFooterMessaging();

        // Load products asynchronously
        await this.loadStepProducts(newStepIndex);
        this.renderModalProducts(this.currentStepIndex);
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

          // OPTIMISTIC RENDERING: Update UI immediately with loading state
          this.renderModalTabs();
          this.renderModalProductsLoading(newStepIndex);
          this.updateModalNavigation();
          this.updateModalFooterMessaging();

          // Load products asynchronously
          await this.loadStepProducts(newStepIndex);
          this.renderModalProducts(this.currentStepIndex);
          this.updateModalFooterMessaging();

          // PRELOAD NEXT STEP
          this.preloadNextStep();
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
  document.addEventListener('DOMContentLoaded', initializeProductPageWidget);
} else {
  initializeProductPageWidget();
}

function initializeProductPageWidget() {
  const containers = document.querySelectorAll('#bundle-builder-app');
  containers.forEach(container => {
    if (!container.dataset.initialized) {
      const bundleType = container.dataset.bundleType || 'product_page';
      if (bundleType === 'product_page') {
        new BundleWidgetProductPage(container);
      }
    }
  });
}


})();
