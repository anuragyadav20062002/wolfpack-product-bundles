// Currency conversion utilities for bundle discounts

// Simple currency conversion rates (in production, these should come from an API)
const CURRENCY_RATES: Record<string, number> = {
  'USD': 1.0,      // Base currency  
  'INR': 83.0,     // 1 USD = 83 INR (approximate)
  'EUR': 0.85,     // 1 USD = 0.85 EUR (approximate)
  'GBP': 0.75,     // 1 USD = 0.75 GBP (approximate)
  'CAD': 1.25,     // 1 USD = 1.25 CAD (approximate)
};

// Currency symbols mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD': '$',
  'INR': '₹',
  'EUR': '€',
  'GBP': '£',
  'CAD': 'C$',
};

/**
 * Convert USD discount amount to target currency
 */
export function convertDiscountAmount(
  usdAmount: number,
  targetCurrency: string
): number {
  const rate = CURRENCY_RATES[targetCurrency] || 1.0;
  const convertedAmount = usdAmount * rate;
  
  // Round to appropriate decimal places for currency
  if (targetCurrency === 'INR') {
    return Math.round(convertedAmount); // INR typically doesn't use decimals
  }
  
  return Math.round(convertedAmount * 100) / 100; // 2 decimal places for others
}

/**
 * Get currency symbol for display
 */
export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
}

/**
 * Format discount message with proper currency
 */
export function formatDiscountMessage(
  bundleName: string,
  discountType: 'fixed' | 'percentage',
  amount: number,
  currencyCode: string
): string {
  if (discountType === 'percentage') {
    return `${bundleName}: ${amount}% OFF`;
  }
  
  const symbol = getCurrencySymbol(currencyCode);
  return `${bundleName}: ${symbol}${amount} OFF`;
}

/**
 * Debug logging for currency conversions
 */
