// Shopify Standard Bundle Cart Transform (Approach 1: Hybrid)
// Implements MERGE and EXPAND operations using standard metafields
// See: https://shopify.dev/docs/apps/build/product-merchandising/bundles/create-bundle-app

import { CartTransformLogger as Logger } from './cart-transform-logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CartTransformInput {
  cart: {
    lines: Array<{
      id: string;
      quantity: number;
      bundleId?: {
        value: string;
      };
      bundleName?: {
        value: string;
      };
      merchandise: {
        __typename: string;
        id: string;
        // Shopify Standard Metafields
        component_reference?: {
          value: string; // JSON array of variant GIDs
        };
        component_quantities?: {
          value: string; // JSON array of quantities
        };
        component_parents?: {
          value: string; // JSON array of parent bundle configs
        };
        price_adjustment?: {
          value: string; // JSON pricing config
        };
        component_pricing?: {
          value: string; // JSON array of ComponentPricingItem
        };
        product?: {
          id: string;
          title: string;
        };
      };
      cost: {
        amountPerQuantity: {
          amount: string;
        };
        totalAmount: {
          amount: string;
        };
      };
    }>;
  };
}

export interface CartTransformOperation {
  merge?: {
    cartLines: Array<{
      cartLineId: string;
      quantity: number;
    }>;
    parentVariantId: string;
    title?: string;
    price?: {
      percentageDecrease: {
        value: string;
      };
    };
    attributes?: Array<{
      key: string;
      value: string;
    }>;
  };
  expand?: {
    cartLineId: string;
    expandedCartItems: Array<{
      merchandiseId: string;
      quantity: number;
      // Price per unit for this component (decimal string, e.g., "88.20")
      price?: {
        adjustment: {
          fixedPricePerUnit: {
            amount: string;
          };
        };
      };
      // Attributes to add to the expanded item for checkout display
      attributes?: Array<{
        key: string;
        value: string;
      }>;
    }>;
    price?: {
      percentageDecrease: {
        value: string;
      };
    };
  };
}

export interface CartTransformResult {
  operations: CartTransformOperation[];
}

interface PriceAdjustmentConfig {
  method: 'percentage_off' | 'fixed_amount_off' | 'fixed_bundle_price';
  value: number;
  conditions?: {
    type: 'quantity' | 'amount';
    operator: 'gte' | 'lte' | 'eq' | 'gt' | 'lt';
    value: number;
  };
}

interface ComponentParent {
  id: string; // Parent variant GID
  component_reference: {
    value: string[];
  };
  component_quantities: {
    value: number[];
  };
  price_adjustment?: PriceAdjustmentConfig; // Pricing info for discount calculation
}

/**
 * Component pricing item from metafield (cents-based)
 * Used for expanded bundle checkout display
 */
interface ComponentPricingItem {
  variantId: string;        // "gid://shopify/ProductVariant/123"
  title?: string;           // Product title (optional for backwards compat)
  retailPrice: number;      // Price in cents (e.g., 9800 = $98.00)
  bundlePrice: number;      // Discounted price in cents
  discountPercent: number;  // Discount percentage (e.g., 10.00)
  savingsAmount: number;    // Savings in cents
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse a float string safely — returns 0 on NaN/Infinity/undefined.
 * Critical: one unguarded NaN cascades through every calculation.
 */
function safeParseFloat(value: string | undefined): number {
  if (!value) return 0;
  const num = parseFloat(value);
  return Number.isFinite(num) ? num : 0;
}

/**
 * Parse JSON safely with error handling
 */
function parseJSON<T>(value: string | undefined, defaultValue: T, context: string): T {
  if (!value) return defaultValue;

  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Calculate discount percentage from price adjustment config
 */
function calculateDiscountPercentage(
  priceAdjustment: PriceAdjustmentConfig,
  originalTotal: number,
  totalQuantity: number
): number {
  const { method, value, conditions } = priceAdjustment;

  // Check conditions if present
  if (conditions) {
    const actualValue = conditions.type === 'amount' ? originalTotal : totalQuantity;
    const conditionValue = conditions.type === 'amount' ? conditions.value / 100 : conditions.value;

    let meetsCondition = false;
    switch (conditions.operator) {
      case 'gte':
        meetsCondition = actualValue >= conditionValue;
        break;
      case 'gt':
        meetsCondition = actualValue > conditionValue;
        break;
      case 'lte':
        meetsCondition = actualValue <= conditionValue;
        break;
      case 'lt':
        meetsCondition = actualValue < conditionValue;
        break;
      case 'eq':
        meetsCondition = actualValue === conditionValue;
        break;
      default:
        meetsCondition = actualValue >= conditionValue;
    }

    if (!meetsCondition) {
      return 0;
    }
  }

  // Calculate discount based on method
  let result = 0;

  switch (method) {
    case 'percentage_off':
      result = value;
      break;

    case 'fixed_amount_off':
      // Value is in cents, convert to decimal
      const amountOff = value / 100;
      if (originalTotal > 0) {
        result = (amountOff / originalTotal) * 100;
      }
      break;

    case 'fixed_bundle_price':
      // Value is in cents, convert to decimal
      const fixedPrice = value / 100;
      if (originalTotal > 0 && fixedPrice < originalTotal) {
        result = ((originalTotal - fixedPrice) / originalTotal) * 100;
      }
      break;

    default:
      break;
  }

  // Clamp to valid 0-100 range. NaN must be caught explicitly —
  // Math.max(0, Math.min(100, NaN)) returns NaN, not 0.
  return Number.isFinite(result) ? Math.max(0, Math.min(100, result)) : 0;
}

/**
 * Get _bundle_id attribute from cart line
 */
function getBundleId(line: CartTransformInput['cart']['lines'][0]): string | null {
  return line.bundleId?.value || null;
}

/**
 * Get _bundle_name attribute from cart line
 */
function getBundleName(line: CartTransformInput['cart']['lines'][0]): string {
  return line.bundleName?.value || 'Bundle';
}

/**
 * Group all cart lines by their _bundle_id attribute in a single O(n) pass.
 * Returns a Map of bundleId → lines[], plus a list of lines with no bundle ID.
 */
function groupLinesByBundleId(
  allLines: CartTransformInput['cart']['lines']
): Map<string, CartTransformInput['cart']['lines']> {
  const groups = new Map<string, CartTransformInput['cart']['lines']>();

  for (const line of allLines) {
    const bundleId = getBundleId(line);
    if (!bundleId) continue;

    let group = groups.get(bundleId);
    if (!group) {
      group = [];
      groups.set(bundleId, group);
    }
    group.push(line);
  }

  return groups;
}

// ============================================================================
// MAIN CART TRANSFORM FUNCTION
// ============================================================================

export function cartTransformRun(input: CartTransformInput): CartTransformResult {
  try {
    Logger.info('Cart transform started', { phase: 'init' }, {
      cartLines: input?.cart?.lines?.length || 0
    });

    // Edge case: empty cart
    if (!input?.cart?.lines || input.cart.lines.length === 0) {
      return { operations: [] };
    }

    const operations: CartTransformOperation[] = [];
    const processedLines = new Set<string>();
    // Track how many times each bundle name is used for unique MERGE titles
    // Shopify consolidates MERGE results with the same parentVariantId + title,
    // so we must use unique titles to keep separate bundle instances apart.
    const bundleNameCounts = new Map<string, number>();

    // ========================================================================
    // OPERATION 1: MERGE - Combine component products into bundles
    // ========================================================================
    // Pre-group cart lines by _bundle_id in a single O(n) pass.
    // This avoids repeated full scans that caused InstructionCountLimitExceededError.

    const bundleGroups = groupLinesByBundleId(input.cart.lines);

    for (const [bundleId, bundleComponentLines] of bundleGroups) {
      // Find the first line in this group that has component_parents metafield.
      // Not every component variant has this metafield — only some do.
      let componentParentsValue: string | undefined;
      for (const l of bundleComponentLines) {
        const val = l.merchandise.component_parents?.value;
        if (val) {
          componentParentsValue = val;
          break;
        }
      }

      if (!componentParentsValue) {
        Logger.warn('No component_parents metafield in bundle group', { phase: 'merge', bundleId });
        continue;
      }

      const componentParents = parseJSON<ComponentParent[]>(
        componentParentsValue,
        [],
        'component_parents'
      );

      if (componentParents.length === 0) continue;

      // Get parent variant ID and pricing from first parent config
      const parent = componentParents[0];
      const parentVariantId = parent.id;

      if (!parentVariantId) continue;

      // Calculate bundle totals from ACTUAL selected component prices
      let totalQuantity = 0;
      let originalTotal = 0;
      for (const l of bundleComponentLines) {
        totalQuantity += l.quantity;
        originalTotal += safeParseFloat(l.cost.totalAmount.amount);
      }

      // Get price adjustment from component_parents
      let discountPercentage = 0;
      if (parent.price_adjustment) {
        discountPercentage = calculateDiscountPercentage(
          parent.price_adjustment,
          originalTotal,
          totalQuantity
        );
      }

      // Get bundle name and generate unique title to prevent Shopify consolidation
      const baseBundleName = getBundleName(bundleComponentLines[0]);
      const nameCount = (bundleNameCounts.get(baseBundleName) || 0) + 1;
      bundleNameCounts.set(baseBundleName, nameCount);
      // Append index only when there are multiple instances of the same bundle name
      const bundleName = nameCount > 1 ? `${baseBundleName} (${nameCount})` : baseBundleName;

      // Build component details for checkout UI display
      const originalTotalCents = Math.round(originalTotal * 100);
      const discountedTotalCents = Math.round(originalTotal * (1 - discountPercentage / 100) * 100);
      const savingsCents = originalTotalCents - discountedTotalCents;

      // Compact format: array of [title, qty, retailCents, bundleCents, discountPct, savingsCents]
      // This keeps the JSON well under Shopify's attribute value size limit (~255 chars)
      const componentDetails = bundleComponentLines.map((l, index) => {
        const retailCents = Math.round(safeParseFloat(l.cost.amountPerQuantity.amount) * 100);
        const bundleCents = Math.round(retailCents * (1 - discountPercentage / 100));
        const title = (l.merchandise.product?.title || `Component ${index + 1}`).slice(0, 25);
        return [title, l.quantity, retailCents, bundleCents, discountPercentage, retailCents - bundleCents];
      });

      Logger.info('Merge operation', { phase: 'merge', bundleId }, {
        parentVariantId,
        components: bundleComponentLines.length,
        discount: discountPercentage
      });

      // Create merge operation
      // IMPORTANT: Always include price field with percentageDecrease
      // When discount is 0, this ensures Shopify uses the sum of component prices
      // Without price field, Shopify would use the parent variant's price ($0 for container products)
      const mergeOp: CartTransformOperation = {
        merge: {
          cartLines: bundleComponentLines.map(l => ({
            cartLineId: l.id,
            quantity: l.quantity
          })),
          parentVariantId,
          title: bundleName,
          price: {
            percentageDecrease: {
              value: discountPercentage.toFixed(2)
            }
          },
          attributes: [
            { key: '_is_bundle_parent', value: 'true' },
            { key: '_bundle_name', value: bundleName },
            { key: '_bundle_component_count', value: String(componentDetails.length) },
            { key: '_bundle_components', value: JSON.stringify(componentDetails) },
            { key: '_bundle_total_retail_cents', value: String(originalTotalCents) },
            { key: '_bundle_total_price_cents', value: String(discountedTotalCents) },
            { key: '_bundle_total_savings_cents', value: String(savingsCents) },
            { key: '_bundle_discount_percent', value: discountPercentage.toFixed(2) }
          ]
        }
      };

      operations.push(mergeOp);

      // Mark all component lines as processed
      for (const l of bundleComponentLines) {
        processedLines.add(l.id);
      }
    }

    // ========================================================================
    // OPERATION 2: EXPAND - Split bundle parent into component products
    // ========================================================================
    // When a bundle parent product is in the cart, expand it into individual
    // component products with discount applied

    for (const line of input.cart.lines) {
      if (processedLines.has(line.id)) continue;

      const componentReferenceValue = line.merchandise.component_reference?.value;
      const componentQuantitiesValue = line.merchandise.component_quantities?.value;

      if (!componentReferenceValue || !componentQuantitiesValue) continue;

      const componentReferences = parseJSON<string[]>(
        componentReferenceValue,
        [],
        'component_reference'
      );
      const componentQuantities = parseJSON<number[]>(
        componentQuantitiesValue,
        [],
        'component_quantities'
      );

      if (componentReferences.length === 0 || componentQuantities.length === 0) continue;

      if (componentReferences.length !== componentQuantities.length) continue;

      // Parse component pricing metafield for expanded checkout display
      const componentPricingValue = line.merchandise.component_pricing?.value;
      const componentPricing = parseJSON<ComponentPricingItem[]>(
        componentPricingValue,
        [],
        'component_pricing'
      );

      // Create a map of variant ID to pricing for quick lookup
      const pricingMap = new Map<string, ComponentPricingItem>();
      componentPricing.forEach(item => {
        pricingMap.set(item.variantId, item);
      });

      // Calculate bundle totals for discount calculation
      const totalQuantity = componentQuantities.reduce((sum, qty) => sum + qty, 0) * line.quantity;
      const originalTotal = safeParseFloat(line.cost.totalAmount.amount);

      // Get price adjustment
      let discountPercentage = 0;
      const priceAdjustmentValue = line.merchandise.price_adjustment?.value;

      if (priceAdjustmentValue) {
        const priceAdjustment = parseJSON<PriceAdjustmentConfig>(
          priceAdjustmentValue,
          { method: 'percentage_off', value: 0 },
          'price_adjustment'
        );

        discountPercentage = calculateDiscountPercentage(
          priceAdjustment,
          originalTotal,
          totalQuantity
        );

      }

      // ================================================================
      // FLEX BUNDLES APPROACH: Keep bundle as SINGLE line item
      // Store component data in attributes for checkout UI to display
      // ================================================================

      const bundleName = getBundleName(line);

      // Calculate bundle totals from component pricing
      let totalRetailCents = 0;
      let totalBundleCents = 0;
      let totalSavingsCents = 0;

      // Build component details in compact format: [title, qty, retailCents, bundleCents, discountPct, savingsCents]
      // This keeps the JSON well under Shopify's attribute value size limit (~255 chars)
      const componentDetails: Array<[string, number, number, number, number, number]> = [];

      let hasMissingPricing = false;

      componentReferences.forEach((variantId, index) => {
        const pricing = pricingMap.get(variantId);
        const qty = componentQuantities[index] * line.quantity;

        if (pricing) {
          // Accumulate totals
          totalRetailCents += pricing.retailPrice * qty;
          totalBundleCents += pricing.bundlePrice * qty;
          totalSavingsCents += pricing.savingsAmount * qty;

          const title = (pricing.title || `Component ${index + 1}`).slice(0, 25);
          componentDetails.push([
            title, qty, pricing.retailPrice, pricing.bundlePrice,
            pricing.discountPercent, pricing.savingsAmount
          ]);
        } else {
          hasMissingPricing = true;
        }
      });

      // If ANY component is missing pricing, clear the entire breakdown.
      // The checkout UI will fall back to the simple "Bundle (N items)" view.
      // Showing partial/fabricated data is worse than showing nothing — 0% error tolerance.
      if (hasMissingPricing) {
        componentDetails.length = 0;
        totalRetailCents = 0;
        totalBundleCents = 0;
        totalSavingsCents = 0;
      }

      // Use discountPercentage from price_adjustment as the single source of truth.
      // This matches the actual percentageDecrease charged by Shopify, avoiding
      // divergence between displayed and charged discount from rounding differences.
      const overallDiscountPercent = discountPercentage;

      // Create expand operation that keeps bundle as SINGLE item
      // with all component data stored in attributes
      const expandOp: CartTransformOperation = {
        expand: {
          cartLineId: line.id,
          expandedCartItems: [{
            // Keep the same bundle variant (don't expand to components)
            merchandiseId: line.merchandise.id,
            quantity: line.quantity,
            // Attributes for checkout UI to display bundle breakdown
            attributes: [
              { key: '_is_bundle_parent', value: 'true' },
              { key: '_bundle_name', value: bundleName },
              { key: '_bundle_component_count', value: String(componentDetails.length) },
              { key: '_bundle_components', value: JSON.stringify(componentDetails) },
              { key: '_bundle_total_retail_cents', value: String(totalRetailCents) },
              { key: '_bundle_total_price_cents', value: String(totalBundleCents) },
              { key: '_bundle_total_savings_cents', value: String(totalSavingsCents) },
              { key: '_bundle_discount_percent', value: overallDiscountPercent.toFixed(2) }
            ]
          }],
          // Apply discount to the bundle price
          ...(discountPercentage > 0 && {
            price: {
              percentageDecrease: {
                value: discountPercentage.toFixed(2)
              }
            }
          })
        }
      };

      operations.push(expandOp);
      processedLines.add(line.id);
    }

    Logger.info('Cart transform completed', { phase: 'complete' }, {
      operations: operations.length
    });

    return { operations };

  } catch (error) {
    Logger.error('Cart transform failed', { phase: 'error' }, error);
    return { operations: [] };
  }
}

// Main export - matches Shopify Functions requirement
export function run(input: CartTransformInput): CartTransformResult {
  return cartTransformRun(input);
}
