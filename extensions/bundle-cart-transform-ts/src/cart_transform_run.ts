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
  retailPrice: number;      // Price in cents (e.g., 9800 = $98.00)
  bundlePrice: number;      // Discounted price in cents
  discountPercent: number;  // Discount percentage (e.g., 10.00)
  savingsAmount: number;    // Savings in cents
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse JSON safely with error handling
 */
function parseJSON<T>(value: string | undefined, defaultValue: T, context: string): T {
  if (!value) return defaultValue;

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    Logger.warn(`Failed to parse ${context}`, { phase: 'parsing' }, { error, value });
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
      Logger.debug('Condition not met', { phase: 'discount' }, {
        conditionType: conditions.type,
        conditionOperator: conditions.operator,
        conditionValue,
        actualValue,
        meetsCondition
      });
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
      Logger.warn('Unknown pricing method', { phase: 'discount' }, { method });
      break;
  }

  // Clamp to valid 0-100 range
  return Math.max(0, Math.min(100, result));
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
 * Find all cart lines that belong to a specific bundle instance by bundle ID
 */
function findBundleComponentLinesByBundleId(
  allLines: CartTransformInput['cart']['lines'],
  bundleId: string
): CartTransformInput['cart']['lines'] {
  const componentLines: CartTransformInput['cart']['lines'] = [];

  for (const line of allLines) {
    const lineBundleId = getBundleId(line);
    if (lineBundleId === bundleId) {
      componentLines.push(line);
    }
  }

  return componentLines;
}

// ============================================================================
// MAIN CART TRANSFORM FUNCTION
// ============================================================================

export function cartTransformRun(input: CartTransformInput): CartTransformResult {
  try {
    Logger.info('Cart transform started (Shopify Standard)', { phase: 'init' }, {
      cartLines: input?.cart?.lines?.length || 0
    });

    // Log cart line details for debugging
    if (input?.cart?.lines && input.cart.lines.length > 0) {
      Logger.debug('Cart lines details', { phase: 'init' }, {
        lines: input.cart.lines.map(line => ({
          id: line.id,
          quantity: line.quantity,
          bundleId: line.bundleId?.value || null,
          bundleName: line.bundleName?.value || null,
          variantId: line.merchandise.id,
          productTitle: line.merchandise.product?.title || 'Unknown',
          hasComponentParents: !!line.merchandise.component_parents,
          hasComponentReference: !!line.merchandise.component_reference
        }))
      });
    }

    // Edge case: empty cart
    if (!input?.cart?.lines || input.cart.lines.length === 0) {
      Logger.info('Empty cart', { phase: 'init' });
      return { operations: [] };
    }

    const operations: CartTransformOperation[] = [];
    const processedLines = new Set<string>();
    const processedBundleIds = new Set<string>();
    // Track how many times each bundle name is used for unique MERGE titles
    // Shopify consolidates MERGE results with the same parentVariantId + title,
    // so we must use unique titles to keep separate bundle instances apart.
    const bundleNameCounts = new Map<string, number>();

    // ========================================================================
    // OPERATION 1: MERGE - Combine component products into bundles
    // ========================================================================
    // Group cart lines by _bundle_id attribute and merge them into bundle parent

    for (const line of input.cart.lines) {
      if (processedLines.has(line.id)) continue;

      // Get bundle ID from cart line attributes
      const bundleId = getBundleId(line);
      if (!bundleId) continue;

      // Skip if we've already processed this bundle instance
      if (processedBundleIds.has(bundleId)) continue;

      // Find all cart lines belonging to this bundle instance
      const bundleComponentLines = findBundleComponentLinesByBundleId(
        input.cart.lines,
        bundleId
      );

      if (bundleComponentLines.length === 0) continue;

      Logger.debug('Found bundle components by bundle ID', { phase: 'merge' }, {
        bundleId,
        componentCount: bundleComponentLines.length
      });

      // Get component_parents from first line to get parent variant and pricing
      const componentParentsValue = line.merchandise.component_parents?.value;

      Logger.debug('Checking component_parents metafield', { phase: 'merge' }, {
        bundleId,
        lineId: line.id,
        variantId: line.merchandise.id,
        hasMetafield: !!componentParentsValue,
        metafieldType: typeof componentParentsValue,
        metafieldPreview: componentParentsValue ? componentParentsValue.substring(0, 200) : 'null'
      });

      if (!componentParentsValue) {
        Logger.error(
          'Missing component_parents metafield - cart transform MERGE will fail',
          { phase: 'merge' },
          {
            bundleId,
            lineId: line.id,
            variantId: line.merchandise.id,
            productTitle: line.merchandise.product?.title,
            error: 'MISSING_COMPONENT_PARENTS_METAFIELD',
            resolution: 'Ensure component products have component_parents metafield set when bundle is saved'
          }
        );
        continue;
      }

      const componentParents = parseJSON<ComponentParent[]>(
        componentParentsValue,
        [],
        'component_parents'
      );

      Logger.debug('Parsed component_parents', { phase: 'merge' }, {
        bundleId,
        parentsCount: componentParents.length,
        firstParent: componentParents[0] ? {
          id: componentParents[0].id,
          hasComponentReference: !!componentParents[0].component_reference,
          hasComponentQuantities: !!componentParents[0].component_quantities,
          hasPriceAdjustment: !!componentParents[0].price_adjustment,
          priceAdjustment: componentParents[0].price_adjustment
        } : null
      });

      if (componentParents.length === 0) {
        Logger.error(
          'Empty component_parents array - cart transform MERGE will fail',
          { phase: 'merge' },
          {
            bundleId,
            lineId: line.id,
            variantId: line.merchandise.id,
            productTitle: line.merchandise.product?.title,
            error: 'EMPTY_COMPONENT_PARENTS_ARRAY',
            resolution: 'Ensure component_parents metafield contains valid parent bundle data'
          }
        );
        continue;
      }

      // Get parent variant ID and pricing from first parent config
      const parent = componentParents[0];
      const parentVariantId = parent.id;

      Logger.debug('Retrieved parent variant', { phase: 'merge' }, {
        bundleId,
        parentVariantId,
        hasPriceAdjustment: !!parent.price_adjustment
      });

      // Calculate bundle totals from ACTUAL selected component prices
      const totalQuantity = bundleComponentLines.reduce((sum, l) => sum + l.quantity, 0);
      const originalTotal = bundleComponentLines.reduce(
        (sum, l) => sum + parseFloat(l.cost.totalAmount.amount),
        0
      );

      // Get price adjustment from component_parents
      let discountPercentage = 0;
      if (parent.price_adjustment) {
        const priceAdjustment = parent.price_adjustment;
        discountPercentage = calculateDiscountPercentage(
          priceAdjustment,
          originalTotal,
          totalQuantity
        );

        Logger.debug('Price adjustment calculated', { phase: 'merge' }, {
          bundleId,
          method: priceAdjustment.method,
          value: priceAdjustment.value,
          originalTotal,
          totalQuantity,
          discountPercentage
        });
      }

      // Get bundle name and generate unique title to prevent Shopify consolidation
      const baseBundleName = getBundleName(line);
      const nameCount = (bundleNameCounts.get(baseBundleName) || 0) + 1;
      bundleNameCounts.set(baseBundleName, nameCount);
      // Append index only when there are multiple instances of the same bundle name
      const bundleName = nameCount > 1 ? `${baseBundleName} (${nameCount})` : baseBundleName;

      // Build component details for checkout UI display
      const originalTotalCents = Math.round(originalTotal * 100);
      const discountedTotalCents = Math.round(originalTotal * (1 - discountPercentage / 100) * 100);
      const savingsCents = originalTotalCents - discountedTotalCents;

      const componentDetails = bundleComponentLines.map((l, index) => {
        const retailCents = Math.round(parseFloat(l.cost.amountPerQuantity.amount) * 100);
        const bundleCents = Math.round(retailCents * (1 - discountPercentage / 100));
        return {
          variantId: l.merchandise.id,
          title: l.merchandise.product?.title || `Component ${index + 1}`,
          quantity: l.quantity,
          retailPrice: retailCents,
          bundlePrice: bundleCents,
          discountPercent: discountPercentage,
          savingsAmount: retailCents - bundleCents
        };
      });

      Logger.info('Creating merge operation', { phase: 'merge' }, {
        bundleId,
        parentVariantId,
        componentLines: bundleComponentLines.length,
        totalQuantity,
        originalTotal,
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

      // Mark all component lines and bundle ID as processed
      bundleComponentLines.forEach(l => processedLines.add(l.id));
      processedBundleIds.add(bundleId);

      Logger.info('Merge operation created', { phase: 'merge' }, {
        bundleId,
        parentVariantId,
        componentLinesProcessed: bundleComponentLines.length
      });
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

      if (componentReferences.length !== componentQuantities.length) {
        Logger.warn('Mismatch between references and quantities', { phase: 'expand' }, {
          lineId: line.id,
          references: componentReferences.length,
          quantities: componentQuantities.length
        });
        continue;
      }

      Logger.debug('Found bundle parent', { phase: 'expand' }, {
        lineId: line.id,
        variantId: line.merchandise.id,
        componentCount: componentReferences.length
      });

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

      Logger.debug('Component pricing loaded', { phase: 'expand' }, {
        hasPricing: componentPricing.length > 0,
        pricingCount: componentPricing.length,
        componentCount: componentReferences.length
      });

      // Calculate bundle totals for discount calculation
      const totalQuantity = componentQuantities.reduce((sum, qty) => sum + qty, 0) * line.quantity;
      const originalTotal = parseFloat(line.cost.totalAmount.amount);

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

        Logger.debug('Price adjustment calculated', { phase: 'expand' }, {
          method: priceAdjustment.method,
          value: priceAdjustment.value,
          originalTotal,
          totalQuantity,
          discountPercentage
        });
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

      // Build component details array for checkout display
      const componentDetails: Array<{
        variantId: string;
        title: string;
        quantity: number;
        retailPrice: number;
        bundlePrice: number;
        discountPercent: number;
        savingsAmount: number;
      }> = [];

      componentReferences.forEach((variantId, index) => {
        const pricing = pricingMap.get(variantId);
        const qty = componentQuantities[index] * line.quantity;

        if (pricing) {
          // Accumulate totals
          totalRetailCents += pricing.retailPrice * qty;
          totalBundleCents += pricing.bundlePrice * qty;
          totalSavingsCents += pricing.savingsAmount * qty;

          componentDetails.push({
            variantId,
            title: `Component ${index + 1}`, // Will be replaced by product title in checkout UI
            quantity: qty,
            retailPrice: pricing.retailPrice,
            bundlePrice: pricing.bundlePrice,
            discountPercent: pricing.discountPercent,
            savingsAmount: pricing.savingsAmount
          });
        }
      });

      // Calculate overall discount percentage
      const overallDiscountPercent = totalRetailCents > 0
        ? ((totalRetailCents - totalBundleCents) / totalRetailCents * 100)
        : discountPercentage;

      Logger.info('Creating Flex Bundles-style expand operation', { phase: 'expand' }, {
        bundleVariantId: line.merchandise.id,
        bundleName,
        componentCount: componentReferences.length,
        bundleQuantity: line.quantity,
        totalRetailCents,
        totalBundleCents,
        totalSavingsCents,
        overallDiscountPercent: overallDiscountPercent.toFixed(2)
      });

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

      Logger.info('Flex Bundles expand operation created', { phase: 'expand' }, {
        bundleVariantId: line.merchandise.id,
        bundleName,
        componentCount: componentDetails.length,
        hasDiscount: discountPercentage > 0
      });
    }

    Logger.info('Cart transform completed', { phase: 'complete' }, {
      totalOperations: operations.length,
      mergeOps: operations.filter(op => op.merge).length,
      expandOps: operations.filter(op => op.expand).length
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
