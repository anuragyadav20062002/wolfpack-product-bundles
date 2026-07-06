/*!
 * Wolfpack Bundle Widget — Full Page
 * Version : 5.0.71
 * Built   : 2026-07-06
 *
 * Cache note: Shopify CDN cache is busted automatically by shopify app deploy.
 * After deploying, allow 2-10 minutes for propagation before testing.
 * Verify live version: console.log(window.__BUNDLE_WIDGET_VERSION__)
 */
window.__BUNDLE_WIDGET_VERSION__ = '5.0.71';
(function() {
  'use strict';

const ConditionValidator = (function () {

  const OPERATORS = {
    EQUAL_TO:                'equal_to',
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

    if (!step || !step.conditionType || !step.conditionOperator || !_isPositiveConditionValue(step.conditionValue)) {
      return { allowed: true, limitText: null };
    }

    const totalAfter = calculateStepTotalAfterUpdate(
      currentSelections,
      targetProductId,
      newQuantity,
    );

    const primary = _evaluateCanUpdate(step.conditionOperator, step.conditionValue, totalAfter);
    if (!primary.allowed) return primary;

    if (step.conditionOperator2 != null && _isPositiveConditionValue(step.conditionValue2)) {
      const secondary = _evaluateCanUpdate(step.conditionOperator2, step.conditionValue2, totalAfter);
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

    if (!step.conditionType || !step.conditionOperator || !_isPositiveConditionValue(step.conditionValue)) {
      const min = step.minQuantity != null ? Number(step.minQuantity) : 1;
      return total >= min;
    }

    if (!_evaluateSatisfied(step.conditionOperator, step.conditionValue, total)) return false;

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

  PLACEHOLDER_IMAGE: '/bundle-product-placeholder.avif',
  PLACEHOLDER_IMAGE_FALLBACK: '/bundle-product-placeholder.png'
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

class PricingCalculator {
  static calculateBundleTotal(selectedProducts, stepProductData, steps = null) {
    let totalPrice = 0;
    let totalQuantity = 0;
    const unitPrices = [];

    selectedProducts.forEach((stepSelections, stepIndex) => {

      if (steps?.[stepIndex]?.isFreeGift && steps?.[stepIndex]?.addonDisplayFree === true) return;

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

function renderSharedProductCard(product = {}, currentQuantity = 0, currencyInfo = {}, options = {}) {
  const selectionKey = product.variantId || product.id || '';
  const quantity = Math.max(0, Number(currentQuantity || 0));
  const isSelected = quantity > 0;
  const mode = options.mode || 'grid';
  const variantText = getVariantDisplayText(product);
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
    isSelected ? 'bw-product-card--selected' : '',
    options.className || '',
  ].filter(Boolean).join(' ');

  return `
    <div class="${rootClasses}" data-bw-product-card="true" data-product-id="${escapeAttribute(selectionKey)}" data-current-selected-variant-id="${escapeAttribute(selectionKey)}" data-bw-card-image-count="${imageUrls.length}" data-bw-card-image-index="0"${hasMultipleImages ? ' data-bw-card-has-multiple-images="true"' : ''}>
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
            ${isSelected
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
        ${product.priceText ? `<div class="bw-selected-row__price">${escapeHtml(product.priceText)}</div>` : ''}
        ${renderBadges(product)}
      </div>
      <div class="bw-selected-row__action">
        <span class="bw-selected-row__quantity" aria-label="Quantity ${quantity}">x${quantity}</span>
        ${removable ? `
          <button type="button" class="bw-selected-row__remove" data-action="remove-selected-product" data-variant-id="${escapeAttribute(selectionKey)}" aria-label="Delete ${escapeAttribute(title)}">
            ${renderTrashIcon()}
          </button>
        ` : ''}
      </div>
    </div>
  `;
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
      .map(({ product = {}, quantity = 0 }) => `${Number(quantity || 0)} x ${product.title || product.id}`)
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
  });

  return {
    formData,
    bundleDetailsKey: `${offerId}_${sessionKey}`,
    sourceProperties: extractBundleDetailsSourceProperties(cartItems),
  };
}

const BundleModalVariantMethods = {
  resetVariantSelectionState() {
    this.selectedOptions = {};
    const summaryContainer = document.getElementById('modal-selection-summary');
    const summaryText = document.getElementById('modal-selection-text');
    if (summaryContainer) summaryContainer.style.display = 'none';
    if (summaryText) summaryText.textContent = '';
  },

  createVariantSelectors() {
    const variantsContainer = document.getElementById('modal-variants-container');
    const variants = this.currentProduct.variants || [];

    this.resetVariantSelectionState();

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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

  formatPrice(price) {

    if (this.widget && this.widget.formatPrice) {
      return this.widget.formatPrice(price);
    }

    const dollars = (price / 100).toFixed(2);
    return `$${dollars}`;
  },

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
  },

  /**
   * Update quantity
   * @param {number} quantity - New quantity
   */
};

/**
 * Bundle Product Modal Component
 *
 * Handles the product variant selection modal for full-page bundles.
 * Opens when user clicks "Choose Options" on a product card.
 *
 * Features:
 * - Product image, title, and description
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
    this.currentImageIndex = 0;
    this.readOnly = false;

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
            <!-- Left Column: Product Image -->
            <div class="bundle-modal-images">
              <div class="bundle-modal-main-image-container">
                <div class="bundle-modal-main-image">
                  <img src="" alt="Product image" id="modal-main-image">
                  <button type="button" class="bundle-modal-image-nav bundle-modal-image-nav--prev" data-modal-image-nav="prev" aria-label="Previous image" hidden>&#10094;</button>
                  <button type="button" class="bundle-modal-image-nav bundle-modal-image-nav--next" data-modal-image-nav="next" aria-label="Next image" hidden>&#10095;</button>
                </div>
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

    document.getElementById('modal-qty-decrease').addEventListener('click', () => {
      this.updateQuantity(Math.max(1, this.selectedQuantity - 1));
    });

    document.getElementById('modal-qty-increase').addEventListener('click', () => {
      this.updateQuantity(this.selectedQuantity + 1);
    });

    document.getElementById('modal-add-to-box').addEventListener('click', () => {
      this.addToBundle();
    });

    this.modalElement.querySelectorAll('[data-modal-image-nav]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.showAdjacentImage(button.dataset.modalImageNav === 'prev' ? -1 : 1);
      });
    });

    this.setupSwipeGestures();
  }

  /**
   * Setup swipe gestures for mobile
   * - Swipe down on container to dismiss
   */
  setupSwipeGestures() {
    const modalContainer = this.modalElement.querySelector('.bundle-modal-container');

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
  }

  /**
   * Open modal with product data
   * @param {Object} product - Product data
   * @param {Object} step - Step data
   */
  open(product, step, options = {}) {

    this.currentProduct = product;
    this.currentStep = step;
    this.selectedVariant = null;
    this.selectedOptions = {};
    this.selectedQuantity = 1;
    this.readOnly = options.readOnly === true;
    const imageCount = this.getProductImages().length;
    const initialImageIndex = Number(options.initialImageIndex || 0);
    this.currentImageIndex = imageCount > 0
      ? Math.min(Math.max(0, initialImageIndex), imageCount - 1)
      : 0;

    this.populateModal();
    this.updateReadOnlyState();

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
    this.currentImageIndex = 0;
    this.readOnly = false;
    this.updateReadOnlyState();
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

    this.loadImage();

    this.createVariantSelectors();

    this.updatePrice();

    document.getElementById('modal-qty-display').textContent = this.selectedQuantity;
  }

  updateReadOnlyState() {
    if (!this.modalElement) return;

    this.modalElement.dataset.readOnly = this.readOnly ? 'true' : 'false';
    [
      '#modal-product-price',
      '#modal-variants-container',
      '.bundle-modal-quantity',
      '#modal-add-to-box',
    ].forEach((selector) => {
      const element = this.modalElement.querySelector(selector);
      if (element) {
        element.hidden = this.readOnly;
      }
    });
  }

  /**
   * Get normalized product image.
   * Handles imageUrl, image.src, images array, and featuredImage.url.
   * @returns {string} Image URL
   */
  getProductImages() {
    const product = this.currentProduct;
    if (!product) return [BUNDLE_WIDGET.PLACEHOLDER_IMAGE];

    const urls = [];
    const addUrl = (value) => {
      const url = this.normalizeImageUrl(value);
      if (url && !urls.includes(url)) urls.push(url);
    };

    addUrl(product.imageUrl);
    addUrl(product.image);
    addUrl(product.featuredImage);
    (Array.isArray(product.images) ? product.images : []).forEach(addUrl);

    return urls.length > 0 ? urls : [BUNDLE_WIDGET.PLACEHOLDER_IMAGE];
  }

  normalizeImageUrl(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.url || value.src || value.originalSrc || value.transformedSrc || '';
  }

  getProductImage() {
    const images = this.getProductImages();
    return images[this.currentImageIndex] || images[0] || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
  }

  loadImage() {
    const mainImageEl = document.getElementById('modal-main-image');
    if (!mainImageEl) return;

    const images = this.getProductImages();
    this.currentImageIndex = Math.min(Math.max(0, this.currentImageIndex), images.length - 1);
    mainImageEl.src = this.getProductImage();
    mainImageEl.alt = this.currentProduct?.title || 'Product image';

    const hasGallery = images.length > 1;
    const imageFrame = this.modalElement.querySelector('.bundle-modal-main-image');
    if (imageFrame) {
      imageFrame.classList.toggle('bundle-modal-main-image--has-gallery', hasGallery);
    }
    this.modalElement.querySelectorAll('[data-modal-image-nav]').forEach((button) => {
      button.hidden = !hasGallery;
    });
  }

  showAdjacentImage(direction) {
    const images = this.getProductImages();
    if (images.length <= 1) return;

    this.currentImageIndex = (this.currentImageIndex + direction + images.length) % images.length;
    this.loadImage();
  }

  updateQuantity(quantity) {
    this.selectedQuantity = Math.max(1, quantity);
    document.getElementById('modal-qty-display').textContent = this.selectedQuantity;
  }

  /**
   * Add product to bundle
   */
  addToBundle() {
    if (this.readOnly) {
      return;
    }

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

Object.assign(
  BundleProductModal.prototype,
  BundleModalVariantMethods,
);

  window.BundleProductModal = BundleProductModal;

const FPB_STANDARD_TEMPLATE_CONFIG = {
  id: 'STANDARD',
  presetId: 'STANDARD',
  aliases: ['STANDARD'],
  productCard: {
    mode: 'grid',
    columns: {
      desktop: 3,
      mobile: 2,
    },
    ctaMode: 'icon',
  },
  summary: {
    mode: 'rows',
    emptyState: 'skeletonRows',
  },
  discountProgress: {
    mode: 'stepped',
    placement: ['sidebar', 'mobileTray'],
  },
  timeline: {
    mode: 'standard',
  },
};

const FPB_CLASSIC_TEMPLATE_CONFIG = {
  id: 'CLASSIC',
  presetId: 'CLASSIC',
  aliases: ['CLASSIC'],
  productCard: {
    mode: 'grid',
    columns: {
      desktop: 4,
      mobile: 2,
    },
    ctaMode: 'iconOrText',
  },
  summary: {
    mode: 'slots',
    emptyState: 'slotGrid',
  },
  discountProgress: {
    mode: 'stepped',
    placement: ['sidebar', 'mobileTray'],
  },
  timeline: {
    mode: 'standard',
  },
};

const FPB_COMPACT_TEMPLATE_CONFIG = {
  id: 'COMPACT',
  presetId: 'COMPACT',
  aliases: ['COMPACT'],
  productCard: {
    mode: 'compact',
    columns: {
      desktop: 3,
      mobile: 2,
    },
    ctaMode: 'iconOrText',
  },
  summary: {
    mode: 'compactSlots',
    emptyState: 'slotGrid',
  },
  discountProgress: {
    mode: 'stepped',
    placement: ['sidebar', 'mobileTray'],
  },
  timeline: {
    mode: 'compact',
  },
};

const FPB_HORIZONTAL_TEMPLATE_CONFIG = {
  id: 'HORIZONTAL',
  presetId: 'HORIZONTAL',
  aliases: ['HORIZONTAL'],
  productCard: {
    mode: 'row',
    columns: {
      desktop: 1,
      mobile: 1,
    },
    ctaMode: 'iconOrText',
  },
  summary: {
    mode: 'rows',
    emptyState: 'skeletonRows',
  },
  discountProgress: {
    mode: 'stepped',
    placement: ['sidebar', 'mobileTray'],
  },
  timeline: {
    mode: 'horizontal',
  },
};

const FPB_TEMPLATE_CONFIGS = {
  STANDARD: FPB_STANDARD_TEMPLATE_CONFIG,
  CLASSIC: FPB_CLASSIC_TEMPLATE_CONFIG,
  COMPACT: FPB_COMPACT_TEMPLATE_CONFIG,
  HORIZONTAL: FPB_HORIZONTAL_TEMPLATE_CONFIG,
};

function resolveFullPageTemplateConfig({ presetId = '', templateId = '' } = {}) {
  const rawPreset = String(presetId || templateId || 'STANDARD').toUpperCase();

  return Object.values(FPB_TEMPLATE_CONFIGS).find((config) =>
    config.id === rawPreset
    || config.presetId === rawPreset
    || config.aliases?.includes(rawPreset)
  ) || FPB_TEMPLATE_CONFIGS.STANDARD;
}

const standardTemplateMethods = {};

const classicTemplateMethods = {};

const compactTemplateMethods = {};

const horizontalTemplateMethods = {};

function shouldDisplayClassicFixedBundleRawTotal(widget, discountInfo) {
  if (widget?.getFullPageDesignPreset?.() !== 'CLASSIC') return false;
  if (!discountInfo?.hasDiscount) return false;

  const method = String(
    discountInfo?.applicableRule?.method
      || discountInfo?.applicableRule?.discountType
      || widget?.selectedBundle?.pricing?.method
      || widget?.selectedBundle?.pricing?.discountType
      || ''
  ).toLowerCase();

  return method === 'fixed_bundle_price' || method === 'fixed_bundle' || method === 'fixed_price';
}

const buildSharedCartLineDisplayProperties = buildCartLineDisplayProperties;
const buildSharedCartLineSourceProperties = buildCartLineSourceProperties;

const fullPageAnalyticsConfigMethods = {
_ensureWpbSessionId() {
  if (this._wpbSessionId) return this._wpbSessionId;
  try {
    const bundleId = this.selectedBundle?.id || this.container?.dataset?.bundleId || 'unknown';
    const storageKey = `wpb_session_${bundleId}`;
    const existing = sessionStorage.getItem(storageKey);
    if (existing) { this._wpbSessionId = existing; return existing; }
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `wpb-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(storageKey, id);
    this._wpbSessionId = id;
    return id;
  } catch (_e) {
    this._wpbSessionId = `wpb-${Date.now()}`;
    return this._wpbSessionId;
  }
},

_emitStorefrontEvent(name, detail = {}) {
  try {
    const fullDetail = Object.assign({
      bundleId: this.selectedBundle?.id || null,
      bundleType: this.container?.dataset?.bundleType || 'full_page',
      presetId: this.getFullPageDesignPreset?.() || null,
      sessionId: this._ensureWpbSessionId(),
      timestamp: new Date().toISOString(),
    }, detail);
    window.dispatchEvent(new CustomEvent(`wpb:${name}`, { detail: fullDetail, bubbles: true }));
  } catch (_e) {

  }
},

_sendEngagementBeacon(eventName) {
  try {
    const bundleId = this.selectedBundle?.id || this.container?.dataset?.bundleId;
    if (!bundleId) return;
    const guardKey = `wpb_engaged_${bundleId}`;
    if (sessionStorage.getItem(guardKey) === '1') return;
    const sessionId = this._ensureWpbSessionId();
    const shopId = window.Shopify?.shop || this.container?.dataset?.shop || window.location.hostname;
    const payload = {
      shopId,
      bundleId,
      sessionId,
      presetId: this.getFullPageDesignPreset?.() || null,
      bundleType: this.container?.dataset?.bundleType || 'full_page',
      eventName: `wpb:${eventName}`,
      landingPage: window.location.pathname + window.location.search,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };
    sessionStorage.setItem(guardKey, '1');
    fetch('/apps/product-bundles/api/attribution/engagement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {  });
  } catch (_e) {

  }
},

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
},

/**
 * Load Settings design CSS
 * Injects custom CSS from Settings -> Design into the page
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
},

async loadLanguageSettings() {
  try {
    const shop = window.Shopify?.shop || this.container.dataset.shop;
    if (!shop) return;

    const locale = window.Shopify?.locale || 'en';
    const endpoint = `/apps/product-bundles/api/language-settings/${encodeURIComponent(shop)}?bundleType=full_page&locale=${encodeURIComponent(locale)}`;
    const response = await fetch(endpoint, { credentials: 'same-origin' });
    if (!response.ok) return;

    const languageSettings = await response.json();
    this.config.languageSettings = languageSettings;
    this.config.languageData = languageSettings.activeLanguageData || null;
    this.config.sharedCartLabels = languageSettings.sharedCartLabels || null;
    this.config.textOverrides = {
      ...(this.config.textOverrides || {}),
      ...(languageSettings.textOverrides || {})
    };
  } catch (_) {

  }
},

async loadControlsSettings() {
  try {
    const shop = window.Shopify?.shop || this.container.dataset.shop;
    if (!shop) return;

    const endpoint = `/apps/product-bundles/api/controls-settings/${encodeURIComponent(shop)}?bundleType=full_page`;
    const response = await fetch(endpoint, { credentials: 'same-origin' });
    if (!response.ok) return;

    this.config.controlsSettings = await response.json();
  } catch (_) {

  }
},

_getLandingPageControls() {
  return this.config.controlsSettings?.activeControls
    || this.config.controlsSettings?.settingsControls?.landingPage
    || null;
},

_runControlsScript(script) {
  if (!script || typeof script !== 'string') return;
  try {
    new Function(script).call(window);
  } catch (_) {

  }
},

_getCheckoutIntegrationProvider(providerId) {
  const providers = {
    native: { id: 'native', callbackMode: 'native', requiresDiscountCode: false },
    theme_cart_drawer: { id: 'theme_cart_drawer', callbackMode: 'side_cart', requiresDiscountCode: false },
    gokwik: { id: 'gokwik', callbackMode: 'checkout', requiresDiscountCode: true },
    shopflo: { id: 'shopflo', callbackMode: 'checkout', requiresDiscountCode: true },
    zecpay: { id: 'zecpay', callbackMode: 'checkout', requiresDiscountCode: true },
    rebuy: { id: 'rebuy', callbackMode: 'cart_refresh', requiresDiscountCode: false },
    shiprocket_fastrr: { id: 'shiprocket_fastrr', callbackMode: 'checkout', requiresDiscountCode: true },
    monster_cart: { id: 'monster_cart', callbackMode: 'side_cart', requiresDiscountCode: false },
    upcart: { id: 'upcart', callbackMode: 'side_cart', requiresDiscountCode: false },
    kaching_cart: { id: 'kaching_cart', callbackMode: 'side_cart', requiresDiscountCode: false },
  };
  return providers[providerId] || providers.native;
},

_isCheckoutIntegrationProvider(providerId) {
  return this._getCheckoutIntegrationProvider(providerId).id !== 'native';
},

_getCheckoutIntegrationFallbackTarget(provider) {
  return provider.callbackMode === 'checkout' ? '/checkout' : '/cart';
},

async _openThemeCartDrawer() {
  let cart = null;
  try {
    const response = await fetch('/cart.js', {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (response.ok) {
      cart = await response.json();
    }
  } catch (_) {

  }

  const detail = { cart };
  [
    'cart:refresh',
    'cart:updated',
    'cart:open',
    'theme:cart:open',
  ].forEach((eventName) => {
    try {
      document.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true }));
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
    } catch (_) {

    }
  });

  const drawer = document.querySelector('cart-drawer, cart-notification');
  if (drawer && typeof drawer.open === 'function') {
    drawer.open();
    return true;
  }

  const trigger = document.querySelector(
    '[aria-controls="CartDrawer"], [data-cart-drawer-open], [data-cart-open], [href="/cart"]',
  );
  if (trigger && typeof trigger.click === 'function') {
    trigger.click();
    return true;
  }

  return cart !== null;
},

_setCheckoutIntegrationDiscountState(code) {
  if (!code) return;
  try {
    sessionStorage.setItem('wpbDiscountCode', code);
  } catch (_) {

  }
  try {
    document.cookie = `discount_code=${encodeURIComponent(code)}; path=/; Secure; SameSite=Lax`;
  } catch (_) {

  }
},

async _createCheckoutIntegrationDiscountCode(providerId) {
  const response = await fetch('/apps/product-bundles/api/checkout-integration-discount-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    cache: 'no-store',
    body: JSON.stringify({ providerId }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.ok || !payload?.code) {
    throw new Error(payload?.error || 'Checkout integration discount code could not be created');
  }
  return payload;
},

async _applyCheckoutIntegrationDiscountCode(code) {
  if (!code) return false;
  const discountUrl = `/discount/${encodeURIComponent(code)}?redirect=/cart`;
  const response = await fetch(discountUrl, {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    redirect: 'follow',
  });
  return response.ok;
},

async _invokeCheckoutIntegrationProvider(providerId) {
  if (providerId === 'theme_cart_drawer' || providerId === 'monster_cart') {
    return await this._openThemeCartDrawer();
  }

  if (providerId === 'gokwik') {
    const sdk = window.gokwikSdk;
    if (sdk && typeof sdk.initCheckout === 'function') {
      sdk.initCheckout(window.merchantInfo || window.gokwikMerchantInfo || undefined);
      return true;
    }
  }

  if (providerId === 'shopflo') {
    const shopflo = window.Shopflo;
    if (shopflo && typeof shopflo.openCheckout === 'function') {
      shopflo.openCheckout();
      return true;
    }
  }

  if (providerId === 'zecpay') {
    if (typeof window.zecpeCheckFunctionAndCall === 'function') {
      window.zecpeCheckFunctionAndCall('handleOcc');
      return true;
    }
  }

  if (providerId === 'rebuy') {
    const cart = window.Cart;
    if (cart && typeof cart.getCart === 'function') {
      cart.getCart();
      window.location.reload();
      return true;
    }
  }

  if (providerId === 'shiprocket_fastrr') {
    if (typeof window.shiprocketCheckoutBuyCartHandler === 'function') {
      window.shiprocketCheckoutBuyCartHandler();
      return true;
    }
  }

  if (providerId === 'upcart') {
    if (typeof window.upcartOpenCart === 'function') {
      window.upcartOpenCart();
      return true;
    }
  }

  if (providerId === 'kaching_cart') {
    const cart = window.kachingCartApi;
    if (!cart) return false;
    let invoked = false;
    if (typeof cart.openCart === 'function') {
      cart.openCart();
      invoked = true;
    }
    if (typeof cart.refreshCart === 'function') {
      cart.refreshCart();
      invoked = true;
    }
    return invoked;
  }

  return false;
},

async _handleCheckoutIntegrationProvider(checkout) {
  const provider = this._getCheckoutIntegrationProvider(checkout?.providerId || 'native');
  const providerId = provider.id;
  let payload = null;

  if (provider.requiresDiscountCode) {
    payload = await this._createCheckoutIntegrationDiscountCode(providerId);
    this._setCheckoutIntegrationDiscountState(payload.code);
    const applied = await this._applyCheckoutIntegrationDiscountCode(payload.code);

    if (!applied) {
      window.location.href = `/discount/${encodeURIComponent(payload.code)}?redirect=/checkout`;
      return;
    }

    this._emitStorefrontEvent('checkout-integration-discount-code-created', {
      providerId,
      expiresAt: payload.expiresAt || null,
    });
  }

  if (await this._invokeCheckoutIntegrationProvider(providerId)) {
    this._emitStorefrontEvent('checkout-integration-provider-invoked', { providerId });
    return;
  }

  this._emitStorefrontEvent('checkout-integration-provider-fallback', { providerId, reason: 'sdk-missing' });
  if (payload?.code) {
    window.location.href = `/discount/${encodeURIComponent(payload.code)}?redirect=/checkout`;
    return;
  }
  window.location.href = this._getCheckoutIntegrationFallbackTarget(provider);
},

async _handlePostAddToCartAction(actionConfig) {
  const checkout = actionConfig || this._getLandingPageControls()?.checkout || {};

  const target = checkout.action === 'checkout' ? '/checkout' : '/cart';
  const providerId = checkout.providerId || 'native';
  this._emitStorefrontEvent('checkout-clicked', { target, providerId });

  if (this._isCheckoutIntegrationProvider(providerId)) {
    try {
      await this._handleCheckoutIntegrationProvider(checkout);
      return;
    } catch (error) {
      this._emitStorefrontEvent('checkout-integration-provider-fallback', {
        providerId,
        reason: 'discount-code-error',
        message: String(error && error.message || error),
      });
      ToastManager.show('Checkout discount could not be prepared. Redirecting to checkout.');
    }
  }

  setTimeout(() => {
    window.location.href = target;
  }, 1000);
},

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
},

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

    showPromoBanner: dataset.showPromoBanner !== 'false',

    discountTextTemplate: 'Add {conditionText} to get {discountText}',
    successMessageTemplate: 'Congratulations! You got {discountText}!',
    showDiscountProgressBar: false,
    discountProgressBarType: 'step_based',
    discountProgressTextTemplate: null,
    discountProgressSuccessTemplate: null,
    currentProductId: window.currentProductId,
    currentProductGid: window.currentProductGid,
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

  this._bundleConfigCacheMode = 'none';

  this.applyCardLayoutSettings();
},

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
    payload.type === 'full_page' &&
    typeof payload.id === 'string' &&
    payload.id.trim() !== ''
  );
},

async loadBundleData() {
  let bundleData = null;

  const bundleType = this.container.dataset.bundleType;
  const bundleId = this.container.dataset.bundleId;

  if (bundleType === 'full_page' && bundleId) {

    const cachedConfig = this.container.dataset.bundleConfig;
    const cachedPayload = this._parseBundleConfigPayload(cachedConfig);
    if (cachedPayload) {
      if (this._isBundleConfigBootstrapPayload(cachedPayload)) {
        this._bundleConfigCacheMode = 'bootstrap';
      } else if (typeof cachedPayload.id === 'string' && cachedPayload.id.trim() !== '') {
        this._bundleConfigCacheMode = 'legacy-full';
      }
    }

    if (!bundleData) {
      this._bundleConfigCacheMode = 'proxy';

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
},

selectBundle() {
  this.selectedBundle = BundleDataManager.selectBundle(this.bundleData, this.config);
  if (!this.selectedBundle && this.config?.bundleId && this.bundleData?.[this.config.bundleId]?.bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE) {
    this.selectedBundle = this.bundleData[this.config.bundleId];
  }
  if (this.selectedBundle) {
    this.config.showStepTimeline = this.resolveShowStepTimeline(
      this.selectedBundle.showStepTimeline ?? null,
      this.config.showStepTimeline
    );
  }

  this.updateMessagesFromBundle();
},
};

const fullPageInitialRenderMethods = {
updateMessagesFromBundle() {

  const messaging = this.selectedBundle?.messaging;
  const pricingMessages = this.selectedBundle?.pricing?.messages;
  const pricingDisplay = this.selectedBundle?.pricing?.display;
  const displayOptions = messaging?.displayOptions || pricingMessages?.displayOptions || {};
  const progressBarOptions = displayOptions?.progressBar || {};

  if (messaging) {
    if (messaging.progressTemplate) {
      this.config.discountTextTemplate = messaging.progressTemplate;
    }
    if (messaging.successTemplate) {
      this.config.successMessageTemplate = messaging.successTemplate;
    }

    this.config.showDiscountMessaging = messaging.showDiscountMessaging !== false;
    this.config.showDiscountProgressBar = progressBarOptions.enabled === true || messaging.showDiscountProgressBar === true;

  } else if (pricingMessages) {

    const shopLocale = window.Shopify?.locale;
    const byLocale = pricingMessages.ruleMessagesByLocale;
    const localeRuleMessages = shopLocale && byLocale?.[shopLocale];
    const ruleMessages = localeRuleMessages || pricingMessages.ruleMessages;
    const firstRuleMsg = ruleMessages && Object.values(ruleMessages)[0];
    if (firstRuleMsg?.discountText) {
      this.config.discountTextTemplate = firstRuleMsg.discountText;
    }
    if (firstRuleMsg?.successMessage) {
      this.config.successMessageTemplate = firstRuleMsg.successMessage;
    }

    this.config.showDiscountMessaging = pricingMessages.showDiscountMessaging === false
      ? false
      : this.selectedBundle?.pricing?.enabled || false;
    this.config.showDiscountProgressBar =
      progressBarOptions.enabled === true ||
      pricingMessages.showDiscountProgressBar === true ||
      pricingDisplay?.showDiscountProgressBar === true;

  } else {
    this.config.showDiscountMessaging = this.selectedBundle?.pricing?.enabled || false;
    this.config.showDiscountProgressBar = pricingDisplay?.showDiscountProgressBar === true;
  }

  this.config.discountProgressBarType = progressBarOptions.type === 'simple' ? 'simple' : 'step_based';
  this.config.discountProgressTextTemplate = progressBarOptions.progressText || this.config.discountTextTemplate;
  this.config.discountProgressSuccessTemplate = progressBarOptions.successText || this.config.successMessageTemplate;
},

applyPersonalizationAddonProducts() {
  const addonStep = this.buildAddonStepFromPersonalization();
  if (!addonStep) return;

  this.selectedBundle.steps = (this.selectedBundle.steps || []).filter(step => !step.isFreeGift);
  this.selectedBundle.steps = [...(this.selectedBundle.steps || []), addonStep];
},

buildAddonStepFromPersonalization() {
  const personalizationData = this.selectedBundle?.personalizationData;
  const addonProducts = personalizationData?.addonProducts;
  if (personalizationData?.isPersonalizationEnabled !== true) {
    return null;
  }

  const addonProductsEnabled = addonProducts?.isEnabled === true;
  const tiers = addonProductsEnabled && Array.isArray(addonProducts.tiers) ? addonProducts.tiers : [];
  const selectedAddonProducts = tiers.flatMap(tier =>
    Array.isArray(tier?.selectedAddonProducts)
      ? tier.selectedAddonProducts.map(product => this.normalizePersonalizationAddonProduct(product))
      : []
  );

  return {
    id: 'personalization-addons',
    name: personalizationData.personalizeStepText || addonProducts?.title || '',
    position: (this.selectedBundle?.steps?.length || 0) + 1,
    minQuantity: 0,
    maxQuantity: selectedAddonProducts.length,
    enabled: true,
    isFreeGift: true,
    addonLabel: personalizationData.personalizeStepText || addonProducts?.title || '',
    freeGiftName: addonProducts?.title || personalizationData.personalizeStepText || '',
    addonTitle: personalizationData.personalizePageSubtext || addonProducts?.title || '',
    addonIconUrl: personalizationData.stepImage || null,
    addonDisplayFree: false,
    addonProductsEnabled,
    addonUnlockAfterCompletion: true,
    addonTiers: addonProductsEnabled ? tiers : undefined,
    addonEligibilityCondition: null,
    addonDiscount: null,
    addonMessaging: addonProductsEnabled ? (addonProducts.addonsMessaging || null) : null,
    displayVariantsAsIndividual: false,
    StepProduct: selectedAddonProducts,
    products: selectedAddonProducts,
    collections: [],
  };
},

normalizePersonalizationAddonProduct(product) {
  const productGid = product?.graphqlId || product?.id || (product?.productId ? `gid://shopify/Product/${product.productId}` : '');
  const imageUrl = product?.images?.[0]?.originalSrc
    || product?.images?.[0]?.url
    || product?.image?.src
    || product?.imageUrl
    || '';
  const variants = Array.isArray(product?.variants) ? product.variants : [];

  return {
    productId: productGid,
    id: productGid,
    title: product?.title || '',
    handle: product?.handle || '',
    imageUrl,
    price: variants[0]?.price || product?.price || '0',
    compareAtPrice: variants[0]?.compareAtPrice || null,
    variants: variants.map(variant => {
      const variantGid = variant.variantGraphqlId || variant.id || (variant.variantId ? `gid://shopify/ProductVariant/${variant.variantId}` : productGid);
      return {
        id: variantGid,
        title: variant.variantTitle || variant.title || 'Default Title',
        price: variant.price || '0',
        compareAtPrice: variant.compareAtPrice || null,
        available: variant.available !== false,
        quantityAvailable: typeof variant.inventoryQuantity === 'number' ? variant.inventoryQuantity : null,
        currentlyNotInStock: false,
        image: imageUrl ? { src: imageUrl } : null,
      };
    }),
  };
},

initializeDataStructures() {
  const stepsCount = this.selectedBundle.steps.length;

  this.selectedProducts = Array(stepsCount).fill(null).map(() => ({}));

  this._initDefaultProducts();
  this._initDirectDefaultProducts();

  this.stepProductData = Array(stepsCount).fill(null).map(() => ([]));
},

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
},

createHeader() {
  const header = document.createElement('div');
  header.className = 'bundle-header';

  if (this.selectedBundle?.bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE) {
    header.style.display = 'none';
    return header;
  }

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
  footer.innerHTML = `
    <div class="footer-discount-text"></div>
  `;
  return footer;
},

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
},

async renderUI() {
  this.renderHeader();
  await this.renderSteps();
  this.renderFooter();
},

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
},

async renderSteps() {

  this.elements.stepsContainer.innerHTML = '';

  if (!this.selectedBundle || !this.selectedBundle.steps) {
    return;
  }

  const bundleType = this.selectedBundle.bundleType || BUNDLE_WIDGET.BUNDLE_TYPES.PRODUCT_PAGE;

  if (bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE) {

    FullPagePreset.markContainer(this.container, this.selectedBundle);
    await this.renderFullPageLayoutWithSidebar();
    return;
  }
},

};

function getMobileBottomBarActionState({
  conditionlessMobile,
  hasSelectionMobile,
  isLastStep,
  isComplete,
  boxSelectionValidMobile,
}) {
  const shouldAddToCart = conditionlessMobile || isLastStep;
  const disabled = conditionlessMobile
    ? (!hasSelectionMobile || !boxSelectionValidMobile)
    : (isLastStep ? (!isComplete || !boxSelectionValidMobile) : false);

  return { shouldAddToCart, disabled };
}

const fullPageResponsiveLayoutMethods = {
renderProductPageLayout() {
  this.selectedBundle.steps.forEach((step, index) => {
    const stepElement = this.createStepElement(step, index);
    this.elements.stepsContainer.appendChild(stepElement);
  });
},

async renderFullPageLayout() {

  this.hidePageTitle();

  this.elements.stepsContainer.innerHTML = '';
  this.elements.stepsContainer.classList.add('full-page-layout');
  this.applyFullPageDesignPresetMarker();
  await this.ensureFullPageTemplateStylesheet(this.getFullPageDesignPreset());
  this.ensureBundleBannerRuntimeStyles();

  const contentSection = document.createElement('div');
  contentSection.className = 'full-page-content-section';

  const bundleBanners = this.createBundleBanners();
  if (bundleBanners) {
    contentSection.appendChild(bundleBanners);
  }

  const promoBanner = this.createPromoBanner();
  if (promoBanner) {
    contentSection.appendChild(promoBanner);
  }

  if (this.config.showStepTimeline) {
    const stepTimeline = this.createStepTimeline();
    contentSection.appendChild(stepTimeline);
  }

  const contentHeader = this.createStepContentHeader(this.currentStepIndex);
  if (contentHeader) contentSection.appendChild(contentHeader);

  const stepBanner = this.createStepBannerImage(this.currentStepIndex);
  if (stepBanner) contentSection.appendChild(stepBanner);

  if (this.shouldRenderFullPageSearch()) {
    const searchInput = this.createSearchInput();
    contentSection.appendChild(searchInput);
  }

  if (this.config.showCategoryTabs) {
    const categoryTabs = this.createCategoryTabs(this.currentStepIndex);
    if (categoryTabs) {
      contentSection.appendChild(categoryTabs);
    }
  }

  const categoryRowsBefore = this.createCategorySectionRows(this.currentStepIndex, 'before');
  if (categoryRowsBefore) contentSection.appendChild(categoryRowsBefore);

  const activeCategoryTitle = this.createActiveCategoryTitle(this.currentStepIndex);
  if (activeCategoryTitle) contentSection.appendChild(activeCategoryTitle);

  const productGridContainer = document.createElement('div');
  productGridContainer.className = 'full-page-product-grid-container';
  this.renderProductGridLoadingState(productGridContainer);
  contentSection.appendChild(productGridContainer);
  const categoryRowsAfter = this.createCategorySectionRows(this.currentStepIndex, 'after');
  if (categoryRowsAfter) contentSection.appendChild(categoryRowsAfter);

  this.elements.stepsContainer.appendChild(contentSection);

  this.renderFullPageFooter();

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
},

async renderFullPageLayoutWithSidebar() {
  this.hidePageTitle();

  this.elements.stepsContainer.innerHTML = '';
  this.elements.stepsContainer.classList.add('full-page-layout', 'layout-sidebar');
  this.applyFullPageDesignPresetMarker();
  await this.ensureFullPageTemplateStylesheet(this.getFullPageDesignPreset());
  this.ensureBundleBannerRuntimeStyles();

  if (this.elements.footer) {
    this.elements.footer.style.display = 'none';
  }

  const bundleBanners = this.createBundleBanners();
  if (bundleBanners) {
    this.elements.stepsContainer.appendChild(bundleBanners);
  }

  if (this.config.showStepTimeline) {
    this.elements.stepsContainer.appendChild(this.createStepTimeline());
  }

  const contentHeader = this.createStepContentHeader(this.currentStepIndex);
  if (contentHeader) this.elements.stepsContainer.appendChild(contentHeader);

  if (this.config.showCategoryTabs) {
    const categoryTabs = this.createCategoryTabs(this.currentStepIndex);
    if (categoryTabs) this.elements.stepsContainer.appendChild(categoryTabs);
  }

  const twoColWrapper = document.createElement('div');
  twoColWrapper.className = 'sidebar-layout-wrapper';

  const contentSection = document.createElement('div');
  contentSection.className = 'full-page-content-section sidebar-content';

  const promoBanner = this.createPromoBanner();
  if (promoBanner) contentSection.appendChild(promoBanner);

  const stepBanner = this.createStepBannerImage(this.currentStepIndex);
  if (stepBanner) contentSection.appendChild(stepBanner);

  if (this.shouldRenderFullPageSearch()) {
    contentSection.appendChild(this.createSearchInput());
  }

  const categoryRowsBefore = this.createCategorySectionRows(this.currentStepIndex, 'before');
  if (categoryRowsBefore) contentSection.appendChild(categoryRowsBefore);

  const activeCategoryTitle = this.createActiveCategoryTitle(this.currentStepIndex);
  if (activeCategoryTitle) contentSection.appendChild(activeCategoryTitle);

  const currentStep = (this.selectedBundle?.steps || [])[this.currentStepIndex];
  if (currentStep?.isFreeGift && currentStep?.addonTitle) {
    const freeHeading = document.createElement('div');
    freeHeading.className = 'fpb-step-free-heading';
    freeHeading.textContent = currentStep.addonTitle;
    contentSection.appendChild(freeHeading);
  }

  const productGridContainer = document.createElement('div');
  productGridContainer.className = 'full-page-product-grid-container';
  this.renderProductGridLoadingState(productGridContainer);
  contentSection.appendChild(productGridContainer);
  const categoryRowsAfter = this.createCategorySectionRows(this.currentStepIndex, 'after');
  if (categoryRowsAfter) contentSection.appendChild(categoryRowsAfter);

  twoColWrapper.appendChild(contentSection);

  const sidePanel = document.createElement('div');
  sidePanel.className = 'full-page-side-panel';
  this.renderSidePanel(sidePanel);
  twoColWrapper.appendChild(sidePanel);

  this.elements.stepsContainer.appendChild(twoColWrapper);

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
},

_renderMobileBottomBar({ preserveOpen = false } = {}) {
  const previousSheet = document.querySelector('.fpb-mobile-bottom-sheet');
  const wasOpen = preserveOpen && previousSheet?.classList.contains('is-open');
  const wasCompactSummaryExpanded = preserveOpen
    && previousSheet?.classList.contains('fpb-mobile-summary-tray-expanded');

  document.querySelector('.fpb-mobile-bottom-bar')?.remove();
  document.querySelector('.fpb-mobile-bottom-sheet')?.remove();
  document.querySelector('.fpb-mobile-backdrop')?.remove();
  document.body.classList.remove('fpb-compact-mobile-summary-active');
  document.body.classList.remove('fpb-mobile-summary-scroll-locked');

  const { totalPrice, totalQuantity, unitPrices } = PricingCalculator.calculateBundleTotal(
    this.selectedProducts,
    this.stepProductData,
    this.selectedBundle?.steps
  );
  const discountInfo = PricingCalculator.calculateDiscount(this.selectedBundle, totalPrice, totalQuantity, unitPrices);
  const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);
  const currencyInfo = CurrencyManager.getCurrencyInfo();
  const finalPrice = combinedDiscountInfo.hasDiscount ? combinedDiscountInfo.finalPrice : totalPrice;
  const selectedCount = this.getAllSelectedProductsData().filter(p => !p.isDefault).length;
  const isLastStep = this.currentStepIndex === (this.selectedBundle?.steps?.length || 1) - 1;
  const isComplete = this.areBundleConditionsMet();

  const backdrop = document.createElement('div');
  backdrop.className = 'fpb-mobile-backdrop';

  const sheet = document.createElement('div');
  sheet.className = 'fpb-mobile-bottom-sheet';
  this._syncMobilePortalThemeVars(sheet);
  const usesCompactMobileSummaryTray = this.usesCompactMobileSummaryTray();
  if (usesCompactMobileSummaryTray) {
    const preset = this.getFullPageDesignPreset();
    if (preset) {
      sheet.classList.add(`fpb-preset-${preset.toLowerCase()}`);
    }
    sheet.classList.add('fpb-mobile-summary-tray');
    if (preset === 'CLASSIC') {
      sheet.classList.add('fpb-mobile-classic-footer');
    }
    this.compactMobileSummaryTrayExpanded = wasCompactSummaryExpanded || this.compactMobileSummaryTrayExpanded === true;
    this._populateCompactMobileSummaryTray(sheet);
    sheet.classList.add('is-open');
    document.body.classList.add('fpb-compact-mobile-summary-active');
    this._mountCompactMobileSummaryTray(sheet);
    return;
  }

  this._populateMobileSheet(sheet);

  const bar = document.createElement('div');
  bar.className = 'fpb-mobile-bottom-bar';
  this._syncMobilePortalThemeVars(bar);

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
  const boxSelectionValidMobile = this.canCheckoutWithBoxSelection();
  const mobileActionState = getMobileBottomBarActionState({
    conditionlessMobile,
    hasSelectionMobile,
    isLastStep,
    isComplete,
    boxSelectionValidMobile,
  });
  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'fpb-mobile-cta-btn';
  ctaBtn.textContent = mobileActionState.shouldAddToCart ? this._resolveText('addToCartButton', 'Add to Cart') : this._resolveText('nextButton', 'Next');
  if (mobileActionState.disabled) ctaBtn.disabled = true;
  ctaBtn.addEventListener('click', async () => {
    if (this._isWidgetActionBusy) return;

    if (mobileActionState.shouldAddToCart) {
      if (!this.canCheckoutWithBoxSelection()) {
        this.showBoxSelectionValidationMessage();
        return;
      }
      await this.addBundleToCart(ctaBtn);
    } else if (!isLastStep && this.canNavigateToStep(this.currentStepIndex + 1) && this.canProceedToNextStep()) {
      await this._withWidgetActionBusy(async () => {
        this.activeCollectionId = null;
        this.searchQuery = '';
        this.currentStepIndex++;
        await this.renderFullPageLayoutWithSidebar();
      }, { actionButton: ctaBtn });
    } else if (!isLastStep && !this.canNavigateToStep(this.currentStepIndex + 1)) {
      ToastManager.show(this.freeGiftStep?.addonLabel || this.freeGiftStep?.freeGiftName ? `Complete all steps to unlock the free ${this.freeGiftStep?.addonLabel || this.freeGiftStep?.freeGiftName}!` : 'Complete all steps first.');
    } else {
      ToastManager.show(this.getStepConditionValidationMessage?.() || 'Please meet the quantity conditions for the current step before proceeding.');
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
},

_mountCompactMobileSummaryTray(sheet) {
  if (this.container?.parentNode) {
    this.container.insertAdjacentElement('afterend', sheet);
    return;
  }

  document.body.appendChild(sheet);
},

_populateMobileSheet(sheet) {
  sheet.innerHTML = '';
  this._syncMobilePortalThemeVars(sheet);
  this.renderSidePanel(sheet);
},

_syncMobilePortalThemeVars(...elements) {
  const source = this.container || document.documentElement;
  const sourceStyles = getComputedStyle(source);
  const fallbackStyles = source === document.documentElement
    ? sourceStyles
    : getComputedStyle(document.documentElement);
  const themeVars = [
    '--bundle-add-btn-color',
    '--bundle-button-bg',
    '--bundle-button-text-color',
    '--bundle-global-button-text',
    '--bundle-global-primary-button',
    '--bundle-sidebar-button-bg',
    '--bundle-sidebar-button-text',
  ];

  elements.filter(Boolean).forEach((element) => {
    themeVars.forEach((property) => {
      const value = sourceStyles.getPropertyValue(property).trim()
        || fallbackStyles.getPropertyValue(property).trim();
      if (value) {
        element.style.setProperty(property, value);
      }
    });
  });
},

usesCompactMobileSummaryTray() {
  const preset = this.getFullPageDesignPreset();
  return this.resolveFullPageLayout() === 'footer_side' && (preset === 'STANDARD' || preset === 'CLASSIC' || preset === 'COMPACT' || preset === 'HORIZONTAL');
},
};

function shouldUseMobileSummarySlotTiles({ designPreset, productSlotsEnabled } = {}) {
  if (productSlotsEnabled !== true) return false;

  const preset = typeof designPreset === 'string' ? designPreset.trim().toUpperCase() : '';
  return preset === 'STANDARD' || preset === 'CLASSIC';
}

function getMobileAdditionalOffersPulseState({
  designPreset,
  currentStepIndex = 0,
  steps = [],
  addonStates = [],
} = {}) {
  const preset = typeof designPreset === 'string' ? designPreset.trim().toUpperCase() : '';
  if (preset !== 'CLASSIC' && preset !== 'STANDARD') return { shouldPulse: false, signature: '' };

  const bundleSteps = Array.isArray(steps) ? steps : [];
  const currentStep = bundleSteps[currentStepIndex] || null;
  if (currentStep?.isFreeGift === true) return { shouldPulse: false, signature: '' };

  const states = Array.isArray(addonStates) ? addonStates.filter(Boolean) : [];
  const hasEligibleOffer = states.some(state => state.isEligible === true);
  const hasLockedOffer = states.some(state => state.isEligible !== true);
  if (!hasEligibleOffer || !hasLockedOffer) return { shouldPulse: false, signature: '' };

  const signature = states
    .map((state, index) => {
      const tierId = state.tier?.tierId || state.tier?.id || index;
      return `${tierId}:${state.isEligible === true ? 'eligible' : 'locked'}`;
    })
    .join('|');

  return {
    shouldPulse: true,
    signature,
    message: 'Additional offers to be unlocked',
  };
}

const MOBILE_ADDITIONAL_OFFERS_GREEN_DELAY_MS = 550;
const MOBILE_ADDITIONAL_OFFERS_MESSAGE_DELAY_MS = 800;
const MOBILE_ADDITIONAL_OFFERS_DURATION_MS = 3000;

const fullPageMobileSummaryMethods = {
_populateCompactMobileSummaryTray(sheet) {
  sheet.innerHTML = '';

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
  const finalPrice = combinedDiscountInfo.hasDiscount ? combinedDiscountInfo.finalPrice : totalPrice;
  const displayFinalPrice = shouldDisplayClassicFixedBundleRawTotal(this, combinedDiscountInfo)
    ? totalPrice
    : finalPrice;
  const nextRule = PricingCalculator.getNextDiscountRule?.(this.selectedBundle, totalQuantity) || null;
  const selectedFooterQuantity = this.getAllSelectedProductsData().reduce(
    (sum, item) => sum + (Number(item.quantity) || 1),
    0
  );
  const isClassicPreset = this.getFullPageDesignPreset?.() === 'CLASSIC';
  const summaryToggleLabel = isClassicPreset ? 'View Selected Products' : 'Review your bundle';
  const addonStep = (this.selectedBundle?.steps || []).find(step => step?.isFreeGift === true) || null;
  const addonStates = addonStep && typeof this.getAddonSummaryEligibilityStates === 'function'
    ? this.getAddonSummaryEligibilityStates(addonStep)
    : [];
  const additionalOffersPulseState = getMobileAdditionalOffersPulseState({
    designPreset: this.getFullPageDesignPreset?.(),
    currentStepIndex: this.currentStepIndex,
    steps: this.selectedBundle?.steps || [],
    addonStates,
  });
  const additionalOffersBadgeState = this._syncMobileAdditionalOffersPulse?.(additionalOffersPulseState)
    || { active: false, showMessage: false };
  const toggleSummaryTray = () => {
    this._toggleCompactMobileSummaryTray(sheet);
  };
  const handleSummaryToggleKeydown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleSummaryTray();
    }
  };

  const countBadge = document.createElement('div');
  countBadge.className = 'fpb-mobile-summary-count-badge';
  if (countBadge.dataset) {
    countBadge.dataset.summaryQuantity = String(selectedFooterQuantity);
  } else {
    countBadge.setAttribute('data-summary-quantity', String(selectedFooterQuantity));
  }
  if (additionalOffersPulseState.message) {
    if (countBadge.dataset) {
      countBadge.dataset.additionalOffersMessage = additionalOffersPulseState.message;
    } else {
      countBadge.setAttribute('data-additional-offers-message', additionalOffersPulseState.message);
    }
  }
  if (additionalOffersBadgeState.active) {
    countBadge.classList.add('fpb-mobile-summary-count-badge--additional-offers');
  }
  if (additionalOffersBadgeState.showMessage) {
    countBadge.classList.add('fpb-mobile-summary-count-badge--additional-offers-message');
  }
  countBadge.textContent = additionalOffersBadgeState.showMessage
    ? additionalOffersPulseState.message
    : String(selectedFooterQuantity);
  countBadge.setAttribute('role', 'button');
  countBadge.setAttribute('tabindex', '0');
  countBadge.setAttribute('aria-label', summaryToggleLabel);
  countBadge.setAttribute('aria-expanded', this.compactMobileSummaryTrayExpanded ? 'true' : 'false');
  countBadge.addEventListener('click', toggleSummaryTray);
  countBadge.addEventListener('keydown', handleSummaryToggleKeydown);
  sheet.appendChild(countBadge);

  sheet.classList.toggle('fpb-mobile-summary-tray-expanded', this.compactMobileSummaryTrayExpanded);
  this._syncCompactMobileSummaryScrollLock();
  sheet.classList.toggle(
    'fpb-mobile-summary-tray--slots',
    shouldUseMobileSummarySlotTiles({
      designPreset: this.getFullPageDesignPreset(),
      productSlotsEnabled: this._shouldRenderProductSlots(),
    })
  );
  sheet.classList.remove('fpb-mobile-summary-tray--has-discount-summary');

  if (isClassicPreset) {
    const toggleRow = document.createElement('button');
    toggleRow.className = 'fpb-mobile-summary-toggle-row';
    toggleRow.type = 'button';
    toggleRow.setAttribute('aria-expanded', this.compactMobileSummaryTrayExpanded ? 'true' : 'false');
    toggleRow.textContent = summaryToggleLabel;
    toggleRow.addEventListener('click', toggleSummaryTray);
    sheet.appendChild(toggleRow);
  }

  if (this.selectedBundle?.pricing?.enabled) {
    const discountBlock = document.createElement('div');
    discountBlock.className = 'side-panel-discount-message';
    if (this.config.showDiscountMessaging) {
      const variables = TemplateManager.createDiscountVariables(
        this.selectedBundle, totalPrice, totalQuantity, combinedDiscountInfo, currencyInfo
      );
      let discountMessage = '';
      if (combinedDiscountInfo.hasDiscount) {
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
        msgEl.className = 'fpb-mobile-summary-discount-text';
        msgEl.innerHTML = discountMessage;
        discountBlock.appendChild(msgEl);
      }
    }

    if (this.config.showDiscountProgressBar) {
      const progressBar = this._renderDiscountProgress({
        placement: "sidebar",
        combinedDiscountInfo,
        totalPrice,
        totalQuantity,
        unitPrices,
      });
      if (progressBar) {
        progressBar.classList.add('fpb-dp-sidebar');
        discountBlock.appendChild(progressBar);
      }
    }

    if (discountBlock.childElementCount > 0) {
      sheet.classList.add('fpb-mobile-summary-tray--has-discount-summary');
      sheet.appendChild(discountBlock);
    }
  }

  const navSection = document.createElement('div');
  navSection.className = 'side-panel-nav';
  const isLastStep = this.currentStepIndex === (this.selectedBundle?.steps?.length || 1) - 1;
  const conditionlessMobile = this.bundleHasNoConditions();
  const hasSelectionMobile = conditionlessMobile && this.getAllSelectedProductsData().filter(p => !p.isDefault).length > 0;
  const actionButton = this._createMobileSummaryActionButton({
    finalPrice: displayFinalPrice,
    currencyInfo,
    conditionlessMobile,
    hasSelectionMobile,
    isLastStep,
    isComplete: this.areBundleConditionsMet()
  });
  navSection.appendChild(actionButton);
  if (this.compactMobileSummaryTrayExpanded) {
    const productsSection = document.createElement('div');
    productsSection.className = 'fpb-mobile-summary-products-section';
    productsSection.appendChild(this._renderCompactMobileSummaryBundleItems(currencyInfo, totalQuantity));
    productsSection.appendChild(navSection);
    sheet.appendChild(productsSection);
  } else {
    sheet.appendChild(navSection);
  }
},

_syncMobileAdditionalOffersPulse(pulseState = {}) {
  const now = Date.now();
  const currentPulse = this.mobileAdditionalOffersPulse;
  const timerKeys = [
    'mobileAdditionalOffersGreenTimer',
    'mobileAdditionalOffersMessageTimer',
    'mobileAdditionalOffersEndTimer',
  ];

  const getBadge = () => document.querySelector?.(
    '.fpb-mobile-summary-tray .fpb-mobile-summary-count-badge'
  ) || null;

  const applyBadgeState = ({ active = false, showMessage = false } = {}) => {
    const badge = getBadge();
    if (!badge || badge.isConnected === false) return;

    const message = pulseState.message
      || badge.dataset?.additionalOffersMessage
      || badge.getAttribute?.('data-additional-offers-message')
      || '';
    const quantity = badge.dataset?.summaryQuantity
      || badge.getAttribute?.('data-summary-quantity')
      || badge.textContent
      || '';
    badge.classList.toggle('fpb-mobile-summary-count-badge--additional-offers', active);
    badge.classList.toggle('fpb-mobile-summary-count-badge--additional-offers-message', showMessage);
    badge.textContent = showMessage && message ? message : quantity;
  };

  const clearTimers = () => {
    timerKeys.forEach((timerKey) => {
      if (this[timerKey]) {
        clearTimeout(this[timerKey]);
        this[timerKey] = null;
      }
    });
  };

  if (pulseState.shouldPulse !== true || !pulseState.signature) {
    clearTimers();
    this.mobileAdditionalOffersPulse = null;
    this.mobileAdditionalOffersCompletedSignature = null;
    return { active: false, showMessage: false };
  }

  if (
    currentPulse
    && currentPulse.signature === pulseState.signature
    && currentPulse.expiresAt > now
  ) {
    return {
      active: now >= currentPulse.greenAt,
      showMessage: now >= currentPulse.messageAt,
    };
  }

  if (currentPulse?.signature === pulseState.signature && currentPulse.expiresAt <= now) {
    this.mobileAdditionalOffersCompletedSignature = pulseState.signature;
    this.mobileAdditionalOffersPulse = null;
    return { active: false, showMessage: false };
  }

  if (this.mobileAdditionalOffersCompletedSignature === pulseState.signature) {
    return { active: false, showMessage: false };
  }

  clearTimers();
  const nextPulse = {
    signature: pulseState.signature,
    greenAt: now + MOBILE_ADDITIONAL_OFFERS_GREEN_DELAY_MS,
    messageAt: now + MOBILE_ADDITIONAL_OFFERS_MESSAGE_DELAY_MS,
    expiresAt: now + MOBILE_ADDITIONAL_OFFERS_DURATION_MS,
  };
  this.mobileAdditionalOffersPulse = nextPulse;

  this.mobileAdditionalOffersGreenTimer = setTimeout(
    () => applyBadgeState({ active: true, showMessage: false }),
    MOBILE_ADDITIONAL_OFFERS_GREEN_DELAY_MS
  );
  this.mobileAdditionalOffersMessageTimer = setTimeout(
    () => applyBadgeState({ active: true, showMessage: true }),
    MOBILE_ADDITIONAL_OFFERS_MESSAGE_DELAY_MS
  );
  this.mobileAdditionalOffersEndTimer = setTimeout(() => {
    this.mobileAdditionalOffersCompletedSignature = nextPulse.signature;
    this.mobileAdditionalOffersPulse = null;
    applyBadgeState({ active: false, showMessage: false });
  }, MOBILE_ADDITIONAL_OFFERS_DURATION_MS);

  return { active: false, showMessage: false };
},

_toggleCompactMobileSummaryTray(sheet) {
  const nextExpanded = !this.compactMobileSummaryTrayExpanded;
  this.compactMobileSummaryTrayExpanded = nextExpanded;
  this._populateCompactMobileSummaryTray(sheet);
  this._syncCompactMobileSummaryScrollLock();

  sheet.classList.remove(
    'fpb-mobile-summary-tray-animating-open',
    'fpb-mobile-summary-tray-animating-closed'
  );
  sheet.classList.add(
    nextExpanded
      ? 'fpb-mobile-summary-tray-animating-open'
      : 'fpb-mobile-summary-tray-animating-closed'
  );

  if (this.compactMobileSummaryTrayAnimationTimeout) {
    clearTimeout(this.compactMobileSummaryTrayAnimationTimeout);
  }
  this.compactMobileSummaryTrayAnimationTimeout = setTimeout(() => {
    sheet.classList.remove(
      'fpb-mobile-summary-tray-animating-open',
      'fpb-mobile-summary-tray-animating-closed'
    );
  }, 380);
},

_syncCompactMobileSummaryScrollLock() {
  document.body.classList.toggle(
    'fpb-mobile-summary-scroll-locked',
    this.compactMobileSummaryTrayExpanded === true
  );
},

_renderCompactMobileSummaryBundleItems(currencyInfo, totalQuantity) {
  const allSelectedProducts = this.getAllSelectedProductsData();
  const activeStep = this.selectedBundle?.steps?.[this.currentStepIndex] || this.selectedBundle?.steps?.[0] || null;
  const summaryText = this.getBundleSummaryText();

  const bundleItems = document.createElement('div');
  bundleItems.className = 'fpb-mobile-summary-bundle-items';

  const header = document.createElement('div');
  header.className = 'fpb-mobile-summary-bundle-header';

  const headerCopy = document.createElement('div');
  headerCopy.className = 'fpb-mobile-summary-bundle-copy';
  const title = document.createElement('div');
  title.className = 'fpb-mobile-summary-bundle-title';
  title.textContent = summaryText.title;
  const subtitle = document.createElement('div');
  subtitle.className = 'fpb-mobile-summary-bundle-subtitle';
  subtitle.textContent = summaryText.subTitle;
  headerCopy.append(title, subtitle);
  header.appendChild(headerCopy);

  if (allSelectedProducts.length > 0) {
    const clearBtn = document.createElement('button');
    clearBtn.className = 'fpb-mobile-summary-clear-btn';
    clearBtn.innerHTML = `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor"><path d="M6 2h8a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1Zm-2 3h12l-1 13H5L4 5Zm4 2v9m4-9v9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg><span>Clear</span>`;
    clearBtn.addEventListener('click', () => {
      this.showClearCartConfirmation();
    });
    header.appendChild(clearBtn);
  }
  bundleItems.appendChild(header);

  if (this.getFullPageDesignPreset() === 'CLASSIC') {
    const selectedBoxSelectionQuantity = this.getSelectedBoxSelectionQuantity();
    const boxSelection = this.renderBoxSelectionOptions(selectedBoxSelectionQuantity);
    if (boxSelection) {
      boxSelection.classList.add('fpb-mobile-summary-box-selection');
      bundleItems.appendChild(boxSelection);
    }
  }

  const productsList = document.createElement('div');
  productsList.className = 'fpb-mobile-summary-products-list';
  const shouldRenderSlotTiles = shouldUseMobileSummarySlotTiles({
    designPreset: this.getFullPageDesignPreset(),
    productSlotsEnabled: this._shouldRenderProductSlots(),
  });

  if (shouldRenderSlotTiles) {
    productsList.classList.add('fpb-mobile-summary-products-list--slots');
    this._renderCompactMobileSummarySlotTiles(productsList, allSelectedProducts, activeStep, totalQuantity);
    bundleItems.appendChild(productsList);
    return bundleItems;
  }

  allSelectedProducts.forEach(item => {
    const summaryTitle = this.getSummaryProductDisplayTitle(item);
    const variantInfo = this.getSummaryProductVariantDisplay(item);
    const row = document.createElement('div');
    row.className = 'fpb-mobile-summary-product-row';
    const imgSrc = this._getSelectedProductImageSrc(item);
    const isFreeGiftItem = item.isFreeGift === true && item.addonDisplayFree === true;
    const priceText = CurrencyManager.convertAndFormat(
      isFreeGiftItem ? 0 : item.price * item.quantity,
      currencyInfo
    );

    row.innerHTML = `
      <div class="fpb-mobile-summary-product-image-wrap">
        ${imgSrc ? `<img src="${imgSrc}" alt="${this._escapeHTML(summaryTitle)}" class="fpb-mobile-summary-product-image">` : '<div class="fpb-mobile-summary-product-image-placeholder"></div>'}
      </div>
      <div class="fpb-mobile-summary-product-info">
        <span class="fpb-mobile-summary-product-title">${this._escapeHTML(summaryTitle)}</span>
        ${variantInfo ? `<span class="fpb-mobile-summary-product-variant">${this._escapeHTML(variantInfo)}</span>` : ''}
        <span class="fpb-mobile-summary-product-price">${priceText}</span>
      </div>
      <div class="fpb-mobile-summary-product-action">
        <span class="fpb-mobile-summary-product-qty">x${item.quantity}</span>
      </div>
    `;

    if (!item.isDefault) {
      const removeBtn = document.createElement('button');
      removeBtn.className = 'fpb-mobile-summary-product-remove';
      const removalState = this.getSummaryProductRemovalState(item);
      if (!removalState.canRemove) {
        removeBtn.classList.add('fpb-mobile-summary-product-remove--disabled');
        removeBtn.setAttribute('aria-disabled', 'true');
        removeBtn.title = removalState.blockedMessage;
      }
      removeBtn.innerHTML = `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor"><path d="M6 2h8a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1Zm-2 3h12l-1 13H5L4 5Zm4 2v9m4-9v9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>`;
      removeBtn.addEventListener('click', () => {
        this.removeSummarySelectedProduct(item, summaryTitle);
      });
      row.querySelector('.fpb-mobile-summary-product-action')?.appendChild(removeBtn);
    }

    productsList.appendChild(row);
  });

  if (
    allSelectedProducts.length === 0
    && !this._shouldRenderProductSlots()
    && typeof this._renderSidebarProductSkeletons === 'function'
  ) {
    productsList.classList.add('fpb-mobile-summary-products-list--skeletons');
    this._renderSidebarProductSkeletons(productsList);
  }

  const requiredSlots = Math.max(
    allSelectedProducts.length + 1,
    activeStep?.maxQuantity || activeStep?.minQuantity || totalQuantity + 1,
    2
  );
  if (this._shouldRenderProductSlots()) {
    const emptySlots = Math.max(0, Math.min(2, requiredSlots - allSelectedProducts.length));
    const emptyStateIconUrl = this._escapeHTML(this.selectedBundle?.productSlotIconUrl || '');
    for (let slotIndex = 0; slotIndex < emptySlots; slotIndex += 1) {
      const emptyCard = document.createElement('div');
      emptyCard.className = 'fpb-mobile-summary-empty-product-card';
      const emptyStateIcon = emptyStateIconUrl
        ? `<img class="fpb-mobile-summary-slot-icon-img" src="${emptyStateIconUrl}" alt="" width="63" height="63">`
        : '<span class="fpb-mobile-summary-slot-plus">+</span>';
      emptyCard.innerHTML = `
        <div class="fpb-mobile-summary-empty-product-image">${emptyStateIcon}</div>
        <div class="fpb-mobile-summary-empty-product-info">
          <span class="fpb-mobile-summary-empty-product-title"></span>
          <span class="fpb-mobile-summary-empty-product-variant"></span>
          <span class="fpb-mobile-summary-empty-product-price"></span>
        </div>
        <span class="fpb-mobile-summary-empty-product-action"></span>
      `;
      productsList.appendChild(emptyCard);
    }
  }

  bundleItems.appendChild(productsList);
  return bundleItems;
},

_renderCompactMobileSummarySlotTiles(container, allSelectedProducts = [], activeStep = null, totalQuantity = 0) {
  const selectedItems = Array.isArray(allSelectedProducts) ? allSelectedProducts : [];
  const sharedTargetCount = typeof this.getSummarySidebarMaxItemCount === 'function'
    ? this.getSummarySidebarMaxItemCount(selectedItems.length)
    : 0;
  const slotCount = Math.max(
    sharedTargetCount,
    selectedItems.length + 1,
    activeStep?.maxQuantity || activeStep?.minQuantity || totalQuantity + 1,
    2
  );
  const emptyStateIconUrl = this._escapeHTML(this.selectedBundle?.productSlotIconUrl || '');

  for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
    const item = selectedItems[slotIndex];
    const card = document.createElement('div');
    card.className = item
      ? 'fpb-mobile-summary-slot-card fpb-mobile-summary-slot-card--filled'
      : 'fpb-mobile-summary-slot-card fpb-mobile-summary-slot-card--empty';

    if (item) {
      const summaryTitle = this.getSummaryProductDisplayTitle(item);
      const imgSrc = this._getSelectedProductImageSrc(item);
      card.innerHTML = imgSrc
        ? `<img src="${imgSrc}" alt="${this._escapeHTML(summaryTitle)}" class="fpb-mobile-summary-slot-image">`
        : '<div class="fpb-mobile-summary-slot-image-placeholder"></div>';
    } else {
      card.innerHTML = emptyStateIconUrl
        ? `<img class="fpb-mobile-summary-slot-icon-img" src="${emptyStateIconUrl}" alt="">`
        : '<span class="fpb-mobile-summary-slot-plus">+</span>';
    }

    container.appendChild(card);
  }
},

_createMobileSummaryActionButton({
  finalPrice,
  currencyInfo,
  conditionlessMobile,
  hasSelectionMobile,
  isLastStep,
  isComplete
}) {
  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'side-panel-btn side-panel-btn-next';
  const shouldAdvance = !conditionlessMobile && !isLastStep;
  const shouldAddToCart = !shouldAdvance && (conditionlessMobile || isLastStep);
  const actionText = shouldAddToCart
    ? this._resolveText('addToCartButton', 'Add to Cart')
    : this._resolveText('nextButton', 'Next');
  const priceText = CurrencyManager.convertAndFormat(finalPrice, currencyInfo);
  const labelSpan = document.createElement('span');
  labelSpan.className = 'fpb-mobile-summary-action-label';
  labelSpan.textContent = actionText;
  const separatorSpan = document.createElement('span');
  separatorSpan.className = 'fpb-mobile-summary-action-separator';
  separatorSpan.textContent = '•';
  const priceSpan = document.createElement('span');
  priceSpan.className = 'fpb-mobile-summary-action-price';
  priceSpan.textContent = priceText;
  ctaBtn.append(labelSpan, separatorSpan, priceSpan);
  const isClassicPreset = this.getFullPageDesignPreset?.() === 'CLASSIC';
  const shouldKeepClassicValidationClickable = isClassicPreset && shouldAddToCart && !conditionlessMobile && !isComplete;
  if (
    shouldAddToCart
    && !shouldKeepClassicValidationClickable
    && (conditionlessMobile ? (!hasSelectionMobile || !this.canCheckoutWithBoxSelection()) : (!isComplete || !this.canCheckoutWithBoxSelection()))
  ) ctaBtn.disabled = true;
  ctaBtn.addEventListener('click', async () => {
    if (shouldAddToCart) {
      if (!conditionlessMobile && !this.areBundleConditionsMet()) {
        ToastManager.show(this.getStepConditionValidationMessage?.() || 'Please meet the quantity conditions for the current step before proceeding.');
        return;
      }
      if (!this.canCheckoutWithBoxSelection()) {
        this.showBoxSelectionValidationMessage();
        return;
      }
      await this.addBundleToCart(ctaBtn);
    } else {
      const targetStepIndex = this.currentStepIndex + 1;
      if (this.canNavigateToStep(targetStepIndex) && this.canProceedToNextStep()) {
        const previousStepIndex = this.currentStepIndex;
        this.activeCollectionId = null;
        this.searchQuery = '';
        this.currentStepIndex = targetStepIndex;
        this._emitStorefrontEvent('step-changed', { previousStepIndex, currentStepIndex: targetStepIndex, direction: 'next' });
        await this._withWidgetActionBusy(async () => {
          await this.renderFullPageLayoutWithSidebar();
        }, { actionButton: ctaBtn });
      } else if (!this.canNavigateToStep(targetStepIndex)) {
        ToastManager.show(this.freeGiftStep?.addonLabel || this.freeGiftStep?.freeGiftName ? `Complete all steps to unlock the free ${this.freeGiftStep?.addonLabel || this.freeGiftStep?.freeGiftName}!` : 'Complete all steps first.');
      } else {
        ToastManager.show(this.getStepConditionValidationMessage?.() || 'Please meet the quantity conditions for the current step before proceeding.');
      }
    }
  });
  return ctaBtn;
},

getBundleSummaryText() {
  const summary = this.selectedBundle?.bundleTextConfig?.bundleSummary || {};
  return {
    title: typeof summary.title === 'string' && summary.title.trim()
      ? summary.title
      : 'Your Bundle',
    subTitle: typeof summary.subTitle === 'string' && summary.subTitle.trim()
      ? summary.subTitle
      : 'Review your bundle'
  };
},

getBundleContentSummaryText() {
  const summary = this.selectedBundle?.bundleTextConfig?.bundleSummary || {};
  return {
    title: typeof summary.title === 'string' ? summary.title.trim() : '',
    subTitle: typeof summary.subTitle === 'string' ? summary.subTitle.trim() : ''
  };
},

getCurrentStepContentText(stepIndex) {
  const step = this.selectedBundle?.steps?.[stepIndex];
  return {
    subtext: typeof step?.pageTitle === 'string' ? step.pageTitle.trim() : ''
  };
},

createStepContentHeader(stepIndex) {
  const contentText = this.getCurrentStepContentText(stepIndex);
  if (!contentText.subtext) return null;

  const header = document.createElement('div');
  header.className = 'fpb-full-page-content-header';

  const subtitle = document.createElement('p');
  subtitle.className = 'fpb-full-page-content-subtitle fpb-step-subtext';
  subtitle.textContent = contentText.subtext;
  header.appendChild(subtitle);

  return header;
},

shouldRenderFullPageSearch() {
  if (this.resolveFullPageLayout() === 'footer_side') {
    return false;
  }
  return this.resolveFullPageCardCtaMode() !== 'icon';
},

usesSelectedQuantityBadge() {
  return false;
},

_isStandardDesktopSidebar(panel) {
  const preset = this.getFullPageDesignPreset();
  return this.resolveFullPageLayout() === 'footer_side'
    && (preset === 'STANDARD' || preset === 'CLASSIC')
    && !panel?.classList?.contains('fpb-mobile-bottom-sheet');
},

createStandardSidebarSelectedRow(item, currencyInfo) {
  const summaryTitle = this.getSummaryProductDisplayTitle(item);
  const variantInfo = this.getSummaryProductVariantDisplay(item);
  const isFreeGiftItem = item.isFreeGift === true && item.addonDisplayFree === true;
  const priceText = isFreeGiftItem
    ? CurrencyManager.convertAndFormat(0, currencyInfo)
    : CurrencyManager.convertAndFormat(item.price * item.quantity, currencyInfo);
  const wrapper = document.createElement('div');

  wrapper.innerHTML = renderSelectedProductRow({
    id: item.variantId || item.productId || item.id,
    title: summaryTitle,
    variantTitle: variantInfo,
    imageUrl: this._getSelectedProductImageSrc(item),
    quantity: item.quantity,
    priceText,
    isDefault: item.isDefault === true,
    isFreeGift: isFreeGiftItem,
  }).trim();

  const row = wrapper.firstElementChild;
  row?.classList?.add('side-panel-product-row');
  return row;
},

createStandardSidebarDiscountProgress({ discountMessage, combinedDiscountInfo, totalPrice, totalQuantity }) {
  const activeRule = combinedDiscountInfo?.applicableRule
    || PricingCalculator.getNextDiscountRule?.(this.selectedBundle, totalQuantity)
    || null;
  if (!activeRule) return null;

  const conditionType = PricingCalculator.getRuleConditionType(activeRule);
  const targetValue = PricingCalculator.getRuleConditionValue(
    activeRule,
    PricingCalculator.getDiscountMethod(this.selectedBundle)
  );
  const currentValue = conditionType === 'amount' ? totalPrice : totalQuantity;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = renderDiscountProgress(
    getDiscountProgressData({
      currentValue,
      targetValue,
      message: discountMessage || '',
    }),
    {
      mode: this.config.discountProgressBarType === 'simple' ? 'bar' : 'stepped',
      messagePlacement: 'external',
    }
  ).trim();

  const progress = wrapper.firstElementChild;
  progress?.classList?.add('bw-discount-progress--standard-sidebar');
  progress?.classList?.add('fpb-dp-sidebar');
  return progress;
},

};

const fullPageSidePanelMethods = {
renderSidePanel(panel) {
  if (!panel) return;
  panel.innerHTML = '';

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
  const finalPrice = combinedDiscountInfo.hasDiscount ? combinedDiscountInfo.finalPrice : totalPrice;
  const shouldShowRawTotalOnly = shouldDisplayClassicFixedBundleRawTotal(this, combinedDiscountInfo);
  const displayFinalPrice = shouldShowRawTotalOnly ? totalPrice : finalPrice;
  const shouldShowOriginalTotal = combinedDiscountInfo.hasDiscount && !shouldShowRawTotalOnly;
  const allSelectedProducts = this.getAllSelectedProductsData();
  const nextRule = PricingCalculator.getNextDiscountRule?.(this.selectedBundle, totalQuantity) || null;
  const isMobileSheet = panel.classList?.contains('fpb-mobile-bottom-sheet');
  const isHorizontalPreset = this.selectedBundle?.bundleDesignPresetId === 'HORIZONTAL';
  const isStandardDesktopSidebar = this._isStandardDesktopSidebar(panel);
  const isClassicDesktopPreset = this.getFullPageDesignPreset() === 'CLASSIC' && !isMobileSheet;
  const activeStep = this.selectedBundle?.steps?.[this.currentStepIndex] || this.selectedBundle?.steps?.[0] || null;
  const isActiveAddonStep = activeStep?.isFreeGift === true;
  const summaryText = this.getBundleSummaryText();
  const isClassicDesktopSidebar =
    this.resolveFullPageLayout() === 'footer_side' &&
    this.getFullPageDesignPreset() === 'CLASSIC' &&
    !isMobileSheet;
  const summaryEmptyStateMode = this.getSummarySidebarEmptyStateMode();
  const useInlineSummarySlots = summaryEmptyStateMode === 'slots';

  panel.classList.toggle('full-page-side-panel--inline-slots', useInlineSummarySlots);
  panel.classList.toggle('full-page-side-panel--skeleton-list', !useInlineSummarySlots);
  panel.classList.toggle('full-page-side-panel--has-addon-summary', false);

  const header = document.createElement('div');
  header.className = 'side-panel-header';
  const headerCopy = document.createElement('div');
  headerCopy.className = 'side-panel-header-copy';
  const headerTitle = document.createElement('span');
  headerTitle.className = 'side-panel-title';
  headerTitle.textContent = summaryText.title;
  if (isStandardDesktopSidebar) {
    headerCopy.appendChild(headerTitle);
    header.appendChild(headerCopy);
  } else {
    header.appendChild(headerTitle);
  }

  if (isStandardDesktopSidebar || allSelectedProducts.length > 0) {
    const clearBtn = document.createElement('button');
    clearBtn.className = 'side-panel-clear-btn';
    clearBtn.innerHTML = `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor"><path d="M6 2h8a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1Zm-2 3h12l-1 13H5L4 5Zm4 2v9m4-9v9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg> Clear`;
    clearBtn.addEventListener('click', () => {
      this.showClearCartConfirmation();
    });
    header.appendChild(clearBtn);
  }
  panel.appendChild(header);

  const subtitle = document.createElement('p');
  subtitle.className = 'side-panel-subtitle';
  subtitle.textContent = summaryText.subTitle;
  if (isStandardDesktopSidebar) {
    headerCopy.appendChild(subtitle);
  } else {
    panel.appendChild(subtitle);
  }

  const tierCta = this.createSidebarTierCta(nextRule);
  if (!isStandardDesktopSidebar && !isClassicDesktopSidebar && tierCta) {
    panel.appendChild(tierCta);
  }

  const selectedBoxSelectionQuantity = this.getSelectedBoxSelectionQuantity();
  const boxSelection = this.renderBoxSelectionOptions(
    isClassicDesktopSidebar ? selectedBoxSelectionQuantity : totalQuantity
  );

  if ((isClassicDesktopSidebar || !isStandardDesktopSidebar) && boxSelection) {
    panel.appendChild(boxSelection);
  }

  const summaryContent = document.createElement('div');
  summaryContent.className = 'side-panel-summary-content';

  if (this.selectedBundle?.pricing?.enabled) {
    if (this.config.showDiscountMessaging) {
      const variables = TemplateManager.createDiscountVariables(
        this.selectedBundle, totalPrice, totalQuantity, combinedDiscountInfo, currencyInfo
      );
      let discountMessage = '';
      if (combinedDiscountInfo.hasDiscount) {
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
        discountMessage = this._formatSidebarDiscountMessage(discountMessage);
        const msgEl = document.createElement('div');
        msgEl.className = 'side-panel-discount-message';
        msgEl.innerHTML = discountMessage;
        summaryContent.appendChild(msgEl);
      }
    }

    if (this.config.showDiscountProgressBar) {
      const progressBar = this._renderDiscountProgress({
        placement: "sidebar",
        combinedDiscountInfo,
        totalPrice,
        totalQuantity,
        unitPrices,
      });
      if (progressBar) {
        progressBar.classList.add('fpb-dp-sidebar');
        summaryContent.appendChild(progressBar);
      }
    }
  }

  if (isStandardDesktopSidebar) {
    const addonChildCountBefore = summaryContent.children.length;
    if (activeStep?.isFreeGift !== true) {
      this._renderFreeGiftSection(summaryContent);
    }
    panel.classList.toggle(
      'full-page-side-panel--has-addon-summary',
      summaryContent.children.length > addonChildCountBefore
    );
  }

  const countLabel = document.createElement('div');
  countLabel.className = 'side-panel-item-count';
  countLabel.textContent = isClassicDesktopSidebar
    ? `${allSelectedProducts.length} item${allSelectedProducts.length !== 1 ? 's' : ''}`
    : isStandardDesktopSidebar
      ? `${allSelectedProducts.length} item(s)`
      : `${allSelectedProducts.length} item${allSelectedProducts.length !== 1 ? 's' : ''}`;
  summaryContent.appendChild(countLabel);

  if (isClassicDesktopSidebar) {
    const classicSlotCount = this.getClassicSidebarSlotCount(
      allSelectedProducts,
      activeStep
    );

    const classicSlots = this.renderClassicSidebarSlots(
      allSelectedProducts,
      classicSlotCount
    );

    summaryContent.appendChild(classicSlots);
  } else {
    const productsContainer = document.createElement('div');
    productsContainer.className = 'side-panel-products';
    if (isStandardDesktopSidebar) {
      productsContainer.classList.add('side-panel-products--standard');
    }
    if (isHorizontalPreset) {
      productsContainer.classList.add('side-panel-products--slots');
    }
    productsContainer.classList.toggle('side-panel-products--inline-slots', useInlineSummarySlots);
    productsContainer.classList.toggle('side-panel-products--skeleton-list', !useInlineSummarySlots);

    if (isStandardDesktopSidebar && useInlineSummarySlots) {
      this._renderStandardSidebarSlotTiles(productsContainer, allSelectedProducts);
    } else if (allSelectedProducts.length > 0) {
      allSelectedProducts.forEach(item => {
        if (isStandardDesktopSidebar) {
          const row = this.createStandardSidebarSelectedRow(item, currencyInfo);
          const removeBtn = row?.querySelector('[data-action="remove-selected-product"]');
          if (removeBtn) {
            const removalState = this.getSummaryProductRemovalState(item);
            if (!removalState.canRemove) {
              removeBtn.classList.add('bw-selected-row__remove--disabled');
              removeBtn.setAttribute('aria-disabled', 'true');
              removeBtn.title = removalState.blockedMessage;
            }
            removeBtn.addEventListener('click', () => {
              const summaryTitle = this.getSummaryProductDisplayTitle(item);
              this.removeSummarySelectedProduct(item, summaryTitle);
            });
          }
          if (row) productsContainer.appendChild(row);
          return;
        }

        const summaryTitle = this.getSummaryProductDisplayTitle(item);
        const variantInfo = this.getSummaryProductVariantDisplay(item);
        const row = document.createElement('div');
        row.className = 'side-panel-product-row';
        if (isHorizontalPreset) {
          row.classList.add('side-panel-product-slot');
        }

        const imgSrc = this._getSelectedProductImageSrc(item);

        const isFreeGiftItem = item.isFreeGift === true && item.addonDisplayFree === true;
        const qtySpan = `<span class="side-panel-product-qty" aria-label="Quantity ${item.quantity}">x${item.quantity}</span>`;
        const priceHtml = isFreeGiftItem
          ? `<span class="side-panel-product-price free-gift-price">${CurrencyManager.convertAndFormat(0, currencyInfo)}</span><span class="side-panel-product-original-price">${CurrencyManager.convertAndFormat(item.price * item.quantity, currencyInfo)} ${qtySpan}</span>`
          : `<span class="side-panel-product-price">${CurrencyManager.convertAndFormat(item.price * item.quantity, currencyInfo)} ${qtySpan}</span>`;

        if (isStandardDesktopSidebar) {
          row.innerHTML = `
            <div class="side-panel-product-img-wrap">
              ${imgSrc ? `<img src="${imgSrc}" alt="${this._escapeHTML(summaryTitle)}" class="side-panel-product-img">` : '<div class="side-panel-product-img-placeholder"></div>'}
              ${item.quantity > 1 ? `<span class="side-panel-qty-badge">${item.quantity}</span>` : ''}
            </div>
            <div class="side-panel-product-info">
              <span class="side-panel-product-title">${this._escapeHTML(summaryTitle)}</span>
              ${variantInfo ? `<span class="side-panel-product-variant">${this._escapeHTML(variantInfo)}</span>` : ''}
              ${priceHtml}
            </div>
            <div class="side-panel-product-action"></div>
          `;
        } else {
          row.innerHTML = `
            <div class="side-panel-product-img-wrap">
              ${imgSrc ? `<img src="${imgSrc}" alt="${this._escapeHTML(summaryTitle)}" class="side-panel-product-img">` : '<div class="side-panel-product-img-placeholder"></div>'}
              ${item.quantity > 1 ? `<span class="side-panel-qty-badge">${item.quantity}</span>` : ''}
            </div>
            <div class="side-panel-product-info">
              <span class="side-panel-product-title">${this._escapeHTML(summaryTitle)}</span>
              ${variantInfo ? `<span class="side-panel-product-variant">${this._escapeHTML(variantInfo)}</span>` : ''}
            </div>
            ${priceHtml}
          `;
        }

        if (!item.isDefault) {
          const removeBtn = document.createElement('button');
          removeBtn.className = 'side-panel-product-remove';
          removeBtn.type = 'button';
          removeBtn.setAttribute('aria-label', `Delete ${summaryTitle || 'product'}`);
          const removalState = this.getSummaryProductRemovalState(item);
          if (!removalState.canRemove) {
            removeBtn.classList.add('side-panel-product-remove--disabled');
            removeBtn.setAttribute('aria-disabled', 'true');
            removeBtn.title = removalState.blockedMessage;
          }
          removeBtn.innerHTML = `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" aria-hidden="true" focusable="false"><path d="M6 2h8a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1Zm-2 3h12l-1 13H5L4 5Zm4 2v9m4-9v9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>`;
          removeBtn.addEventListener('click', () => {
            this.removeSummarySelectedProduct(item, summaryTitle);
          });
          if (isStandardDesktopSidebar) {
            row.querySelector('.side-panel-product-action')?.appendChild(removeBtn);
          } else {
            row.appendChild(removeBtn);
          }
        }

        productsContainer.appendChild(row);
      });
    } else if (isStandardDesktopSidebar) {
      this._renderStandardSidebarEmptySlots(productsContainer, {
        mode: summaryEmptyStateMode,
      });
    }
    if (isHorizontalPreset) {
      const requiredSlots = Math.max(
        totalQuantity + 1,
        activeStep?.maxQuantity || activeStep?.minQuantity || 2,
        2
      );
      if (this._shouldRenderProductSlots()) {
        const emptySlots = Math.max(0, requiredSlots - allSelectedProducts.length);
        const emptyStateIconUrl = this._escapeHTML(this.selectedBundle?.productSlotIconUrl || '');
        for (let slotIndex = 0; slotIndex < emptySlots; slotIndex += 1) {
          const emptySlot = document.createElement('div');
          emptySlot.className = 'side-panel-product-slot side-panel-product-slot--empty';
          if (emptyStateIconUrl) {
            const img = document.createElement('img');
            img.src = emptyStateIconUrl;
            img.alt = '';
            img.width = 40;
            img.height = 40;
            img.className = 'side-panel-product-slot-icon';
            emptySlot.appendChild(img);
          } else {
            const emptyText = document.createElement('span');
            emptyText.className = 'side-panel-product-slot-placeholder';
            emptyText.textContent = '+';
            emptySlot.appendChild(emptyText);
          }
          productsContainer.appendChild(emptySlot);
        }
      }
    }
    summaryContent.appendChild(productsContainer);
  }

  if (!isStandardDesktopSidebar && !isMobileSheet && allSelectedProducts.length === 0 && !isHorizontalPreset) {
    const skeletonContainer = document.createElement('div');
    skeletonContainer.className = 'side-panel-skeleton-slots';
    this._renderSidebarProductSkeletons(skeletonContainer);
    summaryContent.appendChild(skeletonContainer);
  }

  panel.appendChild(summaryContent);

  if (!isClassicDesktopSidebar && !isStandardDesktopSidebar && activeStep?.isFreeGift !== true) this._renderFreeGiftSection(panel);

  const totalSection = document.createElement('div');
  totalSection.className = 'side-panel-total';
  totalSection.innerHTML = `
    <span class="side-panel-total-label">Total</span>
    <div class="side-panel-total-prices">
      ${shouldShowOriginalTotal ? `<span class="side-panel-total-original">${CurrencyManager.convertAndFormat(totalPrice, currencyInfo)}</span>` : ''}
      <span class="side-panel-total-final">${CurrencyManager.convertAndFormat(displayFinalPrice, currencyInfo)}</span>
    </div>
  `;
  if (isMobileSheet) {
    panel.appendChild(totalSection);
    return;
  }

  const actionDivider = document.createElement('div');
  actionDivider.className = 'side-panel-action-divider';
  const actionSection = document.createElement('div');
  actionSection.className = 'side-panel-action-container';
  actionSection.appendChild(totalSection);

  const navSection = document.createElement('div');
  navSection.className = 'side-panel-nav';

  const isLastStep = this.currentStepIndex === this.selectedBundle.steps.length - 1;
  const canProceed = this.canProceedToNextStep();
  const conditionless = this.bundleHasNoConditions();
  const canReturnToPreviousStep = !conditionless && this.currentStepIndex > 0;
  const hasSelection = conditionless && this.getAllSelectedProductsData().length > 0;
  const sidebarTierCtaContent = (conditionless || isLastStep) && !isActiveAddonStep
    ? this.getSidebarTierCtaContent(nextRule)
    : null;

  if (isStandardDesktopSidebar && canReturnToPreviousStep) {
    navSection.classList.add('side-panel-nav--with-back');

    const backBtn = document.createElement('button');
    backBtn.className = 'side-panel-btn side-panel-btn-back';
    backBtn.type = 'button';
    backBtn.setAttribute('aria-label', this._resolveText('backButton', 'Back'));
    backBtn.innerHTML = `
      <svg viewBox="0 0 19 20" aria-hidden="true" focusable="false">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M15.5522 10.1839C15.5522 10.5719 15.2377 10.8865 14.8497 10.8865L5.77346 10.8865L8.32121 13.434C8.59557 13.7083 8.5956 14.1531 8.32126 14.4275C8.04692 14.7018 7.6021 14.7019 7.32774 14.4275L3.58056 10.6807C3.4488 10.549 3.37477 10.3703 3.37477 10.1839C3.37477 9.99761 3.4488 9.81891 3.58056 9.68716L7.32774 5.94036C7.6021 5.66602 8.04692 5.66604 8.32126 5.94041C8.5956 6.21478 8.59557 6.65959 8.32121 6.93393L5.77346 9.48142L14.8497 9.48142C15.2377 9.48142 15.5522 9.79595 15.5522 10.1839Z" fill="currentColor"></path>
      </svg>
    `;
    backBtn.addEventListener('click', async () => {
      if (this._isWidgetActionBusy || this.currentStepIndex <= 0) return;

      await this._withWidgetActionBusy(async () => {
        const previousStepIndex = this.currentStepIndex;
        this.activeCollectionId = null;
        this.searchQuery = '';
        this.currentStepIndex--;
        this._emitStorefrontEvent?.('step-changed', {
          previousStepIndex,
          currentStepIndex: this.currentStepIndex,
          direction: 'back',
        });
        await this.renderFullPageLayoutWithSidebar();
      }, { actionButton: backBtn });
    });
    navSection.appendChild(backBtn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = 'side-panel-btn side-panel-btn-next';
  const nextStepLabel = this.getFullPageDesignPreset() === 'STANDARD' || this.getFullPageDesignPreset() === 'CLASSIC'
    ? this._resolveText('nextButton', 'Next')
    : 'Next Step';
    nextBtn.textContent = (conditionless || isLastStep)
      ? this._resolveText('addToCartButton', 'Add to Cart')
      : nextStepLabel;
  if (sidebarTierCtaContent && !isClassicDesktopPreset) {
    const labelText = sidebarTierCtaContent.label || '';
    const subtextText = sidebarTierCtaContent.subtext || '';
    const ctaTextParts = [labelText, subtextText].filter((item) => item !== '');
    nextBtn.textContent = ctaTextParts.join(' ');
    nextBtn.classList.add('side-panel-btn-has-tier-cta');
    if (ctaTextParts.length) {
      nextBtn.title = ctaTextParts.join(' ');
    }
  }
  if (!isStandardDesktopSidebar && (conditionless ? !hasSelection : (isLastStep ? !this.areBundleConditionsMet() : !canProceed))) {
    nextBtn.disabled = true;
  }
  nextBtn.addEventListener('click', async () => {
    if (this._isWidgetActionBusy) return;

    if (conditionless || isLastStep) {
      if (isClassicDesktopPreset && !conditionless && !this.areBundleConditionsMet()) {
        ToastManager.show(this.getStepConditionValidationMessage?.() || 'Please meet the quantity conditions for the current step before proceeding.');
        return;
      }
      if (!this.canCheckoutWithBoxSelection()) {
        this.showBoxSelectionValidationMessage();
        return;
      }
      await this.addBundleToCart(nextBtn);
    } else if (!this.canNavigateToStep(this.currentStepIndex + 1)) {
      const giftName = this.freeGiftStep?.addonLabel || this.freeGiftStep?.freeGiftName;
      ToastManager.show(giftName ? `Complete all steps to unlock ${giftName}!` : 'Complete all steps first.');
    } else if (this.canProceedToNextStep()) {
      await this._withWidgetActionBusy(async () => {
        this.activeCollectionId = null;
        this.searchQuery = '';
        this.currentStepIndex++;
        await this.renderFullPageLayoutWithSidebar();
      }, { actionButton: nextBtn });
    } else {
      ToastManager.show(this.getStepConditionValidationMessage?.() || 'Please meet the quantity conditions for the current step before proceeding.');
    }
  });

  navSection.appendChild(nextBtn);
  actionSection.appendChild(navSection);
  panel.appendChild(actionDivider);
  panel.appendChild(actionSection);
},

_renderStandardSidebarSlotTiles(container, allSelectedProducts = []) {
  const selectedItems = Array.isArray(allSelectedProducts) ? allSelectedProducts : [];
  const slotCount = Math.max(
    this.getSummarySidebarMaxItemCount(selectedItems.length),
    selectedItems.length + 1,
    2
  );
  const emptyStateIconUrl = this._escapeHTML(this.selectedBundle?.productSlotIconUrl || '');
  const slots = document.createElement('div');
  slots.className = 'side-panel-inline-slots';

  for (let index = 0; index < slotCount; index += 1) {
    const item = selectedItems[index];
    const slot = document.createElement('div');
    slot.className = item
      ? 'side-panel-inline-slot side-panel-inline-slot--filled'
      : 'side-panel-inline-slot side-panel-inline-slot--empty';

    if (item) {
      const summaryTitle = this.getSummaryProductDisplayTitle(item);
      const imgSrc = this._getSelectedProductImageSrc(item);
      slot.innerHTML = imgSrc
        ? `<img src="${imgSrc}" alt="${this._escapeHTML(summaryTitle)}" class="side-panel-inline-slot-image">`
        : '<div class="side-panel-inline-slot-image-placeholder"></div>';
    } else {
      slot.innerHTML = emptyStateIconUrl
        ? `<img class="side-panel-inline-slot-icon" src="${emptyStateIconUrl}" alt="" loading="lazy">`
        : '<span class="side-panel-inline-slot-placeholder">+</span>';
    }

    slots.appendChild(slot);
  }

  container.appendChild(slots);
},

createSidebarTierCta(nextRule) {
  const content = this.getSidebarTierCtaContent(nextRule);
  if (!content) return null;

  const { label, subtext } = content;

  const cta = document.createElement('div');
  cta.className = 'fpb-sidebar-tier-cta';

  if (label) {
    const title = document.createElement('div');
    title.className = 'fpb-sidebar-tier-cta-title';
    title.textContent = label;
    cta.appendChild(title);
  }

  if (subtext) {
    const detail = document.createElement('div');
    detail.className = 'fpb-sidebar-tier-cta-subtext';
    detail.textContent = subtext;
    cta.appendChild(detail);
  }

  return cta;
},

getSummaryProductRemovalState(item = {}) {
  const itemStepIndex = Number(item?.stepIndex);
  const currentStepIndex = Number(this.currentStepIndex || 0);
  const steps = Array.isArray(this.selectedBundle?.steps) ? this.selectedBundle.steps : [];
  const targetStep = Number.isFinite(itemStepIndex) ? steps[itemStepIndex] : null;
  const rawStepName = targetStep?.name
    || targetStep?.addonLabel
    || targetStep?.freeGiftName
    || (Number.isFinite(itemStepIndex) ? `Step ${itemStepIndex + 1}` : 'This Step');
  const targetStepName = String(rawStepName || '').trim() || 'This Step';
  const canRemove = Number.isFinite(itemStepIndex) && itemStepIndex === currentStepIndex;

  return {
    canRemove,
    targetStepName,
    blockedMessage: canRemove ? '' : `Remove This Product From ${targetStepName}`,
  };
},

removeSummarySelectedProduct(item = {}, summaryTitle = '') {
  const removalState = this.getSummaryProductRemovalState(item);
  if (!removalState.canRemove) {
    ToastManager.show(removalState.blockedMessage);
    return false;
  }

  const stepIndex = item.stepIndex;
  const productId = item.variantId || item.productId || item.id;
  const removedItem = { stepIndex, variantId: productId, quantity: item.quantity, title: item.title };
  this.updateProductSelection(stepIndex, productId, 0);
  const displayTitle = summaryTitle || item.title || 'Product';
  const truncated = displayTitle.length > 25 ? displayTitle.substring(0, 25) + '...' : displayTitle;
  ToastManager.showWithUndo(
    `Removed "${truncated}"`,
    () => { this.updateProductSelection(removedItem.stepIndex, removedItem.variantId, removedItem.quantity); },
    5000
  );
  return true;
},
};

const fullPageBoxSelectionSidebarMethods = {
getSidebarTierCtaContent(nextRule) {
  const pricing = this.selectedBundle?.pricing;
  if (!pricing?.enabled) return null;

  const displayOptions = pricing.messages?.displayOptions || {};
  const bundleQuantityOptions = displayOptions.bundleQuantityOptions || {};
  if (bundleQuantityOptions.enabled !== true) return null;
  const optionsByRuleId = bundleQuantityOptions.optionsByRuleId || {};
  const tierTextByRuleId = pricing.messages?.tierTextByRuleId || {};
  const rules = Array.isArray(pricing.rules) ? pricing.rules : [];
  const ruleId = bundleQuantityOptions.defaultRuleId || nextRule?.id || rules[0]?.id;
  const rule = ruleId ? rules.find(item => String(item?.id || '') === String(ruleId)) : null;
  const option = ruleId ? (optionsByRuleId[ruleId] || tierTextByRuleId[ruleId]) : null;
  const label = typeof option?.label === 'string' && option.label.trim()
    ? option.label.trim()
    : (typeof option?.tierText === 'string' ? option.tierText.trim() : '');
  let subtext = typeof option?.subtext === 'string' && option.subtext.trim()
    ? option.subtext.trim()
    : (typeof option?.tierSubtext === 'string' ? option.tierSubtext.trim() : '');
  if (pricing.method === BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_BUNDLE_PRICE && rule) {
    const discountValue = Number(rule.discountValue ?? rule.discount?.value ?? 0) || 0;
    if (discountValue > 0) {
      subtext = `Bundle for ${CurrencyManager.convertAndFormat(discountValue, CurrencyManager.getCurrencyInfo())}`;
    }
  }

  if (!label && !subtext) return null;
  return { label, subtext };
},

getBoxSelectionRules() {
  const boxSelection = this.selectedBundle?.boxSelection;
  if (!boxSelection || boxSelection.isEnabled !== true || !Array.isArray(boxSelection.rules)) {
    return [];
  }

  return boxSelection.rules
    .map(rule => ({
      ruleId: String(rule.ruleId || ''),
      boxQuantity: Number(rule.boxQuantity || 0),
      boxLabel: String(rule.boxLabel || ''),
      boxSubtext: String(rule.boxSubtext || ''),
      isDefaultSelected: rule.isDefaultSelected === true,
    }))
    .filter(rule => rule.ruleId && rule.boxQuantity > 0)
    .sort((a, b) => a.boxQuantity - b.boxQuantity);
},

getActiveBoxSelectionRule(rules, totalQuantity) {
  if (!Array.isArray(rules) || rules.length === 0) return null;

  const selected = this.selectedBoxSelectionRuleId
    ? rules.find(rule => rule.ruleId === this.selectedBoxSelectionRuleId)
    : null;
  if (selected) return selected;

  const reachedRule = rules
    .filter(rule => Number(totalQuantity || 0) >= rule.boxQuantity)
    .sort((a, b) => b.boxQuantity - a.boxQuantity)[0];
  if (reachedRule) return reachedRule;

  return rules.find(rule => rule.isDefaultSelected) || rules[0];
},

getSelectedBoxSelectionQuantity() {
  return this.getAllSelectedProductsData().reduce((total, item) => {
    if (item.isDefault === true || item.isFreeGift === true) return total;
    return total + (Number(item.quantity || 0) || 0);
  }, 0);
},

getBoxSelectionValidationState(totalQuantity = this.getSelectedBoxSelectionQuantity()) {
  const boxSelection = this.selectedBundle?.boxSelection;
  const rules = this.getBoxSelectionRules();
  const activeRule = this.getActiveBoxSelectionRule(rules, totalQuantity);
  const isEnabled = boxSelection?.isEnabled === true
    && boxSelection?.validateBoxSelectionQuantity === true
    && !!activeRule;

  if (!isEnabled) {
    return {
      isEnabled: false,
      isValid: true,
      activeRule,
      totalQuantity: Number(totalQuantity || 0),
    };
  }

  return {
    isEnabled: true,
    isValid: Number(totalQuantity || 0) === Number(activeRule.boxQuantity || 0),
    activeRule,
    totalQuantity: Number(totalQuantity || 0),
  };
},

canCheckoutWithBoxSelection() {
  return this.getBoxSelectionValidationState().isValid;
},

showBoxSelectionValidationMessage() {
  const state = this.getBoxSelectionValidationState();
  if (!state.isEnabled || state.isValid) return;

  ToastManager.show(
    'Select exactly '
    + state.activeRule.boxQuantity
    + ' item(s) for '
    + (state.activeRule.boxLabel || 'this box')
    + ' before adding to cart.'
  );
},

renderBoxSelectionOptions(totalQuantity = 0) {
  const rules = this.getBoxSelectionRules();
  if (rules.length === 0) return null;

  const activeRule = this.getActiveBoxSelectionRule(rules, totalQuantity);
  const wrapper = document.createElement('div');
  wrapper.className = 'fpb-box-selection-wrapper';
  wrapper.dataset.totalRules = String(rules.length);
  if (activeRule?.ruleId) {
    wrapper.dataset.activeRuleId = activeRule.ruleId;
  }

  rules.forEach(rule => {
    const option = document.createElement('button');
    const isActive = activeRule?.ruleId === rule.ruleId;
    option.type = 'button';
    option.className = 'fpb-box-selection-option' + (isActive ? ' fpb-box-selection-option-active' : '');
    option.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    option.dataset.ruleId = rule.ruleId;
    option.dataset.boxQuantity = String(rule.boxQuantity);
    option.dataset.isActive = isActive ? 'true' : 'false';

    const title = document.createElement('span');
    title.className = 'fpb-box-selection-title';
    title.textContent = rule.boxLabel;
    option.appendChild(title);

    if (rule.boxSubtext) {
      const subtext = document.createElement('span');
      subtext.className = 'fpb-box-selection-subtext';
      subtext.textContent = rule.boxSubtext;
      option.appendChild(subtext);
    }

    option.addEventListener('click', () => {
      this.selectedBoxSelectionRuleId = rule.ruleId;
      this.reRenderFullPage();
    });

    wrapper.appendChild(option);
  });

  return wrapper;
},

getClassicSidebarSlotCount(allSelectedProducts = [], activeStep = null) {
  const selectedBoxSelectionQuantity = this.getSelectedBoxSelectionQuantity();
  const boxRules = this.getBoxSelectionRules();
  const activeBoxRule = this.getActiveBoxSelectionRule(
    boxRules,
    selectedBoxSelectionQuantity
  );

  const activeBoxQuantity = Number(activeBoxRule?.boxQuantity || 0);
  const stepQuantity = Number(activeStep?.maxQuantity || activeStep?.minQuantity || 0);
  const selectedCount = Array.isArray(allSelectedProducts) ? allSelectedProducts.length : 0;

  if (activeBoxQuantity > 0) {
    return Math.max(activeBoxQuantity, selectedCount);
  }

  if (typeof this.getSummarySidebarMaxItemCount === 'function') {
    return this.getSummarySidebarMaxItemCount(selectedCount);
  }

  return Math.max(stepQuantity, selectedCount + 1, 2);
},

renderClassicSidebarSlots(allSelectedProducts = [], slotCount = 0) {
  const safeSlotCount = Math.max(0, Number(slotCount || 0));
  const slotData = [];

  for (let slotIndex = 0; slotIndex < safeSlotCount; slotIndex += 1) {
    const item = allSelectedProducts[slotIndex];

    if (item) {
      const summaryTitle = this.getSummaryProductDisplayTitle(item);
      const productId = item.variantId || item.productId || item.id;
      slotData.push({
        id: `classic-slot-${slotIndex}`,
        label: summaryTitle,
        product: {
          id: productId,
          title: summaryTitle,
          variantTitle: this.getSummaryProductVariantDisplay(item),
          imageUrl: this._getSelectedProductImageSrc(item) || BUNDLE_WIDGET.PLACEHOLDER_IMAGE,
          quantity: item.quantity,
          isDefault: item.isDefault === true,
          stepIndex: item.stepIndex,
        },
      });
    } else {
      slotData.push({
        id: `classic-slot-${slotIndex}`,
        label: 'Empty bundle slot',
      });
    }
  }

  const wrapper = document.createElement('div');
  wrapper.innerHTML = renderSelectedProductSlots(slotData, {
    className: 'classic-sidebar-slots bw-selected-slots--classic-sidebar',
    emptySlotIconUrl: this._shouldRenderProductSlots()
      ? this.selectedBundle?.productSlotIconUrl || ''
      : '',
  }).trim();
  const slots = wrapper.firstElementChild;

  slots?.querySelectorAll('[data-action="remove-selected-product"]').forEach(removeBtn => {
    removeBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      const productId = removeBtn.dataset.variantId;
      const item = allSelectedProducts.find(selectedItem =>
        String(selectedItem.variantId || selectedItem.productId || selectedItem.id) === String(productId)
      );
      if (!item || !productId) return;

      const summaryTitle = this.getSummaryProductDisplayTitle(item);
      const removedItem = {
        stepIndex: item.stepIndex,
        variantId: productId,
        quantity: item.quantity,
        title: summaryTitle,
      };

      this.updateProductSelection(item.stepIndex, productId, 0);

      const truncated = summaryTitle && summaryTitle.length > 25
        ? summaryTitle.substring(0, 25) + '...'
        : (summaryTitle || 'Product');

      ToastManager.showWithUndo(
        `Removed "${truncated}"`,
        () => {
          this.updateProductSelection(
            removedItem.stepIndex,
            removedItem.variantId,
            removedItem.quantity
          );
        },
        5000
      );
    });
  });

  return slots;
},

_escapeHTML(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
},

_getSelectedProductImageSrc(item = {}) {
  const getImageSrc = (image) => {
    if (!image) return '';
    if (typeof image === 'string') return image;
    return image.src
      || image.url
      || image.originalSrc
      || image.transformedSrc
      || '';
  };

  return getImageSrc(item.variantImage)
    || getImageSrc(item.variantImage?.src)
    || getImageSrc(item.variant?.image)
    || (typeof item.image === 'string' ? item.image : '')
    || item.image?.src
    || item.image?.url
    || item.image?.originalSrc
    || getImageSrc(item.imageUrl)
    || item.featuredImage?.url
    || item.featuredImage?.src
    || getImageSrc(item.featuredImage)
    || getImageSrc(item.images?.[0])
    || getImageSrc(item.productImageUrl);
},

_formatSidebarDiscountMessage(discountMessage) {
  const message = typeof discountMessage === 'string' ? discountMessage.trim() : '';
  return message.replace(/!+\s*$/, '');
},

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
},

_getStepSelectedQuantity(stepIndex) {
  const stepSelections = this.selectedProducts?.[stepIndex] || {};
  return Object.values(stepSelections).reduce((total, qty) => total + (Number(qty) || 0), 0);
},

_getStepRequiredQuantity(step) {
  if (!step) return 1;

  const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const primaryValue = toNumber(step.conditionValue);
  const secondaryValue = toNumber(step.conditionValue2);
  const minQuantity = toNumber(step.minQuantity);
  const maxQuantity = toNumber(step.maxQuantity);
  const OPERATORS = ConditionValidator.OPERATORS;

  const targetForOperator = (operator, value) => {
    if (value == null) return null;
    switch (operator) {
      case OPERATORS.GREATER_THAN:
        return value + 1;
      case OPERATORS.LESS_THAN:
        return Math.max(1, value - 1);
      case OPERATORS.LESS_THAN_OR_EQUAL_TO:
      case OPERATORS.EQUAL_TO:
      case OPERATORS.GREATER_THAN_OR_EQUAL_TO:
        return value;
      default:
        return null;
    }
  };

  const targets = [
    targetForOperator(step.conditionOperator, primaryValue),
    targetForOperator(step.conditionOperator2, secondaryValue),
    minQuantity,
    maxQuantity,
  ].filter((value) => value != null && value > 0);

  return targets.length > 0 ? Math.max(...targets) : 1;
},

_getStepProgressRatio(stepIndex) {
  const step = this.selectedBundle?.steps?.[stepIndex];
  if (!step) return 0;
  if (this.isStepCompleted(stepIndex)) return 1;

  const requiredQuantity = this._getStepRequiredQuantity(step);
  const selectedQuantity = this._getStepSelectedQuantity(stepIndex);
  return Math.max(0, Math.min(1, selectedQuantity / requiredQuantity));
},

_getDefaultTimelineIconDataUri(step) {
  const svg = this._getDefaultTimelineIcon(step)
    .replace('class="timeline-step-icon--svg"', 'xmlns="http://www.w3.org/2000/svg"')
    .replace(' xmlns="http://www.w3.org/2000/svg"', '');
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
},

_usesReferenceStepBarTimeline() {
  return FullPagePreset.shouldUseReferenceStepBarTimeline({
    layout: this.resolveFullPageLayout(),
    presetId: this.getFullPageDesignPreset(),
  });
},

buildStepTimelineEntries() {
  const steps = Array.isArray(this.selectedBundle?.steps) ? this.selectedBundle.steps : [];
  const entries = [];

  steps.forEach((step, index) => {
    const stepLabel = (step.isFreeGift && step.addonLabel) ? step.addonLabel : step.name;
    entries.push({
      type: 'step',
      step,
      stepIndex: index,
      label: stepLabel,
    });

    if (this.shouldRenderMultipleCategoryTimelineEntry(step)) {
      entries.push({
        type: 'multiple_categories',
        step,
        stepIndex: index,
        label: 'Multiple Categories',
      });
    }
  });

  return entries;
},

getStandardTimelinePageSize() {
  return window.innerWidth < 768 ? 4 : 5;
},
};

const fullPageTimelineBannerMethods = {
getStandardTimelineVisibleEntries(timelineEntries, activeEntryIndex) {
  const entries = Array.isArray(timelineEntries) ? timelineEntries : [];
  const timelinePageSize = this.getStandardTimelinePageSize();

  if (entries.length <= timelinePageSize) {
    this.standardTimelineWindowStart = 0;
    this.standardTimelineLastActiveEntryIndex = activeEntryIndex;
    return {
      visibleEntries: entries,
      windowStart: 0,
      pageSize: timelinePageSize,
      isPaged: false,
    };
  }

  const activeChanged = this.standardTimelineLastActiveEntryIndex !== activeEntryIndex;
  let windowStart = Number.isFinite(this.standardTimelineWindowStart)
    ? this.standardTimelineWindowStart
    : 0;

  if (activeChanged && (activeEntryIndex < windowStart || activeEntryIndex >= windowStart + timelinePageSize)) {
    windowStart = activeEntryIndex;
  }

  if (windowStart + timelinePageSize > entries.length) {
    windowStart = entries.length - timelinePageSize;
  }

  windowStart = Math.max(0, windowStart);
  this.standardTimelineWindowStart = windowStart;
  this.standardTimelineLastActiveEntryIndex = activeEntryIndex;

  return {
    visibleEntries: entries.slice(windowStart, windowStart + timelinePageSize),
    windowStart,
    pageSize: timelinePageSize,
    isPaged: true,
  };
},

ensureTimelinePagingStyles() {
  return true;
},

shouldRenderMultipleCategoryTimelineEntry(step) {
  if (!step || step.isFreeGift === true) return false;
  if (this.getFullPageDesignPreset?.() === 'STANDARD') return false;
  return this.getStepCategoryTabEntries(step).length > 1;
},

createStepTimeline() {
  if (this._usesReferenceStepBarTimeline()) {
    return this.createStandardStepTimeline();
  }

  const timeline = document.createElement('div');
  timeline.className = 'step-timeline';

  if (!this.selectedBundle || !this.selectedBundle.steps) {
    return timeline;
  }

  const timelineEntries = this.buildStepTimelineEntries();
  const totalEntryCount = Math.max(timelineEntries.length, 1);
  const hasMultipleCategoryEntryForStep = (entry) => (
    this.shouldRenderMultipleCategoryTimelineEntry(entry?.step)
  );
  const activeEntryIndex = Math.max(0, timelineEntries.findIndex((entry) => (
    entry.type === 'multiple_categories'
      ? Number(entry.stepIndex) === Number(this.currentStepIndex)
      : entry.type === 'step'
        ? Number(entry.stepIndex) === Number(this.currentStepIndex)
          && !hasMultipleCategoryEntryForStep(entry)
        : false
  )));
  const {
    visibleEntries,
    windowStart,
    pageSize,
    isPaged,
  } = this.getStandardTimelineVisibleEntries(timelineEntries, activeEntryIndex);
  const visibleEntryCount = Math.max(visibleEntries.length, 1);

  if (isPaged) {
    this.ensureTimelinePagingStyles();
  }
  timeline.classList.toggle('step-timeline--paged', isPaged);
  timeline.dataset.windowStart = String(windowStart);
  timeline.dataset.pageSize = String(pageSize);
  timeline.dataset.totalEntries = String(totalEntryCount);

  const createTimelineArrow = (direction) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = direction === 'prev'
      ? 'timeline-navigation-arrow timeline-navigation-arrow--prev'
      : 'timeline-navigation-arrow timeline-navigation-arrow--next';
    button.setAttribute('aria-label', direction === 'prev' ? 'Previous timeline items' : 'Next timeline items');
    button.textContent = direction === 'prev' ? '‹' : '›';
    button.addEventListener('click', () => {
      if (direction === 'prev') {
        this.standardTimelineWindowStart = Math.max(0, windowStart - pageSize);
      } else {
        this.standardTimelineWindowStart = Math.min(totalEntryCount - pageSize, windowStart + pageSize);
      }
      this.reRenderFullPage();
    });
    return button;
  };

  if (isPaged && windowStart > 0) {
    timeline.appendChild(createTimelineArrow('prev'));
  }

  if (isPaged && windowStart + visibleEntryCount < totalEntryCount) {
    timeline.appendChild(createTimelineArrow('next'));
  }

  visibleEntries.forEach((entry, displayIndex) => {
    const step = entry.step;
    const index = entry.stepIndex;
    const hasMultipleCategoryEntry = this.shouldRenderMultipleCategoryTimelineEntry(step);
    const isCompleted = shouldShowTimelineCompletedState({
      entry,
      currentStepIndex: this.currentStepIndex,
      isStepCompleted: this.isStepCompleted(index),
      hasMultipleCategoryEntry,
    });
    const timelineState = getTimelineEntryState({
      entry,
      currentStepIndex: this.currentStepIndex,
      isCompleted,
      isAccessible: this.isStepAccessible(index),
      hasMultipleCategoryEntry,
    });

    const tabLabel = entry.label;
    const escapedName = this._escapeHTML(tabLabel) || `Step ${index + 1}`;

    const uploadedIconUrl = (step.isFreeGift && step.addonIconUrl) ? step.addonIconUrl : step.stepImage;
    const iconContent = uploadedIconUrl
      ? `<img class="timeline-step-icon" src="${uploadedIconUrl}" alt="${escapedName}">`
      : this._getDefaultTimelineIcon(step);

    const stepWrapper = document.createElement('div');
    stepWrapper.innerHTML = renderStepTimelineEntry({
      stepIndex: index,
      timelineType: entry.type,
      label: tabLabel || `Step ${index + 1}`,
      iconHtml: iconContent,
      classes: timelineState.classes,
    }).trim();
    const stepEl = stepWrapper.firstElementChild;

    if (entry.type === 'step' && timelineState.isAccessible && !timelineState.isDefaultStep) {
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

    if (displayIndex < visibleEntries.length - 1) {
      const connectorEl = document.createElement('div');
      connectorEl.className = 'timeline-connector';
      const connectorFill = document.createElement('div');
      connectorFill.className = 'timeline-connector-fill';
      connectorFill.style.display = 'block';
      connectorFill.style.width = `${Math.round(this._getStepProgressRatio(index) * 100)}%`;
      connectorEl.appendChild(connectorFill);
      timeline.appendChild(connectorEl);
    }
  });

  return timeline;
},

createStandardStepTimeline() {
  const timeline = document.createElement('div');
  timeline.className = 'step-timeline step-timeline--standard';

  if (!this.selectedBundle || !this.selectedBundle.steps) {
    return timeline;
  }

  const timelineEntries = this.buildStepTimelineEntries();
  const totalEntryCount = Math.max(timelineEntries.length, 1);
  const activeEntryIndex = Math.max(0, timelineEntries.findIndex((entry) => (
    entry.type === 'multiple_categories'
      ? Number(entry.stepIndex) === Number(this.currentStepIndex)
      : entry.type === 'step'
        ? Number(entry.stepIndex) === Number(this.currentStepIndex)
          && !this.shouldRenderMultipleCategoryTimelineEntry(entry.step)
        : false
  )));
  const {
    visibleEntries,
    windowStart,
    pageSize,
    isPaged,
  } = this.getStandardTimelineVisibleEntries(timelineEntries, activeEntryIndex);
  const entryCount = Math.max(visibleEntries.length, 1);
  const activeVisibleEntryIndex = Math.max(0, visibleEntries.findIndex((entry) => {
    if (Number(entry.stepIndex) !== Number(this.currentStepIndex)) {
      return false;
    }
    if (entry.type === 'multiple_categories') return true;
    if (entry.type === 'step') return !this.shouldRenderMultipleCategoryTimelineEntry(entry.step);
    return false;
  }));
  const progressFill = entryCount > 1
    ? Math.max(0, Math.min(100, (activeVisibleEntryIndex / (entryCount - 1)) * 100))
    : 0;
  const progressLeft = 100 / (entryCount * 2);
  const progressWidth = entryCount > 1 ? ((entryCount - 1) / entryCount) * 100 : 0;
  const timelineWidth = Math.min(100, entryCount * 20);

  timeline.style.setProperty('--standard-timeline-count', String(entryCount));
  timeline.style.setProperty('--standard-timeline-visible-count', String(entryCount));
  timeline.style.setProperty('--standard-timeline-total-count', String(totalEntryCount));
  timeline.style.setProperty('--standard-timeline-width', `${timelineWidth.toFixed(4)}%`);
  timeline.style.setProperty('--standard-timeline-progress-left', `${progressLeft.toFixed(4)}%`);
  timeline.style.setProperty('--standard-timeline-progress-width', `${progressWidth.toFixed(4)}%`);
  timeline.style.setProperty('--standard-timeline-progress-fill', `${progressFill.toFixed(4)}%`);
  timeline.classList.toggle('standard-timeline--paged', isPaged);

  const itemsContainer = document.createElement('div');
  itemsContainer.className = 'standard-navigation-items-container';
  itemsContainer.classList.toggle('standard-navigation-items-container--paged', isPaged);
  itemsContainer.dataset.windowStart = String(windowStart);
  itemsContainer.dataset.pageSize = String(pageSize);
  itemsContainer.dataset.totalEntries = String(totalEntryCount);

  const createTimelineArrow = (direction) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = direction === 'prev'
      ? 'standard-navigation-arrow standard-navigation-arrow--prev'
      : 'standard-navigation-arrow standard-navigation-arrow--next';
    button.setAttribute('aria-label', direction === 'prev' ? 'Previous timeline items' : 'Next timeline items');
    button.textContent = direction === 'prev' ? '‹' : '›';
    button.addEventListener('click', () => {
      if (direction === 'prev') {
        this.standardTimelineWindowStart = Math.max(0, windowStart - pageSize);
      } else {
        this.standardTimelineWindowStart = Math.min(totalEntryCount - pageSize, windowStart + pageSize);
      }
      this.reRenderFullPage();
    });
    return button;
  };

  if (isPaged && windowStart > 0) {
    itemsContainer.appendChild(createTimelineArrow('prev'));
  }

  if (isPaged && windowStart + entryCount < totalEntryCount) {
    itemsContainer.appendChild(createTimelineArrow('next'));
  }

  visibleEntries.forEach((entry) => {
    const step = entry.step;
    const index = entry.stepIndex;
    const hasMultipleCategoryEntry = this.shouldRenderMultipleCategoryTimelineEntry(step);
    const isCompleted = shouldShowTimelineCompletedState({
      entry,
      currentStepIndex: this.currentStepIndex,
      isStepCompleted: this.isStepCompleted(index),
      hasMultipleCategoryEntry,
    });
    const itemEl = document.createElement('div');
    itemEl.className = 'standard-navigation-item timeline-step';
    itemEl.dataset.stepIndex = index;
    itemEl.dataset.timelineType = entry.type;

    const timelineState = getTimelineEntryState({
      entry,
      currentStepIndex: this.currentStepIndex,
      isCompleted,
      isAccessible: this.isStepAccessible(index),
      hasMultipleCategoryEntry,
    });
    timelineState.classes.forEach((className) => itemEl.classList.add(className));

    const escapedName = this._escapeHTML(entry.label) || `Step ${index + 1}`;
    const uploadedIconUrl = (step.isFreeGift && step.addonIconUrl) ? step.addonIconUrl : step.stepImage;
    const iconUrl = uploadedIconUrl || this._getDefaultTimelineIconDataUri(step);

    itemEl.innerHTML = `
      <div class="standard-navigation-step-img-container timeline-icon-wrapper">
        <img class="standard-navigation-image timeline-step-icon" src="${this._escapeHTML(iconUrl)}" alt="${escapedName}">
      </div>
      <div class="standard-navigation-title-container">
        <p class="standard-navigation-title timeline-step-name">${escapedName}</p>
      </div>
    `;

    if (entry.type === 'step' && timelineState.isAccessible && !timelineState.isDefaultStep) {
      itemEl.style.cursor = 'pointer';
      itemEl.addEventListener('click', () => {
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

    itemsContainer.appendChild(itemEl);
  });

  if (entryCount > 1) {
    const progressContainer = document.createElement('div');
    progressContainer.className = 'standard-steps-progress-bar-container';
    progressContainer.innerHTML = `
      <div class="standard-steps-progress-bar">
        <div class="standard-steps-progress-bar-filled"></div>
      </div>
    `;
    itemsContainer.appendChild(progressContainer);
  }

  timeline.appendChild(itemsContainer);
  return timeline;
},

createStepBannerImage(stepIndex) {
  const step = (this.selectedBundle?.steps || [])[stepIndex];
  return createStepBannerImageElement(step, value => this._escapeHTML(value), document);
},

createBundleBanners() {
  return createBundleBannerElement({
    desktopBannerUrl: this.selectedBundle?.bundleBannerDesktopUrl,
    mobileBannerUrl: this.selectedBundle?.bundleBannerMobileUrl,
  }, document);
},

ensureBundleBannerRuntimeStyles() {
  return true;
},

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
},

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
},

};

const fullPageSearchCategoryMethods = {
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
},

updateProductGridWithSearch() {
  const gridContainer = this.container.querySelector('.full-page-product-grid-container');
  if (!gridContainer) return;

  const productGrid = this.createFullPageProductGrid(this.currentStepIndex);
  gridContainer.innerHTML = '';
  gridContainer.appendChild(productGrid);
},

hidePageTitle() {
  const configName = (() => {
    if (this.selectedBundle?.name) return this.selectedBundle.name;
    try {
      const rawConfig = this.container?.dataset?.bundleConfig;
      if (!rawConfig) return '';
      return JSON.parse(rawConfig)?.name || '';
    } catch (e) {
      return '';
    }
  })();
  const normalizedConfigName = String(configName || '').trim().toLowerCase();

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

        el.remove();
      });
    } catch (e) {

    }
  }

  const pageTitleContainers = document.querySelectorAll('.page-width--narrow');
  pageTitleContainers.forEach(container => {

    const hasPageTitle = container.querySelector('.main-page-title, .page-title, h1.h0');
    const hasOtherContent = container.querySelector('.rte:not(:empty), .bundle-widget, #bundle-builder-app');

    if (hasPageTitle && !hasOtherContent) {
      container.remove();
    }
  });

  document.querySelectorAll('.shopify-section, [id^="shopify-section"], section').forEach(section => {
    if (!section.querySelector?.('.bundle-widget-container, #bundle-builder-app')) return;

    section.querySelectorAll?.('h1').forEach(el => {
      if (el.closest('.bundle-widget-container, #bundle-builder-app, .promo-banner')) return;

      const titleBlock = el.closest('.text-block, .page-width--narrow') || el.parentElement;
      if (titleBlock && !titleBlock.querySelector('.bundle-widget-container, #bundle-builder-app')) {
        titleBlock.remove();
        return;
      }

      el.remove();
    });
  });

  if (!normalizedConfigName) return;

  document.querySelectorAll('h1').forEach(el => {
    if (el.closest('.bundle-widget-container, .promo-banner')) return;
    const normalizedTitle = String(el.textContent || '').trim().toLowerCase();
    if (normalizedTitle !== normalizedConfigName) return;

    const titleSection = el.closest('.shopify-section, [id^="shopify-section"], section');
    if (titleSection && !titleSection.querySelector('.bundle-widget-container')) {
      titleSection.remove();
      return;
    }

    const titleBlock = el.closest('.text-block, .page-width--narrow') || el.parentElement;
    if (titleBlock && !titleBlock.querySelector('.bundle-widget-container')) {
      titleBlock.remove();
    } else {
      el.remove();
    }
  });
},

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
    const pricingMethod = pricing.method || 'percentage_off';
    const bestRule = rules.reduce((best, rule) => {
      const dv = rule.discountValue ?? 0;
      const bestDv = best.discountValue ?? 0;
      const isPercent = pricingMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF;
      const discountValue = isPercent ? dv : dv / 100;
      const bestValue = isPercent ? bestDv : bestDv / 100;
      return discountValue > bestValue ? rule : best;
    }, rules[0]);

    const targetQty = bestRule.conditionValue ?? 0;
    const conditionOperator = bestRule.conditionOperator;
    const discountMethod = pricingMethod;
    const discountValue = bestRule.discountValue ?? 0;

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
    promoNote = discountMessage;
  }

  const tierBadges = this.createPromoDiscountTierBadges(pricing, currencyInfo);
  const banner = document.createElement('div');
  banner.className = 'promo-banner';
  banner.classList.add(discountMessage ? 'has-discount' : 'no-discount');
  banner.innerHTML = `
    ${promoSubtitle ? `<div class="promo-banner-subtitle">${ComponentGenerator.escapeHtml(promoSubtitle)}</div>` : ''}
    <h2 class="promo-banner-title">${ComponentGenerator.escapeHtml(promoTitle)}</h2>
    ${promoNote ? `<div class="promo-banner-note">${ComponentGenerator.escapeHtml(promoNote)}</div>` : ''}
    ${tierBadges}
  `;

  const bgImageUrl = this.selectedBundle && this.selectedBundle.promoBannerBgImage;
  if (bgImageUrl) {
    banner.style.setProperty('--fpb-promo-banner-bg-image', `url("${String(bgImageUrl).replace(/"/g, '\\"')}")`);
    banner.style.setProperty('--fpb-promo-banner-bg-size', 'cover');
    banner.style.setProperty('--fpb-promo-banner-bg-position', 'center');
  }

  return banner;
},

createPromoDiscountTierBadges(pricing, currencyInfo) {
  const rules = Array.isArray(pricing?.rules) ? pricing.rules : [];
  if (!pricing?.enabled || rules.length === 0) return '';

  const badges = rules
    .filter(rule => rule && (rule.conditionType === 'quantity' || rule.conditionType === 'amount'))
    .sort((a, b) => (Number(a.conditionValue || 0) || 0) - (Number(b.conditionValue || 0) || 0))
    .map(rule => this.formatPromoDiscountTierLabel(rule, pricing, currencyInfo))
    .filter(Boolean)
    .map(label => `<span class="promo-discount-tier-badge">${ComponentGenerator.escapeHtml(label)}</span>`);

  if (badges.length === 0) return '';
  return `<div class="promo-discount-tier-row">${badges.join('')}</div>`;
},

formatPromoDiscountTierLabel(rule, pricing, currencyInfo) {
  const ruleId = String(rule?.id || '');
  const tierText = pricing?.messages?.tierTextByRuleId?.[ruleId];
  if (tierText?.tierText && tierText?.tierSubtext) {
    return `${tierText.tierText} / ${tierText.tierSubtext}`;
  }
  if (tierText?.tierText) return tierText.tierText;
  if (tierText?.tierSubtext) return tierText.tierSubtext;

  const threshold = Number(rule?.conditionValue || 0) || 0;
  const discountValue = Number(rule?.discountValue || 0) || 0;
  if (!threshold || !discountValue) return '';

  const thresholdText = rule.conditionType === 'amount'
    ? CurrencyManager.convertAndFormat(threshold, currencyInfo)
    : String(threshold);
  let discountText = '';
  const discountMethod = pricing?.method || 'percentage_off';
  if (discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF) {
    discountText = `${discountValue}%`;
  } else if (discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_AMOUNT_OFF || discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_BUNDLE_PRICE) {
    discountText = CurrencyManager.convertAndFormat(discountValue, currencyInfo);
  }

  return discountText ? `${thresholdText} / ${discountText}` : thresholdText;
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

getStepCategoryTabEntries(step) {
  if (!Array.isArray(step.categories)) return [];

  return step.categories
    .map((category, index) => {
      const id = category.categoryId || category.id || `category-${index}`;
      const title = category.title || category.name;
      if (!id || !title) return null;

      const handles = [];
      const productIds = [];
      const addHandle = (collection) => {
        const handle = collection?.handle;
        if (handle && !handles.includes(handle)) handles.push(handle);
      };
      const addProductId = (product) => {
        const productId = product?.id || product?.graphqlId || product?.productId;
        if (productId && !productIds.includes(productId)) productIds.push(productId);
      };

      (category.collections || []).forEach(addHandle);
      (category.collectionsData || []).forEach(addHandle);
      (category.collectionsSelectedData || []).forEach(addHandle);
      (category.products || []).forEach(addProductId);
      (category.selectedProducts || []).forEach(addProductId);

      return {
        id,
        title,
        handles,
        productIds,
        displayVariantsAsIndividualProducts: category.displayVariantsAsIndividualProducts === true,
        displayVariantsAsSwatches: category.displayVariantsAsSwatches === true,
      };
    })
    .filter(entry => entry && (entry.handles.length > 0 || entry.productIds.length > 0));
},

getActiveStepCategoryId(step) {
  const categoryEntries = this.getStepCategoryTabEntries(step);
  if (categoryEntries.length === 0) return this.activeCollectionId;
  if (this.activeCollectionId && categoryEntries.some(entry => entry.id === this.activeCollectionId)) {
    return this.activeCollectionId;
  }
  return categoryEntries[0].id;
},

getActiveStepCategoryEntry(step) {
  const categoryEntries = this.getStepCategoryTabEntries(step);
  const activeCategoryId = this.getActiveStepCategoryId(step);
  return categoryEntries.find(entry => entry.id === activeCategoryId) || null;
},

shouldDisplayVariantsAsIndividualForProductGrid(step, activeCategory) {
  const stepDisplaysVariantsAsIndividual =
    step?.displayVariantsAsIndividualProducts === true || step?.displayVariantsAsIndividual === true;

  if (activeCategory) {
    return activeCategory.displayVariantsAsIndividualProducts === true || stepDisplaysVariantsAsIndividual;
  }

  const hasCategoryEntries = this.getStepCategoryTabEntries(step).length > 0;
  if (hasCategoryEntries) {
    return false;
  }

  return stepDisplaysVariantsAsIndividual;
},

createActiveCategoryTitle(stepIndex) {
  if (!this.selectedBundle || !this.selectedBundle.steps || !this.selectedBundle.steps[stepIndex]) {
    return null;
  }

  const activeCategory = this.getActiveStepCategoryEntry(this.selectedBundle.steps[stepIndex]);
  if (!activeCategory?.title) return null;

  const title = document.createElement('div');
  title.className = 'fpb-step-category-title';
  title.textContent = activeCategory.title;
  return title;
},
};

function shouldCategoryTabActivateProducts({
  designPreset,
  viewportWidth,
  hasCategoryEntries,
}) {
  return !(designPreset === 'STANDARD' && hasCategoryEntries && viewportWidth < 768);
}

const fullPageProductGridMethods = {
scrollActiveCategoryTitleIntoView() {
  if (this.getFullPageDesignPreset?.() !== 'STANDARD') return;

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const title = this.elements?.stepsContainer?.querySelector('.fpb-step-category-title');
      if (!title) return;

      const targetTop = title.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth',
      });
    });
  });
},

activateStepCategory(categoryId) {
  this.activeCollectionId = categoryId;
  Promise.resolve(this.reRenderFullPage()).then(() => {
    this.scrollActiveCategoryTitleIntoView();
  });
},

createCategorySectionRows(stepIndex, placement = 'all') {
  if (!this.selectedBundle || !this.selectedBundle.steps || !this.selectedBundle.steps[stepIndex]) {
    return null;
  }

  const step = this.selectedBundle.steps[stepIndex];
  const categoryEntries = this.getStepCategoryTabEntries(step);
  if (categoryEntries.length <= 1) return null;

  const activeCategoryId = this.getActiveStepCategoryId(step);
  const activeCategoryIndex = categoryEntries.findIndex(entry => entry.id === activeCategoryId);
  const inactiveCategoryEntries = categoryEntries.filter((entry, index) => {
    if (entry.id === activeCategoryId) return false;
    if (placement === 'before') return index < activeCategoryIndex;
    if (placement === 'after') return index > activeCategoryIndex;
    return true;
  });
  if (inactiveCategoryEntries.length === 0) return null;

  const categoryRowsContainer = document.createElement('div');
  categoryRowsContainer.className = 'fpb-category-section-rows';

  inactiveCategoryEntries.forEach(entry => {
    const categoryRow = document.createElement('button');
    categoryRow.type = 'button';
    categoryRow.className = 'fpb-category-section-row fpb-category-section-row--collapsed';
    categoryRow.textContent = entry.title;
    categoryRow.addEventListener('click', () => {
      this.activateStepCategory(entry.id);
    });
    categoryRowsContainer.appendChild(categoryRow);
  });

  return categoryRowsContainer;
},

getNoProductsAvailableMessage() {
  if (typeof this._resolveText === 'function') {
    return this._resolveText('noProductsAvailable', 'No Products Available');
  }

  return 'No Products Available';
},

createCategoryTabs(stepIndex) {
  if (!this.selectedBundle || !this.selectedBundle.steps || !this.selectedBundle.steps[stepIndex]) {
    return null;
  }

  const step = this.selectedBundle.steps[stepIndex];
  const categoryEntries = this.getStepCategoryTabEntries(step);
  const hasCategoryEntries = categoryEntries.length > 0;

  if (categoryEntries.length === 0 && (!step.collections || step.collections.length === 0)) {
    return null;
  }

  const customFilters = Array.isArray(step.filters) && step.filters.length > 0
    ? step.filters
    : null;

  let tabEntries;
  if (hasCategoryEntries) {
    tabEntries = categoryEntries;
  } else if (customFilters) {
    tabEntries = customFilters
      .map(f => {
        const col = step.collections.find(c => (c.handle || c.id) === f.collectionHandle);
        return col ? { id: col.id, title: f.label } : null;
      })
      .filter(Boolean);
  } else {
    tabEntries = step.collections.map(c => ({ id: c.id, title: c.title }));
  }

  if (tabEntries.length === 0) {
    return null;
  }

  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'category-tabs';

  const activeCategoryId = hasCategoryEntries ? this.getActiveStepCategoryId(step) : this.activeCollectionId;

  if (!hasCategoryEntries) {
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
  }

  tabEntries.forEach(entry => {
    const tab = document.createElement('button');
    tab.className = 'category-tab';
    if (activeCategoryId === entry.id) {
      tab.classList.add('active');
    }
    tab.innerHTML = `<span class="tab-label">${ComponentGenerator.escapeHtml(entry.title)}</span>`;
    tab.addEventListener('click', () => {
      if (shouldCategoryTabActivateProducts({
        designPreset: this.getFullPageDesignPreset?.(),
        viewportWidth: window.innerWidth,
        hasCategoryEntries,
      })) {
        this.activateStepCategory(entry.id);
        return;
      }

      tabsContainer.querySelectorAll('.category-tab').forEach(tabElement => {
        tabElement.classList.remove('active');
      });
      tab.classList.add('active');
    });
    tabsContainer.appendChild(tab);
  });

  return tabsContainer;
},

orderProductsForActiveCategory(products, activeCategory, stepIndex) {
  if (!activeCategory) return products;

  const productOrder = new Map();
  const addProductId = (productId) => {
    const normalizedProductId = this.extractId(productId) || productId;
    if (normalizedProductId && !productOrder.has(normalizedProductId)) {
      productOrder.set(normalizedProductId, productOrder.size);
    }
  };

  (activeCategory.productIds || []).forEach(addProductId);
  (activeCategory.handles || []).forEach(handle => {
    const collectionProductIds = this.stepCollectionProductIds[`${stepIndex}:${handle}`] || [];
    collectionProductIds.forEach(addProductId);
  });

  return products
    .map((product, index) => {
      const productId = product.parentProductId || product.id || '';
      return {
        product,
        index,
        order: productOrder.get(this.extractId(productId) || productId),
      };
    })
    .filter(entry => entry.order !== undefined)
    .sort((a, b) => a.order - b.order || a.index - b.index)
    .map(entry => entry.product);
},

createFullPageProductGrid(stepIndex) {
  const grid = document.createElement('div');
  grid.className = 'full-page-product-grid';

  if (!this.selectedBundle || !this.selectedBundle.steps || !this.selectedBundle.steps[stepIndex]) {
    return grid;
  }

  const step = this.selectedBundle.steps[stepIndex];

  let products = this.stepProductData[stepIndex] || [];

  const activeCategory = this.getActiveStepCategoryEntry(step);
  const activeCollectionId = activeCategory ? activeCategory.id : this.activeCollectionId;

  if (activeCollectionId) {
    if (activeCategory) {
      const allowedProductIds = new Set();
      activeCategory.productIds.forEach(productId => {
        allowedProductIds.add(this.extractId(productId) || productId);
      });
      activeCategory.handles.forEach(handle => {
        const collectionProductIds = this.stepCollectionProductIds[`${stepIndex}:${handle}`] || [];
        collectionProductIds.forEach(productId => {
          allowedProductIds.add(this.extractId(productId) || productId);
        });
      });

      if (allowedProductIds.size > 0) {
        products = products.filter(p => {
          const numericPid = p.parentProductId || p.id || '';
          return allowedProductIds.has(numericPid);
        });
        products = this.orderProductsForActiveCategory(products, activeCategory, stepIndex);
      }
    } else if (step.collections) {
      const activeCollection = step.collections.find(c => c.id === activeCollectionId);
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
  }

  const shouldDisplayVariantsAsIndividual = this.shouldDisplayVariantsAsIndividualForProductGrid(step, activeCategory);
  let expandedProducts = this.expandProductsByVariant(products, shouldDisplayVariantsAsIndividual);

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
      : ComponentGenerator.escapeHtml(this.getNoProductsAvailableMessage());
    grid.innerHTML = `<p class="no-products">${message}</p>`;
    return grid;
  }

  const stepSelections = this.selectedProducts[stepIndex] || {};
  const capacityCheck = ConditionValidator.canUpdateQuantity(step, stepSelections, '__new__', 1);
  const isStepAtCapacity = !capacityCheck.allowed;

  expandedProducts.forEach(product => {
    const productCard = this.createProductCard(product, stepIndex, {
      displayVariantsAsIndividualProducts: shouldDisplayVariantsAsIndividual,
    });
    const productId = product.variantId || product.id;
    const currentQty = stepSelections[productId] || 0;

    if (isStepAtCapacity && currentQty === 0) {
      productCard.classList.add('dimmed');
    }
    grid.appendChild(productCard);
  });

  return grid;
},

expandProductsByVariant(products, shouldExpand = true) {
  if (!shouldExpand) {
    return products;
  }

  return products.flatMap(product => {
    const isVariantSelectable = (variant) => {
      if (typeof this.isVariantSelectableForInventory === 'function') {
        return this.isVariantSelectableForInventory(variant);
      }
      return variant?.available !== false;
    };

    if (product.parentProductId && product.variantId) {
      return isVariantSelectable(product) ? [product] : [];
    }

    if (product.variants && product.variants.length > 1) {
      return product.variants
        .filter(variant => isVariantSelectable(variant))
        .map(variant => {
          const runtimeInventory = typeof this.getRuntimeVariantInventory === 'function'
            ? this.getRuntimeVariantInventory(variant)
            : null;
          const inventorySource = runtimeInventory || variant;

          const imageUrl = variant.image?.src
            || variant.image?.url
            || (typeof variant.image === 'string' ? variant.image : null)
            || variant.imageUrl
            || product.imageUrl
            || product.featuredImage?.url
            || product.images?.[0]?.url
            || product.images?.[0]?.src
            || product.images?.[0]?.originalSrc
            || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;

          return {
            ...product,
            id: variant.id,
            title: product.title,
            variantTitle: variant.title === 'Default Title' ? '' : variant.title,
            imageUrl,
            price: typeof variant.price === 'number' ? variant.price : (parseFloat(variant.price || '0') * 100),
            compareAtPrice: variant.compareAtPrice ? (typeof variant.compareAtPrice === 'number' ? variant.compareAtPrice : parseFloat(variant.compareAtPrice) * 100) : null,
            variantId: variant.id,
            available: isVariantSelectable(variant),
            quantityAvailable: typeof inventorySource.quantityAvailable === 'number' ? inventorySource.quantityAvailable : null,
            currentlyNotInStock: inventorySource.currentlyNotInStock === true,
            parentProductId: product.id,
            parentTitle: product.title,

            variants: null
          };
        });
    }

    if (Array.isArray(product.variants) && product.variants.length === 1) {
      const variant = product.variants[0];
      if (!isVariantSelectable(variant)) return [];
    }
    return isVariantSelectable(product) ? [product] : [];
  });
},

shouldUseProductGridSpinnerOnly() {
  return this.getFullPageDesignPreset?.() === 'CLASSIC';
},

renderProductGridLoadingState(productGridContainer) {
  if (!productGridContainer) return;

  productGridContainer.innerHTML = this.createProductGridLoadingState();

  const loadingGif = this.selectedBundle?.loadingGif || null;
  if (this.shouldUseProductGridSpinnerOnly() || loadingGif) {
    this.showLoadingOverlay(loadingGif);
  }
},

createProductGridLoadingState() {
  if (this.shouldUseProductGridSpinnerOnly()) return '';

  return `
    <div class="full-page-product-grid">
      ${Array(6).fill(0).map(() => `
        <div class="product-card skeleton-loading">
          <div class="skeleton-card-content"></div>
        </div>
      `).join('')}
    </div>
  `;
},

preloadAllSteps() {
  const steps = this.selectedBundle?.steps;
  if (!steps) return;

  steps.forEach((_, index) => {

    if (index === this.currentStepIndex) return;

    if (this.stepProductData[index]?.length > 0) return;

    this.loadStepProducts(index).catch(() => {

    });
  });
},

preloadNextStep() {
  this.preloadAllSteps();
},

};

const fullPageProductCardFooterMethods = {
createProductCard(product, stepIndex, options = {}) {
  const productId = product.variantId || product.id;
  const selectedQuantity = this.selectedProducts[stepIndex]?.[productId] || 0;
  const directDefaultQuantity = product?.isDirectDefaultProduct
    ? Number(product.defaultRequiredQuantity || 1) || 1
    : 0;
  const currentQuantity = Math.max(0, selectedQuantity - directDefaultQuantity);

  if (!product.imageUrl || product.imageUrl === '') {
    product.imageUrl = product.image?.src ||
                      product.featuredImage?.url ||
                      product.images?.[0]?.url ||
                      BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
  }

  const currencyInfo = CurrencyManager.getCurrencyInfo();

  const step = (this.selectedBundle?.steps || [])[stepIndex];
  const primaryOptionName = step?.primaryVariantOption || null;
  const displayVariantsAsIndividualProducts =
    typeof options.displayVariantsAsIndividualProducts === 'boolean'
      ? options.displayVariantsAsIndividualProducts
      : step?.displayVariantsAsIndividualProducts === true || step?.displayVariantsAsIndividual === true;
  const designPreset = this.getFullPageDesignPreset();
  const usesStandardVariantSelector = designPreset === 'STANDARD' || designPreset === 'CLASSIC';
  const shouldRenderVariantSelector = shouldRenderInlineVariantSelector({
    bundleVariantSelectorEnabled: this.selectedBundle?.variantSelectorEnabled !== false,
    product,
    displayVariantsAsIndividualProducts,
  });
  const variantSelectorHtml = shouldRenderVariantSelector
    ? usesStandardVariantSelector
      ? VariantSelectorComponent.renderDropdownHtml(product, primaryOptionName, {
        placeholder: this._resolveText('chooseOptionsButton', 'Choose Options'),
      })
      : VariantSelectorComponent.renderHtml(product, primaryOptionName)
    : '';

  const displayProduct = this.buildPaidAddonProductDisplayData(product, step);
  const supportsAddonDiscountBadge = ['STANDARD', 'CLASSIC'].includes(designPreset);
  const hasAddonDiscountBadge = supportsAddonDiscountBadge && displayProduct.addonDiscountBadgeText;
  const stockBadgeHtml = hasAddonDiscountBadge
    ? `<span class="fpb-addon-discount-badge">${ComponentGenerator.escapeHtml(displayProduct.addonDiscountBadgeText)}</span>`
    : '';
  let htmlString;
  if (designPreset === 'STANDARD' || designPreset === 'CLASSIC' || designPreset === 'COMPACT' || designPreset === 'HORIZONTAL') {
    htmlString = renderSharedProductCard(
      displayProduct,
      currentQuantity,
      currencyInfo,
      {
        variantSelectorHtml,
        mode: designPreset === 'HORIZONTAL' ? 'row' : 'grid',
        addButtonText: this.getProductCardAddButtonText(step),
        cardBadgeHtml: stockBadgeHtml,
        variantSelectorPlacement: usesStandardVariantSelector ? 'beforePrice' : undefined,
      }
    );
  } else {
    htmlString = ComponentGenerator.renderProductCard(
      product,
      currentQuantity,
      currencyInfo,
      {
        variantSelectorHtml,
        actionMode: 'expandingQuantity',
        addButtonText: this.getProductCardAddButtonText(step),
      }
    );
  }

  const wrapper = document.createElement('div');
  wrapper.innerHTML = htmlString.trim();
  const cardElement = wrapper.firstChild;

  this.applyStandardExpandedVariantTitle(cardElement, displayProduct);

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
        badge.textContent = this._resolveText('includedBadge', 'Included');
}
      imgEl.parentElement.appendChild(badge);
    }
  }

  if (currentStepData?.isFreeGift && currentStepData?.addonDisplayFree === true && !hasAddonDiscountBadge) {
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
        badge.textContent = this._resolveText('freeBadge', 'Free');
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

  this.attachProductCardListeners(cardElement, product, stepIndex, {
    displayVariantsAsIndividualProducts,
  });

  return cardElement;
},

buildPaidAddonProductDisplayData(product, step) {
  const isAddonDiscountStep = step?.isFreeGift === true;
  if (!isAddonDiscountStep || typeof this.getAddonLineDiscount !== 'function') return product;

  const addonDiscount = this.getAddonLineDiscount(step);
  if (!addonDiscount || addonDiscount.type !== 'PERCENTAGE') return product;

  const originalPrice = Number(product?.price || 0);
  const discountValue = Number(addonDiscount.value || 0);
  if (!Number.isFinite(originalPrice) || originalPrice <= 0 || !Number.isFinite(discountValue) || discountValue <= 0) {
    return product;
  }

  const normalizedDiscountValue = Math.min(100, Math.max(0, discountValue));
  const discountedPrice = Math.max(0, Math.round(originalPrice * (100 - normalizedDiscountValue) / 100));
  return {
    ...product,
    price: discountedPrice,
    compareAtPrice: originalPrice,
    addonDiscountBadgeText: `${normalizedDiscountValue}% off`,
  };
},

getProductCardAddButtonText(step) {
  const isPaidAddonStep = step?.isFreeGift === true && step?.addonDisplayFree !== true;
  if (isPaidAddonStep) {
    if (this.getFullPageDesignPreset?.() === 'CLASSIC') {
      return this.getProductAddButtonText();
    }
    return this._resolveText('addToCartButton', this.config?.addToCartText || 'Add to Cart');
  }

  return this.getProductAddButtonText();
},

applyStandardExpandedVariantTitle(cardElement, product) {
  const preset = this.getFullPageDesignPreset();
  if (!['STANDARD', 'HORIZONTAL'].includes(preset)) return;
  if (!cardElement) return;
  if (cardElement.querySelector('[data-bw-card-variant-row="true"]')) return;

  const variantTitle = this.getSummaryProductVariantDisplay(product);
  if (!product?.parentProductId || !variantTitle) return;

  const titleEl = cardElement.querySelector('.product-title');
  if (!titleEl) return;

  const parentTitle = this.getSummaryProductDisplayTitle({
    ...product,
    variantTitle: product.variantTitle || 'Default Title',
    title: product.title || '',
    parentTitle: product.parentTitle || ''
  });
  if (!parentTitle) return;

  cardElement.classList.add('product-card--expanded-variant');
  titleEl.textContent = parentTitle;
  const variantDividerEl = document.createElement('div');
  variantDividerEl.className = 'bw-product-card__variant-divider';
  variantDividerEl.setAttribute('aria-hidden', 'true');
  titleEl.insertAdjacentElement('afterend', variantDividerEl);
  const variantEl = document.createElement('div');
  variantEl.className = 'bw-product-card__variant product-variant-row';
  variantEl.setAttribute('data-bw-card-variant-row', 'true');
  variantEl.textContent = variantTitle;
  variantDividerEl.insertAdjacentElement('afterend', variantEl);
},

getSummaryProductDisplayTitle(item) {
  if (!item) return '';
  const hasVariantLabel = item.variantTitle && item.variantTitle !== 'Default Title';
  const hasUsableParentTitle = typeof item.parentTitle === 'string' && item.parentTitle.trim().length > 0;
  if (hasVariantLabel && hasUsableParentTitle) return item.parentTitle;

  const inferredParentTitle = this.getParentTitleFromDisplayTitle(item.title);
  if (inferredParentTitle && hasVariantLabel) return inferredParentTitle;

  if (hasUsableParentTitle) {
    return item.parentTitle;
  }

  return inferredParentTitle || item.title || '';
},

getSummaryProductVariantDisplay(item) {
  if (!item) return '';

  const explicitVariantTitle = typeof item.variantTitle === 'string' ? item.variantTitle : '';
  if (explicitVariantTitle && explicitVariantTitle !== 'Default Title') {
    return explicitVariantTitle;
  }

  const parentTitle = typeof item.parentTitle === 'string' ? item.parentTitle : '';
  const normalizedTitle = typeof item.title === 'string' ? item.title : '';
  if (!normalizedTitle) return '';

  if (parentTitle) {
    const withParentPrefix = `${parentTitle} - `;
    if (normalizedTitle.startsWith(withParentPrefix)) {
      const inferredVariant = normalizedTitle.slice(withParentPrefix.length).trim();
      return inferredVariant || '';
    }
  }

  return this.getSummaryVariantFromDisplayTitle(normalizedTitle);
},

getParentTitleFromDisplayTitle(displayTitle) {
  if (typeof displayTitle !== 'string') return '';
  const separatorIndex = displayTitle.indexOf(' - ');
  if (separatorIndex <= 0) return '';
  const parentCandidate = displayTitle.slice(0, separatorIndex).trim();
  return parentCandidate || '';
},

getSummaryVariantFromDisplayTitle(displayTitle) {
  if (typeof displayTitle !== 'string') return '';
  const separatorIndex = displayTitle.indexOf(' - ');
  if (separatorIndex <= 0) return '';
  const variantCandidate = displayTitle.slice(separatorIndex + 3).trim();
  return variantCandidate || '';
},

attachProductCardListeners(cardElement, product, stepIndex, options = {}) {

  const step = (this.selectedBundle?.steps || [])[stepIndex];
  if (step?.isDefault) return;

  const getProductId = () => product.variantId || product.id;
  const getClickedProductId = (element) => element?.dataset?.productId || getProductId();

  cardElement.addEventListener('click', (e) => {
    const imageNav = e.target.closest('.bw-product-card__image-nav');
    if (imageNav) {
      e.preventDefault();
      e.stopPropagation();
      const imageUrls = getProductImageUrls(product);
      if (imageUrls.length <= 1) return;

      const currentIndex = Number(cardElement.dataset.bwCardImageIndex || 0);
      const direction = imageNav.dataset.bwImageNav === 'prev' ? -1 : 1;
      const nextIndex = (currentIndex + direction + imageUrls.length) % imageUrls.length;
      const imageEl = cardElement.querySelector('.bw-product-card__image');
      if (imageEl) {
        imageEl.src = imageUrls[nextIndex];
      }
      cardElement.dataset.bwCardImageIndex = String(nextIndex);
      return;
    }

    if (!e.target.closest('.product-image, .product-title')) return;
    e.stopPropagation();

    if (!this.productModal && window.BundleProductModal) {
      this.productModal = new window.BundleProductModal(this);
    }
    if (!this.productModal) return;

    const initialImageIndex = Number(cardElement.dataset.bwCardImageIndex || 0);
    const isClassicQuickView = this.getFullPageDesignPreset?.() === 'CLASSIC';
    this.productModal.open(product, step, {
      initialImageIndex,
      readOnly: isClassicQuickView,
    });
  });

  cardElement.addEventListener('click', (e) => {
    const btn = e.target.closest('.inline-qty-btn');
    if (!btn) return;
    e.stopPropagation();
    const productId = getClickedProductId(btn);
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
    const productId = getClickedProductId(addBtn);
    const currentQty = this.selectedProducts[stepIndex]?.[productId] || 0;
    if (currentQty === 0) {
      this.updateProductSelection(stepIndex, productId, 1);
    }
  });

  const displayVariantsAsIndividualProducts =
    typeof options.displayVariantsAsIndividualProducts === 'boolean'
      ? options.displayVariantsAsIndividualProducts
      : step?.displayVariantsAsIndividualProducts === true || step?.displayVariantsAsIndividual === true;
  if (shouldRenderInlineVariantSelector({
    bundleVariantSelectorEnabled: this.selectedBundle?.variantSelectorEnabled !== false,
    product,
    displayVariantsAsIndividualProducts,
  })) {
    VariantSelectorComponent.attachListeners(cardElement, product, (newVariantId, oldVariantId) => {
      const oldQty = this.selectedProducts[stepIndex]?.[oldVariantId] || 0;

      if (oldQty > 0 && oldVariantId !== newVariantId) {

        if (this.selectedProducts[stepIndex]) {
          delete this.selectedProducts[stepIndex][oldVariantId];
        }

        const newQtyAvail = product.quantityAvailable;
        const newOOS = this.isVariantOutOfStock(product);
        const trackInventoryOnAddToCart = typeof this.isInventoryTrackingOnAddToCartEnabled === 'function'
          ? this.isInventoryTrackingOnAddToCartEnabled()
          : false;
        let migratedQty = oldQty;
        if (newOOS) {
          ToastManager.show('Selected variant is out of stock — selection cleared.');
          migratedQty = 0;
        } else if (trackInventoryOnAddToCart && newQtyAvail !== null && oldQty > newQtyAvail) {
          migratedQty = newQtyAvail;
          ToastManager.show('Only ' + newQtyAvail + ' in stock — quantity adjusted.');
        }
        if (migratedQty > 0) {
          this.selectedProducts[stepIndex][newVariantId] = migratedQty;
        }

        const qtyDisplay = cardElement.querySelector('.inline-qty-display');
        if (qtyDisplay) qtyDisplay.textContent = migratedQty;
      }

      cardElement.dataset.productId = newVariantId;
      cardElement.dataset.currentSelectedVariantId = newVariantId;
      cardElement.querySelectorAll('[data-product-id]').forEach(el => {
        if (el !== cardElement) el.dataset.productId = newVariantId;
      });
      this.updateProductCardVariantDisplay(cardElement, product, step);

      this.updateFooterMessaging?.();
      this.updateStepTimeline?.();
      this._refreshSiblingDimState?.(stepIndex);
    });
  }
},

updateProductCardVariantDisplay(cardElement, product, step) {
  if (!cardElement || !product) return;

  const displayProduct = this.buildPaidAddonProductDisplayData(product, step);
  const currencyInfo = CurrencyManager.getCurrencyInfo();
  const priceEl = cardElement.querySelector('.product-price');
  if (priceEl) {
    priceEl.textContent = CurrencyManager.convertAndFormat(displayProduct.price || 0, currencyInfo);
  }

  const priceRow = cardElement.querySelector('.product-price-row');
  let compareEl = cardElement.querySelector('.product-price-strike');
  if (displayProduct.compareAtPrice) {
    if (!compareEl && priceRow && priceEl) {
      compareEl = document.createElement('span');
      compareEl.className = 'bw-product-card__compare-price product-price-strike';
      priceRow.insertBefore(compareEl, priceEl);
    }
    if (compareEl) {
      compareEl.textContent = CurrencyManager.convertAndFormat(displayProduct.compareAtPrice, currencyInfo);
    }
  } else if (compareEl) {
    compareEl.remove();
  }

  const imageEl = cardElement.querySelector('.bw-product-card__image, .product-image img, img');
  if (imageEl && product.imageUrl) {
    imageEl.src = product.imageUrl;
    cardElement.dataset.bwCardImageIndex = '0';
    cardElement.dataset.bwCardImageCount = String(getProductImageUrls(product).length);
  }
},

updateStepTimeline() {
  if (!this.config.showStepTimeline) return;
  const existing = this.elements.stepsContainer.querySelector('.step-timeline');
  if (!existing) return;
  const fresh = this.createStepTimeline();
  existing.parentNode.replaceChild(fresh, existing);
},

renderFullPageFooter() {
  if (!this.elements.footer) {
    return;
  }

  const layout = this.resolveFullPageLayout();
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
  const finalPrice = combinedDiscountInfo.hasDiscount ? combinedDiscountInfo.finalPrice : totalPrice;

  const totalRequired = (this.selectedBundle.steps || []).reduce((sum, step) => {
    if (step.isFreeGift || step.isDefault) return sum;
    return sum + (Number(step.conditionValue) || Number(step.minQuantity) || 1);
  }, 0);

  const isLastStep = this.currentStepIndex === this.selectedBundle.steps.length - 1;

  if (this.config.showDiscountProgressBar) {
    const progressBar = this._renderDiscountProgress({
      combinedDiscountInfo,
      totalPrice,
      totalQuantity,
      unitPrices,
    });
    if (progressBar) this.elements.footer.appendChild(progressBar);
  }

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
    totalPrice, finalPrice, combinedDiscountInfo, currencyInfo, isLastStep
  );

  inner.appendChild(panel);
  inner.appendChild(backdrop);
  inner.appendChild(bar);
  this.elements.footer.appendChild(inner);
},

};

const fullPageFooterSelectionMethods = {
_createFooterPanel(allSelectedProducts, currencyInfo) {
  const panel = document.createElement('div');
  panel.className = 'footer-panel';

  const list = document.createElement('ul');
  list.className = 'footer-panel-list';

  allSelectedProducts.forEach(item => {
    const li = document.createElement('li');
    li.className = 'footer-panel-item';

    const formattedPrice = CurrencyManager.convertAndFormat(item.price || 0, currencyInfo);
    const summaryTitle = this.getSummaryProductDisplayTitle(item);
    const truncatedTitle = this.truncateTitle(summaryTitle, 35);
    const ariaLabelTitle = ComponentGenerator.escapeHtml(summaryTitle);

    li.innerHTML = `
      <img src="${this._getSelectedProductImageSrc(item) || BUNDLE_WIDGET.PLACEHOLDER_IMAGE}"
           alt="${ariaLabelTitle}"
           class="footer-panel-thumb">
      <div class="footer-panel-info">
        <p class="footer-panel-name">${ComponentGenerator.escapeHtml(truncatedTitle)}</p>
        <p class="footer-panel-price">${formattedPrice} <span class="footer-panel-qty">×${item.quantity}</span></p>
      </div>
      ${!item.isDefault ? `
      <button class="footer-panel-remove" type="button" aria-label="Remove ${ariaLabelTitle}">
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
        const truncated = summaryTitle.length > 25 ? summaryTitle.substring(0, 25) + '...' : summaryTitle;
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
},

_createFooterBar(allSelectedProducts, totalQuantity, totalRequired, totalPrice, finalPrice, discountInfo, currencyInfo, isLastStep) {
  const bar = document.createElement('div');
  bar.className = 'footer-bar';

  const thumbStrip = document.createElement('div');
  thumbStrip.className = 'footer-thumbstrip';
  const maxThumbs = 3;
  allSelectedProducts.slice(0, maxThumbs).forEach(item => {
    const img = document.createElement('img');
    img.src = this._getSelectedProductImageSrc(item) || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
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
  ctaBtn.textContent = (conditionless || isLastStep) ? this._resolveText('addToCartButton', this.config.addToCartText || 'Add to Cart') : this._resolveText('nextButton', 'Next');
  if (conditionless ? (!hasSelection || !this.canCheckoutWithBoxSelection()) : (isLastStep ? (!this.areBundleConditionsMet() || !this.canCheckoutWithBoxSelection()) : !this.canProceedToNextStep())) {
    ctaBtn.disabled = true;
  }
  ctaBtn.addEventListener('click', () => {
    if (conditionless || isLastStep) {
      if (!this.canCheckoutWithBoxSelection()) {
        this.showBoxSelectionValidationMessage();
        return;
      }
      this.addBundleToCart();
    } else if (this.canProceedToNextStep()) {
      this.activeCollectionId = null;
      this.searchQuery = '';
      this.currentStepIndex++;
      this.renderFullPageLayout();
    } else {
      ToastManager.show(this.getStepConditionValidationMessage?.() || 'Please meet the quantity conditions for the current step before proceeding.');
    }
  });

  bar.appendChild(thumbStrip);
  bar.appendChild(centreCol);
  bar.appendChild(ctaBtn);
  return bar;
},

truncateTitle(title, maxLength) {
  if (!title) return '';
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength) + '...';
},

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
            addonDisplayFree: step.addonDisplayFree === true,
          });
        } else {
        }
      }
    });
  });

  return allProducts;
},

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
},

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
},

findProductByVariantId(step, variantId) {
  return step.products?.find(p =>
    p.variants?.some(v => v.id === variantId) || p.id === variantId
  );
},

isStepCompleted(stepIndex) {
  const step = this.selectedBundle.steps[stepIndex];
  const stepSelections = this.selectedProducts[stepIndex] || {};
  if (typeof this.validateStep === 'function') {
    return this.validateStep(stepIndex);
  }

  return ConditionValidator.isStepConditionSatisfied(step, stepSelections);
},

reRenderFullPage() {
  const layout = this.resolveFullPageLayout();
  if (layout === 'footer_side') {
    return this.renderFullPageLayoutWithSidebar();
  } else {
    return this.renderFullPageLayout();
  }
},

};

function getAddonTiersForStep(step) {
  return Array.isArray(step?.addonTiers) ? step.addonTiers.filter(Boolean) : [];
}

function hasConfiguredAddonRule(step) {
  if (!step) return false;
  const eligibilityValue = Number(step.addonEligibilityCondition?.value) || 0;
  if (eligibilityValue > 0) return true;

  return getAddonTiersForStep(step).some(tier => {
    const tierValue = Number(tier?.eligibilityCondition?.value) || 0;
    if (tierValue > 0) return true;
    return Array.isArray(tier?.selectedAddonProducts) && tier.selectedAddonProducts.length > 0;
  });
}

function getAddonTierCandidatesWithState(step, totalPrice, totalQuantity) {
  const directTier = step?.addonEligibilityCondition || step?.addonDiscount
    ? [{
        eligibilityCondition: step?.addonEligibilityCondition || {},
        discount: step?.addonDiscount || {},
      }]
    : [];
  const tiers = getAddonTiersForStep(step);
  const candidates = tiers.length > 0 ? tiers : directTier;

  return candidates.map((tier, index) => {
    const condition = tier?.eligibilityCondition || {};
    const conditionType = String(condition.type || 'QUANTITY').toUpperCase();
    const conditionValue = Number(condition.value || 0);
    const threshold = conditionType === 'AMOUNT' ? Math.round(conditionValue * 100) : conditionValue;
    const currentValue = conditionType === 'AMOUNT' ? totalPrice : totalQuantity;
    return { tier, index, conditionType, threshold, currentValue, isEligible: currentValue >= threshold };
  });
}

function createFreeGiftStatusIcon(state) {
  const icon = document.createElement('span');
  icon.className = `side-panel-free-gift-icon side-panel-free-gift-icon--${state}`;
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = state === 'unlocked' ? '✓' : '🔒';
  return icon;
}

function createFreeGiftStatusText(message) {
  const text = document.createElement('span');
  text.className = 'side-panel-free-gift-text';
  text.textContent = message;
  return text;
}

const fullPageValidationAddonsMethods = {
async _sidebarAdvanceToNextStep() {
  const contentSection = this.elements.stepsContainer.querySelector('.sidebar-content');
  if (!contentSection) {

    this.renderFullPageLayoutWithSidebar();
    return;
  }

  this.updateStepTimeline();

  const existingSearch = contentSection.querySelector('.step-search-container');
  if (existingSearch && this.shouldRenderFullPageSearch()) {
    existingSearch.replaceWith(this.createSearchInput());
  } else if (existingSearch) {
    existingSearch.remove();
  } else if (this.shouldRenderFullPageSearch()) {
    const firstAnchor = contentSection.querySelector('.category-tabs, .fpb-step-category-title, .full-page-product-grid-container');
    if (firstAnchor) contentSection.insertBefore(this.createSearchInput(), firstAnchor);
  }

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

  const existingCategoryTitle = contentSection.querySelector('.fpb-step-category-title');
  const newCategoryTitle = this.createActiveCategoryTitle(this.currentStepIndex);
  if (existingCategoryTitle && newCategoryTitle) {
    existingCategoryTitle.replaceWith(newCategoryTitle);
  } else if (existingCategoryTitle && !newCategoryTitle) {
    existingCategoryTitle.remove();
  } else if (!existingCategoryTitle && newCategoryTitle) {
    const gridContainer = contentSection.querySelector('.full-page-product-grid-container');
    if (gridContainer) contentSection.insertBefore(newCategoryTitle, gridContainer);
  }

  const existingCategoryRows = contentSection.querySelector('.fpb-category-section-rows');
  const newCategoryRows = this.createCategorySectionRows(this.currentStepIndex);
  if (existingCategoryRows && newCategoryRows) {
    existingCategoryRows.replaceWith(newCategoryRows);
  } else if (existingCategoryRows && !newCategoryRows) {
    existingCategoryRows.remove();
  } else if (!existingCategoryRows && newCategoryRows) {
    const gridContainer = contentSection.querySelector('.full-page-product-grid-container');
    if (gridContainer) gridContainer.insertAdjacentElement('afterend', newCategoryRows);
  }

  const productGridContainer = contentSection.querySelector('.full-page-product-grid-container');
  if (!productGridContainer) {
    this.renderFullPageLayoutWithSidebar();
    return;
  }
  this.renderProductGridLoadingState(productGridContainer);

  const sidePanel = this.elements.stepsContainer.querySelector('.full-page-side-panel');
  if (sidePanel) this.renderSidePanel(sidePanel);

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
},

canProceedToNextStep() {
  if (!this.isStepCompleted(this.currentStepIndex)) return false;
  return true;
},

areBundleConditionsMet() {
  return this.selectedBundle.steps.every((step, index) => {
    if (step.isFreeGift || step.isDefault) return true;
    return this.isStepCompleted(index);
  });
},

bundleHasNoConditions() {
  if (!this.selectedBundle?.steps?.length) return false;
  return this.selectedBundle.steps.every(step => {
    if (step.isDefault) return true;
    if (step.isFreeGift) {
      const eligibilityValue = Number(step.addonEligibilityCondition?.value) || 0;
      if (eligibilityValue > 0) return false;
      const tiers = getAddonTiersForStep(step);
      if (tiers.length > 0) {
        return tiers.every(tier => {
          const tierValue = Number(tier.eligibilityCondition?.value) || 0;
          if (tierValue > 0) return false;
          if (Array.isArray(tier.selectedAddonProducts) && tier.selectedAddonProducts.length > 0) return false;
          return true;
        });
      }
      return true;
    }
    return !step.conditionType && !step.conditionOperator && step.conditionValue == null;
  });
},

get freeGiftStep() {
  return (this.selectedBundle?.steps || []).find(s => s.isFreeGift) ?? null;
},

get freeGiftStepIndex() {
  return (this.selectedBundle?.steps || []).findIndex(s => s.isFreeGift);
},

get paidSteps() {
  return (this.selectedBundle?.steps || []).filter(s => !s.isFreeGift && !s.isDefault);
},

get isFreeGiftUnlocked() {
  if (!this.freeGiftStep) return false;
  const steps = this.selectedBundle?.steps || [];
  return this.paidSteps.every(paidStep => {
    const globalIndex = steps.indexOf(paidStep);
    return this.isStepCompleted(globalIndex);
  });
},

canNavigateToStep(targetStepIndex) {
  const targetStep = (this.selectedBundle?.steps || [])[targetStepIndex];
  if (targetStep?.isFreeGift && !this.isFreeGiftUnlocked) return false;
  return true;
},

getAddonTiers(step) {
  return getAddonTiersForStep(step);
},

getAddonTierEvaluation(step) {
  const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
    this.selectedProducts,
    this.stepProductData,
    this.selectedBundle?.steps
  );
  const withState = getAddonTierCandidatesWithState(step, totalPrice, totalQuantity);
  if (withState.length === 0) {
    return { tier: null, totalPrice, totalQuantity, currentValue: totalQuantity };
  }

  const eligible = withState
    .filter(candidate => candidate.isEligible)
    .sort((a, b) => (a.threshold - b.threshold) || (a.index - b.index));
  const next = withState
    .filter(candidate => !candidate.isEligible)
    .sort((a, b) => (a.threshold - b.threshold) || (a.index - b.index));
  const selected = eligible[eligible.length - 1] || next[0] || withState[0];

  return {
    tier: selected?.tier || null,
    tierIndex: selected?.index ?? -1,
    isEligible: selected?.isEligible === true,
    totalPrice,
    totalQuantity,
    currentValue: selected?.currentValue ?? totalQuantity,
  };
},

getAddonMessageTierEvaluation(step) {
  const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
    this.selectedProducts,
    this.stepProductData,
    this.selectedBundle?.steps
  );
  const withState = getAddonTierCandidatesWithState(step, totalPrice, totalQuantity);
  if (withState.length === 0) {
    return { tier: null, totalPrice, totalQuantity, currentValue: totalQuantity };
  }

  const next = withState
    .filter(candidate => !candidate.isEligible)
    .sort((a, b) => (a.threshold - b.threshold) || (a.index - b.index));
  const eligible = withState
    .filter(candidate => candidate.isEligible)
    .sort((a, b) => (a.threshold - b.threshold) || (a.index - b.index));
  const selected = next[0] || eligible[eligible.length - 1] || withState[0];

  return {
    tier: selected?.tier || null,
    tierIndex: selected?.index ?? -1,
    isEligible: selected?.isEligible === true,
    totalPrice,
    totalQuantity,
    currentValue: selected?.currentValue ?? totalQuantity,
  };
},

getAddonSummaryEligibilityStates(step) {
  const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
    this.selectedProducts,
    this.stepProductData,
    this.selectedBundle?.steps
  );
  const withState = getAddonTierCandidatesWithState(step, totalPrice, totalQuantity);
  const getEligibilityState = typeof this.getAddonEligibilityState === 'function'
    ? this.getAddonEligibilityState
    : fullPageValidationAddonsMethods.getAddonEligibilityState;

  return withState.map(candidate => getEligibilityState.call(this, step, {
    tier: candidate.tier,
    tierIndex: candidate.index,
    isEligible: candidate.isEligible === true,
    totalPrice,
    totalQuantity,
    currentValue: candidate.currentValue,
  }));
},

_getFreeGiftRemainingCount() {
  const steps = this.selectedBundle?.steps || [];
  const paidStepsComplete = this.paidSteps.every(paidStep => {
    const globalIndex = steps.indexOf(paidStep);
    return this.isStepCompleted(globalIndex);
  });

  if (hasConfiguredAddonRule(this.freeGiftStep)) {
    return this.getAddonEligibilityState(this.freeGiftStep).remainingQuantity;
  }

  if (paidStepsComplete) return 0;

  const total = this.paidSteps.reduce((sum, s) =>
    sum + (Number(s.conditionValue) || Number(s.minQuantity) || 1), 0);
  const selected = this.paidSteps.reduce((sum, paidStep) => {
    const globalIndex = steps.indexOf(paidStep);
    const stepSel = this.selectedProducts[globalIndex] ?? {};
    return sum + Object.values(stepSel).reduce((s, p) => s + (typeof p === 'number' ? p : (p.quantity || 1)), 0);
  }, 0);
  return Math.max(0, total - selected);
},

getAddonEligibilityState(step, evaluationOverride = null) {
  const evaluation = evaluationOverride || (typeof this.getAddonTierEvaluation === 'function'
    ? this.getAddonTierEvaluation(step)
    : fullPageValidationAddonsMethods.getAddonTierEvaluation.call(this, step));
  const tier = evaluation.tier;
  const condition = tier?.eligibilityCondition || step?.addonEligibilityCondition || {};
  const discount = tier?.discount || step?.addonDiscount || {};
  const conditionType = String(condition.type || 'QUANTITY').toUpperCase();
  const conditionValue = Number(condition.value || 0);
  const currencyInfo = CurrencyManager.getCurrencyInfo();
  const thresholdCents = conditionType === 'AMOUNT' ? Math.round(conditionValue * 100) : conditionValue;
  const currentValue = evaluation.currentValue;
  const remainingRaw = Math.max(0, thresholdCents - currentValue);
  const remainingQuantity = conditionType === 'AMOUNT' ? 0 : remainingRaw;
  const remainingAmount = conditionType === 'AMOUNT' ? remainingRaw : 0;
  const displayedRemainingAmount = Math.ceil(remainingAmount / 100);
  const discountValue = Number(discount.value || 0);
  const discountUnit = discount.type === 'PERCENTAGE' ? '%' : currencyInfo.display.symbol;

  const tierIndex = Number.isInteger(evaluation.tierIndex) ? evaluation.tierIndex : -1;
  const isEligible = evaluation.isEligible === true || remainingRaw <= 0;

  return {
    isEligible,
    tier,
    tierIndex,
    conditionType,
    remainingQuantity,
    remainingAmount,
    variables: {
      addonsConditionDiff: conditionType === 'AMOUNT'
        ? String(displayedRemainingAmount)
        : String(remainingQuantity),
      currencyUnit: currencyInfo.display.symbol,
      addonsDiscountValue: String(discountValue),
      addonsDiscountValueUnit: discountUnit,
      remainingQuantity: String(remainingQuantity),
      remainingAmount: String(displayedRemainingAmount),
      discountValue: String(discountValue),
      discountValueUnit: discountUnit,
    },
  };
},

getAddonMessageEligibilityState(step) {
  const evaluation = typeof this.getAddonMessageTierEvaluation === 'function'
    ? this.getAddonMessageTierEvaluation(step)
    : fullPageValidationAddonsMethods.getAddonMessageTierEvaluation.call(this, step);
  const getEligibilityState = typeof this.getAddonEligibilityState === 'function'
    ? this.getAddonEligibilityState
    : fullPageValidationAddonsMethods.getAddonEligibilityState;
  return getEligibilityState.call(this, step, evaluation);
},

getAddonLineDiscount(step) {
  const evaluation = typeof this.getAddonTierEvaluation === 'function'
    ? this.getAddonTierEvaluation(step)
    : fullPageValidationAddonsMethods.getAddonTierEvaluation.call(this, step);
  const tier = evaluation.tier;
  if (evaluation.isEligible !== true) return null;
  const discount = tier?.discount || step?.addonDiscount || {};
  const type = String(discount.type || '').toUpperCase();
  const value = Number(discount.value || 0);
  if (type !== 'PERCENTAGE' || !Number.isFinite(value) || value <= 0) return null;
  return { type, value: Math.min(100, value) };
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
  const chargeableAddonStep = steps.find(candidate => candidate?.isFreeGift === true && this.getAddonLineDiscount(candidate));
  const chargeableAddonStepIndex = steps.indexOf(chargeableAddonStep);
  return this.getAllSelectedProductsData().reduce((total, item) => {
    const itemStepIndex = Number(item.stepIndex);
    const isChargeableAddonItem = itemStepIndex === chargeableAddonStepIndex || (item.isFreeGift === true && item.addonDisplayFree !== true);
    if (!isChargeableAddonItem) return total;
    const step = steps[itemStepIndex] || chargeableAddonStep;
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
    addonDiscountAmount,
    finalPrice,
    discountPercentage: totalPrice > 0 ? (combinedDiscountAmount / totalPrice) * 100 : 0,
  };
},

renderAddonEligibilityMessage(step, eligibilityState) {
  const messages = step?.addonMessaging || {};
  const tierKey = eligibilityState?.tierIndex >= 0 ? `tier${eligibilityState.tierIndex + 1}` : 'tier1';
  const tierMessages = messages[tierKey] || messages.tier1 || {};
  const template = eligibilityState.isEligible
    ? tierMessages.eligibleState
    : tierMessages.ineligibleState;
  const defaultMessage = typeof this.getDefaultAddonTierMessage === 'function'
    ? this.getDefaultAddonTierMessage(eligibilityState)
    : fullPageValidationAddonsMethods.getDefaultAddonTierMessage(eligibilityState);
  const messageTemplate = template || defaultMessage;
  if (!messageTemplate) return '';

  return Object.entries(eligibilityState.variables).reduce((message, [key, value]) => {
    if (key === 'discountValue') {
      const unit = eligibilityState.variables.discountValueUnit || '';
      const displayValue = unit ? `${value}${unit}` : value;
      return message
        .replaceAll(`##${key}##`, value)
        .replaceAll(`{{${key}}}`, value)
        .replace(/\{discountValue\}(?!\s*(?:\{discountValueUnit\}|%|\$|€|£|₹|¥))/g, displayValue)
        .replaceAll(`{${key}}`, value);
    }
    return message
      .replaceAll(`##${key}##`, value)
      .replaceAll(`{{${key}}}`, value)
      .replaceAll(`{${key}}`, value);
  }, messageTemplate);
},

getDefaultAddonTierMessage(eligibilityState) {
  if (!eligibilityState) return '';
  if (eligibilityState.isEligible) {
    return 'Congrats you are eligible for ##addonsDiscountValue####addonsDiscountValueUnit## off on Add ons';
  }
  if (eligibilityState.conditionType === 'AMOUNT') {
    return 'Add product(s) worth at least ##addonsConditionDiff## ##currencyUnit## more to claim ##addonsDiscountValue####addonsDiscountValueUnit## off on Add ons';
  }
  return 'Add ##addonsConditionDiff## more product(s) to claim ##addonsDiscountValue####addonsDiscountValueUnit## off on Add ons';
},

renderAddonSectionTitle(step) {
  const title = step?.freeGiftName || step?.addonTitle || step?.addonLabel;
  if (typeof title !== 'string' || !title.trim()) return null;

  const titleEl = document.createElement('div');
  titleEl.className = 'side-panel-addon-title';
  titleEl.textContent = title.trim();
  return titleEl;
},

createAddonTierMessageElement(message, isEligible) {
  const messageCard = document.createElement('div');
  messageCard.className = isEligible
    ? 'side-panel-addon-message side-panel-addon-message--eligible'
    : 'side-panel-addon-message';
  messageCard.dataset.addonTierEligible = isEligible ? 'true' : 'false';

  const messageRow = document.createElement('div');
  messageRow.className = 'side-panel-addon-tier-message-container';

  const text = document.createElement('span');
  text.className = 'side-panel-free-gift-text';
  text.textContent = message;

  const icon = document.createElement('span');
  icon.className = 'side-panel-free-gift-icon';
  icon.setAttribute('aria-hidden', 'true');

  const bottomBar = document.createElement('div');
  bottomBar.className = 'side-panel-addon-tier-bottom-bar';

  messageRow.appendChild(text);
  messageRow.appendChild(icon);
  messageCard.appendChild(messageRow);
  messageCard.appendChild(bottomBar);
  return messageCard;
},

_initDefaultProducts() {
  const steps = this.selectedBundle?.steps || [];
  steps.forEach((step, stepIndex) => {
    if (!step.isDefault || !step.defaultVariantId) return;

    const targetId = this.extractId(step.defaultVariantId);
    if (!targetId) return;
    const allProducts = [...(step.products || []), ...(step.StepProduct || [])];
    const product = allProducts.find(p =>
      this.extractId(p.variantId) === targetId ||
      this.extractId(p.id) === targetId ||
      this.extractId(p.gid) === targetId ||
      (p.variants || []).some(v =>
        this.extractId(v.id) === targetId || this.extractId(v.gid) === targetId
      )
    );
    if (product) {
      if (!this.selectedProducts[stepIndex]) this.selectedProducts[stepIndex] = {};
      this.selectedProducts[stepIndex][targetId] = 1;
    }
  });
},

_syncFreeGiftLock() {
  if (!this.freeGiftStep || this.freeGiftStepIndex < 0) return;
  const addonEligible = !hasConfiguredAddonRule(this.freeGiftStep)
    || this.getAddonEligibilityState(this.freeGiftStep).isEligible;
  if (!this.isFreeGiftUnlocked || !addonEligible) {
    this.selectedProducts[this.freeGiftStepIndex] = {};
  }
},

_renderFreeGiftSection(container) {
  const step = this.freeGiftStep;
  if (!step) return;
  if (step.addonProductsEnabled === false) return;

  const section = document.createElement('div');
  const giftName = String(step.freeGiftName || 'gift').trim() || 'gift';
  const hasDirectAddonTiers = step.addonEligibilityCondition || Array.isArray(step.addonTiers);

  if (hasDirectAddonTiers) {
    const summaryStates = typeof this.getAddonSummaryEligibilityStates === 'function'
      ? this.getAddonSummaryEligibilityStates(step)
      : [];
    const fallbackState = summaryStates.length > 0
      ? null
      : (typeof this.getAddonMessageEligibilityState === 'function'
          ? this.getAddonMessageEligibilityState(step)
          : this.getAddonEligibilityState(step));
    const states = summaryStates.length > 0 ? summaryStates : [fallbackState].filter(Boolean);
    const messages = states
      .map(eligibilityState => ({
        eligibilityState,
        message: this.renderAddonEligibilityMessage(step, eligibilityState),
      }))
      .filter(({ message }) => Boolean(message));
    if (messages.length === 0) return;

    const title = this.renderAddonSectionTitle(step);
    const hasEligibleTier = messages.some(({ eligibilityState }) => eligibilityState.isEligible);
    section.className = hasEligibleTier
      ? 'side-panel-addon-summary side-panel-free-gift unlocked'
      : 'side-panel-addon-summary side-panel-free-gift';
    if (title) section.appendChild(title);
    const tierList = document.createElement('div');
    tierList.className = 'side-panel-addon-tier-list';
    const createMessageElement = typeof this.createAddonTierMessageElement === 'function'
      ? this.createAddonTierMessageElement
      : fullPageValidationAddonsMethods.createAddonTierMessageElement;
    messages.forEach(({ message, eligibilityState }) => {
      tierList.appendChild(createMessageElement.call(this, message, eligibilityState.isEligible));
    });
    section.appendChild(tierList);
    container.appendChild(section);
    return;
  }

  if (this.isFreeGiftUnlocked) {
    section.className = 'side-panel-free-gift unlocked';
    section.appendChild(createFreeGiftStatusIcon('unlocked'));
    section.appendChild(createFreeGiftStatusText(`Congrats! You're eligible for a FREE ${giftName}!`));
  } else {
    const remaining = this._getFreeGiftRemainingCount();
    section.className = 'side-panel-free-gift';
    section.appendChild(createFreeGiftStatusIcon('locked'));
    section.appendChild(createFreeGiftStatusText(
      `Add ${remaining} more product${remaining !== 1 ? 's' : ''} to claim a FREE ${giftName}!`
    ));
  }
  container.appendChild(section);
},

_renderStandardSidebarEmptySlots(container, options = {}) {
  const slotCount = this.getSummarySidebarMaxItemCount();
  const filledCount = Math.max(0, Number(options.filledCount || 0));
  const emptySlotCount = Math.max(0, slotCount - filledCount);
  const mode = options.mode || this.getSummarySidebarEmptyStateMode();

  if (mode === 'slots') {
    const emptyStateIconUrl = this._escapeHTML(this.selectedBundle?.productSlotIconUrl || '');
    const slots = document.createElement('div');
    slots.className = 'side-panel-inline-slots';

    for (let i = 0; i < emptySlotCount; i += 1) {
      const slot = document.createElement('div');
      slot.className = 'side-panel-inline-slot';
      slot.innerHTML = emptyStateIconUrl
        ? `<img class="side-panel-inline-slot-icon" src="${emptyStateIconUrl}" alt="" loading="lazy">`
        : '<span class="side-panel-inline-slot-placeholder">+</span>';
      slots.appendChild(slot);
    }

    if (slots.children.length > 0) {
      container.appendChild(slots);
    }
    return;
  }

  const emptyStateIconUrl = this._shouldRenderProductSlots()
    ? this._escapeHTML(this.selectedBundle?.productSlotIconUrl || '')
    : '';
  const thumbnailMarkup = emptyStateIconUrl
    ? `<img class="side-panel-product-img side-panel-product-slot-icon" src="${emptyStateIconUrl}" alt="" loading="lazy">`
    : '<div class="side-panel-product-img-placeholder side-panel-skeleton-thumb"></div>';

  for (let i = 0; i < slotCount; i += 1) {
    const slot = document.createElement('div');
    slot.className = 'side-panel-product-row side-panel-skeleton-slot side-panel-skeleton-slot--standard-empty';
    slot.innerHTML = `
      <div class="side-panel-product-img-wrap">
        ${thumbnailMarkup}
      </div>
      <div class="side-panel-product-info side-panel-skeleton-lines">
        <span class="side-panel-product-title side-panel-skeleton-line line-name"></span>
        <span class="side-panel-product-variant side-panel-skeleton-line line-variant"></span>
        <span class="side-panel-product-price side-panel-skeleton-line line-price"></span>
      </div>
      <span class="side-panel-product-remove side-panel-skeleton-remove"></span>
    `;
    container.appendChild(slot);
  }
},

_renderSidebarProductSkeletons(container) {
  const slotCount = this.getSummarySidebarMaxItemCount();
  for (let i = 0; i < slotCount; i++) {
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
},

_getSummarySidebarRequiredQuantity(step) {
  if (!step || step.enabled === false || step.isDefault || step.isFreeGift) return null;
  if (ConditionValidator.isCategoryRuleMode(step)) return null;

  let requiredQuantity = null;

  const pushLowerBound = (operator, value) => {
    if (!Number.isFinite(value) || value <= 0) {
      return;
    }

    if (operator === ConditionValidator.OPERATORS.EQUAL_TO) {
      requiredQuantity = Math.max(requiredQuantity ?? 0, value);
      return;
    }
    if (operator === ConditionValidator.OPERATORS.GREATER_THAN_OR_EQUAL_TO) {
      requiredQuantity = Math.max(requiredQuantity ?? 0, value);
    }
  };

  if (step.conditionOperator != null && step.conditionValue != null) {
    const primary = Number(step.conditionValue);
    pushLowerBound(step.conditionOperator, primary);
  }

  if (step.conditionOperator2 != null && step.conditionValue2 != null) {
    const secondary = Number(step.conditionValue2);
    pushLowerBound(step.conditionOperator2, secondary);
  }

  if (requiredQuantity != null && requiredQuantity > 0) {
    return requiredQuantity;
  }

  return null;
},

getSummarySidebarMaxItemCount(selectedCount = 0) {
  const steps = Array.isArray(this.selectedBundle?.steps) ? this.selectedBundle.steps : [];
  const selected = Number(selectedCount || 0);
  const boxRules = typeof this.getBoxSelectionRules === 'function'
    ? this.getBoxSelectionRules()
    : [];
  const selectedBoxQuantity = typeof this.getSelectedBoxSelectionQuantity === 'function'
    ? this.getSelectedBoxSelectionQuantity()
    : selected;
  const activeBoxRule = typeof this.getActiveBoxSelectionRule === 'function'
    ? this.getActiveBoxSelectionRule(boxRules, selectedBoxQuantity)
    : null;
  const activeBoxQuantity = Number(activeBoxRule?.boxQuantity || 0);
  if (activeBoxQuantity > 0) {
    return Math.max(activeBoxQuantity, selected, 1);
  }

  let totalRequired = 0;

  for (const step of steps) {
    const required = this._getSummarySidebarRequiredQuantity(step);
    if (Number.isFinite(required) && required > 0) {
      totalRequired += required;
    }
  }

  return Math.max(totalRequired, selected, 1);
},

getSummarySidebarEmptyStateMode() {
  return this._shouldRenderProductSlots?.() === true ? 'slots' : 'skeletons';
},
};

function isFullPageCartLineOutOfStock(context, product) {
  if (!product) return false;
  if (typeof context?.isVariantOutOfStock === 'function') {
    return context.isVariantOutOfStock(product);
  }
  if (product.available === false) return true;

  const controls = typeof context?._getLandingPageControls === 'function'
    ? context._getLandingPageControls()
    : null;
  return controls?.trackInventoryOnAddToCart === true
    && product.quantityAvailable === 0
    && product.currentlyNotInStock !== true;
}

function shouldIncludeBundleQuantityCartProperties(context) {
  const pricing = context?.selectedBundle?.pricing || {};
  const method = String(pricing.method || '').toLowerCase();
  const bundleQuantityOptions = pricing.messages?.displayOptions?.bundleQuantityOptions;
  return !(method === 'buy_x_get_y' && bundleQuantityOptions?.enabled === false);
}

const fullPageStepFooterMethods = {
  isSelectedAddonCartLine(step) {
    if (step?.isFreeGift !== true) return false;
    const addonEval = typeof this.getAddonTierEvaluation === 'function'
      ? this.getAddonTierEvaluation(step)
      : {};
    if (addonEval?.tier && addonEval?.isEligible !== false) return true;
    if (step?.addonDisplayFree === true) return false;
    if (typeof this.getAddonLineDiscount !== 'function') return true;
    return Boolean(this.getAddonLineDiscount(step));
  },

  buildCartLineSourceProperties(selectedLines) {
    const parentSelectedLines = selectedLines.filter((line) => {
      return !fullPageStepFooterMethods.isSelectedAddonCartLine.call(this, line?.step);
    });
    const totalPrice = parentSelectedLines.reduce((sum, line) => {
      const quantity = Number(line?.quantity || 0);
      const price = Number(line?.product?.price || 0);
      return sum + (price * quantity);
    }, 0);
    const totalQuantity = parentSelectedLines.reduce(
      (sum, line) => sum + Number(line?.quantity || 0),
      0
    );
    const unitPrices = [];
    parentSelectedLines.forEach((line) => {
      const quantity = Number(line?.quantity || 0);
      const price = Number(line?.product?.price || 0);
      for (let i = 0; i < quantity; i += 1) unitPrices.push(price);
    });
    const discountInfo = PricingCalculator.calculateDiscount(
      this.selectedBundle,
      totalPrice,
      totalQuantity,
      unitPrices
    );
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const discountAmount = Math.max(0, Number(discountInfo.discountAmount || 0));
    const discountPercentage = Number(discountInfo.discountPercentage || 0)
      || (totalPrice > 0 ? (discountAmount / totalPrice) * 100 : 0);
    const useDisplayOnlyFixedPrice = shouldDisplayClassicFixedBundleRawTotal(this, discountInfo);

    const sourceProperties = buildSharedCartLineSourceProperties({
      selectedLines: parentSelectedLines,
      retailPrice: useDisplayOnlyFixedPrice
        ? ''
        : CurrencyManager.convertAndFormat(totalPrice, currencyInfo),
      discountAmount: !useDisplayOnlyFixedPrice && discountAmount > 0
        ? CurrencyManager.convertAndFormat(discountAmount, currencyInfo)
        : '',
      discountPercentage,
      includeBox: shouldIncludeBundleQuantityCartProperties(this),
    });

    if (useDisplayOnlyFixedPrice) {
      sourceProperties._bundle_price_adjustment_mode = 'display_only';
    }

    return sourceProperties;
  },

buildCartLineDisplayProperties(displayProperties) {
  return buildSharedCartLineDisplayProperties(displayProperties, this.getCartLineLabels());
},

async addBundleToCart(clickedButton = null) {
  if (this._isWidgetActionBusy) return;
  const actionButton = clickedButton || this.container?.querySelector('.footer-btn-next');

  try {

    const allStepsValid = this.areBundleConditionsMet();
    if (!allStepsValid) {
      ToastManager.show('Please complete all bundle steps before adding to cart.');
      return;
    }

    const items = [];

    const bundleName = this.selectedBundle.name || 'Bundle';
    const sessionKey = this.generateBundleSessionKey();
    const offerId = this.resolveFullPageOfferId();
    const baseOfferId = `${offerId}_${sessionKey}`;
    const selectedLines = [];
    const unavailableLines = [];
    let itemNumber = 0;
    const hasAddonStepConfigured = (this.selectedBundle?.steps || []).some((candidateStep) => {
      return fullPageStepFooterMethods.isSelectedAddonCartLine.call(this, candidateStep);
    });
    let hasSelectedAddonLine = false;

    this.selectedBundle.steps.forEach((step, stepIndex) => {
      const stepSelections = this.selectedProducts[stepIndex] || {};
      const productsInStep = this.expandProductsByVariant(this.stepProductData[stepIndex] || []);

      Object.entries(stepSelections).forEach(([variantId, quantity]) => {
        if (quantity > 0) {

          const numericVariantId = this.extractId(variantId) || variantId;
          const product = productsInStep.find(p => String(p.variantId || p.id) === String(variantId))
            || { id: variantId, title: variantId };

          if (isFullPageCartLineOutOfStock(this, product)) {
            unavailableLines.push(product.title || variantId);
            return;
          }

          itemNumber += 1;
          const properties = {
            '_bundleName': bundleName,
            '_wolfpackProductBundle:prodQty': String(quantity),
            '_wolfpackProductBundle:OfferId': `${offerId}_${sessionKey}_${itemNumber}`
          };
          if (shouldIncludeBundleQuantityCartProperties(this)) {
            properties.Box = String(itemNumber);
          }
          const addonEval = this.getAddonTierEvaluation?.(step) || {};
          const addonDiscount = this.getAddonLineDiscount(step);
          const isAddonCartLine = fullPageStepFooterMethods.isSelectedAddonCartLine.call(this, step);
          if (isAddonCartLine && addonEval?.tier) {
            hasSelectedAddonLine = true;
            properties.Box = '1';
            properties._addon_product = 'true';
            properties._addon_offer_id = baseOfferId;
            properties._boxProduct = 'addonProduct';
            if (addonEval?.tier?.tierId) {
              properties._addonTierId = String(addonEval.tier.tierId);
            }
            const addonVariantId = this.extractId(variantId);
            properties._uniqueWpbItemKey = `${addonVariantId || numericVariantId}_pageId:addonProduct`;
            properties._bundle_step_type = addonDiscount
              ? `addon:${addonDiscount.type}:${addonDiscount.value}`
              : 'addon';
          } else if (step?.isFreeGift && step?.addonDisplayFree === true) {
            properties['_bundle_step_type'] = 'free_gift';
          }
          if (step?.isDefault) properties['_bundle_step_type'] = 'default';

          const cartItem = {
            id: numericVariantId,
            quantity: quantity,
            properties
          };
          const sellingPlanAllocationId = this.getSelectedSellingPlanAllocationId(product, variantId);
          if (sellingPlanAllocationId) {
            cartItem.selling_plan = parseInt(sellingPlanAllocationId);
          }

          items.push(cartItem);
          selectedLines.push({ product, quantity, step });
        }
      });
    });

    if (unavailableLines.length > 0) {
      ToastManager.show(`${unavailableLines[0]} is out of stock.`);
      return;
    }

    if (items.length === 0) {
      ToastManager.show('Please select products before adding to cart');
      return;
    }

    const sourceProperties = this.buildCartLineSourceProperties(selectedLines);
    const useDisplayOnlyFixedPrice = sourceProperties._bundle_price_adjustment_mode === 'display_only';
    items.forEach(item => {
      Object.assign(item.properties, sourceProperties);
      if (useDisplayOnlyFixedPrice && !item.properties._bundle_step_type) {
        item.properties._bundle_step_type = 'fixed_price_display_only';
      }
      if (hasSelectedAddonLine && hasAddonStepConfigured) {
        item.properties._addon_offer_id = item.properties._addon_offer_id || baseOfferId;
      }
    });

    this._setWidgetBusy(true, actionButton);
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

      await response.json();

      await this.syncBundleDetailsCartMetafield(`${offerId}_${sessionKey}`, sourceProperties);

      this._emitStorefrontEvent('bundle-add-to-cart-success', { itemCount: items.length, lineCount: selectedLines.length });

      ToastManager.show('Bundle added to cart successfully!');
      await this._handlePostAddToCartAction(this._getLandingPageControls()?.checkout);

    } catch (fetchError) {
      this._emitStorefrontEvent('bundle-add-to-cart-failed', { reason: 'fetch-error', message: String(fetchError && fetchError.message || fetchError) });
      ToastManager.show('Failed to add bundle to cart. Please try again.');
    } finally {
      this.hideLoadingOverlay();
      this._setWidgetBusy(false, actionButton);
    }

  } catch (error) {
    this._emitStorefrontEvent('bundle-add-to-cart-failed', { reason: 'validation-error', message: String(error && error.message || error) });
    ToastManager.show('Failed to add bundle to cart. Please try again.');
  }
},

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
},

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
},

getStepSelectionText(selectedProducts) {
  const totalSelected = Object.values(selectedProducts).reduce((sum, qty) => sum + (qty || 0), 0);
  return totalSelected > 0 ? `${totalSelected} selected` : '';
},

clearStepSelections(stepIndex) {

  this.selectedProducts[stepIndex] = {};

  this.renderSteps();
  this.updateFooterMessaging();

  ToastManager.show('All selections cleared from this step');
},

renderFooter() {
  const bundleType = this.container.dataset.bundleType;

  if (bundleType === 'full_page') {
    const layout = this.resolveFullPageLayout();
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
},

updateFooterMessaging() {

  if (!this.selectedBundle?.pricing?.enabled) {
    this.elements.footer.style.display = 'none';
    return;
  }

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
  const variables = TemplateManager.createDiscountVariables(
    this.selectedBundle,
    totalPrice,
    totalQuantity,
    combinedDiscountInfo,
    currencyInfo
  );

  const footerDiscountText = this.elements.footer.querySelector('.footer-discount-text');

  if (combinedDiscountInfo.qualifiesForDiscount) {

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
},

getDiscountProgressMilestones(totalPrice = 0, totalQuantity = 0) {
  const pricing = this.selectedBundle?.pricing;
  const rules = Array.isArray(pricing?.rules) ? pricing.rules : [];
  const tierTextByRuleId = pricing?.messages?.tierTextByRuleId || {};
  const boxRules = this.getBoxSelectionRules();

  return rules
    .filter(rule => rule && (rule.conditionType === 'quantity' || rule.conditionType === 'amount'))
    .sort((a, b) => (Number(a.conditionValue || 0) || 0) - (Number(b.conditionValue || 0) || 0))
    .map(rule => {
      const ruleId = String(rule.id || '');
      const threshold = Number(rule.conditionValue || 0) || 0;
      const tierText = tierTextByRuleId?.[ruleId] || {};
      const boxRule = boxRules.find(box => box.ruleId === ruleId);
      const discountMethod = pricing?.method || BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF;
      const discountValue = Number(rule.discountValue ?? rule.discount?.value ?? 0) || 0;
      const fallbackTitle = rule.conditionType === 'quantity' && threshold > 0
        ? `${threshold} Pack`
        : String(threshold);
      let fallbackSubTitle = '';
      if (discountValue > 0) {
        if (discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.PERCENTAGE_OFF) {
          fallbackSubTitle = `Save ${Math.round(discountValue)}%`;
        } else if (discountMethod === BUNDLE_WIDGET.DISCOUNT_METHODS.FIXED_AMOUNT_OFF) {
          fallbackSubTitle = `Save ${CurrencyManager.convertAndFormat(discountValue, CurrencyManager.getCurrencyInfo())}`;
        }
      }
      const isReached = rule.conditionType === 'amount'
        ? Number(totalPrice || 0) >= threshold
        : Number(totalQuantity || 0) >= threshold;

      return {
        ruleId,
        title: tierText.tierText || boxRule?.boxLabel || fallbackTitle,
        subTitle: tierText.tierSubtext || boxRule?.boxSubtext || fallbackSubTitle,
        isReached,
      };
    })
    .filter(milestone => milestone.ruleId && milestone.title);
},

};

const fullPageDiscountModalMethods = {
_renderDiscountProgress(options = {}) {
  const placement = options.placement || "default";
  const providedCombinedDiscountInfo = options.combinedDiscountInfo;
  const providedTotalPrice = options.totalPrice;
  const providedTotalQuantity = options.totalQuantity;
  const providedUnitPrices = options.unitPrices;

  if (!this.selectedBundle?.pricing?.enabled) return null;

  const { totalPrice, totalQuantity, unitPrices } = typeof providedTotalPrice === 'number' && typeof providedTotalQuantity === 'number'
    ? {
        totalPrice: providedTotalPrice,
        totalQuantity: providedTotalQuantity,
        unitPrices: providedUnitPrices || []
      }
    : PricingCalculator.calculateBundleTotal(
        this.selectedProducts,
        this.stepProductData,
        this.selectedBundle?.steps
      );
  const discountInfo = providedCombinedDiscountInfo ?? this.getDiscountInfoWithSelectedAddonDiscount(
    PricingCalculator.calculateDiscount(
      this.selectedBundle, totalPrice, totalQuantity, unitPrices
    ),
    totalPrice
  );
  const currencyInfo = CurrencyManager.getCurrencyInfo();
  const variables = TemplateManager.createDiscountVariables(
    this.selectedBundle, totalPrice, totalQuantity, discountInfo, currencyInfo
  );

  const isReached = discountInfo.hasDiscount;
  const progressPct = isReached ? 100 : Math.min(100, Math.max(0, parseInt(variables.progressPercentage, 10) || 0));

  const progressBarType = this.config.discountProgressBarType === 'simple' ? 'simple' : 'step_based';
  const milestones = progressBarType === 'step_based'
    ? this.getDiscountProgressMilestones(totalPrice, totalQuantity)
    : [];

  let message = '';
  if (progressBarType === 'step_based' && milestones.length > 0) {
    message = '';
  } else if (isReached) {
    message = TemplateManager.replaceVariables(
      this.config.discountProgressSuccessTemplate || this.config.successMessageTemplate || '🎉 You\'ve unlocked {{discountText}}!',
      variables
    );
  } else {
    const nextRule = PricingCalculator.getNextDiscountRule?.(this.selectedBundle, totalQuantity);
    if (!nextRule) return null;
    message = TemplateManager.replaceVariables(
      this.config.discountProgressTextTemplate || this.config.discountTextTemplate || 'Add {{conditionText}} to get {{discountText}}',
      variables
    );
  }

  const progressData = getDiscountProgressData({
    currentValue: progressPct,
    targetValue: 100,
    message,
  });
  progressData.success = isReached;
  progressData.milestones = progressBarType === 'step_based' ? milestones : [];

  const wrapper = document.createElement('div');
  wrapper.innerHTML = renderDiscountProgress(progressData, {
    mode: progressBarType === 'simple' ? 'bar' : 'stepped',
    messagePlacement: placement === 'sidebar' ? 'external' : 'inline',
    className: progressBarType === 'simple'
      ? `fpb-discount-progress fpb-dp-simple${isReached ? ' reached' : ''}`
      : `fpb-discount-progress fpb-dp-step_based${isReached ? ' reached' : ''}`,
    messageClassName: 'fpb-dp-row fpb-dp-message',
    trackClassName: 'fpb-dp-track',
    fillClassName: 'fpb-dp-fill',
    milestoneListClassName: 'fpb-discount-step-list',
    milestoneClassName: 'fpb-discount-step',
    milestoneReachedClassName: 'fpb-discount-step-reached',
    milestoneTitleClassName: 'fpb-discount-step-title',
    milestoneSubtitleClassName: 'fpb-discount-step-subtitle',
    renderInlineSubtitles: placement !== 'sidebar',
    renderSubtitleList: placement === 'sidebar' && milestones.some(milestone => milestone.subTitle),
    subtitleListClassName: placement === 'sidebar' ? 'fpb-discount-step-subtitle-list' : '',
  }).trim();
  const bar = wrapper.firstElementChild;
  bar?.style?.setProperty('--fpb-discount-progress-width', progressPct + '%');
  return bar;
},

_renderDiscountProgressBanner() {
  if (!this.selectedBundle?.pricing?.enabled) return null;

  const { totalPrice, totalQuantity, unitPrices } = PricingCalculator.calculateBundleTotal(
    this.selectedProducts,
    this.stepProductData,
    this.selectedBundle?.steps
  );
  const discountInfo = this.getDiscountInfoWithSelectedAddonDiscount(
    PricingCalculator.calculateDiscount(
      this.selectedBundle, totalPrice, totalQuantity, unitPrices
    ),
    totalPrice
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
},

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
},

getFormattedHeaderText() {

  if (!this.selectedBundle?.pricing?.enabled) {
    const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
    return this._escapeHTML(currentStep?.name) || `Step ${this.currentStepIndex + 1}`;
  }

  const { totalQuantity, totalPrice, unitPrices } = PricingCalculator.calculateBundleTotal(
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
  const variables = TemplateManager.createDiscountVariables(
    this.selectedBundle,
    totalPrice,
    totalQuantity,
    combinedDiscountInfo,
    currencyInfo
  );

  return TemplateManager.replaceVariables(
    this.config.discountTextTemplate,
    variables
  );
},

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
},

closeModal() {
  this.elements.modal.style.display = 'none';
  this.elements.modal.classList.remove('active');
  document.body.style.overflow = '';

  this.renderSteps();
  this.updateFooterMessaging();
},

resolveStorefrontApiBase() {
  const appProxyPrefix = '/apps/product-bundles';
  if (window.location?.pathname?.startsWith(`${appProxyPrefix}/`)) {
    return appProxyPrefix;
  }

  const configuredAppUrl = window.__BUNDLE_APP_URL__ || '';
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

  if (shopDomain && configuredAppHost !== currentHost) {
    return appProxyPrefix;
  }

  return configuredAppUrl || window.location.origin;
},
};

const CLEAR_CART_CONFIRMATION_COPY = {
  title: 'Are you sure?',
  description: 'Are you sure you want to clear all items from your cart? This action cannot be undone...',
  cancel: 'Cancel',
  confirm: 'Clear Cart',
};

function createIconButtonSvg(path) {
  return `<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">${path}</svg>`;
}

const CLOSE_ICON = createIconButtonSvg(
  '<path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>'
);

const DELETE_ICON = createIconButtonSvg(
  '<path d="M6 2h8a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1Zm-2 3h12l-1 13H5L4 5Zm4 2v9m4-9v9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>'
);

const fullPageClearCartConfirmationMethods = {
showClearCartConfirmation() {
  this.hideClearCartConfirmation?.();

  const modal = this.createClearCartConfirmationModal();
  this._clearCartConfirmationModal = modal;
  document.body.appendChild(modal);
  document.body.classList?.add('wpb-clear-cart-confirmation-open');

  const keydownHandler = (event) => {
    if (event.key === 'Escape') {
      this.hideClearCartConfirmation();
    }
  };
  this._clearCartConfirmationKeydownHandler = keydownHandler;
  document.addEventListener('keydown', keydownHandler);

  const cancelButton = modal.querySelector('.wpb-clear-cart-confirmation__cancel');
  if (typeof cancelButton?.focus === 'function') {
    cancelButton.focus();
  }
},

hideClearCartConfirmation() {
  if (this._clearCartConfirmationModal) {
    this._clearCartConfirmationModal.remove();
    this._clearCartConfirmationModal = null;
  }

  if (this._clearCartConfirmationKeydownHandler) {
    document.removeEventListener('keydown', this._clearCartConfirmationKeydownHandler);
    this._clearCartConfirmationKeydownHandler = null;
  }

  document.body.classList?.remove('wpb-clear-cart-confirmation-open');
},

confirmClearCartSelection() {
  this.hideClearCartConfirmation();
  this.clearFullPageSelections();
},

clearFullPageSelections() {
  const steps = Array.isArray(this.selectedBundle?.steps) ? this.selectedBundle.steps : [];
  this.selectedProducts = steps.map(() => ({}));
  this.currentStepIndex = 0;
  this.searchQuery = '';
  this.activeCollectionId = null;
  this.compactMobileSummaryTrayExpanded = false;

  if (typeof this.reRenderFullPage === 'function') {
    this.reRenderFullPage();
  }
},

createClearCartConfirmationModal() {
  const modal = document.createElement('div');
  modal.className = 'wpb-clear-cart-confirmation';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'wpb-clear-cart-confirmation-title');
  modal.setAttribute('aria-describedby', 'wpb-clear-cart-confirmation-description');

  const container = document.createElement('div');
  container.className = 'wpb-clear-cart-confirmation__container';

  const closeButton = document.createElement('button');
  closeButton.className = 'wpb-clear-cart-confirmation__close';
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.innerHTML = CLOSE_ICON;
  closeButton.addEventListener('click', () => this.hideClearCartConfirmation());

  const content = document.createElement('div');
  content.className = 'wpb-clear-cart-confirmation__content';

  const title = document.createElement('h2');
  title.id = 'wpb-clear-cart-confirmation-title';
  title.className = 'wpb-clear-cart-confirmation__title';
  title.textContent = CLEAR_CART_CONFIRMATION_COPY.title;

  const description = document.createElement('p');
  description.id = 'wpb-clear-cart-confirmation-description';
  description.className = 'wpb-clear-cart-confirmation__description';
  description.textContent = CLEAR_CART_CONFIRMATION_COPY.description;

  const footer = document.createElement('div');
  footer.className = 'wpb-clear-cart-confirmation__footer';

  const cancelButton = document.createElement('button');
  cancelButton.className = 'wpb-clear-cart-confirmation__cancel';
  cancelButton.type = 'button';
  cancelButton.textContent = CLEAR_CART_CONFIRMATION_COPY.cancel;
  cancelButton.addEventListener('click', () => this.hideClearCartConfirmation());

  const confirmButton = document.createElement('button');
  confirmButton.className = 'wpb-clear-cart-confirmation__confirm';
  confirmButton.type = 'button';
  confirmButton.innerHTML = `${DELETE_ICON}<span>${CLEAR_CART_CONFIRMATION_COPY.confirm}</span>`;
  confirmButton.addEventListener('click', () => this.confirmClearCartSelection());

  content.append(title, description);
  footer.append(cancelButton, confirmButton);
  container.append(closeButton, content, footer);
  modal.appendChild(container);

  return modal;
},
};

function extractFullPageId(idString) {
  if (!idString) return null;
  const gidMatch = idString.toString().match(/gid:\/\/shopify\/\w+\/(\d+)/);
  if (gidMatch) return gidMatch[1];
  return idString.toString().split('/').pop();
}

function collectProductSelectionKeys(product) {
  const keys = new Set();
  const addKey = (value) => {
    if (value === null || value === undefined || value === '') return;
    const normalized = extractFullPageId(value) || value;
    keys.add(String(normalized));
  };

  addKey(product?.id);
  addKey(product?.productId);
  addKey(product?.graphqlId);
  addKey(product?.variantId);
  addKey(product?.variantGraphqlId);
  (Array.isArray(product?.variants) ? product.variants : []).forEach(variant => {
    addKey(variant?.id);
    addKey(variant?.variantId);
    addKey(variant?.variantGraphqlId);
    addKey(variant?.admin_graphql_api_id);
  });

  return keys;
}

function pruneStepSelectionsToProducts(selectedProducts, stepIndex, products) {
  const selections = selectedProducts?.[stepIndex];
  if (!selections) return;

  const allowedKeys = new Set();
  products.forEach(product => {
    collectProductSelectionKeys(product).forEach(key => allowedKeys.add(key));
  });

  Object.keys(selections).forEach(key => {
    if (!allowedKeys.has(String(key))) {
      delete selections[key];
    }
  });
}

function normalizeWeightToGrams(weight, unit) {
  const numeric = Number(weight);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;

  switch (String(unit || '').toUpperCase()) {
    case 'KILOGRAMS':
    case 'KILOGRAM':
    case 'KG':
      return numeric * 1000;
    case 'POUNDS':
    case 'POUND':
    case 'LB':
    case 'LBS':
      return numeric * 453.59237;
    case 'OUNCES':
    case 'OUNCE':
    case 'OZ':
      return numeric * 28.349523125;
    case 'GRAMS':
    case 'GRAM':
    case 'G':
    default:
      return numeric;
  }
}

function isTrackedZeroStock(product) {
  return product?.quantityAvailable === 0 && product?.currentlyNotInStock !== true;
}

function getVariantSelectedOptionValue(variant, index) {
  const directValue = variant?.[`option${index}`];
  if (directValue) return directValue;

  const selectedOptions = Array.isArray(variant?.selectedOptions) ? variant.selectedOptions : [];
  const selectedOption = selectedOptions[index - 1];
  if (selectedOption?.value) return selectedOption.value;

  const titleParts = typeof variant?.title === 'string'
    ? variant.title.split(' / ').map(part => part.trim()).filter(Boolean)
    : [];
  return titleParts[index - 1] || null;
}

function deriveProductOptionNames(product) {
  const explicitOptions = (Array.isArray(product?.options) ? product.options : [])
    .map(option => {
      if (typeof option === 'string') return option;
      return option?.name || option;
    })
    .filter(Boolean);
  if (explicitOptions.length > 0) return explicitOptions;

  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const optionNames = [];
  variants.forEach(variant => {
    const selectedOptions = Array.isArray(variant?.selectedOptions) ? variant.selectedOptions : [];
    selectedOptions.forEach((option, index) => {
      if (!optionNames[index] && option?.name) optionNames[index] = option.name;
    });
  });
  if (optionNames.filter(Boolean).length > 0) return optionNames.filter(Boolean);

  const maxTitleParts = variants.reduce((max, variant) => {
    if (typeof variant?.title !== 'string' || variant.title === 'Default Title') return max;
    return Math.max(max, variant.title.split(' / ').filter(Boolean).length);
  }, 0);

  return Array.from({ length: maxTitleParts }, (_, index) => `Option ${index + 1}`);
}

function normalizeProductDescription(product) {
  const directDescription = typeof product?.description === 'string'
    ? product.description.trim()
    : '';
  if (directDescription) return directDescription;

  const htmlDescription = typeof product?.descriptionHtml === 'string'
    ? product.descriptionHtml.trim()
    : '';
  if (!htmlDescription || typeof document === 'undefined') return '';

  const scratch = document.createElement('div');
  scratch.innerHTML = htmlDescription;
  return (scratch.textContent || '').trim();
}

function collectCategoryProducts(step) {
  if (!Array.isArray(step?.categories)) return [];

  const products = [];
  step.categories.forEach(category => {
    if (!category || typeof category !== 'object') return;
    if (Array.isArray(category.products)) products.push(...category.products);
    if (Array.isArray(category.selectedProducts)) products.push(...category.selectedProducts);
  });
  return products;
}

function productLookupKey(product) {
  return extractFullPageId(product?.id || product?.productId || product?.graphqlId);
}

function productGraphqlId(product) {
  const rawId = product?.graphqlId || product?.productId || product?.id;
  if (!rawId) return null;
  const normalized = String(rawId);
  if (normalized.startsWith('gid://shopify/Product/')) return normalized;
  if (/^\d+$/.test(normalized)) return `gid://shopify/Product/${normalized}`;
  return null;
}

function variantLookupKey(variant) {
  return extractFullPageId(
    variant?.id
    || variant?.variantId
    || variant?.variantGraphqlId
    || variant?.graphqlId
    || variant?.admin_graphql_api_id
  );
}

function mergeVariantRuntimeAvailability(product, categoryProduct) {
  if (!Array.isArray(product?.variants) || !Array.isArray(categoryProduct?.variants)) return product;

  const categoryVariantsById = new Map();
  categoryProduct.variants.forEach(variant => {
    const key = variantLookupKey(variant);
    if (key) categoryVariantsById.set(key, variant);
  });
  if (categoryVariantsById.size === 0) return product;

  let changed = false;
  const variants = product.variants.map(variant => {
    const source = categoryVariantsById.get(variantLookupKey(variant));
    if (!source) return variant;

    const patch = {};
    if (source.available === true || source.available === false) patch.available = source.available;
    if (typeof source.quantityAvailable === 'number') patch.quantityAvailable = source.quantityAvailable;
    if (source.currentlyNotInStock === true || source.currentlyNotInStock === false) {
      patch.currentlyNotInStock = source.currentlyNotInStock;
    }
    if (Object.keys(patch).length === 0) return variant;

    changed = true;
    return { ...variant, ...patch };
  });

  if (!changed) return product;
  return {
    ...product,
    variants,
    available: variants.some(variant => variant.available !== false),
  };
}

function normalizeFullPageDirectDefaultProduct(product) {
  const variant = Array.isArray(product?.variants) ? product.variants[0] : null;
  const variantId = extractFullPageId(variant?.variantGraphqlId || variant?.variantId || variant?.id);
  if (!variantId) return null;

  const imageUrl = product.images?.[0]?.originalSrc
    || product.images?.[0]?.url
    || product.imageUrl
    || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
  const inventoryQuantity = typeof variant?.inventoryQuantity === 'number'
    ? variant.inventoryQuantity
    : null;
  const price = Number.parseFloat(variant?.price || product?.price || '0') * 100;
  const requiredQuantity = Number(product.requiredQuantity || 1) || 1;
  const explicitlyUnavailable = variant?.availableForSale === false || variant?.available === false;
  const available = !explicitlyUnavailable;
  const quantityAvailable = inventoryQuantity;

  return {
    id: extractFullPageId(product.graphqlId || product.productId) || product.productId || variantId,
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
    isDirectDefaultProduct: true,
    variants: [{
      id: variantId,
      title: variant?.title || variant?.variantTitle || '',
      price,
      compareAtPrice: null,
      available,
      quantityAvailable,
      currentlyNotInStock: false,
    }],
    images: imageUrl ? [{ src: imageUrl }] : [],
    description: normalizeProductDescription(product),
  };
}

const fullPageProductProcessingMethods = {
mergeCategoryProductVariantAvailability(products, step) {
  if (!Array.isArray(products) || products.length === 0) return products;

  const categoryProductsByKey = new Map();
  collectCategoryProducts(step).forEach(product => {
    const key = productLookupKey(product);
    if (key && !categoryProductsByKey.has(key)) categoryProductsByKey.set(key, product);
  });
  if (categoryProductsByKey.size === 0) return products;

  return products.map(product => {
    const key = productLookupKey(product);
    const categoryProduct = key ? categoryProductsByKey.get(key) : null;
    return categoryProduct ? mergeVariantRuntimeAvailability(product, categoryProduct) : product;
  });
},

async loadStepProducts(stepIndex) {
  const step = this.selectedBundle.steps[stepIndex];

  if (this.stepProductData[stepIndex].length > 0) {
    return;
  }

  let allProducts = [];

  if (step?.isFreeGift && Array.isArray(step.addonTiers)) {
    const evaluation = typeof this.getAddonTierEvaluation === 'function'
      ? this.getAddonTierEvaluation(step)
      : { tier: null, isEligible: false };
    const activeTier = evaluation?.isEligible === true ? evaluation.tier : null;
    const activeProducts = Array.isArray(activeTier?.selectedAddonProducts)
      ? activeTier.selectedAddonProducts
      : [];
    allProducts = activeProducts.map(product =>
      typeof this.normalizePersonalizationAddonProduct === 'function'
        ? this.normalizePersonalizationAddonProduct(product)
        : product
    );
    step.StepProduct = allProducts;
    step.products = allProducts;
    step.maxQuantity = allProducts.length;
    step.displayVariantsAsIndividual = activeTier?.displayVariantsAsIndividualProducts_addons === true;
    const activeDiscount = activeTier?.discount || {};
    step.addonDisplayFree = activeDiscount.type === 'PERCENTAGE' && Number(activeDiscount.value || 0) >= 100;
  }

  const hasEnrichedStepProducts = !step?.isFreeGift && Array.isArray(step.StepProduct) && step.StepProduct.length > 0
    && step.StepProduct.some(sp => sp.title && sp.imageUrl);

  const stepProductsAlreadyEnriched = !step?.isFreeGift && Array.isArray(step.products) && step.products.length > 0
    && step.products.some(p => (Array.isArray(p.images) && p.images.length > 0) || p.featuredImage);
  const shouldRefreshRuntimeInventory = hasEnrichedStepProducts
    && fullPageProductProcessingMethods.isInventoryTrackingOnAddToCartEnabled.call(this);
  const refreshedProductKeys = new Set();
  const productIds = !step?.isFreeGift ? this.collectStepProductIds(step) : [];
  if (!step?.isFreeGift && Array.isArray(step.StepProduct)) {
    step.StepProduct.forEach(product => {
      const id = product?.productId || product?.graphqlId || product?.id;
      if (id && !productIds.includes(id)) productIds.push(id);
    });
  }

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
  } else if (!step?.isFreeGift) {
    if ((!hasEnrichedStepProducts || shouldRefreshRuntimeInventory) && productIds.length > 0) {
      const shop = window.Shopify?.shop || window.location.host;

      const apiBaseUrl = this.resolveStorefrontApiBase();

      const country = window.Shopify?.country
        || (window.Shopify?.locale?.includes('-') ? window.Shopify.locale.split('-')[1] : null)
        || null;

      try {
        const countryParam = country ? `&country=${encodeURIComponent(country)}` : '';
        const response = await fetch(`${apiBaseUrl}/api/storefront-products?ids=${encodeURIComponent(productIds.join(','))}&shop=${encodeURIComponent(shop)}${countryParam}`);

        if (!response.ok) {
          await response.text();
        } else {
          const data = await response.json();

          if (data.products && data.products.length > 0) {
            allProducts = allProducts.concat(data.products);
            if (typeof this.rememberRuntimeProductInventory === 'function') {
              this.rememberRuntimeProductInventory(data.products);
            }
            if (shouldRefreshRuntimeInventory) {
              data.products.forEach(product => {
                const key = productLookupKey(product);
                if (key) refreshedProductKeys.add(key);
              });
            }
          }
        }
      } catch (error) {
      }
    }
  }

  if (!step?.isFreeGift && allProducts.length === 0 && Array.isArray(step.categories)) {
    const hasRenderableCachedProductData = (product) => Boolean(
      product
      && typeof product === 'object'
      && (
        (Array.isArray(product.variants) && product.variants.length > 0)
        || (Array.isArray(product.images) && product.images.length > 0)
        || product.imageUrl
        || product.featuredImage
        || product.price
      )
    );

    step.categories.forEach(category => {
      (category.products || []).forEach(product => {
        if (hasRenderableCachedProductData(product)) allProducts.push(product);
      });
      (category.selectedProducts || []).forEach(product => {
        if (hasRenderableCachedProductData(product)) allProducts.push(product);
      });
    });
  }

  if (!step?.isFreeGift && step.StepProduct && Array.isArray(step.StepProduct) && step.StepProduct.length > 0) {

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
      })).filter(product => {
        const key = productLookupKey(product);
        return !key || !refreshedProductKeys.has(key);
      });

      allProducts = allProducts.concat(enrichedProducts);
    } else {

      const productGids = step.StepProduct.map(sp => sp.productId).filter(Boolean);
      const shop = window.Shopify?.shop || window.location.host;

      if (productGids.length > 0) {

        const apiBaseUrl = this.resolveStorefrontApiBase();

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
              if (typeof this.rememberRuntimeProductInventory === 'function') {
                this.rememberRuntimeProductInventory(data.products);
              }
            }
          }
        } catch (error) {
        }
      }
    }
  }

  const collectionHandles = step?.isFreeGift ? [] : this.collectStepCollectionHandles(step);
  if (collectionHandles.length > 0) {
    const shop = window.Shopify?.shop || window.location.host;
    const apiBaseUrl = this.resolveStorefrontApiBase();

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/storefront-collections?handles=${encodeURIComponent(collectionHandles.join(','))}&shop=${encodeURIComponent(shop)}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.products && data.products.length > 0) {
          allProducts = allProducts.concat(data.products);
          if (typeof this.rememberRuntimeProductInventory === 'function') {
            this.rememberRuntimeProductInventory(data.products);
          }
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

  allProducts = await this.enrichMissingProductDescriptions(allProducts);

  allProducts = this.mergeCategoryProductVariantAvailability(allProducts, step);

  const processedProducts = this._mergeDirectDefaultProductsIntoStep(
    stepIndex,
    this.processProductsForStep(allProducts, step),
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

  if (step?.isFreeGift && Array.isArray(step.addonTiers)) {
    step.maxQuantity = this.stepProductData[stepIndex].length;
    pruneStepSelectionsToProducts(this.selectedProducts, stepIndex, this.stepProductData[stepIndex]);
  }

},

_getDirectDefaultProductsData() {
  const data = this.selectedBundle?.defaultProductsData;
  if (!data || data.isDefaultProductsEnabled !== true || !Array.isArray(data.products)) {
    return null;
  }
  return data;
},

_getDirectDefaultProductItems() {
  const data = this._getDirectDefaultProductsData();
  if (!data) return [];
  return data.products
    .map(product => normalizeFullPageDirectDefaultProduct(product))
    .filter(Boolean);
},

_initDirectDefaultProducts() {
  this.directDefaultProducts = this._getDirectDefaultProductItems();
  if (this.directDefaultProducts.length === 0 || !this.selectedProducts[0]) return;

  this.directDefaultProducts.forEach(product => {
    this.selectedProducts[0][product.variantId] = product.defaultRequiredQuantity || 1;
  });
},

_mergeDirectDefaultProductsIntoStep(stepIndex, products) {
  if (stepIndex !== 0 || !Array.isArray(this.directDefaultProducts) || this.directDefaultProducts.length === 0) {
    return products;
  }

  const directDefaultsByVariant = new Map(
    this.directDefaultProducts
      .filter(product => product?.variantId)
      .map(product => [String(product.variantId), product])
  );
  const seenDirectDefaults = new Set();
  const mergedProducts = products.map(product => {
    const key = String(product?.variantId || product?.id || '');
    const directDefault = directDefaultsByVariant.get(key);
    if (!directDefault) return product;

    seenDirectDefaults.add(key);
    return {
      ...product,
      defaultRequiredQuantity: directDefault.defaultRequiredQuantity,
      isDirectDefaultProduct: true,
    };
  });

  const unmatchedDirectDefaults = this.directDefaultProducts.filter(product => {
    const key = String(product?.variantId || '');
    return key && !seenDirectDefaults.has(key);
  });

  return mergedProducts.concat(unmatchedDirectDefaults);
},

_getDirectDefaultSelectionQuantities(stepIndex) {
  if (stepIndex !== 0 || !Array.isArray(this.directDefaultProducts)) return {};
  return this.directDefaultProducts.reduce((quantities, product) => {
    if (product?.variantId) {
      quantities[String(product.variantId)] = product.defaultRequiredQuantity || 1;
    }
    return quantities;
  }, {});
},

_getStepConditionSelections(stepIndex, selections = this.selectedProducts?.[stepIndex] || {}) {
  const directDefaults = this._getDirectDefaultSelectionQuantities(stepIndex);
  if (Object.keys(directDefaults).length === 0) return selections;

  return Object.entries(selections || {}).reduce((filtered, [variantId, quantity]) => {
    const directDefaultQuantity = Number(directDefaults[String(variantId)] || 0);
    const conditionQuantity = Math.max(0, Number(quantity || 0) - directDefaultQuantity);
    if (conditionQuantity > 0) filtered[variantId] = conditionQuantity;
    return filtered;
  }, {});
},

shouldExpandStepProductsDuringLoad(step) {
  const hasCategoryProducts = Array.isArray(step?.categories) && step.categories.some(category =>
    (Array.isArray(category.products) && category.products.length > 0)
    || (Array.isArray(category.selectedProducts) && category.selectedProducts.length > 0)
    || (Array.isArray(category.collections) && category.collections.length > 0)
    || (Array.isArray(category.collectionsData) && category.collectionsData.length > 0)
    || (Array.isArray(category.collectionsSelectedData) && category.collectionsSelectedData.length > 0)
  );

  if (hasCategoryProducts) {
    return false;
  }

  return step?.displayVariantsAsIndividualProducts === true || step?.displayVariantsAsIndividual === true;
},

getFirstAvailableVariant(product) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  if (variants.length === 0) {
    return null;
  }

  return variants.find(variant => this.isVariantSelectableForInventory(variant)) || null;
},

rememberRuntimeProductInventory(products) {
  if (!Array.isArray(products) || products.length === 0) return;
  if (!this._fpbRuntimeVariantInventoryById) {
    this._fpbRuntimeVariantInventoryById = {};
  }

  products.forEach(product => {
    (Array.isArray(product?.variants) ? product.variants : []).forEach(variant => {
      const key = variantLookupKey(variant);
      if (!key) return;
      this._fpbRuntimeVariantInventoryById[key] = {
        available: variant.available === true,
        quantityAvailable: typeof variant.quantityAvailable === 'number' ? variant.quantityAvailable : null,
        currentlyNotInStock: variant.currentlyNotInStock === true,
      };
    });
  });
},

getRuntimeVariantInventory(productOrVariant) {
  const key = variantLookupKey(productOrVariant);
  if (!key) return null;
  return this._fpbRuntimeVariantInventoryById?.[key] || null;
},

isInventoryTrackingOnAddToCartEnabled() {
  const controls = typeof this._getLandingPageControls === 'function'
    ? this._getLandingPageControls()
    : null;
  return controls?.trackInventoryOnAddToCart === true;
},

isVariantSelectableForInventory(variant) {
  const runtimeInventory = typeof this.getRuntimeVariantInventory === 'function'
    ? this.getRuntimeVariantInventory(variant)
    : null;
  const candidate = runtimeInventory ? { ...variant, ...runtimeInventory } : variant;

  if (candidate?.available !== true) {
    return false;
  }
  const trackInventoryOnAddToCart = typeof this.isInventoryTrackingOnAddToCartEnabled === 'function'
    ? this.isInventoryTrackingOnAddToCartEnabled()
    : fullPageProductProcessingMethods.isInventoryTrackingOnAddToCartEnabled.call(this);
  if (!trackInventoryOnAddToCart) {
    return true;
  }
  return !isTrackedZeroStock(candidate);
},

processProductsForStep(products, step) {

  const normalizeVariant = (v) => {
    const quantityAvailable = typeof v.quantityAvailable === 'number' ? v.quantityAvailable : null;
    const currentlyNotInStock = v.currentlyNotInStock === true;
    return {
      id: this.extractId(v.id),
      title: v.title,
      price: parseFloat(v.price || '0') * 100,
      compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) * 100 : null,
      sellingPlanAllocations: Array.isArray(v.sellingPlanAllocations)
        ? v.sellingPlanAllocations
        : [],
      available: v.available === true && (
        !fullPageProductProcessingMethods.isInventoryTrackingOnAddToCartEnabled.call(this)
        || !(quantityAvailable === 0 && currentlyNotInStock !== true)
      ),
      quantityAvailable,
      currentlyNotInStock,
      weight: normalizeWeightToGrams(v.weight, v.weightUnit),
      weightUnit: 'GRAMS',
      option1: getVariantSelectedOptionValue(v, 1),
      option2: getVariantSelectedOptionValue(v, 2),
      option3: getVariantSelectedOptionValue(v, 3),
      image: v.image || null
    };
  };

  return products.flatMap(product => {
    if (this.shouldExpandStepProductsDuringLoad(step) && product.variants && product.variants.length > 0) {

      const processedVariants = (product.variants || []).map(normalizeVariant);

      const processedOptions = deriveProductOptionNames(product);

      return product.variants
        .filter(variant => this.isVariantSelectableForInventory(variant))
        .map(variant => {

          const imageUrl = variant?.image?.src
            || variant?.image?.url
            || (typeof variant?.image === 'string' ? variant.image : null)
            || variant?.imageUrl
            || product.imageUrl
            || product.featuredImage?.url
            || product.images?.[0]?.url
            || product.images?.[0]?.src
            || product.images?.[0]?.originalSrc
            || 'https://via.placeholder.com/150';

          return {
            id: this.extractId(variant.id),
            title: `${product.title} - ${variant.title}`,
            imageUrl,
            price: parseFloat(variant.price || '0') * 100,
            compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice) * 100 : null,
            variantId: this.extractId(variant.id),
            available: this.isVariantSelectableForInventory(variant),
            quantityAvailable: typeof variant.quantityAvailable === 'number' ? variant.quantityAvailable : null,
            currentlyNotInStock: variant.currentlyNotInStock === true,
            weight: normalizeWeightToGrams(variant.weight, variant.weightUnit),
            weightUnit: 'GRAMS',
            sellingPlanAllocations: variant.sellingPlanAllocations || [],

            parentProductId: this.extractId(product.id),
            parentTitle: product.title,
            variants: processedVariants,
            options: processedOptions,
            images: product.images || (product.imageUrl ? [{ src: product.imageUrl }] : []),
            description: normalizeProductDescription(product)
          };
        });
    } else {

      const defaultVariant = this.getFirstAvailableVariant(product);

      if (product.variants?.length > 0 && !defaultVariant) {
        return [];
      }

      const imageUrl = defaultVariant?.image?.src
        || defaultVariant?.image?.url
        || (typeof defaultVariant?.image === 'string' ? defaultVariant.image : null)
        || defaultVariant?.imageUrl
        || product.imageUrl
        || product.featuredImage?.url
        || product.images?.[0]?.url
        || product.images?.[0]?.src
        || product.images?.[0]?.originalSrc
        || 'https://via.placeholder.com/150';

      const processedVariants = (product.variants || []).map(normalizeVariant);

      const processedOptions = deriveProductOptionNames(product);

      return [{
        id: this.extractId(product.id),
        title: product.title,
        imageUrl,
        price: defaultVariant ? parseFloat(defaultVariant.price || '0') * 100 : 0,
        compareAtPrice: defaultVariant?.compareAtPrice ? parseFloat(defaultVariant.compareAtPrice) * 100 : null,
        variantId: this.extractId(defaultVariant?.id || product.id),
        sellingPlanAllocations: defaultVariant?.sellingPlanAllocations || [],
        available: defaultVariant?.available === true,
        quantityAvailable: typeof defaultVariant?.quantityAvailable === 'number' ? defaultVariant.quantityAvailable : null,
        currentlyNotInStock: defaultVariant?.currentlyNotInStock === true,
        weight: normalizeWeightToGrams(defaultVariant?.weight, defaultVariant?.weightUnit),
        weightUnit: 'GRAMS',

        variants: processedVariants,
        options: processedOptions,

        images: product.images || (product.imageUrl ? [{ src: product.imageUrl }] : []),
        description: normalizeProductDescription(product)
      }];
    }
  });
},

/**
 * Look up real stock for a variant in a step's product data.
 * Returns:
 *   - available: positive numeric remaining stock, or null when uncapped
 *   - outOfStock: true only when Shopify marks the variant unavailable
 *   - acceptsBackorder: true when Shopify marks the variant as backorderable
 */
isVariantOutOfStock(product) {
  if (!product) {
    return false;
  }
  const runtimeInventory = typeof this.getRuntimeVariantInventory === 'function'
    ? this.getRuntimeVariantInventory(product)
    : null;
  const candidate = runtimeInventory ? { ...product, ...runtimeInventory } : product;

  if (candidate.available === false) {
    return true;
  }
  const trackInventoryOnAddToCart = typeof this.isInventoryTrackingOnAddToCartEnabled === 'function'
    ? this.isInventoryTrackingOnAddToCartEnabled()
    : fullPageProductProcessingMethods.isInventoryTrackingOnAddToCartEnabled.call(this);
  if (trackInventoryOnAddToCart && isTrackedZeroStock(candidate)) {
    return true;
  }
  return false;
},

getVariantAvailable(stepIndex, variantId) {
  const products = this.stepProductData[stepIndex] || [];
  const product = products.find(p => (p.variantId || p.id) === variantId);
  if (!product) {
    return { available: null, outOfStock: false, acceptsBackorder: false };
  }

  const runtimeInventory = typeof this.getRuntimeVariantInventory === 'function'
    ? this.getRuntimeVariantInventory(product)
    : null;
  const candidate = runtimeInventory ? { ...product, ...runtimeInventory } : product;
  const backorder = candidate.currentlyNotInStock === true;
  const outOfStock = this.isVariantOutOfStock(product);
  const trackInventoryOnAddToCart = typeof this.isInventoryTrackingOnAddToCartEnabled === 'function'
    ? this.isInventoryTrackingOnAddToCartEnabled()
    : fullPageProductProcessingMethods.isInventoryTrackingOnAddToCartEnabled.call(this);
  const qty = trackInventoryOnAddToCart
    && typeof candidate.quantityAvailable === 'number'
    && candidate.quantityAvailable > 0
    ? candidate.quantityAvailable
    : null;

  return { available: qty, outOfStock, acceptsBackorder: backorder };
},

extractId(idString) {
  if (!idString) return null;

  const gidMatch = idString.toString().match(/gid:\/\/shopify\/\w+\/(\d+)/);
  if (gidMatch) {
    return gidMatch[1];
  }

  return idString.toString().split('/').pop();
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

async enrichMissingProductDescriptions(products) {
  if (!Array.isArray(products) || products.length === 0) return products;

  const missingProductIds = Array.from(new Set(products
    .filter(product => !normalizeProductDescription(product))
    .map(productGraphqlId)
    .filter(Boolean)));

  if (missingProductIds.length === 0) return products;

  const shop = window.Shopify?.shop || window.location.host;
  const apiBaseUrl = this.resolveStorefrontApiBase();
  const country = window.Shopify?.country
    || (window.Shopify?.locale?.includes('-') ? window.Shopify.locale.split('-')[1] : null)
    || null;

  try {
    const countryParam = country ? `&country=${encodeURIComponent(country)}` : '';
    const response = await fetch(`${apiBaseUrl}/api/storefront-products?ids=${encodeURIComponent(missingProductIds.join(','))}&shop=${encodeURIComponent(shop)}${countryParam}`);
    if (!response.ok) return products;

    const data = await response.json();
    if (typeof this.rememberRuntimeProductInventory === 'function') {
      this.rememberRuntimeProductInventory(data.products);
    }
    const descriptionsByProductId = new Map();
    (Array.isArray(data.products) ? data.products : []).forEach(product => {
      const description = normalizeProductDescription(product);
      const key = productLookupKey(product);
      if (key && description) descriptionsByProductId.set(key, description);
    });

    if (descriptionsByProductId.size === 0) return products;

    return products.map(product => {
      if (normalizeProductDescription(product)) return product;
      const key = productLookupKey(product);
      const description = key ? descriptionsByProductId.get(key) : '';
      return description ? { ...product, description } : product;
    });
  } catch (error) {
    return products;
  }
},
};

const fullPageModalProductMethods = {
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
},

renderModalProducts(stepIndex, productsToRender = null) {

  const products = productsToRender || this.stepProductData[stepIndex];
  const selectedProducts = this.selectedProducts[stepIndex];
  const productGrid = this.elements.modal.querySelector('.product-grid');
  const step = this.selectedBundle?.steps?.[stepIndex] || {};

  if (products.length === 0) {
    if (!this._shouldRenderProductSlots()) {
      const emptyMessage = typeof this.getNoProductsAvailableMessage === 'function'
        ? this.getNoProductsAvailableMessage()
        : 'No Products Available';
      const escapedEmptyMessage = typeof this._escapeHTML === 'function'
        ? this._escapeHTML(emptyMessage)
        : String(emptyMessage).replace(/[&<>"']/g, (char) => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[char]);
      productGrid.innerHTML = `
        <div class="empty-products-message">
          <p>${escapedEmptyMessage}</p>
        </div>
      `;
      return;
    }

    const currentStep = this.selectedBundle.steps[stepIndex];
    const stepName = this._escapeHTML(currentStep?.name) || `Step ${stepIndex + 1}`;
    const labelText = `Select ${stepName}`;
    const emptyStateIconUrl = this._escapeHTML(this.selectedBundle?.productSlotIconUrl || '');
    const emptyStateIcon = emptyStateIconUrl
      ? `<img class="empty-state-card-icon" src="${emptyStateIconUrl}" alt="" width="69" height="69">`
      : `<svg class="empty-state-card-icon" width="69" height="69" viewBox="0 0 69 69" fill="none">
          <line x1="34.5" y1="15" x2="34.5" y2="54" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
          <line x1="15" y1="34.5" x2="54" y2="34.5" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        </svg>`;

    const emptyStateCards = Array(3).fill(0).map((_, index) => `
      <div class="empty-state-card">
        ${emptyStateIcon}
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

    const imageUrl = product.imageUrl || product.image?.src || product.featuredImage?.url || product.images?.[0]?.url || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
    product.imageUrl = imageUrl;

    if (!product.imageUrl || product.imageUrl === '') {
      product.imageUrl = BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
    }

    const variantSelectorHtml = this.renderVariantSelector(product, step);

    const { available, outOfStock } = this.getVariantAvailable(stepIndex, selectionKey);
    const atMaxStock = available !== null && available > 0 && currentQuantity >= available;
    const lowStock = available !== null && available > 0 && available <= 3;
    const increaseDisabled = outOfStock || atMaxStock;
    const addDisabled = outOfStock;

    const stockBadge = outOfStock
      ? `<div class="product-stock-badge product-stock-badge--out">Out of stock</div>`
      : lowStock
        ? `<div class="product-stock-badge product-stock-badge--low">Only ${available} left</div>`
        : '';

    return renderSharedProductCard(
      {
        ...product,
        imageUrl,
      },
      currentQuantity,
      currencyInfo,
      {
        variantSelectorHtml,
        stockBadgeHtml: stockBadge,
        addButtonText: outOfStock ? 'Out of stock' : this.getProductAddButtonText(),
        addDisabled,
        decreaseDisabled: currentQuantity <= 0,
        increaseDisabled,
      }
    );
  }).join('');

  this.attachProductEventHandlers(productGrid, stepIndex);
},

renderVariantSelector(product, step) {
  if (!product.variants || product.variants.length <= 1) {
    return '';
  }
  const primaryOptionName = step?.primaryVariantOption || null;
  return VariantSelectorComponent.renderHtml(product, primaryOptionName);
},

attachProductEventHandlers(productGrid, stepIndex) {

  const newProductGrid = productGrid.cloneNode(true);
  productGrid.parentNode.replaceChild(newProductGrid, productGrid);

  const step = this.selectedBundle.steps[stepIndex];

  const findProduct = (productId) => {
    return this.stepProductData[stepIndex]?.find(p => {
      const selectionKey = p.variantId || p.id;
      return String(selectionKey) === String(productId);
    });
  };

  const openProductModalForCard = (productCard) => {
    if (!this.productModal && window.BundleProductModal) {
      this.productModal = new window.BundleProductModal(this);
    }
    if (!productCard || !this.productModal) return;
    const productId = productCard.dataset.productId;
    const product = findProduct(productId);

    if (product && step) {
      const initialImageIndex = Number(productCard.dataset.bwCardImageIndex || 0);
      const isClassicQuickView = this.getFullPageDesignPreset?.() === 'CLASSIC';
      this.productModal.open(product, step, {
        initialImageIndex,
        readOnly: isClassicQuickView,
      });
    }
  };

  newProductGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('inline-qty-btn')) {
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
    const imageNav = e.target.closest('.bw-product-card__image-nav');
    if (imageNav) {
      e.preventDefault();
      e.stopPropagation();
      const productCard = imageNav.closest('.product-card');
      if (!productCard) return;
      const product = findProduct(productCard.dataset.productId);
      const imageUrls = getProductImageUrls(product);
      if (imageUrls.length <= 1) return;

      const currentIndex = Number(productCard.dataset.bwCardImageIndex || 0);
      const direction = imageNav.dataset.bwImageNav === 'prev' ? -1 : 1;
      const nextIndex = (currentIndex + direction + imageUrls.length) % imageUrls.length;
      const imageEl = productCard.querySelector('.bw-product-card__image');
      if (imageEl) {
        imageEl.src = imageUrls[nextIndex];
      }
      productCard.dataset.bwCardImageIndex = String(nextIndex);
      return;
    }

    if (e.target.closest('.product-image, .product-title')) {
      openProductModalForCard(e.target.closest('.product-card'));
    }
  });

  newProductGrid.querySelectorAll('.product-image, .product-title').forEach((element) => {
    element.addEventListener('click', (event) => {
      if (event.target.closest('.bw-product-card__image-nav')) return;
      event.stopPropagation();
      openProductModalForCard(event.target.closest('.product-card'));
    });
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
          product.available = variantData.available === true;

          const oldQuantity = this.selectedProducts[stepIndex][product.variantId] || 0;
          if (oldQuantity > 0) {
            delete this.selectedProducts[stepIndex][product.variantId];

            const newQtyAvail = product.quantityAvailable;
            const newOOS = this.isVariantOutOfStock(product);
            const trackInventoryOnAddToCart = typeof this.isInventoryTrackingOnAddToCartEnabled === 'function'
              ? this.isInventoryTrackingOnAddToCartEnabled()
              : false;
            let migratedQty = oldQuantity;
            if (newOOS) {
              ToastManager.show('Selected variant is out of stock — selection cleared.');
              migratedQty = 0;
            } else if (trackInventoryOnAddToCart && newQtyAvail !== null && newQtyAvail > 0 && oldQuantity > newQtyAvail) {
              migratedQty = newQtyAvail;
              ToastManager.show('Only ' + newQtyAvail + ' in stock — quantity adjusted.');
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
},
};

function shouldAutoAdvanceFullPageStep({ quantity = 0, step = null } = {}) {
  if (
    quantity > 0 &&
    step?.autoNextStepOnConditionMet === true &&
    step?.conditionType &&
    step?.conditionOperator &&
    Number(step?.conditionValue || 0) > 0
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

  return categoryRuleCategories.some(category => category.autoNextStepOnConditionMet === true);
}

function getFullPageStepConditionValidationMessage(step) {
  if (!step || step.conditionType !== 'quantity') {
    return 'Please meet the quantity conditions for the current step before proceeding.';
  }

  const requiredQuantity = Number(step.conditionValue || 0);
  if (!Number.isFinite(requiredQuantity) || requiredQuantity <= 0) {
    return 'Please meet the quantity conditions for the current step before proceeding.';
  }

  const productLabel = requiredQuantity === 1 ? 'product' : 'products';
  switch (step.conditionOperator) {
    case 'equal_to':
      return `Add exactly ${requiredQuantity} ${productLabel} on this step`;
    case 'greater_than_or_equal_to':
      return `Add at least ${requiredQuantity} ${productLabel} on this step`;
    case 'less_than_or_equal_to':
      return `Add at most ${requiredQuantity} ${productLabel} on this step`;
    default:
      return 'Please meet the quantity conditions for the current step before proceeding.';
  }
}

function buildCategoryRuleValidationStep(step, stepIndex, stepCollectionProductIds = {}, extractId = value => value) {
  if (!ConditionValidator.isCategoryRuleMode(step)) return step;
  const categories = Array.isArray(step?.categories) ? step.categories : [];

  return {
    ...step,
    categories: categories.map(category => {
      const products = Array.isArray(category?.products) ? [...category.products] : [];
      const seenProductIds = new Set(products.map(product => {
        const rawId = product?.id || product?.productId || product?.graphqlId;
        return rawId == null ? '' : String(extractId(rawId) || rawId);
      }));
      const addCollectionHandle = (collection) => {
        const handle = collection?.handle;
        if (!handle) return;
        const productIds = stepCollectionProductIds[`${stepIndex}:${handle}`] || [];
        productIds.forEach(productId => {
          const normalizedId = String(extractId(productId) || productId);
          if (!normalizedId || seenProductIds.has(normalizedId)) return;
          seenProductIds.add(normalizedId);
          products.push({ id: normalizedId });
        });
      };

      (category.collections || []).forEach(addCollectionHandle);
      (category.collectionsData || []).forEach(addCollectionHandle);
      (category.collectionsSelectedData || []).forEach(addCollectionHandle);

      return { ...category, products };
    }),
  };
}

const fullPageSelectionNavigationMethods = {
getStepConditionValidationMessage(stepIndex = this.currentStepIndex) {
  return getFullPageStepConditionValidationMessage(this.selectedBundle?.steps?.[stepIndex]);
},

updateProductSelection(stepIndex, productId, newQuantity) {
  let quantity = Math.max(0, newQuantity);

  if (quantity > 0) {
    const { available, outOfStock } = this.getVariantAvailable(stepIndex, productId);
    if (outOfStock) {
      ToastManager.show('This item is out of stock.');
      return;
    }
    if (available !== null && available > 0 && quantity > available) {
      quantity = available;
      ToastManager.show('Only ' + available + ' in stock — quantity adjusted.');
    }
  }

    if (!this.validateStepCondition(stepIndex, productId, quantity)) {
      return;
    }

  const currentQuantity = this.selectedProducts[stepIndex]?.[productId] || 0;
  const productQuantityCheck = ConditionValidator.canUpdateProductQuantity(
    this.selectedBundle?.validateQuantityPerProduct,
    currentQuantity,
    quantity,
  );
  if (!productQuantityCheck.allowed) {
    ToastManager.show('Maximum allowed quantity per product is ' + productQuantityCheck.limit + '.');
    return;
  }

  if (quantity > 0) {
    this.selectedProducts[stepIndex][productId] = quantity;
  } else {
    delete this.selectedProducts[stepIndex][productId];
  }

  const selectionEventName = (currentQuantity === 0 && quantity > 0) ? 'product-selected'
    : (currentQuantity > 0 && quantity === 0) ? 'product-deselected'
    : 'product-quantity-changed';
  this._emitStorefrontEvent(selectionEventName, { stepIndex, productId, previousQuantity: currentQuantity, quantity });
  this._emitStorefrontEvent('session-engaged', { trigger: selectionEventName });
  this._sendEngagementBeacon('session-engaged');

  this._syncFreeGiftLock();

  this.updateProductQuantityDisplay(stepIndex, productId, quantity);
  this.renderModalTabs();
  this.updateModalNavigation();
  this.updateModalFooterMessaging();

  const bundleType = this.container.dataset.bundleType;
  if (bundleType === 'full_page') {
    const layout = this.resolveFullPageLayout();
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
    if (!this._autoAdvancePending && shouldAutoAdvanceFullPageStep({ quantity, step: _autoAdvanceStep })) {
      const isLastStep = this.currentStepIndex === this.selectedBundle.steps.length - 1;
      if (!isLastStep && this.isStepCompleted(this.currentStepIndex) && this.canNavigateToStep(this.currentStepIndex + 1)) {
        this._autoAdvancePending = true;
        setTimeout(() => {
          this._autoAdvancePending = false;

          if (this.isStepCompleted(this.currentStepIndex) && this.canNavigateToStep(this.currentStepIndex + 1)) {
            this.activeCollectionId = null;
            this.searchQuery = '';
            this.currentStepIndex++;
            const layout = this.resolveFullPageLayout();
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
},

_shouldRenderProductSlots() {
  return this.selectedBundle?.productSlotsEnabled === true;
},

updateProductQuantityDisplay(stepIndex, productId, quantity) {
  if (this.usesSelectedQuantityBadge()) {
    this.refreshCurrentProductGrid(stepIndex);
    if (this.elements?.modal?.querySelector('.product-grid')) {
      this.renderModalProducts(stepIndex);
    }
    this._refreshSiblingDimState(stepIndex);
    return;
  }

  const productCard = this.container.querySelector('[data-product-id="' + productId + '"]');
  if (!productCard) return;

  const contentWrapper = productCard.querySelector('.product-content-wrapper');
  const actionWrapper = productCard.querySelector('.product-card-action');
  if (!contentWrapper && !actionWrapper) return;

  const actionContainer = actionWrapper || contentWrapper;
  const existingAddBtn = productCard.querySelector('.product-add-btn');
  const existingQuantityControls = productCard.querySelector('.inline-quantity-controls');

  if (quantity > 0) {
    if (actionWrapper) {
      actionWrapper.classList.add('is-expanded');
    }

    if (existingQuantityControls) {
      if (existingAddBtn) {
        existingAddBtn.remove();
      }

      const qtyDisplay = existingQuantityControls.querySelector('.inline-qty-display');
      if (qtyDisplay) {
        qtyDisplay.textContent = quantity;
      }
    } else {
      if (existingAddBtn) {
        existingAddBtn.remove();
      }

      const quantityControls = document.createElement('div');
      quantityControls.className = 'inline-quantity-controls';
      quantityControls.innerHTML =
        '<button class="inline-qty-btn qty-decrease" data-product-id="' + productId + '">−</button>' +
        '<span class="inline-qty-display">' + quantity + '</span>' +
        '<button class="inline-qty-btn qty-increase" data-product-id="' + productId + '">+</button>';
      actionContainer.appendChild(quantityControls);

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

    productCard.classList.add('bw-product-card--selected');

  } else {
    if (actionWrapper) {
      actionWrapper.classList.remove('is-expanded');
    }

    if (existingQuantityControls) {
      existingQuantityControls.remove();
    }

    if (!existingAddBtn) {
      const addButton = document.createElement('button');
      addButton.className = 'product-add-btn';
      addButton.dataset.productId = productId;
      addButton.textContent = this.getProductAddButtonText();
      actionContainer.appendChild(addButton);

      addButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.updateProductSelection(stepIndex, productId, 1);
      });
    }

    productCard.classList.remove('bw-product-card--selected');
  }

  this._refreshSiblingDimState(stepIndex);
},

refreshCurrentProductGrid(stepIndex) {
  if (this.container.dataset.bundleType !== 'full_page') return false;
  if (stepIndex !== this.currentStepIndex) return false;

  const currentGrid = this.container.querySelector('.full-page-product-grid');
  if (!currentGrid) return false;

  const replacementGrid = this.createFullPageProductGrid(stepIndex);
  currentGrid.replaceWith(replacementGrid);
  return true;
},

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
},

findProductById(stepIndex, productId) {
  const products = this.stepProductData[stepIndex] || [];
  return products.find(p => (p.variantId || p.id) === productId);
},

validateStepCondition(stepIndex, productId, newQuantity) {
  const step = this.selectedBundle.steps[stepIndex];
  const currentSelections = this.selectedProducts[stepIndex] || {};
  const currentQty = currentSelections[productId] || 0;
  const conditionSelections = this._getStepConditionSelections(stepIndex, currentSelections);
  const directDefaultQuantities = this._getDirectDefaultSelectionQuantities(stepIndex);
  const directDefaultQuantity = Number(directDefaultQuantities[String(productId)] || 0);
  const conditionNewQuantity = Math.max(0, Number(newQuantity || 0) - directDefaultQuantity);

  const { allowed, limitText } = ConditionValidator.canUpdateQuantity(
    step,
    conditionSelections,
    productId,
    conditionNewQuantity,
  );

  if (!allowed && newQuantity > currentQty) {
    const toastMessage = typeof ConditionValidator._formatStepLimitToast === 'function'
      ? ConditionValidator._formatStepLimitToast(limitText, step.conditionValue)
      : 'This step allows ' + limitText + ' product' + (step.conditionValue !== 1 ? 's' : '') + ' only.';
    ToastManager.show(toastMessage);
    return false;
  }

  return true;
},

validateStep(stepIndex) {
  const step = this.selectedBundle.steps[stepIndex];
  const currentSelections = this.selectedProducts[stepIndex] || {};
  const conditionSelections = typeof this._getStepConditionSelections === 'function'
    ? this._getStepConditionSelections(stepIndex, currentSelections)
    : currentSelections;

  const validationStep = buildCategoryRuleValidationStep(
    step,
    stepIndex,
    this.stepCollectionProductIds,
    value => this.extractId?.(value) || value,
  );

  if (ConditionValidator.isCategoryRuleMode(validationStep)) {
    const products = this.stepProductData[stepIndex] || [];
    const translated = {};
    for (const [selKey, qty] of Object.entries(conditionSelections)) {
      const product = products.find(p => (p.variantId || p.id) === selKey);
      const productId = String((product && (product.parentProductId || product.id)) || selKey);
      const quantity = Number(qty) || 0;
      const current = translated[productId] || { quantity: 0, amount: 0 };
      translated[productId] = {
        quantity: current.quantity + quantity,
        amount: current.amount + ((Number(product?.price) || 0) * quantity),
        weight: (current.weight || 0) + ((Number(product?.weight) || 0) * quantity),
      };
    }
    return ConditionValidator.isStepConditionSatisfied(validationStep, translated);
  }

  return ConditionValidator.isStepConditionSatisfied(validationStep, conditionSelections);
},

isStepAccessible(stepIndex) {

  if (this.selectedBundle?.steps[stepIndex]?.isDefault) return true;

  const addonStep = this.selectedBundle?.steps[stepIndex];
  if (addonStep?.isFreeGift && addonStep?.addonUnlockAfterCompletion === false) {

  } else if (!this.canNavigateToStep(stepIndex)) {
    return false;
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

  prevButton.disabled = this.currentStepIndex === 0;

  const isCurrentStepValid = this.validateStep(this.currentStepIndex);

  if (this.currentStepIndex === this.selectedBundle.steps.length - 1) {
    nextButton.textContent = this._resolveText('doneButton', 'Done');
    nextButton.disabled = !isCurrentStepValid;
  } else {
    nextButton.textContent = this._resolveText('nextButton', 'Next');
    nextButton.disabled = !isCurrentStepValid;
  }
},

updateModalFooterMessaging() {

  if (!this.elements.modal || this.elements.modal.style.display === 'none') return;

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
};

const fullPageRuntimeCartSettingsMethods = {
updateModalHeaderText(totalPrice, totalQuantity, discountInfo, currencyInfo) {
  const modalStepTitle = this.elements.modal.querySelector('.modal-step-title');
  if (!modalStepTitle) return;

  if (!this.selectedBundle?.pricing?.enabled) {
    const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
    modalStepTitle.innerHTML = this._escapeHTML(currentStep?.name) || 'Step ' + (this.currentStepIndex + 1);
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
},

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
},

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
  requestAnimationFrame(() => markLoadingOverlayVisible(overlay));
},

hideLoadingOverlay() {
  const overlay = this.container?.querySelector('.bundle-loading-overlay');
  hideLoadingOverlayElement(overlay);
},

_getButtonDataset(button) {
  if (!button) return null;
  if (!button.dataset) button.dataset = {};
  return button.dataset;
},

_setActionButtonLoadingState(button, isLoading) {
  if (!button) return;
  const dataset = this._getButtonDataset(button);

  if (isLoading) {
    if (dataset.fpbLoadingOriginalHtml === undefined) {
      dataset.fpbLoadingOriginalHtml = button.innerHTML || '';
      dataset.fpbLoadingWasDisabled = String(button.disabled === true);
    }
    button.classList.add('fpb-inline-spinner-active');
    button.disabled = true;
    button.innerHTML = '<span class="fpb-inline-spinner" aria-hidden="true"></span>';
    return;
  }

  if (dataset?.fpbLoadingOriginalHtml !== undefined) {
    button.innerHTML = dataset.fpbLoadingOriginalHtml;
    button.disabled = dataset.fpbLoadingWasDisabled === 'true';
    delete dataset.fpbLoadingOriginalHtml;
    delete dataset.fpbLoadingWasDisabled;
  }
  button.classList.remove('fpb-inline-spinner-active');
},

_setWidgetBusy(isBusy, activeButton = null) {
  this._isWidgetActionBusy = Boolean(isBusy);

  if (!this.container) return;
  this.container.classList.toggle('fpb-widget-busy', this._isWidgetActionBusy);

  this._setActionButtonLoadingState(activeButton, isBusy);
},

_withWidgetActionBusy(action, options = {}) {
  const { actionButton = null } = options;

  if (!this.container || this._isWidgetActionBusy) return Promise.resolve(false);

  this._setWidgetBusy(true, actionButton);

  return Promise.resolve()
    .then(() => action())
    .then(() => true)
    .catch((error) => {
      console.error('[Wolfpack Bundles] Widget action failed:', error);
      throw error;
    })
    .finally(() => {
      this._setWidgetBusy(false, actionButton);
    });
},

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
},

resolveFullPageOfferId() {
  const rawOfferId = this.selectedBundle?.offerId
    || this.selectedBundle?.bundleOfferId
    || this.selectedBundle?.id
    || 'UNKNOWN';
  const offerId = String(rawOfferId);
  return offerId.startsWith('FBP-') ? offerId : `FBP-${offerId}`;
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
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cartToken,
        bundleDetailsKey,
        displayProperties
      })
    });

    if (!response.ok) {
      throw new Error(`bundle_details sync failed (${response.status})`);
    }

    const data = await response.json().catch(() => null);
    if (data?.ok !== true) {
      throw new Error(data?.error || 'bundle_details sync failed');
    }
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
      if (parsed?.youSave?.amountPercentage) displayProperties[cartLineLabels.youSave] = String(parsed.youSave.amountPercentage);
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

generateBundleSessionKey() {
  return Math.random().toString(36).slice(2, 5).toUpperCase();
},

/**
 * Parses the JSON string from data-tier-config into a TierConfig array.
 * Returns [] on any error — pill bar is simply not shown.
 */
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
},

/**
 * Resolves which tier config array to use for pill rendering.
 *
 * Preference order:
 *  1. apiTierConfig (from DB via bundle API) — used when the merchant has saved
 *     tiers in the admin UI (>= 2 valid entries after mapping).
 *  2. dataTierConfig (from data-tier-config HTML attribute) — legacy Theme Editor
 *     source, used as fallback when apiTierConfig is null/undefined.
 *
 * apiTierConfig entries use { label, linkedBundleId } (DB schema).
 * Widget pill entries use { label, bundleId } — this method performs the mapping.
 *
 * Returns [] when fewer than 2 valid tiers exist after filtering.
 */
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
},

/**
 * Resolves whether to show the step timeline.
 * Admin UI (API) value takes precedence over the theme editor data attribute when non-null.
 *
 * @param {boolean|null} apiValue - From selectedBundle.showStepTimeline (DB, nullable)
 * @param {boolean} dataAttrValue - From data-show-step-timeline attribute (theme editor)
 * @returns {boolean}
 */
resolveShowStepTimeline(apiValue, dataAttrValue) {
  if (apiValue !== null && apiValue !== undefined) return apiValue;
  return dataAttrValue;
},

resolveFullPageLayout(bundle = this.selectedBundle) {
  return 'footer_side';
},

getFullPageTemplate(bundle = this.selectedBundle) {
  return 'FBP_SIDE_FOOTER';
},

getFullPageDesignPreset(bundle = this.selectedBundle) {
  const rawPresetId =
    bundle?.bundleDesignPresetId
    || bundle?.bundleDesignPreset
    || bundle?.templateId
    || 'STANDARD';
  if (typeof rawPresetId !== 'string') return 'STANDARD';

  const preset = rawPresetId.trim().toUpperCase();
  if (['STANDARD', 'CLASSIC', 'COMPACT', 'HORIZONTAL'].includes(preset)) return preset;
  return 'STANDARD';
},

resolveFullPageCardCtaMode(bundle = this.selectedBundle) {
  const showTextOnAddButton =
  bundle?.showTextOnAddButton === true
  || bundle?.showTextOnPlusEnabled === true;

  if (this.resolveFullPageLayout(bundle) === 'footer_side' && this.getFullPageDesignPreset(bundle) === 'CLASSIC') {
    return 'text';
  }

  return showTextOnAddButton ? 'text' : 'icon';
},

syncFullPageTemplateStylesheets(activeTemplateKey, activeHref) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const normalizedActiveKey = String(activeTemplateKey || 'STANDARD').trim().toUpperCase();
  const urls = window.__WOLFPACK_FPB_TEMPLATE_CSS_URLS__ || {};
  const knownTemplateEntries = Object.entries(urls)
    .map(([key, href]) => [String(key).trim().toUpperCase(), href])
    .filter(([, href]) => typeof href === 'string' && href !== '');

  Array.from(document.querySelectorAll('link[rel="stylesheet"]')).forEach((link) => {
    if (!(link instanceof HTMLLinkElement)) return;

    const linkTemplateKey = String(link.dataset.wpbFpbTemplateCss || '').trim().toUpperCase();
    const linkedTemplateKey = linkTemplateKey || knownTemplateEntries.find(([, href]) =>
      link.getAttribute('href') === href || link.href === href
    )?.[0];

    if (!linkedTemplateKey) return;

    const isActive =
      linkedTemplateKey === normalizedActiveKey
      || link.getAttribute('href') === activeHref
      || link.href === activeHref;

    link.disabled = !isActive;
  });
},

ensureFullPageTemplateStylesheet(preset) {
  const presetKey = String(preset || 'STANDARD').trim().toUpperCase() || 'STANDARD';
  const templateKey = presetKey;
  const urls = window.__WOLFPACK_FPB_TEMPLATE_CSS_URLS__ || {};
  const href = urls[presetKey] || urls.STANDARD;

  if (!href || typeof document === 'undefined') return Promise.resolve();

  if (!this._fpbTemplateStylesheetPromises) {
    this._fpbTemplateStylesheetPromises = new Map();
  }

  const pendingPromise = this._fpbTemplateStylesheetPromises.get(href);
  if (pendingPromise) {
    return pendingPromise;
  }

  const existingLink = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find((link) =>
    link.getAttribute('href') === href
    || link.href === href
    || link.dataset.wpbFpbTemplateCss === templateKey
  );

  const markLoaded = (link) => {
    if (link instanceof HTMLLinkElement) {
      link.dataset.wpbFpbTemplateCssLoaded = '1';
    }
  };

  const isStylesheetLoaded = (link) => {
    if (!link) return false;
    if (link.dataset?.wpbFpbTemplateCssLoaded === '1') return true;

    try {
      return !!link.sheet;
    } catch (_error) {
      return false;
    }
  };

  if (existingLink) {
    existingLink.disabled = false;
    if (isStylesheetLoaded(existingLink)) {
      markLoaded(existingLink);
      this.syncFullPageTemplateStylesheets(templateKey, href);
      return Promise.resolve();
    }

    const promise = new Promise((resolve) => {
      const done = () => {
        markLoaded(existingLink);
        this.syncFullPageTemplateStylesheets(templateKey, href);
        this._fpbTemplateStylesheetPromises.delete(href);
        resolve();
      };

      existingLink.addEventListener('load', done, { once: true });
      existingLink.addEventListener('error', done, { once: true });
    });

    this._fpbTemplateStylesheetPromises.set(href, promise);
    return promise;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.dataset.wpbFpbTemplateCss = templateKey;

  const promise = new Promise((resolve) => {
    const done = () => {
      markLoaded(link);
      this.syncFullPageTemplateStylesheets(templateKey, href);
      this._fpbTemplateStylesheetPromises.delete(href);
      resolve();
    };

    link.addEventListener('load', done, { once: true });
    link.addEventListener('error', done, { once: true });
  });

  this._fpbTemplateStylesheetPromises.set(href, promise);
  document.head.appendChild(link);

  return promise;
},

getProductAddButtonText() {
  if (this.resolveFullPageCardCtaMode() !== 'text') return '+';

  const textButtonFallback = this.getFullPageDesignPreset() === 'CLASSIC'
    ? 'Add To Box'
    : 'Add +';
  return this._resolveText('productAddButton', textButtonFallback);
},

applyFullPageDesignPresetMarker() {
  if (!this.container || !this.elements?.stepsContainer) return;

  const fullPageTemplate = this.getFullPageTemplate();
  const fullPageDesignPreset = this.getFullPageDesignPreset();
  const fullPageTabStyle = fullPageDesignPreset === 'STANDARD' || fullPageDesignPreset === 'HORIZONTAL' ? 'underline' : 'pill';
  const presetClass = `fpb-preset-${fullPageDesignPreset.toLowerCase()}`;

  this.container.dataset.fpbTemplateType = fullPageTemplate;
  this.elements.stepsContainer.dataset.fpbTemplateType = fullPageTemplate;

  this.container.dataset.fpbDesignPreset = fullPageDesignPreset;
  this.elements.stepsContainer.dataset.fpbDesignPreset = fullPageDesignPreset;
  this.container.dataset.fpbTabStyle = fullPageTabStyle;
  this.elements.stepsContainer.dataset.fpbTabStyle = fullPageTabStyle;
  const cardCtaMode = this.resolveFullPageCardCtaMode();
  this.elements.stepsContainer.dataset.fpbCardCtaMode = cardCtaMode;
  this.container.classList.remove('fpb-preset-standard', 'fpb-preset-classic', 'fpb-preset-compact', 'fpb-preset-horizontal');
  this.container.classList.add(presetClass);
  this.container.classList.toggle('fpb-h', fullPageDesignPreset === 'HORIZONTAL');
  this.container.classList.toggle('fpb-d', fullPageDesignPreset === 'STANDARD');
  this.elements.stepsContainer.classList.remove('fpb-preset-standard', 'fpb-preset-classic', 'fpb-preset-compact', 'fpb-preset-horizontal');
  this.elements.stepsContainer.classList.add(presetClass);
  this.elements.stepsContainer.classList.toggle('fpb-h', fullPageDesignPreset === 'HORIZONTAL');
  this.elements.stepsContainer.classList.toggle('fpb-d', fullPageDesignPreset === 'STANDARD');
  this.elements.stepsContainer.classList.toggle('fpb-i', cardCtaMode === 'icon');
  void this.ensureFullPageTemplateStylesheet(fullPageDesignPreset);
},

/** Returns true if the given tier index is the currently active one. */
isTierActive(tierIndex) {
  return tierIndex === this.activeTierIndex;
},

/**
 * Inserts the tier pill bar as the first child of the container.
 * No-op when fewer than 2 tiers are configured (backward-compatible).
 */
};

const fullPageTierFloatingRuntimeMethods = {
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
},

/** Updates aria-pressed and active CSS class on all pills to match activeTierIndex. */
updatePillActiveStates() {
  if (!this.elements.tierPillBar) return;
  this.elements.tierPillBar.querySelectorAll('.bundle-tier-pill').forEach(pill => {
    const idx = parseInt(pill.dataset.tierIndex, 10);
    const active = idx === this.activeTierIndex;
    pill.classList.toggle('bundle-tier-pill--active', active);
    pill.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
},

/** Switches the active bundle tier — fetches new bundle data and re-renders the widget. */
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
    this.applyPersonalizationAddonProducts();

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
    ToastManager.show('Failed to load tier: ' + err.message);

    this.updatePillActiveStates();
  } finally {
    this.hideLoadingOverlay();
    pills.forEach(p => {
      p.classList.remove('bundle-tier-pill--disabled', 'bundle-tier-pill--loading');
    });
  }
},

_mergeBundleSettings(settings) {
  if (!settings || !this.selectedBundle) return;
  const keys = [
    'promoBannerBgImage',
    'bundleBannerDesktopUrl', 'bundleBannerMobileUrl', 'loadingGif',
    'showStepTimeline', 'floatingBadgeEnabled', 'floatingBadgeText', 'tierConfig',
  ];
  for (const key of keys) {
    if (settings[key] !== undefined) this.selectedBundle[key] = settings[key];
  }
},

async hydrateCurrentFullPageBundleBeforeRender() {
  const bundleId = this.container?.dataset?.bundleId;
  if (!bundleId || this._bundleConfigCacheMode !== 'full') return false;

  try {
    const apiUrl = `/apps/product-bundles/api/bundle/${encodeURIComponent(bundleId)}.json`;
    const response = await fetch(apiUrl, {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!response.ok) return false;

    const data = await response.json();
    if (!data?.bundle?.id) return false;

    this.bundleData = {
      ...(this.bundleData || {}),
      [data.bundle.id]: data.bundle,
    };
    this.selectedBundle = data.bundle;
    this._bundleConfigCacheMode = 'proxy';
    return true;
  } catch (_error) {
    return false;
  }
},

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
},

_escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
},

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
},

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
        ToastManager.show(this.getStepConditionValidationMessage?.() || 'Please meet the quantity conditions for the current step before proceeding.');
      }
    } else {

      if (this.validateStep(this.currentStepIndex)) {
        this.closeModal();
      } else {
        ToastManager.show('Please meet the quantity conditions for the current step before finishing.');
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

showErrorUI(_error) {
  this.container.innerHTML = `
    <div class="bundle-error">
      <h3>Bundle unavailable</h3>
      <p>We couldn&apos;t load this bundle right now. Please refresh the page or try again later.</p>
      <p>If the problem persists, please contact the store owner.</p>
    </div>
  `;
},

/**
 * Fire-and-forget error report to the server so AppLogger can track widget failures.
 * Does NOT await — never blocks the render path.
 */

/**
 * Background layout refresh — runs after initial render.
 *
 * In compact-marker mode, we always fetch the bundle via API before render,
 * so this refresh path is effectively a no-op for initialized API loads.
 * It is preserved for legacy cached payload paths and exits early when not needed.
 *
 * Fire-and-forget: all errors are silently swallowed.
 */
async _scheduleLayoutRefresh() {
  const bundleId = this.container.dataset.bundleId;
  if (!bundleId) return;

  if (this._bundleConfigCacheMode !== 'full') return;

  try {
    const apiUrl = `/apps/product-bundles/api/bundle/${encodeURIComponent(bundleId)}.json`;
    const response = await fetch(apiUrl);
    if (!response.ok) return;

    const data = await response.json();
    if (!data?.bundle) return;

    const freshLayout = this.resolveFullPageLayout(data.bundle);
    const currentLayout = this.resolveFullPageLayout();
    const freshTemplate = data.bundle.bundleDesignTemplate ?? null;
    const currentTemplate = this.selectedBundle?.bundleDesignTemplate ?? null;
    const freshPreset = data.bundle.bundleDesignPresetId ?? null;
    const currentPreset = this.selectedBundle?.bundleDesignPresetId ?? null;

    if ((freshLayout !== currentLayout || freshTemplate !== currentTemplate || freshPreset !== currentPreset) && this.selectedBundle) {
      this.selectedBundle.fullPageLayout = data.bundle.fullPageLayout;
      this.selectedBundle.bundleDesignTemplate = data.bundle.bundleDesignTemplate ?? this.selectedBundle.bundleDesignTemplate;
      this.selectedBundle.bundleDesignPresetId = data.bundle.bundleDesignPresetId ?? this.selectedBundle.bundleDesignPresetId;
      this.selectedBundle.bundleDesignTemplateData = data.bundle.bundleDesignTemplateData ?? this.selectedBundle.bundleDesignTemplateData;
      if (this.bundleData?.[bundleId]) {
        this.bundleData[bundleId].fullPageLayout = data.bundle.fullPageLayout;
        this.bundleData[bundleId].bundleDesignTemplate = data.bundle.bundleDesignTemplate ?? this.bundleData[bundleId].bundleDesignTemplate;
        this.bundleData[bundleId].bundleDesignPresetId = data.bundle.bundleDesignPresetId ?? this.bundleData[bundleId].bundleDesignPresetId;
        this.bundleData[bundleId].bundleDesignTemplateData = data.bundle.bundleDesignTemplateData ?? this.bundleData[bundleId].bundleDesignTemplateData;
      }
      await this.renderSteps();
    }
  } catch (_e) {

  }
},

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
    }).catch(() => { /* best-effort — ignore if proxy is also down */ });
  } catch (_) {

  }
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
    const bundleId = this.config?.bundleId ?? this.container?.dataset?.bundleId;
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
},
};

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
    this.selectedBoxSelectionRuleId = null;
    this.currentStepIndex = 0;
    this.isInitialized = false;
    this._isWidgetActionBusy = false;
    this.config = {};
    this.elements = {};
    this.compactMobileSummaryTrayExpanded = false;
    this.standardTimelineWindowStart = 0;
    this.standardTimelineLastActiveEntryIndex = 0;

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

      this.hidePageLoadingContent();

      this.parseConfiguration();

      const bundleType = this.container.dataset.bundleType;
      if (bundleType === 'full_page') {
        this.hidePageTitle();
      }

      this.showLoadingOverlay(null);

      this.loadDesignSettingsCSS();
      await this.loadLanguageSettings();
      await this.loadControlsSettings();

      this._scheduleCartTransformSelfHeal();

      await this.loadBundleData();

      this.selectBundle();

      if (!this.selectedBundle) {
        this.hideLoadingOverlay();
        this.showFallbackUI();
        return;
      }

      await this.hydrateCurrentFullPageBundleBeforeRender();

      this._mergeBundleSettings(this.bundleSettings);
      this.applyPersonalizationAddonProducts();

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

      this.applyFullPageDesignPresetMarker();
      await this.ensureFullPageTemplateStylesheet(this.getFullPageDesignPreset());
      this.applyBundleLevelCss(this.selectedBundle);

      await this.renderUI();

      this.hideLoadingOverlay();

      this._emitStorefrontEvent('bundle-ready', { stepCount: this.selectedBundle?.steps?.length || 0 });

      if (!window.Shopify?.designMode) {
        this._scheduleLayoutRefresh().catch(() => {});
      }

      this.attachEventListeners();

      this._initFloatingBadge();

      this.container.dataset.initialized = 'true';
      this.isInitialized = true;

      if (!window.Shopify?.designMode) {
        this._recordView();
      }

    } catch (error) {
      this.hideLoadingOverlay();

      console.error('[BundleWidget] Initialization failed:', error);

      this._reportError(error);
      this.showErrorUI(error);
    }
  }

}

applyMethodMixins(
  BundleWidgetFullPage.prototype,
  fullPageAnalyticsConfigMethods,
  fullPageInitialRenderMethods,
  fullPageResponsiveLayoutMethods,
  fullPageMobileSummaryMethods,
  fullPageSidePanelMethods,
  fullPageBoxSelectionSidebarMethods,
  fullPageTimelineBannerMethods,
  fullPageSearchCategoryMethods,
  fullPageProductGridMethods,
  fullPageProductCardFooterMethods,
  fullPageFooterSelectionMethods,
  fullPageValidationAddonsMethods,
  fullPageStepFooterMethods,
  fullPageDiscountModalMethods,
  fullPageClearCartConfirmationMethods,
  fullPageProductProcessingMethods,
  fullPageModalProductMethods,
  fullPageSelectionNavigationMethods,
  fullPageRuntimeCartSettingsMethods,
  fullPageTierFloatingRuntimeMethods,
  bundleLevelCssMethods,
);

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

window.WolfpackFullPageBundle = window.WolfpackFullPageBundle || {};
window.WolfpackFullPageBundle.init = initializeFullPageWidget;

})();