/*!
 * Wolfpack Bundle Widget — Product Page
 * Version : 5.0.181
 * Built   : 2026-07-14
 *
 * Cache note: Shopify CDN cache is busted automatically by shopify app deploy.
 * After deploying, allow 2-10 minutes for propagation before testing.
 * Verify live version: console.log(window.__BUNDLE_WIDGET_VERSION__)
 */
window.__BUNDLE_WIDGET_VERSION__ = '5.0.181';
(function() {
  'use strict';

const ConditionValidator = (function () {

  const OPERATORS = {
    EQUAL_TO:                'equal_to',
    GREATER_THAN_OR_EQUAL_TO: 'greater_than_or_equal_to',
    LESS_THAN_OR_EQUAL_TO:   'less_than_or_equal_to',
  };

  function calculateStepTotalAfterUpdate(currentSelections, targetProductId, newQuantity, options = {}) {
    const selections = currentSelections || {};
    const conditionType = _normalizeConditionType(options.conditionType);
    const targetAmountPerUnit = Number(options.targetAmountPerUnit);
    const targetWeightPerUnit = Number(options.targetWeightPerUnit);
    const normalizedQuantity = Number(newQuantity) || 0;

    let total = 0;

    for (const pid of Object.keys(selections)) {
      if (pid !== targetProductId) {
        total += _getSelectionValueByConditionType(selections[pid], conditionType);
      }
    }

    if (conditionType === 'amount') {
      const perUnitAmount = Number.isFinite(targetAmountPerUnit) ? targetAmountPerUnit : 0;
      total += perUnitAmount * normalizedQuantity;
    } else if (conditionType === 'weight') {
      const perUnitWeight = Number.isFinite(targetWeightPerUnit) ? targetWeightPerUnit : 0;
      total += perUnitWeight * normalizedQuantity;
    } else {
      total += normalizedQuantity;
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
  function canUpdateQuantity(step, currentSelections, targetProductId, newQuantity, targetValues) {

    if (!step || !step.conditionType || !step.conditionOperator || !_isPositiveConditionValue(step.conditionValue)) {
      return { allowed: true, limitText: null };
    }

    const conditionType = _normalizeConditionType(step.conditionType);
    const targetMetric = _getTargetMetric(targetValues);
    const required = _normalizeConditionRuleValue(conditionType, step.conditionValue);

    const totalAfter = calculateStepTotalAfterUpdate(
      currentSelections,
      targetProductId,
      newQuantity,
      {
        conditionType,
        targetAmountPerUnit: targetMetric.amount,
        targetWeightPerUnit: targetMetric.weight,
      },
    );

    const primary = _evaluateCanUpdate(step.conditionOperator, required, totalAfter);
    if (!primary.allowed) return primary;

    if (step.conditionOperator2 != null && _isPositiveConditionValue(step.conditionValue2)) {
      const secondary = _evaluateCanUpdate(
        step.conditionOperator2,
        _normalizeConditionRuleValue(conditionType, step.conditionValue2),
        totalAfter,
      );
      if (!secondary.allowed) return secondary;
    }

    return { allowed: true, limitText: null };
  }

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

  function _normalizeConditionType(conditionType) {
    if (conditionType === 'amount') return 'amount';
    if (conditionType === 'weight') return 'weight';
    return 'quantity';
  }

  function _normalizeConditionRuleValue(conditionType, value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return numeric;
    return _normalizeConditionType(conditionType) === 'amount' ? numeric * 100 : numeric;
  }

  function _getSelectionValueByConditionType(selection, conditionType) {
    if (conditionType === 'amount') return _getSelectionAmount(selection);
    if (conditionType === 'weight') return _getSelectionWeight(selection);
    return _getSelectionQuantity(selection);
  }

  function _getTargetMetric(values) {
    const amount = Number(values && values.amount);
    const weight = Number(values && values.weight);
    return {
      amount: Number.isFinite(amount) ? amount : 0,
      weight: Number.isFinite(weight) ? weight : 0,
    };
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

  function isStepConditionSatisfied(step, currentSelections) {
    if (!step) return true;
    const conditionType = _normalizeConditionType(step.conditionType);

    if (_isCategoryRuleMode(step)) {
      const categories = Array.isArray(step.categories) ? step.categories : [];
      for (const cat of categories) {
        if (!evaluateCategoryRules(cat, currentSelections)) return false;
      }
      return true;
    }

    const selections = currentSelections || {};
    let total = 0;
    for (const value of Object.values(selections)) {
      total += _getSelectionValueByConditionType(value, conditionType);
    }
    const normalizedConditionValue = _normalizeConditionRuleValue(conditionType, step.conditionValue);
    const normalizedConditionValue2 = _normalizeConditionRuleValue(conditionType, step.conditionValue2);

    if (!step.conditionType || !step.conditionOperator || !_isPositiveConditionValue(step.conditionValue)) {
      const min = step.minQuantity != null ? Number(step.minQuantity) : 1;
      return total >= min;
    }

    if (!_evaluateSatisfied(step.conditionOperator, normalizedConditionValue, total)) return false;

    if (step.conditionOperator2 != null && _isPositiveConditionValue(step.conditionValue2)) {
      return _evaluateSatisfied(step.conditionOperator2, normalizedConditionValue2, total);
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

  function _evaluateCanUpdate(operator, required, totalAfter) {
    let allowed;
    switch (operator) {
      case OPERATORS.EQUAL_TO:

        allowed = totalAfter <= required;
        break;
      case OPERATORS.LESS_THAN_OR_EQUAL_TO:
        allowed = totalAfter <= required;
        break;
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConditionValidator;
  module.exports.ConditionValidator = ConditionValidator;
}

const INLINE_PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22 viewBox=%220 0 400 400%22%3E%3Crect width=%22400%22 height=%22400%22 fill=%22%23f3f4f6%22/%3E%3C/svg%3E';

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
    FIXED_BUNDLE_PRICE: 'fixed_bundle_price',
    BUY_X_GET_Y: 'buy_x_get_y'
  },

  PLACEHOLDER_IMAGE: INLINE_PLACEHOLDER_IMAGE,
  PLACEHOLDER_IMAGE_FALLBACK: INLINE_PLACEHOLDER_IMAGE
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
  static getShopify() {
    if (typeof window !== 'undefined' && window.Shopify) return window.Shopify;
    if (typeof Shopify !== 'undefined') return Shopify;
    return null;
  }

  static getShopMoneyFormat() {
    if (typeof window !== 'undefined' && window.shopMoneyFormat) return window.shopMoneyFormat;
    if (typeof shopMoneyFormat !== 'undefined') return shopMoneyFormat;
    return '{{amount}}';
  }

  static getShopBaseCurrency() {
    const shopify = this.getShopify();

    return {
      code: shopify?.shop?.currency || 'USD',
      format: this.getShopMoneyFormat(),
    };
  }

  static detectCustomerCurrency() {
    const shopify = this.getShopify();

    if (shopify?.currency?.active) {
      return {
        code: shopify.currency.active,
        format: shopify.currency.format || this.getShopMoneyFormat(),
        rate: shopify.currency.rate || 1,
      };
    }

    return { ...this.getShopBaseCurrency(), rate: 1 };
  }

  static convertCurrency(amount, fromCurrency, toCurrency, rate = 1) {
    if (fromCurrency === toCurrency) return amount;
    const shopify = this.getShopify();

    if (shopify?.currency?.convert) {
      try {
        return shopify.currency.convert(amount, fromCurrency, toCurrency);
      } catch (e) {
        console.warn('[BUNDLE_WIDGET] Shopify.currency.convert failed, using rate fallback:', e);
      }
    }

    return Math.round(amount * rate);
  }

  static formatMoney(amount, format) {
    const shopify = this.getShopify();
    if (shopify?.formatMoney) {
      return shopify.formatMoney(amount, format);
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

  static normalizeCurrencyFormat(format, code, symbol) {
    if (!format) return `${symbol}{{amount}}`;
    if (!code || !symbol || symbol === code) return format;
    return format.replace(new RegExp(`\\b${code}\\b`, 'g'), symbol);
  }

  static getCurrencyInfo() {
    const shopify = this.getShopify();
    const customerCurrency = this.detectCustomerCurrency();
    const shopBaseCurrency = this.getShopBaseCurrency();
    const displaySymbol = this.getCurrencySymbol(customerCurrency.code);
    const displayFormat = this.normalizeCurrencyFormat(
      shopify?.currency?.format,
      customerCurrency.code,
      displaySymbol
    );

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

    for (const bundle of bundles) {
      if (bundle.bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.PRODUCT_PAGE ||
          bundle.bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE) {
        if (!this._evaluateWidgetVisibility(bundle, config)) {
          continue;
        }

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

        if (
          bundle.bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.PRODUCT_PAGE &&
          bundle.bundleUpsellConfig?.widgetConfiguration?.displayConfiguration
        ) {
          return bundle;
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

      const step = steps?.[stepIndex];
      if (step?.isFreeGift && step?.addonDisplayFree === true && !isDiscountedAddonStep(step)) return;

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

        discountAmount = Math.round(totalPrice * (discountValue / 100));
        break;
      case BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_AMOUNT_OFF:

        discountAmount = discountValue;
        break;
      case BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_BUNDLE_PRICE:

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
    if (!bundle?.pricing?.enabled || !bundle.pricing.rules?.length) return null;

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

  static show(message, duration = 4000, options = {}) {

    const existingToast = document.getElementById('bundle-toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.id = 'bundle-toast';
    toast.className = 'bundle-toast';
    if (options.className) {
      toast.classList.add(options.className);
    }
    if (this._isEnterFromBottom()) {
      toast.classList.add('bundle-toast-from-bottom');
    }
    const closeControl = options.dismissible === false ? '' : `
      <svg class="toast-close" width="20" height="20" viewBox="0 0 24 24" fill="none" style="cursor: pointer;">
        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    toast.innerHTML = `<span>${this._escapeHtml(message)}</span>${closeControl}`;

    toast.querySelector('.toast-close')?.addEventListener('click', () => {
      toast.remove();
    });

    const container = typeof Element !== 'undefined' && options.container instanceof Element
      ? options.container
      : document.body;
    container.appendChild(toast);

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

    const conditionData = this.calculateConditionData(conditionType, targetValue, conditionOperator, totalPrice, totalQuantity, currencyInfo);

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

    const currentProgress = conditionType === 'amount' ? totalPrice : totalQuantity;
    const progressPercentage = targetValue > 0 ? Math.min(100, (currentProgress / targetValue) * 100) : 0;

    const variables = {

      amountNeeded: conditionData.amountNeeded,
      itemsNeeded: conditionData.itemsNeeded,
      conditionText: conditionData.conditionText,

      discountText: discountData.discountText,
      discountConditionDiff: conditionType === 'amount' ? conditionData.amountNeeded : conditionData.itemsNeeded,
      discountUnit: conditionType === 'amount' ? currencyInfo.display.symbol : '',
      discountValue: discountData.discountValue,
      discountValueUnit: discountData.discountValueUnit,
      discountedItems,

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

      amountNeeded: '0',
      itemsNeeded: '0',
      conditionText: '0 items',
      discountText: 'No discount',
      discountConditionDiff: '0',
      discountUnit: '',
      discountValue: '0',
      discountValueUnit: '',
      discountedItems: '0',

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
    const actionMode = options.actionMode || 'default';
    const addButtonText = options.addButtonText || '+';

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
  const spinner = document.createElement('div');
  spinner.className = 'bundle-loading-overlay__spinner';
  spinner.setAttribute('role', 'status');
  spinner.setAttribute('aria-label', 'Loading');
  return spinner;
}

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

class VariantSelectorComponent {

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

function shouldRenderInlineVariantSelector({
  bundleVariantSelectorEnabled = true,
  product,
  displayVariantsAsIndividualProducts = false,
} = {}) {
  if (bundleVariantSelectorEnabled === false) return false;
  if (!product || !Array.isArray(product.variants) || product.variants.length <= 1) return false;
  if (displayVariantsAsIndividualProducts === true) return false;
  if (product.parentProductId && product.variants.length === 0) return false;
  return true;
}

/**
 * Shared discount progress renderer.
 *
 * Accepts prepared progress data so FPB and PPB can keep their pricing and
 * discount calculation ownership while sharing the DOM contract.
 */

function renderDiscountProgress(progressData = {}, options = {}) {
  const progressPercent = normalizePercent(progressData.progressPercent);
  const mode = options.mode || 'bar';
  const message = progressData.message || '';
  const shouldRenderMessage = options.messagePlacement !== 'external' && message;
  const milestones = Array.isArray(progressData.milestones) ? progressData.milestones : [];
  const rootClasses = [
    'bw-discount-progress',
    `bw-discount-progress--mode-${escapeAttribute(mode)}`,
    progressData.success ? 'bw-discount-progress--success' : '',
    options.className || '',
  ].filter(Boolean).join(' ');

  return `
    <div class="${rootClasses}" data-bw-discount-progress="true" style="--bw-discount-progress-width:${progressPercent}%">
      ${shouldRenderMessage ? `<div class="bw-discount-progress__message ${escapeAttribute(options.messageClassName || '')}">${escapeHtml(message)}</div>` : ''}
      ${renderMilestones(milestones, options)}
      <div class="bw-discount-progress__track ${escapeAttribute(options.trackClassName || '')}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progressPercent}">
        <div class="bw-discount-progress__fill ${escapeAttribute(options.fillClassName || '')}"></div>
      </div>
      ${options.renderSubtitleList ? renderMilestoneSubtitleList(milestones, options) : ''}
    </div>
  `;
}

function renderMilestones(milestones, options) {
  if (!milestones.length) return '';

  const listClassName = escapeAttribute(options.milestoneListClassName || 'bw-discount-progress__milestones');
  const itemClassName = options.milestoneClassName || 'bw-discount-progress__milestone';
  const reachedClassName = options.milestoneReachedClassName || 'bw-discount-progress__milestone--reached';
  const titleClassName = escapeAttribute(options.milestoneTitleClassName || 'bw-discount-progress__milestone-title');
  const subtitleClassName = escapeAttribute(options.milestoneSubtitleClassName || 'bw-discount-progress__milestone-subtitle');
  const includeInlineSubtitle = options.renderInlineSubtitles !== false;

  const items = milestones.map((milestone) => {
    const classes = [
      itemClassName,
      milestone?.isReached ? reachedClassName : '',
    ].filter(Boolean).map(escapeAttribute).join(' ');
    const title = escapeHtml(milestone?.title || '');
    const subtitle = escapeHtml(milestone?.subTitle || '');

    return `
      <div class="${classes}">
        <span class="${titleClassName}">${title}</span>
        ${includeInlineSubtitle && subtitle ? `<span class="${subtitleClassName}">${subtitle}</span>` : ''}
      </div>
    `;
  }).join('');

  return `<div class="${listClassName}">${items}</div>`;
}

function renderMilestoneSubtitleList(milestones, options) {
  if (!milestones.length) return '';

  const listClassName = escapeAttribute(options.subtitleListClassName || 'bw-discount-progress__milestone-subtitles');
  const subtitleClassName = options.milestoneSubtitleClassName || 'bw-discount-progress__milestone-subtitle';
  const reachedClassName = options.milestoneReachedClassName || 'bw-discount-progress__milestone--reached';
  const items = milestones.map((milestone) => {
    const classes = [
      subtitleClassName,
      milestone?.isReached ? reachedClassName : '',
    ].filter(Boolean).map(escapeAttribute).join(' ');

    return `<span class="${classes}">${escapeHtml(milestone?.subTitle || '')}</span>`;
  }).join('');

  return `<div class="${listClassName}">${items}</div>`;
}

function normalizePercent(value) {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.max(0, Math.min(100, Math.round(numericValue)));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function appendBannerImage(documentRef, wrapper, url, className) {
  if (!url) return;

  const img = documentRef.createElement('img');
  img.className = className;
  img.src = url;
  img.alt = '';
  img.loading = 'lazy';
  wrapper.appendChild(img);
}

function createBundleBannerElement(config = {}, documentRef = document) {
  const desktopBannerUrl = config.desktopBannerUrl;
  const mobileBannerUrl = config.mobileBannerUrl;
  if (!desktopBannerUrl && !mobileBannerUrl) return null;

  const wrapper = documentRef.createElement('div');
  wrapper.className = 'bundle-banners';
  if (desktopBannerUrl) wrapper.classList.add('bundle-banners--has-desktop');
  if (mobileBannerUrl) wrapper.classList.add('bundle-banners--has-mobile');

  appendBannerImage(documentRef, wrapper, desktopBannerUrl, 'bundle-banner-image bundle-banner-image--desktop');
  appendBannerImage(documentRef, wrapper, mobileBannerUrl, 'bundle-banner-image bundle-banner-image--mobile');

  return wrapper;
}

function createStepBannerImageElement(step = {}, escapeHtml = value => value, documentRef = document) {
  if (!step.bannerImageUrl) return null;

  const wrapper = documentRef.createElement('div');
  wrapper.className = 'step-banner-image';

  const img = documentRef.createElement('img');
  img.src = step.bannerImageUrl;
  img.alt = escapeHtml(step.name || '');
  wrapper.appendChild(img);

  return wrapper;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createBundleBannerElement,
    createStepBannerImageElement,
  };
}

/**
 * Shared quantity control renderer.
 *
 * Keeps legacy class names for event-handler compatibility while adding a
 * stable `bw-quantity-control` contract for migrated templates.
 */

function renderQuantityControl({
  variantId,
  quantity = 0,
  decreaseDisabled = false,
  increaseDisabled = false,
  className = '',
} = {}) {
  const key = escapeHtml(variantId || '');
  const normalizedQuantity = Math.max(0, Number(quantity || 0));
  const classes = ['bw-quantity-control', 'inline-quantity-controls', className]
    .filter(Boolean)
    .join(' ');

  return `
    <div class="${classes}" data-product-id="${key}">
      <button type="button" class="bw-quantity-control__button inline-qty-btn qty-decrease" data-product-id="${key}" ${decreaseDisabled ? 'disabled aria-disabled="true"' : ''}>−</button>
      <span class="bw-quantity-control__value inline-qty-display">${normalizedQuantity}</span>
      <button type="button" class="bw-quantity-control__button inline-qty-btn qty-increase" data-product-id="${key}" ${increaseDisabled ? 'disabled aria-disabled="true"' : ''}>+</button>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const DEFAULT_PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23f3f4f6"/%3E%3C/svg%3E';
const PRODUCT_DESCRIPTION_PREVIEW_LENGTH = 110;

function renderSharedProductCard(product = {}, currentQuantity = 0, currencyInfo = {}, options = {}) {
  const selectionKey = product.variantId || product.id || '';
  const quantity = Math.max(0, Number(currentQuantity || 0));
  const isSelected = quantity > 0;
  const mode = options.mode || 'grid';
  const descriptionText = resolveProductDescriptionText(
    Object.prototype.hasOwnProperty.call(options, 'description')
      ? options.description
      : product.description,
  );
  const variantText = getVariantDisplayText(product);
  const isIndividualVariantCard = Boolean(product.parentProductId && product.variantId && variantText);
  const title = getDisplayTitle(product, variantText);
  const imageUrls = getProductImageUrls(product);
  const imageUrl = imageUrls[0] || DEFAULT_PLACEHOLDER_IMAGE;
  const hasMultipleImages = imageUrls.length > 1;
  const price = formatPrice(product.price, currencyInfo);
  const compareAtPrice = formatPrice(product.compareAtPrice, currencyInfo);
  const variantSelectorBeforePrice = options.variantSelectorPlacement === 'beforePrice';
  const rootClasses = [
    'bw-product-card',
    'product-card',
    `bw-product-card--mode-${escapeAttribute(mode)}`,
    variantText ? 'bw-product-card--has-variant product-card--has-variant' : '',
    isIndividualVariantCard ? 'bw-product-card--individual-variant product-card--individual-variant' : '',
    isSelected ? 'bw-product-card--selected' : '',
    options.displaySeeMoreLink === true && descriptionText ? 'bw-product-card--see-more' : '',
    options.expandProductCardOnHover === true ? 'bw-product-card--hover-expand' : '',
    options.className || '',
  ].filter(Boolean).join(' ');

  return `
    <div class="${rootClasses}" data-bw-product-card="true" data-product-id="${escapeAttribute(selectionKey)}" data-current-selected-variant-id="${escapeAttribute(selectionKey)}" data-bw-card-image-count="${imageUrls.length}" data-bw-card-image-index="0"${isIndividualVariantCard ? ' data-bw-card-individual-variant="true"' : ''}${hasMultipleImages ? ' data-bw-card-has-multiple-images="true"' : ''}>
      <div class="bw-product-card__media product-image" data-bw-product-media="true">
        <img class="bw-product-card__image" src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(title)}" loading="lazy">
        ${hasMultipleImages ? renderImageNavButton('prev') : ''}
        ${hasMultipleImages ? renderImageNavButton('next') : ''}
        <span class="bw-product-card__image-overlay product-image-overlay" aria-hidden="true">
          <span class="bw-product-card__magnifier"></span>
        </span>
        ${options.stockBadgeHtml || ''}
      </div>
      ${options.cardBadgeHtml || ''}
      <div class="bw-product-card__body product-content-wrapper">
      <div class="bw-product-card__text product-text-container ${variantText ? 'bw-product-card__text--has-variant product-text-container--has-variant' : ''}">
          <div class="bw-product-card__title product-title">${escapeHtml(title)}</div>
          ${variantText ? `<div class="bw-product-card__variant product-variant-row" data-bw-card-variant-row="true">${escapeHtml(variantText)}</div>` : ''}
          ${renderProductDescription({
            description: descriptionText,
            displaySeeMoreLink: options.displaySeeMoreLink === true,
            descriptionMaxLength: options.descriptionMaxLength,
          })}
        </div>
        <div class="product-card-price-action">
          ${variantSelectorBeforePrice ? options.variantSelectorHtml || '' : ''}
          ${price ? `
            <div class="bw-product-card__price product-price-row">
              ${compareAtPrice ? `<span class="bw-product-card__compare-price product-price-strike">${escapeHtml(compareAtPrice)}</span>` : ''}
              <span class="bw-product-card__current-price product-price">${escapeHtml(price)}</span>
            </div>
          ` : ''}
          ${variantSelectorBeforePrice ? '' : options.variantSelectorHtml || ''}
          <div class="bw-product-card__action product-card-action ${isSelected ? 'is-expanded' : ''}">
            ${isSelected && options.selectedAction === 'button'
              ? renderAddButton(selectionKey, {
                ...options,
                addButtonText: options.selectedButtonText || options.addButtonText,
              })
              : isSelected
              ? renderQuantityControl({
                variantId: selectionKey,
                quantity,
                decreaseDisabled: options.decreaseDisabled === true,
                increaseDisabled: options.increaseDisabled === true,
              })
              : renderAddButton(selectionKey, options)}
          </div>
        </div>
      </div>
    </div>
  `;
}

function getProductImageUrls(product = {}) {
  const urls = [];
  const addUrl = (value) => {
    const url = normalizeImageUrl(value);
    if (url && !urls.includes(url)) urls.push(url);
  };

  addUrl(product.imageUrl);
  addUrl(product.image);
  addUrl(product.featuredImage);
  (Array.isArray(product.images) ? product.images : []).forEach(addUrl);

  return urls.length > 0 ? urls : [DEFAULT_PLACEHOLDER_IMAGE];
}

function getDisplayTitle(product, variantText) {
  const parentTitle = typeof product.parentTitle === 'string' ? product.parentTitle.trim() : '';
  const rawTitle = typeof product.title === 'string' ? product.title.trim() : '';

  if (variantText && parentTitle) return parentTitle;

  const separatorIndex = rawTitle.indexOf(' - ');
  if (variantText && separatorIndex > 0) {
    return rawTitle.slice(0, separatorIndex).trim();
  }

  return parentTitle || rawTitle;
}

function getVariantDisplayText(product) {
  const explicitVariantTitle = typeof product.variantTitle === 'string' ? product.variantTitle.trim() : '';
  if (explicitVariantTitle && explicitVariantTitle !== 'Default Title') {
    return explicitVariantTitle;
  }

  const parentTitle = typeof product.parentTitle === 'string' ? product.parentTitle.trim() : '';
  const rawTitle = typeof product.title === 'string' ? product.title.trim() : '';
  const canInferExpandedVariant = Boolean(product.parentProductId || parentTitle);
  if (!rawTitle) return '';

  if (parentTitle) {
    const parentPrefix = `${parentTitle} - `;
    if (rawTitle.startsWith(parentPrefix)) {
      return rawTitle.slice(parentPrefix.length).trim();
    }
  }

  const separatorIndex = rawTitle.indexOf(' - ');
  if (canInferExpandedVariant && separatorIndex > 0) {
    return rawTitle.slice(separatorIndex + 3).trim();
  }

  return '';
}

function renderAddButton(selectionKey, options) {
  const disabled = options.addDisabled === true;
  const text = options.addButtonText || '+';
  const accessibleLabel = text.trim() === '+'
    ? 'aria-label="Add"'
    : '';

  return `
    <button type="button" class="bw-product-card__add-button product-add-btn" data-product-id="${escapeAttribute(selectionKey)}" ${accessibleLabel} ${disabled ? 'disabled aria-disabled="true"' : ''}>
      ${escapeHtml(text)}
    </button>
  `;
}

function renderImageNavButton(direction) {
  const label = direction === 'prev' ? 'Previous image' : 'Next image';
  const symbol = direction === 'prev' ? '&#10094;' : '&#10095;';
  return `
    <button type="button" class="bw-product-card__image-nav bw-product-card__image-nav--${direction}" data-bw-image-nav="${direction}" aria-label="${label}">
      ${symbol}
    </button>
  `;
}

function renderProductDescription({
  description = '',
  displaySeeMoreLink = false,
  descriptionMaxLength = PRODUCT_DESCRIPTION_PREVIEW_LENGTH,
}) {
  const descriptionText = resolveProductDescriptionText(description);
  if (!descriptionText) return '';

  const showToggle = displaySeeMoreLink === true;
  if (!showToggle) {
    return `
      <div class="bw-product-card__description">${escapeHtml(descriptionText)}</div>
    `;
  }

  const maxLength = Math.max(24, Number(descriptionMaxLength) || PRODUCT_DESCRIPTION_PREVIEW_LENGTH);
  const isClamped = descriptionText.length > maxLength;
  const shortDescription = isClamped
    ? `${descriptionText.slice(0, maxLength)}...`
    : descriptionText;

  return `
    <div class="bw-product-card__description" data-bw-card-description="true" data-bw-card-description-expanded="false">
      <span class="bw-product-card__description-short"${isClamped ? '' : ' hidden'}>${escapeHtml(shortDescription)}</span>
      <span class="bw-product-card__description-full"${isClamped ? ' hidden' : ''}>${escapeHtml(descriptionText)}</span>
      ${isClamped ? '<button type="button" class="bw-product-card__see-more" aria-expanded="false">See more</button>' : ''}
    </div>
  `;
}

function normalizeImageUrl(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.url || value.src || value.originalSrc || value.transformedSrc || '';
}

function formatPrice(value, currencyInfo) {
  if (value == null || value === '') return '';

  const amount = Number(value || 0) / 100;
  const format = currencyInfo?.display?.format || '${{amount}}';
  return format.replace('{{amount}}', amount.toFixed(2));
}

function resolveProductDescriptionText(value) {
  if (value == null) return '';

  return String(value);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

/**
 * Shared selected product row renderer.
 *
 * Renders prepared display data only; selection rules, default-product rules,
 * and free-gift lock state stay in the caller until templates migrate.
 */

const SELECTED_ROW_PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" fill="%23f3f4f6"/%3E%3C/svg%3E';

function renderSelectedProductRow(product = null, options = {}) {
  if (!product) return renderEmptyRow(options);

  const selectionKey = product.variantId || product.id || product.productId || '';
  const title = product.title || product.parentTitle || '';
  const variantTitle = product.variantTitle || product.variant || '';
  const quantity = Math.max(1, Number(product.quantity || 1));
  const quantityLabel = product.quantityLabel || options.quantityLabel || `x${quantity}`;
  const imageUrl = product.imageUrl || product.image?.src || SELECTED_ROW_PLACEHOLDER_IMAGE;
  const removable = product.isDefault !== true && product.isLocked !== true && options.removable !== false;
  const classes = [
    'bw-selected-row',
    'bw-selected-row--filled',
    product.isDefault ? 'bw-selected-row--default' : '',
    product.isFreeGift ? 'bw-selected-row--free-gift' : '',
    product.isLocked ? 'bw-selected-row--locked' : '',
    options.className || '',
  ].filter(Boolean).join(' ');

  return `
    <div class="${classes}" data-bw-selected-row="true" data-variant-id="${escapeAttribute(selectionKey)}">
      <div class="bw-selected-row__media">
        <img class="bw-selected-row__image" src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(title)}" loading="lazy">
      </div>
      <div class="bw-selected-row__body">
        <div class="bw-selected-row__title">${escapeHtml(title)}</div>
        ${variantTitle ? `<div class="bw-selected-row__variant">${escapeHtml(variantTitle)}</div>` : ''}
        ${renderPrice(product)}
        ${renderBadges(product)}
      </div>
      <div class="bw-selected-row__action">
        <span class="bw-selected-row__quantity" aria-label="Quantity ${quantity}">${escapeHtml(quantityLabel)}</span>
        ${removable ? `
          <button type="button" class="bw-selected-row__remove" data-action="remove-selected-product" data-variant-id="${escapeAttribute(selectionKey)}" aria-label="Delete ${escapeAttribute(title)}">
            ${renderTrashIcon()}
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

function renderPrice(product) {
  if (!product.priceText) return '';

  return `<div class="bw-selected-row__price">${escapeHtml(product.priceText)}</div>`;
}

function renderEmptyRow(options) {
  const label = options.emptyLabel || 'Empty slot';

  return `
    <div class="bw-selected-row bw-selected-row--empty ${options.className || ''}" data-bw-selected-row="true">
      <div class="bw-selected-row__media bw-selected-row__media--empty"></div>
      <div class="bw-selected-row__body">
        <div class="bw-selected-row__title bw-selected-row__title--empty">${escapeHtml(label)}</div>
        <div class="bw-selected-row__skeleton-line"></div>
      </div>
      <div class="bw-selected-row__action bw-selected-row__action--empty"></div>
    </div>
  `;
}

function renderTrashIcon() {
  return `
    <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" aria-hidden="true" focusable="false">
      <path d="M6 2h8a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1Zm-2 3h12l-1 13H5L4 5Zm4 2v9m4-9v9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    </svg>
  `;
}

function renderBadges(product) {
  const badges = [];
  if (product.isDefault) badges.push('Included');
  if (product.isFreeGift) badges.push(product.isLocked ? 'Locked gift' : 'Free gift');
  if (badges.length === 0) return '';

  return `
    <div class="bw-selected-row__badges">
      ${badges.map((badge) => `<span class="bw-selected-row__badge">${escapeHtml(badge)}</span>`).join('')}
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

/**
 * Shared selected product slot renderer.
 *
 * Slots can be used by sidebars, modal summaries, and mobile trays. The caller
 * supplies prepared slot/product state and owns all business rules.
 */

function renderSelectedProductSlots(slots = [], options = {}) {
  const mode = options.mode || 'grid';
  const classes = [
    'bw-selected-slots',
    `bw-selected-slots--mode-${escapeAttribute(mode)}`,
    options.className || '',
  ].filter(Boolean).join(' ');

  return `
    <div class="${classes}" data-bw-selected-slots="true">
      ${slots.map((slot, index) => renderSlot(slot, index, options)).join('')}
    </div>
  `;
}

function renderSlot(slot = {}, index, options) {
  const product = slot.product || null;
  const slotId = slot.id || `slot-${index}`;
  const label = slot.label || `Slot ${index + 1}`;
  const statusClasses = getStatusClasses(product);
  const classes = [
    'bw-selected-slot',
    product ? 'bw-selected-slot--filled' : 'bw-selected-slot--empty',
    ...statusClasses,
  ].join(' ');

  if (!product) {
    const iconUrl = slot.iconUrl || options.emptySlotIconUrl || '';
    const emptyVisual = iconUrl
      ? `<img class="bw-selected-slot__icon" src="${escapeAttribute(iconUrl)}" alt="" loading="lazy">`
      : '<span class="bw-selected-slot__placeholder"></span>';

    return `
      <button type="button" class="${classes}" data-bw-selected-slot="true" data-slot-id="${escapeAttribute(slotId)}" data-action="select-slot">
        ${emptyVisual}
        <span class="bw-selected-slot__label">${escapeHtml(label)}</span>
      </button>
    `;
  }

  return `
    <div class="${classes}" data-bw-selected-slot="true" data-slot-id="${escapeAttribute(slotId)}">
      ${slot.label ? `<div class="bw-selected-slot__label">${escapeHtml(slot.label)}</div>` : ''}
      ${renderSelectedProductRow(product, {
        className: 'bw-selected-slot__row',
        removable: product.isDefault !== true && product.isLocked !== true && options.removable !== false,
      })}
    </div>
  `;
}

function getStatusClasses(product) {
  if (!product) return [];

  return [
    product.isDefault ? 'bw-selected-slot--default' : '',
    product.isFreeGift ? 'bw-selected-slot--free-gift' : '',
    product.isLocked ? 'bw-selected-slot--locked' : '',
  ].filter(Boolean);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

/**
 * Shared step timeline renderers.
 *
 * The widget controller still owns state, paging, and click behavior. This
 * component owns the stable DOM contract used by template timelines.
 */

function renderStepTimelineEntry({
  stepIndex = 0,
  timelineType = 'step',
  label = '',
  iconHtml = '',
  classes = [],
} = {}) {
  const className = [
    'timeline-step',
    ...classes,
  ].filter(Boolean).join(' ');

  return `
    <div class="${escapeAttribute(className)}" data-step-index="${escapeAttribute(stepIndex)}" data-timeline-type="${escapeAttribute(timelineType)}">
      <div class="timeline-icon-wrapper">
        ${iconHtml || ''}
        <div class="timeline-checkmark"></div>
      </div>
      <span class="timeline-step-name">${escapeHtml(label)}</span>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function createBundleState(input = {}) {
  const bundle = input.bundle || null;
  const steps = Array.isArray(input.steps)
    ? input.steps
    : (Array.isArray(bundle?.steps) ? bundle.steps : []);

  return {
    bundle,
    steps,
    selectedProducts: cloneSelectedProducts(input.selectedProducts),
    stepProductData: Array.isArray(input.stepProductData) ? input.stepProductData : [],
    currentStepIndex: Number.isInteger(input.currentStepIndex) ? input.currentStepIndex : 0,
  };
}

function cloneSelectedProducts(selectedProducts) {
  if (!Array.isArray(selectedProducts)) return [];

  return selectedProducts.map((stepSelections) => {
    if (!stepSelections || typeof stepSelections !== 'object') return {};
    return { ...stepSelections };
  });
}

function getCurrentStep(state) {
  const steps = Array.isArray(state?.steps) ? state.steps : [];
  return steps[state?.currentStepIndex || 0] || null;
}

function getSelectedQuantity(state) {
  return getSelectedEntries(state).reduce((total, entry) => total + entry.quantity, 0);
}

function getSelectedSubtotalCents(state) {
  return getSelectedEntries(state).reduce((total, entry) => {
    const product = findProductByVariantId(state, entry.variantId);
    const price = Number(product?.price || 0);
    return total + (price * entry.quantity);
  }, 0);
}

function getDiscountProgressData({ currentValue = 0, targetValue = 0, message = '' } = {}) {
  const current = Math.max(0, Number(currentValue || 0));
  const target = Math.max(0, Number(targetValue || 0));
  const progressPercent = target > 0
    ? Math.max(0, Math.min(100, Math.round((current / target) * 100)))
    : 0;

  return {
    currentValue: current,
    targetValue: target,
    progressPercent,
    message: String(message || ''),
    success: target > 0 && current >= target,
  };
}

function getSelectedEntries(state) {
  const selectedProducts = Array.isArray(state?.selectedProducts) ? state.selectedProducts : [];
  const entries = [];

  selectedProducts.forEach((stepSelections, stepIndex) => {
    if (!stepSelections || typeof stepSelections !== 'object') return;

    Object.entries(stepSelections).forEach(([variantId, quantity]) => {
      const normalizedQuantity = Number(quantity || 0);
      if (normalizedQuantity <= 0) return;
      entries.push({ stepIndex, variantId, quantity: normalizedQuantity });
    });
  });

  return entries;
}

function getSelectedProductEntries(state, options = {}) {
  const stepProductData = Array.isArray(state?.stepProductData) ? state.stepProductData : [];
  const normalizeSelectionKey = options.normalizeSelectionKey || ((value) => String(value));

  return getSelectedEntries(state).reduce((entries, entry) => {
    const sourceProducts = stepProductData[entry.stepIndex] || [];
    const products = typeof options.expandProductsByStep === 'function'
      ? options.expandProductsByStep(sourceProducts, entry.stepIndex)
      : sourceProducts;
    const product = (Array.isArray(products) ? products : []).find((candidate) =>
      normalizeSelectionKey(candidate?.variantId || candidate?.id) === normalizeSelectionKey(entry.variantId)
    );

    if (!product) return entries;

    entries.push({ ...entry, product });
    return entries;
  }, []);
}

function getTimelineEntryState({
  entry = {},
  currentStepIndex = 0,
  isCompleted = false,
  isAccessible = true,
  hasMultipleCategoryEntry = false,
} = {}) {
  const step = entry.step || {};
  const isDefaultStep = step.isDefault === true;
  const isCategoryEntry = entry.type === 'multiple_categories';
  const isCurrent = Number(entry.stepIndex) === Number(currentStepIndex)
    && (!hasMultipleCategoryEntry || isCategoryEntry);
  const completed = Boolean(isCompleted);
  const accessible = isAccessible !== false;
  const classes = [];

  if (isDefaultStep) classes.push('timeline-step--included');
  if (isCurrent) classes.push('timeline-step--active');
  if (completed) classes.push('timeline-step--completed');
  if (!isCurrent && !completed) classes.push('timeline-step--inactive');
  if (!accessible) classes.push('timeline-step--locked');

  return {
    isDefaultStep,
    isCurrent,
    isCompleted: completed,
    isAccessible: accessible,
    classes,
  };
}

function shouldShowTimelineCompletedState({
  entry = {},
  currentStepIndex = 0,
  isStepCompleted = false,
  hasMultipleCategoryEntry = false,
} = {}) {
  if (!isStepCompleted) return false;

  const stepIndex = Number(entry.stepIndex);
  const activeStepIndex = Number(currentStepIndex);
  if (!Number.isFinite(stepIndex) || !Number.isFinite(activeStepIndex)) {
    return false;
  }

  const isPastStep = stepIndex < activeStepIndex;
  if (entry.type === 'multiple_categories') {
    return isPastStep;
  }

  return isPastStep
    || (hasMultipleCategoryEntry && stepIndex === activeStepIndex);
}

function findProductByVariantId(state, variantId) {
  const stepProductData = Array.isArray(state?.stepProductData) ? state.stepProductData : [];

  for (const products of stepProductData) {
    if (!Array.isArray(products)) continue;
    const product = products.find((item) => String(item?.variantId) === String(variantId));
    if (product) return product;
  }

  return null;
}

function addSelectedProduct(state, { stepIndex, variantId, quantity = 1 }) {
  const selectedProducts = cloneSelectedProducts(state?.selectedProducts);
  ensureStep(selectedProducts, stepIndex);

  const currentQuantity = Number(selectedProducts[stepIndex][variantId] || 0);
  selectedProducts[stepIndex][variantId] = currentQuantity + Math.max(0, Number(quantity || 0));

  return { ...state, selectedProducts };
}

function removeSelectedProduct(state, { stepIndex, variantId, quantity = 1 }) {
  const selectedProducts = cloneSelectedProducts(state?.selectedProducts);
  ensureStep(selectedProducts, stepIndex);

  const currentQuantity = Number(selectedProducts[stepIndex][variantId] || 0);
  const nextQuantity = currentQuantity - Math.max(1, Number(quantity || 1));

  if (nextQuantity > 0) {
    selectedProducts[stepIndex][variantId] = nextQuantity;
  } else {
    delete selectedProducts[stepIndex][variantId];
  }

  return { ...state, selectedProducts };
}

function clearStepSelection(state, stepIndex) {
  const selectedProducts = cloneSelectedProducts(state?.selectedProducts);
  ensureStep(selectedProducts, stepIndex);
  selectedProducts[stepIndex] = {};

  return { ...state, selectedProducts };
}

function ensureStep(selectedProducts, stepIndex) {
  while (selectedProducts.length <= stepIndex) {
    selectedProducts.push({});
  }
  if (!selectedProducts[stepIndex] || typeof selectedProducts[stepIndex] !== 'object') {
    selectedProducts[stepIndex] = {};
  }
}

const DEFAULT_CART_LINE_LABELS = {
  items: 'Items',
  retailPrice: 'Retail Price',
  youSave: 'You Save',
};

function formatCartLineItemTitle(product = {}) {
  const title = String(product.title || product.id || '');
  const variantTitle = String(product.variantTitle || product.variant || '').trim();
  if (!variantTitle || variantTitle === 'Default Title' || title.endsWith(`(${variantTitle})`)) {
    return title;
  }
  return `${title} (${variantTitle})`;
}

function buildCartLineSourceProperties({
  selectedLines = [],
  retailPrice = '',
  discountAmount = '',
  discountPercentage = null,
  box = '1',
  includeBox = true,
} = {}) {
  const displayProperties = {
    items: selectedLines
      .map(({ product = {}, quantity = 0 }) => `${Number(quantity || 0)} x ${formatCartLineItemTitle(product)}`)
      .join(', '),
    retailPrice: String(retailPrice || ''),
  };

  if (includeBox !== false) {
    displayProperties.box = String(box || '1');
  }

  if (discountAmount) {
    const percentage = `${Math.round(Number(discountPercentage || 0))}%`;
    displayProperties.youSave = {
      amount: String(discountAmount),
      percentage,
      amountPercentage: `${discountAmount} (${percentage})`,
    };
  }

  return {
    _bundle_display_properties: JSON.stringify(displayProperties),
  };
}

function buildCartLineDisplayProperties(displayProperties = {}, labels = DEFAULT_CART_LINE_LABELS) {
  const cartLineLabels = {
    ...DEFAULT_CART_LINE_LABELS,
    ...labels,
  };
  const properties = {
    Box: displayProperties.box || '1',
    [cartLineLabels.items]: displayProperties.items,
    [cartLineLabels.retailPrice]: displayProperties.retailPrice,
    _bundle_display_properties: JSON.stringify(displayProperties),
  };

  if (displayProperties.youSave?.amountPercentage) {
    properties[cartLineLabels.youSave] = displayProperties.youSave.amountPercentage;
  }

  return properties;
}

function extractBundleDetailsSourceProperties(cartItems = []) {
  const firstItem = cartItems.find(item => item?.properties?._bundle_display_properties);
  return firstItem?.properties || {};
}

function buildProductPageCartFormData(cartItems = [], {
  bundleName = '',
  offerId = '',
  sessionKey = '',
  runtimeToken = '',
} = {}) {
  const formData = new FormData();

  cartItems.forEach((item, index) => {
    const itemNumber = index + 1;
    formData.append(`items[${index}][id]`, String(item.id));
    formData.append(`items[${index}][quantity]`, String(item.quantity));

    if (item.selling_plan) {
      formData.append(`items[${index}][selling_plan]`, String(item.selling_plan));
    }

    Object.entries(item.properties || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      formData.append(`items[${index}][properties][${key}]`, String(value));
    });
    formData.append(`items[${index}][properties][Box]`, String(itemNumber));
    formData.append(`items[${index}][properties][_bundleName]`, bundleName);
    formData.append(`items[${index}][properties][_wolfpackProductBundle:OfferId]`, `${offerId}_${sessionKey}_${itemNumber}`);
    formData.append(`items[${index}][properties][_wolfpackProductBundle:prodQty]`, String(item.quantity));
    if (runtimeToken) {
      formData.append(`items[${index}][properties][_wolfpack_bundle_runtime]`, runtimeToken);
    }
  });

  return {
    formData,
    bundleDetailsKey: `${offerId}_${sessionKey}`,
    sourceProperties: extractBundleDetailsSourceProperties(cartItems),
  };
}

function normalizeConditionType(value) {
  if (typeof value !== 'string') return value;
  return value.trim().toLowerCase();
}

function normalizeConditionOperator(value) {
  if (typeof value !== 'string') return value;
  const normalized = value.trim();
  if (normalized.indexOf('_') !== -1) return normalized.toLowerCase();
  return normalized.replace(/([A-Z])/g, '_$1').toLowerCase();
}

function normalizeConditionValue(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : value;
}

function cloneConditionFields(conditions, fallbackCondition, fallbackStep) {
  const sourceConditions = Array.isArray(conditions)
    ? conditions
    : (Array.isArray(fallbackCondition) ? fallbackCondition : undefined);
  const conditionsArray = Array.isArray(sourceConditions) ? sourceConditions : [];

  const primary = conditionsArray[0] || {};
  const secondary = conditionsArray[1] || {};

  const normalizedPrimaryType = normalizeConditionType(
    primary?.type
    ?? primary?.conditionType
    ?? fallbackStep?.conditionType
  );
  const normalizedPrimaryOperator = normalizeConditionOperator(
    primary?.operator
    ?? primary?.condition
    ?? primary?.conditionOperator
    ?? fallbackStep?.conditionOperator
  );
  const normalizedPrimaryValue = normalizeConditionValue(
    primary?.value ?? fallbackStep?.conditionValue,
  );

  const normalizedSecondaryType = normalizeConditionType(
    secondary?.type
    ?? secondary?.conditionType
    ?? fallbackStep?.conditionType2
  );
  const normalizedSecondaryOperator = normalizeConditionOperator(
    secondary?.operator
    ?? secondary?.condition
    ?? secondary?.conditionOperator
    ?? fallbackStep?.conditionOperator2
  );
  const normalizedSecondaryValue = normalizeConditionValue(
    secondary?.value ?? fallbackStep?.conditionValue2,
  );

  const next = {
    conditions: sourceConditions,
  };

  if (normalizedPrimaryType != null) next.conditionType = normalizedPrimaryType;
  if (normalizedPrimaryOperator != null) next.conditionOperator = normalizedPrimaryOperator;
  if (normalizedPrimaryValue != null) next.conditionValue = normalizedPrimaryValue;

  if (normalizedSecondaryType != null) next.conditionType2 = normalizedSecondaryType;
  if (normalizedSecondaryOperator != null) next.conditionOperator2 = normalizedSecondaryOperator;
  if (normalizedSecondaryValue != null) next.conditionValue2 = normalizedSecondaryValue;

  return next;
}

function ppbExpandSingleStepCategoriesAsSteps(bundle) {
  if (!Array.isArray(bundle?.steps)) return bundle;

  const enabledSteps = bundle.steps.filter((step) => step?.enabled !== false);
  const normalizedBundle = enabledSteps.length === bundle.steps.length
    ? bundle
    : { ...bundle, steps: enabledSteps };

  if (!bundle.useSingleStepCategoriesAsBundleSteps) return normalizedBundle;
  if (enabledSteps.length !== 1) return normalizedBundle;

  const [step] = enabledSteps;
  const categories = Array.isArray(step?.categories) ? step.categories : [];
  if (categories.length <= 1 || step?.isDefault || step?.isFreeGift) return normalizedBundle;

  return {
    ...normalizedBundle,
    steps: categories.map((category, categoryIndex) => {
      const categoryLabel = category?.pageTitle
        || category?.title
        || category?.name
        || `${step.pageTitle || step.name || 'Step'} ${categoryIndex + 1}`;
      const categoryKey = category?.id
        || category?.categoryId
        || category?.title
        || category?.name
        || categoryIndex + 1;

      return {
        ...step,
        id: `${step.id || 'step'}__category_${categoryKey}`,
        name: categoryLabel,
        pageTitle: categoryLabel,
        categories: [category],
        ...cloneConditionFields(category?.conditions, step.conditions, step),
        _sourceStepId: step.id || null,
        _sourceCategoryId: category?.id || category?.categoryId || null,
        _sourceCategoryIndex: categoryIndex,
      };
    }),
  };
}

const PPB_GRID_TEMPLATE_CONFIG = {
  id: 'GRID',
  templateType: 'PDP_INPAGE',
  legacyPresetId: 'COGNIVE',
  aliases: ['GRID', 'COGNIVE'],
  productCard: {
    mode: 'grid',
  },
  summary: {
    mode: 'drawer',
  },
  discountProgress: {
    mode: 'simple',
    placement: ['footer', 'drawer'],
  },
};

const PPB_LIST_TEMPLATE_CONFIG = {
  id: 'LIST',
  templateType: 'PDP_INPAGE',
  legacyPresetId: 'CASCADE',
  aliases: ['LIST', 'CASCADE'],
  productCard: {
    mode: 'row',
  },
  summary: {
    mode: 'drawerRows',
  },
  discountProgress: {
    mode: 'simple',
    placement: ['footer', 'drawer'],
  },
};

const PPB_HORIZONTAL_SLOTS_TEMPLATE_CONFIG = {
  id: 'HORIZONTAL_SLOTS',
  templateType: 'PDP_MODAL',
  legacyPresetId: 'MODAL',
  aliases: ['HORIZONTAL_SLOTS', 'MODAL'],
  slots: {
    orientation: 'horizontal',
  },
  summary: {
    mode: 'slots',
  },
  discountProgress: {
    mode: 'simple',
    placement: ['bottomSheet', 'modal'],
  },
};

const PPB_VERTICAL_SLOTS_TEMPLATE_CONFIG = {
  id: 'VERTICAL_SLOTS',
  templateType: 'PDP_MODAL',
  legacyPresetId: 'SIMPLIFIED',
  aliases: ['VERTICAL_SLOTS', 'SIMPLIFIED'],
  slots: {
    orientation: 'vertical',
  },
  summary: {
    mode: 'verticalSlots',
  },
  discountProgress: {
    mode: 'simple',
    placement: ['bottomSheet', 'modal'],
  },
};

const PPB_TEMPLATE_CONFIGS = {
  GRID: PPB_GRID_TEMPLATE_CONFIG,
  LIST: PPB_LIST_TEMPLATE_CONFIG,
  HORIZONTAL_SLOTS: PPB_HORIZONTAL_SLOTS_TEMPLATE_CONFIG,
  VERTICAL_SLOTS: PPB_VERTICAL_SLOTS_TEMPLATE_CONFIG,
};

function resolveProductPageTemplateConfig({
  templateType = '',
  designPreset = '',
  renderFilledSlotsAsHorizontalStacked,
} = {}) {
  if (templateType === 'PDP_INPAGE') {
    if (designPreset === 'COGNIVE') return PPB_TEMPLATE_CONFIGS.GRID;
    if (designPreset === 'CASCADE') return PPB_TEMPLATE_CONFIGS.LIST;
  }

  if (templateType === 'PDP_MODAL') {
    if (typeof renderFilledSlotsAsHorizontalStacked === 'boolean') {
      return renderFilledSlotsAsHorizontalStacked
        ? PPB_TEMPLATE_CONFIGS.HORIZONTAL_SLOTS
        : PPB_TEMPLATE_CONFIGS.VERTICAL_SLOTS;
    }

    return designPreset === 'SIMPLIFIED'
      ? PPB_TEMPLATE_CONFIGS.VERTICAL_SLOTS
      : PPB_TEMPLATE_CONFIGS.HORIZONTAL_SLOTS;
  }

  return null;
}

const modalSlotTemplateMethods = {
  _isProductPageModalSlotTemplate() {
    const config = resolveProductPageTemplateConfig({
      templateType: this._getProductPageTemplateType(),
      designPreset: this._getProductPageDesignPreset(),
      renderFilledSlotsAsHorizontalStacked: this.selectedBundle?.renderFilledSlotsAsHorizontalStacked,
    });

    return config?.templateType === 'PDP_MODAL';
  },

  _usesVerticalModalSlotLayout() {
    const config = resolveProductPageTemplateConfig({
      templateType: this._getProductPageTemplateType(),
      designPreset: this._getProductPageDesignPreset(),
      renderFilledSlotsAsHorizontalStacked: this.selectedBundle?.renderFilledSlotsAsHorizontalStacked,
    });

    return config?.id === 'VERTICAL_SLOTS';
  },

  syncProductPagePrimaryCtaStyle() {
    const button = this.elements?.addToCartButton;
    if (!button) return;

    button.classList.toggle(
      'bw-ppb-primary-cta--modal-vertical',
      this._getProductPageTemplateType() === 'PDP_MODAL' && this._usesVerticalModalSlotLayout()
    );
  },

  _createModalSlotStepSection(step) {
    const section = document.createElement('div');
    const isVertical = this._usesVerticalModalSlotLayout();

    section.className = `bw-ppb-modal-slot-section${isVertical ? ' bw-ppb-modal-slot-section--simplified' : ''}`;

    const title = document.createElement('div');
    title.className = 'bw-ppb-modal-slot-title';
    title.textContent = step.pageTitle || step.name || '';
    section.appendChild(title);

    const gridHost = document.createElement('div');
    gridHost.innerHTML = renderSelectedProductSlots([], {
      mode: isVertical ? 'vertical' : 'horizontal',
      className: `bw-ppb-modal-slot-grid${isVertical ? ' bw-ppb-modal-slot-grid--simplified' : ''}`,
    }).trim();
    const grid = gridHost.firstElementChild;
    if (grid?.matches('[data-bw-selected-slots="true"]')) {
      section.appendChild(grid);
    }

    return section;
  },

  createEmptyStateCard(step, stepIndex, instanceIndex = 0) {
    const stepBox = document.createElement('button');
    stepBox.type = 'button';
    stepBox.dataset.stepIndex = stepIndex;
    stepBox.dataset.cardIndex = instanceIndex;

    stepBox.className = 'step-box bw-slot-card bw-slot-card--empty';

    const imgUrl = step.categoryImageUrl || null;
    const isModalSlotTemplate = this._isProductPageModalSlotTemplate();
    if (imgUrl && !isModalSlotTemplate) {
      stepBox.style.backgroundImage = `url('${imgUrl}')`;
      stepBox.style.backgroundSize = 'contain';
      stepBox.style.backgroundRepeat = 'no-repeat';
      stepBox.style.backgroundPosition = 'center';
    }

    if (isModalSlotTemplate) {
      const visual = document.createElement('div');
      visual.className = 'bw-slot-card__empty-visual';
      if (imgUrl) {
        visual.style.backgroundImage = `url('${imgUrl}')`;
      }
      stepBox.appendChild(visual);
    } else {

      const iconWrapper = document.createElement('div');
      iconWrapper.className = 'bw-slot-card__plus-icon';
      const primaryColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--bundle-global-primary-button').trim() || '#1e3a8a';
      iconWrapper.style.setProperty('--bw-slot-icon-color', primaryColor);
      this._appendSlotIcon(iconWrapper);
      stepBox.appendChild(iconWrapper);
    }

    const slotNumber = instanceIndex + 1;
    const label = document.createElement('p');
    label.className = 'step-name bw-slot-card__label';
    label.textContent = isModalSlotTemplate ? `Product ${slotNumber}` : step.name || `Step ${stepIndex + 1}`;
    stepBox.appendChild(label);

    stepBox.addEventListener('click', () => this.openModal(stepIndex));

    return stepBox;
  },

  _appendModalSlotEmptyCards(target, step, stepIndex, selectedCount = 0) {
    const rawRequired = Number(step?.conditionValue) || 1;
    const operator = String(step?.conditionOperator || '').toLowerCase();
    const requiredCount = ['greater_than', 'gt', '>'].includes(operator)
      ? rawRequired + 1
      : rawRequired;
    const isOpenEnded = [
      'greater_than',
      'gt',
      '>',
      'greater_than_or_equal_to',
      'greater_than_equal_to',
      'gte',
      '>=',
    ].includes(operator);
    let emptyCount = Math.max(0, requiredCount - selectedCount);

    if (isOpenEnded) {
      this._modalSlotCapacityByStep ||= {};
      const capacity = Math.max(
        this._modalSlotCapacityByStep[stepIndex] || 0,
        requiredCount,
        selectedCount + 1
      );
      this._modalSlotCapacityByStep[stepIndex] = capacity;
      emptyCount = capacity - selectedCount;
    }

    for (let offset = 0; offset < emptyCount; offset += 1) {
      target.appendChild(this.createEmptyStateCard(
        step,
        stepIndex,
        selectedCount + offset
      ));
    }
  },

  _appendSlotIcon(iconWrapper) {
    iconWrapper.innerHTML = `<svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.202 3.06152V37.0082M37.1753 20.0348H3.22864" stroke="currentColor" stroke-width="5.09199" stroke-linecap="square" stroke-linejoin="round"/>
    </svg>`;
  },
};

function getCascadeSelectedDrawerState(selectedEntries = [], isOpen = false) {
  const entries = Array.isArray(selectedEntries) ? selectedEntries : [];
  const selectedQuantity = entries.reduce((sum, entry) => sum + Math.max(0, Number(entry?.quantity || 0)), 0);
  const hasSelectedProducts = selectedQuantity > 0;

  return {
    isOpen: Boolean(isOpen && hasSelectedProducts),
    selectedQuantity,
    hasSelectedProducts,
  };
}

function getNextCascadeSelectedDrawerExpandedState({
  hasSelectedProducts = false,
  isExpanded = false,
  onEmpty = null,
} = {}) {
  if (!hasSelectedProducts) {
    if (typeof onEmpty === 'function') onEmpty();
    return false;
  }
  return !isExpanded;
}

function getCascadeSelectedDrawerHeight({
  list = null,
  drawer = null,
  viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0,
} = {}) {
  if (!list) return 0;

  const borderTopWidth = drawer && typeof getComputedStyle === 'function'
    ? Number.parseFloat(getComputedStyle(drawer).borderTopWidth || '0')
    : 0;
  const borderOffset = Number.isFinite(borderTopWidth) ? borderTopWidth : 0;
  const listStyle = typeof getComputedStyle === 'function' ? getComputedStyle(list) : {};
  const selectedRows = typeof list.querySelectorAll === 'function'
    ? Array.from(list.querySelectorAll('.bw-ppb-cascade-selected-item, .gbbMixCascadeBundleCartItem'))
    : [];
  const title = typeof list.querySelector === 'function'
    ? list.querySelector('.bw-ppb-cascade-selected-list-title, .gbbMixCascadeCartSectionHeading')
    : null;
  const rowGap = Number.parseFloat(listStyle.rowGap || listStyle.gap || '0');
  const paddingTop = Number.parseFloat(listStyle.paddingTop || '0');
  const visibleRowsLimit = 3;
  let visibleRowsHeight = Number.POSITIVE_INFINITY;

  if (selectedRows.length >= visibleRowsLimit && title) {
    const visibleRows = selectedRows.slice(0, visibleRowsLimit);
    const titleHeight = title.getBoundingClientRect?.().height || 0;
    const rowHeights = visibleRows.reduce((sum, row) => (
      sum + (row.getBoundingClientRect?.().height || 0)
    ), 0);
    const gap = Number.isFinite(rowGap) ? rowGap : 0;
    const top = Number.isFinite(paddingTop) ? paddingTop : 0;
    visibleRowsHeight = top
      + titleHeight
      + gap
      + rowHeights
      + (gap * Math.max(0, visibleRows.length - 1))
      + borderOffset;
  }

  const viewportLimit = Math.round(Number(viewportHeight || 0) * 0.6) || Number.POSITIVE_INFINITY;

  return Math.min(list.scrollHeight + borderOffset, visibleRowsHeight, viewportLimit, 420);
}

function prepareCascadeSelectedProductDisplay({
  product = {},
  variantId = '',
  quantity = 1,
  formatPrice = null,
} = {}) {
  const normalizedQuantity = Math.max(1, Number(quantity || 1));
  const title = product.title || product.parentTitle || '';
  const variantTitle = normalizeSelectedRowVariantTitle(product, title);
  const amount = Number(product.price);
  const priceText = product.priceText || (
    Number.isFinite(amount) && typeof formatPrice === 'function'
      ? formatPrice(amount)
      : ''
  );

  return {
    ...product,
    variantId,
    quantity: normalizedQuantity,
    title: `${title} x ${normalizedQuantity}`,
    variantTitle,
    priceText,
    quantityLabel: `x ${normalizedQuantity}`,
  };
}

function normalizeSelectedRowVariantTitle(product, title) {
  const variantTitle = product.variantTitle && product.variantTitle !== 'Default Title'
    ? String(product.variantTitle).trim()
    : '';
  if (!variantTitle) return '';

  const normalizedTitle = String(title || '').trim();
  if (normalizedTitle.endsWith(` - ${variantTitle}`)) return '';

  return variantTitle;
}

function shouldMountCascadeAddToCartInFooter(addToCartButton, footerElement) {
  return Boolean(addToCartButton && footerElement && addToCartButton.parentElement !== footerElement);
}

function formatCascadeDiscountPercentage(value) {
  const percentage = Number(value || 0);
  if (!Number.isFinite(percentage) || percentage <= 0) return '';

  return Number.isInteger(percentage)
    ? String(percentage)
    : String(Number(percentage.toFixed(2)));
}

function getCascadeAddToCartButtonContent({
  label = '',
  finalPriceText = '',
  totalPriceText = '',
  discountAmountText = '',
  discountInfo = null,
} = {}) {
  const hasDiscount = Boolean(discountInfo?.hasDiscount);
  const discountMethod = discountInfo?.discountMethod || '';
  const appliedRuleValue = Number(discountInfo?.applicableRule?.discountValue || 0);
  const discountPercentage = appliedRuleValue || Number(discountInfo?.discountPercentage || 0);
  let discountPillText = '';

  if (hasDiscount && discountMethod === 'percentage_off') {
    const percentText = formatCascadeDiscountPercentage(discountPercentage);
    discountPillText = percentText ? `${percentText}% off` : '';
  } else if (hasDiscount && discountAmountText) {
    discountPillText = `${discountAmountText} off`;
  }

  return {
    label,
    separator: '\u2022',
    finalPriceText,
    compareAtPriceText: hasDiscount ? totalPriceText : '',
    discountPillText,
  };
}

const cascadeTemplateMethods = {
  _isProductPageCascadeTemplate() {
    const config = resolveProductPageTemplateConfig({
      templateType: this._getProductPageTemplateType(),
      designPreset: this._getProductPageDesignPreset(),
      renderFilledSlotsAsHorizontalStacked: this.selectedBundle?.renderFilledSlotsAsHorizontalStacked,
    });

    return config?.id === 'LIST';
  },

  _getCascadeAddToCartButtonContent(options = {}) {
    return getCascadeAddToCartButtonContent(options);
  },

  _renderCascadeAddToCartButtonContent(button, content = {}) {
    if (!button) return;
    button.textContent = '';

    const appendPart = (tagName, className, text, { hidden = false } = {}) => {
      if (!text) return null;
      const part = document.createElement(tagName);
      part.className = className;
      part.textContent = text;
      if (hidden) {
        part.hidden = true;
        part.setAttribute('aria-hidden', 'true');
      }
      button.appendChild(part);
      return part;
    };

    appendPart('span', 'bw-ppb-cascade-add-to-cart-label', content.label);
    appendPart('span', 'bw-ppb-cascade-add-to-cart-separator', content.separator);
    appendPart('span', 'bw-ppb-cascade-add-to-cart-price', content.finalPriceText);
    appendPart('span', 'bw-ppb-cascade-add-to-cart-compare', content.compareAtPriceText, { hidden: true });
    appendPart('span', 'bw-ppb-cascade-add-to-cart-discount-pill', content.discountPillText);
  },

  _getSelectedProductEntries() {
    return getSelectedProductEntries({
      selectedProducts: this.selectedProducts,
      stepProductData: this.stepProductData,
    }, {
      expandProductsByStep: (products) => this.expandProductsByVariant(products || []),
      normalizeSelectionKey: (value) => this.normalizeSelectionKey(value),
    });
  },

  _getCascadeFooterMessage() {
    const displayOptions = this.selectedBundle?.messaging?.displayOptions;
    const pbConfig = displayOptions?.progressBar;
    const rules = this.selectedBundle?.pricing?.rules || [];

    if (rules.length === 0 || !this.selectedBundle?.pricing?.enabled) return '';

    const { totalQuantity, totalPrice, unitPrices } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData,
      this.selectedBundle?.steps
    );
    const discountInfo = PricingCalculator.calculateDiscount(this.selectedBundle, totalPrice, totalQuantity, unitPrices);
    const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);
    const nextRule = PricingCalculator.getNextDiscountRule?.(this.selectedBundle, totalQuantity, totalPrice) || null;
    const messageType = nextRule ? 'progress' : 'success';
    const fallbackTemplate = messageType === 'success'
      ? (pbConfig?.successText || this.selectedBundle.messaging?.successTemplate || 'You got {discountText}!')
      : (pbConfig?.progressText || this.selectedBundle.messaging?.progressTemplate || 'Add {conditionText} more to get {discountText}');
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const variables = TemplateManager.createDiscountVariables(
      this.selectedBundle,
      totalPrice,
      totalQuantity,
      combinedDiscountInfo,
      currencyInfo,
      { messageType }
    );
    const template = TemplateManager.getDiscountMessageTemplate({
      bundle: this.selectedBundle,
      totalQuantity,
      totalPrice,
      discountInfo: combinedDiscountInfo,
      messageType,
      fallbackTemplate,
      locale: window.Shopify?.locale,
    });

    return TemplateManager.replaceVariables(template, variables);
  },

  _renderCascadeFooter(el) {
    el.className = 'bundle-footer-messaging bw-ppb-cascade-footer wpbMixCascadeFooterWrapper wpbMixCascadeFooterWrapper--bundleATCBtnV2 wpbMixCascadeFooterWrapper--cartDrawerUI';
    el.style.display = '';
    el.style.cssText = '';

    const selectedEntries = this._getSelectedProductEntries();
    const { totalQuantity, totalPrice, unitPrices } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData,
      this.selectedBundle?.steps
    );
    if (!this.cascadeSelectedDrawerState) {
      this.cascadeSelectedDrawerState = { isOpen: false };
    }
    const drawerState = getCascadeSelectedDrawerState(
      selectedEntries,
      this.cascadeSelectedDrawerState.isOpen,
    );
    const drawer = document.createElement('div');
    drawer.className = `bw-ppb-cascade-selected-drawer wpbMixCascadeCartDrawerContainer${drawerState.isOpen ? ' bw-ppb-cascade-selected-drawer--open gbbMixCascadeCartDrawerContainer--open' : ''}`;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'bw-ppb-cascade-selected-toggle wpbMixCascadeSelectedItemsInCartWrappper';
    toggle.setAttribute('aria-expanded', drawerState.isOpen ? 'true' : 'false');
    toggle.innerHTML = `
      <span class="bw-ppb-cascade-selected-toggle-chevron gbbMixCascadeCartChevronIcon" aria-hidden="true"></span>
      <span class="bw-ppb-cascade-selected-toggle-label wpbMixCascadeCartDrawerBtnText">${ComponentGenerator.escapeHtml(this._resolveText('viewBundleItems', 'View Bundle Items'))}</span>
      <span class="bw-ppb-cascade-selected-toggle-count wpbMixCascadeSelectedItemsInCart">${drawerState.selectedQuantity}</span>
    `;
    drawer.appendChild(toggle);

    let list = null;
    if (drawerState.hasSelectedProducts) {
      list = document.createElement('div');
      list.className = 'bw-ppb-cascade-selected-list wpbMixCascadeCartItemsWrapper';

      const title = document.createElement('div');
      title.className = 'bw-ppb-cascade-selected-list-title gbbMixCascadeCartSectionHeading wpbMixCascadeCartItemsTitle';
      title.dataset.sectionId = 'selectedProducts';
      title.innerHTML = `
        <span class="bw-ppb-cascade-selected-list-title-text gbbMixCascadeCartSectionHeadingTitle">${ComponentGenerator.escapeHtml(this._resolveText('bundleCartSelectedProductsText', 'Selected Products'))}</span>
        <span class="bw-ppb-cascade-selected-list-title-line gbbMixCascadeCartSectionHeadingLine" aria-hidden="true"></span>
      `;
      list.appendChild(title);

      selectedEntries.forEach(({ stepIndex, variantId, quantity, product }) => {
        const item = document.createElement('div');
        item.innerHTML = renderSelectedProductRow(prepareCascadeSelectedProductDisplay({
          product,
          variantId,
          quantity,
          formatPrice: (amount) => CurrencyManager.convertAndFormat(amount, CurrencyManager.getCurrencyInfo()),
        }), {
          className: 'bw-ppb-cascade-selected-item wpbMixCascadeBundleCartItem',
        }).trim();
        const row = item.firstElementChild;
        row?.querySelector('[data-action="remove-selected-product"]')?.addEventListener('click', () => {
          this.removeProductFromSelection(stepIndex, variantId);
        });
        if (row) list.appendChild(row);
      });
      drawer.appendChild(list);
    }

    const setDrawerExpanded = (isExpanded) => {
      const nextExpanded = Boolean(isExpanded && drawerState.hasSelectedProducts);
      let maxDrawerHeight = 0;
      drawer.classList.toggle('bw-ppb-cascade-selected-drawer--open', nextExpanded);
      drawer.classList.toggle('gbbMixCascadeCartDrawerContainer--open', nextExpanded);
      if (list && nextExpanded) {
        maxDrawerHeight = getCascadeSelectedDrawerHeight({ list, drawer });
        drawer.style.setProperty('--bw-ppb-cascade-selected-drawer-height', `${maxDrawerHeight}px`);
      }
      toggle.setAttribute('aria-expanded', nextExpanded ? 'true' : 'false');
      this.cascadeSelectedDrawerState.isOpen = nextExpanded;
      this.cascadeSelectedDrawerState.height = nextExpanded ? maxDrawerHeight : 0;
    };
    toggle.addEventListener('click', () => {
      setDrawerExpanded(getNextCascadeSelectedDrawerExpandedState({
        hasSelectedProducts: drawerState.hasSelectedProducts,
        isExpanded: drawer.classList.contains('bw-ppb-cascade-selected-drawer--open'),
        onEmpty: () => ToastManager.show('Add items to your bundle first'),
      }));
    });

    el.appendChild(drawer);
    const previousDrawerHeight = Math.max(0, Number(this.cascadeSelectedDrawerState.height || 0));
    if (drawerState.isOpen && previousDrawerHeight > 0) {
      drawer.style.setProperty('--bw-ppb-cascade-selected-drawer-height', `${previousDrawerHeight}px`);
      const scheduleFrame = typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
        ? window.requestAnimationFrame.bind(window)
        : (callback) => callback();
      scheduleFrame(() => setDrawerExpanded(true));
    } else {
      setDrawerExpanded(drawerState.isOpen);
    }

    const message = this._getCascadeFooterMessage();
    if (message) {
      const messageEl = document.createElement('p');
      messageEl.className = 'bw-ppb-cascade-discount-message';
      messageEl.textContent = message;
      el.appendChild(messageEl);
    }

    const addToCartButton = this.elements?.addToCartButton;
    if (this._usesCascadeStepFlow?.()) {
      const actions = document.createElement('div');
      actions.className = 'bw-ppb-cascade-footer-actions';

      if (this.currentStepIndex > 0) {
        const backButton = document.createElement('button');
        backButton.type = 'button';
        backButton.className = 'bw-ppb-cascade-step-back';
        backButton.setAttribute('aria-label', 'Previous step');
        backButton.innerHTML = '<span aria-hidden="true"></span>';
        backButton.addEventListener('click', () => this.navigateCascadeStep(-1));
        actions.appendChild(backButton);
      }

      if (addToCartButton) actions.appendChild(addToCartButton);
      el.appendChild(actions);
    } else if (shouldMountCascadeAddToCartInFooter(addToCartButton, el)) {
      el.appendChild(addToCartButton);
    }
  },
};

const cogniveTemplateMethods = {
  _isProductPageGridTemplate() {
    const config = resolveProductPageTemplateConfig({
      templateType: this._getProductPageTemplateType(),
      designPreset: this._getProductPageDesignPreset(),
      renderFilledSlotsAsHorizontalStacked: this.selectedBundle?.renderFilledSlotsAsHorizontalStacked,
    });

    return config?.id === 'GRID';
  },

  _isProductPageCogniveTemplate() {
    return this._isProductPageGridTemplate();
  },

  _usesCompactInpageProductCards() {
    return Boolean(this._isProductPageCascadeTemplate?.() || this._isProductPageGridTemplate());
  },

  _renderCogniveFooter(el) {
    this._renderCascadeFooter(el);
  },
};

function getWindow() {
  return typeof window === 'undefined' ? null : window;
}

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (['true', 'checked', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', 'unchecked', '0', 'off', 'no'].includes(normalized)) return false;
  return undefined;
}

function parseControlBoolean(controls, labels, fallback) {
  if (!controls || typeof controls !== 'object') {
    return fallback;
  }

  for (const label of labels) {
    if (!(label in controls)) continue;
    const parsed = parseBoolean(controls[label]);
    if (parsed === undefined) continue;
    return parsed;
  }
  return fallback;
}

const ProductPageConfigLifecycleMethods = {
_getProductPageControls() {
  return this.config.controlsSettings?.activeControls
    || this.config.controlsSettings?.settingsControls?.productPage
    || null;
},

_isProductCardClickAddEnabled() {
  const controls = this._getProductPageControls();
  return parseControlBoolean(
    controls,
    [
      'addToCartWhenProductCardClicked',
      'addToBundleOnProductCardClicked',
      'addToBundleOnProductCardClick',
    ],
    false,
  ) === true;
},

_isConditionValidationEnabled() {
  const controls = this._getProductPageControls();
  return parseControlBoolean(controls, ['validateConditionsBeforeAddToCart'], true) !== false;
},

_runControlsScript(script) {
  if (!script || typeof script !== 'string') return;
  const runtimeWindow = getWindow();
  if (!runtimeWindow) return;
  try {
    new Function(script).call(runtimeWindow);
  } catch (_) {

  }
},

_handlePostAddToCartAction(actionConfig) {
  const controls = this._getProductPageControls();
  const redirect = actionConfig || controls?.redirect || {};
  this._runControlsScript(redirect.executeScript);
  this._runControlsScript(controls?.scripts?.executeCustomScript);

  const action = redirect.action || 'cart';
  if (action === 'checkout') {
    const runtimeWindow = getWindow();
    if (!runtimeWindow) return;

    setTimeout(() => {
      runtimeWindow.location.href = '/checkout';
    }, 1000);
    return;
  }

  if (action === 'side_cart') {
    const selector = redirect.selectors?.sideCartOpenButton
      || controls?.selectors?.sideCartOpenButton
      || controls?.selectors?.sideCart;
    if (selector) {
      const sideCartTrigger = document.querySelector(selector);
      if (sideCartTrigger) {
        setTimeout(() => sideCartTrigger.click(), 300);
        return;
      }
    }
  }

  setTimeout(() => {
    const runtimeWindow = getWindow();
    if (!runtimeWindow) return;

    runtimeWindow.location.href = '/cart';
  }, 1000);
},

parseConfiguration() {
  const runtimeWindow = getWindow();
  const dataset = this.container.dataset;
  const existingConfig = this.config || {};
  const controlsSettings = existingConfig.controlsSettings || null;
  const controls = this._getProductPageControls() || {};
  const datasetShowQuantity = dataset.showQuantitySelectorOnCard !== 'false';
  const showQuantitySelectorOnCard = parseControlBoolean(
    controls,
    ['displayQuantityInput', 'displayQuantitySelectorOnCard', 'displayQuantity'],
    datasetShowQuantity,
  );
  const displaySeeMoreLink = parseControlBoolean(
    controls,
    ['displaySeeMoreLink', 'displaySeeMore'],
    undefined,
  );
  const expandProductCardOnHover = parseControlBoolean(
    controls,
    ['expandProductCardOnHover', 'productCardHoverExpansion'],
    false,
  );

  this.config = {
    ...existingConfig,
    bundleId: dataset.bundleId || null,
    isContainerProduct: dataset.isContainerProduct === 'true',
    containerBundleId: dataset.containerBundleId || null,
    hideDefaultButtons: dataset.hideDefaultButtons === 'true',
    showStepNumbers: dataset.showStepNumbers !== 'false',

    showQuantitySelectorOnCard,

    displaySeeMoreLink,
    expandProductCardOnHover,
    controlsSettings,

    discountTextTemplate: 'Add {conditionText} to get {discountText}',
    successMessageTemplate: 'Congratulations! You got {discountText}!',
    currentProductId: runtimeWindow ? runtimeWindow.currentProductId : null,
    currentProductGid: runtimeWindow ? runtimeWindow.currentProductGid : null,
    currentProductHandle: runtimeWindow ? runtimeWindow.currentProductHandle : null,
    currentProductCollections: runtimeWindow ? runtimeWindow.currentProductCollections : null
  };
},

_parseBundleConfigPayload(rawValue) {
    if (!rawValue || rawValue.trim() === '' || rawValue === 'null' || rawValue === 'undefined') {
      return null;
    }

    try {
      const parsed = JSON.parse(rawValue);
      return typeof parsed === 'object' && parsed !== null ? parsed : null;
    } catch (_error) {
      return null;
    }
  },

  _isBundleConfigBootstrapPayload(payload) {
    return !!(
      payload &&
      typeof payload === 'object' &&
      payload.v &&
      payload.type === 'product_page' &&
      typeof payload.id === 'string' &&
      payload.id.trim() !== ''
    );
  },

  async loadBundleData() {
    let bundleData = null;
    const bundleType = this.container.dataset.bundleType;
    const bundleId = this.container.dataset.bundleId;
    const configValue = this._parseBundleConfigPayload(this.container.dataset.bundleConfig);

    if (bundleType === 'product_page' && this._isBundleConfigBootstrapPayload(configValue)) {
      const RETRY_DELAY_MS = 3000;
      const RETRYABLE_STATUSES = new Set([503, 504]);

      const fetchBundleData = async () => {
        const apiUrl = `/apps/product-bundles/api/bundle/${encodeURIComponent(configValue.id)}.json`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          let errorDetails = `${response.status} ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorDetails = JSON.stringify(errorData);
          } catch (_) {

          }
          const err = new Error(`API request failed: ${errorDetails}`);
          err.status = response.status;
          throw err;
        }

        const data = await response.json();
        if (data.success && data.bundle) {
          return { [data.bundle.id]: data.bundle };
        }

        throw new Error('Invalid API response structure');
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
      } catch (_error) {
      }
    }

    if (!bundleData || (typeof bundleData === 'object' && Object.keys(bundleData).length === 0)) {
      const runtimeWindow = getWindow();
      const isThemeEditor = runtimeWindow?.Shopify?.designMode ||
                           runtimeWindow?.isThemeEditorContext ||
                           runtimeWindow?.location?.pathname?.includes('/editor') ||
                           runtimeWindow?.location?.search?.includes('preview_theme_id');

      const bundleIdFromDataset = bundleId || this.container.dataset.bundleId;

      if (isThemeEditor && bundleIdFromDataset) {
        this.showThemeEditorPreview(bundleIdFromDataset);
        return;
      }

      this.container.style.display = 'none';
      return;
    }

    this.bundleData = bundleData;
  },

selectBundle() {
  this.selectedBundle = ppbExpandSingleStepCategoriesAsSteps(
    BundleDataManager.selectBundle(this.bundleData, this.config)
  );

  this.widgetStyle = 'bottom-sheet';

  this.updateMessagesFromBundle();
},

_getProductPageTemplateType() {
  const templateType = this.selectedBundle?.bundleDesignTemplate;
  return templateType === 'PDP_INPAGE' || templateType === 'PDP_MODAL'
    ? templateType
    : 'PDP_MODAL';
},

_getProductPageDesignPreset() {
  const templateType = this._getProductPageTemplateType();
  const rawPresetId = this.selectedBundle?.bundleDesignTemplateData?.templateId
    || this.selectedBundle?.bundleDesignPresetId
    || this.selectedBundle?.templateId;
  const preset = typeof rawPresetId === "string" ? rawPresetId.trim().toUpperCase() : '';

  if (preset) {
    return preset;
  }

  return templateType === 'PDP_MODAL' ? 'MODAL' : 'CASCADE';
},

_isProductPageInpageTemplate() {
  return this._getProductPageTemplateType() === 'PDP_INPAGE';
},

_shouldShowProductComparedAtPrice() {
  const controls = this._getProductPageControls();
  const controlSetting = parseControlBoolean(
    controls,
    ['showCompareAtPrices', 'showProductComparedAtPrice', 'Display Compare At Price', 'displayCompareAtPrices'],
    undefined,
  );

  if (controlSetting === true || controlSetting === false) {
    return controlSetting;
  }

  return this.selectedBundle?.showProductComparedAtPrice === true;
},

ensureProductPageTemplateStylesheet(templateType, designPreset) {
  const templateKey = String(templateType || 'PDP_MODAL').trim().toUpperCase() || 'PDP_MODAL';
  const presetKey = String(designPreset || '').trim().toUpperCase();
  const runtimeWindow = getWindow();
  const urls = runtimeWindow?.__WOLFPACK_PPB_TEMPLATE_CSS_URLS__ || {};
  const href = templateKey === 'PDP_MODAL'
    ? urls[presetKey] || urls.MODAL || urls.SIMPLIFIED
    : urls[presetKey] || urls.CASCADE || urls.COGNIVE;

  if (!href || typeof document === 'undefined') return Promise.resolve();

  if (!this._ppbTemplateStylesheetPromises) {
    this._ppbTemplateStylesheetPromises = new Map();
  }

  const assetKey = templateKey === 'PDP_MODAL' ? 'MODAL' : presetKey;
  const pendingPromise = this._ppbTemplateStylesheetPromises.get(href);
  if (pendingPromise) {
    return pendingPromise;
  }

  const existingLink = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find((link) =>
    link.getAttribute('href') === href
    || link.href === href
    || link.dataset.wpbPpbTemplateCss === assetKey
  );

  const markLoaded = (link) => {
    if (link instanceof HTMLLinkElement) {
      link.dataset.wpbPpbTemplateCssLoaded = '1';
    }
  };

  const isStylesheetLoaded = (link) => {
    if (!link) return false;
    if (link.dataset?.wpbPpbTemplateCssLoaded === '1') return true;

    try {
      return !!link.sheet;
    } catch (_error) {
      return false;
    }
  };

  if (existingLink) {
    if (isStylesheetLoaded(existingLink)) {
      markLoaded(existingLink);
      return Promise.resolve();
    }

    const promise = new Promise((resolve) => {
      const done = () => {
        markLoaded(existingLink);
        this._ppbTemplateStylesheetPromises.delete(href);
        resolve();
      };

      existingLink.addEventListener('load', done, { once: true });
      existingLink.addEventListener('error', done, { once: true });
    });

    this._ppbTemplateStylesheetPromises.set(href, promise);
    return promise;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.dataset.wpbPpbTemplateCss = assetKey;

  const promise = new Promise((resolve) => {
    const done = () => {
      markLoaded(link);
      this._ppbTemplateStylesheetPromises.delete(href);
      resolve();
    };

    link.addEventListener('load', done, { once: true });
    link.addEventListener('error', done, { once: true });
  });

  this._ppbTemplateStylesheetPromises.set(href, promise);
  document.head.appendChild(link);

  return promise;
},

_markProductPageTemplate() {
  if (!this.container || !this.elements?.stepsContainer || !this.selectedBundle) return;

  const templateType = this._getProductPageTemplateType();
  const designPreset = this._getProductPageDesignPreset();

  this.container.classList.toggle(
    'wpbMixPageWrapper',
    templateType === 'PDP_INPAGE' && designPreset === 'CASCADE'
  );
  this.container.classList.toggle(
    'wpbMixProductPageWrapperV2',
    templateType === 'PDP_INPAGE' && designPreset === 'CASCADE'
  );

  this.container.dataset.ppbTemplateType = templateType;
  this.container.dataset.ppbDesignPreset = designPreset;
  this.container.setAttribute('template-id', designPreset);
  this.container.setAttribute('template-type', templateType);
  this.elements.stepsContainer.dataset.ppbTemplateType = templateType;
  this.elements.stepsContainer.dataset.ppbDesignPreset = designPreset;

  document.body?.setAttribute('wpbmix-template-id', designPreset);
  document.body?.setAttribute('wpbmix-template-type', templateType);
  document.body?.setAttribute('wpb-mix-consolidated-design', 'true');
  void this.ensureProductPageTemplateStylesheet(templateType, designPreset);

  if (templateType === 'PDP_MODAL') {
    const slotOrientation = this._usesVerticalModalSlotLayout() ? 'vertical' : 'horizontal';
    this.container.dataset.ppbSlotOrientation = slotOrientation;
    this.elements.stepsContainer.dataset.ppbSlotOrientation = slotOrientation;
  } else {
    delete this.container.dataset.ppbSlotOrientation;
    delete this.elements.stepsContainer.dataset.ppbSlotOrientation;
  }
},

/** Steps that are neither free gift nor default — require user selection */
get paidSteps() {
  return this.selectedBundle?.steps?.filter(s => !s.isFreeGift && !s.isDefault) ?? [];
},

/** The free gift step, if any */
get freeGiftStep() {
  return this.selectedBundle?.steps?.find(s => s.isFreeGift) ?? null;
},

/** Index of the free gift step, or -1 */
get freeGiftStepIndex() {
  return this.selectedBundle?.steps?.findIndex(s => s.isFreeGift) ?? -1;
},

/** Steps that are pre-filled with a compulsory product */
get defaultStepsList() {
  return this.selectedBundle?.steps?.filter(s => s.isDefault) ?? [];
},

/**
 * True when all paid (non-free-gift, non-default) steps are fully satisfied.
 * Used to unlock the free gift slot.
 */
get isFreeGiftUnlocked() {
  if (!this.selectedBundle) return false;
  return this.selectedBundle.steps.every((step, i) => {
    if (step.isFreeGift || step.isDefault) return true;
    return this.validateStep(i);
  });
},

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
};

const ProductPageDefaultProductMethods = {
initializeDataStructures() {
  const stepsCount = this.selectedBundle.steps.length;

  this.selectedProducts = Array(stepsCount).fill(null).map(() => ({}));
  this.selectedProductCategoryIndexes = Array(stepsCount).fill(null).map(() => ({}));

  this.stepProductData = Array(stepsCount).fill(null).map(() => ([]));
  this._stepFetchFailed = {};

  this.selectedBundle.steps.forEach((step, i) => {
    if (step.isDefault && step.defaultVariantId) {
      const normalizedDefaultVariantId = this.normalizeSelectionKey(step.defaultVariantId);
      if (normalizedDefaultVariantId) {
        this.setSelectedQuantity(i, normalizedDefaultVariantId, 1);
      }
    }
  });
},

_getDirectDefaultProductsData() {
  const data = this.selectedBundle?.defaultProductsData;
  if (!data || data.isDefaultProductsEnabled !== true || !Array.isArray(data.products)) {
    return null;
  }
  return data;
},

_normalizeDirectDefaultProduct(product) {
  const variant = Array.isArray(product.variants) ? product.variants[0] : null;
  const variantId = this.extractId(variant?.variantGraphqlId || variant?.variantId);
  if (!variantId) return null;

  const imageUrl = product.images?.[0]?.originalSrc || product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
  const inventoryQuantity = typeof variant?.inventoryQuantity === 'number'
    ? variant.inventoryQuantity
    : null;
  const price = Number.parseFloat(variant?.price || '0') * 100;
  const requiredQuantity = Number(product.requiredQuantity || 1) || 1;
  const explicitlyUnavailable = variant?.availableForSale === false || variant?.available === false;
  const available = !explicitlyUnavailable;
  const quantityAvailable = inventoryQuantity;

  return {
    id: this.extractId(product.graphqlId || product.productId) || product.productId || variantId,
    title: product.title || '',
    handle: product.handle || '',
    imageUrl,
    price,
    compareAtPrice: null,
    variantId,
    available,
    quantityAvailable,
    currentlyNotInStock: false,
    defaultRequiredQuantity: requiredQuantity,
    variants: [{
      id: variantId,
      title: variant?.title || '',
      price,
      compareAtPrice: null,
      available,
      quantityAvailable,
      currentlyNotInStock: false,
    }],
    images: imageUrl ? [{ src: imageUrl }] : [],
    description: '',
  };
},

_getDirectDefaultProductItems() {
  const data = this._getDirectDefaultProductsData();
  if (!data) return [];
  return data.products
    .map(product => this._normalizeDirectDefaultProduct(product))
    .filter(Boolean);
},

_initDirectDefaultProducts() {
  this.directDefaultProducts = this._getDirectDefaultProductItems();
  if (this.directDefaultProducts.length === 0 || !this.selectedProducts[0]) return;

  this.directDefaultProducts.forEach(product => {
    this.setSelectedQuantity(0, product.variantId, product.defaultRequiredQuantity || 1);
  });
},

async _preloadDirectDefaultProducts() {
  if (this.directDefaultProducts.length === 0 || !this.selectedBundle?.steps?.[0]) return;
  await this.loadStepProducts(0).catch(() => {});
},

_mergeDirectDefaultProductsIntoStep(stepIndex, products) {
  if (stepIndex !== 0 || this.directDefaultProducts.length === 0) return products;
  return products.concat(this.directDefaultProducts);
},

_isDirectDefaultVariant(variantId) {
  const normalizedVariantId = this.extractId(variantId);
  return this.directDefaultProducts.some(product => product.variantId === normalizedVariantId);
},

_getDirectDefaultRequiredQuantity(variantId) {
  const normalizedVariantId = this.extractId(variantId);
  const product = this.directDefaultProducts.find(item => item.variantId === normalizedVariantId);
  return product ? (product.defaultRequiredQuantity || 1) : null;
},

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
},

/**
 * Returns the product object for a default step from stepProductData,
 * matched by defaultVariantId. Returns null when not yet loaded.
 */
_getDefaultStepProduct(stepIndex) {
  const step = this.selectedBundle.steps[stepIndex];
  if (!step?.isDefault || !step.defaultVariantId) return null;
  const products = this.stepProductData[stepIndex] || [];
  const variantId = this.normalizeSelectionKey(step.defaultVariantId);
  return this.findProductBySelectionKey(products, variantId) || products[0] || null;
},

/**
 * Show a helpful preview in theme editor when testing on non-bundle products
 */
};

const ProductPageDomMethods = {
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
      <div style="
        font-size: 48px;
        margin-bottom: 16px;
      ">📦</div>
      <h3 style="
        margin: 0 0 12px 0;
        font-size: 20px;
        font-weight: 600;
      ">Bundle Widget Preview</h3>
      <p style="
        margin: 0 0 8px 0;
        font-size: 14px;
        opacity: 0.9;
      ">
        Bundle ID: <code style="
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 8px;
          border-radius: 4px;
          font-family: monospace;
        ">${bundleId}</code>
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
        <div style="
          font-weight: 600;
          margin-bottom: 8px;
        ">✅ Widget Configured Successfully</div>
        <div style="
          opacity: 0.9;
        ">
          This widget will automatically display on <strong>bundle container products</strong>.
          <br><br>
          <strong>To see it in action:</strong>
          <ol style="
            margin: 8px 0;
            padding-left: 20px;
          ">
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
},

_relocateContainerToProductForm() {
  try {
    if (!this.container || typeof document === 'undefined') return;
    if (this.container.dataset.mountedAfterProductForm === 'true') return;

    const productForm = this._findNativeProductForm();

    if (!productForm) return;

    if (productForm.nextElementSibling !== this.container) {
      productForm.insertAdjacentElement('afterend', this.container);
    }

    this.container.classList.add('bundle-widget-container--product-form-mounted');
    this.container.dataset.mountedAfterProductForm = 'true';
  } catch (_error) {

  }
},

_findNativeProductForm() {
  if (typeof document === 'undefined') return null;

  const selectors = [
    'form[action*="/cart/add"]',
    'product-form form',
    '.product-form form',
    '[data-type="add-to-cart-form"]',
    'form[action^="/cart/add"]'
  ];

  return selectors
    .map(selector => document.querySelector(selector))
    .find(form => form && !form.contains(this.container) && !this.container.contains(form)) || null;
},

_getNativeProductInfoRoot(productForm) {
  return productForm?.closest?.(
    '[id^="ProductInformation-"], .product-details, .group-block-content, .product-information, .product__info-container, .product__info-wrapper, .product__info, product-info, .product'
  ) || productForm?.parentElement || null;
},

_hideNativeProductPrice() {
  try {
    if (!this.container || typeof document === 'undefined') return;

    const productForm = this._findNativeProductForm();
    if (!productForm) return;

    const root = this._getNativeProductInfoRoot(productForm);
    if (!root) return;

    const selectors = [
      '[id^="price-"]',
      '.price.price--large',
      '.product__price',
      '[data-product-price]',
      '.product-price',
      '.price'
    ];

    const priceElements = selectors.flatMap(selector => Array.from(root.querySelectorAll(selector)));
    const uniquePriceElements = Array.from(new Set(priceElements));

    uniquePriceElements
      .filter(element => !this.container.contains(element))
      .filter(element => !element.closest('#bundle-builder-modal'))
      .forEach(element => {
        element.classList.add('wpb-native-product-price--hidden');
        element.setAttribute('data-wpb-native-product-price-hidden', 'true');
        element.style.setProperty('display', 'none', 'important');
      });
  } catch (_error) {

  }
},

setupDOMElements() {
  const modalEl = this.ensureBottomSheet();

  this.elements = {
    defaultProducts: this.container.querySelector('.bw-default-products') || this._createDirectDefaultProductsEl(),
    stepsContainer: this.container.querySelector('.bundle-steps') || this.createStepsContainer(),
    qtyPillsEl: this.container.querySelector('.bw-qty-pills') || this._createQtyPillsEl(),
    footer: this.container.querySelector('.bundle-footer-messaging') || this.createFooter(),
    addToCartButton: this.container.querySelector('.add-bundle-to-cart') || this.createAddToCartButton(),
    dynamicCheckoutVisual: this.container.querySelector('.bw-ppb-dynamic-checkout-visual') || this._createDynamicCheckoutVisual(),
    modal: modalEl,
    bsOverlay: document.getElementById('bw-bs-overlay') || this._createBottomSheetOverlay()
  };

  if (!this.container.querySelector('.bw-default-products')) {
    this.container.appendChild(this.elements.defaultProducts);
  }
  if (!this.container.querySelector('.bundle-steps')) {
    this.container.appendChild(this.elements.stepsContainer);
  }
  if (!this.container.querySelector('.bw-qty-pills')) {
    this.container.appendChild(this.elements.qtyPillsEl);
  }
  if (!this.container.querySelector('.bundle-footer-messaging')) {
    this.container.appendChild(this.elements.footer);
  }
  if (!this.container.querySelector('.add-bundle-to-cart')) {
    this.container.appendChild(this.elements.addToCartButton);
  }
  if (!this.container.querySelector('.bw-ppb-dynamic-checkout-visual')) {
    this.container.appendChild(this.elements.dynamicCheckoutVisual);
  }

  [
    this.elements.defaultProducts,
    this.elements.stepsContainer,
    this.elements.qtyPillsEl,
    this.elements.footer,
    this.elements.addToCartButton,
    this.elements.dynamicCheckoutVisual,
  ].forEach(element => {
    element?.removeAttribute?.('hidden');
    element?.removeAttribute?.('aria-hidden');
  });
},

_createQtyPillsEl() {
  const el = document.createElement('div');
  el.className = 'bw-qty-pills';
  el.style.display = 'none';
  return el;
},

_createDirectDefaultProductsEl() {
  const el = document.createElement('div');
  el.className = 'bw-default-products';
  el.style.display = 'none';
  return el;
},

_createBottomSheetOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'bw-bs-overlay';
  overlay.className = 'bw-bs-overlay';
  document.body.appendChild(overlay);
  return overlay;
},

/**
 * Creates the bottom-sheet panel using the SAME inner DOM structure as ensureModal()
 * so all existing renderModalProducts / renderModalTabs / tab-arrow code works unchanged.
 */
ensureBottomSheet() {
  let panel = document.getElementById('bundle-builder-modal');

  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'bundle-builder-modal';

    panel.className = 'bw-bs-panel bundle-builder-modal';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-hidden', 'true');
    panel.setAttribute('inert', '');
    panel.hidden = true;
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
        <!-- Current-step categories -->
        <div class="bw-bs-category-tabs" hidden></div>
        <!-- Discount / progress messaging -->
        <div class="bw-bs-discount-bar footer-discount-text"></div>
      </div>
      <div class="modal-body bw-bs-body">
        <div class="product-grid bw-bs-product-grid"></div>
      </div>
      <div class="modal-footer bw-bs-footer">
        <!-- Cart count pill (white, floats above nav pill) -->
        <div class="bw-bs-cart-pill">
          <span class="bw-bs-cart-price">
            <span class="total-price-strike"></span>
            <span class="total-price-final">$0.00</span>
          </span>
          <span class="bw-bs-cart-divider"></span>
          <span class="cart-badge-count">0</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M3 4.5C3 4.22386 3.22386 4 3.5 4H5.5C5.73 4 5.93 4.16 5.98 4.385L6.52 7H20.5C20.76 7 20.99 7.14 21.1 7.37C21.21 7.6 21.18 7.88 21.02 8.08L17.02 13.08C16.85 13.29 16.6 13.41 16.33 13.41H8.66L8.07 16H19.5C19.78 16 20 16.22 20 16.5C20 16.78 19.78 17 19.5 17H7.5C7.27 17 7.07 16.84 7.02 16.615L5.02 7.615L4.5 5H3.5C3.22 5 3 4.78 3 4.5ZM8 19.5C8 20.33 7.33 21 6.5 21C5.67 21 5 20.33 5 19.5C5 18.67 5.67 18 6.5 18C7.33 18 8 18.67 8 19.5ZM19 19.5C19 20.33 18.33 21 17.5 21C16.67 21 16 20.33 16 19.5C16 18.67 16.67 18 17.5 18C18.33 18 19 18.67 19 19.5Z" fill="#333"/>
          </svg>
        </div>
        <!-- PREV/NEXT nav pill (navy blue) -->
        <div class="bw-bs-nav-pill">
          <button class="modal-nav-button prev-button bw-bs-nav-btn" aria-label="Previous step">
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

  }

  return panel;
},

setBottomSheetVisibility(isOpen) {
  const modal = this.elements?.modal;
  if (!modal) return;

  if (isOpen) {
    modal.hidden = false;
    modal.removeAttribute('aria-hidden');
    modal.removeAttribute('inert');
    return;
  }

  const hideModal = () => {
    if (modal.classList.contains('bw-bs-panel--open')) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('inert', '');
  };

  if (typeof modal.addEventListener === 'function') {
    modal.addEventListener('transitionend', hideModal, { once: true });
  }
  window.setTimeout(hideModal, 350);
},

createStepsContainer() {
  const container = document.createElement('div');
  container.className = 'bundle-steps';
  return container;
},

createFooter() {
  const footer = document.createElement('div');
  footer.className = 'bundle-footer-messaging';
  footer.style.display = 'none';
  return footer;
},

createAddToCartButton() {
  const button = document.createElement('button');
  button.className = 'add-bundle-to-cart';
  button.textContent = this._resolveText('addToCartButton', 'Add Bundle to Cart');
  button.type = 'button';
  return button;
},

_createDynamicCheckoutVisual() {
  const button = document.createElement('div');
  button.className = 'bw-ppb-dynamic-checkout-visual';
  button.setAttribute('role', 'button');
  button.setAttribute('aria-disabled', 'true');
  button.textContent = 'Buy it now';
  return button;
},

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

};

function resolveDiscountProgressMode(displayOptions = {}) {
  const type = String(displayOptions?.type || '').toLowerCase().trim();
  return type === 'step_based' ? 'step_based' : 'simple';
}

function getDiscountProgressMilestones(bundle, totalPrice = 0, totalQuantity = 0) {
  const pricing = bundle?.pricing || {};
  const rules = Array.isArray(pricing.rules) ? pricing.rules : [];
  const method = String(pricing.method || '');
  const currencyInfo = CurrencyManager.getCurrencyInfo();
  const tierTextByRuleId = pricing?.messages?.tierTextByRuleId || {};

  return rules
    .filter((rule) => rule?.conditionType === 'quantity' || rule?.conditionType === 'amount')
    .sort((a, b) => (Number(a.conditionValue || 0) || 0) - (Number(b.conditionValue || 0) || 0))
    .map((rule) => {
      const ruleId = String(rule?.id || '');
      const threshold = Number(rule?.conditionValue || 0) || 0;
      if (!ruleId || threshold <= 0) return null;

      const savedMilestone = tierTextByRuleId?.[ruleId] || {};
      const boxLabel = savedMilestone?.tierText;
      const boxSubtext = savedMilestone?.tierSubtext;

      const fallbackTitle = rule.conditionType === 'quantity'
        ? `${threshold} Pack`
        : CurrencyManager.convertAndFormat(threshold, currencyInfo);

      const discountValue = Number(rule.discountValue ?? rule.discount?.value ?? 0) || 0;
      let fallbackSubText = '';
      if (discountValue > 0) {
        if (method === 'fixed_amount_off') {
          fallbackSubText = `Save ${CurrencyManager.convertAndFormat(discountValue, currencyInfo)}`;
        } else if (method === 'percentage_off' || method === 'percentage') {
          fallbackSubText = `Save ${Math.round(discountValue)}%`;
        } else {
          fallbackSubText = `Save ${discountValue}`;
        }
      }

      const isReached = rule.conditionType === 'amount'
        ? Number(totalPrice || 0) >= threshold
        : Number(totalQuantity || 0) >= threshold;

      return {
        ruleId,
        title: boxLabel || fallbackTitle,
        subTitle: boxSubtext || fallbackSubText,
        isReached,
      };
    })
    .filter(Boolean)
    .filter((milestone) => milestone.title);
}

function shouldDisableIntermediateProductPageCta({
  isGrid = false,
  currentStepValid = false,
} = {}) {
  return Boolean(!isGrid && !currentStepValid);
}

const ProductPageFooterModalStateMethods = {
renderFullPageLayout() {

  this.renderProductPageLayout();
},

clearStepSelections(stepIndex) {

  this.selectedProducts[stepIndex] = {};
  if (this.selectedProductCategoryIndexes) {
    this.selectedProductCategoryIndexes[stepIndex] = {};
  }
  if (stepIndex === 0 && this.directDefaultProducts.length > 0) {
    this.directDefaultProducts.forEach(product => {
      this.setSelectedQuantity(0, product.variantId, product.defaultRequiredQuantity || 1);
    });
  }
  this._persistSessionSelections?.();

  this._renderDirectDefaultProducts();
  this.renderSteps();
  this.updateAddToCartButton();
  this.updateFooterMessaging();

  ToastManager.show('All selections cleared from this step');
},

renderFooter() {
  const el = this.elements.footer;
  if (!el) return;
  if (this._isProductPageCascadeTemplate()) {
    const openDrawer = el.querySelector('.bw-ppb-cascade-selected-drawer--open, .gbbMixCascadeCartDrawerContainer--open');
    if (openDrawer) {
      const drawerHeight = openDrawer.getBoundingClientRect?.().height || 0;
      this.cascadeSelectedDrawerState = {
        ...(this.cascadeSelectedDrawerState || {}),
        isOpen: true,
        height: drawerHeight,
      };
    }
  }
  el.innerHTML = '';

  if (this._isProductPageCascadeTemplate()) {
    this._renderCascadeFooter(el);
    return;
  }

  if (this._isProductPageGridTemplate()) {
    this._renderCogniveFooter(el);
    return;
  }

  const displayOptions = this.selectedBundle?.messaging?.displayOptions;
  const pbConfig = displayOptions?.progressBar;
  const isDiscountMessagingEnabled = this.config?.showDiscountMessaging !== false;
  if (!isDiscountMessagingEnabled) {
    el.style.display = 'none';
    return;
  }
  if (!pbConfig?.enabled) {
    el.style.display = 'none';
    return;
  }

  const rules = this.selectedBundle?.pricing?.rules || [];
  if (rules.length === 0 || !this.selectedBundle?.pricing?.enabled) {
    el.style.display = 'none';
    return;
  }

  const { totalQuantity, totalPrice, unitPrices } = PricingCalculator.calculateBundleTotal(
    this.selectedProducts,
    this.stepProductData,
    this.selectedBundle?.steps
  );

  const rule = rules[0];
  const discountMethod = PricingCalculator.getDiscountMethod(this.selectedBundle);
  const conditionType = PricingCalculator.getRuleConditionType(rule);
  const current = conditionType === 'quantity' ? totalQuantity : totalPrice;

  const discountInfo = PricingCalculator.calculateDiscount(this.selectedBundle, totalPrice, totalQuantity, unitPrices);
  const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);
  const nextRule = PricingCalculator.getNextDiscountRule(this.selectedBundle, totalQuantity, totalPrice);
  const ruleToUse = combinedDiscountInfo.applicableRule || nextRule || rule;
  const messageType = nextRule ? 'progress' : (combinedDiscountInfo.qualifiesForDiscount ? 'success' : 'progress');
  const met = !nextRule && combinedDiscountInfo.qualifiesForDiscount;
  const conditionTarget = PricingCalculator.getRuleConditionValue(ruleToUse, discountMethod);
  const currencyInfo = CurrencyManager.getCurrencyInfo();
  const variables = TemplateManager.createDiscountVariables(
    this.selectedBundle,
    totalPrice,
    totalQuantity,
    combinedDiscountInfo,
    currencyInfo,
    { rule: ruleToUse, messageType }
  );
  const fallbackTemplate = met
    ? (pbConfig.successText || this.selectedBundle.messaging?.successTemplate || 'You got {discountText}!')
    : (pbConfig.progressText || this.selectedBundle.messaging?.progressTemplate || 'Add {conditionText} more to get {discountText}');
  const progressMode = resolveDiscountProgressMode(pbConfig);
  const milestones = progressMode === 'step_based'
    ? getDiscountProgressMilestones(this.selectedBundle, totalPrice, totalQuantity)
    : [];
  const template = progressMode === 'simple'
    ? TemplateManager.getDiscountMessageTemplate({
      bundle: this.selectedBundle,
      totalQuantity,
      totalPrice,
      discountInfo: combinedDiscountInfo,
      messageType,
      fallbackTemplate,
      locale: window.Shopify?.locale,
    })
    : '';
  const message = progressMode === 'simple'
    ? TemplateManager.replaceVariables(template, variables)
    : '';

  const primary = getComputedStyle(document.documentElement).getPropertyValue('--bundle-global-primary-button').trim() || '#1e3a8a';
  el.style.display = '';
  const progressData = getDiscountProgressData({
    currentValue: current,
    targetValue: conditionTarget,
    message,
  });
  progressData.milestones = milestones;
  const progressMarkup = renderDiscountProgress(progressData, {
    className: `bundle-footer-messaging bw-ppb-discount-progress${met ? ' bw-ppb-discount-progress--met' : ''}`,
    messageClassName: 'bw-ppb-discount-progress__message',
    trackClassName: 'bw-ppb-discount-progress__track',
    fillClassName: 'bw-ppb-discount-progress__fill',
    milestoneListClassName: 'bw-discount-progress__milestones',
    milestoneClassName: 'bw-discount-progress__milestone',
    milestoneReachedClassName: 'bw-discount-progress__milestone--reached',
    milestoneTitleClassName: 'bw-discount-progress__milestone-title',
    milestoneSubtitleClassName: 'bw-discount-progress__milestone-subtitle',
    renderInlineSubtitles: false,
    renderSubtitleList: false,
    mode: progressMode === 'simple' ? 'bar' : 'stepped',
  });
  const modeClassName = progressMode === 'simple'
    ? 'bw-discount-progress--mode-bar'
    : 'bw-discount-progress--mode-stepped';
  el.className = `bundle-footer-messaging bw-ppb-discount-progress${met ? ' bw-ppb-discount-progress--met' : ''} ${modeClassName}`;
  el.innerHTML = progressMarkup;
  el.style.setProperty('--bw-discount-progress-color', primary);
},

updateFooterMessaging() {
  this.renderFooter();
},

renderQuantityOptionPills() {
  const el = this.elements.qtyPillsEl;
  if (!el) return;
  el.innerHTML = '';

  const displayOptions = this.selectedBundle?.messaging?.displayOptions;
  const qtyOpts = displayOptions?.bundleQuantityOptions;
  const rules = this.selectedBundle?.pricing?.rules || [];

  if (!qtyOpts?.enabled || rules.length === 0) {
    el.style.display = 'none';
    return;
  }

  el.style.display = 'flex';

  const primary = getComputedStyle(document.documentElement).getPropertyValue('--bundle-global-primary-button').trim() || '#1e3a8a';
  el.style.setProperty('--bw-qty-pill-active-color', primary);
  const defaultIndex = qtyOpts.defaultRuleIndex ?? 0;

  rules.forEach((rule, index) => {
    const { label, subtext } = this.getProductPageTierPillContent(rule, index, qtyOpts);
    const isActive = index === defaultIndex;

    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'bw-qty-pill' + (isActive ? ' bw-qty-pill--active' : '');

    const labelEl = document.createElement('span');
    labelEl.className = 'bw-qty-pill__label';
    labelEl.textContent = label;
    pill.appendChild(labelEl);

    if (subtext) {
      const subtextEl = document.createElement('span');
      subtextEl.className = 'bw-qty-pill__subtext';
      subtextEl.textContent = subtext;
      pill.appendChild(subtextEl);
    }

    pill.addEventListener('click', () => {
      el.querySelectorAll('.bw-qty-pill').forEach(p => {
        p.classList.remove('bw-qty-pill--active');
      });
      pill.classList.add('bw-qty-pill--active');

      this.renderFooter();
      this.updateAddToCartButton();
    });

    el.appendChild(pill);
  });
},

getProductPageTierPillContent(rule, index, qtyOpts) {
  const pricing = this.selectedBundle?.pricing || {};
  const bundleQuantityOptions = this.selectedBundle?.messaging?.displayOptions?.bundleQuantityOptions || qtyOpts || {};
  const optionsByRuleId = bundleQuantityOptions.optionsByRuleId || {};
  const tierTextByRuleId = pricing.messages?.tierTextByRuleId || {};
  const ruleId = String(rule?.id || '');
  const ruleOption = ruleId ? (optionsByRuleId[ruleId] || tierTextByRuleId[ruleId]) : null;

  const configuredLabel =
    (typeof ruleOption?.label === 'string' && ruleOption.label.trim()) ||
    (typeof ruleOption?.tierText === 'string' && ruleOption.tierText.trim()) ||
    '';
  const configuredSubtext =
    (typeof ruleOption?.subtext === 'string' && ruleOption.subtext.trim()) ||
    (typeof ruleOption?.tierSubtext === 'string' && ruleOption.tierSubtext.trim()) ||
    '';

  if (configuredLabel || configuredSubtext) {
    return {
      label: configuredLabel || configuredSubtext,
      subtext: configuredSubtext && configuredSubtext !== configuredLabel ? configuredSubtext : '',
    };
  }

  const indexedLabel = qtyOpts?.labels?.[index] || '';
  const indexedSubtext = qtyOpts?.subtexts?.[index] || '';
  if (indexedLabel || indexedSubtext) {
    return {
      label: indexedLabel || indexedSubtext,
      subtext: indexedSubtext && indexedSubtext !== indexedLabel ? indexedSubtext : '',
    };
  }

  const currencyInfo = CurrencyManager.getCurrencyInfo();
  const threshold = Number(rule?.conditionValue || 0) || 0;
  const discountValue = Number(rule?.discountValue || 0) || 0;
  const thresholdText = rule?.conditionType === 'amount'
    ? CurrencyManager.convertAndFormat(threshold, currencyInfo)
    : String(threshold || index + 1);
  const discountText = pricing.method === BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF
    ? (discountValue ? `${discountValue}%` : '')
    : (discountValue ? CurrencyManager.convertAndFormat(discountValue, currencyInfo) : '');

  return {
    label: discountText ? `${thresholdText} / ${discountText}` : thresholdText,
    subtext: '',
  };
},

updateAddToCartButton() {
  const { totalPrice, totalQuantity, unitPrices } = PricingCalculator.calculateBundleTotal(
    this.selectedProducts,
    this.stepProductData,
    this.selectedBundle?.steps
  );

  const discountInfo = PricingCalculator.calculateDiscount(
    this.selectedBundle,
    totalPrice,
    totalQuantity,
    unitPrices
  );
  const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);

  const button = this.elements.addToCartButton;
  const usesCascadeStepFlow = this._usesCascadeStepFlow?.() === true;
  const isIntermediateCascadeStep = usesCascadeStepFlow
    && this.currentStepIndex < this.selectedBundle.steps.length - 1;
  const isConditionValidationEnabled = this._isConditionValidationEnabled?.() !== false;

  const allStepsValid = isConditionValidationEnabled ? this.selectedBundle.steps.every((step, index) => {
    if (step.isFreeGift || step.isDefault) return true;
    return this.validateStep(index);
  }) : true;

  const boxSelectionState = this.validateProductPageBoxSelectionCheckout
    ? this.validateProductPageBoxSelectionCheckout.call(this)
    : { valid: true };
  const canCheckoutByBoxSelection = boxSelectionState.valid !== false;

  const paidTotalQuantity = this.selectedProducts.reduce((sum, stepSelections, i) => {
    const step = this.selectedBundle.steps[i];
    if (step.isFreeGift || step.isDefault) return sum;
    return sum + Object.values(stepSelections || {}).reduce((s, qty) => s + qty, 0);
  }, 0);

  if (isIntermediateCascadeStep) {
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const currentStepValid = this.validateStep(this.currentStepIndex);
    const formattedPrice = totalQuantity > 0
      ? CurrencyManager.convertAndFormat(combinedDiscountInfo.finalPrice, currencyInfo)
      : '';
    const formattedTotalPrice = totalQuantity > 0
      ? CurrencyManager.convertAndFormat(totalPrice, currencyInfo)
      : '';
    const formattedDiscountAmount = combinedDiscountInfo.discountAmount > 0
      ? CurrencyManager.convertAndFormat(combinedDiscountInfo.discountAmount, currencyInfo)
      : '';

    const nextButtonContent = this._getCascadeAddToCartButtonContent?.({
      label: this._resolveText('nextButton', 'Next'),
      totalPriceText: formattedTotalPrice,
      finalPriceText: formattedPrice,
      discountAmountText: formattedDiscountAmount,
      discountInfo: combinedDiscountInfo,
    }) || {
      label: this._resolveText('nextButton', 'Next'),
      separator: formattedPrice ? '\u2022' : '',
      finalPriceText: formattedPrice,
      compareAtPriceText: '',
      discountPillText: '',
    };
    if (!formattedPrice) nextButtonContent.separator = '';
    this._renderCascadeAddToCartButtonContent(button, nextButtonContent);
    const shouldDisable = shouldDisableIntermediateProductPageCta({
      isGrid: this._isProductPageGridTemplate?.() === true,
      currentStepValid,
    });
    button.disabled = shouldDisable;
    button.classList.toggle('disabled', shouldDisable);

  } else if (paidTotalQuantity === 0 || !allStepsValid || !canCheckoutByBoxSelection) {
    if (paidTotalQuantity === 0 || usesCascadeStepFlow) {
      button.textContent = this._resolveText('addToCartButton', 'Add Bundle to Cart');
    } else {

      button.textContent = this._resolveText('completeSteps', 'Complete All Steps to Continue');
    }
    button.disabled = true;
    button.classList.add('disabled');
  } else {

    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const formattedPrice = CurrencyManager.convertAndFormat(combinedDiscountInfo.finalPrice, currencyInfo);
    const buttonLabel = this._resolveText('addToCartButton', 'Add Bundle to Cart');

    if (this._isProductPageCascadeTemplate?.() === true && this._renderCascadeAddToCartButtonContent) {
      const formattedTotalPrice = CurrencyManager.convertAndFormat(totalPrice, currencyInfo);
      const formattedDiscountAmount = combinedDiscountInfo.discountAmount > 0
        ? CurrencyManager.convertAndFormat(combinedDiscountInfo.discountAmount, currencyInfo)
        : '';

      this._renderCascadeAddToCartButtonContent(button, this._getCascadeAddToCartButtonContent?.({
        label: buttonLabel,
        totalPriceText: formattedTotalPrice,
        finalPriceText: formattedPrice,
        discountAmountText: formattedDiscountAmount,
        discountInfo: combinedDiscountInfo,
      }) || {
        label: buttonLabel,
        separator: '\u2022',
        finalPriceText: formattedPrice,
        compareAtPriceText: '',
        discountPillText: '',
      });
    } else {
      button.textContent = `${buttonLabel} \u2022 ${formattedPrice}`;
    }

    button.disabled = false;
    button.classList.remove('disabled');
  }

  this.syncProductPagePrimaryCtaStyle();

  const totalPillFinal = this.elements.modal?.querySelector('.total-price-final');
  const totalPillStrike = this.elements.modal?.querySelector('.total-price-strike');
  if (totalPillFinal) {
    if (totalQuantity > 0) {
      const currencyInfo = CurrencyManager.getCurrencyInfo();
      totalPillFinal.textContent = CurrencyManager.convertAndFormat(combinedDiscountInfo.finalPrice, currencyInfo);
      if (combinedDiscountInfo.qualifiesForDiscount && totalPillStrike) {
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

};

function formatCascadeStepLimitToast(limitText, required) {
  const normalizedRequired = Number(required);
  if (!Number.isFinite(normalizedRequired) || normalizedRequired <= 0) return '';

  const qualifier = String(limitText || '')
    .replace(/\s+-?\d+(?:\.\d+)?\s*$/, '')
    .trim();
  const formattedRequired = String(normalizedRequired).padStart(2, '0');
  return `Add ${qualifier} ${formattedRequired} products on this step`;
}

function formatProductPageStepValidationToast(step = {}) {
  if (step.conditionType !== 'quantity') return '';

  const required = Number(step.conditionValue);
  if (!Number.isFinite(required) || required <= 0) return '';

  const qualifierByOperator = {
    equal_to: 'exactly',
    greater_than_or_equal_to: 'at least',
    less_than_or_equal_to: 'at most',
  };
  const qualifier = qualifierByOperator[step.conditionOperator];
  if (!qualifier) return '';

  return `Add ${qualifier} ${String(required).padStart(2, '0')} products on this step`;
}

function getProductPageModalValidationToastOptions() {
  return {
    dismissible: true,
    className: 'bundle-toast--modal',
  };
}

const ProductPageModalStateMethods = {
_getModalFocusableSelectors() {
  return [
    '.close-button',
    '.prev-button',
    '.next-button',
    '.product-add-btn',
    '.bw-quantity-control__button',
    'button:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];
},

_isElementVisibleForFocus(element) {
  if (!element || typeof element !== 'object') return false;
  if (element.disabled === true) return false;
  if (element.getAttribute && element.getAttribute('aria-hidden') === 'true') return false;
  if (typeof element.getClientRects === 'function' && element.getClientRects().length === 0) return false;

  const modal = this.elements?.modal;
  if (modal && typeof modal.contains === 'function' && !modal.contains(element)) return false;

  return typeof element.focus === 'function';
},

_getModalFocusableControls() {
  const modal = this.elements?.modal;
  if (!modal) return [];

  const controls = [];
  const seen = new Set();
  const selectors = this._getModalFocusableSelectors();

  selectors.forEach((selector) => {
    const list = typeof modal.querySelectorAll === 'function'
      ? modal.querySelectorAll(selector)
      : [];

    if (!list) return;
    list.forEach((el) => {
      if (!this._isElementVisibleForFocus(el) || seen.has(el)) return;
      seen.add(el);
      controls.push(el);
    });
  });

  return controls;
},

_captureActiveElementBeforeModalOpen() {
  const activeElement = globalThis.document?.activeElement;
  if (activeElement && typeof activeElement.focus === 'function') {
    this._modalOriginFocusElement = activeElement;
    this._modalOriginFocusKey = {
      stepIndex: activeElement.dataset?.stepIndex,
      cardIndex: activeElement.dataset?.cardIndex,
      variantId: activeElement.dataset?.variantId,
    };
  } else {
    this._modalOriginFocusElement = null;
    this._modalOriginFocusKey = null;
  }
},

_restoreActiveElementAfterModalClose() {
  const previousFocus = this._modalOriginFocusElement;
  const previousFocusKey = this._modalOriginFocusKey;
  this._modalOriginFocusElement = null;
  this._modalOriginFocusKey = null;

  let nextFocus = previousFocus;
  if (previousFocus?.isConnected === false && previousFocusKey?.stepIndex !== undefined) {
    const candidates = this.elements?.stepsContainer?.querySelectorAll?.('[data-step-index]') || [];
    nextFocus = [...candidates].find((candidate) => (
      candidate.dataset?.stepIndex === previousFocusKey.stepIndex
      && (previousFocusKey.cardIndex === undefined || candidate.dataset?.cardIndex === previousFocusKey.cardIndex)
      && (previousFocusKey.variantId === undefined || candidate.dataset?.variantId === previousFocusKey.variantId)
    ));
  }

  if (nextFocus && typeof nextFocus.focus === 'function') {
    nextFocus.focus();
  }
},

_focusFirstModalControl() {
  const candidates = this._getModalFocusableControls();
  const nextTarget = candidates[0];
  if (nextTarget) {
    nextTarget.focus();
    return true;
  }
  return false;
},

getFormattedHeaderText() {
  const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
  return currentStep?.name || `Step ${this.currentStepIndex + 1}`;
},

openModal(stepIndex) {
  this.currentStepIndex = stepIndex;
  this._captureActiveElementBeforeModalOpen();

  const modal = this.elements.modal;
  const headerText = this.getFormattedHeaderText();
  const header = modal.querySelector('.modal-step-title');
  if (header) {
    header.textContent = headerText;
  }

  this.renderModalTabs();
  this.renderModalProductsLoading(stepIndex);
  this.updateModalNavigation();
  this.updateModalFooterMessaging();

  this.setBottomSheetVisibility(true);
  if (this.elements.bsOverlay) this.elements.bsOverlay.classList.add('bw-bs-overlay--open');
  const runAfterFrame = (typeof requestAnimationFrame === 'function')
    ? requestAnimationFrame
    : (callback) => {
      callback();
    };

  runAfterFrame(() => {
    modal.classList.add('bw-bs-panel--open');
    this._focusFirstModalControl();
  });
  document.body.style.overflow = 'hidden';

  const capturedStepIndex = stepIndex;

  this.loadStepProducts(stepIndex).then(() => {
    if (this.currentStepIndex !== capturedStepIndex) return;
    this.renderModalProducts(capturedStepIndex);
    this.updateModalFooterMessaging();

    this.preloadNextStep();
  }).catch(() => {
    if (this.currentStepIndex !== capturedStepIndex) return;
    const productGrid = this.elements.modal.querySelector('.product-grid');
    if (productGrid) {
      productGrid.textContent = '';
      const messageEl = document.createElement('p');
      messageEl.className = 'error-message';
      messageEl.textContent = 'Failed to load products. Please try again.';
      productGrid.appendChild(messageEl);
    }
    ToastManager.show('Failed to load products for this step');
  });
},

closeModal() {
  this.elements.modal.classList.remove('bw-bs-panel--open');
  if (this.elements.bsOverlay) this.elements.bsOverlay.classList.remove('bw-bs-overlay--open');
  document.body.style.overflow = '';
  this.setBottomSheetVisibility(false);

  this.renderSteps();
  this.updateAddToCartButton();
  this.updateFooterMessaging();
  this._restoreActiveElementAfterModalClose();
},

validateStepCondition(stepIndex, productId, newQuantity) {
  const step = this.selectedBundle.steps[stepIndex];
  const currentSelections = this.selectedProducts[stepIndex] || {};
  const currentQty = this.getSelectedQuantity(stepIndex, productId);
  const normalizedProductId = this.normalizeSelectionKey(productId);
  const stepProducts = this.stepProductData[stepIndex] || [];
  const isAmountOrWeight = step.conditionType === 'amount' || step.conditionType === 'weight';
  const conditionSelections = isAmountOrWeight
    ? this._buildConditionAwareStepSelections(stepProducts, currentSelections)
    : currentSelections;
  const targetProduct = isAmountOrWeight ? this.findProductBySelectionKey(stepProducts, normalizedProductId) : null;
  const targetValues = targetProduct
    ? {
      amount: Number(targetProduct?.price || 0),
      weight: Number(targetProduct?.weight || targetProduct?.weightInGrams || targetProduct?.grams || 0),
    }
    : null;

  const { allowed, limitText } = ConditionValidator.canUpdateQuantity(
    step,
    conditionSelections,
    normalizedProductId,
    newQuantity,
    targetValues,
  );

  if (!allowed && newQuantity > currentQty) {
    const cascadeMessage = this._usesCascadeStepFlow?.()
      ? formatCascadeStepLimitToast(limitText, step.conditionValue)
      : '';
    const toastMessage = cascadeMessage || (typeof ConditionValidator._formatStepLimitToast === 'function'
      ? ConditionValidator._formatStepLimitToast(limitText, step.conditionValue)
      : 'This step allows ' + limitText + ' product' + (step.conditionValue !== 1 ? 's' : '') + ' only.');
    ToastManager.show(toastMessage);
    return false;
  }

  return true;
},

  _buildConditionAwareStepSelections(stepProducts, currentSelections) {
    const selections = currentSelections || {};
    const translated = {};
    for (const [selKey, qty] of Object.entries(selections)) {
      const quantity = Number(qty) || 0;
      if (quantity <= 0) continue;

      const product = this.findProductBySelectionKey(stepProducts, selKey);
      const unitAmount = Number(product?.price || 0);
      const unitWeight = Number(product?.weight || product?.weightInGrams || product?.grams || 0);
      const current = translated[selKey] || { quantity: 0, amount: 0, weight: 0 };
      translated[selKey] = {
        quantity: current.quantity + quantity,
        amount: current.amount + (unitAmount * quantity),
        weight: current.weight + (unitWeight * quantity),
      };
    }
    return translated;
  },

validateStep(stepIndex) {
  const step = this.selectedBundle.steps[stepIndex];
  const currentSelections = this.selectedProducts[stepIndex] || {};

  if (ConditionValidator.isCategoryRuleMode(step)) {
    const products = this.stepProductData[stepIndex] || [];
    const translated = {};
    for (const [selKey, qty] of Object.entries(currentSelections)) {
      const product = this.findProductBySelectionKey(products, selKey);
      const productId = String((product && (product.parentProductId || product.id)) || selKey);
      const quantity = Number(qty) || 0;
      const price = Number(product?.price || 0);
      const weight = Number(product?.weight || product?.weightInGrams || product?.grams || 0);
      const current = translated[productId] || { quantity: 0, amount: 0, weight: 0 };
      translated[productId] = {
        quantity: current.quantity + quantity,
        amount: current.amount + (price * quantity),
        weight: current.weight + (weight * quantity),
      };
    }
    return ConditionValidator.isStepConditionSatisfied(step, translated);
  }

  if (step.conditionType === 'amount' || step.conditionType === 'weight') {
    return ConditionValidator.isStepConditionSatisfied(
      step,
      this._buildConditionAwareStepSelections(this.stepProductData[stepIndex] || [], currentSelections),
    );
  }

  return ConditionValidator.isStepConditionSatisfied(step, currentSelections);
},

isStepAccessible(stepIndex) {
  if (this._isConditionValidationEnabled?.() === false) {
    return true;
  }

  for (let i = 0; i < stepIndex; i++) {
    const step = this.selectedBundle?.steps[i];
    if (step?.isFreeGift || step?.isDefault) continue;
    if (!this.validateStep(i)) return false;
  }
  return true;
},

updateModalNavigation() {
  const prevButton = this.elements.modal?.querySelector('.prev-button');
  const nextButton = this.elements.modal?.querySelector('.next-button');

  if (!prevButton || !nextButton) return;

  prevButton.disabled = false;

  const isLastStep = this.currentStepIndex === this.selectedBundle.steps.length - 1;
  const footer = this.elements.modal?.querySelector('.bw-bs-footer');
  footer?.classList.toggle('bw-bs-footer--single-step', this.selectedBundle.steps.length <= 1);
  footer?.classList.toggle('bw-bs-footer--first-step', this.currentStepIndex === 0);
  footer?.classList.toggle('bw-bs-footer--last-step', isLastStep);

  nextButton.textContent = isLastStep ? this._resolveText('doneButton', 'Done') : this._resolveText('nextButton', 'Next');
  nextButton.disabled = false;
},

updateModalFooterMessaging() {
  const { totalPrice, totalQuantity, unitPrices } = PricingCalculator.calculateBundleTotal(
    this.selectedProducts,
    this.stepProductData,
    this.selectedBundle?.steps
  );

  const discountInfo = PricingCalculator.calculateDiscount(
    this.selectedBundle,
    totalPrice,
    totalQuantity,
    unitPrices
  );
  const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);

  const currencyInfo = CurrencyManager.getCurrencyInfo();

  this.updateModalHeaderText(totalPrice, totalQuantity, combinedDiscountInfo, currencyInfo);

  const cartBadge = this.elements.modal.querySelector('.cart-badge-count');
  if (cartBadge) {
    cartBadge.textContent = totalQuantity.toString();
  }

  this.updateFooterTotalPrices(totalPrice, combinedDiscountInfo, currencyInfo);

  this.updateModalDiscountMessaging(totalPrice, totalQuantity, combinedDiscountInfo, currencyInfo);
},

updateModalHeaderText(totalPrice, totalQuantity, discountInfo, currencyInfo) {
  const modalStepTitle = this.elements.modal.querySelector('.modal-step-title');
  if (!modalStepTitle) return;

  const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
  modalStepTitle.textContent = currentStep?.name || `Step ${this.currentStepIndex + 1}`;
},

updateModalDiscountMessaging(totalPrice, totalQuantity, discountInfo, currencyInfo) {
  const footerDiscountText = this.elements.modal.querySelector('.footer-discount-text');
  const discountSection = this.elements.modal.querySelector('.modal-footer-discount-messaging')
    || this.elements.modal.querySelector('.modal-header-discount-messaging');

  if (!footerDiscountText) return;

  const nextRule = PricingCalculator.getNextDiscountRule(this.selectedBundle, totalQuantity, totalPrice);
  const ruleToUse = discountInfo.applicableRule || nextRule;
  const hasDiscountRules = !!ruleToUse;
  const pbConfig = this.selectedBundle?.messaging?.displayOptions?.progressBar || {};
  const messageType = nextRule
    ? 'progress'
    : (discountInfo.qualifiesForDiscount ? 'success' : 'progress');
  const fallbackTemplate = messageType === 'success'
    ? (pbConfig.successText || this.selectedBundle.messaging?.successTemplate || 'You got {discountText}!')
    : (pbConfig.progressText || this.selectedBundle.messaging?.progressTemplate || 'Add {conditionText} more to get {discountText}');

  if (discountSection) {
    discountSection.style.display = (this.config.showDiscountMessaging && hasDiscountRules) ? 'block' : 'none';
  }

  if (!hasDiscountRules) return;

  const template = TemplateManager.getDiscountMessageTemplate({
    bundle: this.selectedBundle,
    totalQuantity,
    totalPrice,
    discountInfo,
    messageType,
    fallbackTemplate,
    locale: window.Shopify?.locale,
  });
  const variables = TemplateManager.createDiscountVariables(
    this.selectedBundle,
    totalPrice,
    totalQuantity,
    discountInfo,
    currencyInfo,
    { rule: ruleToUse, messageType }
  );
  const message = TemplateManager.replaceVariables(template, variables);

  footerDiscountText.textContent = discountInfo.qualifiesForDiscount && !nextRule
    ? message
    : message || '';
  if (discountSection) {
    if (discountInfo.qualifiesForDiscount && !nextRule) {
      discountSection.classList.add('qualified');
    } else {
      discountSection.classList.remove('qualified');
    }
  }
},

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

};

const MIN_LOADING_OVERLAY_VISIBLE_MS = 180;

const ProductPageWidgetMiscMethods = {
showLoadingOverlay(gifUrl, options = {}) {
  if (!this.container) return;
  if (options.bootstrap === true) {
    this.container.dataset.wpbBootstrapLoading = 'true';
  }

  const pos = getComputedStyle(this.container).position;
  if (pos !== 'relative' && pos !== 'absolute' && pos !== 'fixed' && pos !== 'sticky') {
    this.container.style.position = 'relative';
  }

  this.container.querySelector('.bundle-loading-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'bundle-loading-overlay';
  overlay.style.minHeight = 'var(--bundle-ppb-loading-overlay-min-height, 180px)';
  overlay.style.minWidth = 'var(--bundle-ppb-loading-overlay-min-width, 180px)';

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

  overlay.offsetHeight;

  this._bundleLoadingOverlayToken = (this._bundleLoadingOverlayToken || 0) + 1;
  this._loadingOverlayShownAt = performance.now();
  overlay.dataset.wpbLoadingToken = String(this._bundleLoadingOverlayToken);
  markLoadingOverlayVisible(overlay);
},

hideLoadingOverlay() {
  const overlay = this.container?.querySelector('.bundle-loading-overlay');
  if (!overlay) return;
  const overlayToken = Number(overlay.dataset.wpbLoadingToken || 0);
  if (!overlayToken || overlayToken !== this._bundleLoadingOverlayToken) return;

  const visibleMs = performance.now() - (this._loadingOverlayShownAt || 0);
  const delayMs = Math.max(0, MIN_LOADING_OVERLAY_VISIBLE_MS - visibleMs);

  window.setTimeout(() => {
    if (this._bundleLoadingOverlayToken !== overlayToken) return;
    this._bundleLoadingOverlayToken = 0;
    delete this.container.dataset.wpbBootstrapLoading;
    hideLoadingOverlayElement(overlay);
  }, delayMs);
},

attachEventListeners() {

  this.elements.addToCartButton.addEventListener('click', () => {
    const isIntermediateCascadeStep = this._usesCascadeStepFlow?.()
      && this.currentStepIndex < this.selectedBundle.steps.length - 1;
    if (isIntermediateCascadeStep) {
      const navigated = this.navigateCascadeStep(1);
      if (!navigated && this._isProductPageGridTemplate?.() === true) {
        const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
        ToastManager.show(
          formatProductPageStepValidationToast(currentStep)
            || 'Please meet the quantity conditions for the current step before proceeding.',
          4000,
          {
            dismissible: false,
            className: 'bundle-toast--cognive',
          },
        );
      }
      return;
    }
    this.addToCart();
  });

  const modal = this.elements.modal;
  const closeButtons = modal.querySelectorAll('.close-button');
  const prevButton = modal.querySelector('.prev-button');
  const nextButton = modal.querySelector('.next-button');

  closeButtons.forEach((closeButton) => {
    closeButton.addEventListener('click', () => this.closeModal());
  });

  if (this.elements.bsOverlay) {
    this.elements.bsOverlay.addEventListener('click', () => this.closeModal());
  }
  if (prevButton) prevButton.addEventListener('click', () => this.navigateModal(-1));
  if (nextButton) nextButton.addEventListener('click', () => this.navigateModal(1));

  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('bw-bs-panel--open')) return;

    const target = e.target;
    if (target && (target.tagName === 'INPUT' || target.isContentEditable)) return;

    if (e.key === 'Escape') {
      this.closeModal();
      return;
    }

    if (e.key === 'ArrowLeft' && prevButton) {
      e.preventDefault();
      prevButton.click?.();
      return;
    }

    if (e.key === 'ArrowRight' && nextButton) {
      e.preventDefault();
      nextButton.click?.();
      return;
    }

    if (e.key === 'Tab') {
      const controls = typeof this._getModalFocusableControls === 'function'
        ? this._getModalFocusableControls()
        : [];
      if (!controls.length) return;

      const current = controls.indexOf(globalThis.document?.activeElement);
      const isActiveInModal = current >= 0;
      const fromIndex = isActiveInModal ? current : -1;
      const nextIndex = e.shiftKey
        ? (fromIndex > 0 ? fromIndex - 1 : controls.length - 1)
        : (fromIndex >= 0 && fromIndex < controls.length - 1 ? fromIndex + 1 : 0);

      e.preventDefault();
      controls[nextIndex]?.focus?.();
    }
  });
},

async navigateModal(direction) {
  const newStepIndex = this.currentStepIndex + direction;

  if (direction < 0 && newStepIndex >= 0) {

    this.currentStepIndex = newStepIndex;

    const headerText = this.getFormattedHeaderText();
    const header = this.elements.modal.querySelector('.modal-step-title');
    if (header) {
      header.textContent = headerText;
    }

    this.renderModalTabs();
    this.renderModalProductsLoading(newStepIndex);
    this.updateModalNavigation();
    this.updateModalFooterMessaging();

    await this.loadStepProducts(newStepIndex);
    this.renderModalProducts(this.currentStepIndex);
    this.updateModalFooterMessaging();
  } else if (direction > 0) {
    const shouldValidateConditions = this._isConditionValidationEnabled?.() !== false;

    if (newStepIndex < this.selectedBundle.steps.length) {

      if (!shouldValidateConditions || this.validateStep(this.currentStepIndex)) {
        this.currentStepIndex = newStepIndex;

        const headerText = this.getFormattedHeaderText();
        const header = this.elements.modal.querySelector('.modal-step-title');
        if (header) {
          header.textContent = headerText;
        }

        this.renderModalTabs();
        this.renderModalProductsLoading(newStepIndex);
        this.updateModalNavigation();
        this.updateModalFooterMessaging();

        await this.loadStepProducts(newStepIndex);
        this.renderModalProducts(this.currentStepIndex);
        this.updateModalFooterMessaging();

        this.preloadNextStep();
      } else {
        const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
        const message = formatProductPageStepValidationToast(currentStep)
          || 'Please meet the quantity conditions for the current step before proceeding.';
        ToastManager.show(message, 4000, getProductPageModalValidationToastOptions());
      }
    } else {

      if (!shouldValidateConditions || this.validateStep(this.currentStepIndex)) {
        this.closeModal();
      } else {
        const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
        const message = formatProductPageStepValidationToast(currentStep)
          || 'Please meet the quantity conditions for the current step before finishing.';
        ToastManager.show(message, 4000, getProductPageModalValidationToastOptions());
      }
    }
  }
},

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
},

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
},

_resolveText(key, fallback) {
  const locale = window.Shopify?.locale;
  if (locale && this.config?.textOverridesByLocale?.[locale]?.[key]) {
    return this.config.textOverridesByLocale[locale][key];
  }
  if (this.config?.textOverrides?.[key]) {
    return this.config.textOverrides[key];
  }
  return fallback;
},

_recordView() {
  try {
    const bundleId = this.container?.dataset?.bundleId;
    const shop = window.Shopify?.shop;
    if (!bundleId || !shop) return;
    fetch(`/apps/product-bundles/api/bundle/${bundleId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shop }),
      keepalive: true,
    }).catch(() => { /* best-effort */ });
  } catch (_) {

  }
}
};

function shouldHideInpageStepChrome({ isCascade = false, steps = [], step = null } = {}) {
  if (!isCascade) return false;

  const categories = Array.isArray(step?.categories) ? step.categories : [];
  return Array.isArray(steps) && steps.length === 1 && categories.length <= 1;
}

function shouldUseCascadeStepFlow({ isInpage = false, isCascade = false, isGrid = false, steps = [] } = {}) {
  return Boolean(isInpage && (isCascade || isGrid) && Array.isArray(steps) && steps.length > 1);
}

function getCascadeStepNavigationState({
  currentStepIndex = 0,
  direction = 0,
  stepCount = 0,
  isCurrentStepValid = false,
} = {}) {
  const lastStepIndex = Math.max(0, Number(stepCount || 0) - 1);
  const current = Math.min(Math.max(0, Number(currentStepIndex || 0)), lastStepIndex);

  if (direction < 0) {
    return {
      targetStepIndex: Math.max(0, current - 1),
      blocked: false,
      isFinal: false,
    };
  }

  if (current >= lastStepIndex) {
    return { targetStepIndex: current, blocked: false, isFinal: true };
  }

  if (!isCurrentStepValid) {
    return { targetStepIndex: current, blocked: true, isFinal: false };
  }

  return { targetStepIndex: current + 1, blocked: false, isFinal: false };
}

function getCogniveStepRenderSequence({ stepCount = 0, currentStepIndex = 0 } = {}) {
  const count = Math.max(0, Number(stepCount || 0));
  const activeIndex = Math.min(Math.max(0, Number(currentStepIndex || 0)), Math.max(0, count - 1));
  const sequence = [];

  for (let stepIndex = 0; stepIndex < count; stepIndex += 1) {
    sequence.push({ type: 'header', stepIndex });
    if (stepIndex === activeIndex) {
      sequence.push({ type: 'body', stepIndex });
    }
  }

  return sequence;
}

const ProductPageLayoutShellMethods = {
renderUI() {
  this._renderDirectDefaultProducts();
  this.renderSteps();
  this.renderQuantityOptionPills();
  this.renderFooter();
  this.updateAddToCartButton();
},

renderSteps() {

  this.elements.stepsContainer.innerHTML = '';
  this._markProductPageTemplate();

  if (!this.selectedBundle || !this.selectedBundle.steps) {
    return;
  }

  const bundleType = this.selectedBundle.bundleType || BUNDLE_WIDGET.BUNDLE_TYPES.PRODUCT_PAGE;

  if (bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE) {

    this.renderFullPageLayout();
  } else {

    this.renderProductPageLayout();
  }
},

_renderDirectDefaultProducts() {
  const el = this.elements.defaultProducts;
  if (!el) return;
  el.innerHTML = '';

  const data = this._getDirectDefaultProductsData();
  const products = this.directDefaultProducts || [];
  if (!data || products.length === 0) {
    el.style.display = 'none';
    return;
  }

  el.style.display = 'block';

  if (data.defaultProductsTitle) {
    const title = document.createElement('h3');
    title.className = 'bw-default-products__title';
    title.textContent = data.defaultProductsTitle;
    el.appendChild(title);
  }

  const list = document.createElement('div');
  list.className = 'bw-default-products__list';
  const currencyInfo = CurrencyManager.getCurrencyInfo();

  products.forEach(product => {
    const quantity = this.getSelectedQuantity(0, product.variantId) || product.defaultRequiredQuantity || 1;
    const line = document.createElement('div');
    line.className = 'bw-default-products__line';

    const details = document.createElement('div');
    details.className = 'bw-default-products__details';

    const image = document.createElement('img');
    image.className = 'bw-default-products__image';
    image.src = product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
    image.alt = product.title || '';
    details.appendChild(image);

    const text = document.createElement('div');
    text.className = 'bw-default-products__text';

    const name = document.createElement('span');
    name.className = 'bw-default-products__name';
    name.textContent = `${product.title} x ${quantity}`;
    text.appendChild(name);

    const price = document.createElement('span');
    price.className = 'bw-default-products__price';
    price.textContent = CurrencyManager.convertAndFormat(product.price * quantity, currencyInfo);
    text.appendChild(price);
    details.appendChild(text);
    line.appendChild(details);

    const quantityBadge = document.createElement('span');
    quantityBadge.className = 'bw-default-products__quantity';
    quantityBadge.textContent = `x ${quantity}`;
    line.appendChild(quantityBadge);
    list.appendChild(line);
  });

  el.appendChild(list);
},

_createStepBannerImage(step) {
  if (!step?.bannerImageUrl) return null;
  const wrapper = document.createElement('div');
  wrapper.className = 'step-banner-image';
  const img = document.createElement('img');
  img.src = step.bannerImageUrl;
  img.alt = step.name || '';
  img.style.width = '100%';
  img.style.display = 'block';
  wrapper.appendChild(img);
  return wrapper;
},

renderProductPageLayout() {
  const usesCascadeStepFlow = this._usesCascadeStepFlow();
  const lastStepIndex = Math.max(0, this.selectedBundle.steps.length - 1);
  this.currentStepIndex = Math.min(Math.max(0, this.currentStepIndex), lastStepIndex);

  if (usesCascadeStepFlow && this._isProductPageGridTemplate?.() === true) {
    this._renderCogniveStepFlowLayout();
    return;
  }

  if (usesCascadeStepFlow) {
    this.elements.stepsContainer.appendChild(this._createCascadeStepFlowHeader());
  }

  const stepsToRender = usesCascadeStepFlow
    ? [[this.selectedBundle.steps[this.currentStepIndex], this.currentStepIndex]]
    : this.selectedBundle.steps.map((step, stepIndex) => [step, stepIndex]);

  stepsToRender.forEach(([step, stepIndex]) => {
    if (this._isProductPageInpageTemplate()) {
      const section = this._createInpageStepSection(step, stepIndex);
      const target = section.querySelector('.bw-ppb-inpage-step-grid');
      this.elements.stepsContainer.appendChild(section);

      const banner = this._createStepBannerImage(step);
      if (banner) target.appendChild(banner);

      this._renderInpageStepProducts(stepIndex, target);
      return;
    }

    const section = this._isProductPageModalSlotTemplate()
      ? this._createModalSlotStepSection(step)
      : this._isProductPageCogniveTemplate()
        ? this._createInpageStepSection(step, stepIndex)
      : null;
    const target =
      section?.querySelector('.bw-ppb-modal-slot-grid')
      || section?.querySelector('.bw-ppb-inpage-step-grid')
      || this.elements.stepsContainer;

    if (section) {
      this.elements.stepsContainer.appendChild(section);
    }

    const banner = this._createStepBannerImage(step);
    if (banner) target.appendChild(banner);

    if (step.isDefault) {

      const product = this._getDefaultStepProduct(stepIndex);
      if (product) {
        const card = this.createDefaultProductCard(step, stepIndex, product);
        target.appendChild(card);
      } else {

        const card = this._createDefaultLoadingCard(step, stepIndex);
        target.appendChild(card);
      }
    } else if (step.isFreeGift) {

      const card = this.createFreeGiftSlotCard(step, stepIndex);
      target.appendChild(card);
    } else {

      const stepSelections = this.selectedProducts[stepIndex] || {};
      const selectedEntries = Object.entries(stepSelections).filter(([, qty]) => qty > 0);

      if (selectedEntries.length > 0) {
        const products = this.expandProductsByVariant(this.stepProductData[stepIndex] || []);
        selectedEntries.forEach(([variantId, qty]) => {
          const product = this.findProductBySelectionKey(products, variantId);
          if (product) {
            for (let i = 0; i < qty; i++) {
              const card = this.createSelectedProductCard(
                { product, stepIndex, step, variantId, instanceIndex: i },
                i
              );
              target.appendChild(card);
            }
          }
        });
        const totalQty = selectedEntries.reduce((sum, [, qty]) => sum + qty, 0);
        if (this._isProductPageModalSlotTemplate()) {
          this._appendModalSlotEmptyCards(target, step, stepIndex, totalQty);
        } else if (!this.validateStep(stepIndex)) {
          target.appendChild(this.createAddMoreCard(step, stepIndex, totalQty));
        }
      } else {
        if (this._isProductPageModalSlotTemplate()) {
          this._appendModalSlotEmptyCards(target, step, stepIndex, 0);
        } else {
          target.appendChild(this.createAddMoreCard(step, stepIndex, 0));
        }
      }
    }
  });
},

_renderCogniveStepFlowLayout() {
  const sequence = getCogniveStepRenderSequence({
    stepCount: this.selectedBundle.steps.length,
    currentStepIndex: this.currentStepIndex,
  });

  sequence.forEach(({ type, stepIndex }) => {
    const step = this.selectedBundle.steps[stepIndex];
    if (type === 'header') {
      this.elements.stepsContainer.appendChild(this._createCogniveStepHeader(step, stepIndex));
      return;
    }

    const section = this._createInpageStepSection(step, stepIndex);
    const target = section.querySelector('.bw-ppb-inpage-step-grid');
    this.elements.stepsContainer.appendChild(section);

    const banner = this._createStepBannerImage(step);
    if (banner) target.appendChild(banner);
    this._renderInpageStepProducts(stepIndex, target);
  });
},

_createCogniveStepHeader(step, stepIndex) {
  const button = document.createElement('button');
  const isActive = stepIndex === this.currentStepIndex;
  button.type = 'button';
  button.className = `bw-ppb-cognive-step${isActive ? ' is-active' : ''}${this.validateStep(stepIndex) ? ' is-complete' : ''}`;
  button.setAttribute('aria-current', isActive ? 'step' : 'false');
  button.innerHTML = `
    <span class="bw-ppb-cognive-step__number">${stepIndex + 1}</span>
    <span class="bw-ppb-cognive-step__label">${ComponentGenerator.escapeHtml(step.pageTitle || step.name || `Step ${stepIndex + 1}`)}</span>
  `;
  button.addEventListener('click', () => {
    if (isActive) return;
    if (!this.isStepAccessible(stepIndex)) {
      const currentStep = this.selectedBundle.steps[this.currentStepIndex];
      ToastManager.show(
        formatProductPageStepValidationToast(currentStep)
          || 'Please meet the quantity conditions for the current step before proceeding.',
        4000,
        {
          dismissible: false,
          className: 'bundle-toast--cognive',
        },
      );
      return;
    }
    this.currentStepIndex = stepIndex;
    this.renderSteps();
    this.renderFooter();
    this.updateAddToCartButton();
  });
  return button;
},

_usesCascadeStepFlow() {
  return shouldUseCascadeStepFlow({
    isInpage: this._isProductPageInpageTemplate?.() === true,
    isCascade: this._isProductPageCascadeTemplate?.() === true,
    isGrid: this._isProductPageGridTemplate?.() === true,
    steps: this.selectedBundle?.steps,
  });
},

_createCascadeStepFlowHeader() {
  const header = document.createElement('div');
  header.className = 'bw-ppb-cascade-step-flow';

  this.selectedBundle.steps.forEach((step, stepIndex) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'bw-ppb-cascade-step-flow__step';
    button.classList.toggle('is-active', stepIndex === this.currentStepIndex);
    button.classList.toggle('is-complete', this.validateStep(stepIndex));
    button.setAttribute('aria-current', stepIndex === this.currentStepIndex ? 'step' : 'false');
    button.disabled = stepIndex > this.currentStepIndex && !this.isStepAccessible(stepIndex);
    button.innerHTML = `
      <span class="bw-ppb-cascade-step-flow__number">${stepIndex + 1}</span>
      <span class="bw-ppb-cascade-step-flow__label">${ComponentGenerator.escapeHtml(step.pageTitle || step.name || `Step ${stepIndex + 1}`)}</span>
    `;
    button.addEventListener('click', () => {
      if (button.disabled || stepIndex === this.currentStepIndex) return;
      this.currentStepIndex = stepIndex;
      this.renderSteps();
      this.renderFooter();
      this.updateAddToCartButton();
    });
    header.appendChild(button);
  });

  return header;
},

navigateCascadeStep(direction) {
  if (!this._usesCascadeStepFlow()) return false;

  const navigation = getCascadeStepNavigationState({
    currentStepIndex: this.currentStepIndex,
    direction,
    stepCount: this.selectedBundle.steps.length,
    isCurrentStepValid: this.validateStep(this.currentStepIndex),
  });

  if (navigation.blocked || navigation.isFinal || navigation.targetStepIndex === this.currentStepIndex) {
    return false;
  }

  this.currentStepIndex = navigation.targetStepIndex;
  this.renderSteps();
  this.renderFooter();
  this.updateAddToCartButton();
  return true;
},

_createInpageStepSection(step, stepIndex) {
  const section = document.createElement('div');
  const preset = this._getProductPageDesignPreset();
  const isCascade = this._isProductPageCascadeTemplate?.() === true;
  const hideStepChrome = shouldHideInpageStepChrome({
    isCascade,
    steps: this.selectedBundle?.steps,
    step,
  });
  section.className = `bw-ppb-inpage-step-section bw-ppb-inpage-step-section--${preset.toLowerCase()}${isCascade ? ' wpbMixCascadeBodyWrapper' : ''}`;

  if (!hideStepChrome) {
    const usesCascadeStepFlow = this._usesCascadeStepFlow();
    if (!usesCascadeStepFlow) {
      const title = document.createElement('div');
      title.className = `bw-ppb-inpage-step-title${isCascade ? ' wpbMixCascadeBodyHeaderCategoryName' : ''}`;
      title.textContent = step.pageTitle || step.name || '';
      section.appendChild(title);
    }

    const tabs = this._createInpageCategoryTabs(step, stepIndex);
    if (tabs) section.appendChild(tabs);
  }

  const grid = document.createElement('div');
  grid.className = 'bw-ppb-inpage-step-grid';
  section.appendChild(grid);

  return section;
},

_createInpageCategoryTabs(step, stepIndex) {
  const categories = Array.isArray(step?.categories) ? step.categories : [];
  if (categories.length === 0) return null;

  if (typeof this.activeInpageCategoryIndexes[stepIndex] !== 'number') {
    this.activeInpageCategoryIndexes[stepIndex] = 0;
  }

  const tabs = document.createElement('div');
  const isCascade = this._isProductPageCascadeTemplate?.() === true;
  tabs.className = `bw-ppb-inpage-category-tabs${isCascade ? ' wpbMixCascadeCategoryTabsWrapper' : ''}`;

  categories.forEach((category, categoryIndex) => {
    const button = document.createElement('button');
    button.type = 'button';
    const isActive = categoryIndex === this.activeInpageCategoryIndexes[stepIndex];
    button.className = `bw-ppb-inpage-category-tab${isActive ? ' active' : ''}${isCascade ? ` wpbMixCascadeCategoryTab${isActive ? ' wpbMixCascadeCategoryTab--active' : ''}` : ''}`;
    button.dataset.categoryIndex = String(categoryIndex);
    button.textContent = this._getInpageCategoryLabel(category, categoryIndex);
    button.addEventListener('click', () => {
      this.activeInpageCategoryIndexes[stepIndex] = categoryIndex;
      tabs.querySelectorAll('.bw-ppb-inpage-category-tab').forEach(tab => {
        const active = tab === button;
        tab.classList.toggle('active', active);
        tab.classList.toggle('wpbMixCascadeCategoryTab--active', active);
      });
      const grid = tabs.parentElement?.querySelector('.bw-ppb-inpage-step-grid');
      if (grid) this._renderInpageStepProducts(stepIndex, grid);
    });
    tabs.appendChild(button);
  });

  return tabs;
},

_getInpageCategoryLabel(category, categoryIndex) {
  return category?.title || category?.name || `Category ${categoryIndex + 1}`;
},

_getCategoryProductIds(category) {
  const ids = new Set();
  const addProductId = (product) => {
    const id = product?.id || product?.graphqlId || product?.productId;
    if (id) ids.add(this.extractId(id));
  };

  (category?.products || []).forEach(addProductId);
  (category?.selectedProducts || []).forEach(addProductId);
  return ids;
},

_categoryHasCollections(category) {
  return Boolean(
    category?.collections?.length
    || category?.collectionsData?.length
    || category?.collectionsSelectedData?.length
  );
},

_filterProductsForInpageCategory(step, products, stepIndex) {
  const categories = Array.isArray(step?.categories) ? step.categories : [];
  if (categories.length === 0) return products;

  const activeIndex = this.activeInpageCategoryIndexes[stepIndex] || 0;
  const category = categories[activeIndex];
  const categoryProductIds = this._getCategoryProductIds(category);
  const configuredProducts = [
    ...(Array.isArray(category?.products) ? category.products : []),
    ...(Array.isArray(category?.selectedProducts) ? category.selectedProducts : []),
  ];

  if (categoryProductIds.size === 0) {
    return this._categoryHasCollections(category) ? products : [];
  }

  const categoryProducts = categories.length > 1
    ? products.filter(product => {
      const productId = this.extractId(product.parentProductId || product.id);
      return categoryProductIds.has(productId);
    })
    : products;

  return categoryProducts.flatMap(product => {
    const productId = this.extractId(product.parentProductId || product.id);
    const configuredProduct = configuredProducts.find(candidate => (
      this.extractId(candidate?.id || candidate?.graphqlId || candidate?.productId) === productId
    ));
    const configuredVariantIds = new Set(
      (Array.isArray(configuredProduct?.variants) ? configuredProduct.variants : [])
        .map(variant => this.extractId(variant?.id || variant?.variantId))
        .filter(Boolean)
    );

    if (configuredVariantIds.size === 0 || !Array.isArray(product?.variants)) {
      return [product];
    }

    const variants = product.variants.filter(variant => (
      configuredVariantIds.has(this.extractId(variant?.id || variant?.variantId))
    ));
    if (variants.length === 0) return [];

    const selectedVariant = variants.find(variant => variant?.available !== false) || variants[0];
    const variantImageUrl = selectedVariant?.image?.src
      || selectedVariant?.image?.url
      || selectedVariant?.imageUrl
      || product.imageUrl;

    return [{
      ...product,
      variantId: this.extractId(selectedVariant?.id || selectedVariant?.variantId),
      variantTitle: selectedVariant?.title && selectedVariant.title !== 'Default Title'
        ? selectedVariant.title
        : '',
      price: selectedVariant?.price ?? product.price,
      compareAtPrice: selectedVariant?.compareAtPrice ?? null,
      available: selectedVariant?.available !== false,
      quantityAvailable: typeof selectedVariant?.quantityAvailable === 'number'
        ? selectedVariant.quantityAvailable
        : null,
      currentlyNotInStock: selectedVariant?.currentlyNotInStock === true,
      imageUrl: variantImageUrl,
      variants,
    }];
  });
}
};

function bsIsDefaultStep(step) { return !!step?.isDefault; }

function bsGetDiscountBadgeLabel(step) { return step?.discountBadgeLabel || null; }

function makeSlotCardKeyboardAccessible(card, activate) {
  card.setAttribute('role', 'button');
  card.tabIndex = 0;
  card.addEventListener('click', activate);
  card.addEventListener('keydown', (event) => {
    if (event.target && event.target !== card) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    activate();
  });
}

function resolveSelectedSlotTitle(title, isVertical) {
  const normalizedTitle = String(title || '');
  if (isVertical || normalizedTitle.length <= 25) return normalizedTitle;
  return `${normalizedTitle.substring(0, 25)}...`;
}

function renderInpageProductLoadingRows(rowCount = 3) {
  const rows = Array.from({ length: rowCount }, (_, index) => `
    <div class="bw-ppb-inpage-loading-row" aria-hidden="true" data-loading-row="${index + 1}">
      <span class="bw-ppb-inpage-loading-media"></span>
      <span class="bw-ppb-inpage-loading-body">
        <span class="bw-ppb-inpage-loading-line bw-ppb-inpage-loading-line--title"></span>
        <span class="bw-ppb-inpage-loading-line bw-ppb-inpage-loading-line--price"></span>
      </span>
      <span class="bw-ppb-inpage-loading-action"></span>
    </div>
  `).join('');

  return `
    <div class="bw-ppb-inpage-loading" role="status" aria-label="Loading products">
      ${rows}
    </div>
  `;
}

function shouldDisplayVariantsAsIndividualForInpageCategory(step, stepIndex, activeCategoryIndexes = {}) {
  const categories = Array.isArray(step?.categories) ? step.categories : [];
  if (categories.length > 0) {
    const activeIndex = typeof activeCategoryIndexes?.[stepIndex] === 'number'
      ? activeCategoryIndexes[stepIndex]
      : 0;
    const category = categories[activeIndex] || categories[0];
    return category?.displayVariantsAsIndividualProducts === true
      || category?.displayVariantsAsIndividual === true;
  }

  return step?.displayVariantsAsIndividualProducts === true
    || step?.displayVariantsAsIndividual === true;
}

function getCascadeSoleVariantDisplayProduct(product = {}) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const soleVariantTitle = typeof variants[0]?.title === 'string' ? variants[0].title.trim() : '';
  const hadMultipleSourceVariants = Number(product.sourceVariantCount || 0) > 1;

  if (product.parentProductId || !hadMultipleSourceVariants || variants.length !== 1) return product;
  if (!soleVariantTitle || soleVariantTitle === 'Default Title') return product;

  return { ...product, variantTitle: soleVariantTitle };
}

function resolveInpageProductSelection(
  product = {},
  stepSelections = {},
  normalizeSelectionKey = (value) => String(value || ''),
  selectedProductCategoryIndexes = {},
  activeCategoryIndex = null,
) {
  const defaultSelectionKey = product.variantId || product.id || '';
  const candidateIds = [defaultSelectionKey, product.id, product.productId];
  if (Array.isArray(product.variants)) {
    candidateIds.push(...product.variants.map((variant) => variant.id));
  }

  const normalizedCandidates = new Set(
    candidateIds.map(normalizeSelectionKey).filter(Boolean),
  );
  const restoredEntry = Object.entries(stepSelections || {}).find(
    ([selectionKey, rawQuantity]) => (
      Number(rawQuantity) > 0
      && normalizedCandidates.has(normalizeSelectionKey(selectionKey))
    ),
  );

  if (restoredEntry) {
    const normalizedSelectionKey = normalizeSelectionKey(restoredEntry[0]);
    const categoryOwnerEntry = Object.entries(selectedProductCategoryIndexes || {}).find(
      ([selectionKey]) => normalizeSelectionKey(selectionKey) === normalizedSelectionKey,
    );
    const categoryOwner = categoryOwnerEntry ? Number(categoryOwnerEntry[1]) : null;
    const belongsToActiveCategory = (
      activeCategoryIndex === null
      || categoryOwner === null
      || categoryOwner === activeCategoryIndex
    );
    return {
      selectionKey: restoredEntry[0],
      quantity: belongsToActiveCategory ? Number(restoredEntry[1]) || 0 : 0,
    };
  }

  return {
    selectionKey: defaultSelectionKey,
    quantity: 0,
  };
}

const ProductPageInpageRenderMethods = {
_renderInpageStepProducts(stepIndex, target) {
  const rawProducts = this.stepProductData[stepIndex] || [];
  if (!this._inpageStepProductsLoaded) this._inpageStepProductsLoaded = {};
  target.classList.toggle('bw-ppb-cascade-product-list', this._isProductPageCascadeTemplate());
  target.classList.toggle('bw-ppb-cognive-product-grid', this._isProductPageGridTemplate());

  const stepProductsLoaded = this._inpageStepProductsLoaded[stepIndex] === true;
  if (rawProducts.length === 0 && !stepProductsLoaded && !(this._stepFetchFailed && this._stepFetchFailed[stepIndex])) {
    target.setAttribute?.('aria-busy', 'true');
    target.innerHTML = renderInpageProductLoadingRows();
    this.loadStepProducts(stepIndex).then(() => {
      this._inpageStepProductsLoaded[stepIndex] = true;
      if (target.isConnected) this._renderInpageStepProducts(stepIndex, target);
    }).catch(() => {
      if (!this._stepFetchFailed) this._stepFetchFailed = {};
      this._stepFetchFailed[stepIndex] = true;
      if (target.isConnected) this._renderInpageStepProducts(stepIndex, target);
    });
    return;
  }

  const currentStep = this.selectedBundle?.steps?.[stepIndex];
  const categoryDisplaysVariantsAsIndividual = shouldDisplayVariantsAsIndividualForInpageCategory(
    currentStep,
    stepIndex,
    this.activeInpageCategoryIndexes,
  );
  const products = this._filterProductsForInpageCategory(
    currentStep,
    categoryDisplaysVariantsAsIndividual
      ? this.expandProductsByVariant(rawProducts)
      : rawProducts,
    stepIndex
  );
  target.setAttribute?.('aria-busy', 'false');
  if (products.length === 0) {
    target.innerHTML = this._stepFetchFailed?.[stepIndex]
      ? '<p class="modal-fetch-error">Could not load products. Please check your connection and try again.</p>'
      : '<p class="no-products-message">No products are configured for this step.</p>';
    return;
  }

  const usesCascadeCards = this._isProductPageCascadeTemplate();
  const usesGridCards = this._isProductPageGridTemplate();
  const widgetConfig = this.config || {};
  const productQuantityLimit = ConditionValidator.getAllowedQuantityPerProduct(
    this.selectedBundle?.validateQuantityPerProduct
  );
  const currencyInfo = CurrencyManager.getCurrencyInfo();

  target.innerHTML = products.map(product => {
    const directSelectionKey = product.variantId || product.id;
    const restoredGridSelection = usesGridCards
      ? resolveInpageProductSelection(
        product,
        this.selectedProducts?.[stepIndex],
        (value) => this.normalizeSelectionKey(value),
        this.selectedProductCategoryIndexes?.[stepIndex],
        this.activeInpageCategoryIndexes?.[stepIndex] ?? 0,
      )
      : null;
    const selectionKey = restoredGridSelection?.selectionKey || directSelectionKey;
    const currentQuantity = restoredGridSelection?.quantity
      ?? this.getSelectedQuantity(stepIndex, selectionKey);
    const { available, outOfStock } = this.getVariantAvailable(stepIndex, selectionKey);
    const atMaxStock = available !== null && currentQuantity >= available;
    const atMaxProductQuantity = productQuantityLimit !== null && currentQuantity >= productQuantityLimit;
    const increaseDisabled = outOfStock || atMaxStock || atMaxProductQuantity;
    const stockBadge = outOfStock
      ? '<div class="product-stock-badge product-stock-badge--out">Out of stock</div>'
      : '';
    const variantSelectorHtml = this.renderInlineCardVariantSelector(product, currentStep);

    if (usesCascadeCards) {
      const cascadeProduct = getCascadeSoleVariantDisplayProduct(product);
      return renderSharedProductCard(
        cascadeProduct,
        currentQuantity,
        currencyInfo,
        {
          mode: 'row',
          className: [
            'bw-ppb-cascade-product-row',
            'wpbMixCascadeProductWrapper',
            variantSelectorHtml ? 'bw-ppb-cascade-product-row--has-variant-selector' : '',
            currentQuantity > 0 ? 'selected' : '',
            outOfStock ? 'is-out-of-stock' : '',
          ].filter(Boolean).join(' '),
          description: '',
          displaySeeMoreLink: false,
          expandProductCardOnHover: false,
          variantSelectorHtml,
          addButtonText: resolveProductPageCardButtonText({ currentQuantity, currentStep, outOfStock, defaultAddText: 'Add +' }),
          addDisabled: outOfStock,
          increaseDisabled,
          stockBadgeHtml: stockBadge,
        }
      );
    }

    if (usesGridCards) {
      return renderSharedProductCard(
        selectionKey === directSelectionKey ? product : { ...product, variantId: selectionKey },
        currentQuantity,
        currencyInfo,
        {
          variantSelectorHtml,
          description: '',
          displaySeeMoreLink: false,
          expandProductCardOnHover: false,
          mode: 'grid',
          className: `bw-ppb-cognive-product-card ${outOfStock ? 'is-out-of-stock' : ''}`.trim(),
          addButtonText: resolveProductPageCardButtonText({ currentQuantity, currentStep, outOfStock, defaultAddText: 'Add +' }),
          selectedAction: 'button',
          selectedButtonText: resolveProductPageCardButtonText({ currentQuantity, currentStep, outOfStock, defaultAddText: 'Add +' }),
          addDisabled: false,
          increaseDisabled,
          stockBadgeHtml: stockBadge,
        }
      );
    }

    const addUnavailableAttribute = outOfStock ? 'aria-disabled="true"' : '';
    const showQuantitySelector = !this._usesCompactInpageProductCards()
      && widgetConfig.showQuantitySelectorOnCard;
    const productContent = `
      <div class="product-title">${ComponentGenerator.escapeHtml(product.title)}</div>
      ${product.price ? `
        <div class="product-price-row">
          ${this._shouldShowProductComparedAtPrice() && product.compareAtPrice ? `<span class="product-price-strike">${CurrencyManager.convertAndFormat(product.compareAtPrice, currencyInfo)}</span>` : ''}
          <span class="product-price">${CurrencyManager.convertAndFormat(product.price, currencyInfo)}</span>
        </div>
      ` : ''}
      ${this.renderInlineCardVariantSelector(product, currentStep)}
      ${showQuantitySelector ? `
        <div class="product-quantity-wrapper">
          <div class="product-quantity-selector">
            <button class="qty-btn qty-decrease" data-product-id="${selectionKey}">−</button>
            <span class="qty-display">${currentQuantity}</span>
            <button class="qty-btn qty-increase" data-product-id="${selectionKey}" ${increaseDisabled ? 'disabled aria-disabled="true"' : ''}>+</button>
          </div>
        </div>
      ` : ''}
    `;
    const addButton = `
      <button class="product-add-btn ${currentQuantity > 0 ? 'added' : ''}" data-product-id="${selectionKey}" ${addUnavailableAttribute}>
        ${resolveProductPageCardButtonText({ currentQuantity, currentStep, outOfStock, defaultAddText: 'Add +' })}
      </button>
    `;

    return `
      <div class="product-card ${usesGridCards ? 'bw-ppb-cognive-product-card' : ''} ${currentQuantity > 0 ? 'bw-product-card--selected' : ''} ${outOfStock ? 'is-out-of-stock' : ''}" data-product-id="${selectionKey}">
        <div class="product-image">
          <img src="${product.imageUrl}" alt="${ComponentGenerator.escapeHtml(product.title)}" loading="lazy">
          ${stockBadge}
        </div>
        <div class="product-content-wrapper">
          ${productContent}
          ${addButton}
        </div>
      </div>
    `;
  }).join('');

  this.attachProductEventHandlers(target, stepIndex);
},

renderInlineCardVariantSelector(product, step) {
  if (!shouldRenderInlineVariantSelector({
    bundleVariantSelectorEnabled: this.selectedBundle?.variantSelectorEnabled !== false,
    product,
    displayVariantsAsIndividualProducts: step?.displayVariantsAsIndividual === true || step?.displayVariantsAsIndividualProducts === true,
  })) {
    return '';
  }

  return this.renderVariantSelector(product);
},

createAddMoreCard(step, stepIndex, currentCount) {
  const stepBox = document.createElement('div');
  stepBox.className = 'step-box add-more-card';
  stepBox.dataset.stepIndex = stepIndex;

  const plusIcon = document.createElement('span');
  plusIcon.className = 'plus-icon';
  plusIcon.textContent = '+';
  stepBox.appendChild(plusIcon);

  const stepName = document.createElement('p');
  stepName.className = 'step-name';
  stepName.textContent = step.name || `Step ${stepIndex + 1}`;
  stepBox.appendChild(stepName);

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

  stepBox.addEventListener('click', () => this.openModal(stepIndex));

  return stepBox;
},

createSelectedProductCard(item, cardIndex) {
  const { product, stepIndex, step, variantId, instanceIndex } = item;

  const isDefault = bsIsDefaultStep(step);
  const badgeLabel = bsGetDiscountBadgeLabel(step);

  const stepBox = document.createElement('div');
  stepBox.className = 'step-box step-completed product-card-state bw-slot-card bw-slot-card--filled';
  stepBox.dataset.stepIndex = stepIndex;
  stepBox.dataset.variantId = variantId;
  stepBox.dataset.cardIndex = cardIndex;

  if (!isDefault) {
    const clearBadge = document.createElement('button');
    clearBadge.type = 'button';
    clearBadge.className = 'step-clear-badge';
    clearBadge.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#f3f4f6"/>
        <path d="M8 8L16 16M16 8L8 16" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    clearBadge.title = 'Remove this product';
    clearBadge.setAttribute('aria-label', clearBadge.title);
    clearBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeProductFromSelection(stepIndex, variantId);
    });
    stepBox.appendChild(clearBadge);
  }

  const imagesContainer = document.createElement('div');
  imagesContainer.className = 'bw-slot-card__image-wrapper';
  const img = document.createElement('img');
  img.src = product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
  img.alt = product.title || '';
  img.className = 'bw-slot-card__image';
  imagesContainer.appendChild(img);
  stepBox.appendChild(imagesContainer);

  if (badgeLabel) {
    const badge = document.createElement('span');
    badge.className = 'bw-slot-discount-badge';
    badge.textContent = badgeLabel;
    stepBox.appendChild(badge);
  }

  const productTitle = document.createElement('p');
  productTitle.className = 'step-name step-name-completed product-title-state';
  const displayTitle = resolveSelectedSlotTitle(
    product.title,
    this._usesVerticalModalSlotLayout?.() === true,
  );
  productTitle.textContent = displayTitle;
  productTitle.title = product.title;
  stepBox.appendChild(productTitle);

  makeSlotCardKeyboardAccessible(stepBox, () => this.openModal(stepIndex));

  return stepBox;
},

/**
 * Creates a slot card for a default/compulsory product step.
 * Looks like a filled card but has no remove button and shows an "Included" badge.
 */
createDefaultProductCard(step, stepIndex, product) {
  const stepBox = document.createElement('div');
  stepBox.className = 'step-box bw-slot-card bw-slot-card--filled';
  stepBox.dataset.stepIndex = stepIndex;
  stepBox.dataset.variantId = step.defaultVariantId || '';

  stepBox.style.cursor = 'default';

  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'bw-slot-card__image-wrapper';
  const img = document.createElement('img');
  img.src = product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
  img.alt = product.title || '';
  img.className = 'bw-slot-card__image';
  imageWrapper.appendChild(img);
  stepBox.appendChild(imageWrapper);

  const productTitle = document.createElement('p');
  productTitle.className = 'step-name bw-slot-card__label';
  const displayTitle = product.title.length > 25
    ? product.title.substring(0, 25) + '...'
    : product.title;
  productTitle.textContent = displayTitle;
  productTitle.title = product.title;
  stepBox.appendChild(productTitle);

  const badge = document.createElement('span');
  badge.className = 'bw-slot-card__included-badge';
  badge.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> Included`;
  stepBox.appendChild(badge);

  return stepBox;
},

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
},

/**
 * Creates the free gift slot card.
 * Shows a ribbon icon, "Free {name}" label.
 * Non-clickable (locked) until all paid steps are complete.
 */
createFreeGiftSlotCard(step, stepIndex) {
  const unlocked = this.isFreeGiftUnlocked;
  const stepBox = document.createElement('div');
  stepBox.dataset.stepIndex = stepIndex;

  const stepSelections = this.selectedProducts[stepIndex] || {};
  const selectedEntries = Object.entries(stepSelections).filter(([, qty]) => qty > 0);

  if (selectedEntries.length > 0 && unlocked) {

    const products = this.stepProductData[stepIndex] || [];
    const [variantId] = selectedEntries[0];
    const product = this.findProductBySelectionKey(products, variantId);
    if (product) {

      stepBox.className = 'step-box step-completed product-card-state bw-slot-card bw-slot-card--filled';

      const imageWrapper = document.createElement('div');
      imageWrapper.className = 'bw-slot-card__image-wrapper';
      const img = document.createElement('img');
      img.src = product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
      img.alt = product.title || '';
      img.className = 'bw-slot-card__image';
      imageWrapper.appendChild(img);
      stepBox.appendChild(imageWrapper);

      const clearBadge = document.createElement('button');
      clearBadge.type = 'button';
      clearBadge.className = 'step-clear-badge';
      clearBadge.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#f3f4f6"/><path d="M8 8L16 16M16 8L8 16" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      clearBadge.title = 'Remove this product';
      clearBadge.setAttribute('aria-label', clearBadge.title);
      clearBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeProductFromSelection(stepIndex, variantId);
      });
      stepBox.appendChild(clearBadge);

      const productTitle = document.createElement('p');
      productTitle.className = 'step-name step-name-completed product-title-state';
      const displayTitle = resolveSelectedSlotTitle(
        product.title,
        this._usesVerticalModalSlotLayout?.() === true,
      );
      productTitle.textContent = displayTitle;
      stepBox.appendChild(productTitle);

      stepBox.appendChild(this._createRibbonSvg());
      makeSlotCardKeyboardAccessible(stepBox, () => this.openModal(stepIndex));
      return stepBox;
    }
  }

  stepBox.className = `step-box bw-slot-card bw-slot-card--empty${!unlocked ? ' bw-slot-card--locked' : ''}`;

  const iconWrapper = document.createElement('div');
  iconWrapper.className = 'bw-slot-card__plus-icon';
  const primaryColorBS = getComputedStyle(document.documentElement)
    .getPropertyValue('--bundle-global-primary-button').trim() || '#1e3a8a';
  iconWrapper.style.cssText = `
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: color-mix(in srgb, ${primaryColorBS} 8%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
  `;
  this._appendSlotIcon(iconWrapper);
  iconWrapper.style.color = primaryColorBS;
  stepBox.appendChild(iconWrapper);

  const label = document.createElement('p');
  label.className = 'step-name bw-slot-card__label';
  label.textContent = step.addonLabel || `Free ${step.name || `Step ${stepIndex + 1}`}`;
  stepBox.appendChild(label);

  stepBox.appendChild(this._createRibbonSvg());

  if (unlocked) {
    makeSlotCardKeyboardAccessible(stepBox, () => this.openModal(stepIndex));
  }

  return stepBox;
},

/** Returns the red ribbon SVG element for free gift cards */
_createRibbonSvg() {
  const ribbon = document.createElement('span');
  ribbon.className = 'bw-slot-card__ribbon';

  const badgeUrl = getComputedStyle(document.documentElement)
    .getPropertyValue('--bundle-free-gift-badge-url').trim();
  const hasMerchantBadge = badgeUrl && badgeUrl !== 'none' && badgeUrl !== '';
  if (hasMerchantBadge) {

    const rawUrl = badgeUrl.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
    const img = document.createElement('img');
    img.src = rawUrl;
    img.alt = 'Gift badge';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.display = 'block';
    ribbon.appendChild(img);
  } else {
    ribbon.innerHTML = `<svg viewBox="0 0 24 24" fill="#e53e3e" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M20 7h-1.586l1.293-1.293a1 1 0 0 0-1.414-1.414L16 6.586V5a1 1 0 0 0-2 0v1.586l-1.293-1.293a1 1 0 0 0-1.414 1.414L12.586 8H11a1 1 0 1 0 0 2h1v2h-2a1 1 0 1 0 0 2h2v7l3-1.5 3 1.5V14h2a1 1 0 1 0 0-2h-2v-2h2a1 1 0 1 0 0-2zm-4 2v2h-2V9h2z"/>
    </svg>`;
  }
  return ribbon;
},

removeProductFromSelection(stepIndex, variantId) {

  const step = this.selectedBundle?.steps[stepIndex];
  const normalizedVariantId = this.normalizeSelectionKey(variantId);
  if (!normalizedVariantId) return;

  if (step?.isDefault && this.normalizeSelectionKey(step.defaultVariantId) === normalizedVariantId) return;
  if (this._isDirectDefaultVariant(normalizedVariantId)) return;

  const currentQuantity = this.getSelectedQuantity(stepIndex, normalizedVariantId);

  if (currentQuantity > 1) {

    this.setSelectedQuantity(stepIndex, normalizedVariantId, currentQuantity - 1);
  } else {

    this.setSelectedQuantity(stepIndex, normalizedVariantId, 0);
  }

  this.renderSteps();
  this._renderDirectDefaultProducts();
  this.updateAddToCartButton();
  this.updateFooterMessaging();

  ToastManager.show('Product removed from bundle');
}

};

const ProductPageProductDataMethods = {
resolveStorefrontApiBase() {
  const appProxyPrefix = '/apps/product-bundles';
  if (window.location?.pathname?.startsWith(`${appProxyPrefix}/`)) {
    return appProxyPrefix;
  }

  const configuredAppUrl = window.__BUNDLE_APP_URL__ || '';
  const currentOrigin = window.location.origin;
  const currentHost = window.location.host;
  const shopDomain = window.Shopify?.shop || this.container?.dataset.shop || '';

  let configuredAppHost = '';
  if (configuredAppUrl) {
    try {
      configuredAppHost = new URL(configuredAppUrl).host;
    } catch (_error) {
      configuredAppHost = '';
    }
  }

  if (!configuredAppUrl) {
    return appProxyPrefix;
  }

  if (shopDomain && configuredAppHost !== currentHost) {
    return appProxyPrefix;
  }

  return configuredAppUrl || currentOrigin;
},

collectStepProductIds(step) {
  const productIds = [];
  const addProductId = (product) => {
    const id = product?.id || product?.graphqlId || product?.productId;
    if (id && !productIds.includes(id)) productIds.push(id);
  };

  (step.products || []).forEach(addProductId);
  (step.categories || []).forEach(category => {
    (category.products || []).forEach(addProductId);
    (category.selectedProducts || []).forEach(addProductId);
  });

  return productIds;
},

collectStepCollectionHandles(step) {
  const handles = [];
  const addCollectionHandle = (collection) => {
    const handle = collection?.handle;
    if (handle && !handles.includes(handle)) handles.push(handle);
  };

  (step.collections || []).forEach(addCollectionHandle);
  (step.categories || []).forEach(category => {
    (category.collections || []).forEach(addCollectionHandle);
    (category.collectionsData || []).forEach(addCollectionHandle);
    (category.collectionsSelectedData || []).forEach(addCollectionHandle);
  });

  return handles;
},

async loadStepProducts(stepIndex) {
  const step = this.selectedBundle.steps[stepIndex];

  const cachedProducts = this.stepProductData[stepIndex] || [];
  const hasHydratedProducts = cachedProducts.some(product =>
    product?.variantId
    || product?.imageUrl
    || (Array.isArray(product?.variants) && product.variants.length > 0)
    || typeof product?.price === 'number'
  );

  if (cachedProducts.length > 0 && hasHydratedProducts) {
    return;
  }

  let allProducts = [];
  let fetchFailed = false;

  const shop = window.Shopify?.shop || window.location.host;
  const apiBaseUrl = this.resolveStorefrontApiBase();

  const productIds = this.collectStepProductIds(step);
  if (productIds.length > 0) {
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

  const handles = this.collectStepCollectionHandles(step);
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

  const processedProducts = this._mergeDirectDefaultProductsIntoStep(
    stepIndex,
    this.processProductsForStep(allProducts, step)
  );

  const seen = new Set();
  this.stepProductData[stepIndex] = processedProducts.filter(product => {
    const key = product.variantId || product.id;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  if (!this._stepFetchFailed) this._stepFetchFailed = {};
  this._stepFetchFailed[stepIndex] = fetchFailed && this.stepProductData[stepIndex].length === 0;
},

processProductsForStep(products, step) {

  const trackInventoryOnAddToCart = typeof this.isInventoryTrackingOnAddToCartEnabled === 'function'
    ? this.isInventoryTrackingOnAddToCartEnabled()
    : this._getProductPageControls?.()?.trackInventoryOnAddToCart === true;
  const isTrackedZeroStock = (variant) => (
    variant?.quantityAvailable === 0 && variant?.currentlyNotInStock !== true
  );
  const isVariantSelectableForInventory = (variant) => (
    variant?.available === true && (
      !trackInventoryOnAddToCart || !isTrackedZeroStock(variant)
    )
  );
  const toCents = (value) => Math.round(parseFloat(value || '0') * 100);
  const normalizeVariant = (v) => ({
    id: this.extractId(v.id),
    title: v.title,
    price: toCents(v.price),
    compareAtPrice: v.compareAtPrice ? toCents(v.compareAtPrice) : null,
    sellingPlanAllocations: Array.isArray(v.sellingPlanAllocations)
      ? v.sellingPlanAllocations
      : [],
    available: isVariantSelectableForInventory(v),
    quantityAvailable: typeof v.quantityAvailable === 'number' ? v.quantityAvailable : null,
    currentlyNotInStock: v.currentlyNotInStock === true,
    option1: v.option1 || null,
    option2: v.option2 || null,
    option3: v.option3 || null,
    image: v.image || null
  });

  return products.flatMap(product => {
    const sourceVariants = Array.isArray(product.variants) ? product.variants : [];
    const customerSelectableVariants = sourceVariants.filter(variant => variant?.available !== false);

    if (step.displayVariantsAsIndividual && product.variants && product.variants.length > 0) {
      if (customerSelectableVariants.length === 0) {
        return [];
      }

      const processedVariants = customerSelectableVariants.map(normalizeVariant);

      const processedOptions = (product.options || []).map(opt => {
        if (typeof opt === 'string') return opt;
        return opt.name || opt;
      });

      return customerSelectableVariants
        .map(variant => {

          const imageUrl = variant?.image?.src || product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;

          return {
            id: this.extractId(variant.id),
            title: `${product.title} - ${variant.title}`,
            imageUrl,
            price: toCents(variant.price),
            compareAtPrice: variant.compareAtPrice ? toCents(variant.compareAtPrice) : null,
            variantId: this.extractId(variant.id),
            available: isVariantSelectableForInventory(variant),
            quantityAvailable: typeof variant.quantityAvailable === 'number' ? variant.quantityAvailable : null,
            currentlyNotInStock: variant.currentlyNotInStock === true,
            sellingPlanAllocations: variant.sellingPlanAllocations || [],

            parentProductId: this.extractId(product.id),
            parentTitle: product.title,
            variants: processedVariants,
            options: processedOptions,
            images: product.images || (product.imageUrl ? [{ src: product.imageUrl }] : []),
            description: product.description || '',
            descriptionHtml: product.descriptionHtml || ''
          };
        });
    } else {
      if (sourceVariants.length > 0 && customerSelectableVariants.length === 0) {
        return [];
      }

      const defaultVariant = customerSelectableVariants.find(isVariantSelectableForInventory)
        || customerSelectableVariants[0]
        || null;

      const imageUrl = defaultVariant?.image?.src || product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;

      const processedVariants = customerSelectableVariants.map(normalizeVariant);

      const processedOptions = (product.options || []).map(opt => {
        if (typeof opt === 'string') return opt;
        return opt.name || opt;
      });

        return [{
          id: this.extractId(product.id),
          title: product.title,
          imageUrl,
          price: defaultVariant
            ? toCents(defaultVariant.price)
            : toCents(product.price),
          compareAtPrice: defaultVariant?.compareAtPrice ? toCents(defaultVariant.compareAtPrice) : null,
          variantId: this.extractId(defaultVariant?.id || product.id),
          sellingPlanAllocations: defaultVariant?.sellingPlanAllocations || [],
          available: defaultVariant ? isVariantSelectableForInventory(defaultVariant) : false,
          quantityAvailable: typeof defaultVariant?.quantityAvailable === 'number' ? defaultVariant.quantityAvailable : null,
          currentlyNotInStock: defaultVariant?.currentlyNotInStock === true,
          sourceVariantCount: sourceVariants.length,

          variants: processedVariants,
        options: processedOptions,

        images: product.images || (product.imageUrl ? [{ src: product.imageUrl }] : []),
        description: product.description || '',
        descriptionHtml: product.descriptionHtml || ''
      }];
    }
  });
}
};

const ProductPageSelectionDataMethods = {
isInventoryTrackingOnAddToCartEnabled() {
  const controls = typeof this._getProductPageControls === 'function'
    ? this._getProductPageControls()
    : null;
  return controls?.trackInventoryOnAddToCart === true;
},

/**
 * Look up real stock for a variant. See full-page widget's getVariantAvailable
 * for field semantics.
 */
getVariantAvailable(stepIndex, variantId) {
  const products = this.stepProductData[stepIndex] || [];
  const product = this.findProductBySelectionKey(products, variantId);
  if (!product) {
    return { available: null, outOfStock: false, acceptsBackorder: false };
  }
  if (product.available === false) {
    return { available: 0, outOfStock: true, acceptsBackorder: false };
  }
  const qty = typeof product.quantityAvailable === 'number' ? product.quantityAvailable : null;
  const backorder = product.currentlyNotInStock === true;
  const trackInventoryOnAddToCart = typeof this.isInventoryTrackingOnAddToCartEnabled === 'function'
    ? this.isInventoryTrackingOnAddToCartEnabled()
    : ProductPageSelectionDataMethods.isInventoryTrackingOnAddToCartEnabled.call(this);
  if (!trackInventoryOnAddToCart) {
    return { available: null, outOfStock: false, acceptsBackorder: backorder };
  }
  if (trackInventoryOnAddToCart && qty === 0 && !backorder) {
    return { available: 0, outOfStock: true, acceptsBackorder: false };
  }
  return { available: qty === 0 ? null : qty, outOfStock: false, acceptsBackorder: backorder };
},

findProductBySelectionKey(products, selectionKey) {
  const normalized = this.normalizeSelectionKey(selectionKey);
  if (!normalized) return null;

  return products.find((product) => {
    const ids = [product.variantId, product.id, product.productId];
    if (Array.isArray(product.variants)) {
      ids.push(...product.variants.map((variant) => variant.id));
    }

    return ids.some((id) => this.normalizeSelectionKey(id) === normalized);
  }) || null;
},

shouldApplyIndividualSellingPlanSelection() {
  return this.selectedBundle?.individualSellingPlanSelection?.isEnabled === true;
},

shouldApplyIndividualSellingPlanSelectionForProduct(product, variantId) {
  if (!this.shouldApplyIndividualSellingPlanSelection()) {
    return false;
  }

  const showFor = this.selectedBundle?.individualSellingPlanSelection?.showFor;
  if (showFor !== "OOS_PRODUCTS") {
    return true;
  }

  const normalizedSelectedId = this.extractId(variantId) || String(variantId || "");
  const variant = Array.isArray(product?.variants)
    ? product.variants.find((candidate) => this.extractId(candidate.id) === normalizedSelectedId)
    : null;

  const target = variant ?? product;
  if (!target) {
    return false;
  }

  return target.available === false;
},

getSelectedSellingPlanAllocationId(product, variantId) {
  if (!this.shouldApplyIndividualSellingPlanSelectionForProduct(product, variantId)) {
    return null;
  }

  const normalizedSelectedId = this.extractId(variantId) || String(variantId || '');
  const variant = Array.isArray(product?.variants)
    ? product.variants.find((candidate) => this.extractId(candidate.id) === normalizedSelectedId)
    : null;

  const normalizedProduct = (variant?.sellingPlanAllocations !== undefined ? variant : product) || {};
  const allocations = Array.isArray(normalizedProduct.sellingPlanAllocations)
    ? normalizedProduct.sellingPlanAllocations
    : [];

  if (allocations.length === 0) {
    return null;
  }

  const firstAllocationId = this.extractId(allocations[0]?.id);
  return firstAllocationId || null;
},

extractId(idString) {
  if (!idString) return null;

  const gidMatch = idString.toString().match(/gid:\/\/shopify\/\w+\/(\d+)/);
  if (gidMatch) {
    return gidMatch[1];
  }

  return idString.toString().split('/').pop();
},

normalizeSelectionKey(variantId) {
  const normalized = this.extractId(variantId);
  if (normalized == null) return '';
  return String(normalized);
},

getSelectedQuantity(stepIndex, variantId) {
  const selectedProducts = this.selectedProducts[stepIndex] || {};
  const normalized = this.normalizeSelectionKey(variantId);
  if (!normalized) return 0;

  if (Object.prototype.hasOwnProperty.call(selectedProducts, normalized)) {
    return Number(selectedProducts[normalized]) || 0;
  }

  const alias = Object.entries(selectedProducts).find(([productId]) =>
    this.normalizeSelectionKey(productId) === normalized
  );
  return alias ? Number(alias[1]) || 0 : 0;
},

setSelectedQuantity(stepIndex, variantId, quantity) {
  const selectedProducts = this.selectedProducts[stepIndex];
  if (!selectedProducts) return;

  const normalized = this.normalizeSelectionKey(variantId);
  if (!normalized) return;

  Object.keys(selectedProducts).forEach((productId) => {
    if (this.normalizeSelectionKey(productId) === normalized) {
      delete selectedProducts[productId];
    }
  });

  this.selectedProductCategoryIndexes ||= [];
  this.selectedProductCategoryIndexes[stepIndex] ||= {};
  Object.keys(this.selectedProductCategoryIndexes[stepIndex]).forEach((productId) => {
    if (this.normalizeSelectionKey(productId) === normalized) {
      delete this.selectedProductCategoryIndexes[stepIndex][productId];
    }
  });

  if (quantity > 0) {
    selectedProducts[normalized] = quantity;
    this.selectedProductCategoryIndexes[stepIndex][normalized] =
      this.activeInpageCategoryIndexes?.[stepIndex] ?? 0;
  } else if (this.selectedProductCategoryIndexes?.[stepIndex]) {
    delete this.selectedProductCategoryIndexes[stepIndex][normalized];
  }

  this._persistSessionSelections?.();
},

getAddonLineDiscount(step) {
  const tier = this.getAddonTierEvaluation(step).tier;
  const discount = step?.addonDiscount || tier?.discount || {};
  const type = String(discount.type || '').toUpperCase();
  const value = Number(discount.value || 0);
  if (type !== 'PERCENTAGE' || !Number.isFinite(value) || value <= 0) return null;
  return {
    type,
    value: Math.min(100, value),
    tierId: tier?.tierId || null,
  };
},

getAddonTiers(step) {
  return Array.isArray(step?.addonTiers) ? step.addonTiers.filter(Boolean) : [];
},

getAddonTierEvaluation(step) {
  const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
    this.selectedProducts,
    this.stepProductData,
    this.selectedBundle?.steps
  );
  const directTier = step?.addonEligibilityCondition || step?.addonDiscount
    ? [{
        eligibilityCondition: step?.addonEligibilityCondition || {},
        discount: step?.addonDiscount || {},
        tierId: null,
      }]
    : [];
  const tiers = this.getAddonTiers(step);
  const candidates = tiers.length > 0 ? tiers : directTier;
  if (candidates.length === 0) {
    return { tier: null, totalPrice, totalQuantity, currentValue: totalQuantity, tierIndex: -1, isEligible: false };
  }

  const withState = candidates.map((candidate, index) => {
    const condition = candidate?.eligibilityCondition || {};
    const conditionType = String(condition.type || 'QUANTITY').toUpperCase();
    const conditionValue = Number(condition.value || 0);
    const threshold = conditionType === 'AMOUNT' ? Math.round(conditionValue * 100) : conditionValue;
    const currentValue = conditionType === 'AMOUNT' ? totalPrice : totalQuantity;
    return {
      tier: candidate,
      tierIndex: index,
      conditionType,
      threshold,
      currentValue,
      isEligible: currentValue >= threshold,
    };
  });

  const eligible = withState.filter(candidate => candidate.isEligible)
    .sort((a, b) => (a.threshold - b.threshold) || (a.tierIndex - b.tierIndex));
  const next = withState
    .filter(candidate => !candidate.isEligible)
    .sort((a, b) => (a.threshold - b.threshold) || (a.tierIndex - b.tierIndex));
  const selected = eligible[eligible.length - 1] || next[0] || withState[0];

  return {
    tier: selected?.tier || null,
    tierIndex: selected?.tierIndex ?? -1,
    isEligible: selected?.isEligible === true,
    totalPrice,
    totalQuantity,
    currentValue: selected?.currentValue ?? totalQuantity,
  };
},

getAddonProductSelectionKeys(step) {
  const keys = new Set();
  const addKey = (value) => {
    if (value === null || value === undefined || value === '') return;
    const normalized = this.extractId(value) || value;
    keys.add(String(normalized));
  };
  const products = [
    ...(Array.isArray(step?.StepProduct) ? step.StepProduct : []),
    ...(Array.isArray(step?.products) ? step.products : []),
    ...(Array.isArray(step?.productsData1?.products) ? step.productsData1.products : []),
  ];

  products.forEach(product => {
    addKey(product.id);
    addKey(product.productId);
    addKey(product.graphqlId);
    addKey(product.variantId);
    addKey(product.variantGraphqlId);
    addKey(product.title);
    (Array.isArray(product.variants) ? product.variants : []).forEach(variant => {
      addKey(variant.id);
      addKey(variant.variantId);
      addKey(variant.variantGraphqlId);
      addKey(variant.admin_graphql_api_id);
      addKey(variant.title);
    });
  });

  return keys;
},

calculateSelectedAddonDiscountAmount() {
  const steps = this.selectedBundle?.steps || [];
  const chargeableAddonStep = steps.find(candidate => candidate?.isFreeGift === true && candidate?.addonDisplayFree !== true && this.getAddonLineDiscount(candidate));
  const chargeableAddonStepIndex = steps.indexOf(chargeableAddonStep);
  const chargeableAddonProductKeys = this.getAddonProductSelectionKeys(chargeableAddonStep);

  return this.getAllSelectedProductsData().reduce((total, item) => {
    const isChargeableAddonItem = Number(item.stepIndex) === chargeableAddonStepIndex || (item.isFreeGift === true && item.addonDisplayFree !== true);
    const isChargeableAddonProduct = chargeableAddonProductKeys.has(String(this.extractId(item.variantId) || item.variantId))
      || chargeableAddonProductKeys.has(String(this.extractId(item.productId) || item.productId))
      || chargeableAddonProductKeys.has(String(item.title || ''))
      || chargeableAddonProductKeys.has(String(item.parentTitle || ''));
    if (!isChargeableAddonItem && !isChargeableAddonProduct) return total;
    const step = steps[item.stepIndex];
    const addonDiscount = this.getAddonLineDiscount(step) || this.getAddonLineDiscount(chargeableAddonStep);
    if (!addonDiscount) return total;

    const selectedQuantity = Number(item.quantity || 0);
    const price = Number(item.price || 0);
    if (!selectedQuantity || selectedQuantity <= 0 || !Number.isFinite(price) || price <= 0) return total;
    return total + (price * selectedQuantity * addonDiscount.value / 100);
  }, 0);
},

getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice) {
  const baseDiscountAmount = Math.max(0, Number(discountInfo?.discountAmount || 0));
  const addonDiscountAmount = this.calculateSelectedAddonDiscountAmount();
  const combinedDiscountAmount = Math.min(totalPrice, baseDiscountAmount + addonDiscountAmount);
  const finalPrice = Math.max(0, totalPrice - combinedDiscountAmount);

  return {
    ...discountInfo,
    hasDiscount: combinedDiscountAmount > 0,
    qualifiesForDiscount: combinedDiscountAmount > 0,
    discountAmount: combinedDiscountAmount,
    savings: combinedDiscountAmount,
    addonDiscountAmount,
    finalPrice,
    discountPercentage: totalPrice > 0 ? (combinedDiscountAmount / totalPrice) * 100 : 0,
  };
},

getAllSelectedProductsData() {
  const allProducts = [];

  this.selectedBundle.steps.forEach((step, stepIndex) => {
    const stepSelections = this.selectedProducts[stepIndex] || {};
    const productsInStep = this.stepProductData[stepIndex] || [];

    Object.entries(stepSelections).forEach(([variantId, quantity]) => {
      if (quantity > 0) {
        const normalizedVariantId = this.normalizeSelectionKey(variantId);
        let product = this.findProductBySelectionKey(productsInStep, normalizedVariantId);
        if (!product && normalizedVariantId) {
          product = this.findProductBySelectionKey(productsInStep, variantId);
        }

        let matchedVariant = null;
        if (!product) {
          for (const p of productsInStep) {
            if (p.variants && Array.isArray(p.variants)) {
              const variant = p.variants.find(v =>
                this.normalizeSelectionKey(v.id) === normalizedVariantId
                || String(v.id) === String(variantId)
              );
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
          const variantTitle = isVariantMatch && matchedVariant.title && matchedVariant.title !== 'Default Title'
            ? matchedVariant.title
            : (product.variantTitle && product.variantTitle !== 'Default Title' ? product.variantTitle : '');
          const imageUrl = isVariantMatch
            ? (matchedVariant.image?.src || matchedVariant.image || product.imageUrl || product.image?.src || '')
            : (product.imageUrl || product.image?.src || '');
          const price = isVariantMatch
            ? (typeof variantData.price === 'number' ? variantData.price : (parseFloat(variantData.price || '0') * 100))
            : (product.price || 0);

          allProducts.push({
            stepIndex,
            variantId,
            quantity,
            title: isVariantMatch
              ? (variantTitle ? `${product.title} - ${variantTitle}` : product.title)
              : (product.title || 'Untitled Product'),
            parentTitle: product.parentTitle || product.title || 'Untitled Product',
            variantTitle,
            imageUrl,
            image: imageUrl,
            price,
            productId: product.productId || product.id,
            isDefault: step.isDefault ?? false,
            isFreeGift: step.isFreeGift ?? false,
            addonDisplayFree: step.addonDisplayFree === true,
          });
        }
      }
    });
  });

  return allProducts;
},

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
};

const PRODUCT_PAGE_SELECTION_STORAGE_VERSION = 2;

function normalizeStepSelections(stepSelections) {
  if (
    !stepSelections ||
    typeof stepSelections !== "object" ||
    Array.isArray(stepSelections)
  ) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(stepSelections).flatMap(([selectionKey, rawQuantity]) => {
      const quantity = Math.floor(Number(rawQuantity));
      if (!selectionKey || !Number.isFinite(quantity) || quantity <= 0)
        return [];
      return [[String(selectionKey), quantity]];
    })
  );
}

function getProductPageSelectionStorageKey(bundle = {}) {
  const bundleKey = bundle.offerId || bundle.id;
  return bundleKey ? `wpbPpb-cart-${String(bundleKey)}` : null;
}

function normalizeProductPageSessionSelections(payload, stepCount) {
  if (
    !payload ||
    payload.v !== PRODUCT_PAGE_SELECTION_STORAGE_VERSION ||
    !Array.isArray(payload.selectedProducts)
  ) {
    return null;
  }

  const count = Math.max(0, Math.floor(Number(stepCount) || 0));
  return Array.from({ length: count }, (_, stepIndex) =>
    normalizeStepSelections(payload.selectedProducts[stepIndex])
  );
}

function normalizeProductPageSessionSelectionCategories(
  payload,
  normalizedSelections,
  stepCount,
) {
  if (
    !payload
    || payload.v !== PRODUCT_PAGE_SELECTION_STORAGE_VERSION
    || !Array.isArray(payload.selectedProductCategoryIndexes)
  ) {
    return null;
  }

  const count = Math.max(0, Math.floor(Number(stepCount) || 0));
  return Array.from({ length: count }, (_, stepIndex) => {
    const stepSelections = normalizedSelections?.[stepIndex] || {};
    const categoryIndexes = payload.selectedProductCategoryIndexes[stepIndex];
    if (!categoryIndexes || typeof categoryIndexes !== 'object' || Array.isArray(categoryIndexes)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(categoryIndexes).flatMap(([selectionKey, rawCategoryIndex]) => {
        const categoryIndex = Number(rawCategoryIndex);
        if (
          !Object.prototype.hasOwnProperty.call(stepSelections, selectionKey)
          || !Number.isInteger(categoryIndex)
          || categoryIndex < 0
        ) {
          return [];
        }
        return [[selectionKey, categoryIndex]];
      }),
    );
  });
}

function createProductPageSessionSelectionPayload(
  selectedProducts = [],
  selectedProductCategoryIndexes = [],
) {
  return {
    v: PRODUCT_PAGE_SELECTION_STORAGE_VERSION,
    selectedProducts: Array.isArray(selectedProducts)
      ? selectedProducts.map(normalizeStepSelections)
      : [],
    selectedProductCategoryIndexes: Array.isArray(selectedProductCategoryIndexes)
      ? selectedProductCategoryIndexes.map((categoryIndexes, stepIndex) => {
        const stepSelections = normalizeStepSelections(selectedProducts?.[stepIndex]);
        if (!categoryIndexes || typeof categoryIndexes !== 'object' || Array.isArray(categoryIndexes)) {
          return {};
        }
        return Object.fromEntries(
          Object.entries(categoryIndexes).flatMap(([selectionKey, rawCategoryIndex]) => {
            const categoryIndex = Number(rawCategoryIndex);
            if (
              !Object.prototype.hasOwnProperty.call(stepSelections, selectionKey)
              || !Number.isInteger(categoryIndex)
              || categoryIndex < 0
            ) {
              return [];
            }
            return [[selectionKey, categoryIndex]];
          }),
        );
      })
      : [],
  };
}

const ProductPageSelectionPersistenceMethods = {
  _getProductPageSelectionStorage() {
    try {
      return window.sessionStorage;
    } catch (_error) {
      return null;
    }
  },

  _getProductPageSelectionStorageKey() {
    return getProductPageSelectionStorageKey(this.selectedBundle);
  },

  _restoreSessionSelections() {
    let restoredSelections = null;
    let parsedPayload = null;

    try {
      const storage = this._getProductPageSelectionStorage();
      const storageKey = this._getProductPageSelectionStorageKey();
      const rawValue =
        storage && storageKey ? storage.getItem(storageKey) : null;
      if (rawValue) {
        parsedPayload = JSON.parse(rawValue);
        restoredSelections = normalizeProductPageSessionSelections(
          parsedPayload,
          this.selectedBundle?.steps?.length
        );
      }
    } catch (_error) {
      restoredSelections = null;
    }

    if (restoredSelections) {
      const restoredCategoryIndexes = normalizeProductPageSessionSelectionCategories(
        parsedPayload,
        restoredSelections,
        this.selectedBundle?.steps?.length,
      ) || restoredSelections.map(() => ({}));
      this.selectedProducts = restoredSelections.map(
        (stepSelections, stepIndex) => ({
          ...(this.selectedProducts?.[stepIndex] || {}),
          ...stepSelections,
        })
      );
      this.selectedProductCategoryIndexes = restoredCategoryIndexes.map(
        (categoryIndexes, stepIndex) => ({
          ...(this.selectedProductCategoryIndexes?.[stepIndex] || {}),
          ...categoryIndexes,
        }),
      );
    }

    this._selectionPersistenceReady = true;
    return restoredSelections !== null;
  },

  _persistSessionSelections() {
    if (!this._selectionPersistenceReady) return false;

    try {
      const storage = this._getProductPageSelectionStorage();
      const storageKey = this._getProductPageSelectionStorageKey();
      if (!storage || !storageKey) return false;

      storage.setItem(
        storageKey,
        JSON.stringify(
          createProductPageSessionSelectionPayload(
            this.selectedProducts,
            this.selectedProductCategoryIndexes,
          )
        )
      );
      return true;
    } catch (_error) {
      return false;
    }
  },

  async _preloadRestoredSelectionProducts() {
    const stepIndexes = (this.selectedProducts || []).flatMap(
      (stepSelections, stepIndex) =>
        Object.keys(stepSelections || {}).length > 0 ? [stepIndex] : []
    );
    await Promise.all(
      stepIndexes.map((stepIndex) =>
        this.loadStepProducts(stepIndex).catch(() => {})
      )
    );
  },
};

function resolveProductPageCardButtonText({
  currentQuantity = 0,
  currentStep = {},
  outOfStock = false,
  defaultAddText = 'Add +',
} = {}) {
  if (outOfStock) return 'Out of stock';

  const rawText = currentQuantity > 0
    ? (currentStep?.addonReplaceText || `Added x${currentQuantity}`)
    : (currentStep?.addonAddText || defaultAddText);

  return String(rawText)
    .replace(/\{\{\s*allowedQuantity\s*\}\}/g, String(currentQuantity))
    .replace(/\{\{\s*quantity\s*\}\}/g, String(currentQuantity));
}

function shouldDisableProductPageVariantOption(variant, trackInventoryOnAddToCart = false) {
  if (variant?.available !== true) {
    return true;
  }

  return trackInventoryOnAddToCart === true
    && variant?.quantityAvailable === 0
    && variant?.currentlyNotInStock !== true;
}

function shouldDisplayVariantsAsIndividualForModalCategory(
  step,
  stepIndex,
  activeCategoryIndexes = {},
) {
  const categories = Array.isArray(step?.categories) ? step.categories : [];
  if (categories.length > 0) {
    const activeIndex = typeof activeCategoryIndexes?.[stepIndex] === 'number'
      ? activeCategoryIndexes[stepIndex]
      : 0;
    const category = categories[activeIndex] || categories[0];
    return category?.displayVariantsAsIndividualProducts === true
      || category?.displayVariantsAsIndividual === true;
  }

  return step?.displayVariantsAsIndividualProducts === true
    || step?.displayVariantsAsIndividual === true;
}

function getModalSoleVariantDisplayTitle(product = {}) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  if (Number(product?.sourceVariantCount || 0) <= 1 || variants.length !== 1) {
    return '';
  }

  const title = typeof variants[0]?.title === 'string' ? variants[0].title.trim() : '';
  return title && title !== 'Default Title' ? title : '';
}

function applyProductPageVariantSelection({
  product = {},
  variantData = {},
  productCard = null,
  formatPrice = null,
  showCompareAtPrice = false,
} = {}) {
  const nextVariantId = variantData.id || product.variantId || product.id;
  const nextVariantTitle = variantData.title && variantData.title !== 'Default Title'
    ? variantData.title
    : '';
  const nextPrice = normalizeVariantPrice(variantData.price);
  const nextCompareAtPrice = normalizeVariantPrice(variantData.compareAtPrice);
  const nextImageUrl = resolveVariantImageUrl(variantData) || product.imageUrl || product.image?.src || '';

  product.quantityAvailable = typeof variantData.quantityAvailable === 'number'
    ? variantData.quantityAvailable
    : null;
  product.currentlyNotInStock = variantData.currentlyNotInStock === true;
  product.variantId = nextVariantId;
  product.variantTitle = nextVariantTitle;
  if (Number.isFinite(nextPrice)) product.price = nextPrice;
  product.compareAtPrice = Number.isFinite(nextCompareAtPrice) ? nextCompareAtPrice : null;
  if (nextImageUrl) {
    product.imageUrl = nextImageUrl;
    product.image = nextImageUrl;
  }

  if (!productCard) return product;

  productCard.dataset.productId = nextVariantId;
  productCard.dataset.currentSelectedVariantId = nextVariantId;
  productCard.querySelectorAll?.('[data-product-id]').forEach(el => {
    el.dataset.productId = nextVariantId;
  });

  const priceEl = productCard.querySelector?.('.product-price');
  if (priceEl && Number.isFinite(product.price) && typeof formatPrice === 'function') {
    priceEl.textContent = formatPrice(product.price);
  }

  const compareEl = productCard.querySelector?.('.product-price-strike');
  if (compareEl) {
    if (showCompareAtPrice === true && Number.isFinite(product.compareAtPrice) && typeof formatPrice === 'function') {
      compareEl.textContent = formatPrice(product.compareAtPrice);
    } else if (typeof compareEl.remove === 'function') {
      compareEl.remove();
    } else {
      compareEl.textContent = '';
    }
  }

  const imageEl = productCard.querySelector?.('.bw-product-card__image, .product-image img');
  if (imageEl && nextImageUrl) {
    imageEl.src = nextImageUrl;
  }

  return product;
}

function normalizeVariantPrice(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

function resolveVariantImageUrl(variantData = {}) {
  const image = variantData.image;
  if (!image) return '';
  if (typeof image === 'string') return image;
  return image.src || image.url || image.originalSrc || '';
}

const ProductPageModalMethods = {
renderModalTabs() {
  const tabsContainer = this.elements.modal.querySelector('.modal-tabs');
  tabsContainer.innerHTML = '';

  const stepCount = this.selectedBundle.steps.length;
  tabsContainer.style.setProperty('--bw-tab-count', stepCount.toString());

  this.selectedBundle.steps.forEach((step, index) => {
    const isAccessible = this.isStepAccessible(index);
    const isActive = index === this.currentStepIndex;
    const isFreeGift = !!step.isFreeGift;

    const freeGiftAccessible = !isFreeGift || this.isFreeGiftUnlocked;

    const tabButton = document.createElement('button');
    const freeGiftClass = isFreeGift ? ' bw-free-gift-tab' : '';
    tabButton.className = `bundle-header-tab${freeGiftClass} ${isActive ? 'active' : ''} ${(!isAccessible || !freeGiftAccessible) ? 'locked' : ''}`;
    tabButton.textContent = (step.isFreeGift && step.addonLabel) ? step.addonLabel : (step.name || `Step ${index + 1}`);
    tabButton.dataset.stepIndex = index.toString();

    tabButton.addEventListener('click', async () => {

      if (!this.isStepAccessible(index)) {
        ToastManager.show('Please complete the previous steps first.');
        return;
      }

      if (step.isFreeGift && !this.isFreeGiftUnlocked) {
        ToastManager.show('Complete all required steps to unlock the free gift.');
        return;
      }

      const shouldValidateConditions = this._isConditionValidationEnabled?.() !== false;
      if (shouldValidateConditions && index > this.currentStepIndex && !this.validateStep(this.currentStepIndex)) {
        ToastManager.show('Please meet the step conditions before proceeding.');
        return;
      }

      this.currentStepIndex = index;

      const headerText = this.getFormattedHeaderText();
      const header = this.elements.modal.querySelector('.modal-step-title');
      if (header) {
        header.textContent = headerText;
      }

      this.showLoadingOverlay(this.selectedBundle?.loadingGif || null);
      try {
        await this.loadStepProducts(index);
      } finally {
        this.hideLoadingOverlay();
      }

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

  this.renderModalCategoryTabs();
},

renderModalCategoryTabs() {
  const tabsContainer = this.elements.modal.querySelector('.bw-bs-category-tabs');
  if (!tabsContainer) return;

  const stepIndex = this.currentStepIndex;
  const step = this.selectedBundle?.steps?.[stepIndex];
  const categories = Array.isArray(step?.categories) ? step.categories : [];
  tabsContainer.textContent = '';

  if (categories.length <= 1) {
    tabsContainer.hidden = true;
    return;
  }

  this.activeInpageCategoryIndexes ||= {};
  if (typeof this.activeInpageCategoryIndexes[stepIndex] !== 'number') {
    this.activeInpageCategoryIndexes[stepIndex] = 0;
  }

  tabsContainer.hidden = false;
  categories.forEach((category, categoryIndex) => {
    const button = tabsContainer.ownerDocument.createElement('button');
    button.type = 'button';
    button.className = 'bw-bs-category-tab';
    button.dataset.categoryIndex = String(categoryIndex);
    button.textContent = this._getInpageCategoryLabel(category, categoryIndex);
    button.classList.toggle(
      'active',
      categoryIndex === this.activeInpageCategoryIndexes[stepIndex]
    );
    button.addEventListener('click', () => {
      this.activeInpageCategoryIndexes[stepIndex] = categoryIndex;
      tabsContainer.querySelectorAll('.bw-bs-category-tab').forEach(tab => {
        tab.classList.toggle('active', tab === button);
      });
      this.renderModalProducts(stepIndex);
    });
    tabsContainer.appendChild(button);
  });
},

renderModalProducts(stepIndex, productsToRender = null) {

  const rawProducts = productsToRender || this.stepProductData[stepIndex];
  const currentStep = this.selectedBundle?.steps?.[stepIndex];
  const widgetConfig = this.config || {};
  const categoryProducts = this._filterProductsForInpageCategory(
    currentStep,
    rawProducts,
    stepIndex
  );
  const products = shouldDisplayVariantsAsIndividualForModalCategory(
    currentStep,
    stepIndex,
    this.activeInpageCategoryIndexes,
  )
    ? this.expandProductsByVariant(categoryProducts)
    : categoryProducts;
  const selectedProducts = this.selectedProducts[stepIndex];
  const productGrid = this.elements.modal.querySelector('.product-grid');
  const isFreeGiftStep = !!currentStep?.isFreeGift;

  const bodyEl = this.elements.modal.querySelector('.bw-bs-body') || this.elements.modal.querySelector('.modal-body');
  const existingPromo = bodyEl?.querySelector('.bw-bs-free-gift-promo');
  if (existingPromo) existingPromo.remove();
  if (isFreeGiftStep && bodyEl) {
    const promo = document.createElement('div');
    promo.className = 'bw-bs-free-gift-promo';
    const stepName = currentStep.name || 'gift';
    const firstProduct = rawProducts?.[0];
    const priceStr = firstProduct?.price
      ? CurrencyManager.convertAndFormat(firstProduct.price, CurrencyManager.getCurrencyInfo())
      : '';
    promo.innerHTML = `
      <p class="bw-bs-free-gift-heading">Free ${ComponentGenerator.escapeHtml(stepName)}!</p>
      <p class="bw-bs-free-gift-subheading">Add ${this.paidSteps.length} items to unlock</p>
    `;
    bodyEl.insertBefore(promo, productGrid);
  }

  if (products.length === 0) {

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

  const showQuantitySelector = widgetConfig.showQuantitySelectorOnCard;

  const freeGiftCardClass = isFreeGiftStep ? ' bw-product-card--free-gift' : '';
  const productQuantityLimit = ConditionValidator.getAllowedQuantityPerProduct(
    this.selectedBundle?.validateQuantityPerProduct
  );

  productGrid.innerHTML = products.map(product => {
    const selectionKey = product.variantId || product.id;
    const currentQuantity = this.getSelectedQuantity(stepIndex, selectionKey);
    const currencyInfo = CurrencyManager.getCurrencyInfo();

    const { available, outOfStock } = this.getVariantAvailable(stepIndex, selectionKey);
    const atMaxStock = available !== null && currentQuantity >= available;
    const lowStock = available !== null && available > 0 && available <= 3;
    const atMaxProductQuantity = productQuantityLimit !== null && currentQuantity >= productQuantityLimit;
    const increaseDisabled = outOfStock || atMaxStock || atMaxProductQuantity;
    const addUnavailableAttribute = outOfStock ? 'aria-disabled="true"' : '';
    const soleVariantDisplayTitle = getModalSoleVariantDisplayTitle(product);

      const stockBadge = outOfStock
        ? `<div class="product-stock-badge product-stock-badge--out">Out of stock</div>`
        : lowStock
          ? `<div class="product-stock-badge product-stock-badge--low">Only ${available} left</div>`
          : '';
      return `
      <div class="product-card${freeGiftCardClass} ${currentQuantity > 0 ? 'bw-product-card--selected' : ''} ${outOfStock ? 'is-out-of-stock' : ''}" data-product-id="${selectionKey}">
        <div class="product-image">
          <img src="${product.imageUrl}" alt="${ComponentGenerator.escapeHtml(product.title)}" loading="lazy">
          ${stockBadge}
        </div>

        <div class="product-content-wrapper">
          <div class="product-title">${ComponentGenerator.escapeHtml(product.title)}</div>

          ${product.price ? `
            <div class="product-price-row">
              ${this._shouldShowProductComparedAtPrice() && product.compareAtPrice ? `<span class="product-price-strike">${CurrencyManager.convertAndFormat(product.compareAtPrice, currencyInfo)}</span>` : ''}
              <span class="product-price">${CurrencyManager.convertAndFormat(product.price, currencyInfo)}</span>
            </div>
          ` : ''}

          <div class="product-spacer"></div>

          ${this.renderVariantSelector(product)}

          ${soleVariantDisplayTitle ? `
            <div class="bw-bs-single-variant-title">${ComponentGenerator.escapeHtml(soleVariantDisplayTitle)}</div>
          ` : ''}

          ${showQuantitySelector ? `
            <div class="product-quantity-wrapper">
              <div class="product-quantity-selector">
                <button class="qty-btn qty-decrease" data-product-id="${selectionKey}">−</button>
                <span class="qty-display">${currentQuantity}</span>
                <button class="qty-btn qty-increase" data-product-id="${selectionKey}" ${increaseDisabled ? 'disabled aria-disabled="true"' : ''}>+</button>
              </div>
            </div>
          ` : ''}

          <button class="product-add-btn ${currentQuantity > 0 ? 'added' : ''}" data-product-id="${selectionKey}" ${addUnavailableAttribute}>
            ${resolveProductPageCardButtonText({ currentQuantity, currentStep, outOfStock, defaultAddText: 'Add to Cart' })}
          </button>
        </div>
      </div>
    `;
  }).join('');

  productGrid.classList.remove('bw-animate-in');
  void productGrid.offsetWidth;
  productGrid.classList.add('bw-animate-in');

  this.attachProductEventHandlers(productGrid, stepIndex);
},

renderVariantSelector(product) {
  if (!product.variants || product.variants.length <= 1) {
    return '';
  }

  const trackInventoryOnAddToCart = typeof this.isInventoryTrackingOnAddToCartEnabled === 'function'
    ? this.isInventoryTrackingOnAddToCartEnabled()
    : false;

  return `
    <div class="variant-selector-wrapper">
      <select class="variant-selector" data-base-product-id="${product.id}">
        ${product.variants.map(v => {
          const isHardOOS = shouldDisableProductPageVariantOption(v, trackInventoryOnAddToCart);
          const label = isHardOOS ? `${v.title} — out of stock` : v.title;
          const selected = v.id === product.variantId ? 'selected' : '';
          const disabled = isHardOOS ? 'disabled' : '';
          return `<option value="${v.id}" ${selected} ${disabled}>${label}</option>`;
        }).join('')}
      </select>
    </div>
  `;
},

renderModalProductsLoading(stepIndex) {
  const productGrid = this.elements.modal.querySelector('.product-grid');

  productGrid.innerHTML = `
    ${Array(6).fill(0).map(() => `
      <div class="product-card skeleton-loading">
        <div class="skeleton-card-content"></div>
      </div>
    `).join('')}
  `;
},

preloadNextStep() {
  const nextStepIndex = this.currentStepIndex + 1;

  if (nextStepIndex >= this.selectedBundle.steps.length) {
    return;
  }

  if (this.stepProductData[nextStepIndex]?.length > 0) {
    return;
  }

  this.loadStepProducts(nextStepIndex)
    .then(() => {
    })
    .catch(error => {

    });
},

attachProductEventHandlers(productGrid, stepIndex) {

  const newProductGrid = productGrid.cloneNode(true);
  productGrid.parentNode.replaceChild(newProductGrid, productGrid);

  const step = this.selectedBundle.steps[stepIndex];

  const findProduct = (productId) => {
    return this.findProductBySelectionKey(this.stepProductData[stepIndex] || [], productId);
  };
  const hasDomElement = typeof Element !== 'undefined';
  const getEventTarget = (eventTarget) => {
    if (!eventTarget) return null;
    if (!hasDomElement) return eventTarget;
    return eventTarget instanceof Element ? eventTarget : eventTarget.parentElement;
  };

  const matchesSelector = (element, selector) => {
    if (!element) return false;
    if (typeof element.matches === 'function') {
      return element.matches(selector);
    }

    if (selector.startsWith('.')) {
      return element.classList?.contains(selector.slice(1));
    }

    const dataProductId = selector.match(/^\[data-product-id="(.+)"\]$/);
    if (dataProductId) {
      return element.dataset?.productId === dataProductId[1];
    }

    return false;
  };

  const findClosest = (element, selector) => {
    if (!element) return null;
    const selectors = selector
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    let current = element;
    while (current) {
      if (selectors.some((candidate) => matchesSelector(current, candidate))) {
        return current;
      }
      current = current.parentElement;
    }

    return null;
  };

  newProductGrid.addEventListener('click', (e) => {
    const eventTarget = getEventTarget(e.target);
    if (!eventTarget) return;

    if (eventTarget.classList.contains('qty-btn') || eventTarget.classList.contains('inline-qty-btn')) {
      e.stopPropagation();
      const productId = eventTarget.dataset.productId;
      const isIncrease = eventTarget.classList.contains('qty-increase');
      const currentQuantity = this.getSelectedQuantity(stepIndex, productId);

      const newQuantity = isIncrease ? currentQuantity + 1 : Math.max(0, currentQuantity - 1);
      this.updateProductSelection(stepIndex, productId, newQuantity);
    }
  });

  newProductGrid.addEventListener('click', (e) => {
    const eventTarget = getEventTarget(e.target);
    if (!eventTarget) return;

    if (eventTarget.classList.contains('product-add-btn')) {
      e.stopPropagation();
      const productId = eventTarget.dataset.productId;
      const product = findProduct(productId);

      if (product && product.variants && product.variants.length > 1 && this.productModal) {
        this.productModal.open(product, step);
      } else {

        const currentQuantity = this.getSelectedQuantity(stepIndex, productId);
        this.updateProductSelection(stepIndex, productId, currentQuantity > 0 ? 0 : 1);
      }
    }
  });

  newProductGrid.addEventListener('click', (e) => {
    const eventTarget = getEventTarget(e.target);
    if (!eventTarget) return;

    const productCard = findClosest(eventTarget, '.product-card');
    if (!productCard) return;
    if (findClosest(eventTarget, '.product-add-btn, .qty-btn, .inline-qty-btn, .variant-selector, button, input, select, a')) return;

    const productImage = findClosest(eventTarget, '.product-image');
    const productTitle = findClosest(eventTarget, '.product-title');
    const canClickCardToAdd = this._isProductCardClickAddEnabled();
    if (!canClickCardToAdd && !productImage && !productTitle) return;

    const productId = productCard.dataset.productId;
    const product = findProduct(productId);
    if (!product) return;

    if (product.variants && product.variants.length > 1 && this.productModal && step) {
      this.productModal.open(product, step);
      return;
    }

    if (canClickCardToAdd) {
      const currentQuantity = this.getSelectedQuantity(stepIndex, productId);
      this.updateProductSelection(stepIndex, productId, currentQuantity > 0 ? 0 : 1);
    }
  });

  newProductGrid.querySelectorAll('.product-card').forEach(card => {
    const productId = card.dataset.productId;
    const product = findProduct(productId);
    const canClickCardToAdd = this._isProductCardClickAddEnabled();
    if (canClickCardToAdd) {
      card.style.cursor = 'pointer';
    }
    if (product && product.variants && product.variants.length > 1 && this.productModal) {
      const imageEl = card.querySelector('.product-image');
      const titleEl = card.querySelector('.product-title');
      if (imageEl) imageEl.style.cursor = 'pointer';
      if (titleEl) titleEl.style.cursor = 'pointer';
    }
  });

  newProductGrid.addEventListener('change', (e) => {
    if (e.target.classList.contains('variant-selector')) {
      e.stopPropagation();
      const newVariantId = e.target.value;
      const baseProductId = e.target.dataset.baseProductId;

      const product = this.stepProductData[stepIndex].find(p => p.id === baseProductId);
      if (product && product.variants) {
        const variantData = product.variants.find(v => v.id === newVariantId);
        if (variantData) {

          product.quantityAvailable = typeof variantData.quantityAvailable === 'number'
            ? variantData.quantityAvailable
            : null;
          product.currentlyNotInStock = variantData.currentlyNotInStock === true;

          const oldQuantity = this.getSelectedQuantity(stepIndex, product.variantId);
          if (oldQuantity > 0) {
            this.setSelectedQuantity(stepIndex, product.variantId, 0);

            const newQtyAvail = product.quantityAvailable;
            const trackInventoryOnAddToCart = typeof this.isInventoryTrackingOnAddToCartEnabled === 'function'
              ? this.isInventoryTrackingOnAddToCartEnabled()
              : false;
            const newOOS = shouldDisableProductPageVariantOption(product, trackInventoryOnAddToCart);
            let migratedQty = oldQuantity;
            if (newOOS) {
              ToastManager.show('Selected variant is out of stock — selection cleared.');
              migratedQty = 0;
            } else if (trackInventoryOnAddToCart && newQtyAvail !== null && oldQuantity > newQtyAvail) {
              migratedQty = newQtyAvail;
              ToastManager.show('Only ' + newQtyAvail + ' in stock — quantity adjusted.');
            }
            if (migratedQty > 0) {
              this.setSelectedQuantity(stepIndex, newVariantId, migratedQty);
            }
          }

          const productCard = e.target.closest('.product-card');
          applyProductPageVariantSelection({
            product,
            variantData,
            productCard,
            formatPrice: (amount) => CurrencyManager.convertAndFormat(amount, CurrencyManager.getCurrencyInfo()),
            showCompareAtPrice: this._shouldShowProductComparedAtPrice(),
          });

          this.updateModalNavigation();
          this.updateModalFooterMessaging();
        }
      }
    }
  });
}
};

function createInlineQuantityControl(productId, quantity, increaseDisabled) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('inline-quantity-controls', 'bw-quantity-control');
  wrapper.dataset.productId = productId;

  const decreaseButton = document.createElement('button');
  decreaseButton.type = 'button';
  decreaseButton.classList.add('inline-qty-btn', 'qty-decrease', 'bw-quantity-control__button');
  decreaseButton.dataset.productId = productId;
  decreaseButton.textContent = '−';

  const display = document.createElement('span');
  display.classList.add('inline-qty-display', 'bw-quantity-control__value');
  display.textContent = String(quantity);

  const increaseButton = document.createElement('button');
  increaseButton.type = 'button';
  increaseButton.classList.add('inline-qty-btn', 'qty-increase', 'bw-quantity-control__button');
  increaseButton.dataset.productId = productId;
  increaseButton.textContent = '+';
  if (increaseDisabled) {
    increaseButton.disabled = true;
    increaseButton.setAttribute('aria-disabled', 'true');
  }

  wrapper.appendChild(decreaseButton);
  wrapper.appendChild(display);
  wrapper.appendChild(increaseButton);

  return wrapper;
}

function createProductPageAddButton(productId, text) {
  const addButton = document.createElement('button');
  addButton.type = 'button';
  addButton.classList.add('product-add-btn', 'bw-product-card__add-button');
  addButton.dataset.productId = productId;
  addButton.textContent = text;
  return addButton;
}

function bsFindNextIncompleteStep(steps, selectedProducts, validateFn, fromIndex) {
  for (let i = fromIndex + 1; i < steps.length; i++) {
    if (steps[i].isDefault || steps[i].isFreeGift) continue;
    if (!validateFn(i)) return i;
  }
  return -1;
}

function normalizeProductPageAutoNextId(value) {
  if (value === null || value === undefined || value === '') return '';
  return String(value).split('/').pop();
}

function collectCategoryAutoNextProductIds(category) {
  const ids = new Set();
  const addId = (value) => {
    const normalized = normalizeProductPageAutoNextId(value);
    if (normalized) ids.add(normalized);
  };
  const addProduct = (product) => {
    addId(product?.id);
    addId(product?.productId);
    addId(product?.graphqlId);
    addId(product?.variantId);
    addId(product?.variantGraphqlId);
    (Array.isArray(product?.variants) ? product.variants : []).forEach(variant => {
      addId(variant?.id);
      addId(variant?.variantId);
      addId(variant?.variantGraphqlId);
      addId(variant?.admin_graphql_api_id);
    });
  };

  (category?.products || []).forEach(addProduct);
  (category?.selectedProducts || []).forEach(addProduct);
  return ids;
}

function shouldAutoAdvanceProductPageStep({ quantity = 0, productId = '', step = null } = {}) {
  if (
    quantity > 0
    && step?.autoNextStepOnConditionMet === true
    && step?.conditionType
    && step?.conditionOperator
    && Number(step.conditionValue || 0) > 0
  ) {
    return true;
  }

  const categories = Array.isArray(step?.categories) ? step.categories : [];
  const categoryRuleCategories = categories.filter(category =>
    Array.isArray(category?.conditions) && category.conditions.length > 0
  );

  if (!(quantity > 0) || categoryRuleCategories.length === 0) {
    return false;
  }

  const selectedProductId = normalizeProductPageAutoNextId(productId);
  return categoryRuleCategories.some(category => {
    if (category.autoNextStepOnConditionMet !== true) return false;
    const categoryProductIds = collectCategoryAutoNextProductIds(category);
    if (categoryProductIds.size === 0) {
      return categoryRuleCategories.length === 1;
    }
    return categoryProductIds.has(selectedProductId);
  });
}

const ProductPageSelectionMethods = {
updateProductSelection(stepIndex, productId, newQuantity) {
  const selectionKey = this.normalizeSelectionKey(productId);
  let quantity = Math.max(0, newQuantity);
  const directDefaultRequiredQuantity = this._getDirectDefaultRequiredQuantity(selectionKey);
  if (directDefaultRequiredQuantity !== null && quantity < directDefaultRequiredQuantity) {
    quantity = directDefaultRequiredQuantity;
  }

  if (quantity > 0) {
    const { available, outOfStock } = this.getVariantAvailable(stepIndex, selectionKey);
    if (outOfStock) {
      ToastManager.show('This item is out of stock.');
      return;
    }
    if (available !== null && quantity > available) {
      quantity = available;
      ToastManager.show('Only ' + available + ' in stock — quantity adjusted.');
    }
  }

  const currentQuantity = this.getSelectedQuantity(stepIndex, selectionKey);
  const productQuantityCheck = ConditionValidator.canUpdateProductQuantity(
    this.selectedBundle?.validateQuantityPerProduct,
    currentQuantity,
    quantity,
  );
  if (!productQuantityCheck.allowed) {
    ToastManager.show('Maximum allowed quantity per product is ' + productQuantityCheck.limit + '.');
    return;
  }

  if (!this.validateStepCondition(stepIndex, selectionKey, quantity)) {
    return;
  }

  const cascadeDrawerWasOpen = this._isProductPageCascadeTemplate?.()
    && this.elements?.footer?.querySelector('.bw-ppb-cascade-selected-drawer--open, .gbbMixCascadeCartDrawerContainer--open');
  if (cascadeDrawerWasOpen) {
    const drawerHeight = cascadeDrawerWasOpen.getBoundingClientRect?.().height || 0;
    this.cascadeSelectedDrawerState = {
      ...(this.cascadeSelectedDrawerState || {}),
      isOpen: true,
      height: drawerHeight,
    };
  }

  this.setSelectedQuantity(stepIndex, selectionKey, quantity);

  this.updateProductQuantityDisplay(stepIndex, selectionKey, quantity);
  this._renderDirectDefaultProducts();
  this.renderModalTabs();
  this.updateModalNavigation();
  this.updateModalFooterMessaging();
  this.updateAddToCartButton();
  this.updateFooterMessaging();

  this._syncFreeGiftSlotCard();

  const currentStep = this.selectedBundle?.steps?.[stepIndex];
  const stepProducts = this.stepProductData?.[stepIndex] || [];
  const selectedProduct = this.findProductBySelectionKey(stepProducts, selectionKey);
  const selectedProductId = selectedProduct?.parentProductId || selectedProduct?.productId || selectedProduct?.id || selectionKey;
  if (!this._autoAdvancePending && shouldAutoAdvanceProductPageStep({ quantity, productId: selectedProductId, step: currentStep })) {
    this._autoAdvancePending = true;
    this._autoProgressBottomSheet(stepIndex);
  }
  this._maybeAutoAddAfterLastStep();
},

_maybeAutoAddAfterLastStep() {
  const controls = this._getProductPageControls();
  if (!(
    controls?.addBundleToCartAfterLastStepCompleted === true
    || controls?.addBundleToCartOnDone === true
  )) return;
  if (this._autoAddingFromControls) return;
  if (!this.selectedBundle?.steps?.length) return;

  const isConditionValidationEnabled = this._isConditionValidationEnabled?.() !== false;
  const allStepsValid = isConditionValidationEnabled ? this.selectedBundle.steps.every((step, index) => {
    if (step.isFreeGift || step.isDefault) return true;
    return this.validateStep(index);
  }) : true;
  if (!allStepsValid) return;

  this._autoAddingFromControls = true;
  this.addToCart().finally(() => {
    this._autoAddingFromControls = false;
  });
},

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
},

/**
 * Bottom-sheet auto-step progression.
 * Called after every product selection update.
 * If the current step's condition is now met, advances to the next incomplete step,
 * or closes the modal if all steps are complete.
 */
_autoProgressBottomSheet(stepIndex) {
  const clearAutoAdvance = () => {
    this._autoAdvancePending = false;
  };

  if (!this.validateStep(stepIndex)) {
    clearAutoAdvance();
    return;
  }

  const next = bsFindNextIncompleteStep(
    this.selectedBundle.steps,
    this.selectedProducts,
    (i) => this.validateStep(i),
    stepIndex
  );

  if (next === -1) {

    this.renderModalTabs();
    setTimeout(() => {
      clearAutoAdvance();
      this.closeModal();
    }, 500);
  } else {

    this.renderModalTabs();
    setTimeout(() => {
      this.currentStepIndex = next;
      const modal = this.elements.modal;
      const headerText = this.getFormattedHeaderText();
      const header = modal.querySelector('.modal-step-title');
      if (header) {
        header.textContent = headerText;
      }
      this.renderModalProductsLoading(next);
      this.renderModalTabs();
      this.updateModalNavigation();
      this.loadStepProducts(next).then(() => {
        if (this.currentStepIndex !== next) {
          clearAutoAdvance();
          return;
        }
        this.renderModalProducts(next);
        this.updateModalFooterMessaging();
        this.preloadNextStep();
      }).catch(() => {})
        .finally(() => {
          clearAutoAdvance();
        });
    }, 300);
  }
},

updateProductQuantityDisplay(stepIndex, productId, quantity) {

  const scope = this.elements.modal?.classList.contains('bw-bs-panel--open')
    ? this.elements.modal
    : this.container;
  const productCard = scope.querySelector(`[data-product-id="${productId}"]`);
  if (productCard) {
    const cogniveCard = productCard.classList.contains('bw-ppb-cognive-product-card');
    const quantityDisplay = productCard.querySelector('.qty-display')
      || productCard.querySelector('.inline-qty-display');
    const addBtn = productCard.querySelector('.product-add-btn');
    productCard.querySelector('.selected-overlay')?.remove();
    const increaseBtn = productCard.querySelector('.qty-increase');
    const actionWrapper = productCard.querySelector('.product-card-action')
      || productCard.querySelector('.bw-product-card__action');
    const existingInlineControls = productCard.querySelector('.inline-quantity-controls');
    const cascadeRow = productCard.classList.contains('bw-ppb-cascade-product-row');
    const step = this.selectedBundle?.steps?.[stepIndex];
    const defaultAddText = cascadeRow ? 'Add +' : this._resolveText('productCardAddButton', 'Add to Cart');

    if (quantityDisplay) {
      quantityDisplay.textContent = quantity;
    }

    if (increaseBtn) {
      const productQuantityLimit = ConditionValidator.getAllowedQuantityPerProduct(
        this.selectedBundle?.validateQuantityPerProduct
      );
      const { available, outOfStock } = this.getVariantAvailable(stepIndex, productId);
      const atMaxStock = available !== null && quantity >= available;
      const atMaxProductQuantity = productQuantityLimit !== null && quantity >= productQuantityLimit;
      const shouldDisableIncrease = outOfStock || atMaxStock || atMaxProductQuantity;
      increaseBtn.disabled = shouldDisableIncrease;
      if (shouldDisableIncrease) {
        increaseBtn.setAttribute('aria-disabled', 'true');
      } else {
        increaseBtn.removeAttribute('aria-disabled');
      }
    }

    if (actionWrapper && quantity > 0 && cogniveCard) {
      actionWrapper.classList.add('is-expanded');
      existingInlineControls?.remove();
      const selectedText = resolveProductPageCardButtonText({
        currentQuantity: quantity,
        currentStep: step,
        outOfStock: false,
        defaultAddText,
      });
      if (!addBtn) {
        actionWrapper.appendChild(createProductPageAddButton(productId, selectedText));
      } else {
        addBtn.textContent = selectedText;
      }
    } else if (actionWrapper && quantity > 0) {
      actionWrapper.classList.add('is-expanded');
      if (addBtn) addBtn.remove();
      if (!existingInlineControls) {
        const productQuantityLimit = ConditionValidator.getAllowedQuantityPerProduct(
          this.selectedBundle?.validateQuantityPerProduct
        );
        const { available, outOfStock } = this.getVariantAvailable(stepIndex, productId);
        const atMaxStock = available !== null && quantity >= available;
        const atMaxProductQuantity = productQuantityLimit !== null && quantity >= productQuantityLimit;
        actionWrapper.appendChild(createInlineQuantityControl(
          productId,
          quantity,
          outOfStock || atMaxStock || atMaxProductQuantity,
        ));
      }
    } else if (actionWrapper && quantity <= 0) {
      actionWrapper.classList.remove('is-expanded');
      if (existingInlineControls) existingInlineControls.remove();
      if (!addBtn) {
        actionWrapper.appendChild(createProductPageAddButton(
          productId,
          resolveProductPageCardButtonText({
            currentQuantity: quantity,
            currentStep: step,
            outOfStock: false,
            defaultAddText,
          }),
        ));
      }
    }

    if (addBtn) {
      if (quantity > 0) {
        addBtn.textContent = resolveProductPageCardButtonText({
          currentQuantity: quantity,
          currentStep: step,
          outOfStock: false,
          defaultAddText,
        });
        addBtn.classList.add('added');
      } else {
        addBtn.textContent = resolveProductPageCardButtonText({
          currentQuantity: quantity,
          currentStep: step,
          outOfStock: false,
          defaultAddText,
        });
        addBtn.classList.remove('added');
      }
    }

    if (quantity > 0) {
      productCard.classList.add('bw-product-card--selected');
    } else {
      productCard.classList.remove('bw-product-card--selected');
    }
  }
}
};

function getProductPageSelectedQuantityTotal(selectedProducts = []) {
  return selectedProducts.reduce((sum, stepSelections) => {
    if (!stepSelections || typeof stepSelections !== 'object') return sum;
    return sum + Object.values(stepSelections).reduce((stepSum, quantity) => {
      const value = Number(quantity || 0);
      return stepSum + (Number.isFinite(value) && value > 0 ? value : 0);
    }, 0);
  }, 0);
}

function getProductPageActiveBoxSelectionRule(boxSelection) {
  const rules = Array.isArray(boxSelection?.rules) ? boxSelection.rules : [];
  return boxSelection?.activeRule
    || rules.find(rule => rule?.isDefaultSelected === true)
    || rules[0]
    || null;
}

const ProductPageCartMethods = {
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

      const isConditionValidationEnabled = this._isConditionValidationEnabled?.() !== false;
      const allStepsValid = isConditionValidationEnabled ? this.selectedBundle.steps.every((step, index) => {
        if (step.isFreeGift || step.isDefault) return true;
        return this.validateStep(index);
      }) : true;

      if (!allStepsValid) {
        ToastManager.show('Please complete all bundle steps before adding to cart.');
        return;
      }

      const boxSelectionCheck = this.validateProductPageBoxSelectionCheckout();
      if (!boxSelectionCheck.valid) {
        const template = this._resolveText?.('boxSelectionEligibilityToast_inPage', '')
          || this._resolveText?.('boxSelectionEligibilityToast', '')
          || this._resolveText?.('completeSteps', '');
        ToastManager.show(String(template)
          .replace(/{{boxSelectionDifference}}/g, String(boxSelectionCheck.difference))
          .replace(/{{quantityDifference}}/g, String(boxSelectionCheck.difference))
          .replace(/{{conditionQuantity}}/g, String(boxSelectionCheck.targetQuantity)));
        return;
      }

      const offerId = this.resolveProductPageOfferId();
      const sessionKey = this.generateBundleSessionKey();
      const bundleName = this.selectedBundle?.name || '';
      const cartItems = this.buildCartItems(offerId, sessionKey);

      this.elements.addToCartButton.disabled = true;
      this.elements.addToCartButton.textContent = this._resolveText('addingToCart', 'Adding to Cart...');
      this.showLoadingOverlay(this.selectedBundle?.loadingGif || null);

      const runtimeToken = await this.requestCartTransformRuntimeToken(cartItems, {
        offerGroupId: `${offerId}_${sessionKey}`,
        bundleType: 'product_page',
      });
      const cartContext = this.buildProductPageCartFormData(cartItems, {
        bundleName,
        offerId,
        sessionKey,
        runtimeToken,
      });
      await this.syncBundleDetailsCartMetafield(cartContext.bundleDetailsKey, cartContext.sourceProperties);

      const response = await fetch('/cart/add', {
        method: 'POST',
        body: cartContext.formData
      });
      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = `Cart add failed (${response.status})`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.description || errorMessage;
        } catch {

        }
        throw new Error(errorMessage);
      }

      try {
        JSON.parse(responseText);
      } catch {

      }

      ToastManager.show('Bundle added to cart successfully!');
      this._handlePostAddToCartAction(this._getProductPageControls()?.redirect);
    } catch (error) {
      ToastManager.show('Failed to add bundle to cart: ' + error.message);
    } finally {
      this.hideLoadingOverlay();
      this.updateAddToCartButton();
    }
  },

  validateProductPageBoxSelectionCheckout() {
    const boxSelection = this.selectedBundle?.boxSelection;
    const totalQuantity = getProductPageSelectedQuantityTotal(this.selectedProducts || []);

    if (boxSelection?.validateBoxSelectionQuantity !== true) {
      return { valid: true, totalQuantity, targetQuantity: null, difference: 0 };
    }

    const activeRule = getProductPageActiveBoxSelectionRule(boxSelection);
    const targetQuantity = Number(activeRule?.boxQuantity);
    if (!Number.isFinite(targetQuantity) || targetQuantity < 1) {
      return { valid: true, totalQuantity, targetQuantity: null, difference: 0 };
    }

    return {
      valid: totalQuantity === targetQuantity,
      totalQuantity,
      targetQuantity,
      difference: Math.abs(targetQuantity - totalQuantity),
    };
  },

  buildCartLineSourceProperties(selectedLines) {
    const { totalPrice, totalQuantity, unitPrices } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData,
      this.selectedBundle?.steps
    );
    const discountInfo = PricingCalculator.calculateDiscount(
      this.selectedBundle,
      totalPrice,
      totalQuantity,
      unitPrices
    );
    const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const discountAmount = Math.max(0, Number(combinedDiscountInfo.discountAmount || 0));
    const discountPercentage = combinedDiscountInfo.discountPercentage
      || (totalPrice > 0 ? (discountAmount / totalPrice) * 100 : 0);

    return buildCartLineSourceProperties({
      selectedLines,
      retailPrice: CurrencyManager.convertAndFormat(totalPrice, currencyInfo),
      discountAmount: discountAmount > 0
        ? CurrencyManager.convertAndFormat(discountAmount, currencyInfo)
        : '',
      discountPercentage,
    });
  },

  buildCartItems(offerId = this.resolveProductPageOfferId(), sessionKey = this.generateBundleSessionKey()) {
    const cartItems = [];
    const unavailableProducts = [];
    const selectedLines = [];
    const baseOfferId = `${String(offerId)}_${String(sessionKey)}`;
    const hasAddonStepConfigured = (this.selectedBundle?.steps || []).some((step) => {
      const addonEval = this.getAddonTierEvaluation?.(step);
      return step?.isFreeGift === true && step?.addonDisplayFree !== true && addonEval?.tier;
    });
    let hasSelectedAddonLine = false;

    this.selectedProducts.forEach((stepSelections, stepIndex) => {
      const productsInStep = this.expandProductsByVariant(this.stepProductData[stepIndex] || []);

      Object.entries(stepSelections).forEach(([variantId, quantity]) => {
        if (quantity <= 0) return;
        const product = this.findProductBySelectionKey(productsInStep, variantId);
        if (!product) return;

        if (product.available !== true) {
          unavailableProducts.push(product.title);
          return;
        }

        const step = this.selectedBundle.steps[stepIndex];
        const addonEval = this.getAddonTierEvaluation?.(step) || {};
        const addonDiscount = this.getAddonLineDiscount(step);
        const isChargeableAddonStep = step?.isFreeGift === true && step?.addonDisplayFree !== true;
        const properties = {};
          if (isChargeableAddonStep && addonEval?.tier) {
            hasSelectedAddonLine = true;
            properties._addon_product = 'true';
            properties._addon_offer_id = baseOfferId;
            properties._boxProduct = 'addonProduct';
            if (addonEval?.tier?.tierId) {
              properties._addonTierId = String(addonEval.tier.tierId);
            }
          const addonVariantId = this.extractId(variantId);
          properties._uniqueWpbItemKey = `${addonVariantId || variantId}_pageId:addonProduct`;
          properties._bundle_step_type = addonDiscount && step?.addonDisplayFree !== true
            ? `addon:${addonDiscount.type}:${addonDiscount.value}`
            : 'addon';
        } else if (step?.isFreeGift && step?.addonDisplayFree === true) {
          properties._bundle_step_type = 'free_gift';
        }
        if (step?.isDefault || this._isDirectDefaultVariant(variantId)) {
          properties._bundle_step_type = 'default';
        }

        const cartItem = {
          id: parseInt(this.extractId(variantId)),
          quantity,
          properties
        };
        const sellingPlanAllocationId = this.getSelectedSellingPlanAllocationId(product, variantId);
        if (sellingPlanAllocationId) {
          cartItem.selling_plan = parseInt(sellingPlanAllocationId);
        }

        cartItems.push(cartItem);
        selectedLines.push({ product, quantity });
      });
    });

    if (unavailableProducts.length > 0) {
      const productList = unavailableProducts.join(', ');
      throw new Error(`The following product${unavailableProducts.length > 1 ? 's are' : ' is'} currently unavailable: ${productList}. Please remove ${unavailableProducts.length > 1 ? 'them' : 'it'} from your bundle or try again later.`);
    }

    const sourceProperties = this.buildCartLineSourceProperties(selectedLines);
    cartItems.forEach(item => {
      Object.assign(item.properties, sourceProperties);
      if (hasSelectedAddonLine && hasAddonStepConfigured) {
        item.properties._addon_offer_id = item.properties._addon_offer_id || baseOfferId;
      }
    });

    return cartItems;
  },

  buildProductPageCartFormData(cartItems, {
    bundleName = '',
    offerId = '',
    sessionKey = '',
    runtimeToken = '',
  } = {}) {
    return buildProductPageCartFormData(cartItems, {
      bundleName,
      offerId,
      sessionKey,
      runtimeToken,
    });
  },

  parseRuntimeAddonDiscount(stepType) {
    if (typeof stepType !== 'string') return null;
    const parts = stepType.split(':');
    if (parts.length !== 3 || parts[0] !== 'addon' || String(parts[1]).toUpperCase() !== 'PERCENTAGE') {
      return null;
    }
    const value = Number(parts[2]);
    if (!Number.isFinite(value) || value <= 0) return null;
    return { type: 'PERCENTAGE', value: Math.min(100, value) };
  },

  async requestCartTransformRuntimeToken(cartItems, { offerGroupId, bundleType }) {
    const components = [];
    const addons = [];

    cartItems.forEach((item) => {
      const stepType = item?.properties?._bundle_step_type;
      const isAddon = stepType === 'addon' || (typeof stepType === 'string' && stepType.startsWith('addon:'));
      const line = {
        variantId: item.id,
        quantity: item.quantity,
      };
      if (isAddon) {
        addons.push({
          ...line,
          discount: this.parseRuntimeAddonDiscount(stepType),
        });
      } else {
        components.push(line);
      }
    });

    const response = await fetch('/apps/product-bundles/api/cart-transform-runtime-token', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bundleId: this.selectedBundle?.id,
        bundleType,
        offerGroupId,
        components,
        addons,
      }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.token) {
      throw new Error(data?.error || 'Unable to validate bundle selection');
    }
    return data.token;
  },

  async syncBundleDetailsCartMetafield(bundleDetailsKey, sourceProperties) {
    try {
      const displayProperties = this.buildBundleDetailsDisplayProperties(sourceProperties);
      if (!bundleDetailsKey || Object.keys(displayProperties).length === 0) return;

      const cartToken = await this.getBundleDetailsCartToken();
      if (!cartToken) return;

      const response = await fetch('/apps/product-bundles/api/cart-bundle-details', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartToken, bundleDetailsKey, displayProperties })
      });

      if (!response.ok) throw new Error(`bundle_details sync failed (${response.status})`);
      const data = await response.json().catch(() => null);
      if (data?.ok !== true) throw new Error(data?.error || 'bundle_details sync failed');
    } catch (error) {
      console.warn('[Wolfpack Bundles] Failed to sync bundle_details cart metafield', error);
    }
  },

  buildBundleDetailsDisplayProperties(sourceProperties) {
    const displayProperties = {};
    const raw = sourceProperties?._bundle_display_properties;
    const cartLineLabels = this.getCartLineLabels();

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.box) displayProperties.Box = String(parsed.box);
        if (parsed?.items) displayProperties[cartLineLabels.items] = String(parsed.items);
        if (parsed?.retailPrice) displayProperties[cartLineLabels.retailPrice] = String(parsed.retailPrice);
        if (parsed?.youSave?.amountPercentage) {
          displayProperties[cartLineLabels.youSave] = String(parsed.youSave.amountPercentage);
        }
      } catch {

      }
    }

    ['Box', cartLineLabels.items, cartLineLabels.retailPrice, cartLineLabels.youSave, 'Items', 'Retail Price', 'You Save'].forEach((key) => {
      if (sourceProperties?.[key] && !displayProperties[key]) {
        displayProperties[key] = String(sourceProperties[key]);
      }
    });

    return displayProperties;
  },

  getCartLineLabels() {
    const labels = this.config?.sharedCartLabels || {};
    return {
      items: labels.bundleContainsLabel || 'Items',
      retailPrice: labels.bundleOriginalPriceLabel || 'Retail Price',
      youSave: labels.bundleDiscountDisplayLabel || 'You Save',
    };
  },

  async getBundleDetailsCartToken() {
    const response = await fetch('/cart.js?app=wolfpackProductBundles', {
      credentials: 'same-origin'
    });
    if (!response.ok) return null;
    const cart = await response.json();
    return cart?.token || null;
  },

  resolveProductPageOfferId() {
    const rawOfferId = this.selectedBundle?.offerId
      || this.selectedBundle?.bundleOfferId
      || this.selectedBundle?.id
      || 'UNKNOWN';
    const offerId = String(rawOfferId);
    return offerId.startsWith('MIX-') ? offerId : `MIX-${offerId}`;
  },

  generateBundleSessionKey() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const keyLength = 12;
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(keyLength);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, byte => alphabet[byte % alphabet.length]).join('');
    }

    return Math.random().toString(36).slice(2, 2 + keyLength).toUpperCase().padEnd(keyLength, '0');
  },

  generateBundleInstanceId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${this.selectedBundle.id}_${crypto.randomUUID()}`;
    }

    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `${this.selectedBundle.id}_${timestamp}_${random}`;
  },
};

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

/**
 * Find the next incomplete non-default step after `fromIndex`.
 * Returns -1 when all remaining non-default steps are complete.
 */
function bsFindNextIncompleteStep(steps, selectedProducts, validateFn, fromIndex) {
  for (let i = fromIndex + 1; i < steps.length; i++) {

    if (steps[i].isDefault || steps[i].isFreeGift) continue;
    if (!validateFn(i)) return i;
  }
  return -1;
}

function bsIsDefaultStep(step) { return !!step?.isDefault; }

function bsGetDiscountBadgeLabel(step) { return step?.discountBadgeLabel || null; }

if (typeof window !== 'undefined') {
  window.__bsHelpers = {
    bsFindNextIncompleteStep,
    bsIsDefaultStep,
    bsGetDiscountBadgeLabel,
    ppbExpandSingleStepCategoriesAsSteps,
  };
}

class BundleWidgetProductPage {

  constructor(containerElement) {
    this.container = containerElement;
    this.selectedBundle = null;
    this.selectedProducts = [];
    this.selectedProductCategoryIndexes = [];
    this.stepProductData = [];
    this.directDefaultProducts = [];
    this.activeInpageCategoryIndexes = {};
    this.currentStepIndex = 0;
    this._selectionPersistenceReady = false;
    this.isInitialized = false;
    this.config = {};
    this.elements = {};

    this.productModal = null;
    if (window.BundleProductModal) {
      this.productModal = new window.BundleProductModal(this);
    } else {
    }

    this.init().catch(error => {
      this.showErrorUI(error);
    });
  }

  getSharedSelectedQuantity() {
    return getSelectedQuantity({
      selectedProducts: this.selectedProducts,
      stepProductData: this.stepProductData,
    });
  }

  async init() {
    try {

      if (this.container.dataset.initialized === 'true') {
        return;
      }

      this.parseConfiguration();

      this._relocateContainerToProductForm();

      this.showLoadingOverlay(null, { bootstrap: true });
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => requestAnimationFrame(resolve));

      await this.loadDesignSettingsCSS();
      await this.loadLanguageSettings();
      await this.loadControlsSettings();

      await this.loadBundleData();

      if (!this.bundleData) return;

      this.selectBundle();

      if (this.selectedBundle?.loadingGif) {
        this.showLoadingOverlay(this.selectedBundle.loadingGif, { bootstrap: true });
      }

      if (!this.selectedBundle) {
        this.hideLoadingOverlay();
        this.showFallbackUI();
        return;
      }

      this.initializeDataStructures();
      this._initDirectDefaultProducts();
      this._restoreSessionSelections();
      await this._preloadDirectDefaultProducts();

      await this._preloadDefaultStepProducts();
      await this._preloadRestoredSelectionProducts();

      this._relocateContainerToProductForm();
      this._hideNativeProductPrice();

      this.setupDOMElements();
      this._markProductPageTemplate();
      await this.ensureProductPageTemplateStylesheet(this._getProductPageTemplateType(), this._getProductPageDesignPreset());
      this.applyBundleLevelCss(this.selectedBundle);

      this.renderUI();

      this.hideLoadingOverlay();

      this.attachEventListeners();

      this.container.dataset.initialized = 'true';
      this.isInitialized = true;

      if (!window.Shopify?.designMode) {
        this._recordView();
      }

    } catch (error) {
      this.hideLoadingOverlay();
      this.showErrorUI(error);
    }
  }

  /**
   * Load Settings design CSS
   * Injects custom CSS from Settings -> Design into the page
   */
  async loadDesignSettingsCSS() {
    try {

      const shopDomain = window.Shopify?.shop || this.container.dataset.shop;

      if (!shopDomain) {
        return;
      }

      const existingLink = document.querySelector('link[href*="design-settings"]');
      if (existingLink) {
      } else {
      }

    } catch (error) {

    }
  }

  async loadLanguageSettings() {
    try {
      const shop = window.Shopify?.shop || this.container.dataset.shop;
      if (!shop) return;

      const locale = window.Shopify?.locale || 'en';
      const endpoint = `/apps/product-bundles/api/language-settings/${encodeURIComponent(shop)}?bundleType=product_page&locale=${encodeURIComponent(locale)}`;
      const response = await fetch(endpoint, { credentials: 'same-origin' });
      if (!response.ok) return;

      const languageSettings = await response.json();
      this.config.languageSettings = languageSettings;
      this.config.languageData = languageSettings.activeLanguageData || null;
      this.config.ppbCustomTextSettings = languageSettings.ppbCustomTextSettings || null;
      this.config.sharedCartLabels = languageSettings.sharedCartLabels || null;
      this.config.textOverrides = {
        ...(this.config.textOverrides || {}),
        ...(languageSettings.textOverrides || {})
      };
    } catch (_) {

    }
  }

  async loadControlsSettings() {
    try {
      const shop = window.Shopify?.shop || this.container.dataset.shop;
      if (!shop) return;

      const endpoint = `/apps/product-bundles/api/controls-settings/${encodeURIComponent(shop)}?bundleType=product_page`;
      const response = await fetch(endpoint, { credentials: 'same-origin' });
      if (!response.ok) return;

      this.config.controlsSettings = await response.json();
    } catch (_) {

    }
  }

}

Object.assign(
  BundleWidgetProductPage.prototype,
  ProductPageConfigLifecycleMethods,
  ProductPageDefaultProductMethods,
  ProductPageDomMethods,
  ProductPageFooterModalStateMethods,
  ProductPageModalStateMethods,
  ProductPageWidgetMiscMethods,
  ProductPageLayoutShellMethods,
  ProductPageInpageRenderMethods,
  ProductPageProductDataMethods,
  ProductPageSelectionDataMethods,
  ProductPageSelectionPersistenceMethods,
  ProductPageModalMethods,
  ProductPageSelectionMethods,
  ProductPageCartMethods,
  bundleLevelCssMethods,
  modalSlotTemplateMethods,
  cascadeTemplateMethods,
  cogniveTemplateMethods,
);

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