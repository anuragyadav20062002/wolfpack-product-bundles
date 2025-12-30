
(function() {
  'use strict';

  // BUNDLE WIDGET COMPONENTS
  /**
 * Bundle Widget - Shared Components Library
 *
 * This library contains all reusable components and utilities used by both
 * product-page and full-page bundle widgets.
 *
 * ============================================================================
 * ARCHITECTURE ROLE
 * ============================================================================
 * This is the SECOND file loaded in the bundle widget system:
 * 1. bundle-widget.js (loader) - Detects bundle type
 * 2. THIS FILE (components) - Provides shared utilities
 * 3. bundle-widget-{type}.js - Widget-specific implementation
 *
 * ============================================================================
 * EXPORTED MODULES
 * ============================================================================
 *
 * CONSTANTS:
 * - BUNDLE_WIDGET: Global configuration and constants
 *
 * UTILITIES:
 * - CurrencyManager: Multi-currency handling and money formatting
 * - BundleDataManager: Fetching and managing bundle data from Shopify
 * - PricingCalculator: Bundle pricing, discounts, and totals
 * - ToastManager: User notifications and feedback
 * - TemplateManager: Dynamic message templating with variables
 *
 * UI COMPONENTS:
 * - ComponentGenerator: Generates HTML for all UI elements
 *   - Product cards (with variants, quantities, pricing)
 *   - Empty state cards (placeholder UI)
 *   - Modal structure (for full-page bundles)
 *   - Progress bars (discount progress tracking)
 *   - Tabs (step navigation)
 *   - Footer components (pricing summary, CTA buttons)
 *
 * ============================================================================
 * USAGE BY WIDGETS
 * ============================================================================
 * Both product-page and full-page widgets import from this library:
 *
 * import {
 *   BUNDLE_WIDGET,
 *   CurrencyManager,
 *   BundleDataManager,
 *   PricingCalculator,
 *   ToastManager,
 *   TemplateManager,
 *   ComponentGenerator
 * } from './bundle-widget-components.js';
 *
 * ============================================================================
 * BENEFITS OF THIS ARCHITECTURE
 * ============================================================================
 * 1. NO CODE DUPLICATION: Shared code written once, used everywhere
 * 2. CONSISTENCY: Same business logic across both bundle types
 * 3. MAINTAINABILITY: Fix bugs in one place, applies to all widgets
 * 4. SMALLER FILES: Widget files only contain layout-specific code
 * 5. TESTABILITY: Can test utilities independently of widgets
 *
 * @version 1.0.0
 * @author Wolfpack Team
 */

'use strict';

// ============================================================================
// GLOBAL CONSTANTS AND CONFIGURATION
// ============================================================================

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

// ============================================================================
// CURRENCY MANAGEMENT SYSTEM
// ============================================================================

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

// ============================================================================
// BUNDLE DATA MANAGER
// ============================================================================

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
        console.warn(`Unknown bundle type: ${bundle.bundleType}`);
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

// Continue in next part...

// ============================================================================
// PRICING CALCULATOR
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
}
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
// ============================================================================

// ============================================================================
// COMPONENT GENERATORS
// ============================================================================

class ComponentGenerator {
  /**
   * Generates HTML for a product card with variant selector and quantity controls
   */
  static renderProductCard(product, currentQuantity, currencyInfo) {
    const selectionKey = product.variantId || product.id;

    return `
      <div class="product-card ${currentQuantity > 0 ? 'selected' : ''}" data-product-id="${selectionKey}">
        ${currentQuantity > 0 ? `
          <div class="selected-overlay">✓</div>
        ` : ''}

        <div class="product-image">
          <img src="${product.imageUrl || product.image?.src || 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png'}" alt="${product.title}" loading="lazy" onerror="this.src='https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png'">
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

          <button class="product-add-btn ${currentQuantity > 0 ? 'added' : ''}" data-product-id="${selectionKey}">
            ${currentQuantity > 0 ? 'Added to Bundle' : 'Add to Bundle'}
          </button>
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


  // EXPOSE COMPONENTS TO WINDOW
  if (!window.BUNDLE_WIDGET) {
    window.BUNDLE_WIDGET = {};
  }

  window.BUNDLE_WIDGET.ComponentGenerator = ComponentGenerator;
  window.BUNDLE_WIDGET.CurrencyManager = CurrencyManager;
  window.BUNDLE_WIDGET.BundleDataManager = BundleDataManager;
  window.BUNDLE_WIDGET.PricingCalculator = PricingCalculator;
  window.BUNDLE_WIDGET.ToastManager = ToastManager;
  window.BUNDLE_WIDGET.TemplateManager = TemplateManager;

  // FULL PAGE WIDGET
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

'use strict';

// Import shared components and utilities
console.log('[FULL_PAGE_WIDGET] Initializing...');

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

      // Hide page body loading content (if it exists)
      this.hidePageLoadingContent();

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

      console.log('[BUNDLE_WIDGET] ✅ Hid page loading content');
    } catch (error) {
      console.warn('[BUNDLE_WIDGET] Failed to hide page loading content:', error);
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
      showTitle: dataset.showTitle === 'true', // Default to false to avoid duplicate with main header
      showDescription: dataset.showDescription !== 'false',
      showStepNumbers: dataset.showStepNumbers !== 'false',
      showFooterMessaging: dataset.showFooterMessaging !== 'false',
      // Custom content from theme editor
      customTitle: dataset.customTitle || null,
      customDescription: dataset.customDescription || null,
      customInstruction: dataset.customInstruction || null,
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

    // Check if this is a full-page bundle (needs to fetch from API)
    const bundleType = this.container.dataset.bundleType;
    const bundleId = this.container.dataset.bundleId;

    if (bundleType === 'full_page' && bundleId) {
      console.log('[WIDGET_INIT] 📄 Full-page bundle detected, fetching from API:', bundleId);

      try {
        // Use Shopify app proxy path - Shopify automatically adds signature and auth params
        // App proxy config: /apps/product-bundles -> https://wolfpack-product-bundle-app.onrender.com
        const apiUrl = `/apps/product-bundles/api/bundle/${bundleId}.json`;

        console.log('[WIDGET_INIT] Fetching bundle from:', apiUrl);

        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('[WIDGET_INIT] API response:', data);

        if (data.success && data.bundle) {
          bundleData = { [data.bundle.id]: data.bundle };
          console.log('[WIDGET_INIT] ✅ Loaded full-page bundle from API:', data.bundle.id);
        } else {
          throw new Error('Invalid API response structure');
        }
      } catch (error) {
        console.error('[WIDGET_INIT] ❌ Failed to fetch full-page bundle from API:', error);
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
    }

    this.bundleData = bundleData;
    console.log('[WIDGET_INIT] ✅ Bundle data loaded successfully');
  }

  selectBundle() {
    this.selectedBundle = BundleDataManager.selectBundle(this.bundleData, this.config);

    // Update message templates from bundle pricing messages
    this.updateMessagesFromBundle();
  }

  updateMessagesFromBundle() {
    // Use bundle pricing messages if available, otherwise keep defaults
    if (this.selectedBundle?.pricing?.messages) {
      const messages = this.selectedBundle.pricing.messages;

      if (messages.progress) {
        this.config.discountTextTemplate = messages.progress;
      }

      if (messages.qualified) {
        this.config.successMessageTemplate = messages.qualified;
      }

      console.log('[BUNDLE_MESSAGES] Using bundle pricing messages:', {
        progress: this.config.discountTextTemplate,
        qualified: this.config.successMessageTemplate
      });
    } else {
      console.log('[BUNDLE_MESSAGES] No pricing messages in bundle, using defaults');
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
    console.log('[FULL_PAGE_LAYOUT] Rendering full-page bundle layout');

    // Clear existing content
    this.elements.stepsContainer.innerHTML = '';
    this.elements.stepsContainer.classList.add('full-page-layout');

    // Load products for current step (needed for price calculation)
    await this.loadStepProducts(this.currentStepIndex);

    // 1. Render step timeline at top
    const stepTimeline = this.createStepTimeline();
    this.elements.stepsContainer.appendChild(stepTimeline);

    // 2. Render bundle header (instruction text)
    const bundleHeader = this.createBundleInstructions();
    this.elements.stepsContainer.appendChild(bundleHeader);

    // 3. Render category/collection tabs if step has collections
    const categoryTabs = this.createCategoryTabs(this.currentStepIndex);
    if (categoryTabs) {
      this.elements.stepsContainer.appendChild(categoryTabs);
    }

    // 4. Render product grid for current step
    const productGrid = this.createFullPageProductGrid(this.currentStepIndex);
    this.elements.stepsContainer.appendChild(productGrid);

    // 5. Render fixed footer with selected products
    this.renderFullPageFooter();
  }

  // Create horizontal step timeline with state-based icons
  createStepTimeline() {
    const timeline = document.createElement('div');
    timeline.className = 'step-timeline';

    if (!this.selectedBundle || !this.selectedBundle.steps) {
      console.error('[WIDGET_RENDER] Cannot create timeline: selectedBundle or steps is undefined');
      return timeline;
    }

    this.selectedBundle.steps.forEach((step, index) => {
      const stepItem = document.createElement('div');
      stepItem.className = 'timeline-step';

      // Determine step state
      const isCompleted = this.isStepCompleted(index);
      const isCurrent = index === this.currentStepIndex;
      const isAccessible = this.isStepAccessible(index);

      if (isCompleted) stepItem.classList.add('completed');
      if (isCurrent) stepItem.classList.add('current');
      if (!isAccessible) stepItem.classList.add('locked');

      // Create step circle with icon
      const circle = document.createElement('div');
      circle.className = 'timeline-circle';

      if (isCompleted) {
        circle.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M13 4L6 11L3 8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
      } else if (isCurrent) {
        circle.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="3" y="3" width="10" height="10" stroke="currentColor" stroke-width="1.5" fill="none"/>
          <rect x="5" y="5" width="6" height="6" stroke="currentColor" stroke-width="1.5" fill="none"/>
        </svg>`;
      } else if (!isAccessible) {
        circle.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M12 7H11V5C11 3.34 9.66 2 8 2C6.34 2 5 3.34 5 5V7H4C3.45 7 3 7.45 3 8V13C3 13.55 3.45 14 4 14H12C12.55 14 13 13.55 13 13V8C13 7.45 12.55 7 12 7ZM8 11C7.45 11 7 10.55 7 10C7 9.45 7.45 9 8 9C8.55 9 9 9.45 9 10C9 10.55 8.55 11 8 11ZM9.1 7H6.9V5C6.9 4.39 7.39 3.9 8 3.9C8.61 3.9 9.1 4.39 9.1 5V7Z" fill="currentColor"/>
        </svg>`;
      } else {
        circle.textContent = (index + 1).toString();
      }

      stepItem.appendChild(circle);

      // Add connecting line (except for last step)
      if (index < this.selectedBundle.steps.length - 1) {
        const line = document.createElement('div');
        line.className = 'timeline-line';
        if (isCompleted) line.classList.add('completed');
        stepItem.appendChild(line);
      }

      // Add step label (use clean "Step 1" instead of full name to avoid wrapping)
      const stepName = document.createElement('div');
      stepName.className = 'timeline-step-name';
      stepName.textContent = `Step ${index + 1}`;
      stepItem.appendChild(stepName);

      // Make clickable if accessible
      if (isAccessible) {
        stepItem.style.cursor = 'pointer';
        stepItem.addEventListener('click', () => {
          this.currentStepIndex = index;
          this.renderFullPageLayout();
        });
      }

      timeline.appendChild(stepItem);
    });

    return timeline;
  }

  // Create bundle instructions header
  createBundleInstructions() {
    const header = document.createElement('div');
    header.className = 'bundle-header';

    if (!this.selectedBundle || !this.selectedBundle.steps || !this.selectedBundle.steps[this.currentStepIndex]) {
      console.error('[WIDGET_RENDER] Cannot create instructions: selectedBundle or current step is undefined');
      return header;
    }

    const currentStep = this.selectedBundle.steps[this.currentStepIndex];

    // Use custom instruction if provided, otherwise use step instruction or auto-generated text
    const defaultInstruction = currentStep.instruction || `Select ${currentStep.minQuantity} or more items from ${currentStep.name}`;
    const instructionText = this.config.customInstruction || defaultInstruction;

    // Use custom title if provided, otherwise use bundle name
    const title = this.config.customTitle || this.selectedBundle.name;

    // Only show bundle title if showTitle is enabled
    const bundleTitleHTML = this.config.showTitle
      ? `<h3 class="bundle-title">${title}</h3>`
      : '';

    header.innerHTML = `
      ${bundleTitleHTML}
      <p class="bundle-instruction">${instructionText}</p>
    `;

    return header;
  }

  // Create category/collection tabs
  createCategoryTabs(stepIndex) {
    if (!this.selectedBundle || !this.selectedBundle.steps || !this.selectedBundle.steps[stepIndex]) {
      console.error('[WIDGET_RENDER] Cannot create category tabs: step is undefined');
      return null;
    }

    const step = this.selectedBundle.steps[stepIndex];

    if (!step.collections || step.collections.length === 0) {
      return null;
    }

    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'category-tabs';

    // Add "All" tab
    const allTab = document.createElement('div');
    allTab.className = 'category-tab';
    if (!this.activeCollectionId) {
      allTab.classList.add('active');
    }
    allTab.innerHTML = `
      <div class="tab-indicator"></div>
      <span class="tab-label">All</span>
    `;
    allTab.addEventListener('click', () => {
      this.activeCollectionId = null;
      this.renderFullPageLayout();
    });
    tabsContainer.appendChild(allTab);

    // Add collection tabs
    step.collections.forEach(collection => {
      const tab = document.createElement('div');
      tab.className = 'category-tab';
      if (this.activeCollectionId === collection.id) {
        tab.classList.add('active');
      }
      tab.innerHTML = `
        <div class="tab-indicator"></div>
        <span class="tab-label">${collection.title}</span>
      `;
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
      console.error('[WIDGET_RENDER] Cannot create product grid: step is undefined');
      return grid;
    }

    const step = this.selectedBundle.steps[stepIndex];
    let products = step.products || [];

    // Filter by active collection if selected
    if (this.activeCollectionId && step.collections) {
      const activeCollection = step.collections.find(c => c.id === this.activeCollectionId);
      if (activeCollection && activeCollection.products) {
        products = activeCollection.products;
      }
    }

    if (products.length === 0) {
      grid.innerHTML = '<p class="no-products">No products available in this step.</p>';
      return grid;
    }

    // Create product cards using ComponentGenerator
    products.forEach(product => {
      const productCard = this.createProductCard(product, stepIndex);
      grid.appendChild(productCard);
    });

    return grid;
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
      console.log('[PRODUCT_CARD] Set fallback image for', product.title, ':', product.imageUrl);
    }

    // Get currency info for formatting
    const currencyInfo = {
      display: {
        currency: window.shopCurrency || 'USD',
        format: window.shopMoneyFormat || '${{amount}}'
      }
    };

    // Use ComponentGenerator to render HTML
    const htmlString = window.BUNDLE_WIDGET.ComponentGenerator.renderProductCard(
      product,
      currentQuantity,
      currencyInfo
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

    // Quantity controls
    const increaseBtn = cardElement.querySelector('.qty-increase');
    const decreaseBtn = cardElement.querySelector('.qty-decrease');
    const addBtn = cardElement.querySelector('.product-add-btn');

    if (increaseBtn) {
      increaseBtn.addEventListener('click', () => {
        const currentQty = this.selectedProducts[stepIndex]?.[productId] || 0;
        this.updateProductSelection(stepIndex, productId, currentQty + 1);
      });
    }

    if (decreaseBtn) {
      decreaseBtn.addEventListener('click', () => {
        const currentQty = this.selectedProducts[stepIndex]?.[productId] || 0;
        if (currentQty > 0) {
          this.updateProductSelection(stepIndex, productId, currentQty - 1);
        }
      });
    }

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const currentQty = this.selectedProducts[stepIndex]?.[productId] || 0;
        if (currentQty === 0) {
          this.updateProductSelection(stepIndex, productId, 1);
        }
      });
    }

    // Variant selector
    const variantSelector = cardElement.querySelector('.variant-selector');
    if (variantSelector) {
      variantSelector.addEventListener('change', (e) => {
        const newVariantId = e.target.value;
        // Update product object with new variant
        product.variantId = newVariantId;
        // Re-render this card
        const currentQty = this.selectedProducts[stepIndex]?.[productId] || 0;
        this.updateProductSelection(stepIndex, newVariantId, currentQty);
      });
    }
  }

  // Render fixed footer with selected products and navigation
  renderFullPageFooter() {
    if (!this.elements.footer) {
      console.error('[FOOTER] Footer element not found');
      return;
    }

    this.elements.footer.innerHTML = '';
    this.elements.footer.className = 'full-page-footer';

    // Left section: Scrollable selected products
    const leftSection = document.createElement('div');
    leftSection.className = 'footer-left';

    const selectedProductsContainer = document.createElement('div');
    selectedProductsContainer.className = 'footer-selected-products';

    const allSelectedProducts = this.getAllSelectedProductsData();

    if (allSelectedProducts.length === 0) {
      selectedProductsContainer.innerHTML = '<p class="no-selections">No products selected yet</p>';
    } else {
      allSelectedProducts.forEach(item => {
        const productItem = document.createElement('div');
        productItem.className = 'footer-product-item';
        productItem.innerHTML = `
          <img src="${item.image}" alt="${item.title}" class="footer-product-image">
          <div class="footer-product-info">
            <span class="footer-product-title">${item.title}</span>
            <span class="footer-product-quantity">Qty: ${item.quantity}</span>
          </div>
          <button class="footer-product-remove" data-step="${item.stepIndex}" data-variant="${item.variantId}">×</button>
        `;

        const removeBtn = productItem.querySelector('.footer-product-remove');
        removeBtn.addEventListener('click', () => {
          this.updateProductSelection(item.stepIndex, item.variantId, 0);
          this.renderFullPageLayout();
        });

        selectedProductsContainer.appendChild(productItem);
      });
    }

    leftSection.appendChild(selectedProductsContainer);

    // Right section: Total and navigation
    const rightSection = document.createElement('div');
    rightSection.className = 'footer-right';

    const { totalPrice, totalQuantity } = PricingCalculator.calculateBundleTotal(
      this.selectedProducts,
      this.stepProductData
    );

    console.log('[FOOTER_DEBUG] Price calculation:', {
      selectedProducts: this.selectedProducts,
      stepProductData: this.stepProductData,
      totalPrice,
      totalQuantity
    });

    const discountInfo = PricingCalculator.calculateDiscount(
      this.selectedBundle,
      totalPrice,
      totalQuantity
    );

    const currencyInfo = CurrencyManager.getCurrencyInfo();
    const finalPrice = discountInfo.hasDiscount ? discountInfo.discountedPrice : totalPrice;

    // Create discount messaging section if discount is enabled
    let discountMessageHTML = '';
    if (this.selectedBundle?.pricing?.enabled && discountInfo.hasDiscount) {
      const variables = TemplateManager.createDiscountVariables(
        this.selectedBundle,
        totalPrice,
        totalQuantity,
        discountInfo,
        currencyInfo
      );

      const successMessage = TemplateManager.replaceVariables(
        this.config.successMessageTemplate || 'You saved {{discountAmount}}!',
        variables
      );

      discountMessageHTML = `
        <div class="footer-discount-message" style="
          color: var(--bundle-full-page-discount-text-color, #059669);
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
          text-align: right;
        ">
          ${successMessage}
        </div>
      `;
    }

    const totalDisplay = document.createElement('div');
    totalDisplay.className = 'footer-total';
    totalDisplay.innerHTML = `
      ${discountMessageHTML}
      ${discountInfo.hasDiscount ? `<span class="total-label-strike" style="text-decoration: line-through; color: #999; font-size: 14px; display: block;">${CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format)}</span>` : ''}
      <span class="total-label">Total:</span>
      <span class="total-price">${CurrencyManager.formatMoney(finalPrice, currencyInfo.display.format)}</span>
    `;

    const navButtons = document.createElement('div');
    navButtons.className = 'footer-nav-buttons';

    // Back button
    const backBtn = document.createElement('button');
    backBtn.className = 'footer-nav-btn footer-back-btn';
    backBtn.textContent = 'Back';
    backBtn.disabled = this.currentStepIndex === 0;
    backBtn.addEventListener('click', () => {
      if (this.currentStepIndex > 0) {
        this.currentStepIndex--;
        this.renderFullPageLayout();
      }
    });

    // Next/Add to Cart button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'footer-nav-btn footer-next-btn';

    const isLastStep = this.currentStepIndex === this.selectedBundle.steps.length - 1;
    const canProceed = this.canProceedToNextStep();

    if (isLastStep) {
      nextBtn.textContent = 'Add to Cart';
      nextBtn.disabled = !this.areBundleConditionsMet();
      nextBtn.addEventListener('click', () => this.addBundleToCart());
    } else {
      nextBtn.textContent = 'Next';
      nextBtn.disabled = !canProceed;
      nextBtn.addEventListener('click', () => {
        if (canProceed) {
          this.currentStepIndex++;
          this.renderFullPageLayout();
        }
      });
    }

    navButtons.appendChild(backBtn);
    navButtons.appendChild(nextBtn);

    rightSection.appendChild(totalDisplay);
    rightSection.appendChild(navButtons);

    this.elements.footer.appendChild(leftSection);
    this.elements.footer.appendChild(rightSection);
  }

  // Helper: Get all selected products data for footer display
  getAllSelectedProductsData() {
    const allProducts = [];

    this.selectedBundle.steps.forEach((step, stepIndex) => {
      const stepSelections = this.selectedProducts[stepIndex] || {};

      Object.entries(stepSelections).forEach(([variantId, quantity]) => {
        if (quantity > 0) {
          const product = this.findProductByVariantId(step, variantId);
          if (product) {
            const variant = product.variants?.find(v => v.id === variantId);
            allProducts.push({
              stepIndex,
              variantId,
              quantity,
              title: variant?.title || product.title,
              image: product.images?.[0]?.url || product.featuredImage?.url || '',
              price: variant?.price || product.price
            });
          }
        }
      });
    });

    return allProducts;
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

    console.log('[PROGRESS] Progress:', progressPercentage + '%', 'Total:', totalPrice, 'Target:', ruleToUse?.condition?.value);

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
      // Check if StepProduct already has enriched data (for full-page bundles)
      const hasEnrichedData = step.StepProduct.some(sp => sp.title && sp.imageUrl && sp.price);

      if (hasEnrichedData) {
        console.log('[LOAD_PRODUCTS] Using enriched StepProduct data directly (full-page bundle)');

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
        console.log('[LOAD_PRODUCTS] Added', enrichedProducts.length, 'enriched StepProducts');
      } else {
        // Fetch from storefront API if data is not enriched
        const productGids = step.StepProduct.map(sp => sp.productId).filter(Boolean);
        const shop = window.Shopify?.shop || window.location.host;

        if (productGids.length > 0) {
          console.log('[LOAD_PRODUCTS] Fetching StepProduct data. IDs:', productGids);

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
              compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice) * 100 : null,
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
          compareAtPrice: defaultVariant?.compareAtPrice ? parseFloat(defaultVariant.compareAtPrice) * 100 : null,
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

            <button class="product-add-btn ${currentQuantity > 0 ? 'added' : ''}" data-product-id="${selectionKey}">
              ${currentQuantity > 0 ? 'Added to Bundle' : 'Add to Bundle'}
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

    // Quantity button handlers
    newProductGrid.addEventListener('click', (e) => {
      if (e.target.classList.contains('qty-btn')) {
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
        const productId = e.target.dataset.productId;
        const currentQuantity = this.selectedProducts[stepIndex][productId] || 0;
        // Toggle between 0 and 1
        this.updateProductSelection(stepIndex, productId, currentQuantity > 0 ? 0 : 1);
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
    if (productCard) {
      const quantityDisplay = productCard.querySelector('.qty-display');
      const addBtn = productCard.querySelector('.product-add-btn');
      const selectedOverlay = productCard.querySelector('.selected-overlay');

      if (quantityDisplay) {
        quantityDisplay.textContent = quantity;
      }

      if (addBtn) {
        if (quantity > 0) {
          addBtn.textContent = 'Added to Bundle';
          addBtn.classList.add('added');
        } else {
          addBtn.textContent = 'Add to Bundle';
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

    if (discountInfo.qualifiesForDiscount && discountInfo.discountedPrice < totalPrice) {
      // Show strike-through original price and discounted price
      strikePriceEl.textContent = CurrencyManager.formatMoney(totalPrice, currencyInfo.display.format);
      strikePriceEl.style.display = 'inline';
      finalPriceEl.textContent = CurrencyManager.formatMoney(discountInfo.discountedPrice, currencyInfo.display.format);
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

console.log('[FULL_PAGE_WIDGET] Module loaded');


})();
