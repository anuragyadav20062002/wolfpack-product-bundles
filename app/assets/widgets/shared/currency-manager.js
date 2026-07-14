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
    // Shop's base currency from Shopify object (official source)
    return {
      code: shopify?.shop?.currency || 'USD',
      format: this.getShopMoneyFormat(),
    };
  }

  static detectCustomerCurrency() {
    const shopify = this.getShopify();

    // Primary: Shopify Markets active currency (official method)
    // Shopify Markets handles geolocation and user preferences automatically
    if (shopify?.currency?.active) {
      return {
        code: shopify.currency.active,
        format: shopify.currency.format || this.getShopMoneyFormat(),
        rate: shopify.currency.rate || 1,
      };
    }

    // Fallback: Shop base currency (include rate: 1 so downstream math doesn't produce NaN)
    return { ...this.getShopBaseCurrency(), rate: 1 };
  }

  static convertCurrency(amount, fromCurrency, toCurrency, rate = 1) {
    if (fromCurrency === toCurrency) return amount;
    const shopify = this.getShopify();

    // Use Shopify's conversion if available
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
