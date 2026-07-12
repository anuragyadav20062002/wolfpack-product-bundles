/*!
 * Wolfpack Bundles SDK
 * Version : 5.0.147
 * Built   : 2026-07-12
 *
 * Verify live version: console.log(window.__WOLFPACK_BUNDLES_SDK_VERSION__)
 */
window.__WOLFPACK_BUNDLES_SDK_VERSION__ = '5.0.147';
(function (window) {
  'use strict';

  // ============================================================================
  // SHARED MODULES (ConditionValidator, PricingCalculator, CurrencyManager, etc.)
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
    if (!step || !step.conditionType || !step.conditionOperator || !_isPositiveConditionValue(step.conditionValue)) {
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
    if (step.conditionOperator2 != null && _isPositiveConditionValue(step.conditionValue2)) {
      const secondary = _evaluateCanUpdate(step.conditionOperator2, step.conditionValue2, totalAfter);
      if (!secondary.allowed) return secondary;
    }

    return { allowed: true, limitText: null };
  }

  /**
   * Normalize an operator name. The validator accepts both Wolfpack-style
   * snake_case (`greater_than_or_equal_to`) and camelCase
   * (`greaterThanOrEqualTo`) so the same evaluator works against step rules
   * (snake_case) and category rules (camelCase, persisted from the admin
   * UI's CATEGORY_CONDITION_OPERATOR_OPTIONS).
   */
  function _normalizeOperator(operator) {
    if (typeof operator !== 'string' || operator.length === 0) return operator;
    if (operator.indexOf('_') !== -1) return operator;
    return operator.replace(/([A-Z])/g, '_$1').toLowerCase();
  }

  function _sumQuantities(selections) {
    let total = 0;
    if (!selections) return total;
    for (const qty of Object.values(selections)) {
      total += _getSelectionQuantity(qty);
    }
    return total;
  }

  function _isPositiveConditionValue(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0;
  }

  function _collectCategoryProductIds(category) {
    const ids = new Set();
    const products = Array.isArray(category && category.products) ? category.products : [];
    for (const product of products) {
      const raw = product && (product.id || product.productId || product.graphqlId);
      if (raw == null || raw === '') continue;
      // Strip GID prefix (e.g. "gid://shopify/Product/123" → "123") so that the
      // Set matches numeric IDs used as widget selection keys.
      const id = String(raw).replace(new RegExp('^gid://shopify/[^/]+/'), '');
      if (id) ids.add(id);
    }
    return ids;
  }

  function _getSelectionQuantity(selection) {
    if (selection && typeof selection === 'object') {
      return Number(selection.quantity) || 0;
    }
    return Number(selection) || 0;
  }

  function _getSelectionAmount(selection) {
    if (selection && typeof selection === 'object') {
      return Number(selection.amount) || 0;
    }
    return Number(selection) || 0;
  }

  function _getSelectionWeight(selection) {
    if (selection && typeof selection === 'object') {
      return Number(selection.weight) || 0;
    }
    return Number(selection) || 0;
  }

  function _normalizeAmountRuleValue(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return numeric;
    return numeric * 100;
  }

  /**
   * Evaluate whether a single category's rules are satisfied by the current
   * step selections. Categories with no `conditions` are always satisfied.
   *
   * Used by `isStepConditionSatisfied` in category-rule mode.
   */
  function evaluateCategoryRules(category, stepSelections) {
    const rules = Array.isArray(category && category.conditions)
      ? category.conditions.filter(rule => _isPositiveConditionValue(rule && rule.value))
      : [];
    if (rules.length === 0) return true;

    const productIds = _collectCategoryProductIds(category);
    const selections = stepSelections || {};
    for (const rule of rules) {
      const operator = _normalizeOperator(rule && (rule.operator || rule.condition));
      const ruleType = rule && (rule.conditionType || rule.type);
      const isAmountRule = ruleType === 'amount';
      const isWeightRule = ruleType === 'weight';
      const value = isAmountRule ? _normalizeAmountRuleValue(rule && rule.value) : Number(rule && rule.value);
      if (!Number.isFinite(value)) continue;
      let categoryTotal = 0;
      for (const pid of Object.keys(selections)) {
        if (productIds.has(String(pid))) {
          if (isAmountRule) {
            categoryTotal += _getSelectionAmount(selections[pid]);
          } else if (isWeightRule) {
            categoryTotal += _getSelectionWeight(selections[pid]);
          } else {
            categoryTotal += _getSelectionQuantity(selections[pid]);
          }
        }
      }
      if (!_evaluateSatisfied(operator, value, categoryTotal)) return false;
    }
    return true;
  }

  function _isCategoryRuleMode(step) {
    const categories = Array.isArray(step && step.categories) ? step.categories : [];
    return categories.some(c =>
      Array.isArray(c && c.conditions)
      && c.conditions.some(rule => _isPositiveConditionValue(rule && rule.value))
    );
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

    // Category-rule mode: when any category has non-empty `conditions`, the
    // step is satisfied when every category with conditions is independently
    // satisfied. Step-level conditions are ignored in this mode (mutually
    // exclusive with category rules per the admin UI).
    if (_isCategoryRuleMode(step)) {
      const categories = Array.isArray(step.categories) ? step.categories : [];
      for (const cat of categories) {
        if (!evaluateCategoryRules(cat, currentSelections)) return false;
      }
      return true;
    }

    const selections = currentSelections || {};
    let total = 0;
    for (const qty of Object.values(selections)) {
      total += _getSelectionQuantity(qty);
    }

    // No explicit condition configured → only enforce minQuantity; no upper bound
    if (!step.conditionType || !step.conditionOperator || !_isPositiveConditionValue(step.conditionValue)) {
      const min = step.minQuantity != null ? Number(step.minQuantity) : 1;
      return total >= min;
    }

    // Primary condition
    if (!_evaluateSatisfied(step.conditionOperator, step.conditionValue, total)) return false;

    // Secondary condition — AND logic
    if (step.conditionOperator2 != null && _isPositiveConditionValue(step.conditionValue2)) {
      return _evaluateSatisfied(step.conditionOperator2, step.conditionValue2, total);
    }

    return true;
  }

  function getAllowedQuantityPerProduct(validateQuantityPerProduct) {
    if (!validateQuantityPerProduct || validateQuantityPerProduct.isEnabled !== true) {
      return null;
    }

    const allowed = Number(validateQuantityPerProduct.allowedQuantity);
    if (!Number.isFinite(allowed) || allowed < 1) {
      return 1;
    }

    return Math.floor(allowed);
  }

  function canUpdateProductQuantity(validateQuantityPerProduct, currentQuantity, newQuantity) {
    const limit = getAllowedQuantityPerProduct(validateQuantityPerProduct);
    if (limit === null) {
      return { allowed: true, limit: null };
    }

    const current = Number(currentQuantity) || 0;
    const proposed = Number(newQuantity) || 0;
    if (proposed <= current) {
      return { allowed: true, limit };
    }

    return {
      allowed: proposed <= limit,
      limit,
    };
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
      case OPERATORS.LESS_THAN_OR_EQUAL_TO:
        allowed = totalAfter <= required;
        break;
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
      case OPERATORS.GREATER_THAN_OR_EQUAL_TO: return total >= required;
      case OPERATORS.LESS_THAN_OR_EQUAL_TO:   return total <= required;
      default:                                return false;
    }
  }

  function _buildLimitText(operator, required) {
    const map = {
      [OPERATORS.EQUAL_TO]:                `exactly ${required}`,
      [OPERATORS.LESS_THAN_OR_EQUAL_TO]:   `at most ${required}`,
      [OPERATORS.GREATER_THAN_OR_EQUAL_TO]: `at least ${required}`,
    };
    return map[operator] || String(required);
  }

  function _formatStepLimitToast(limitText, required) {
    const requiredQuantity = Number(required);
    if (!Number.isFinite(requiredQuantity) || requiredQuantity <= 0) {
      return 'This step is not configured correctly.';
    }

    const suffix = requiredQuantity === 1 ? '' : 's';
    return `This step allows ${limitText} product${suffix} only.`;
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  return {
    OPERATORS,
    calculateStepTotalAfterUpdate,
    canUpdateQuantity,
    isStepConditionSatisfied,
    evaluateCategoryRules,
    isCategoryRuleMode: _isCategoryRuleMode,
    getAllowedQuantityPerProduct,
    canUpdateProductQuantity,
    _formatStepLimitToast,
  };
}());

// CommonJS export for Node.js / Jest test environment.
// Harmless in browsers (no `module` global in IIFE context).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConditionValidator;
  module.exports.ConditionValidator = ConditionValidator;
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
    FIXED_BUNDLE_PRICE: 'fixed_bundle_price',
    BUY_X_GET_Y: 'buy_x_get_y'
  },

  // Shared asset URLs
  // AVIF is default for lower bytes and better decoding efficiency; PNG remains as a guaranteed fallback via
  // component-level onerror handling.
  PLACEHOLDER_IMAGE: '/bundle-product-placeholder.avif',
  PLACEHOLDER_IMAGE_FALLBACK: '/bundle-product-placeholder.png'
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
      'HKD': 'HK$', 'NZD': 'NZ$', 'KRW': '₩', 'THB': '฿',
      'PKR': 'Rs.', 'LKR': 'Rs.', 'NPR': 'Rs.',
      'BDT': '৳', 'NGN': '₦', 'KES': 'KSh', 'GHS': 'GH₵',
      'EGP': 'E£', 'IDR': 'Rp', 'MYR': 'RM', 'PHP': '₱',
      'VND': '₫', 'TRY': '₺', 'ILS': '₪', 'TWD': 'NT$',
      'SAR': 'SR', 'AED': 'AED', 'QAR': 'QR', 'KWD': 'KD',
      'BHD': 'BD', 'OMR': 'OMR', 'JOD': 'JD', 'LBP': 'L£',
      'MAD': 'DH', 'TND': 'DT', 'DZD': 'DA',
      'ARS': 'AR$', 'CLP': 'CLP$', 'COP': 'COL$', 'PEN': 'S/.',
      'UYU': '$U', 'VES': 'Bs', 'BOB': 'Bs.', 'PYG': '₲',
      'UAH': '₴', 'BGN': 'лв', 'RON': 'lei', 'HRK': 'kn',
      'RSD': 'дин', 'ISK': 'kr'
    };
    return symbols[currencyCode] || currencyCode;
  }

  /**
   * Ensure the format string uses the proper symbol for the given currency.
   * If Shopify's format contains the 3-letter currency code (e.g. "PKR {{amount}}"),
   * replace it with the symbol from our map ("Rs. {{amount}}"). This preserves
   * the merchant's decimal/thousand-separator placeholder choice
   * (e.g. {{amount_with_comma_separator}}) while ensuring symbols always render.
   */
  static normalizeCurrencyFormat(format, code, symbol) {
    if (!format) return `${symbol}{{amount}}`;
    if (!code || !symbol || symbol === code) return format;
    return format.replace(new RegExp(`\\b${code}\\b`, 'g'), symbol);
  }

  static getCurrencyInfo() {
    const customerCurrency = this.detectCustomerCurrency();
    const shopBaseCurrency = this.getShopBaseCurrency();
    const displaySymbol = this.getCurrencySymbol(customerCurrency.code);
    const displayFormat = this.normalizeCurrencyFormat(
      window.Shopify?.currency?.format,
      customerCurrency.code,
      displaySymbol
    );

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

  static _normalizeId(value) {
    if (value === null || value === undefined) {
      return [];
    }

    const output = [];

    const candidates = Array.isArray(value) ? value : [value];

    candidates.forEach((candidate) => {
      if (candidate === null || candidate === undefined) {
        return;
      }

      const token = String(candidate).trim();
      if (!token) {
        return;
      }

      output.push(token.toLowerCase());

      if (token.includes('/')) {
        output.push(token.split('/').pop().toLowerCase());
      }
    });

    return output;
  }

  static _buildTargetIdentifierSet(resources) {
    if (!Array.isArray(resources)) {
      return new Set();
    }

    const identifiers = new Set();

    resources.forEach((resource) => {
      if (!resource || typeof resource !== 'object') {
        return;
      }

      this._normalizeId(resource.id).forEach((value) => identifiers.add(value));
      this._normalizeId(resource.graphqlId).forEach((value) => identifiers.add(value));
      this._normalizeId(resource.admin_graphql_api_id).forEach((value) => identifiers.add(value));
      this._normalizeId(resource.productId).forEach((value) => identifiers.add(value));
      this._normalizeId(resource.collectionId).forEach((value) => identifiers.add(value));
      this._normalizeId(resource.handle).forEach((value) => identifiers.add(value));
    });

    return identifiers;
  }

  static _buildCurrentCollectionIdentifierSet(currentProductCollections) {
    if (!Array.isArray(currentProductCollections) || currentProductCollections.length === 0) {
      return new Set();
    }

    const identifiers = new Set();

    currentProductCollections.forEach((collection) => {
      if (collection && typeof collection === 'object') {
        this._normalizeId(collection.id).forEach((value) => identifiers.add(value));
        this._normalizeId(collection.graphqlId).forEach((value) => identifiers.add(value));
        this._normalizeId(collection.admin_graphql_api_id).forEach((value) => identifiers.add(value));
        this._normalizeId(collection.collectionId).forEach((value) => identifiers.add(value));
        this._normalizeId(collection.handle).forEach((value) => identifiers.add(value));
        return;
      }

      this._normalizeId(collection).forEach((value) => identifiers.add(value));
    });

    return identifiers;
  }

  static _evaluateWidgetVisibility(bundle, config) {
    if (!bundle || typeof bundle !== 'object') {
      return false;
    }

    if (bundle.bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE) {
      return true;
    }

    const visibility = bundle.bundleUpsellConfig?.widgetConfiguration?.displayConfiguration;
    if (!visibility || typeof visibility !== 'object') {
      return true;
    }

    const hasCollections = Array.isArray(visibility.collectionsSelectedData) && visibility.collectionsSelectedData.length > 0 ||
      Array.isArray(visibility.showOnSpecificCollectionPages) && visibility.showOnSpecificCollectionPages.length > 0;
    const hasProducts = Array.isArray(visibility.selectedProducts) && visibility.selectedProducts.length > 0 ||
      Array.isArray(visibility.showOnSpecificProductPages) && visibility.showOnSpecificProductPages.length > 0;

    const targeting = hasCollections
      ? 'specific_collections'
      : hasProducts
        ? 'specific_products'
        : visibility.showOnAllBundleProducts === false
          ? 'specific_products'
          : 'all';

    if (targeting === 'all') {
      return true;
    }

    const currentProductId = config.currentProductId ? String(config.currentProductId).trim() : null;
    const currentProductGid = currentProductId ? `gid://shopify/Product/${currentProductId}` : null;

    const currentProductIdSet = new Set([
      ...this._normalizeId(currentProductId),
      ...this._normalizeId(currentProductGid),
      ...this._normalizeId(config.currentProductId),
      ...this._normalizeId(config.currentProductHandle),
      ...this._normalizeId(config.currentProductGid),
    ]);

    if (currentProductIdSet.size === 0) {
      return false;
    }

    if (targeting === 'specific_products') {
      const targetSet = this._buildTargetIdentifierSet([
        ...(Array.isArray(visibility.selectedProducts) ? visibility.selectedProducts : []),
        ...(Array.isArray(visibility.showOnSpecificProductPages) ? visibility.showOnSpecificProductPages : []),
      ]);
      return [...currentProductIdSet].some((value) => targetSet.has(value));
    }

    const collectionTargetSet = this._buildTargetIdentifierSet([
      ...(Array.isArray(visibility.collectionsSelectedData) ? visibility.collectionsSelectedData : []),
      ...(Array.isArray(visibility.showOnSpecificCollectionPages) ? visibility.showOnSpecificCollectionPages : []),
    ]);
    const currentCollectionSet = this._buildCurrentCollectionIdentifierSet(config.currentProductCollections || []);

    return [...collectionTargetSet].some((value) => currentCollectionSet.has(value));
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
      // AVIF is preferred for new widget payloads; old /bundle-product-placeholder.png kept as a compatibility fallback by
      // component-level onerror handling.
      imageUrl: sp.product?.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE,
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

    const bundles = Object.values(bundlesData).filter(bundle => {
      if (!this.validateSingleBundle(bundle)) return false;
      if (bundle.status === 'active' || bundle.status === 'unlisted') return true;

      return (
        bundle.status === 'draft' &&
        bundle.bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE &&
        config.bundleId &&
        bundle.id === config.bundleId
      );
    });

    if (bundles.length === 0) {
      return null;
    }

    // Selection priority for bundles (both product-page and full-page types)
    for (const bundle of bundles) {
      if (bundle.bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.PRODUCT_PAGE ||
          bundle.bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE) {
        if (!this._evaluateWidgetVisibility(bundle, config)) {
          continue;
        }

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

        if (
          bundle.bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.PRODUCT_PAGE &&
          bundle.bundleUpsellConfig?.widgetConfiguration?.displayConfiguration
        ) {
          return bundle;
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


function isDiscountedAddonStep(step) {
  if (!step || step.isFreeGift !== true) return false;
  if (Array.isArray(step.addonTiers) && step.addonTiers.length > 0) return true;
  return Boolean(step.addonEligibilityCondition || step.addonDiscount);
}

class PricingCalculator {
  static calculateBundleTotal(selectedProducts, stepProductData, steps = null) {
    let totalPrice = 0;
    let totalQuantity = 0;
    const unitPrices = [];

    selectedProducts.forEach((stepSelections, stepIndex) => {
      // Skip only legacy free gifts. EB-style add-on tiers remain in the
      // original subtotal so their native line discount can reduce them to zero.
      const step = steps?.[stepIndex];
      if (step?.isFreeGift && step?.addonDisplayFree === true && !isDiscountedAddonStep(step)) return;

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
          for (let i = 0; i < quantity; i++) {
            unitPrices.push(price);
          }
        }
      });
    });

    return { totalPrice, totalQuantity, unitPrices };
  }

  static getDiscountMethod(bundle) {
    return bundle?.pricing?.method || BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF;
  }

  static getRuleConditionType(rule) {
    return rule?.conditionType || 'quantity';
  }

  static getRuleConditionOperator(rule) {
    return rule?.conditionOperator || 'gte';
  }

  static getRuleConditionValue(rule, discountMethod = BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF) {
    if (
      discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.BUY_X_GET_Y &&
      this.getRuleConditionType(rule) === 'quantity'
    ) {
      const customerBuys = Number(rule?.customerBuys || 0);
      const customerGets = Number(rule?.customerGets || 0);
      if (customerBuys > 0 && customerGets > 0) {
        return customerBuys + customerGets;
      }
    }

    return Number(rule?.conditionValue ?? 0);
  }

  static getRuleDiscountValue(rule) {
    return Number(rule?.discountValue ?? 0);
  }

  static calculateDiscount(bundle, totalPrice, totalQuantity, unitPrices = []) {
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
    const discountMethod = this.getDiscountMethod(bundle);

    for (const rule of rules) {
      const conditionType = this.getRuleConditionType(rule);
      if (!conditionType) continue;

      const conditionOperator = this.getRuleConditionOperator(rule);
      const conditionValue = this.getRuleConditionValue(rule, discountMethod);

      let conditionMet = false;

      if (conditionType === 'amount') {
        conditionMet = this.checkCondition(totalPrice, conditionOperator, conditionValue);
      } else {
        conditionMet = this.checkCondition(totalQuantity, conditionOperator, conditionValue);
      }

      if (conditionMet) {
        const bestConditionValue = this.getRuleConditionValue(bestRule, discountMethod);
        if (!bestRule || conditionValue > bestConditionValue) {
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
    const discountValue = this.getRuleDiscountValue(bestRule);

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
      case BUNDLE_WIDGET.DISCOUNT_METHODS.BUY_X_GET_Y:
        discountAmount = this.calculateBuyXGetYDiscountAmount(
          bestRule,
          totalPrice,
          totalQuantity,
          unitPrices
        );
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

  static calculateBuyXGetYDiscountAmount(rule, totalPrice, totalQuantity, unitPrices = []) {
    const customerBuys = Number(rule?.customerBuys || 0);
    const customerGets = Number(rule?.customerGets || 0);
    const discountValue = this.getRuleDiscountValue(rule);
    const discountType = rule?.bxyDiscountType || rule?.discountType || 'percentage';
    const applyMode = rule?.bxyApplyMode || rule?.applyDiscountTo || 'lowest_priced';
    const groupSize = customerBuys + customerGets;

    if (customerBuys <= 0 || customerGets <= 0 || groupSize <= 0 || totalQuantity < groupSize) {
      return 0;
    }

    const discountedItemCount = Math.min(
      totalQuantity,
      Math.floor(totalQuantity / groupSize) * customerGets
    );
    if (discountedItemCount <= 0) return 0;

    const averageUnitPrice = totalQuantity > 0 ? totalPrice / totalQuantity : 0;
    const prices = Array.isArray(unitPrices)
      ? unitPrices.map(price => Number(price) || 0).filter(price => price > 0)
      : [];

    while (prices.length < totalQuantity && averageUnitPrice > 0) {
      prices.push(averageUnitPrice);
    }

    const discountedPrices = applyMode === 'latest_added'
      ? prices.slice(-discountedItemCount)
      : [...prices].sort((a, b) => a - b).slice(0, discountedItemCount);

    const discountAmount = discountedPrices.reduce((sum, price) => {
      if (discountType === 'fixed_amount') {
        return sum + Math.min(price, discountValue);
      }
      return sum + Math.round(price * (discountValue / 100));
    }, 0);

    return Math.min(Math.round(discountAmount), totalPrice);
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

    const rules = [...bundle.pricing.rules].sort((a, b) =>
      this.getRuleConditionValue(a, this.getDiscountMethod(bundle)) -
      this.getRuleConditionValue(b, this.getDiscountMethod(bundle))
    );

    for (const rule of rules) {
      const discountMethod = this.getDiscountMethod(bundle);
      const conditionType = this.getRuleConditionType(rule);
      if (!conditionType) continue;

      const conditionOperator = this.getRuleConditionOperator(rule);
      const conditionValue = this.getRuleConditionValue(rule, discountMethod);

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

    // Create toast element - uses Settings design CSS variables
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

    // Add to page (styles come from bundle-widget.css with Settings design CSS variables)
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

  static getDiscountMessageRule({
    bundle,
    totalQuantity = 0,
    totalPrice = 0,
    discountInfo = {},
    messageType = 'progress'
  } = {}) {
    const nextRule = PricingCalculator.getNextDiscountRule(bundle, totalQuantity, totalPrice);
    return messageType === 'success'
      ? (discountInfo.applicableRule || nextRule)
      : (nextRule || discountInfo.applicableRule);
  }

  static createDiscountVariables(bundle, totalPrice, totalQuantity, discountInfo, currencyInfo, options = {}) {
    const ruleToUse = options.rule || this.getDiscountMessageRule({
      bundle,
      totalQuantity,
      totalPrice,
      discountInfo,
      messageType: options.messageType || 'progress'
    });

    if (!ruleToUse) {
      return this.createEmptyVariables(bundle, totalPrice, totalQuantity, discountInfo, currencyInfo);
    }

    const discountMethod = PricingCalculator.getDiscountMethod(bundle);
    const conditionType = PricingCalculator.getRuleConditionType(ruleToUse);
    const targetValue = PricingCalculator.getRuleConditionValue(ruleToUse, discountMethod);
    const conditionOperator = PricingCalculator.getRuleConditionOperator(ruleToUse);
    const rawDiscountValue = PricingCalculator.getRuleDiscountValue(ruleToUse);
    const discountedItems = discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.BUY_X_GET_Y
      ? String(Number(ruleToUse.customerGets || 0))
      : (conditionType === 'quantity' ? targetValue.toString() : '0');

    // Calculate condition-specific values
    const conditionData = this.calculateConditionData(conditionType, targetValue, conditionOperator, totalPrice, totalQuantity, currencyInfo);

    // Calculate discount-specific values
    let discountData = this.calculateDiscountData(discountMethod, rawDiscountValue, currencyInfo, ruleToUse);
    const dtoDiscountDisplay = this.getRuleDiscountDisplay(bundle, ruleToUse);
    if (
      dtoDiscountDisplay?.valueToken &&
      this.shouldUseDtoDiscountDisplay(discountMethod, ruleToUse) &&
      this.canUseSavedDiscountDisplayValue(discountMethod, dtoDiscountDisplay.valueToken, ruleToUse)
    ) {
      discountData = {
        ...discountData,
        discountText: dtoDiscountDisplay.text,
        discountValue: dtoDiscountDisplay.valueToken,
        discountValueUnit: ''
      };
    }

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
      discountConditionDiff: conditionType === 'amount' ? conditionData.amountNeeded : conditionData.itemsNeeded,
      discountUnit: conditionType === 'amount' ? currencyInfo.display.symbol : '',
      discountValue: discountData.discountValue,
      discountValueUnit: discountData.discountValueUnit,
      discountedItems,

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

  static getRuleMessages(bundle, locale = '') {
    const pricingMessages = bundle?.pricing?.messages;
    const byLocale = pricingMessages?.ruleMessagesByLocale;
    const localeRuleMessages = locale && byLocale?.[locale];
    return localeRuleMessages || pricingMessages?.ruleMessages || {};
  }

  static getRuleTierMessage(bundle, rule) {
    const ruleId = rule?.id ? String(rule.id) : '';
    if (!ruleId) return '';

    const tierText = bundle?.pricing?.messages?.tierTextByRuleId?.[ruleId];
    const title = typeof tierText?.tierText === 'string' ? tierText.tierText.trim() : '';
    const subtext = typeof tierText?.tierSubtext === 'string' ? tierText.tierSubtext.trim() : '';

    return [title, subtext].filter(Boolean).join('<br>');
  }

  static getDiscountMessageTemplate({
    bundle,
    totalQuantity = 0,
    totalPrice = 0,
    discountInfo = {},
    messageType = 'progress',
    fallbackTemplate = '',
    locale = ''
  }) {
    const rule = this.getDiscountMessageRule({
      bundle,
      totalQuantity,
      totalPrice,
      discountInfo,
      messageType
    });

    if (!rule) return fallbackTemplate || '';

    if (messageType === 'success') {
      const tierMessage = this.getRuleTierMessage(bundle, rule);
      if (tierMessage) return tierMessage;
    }

    const ruleId = rule?.id ? String(rule.id) : '';
    const ruleMessages = this.getRuleMessages(bundle, locale);
    const ruleMessage = ruleId ? ruleMessages?.[ruleId] : null;
    const template = messageType === 'success'
      ? ruleMessage?.successMessage
      : ruleMessage?.discountText;

    return (typeof template === 'string' && template.trim())
      ? template
      : (fallbackTemplate || '');
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

  static calculateDiscountData(discountMethod, rawDiscountValue, currencyInfo, rule = null) {
    if (rawDiscountValue == null) {
      console.warn('[BUNDLE_WIDGET] calculateDiscountData: rawDiscountValue is', rawDiscountValue);
    }
    const safeValue = parseFloat(rawDiscountValue) || 0;

    switch (discountMethod) {
      case BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF:
        const percentage = Math.round(safeValue);
        return {
          discountText: `${percentage}% off`,
          discountValue: String(percentage),
          discountValueUnit: '%'
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
          discountText: `${currencyInfo.display.symbol}${amountOff} off`,
          discountValue: amountOff,
          discountValueUnit: currencyInfo.display.symbol
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
          discountText: `${currencyInfo.display.symbol}${bundlePrice}`,
          discountValue: `${currencyInfo.display.symbol}${bundlePrice}`,
          discountValueUnit: ''
        };

      case BUNDLE_WIDGET.DISCOUNT_METHODS.BUY_X_GET_Y:
        if ((rule?.bxyDiscountType || rule?.discountType) === 'fixed_amount') {
          const convertedBxyAmount = CurrencyManager.convertCurrency(
            safeValue,
            currencyInfo.calculation.code,
            currencyInfo.display.code,
            currencyInfo.display.rate
          );
          const bxyAmountOff = (convertedBxyAmount / 100).toFixed(2);
          return {
            discountText: `${currencyInfo.display.symbol}${bxyAmountOff} off`,
            discountValue: `${currencyInfo.display.symbol}${bxyAmountOff}`,
            discountValueUnit: ''
          };
        }
        const bxyPercentage = Math.round(safeValue);
        return {
          discountText: `${bxyPercentage}% off`,
          discountValue: String(bxyPercentage),
          discountValueUnit: '%'
        };

      default:
        return {
          discountText: 'discount',
          discountValue: String(safeValue),
          discountValueUnit: ''
        };
    }
  }

  static shouldUseDtoDiscountDisplay(discountMethod, rule = null) {
    if (discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_AMOUNT_OFF) {
      return true;
    }

    if (discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.BUY_X_GET_Y) {
      return (rule?.bxyDiscountType || rule?.discountType) === 'fixed_amount';
    }

    return false;
  }

  static canUseSavedDiscountDisplayValue(discountMethod, valueToken, rule = null) {
    if (valueToken == null) return false;
    const token = String(valueToken).trim();
    if (!token) return false;

    const isFixedAmount =
      discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_AMOUNT_OFF ||
      (
        discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.BUY_X_GET_Y &&
        (rule?.bxyDiscountType || rule?.discountType) === 'fixed_amount'
      );

    if (isFixedAmount && this.containsPercentageValue(token)) {
      return false;
    }

    return true;
  }

  static containsPercentageValue(value) {
    if (typeof value !== 'string') return false;
    const percentIndex = value.indexOf('%');
    if (percentIndex === -1) return false;

    return value
      .slice(0, percentIndex)
      .split('')
      .some(character => character >= '0' && character <= '9');
  }

  static getRuleDiscountDisplay(bundle, rule = null) {
    const messages = bundle?.pricing?.messages;
    const ruleId = rule?.id ? String(rule.id) : '';
    const bundleQuantityOptions = messages?.displayOptions?.bundleQuantityOptions || {};
    const optionsByRuleId = bundleQuantityOptions.optionsByRuleId || {};
    const tierTextByRuleId = messages?.tierTextByRuleId || {};
    const candidates = [];

    if (ruleId) {
      candidates.push(optionsByRuleId[ruleId]?.subtext);
      candidates.push(tierTextByRuleId[ruleId]?.tierSubtext);
    }

    const defaultRuleId = bundleQuantityOptions.defaultRuleId ? String(bundleQuantityOptions.defaultRuleId) : '';
    if (defaultRuleId && defaultRuleId !== ruleId) {
      candidates.push(optionsByRuleId[defaultRuleId]?.subtext);
      candidates.push(tierTextByRuleId[defaultRuleId]?.tierSubtext);
    }

    const text = candidates.find(value => typeof value === 'string' && value.trim());
    if (!text) return null;

    const valueToken = this.extractDiscountValueToken(text);
    if (!valueToken) return null;

    return {
      text: text.trim(),
      valueToken
    };
  }

  static extractDiscountValueToken(displayText) {
    if (typeof displayText !== 'string') return '';

    const token = displayText
      .trim()
      .replace(/^save\s+/i, '')
      .replace(/\s+discount$/i, '')
      .replace(/\s+off$/i, '')
      .trim();

    return /\d/.test(token) ? token : '';
  }

  static createEmptyVariables(bundle, totalPrice, totalQuantity, discountInfo, currencyInfo) {
    return {
      // Condition-specific variables
      amountNeeded: '0',
      itemsNeeded: '0',
      conditionText: '0 items',
      discountText: 'No discount',
      discountConditionDiff: '0',
      discountUnit: '',
      discountValue: '0',
      discountValueUnit: '',
      discountedItems: '0',

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
    const isSelected = currentQuantity > 0;

    // Check if this is an expanded variant card (has parentProductId and no variants array)
    // In this case, don't show variant selector - each card IS a variant
    const isExpandedVariantCard = product.parentProductId && (!product.variants || product.variants.length === 0);

    // Caller can supply a pre-rendered variant selector HTML (e.g. VariantSelectorComponent).
    // If not supplied, fall back to the built-in <select> dropdown.
    const variantSelectorHtml = options.variantSelectorHtml !== undefined
      ? options.variantSelectorHtml
      : (isExpandedVariantCard ? '' : this.renderVariantSelector(product));
    const actionMode = options.actionMode || 'default';
    const addButtonText = options.addButtonText || '+';

    // Render inline quantity controls when item is selected
    const renderInlineQuantityControls = () => {
      if (!isSelected) return '';
      return `
        <div class="inline-quantity-controls bw-quantity-control">
          <button class="inline-qty-btn qty-decrease bw-quantity-control__button" data-product-id="${selectionKey}">−</button>
          <span class="inline-qty-display bw-quantity-control__value">${currentQuantity}</span>
          <button class="inline-qty-btn qty-increase bw-quantity-control__button" data-product-id="${selectionKey}">+</button>
        </div>
      `;
    };

    // Render add button or quantity controls based on selection state
    const renderBottomAction = () => {
      if (actionMode === 'expandingQuantity') {
        return `
          <div class="product-card-action bw-product-card__action ${isSelected ? 'is-expanded' : ''}">
            ${isSelected ? renderInlineQuantityControls() : `<button class="product-add-btn bw-product-card__add-button" data-product-id="${selectionKey}">${this.escapeHtml(addButtonText)}</button>`}
          </div>
        `;
      }

      if (isSelected) {
        return renderInlineQuantityControls();
      }
      return `<button class="product-add-btn bw-product-card__add-button" data-product-id="${selectionKey}">${this.escapeHtml(addButtonText)}</button>`;
    };

    // Render variant badge if this is an expanded variant card
    const renderVariantBadge = () => {
      if (isExpandedVariantCard && product.variantTitle) {
        return `<div class="product-variant-badge">${this.escapeHtml(product.variantTitle)}</div>`;
      }
      return '';
    };

    return `
      <div class="product-card bw-product-card bw-product-card--mode-grid ${isSelected ? 'bw-product-card--selected' : ''}" data-bw-product-card="true" data-product-id="${selectionKey}" data-current-selected-variant-id="${selectionKey}">
        <div class="product-image bw-product-card__media">
          <img class="bw-product-card__image" src="${product.imageUrl || product.image?.src || BUNDLE_WIDGET.PLACEHOLDER_IMAGE}" alt="${this.escapeHtml(product.title)}" loading="lazy" onerror="if (this.src.indexOf('${BUNDLE_WIDGET.PLACEHOLDER_IMAGE_FALLBACK}') === -1) this.src='${BUNDLE_WIDGET.PLACEHOLDER_IMAGE_FALLBACK}'">
        </div>

        <div class="product-content-wrapper bw-product-card__body">
          <div class="product-title bw-product-card__title">${this.escapeHtml(product.parentTitle || product.title)}</div>
          ${renderVariantBadge()}

          ${product.price ? `
            <div class="product-price-row bw-product-card__price">
              ${product.compareAtPrice ? `<span class="product-price-strike bw-product-card__compare-price">${CurrencyManager.formatMoney(product.compareAtPrice, currencyInfo.display.format)}</span>` : ''}
              <span class="product-price bw-product-card__current-price">${CurrencyManager.formatMoney(product.price, currencyInfo.display.format)}</span>
            </div>
          ` : ''}

          <div class="product-spacer"></div>

          ${variantSelectorHtml}

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
 * A CSS spinner fallback used when merchants have not uploaded a custom
 * loading GIF.
 */

/**
 * Creates and returns the default loading animation DOM element.
 * Styling lives in the widget CSS assets so this helper does not inject
 * runtime styles.
 *
 * @returns {HTMLDivElement} A spinner element
 */
function createDefaultLoadingAnimation() {
  const spinner = document.createElement('div');
  spinner.className = 'bundle-loading-overlay__spinner';
  spinner.setAttribute('role', 'status');
  spinner.setAttribute('aria-label', 'Loading');
  return spinner;
}


/**
 * Loading overlay lifecycle helpers.
 *
 * Keeps visual transition behavior independent from accessibility exposure, and
 * removes overlays even if the browser does not emit a transitionend event.
 */


const DEFAULT_HIDE_TIMEOUT_MS = 400;

function markLoadingOverlayVisible(overlay) {
  if (!overlay) return;
  overlay.setAttribute('aria-hidden', 'false');
  overlay.classList.add('is-visible');
}

function hideLoadingOverlayElement(overlay, timeoutMs = DEFAULT_HIDE_TIMEOUT_MS) {
  if (!overlay) return;

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    overlay.remove();
  };

  overlay.setAttribute('aria-hidden', 'true');
  overlay.classList.remove('is-visible');
  overlay.addEventListener('transitionend', finish, { once: true });

  const scheduler = typeof window !== 'undefined' && window.setTimeout
    ? window.setTimeout.bind(window)
    : setTimeout;
  scheduler(finish, timeoutMs);
}


const bundleLevelCssMethods = {
  getBundleLevelCssStyleId(bundleId) {
    const safeId = String(bundleId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '-');
    return `wpb-bundle-level-css-${safeId}`;
  },

  removeExistingBundleLevelCss() {
    document
      .querySelectorAll('style[data-wpb-bundle-level-css]')
      .forEach((style) => style.remove());
  },

  applyBundleLevelCss(bundle) {
    this.removeExistingBundleLevelCss();

    const css = typeof bundle?.bundleLevelCss === 'string'
      ? bundle.bundleLevelCss.trim()
      : '';

    if (!css) return;

    const style = document.createElement('style');
    style.id = this.getBundleLevelCssStyleId(bundle.id);
    style.type = 'text/css';
    style.dataset.wpbBundleLevelCss = String(bundle.id || '');
    style.textContent = css;
    document.head.appendChild(style);
  },
};



/**
 * VariantSelectorComponent
 *
 * Renders an inline variant selector on FPB product cards.
 * Replaces the <select> dropdown with:
 *   - A button group for the merchant-configured primary option dimension (max 4 + overflow)
 *   - Pill button(s) for remaining dimensions (tap to open dropdown panel)
 *
 * Usage:
 *   const html = VariantSelectorComponent.renderHtml(product, primaryOptionName);
 *   VariantSelectorComponent.attachListeners(cardEl, product, onVariantChange);
 *
 *   onVariantChange(newVariantId, oldVariantId) is called after product is mutated.
 */

class VariantSelectorComponent {

  /**
   * Render the variant selector HTML for a product card.
   *
   * @param {Object} product - Product with .variants[], .options[], .variantId
   * @param {string|null} primaryOptionName - Merchant-configured primary dimension (e.g. "Size")
   * @returns {string} HTML string, or '' if no selector needed
   */
  static renderHtml(product, primaryOptionName) {
    const variants = product.variants || [];
    const options = product.options || [];

    if (variants.length <= 1 || options.length === 0) return '';

    const primaryIdx = VariantSelectorComponent._primaryIdx(options, primaryOptionName);
    const primaryValues = VariantSelectorComponent._uniqueSelectableValues(variants, primaryIdx);
    if (primaryValues.length === 0) return '';

    const selectedVariant = variants.find(v => v.id === product.variantId);
    const selectedPrimaryVal = selectedVariant
      ? (selectedVariant[`option${primaryIdx}`] || primaryValues[0])
      : primaryValues[0];

    const MAX_VISIBLE = 4;
    const visible = primaryValues.slice(0, MAX_VISIBLE);
    const overflowCount = primaryValues.length - MAX_VISIBLE;

    const btnGroupHtml = visible.map(val => {
      const sel = val === selectedPrimaryVal;
      const cls = ['vs-btn', sel ? 'vs-btn--selected' : ''].filter(Boolean).join(' ');
      return `<button type="button" class="${cls}" data-primary-opt-idx="${primaryIdx}" data-primary-value="${VariantSelectorComponent._esc(val)}">${VariantSelectorComponent._esc(val)}</button>`;
    }).join('');

    const overflowHtml = overflowCount > 0
      ? `<button type="button" class="vs-btn vs-btn--overflow" data-overflow="1" data-primary-opt-idx="${primaryIdx}" data-all-values="${VariantSelectorComponent._esc(JSON.stringify(primaryValues))}">+${overflowCount}</button>`
      : '';

    // Secondary dimension pills (options beyond primary)
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

  static renderDropdownHtml(product, primaryOptionName, options = {}) {
    const variants = product.variants || [];
    const optionNames = product.options || [];

    if (variants.length <= 1 || optionNames.length === 0) return '';

    const primaryIdx = VariantSelectorComponent._primaryIdx(optionNames, primaryOptionName);
    const selectedLabel = options.placeholder || '';
    const productId = product.id || product.variantId;

    const optionHtml = variants.map((variant) => {
      const primaryValue = variant[`option${primaryIdx}`] || variant.title || '';
      const value = optionNames.length > 1 && variant.title ? variant.title : primaryValue;
      const imageUrl = VariantSelectorComponent._variantImageUrl(variant);
      const isAvailable = variant.available !== false;
      return `
        <li class="vs-option" data-variant-id="${VariantSelectorComponent._esc(variant.id)}" data-primary-value="${VariantSelectorComponent._esc(value)}" ${!isAvailable ? 'aria-disabled="true"' : ''}>
          ${imageUrl ? `<img class="vs-option-image" src="${VariantSelectorComponent._esc(imageUrl)}" alt="">` : ''}
          <span class="vs-option-label">${VariantSelectorComponent._esc(value)}</span>
        </li>
      `;
    }).join('');

    return `
      <div class="vs-wrapper vs-wrapper--standard" data-vs-product-id="${VariantSelectorComponent._esc(productId)}" data-vs-primary-idx="${primaryIdx}" data-vs-placeholder="${VariantSelectorComponent._esc(selectedLabel)}">
        <button type="button" class="vs-selected" aria-expanded="false">
          <span class="vs-selected-label">${VariantSelectorComponent._esc(selectedLabel)}</span>
          <span class="vs-selected-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20" focusable="false">
              <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </span>
        </button>
        <ul class="vs-options" hidden>
          ${optionHtml}
        </ul>
      </div>
    `;
  }

  static renderStandardMobileDrawerHtml(product, options = {}) {
    const variants = product.variants || [];
    const optionNames = product.options || [];
    const primaryIdx = options.primaryIdx || VariantSelectorComponent._primaryIdx(optionNames, options.primaryOptionName);
    const selectedVariant = variants.find(v => String(v.id) === String(product.variantId)) || variants[0] || product;
    const productImageUrl = VariantSelectorComponent._variantImageUrl(selectedVariant) || product.imageUrl || '';
    const productTitle = product.title || selectedVariant.productTitle || '';
    const placeholder = options.placeholder || '';
    const formatPrice = typeof options.formatPrice === 'function'
      ? options.formatPrice
      : (value) => VariantSelectorComponent.formatDrawerPrice(value);
    const productPrice = selectedVariant.price ?? product.price ?? 0;

    const optionHtml = variants.map((variant) => {
      const label = VariantSelectorComponent.getStandardVariantLabel(variant, optionNames, primaryIdx);
      const imageUrl = VariantSelectorComponent._variantImageUrl(variant) || productImageUrl;
      const isAvailable = variant.available !== false;
      const isSelected = String(variant.id) === String(selectedVariant.id);
      return `
        <button type="button" class="vs-mobile-option${isSelected ? ' vs-mobile-option--selected' : ''}" data-variant-id="${VariantSelectorComponent._esc(variant.id)}" aria-disabled="${isAvailable ? 'false' : 'true'}">
          ${imageUrl ? `<img class="vs-mobile-option-image" src="${VariantSelectorComponent._esc(imageUrl)}" alt="">` : '<span class="vs-mobile-option-image vs-mobile-option-image--empty" aria-hidden="true"></span>'}
          <span class="vs-mobile-option-label">${VariantSelectorComponent._esc(label)}</span>
          <span class="vs-mobile-option-price">${VariantSelectorComponent._esc(formatPrice(variant.price ?? 0))}</span>
        </button>
      `;
    }).join('');

    return `
      <div class="vs-mobile-drawer vs-mobile-drawer--standard" data-vs-mobile-drawer>
        <div class="vs-mobile-drawer-sheet" role="dialog" aria-modal="true">
          <button type="button" class="vs-mobile-drawer-close" data-vs-mobile-close aria-label="Close">
            <span aria-hidden="true">x</span>
          </button>
          <div class="vs-mobile-drawer-header">
            ${productImageUrl ? `<img class="vs-mobile-drawer-product-image" src="${VariantSelectorComponent._esc(productImageUrl)}" alt="">` : ''}
            <div class="vs-mobile-drawer-product-info">
              <p class="vs-mobile-drawer-product-title">${VariantSelectorComponent._esc(productTitle)}</p>
              <p class="vs-mobile-drawer-product-price">${VariantSelectorComponent._esc(formatPrice(productPrice))}</p>
            </div>
          </div>
          <div class="vs-mobile-drawer-body">
            <div class="vs-mobile-drawer-title">${VariantSelectorComponent._esc(placeholder)}</div>
            <div class="vs-mobile-options">
              ${optionHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners for the variant selector on a card element.
   * Must be called after the card HTML is in the DOM.
   *
   * @param {HTMLElement} cardEl - The .product-card element
   * @param {Object} product - Product object (mutated on variant change)
   * @param {Function} onVariantChange - Called with (newVariantId, oldVariantId) after mutation
   */
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

    cardEl.addEventListener('click', (e) => {
      const selected = e.target.closest('.vs-selected');
      if (selected) {
        e.stopPropagation();
        VariantSelectorComponent.handleStandardSelectorClick(selected, cardEl, product, onVariantChange);
        return;
      }

      const option = e.target.closest('.vs-option');
      if (!option || option.getAttribute('aria-disabled') === 'true') return;
      e.stopPropagation();
      VariantSelectorComponent._selectStandardOption(cardEl, product, option, onVariantChange);
    });
  }

  // ── Private helpers ────────────────────────────────────────────────────────

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

  static _uniqueSelectableValues(variants, optIdx) {
    return VariantSelectorComponent._uniqueValues(
      (variants || []).filter(VariantSelectorComponent._isSelectableVariant),
      optIdx
    );
  }

  static _isSelectableVariant(variant) {
    return variant?.available !== false;
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
      v[`option${primaryOptIdx}`] === primaryValue && VariantSelectorComponent._isSelectableVariant(v)
    );
    if (candidates.length === 0) return null;
    if (candidates.length === 1 || !current) return candidates[0];
    // Prefer candidate that preserves other option values
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

    // Update button group visual state
    const wrapper = cardEl.querySelector('.vs-wrapper');
    if (wrapper) {
      wrapper.querySelectorAll('.vs-btn:not(.vs-btn--overflow)').forEach(b => {
        b.classList.toggle('vs-btn--selected', b.dataset.primaryValue === val);
      });
      // Update secondary pills
      wrapper.querySelectorAll('.vs-secondary-pill').forEach(pill => {
        const optIdx = parseInt(pill.dataset.optIdx, 10);
        const label = pill.querySelector('.vs-secondary-label');
        const optName = label ? label.textContent.replace(':', '').trim() : `Option ${optIdx}`;
        const newVal = newVariant[`option${optIdx}`] || '';
        pill.innerHTML = `<span class="vs-secondary-label">${VariantSelectorComponent._esc(optName)}:</span> <strong>${VariantSelectorComponent._esc(newVal)}</strong> <span class="vs-chevron">&#9662;</span>`;
      });
    }

    // Mutate product
    product.variantId = newVariant.id;
    product.price = newVariant.price;
    product.compareAtPrice = newVariant.compareAtPrice || null;
    product.imageUrl = VariantSelectorComponent._variantImageUrl(newVariant) || product.imageUrl;
    product.available = newVariant.available === true;
    product.quantityAvailable = typeof newVariant.quantityAvailable === 'number' ? newVariant.quantityAvailable : null;
    product.currentlyNotInStock = newVariant.currentlyNotInStock === true;

    onVariantChange(newVariant.id, oldVariantId);
  }

  static _openOverflowPanel(overflowBtn, cardEl, product, onVariantChange) {
    VariantSelectorComponent._closePanel(cardEl);

    const primaryOptIdx = parseInt(overflowBtn.dataset.primaryOptIdx, 10);
    let allValues;
    try { allValues = JSON.parse(overflowBtn.dataset.allValues); }
    catch (_) { allValues = VariantSelectorComponent._uniqueSelectableValues(product.variants || [], primaryOptIdx); }

    const currentVariant = (product.variants || []).find(v => v.id === product.variantId);
    const currentPrimary = currentVariant ? currentVariant[`option${primaryOptIdx}`] : null;

    const panel = VariantSelectorComponent._makePanel();

    allValues.forEach(val => {
      const sel = val === currentPrimary;
      const tile = VariantSelectorComponent._makeTile(val, sel, false);
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
    const currentVariant = (product.variants || []).find(v => v.id === product.variantId);
    const currentVal = currentVariant ? currentVariant[`option${optIdx}`] : null;

    // Determine primary selection to preserve it when picking a secondary value
    const wrapper = cardEl.querySelector('.vs-wrapper');
    const primaryBtn = wrapper?.querySelector('.vs-btn--selected');
    const primaryOptIdx = primaryBtn ? parseInt(primaryBtn.dataset.primaryOptIdx, 10) : 1;
    const currentPrimary = currentVariant ? currentVariant[`option${primaryOptIdx}`] : null;
    const values = VariantSelectorComponent._uniqueValues((product.variants || []).filter(v => {
      const matchesPrimary = !currentPrimary || v[`option${primaryOptIdx}`] === currentPrimary;
      return matchesPrimary && VariantSelectorComponent._isSelectableVariant(v);
    }), optIdx);

    const panel = VariantSelectorComponent._makePanel('vs-panel--secondary');

    values.forEach(val => {
      const candidate = (product.variants || []).find(v => {
        const matchesPrimary = !currentPrimary || v[`option${primaryOptIdx}`] === currentPrimary;
        return matchesPrimary && v[`option${optIdx}`] === val && VariantSelectorComponent._isSelectableVariant(v);
      });
      const sel = val === currentVal;
      const tile = VariantSelectorComponent._makeTile(val, sel, !candidate);

      tile.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!candidate) return;
        const oldVariantId = product.variantId;
        product.variantId = candidate.id;
        product.price = candidate.price;
        product.compareAtPrice = candidate.compareAtPrice || null;
        product.imageUrl = VariantSelectorComponent._variantImageUrl(candidate) || product.imageUrl;
        product.available = candidate.available === true;
        product.quantityAvailable = typeof candidate.quantityAvailable === 'number' ? candidate.quantityAvailable : null;
        product.currentlyNotInStock = candidate.currentlyNotInStock === true;
        // Update the pill text
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

  static handleStandardSelectorClick(selected, cardEl, product, onVariantChange) {
    if (VariantSelectorComponent.isMobileViewport()) {
      VariantSelectorComponent.openStandardMobileDrawer(selected, cardEl, product, onVariantChange);
      return;
    }

    VariantSelectorComponent._toggleStandardDropdown(selected, cardEl);
  }

  static isMobileViewport() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(max-width: 767px)').matches || window.innerWidth <= 767;
  }

  static openStandardMobileDrawer(selected, cardEl, product, onVariantChange) {
    const wrapper = selected.closest('.vs-wrapper--standard');
    if (!wrapper || typeof document === 'undefined') return;

    VariantSelectorComponent.closeStandardMobileDrawer();

    const panel = wrapper.querySelector('.vs-options');
    const primaryIdx = parseInt(wrapper.dataset.vsPrimaryIdx || '1', 10);
    const placeholder = wrapper.dataset.vsPlaceholder || selected.querySelector('.vs-selected-label')?.textContent?.trim() || '';

    document.body.insertAdjacentHTML('beforeend', VariantSelectorComponent.renderStandardMobileDrawerHtml(product, {
      placeholder,
      primaryIdx,
    }));
    selected.setAttribute('aria-expanded', 'true');

    const drawer = document.body.querySelector('[data-vs-mobile-drawer]');
    if (!drawer) return;

    const close = () => {
      VariantSelectorComponent.closeStandardMobileDrawer();
      selected.setAttribute('aria-expanded', 'false');
    };

    drawer.addEventListener('click', (event) => {
      const closeTarget = event.target.closest('[data-vs-mobile-close]');
      if (closeTarget || event.target === drawer) {
        event.stopPropagation();
        close();
        return;
      }

      const optionButton = event.target.closest('.vs-mobile-option');
      if (!optionButton) return;

      event.stopPropagation();
      if (optionButton.getAttribute('aria-disabled') === 'true') return;

      const sourceOption = Array.from(panel?.querySelectorAll('.vs-option') || [])
        .find(option => String(option.dataset.variantId) === String(optionButton.dataset.variantId));
      if (sourceOption) {
        VariantSelectorComponent._selectStandardOption(cardEl, product, sourceOption, onVariantChange);
      }
      close();
    });
  }

  static closeStandardMobileDrawer() {
    if (typeof document === 'undefined') return;
    document.querySelector('[data-vs-mobile-drawer]')?.remove();
  }

  static getStandardVariantLabel(variant, optionNames, primaryIdx) {
    const primaryValue = variant[`option${primaryIdx}`] || variant.title || '';
    return optionNames.length > 1 && variant.title ? variant.title : primaryValue;
  }

  static formatDrawerPrice(value) {
    if (typeof CurrencyManager !== 'undefined') {
      return CurrencyManager.convertAndFormat(value || 0, CurrencyManager.getCurrencyInfo());
    }

    return String(value || 0);
  }

  static _toggleStandardDropdown(selected, cardEl) {
    const wrapper = selected.closest('.vs-wrapper--standard');
    const panel = wrapper?.querySelector('.vs-options');
    if (!wrapper || !panel) return;

    const willOpen = panel.hidden === true;
    cardEl.querySelectorAll('.vs-wrapper--standard .vs-options').forEach((otherPanel) => {
      if (otherPanel !== panel) {
        otherPanel.hidden = true;
        otherPanel.closest('.vs-wrapper--standard')?.querySelector('.vs-selected')?.setAttribute('aria-expanded', 'false');
      }
    });

    panel.hidden = !willOpen;
    selected.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    if (willOpen) {
      VariantSelectorComponent._bindStandardOutsideClose(panel, selected);
    }
  }

  static _selectStandardOption(cardEl, product, option, onVariantChange) {
    const wrapper = option.closest('.vs-wrapper--standard');
    const selected = wrapper?.querySelector('.vs-selected');
    const panel = wrapper?.querySelector('.vs-options');
    const variantId = option.dataset.variantId;
    const candidate = (product.variants || []).find(v => String(v.id) === String(variantId));
    if (!candidate) return;

    const oldVariantId = product.variantId;
    product.variantId = candidate.id;
    product.price = candidate.price;
    product.compareAtPrice = candidate.compareAtPrice || null;
    product.imageUrl = VariantSelectorComponent._variantImageUrl(candidate) || product.imageUrl;
    product.available = candidate.available === true;
    product.quantityAvailable = typeof candidate.quantityAvailable === 'number' ? candidate.quantityAvailable : null;
    product.currentlyNotInStock = candidate.currentlyNotInStock === true;

    if (selected) {
      const label = selected.querySelector('.vs-selected-label');
      if (label) label.textContent = option.dataset.primaryValue || option.textContent.trim();
      selected.setAttribute('aria-expanded', 'false');
    }
    if (panel) panel.hidden = true;

    onVariantChange(candidate.id, oldVariantId);
  }

  static _bindStandardOutsideClose(panel, selected) {
    setTimeout(() => {
      const close = (e) => {
        if (!panel.contains(e.target) && !selected.contains(e.target)) {
          panel.hidden = true;
          selected.setAttribute('aria-expanded', 'false');
          document.removeEventListener('click', close);
        }
      };
      document.addEventListener('click', close);
    }, 0);
  }

  static _variantImageUrl(variant) {
    return variant?.image?.src
      || variant?.image?.url
      || (typeof variant?.image === 'string' ? variant.image : null)
      || variant?.imageUrl
      || null;
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
 * Full-page bundle preset resolution.
 *
 * Pure helpers used by the FPB widget to derive the data attributes that
 * drive preset-scoped CSS rules in bundle-widget-full-page.css. The CSS
 * rules key on `data-fpb-design-preset` and `data-fpb-template`; this
 * module turns the bundle config into those attribute values.
 *
 * Exported as a single `FullPagePreset` object so that:
 *  - The widget bundle (IIFE) can access it as a local variable in scope
 *  - Node.js test environments can require() it via module.exports
 */


const FullPagePreset = (function () {
  const SUPPORTED_PRESETS = ['STANDARD', 'CLASSIC', 'COMPACT', 'HORIZONTAL'];

  /**
   * Normalize a raw preset id to one of the four supported values.
   * STANDARD is the canonical Standard preset and the fallback value.
   */
  function resolvePresetAttr(bundle) {
    const raw =
      (bundle && (bundle.bundleDesignPresetId || bundle.bundleDesignPreset || bundle.templateId)) || '';
    if (typeof raw !== 'string') return 'STANDARD';
    const upper = raw.trim().toUpperCase();
    if (SUPPORTED_PRESETS.includes(upper)) return upper;
    return 'STANDARD';
  }

  function resolveTemplateAttr(bundle) {
    const raw = bundle && bundle.bundleDesignTemplate;
    if (typeof raw !== 'string' || raw.trim() === '') return 'FBP_SIDE_FOOTER';
    return raw.trim().toUpperCase();
  }

  /**
   * Apply the preset + template data attributes to the widget container.
   * Safe to call repeatedly (idempotent).
   */
  function markContainer(container, bundle) {
    if (!container || !container.dataset) return;
    container.dataset.fpbDesignPreset = resolvePresetAttr(bundle);
    container.dataset.fpbTemplate = resolveTemplateAttr(bundle);
  }

  function shouldUseReferenceStepBarTimeline({ layout, presetId } = {}) {
    const normalizedLayout = typeof layout === 'string' ? layout.trim().toLowerCase() : '';
    if (normalizedLayout !== 'footer_side') return false;

    const preset = resolvePresetAttr({ bundleDesignPresetId: presetId });
    return SUPPORTED_PRESETS.includes(preset);
  }

  return {
    resolvePresetAttr,
    resolveTemplateAttr,
    markContainer,
    shouldUseReferenceStepBarTimeline,
  };
}());

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FullPagePreset;
}



function applyMethodMixins(target, ...sources) {
  sources.forEach((source) => {
    if (!source) return;
    Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
  });
  return target;
}


  // ============================================================================
  // SDK MODULES (state, config-loader, events, cart, validate-bundle, get-display-price, debug)
  // ============================================================================


function createState() {
  return {
    isReady: false,
    bundleId: null,
    offerId: null,
    bundleName: null,
    bundleData: null,
    steps: [],
    stepProductData: [],
    selections: {},
    discountConfiguration: null,
  };
}

function _findStep(state, stepId) {
  return state.steps.find(function (s) { return s.id === stepId; }) || null;
}

function addItem(state, stepId, variantId, qty, ConditionValidator) {
  if (!state.isReady) {
    return { success: false, error: 'WolfpackBundles SDK not ready yet.' };
  }
  const step = _findStep(state, stepId);
  if (!step) {
    return { success: false, error: 'stepId "' + stepId + '" not found in bundle.' };
  }

  const vid = String(variantId);
  const currentSelections = state.selections[stepId] || {};
  const check = ConditionValidator.canUpdateQuantity(step, currentSelections, vid, (currentSelections[vid] || 0) + qty);
  if (!check.allowed) {
    const errorMessage = typeof ConditionValidator._formatStepLimitToast === 'function'
      ? ConditionValidator._formatStepLimitToast(check.limitText, step.conditionValue)
      : 'This step allows ' + check.limitText + ' product' + (step.conditionValue !== 1 ? 's' : '') + '.';
    return { success: false, error: errorMessage };
  }

  if (!state.selections[stepId]) state.selections[stepId] = {};
  state.selections[stepId][vid] = (state.selections[stepId][vid] || 0) + qty;
  return { success: true };
}

function removeItem(state, stepId, variantId, qty) {
  if (!state.isReady) {
    return { success: false, error: 'WolfpackBundles SDK not ready yet.' };
  }
  const step = _findStep(state, stepId);
  if (!step) {
    return { success: false, error: 'stepId "' + stepId + '" not found in bundle.' };
  }

  const vid = String(variantId);
  if (!state.selections[stepId]) state.selections[stepId] = {};
  const current = state.selections[stepId][vid] || 0;
  const next = Math.max(0, current - qty);
  if (next === 0) {
    delete state.selections[stepId][vid];
  } else {
    state.selections[stepId][vid] = next;
  }
  return { success: true };
}

function clearStep(state, stepId) {
  if (!state.isReady) {
    return { success: false, error: 'WolfpackBundles SDK not ready yet.' };
  }
  const step = _findStep(state, stepId);
  if (!step) {
    return { success: false, error: 'stepId "' + stepId + '" not found in bundle.' };
  }
  state.selections[stepId] = {};
  return { success: true };
}




function loadBundleConfig(container, state) {
  var configValue = container && container.dataset && container.dataset.bundleConfig;

  if (!configValue || configValue.trim() === '' || configValue === 'null' || configValue === 'undefined') {
    return { success: false, error: 'No bundle config found on container. Ensure data-bundle-config attribute is set.' };
  }

  var bundleData;
  try {
    bundleData = JSON.parse(configValue);
  } catch (e) {
    return { success: false, error: 'data-bundle-config is not valid JSON: ' + e.message };
  }

  if (!bundleData || typeof bundleData !== 'object' || !bundleData.id) {
    return { success: false, error: 'data-bundle-config is missing required "id" field.' };
  }

  state.bundleId = bundleData.id;
  state.offerId = bundleData.offerId || bundleData.bundleOfferId || bundleData.id;
  state.bundleName = bundleData.name || null;
  state.bundleData = bundleData;
  state.steps = Array.isArray(bundleData.steps) ? bundleData.steps : [];
  state.discountConfiguration = bundleData.pricing || null;

  // Initialise selections map for every step
  state.steps.forEach(function (step) {
    if (step.id && !state.selections[step.id]) {
      state.selections[step.id] = {};
    }
  });

  // stepProductData is populated lazily from bundle step products
  // (same shape as widget's stepProductData: array of arrays, indexed by step position)
  state.stepProductData = state.steps.map(function (step) {
    return Array.isArray(step.products) ? step.products : [];
  });

  state.isReady = true;
  return { success: true };
}




function emit(eventName, detail) {
  try {
    window.dispatchEvent(new CustomEvent(eventName, { detail: detail, bubbles: false }));
  } catch (e) {
    // Non-critical: event dispatch must never break SDK operations.
  }
}




function _generateBundleInstanceId(bundleId) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return bundleId + '_' + crypto.randomUUID();
  }
  return bundleId + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
}

function _generateBundleSessionKey() {
  var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var keyLength = 12;
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    var bytes = new Uint8Array(keyLength);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, function (byte) {
      return alphabet[byte % alphabet.length];
    }).join('');
  }

  return Math.random().toString(36).slice(2, 2 + keyLength).toUpperCase().padEnd(keyLength, '0');
}

function _resolveProductPageOfferId(state) {
  var rawOfferId = state.offerId || state.bundleOfferId || state.bundleId || 'UNKNOWN';
  var offerId = String(rawOfferId);
  return offerId.indexOf('MIX-') === 0 ? offerId : 'MIX-' + offerId;
}

function _formatCartAmount(cents, state) {
  if (typeof state.formatMoney === 'function') return state.formatMoney(cents);
  return String(cents);
}

function _buildCartLineSourceProperties(state, selectedLines) {
  var retailCents = selectedLines.reduce(function (sum, line) {
    if (line.step && line.step.isFreeGift) return sum;
    return sum + ((Number(line.product.price) || 0) * line.quantity);
  }, 0);
  var discountCents = Math.max(0, Number(state.discountAmount || 0));
  var discountPercentage = Number(state.discountPercentage || 0);
  if (!discountPercentage && retailCents > 0 && discountCents > 0) {
    discountPercentage = Math.round((discountCents / retailCents) * 100);
  }

  var displayProperties = {
    box: '1',
    items: selectedLines.map(function (line) {
      return line.quantity + ' x ' + (line.product.title || line.product.id);
    }).join(', '),
    retailPrice: _formatCartAmount(retailCents, state),
  };

  if (discountCents > 0) {
    var amount = _formatCartAmount(discountCents, state);
    var percentage = Math.round(discountPercentage) + '%';
    displayProperties.youSave = {
      amount: amount,
      percentage: percentage,
      amountPercentage: amount + ' (' + percentage + ')',
    };
  }

  return {
    '_bundle_display_properties': JSON.stringify(displayProperties),
  };
}

function buildCartItems(state) {
  var bundleInstanceId = _generateBundleInstanceId(state.bundleId);
  var offerId = _resolveProductPageOfferId(state);
  var sessionKey = _generateBundleSessionKey();
  var itemNumber = 0;
  var items = [];
  var unavailable = [];
  var selectedLines = [];

  state.steps.forEach(function (step, stepIndex) {
    var stepSelections = state.selections[step.id] || {};
    var productsInStep = (state.stepProductData && state.stepProductData[stepIndex]) || [];

    Object.keys(stepSelections).forEach(function (variantId) {
      var qty = stepSelections[variantId];
      if (!qty || qty <= 0) return;

      var product = productsInStep.find(function (p) {
        return String(p.variantId || p.id) === String(variantId);
      });
      if (!product) return;

      if (product.available === false) {
        unavailable.push(product.title || variantId);
        return;
      }

      itemNumber += 1;
      var properties = {
        'Box': String(itemNumber),
        '_bundleName': state.bundleName || '',
        '_wolfpackProductBundle:OfferId': offerId + '_' + sessionKey + '_' + itemNumber,
        '_wolfpackProductBundle:prodQty': String(qty),
      };
      if (step.isFreeGift) properties['_bundle_step_type'] = 'free_gift';
      if (step.isDefault) properties['_bundle_step_type'] = 'default';

      items.push({
        id: parseInt(variantId, 10),
        quantity: qty,
        properties: properties,
      });
      selectedLines.push({ product: product, quantity: qty, step: step });
    });
  });

  if (unavailable.length > 0) {
    throw new Error(
      'The following product' + (unavailable.length > 1 ? 's are' : ' is') +
      ' currently unavailable: ' + unavailable.join(', ') + '.'
    );
  }

  var sourceProperties = _buildCartLineSourceProperties(state, selectedLines);
  items.forEach(function (item) {
    Object.assign(item.properties, sourceProperties);
  });

  return {
    items: items,
    bundleInstanceId: bundleInstanceId,
    offerId: offerId,
    sessionKey: sessionKey,
    bundleDetailsKey: offerId + '_' + sessionKey,
    sourceProperties: sourceProperties,
  };
}

function buildProductPageCartFormData(items, runtimeToken) {
  var formData = new FormData();
  items.forEach(function (item, index) {
    formData.append('items[' + index + '][id]', String(item.id));
    formData.append('items[' + index + '][quantity]', String(item.quantity));
    Object.keys(item.properties || {}).forEach(function (key) {
      var value = item.properties[key];
      if (value === null || typeof value === 'undefined') return;
      formData.append('items[' + index + '][properties][' + key + ']', String(value));
    });
    if (runtimeToken) {
      formData.append('items[' + index + '][properties][_wolfpack_bundle_runtime]', String(runtimeToken));
    }
  });
  return formData;
}

function buildBundleDetailsDisplayProperties(sourceProperties) {
  var displayProperties = {};
  var raw = sourceProperties && sourceProperties._bundle_display_properties;

  if (raw) {
    try {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.box) displayProperties.Box = String(parsed.box);
      if (parsed && parsed.items) displayProperties.Items = String(parsed.items);
      if (parsed && parsed.retailPrice) displayProperties['Retail Price'] = String(parsed.retailPrice);
      if (parsed && parsed.youSave && parsed.youSave.amountPercentage) {
        displayProperties['You Save'] = String(parsed.youSave.amountPercentage);
      }
    } catch (_) {}
  }

  ['Box', 'Items', 'Retail Price', 'You Save'].forEach(function (key) {
    if (sourceProperties && sourceProperties[key] && !displayProperties[key]) {
      displayProperties[key] = String(sourceProperties[key]);
    }
  });

  return displayProperties;
}

function getBundleDetailsCartToken() {
  return fetch('/cart.js', { credentials: 'same-origin' })
    .then(function (response) {
      if (!response.ok) return null;
      return response.json().catch(function () { return null; });
    })
    .then(function (cart) {
      return (cart && cart.token) || null;
    })
    .catch(function () { return null; });
}

function syncBundleDetailsCartMetafield(bundleDetailsKey, sourceProperties) {
  var displayProperties = buildBundleDetailsDisplayProperties(sourceProperties);
  if (!bundleDetailsKey || Object.keys(displayProperties).length === 0) return Promise.resolve();

  return getBundleDetailsCartToken()
    .then(function (cartToken) {
      if (!cartToken) return null;
      return fetch('/apps/product-bundles/api/cart-bundle-details', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartToken: cartToken,
          bundleDetailsKey: bundleDetailsKey,
          displayProperties: displayProperties,
        }),
      });
    })
    .then(function (response) {
      if (!response || !response.ok) return null;
      return response.json().catch(function () { return null; });
    })
    .then(function (data) {
      if (data && data.ok !== true) {
        console.warn('[Wolfpack Bundles] Failed to sync bundle_details cart metafield', data.error || data);
      }
    })
    .catch(function (error) {
      console.warn('[Wolfpack Bundles] Failed to sync bundle_details cart metafield', error);
    });
}

function requestCartTransformRuntimeToken(state, cartResult) {
  var components = cartResult.items.map(function (item) {
    return { variantId: item.id, quantity: item.quantity };
  });

  return fetch('/apps/product-bundles/api/cart-transform-runtime-token', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bundleId: state.bundleId,
      bundleType: 'product_page',
      offerGroupId: cartResult.offerId + '_' + cartResult.sessionKey,
      components: components,
      addons: [],
    }),
  })
    .then(function (response) {
      return response.json().catch(function () { return null; }).then(function (data) {
        if (!response.ok || !data || !data.token) {
          throw new Error((data && data.error) || 'Unable to validate bundle selection');
        }
        return data.token;
      });
    });
}

function addBundleToCart(state, validateBundleFn, emitFn) {
  var validation = validateBundleFn();
  if (!validation.valid) {
    emitFn('wbp:cart-failed', { error: 'Bundle validation failed. Complete all required steps.' });
    return Promise.resolve();
  }

  var cartResult;
  try {
    cartResult = buildCartItems(state);
  } catch (e) {
    emitFn('wbp:cart-failed', { error: e.message });
    return Promise.resolve();
  }

  return requestCartTransformRuntimeToken(state, cartResult)
    .then(function (runtimeToken) {
      return fetch('/cart/add', {
        method: 'POST',
        body: buildProductPageCartFormData(cartResult.items, runtimeToken),
      });
    })
    .then(function (response) {
      return response.text().then(function (text) {
        if (!response.ok) {
          var msg = 'Cart add failed (' + response.status + ')';
          try { msg = JSON.parse(text).message || msg; } catch (_) {}
          throw new Error(msg);
        }
        return text;
      });
    })
    .then(function () {
      return syncBundleDetailsCartMetafield(cartResult.bundleDetailsKey, cartResult.sourceProperties);
    })
    .then(function () {
      emitFn('wbp:cart-success', { bundleId: state.bundleId });
    })
    .catch(function (err) {
      emitFn('wbp:cart-failed', { error: err.message });
    });
}




function _stepIsCategoryRuleMode(step) {
  var categories = Array.isArray(step && step.categories) ? step.categories : [];
  for (var i = 0; i < categories.length; i++) {
    var c = categories[i];
    if (c && Array.isArray(c.conditions) && c.conditions.length > 0) return true;
  }
  return false;
}

function validateStep(stepId, state, ConditionValidator) {
  var step = state.steps.find(function (s) { return s.id === stepId; });
  if (!step) {
    return { valid: false, message: 'stepId "' + stepId + '" not found in bundle.' };
  }
  var selections = state.selections[stepId] || {};
  var valid = ConditionValidator.isStepConditionSatisfied(step, selections);
  if (valid) return { valid: true, message: '' };

  // Category-rule mode: surface a generic message. Per-category specifics
  // are a follow-up; today the widget only needs to know the step is
  // unmet so the ATC can be blocked.
  if (_stepIsCategoryRuleMode(step)) {
    return { valid: false, message: 'Selection requirements not met for this step.' };
  }

  var condVal = Number(step.conditionValue);
  if (!Number.isFinite(condVal) || condVal < 1) {
    condVal = 1;
  }
  var op = step.conditionOperator || 'equal_to';
  var opLabels = {
    'equal_to': 'exactly ' + condVal,
    'greater_than': 'more than ' + condVal,
    'less_than': 'less than ' + condVal,
    'greater_than_or_equal_to': 'at least ' + condVal,
    'less_than_or_equal_to': 'at most ' + condVal,
  };
  var label = opLabels[op] || String(condVal);
  return { valid: false, message: 'This step requires ' + label + ' item' + (condVal !== 1 ? 's' : '') + '.' };
}

function validateBundle(state, ConditionValidator) {
  var errors = {};
  state.steps.forEach(function (step) {
    if (step.isFreeGift || step.isDefault) return;
    var result = validateStep(step.id, state, ConditionValidator);
    if (!result.valid) {
      errors[step.id] = result.message;
    }
  });
  return { valid: Object.keys(errors).length === 0, errors: errors };
}




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
    totals.totalQuantity,
    totals.unitPrices
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




var _debugEnabled = false;

function isDebugMode() {
  try {
    return window.location.search.indexOf('wbp_debug=true') !== -1;
  } catch (_) {
    return false;
  }
}

function initDebugMode(state, sdk) {
  if (!isDebugMode()) return;
  _debugEnabled = true;

  console.group('[WolfpackBundles SDK] Debug mode active (?wbp_debug=true)');
  console.log('State:', state);
  console.log('SDK:', sdk);
  console.groupEnd();

  var events = [
    'wbp:ready', 'wbp:item-added', 'wbp:item-removed',
    'wbp:step-cleared', 'wbp:cart-success', 'wbp:cart-failed',
  ];
  events.forEach(function (name) {
    window.addEventListener(name, function (e) {
      console.log('[WolfpackBundles] Event:', name, e.detail);
    });
  });
}

function debugLog() {
  if (!_debugEnabled) return;
  console.log.apply(console, ['[WolfpackBundles]'].concat(Array.prototype.slice.call(arguments)));
}



  // ============================================================================
  // SDK ENTRY POINT
  // ============================================================================



  function _findContainer() {
    return document.querySelector('[data-sdk-mode="true"]') || null;
  }

  function _bootstrap() {
    var state = createState();
    var container = _findContainer();

    if (!container) {
      if (isDebugMode()) {
        console.warn('[WolfpackBundles] No [data-sdk-mode="true"] container found. SDK exposed as no-op for debugging.');
        window.WolfpackBundles = _buildNoOp(state);
      }
      return;
    }

    var loadResult = loadBundleConfig(container, state);
    if (!loadResult.success) {
      if (isDebugMode()) {
        console.error('[WolfpackBundles] Config load failed:', loadResult.error);
      }
      return;
    }

    var sdk = _buildSdk(state);
    window.WolfpackBundles = sdk;

    initDebugMode(state, sdk);
    emit('wbp:ready', { bundleId: state.bundleId, steps: state.steps });
  }

  function _buildSdk(state) {
    return {
      get state() {
        return {
          isReady: state.isReady,
          bundleId: state.bundleId,
          bundleName: state.bundleName,
          steps: state.steps,
          selections: state.selections,
          discountConfiguration: state.discountConfiguration,
        };
      },

      addItem: function (stepId, variantId, qty) {
        var result = addItem(state, stepId, variantId, qty, ConditionValidator);
        if (result.success) {
          emit('wbp:item-added', { stepId: stepId, variantId: String(variantId), qty: qty, selections: state.selections });
          debugLog('addItem', stepId, variantId, qty, '→ selections:', state.selections);
        }
        return result;
      },

      removeItem: function (stepId, variantId, qty) {
        var result = removeItem(state, stepId, variantId, qty);
        if (result.success) {
          emit('wbp:item-removed', { stepId: stepId, variantId: String(variantId), qty: qty, selections: state.selections });
          debugLog('removeItem', stepId, variantId, qty, '→ selections:', state.selections);
        }
        return result;
      },

      clearStep: function (stepId) {
        var result = clearStep(state, stepId);
        if (result.success) {
          emit('wbp:step-cleared', { stepId: stepId });
          debugLog('clearStep', stepId);
        }
        return result;
      },

      addBundleToCart: function () {
        var self = this;
        return addBundleToCart(state, function () { return self.validateBundle(); }, emit);
      },

      validateStep: function (stepId) {
        return validateStep(stepId, state, ConditionValidator);
      },

      validateBundle: function () {
        return validateBundle(state, ConditionValidator);
      },

      getDisplayPrice: function () {
        return getDisplayPrice(state, PricingCalculator, CurrencyManager);
      },
    };
  }

  function _buildNoOp(state) {
    var noop = function () { return { success: false, error: 'SDK not initialized (no bundle found).' }; };
    return {
      get state() { return { isReady: false, bundleId: null, bundleName: null, steps: [], selections: {}, discountConfiguration: null }; },
      addItem: noop, removeItem: noop, clearStep: noop,
      addBundleToCart: function () { return Promise.resolve(); },
      validateStep: function () { return { valid: false, message: 'SDK not initialized.' }; },
      validateBundle: function () { return { valid: false, errors: {} }; },
      getDisplayPrice: function () { return { original: 0, discounted: 0, savings: 0, savingsPercent: 0, formatted: '' }; },
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _bootstrap);
  } else {
    _bootstrap();
  }



})(window);
