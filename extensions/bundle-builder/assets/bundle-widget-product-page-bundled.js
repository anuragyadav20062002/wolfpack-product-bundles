/*!
 * Wolfpack Bundle Widget — Product Page
 * Version : 2.9.27
 * Built   : 2026-06-02
 *
 * Cache note: Shopify CDN cache is busted automatically by shopify app deploy.
 * After deploying, allow 2-10 minutes for propagation before testing.
 * Verify live version: console.log(window.__BUNDLE_WIDGET_VERSION__)
 */
window.__BUNDLE_WIDGET_VERSION__ = '2.9.27';
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

  function _normalizeOperator(operator) {
    if (typeof operator !== 'string' || operator.length === 0) return operator;
    if (operator.indexOf('_') !== -1) return operator;
    return operator.replace(/([A-Z])/g, '_$1').toLowerCase();
  }

  function _sumQuantities(selections) {
    let total = 0;
    if (!selections) return total;
    for (const qty of Object.values(selections)) {
      total += Number(qty) || 0;
    }
    return total;
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

  function evaluateCategoryRules(category, stepSelections) {
    const rules = Array.isArray(category && category.conditions) ? category.conditions : [];
    if (rules.length === 0) return true;

    const productIds = _collectCategoryProductIds(category);
    const selections = stepSelections || {};
    let categoryTotal = 0;
    for (const pid of Object.keys(selections)) {
      if (productIds.has(String(pid))) {
        categoryTotal += Number(selections[pid]) || 0;
      }
    }

    for (const rule of rules) {
      const operator = _normalizeOperator(rule && (rule.operator || rule.condition));
      const value = Number(rule && rule.value);
      if (!Number.isFinite(value)) continue;
      if (!_evaluateSatisfied(operator, value, categoryTotal)) return false;
    }
    return true;
  }

  function _isCategoryRuleMode(step) {
    const categories = Array.isArray(step && step.categories) ? step.categories : [];
    return categories.some(c => Array.isArray(c && c.conditions) && c.conditions.length > 0);
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
    evaluateCategoryRules,
    isCategoryRuleMode: _isCategoryRuleMode,
    getAllowedQuantityPerProduct,
    canUpdateProductQuantity,
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
    FIXED_BUNDLE_PRICE: 'fixed_bundle_price',
    BUY_X_GET_Y: 'buy_x_get_y'
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
    if (dtoDiscountDisplay?.valueToken && this.shouldUseDtoDiscountDisplay(discountMethod, ruleToUse)) {
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
        <div class="inline-quantity-controls">
          <button class="inline-qty-btn qty-decrease" data-product-id="${selectionKey}">−</button>
          <span class="inline-qty-display">${currentQuantity}</span>
          <button class="inline-qty-btn qty-increase" data-product-id="${selectionKey}">+</button>
        </div>
      `;
    };

    const renderBottomAction = () => {
      if (actionMode === 'expandingQuantity') {
        return `
          <div class="product-card-action ${isSelected ? 'is-expanded' : ''}">
            ${isSelected ? renderInlineQuantityControls() : `<button class="product-add-btn" data-product-id="${selectionKey}">${this.escapeHtml(addButtonText)}</button>`}
          </div>
        `;
      }

      if (isSelected) {
        return renderInlineQuantityControls();
      }
      return `<button class="product-add-btn" data-product-id="${selectionKey}">${this.escapeHtml(addButtonText)}</button>`;
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
  /**
   * Normalize a raw preset id to one of the four supported values.
   * Accepts STANDARD as an alias for DEFAULT (admin payload uses STANDARD).
   */
  function resolvePresetAttr(bundle) {
    const raw =
      (bundle && (bundle.bundleDesignPresetId || bundle.bundleDesignPreset || bundle.templateId)) || '';
    if (typeof raw !== 'string') return 'DEFAULT';
    const upper = raw.trim().toUpperCase();
    if (upper === '' || upper === 'STANDARD') return 'DEFAULT';
    return upper;
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

  return {
    resolvePresetAttr,
    resolveTemplateAttr,
    markContainer,
  };
}());

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FullPagePreset;
}

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
  window.__bsHelpers = { bsFindNextIncompleteStep, bsIsDefaultStep, bsGetDiscountBadgeLabel };
}

class BundleWidgetProductPage {

  constructor(containerElement) {
    this.container = containerElement;
    this.selectedBundle = null;
    this.selectedProducts = [];
    this.stepProductData = [];
    this.directDefaultProducts = [];
    this.activeInpageCategoryIndexes = {};
    this.currentStepIndex = 0;
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

  async init() {
    try {

      if (this.container.dataset.initialized === 'true') {
        return;
      }

      this.parseConfiguration();

      let initialGif = null;
      try { initialGif = JSON.parse(this.container.dataset.bundleConfig || '{}')?.loadingGif || null; } catch {}
      this.showLoadingOverlay(initialGif);

      await this.loadDesignSettingsCSS();

      this._scheduleCartTransformSelfHeal();

      await this.loadBundleData();

      if (!this.bundleData) return;

      this.selectBundle();

      if (!this.selectedBundle) {
        this.hideLoadingOverlay();
        this.showFallbackUI();
        return;
      }

      this.initializeDataStructures();
      this._initDirectDefaultProducts();
      await this._preloadDirectDefaultProducts();

      await this._preloadDefaultStepProducts();

      this._relocateContainerToProductForm();
      this._hideNativeProductPrice();

      this.setupDOMElements();
      this._markProductPageTemplate();

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
      showStepNumbers: dataset.showStepNumbers !== 'false',

      showQuantitySelectorOnCard: dataset.showQuantitySelectorOnCard !== 'false',

      discountTextTemplate: 'Add {conditionText} to get {discountText}',
      successMessageTemplate: 'Congratulations! You got {discountText}!',
      currentProductId: window.currentProductId,
      currentProductGid: window.currentProductGid,
      currentProductHandle: window.currentProductHandle,
      currentProductCollections: window.currentProductCollections
    };
  }

  async loadBundleData() {
    let bundleData = null;

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

      this.container.style.display = 'none';
      return;
    }

    this.bundleData = bundleData;
  }

  selectBundle() {
    this.selectedBundle = BundleDataManager.selectBundle(this.bundleData, this.config);

    this.widgetStyle = 'bottom-sheet';

    this.updateMessagesFromBundle();
  }

  _getProductPageTemplateType() {
    return this.selectedBundle?.bundleDesignTemplate || '';
  }

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
  }

  _isProductPageModalSlotTemplate() {
    return this._getProductPageTemplateType() === 'PDP_MODAL';
  }

  _isProductPageInpageTemplate() {
    return this._getProductPageTemplateType() === 'PDP_INPAGE';
  }

  _isProductPageCogniveTemplate() {
    return this._getProductPageTemplateType() === 'PDP_INPAGE'
      && this._getProductPageDesignPreset() === 'COGNIVE';
  }

  _usesVerticalModalSlotLayout() {
    return this._getProductPageTemplateType() === 'PDP_MODAL'
      && this.selectedBundle?.renderFilledSlotsAsHorizontalStacked !== true;
  }

  _markProductPageTemplate() {
    if (!this.container || !this.elements?.stepsContainer || !this.selectedBundle) return;

    const templateType = this._getProductPageTemplateType();
    const designPreset = this._getProductPageDesignPreset();

    this.container.dataset.ppbTemplateType = templateType;
    this.container.dataset.ppbDesignPreset = designPreset;
    this.elements.stepsContainer.dataset.ppbTemplateType = templateType;
    this.elements.stepsContainer.dataset.ppbDesignPreset = designPreset;

    if (templateType === 'PDP_MODAL') {
      const slotOrientation = this._usesVerticalModalSlotLayout() ? 'vertical' : 'horizontal';
      this.container.dataset.ppbSlotOrientation = slotOrientation;
      this.elements.stepsContainer.dataset.ppbSlotOrientation = slotOrientation;
    } else {
      delete this.container.dataset.ppbSlotOrientation;
      delete this.elements.stepsContainer.dataset.ppbSlotOrientation;
    }
  }

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
      if (step.isFreeGift || step.isDefault) return true;
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

    this.selectedProducts = Array(stepsCount).fill(null).map(() => ({}));

    this.stepProductData = Array(stepsCount).fill(null).map(() => ([]));
    this._stepFetchFailed = {};
    this.giftMessageState = { message: '', from: '', to: '' };

    this.selectedBundle.steps.forEach((step, i) => {
      if (step.isDefault && step.defaultVariantId) {
        const normalizedDefaultVariantId = this.normalizeSelectionKey(step.defaultVariantId);
        if (normalizedDefaultVariantId) {
          this.setSelectedQuantity(i, normalizedDefaultVariantId, 1);
        }
      }
    });
  }

  _getDirectDefaultProductsData() {
    const data = this.selectedBundle?.defaultProductsData;
    if (!data || data.isDefaultProductsEnabled !== true || !Array.isArray(data.products)) {
      return null;
    }
    return data;
  }

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
    const quantityAvailable = available && inventoryQuantity === 0 ? null : inventoryQuantity;

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
  }

  _getDirectDefaultProductItems() {
    const data = this._getDirectDefaultProductsData();
    if (!data) return [];
    return data.products
      .map(product => this._normalizeDirectDefaultProduct(product))
      .filter(Boolean);
  }

  _initDirectDefaultProducts() {
    this.directDefaultProducts = this._getDirectDefaultProductItems();
    if (this.directDefaultProducts.length === 0 || !this.selectedProducts[0]) return;

    this.directDefaultProducts.forEach(product => {
      this.setSelectedQuantity(0, product.variantId, product.defaultRequiredQuantity || 1);
    });
  }

  async _preloadDirectDefaultProducts() {
    if (this.directDefaultProducts.length === 0 || !this.selectedBundle?.steps?.[0]) return;
    await this.loadStepProducts(0).catch(() => {});
  }

  _mergeDirectDefaultProductsIntoStep(stepIndex, products) {
    if (stepIndex !== 0 || this.directDefaultProducts.length === 0) return products;
    return products.concat(this.directDefaultProducts);
  }

  _isDirectDefaultVariant(variantId) {
    const normalizedVariantId = this.extractId(variantId);
    return this.directDefaultProducts.some(product => product.variantId === normalizedVariantId);
  }

  _getDirectDefaultRequiredQuantity(variantId) {
    const normalizedVariantId = this.extractId(variantId);
    const product = this.directDefaultProducts.find(item => item.variantId === normalizedVariantId);
    return product ? (product.defaultRequiredQuantity || 1) : null;
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
    const variantId = this.normalizeSelectionKey(step.defaultVariantId);
    return this.findProductBySelectionKey(products, variantId) || products[0] || null;
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
  }

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
  }

  _getNativeProductInfoRoot(productForm) {
    return productForm?.closest?.(
      '[id^="ProductInformation-"], .product-details, .group-block-content, .product-information, .product__info-container, .product__info-wrapper, .product__info, product-info, .product'
    ) || productForm?.parentElement || null;
  }

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
  }

  setupDOMElements() {
    const modalEl = this.ensureBottomSheet();

    this.elements = {
      defaultProducts: this.container.querySelector('.bw-default-products') || this._createDirectDefaultProductsEl(),
      stepsContainer: this.container.querySelector('.bundle-steps') || this.createStepsContainer(),
      qtyPillsEl: this.container.querySelector('.bw-qty-pills') || this._createQtyPillsEl(),
      giftMessageEl: this.container.querySelector('.bw-gift-message') || this._createGiftMessageEl(),
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
    if (!this.container.querySelector('.bw-gift-message')) {
      this.container.appendChild(this.elements.giftMessageEl);
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
  }

  _createQtyPillsEl() {
    const el = document.createElement('div');
    el.className = 'bw-qty-pills';
    el.style.display = 'none';
    return el;
  }

  _createDirectDefaultProductsEl() {
    const el = document.createElement('div');
    el.className = 'bw-default-products';
    el.style.display = 'none';
    return el;
  }

  _createGiftMessageEl() {
    const el = document.createElement('div');
    el.className = 'bw-gift-message';
    el.style.display = 'none';
    return el;
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

      panel.className = 'bw-bs-panel bundle-builder-modal';
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
    return footer;
  }

  createAddToCartButton() {
    const button = document.createElement('button');
    button.className = 'add-bundle-to-cart';
    button.textContent = this._resolveText('addToCartButton', 'Add Bundle to Cart');
    button.type = 'button';
    return button;
  }

  _createDynamicCheckoutVisual() {
    const button = document.createElement('div');
    button.className = 'bw-ppb-dynamic-checkout-visual';
    button.setAttribute('role', 'button');
    button.setAttribute('aria-disabled', 'true');
    button.textContent = 'Buy it now';
    return button;
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

  renderUI() {
    this._renderDirectDefaultProducts();
    this.renderSteps();
    this.renderQuantityOptionPills();
    this.renderGiftMessageUI();
    this.renderFooter();
    this.updateAddToCartButton();
  }

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
  }

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
    el.style.cssText = 'display:block;margin:0 0 14px;';

    if (data.defaultProductsTitle) {
      const title = document.createElement('h3');
      title.className = 'bw-default-products__title';
      title.textContent = data.defaultProductsTitle;
      title.style.cssText = 'font-size:14px;font-weight:700;margin:0 0 10px;color:#1a1a1a;';
      el.appendChild(title);
    }

    const list = document.createElement('div');
    list.className = 'bw-default-products__list';
    list.style.cssText = 'display:flex;flex-direction:column;gap:8px;';
    const currencyInfo = CurrencyManager.getCurrencyInfo();

    products.forEach(product => {
      const quantity = this.getSelectedQuantity(0, product.variantId) || product.defaultRequiredQuantity || 1;
      const line = document.createElement('div');
      line.className = 'bw-default-products__line';
      line.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;';

      const details = document.createElement('div');
      details.className = 'bw-default-products__details';
      details.style.cssText = 'display:flex;align-items:center;gap:10px;min-width:0;';

      const image = document.createElement('img');
      image.className = 'bw-default-products__image';
      image.src = product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;
      image.alt = product.title || '';
      image.style.cssText = 'width:44px;height:44px;object-fit:cover;border-radius:4px;';
      details.appendChild(image);

      const text = document.createElement('div');
      text.className = 'bw-default-products__text';
      text.style.cssText = 'display:flex;flex-direction:column;gap:3px;min-width:0;';

      const name = document.createElement('span');
      name.className = 'bw-default-products__name';
      name.textContent = `${product.title} x ${quantity}`;
      name.style.cssText = 'font-size:13px;font-weight:700;color:#1a1a1a;';
      text.appendChild(name);

      const price = document.createElement('span');
      price.className = 'bw-default-products__price';
      price.textContent = CurrencyManager.convertAndFormat(product.price * quantity, currencyInfo);
      price.style.cssText = 'font-size:13px;font-weight:700;color:#1a1a1a;';
      text.appendChild(price);
      details.appendChild(text);
      line.appendChild(details);

      const quantityBadge = document.createElement('span');
      quantityBadge.className = 'bw-default-products__quantity';
      quantityBadge.textContent = `x ${quantity}`;
      quantityBadge.style.cssText = 'font-size:13px;color:#1a1a1a;white-space:nowrap;';
      line.appendChild(quantityBadge);
      list.appendChild(line);
    });

    el.appendChild(list);
  }

  _createStepBannerImage(step) {
    if (!step?.bannerImageUrl) return null;
    const wrapper = document.createElement('div');
    wrapper.className = 'step-banner-image';
    const img = document.createElement('img');
    img.src = step.bannerImageUrl;
    img.alt = step.name || '';
    img.style.cssText = 'width:100%;display:block;';
    wrapper.appendChild(img);
    return wrapper;
  }

  renderProductPageLayout() {
    this.selectedBundle.steps.forEach((step, stepIndex) => {
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

          if (!this.validateStep(stepIndex)) {
            const totalQty = selectedEntries.reduce((sum, [, qty]) => sum + qty, 0);
            target.appendChild(this.createAddMoreCard(step, stepIndex, totalQty));
          }
        } else {

          const card = this.createEmptyStateCard(step, stepIndex, 0);
          target.appendChild(card);
        }
      }
    });
  }

  _createModalSlotStepSection(step) {
    const section = document.createElement('div');
    const isVertical = this._usesVerticalModalSlotLayout();

    section.className = `bw-ppb-modal-slot-section${isVertical ? ' bw-ppb-modal-slot-section--simplified' : ''}`;

    const title = document.createElement('div');
    title.className = 'bw-ppb-modal-slot-title';
    title.textContent = step.pageTitle || step.name || '';
    section.appendChild(title);

    const grid = document.createElement('div');
    grid.className = `bw-ppb-modal-slot-grid${isVertical ? ' bw-ppb-modal-slot-grid--simplified' : ''}`;
    section.appendChild(grid);

    return section;
  }

  _createInpageStepSection(step, stepIndex) {
    const section = document.createElement('div');
    const preset = this._getProductPageDesignPreset();
    section.className = `bw-ppb-inpage-step-section bw-ppb-inpage-step-section--${preset.toLowerCase()}`;

    const title = document.createElement('div');
    title.className = 'bw-ppb-inpage-step-title';
    title.textContent = step.pageTitle || step.name || '';
    section.appendChild(title);

    const tabs = this._createInpageCategoryTabs(step, stepIndex);
    if (tabs) section.appendChild(tabs);

    const grid = document.createElement('div');
    grid.className = 'bw-ppb-inpage-step-grid';
    section.appendChild(grid);

    return section;
  }

  _createInpageCategoryTabs(step, stepIndex) {
    const categories = Array.isArray(step?.categories) ? step.categories : [];
    if (categories.length <= 1) return null;

    if (typeof this.activeInpageCategoryIndexes[stepIndex] !== 'number') {
      this.activeInpageCategoryIndexes[stepIndex] = 0;
    }

    const tabs = document.createElement('div');
    tabs.className = 'bw-ppb-inpage-category-tabs';

    categories.forEach((category, categoryIndex) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `bw-ppb-inpage-category-tab${categoryIndex === this.activeInpageCategoryIndexes[stepIndex] ? ' active' : ''}`;
      button.dataset.categoryIndex = String(categoryIndex);
      button.textContent = this._getInpageCategoryLabel(category, categoryIndex);
      button.addEventListener('click', () => {
        this.activeInpageCategoryIndexes[stepIndex] = categoryIndex;
        tabs.querySelectorAll('.bw-ppb-inpage-category-tab').forEach(tab => {
          tab.classList.toggle('active', tab === button);
        });
        const grid = tabs.parentElement?.querySelector('.bw-ppb-inpage-step-grid');
        if (grid) this._renderInpageStepProducts(stepIndex, grid);
      });
      tabs.appendChild(button);
    });

    return tabs;
  }

  _getInpageCategoryLabel(category, categoryIndex) {
    return category?.title || category?.name || `Category ${categoryIndex + 1}`;
  }

  _getCategoryProductIds(category) {
    const ids = new Set();
    const addProductId = (product) => {
      const id = product?.id || product?.graphqlId || product?.productId;
      if (id) ids.add(this.extractId(id));
    };

    (category?.products || []).forEach(addProductId);
    (category?.selectedProducts || []).forEach(addProductId);
    return ids;
  }

  _categoryHasCollections(category) {
    return Boolean(
      category?.collections?.length
      || category?.collectionsData?.length
      || category?.collectionsSelectedData?.length
    );
  }

  _filterProductsForInpageCategory(step, products, stepIndex) {
    const categories = Array.isArray(step?.categories) ? step.categories : [];
    if (categories.length <= 1) return products;

    const activeIndex = this.activeInpageCategoryIndexes[stepIndex] || 0;
    const category = categories[activeIndex];
    const categoryProductIds = this._getCategoryProductIds(category);

    if (categoryProductIds.size === 0) {
      return this._categoryHasCollections(category) ? products : [];
    }

    return products.filter(product => {
      const productId = this.extractId(product.parentProductId || product.id);
      return categoryProductIds.has(productId);
    });
  }

  _renderInpageStepProducts(stepIndex, target) {
    const rawProducts = this.stepProductData[stepIndex] || [];

    if (rawProducts.length === 0 && !(this._stepFetchFailed && this._stepFetchFailed[stepIndex])) {
      target.innerHTML = '<div class="bw-ppb-inpage-loading">Loading products...</div>';
      this.loadStepProducts(stepIndex).then(() => {
        if (target.isConnected) this._renderInpageStepProducts(stepIndex, target);
      }).catch(() => {
        if (!this._stepFetchFailed) this._stepFetchFailed = {};
        this._stepFetchFailed[stepIndex] = true;
        if (target.isConnected) this._renderInpageStepProducts(stepIndex, target);
      });
      return;
    }

    const currentStep = this.selectedBundle?.steps?.[stepIndex];
    const products = this._filterProductsForInpageCategory(
      currentStep,
      this.expandProductsByVariant(rawProducts),
      stepIndex
    );
    if (products.length === 0) {
      target.innerHTML = this._stepFetchFailed?.[stepIndex]
        ? '<p class="modal-fetch-error">Could not load products. Please check your connection and try again.</p>'
        : '<p class="no-products-message">No products are configured for this step.</p>';
      return;
    }

    const selectedProducts = this.selectedProducts[stepIndex] || {};
    const showQuantitySelector = this.config.showQuantitySelectorOnCard;
    const productQuantityLimit = ConditionValidator.getAllowedQuantityPerProduct(
      this.selectedBundle?.validateQuantityPerProduct
    );
    const currencyInfo = CurrencyManager.getCurrencyInfo();

    target.innerHTML = products.map(product => {
      const selectionKey = product.variantId || product.id;
      const currentQuantity = this.getSelectedQuantity(stepIndex, selectionKey);
      const { available, outOfStock } = this.getVariantAvailable(stepIndex, selectionKey);
      const atMaxStock = available !== null && currentQuantity >= available;
      const atMaxProductQuantity = productQuantityLimit !== null && currentQuantity >= productQuantityLimit;
      const increaseDisabled = outOfStock || atMaxStock || atMaxProductQuantity;
      const addDisabled = outOfStock;
      const stockBadge = outOfStock
        ? '<div class="product-stock-badge product-stock-badge--out">Out of stock</div>'
        : '';

      return `
        <div class="product-card ${currentQuantity > 0 ? 'selected' : ''} ${outOfStock ? 'is-out-of-stock' : ''}" data-product-id="${selectionKey}">
          ${currentQuantity > 0 ? '<div class="selected-overlay">✓</div>' : ''}
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
            ${this.renderVariantSelector(product)}
            ${showQuantitySelector ? `
              <div class="product-quantity-wrapper">
                <div class="product-quantity-selector">
                  <button class="qty-btn qty-decrease" data-product-id="${selectionKey}">−</button>
                  <span class="qty-display">${currentQuantity}</span>
                  <button class="qty-btn qty-increase" data-product-id="${selectionKey}" ${increaseDisabled ? 'disabled aria-disabled="true"' : ''}>+</button>
                </div>
              </div>
            ` : ''}
            <button class="product-add-btn ${currentQuantity > 0 ? 'added' : ''}" data-product-id="${selectionKey}" ${addDisabled ? 'disabled aria-disabled="true"' : ''}>
              ${outOfStock ? 'Out of stock' : (currentQuantity > 0 ? (currentStep?.addonReplaceText || 'Selected ✓') : (currentStep?.addonAddText || 'Add +'))}
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.attachProductEventHandlers(target, stepIndex);
  }

  createEmptyStateCard(step, stepIndex, instanceIndex = 0) {
    const stepBox = document.createElement('div');
    stepBox.dataset.stepIndex = stepIndex;

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
      iconWrapper.style.cssText = `
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: color-mix(in srgb, ${primaryColor} 8%, transparent);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 10px;
      `;
      iconWrapper.innerHTML = `<svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.202 3.06152V37.0082M37.1753 20.0348H3.22864" stroke="currentColor" stroke-width="5.09199" stroke-linecap="square" stroke-linejoin="round"/>
      </svg>`;
      iconWrapper.style.color = primaryColor;
      stepBox.appendChild(iconWrapper);
    }

    const slotNumber = instanceIndex + 1;
    const label = document.createElement('p');
    label.className = 'step-name bw-slot-card__label';
    label.textContent = isModalSlotTemplate ? `Product ${slotNumber}` : step.name || `Step ${stepIndex + 1}`;
    stepBox.appendChild(label);

    stepBox.addEventListener('click', () => this.openModal(stepIndex));

    return stepBox;
  }

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
  }

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

    const displayTitle = product.title.length > 25
      ? product.title.substring(0, 25) + '...'
      : product.title;
    productTitle.textContent = displayTitle;
    productTitle.title = product.title;
    stepBox.appendChild(productTitle);

    stepBox.addEventListener('click', () => {

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

        const clearBadge = document.createElement('div');
        clearBadge.className = 'step-clear-badge';
        clearBadge.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#f3f4f6"/><path d="M8 8L16 16M16 8L8 16" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        clearBadge.addEventListener('click', (e) => {
          e.stopPropagation();
          this.removeProductFromSelection(stepIndex, variantId);
        });
        stepBox.appendChild(clearBadge);

        const productTitle = document.createElement('p');
        productTitle.className = 'step-name step-name-completed product-title-state';
        const displayTitle = product.title.length > 25 ? product.title.substring(0, 25) + '...' : product.title;
        productTitle.textContent = displayTitle;
        stepBox.appendChild(productTitle);

        stepBox.appendChild(this._createRibbonSvg());
        stepBox.addEventListener('click', () => this.openModal(stepIndex));
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
    iconWrapper.innerHTML = `<svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.202 3.06152V37.0082M37.1753 20.0348H3.22864" stroke="currentColor" stroke-width="5.09199" stroke-linecap="square" stroke-linejoin="round"/>
    </svg>`;
    iconWrapper.style.color = primaryColorBS;
    stepBox.appendChild(iconWrapper);

    const label = document.createElement('p');
    label.className = 'step-name bw-slot-card__label';
    label.textContent = step.addonLabel || `Free ${step.name || `Step ${stepIndex + 1}`}`;
    stepBox.appendChild(label);

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

    const badgeUrl = getComputedStyle(document.documentElement)
      .getPropertyValue('--bundle-free-gift-badge-url').trim();
    const hasMerchantBadge = badgeUrl && badgeUrl !== 'none' && badgeUrl !== '';
    if (hasMerchantBadge) {

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

  renderFullPageLayout() {

    this.renderProductPageLayout();
  }

  clearStepSelections(stepIndex) {

    this.selectedProducts[stepIndex] = {};
    if (stepIndex === 0 && this.directDefaultProducts.length > 0) {
      this.directDefaultProducts.forEach(product => {
        this.setSelectedQuantity(0, product.variantId, product.defaultRequiredQuantity || 1);
      });
    }

    this._renderDirectDefaultProducts();
    this.renderSteps();
    this.updateAddToCartButton();
    this.updateFooterMessaging();

    ToastManager.show(`All selections cleared from this step`);
  }

  renderFooter() {
    const el = this.elements.footer;
    if (!el) return;
    el.innerHTML = '';

    const displayOptions = this.selectedBundle?.messaging?.displayOptions;
    const pbConfig = displayOptions?.progressBar;
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
    const conditionValue = PricingCalculator.getRuleConditionValue(rule, discountMethod);
    const conditionType = PricingCalculator.getRuleConditionType(rule);
    const current = conditionType === 'quantity' ? totalQuantity : totalPrice / 100;
    const progress = conditionValue > 0 ? Math.min(1, current / conditionValue) : 1;
    const met = progress >= 1;

    const discountInfo = PricingCalculator.calculateDiscount(this.selectedBundle, totalPrice, totalQuantity, unitPrices);
    const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);
    const discountText = combinedDiscountInfo.hasDiscount
      ? (this.selectedBundle.pricing.method === 'percentage_off'
          ? `${rule.discountValue ?? 0}% off`
          : CurrencyManager.convertAndFormat(combinedDiscountInfo.savings, CurrencyManager.getCurrencyInfo()))
      : '';

    const template = met
      ? (pbConfig.successText || this.selectedBundle.messaging?.successTemplate || 'You got {discountText}!')
      : (pbConfig.progressText || this.selectedBundle.messaging?.progressTemplate || 'Add {conditionText} more to get {discountText}');

    const diff = Math.max(0, conditionValue - current);
    const conditionText = conditionType === 'quantity'
      ? `${Math.ceil(diff)} item${Math.ceil(diff) !== 1 ? 's' : ''}`
      : CurrencyManager.convertAndFormat(diff * 100, CurrencyManager.getCurrencyInfo());

    const message = template
      .replace(/{discountText}/g, discountText)
      .replace(/{conditionText}/g, conditionText)
      .replace(/{amountNeeded}/g, conditionText)
      .replace(/{itemsNeeded}/g, `${Math.ceil(diff)}`)
      .replace(/{progressPercentage}/g, `${Math.round(progress * 100)}`);

    const primary = getComputedStyle(document.documentElement).getPropertyValue('--bundle-global-primary-button').trim() || '#1e3a8a';
    el.style.display = '';
    el.style.cssText = 'margin: 10px 0; padding: 10px 0;';

    const msgEl = document.createElement('p');
    msgEl.textContent = message;
    msgEl.style.cssText = `font-size:13px;text-align:center;margin:0 0 8px;color:${met ? primary : '#1a1a1a'};font-weight:${met ? '600' : '400'};`;
    el.appendChild(msgEl);

    const track = document.createElement('div');
    track.style.cssText = 'height:6px;background:#e1e3e5;border-radius:3px;overflow:hidden;';
    const fill = document.createElement('div');
    fill.style.cssText = `height:100%;width:${Math.round(progress * 100)}%;background:${primary};border-radius:3px;transition:width 0.3s ease;`;
    track.appendChild(fill);
    el.appendChild(track);
  }

  updateFooterMessaging() {
    this.renderFooter();
  }

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
    el.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;';

    const primary = getComputedStyle(document.documentElement).getPropertyValue('--bundle-global-primary-button').trim() || '#1e3a8a';
    const defaultIndex = qtyOpts.defaultRuleIndex ?? 0;

    rules.forEach((rule, index) => {
      const label = qtyOpts.labels?.[index] || `Option ${index + 1}`;
      const subtext = qtyOpts.subtexts?.[index] || '';
      const isActive = index === defaultIndex;

      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'bw-qty-pill' + (isActive ? ' bw-qty-pill--active' : '');
      pill.style.cssText = `
        padding:8px 16px;border-radius:24px;cursor:pointer;transition:all 0.15s;
        display:flex;flex-direction:column;align-items:center;line-height:1.2;
        border:2px solid ${isActive ? primary : '#e1e3e5'};
        background:${isActive ? primary : 'white'};
        color:${isActive ? 'white' : '#1a1a1a'};
        font-size:14px;font-weight:600;
      `;

      const labelEl = document.createElement('span');
      labelEl.textContent = label;
      pill.appendChild(labelEl);

      if (subtext) {
        const subtextEl = document.createElement('span');
        subtextEl.textContent = subtext;
        subtextEl.style.cssText = 'font-size:11px;font-weight:400;opacity:0.8;';
        pill.appendChild(subtextEl);
      }

      pill.addEventListener('click', () => {
        el.querySelectorAll('.bw-qty-pill').forEach(p => {
          p.style.border = '2px solid #e1e3e5';
          p.style.background = 'white';
          p.style.color = '#1a1a1a';
          p.classList.remove('bw-qty-pill--active');
        });
        pill.style.border = `2px solid ${primary}`;
        pill.style.background = primary;
        pill.style.color = 'white';
        pill.classList.add('bw-qty-pill--active');

        this.renderFooter();
        this.updateAddToCartButton();
      });

      el.appendChild(pill);
    });
  }

  renderGiftMessageUI() {
    const el = this.elements.giftMessageEl;
    if (!el) return;
    el.innerHTML = '';

    const bundle = this.selectedBundle;
    if (!bundle?.giftMessagesEnabled || !bundle?.giftMessageProductId) {
      el.style.display = 'none';
      return;
    }

    el.style.display = 'block';
    el.style.cssText = 'display:block;margin:14px 0;padding:16px;background:#f9fafb;border-radius:8px;border:1px solid #e1e3e5;';

    const heading = document.createElement('p');
    heading.textContent = bundle.giftMessageProductTitle || 'Gift Message';
    heading.style.cssText = 'font-size:14px;font-weight:600;margin:0 0 12px;color:#1a1a1a;';
    el.appendChild(heading);

    if (bundle.giftMessageEnableSenderRecipient) {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;';

      const fromInput = document.createElement('input');
      fromInput.type = 'text';
      fromInput.placeholder = 'From';
      fromInput.value = this.giftMessageState.from;
      fromInput.style.cssText = 'flex:1;padding:8px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;';
      fromInput.addEventListener('input', () => {
        this.giftMessageState.from = fromInput.value;
        this.updateAddToCartButton();
      });

      const toInput = document.createElement('input');
      toInput.type = 'text';
      toInput.placeholder = 'To';
      toInput.value = this.giftMessageState.to;
      toInput.style.cssText = 'flex:1;padding:8px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;';
      toInput.addEventListener('input', () => {
        this.giftMessageState.to = toInput.value;
        this.updateAddToCartButton();
      });

      row.appendChild(fromInput);
      row.appendChild(toInput);
      el.appendChild(row);
    }

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Write your gift message here…';
    textarea.value = this.giftMessageState.message;
    textarea.rows = 3;
    textarea.style.cssText = 'width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;resize:vertical;';

    if (bundle.giftMessageEnableLimit && bundle.giftMessageCharLimit) {
      textarea.maxLength = bundle.giftMessageCharLimit;

      const counter = document.createElement('p');
      counter.style.cssText = 'font-size:11px;color:#6d7175;text-align:right;margin:4px 0 0;';
      counter.textContent = `0 / ${bundle.giftMessageCharLimit}`;

      textarea.addEventListener('input', () => {
        this.giftMessageState.message = textarea.value;
        counter.textContent = `${textarea.value.length} / ${bundle.giftMessageCharLimit}`;
        this.updateAddToCartButton();
      });

      el.appendChild(textarea);
      el.appendChild(counter);
    } else {
      textarea.addEventListener('input', () => {
        this.giftMessageState.message = textarea.value;
        this.updateAddToCartButton();
      });
      el.appendChild(textarea);
    }
  }

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

    const allStepsValid = this.selectedBundle.steps.every((step, index) => {
      if (step.isFreeGift || step.isDefault) return true;
      return this.validateStep(index);
    });

    const paidTotalQuantity = this.selectedProducts.reduce((sum, stepSelections, i) => {
      const step = this.selectedBundle.steps[i];
      if (step.isFreeGift || step.isDefault) return sum;
      return sum + Object.values(stepSelections || {}).reduce((s, qty) => s + qty, 0);
    }, 0);

    const giftMandatoryBlocking = this.selectedBundle?.giftMessagesEnabled &&
      this.selectedBundle?.giftMessageMandatory &&
      this.selectedBundle?.giftMessageProductId &&
      (!this.giftMessageState?.message || this.giftMessageState.message.trim() === '');

    if (paidTotalQuantity === 0 || !allStepsValid || giftMandatoryBlocking) {
      if (paidTotalQuantity === 0) {
        button.textContent = this._resolveText('addToCartButton', 'Add Bundle to Cart');
      } else if (giftMandatoryBlocking) {
        button.textContent = 'Add a gift message to continue';
      } else {

        button.textContent = this._resolveText('completeSteps', 'Complete All Steps to Continue');
      }
      button.disabled = true;
      button.classList.add('disabled');
    } else {

      const currencyInfo = CurrencyManager.getCurrencyInfo();
      const formattedPrice = CurrencyManager.convertAndFormat(combinedDiscountInfo.finalPrice, currencyInfo);

      button.textContent = `${this._resolveText('addToCartButton', 'Add Bundle to Cart')} \u2022 ${formattedPrice}`;

      button.disabled = false;
      button.classList.remove('disabled');
    }

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

  getFormattedHeaderText() {
    const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
    return currentStep?.name || `Step ${this.currentStepIndex + 1}`;
  }

  openModal(stepIndex) {
    this.currentStepIndex = stepIndex;

    const modal = this.elements.modal;
    const headerText = this.getFormattedHeaderText();

    modal.querySelector('.modal-step-title').innerHTML = headerText;

    this.renderModalTabs();
    this.renderModalProductsLoading(stepIndex);
    this.updateModalNavigation();
    this.updateModalFooterMessaging();

    if (this.elements.bsOverlay) this.elements.bsOverlay.classList.add('bw-bs-overlay--open');
    requestAnimationFrame(() => {
      modal.classList.add('bw-bs-panel--open');
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
      if (productGrid) productGrid.innerHTML = '<p class="error-message">Failed to load products. Please try again.</p>';
      ToastManager.show('Failed to load products for this step');
    });
  }

  closeModal() {
    this.elements.modal.classList.remove('bw-bs-panel--open');
    if (this.elements.bsOverlay) this.elements.bsOverlay.classList.remove('bw-bs-overlay--open');
    document.body.style.overflow = '';

    this.renderSteps();
    this.updateAddToCartButton();
    this.updateFooterMessaging();
  }

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
  }

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
  }

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
  }

  async loadStepProducts(stepIndex) {
    const step = this.selectedBundle.steps[stepIndex];

    if (this.stepProductData[stepIndex].length > 0) {
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
  }

  processProductsForStep(products, step) {

    const normalizeVariant = (v) => ({
      id: this.extractId(v.id),
      title: v.title,
      price: parseFloat(v.price || '0') * 100,
      compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) * 100 : null,
      sellingPlanAllocations: Array.isArray(v.sellingPlanAllocations)
        ? v.sellingPlanAllocations
        : [],
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

            const imageUrl = variant?.image?.src || product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;

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
              sellingPlanAllocations: variant.sellingPlanAllocations || [],

              parentProductId: this.extractId(product.id),
              parentTitle: product.title,
              variants: processedVariants,
              options: processedOptions,
              images: product.images || (product.imageUrl ? [{ src: product.imageUrl }] : []),
              description: product.description || ''
            };
          });
      } else {

        const defaultVariant = product.variants?.find(variant => variant.available === true) || product.variants?.[0];

        const imageUrl = defaultVariant?.image?.src || product.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;

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
            sellingPlanAllocations: defaultVariant?.sellingPlanAllocations || [],
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
    if (qty === 0 && !backorder) {
      return { available: 0, outOfStock: true, acceptsBackorder: false };
    }
    return { available: qty, outOfStock: false, acceptsBackorder: backorder };
  }

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
  }

  shouldApplyIndividualSellingPlanSelection() {
    return this.selectedBundle?.individualSellingPlanSelection?.isEnabled === true;
  }

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
  }

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
  }

  extractId(idString) {
    if (!idString) return null;

    const gidMatch = idString.toString().match(/gid:\/\/shopify\/\w+\/(\d+)/);
    if (gidMatch) {
      return gidMatch[1];
    }

    return idString.toString().split('/').pop();
  }

  normalizeSelectionKey(variantId) {
    const normalized = this.extractId(variantId);
    if (normalized == null) return '';
    return String(normalized);
  }

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
  }

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

    if (quantity > 0) {
      selectedProducts[normalized] = quantity;
    }
  }

  getAddonLineDiscount(step) {
    const tier = Array.isArray(step?.addonTiers) ? step.addonTiers[0] : null;
    const discount = step?.addonDiscount || tier?.discount || {};
    const type = String(discount.type || '').toUpperCase();
    const value = Number(discount.value || 0);
    if (type !== 'PERCENTAGE' || !Number.isFinite(value) || value <= 0) return null;
    return { type, value: Math.min(100, value) };
  }

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
  }

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
  }

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
  }

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

        if (index > this.currentStepIndex && !this.validateStep(this.currentStepIndex)) {
          ToastManager.show('Please meet the step conditions before proceeding.');
          return;
        }

        this.currentStepIndex = index;

        const headerText = this.getFormattedHeaderText();
        this.elements.modal.querySelector('.modal-step-title').innerHTML = headerText;

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
  }

  renderModalProducts(stepIndex, productsToRender = null) {

    const rawProducts = productsToRender || this.stepProductData[stepIndex];

    const products = this.expandProductsByVariant(rawProducts);
    const selectedProducts = this.selectedProducts[stepIndex];
    const productGrid = this.elements.modal.querySelector('.product-grid');
    const currentStep = this.selectedBundle?.steps?.[stepIndex];
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

    const showQuantitySelector = this.config.showQuantitySelectorOnCard;

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
      const addDisabled = outOfStock;

      const stockBadge = outOfStock
        ? `<div class="product-stock-badge product-stock-badge--out">Out of stock</div>`
        : lowStock
          ? `<div class="product-stock-badge product-stock-badge--low">Only ${available} left</div>`
          : '';

      return `
        <div class="product-card${freeGiftCardClass} ${currentQuantity > 0 ? 'selected' : ''} ${outOfStock ? 'is-out-of-stock' : ''}" data-product-id="${selectionKey}">
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

            ${this.renderVariantSelector(product)}

            ${showQuantitySelector ? `
              <div class="product-quantity-wrapper">
                <div class="product-quantity-selector">
                  <button class="qty-btn qty-decrease" data-product-id="${selectionKey}">−</button>
                  <span class="qty-display">${currentQuantity}</span>
                  <button class="qty-btn qty-increase" data-product-id="${selectionKey}" ${increaseDisabled ? 'disabled aria-disabled="true"' : ''}>+</button>
                </div>
              </div>
            ` : ''}

            <button class="product-add-btn ${currentQuantity > 0 ? 'added' : ''}" data-product-id="${selectionKey}" ${addDisabled ? 'disabled aria-disabled="true"' : ''}>
              ${outOfStock ? 'Out of stock' : (currentQuantity > 0 ? (currentStep?.addonReplaceText || 'Selected ✓') : (currentStep?.addonAddText || 'Add to Cart'))}
            </button>
          </div>
        </div>
      `;
    }).join('');

    productGrid.classList.remove('bw-animate-in');
    void productGrid.offsetWidth;
    productGrid.classList.add('bw-animate-in');

    this.attachProductEventHandlers(productGrid, stepIndex);
  }

  renderVariantSelector(product) {
    if (!product.variants || product.variants.length <= 1) {
      return '';
    }

    return `
      <div class="variant-selector-wrapper">
        <select class="variant-selector" data-base-product-id="${product.id}">
          ${product.variants.map(v => {

            const isHardOOS = v.available !== true
              || (v.quantityAvailable === 0 && v.currentlyNotInStock !== true);
            const label = isHardOOS ? `${v.title} — out of stock` : v.title;
            const selected = v.id === product.variantId ? 'selected' : '';
            const disabled = isHardOOS ? 'disabled' : '';
            return `<option value="${v.id}" ${selected} ${disabled}>${label}</option>`;
          }).join('')}
        </select>
      </div>
    `;
  }

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
  }

  attachProductEventHandlers(productGrid, stepIndex) {

    const newProductGrid = productGrid.cloneNode(true);
    productGrid.parentNode.replaceChild(newProductGrid, productGrid);

    const step = this.selectedBundle.steps[stepIndex];

    const findProduct = (productId) => {
      return this.findProductBySelectionKey(this.stepProductData[stepIndex] || [], productId);
    };

    newProductGrid.addEventListener('click', (e) => {
      if (e.target.classList.contains('qty-btn')) {
        e.stopPropagation();
        const productId = e.target.dataset.productId;
        const isIncrease = e.target.classList.contains('qty-increase');
        const currentQuantity = this.getSelectedQuantity(stepIndex, productId);

        const newQuantity = isIncrease ? currentQuantity + 1 : Math.max(0, currentQuantity - 1);
        this.updateProductSelection(stepIndex, productId, newQuantity);
      }
    });

    newProductGrid.addEventListener('click', (e) => {
      if (e.target.classList.contains('product-add-btn')) {
        e.stopPropagation();
        const productId = e.target.dataset.productId;
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
      const productImage = e.target.closest('.product-image');
      const productTitle = e.target.closest('.product-title');

      if (productImage || productTitle) {
        const productCard = e.target.closest('.product-card');
        if (productCard && this.productModal) {
          const productId = productCard.dataset.productId;
          const product = findProduct(productId);

          if (product && product.variants && product.variants.length > 1 && step) {

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
                this.setSelectedQuantity(stepIndex, newVariantId, migratedQty);
              }
            }

            product.variantId = newVariantId;
            product.price = variantData.price;

            const productCard = e.target.closest('.product-card');
            if (productCard) {
              productCard.dataset.productId = newVariantId;
              productCard.querySelectorAll('[data-product-id]').forEach(el => {
                el.dataset.productId = newVariantId;
              });
            }

            this.updateModalNavigation();
            this.updateModalFooterMessaging();
          }
        }
      }
    });

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
        ToastManager.show(`Only ${available} in stock — quantity adjusted.`);
      }
    }

    const currentQuantity = this.getSelectedQuantity(stepIndex, selectionKey);
    const productQuantityCheck = ConditionValidator.canUpdateProductQuantity(
      this.selectedBundle?.validateQuantityPerProduct,
      currentQuantity,
      quantity,
    );
    if (!productQuantityCheck.allowed) {
      ToastManager.show(`Maximum allowed quantity per product is ${productQuantityCheck.limit}.`);
      return;
    }

    if (!this.validateStepCondition(stepIndex, selectionKey, quantity)) {
      return;
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

    this._autoProgressBottomSheet(stepIndex);
  }

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

  _autoProgressBottomSheet(stepIndex) {
    if (!this.validateStep(stepIndex)) return;

    const next = bsFindNextIncompleteStep(
      this.selectedBundle.steps,
      this.selectedProducts,
      (i) => this.validateStep(i),
      stepIndex
    );

    if (next === -1) {

      this.renderModalTabs();
      setTimeout(() => this.closeModal(), 500);
    } else {

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

  updateProductQuantityDisplay(stepIndex, productId, quantity) {

    const scope = this.elements.modal?.classList.contains('bw-bs-panel--open')
      ? this.elements.modal
      : this.container;
    const productCard = scope.querySelector(`[data-product-id="${productId}"]`);
    if (productCard) {
      const quantityDisplay = productCard.querySelector('.qty-display');
      const addBtn = productCard.querySelector('.product-add-btn');
      const selectedOverlay = productCard.querySelector('.selected-overlay');
      const increaseBtn = productCard.querySelector('.qty-increase');

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

      if (addBtn) {
        if (quantity > 0) {
          addBtn.textContent = this._resolveText('includedBadge', 'Selected ✓');
          addBtn.classList.add('added');
        } else {
          addBtn.textContent = this._resolveText('addToCartButton', 'Add to Cart');
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
    const currentQty = this.getSelectedQuantity(stepIndex, productId);
    const normalizedProductId = this.normalizeSelectionKey(productId);

    const { allowed, limitText } = ConditionValidator.canUpdateQuantity(
      step,
      currentSelections,
      normalizedProductId,
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

    if (ConditionValidator.isCategoryRuleMode(step)) {
      const products = this.stepProductData[stepIndex] || [];
      const translated = {};
      for (const [selKey, qty] of Object.entries(currentSelections)) {
        const product = this.findProductBySelectionKey(products, selKey);
        const productId = String((product && (product.parentProductId || product.id)) || selKey);
        translated[productId] = (translated[productId] || 0) + (Number(qty) || 0);
      }
      return ConditionValidator.isStepConditionSatisfied(step, translated);
    }

    return ConditionValidator.isStepConditionSatisfied(step, currentSelections);
  }

  isStepAccessible(stepIndex) {

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

    prevButton.disabled = false;

    const isLastStep = this.currentStepIndex === this.selectedBundle.steps.length - 1;
    nextButton.textContent = isLastStep ? this._resolveText('doneButton', 'Done') : this._resolveText('nextButton', 'Next');
    nextButton.disabled = false;
  }

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
  }

  updateModalHeaderText(totalPrice, totalQuantity, discountInfo, currencyInfo) {
    const modalStepTitle = this.elements.modal.querySelector('.modal-step-title');
    if (!modalStepTitle) return;

    const currentStep = this.selectedBundle?.steps?.[this.currentStepIndex];
    modalStepTitle.innerHTML = currentStep?.name || `Step ${this.currentStepIndex + 1}`;
  }

  updateModalDiscountMessaging(totalPrice, totalQuantity, discountInfo, currencyInfo) {
    const footerDiscountText = this.elements.modal.querySelector('.footer-discount-text');
    const discountSection = this.elements.modal.querySelector('.modal-footer-discount-messaging')
      || this.elements.modal.querySelector('.modal-header-discount-messaging');

    if (!footerDiscountText) return;

    const nextRule = PricingCalculator.getNextDiscountRule(this.selectedBundle, totalQuantity, totalPrice);
    const ruleToUse = discountInfo.applicableRule || nextRule;
    const hasDiscountRules = !!ruleToUse;

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

    overlay.offsetHeight;
    markLoadingOverlayVisible(overlay);
  }

  hideLoadingOverlay() {
    const overlay = this.container?.querySelector('.bundle-loading-overlay');
    hideLoadingOverlayElement(overlay);
  }

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

      const allStepsValid = this.selectedBundle.steps.every((step, index) => {
        if (step.isFreeGift || step.isDefault) return true;
        return this.validateStep(index);
      });
      if (!allStepsValid) {
        ToastManager.show('Please complete all bundle steps before adding to cart.');
        return;
      }

      const cartItems = this.buildCartItems();

      this.elements.addToCartButton.disabled = true;
      this.elements.addToCartButton.textContent = this._resolveText('addingToCart', 'Adding to Cart...');
      this.showLoadingOverlay(this.selectedBundle?.loadingGif || null);

      const cartContext = this.buildProductPageCartFormData(cartItems);
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

      let result;
      try {
        result = JSON.parse(responseText);
      } catch {

        throw new Error('Cart add failed: Store may be password protected or temporarily unavailable.');
      }

      ToastManager.show('Bundle added to cart successfully!');

      setTimeout(() => {
        window.location.href = '/cart';
      }, 1000);

    } catch (error) {
      ToastManager.show(`Failed to add bundle to cart: ${error.message}`);
    } finally {

      this.hideLoadingOverlay();
      this.updateAddToCartButton();
    }
  }

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

    const displayProperties = {
      box: '1',
      items: selectedLines
        .map(({ product, quantity }) => `${quantity} x ${product.title || product.id}`)
        .join(', '),
      retailPrice: CurrencyManager.convertAndFormat(totalPrice, currencyInfo)
    };

    if (discountAmount > 0) {
      const amount = CurrencyManager.convertAndFormat(discountAmount, currencyInfo);
      const percentage = `${Math.round(discountPercentage)}%`;
      displayProperties.youSave = {
        amount,
        percentage,
        amountPercentage: `${amount} (${percentage})`
      };
    }

    return {
      '_bundle_display_properties': JSON.stringify(displayProperties)
    };
  }

  buildCartItems() {

    const cartItems = [];
    const bundleInstanceId = this.generateBundleInstanceId();

    const unavailableProducts = [];
    const selectedLines = [];

    this.selectedProducts.forEach((stepSelections, stepIndex) => {
      const productsInStep = this.expandProductsByVariant(this.stepProductData[stepIndex] || []);

      Object.entries(stepSelections).forEach(([variantId, quantity]) => {
        if (quantity > 0) {
          const product = this.findProductBySelectionKey(productsInStep, variantId);
          if (product) {

            if (product.available !== true) {
              unavailableProducts.push(product.title);
              return;
            }

            const actualVariantId = variantId;

            const step = this.selectedBundle.steps[stepIndex];
            const addonDiscount = this.getAddonLineDiscount(step);
            const properties = {
              '_bundle_id': bundleInstanceId,
              '_bundle_name': this.selectedBundle.name
            };
            if (addonDiscount && step?.addonDisplayFree !== true) {
              properties['_bundle_step_type'] = addonDiscount
                ? `addon:${addonDiscount.type}:${addonDiscount.value}`
                : 'addon';
            } else if (step?.isFreeGift && step?.addonDisplayFree === true) {
              properties['_bundle_step_type'] = 'free_gift';
            }
            if (step?.isDefault) properties['_bundle_step_type'] = 'default';
            if (this._isDirectDefaultVariant(variantId)) properties['_bundle_step_type'] = 'default';

            const cartItem = {
              id: parseInt(this.extractId(actualVariantId)),
              quantity: quantity,
              properties
            };
            const sellingPlanAllocationId = this.getSelectedSellingPlanAllocationId(product, variantId);
            if (sellingPlanAllocationId) {
              cartItem.selling_plan = parseInt(sellingPlanAllocationId);
            }

            cartItems.push(cartItem);
            selectedLines.push({ product, quantity });
          }
        }
      });
    });

    if (unavailableProducts.length > 0) {
      const productList = unavailableProducts.join(', ');
      throw new Error(`The following product${unavailableProducts.length > 1 ? 's are' : ' is'} currently unavailable: ${productList}. Please remove ${unavailableProducts.length > 1 ? 'them' : 'it'} from your bundle or try again later.`);
    }

    const sourceProperties = this.buildCartLineSourceProperties(selectedLines);
    cartItems.forEach(item => {
      Object.assign(item.properties, sourceProperties);
    });

    const bundle = this.selectedBundle;
    if (bundle?.giftMessagesEnabled && bundle?.giftMessageProductId && this.giftMessageState?.message?.trim()) {
      const giftVariantIdRaw = bundle.giftMessageProductId;
      const giftVariantId = parseInt(this.extractId(giftVariantIdRaw));
      if (giftVariantId) {
        const giftProperties = {
          '_bundle_id': bundleInstanceId,
          '_gift_message': this.giftMessageState.message.trim(),
        };
        if (bundle.giftMessageEnableSenderRecipient) {
          if (this.giftMessageState.from?.trim()) giftProperties['_gift_from'] = this.giftMessageState.from.trim();
          if (this.giftMessageState.to?.trim()) giftProperties['_gift_to'] = this.giftMessageState.to.trim();
        }
        cartItems.push({ id: giftVariantId, quantity: 1, properties: giftProperties });
      }
    }

    return cartItems;
  }

  buildProductPageCartFormData(cartItems) {
    const formData = new FormData();
    const sessionKey = this.generateBundleSessionKey();
    const offerId = this.resolveProductPageOfferId();

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
      formData.append(`items[${index}][properties][_bundleName]`, this.selectedBundle?.name || '');
      formData.append(`items[${index}][properties][_easyBundle:OfferId]`, `${offerId}_${sessionKey}_${itemNumber}`);
      formData.append(`items[${index}][properties][_easyBundle:prodQty]`, String(item.quantity));
    });

    return {
      formData,
      bundleDetailsKey: `${offerId}_${sessionKey}`,
      sourceProperties: this.extractBundleDetailsSourceProperties(cartItems)
    };
  }

  extractBundleDetailsSourceProperties(cartItems) {
    const firstItem = cartItems.find(item => item?.properties?._bundle_display_properties);
    return firstItem?.properties || {};
  }

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
  }

  buildBundleDetailsDisplayProperties(sourceProperties) {
    const displayProperties = {};
    const raw = sourceProperties?._bundle_display_properties;

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.box) displayProperties.Box = String(parsed.box);
        if (parsed?.items) displayProperties.Items = String(parsed.items);
        if (parsed?.retailPrice) displayProperties['Retail Price'] = String(parsed.retailPrice);
        if (parsed?.youSave?.amountPercentage) displayProperties['You Save'] = String(parsed.youSave.amountPercentage);
      } catch {

      }
    }

    ['Box', 'Items', 'Retail Price', 'You Save'].forEach((key) => {
      if (sourceProperties?.[key] && !displayProperties[key]) {
        displayProperties[key] = String(sourceProperties[key]);
      }
    });

    return displayProperties;
  }

  async getBundleDetailsCartToken() {
    const response = await fetch('/cart.js?app=wolfpackProductBundles', {
      credentials: 'same-origin'
    });
    if (!response.ok) return null;
    const cart = await response.json();
    return cart?.token || null;
  }

  resolveProductPageOfferId() {
    const rawOfferId = this.selectedBundle?.offerId
      || this.selectedBundle?.bundleOfferId
      || this.selectedBundle?.id
      || 'UNKNOWN';
    const offerId = String(rawOfferId);
    return offerId.startsWith('MIX-') ? offerId : `MIX-${offerId}`;
  }

  generateBundleSessionKey() {
    return Math.random().toString(36).slice(2, 5).toUpperCase();
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

  attachEventListeners() {

    this.elements.addToCartButton.addEventListener('click', () => this.addToCart());

    const modal = this.elements.modal;
    const closeButton = modal.querySelector('.close-button');
    const prevButton = modal.querySelector('.prev-button');
    const nextButton = modal.querySelector('.next-button');

    if (closeButton) {
      closeButton.addEventListener('click', () => this.closeModal());
    }

    if (this.elements.bsOverlay) {
      this.elements.bsOverlay.addEventListener('click', () => this.closeModal());
    }
    if (prevButton) prevButton.addEventListener('click', () => this.navigateModal(-1));
    if (nextButton) nextButton.addEventListener('click', () => this.navigateModal(1));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('bw-bs-panel--open')) {
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

      this.renderModalTabs();
      this.renderModalProductsLoading(newStepIndex);
      this.updateModalNavigation();
      this.updateModalFooterMessaging();

      await this.loadStepProducts(newStepIndex);
      this.renderModalProducts(this.currentStepIndex);
      this.updateModalFooterMessaging();
    } else if (direction > 0) {
      if (newStepIndex < this.selectedBundle.steps.length) {

        if (this.validateStep(this.currentStepIndex)) {
          this.currentStepIndex = newStepIndex;

          const headerText = this.getFormattedHeaderText();
          this.elements.modal.querySelector('.modal-step-title').innerHTML = headerText;

          this.renderModalTabs();
          this.renderModalProductsLoading(newStepIndex);
          this.updateModalNavigation();
          this.updateModalFooterMessaging();

          await this.loadStepProducts(newStepIndex);
          this.renderModalProducts(this.currentStepIndex);
          this.updateModalFooterMessaging();

          this.preloadNextStep();
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

  _resolveText(key, fallback) {
    const locale = window.Shopify?.locale;
    if (locale && this.config?.textOverridesByLocale?.[locale]?.[key]) {
      return this.config.textOverridesByLocale[locale][key];
    }
    if (this.config?.textOverrides?.[key]) {
      return this.config.textOverrides[key];
    }
    return fallback;
  }

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
}

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