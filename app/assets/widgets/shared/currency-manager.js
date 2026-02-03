/**
 * Bundle Widget - Currency Management System
 *
 * Handles multi-currency detection, conversion, and formatting.
 * Integrates with Shopify Markets for automatic currency handling.
 *
 * @version 4.0.0
 */

'use strict';

export class CurrencyManager {
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
