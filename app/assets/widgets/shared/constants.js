/**
 * Bundle Widget - Global Constants and Configuration
 *
 * Central configuration used across all bundle widget modules.
 *
 * @version 4.0.0
 */

'use strict';

const INLINE_PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22 viewBox=%220 0 400 400%22%3E%3Crect width=%22400%22 height=%22400%22 fill=%22%23f3f4f6%22/%3E%3C/svg%3E';

export const BUNDLE_WIDGET = {
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

  // Self-contained so storefront widgets never resolve an app-owned asset
  // against the merchant's theme origin.
  PLACEHOLDER_IMAGE: INLINE_PLACEHOLDER_IMAGE,
  PLACEHOLDER_IMAGE_FALLBACK: INLINE_PLACEHOLDER_IMAGE
};
