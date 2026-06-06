/*!
 * Wolfpack Bundle Widget — Full Page
 * Version : 3.0.22
 * Built   : 2026-06-06
 *
 * Cache note: Shopify CDN cache is busted automatically by shopify app deploy.
 * After deploying, allow 2-10 minutes for propagation before testing.
 * Verify live version: console.log(window.__BUNDLE_WIDGET_VERSION__)
 */
window.__BUNDLE_WIDGET_VERSION__ = '3.0.22';
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

function installStandardTemplate(BundleWidgetFullPage) {
  const prototype = BundleWidgetFullPage.prototype;

  prototype.ensureStandardPresetRuntimeStyles = function() {
    if (this.getFullPageDesignPreset() !== 'DEFAULT') return;
    if (document.getElementById('wpb-fpb-standard-runtime-styles')) return;

    const style = document.createElement('style');
    style.id = 'wpb-fpb-standard-runtime-styles';
    const baseStyles = '[data-bundle-type=full_page][data-fpb-design-preset=DEFAULT]{width:min(100vw,1536px);max-width:1536px;margin-left:calc(50% - min(50vw,768px));padding:10px;box-sizing:border-box}[data-fpb-design-preset=DEFAULT]{--standard-card-height:352px;--ih:240px;--mw:177.5px;--mh:264px;--mih:150px;--cg:15px}@media(min-width:1024px){.layout-sidebar[data-fpb-design-preset=DEFAULT] .sidebar-layout-wrapper{display:grid;grid-template-columns:minmax(0,calc(100% - 381.266px)) 366.266px;gap:15px;max-width:1455px;padding:0;align-items:start}.layout-sidebar[data-fpb-design-preset=DEFAULT] .sidebar-content{padding:0 0 120px}.layout-sidebar[data-fpb-design-preset=DEFAULT] .fpb-step-category-title{font-size:16px;line-height:29px;margin:0 0 10px}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .full-page-product-grid-container{width:100%;max-width:none}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .full-page-product-grid{container-type:inline-size;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--cg,15px);margin:0 0 20px;padding:0}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-card{width:100%;min-width:0;max-width:none;height:var(--standard-card-height,352px);min-height:var(--standard-card-height,352px);display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:240px 40px 40px;gap:8px;padding:8px;border:0;border-radius:10px;box-shadow:none;background:#fff}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .full-page-side-panel{width:100%;flex:initial;min-height:738px;margin-top:0;padding:20px}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-image{width:100%;min-width:0;height:var(--ih,240px);min-height:var(--ih,240px);aspect-ratio:auto;margin:0;border-radius:8px;border-bottom:none}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-content-wrapper{grid-row:2 / span 2;display:grid;grid-template-columns:minmax(0,1fr) 35px;grid-template-rows:40px 40px;gap:8px 5px;width:100%;min-width:0;padding:0;overflow:hidden;align-items:start}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-title{grid-row:1;grid-column:1 / -1;width:100%;min-height:40px;height:40px;font-size:16px!important;line-height:22px!important;font-weight:700!important;text-align:left;letter-spacing:0!important;margin:0;padding:0;overflow:visible}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-price-row{grid-row:2;grid-column:1;width:100%;height:35px;min-height:35px;margin:0;display:flex;flex-direction:row;gap:5px;align-items:center;justify-content:flex-start;text-align:left;overflow:hidden}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-price{font-size:16px!important;font-weight:700!important;line-height:35px!important;letter-spacing:0!important}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-price-strike{font-size:14px!important;line-height:35px!important}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-variant-badge,.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-spacer,.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-quantity-wrapper{display:none}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-card-action{grid-row:2;grid-column:2;width:35px;height:35px;min-height:35px;margin:0;display:flex;align-items:center;justify-content:center;align-self:start;justify-self:end}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-add-btn{width:35px;min-width:35px;height:35px;padding:0;border-radius:5px;font-size:0;line-height:1;box-shadow:none;align-self:center;justify-self:center}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .product-add-btn::before{content:"+";font-size:16px;font-weight:700;line-height:1}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .product-add-btn.added::before{content:"✓"}}@media(max-width:767px){.layout-sidebar[data-fpb-design-preset=DEFAULT] > :is(.bundle-banners,.category-tabs,.sidebar-layout-wrapper){width:100%;margin-left:0;margin-right:0}.layout-sidebar[data-fpb-design-preset=DEFAULT] .sidebar-layout-wrapper .sidebar-content{padding:0 0 120px!important}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .full-page-product-grid-container{width:100%;max-width:none}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .full-page-product-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--cg,15px);justify-content:stretch;margin:0 0 20px;padding:0}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-card{min-height:var(--mh,264px);height:var(--mh,264px);display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:var(--mih,150px) 42px 40px;gap:8px;padding:8px;border:0;border-radius:10px;box-shadow:none;background:#fff;overflow:visible}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-image{height:var(--mih,150px);min-height:var(--mih,150px);width:100%;min-width:0;aspect-ratio:auto;margin:0;border-radius:8px;border-bottom:none}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-content-wrapper{grid-row:2 / span 2;display:grid;grid-template-columns:minmax(0,1fr) 35px;grid-template-rows:42px 40px;gap:8px 5px;width:100%;min-width:0;padding:0;overflow:hidden;align-items:start}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-title{grid-row:1;grid-column:1 / -1;width:100%;min-height:42px;height:42px;font-size:14px!important;line-height:18px!important;font-weight:700!important;text-align:left;letter-spacing:0!important;margin:0;padding:0;overflow:visible}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-price-row{grid-row:2;grid-column:1;width:100%;height:35px;min-height:35px;margin:0;display:flex;flex-direction:row;gap:5px;align-items:center;justify-content:flex-start;text-align:left;overflow:hidden}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-price{font-size:14px!important;font-weight:700!important;line-height:35px!important;letter-spacing:0!important}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-price-strike{font-size:12px!important;line-height:35px!important}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-variant-badge,.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-spacer,.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-quantity-wrapper{display:none}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-card-action{grid-row:2;grid-column:2;width:35px;height:35px;min-height:35px;margin:0;display:flex;align-items:center;justify-content:center;align-self:start;justify-self:end}.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .sidebar-content .product-add-btn{width:35px;min-width:35px;height:35px;padding:0;border-radius:5px;font-size:0;line-height:1;box-shadow:none;align-self:center;justify-self:center}}';
    const timelineStyles = '.layout-sidebar[data-fpb-design-preset=DEFAULT] .step-timeline--standard{width:100%;margin:0 0 24px;padding:0;display:block}.layout-sidebar[data-fpb-design-preset=DEFAULT] .standard-navigation-items-container{width:var(--standard-timeline-width,60%);height:76.8px;margin:24px auto 0;display:grid;grid-template-columns:repeat(var(--standard-timeline-count,2),minmax(0,1fr));grid-template-rows:76.8px;place-items:normal center;justify-content:center;position:relative;isolation:isolate}.layout-sidebar[data-fpb-design-preset=DEFAULT] .standard-navigation-item{width:max-content;max-width:100%;height:76.8px;display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:40px 36.8px;place-items:start center;justify-items:center;align-items:start;position:relative;z-index:2}.layout-sidebar[data-fpb-design-preset=DEFAULT] .standard-navigation-step-img-container{width:40px;height:40px;box-sizing:border-box;display:grid;place-items:center;border-radius:50%;background:#fff;padding:4px;border:2px solid #d4d5d6;position:relative;z-index:2;filter:none!important;opacity:1!important}.layout-sidebar[data-fpb-design-preset=DEFAULT] .timeline-step--active .standard-navigation-step-img-container{border:4px solid #000}.layout-sidebar[data-fpb-design-preset=DEFAULT] .standard-navigation-image{display:block;width:100%;height:100%;object-fit:contain;opacity:1!important;filter:none!important}.layout-sidebar[data-fpb-design-preset=DEFAULT] .standard-navigation-title-container{display:grid;place-items:center normal;padding:4px 2px;min-width:0}.layout-sidebar[data-fpb-design-preset=DEFAULT] .standard-navigation-title{margin:0;color:#000;font-size:16px;font-weight:700;line-height:28.8px;text-align:center;white-space:normal}.layout-sidebar[data-fpb-design-preset=DEFAULT] .standard-steps-progress-bar-container{position:absolute;top:17px;left:var(--standard-timeline-progress-left,25%);width:var(--standard-timeline-progress-width,50%);height:6px;border-radius:20px;overflow:hidden;z-index:0;pointer-events:none}.layout-sidebar[data-fpb-design-preset=DEFAULT] .standard-steps-progress-bar{width:100%;height:6px;background:#ccc}.layout-sidebar[data-fpb-design-preset=DEFAULT] .standard-steps-progress-bar-filled{width:var(--standard-timeline-progress-fill,0%);height:6px;background:#1e1e1e}.layout-sidebar[data-fpb-design-preset=DEFAULT] .standard-navigation-arrow{position:absolute;top:10px;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;border:0;background:#fff;color:#000;z-index:3;cursor:pointer;padding:0}.layout-sidebar[data-fpb-design-preset=DEFAULT] .standard-navigation-arrow--prev{left:-12px}.layout-sidebar[data-fpb-design-preset=DEFAULT] .standard-navigation-arrow--next{right:-12px}@media(max-width:767px){.layout-sidebar[data-fpb-design-preset=DEFAULT] .step-timeline--standard{margin:0 0 14px}.layout-sidebar[data-fpb-design-preset=DEFAULT] .standard-navigation-items-container{width:calc(100% - 15px);height:61.6px;margin:7.5px auto 0;grid-template-rows:61.6px}.layout-sidebar[data-fpb-design-preset=DEFAULT] .standard-navigation-item{height:61.6px;grid-template-rows:40px 21.6px}.layout-sidebar[data-fpb-design-preset=DEFAULT] .standard-navigation-title-container{padding:0 2px}.layout-sidebar[data-fpb-design-preset=DEFAULT] .standard-navigation-title{font-size:12px;line-height:21.6px}}';
    const remainingParityStyles = '.layout-sidebar[data-fpb-design-preset=DEFAULT] .category-tabs{height:50.8px;display:grid;grid-auto-flow:column;grid-auto-columns:max-content;justify-content:flex-start;gap:20px;margin:0 0 20px;padding:0;overflow:visible}.layout-sidebar[data-fpb-design-preset=DEFAULT] .category-tab{height:50.8px;display:grid;grid-template-columns:max-content;grid-template-rows:30px;align-items:center;padding:10px;border:0;background:transparent;border-radius:0;font-size:16px;line-height:28.8px;font-weight:700}.layout-sidebar[data-fpb-design-preset=DEFAULT] .category-tab::after{display:none}.layout-sidebar[data-fpb-design-preset=DEFAULT] .fpb-category-section-rows{display:grid;gap:0;margin:0;padding:0}.layout-sidebar[data-fpb-design-preset=DEFAULT] .fpb-category-section-row{width:100%;height:68.8px;display:grid;grid-template-columns:minmax(0,max-content) 20px;align-items:start;justify-content:space-between;padding:14px 0;border:0;background:transparent;border-radius:0;font-size:16px;line-height:28.8px;font-weight:700}.layout-sidebar[data-fpb-design-preset=DEFAULT] .fpb-category-section-row::after{content:"";width:20px;height:20px;display:block;background:currentColor;clip-path:polygon(25% 35%,50% 60%,75% 35%,80% 42%,50% 72%,20% 42%)}.layout-sidebar[data-fpb-design-preset=DEFAULT] .full-page-side-panel{border:0;border-radius:0}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-title{font-size:25px;line-height:30px;font-weight:700}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-subtitle{font-size:15px;line-height:27px;margin:0 0 12px;color:#000}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-action-container{grid-template-columns:minmax(0,1fr) 157px;gap:5px;margin-top:14px}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-btn-next{width:157px;min-width:157px;height:41px;border-radius:5px;padding:8px;font-size:16px;line-height:22px;font-weight:700}.layout-sidebar[data-fpb-design-preset=DEFAULT] .product-card--expanded-variant .product-title{display:grid!important;grid-template-rows:21px 14px;gap:5px;line-height:normal!important}.layout-sidebar[data-fpb-design-preset=DEFAULT] .product-title-main,.layout-sidebar[data-fpb-design-preset=DEFAULT] .product-title-variant{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}@media(max-width:767px){.layout-sidebar[data-fpb-design-preset=DEFAULT] .category-tabs{height:49px;gap:20px;margin:0 0 16px}.layout-sidebar[data-fpb-design-preset=DEFAULT] .category-tab{height:49px;font-size:15px;line-height:27px}.layout-sidebar[data-fpb-design-preset=DEFAULT] .fpb-step-category-title{font-size:18px;line-height:32.4px;margin:0 0 10px}.layout-sidebar[data-fpb-design-preset=DEFAULT] .fpb-category-section-row{height:72.4px;padding:14px 0;font-size:18px;line-height:32.4px}.layout-sidebar[data-fpb-design-preset=DEFAULT] .product-card--expanded-variant .product-title{font-size:12px!important;grid-template-rows:24px 15px;gap:5px;line-height:normal!important}.fpb-mobile-bottom-sheet.fpb-mobile-summary-tray{display:grid;position:sticky;grid-template-columns:360px;grid-template-rows:126.5625px 58px;bottom:0;left:10px;width:370px;height:195.5625px;padding:5px;border-radius:0;box-shadow:none;background:#fff;z-index:9999}.fpb-mobile-bottom-sheet.fpb-mobile-summary-tray .side-panel-discount-message{height:126.5625px;overflow:hidden}.fpb-mobile-bottom-sheet.fpb-mobile-summary-tray .side-panel-btn-next{width:360px;height:38px;border-radius:5px;padding:8px;font-size:14px;line-height:22px;font-weight:700}}';
    const sidebarStyles = '.layout-sidebar[data-fpb-design-preset=DEFAULT][data-fpb-card-cta-mode=icon] .full-page-side-panel,.layout-sidebar[data-fpb-design-preset=DEFAULT] .full-page-side-panel{border:1px solid #e3e3e3;border-radius:10px;grid-template-columns:324.266px;grid-template-rows:55px 158.969px 298.797px 70px;min-height:639.766px;height:639.766px;max-height:none;top:80px}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-header{display:grid;grid-template-columns:minmax(0,1fr) 82.9375px;grid-template-rows:55px;gap:8px;margin:0;grid-row:1;grid-column:1}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-header-copy{display:grid;grid-template-rows:30px 20px;gap:5px;min-width:0}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-subtitle{font-size:14px;line-height:20px;margin:0;color:#000}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-clear-btn{display:grid;grid-template-columns:22px 32.9375px;grid-template-rows:25.1875px;gap:0;width:82.9375px;height:35.1875px;padding:5px 14px;border:0;border-radius:5px;background:#fdecea;color:#d13d54}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-discount-message{grid-row:2;grid-column:1;margin:0;padding:5px 0 0;font-size:16px;font-weight:700;line-height:28.8px;text-align:left;color:#000}.layout-sidebar[data-fpb-design-preset=DEFAULT] .fpb-discount-progress.fpb-dp-sidebar{grid-row:2;grid-column:1;align-self:end}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-item-count{grid-row:3;grid-column:1;align-self:start;font-size:16px;font-weight:400;line-height:28.8px;color:#000;margin:0}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-products{grid-row:3;grid-column:1;align-self:start;display:grid;grid-template-columns:314.266px;grid-template-rows:75px 170px;gap:15px;width:324.266px;height:260px;min-height:260px;max-height:260px;padding:0 10px 0 0;margin:38.797px 0 0;overflow:hidden}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-product-row{display:grid;grid-template-columns:75px 158.328px 62.9375px;grid-template-rows:75px;gap:9px;padding:0;border:0;background:transparent}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-product-img-wrap{width:75px;height:75px;border-radius:5px}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-product-img{width:75px;height:75px;border-radius:5px;object-fit:cover}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-skeleton-slot{display:grid;grid-template-columns:75px 168.656px 50.6094px;grid-template-rows:75px;gap:10px;height:75px;animation:none}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-skeleton-slot:nth-child(2){height:170px}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-skeleton-thumb{width:75px;height:75px;border:2px dashed #a6a3a3;border-radius:5px;background:#e1e1e1}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-skeleton-lines{height:48px;gap:5px;align-self:center}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-skeleton-line{background:#e1e1e1;border-radius:10px}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-skeleton-slot .line-name{width:134.922px;height:14px;padding:7px}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-skeleton-slot .line-variant{width:101.188px;height:12px;padding:6px}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-skeleton-slot .line-price{width:42.1562px;height:12px;padding:6px;flex:initial}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-skeleton-remove{width:50.6094px;height:20px;padding:10px;border-radius:10px;background:#e1e1e1;align-self:center}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-action-container{grid-row:4;grid-column:1;grid-template-columns:162.125px 162.141px;grid-template-rows:44px;gap:0;margin:10px 0 0;padding:15px 0 0;align-items:start}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-total{display:grid;grid-template-columns:162.125px;grid-template-rows:18px 18px;gap:8px;align-items:center;justify-content:start}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-total-label{font-size:14px;font-weight:700;line-height:normal;color:#000}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-total-final{font-size:16px;font-weight:700;line-height:18px;color:#000}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-nav{display:grid;grid-template-columns:0 157.141px;grid-template-rows:44px;gap:5px}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-btn-next{width:157.141px;min-width:157.141px;height:41px;padding:8px;border:0;border-radius:5px;background:#000;color:#fff;font-size:16px;font-weight:700;line-height:25px;opacity:1}.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-btn-next:disabled{opacity:1;cursor:pointer}.layout-sidebar[data-fpb-design-preset=DEFAULT] .fpb-sidebar-tier-cta,.layout-sidebar[data-fpb-design-preset=DEFAULT] .box-selection-container,.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-free-gift,.layout-sidebar[data-fpb-design-preset=DEFAULT] .side-panel-addon-message{display:none!important}';
    const mobileFooterStyles = '@media(max-width:767px){.fpb-mobile-summary-count-badge{cursor:pointer}.fpb-mobile-summary-count-badge::before{content:"";width:8px;height:8px;border-left:2px solid #fff;border-top:2px solid #fff;transform:rotate(45deg);margin:4px 7px 0 0;box-sizing:border-box}.fpb-mobile-summary-tray.fpb-mobile-summary-tray-expanded{grid-template-rows:126.5625px 270px;height:407.5625px}.fpb-mobile-summary-tray.fpb-mobile-summary-tray-expanded .fpb-mobile-summary-count-badge::before{transform:rotate(225deg);margin:-3px 7px 0 0}.fpb-mobile-bottom-sheet.fpb-mobile-summary-tray .side-panel-discount-message{height:126.5625px;overflow:hidden}.fpb-mobile-summary-discount-text{display:flex;align-items:center;justify-content:center;width:360px;min-height:25.2px;margin:0;padding:0;color:#000;font-size:14px;font-weight:700;line-height:25.2px;text-align:center}.fpb-mobile-summary-tray .fpb-discount-progress.fpb-dp-sidebar{width:310px;height:96px;margin:0;overflow:visible}.fpb-mobile-summary-tray .fpb-dp-sidebar.fpb-dp-step_based{display:grid;grid-template-columns:310px;grid-template-rows:33.1953px 12px 51.1875px}.fpb-mobile-summary-tray .fpb-dp-sidebar .fpb-discount-step-list{height:33.1953px;margin:0;padding:0 0 8px;box-sizing:border-box}.fpb-mobile-summary-tray .fpb-dp-sidebar .fpb-dp-track{align-self:center;height:6px}.fpb-mobile-summary-tray .fpb-dp-sidebar .fpb-discount-step-subtitle-list{height:51.1875px;margin:0;padding:8px 0 0;box-sizing:border-box}.fpb-mobile-summary-tray .fpb-dp-sidebar .fpb-discount-step-title{color:#333;font-size:14px;font-weight:500;line-height:25.2px}.fpb-mobile-summary-tray .fpb-dp-sidebar .fpb-discount-step-subtitle{color:#888;font-size:12px;font-weight:400;line-height:21.6px}.fpb-mobile-summary-products-section{display:grid;position:relative;grid-template-columns:360px;grid-template-rows:204px 38px;width:360px;height:270px;padding:10px 0;background:#fff;box-sizing:border-box}.fpb-mobile-summary-bundle-items{display:grid;grid-template-columns:360px;grid-template-rows:54px 140px;width:360px;height:204px}.fpb-mobile-summary-bundle-header{display:grid;grid-template-columns:273.344px 78.6562px;grid-template-rows:43px;width:360px;height:54px;padding:0 0 10px;box-sizing:border-box}.fpb-mobile-summary-bundle-copy{display:grid;grid-template-columns:273.344px;grid-template-rows:18px 20px;gap:5px;min-width:0}.fpb-mobile-summary-bundle-title{font-size:20px;line-height:18px;font-weight:700;color:#000}.fpb-mobile-summary-bundle-subtitle{font-size:12px;line-height:20px;font-weight:400;color:#000}.fpb-mobile-summary-clear-btn{display:grid;grid-template-columns:22px 28.6562px;grid-template-rows:22px;align-items:center;width:78.6562px;height:32px;padding:5px 14px;border:0;border-radius:5px;background:#fdecea;color:#d13d54;font-size:12px;line-height:21.6px;font-weight:400}.fpb-mobile-summary-clear-btn svg{width:22px;height:22px}.fpb-mobile-summary-products-list{display:grid;grid-template-columns:360px;grid-template-rows:60px 65px;gap:10px;width:360px;height:140px;padding:5px 0 0;overflow:auto;box-sizing:border-box}.fpb-mobile-summary-product-row{display:grid;grid-template-columns:65px 213px 64px;grid-template-rows:60px;gap:9px;width:360px;height:60px}.fpb-mobile-summary-product-image-wrap{width:65px;height:60px;border:1px solid #cfc9c9;border-radius:8px;overflow:hidden}.fpb-mobile-summary-product-image{display:block;width:63px;height:63px;object-fit:cover}.fpb-mobile-summary-product-image-placeholder{width:63px;height:63px;background:#e1e1e1}.fpb-mobile-summary-product-info{display:block;width:213px;height:60px;min-width:0;overflow:hidden}.fpb-mobile-summary-product-title{display:block;width:213px;height:25.2px;color:#000;font-size:14px;line-height:25.2px;font-weight:400;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fpb-mobile-summary-product-variant{display:none}.fpb-mobile-summary-product-price{display:block;color:#000;font-size:15px;line-height:27px;font-weight:700}.fpb-mobile-summary-product-action{display:grid;grid-template-columns:max-content 40px;grid-template-rows:40px;align-items:center;justify-content:center;width:64px;height:60px}.fpb-mobile-summary-product-qty{color:#000;font-size:15px;line-height:27px;font-weight:700}.fpb-mobile-summary-product-remove{display:flex;align-items:center;justify-content:center;width:40px;height:40px;padding:0;border:0;border-radius:9999px;background:transparent;color:#000}.fpb-mobile-summary-product-remove svg{width:22px;height:22px}.fpb-mobile-summary-empty-product-card{display:grid;grid-template-columns:65px 212px 63px;grid-template-rows:65px;gap:10px;width:360px;height:65px}.fpb-mobile-summary-empty-product-image{width:65px;height:65px;border:2px dashed #a6a3a3;border-radius:5px;background:#e1e1e1;box-sizing:border-box}.fpb-mobile-summary-empty-product-info{display:flex;flex-direction:column;gap:5px;align-self:center;width:212px;height:48px}.fpb-mobile-summary-empty-product-title{width:169px;height:14px;padding:7px;border-radius:10px;background:#e1e1e1;box-sizing:border-box}.fpb-mobile-summary-empty-product-variant{width:127px;height:12px;padding:6px;border-radius:10px;background:#e1e1e1;box-sizing:border-box}.fpb-mobile-summary-empty-product-price{width:53px;height:12px;padding:6px;border-radius:10px;background:#e1e1e1;box-sizing:border-box}.fpb-mobile-summary-empty-product-action{align-self:center;width:63px;height:20px;padding:10px;border-radius:10px;background:#e1e1e1;box-sizing:border-box}}';
    style.textContent = baseStyles + timelineStyles + remainingParityStyles + sidebarStyles + mobileFooterStyles;
    document.head.appendChild(style);
  };
}

function installClassicTemplate(BundleWidgetFullPage) {
  const prototype = BundleWidgetFullPage.prototype;

  prototype.ensureClassicPresetRuntimeStyles = function() {
    if (this.getFullPageDesignPreset() !== 'CLASSIC') return;
    if (document.getElementById('wpb-fpb-classic-runtime-styles')) return;

    const style = document.createElement('style');
    style.id = 'wpb-fpb-classic-runtime-styles';
    const baseStyles = '[data-bundle-type=full_page][data-fpb-design-preset=CLASSIC]{width:min(100vw,1536px);max-width:1536px;margin-left:calc(50% - min(50vw,768px));padding:10px;box-sizing:border-box}[data-fpb-design-preset=CLASSIC]{--classic-card-height-extra:104px;--classic-image-height-extra:12px;--classic-mobile-card-height:263px;--classic-mobile-image-height:150px}';
    const desktopStyles = '@media(min-width:1024px){.layout-sidebar[data-fpb-design-preset=CLASSIC] .sidebar-layout-wrapper{display:grid;grid-template-columns:0.6897fr 0.3103fr;gap:15px;max-width:1455px;padding:0;align-items:start}.layout-sidebar[data-fpb-design-preset=CLASSIC] .sidebar-content{padding:0 0 120px}.layout-sidebar[data-fpb-design-preset=CLASSIC] .fpb-step-category-title{font-size:16px;line-height:29px;margin:0 0 10px}.layout-sidebar[data-fpb-design-preset=CLASSIC] .category-tabs{display:flex;justify-content:center;gap:8px;height:40.8px;margin:0 0 20px;padding:0;overflow:visible}.layout-sidebar[data-fpb-design-preset=CLASSIC] .category-tab{height:40.8px;display:grid;align-items:center;padding:4px 22px;border-radius:99px;font-size:16px;line-height:28.8px;font-weight:700}.layout-sidebar[data-fpb-design-preset=CLASSIC] .category-tab::after{display:none}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .full-page-product-grid-container{width:95%;max-width:none}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .full-page-product-grid{container-type:inline-size;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px;margin:0 0 20px;padding:0}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-card{width:100%;min-width:0;max-width:none;height:calc((100cqw - 45px)/4 + var(--classic-card-height-extra,104px));min-height:calc((100cqw - 45px)/4 + var(--classic-card-height-extra,104px));display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:calc((100cqw - 45px)/4 - var(--classic-image-height-extra,12px)) 49px 35px;gap:8px;padding:8px;border:0;border-radius:10px;box-shadow:none;background:#fff}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-image{width:100%;min-width:0;height:calc((100cqw - 45px)/4 - var(--classic-image-height-extra,12px));min-height:calc((100cqw - 45px)/4 - var(--classic-image-height-extra,12px));aspect-ratio:auto;margin:0;border-radius:8px;border-bottom:none}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-content-wrapper{grid-row:2 / span 2;display:grid;grid-template-columns:minmax(0,1fr) 35px;grid-template-rows:49px 35px;gap:8px 5px;width:100%;min-width:0;padding:0;overflow:hidden;align-items:start}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-title{grid-row:1;grid-column:1 / -1;width:100%;min-height:49px;height:49px;font-size:16px!important;line-height:22px!important;font-weight:700!important;text-align:left;letter-spacing:0!important;margin:0;padding:0;overflow:hidden}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-price-row{grid-row:2;grid-column:1;width:100%;height:35px;min-height:35px;margin:0;display:flex;flex-direction:row;gap:5px;align-items:center;justify-content:flex-start;text-align:left;overflow:hidden}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-price{font-size:16px!important;font-weight:700!important;line-height:35px!important;letter-spacing:0!important}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-price-strike{font-size:14px!important;line-height:35px!important}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-variant-badge,.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-spacer,.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-quantity-wrapper{display:none}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-card-action{grid-row:2;grid-column:2;width:35px;height:35px;min-height:35px;margin:0;display:flex;align-items:center;justify-content:center;align-self:start;justify-self:end}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-add-btn{width:35px;min-width:35px;height:35px;padding:0;border-radius:5px;font-size:0;line-height:1;box-shadow:none;align-self:center;justify-self:center}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .product-add-btn::before{content:"+";font-size:16px;font-weight:700;line-height:1}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .product-add-btn.added::before{content:"✓"}}';
    const sidebarStyles = '@media(min-width:1024px){.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .full-page-side-panel,.layout-sidebar[data-fpb-design-preset=CLASSIC] .full-page-side-panel{width:100%;flex:initial;min-height:609px;height:609px;max-height:none;margin-top:0;padding:20px;border:0;border-radius:10px;grid-template-columns:minmax(0,1fr);grid-template-rows:55px 130.172px 298.797px 70px;top:80px}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-header{display:grid;grid-template-columns:minmax(0,1fr) 82.9375px;grid-template-rows:55px;gap:8px;margin:0;grid-row:1;grid-column:1}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-header-copy{display:grid;grid-template-rows:30px 20px;gap:5px;min-width:0}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-title{font-size:20px;line-height:30px;font-weight:700;color:#000}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-subtitle{font-size:14px;line-height:20px;margin:0;color:#000}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-clear-btn{display:grid;grid-template-columns:22px 32.9375px;grid-template-rows:25.1875px;gap:0;width:82.9375px;height:35.1875px;padding:5px 14px;border:0;border-radius:5px;background:#fdecea;color:#d13d54}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-discount-message{grid-row:2;grid-column:1;margin:0;padding:5px 0 0;font-size:16px;font-weight:700;line-height:28.8px;text-align:left;color:#000}.layout-sidebar[data-fpb-design-preset=CLASSIC] .fpb-discount-progress.fpb-dp-sidebar{grid-row:2;grid-column:1;align-self:end}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-item-count{grid-row:3;grid-column:1;align-self:start;font-size:16px;font-weight:400;line-height:28.8px;color:#000;margin:0}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-products{grid-row:3;grid-column:1;align-self:start;display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:75px 170px;gap:15px;width:100%;height:260px;min-height:260px;max-height:260px;padding:0 10px 0 0;margin:38.797px 0 0;overflow:hidden}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-product-row{display:grid;grid-template-columns:75px minmax(0,1fr) 62.9375px;grid-template-rows:75px;gap:9px;padding:0;border:0;background:transparent}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-product-img-wrap{width:75px;height:75px;border-radius:5px}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-product-img{width:75px;height:75px;border-radius:5px;object-fit:cover}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-product-info{display:grid;grid-template-rows:20px 28.8px;gap:0;align-self:start;min-width:0;height:75px;overflow:hidden}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-product-title{display:block;width:100%;height:20px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#000;font-size:14px;font-weight:400;line-height:20px}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-product-price{display:block;color:#000;font-size:16px;font-weight:700;line-height:28.8px}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-product-action{display:grid;place-items:center;width:62.9375px;height:75px}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-product-remove{display:flex;align-items:center;justify-content:center;width:40px;height:40px;padding:0;border:0;background:transparent;color:#000}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-skeleton-slot{display:grid;grid-template-columns:75px minmax(0,1fr) 50.6094px;grid-template-rows:75px;gap:10px;height:75px;animation:none}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-skeleton-slot:nth-child(2){height:170px}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-skeleton-thumb{width:75px;height:75px;border:2px dashed #a6a3a3;border-radius:5px;background:#e1e1e1;color:#000}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-skeleton-lines{height:48px;gap:5px;align-self:center}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-skeleton-line{background:#e1e1e1;border-radius:10px}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-skeleton-slot .line-name{width:134.922px;height:14px;padding:7px}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-skeleton-slot .line-variant{width:101.188px;height:12px;padding:6px}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-skeleton-slot .line-price{width:42.1562px;height:12px;padding:6px;flex:initial}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-skeleton-remove{width:50.6094px;height:20px;padding:10px;border-radius:10px;background:#e1e1e1;align-self:center}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-action-container{grid-row:4;grid-column:1;grid-template-columns:1fr 181.969px;grid-template-rows:44px;gap:0;margin:10px 0 0;padding:15px 0 0;align-items:start}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-total{display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:18px 18px;gap:8px;align-items:center;justify-content:start}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-total-label{font-size:14px;font-weight:700;line-height:normal;color:#000}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-total-final{font-size:16px;font-weight:700;line-height:18px;color:#000}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-nav{display:grid;grid-template-columns:0 181.969px;grid-template-rows:44px;gap:5px}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-btn-next{width:181.969px;min-width:181.969px;height:41px;padding:8px;border:0;border-radius:5px;background:#000;color:#fff;font-size:16px;font-weight:700;line-height:25px;opacity:1}.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-btn-next:disabled{opacity:1;cursor:pointer}.layout-sidebar[data-fpb-design-preset=CLASSIC] .fpb-sidebar-tier-cta,.layout-sidebar[data-fpb-design-preset=CLASSIC] .box-selection-container,.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-free-gift,.layout-sidebar[data-fpb-design-preset=CLASSIC] .side-panel-addon-message{display:none!important}}';
    const mobileStyles = '@media(max-width:767px){.layout-sidebar[data-fpb-design-preset=CLASSIC] > :is(.bundle-banners,.category-tabs,.sidebar-layout-wrapper){width:100%;margin-left:0;margin-right:0}.layout-sidebar[data-fpb-design-preset=CLASSIC] .sidebar-layout-wrapper .sidebar-content{padding:0 0 120px!important}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .full-page-product-grid-container{width:100%;max-width:none}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .full-page-product-grid{grid-template-columns:repeat(2,minmax(0,177.5px));gap:15px;justify-content:center;margin:0 0 20px;padding:0;overflow:visible}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-card{width:177.5px;min-width:0;max-width:177.5px;height:263px;min-height:263px;display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:150px 41px 40px;gap:8px;padding:8px;border:0;border-radius:10px;box-shadow:none;background:#fff;overflow:visible}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-image{width:100%;min-width:0;height:var(--classic-mobile-image-height,150px);min-height:var(--classic-mobile-image-height,150px);aspect-ratio:auto;margin:0;border-radius:8px;border-bottom:none}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-content-wrapper{grid-row:2 / span 2;display:grid;grid-template-columns:minmax(0,1fr) 35px;grid-template-rows:41px 35px;gap:8px 5px;width:100%;min-width:0;padding:0;overflow:hidden;align-items:start}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-title{grid-row:1;grid-column:1 / -1;width:100%;min-height:41px;height:41px;font-size:12px!important;line-height:normal!important;font-weight:400!important;text-align:left;letter-spacing:0!important;margin:0;padding:0;overflow:visible}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-price-row{grid-row:2;grid-column:1;width:100%;height:35px;min-height:35px;margin:0;display:flex;flex-direction:row;gap:5px;align-items:center;justify-content:flex-start;text-align:left;overflow:hidden}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-price{font-size:14px!important;font-weight:700!important;line-height:35px!important;letter-spacing:0!important}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-price-strike{font-size:12px!important;line-height:35px!important}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-variant-badge,.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-spacer,.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-quantity-wrapper{display:none}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-card-action{grid-row:2;grid-column:2;position:static;right:auto;bottom:auto;width:35px;height:35px;min-height:35px;margin:0;display:flex;align-items:center;justify-content:center;align-self:start;justify-self:end}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .sidebar-content .product-add-btn{width:35px;min-width:35px;height:35px;padding:0;border-radius:5px;font-size:0;line-height:1;box-shadow:none;align-self:center;justify-self:center}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .product-add-btn::before{content:"+";font-size:16px;font-weight:700;line-height:1}.layout-sidebar[data-fpb-design-preset=CLASSIC][data-fpb-card-cta-mode=icon] .product-add-btn.added::before{content:"✓"}.fpb-mobile-summary-tray.fpb-mobile-classic-footer.fpb-mobile-summary-tray-expanded{grid-template-rows:126.5625px 234.906px;height:361.46875px}.fpb-mobile-classic-footer .fpb-mobile-summary-products-section{display:grid;position:relative;grid-template-columns:360px;grid-template-rows:168.906px 38px;width:360px;height:234.906px;padding:10px 0;gap:8px;background:#fff;box-sizing:border-box}.fpb-mobile-classic-footer .fpb-mobile-summary-bundle-items{display:grid;grid-template-columns:360px;grid-template-rows:54px 104.906px;width:360px;height:168.906px}.fpb-mobile-classic-footer .fpb-mobile-summary-products-list{display:grid;grid-template-columns:360px;grid-template-rows:65px 65px;gap:10px;width:360px;height:104.906px;padding:5px 0 0;overflow:auto;box-sizing:border-box}.fpb-mobile-classic-footer .fpb-mobile-summary-empty-product-card{display:grid;grid-template-columns:65px 211.531px 63.4688px;grid-template-rows:65px;gap:10px;width:360px;height:65px}}';
    style.textContent = baseStyles + desktopStyles + sidebarStyles + mobileStyles;
    document.head.appendChild(style);
  };
}

function installCompactTemplate(BundleWidgetFullPage) {
  const prototype = BundleWidgetFullPage.prototype;

  prototype.ensureCompactPresetRuntimeStyles = function() {
    if (this.getFullPageDesignPreset() !== 'COMPACT') return;
    if (document.getElementById('wpb-fpb-compact-runtime-styles')) return;

    const style = document.createElement('style');
    style.id = 'wpb-fpb-compact-runtime-styles';
    style.textContent = '[data-bundle-type=full_page][data-fpb-design-preset=COMPACT]{width:min(100vw,1536px);max-width:1536px;margin-left:calc(50% - min(50vw,768px));padding:10px;box-sizing:border-box}[data-fpb-design-preset=COMPACT]{--compact-card-height-extra:104px;--compact-image-height-extra:12px;--compact-mobile-card-height:245px;--compact-mobile-image-height:150px}@media(min-width:1024px){.layout-sidebar[data-fpb-design-preset=COMPACT] .sidebar-layout-wrapper{display:grid;grid-template-columns:0.6fr 0.4fr;gap:30px;max-width:1455px;padding:0;align-items:start}.layout-sidebar[data-fpb-design-preset=COMPACT] .sidebar-content{padding:0 0 120px}.layout-sidebar[data-fpb-design-preset=COMPACT] .fpb-step-category-title{font-size:16px;line-height:29px;margin:16px 0 10px}.layout-sidebar[data-fpb-design-preset=COMPACT][data-fpb-card-cta-mode=icon] .sidebar-content .full-page-product-grid{container-type:inline-size;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px;margin:0 0 20px;padding:0}.layout-sidebar[data-fpb-design-preset=COMPACT][data-fpb-card-cta-mode=icon] .sidebar-content .product-card{width:100%;min-width:0;max-width:none;height:calc((100cqw - 30px)/3 + var(--compact-card-height-extra,104px));min-height:calc((100cqw - 30px)/3 + var(--compact-card-height-extra,104px));display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:calc((100cqw - 30px)/3 - var(--compact-image-height-extra,12px)) 49px 35px;gap:8px;padding:8px;border:0;border-radius:10px;box-shadow:none;background:#fff}.layout-sidebar[data-fpb-design-preset=COMPACT][data-fpb-card-cta-mode=icon] .sidebar-content .product-image{width:100%;min-width:0;height:calc((100cqw - 30px)/3 - var(--compact-image-height-extra,12px));min-height:calc((100cqw - 30px)/3 - var(--compact-image-height-extra,12px));aspect-ratio:auto;margin:0;border-radius:8px;border-bottom:none}.layout-sidebar[data-fpb-design-preset=COMPACT][data-fpb-card-cta-mode=icon] .full-page-side-panel{width:100%;flex:initial;min-height:656px;margin-top:16px;padding:20px;grid-template-columns:minmax(0,1fr)}}@media(max-width:767px){.layout-sidebar[data-fpb-design-preset=COMPACT][data-fpb-card-cta-mode=icon] .sidebar-content .full-page-product-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.layout-sidebar[data-fpb-design-preset=COMPACT][data-fpb-card-cta-mode=icon] .sidebar-content .product-card{height:245px;min-height:var(--compact-mobile-card-height,245px);display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:150px 23px 40px;gap:8px;padding:8px;border:0;border-radius:10px;box-shadow:none;background:#fff}.layout-sidebar[data-fpb-design-preset=COMPACT][data-fpb-card-cta-mode=icon] .sidebar-content .product-image{height:var(--compact-mobile-image-height,150px);min-height:var(--compact-mobile-image-height,150px)}}';
    document.head.appendChild(style);
  };
}

function installHorizontalTemplate(BundleWidgetFullPage) {
  const prototype = BundleWidgetFullPage.prototype;

  prototype.ensureHorizontalSidePanelSlotRuntimeStyles = function() {
    if (this.getFullPageDesignPreset() !== 'HORIZONTAL') return;
    if (document.getElementById('wpb-fpb-horizontal-runtime-styles')) return;

    const style = document.createElement('style');
    style.id = 'wpb-fpb-horizontal-runtime-styles';
    const desktopSummaryStyles = `.fpb-h .product-title{display:-webkit-box;display:-webkit-flexbox;display:flex;white-space:normal;word-break:break-word;overflow:hidden;text-overflow:ellipsis;-webkit-box-orient:vertical;line-clamp:2;-webkit-line-clamp:2}.fpb-h .product-card--expanded-variant .product-title{display:block;line-height:normal}.fpb-h .product-card--expanded-variant .product-variant-badge{display:none}`;
    const summaryMobileStyles = `.fpb-mobile-summary-count-badge{cursor:pointer}.fpb-mobile-summary-count-badge::before{content:"";width:8px;height:8px;border-left:2px solid #fff;border-top:2px solid #fff;transform:rotate(45deg);margin:4px 7px 0 0;box-sizing:border-box}.fpb-mobile-summary-tray.fpb-mobile-summary-tray-expanded{grid-template-rows:126.5625px 270px;height:407.5625px}.fpb-mobile-summary-tray.fpb-mobile-summary-tray-expanded .fpb-mobile-summary-count-badge::before{transform:rotate(225deg);margin:-3px 7px 0 0}.fpb-mobile-bottom-sheet.fpb-mobile-summary-tray .side-panel-discount-message{height:126.5625px;overflow:hidden}.fpb-mobile-summary-discount-text{display:flex;align-items:center;justify-content:center;width:360px;min-height:25.2px;margin:0;padding:0;color:#000;font-size:14px;font-weight:700;line-height:25.2px;text-align:center}.fpb-mobile-summary-tray .fpb-discount-progress.fpb-dp-sidebar{width:310px;height:96px;margin:0;overflow:visible}.fpb-mobile-summary-tray .fpb-dp-sidebar.fpb-dp-step_based{display:grid;grid-template-columns:310px;grid-template-rows:33.1953px 12px 51.1875px}.fpb-mobile-summary-tray .fpb-dp-sidebar .fpb-discount-step-list{height:33.1953px;margin:0;padding:0 0 8px;box-sizing:border-box}.fpb-mobile-summary-tray .fpb-dp-sidebar .fpb-dp-track{align-self:center;height:6px}.fpb-mobile-summary-tray .fpb-dp-sidebar .fpb-discount-step-subtitle-list{height:51.1875px;margin:0;padding:8px 0 0;box-sizing:border-box}.fpb-mobile-summary-tray .fpb-dp-sidebar .fpb-discount-step-title{color:#333;font-size:14px;font-weight:500;line-height:25.2px}.fpb-mobile-summary-tray .fpb-dp-sidebar .fpb-discount-step-subtitle{color:#888;font-size:12px;font-weight:400;line-height:21.6px}.fpb-mobile-summary-products-section{display:grid;position:relative;grid-template-columns:360px;grid-template-rows:204px 38px;width:360px;height:270px;padding:10px 0;background:#fff;box-sizing:border-box}.fpb-mobile-summary-bundle-items{display:grid;grid-template-columns:360px;grid-template-rows:54px 140px;width:360px;height:204px}.fpb-mobile-summary-bundle-header{display:grid;grid-template-columns:273.344px 78.6562px;grid-template-rows:43px;width:360px;height:54px;padding:0 0 10px;box-sizing:border-box}.fpb-mobile-summary-bundle-copy{display:grid;grid-template-columns:273.344px;grid-template-rows:18px 20px;gap:5px;min-width:0}.fpb-mobile-summary-bundle-title{font-size:20px;line-height:18px;font-weight:700;color:#000}.fpb-mobile-summary-bundle-subtitle{font-size:12px;line-height:20px;font-weight:400;color:#000}.fpb-mobile-summary-clear-btn{display:grid;grid-template-columns:22px 28.6562px;grid-template-rows:22px;align-items:center;width:78.6562px;height:32px;padding:5px 14px;border:0;border-radius:5px;background:#fdecea;color:#d13d54;font-size:12px;line-height:21.6px;font-weight:400}.fpb-mobile-summary-clear-btn svg{width:22px;height:22px}.fpb-mobile-summary-products-list{display:grid;grid-template-columns:360px;grid-template-rows:60px 65px;gap:10px;width:360px;height:140px;padding:5px 0 0;overflow:auto;box-sizing:border-box}.fpb-mobile-summary-product-row{display:grid;grid-template-columns:65px 213px 64px;grid-template-rows:60px;gap:9px;width:360px;height:60px}.fpb-mobile-summary-product-image-wrap{width:65px;height:60px;border:1px solid #cfc9c9;border-radius:8px;overflow:hidden}.fpb-mobile-summary-product-image{display:block;width:63px;height:63px;object-fit:cover}.fpb-mobile-summary-product-image-placeholder{width:63px;height:63px;background:#e1e1e1}.fpb-mobile-summary-product-info{display:block;width:213px;height:60px;min-width:0;overflow:hidden}.fpb-mobile-summary-product-title{display:block;width:213px;height:25.2px;color:#000;font-size:14px;line-height:25.2px;font-weight:400;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fpb-mobile-summary-product-variant{display:none}.fpb-mobile-summary-product-price{display:block;color:#000;font-size:15px;line-height:27px;font-weight:700}.fpb-mobile-summary-product-action{display:grid;grid-template-columns:max-content 40px;grid-template-rows:40px;align-items:center;justify-content:center;width:64px;height:60px}.fpb-mobile-summary-product-qty{color:#000;font-size:15px;line-height:27px;font-weight:700}.fpb-mobile-summary-product-remove{display:flex;align-items:center;justify-content:center;width:40px;height:40px;padding:0;border:0;border-radius:9999px;background:transparent;color:#000}.fpb-mobile-summary-product-remove svg{width:22px;height:22px}.fpb-mobile-summary-empty-product-card{display:grid;grid-template-columns:65px 212px 63px;grid-template-rows:65px;gap:10px;width:360px;height:65px}.fpb-mobile-summary-empty-product-image{width:65px;height:65px;border:2px dashed #a6a3a3;border-radius:5px;background:#e1e1e1;box-sizing:border-box}.fpb-mobile-summary-empty-product-info{display:flex;flex-direction:column;gap:5px;align-self:center;width:212px;height:48px}.fpb-mobile-summary-empty-product-title{width:169px;height:14px;padding:7px;border-radius:10px;background:#e1e1e1;box-sizing:border-box}.fpb-mobile-summary-empty-product-variant{width:127px;height:12px;padding:6px;border-radius:10px;background:#e1e1e1;box-sizing:border-box}.fpb-mobile-summary-empty-product-price{width:53px;height:12px;padding:6px;border-radius:10px;background:#e1e1e1;box-sizing:border-box}.fpb-mobile-summary-empty-product-action{align-self:center;width:63px;height:20px;padding:10px;border-radius:10px;background:#e1e1e1;box-sizing:border-box}`;
    style.textContent = desktopSummaryStyles + summaryMobileStyles;
    document.head.appendChild(style);
  };
}

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
  }

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
  }

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
      }).catch(() => { /* fire-and-forget */ });
    } catch (_e) {

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
  }

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
  }

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
  }

  _getLandingPageControls() {
    return this.config.controlsSettings?.activeControls
      || this.config.controlsSettings?.settingsControls?.landingPage
      || null;
  }

  _runControlsScript(script) {
    if (!script || typeof script !== 'string') return;
    try {
      new Function(script).call(window);
    } catch (_) {

    }
  }

  _handlePostAddToCartAction(actionConfig) {
    const checkout = actionConfig || this._getLandingPageControls()?.checkout || {};
    this._runControlsScript(checkout.executeScript);

    const target = checkout.action === 'checkout' ? '/checkout' : '/cart';
    this._emitStorefrontEvent('checkout-clicked', { target });

    setTimeout(() => {
      window.location.href = target;
    }, 1000);
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
          const hasRequiredTemplate = parsed.bundleDesignTemplate && parsed.bundleDesignPresetId;
          if (parsed && typeof parsed === 'object' && parsed.id && hasRequiredTemplate) {
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
    if (!this.selectedBundle && this.config?.bundleId && this.bundleData?.[this.config.bundleId]?.bundleType === BUNDLE_WIDGET.BUNDLE_TYPES.FULL_PAGE) {
      this.selectedBundle = this.bundleData[this.config.bundleId];
    }

    this.updateMessagesFromBundle();
  }

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

      this.config.showDiscountMessaging = pricingMessages.showDiscountMessaging || this.selectedBundle?.pricing?.enabled || false;
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
  }

  applyPersonalizationAddonProducts() {
    const addonStep = this.buildAddonStepFromPersonalization();
    if (!addonStep) return;

    this.selectedBundle.steps = (this.selectedBundle.steps || []).filter(step => !step.isFreeGift);
    this.selectedBundle.steps = [...(this.selectedBundle.steps || []), addonStep];
  }

  buildAddonStepFromPersonalization() {
    const personalizationData = this.selectedBundle?.personalizationData;
    const addonProducts = personalizationData?.addonProducts;
    if (personalizationData?.isPersonalizationEnabled !== true || addonProducts?.isEnabled !== true) {
      return null;
    }

    const tiers = Array.isArray(addonProducts.tiers) ? addonProducts.tiers : [];
    const selectedAddonProducts = tiers.flatMap(tier =>
      Array.isArray(tier?.selectedAddonProducts)
        ? tier.selectedAddonProducts.map(product => this.normalizePersonalizationAddonProduct(product))
        : []
    );
    if (selectedAddonProducts.length === 0) return null;

    const firstTier = tiers[0] || {};

    return {
      id: 'personalization-addons',
      name: personalizationData.personalizeStepText || addonProducts.title || '',
      position: (this.selectedBundle?.steps?.length || 0) + 1,
      minQuantity: 0,
      maxQuantity: selectedAddonProducts.length,
      enabled: true,
      isFreeGift: true,
      addonLabel: personalizationData.personalizeStepText || addonProducts.title || '',
      freeGiftName: addonProducts.title || personalizationData.personalizeStepText || '',
      addonTitle: addonProducts.title || personalizationData.personalizePageSubtext || '',
      addonIconUrl: personalizationData.stepImage || null,
      addonDisplayFree: Number(firstTier?.discount?.value || 0) >= 100 && firstTier?.discount?.type === 'PERCENTAGE',
      addonUnlockAfterCompletion: true,
      addonTiers: tiers,
      addonEligibilityCondition: firstTier?.eligibilityCondition || null,
      addonDiscount: firstTier?.discount || null,
      addonMessaging: addonProducts.addonsMessaging || null,
      displayVariantsAsIndividual: firstTier?.displayVariantsAsIndividualProducts_addons === true,
      StepProduct: selectedAddonProducts,
      products: selectedAddonProducts,
      collections: [],
    };
  }

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

      FullPagePreset.markContainer(this.container, this.selectedBundle);

      const layout = this.resolveFullPageLayout();
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
    this.applyFullPageDesignPresetMarker();
    this.ensureBundleBannerRuntimeStyles();
    this.ensureCompactPresetRuntimeStyles();
    this.ensureHorizontalSidePanelSlotRuntimeStyles();

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

    const activeCategoryTitle = this.createActiveCategoryTitle(this.currentStepIndex);
    if (activeCategoryTitle) contentSection.appendChild(activeCategoryTitle);

    const productGridContainer = document.createElement('div');
    productGridContainer.className = 'full-page-product-grid-container';
    productGridContainer.innerHTML = this.createProductGridLoadingState();
    contentSection.appendChild(productGridContainer);
    const categoryRows = this.createCategorySectionRows(this.currentStepIndex);
    if (categoryRows) contentSection.appendChild(categoryRows);

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
    this.applyFullPageDesignPresetMarker();
    this.ensureBundleBannerRuntimeStyles();
    this.ensureStandardPresetRuntimeStyles();
    this.ensureClassicPresetRuntimeStyles();
    this.ensureCompactPresetRuntimeStyles();
    this.ensureHorizontalSidePanelSlotRuntimeStyles();

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
    productGridContainer.innerHTML = this.createProductGridLoadingState();
    contentSection.appendChild(productGridContainer);
    const categoryRows = this.createCategorySectionRows(this.currentStepIndex);
    if (categoryRows) contentSection.appendChild(categoryRows);

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
    const wasCompactSummaryExpanded = preserveOpen
      && previousSheet?.classList.contains('fpb-mobile-summary-tray-expanded');

    document.querySelector('.fpb-mobile-bottom-bar')?.remove();
    document.querySelector('.fpb-mobile-bottom-sheet')?.remove();
    document.querySelector('.fpb-mobile-backdrop')?.remove();
    document.body.classList.remove('fpb-compact-mobile-summary-active');

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
    const usesCompactMobileSummaryTray = this.usesCompactMobileSummaryTray();
    if (usesCompactMobileSummaryTray) {
      sheet.classList.add('fpb-mobile-summary-tray');
      if (this.getFullPageDesignPreset() === 'CLASSIC') {
        sheet.classList.add('fpb-mobile-classic-footer');
      }
      this.compactMobileSummaryTrayExpanded = wasCompactSummaryExpanded || this.compactMobileSummaryTrayExpanded === true;
      this._populateCompactMobileSummaryTray(sheet);
      sheet.classList.add('is-open');
      document.body.classList.add('fpb-compact-mobile-summary-active');
      document.body.appendChild(sheet);
      return;
    }

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
    const boxSelectionValidMobile = this.canCheckoutWithBoxSelection();
    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'fpb-mobile-cta-btn';
    ctaBtn.textContent = (conditionlessMobile || (isLastStep && isComplete)) ? this._resolveText('addToCartButton', 'Add to Cart') : this._resolveText('nextButton', 'Next');
    if (conditionlessMobile ? (!hasSelectionMobile || !boxSelectionValidMobile) : (isLastStep && (!isComplete || !boxSelectionValidMobile))) ctaBtn.disabled = true;
    ctaBtn.addEventListener('click', () => {
      if (conditionlessMobile || (isLastStep && isComplete)) {
        if (!this.canCheckoutWithBoxSelection()) {
          this.showBoxSelectionValidationMessage();
          return;
        }
        this.addBundleToCart();
      } else if (!isLastStep && this.canNavigateToStep(this.currentStepIndex + 1) && this.canProceedToNextStep()) {
        this.activeCollectionId = null;
        this.searchQuery = '';
        this.currentStepIndex++;
        this.renderFullPageLayoutWithSidebar();
      } else if (!isLastStep && !this.canNavigateToStep(this.currentStepIndex + 1)) {
        ToastManager.show(this.freeGiftStep?.addonLabel || this.freeGiftStep?.freeGiftName ? `Complete all steps to unlock the free ${this.freeGiftStep?.addonLabel || this.freeGiftStep?.freeGiftName}!` : 'Complete all steps first.');
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

  usesCompactMobileSummaryTray() {
    const preset = this.getFullPageDesignPreset();
    return this.resolveFullPageLayout() === 'footer_side' && (preset === 'DEFAULT' || preset === 'CLASSIC' || preset === 'COMPACT' || preset === 'HORIZONTAL');
  }

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
    const nextRule = PricingCalculator.getNextDiscountRule?.(this.selectedBundle, totalQuantity) || null;
    const selectedFooterQuantity = this.getAllSelectedProductsData().reduce(
      (sum, item) => sum + (Number(item.quantity) || 1),
      0
    );

    const countBadge = document.createElement('div');
    countBadge.className = 'fpb-mobile-summary-count-badge';
    countBadge.setAttribute('role', 'button');
    countBadge.setAttribute('tabindex', '0');
    countBadge.setAttribute('aria-label', 'Review your bundle');
    countBadge.setAttribute('aria-expanded', this.compactMobileSummaryTrayExpanded ? 'true' : 'false');
    countBadge.textContent = String(selectedFooterQuantity);
    countBadge.addEventListener('click', () => {
      this._toggleCompactMobileSummaryTray(sheet);
    });
    countBadge.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this._toggleCompactMobileSummaryTray(sheet);
      }
    });
    sheet.appendChild(countBadge);

    sheet.classList.toggle('fpb-mobile-summary-tray-expanded', this.compactMobileSummaryTrayExpanded);

    if (this.selectedBundle?.pricing?.enabled) {
      const usesCompactMobileSummaryTray = this.usesCompactMobileSummaryTray();
      const discountBlock = document.createElement('div');
      discountBlock.className = 'side-panel-discount-message';
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

      const shouldShowProgressBar = this.config.showDiscountProgressBar || usesCompactMobileSummaryTray;
      if (shouldShowProgressBar) {
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
        sheet.appendChild(discountBlock);
      }
    }

    const navSection = document.createElement('div');
    navSection.className = 'side-panel-nav';
    const isLastStep = this.currentStepIndex === (this.selectedBundle?.steps?.length || 1) - 1;
    const conditionlessMobile = this.bundleHasNoConditions();
    const hasSelectionMobile = conditionlessMobile && this.getAllSelectedProductsData().filter(p => !p.isDefault).length > 0;
    const actionButton = this._createMobileSummaryActionButton({
      finalPrice,
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
  }

  _toggleCompactMobileSummaryTray(sheet) {
    const hasSelectedSummaryProducts = this.getAllSelectedProductsData().length > 0;
    if (!hasSelectedSummaryProducts) {
      this.compactMobileSummaryTrayExpanded = false;
      this._populateCompactMobileSummaryTray(sheet);
      return;
    }
    this.compactMobileSummaryTrayExpanded = !this.compactMobileSummaryTrayExpanded;
    this._populateCompactMobileSummaryTray(sheet);
  }

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
        this.selectedProducts = this.selectedBundle.steps.map(() => ({}));
        this.compactMobileSummaryTrayExpanded = false;
        this.reRenderFullPage();
      });
      header.appendChild(clearBtn);
    }
    bundleItems.appendChild(header);

    const productsList = document.createElement('div');
    productsList.className = 'fpb-mobile-summary-products-list';

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
          <span class="fpb-mobile-summary-product-qty">×${item.quantity}</span>
        </div>
      `;

      if (!item.isDefault) {
        const removeBtn = document.createElement('button');
        removeBtn.className = 'fpb-mobile-summary-product-remove';
        removeBtn.innerHTML = `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor"><path d="M6 2h8a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1Zm-2 3h12l-1 13H5L4 5Zm4 2v9m4-9v9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>`;
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
        row.querySelector('.fpb-mobile-summary-product-action')?.appendChild(removeBtn);
      }

      productsList.appendChild(row);
    });

    const requiredSlots = Math.max(
      allSelectedProducts.length + 1,
      activeStep?.maxQuantity || activeStep?.minQuantity || totalQuantity + 1,
      2
    );
    const emptySlots = Math.max(0, Math.min(2, requiredSlots - allSelectedProducts.length));
    for (let slotIndex = 0; slotIndex < emptySlots; slotIndex += 1) {
      const emptyCard = document.createElement('div');
      emptyCard.className = 'fpb-mobile-summary-empty-product-card';
      emptyCard.innerHTML = `
        <div class="fpb-mobile-summary-empty-product-image"></div>
        <div class="fpb-mobile-summary-empty-product-info">
          <span class="fpb-mobile-summary-empty-product-title"></span>
          <span class="fpb-mobile-summary-empty-product-variant"></span>
          <span class="fpb-mobile-summary-empty-product-price"></span>
        </div>
        <span class="fpb-mobile-summary-empty-product-action"></span>
      `;
      productsList.appendChild(emptyCard);
    }

    bundleItems.appendChild(productsList);
    return bundleItems;
  }

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
    const hasUpcomingAddonStep = this.freeGiftStepIndex > this.currentStepIndex;
    const shouldAdvance = hasUpcomingAddonStep || (!conditionlessMobile && !isLastStep);
    const shouldAddToCart = !shouldAdvance && (conditionlessMobile || (isLastStep && isComplete));
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
    if (shouldAddToCart && (conditionlessMobile ? (!hasSelectionMobile || !this.canCheckoutWithBoxSelection()) : (!isComplete || !this.canCheckoutWithBoxSelection()))) ctaBtn.disabled = true;
    ctaBtn.addEventListener('click', () => {
      if (shouldAddToCart) {
        if (!this.canCheckoutWithBoxSelection()) {
          this.showBoxSelectionValidationMessage();
          return;
        }
        this.addBundleToCart();
      } else {
        const targetStepIndex = hasUpcomingAddonStep ? this.freeGiftStepIndex : this.currentStepIndex + 1;
        if (this.canNavigateToStep(targetStepIndex) && this.canProceedToNextStep()) {
          const previousStepIndex = this.currentStepIndex;
          this.activeCollectionId = null;
          this.searchQuery = '';
          this.currentStepIndex = targetStepIndex;
          this._emitStorefrontEvent('step-changed', { previousStepIndex, currentStepIndex: targetStepIndex, direction: 'next' });
          this.renderFullPageLayoutWithSidebar();
        } else if (!this.canNavigateToStep(targetStepIndex)) {
          ToastManager.show(this.freeGiftStep?.addonLabel || this.freeGiftStep?.freeGiftName ? `Complete all steps to unlock the free ${this.freeGiftStep?.addonLabel || this.freeGiftStep?.freeGiftName}!` : 'Complete all steps first.');
        } else {
          ToastManager.show('Please meet the quantity conditions for the current step before proceeding.');
        }
      }
    });
    return ctaBtn;
  }

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
  }

  getBundleContentSummaryText() {
    const summary = this.selectedBundle?.bundleTextConfig?.bundleSummary || {};
    return {
      title: typeof summary.title === 'string' ? summary.title.trim() : '',
      subTitle: typeof summary.subTitle === 'string' ? summary.subTitle.trim() : ''
    };
  }

  getCurrentStepContentText(stepIndex) {
    const step = this.selectedBundle?.steps?.[stepIndex];
    return {
      subtext: typeof step?.pageTitle === 'string' ? step.pageTitle.trim() : ''
    };
  }

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
  }

  shouldRenderFullPageSearch() {
    if (this.resolveFullPageLayout() === 'footer_side') {
      return false;
    }
    return this.resolveFullPageCardCtaMode() !== 'icon';
  }

  usesSelectedQuantityBadge() {
    return this.resolveFullPageCardCtaMode() === 'icon';
  }

  _isStandardDesktopSidebar(panel) {
    const preset = this.getFullPageDesignPreset();
    return this.resolveFullPageLayout() === 'footer_side'
      && (preset === 'DEFAULT' || preset === 'CLASSIC')
      && !panel?.classList?.contains('fpb-mobile-bottom-sheet');
  }

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
    const allSelectedProducts = this.getAllSelectedProductsData();
    const nextRule = PricingCalculator.getNextDiscountRule?.(this.selectedBundle, totalQuantity) || null;
    const isMobileSheet = panel.classList?.contains('fpb-mobile-bottom-sheet');
    const isHorizontalPreset = this.selectedBundle?.bundleDesignPresetId === 'HORIZONTAL';
    const isStandardDesktopSidebar = this._isStandardDesktopSidebar(panel);
    const activeStep = this.selectedBundle?.steps?.[this.currentStepIndex] || this.selectedBundle?.steps?.[0] || null;
    const summaryText = this.getBundleSummaryText();

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
        this.selectedProducts = this.selectedBundle.steps.map(() => ({}));
        this.reRenderFullPage();
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
    if (!isStandardDesktopSidebar && tierCta) {
      panel.appendChild(tierCta);
    }

    const boxSelection = this.renderBoxSelectionOptions(totalQuantity);
    if (!isStandardDesktopSidebar && boxSelection) {
      panel.appendChild(boxSelection);
    }

    if (this.selectedBundle?.pricing?.enabled) {
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
        panel.appendChild(msgEl);
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
          panel.appendChild(progressBar);
        }
      }
    }

    const countLabel = document.createElement('div');
    countLabel.className = 'side-panel-item-count';
    countLabel.textContent = isStandardDesktopSidebar
      ? `${allSelectedProducts.length} item(s)`
      : `${allSelectedProducts.length} item${allSelectedProducts.length !== 1 ? 's' : ''}`;
    panel.appendChild(countLabel);

    const productsContainer = document.createElement('div');
    productsContainer.className = 'side-panel-products';
    if (isStandardDesktopSidebar) {
      productsContainer.classList.add('side-panel-products--standard');
    }
    if (isHorizontalPreset) {
      productsContainer.classList.add('side-panel-products--slots');
    }

    if (allSelectedProducts.length > 0) {
      allSelectedProducts.forEach(item => {
        const summaryTitle = this.getSummaryProductDisplayTitle(item);
        const variantInfo = this.getSummaryProductVariantDisplay(item);
        const row = document.createElement('div');
        row.className = 'side-panel-product-row';
        if (isHorizontalPreset) {
          row.classList.add('side-panel-product-slot');
        }

        const imgSrc = this._getSelectedProductImageSrc(item);

        const isFreeGiftItem = item.isFreeGift === true && item.addonDisplayFree === true;
        const qtySpan = `<span class="side-panel-product-qty">×${item.quantity}</span>`;
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
          removeBtn.innerHTML = `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"><path d="M6 2h8a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1Zm-2 3h12l-1 13H5L4 5Zm4 2v9m4-9v9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>`;
          removeBtn.addEventListener('click', () => {
            const stepIndex = item.stepIndex;
            const productId = item.variantId || item.productId || item.id;
            const removedItem = { stepIndex, variantId: productId, quantity: item.quantity, title: item.title };
            this.updateProductSelection(stepIndex, productId, 0);
            const truncated = summaryTitle && summaryTitle.length > 25 ? summaryTitle.substring(0, 25) + '...' : (summaryTitle || 'Product');
            ToastManager.showWithUndo(
              `Removed "${truncated}"`,
              () => { this.updateProductSelection(removedItem.stepIndex, removedItem.variantId, removedItem.quantity); },
              5000
            );
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
      this._renderStandardSidebarEmptySlots(productsContainer);
    }
    if (isHorizontalPreset) {
      const requiredSlots = Math.max(
        totalQuantity + 1,
        activeStep?.maxQuantity || activeStep?.minQuantity || 2,
        2
      );
      const emptySlots = Math.max(0, requiredSlots - allSelectedProducts.length);
      for (let slotIndex = 0; slotIndex < emptySlots; slotIndex += 1) {
        const emptySlot = document.createElement('div');
        emptySlot.className = 'side-panel-product-slot side-panel-product-slot--empty';
        emptySlot.textContent = '+';
        productsContainer.appendChild(emptySlot);
      }
    }
    panel.appendChild(productsContainer);

    if (!isStandardDesktopSidebar && !isMobileSheet && allSelectedProducts.length === 0 && !isHorizontalPreset) {
      const skeletonContainer = document.createElement('div');
      skeletonContainer.className = 'side-panel-skeleton-slots';
      this._renderSidebarProductSkeletons(skeletonContainer);
      panel.appendChild(skeletonContainer);
    }

    if (!isStandardDesktopSidebar) this._renderFreeGiftSection(panel);

    const totalSection = document.createElement('div');
    totalSection.className = 'side-panel-total';
    totalSection.innerHTML = `
      <span class="side-panel-total-label">Total</span>
      <div class="side-panel-total-prices">
        ${combinedDiscountInfo.hasDiscount ? `<span class="side-panel-total-original">${CurrencyManager.convertAndFormat(totalPrice, currencyInfo)}</span>` : ''}
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
    const sidebarTierCtaContent = (conditionless || isLastStep)
      ? this.getSidebarTierCtaContent(nextRule)
      : null;
    if (sidebarTierCtaContent) {
      actionSection.style.gridTemplateColumns = '1fr';
      actionSection.style.gap = '8px';
      totalSection.style.alignItems = 'center';
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = 'side-panel-btn side-panel-btn-next';
    const nextStepLabel = this.getFullPageDesignPreset() === 'DEFAULT' || this.getFullPageDesignPreset() === 'CLASSIC'
      ? this._resolveText('nextButton', 'Next')
      : 'Next Step';
    nextBtn.textContent = (conditionless || isLastStep) ? 'Add to Cart' : nextStepLabel;
    if (sidebarTierCtaContent) {
      const labelHtml = sidebarTierCtaContent.label
        ? `<span class="side-panel-btn-tier-label">${this._escapeHTML(sidebarTierCtaContent.label)}</span>`
        : '';
      const subtextHtml = sidebarTierCtaContent.subtext
        ? `<span class="side-panel-btn-tier-subtext">${this._escapeHTML(sidebarTierCtaContent.subtext)}</span>`
        : '';
      nextBtn.innerHTML = sidebarTierCtaContent ? `${labelHtml}${subtextHtml}` : nextBtn.textContent;
    }
    if (!isStandardDesktopSidebar && (conditionless ? !hasSelection : (isLastStep ? !this.areBundleConditionsMet() : !canProceed))) {
      nextBtn.disabled = true;
    }
    nextBtn.addEventListener('click', () => {
      if (conditionless || isLastStep) {
        this.addBundleToCart();
      } else if (!this.canNavigateToStep(this.currentStepIndex + 1)) {
        const giftName = this.freeGiftStep?.addonLabel || this.freeGiftStep?.freeGiftName;
        ToastManager.show(giftName ? `Complete all steps to unlock ${giftName}!` : 'Complete all steps first.');
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
  }

  getSidebarTierCtaContent(nextRule) {
    const pricing = this.selectedBundle?.pricing;
    if (!pricing?.enabled) return null;

    const displayOptions = pricing.messages?.displayOptions || {};
    const bundleQuantityOptions = displayOptions.bundleQuantityOptions || {};
    const optionsByRuleId = bundleQuantityOptions.optionsByRuleId || {};
    const tierTextByRuleId = pricing.messages?.tierTextByRuleId || {};
    const rules = Array.isArray(pricing.rules) ? pricing.rules : [];
    const ruleId = bundleQuantityOptions.defaultRuleId || nextRule?.id || rules[0]?.id;
    const option = ruleId ? (optionsByRuleId[ruleId] || tierTextByRuleId[ruleId]) : null;
    const label = typeof option?.label === 'string' && option.label.trim()
      ? option.label.trim()
      : (typeof option?.tierText === 'string' ? option.tierText.trim() : '');
    const subtext = typeof option?.subtext === 'string' && option.subtext.trim()
      ? option.subtext.trim()
      : (typeof option?.tierSubtext === 'string' ? option.tierSubtext.trim() : '');

    if (!label && !subtext) return null;
    return { label, subtext };
  }

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
  }

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
  }

  getSelectedBoxSelectionQuantity() {
    return this.getAllSelectedProductsData().reduce((total, item) => {
      if (item.isDefault === true || item.isFreeGift === true) return total;
      return total + (Number(item.quantity || 0) || 0);
    }, 0);
  }

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
  }

  canCheckoutWithBoxSelection() {
    return this.getBoxSelectionValidationState().isValid;
  }

  showBoxSelectionValidationMessage() {
    const state = this.getBoxSelectionValidationState();
    if (!state.isEnabled || state.isValid) return;

    ToastManager.show(`Select exactly ${state.activeRule.boxQuantity} item(s) for ${state.activeRule.boxLabel || 'this box'} before adding to cart.`);
  }

  renderBoxSelectionOptions(totalQuantity = 0) {
    const rules = this.getBoxSelectionRules();
    if (rules.length === 0) return null;

    const activeRule = this.getActiveBoxSelectionRule(rules, totalQuantity);
    const wrapper = document.createElement('div');
    wrapper.className = 'fpb-box-selection-wrapper';

    rules.forEach(rule => {
      const option = document.createElement('button');
      const isActive = activeRule?.ruleId === rule.ruleId;
      option.type = 'button';
      option.className = 'fpb-box-selection-option' + (isActive ? ' fpb-box-selection-option-active' : '');
      option.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      option.dataset.ruleId = rule.ruleId;

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
  }

  _escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

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
  }

  _formatSidebarDiscountMessage(discountMessage) {
    const message = typeof discountMessage === 'string' ? discountMessage.trim() : '';
    return message.replace(/!+\s*$/, '');
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

  _getStepSelectedQuantity(stepIndex) {
    const stepSelections = this.selectedProducts?.[stepIndex] || {};
    return Object.values(stepSelections).reduce((total, qty) => total + (Number(qty) || 0), 0);
  }

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
  }

  _getStepProgressRatio(stepIndex) {
    const step = this.selectedBundle?.steps?.[stepIndex];
    if (!step) return 0;
    if (this.isStepCompleted(stepIndex)) return 1;

    const requiredQuantity = this._getStepRequiredQuantity(step);
    const selectedQuantity = this._getStepSelectedQuantity(stepIndex);
    return Math.max(0, Math.min(1, selectedQuantity / requiredQuantity));
  }

  _getDefaultTimelineIconDataUri(step) {
    const svg = this._getDefaultTimelineIcon(step)
      .replace('class="timeline-step-icon--svg"', 'xmlns="http://www.w3.org/2000/svg"')
      .replace(' xmlns="http://www.w3.org/2000/svg"', '');
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  _isStandardSideFooterTimeline() {
    return this.resolveFullPageLayout() === 'footer_side' && this.getFullPageDesignPreset() === 'DEFAULT';
  }

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
  }

  getStandardTimelinePageSize() {
    return window.innerWidth < 768 ? 4 : 5;
  }

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
  }

  ensureTimelinePagingStyles() {
    if (document.getElementById('wpb-fpb-timeline-paging-styles')) return;

    const style = document.createElement('style');
    style.id = 'wpb-fpb-timeline-paging-styles';
    style.textContent = '.step-timeline--paged{position:relative;flex-wrap:nowrap;justify-content:center;padding:0 24px}.timeline-navigation-arrow{position:absolute;top:10px;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;border:0;background:#fff;color:#000;z-index:3;cursor:pointer;padding:0}.timeline-navigation-arrow--prev{left:4px}.timeline-navigation-arrow--next{right:4px}@media(max-width:767px){.step-timeline.step-timeline--paged{flex-wrap:nowrap}.step-timeline--paged .timeline-step{width:65px;max-width:65px}.step-timeline--paged .timeline-connector{flex:0 0 20px;min-width:20px}.step-timeline--paged .timeline-step-name{white-space:normal;line-height:14px}}';
    document.head.appendChild(style);
  }

  shouldRenderMultipleCategoryTimelineEntry(step) {
    if (!step || step.isFreeGift === true) return false;
    return this.getStepCategoryTabEntries(step).length > 1;
  }

  createStepTimeline() {
    if (this._isStandardSideFooterTimeline()) {
      return this.createStandardStepTimeline();
    }

    const timeline = document.createElement('div');
    timeline.className = 'step-timeline';

    if (!this.selectedBundle || !this.selectedBundle.steps) {
      return timeline;
    }

    const timelineEntries = this.buildStepTimelineEntries();
    const totalEntryCount = Math.max(timelineEntries.length, 1);
    const activeEntryIndex = Math.max(0, timelineEntries.findIndex((entry) => (
      entry.type === 'step' && entry.stepIndex === this.currentStepIndex
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
      const stepEl = document.createElement('div');
      stepEl.className = 'timeline-step';
      stepEl.dataset.stepIndex = index;
      stepEl.dataset.timelineType = entry.type;

      const isDefaultStep = step.isDefault === true;
      const hasMultipleCategoryEntry = this.shouldRenderMultipleCategoryTimelineEntry(step);
      const isCategoryEntry = entry.type === 'multiple_categories';
      const isCompleted = isCategoryEntry ? this.isStepCompleted(index) : this.isStepCompleted(index) || (hasMultipleCategoryEntry && index === this.currentStepIndex);
      const isCurrent = index === this.currentStepIndex && (!hasMultipleCategoryEntry || isCategoryEntry);
      const isAccessible = this.isStepAccessible(index);

      if (isDefaultStep) stepEl.classList.add('timeline-step--included');
      if (isCurrent) stepEl.classList.add('timeline-step--active');
      if (isCompleted) stepEl.classList.add('timeline-step--completed');
      if (!isCurrent && !isCompleted) stepEl.classList.add('timeline-step--inactive');
      if (!isAccessible) stepEl.classList.add('timeline-step--locked');

      const tabLabel = entry.label;
      const escapedName = this._escapeHTML(tabLabel) || `Step ${index + 1}`;

      const uploadedIconUrl = (step.isFreeGift && step.addonIconUrl) ? step.addonIconUrl : step.stepImage;
      const iconContent = uploadedIconUrl
        ? `<img class="timeline-step-icon" src="${uploadedIconUrl}" alt="${escapedName}">`
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

      if (entry.type === 'step' && isAccessible && !isDefaultStep) {
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
  }

  createStandardStepTimeline() {
    const timeline = document.createElement('div');
    timeline.className = 'step-timeline step-timeline--standard';

    if (!this.selectedBundle || !this.selectedBundle.steps) {
      return timeline;
    }

    const timelineEntries = this.buildStepTimelineEntries();
    const totalEntryCount = Math.max(timelineEntries.length, 1);
    const activeEntryIndex = Math.max(0, timelineEntries.findIndex((entry) => (
      entry.type === 'step' && entry.stepIndex === this.currentStepIndex
    )));
    const {
      visibleEntries,
      windowStart,
      pageSize,
      isPaged,
    } = this.getStandardTimelineVisibleEntries(timelineEntries, activeEntryIndex);
    const entryCount = Math.max(visibleEntries.length, 1);
    const activeVisibleEntryIndex = Math.max(0, visibleEntries.findIndex((entry) => (
      entry.type === 'step' && entry.stepIndex === this.currentStepIndex
    )));
    const progressFill = entryCount > 1
      ? Math.max(0, Math.min(100, (activeVisibleEntryIndex / (entryCount - 1)) * 100))
      : 0;
    const progressLeft = 100 / (entryCount * 2);
    const progressWidth = entryCount > 1 ? ((entryCount - 1) / entryCount) * 100 : 0;
    const timelineWidth = Math.min(100, entryCount * 30);

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
      const itemEl = document.createElement('div');
      itemEl.className = 'standard-navigation-item timeline-step';
      itemEl.dataset.stepIndex = index;
      itemEl.dataset.timelineType = entry.type;

      const isDefaultStep = step.isDefault === true;
      const isCurrent = entry.type === 'step' && index === this.currentStepIndex;
      const isCompleted = entry.type === 'step' && !isCurrent && this.isStepCompleted(index);
      const isAccessible = this.isStepAccessible(index);

      if (isDefaultStep) itemEl.classList.add('timeline-step--included');
      if (isCurrent) itemEl.classList.add('timeline-step--active');
      if (isCompleted) itemEl.classList.add('timeline-step--completed');
      if (!isCurrent && !isCompleted) itemEl.classList.add('timeline-step--inactive');
      if (!isAccessible) itemEl.classList.add('timeline-step--locked');

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

      if (entry.type === 'step' && isAccessible && !isDefaultStep) {
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

  createBundleBanners() {
    const desktopBannerUrl = this.selectedBundle?.bundleBannerDesktopUrl;
    const mobileBannerUrl = this.selectedBundle?.bundleBannerMobileUrl;
    if (!desktopBannerUrl && !mobileBannerUrl) return null;

    const wrapper = document.createElement('div');
    wrapper.className = 'bundle-banners';
    if (desktopBannerUrl) wrapper.classList.add('bundle-banners--has-desktop');
    if (mobileBannerUrl) wrapper.classList.add('bundle-banners--has-mobile');

    const appendBannerImage = (url, className) => {
      if (!url) return;
      const img = document.createElement('img');
      img.className = className;
      img.src = url;
      img.alt = '';
      img.loading = 'lazy';
      wrapper.appendChild(img);
    };

    appendBannerImage(desktopBannerUrl, 'bundle-banner-image bundle-banner-image--desktop');
    appendBannerImage(mobileBannerUrl, 'bundle-banner-image bundle-banner-image--mobile');

    return wrapper;
  }

  ensureBundleBannerRuntimeStyles() {
    if (document.getElementById('wpb-fpb-bundle-banner-runtime-styles')) return;

    const style = document.createElement('style');
    style.id = 'wpb-fpb-bundle-banner-runtime-styles';
    style.textContent = `.bundle-banners{width:100%;margin:0 auto 20px;overflow:hidden;display:block}.bundle-banner-image{width:100%;height:auto;display:block;object-fit:cover}.bundle-banner-image--mobile{display:none}.bundle-banners:not(.bundle-banners--has-desktop) .bundle-banner-image--mobile{display:block}@media (max-width: 639px){.bundle-banners{margin-bottom:16px}.bundle-banners--has-mobile .bundle-banner-image--desktop{display:none}.bundle-banners--has-mobile .bundle-banner-image--mobile{display:block}}`;
    document.head.appendChild(style);
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
          banner.style.setProperty('--fpb-promo-banner-bg-size', bgSize);
          banner.style.setProperty('--fpb-promo-banner-bg-position', `${posX}% ${posY}%`);
        } catch (_e) {

        }
      }
    }

    return banner;
  }

  createPromoDiscountTierBadges(pricing, currencyInfo) {
    const rules = Array.isArray(pricing?.rules) ? pricing.rules : [];
    if (!pricing?.enabled || rules.length === 0) return '';

    const rowStyle = 'position:relative;z-index:1;display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:12px';
    const badgeStyle = 'display:inline-flex;align-items:center;justify-content:center;min-height:30px;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.88);color:#111;border:1px solid rgba(17,17,17,.18);font-size:12px;line-height:1.2;font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,.08)';
    const badges = rules
      .filter(rule => rule && (rule.conditionType === 'quantity' || rule.conditionType === 'amount'))
      .sort((a, b) => (Number(a.conditionValue || 0) || 0) - (Number(b.conditionValue || 0) || 0))
      .map(rule => this.formatPromoDiscountTierLabel(rule, pricing, currencyInfo))
      .filter(Boolean)
      .map(label => `<span class="promo-discount-tier-badge" style="${badgeStyle}">${ComponentGenerator.escapeHtml(label)}</span>`);

    if (badges.length === 0) return '';
    return `<div class="promo-discount-tier-row" style="${rowStyle}">${badges.join('')}</div>`;
  }

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
  }

  getActiveStepCategoryId(step) {
    const categoryEntries = this.getStepCategoryTabEntries(step);
    if (categoryEntries.length === 0) return this.activeCollectionId;
    if (this.activeCollectionId && categoryEntries.some(entry => entry.id === this.activeCollectionId)) {
      return this.activeCollectionId;
    }
    return categoryEntries[0].id;
  }

  getActiveStepCategoryEntry(step) {
    const categoryEntries = this.getStepCategoryTabEntries(step);
    const activeCategoryId = this.getActiveStepCategoryId(step);
    return categoryEntries.find(entry => entry.id === activeCategoryId) || null;
  }

  shouldDisplayVariantsAsIndividualForProductGrid(step, activeCategory) {
    if (activeCategory) {
      return activeCategory.displayVariantsAsIndividualProducts === true;
    }

    const hasCategoryEntries = this.getStepCategoryTabEntries(step).length > 0;
    if (hasCategoryEntries) {
      return false;
    }

    return step?.displayVariantsAsIndividualProducts === true || step?.displayVariantsAsIndividual === true;
  }

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
  }

  createCategorySectionRows(stepIndex) {
    if (!this.selectedBundle || !this.selectedBundle.steps || !this.selectedBundle.steps[stepIndex]) {
      return null;
    }

    const step = this.selectedBundle.steps[stepIndex];
    const categoryEntries = this.getStepCategoryTabEntries(step);
    if (categoryEntries.length <= 1) return null;

    const activeCategoryId = this.getActiveStepCategoryId(step);
    const inactiveCategoryEntries = categoryEntries.filter(entry => entry.id !== activeCategoryId);
    if (inactiveCategoryEntries.length === 0) return null;

    const categoryRowsContainer = document.createElement('div');
    categoryRowsContainer.className = 'fpb-category-section-rows';

    inactiveCategoryEntries.forEach(entry => {
      const categoryRow = document.createElement('button');
      categoryRow.type = 'button';
      categoryRow.className = 'fpb-category-section-row fpb-category-section-row--collapsed';
      categoryRow.textContent = entry.title;
      categoryRow.addEventListener('click', () => {
        this.activeCollectionId = entry.id;
        this.reRenderFullPage();
      });
      categoryRowsContainer.appendChild(categoryRow);
    });

    return categoryRowsContainer;
  }

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
        this.activeCollectionId = entry.id;
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

  expandProductsByVariant(products, shouldExpand = true) {
    if (!shouldExpand) {
      return products;
    }

    return products.flatMap(product => {

      if (product.parentProductId && product.variantId) {
        return [product];
      }

      if (product.variants && product.variants.length > 1) {
        return product.variants
          .filter(variant => variant.available !== false)
          .map(variant => {

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
    const renderSelectedQuantityBadge = currentQuantity > 0 && this.usesSelectedQuantityBadge();

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
      {
        variantSelectorHtml,
        actionMode: 'expandingQuantity',
        addButtonText: this.getProductAddButtonText(),
      }
    );

    const wrapper = document.createElement('div');
    wrapper.innerHTML = htmlString.trim();
    const cardElement = wrapper.firstChild;

    if (renderSelectedQuantityBadge) {
      this.applySelectedQuantityBadge(cardElement, currentQuantity);
    }

    this.applyStandardExpandedVariantTitle(cardElement, product);

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

    if (currentStepData?.isFreeGift && currentStepData?.addonDisplayFree === true) {
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

    this.attachProductCardListeners(cardElement, product, stepIndex);

    return cardElement;
  }

  applyStandardExpandedVariantTitle(cardElement, product) {
    const preset = this.getFullPageDesignPreset();
    if (!['DEFAULT', 'HORIZONTAL'].includes(preset)) return;
    if (!cardElement) return;

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
    titleEl.textContent = `${parentTitle}\n${variantTitle}`;
  }

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
  }

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
  }

  getParentTitleFromDisplayTitle(displayTitle) {
    if (typeof displayTitle !== 'string') return '';
    const separatorIndex = displayTitle.indexOf(' - ');
    if (separatorIndex <= 0) return '';
    const parentCandidate = displayTitle.slice(0, separatorIndex).trim();
    return parentCandidate || '';
  }

  getSummaryVariantFromDisplayTitle(displayTitle) {
    if (typeof displayTitle !== 'string') return '';
    const separatorIndex = displayTitle.indexOf(' - ');
    if (separatorIndex <= 0) return '';
    const variantCandidate = displayTitle.slice(separatorIndex + 3).trim();
    return variantCandidate || '';
  }

  applySelectedQuantityBadge(cardElement, currentQuantity) {
    if (!cardElement) return;
    cardElement.querySelector('.selected-overlay')?.remove();
    const actionWrapper = cardElement.querySelector('.product-card-action');
    if (!actionWrapper) return;

    const priceRow = cardElement.querySelector('.product-price-row');
    const actionRow = document.createElement('div');
    actionRow.className = 'product-selected-action-row';
    if (priceRow) {
      actionRow.appendChild(priceRow);
    }

    const quantityBadge = document.createElement('span');
    quantityBadge.className = 'inline-quantity-display-only';
    quantityBadge.textContent = String(currentQuantity);
    actionRow.appendChild(quantityBadge);

    actionWrapper.classList.remove('is-expanded');
    actionWrapper.classList.add('has-selected-quantity-badge');
    actionWrapper.replaceChildren(actionRow);
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
  }

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
              addonDisplayFree: step.addonDisplayFree === true,
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

  /**
   * Show variant breakdown popup for a product with multiple variants
   * @param {Object} productGroup - Product group with multiple variants
   */
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
    const layout = this.resolveFullPageLayout();
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
    if (this.freeGiftStep.addonEligibilityCondition || Array.isArray(this.freeGiftStep.addonTiers)) {
      return this.getAddonEligibilityState(this.freeGiftStep).isEligible;
    }
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
    if (this.freeGiftStep?.addonEligibilityCondition || Array.isArray(this.freeGiftStep?.addonTiers)) {
      return this.getAddonEligibilityState(this.freeGiftStep).remainingQuantity;
    }
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

  getAddonEligibilityState(step) {
    const tier = Array.isArray(step?.addonTiers) ? step.addonTiers[0] : null;
    const condition = step?.addonEligibilityCondition || tier?.eligibilityCondition || {};
    const discount = step?.addonDiscount || tier?.discount || {};
    const conditionType = String(condition.type || 'QUANTITY').toUpperCase();
    const conditionValue = Number(condition.value || 0);
    const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData,
      this.selectedBundle?.steps
    );
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const thresholdCents = conditionType === 'AMOUNT' ? Math.round(conditionValue * 100) : conditionValue;
    const currentValue = conditionType === 'AMOUNT' ? totalPrice : totalQuantity;
    const remainingRaw = Math.max(0, thresholdCents - currentValue);
    const remainingQuantity = conditionType === 'AMOUNT' ? 0 : remainingRaw;
    const remainingAmount = conditionType === 'AMOUNT' ? remainingRaw : 0;
    const discountValue = Number(discount.value || 0);
    const discountUnit = discount.type === 'PERCENTAGE' ? '%' : currencyInfo.display.symbol;

    return {
      isEligible: remainingRaw <= 0,
      conditionType,
      remainingQuantity,
      remainingAmount,
      variables: {
        addonsConditionDiff: conditionType === 'AMOUNT'
          ? String(Math.ceil(remainingAmount / 100))
          : String(remainingQuantity),
        currencyUnit: currencyInfo.display.symbol,
        addonsDiscountValue: String(discountValue),
        addonsDiscountValueUnit: discountUnit,
      },
    };
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
      addonDiscountAmount,
      finalPrice,
      discountPercentage: totalPrice > 0 ? (combinedDiscountAmount / totalPrice) * 100 : 0,
    };
  }

  renderAddonEligibilityMessage(step, eligibilityState) {
    const messages = step?.addonMessaging || {};
    const tierMessages = messages.tier1 || {};
    const template = eligibilityState.isEligible
      ? tierMessages.eligibleState
      : tierMessages.ineligibleState;
    if (!template) return '';

    return Object.entries(eligibilityState.variables).reduce((message, [key, value]) => {
      return message
        .replaceAll(`##${key}##`, value)
        .replaceAll(`{{${key}}}`, value);
    }, template);
  }

  renderAddonSectionTitle(step) {
    const title = step?.freeGiftName || step?.addonTitle || step?.addonLabel;
    if (typeof title !== 'string' || !title.trim()) return null;

    const titleEl = document.createElement('div');
    titleEl.className = 'side-panel-item-count side-panel-addon-title';
    titleEl.textContent = title.trim();
    return titleEl;
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
    const hasDirectAddonTiers = step.addonEligibilityCondition || Array.isArray(step.addonTiers);

    if (hasDirectAddonTiers) {
      const eligibilityState = this.getAddonEligibilityState(step);
      const message = this.renderAddonEligibilityMessage(step, eligibilityState);
      if (!message) return;

      const title = this.renderAddonSectionTitle(step);
      if (title) container.appendChild(title);

      section.className = eligibilityState.isEligible
        ? 'side-panel-addon-message side-panel-free-gift unlocked'
        : 'side-panel-addon-message side-panel-free-gift';
      section.innerHTML = `
        <span class="side-panel-free-gift-icon">${eligibilityState.isEligible ? '✓' : '!'}</span>
        <span class="side-panel-free-gift-text">${this._escapeHTML(message)}</span>
      `;
      container.appendChild(section);
      return;
    }

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

  _renderStandardSidebarEmptySlots(container) {
    for (let i = 0; i < 2; i += 1) {
      const slot = document.createElement('div');
      slot.className = 'side-panel-product-row side-panel-skeleton-slot side-panel-skeleton-slot--standard-empty';
      slot.innerHTML = `
        <div class="side-panel-product-img-wrap">
          <div class="side-panel-product-img-placeholder side-panel-skeleton-thumb"></div>
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
    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const combinedDiscountInfo = this.getDiscountInfoWithSelectedAddonDiscount(discountInfo, totalPrice);
    const discountAmount = Math.max(0, Number(combinedDiscountInfo.discountAmount || 0));
    const discountPercentage = totalPrice > 0 ? (discountAmount / totalPrice) * 100 : 0;

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

    return this.buildCartLineDisplayProperties(displayProperties);
  }

  buildCartLineDisplayProperties(displayProperties) {
    const cartLineLabels = this.getCartLineLabels();
    const properties = {
      Box: displayProperties.box || '1',
      [cartLineLabels.items]: displayProperties.items,
      [cartLineLabels.retailPrice]: displayProperties.retailPrice,
      '_bundle_display_properties': JSON.stringify(displayProperties)
    };

    if (displayProperties.youSave?.amountPercentage) {
      properties[cartLineLabels.youSave] = displayProperties.youSave.amountPercentage;
    }

    return properties;
  }

  async addBundleToCart() {
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
      const selectedLines = [];
      let itemNumber = 0;

      this.selectedBundle.steps.forEach((step, stepIndex) => {
        const stepSelections = this.selectedProducts[stepIndex] || {};
        const productsInStep = this.expandProductsByVariant(this.stepProductData[stepIndex] || []);

        Object.entries(stepSelections).forEach(([variantId, quantity]) => {
          if (quantity > 0) {

            const numericVariantId = this.extractId(variantId) || variantId;
            const product = productsInStep.find(p => String(p.variantId || p.id) === String(variantId))
              || { id: variantId, title: variantId };

            itemNumber += 1;
            const properties = {
              Box: String(itemNumber),
              '_bundleName': bundleName,
              '_easyBundle:prodQty': String(quantity),
              '_easyBundle:OfferId': `${offerId}_${sessionKey}_${itemNumber}`
            };
            const addonDiscount = this.getAddonLineDiscount(step);
            if (addonDiscount && step?.addonDisplayFree !== true) {
              properties['_bundle_step_type'] = addonDiscount
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
            selectedLines.push({ product, quantity });
          }
        });
      });

      if (items.length === 0) {
        ToastManager.show('Please select products before adding to cart');
        return;
      }

      const sourceProperties = this.buildCartLineSourceProperties(selectedLines);
      items.forEach(item => {
        Object.assign(item.properties, sourceProperties);
      });

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

        await this.syncBundleDetailsCartMetafield(`${offerId}_${sessionKey}`, sourceProperties);

        this._emitStorefrontEvent('bundle-add-to-cart-success', { itemCount: items.length, lineCount: selectedLines.length });

        ToastManager.show('Bundle added to cart successfully!');
        this._handlePostAddToCartAction(this._getLandingPageControls()?.checkout);

      } catch (fetchError) {
        this._emitStorefrontEvent('bundle-add-to-cart-failed', { reason: 'fetch-error', message: String(fetchError && fetchError.message || fetchError) });
        ToastManager.show('Failed to add bundle to cart. Please try again.');
      } finally {
        this.hideLoadingOverlay();
        if (nextBtn) nextBtn.disabled = false;
      }

    } catch (error) {
      this._emitStorefrontEvent('bundle-add-to-cart-failed', { reason: 'validation-error', message: String(error && error.message || error) });
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
  }

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
  }

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
        const isReached = rule.conditionType === 'amount'
          ? Number(totalPrice || 0) >= threshold
          : Number(totalQuantity || 0) >= threshold;

        return {
          ruleId,
          title: tierText.tierText || boxRule?.boxLabel || String(threshold),
          subTitle: tierText.tierSubtext || boxRule?.boxSubtext || '',
          isReached,
        };
      })
      .filter(milestone => milestone.ruleId && milestone.title);
  }

  renderStepBasedDiscountProgress(progressPct, milestones, isReached, placement = "default") {
    const bar = document.createElement('div');
    bar.className = `fpb-discount-progress fpb-dp-step_based` + (isReached ? ' reached' : '');
    bar.style.setProperty('--fpb-discount-progress-width', progressPct + '%');

    const stepList = document.createElement('div');
    stepList.className = 'fpb-discount-step-list';
    milestones.forEach(milestone => {
      const step = document.createElement('div');
      step.className = 'fpb-discount-step' + (milestone.isReached ? ' fpb-discount-step-reached' : '');

      const title = document.createElement('span');
      title.className = 'fpb-discount-step-title';
      title.textContent = milestone.title;
      step.appendChild(title);

      if (placement !== "sidebar" && milestone.subTitle) {
        const subTitle = document.createElement('span');
        subTitle.className = 'fpb-discount-step-subtitle';
        subTitle.textContent = milestone.subTitle;
        step.appendChild(subTitle);
      }

      stepList.appendChild(step);
    });

    const track = document.createElement('div');
    track.className = 'fpb-dp-track';
    const fill = document.createElement('div');
    fill.className = 'fpb-dp-fill';
    track.appendChild(fill);

    bar.appendChild(stepList);
    bar.appendChild(track);

    if (placement === "sidebar" && milestones.some(milestone => milestone.subTitle)) {
      const subTitleList = document.createElement('div');
      subTitleList.className = 'fpb-discount-step-subtitle-list';
      milestones.forEach(milestone => {
        const subTitle = document.createElement('span');
        subTitle.className = 'fpb-discount-step-subtitle' + (milestone.isReached ? ' fpb-discount-step-reached' : '');
        subTitle.textContent = milestone.subTitle || '';
        subTitleList.appendChild(subTitle);
      });
      bar.appendChild(subTitleList);
    }

    return bar;
  }

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

    if (progressBarType === 'step_based') {
      const milestones = this.getDiscountProgressMilestones(totalPrice, totalQuantity);
      if (milestones.length > 0) {
        return this.renderStepBasedDiscountProgress(progressPct, milestones, isReached, placement);
      }
    }

    let message = '';
    if (isReached) {
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

    const bar = document.createElement('div');
    bar.className = progressBarType === 'simple'
      ? 'fpb-discount-progress fpb-dp-simple' + (isReached ? ' reached' : '')
      : 'fpb-discount-progress fpb-dp-step_based' + (isReached ? ' reached' : '');
    bar.style.setProperty('--fpb-discount-progress-width', progressPct + '%');

    const row = document.createElement('div');
    row.className = 'fpb-dp-row';
    const msgSpan = document.createElement('span');
    msgSpan.className = 'fpb-dp-message';
    msgSpan.innerHTML = message;
    const pctSpan = document.createElement('span');
    pctSpan.className = 'fpb-dp-pct';
    pctSpan.textContent = progressPct + '%';
    row.appendChild(msgSpan);
    row.appendChild(pctSpan);

    const track = document.createElement('div');
    track.className = 'fpb-dp-track';
    const fill = document.createElement('div');
    fill.className = 'fpb-dp-fill';
    track.appendChild(fill);

    bar.appendChild(row);
    bar.appendChild(track);
    return bar;
  }

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
    } else {
      const productIds = this.collectStepProductIds(step);
      if (!hasEnrichedStepProducts && productIds.length > 0) {
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
            }
          }
        } catch (error) {
        }
      }
    }

    if (allProducts.length === 0 && Array.isArray(step.categories)) {
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
              }
            }
          } catch (error) {
          }
        }
      }
    }

    const collectionHandles = this.collectStepCollectionHandles(step);
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
  }

  getFirstAvailableVariant(product) {
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    if (variants.length === 0) {
      return null;
    }

    return variants.find(variant => variant.available === true) || null;
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
      if (this.shouldExpandStepProductsDuringLoad(step) && product.variants && product.variants.length > 0) {

        const processedVariants = (product.variants || []).map(normalizeVariant);

        const processedOptions = (product.options || []).map(opt => {
          if (typeof opt === 'string') return opt;
          return opt.name || opt;
        });

        return product.variants
          .filter(variant => variant.available === true)
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
    if (product.available === false) {
      return true;
    }
    return false;
  }

  getVariantAvailable(stepIndex, variantId) {
    const products = this.stepProductData[stepIndex] || [];
    const product = products.find(p => (p.variantId || p.id) === variantId);
    if (!product) {
      return { available: null, outOfStock: false, acceptsBackorder: false };
    }

    const qty = typeof product.quantityAvailable === 'number' && product.quantityAvailable > 0
      ? product.quantityAvailable
      : null;
    const backorder = product.currentlyNotInStock === true;
    const outOfStock = this.isVariantOutOfStock(product);

    return { available: qty, outOfStock, acceptsBackorder: backorder };
  }

  extractId(idString) {
    if (!idString) return null;

    const gidMatch = idString.toString().match(/gid:\/\/shopify\/\w+\/(\d+)/);
    if (gidMatch) {
      return gidMatch[1];
    }

    return idString.toString().split('/').pop();
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
    const step = this.selectedBundle?.steps?.[stepIndex] || {};

    if (products.length === 0) {
      if (!this._shouldRenderProductSlots()) {
        productGrid.innerHTML = `
          <div class="empty-products-message">
            <p>No products available for this step.</p>
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
      const renderSelectedQuantityBadge = currentQuantity > 0 && this.usesSelectedQuantityBadge();
      const currencyInfo = CurrencyManager.getCurrencyInfo();
      const priceMarkup = product.price ? `
              <div class="product-price-row">
                ${product.compareAtPrice ? `<span class="product-price-strike">${CurrencyManager.convertAndFormat(product.compareAtPrice, currencyInfo)}</span>` : ''}
                <span class="product-price">${CurrencyManager.convertAndFormat(product.price, currencyInfo)}</span>
              </div>
            ` : '';

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

      return `
        <div class="product-card ${currentQuantity > 0 ? 'selected' : ''} ${outOfStock ? 'is-out-of-stock' : ''}" data-product-id="${selectionKey}">
          ${currentQuantity > 0 && !renderSelectedQuantityBadge ? `
            <div class="selected-overlay">✓</div>
          ` : ''}

          <div class="product-image">
            <img src="${product.imageUrl}" alt="${ComponentGenerator.escapeHtml(product.title)}" loading="lazy">
            ${stockBadge}
          </div>

          <div class="product-content-wrapper">
            <div class="product-title">${ComponentGenerator.escapeHtml(product.title)}</div>

            ${renderSelectedQuantityBadge ? '' : priceMarkup}

            <div class="product-spacer"></div>

            ${this.renderVariantSelector(product, this.selectedBundle?.steps?.[stepIndex])}

            ${renderSelectedQuantityBadge ? `
              <div class="product-selected-action-row">
                ${priceMarkup}
                <span class="inline-quantity-display-only" data-product-id="${selectionKey}">${currentQuantity}</span>
              </div>
            ` : `
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
                ${outOfStock ? 'Out of stock' : (currentQuantity > 0 ? '✓ Added to Bundle' : this.getProductAddButtonText())}
              </button>
            `}
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
            product.available = variantData.available === true;

            const oldQuantity = this.selectedProducts[stepIndex][product.variantId] || 0;
            if (oldQuantity > 0) {
              delete this.selectedProducts[stepIndex][product.variantId];

              const newQtyAvail = product.quantityAvailable;
              const newOOS = this.isVariantOutOfStock(product);
              let migratedQty = oldQuantity;
              if (newOOS) {
                ToastManager.show('Selected variant is out of stock — selection cleared.');
                migratedQty = 0;
              } else if (newQtyAvail !== null && newQtyAvail > 0 && oldQuantity > newQtyAvail) {
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
      if (available !== null && available > 0 && quantity > available) {
        quantity = available;
        ToastManager.show(`Only ${available} in stock — quantity adjusted.`);
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
      ToastManager.show(`Maximum allowed quantity per product is ${productQuantityCheck.limit}.`);
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
  }

  _shouldRenderProductSlots() {
    return this.selectedBundle?.productSlotsEnabled === true;
  }

  updateProductQuantityDisplay(stepIndex, productId, quantity) {
    if (this.usesSelectedQuantityBadge()) {
      this.refreshCurrentProductGrid(stepIndex);
      if (this.elements?.modal?.querySelector('.product-grid')) {
        this.renderModalProducts(stepIndex);
      }
      this._refreshSiblingDimState(stepIndex);
      return;
    }

    const productCard = this.container.querySelector(`[data-product-id="${productId}"]`);
    if (!productCard) return;

    const contentWrapper = productCard.querySelector('.product-content-wrapper');
    const actionWrapper = productCard.querySelector('.product-card-action');
    if (!contentWrapper && !actionWrapper) return;

    const actionContainer = actionWrapper || contentWrapper;
    const existingAddBtn = productCard.querySelector('.product-add-btn');
    const existingQuantityControls = productCard.querySelector('.inline-quantity-controls');
    let selectedOverlay = productCard.querySelector('.selected-overlay');

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
        quantityControls.innerHTML = `
          <button class="inline-qty-btn qty-decrease" data-product-id="${productId}">−</button>
          <span class="inline-qty-display">${quantity}</span>
          <button class="inline-qty-btn qty-increase" data-product-id="${productId}">+</button>
        `;
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

      if (!selectedOverlay) {
        selectedOverlay = document.createElement('div');
        selectedOverlay.className = 'selected-overlay';
        selectedOverlay.textContent = '✓';
        productCard.appendChild(selectedOverlay);
      }
      selectedOverlay.style.display = 'flex';
      productCard.classList.add('selected');

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

      if (selectedOverlay) {
        selectedOverlay.style.display = 'none';
      }
      productCard.classList.remove('selected');
    }

    this._refreshSiblingDimState(stepIndex);
  }

  refreshCurrentProductGrid(stepIndex) {
    if (this.container.dataset.bundleType !== 'full_page') return false;
    if (stepIndex !== this.currentStepIndex) return false;

    const currentGrid = this.container.querySelector('.full-page-product-grid');
    if (!currentGrid) return false;

    const replacementGrid = this.createFullPageProductGrid(stepIndex);
    currentGrid.replaceWith(replacementGrid);
    return true;
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

    if (ConditionValidator.isCategoryRuleMode(step)) {
      const products = this.stepProductData[stepIndex] || [];
      const translated = {};
      for (const [selKey, qty] of Object.entries(currentSelections)) {
        const product = products.find(p => (p.variantId || p.id) === selKey);
        const productId = String((product && (product.parentProductId || product.id)) || selKey);
        translated[productId] = (translated[productId] || 0) + (Number(qty) || 0);
      }
      return ConditionValidator.isStepConditionSatisfied(step, translated);
    }

    return ConditionValidator.isStepConditionSatisfied(step, currentSelections);
  }

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
  }

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
  }

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
    requestAnimationFrame(() => markLoadingOverlayVisible(overlay));
  }

  hideLoadingOverlay() {
    const overlay = this.container?.querySelector('.bundle-loading-overlay');
    hideLoadingOverlayElement(overlay);
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

  resolveFullPageOfferId() {
    const rawOfferId = this.selectedBundle?.offerId
      || this.selectedBundle?.bundleOfferId
      || this.selectedBundle?.id
      || 'UNKNOWN';
    const offerId = String(rawOfferId);
    return offerId.startsWith('FBP-') ? offerId : `FBP-${offerId}`;
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
  }

  getCartLineLabels() {
    const labels = this.config?.sharedCartLabels || {};
    return {
      items: labels.bundleContainsLabel || 'Items',
      retailPrice: labels.bundleOriginalPriceLabel || 'Retail Price',
      youSave: labels.bundleDiscountDisplayLabel || 'You Save',
    };
  }

  async getBundleDetailsCartToken() {
    const response = await fetch('/cart.js?app=wolfpackProductBundles', {
      credentials: 'same-origin'
    });
    if (!response.ok) return null;
    const cart = await response.json();
    return cart?.token || null;
  }

  generateBundleSessionKey() {
    return Math.random().toString(36).slice(2, 5).toUpperCase();
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

  resolveFullPageLayout(bundle = this.selectedBundle) {
    if (bundle?.bundleDesignTemplate === 'FBP_SIDE_FOOTER') {
      return 'footer_side';
    }

    return bundle?.fullPageLayout || 'footer_bottom';
  }

  getFullPageTemplate(bundle = this.selectedBundle) {
    return bundle?.bundleDesignTemplate || 'FBP_SIDE_FOOTER';
  }

  getFullPageDesignPreset(bundle = this.selectedBundle) {
    const rawPresetId =
      bundle?.bundleDesignPresetId
      || bundle?.bundleDesignPreset
      || bundle?.templateId
      || 'DEFAULT';
    if (typeof rawPresetId !== 'string') return 'DEFAULT';

    const preset = rawPresetId.trim().toUpperCase();
    if (preset === 'STANDARD') return 'DEFAULT';
    if (preset === 'DEFAULT_FBP') return 'DEFAULT';
    return preset || 'DEFAULT';
  }

  resolveFullPageCardCtaMode(bundle = this.selectedBundle) {
    const boxSelection = bundle?.boxSelection;
    const boxSelectionEnabled = boxSelection?.isEnabled === true && Array.isArray(boxSelection.rules) && boxSelection.rules.length > 0;
    if (
      this.resolveFullPageLayout(bundle) === 'footer_side' &&
      (this.getFullPageDesignPreset(bundle) === 'DEFAULT' || this.getFullPageDesignPreset(bundle) === 'CLASSIC' || this.getFullPageDesignPreset(bundle) === 'COMPACT') &&
      !boxSelectionEnabled
    ) {
      return 'icon';
    }
    return 'text';
  }

  getProductAddButtonText() {
    return this._resolveText('productAddButton', 'Add To Box');
  }

  applyFullPageDesignPresetMarker() {
    if (!this.container || !this.elements?.stepsContainer) return;

    const fullPageTemplate = this.getFullPageTemplate();
    const fullPageDesignPreset = this.getFullPageDesignPreset();
    const fullPageTabStyle = fullPageDesignPreset === 'DEFAULT' || fullPageDesignPreset === 'HORIZONTAL' ? 'underline' : 'pill';
    const presetClass = `fpb-preset-${fullPageDesignPreset.toLowerCase()}`;

    this.container.dataset.fpbTemplateType = fullPageTemplate;
    this.elements.stepsContainer.dataset.fpbTemplateType = fullPageTemplate;

    this.container.dataset.fpbDesignPreset = fullPageDesignPreset;
    this.elements.stepsContainer.dataset.fpbDesignPreset = fullPageDesignPreset;
    this.container.dataset.fpbTabStyle = fullPageTabStyle;
    this.elements.stepsContainer.dataset.fpbTabStyle = fullPageTabStyle;
    const cardCtaMode = this.resolveFullPageCardCtaMode();
    this.elements.stepsContainer.dataset.fpbCardCtaMode = cardCtaMode;
    this.container.classList.remove('fpb-preset-default', 'fpb-preset-classic', 'fpb-preset-compact', 'fpb-preset-horizontal');
    this.container.classList.add(presetClass);
    this.container.classList.toggle('fpb-h', fullPageDesignPreset === 'HORIZONTAL');
    this.container.classList.toggle('fpb-d', fullPageDesignPreset === 'DEFAULT');
    this.elements.stepsContainer.classList.remove('fpb-preset-default', 'fpb-preset-classic', 'fpb-preset-compact', 'fpb-preset-horizontal');
    this.elements.stepsContainer.classList.add(presetClass);
    this.elements.stepsContainer.classList.toggle('fpb-h', fullPageDesignPreset === 'HORIZONTAL');
    this.elements.stepsContainer.classList.toggle('fpb-d', fullPageDesignPreset === 'DEFAULT');
    this.elements.stepsContainer.classList.toggle('fpb-i', cardCtaMode === 'icon');
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
      'promoBannerBgImage', 'promoBannerBgImageCrop',
      'bundleBannerDesktopUrl', 'bundleBannerMobileUrl', 'loadingGif',
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

      const freshLayout = this.resolveFullPageLayout(data.bundle);
      const currentLayout = this.resolveFullPageLayout();
      const freshTemplate = data.bundle.bundleDesignTemplate ?? null;
      const currentTemplate = this.selectedBundle?.bundleDesignTemplate ?? null;
      const freshPreset = data.bundle.bundleDesignPresetId ?? null;
      const currentPreset = this.selectedBundle?.bundleDesignPresetId ?? null;

      if ((freshLayout !== currentLayout || freshTemplate !== currentTemplate || freshPreset !== currentPreset) && this.selectedBundle) {
        this.selectedBundle.fullPageLayout = data.bundle.fullPageLayout || 'footer_bottom';
        this.selectedBundle.bundleDesignTemplate = data.bundle.bundleDesignTemplate ?? this.selectedBundle.bundleDesignTemplate;
        this.selectedBundle.bundleDesignPresetId = data.bundle.bundleDesignPresetId ?? this.selectedBundle.bundleDesignPresetId;
        this.selectedBundle.bundleDesignTemplateData = data.bundle.bundleDesignTemplateData ?? this.selectedBundle.bundleDesignTemplateData;
        if (this.bundleData?.[bundleId]) {
          this.bundleData[bundleId].fullPageLayout = data.bundle.fullPageLayout || 'footer_bottom';
          this.bundleData[bundleId].bundleDesignTemplate = data.bundle.bundleDesignTemplate ?? this.bundleData[bundleId].bundleDesignTemplate;
          this.bundleData[bundleId].bundleDesignPresetId = data.bundle.bundleDesignPresetId ?? this.bundleData[bundleId].bundleDesignPresetId;
          this.bundleData[bundleId].bundleDesignTemplateData = data.bundle.bundleDesignTemplateData ?? this.bundleData[bundleId].bundleDesignTemplateData;
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
      const bundleId = this.config?.bundleId ?? this.container?.dataset?.bundleId;
      const shop = window.Shopify?.shop;
      if (!bundleId || !shop) return;
      fetch(`/apps/product-bundles/api/bundle/${bundleId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop }),
        keepalive: true,
      }).catch(() => {  });
    } catch (_) {

    }
  }
}

installStandardTemplate(BundleWidgetFullPage);
installClassicTemplate(BundleWidgetFullPage);
installCompactTemplate(BundleWidgetFullPage);
installHorizontalTemplate(BundleWidgetFullPage);

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