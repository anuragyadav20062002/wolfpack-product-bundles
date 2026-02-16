/**
 * Component Pricing Utilities
 *
 * Calculates per-component pricing for expanded bundle checkout display
 */

import type { ComponentPricing } from "../types";

/**
 * Calculate per-component pricing for expanded bundle checkout display
 *
 * Uses proportional discount allocation where each component's discount
 * is based on its share of the total retail price.
 *
 * @param components - Array of component variants with price and quantity
 * @param discountMethod - The discount method ('percentage_off', 'fixed_amount', etc.)
 * @param discountValue - The discount value (percentage or fixed amount in cents)
 * @returns Array of ComponentPricing objects with all values in cents
 */
export function calculateComponentPricing(
  components: Array<{ variantId: string; priceCents: number; quantity: number; title?: string }>,
  discountMethod: string,
  discountValue: number
): ComponentPricing[] {
  console.log("💰 [COMPONENT_PRICING] Calculating component pricing");
  console.log("   - Components:", components.length);
  console.log("   - Discount method:", discountMethod);
  console.log("   - Discount value:", discountValue);

  // Calculate total retail price in cents (sum of all components)
  const totalRetailCents = components.reduce(
    (sum, c) => sum + (c.priceCents * c.quantity), 0
  );

  console.log("   - Total retail (cents):", totalRetailCents);

  // Guard against division by zero when all component prices are $0
  if (totalRetailCents === 0) {
    console.log("   - Total retail is 0, returning components with no discount");
    return components.map(component => ({
      variantId: component.variantId,
      ...(component.title && { title: component.title }),
      retailPrice: component.priceCents,
      bundlePrice: component.priceCents,
      discountPercent: 0,
      savingsAmount: 0
    }));
  }

  return components.map(component => {
    const retailPriceCents = component.priceCents;
    let bundlePriceCents: number;
    let componentDiscountPercent: number;

    if (discountMethod === 'percentage_off' || discountMethod === 'percentage') {
      // Direct percentage discount - apply same percentage to each component
      componentDiscountPercent = discountValue;
      bundlePriceCents = Math.round(retailPriceCents * (1 - discountValue / 100));
    } else if (discountMethod === 'fixed_amount_off' || discountMethod === 'fixed_amount' || discountMethod === 'fixed') {
      // Fixed amount discount - distribute proportionally based on price weight
      // Each component gets a discount proportional to its share of total retail
      const priceWeight = retailPriceCents / totalRetailCents;
      const componentDiscountCents = Math.round(discountValue * priceWeight);
      bundlePriceCents = Math.max(0, retailPriceCents - componentDiscountCents);
      componentDiscountPercent = retailPriceCents > 0
        ? Math.round((componentDiscountCents / retailPriceCents) * 10000) / 100
        : 0;
    } else if (discountMethod === 'fixed_bundle_price') {
      // Fixed bundle price: target total in cents, distribute proportionally
      if (discountValue < totalRetailCents) {
        const overallDiscountPercent = ((totalRetailCents - discountValue) / totalRetailCents) * 100;
        componentDiscountPercent = overallDiscountPercent;
        bundlePriceCents = Math.round(retailPriceCents * (1 - overallDiscountPercent / 100));
      } else {
        // Target price >= retail total, no discount
        bundlePriceCents = retailPriceCents;
        componentDiscountPercent = 0;
      }
    } else {
      // No discount or unknown method
      bundlePriceCents = retailPriceCents;
      componentDiscountPercent = 0;
    }

    const savingsCents = retailPriceCents - bundlePriceCents;

    const pricing: ComponentPricing = {
      variantId: component.variantId,
      ...(component.title && { title: component.title }),
      retailPrice: retailPriceCents,
      bundlePrice: bundlePriceCents,
      discountPercent: Math.round(componentDiscountPercent * 100) / 100, // Round to 2 decimals
      savingsAmount: savingsCents
    };

    console.log(`   - Component ${component.variantId}: retail=${retailPriceCents}, bundle=${bundlePriceCents}, savings=${savingsCents} (${componentDiscountPercent}%)`);

    return pricing;
  });
}
