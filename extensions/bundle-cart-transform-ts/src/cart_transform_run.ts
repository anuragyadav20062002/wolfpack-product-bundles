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
  };
  expand?: {
    cartLineId: string;
    expandedCartItems: Array<{
      merchandiseId: string;
      quantity: number;
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
  switch (method) {
    case 'percentage_off':
      return value;

    case 'fixed_amount_off':
      // Value is in cents, convert to decimal
      const amountOff = value / 100;
      if (originalTotal > 0) {
        return (amountOff / originalTotal) * 100;
      }
      return 0;

    case 'fixed_bundle_price':
      // Value is in cents, convert to decimal
      const fixedPrice = value / 100;
      if (originalTotal > 0 && fixedPrice < originalTotal) {
        return ((originalTotal - fixedPrice) / originalTotal) * 100;
      }
      return 0;

    default:
      Logger.warn('Unknown pricing method', { phase: 'discount' }, { method });
      return 0;
  }
}

/**
 * Find all cart lines that belong to a specific parent bundle
 */
function findBundleComponentLines(
  allLines: CartTransformInput['cart']['lines'],
  parentVariantId: string,
  componentVariantIds: string[]
): CartTransformInput['cart']['lines'] {
  const componentLines: CartTransformInput['cart']['lines'] = [];

  for (const componentId of componentVariantIds) {
    const line = allLines.find(l => l.merchandise.id === componentId);
    if (line) {
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

    // Edge case: empty cart
    if (!input?.cart?.lines || input.cart.lines.length === 0) {
      Logger.info('Empty cart', { phase: 'init' });
      return { operations: [] };
    }

    const operations: CartTransformOperation[] = [];
    const processedLines = new Set<string>();

    // ========================================================================
    // OPERATION 1: MERGE - Combine component products into bundles
    // ========================================================================
    // When individual bundle components are in the cart, merge them into
    // the bundle parent product

    for (const line of input.cart.lines) {
      if (processedLines.has(line.id)) continue;

      const componentParentsValue = line.merchandise.component_parents?.value;
      if (!componentParentsValue) continue;

      const componentParents = parseJSON<ComponentParent[]>(
        componentParentsValue,
        [],
        'component_parents'
      );

      if (componentParents.length === 0) continue;

      Logger.debug('Found component with parents', { phase: 'merge' }, {
        lineId: line.id,
        variantId: line.merchandise.id,
        parentCount: componentParents.length
      });

      // Check each parent bundle this component belongs to
      for (const parent of componentParents) {
        const parentVariantId = parent.id;
        const componentReferences = parent.component_reference.value;
        const componentQuantities = parent.component_quantities.value;

        // Find all component lines for this bundle
        const bundleComponentLines = findBundleComponentLines(
          input.cart.lines,
          parentVariantId,
          componentReferences
        );

        // Check if all components are present
        if (bundleComponentLines.length !== componentReferences.length) {
          Logger.debug('Not all components present', { phase: 'merge' }, {
            parentVariantId,
            requiredComponents: componentReferences.length,
            foundComponents: bundleComponentLines.length
          });
          continue;
        }

        // Verify quantities match
        const quantitiesMatch = bundleComponentLines.every((componentLine, index) => {
          const requiredQty = componentQuantities[index];
          return componentLine.quantity >= requiredQty;
        });

        if (!quantitiesMatch) {
          Logger.debug('Component quantities do not match', { phase: 'merge' }, {
            parentVariantId
          });
          continue;
        }

        // Calculate bundle totals from ACTUAL selected component prices
        const totalQuantity = bundleComponentLines.reduce((sum, l) => sum + l.quantity, 0);
        const originalTotal = bundleComponentLines.reduce(
          (sum, l) => sum + parseFloat(l.cost.totalAmount.amount),
          0
        );

        // Get price adjustment from component_parents (includes pricing info)
        let discountPercentage = 0;
        if (parent.price_adjustment) {
          const priceAdjustment = parent.price_adjustment;
          discountPercentage = calculateDiscountPercentage(
            priceAdjustment,
            originalTotal,
            totalQuantity
          );

          Logger.debug('Price adjustment from component_parents', { phase: 'merge' }, {
            method: priceAdjustment.method,
            value: priceAdjustment.value,
            originalTotal,
            totalQuantity,
            discountPercentage
          });
        }

        Logger.info('Creating merge operation', { phase: 'merge' }, {
          parentVariantId,
          componentLines: bundleComponentLines.length,
          totalQuantity,
          originalTotal,
          discount: discountPercentage
        });

        // Create merge operation
        const mergeOp: CartTransformOperation = {
          merge: {
            cartLines: bundleComponentLines.map(l => ({
              cartLineId: l.id,
              quantity: l.quantity
            })),
            parentVariantId,
            title: line.merchandise.product?.title || 'Bundle',
            ...(discountPercentage > 0 && {
              price: {
                percentageDecrease: {
                  value: discountPercentage.toFixed(2)
                }
              }
            })
          }
        };

        operations.push(mergeOp);

        // Mark all component lines as processed
        bundleComponentLines.forEach(l => processedLines.add(l.id));

        Logger.info('Merge operation created', { phase: 'merge' }, {
          parentVariantId,
          componentLinesProcessed: bundleComponentLines.length
        });
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

      Logger.info('Creating expand operation', { phase: 'expand' }, {
        bundleVariantId: line.merchandise.id,
        componentCount: componentReferences.length,
        bundleQuantity: line.quantity,
        discount: discountPercentage
      });

      // Create expand operation
      const expandOp: CartTransformOperation = {
        expand: {
          cartLineId: line.id,
          expandedCartItems: componentReferences.map((variantId, index) => ({
            merchandiseId: variantId,
            quantity: componentQuantities[index] * line.quantity
          })),
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

      Logger.info('Expand operation created', { phase: 'expand' }, {
        bundleVariantId: line.merchandise.id,
        componentsExpanded: componentReferences.length
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
