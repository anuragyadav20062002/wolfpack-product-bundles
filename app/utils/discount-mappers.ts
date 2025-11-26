/**
 * Discount Type Mapping Utilities
 *
 * Functions to map between frontend discount types and schema enum values
 */

import { DiscountMethod } from "../types/pricing";

/**
 * Map frontend discount method values to schema enum values
 */
export function mapDiscountMethod(discountType: DiscountMethod | string): string {
  // If it's already a DiscountMethod enum value, return its string value
  if (Object.values(DiscountMethod).includes(discountType as DiscountMethod)) {
    return discountType;
  }

  // Map string values
  switch (discountType) {
    case DiscountMethod.FIXED_BUNDLE_PRICE:
    case 'fixed_bundle_price':
      return 'fixed_bundle_price';
    case DiscountMethod.FIXED_AMOUNT_OFF:
    case 'fixed_amount_off':
      return 'fixed_amount_off';
    case DiscountMethod.PERCENTAGE_OFF:
    case 'percentage_off':
      return 'percentage_off';
    default:
      return 'percentage_off'; // Default to percentage_off
  }
}
