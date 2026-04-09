/**
 * Component Pricing Utilities
 *
 * Calculates per-component pricing for expanded bundle checkout display
 */

import type { ComponentPricing } from "../types";
import { AppLogger } from "../../../../lib/logger";

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
  AppLogger.debug("[COMPONENT_PRICING] Calculating component pricing", {
    component: "metafield-sync/utils/pricing",
  }, { componentCount: components.length, discountMethod, discountValue });

  // Calculate total retail price in cents (sum of all components)
  const totalRetailCents = components.reduce(
    (sum, c) => sum + (c.priceCents * c.quantity), 0
  );

  AppLogger.debug("[COMPONENT_PRICING] Total retail", {
    component: "metafield-sync/utils/pricing",
  }, { totalRetailCents });

  // Guard against division by zero when all component prices are $0
  if (totalRetailCents === 0) {
    AppLogger.debug("[COMPONENT_PRICING] Total retail is 0, returning components with no discount", {
      component: "metafield-sync/utils/pricing",
    });
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

    AppLogger.debug("[COMPONENT_PRICING] Component pricing calculated", {
      component: "metafield-sync/utils/pricing",
    }, { variantId: component.variantId, retailPriceCents, bundlePriceCents, savingsCents, componentDiscountPercent });

    return pricing;
  });
}
