/**
 * Unit Tests for Cart Transform Function
 * Tests the core cart transformation logic for bundle processing
 */

import { run, cartTransformRun } from '../../../extensions/bundle-cart-transform-ts/src/cart_transform_run';
import { createMockCartTransformInput } from '../../setup';

describe('Cart Transform Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('run function', () => {
    it('should export run function that calls cartTransformRun', () => {
      const mockInput = createMockCartTransformInput();
      const result = run(mockInput);
      
      expect(result).toBeDefined();
      expect(result.operations).toBeDefined();
      expect(Array.isArray(result.operations)).toBe(true);
    });
  });

  describe('cartTransformRun', () => {
    it('should return empty operations for empty cart', () => {
      const input = {
        cart: { lines: [] },
        shop: { all_bundles: { value: '[]' } }
      };

      const result = cartTransformRun(input);

      expect(result.operations).toHaveLength(0);
    });

    it('should return empty operations when no bundle lines found', () => {
      const input = {
        cart: {
          lines: [
            {
              id: 'gid://shopify/CartLine/1',
              quantity: 1,
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/1',
                product: { id: 'gid://shopify/Product/1', title: 'Regular Product' }
              },
              cost: {
                amountPerQuantity: { amount: '10.00', currencyCode: 'USD' },
                totalAmount: { amount: '10.00', currencyCode: 'USD' }
              }
            }
          ]
        },
        shop: { all_bundles: { value: '[]' } }
      };

      const result = cartTransformRun(input);

      expect(result.operations).toHaveLength(0);
    });

    it('should create merge operation for valid bundle', () => {
      const componentParents = JSON.stringify([{
        id: 'gid://shopify/ProductVariant/999',
        component_reference: { value: ['gid://shopify/ProductVariant/1', 'gid://shopify/ProductVariant/2'] },
        component_quantities: { value: [2, 1] }
      }]);

      const input = {
        cart: {
          lines: [
            {
              id: 'gid://shopify/CartLine/1',
              quantity: 2,
              bundleId: { value: 'test-bundle-1' },
              bundleName: { value: 'Test Bundle' },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/1',
                component_parents: { value: componentParents },
                product: { id: 'gid://shopify/Product/1', title: 'Product 1' }
              },
              cost: {
                amountPerQuantity: { amount: '10.00' },
                totalAmount: { amount: '20.00' }
              }
            },
            {
              id: 'gid://shopify/CartLine/2',
              quantity: 1,
              bundleId: { value: 'test-bundle-1' },
              bundleName: { value: 'Test Bundle' },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/2',
                product: { id: 'gid://shopify/Product/2', title: 'Product 2' }
              },
              cost: {
                amountPerQuantity: { amount: '15.00' },
                totalAmount: { amount: '15.00' }
              }
            }
          ]
        }
      };

      const result = cartTransformRun(input);

      expect(result.operations).toHaveLength(1);
      expect(result.operations[0].merge).toBeDefined();
      expect(result.operations[0].merge!.cartLines).toHaveLength(2);
      expect(result.operations[0].merge!.parentVariantId).toBe('gid://shopify/ProductVariant/999');
      expect(result.operations[0].merge!.title).toBe('Test Bundle');
    });

    it('should apply percentage discount when conditions are met', () => {
      const componentParents = JSON.stringify([{
        id: 'gid://shopify/ProductVariant/999',
        component_reference: { value: ['gid://shopify/ProductVariant/1', 'gid://shopify/ProductVariant/2'] },
        component_quantities: { value: [2, 1] },
        price_adjustment: {
          method: 'percentage_off',
          value: 15,
          conditions: { type: 'quantity', operator: 'gte', value: 2 }
        }
      }]);

      const input = {
        cart: {
          lines: [
            {
              id: 'gid://shopify/CartLine/1',
              quantity: 2,
              bundleId: { value: 'test-bundle-1' },
              bundleName: { value: 'Test Bundle' },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/1',
                component_parents: { value: componentParents },
                product: { id: 'gid://shopify/Product/1', title: 'Product 1' }
              },
              cost: {
                amountPerQuantity: { amount: '10.00' },
                totalAmount: { amount: '20.00' }
              }
            },
            {
              id: 'gid://shopify/CartLine/2',
              quantity: 1,
              bundleId: { value: 'test-bundle-1' },
              bundleName: { value: 'Test Bundle' },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/2',
                product: { id: 'gid://shopify/Product/2', title: 'Product 2' }
              },
              cost: {
                amountPerQuantity: { amount: '15.00' },
                totalAmount: { amount: '15.00' }
              }
            }
          ]
        }
      };

      const result = cartTransformRun(input);

      expect(result.operations).toHaveLength(1);
      expect(result.operations[0].merge!.price).toBeDefined();
      expect(result.operations[0].merge!.price!.percentageDecrease.value).toBe('15.00');
    });

    it('should apply fixed amount discount correctly', () => {
      // fixed_amount_off: value is in cents in the source.
      // $10 off = 1000 cents. Original total = $50. Discount% = (1000/100)/50 * 100 = 20%
      const componentParents = JSON.stringify([{
        id: 'gid://shopify/ProductVariant/999',
        component_reference: { value: ['gid://shopify/ProductVariant/1'] },
        component_quantities: { value: [1] },
        price_adjustment: {
          method: 'fixed_amount_off',
          value: 1000 // 1000 cents = $10
        }
      }]);

      const input = {
        presentmentCurrencyRate: 1,
        cart: {
          lines: [
            {
              id: 'gid://shopify/CartLine/1',
              quantity: 1,
              bundleId: { value: 'test-bundle-1' },
              bundleName: { value: 'Test Bundle' },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/1',
                component_parents: { value: componentParents },
                product: { id: 'gid://shopify/Product/1', title: 'Product 1' }
              },
              cost: {
                amountPerQuantity: { amount: '50.00' },
                totalAmount: { amount: '50.00' }
              }
            }
          ]
        }
      };

      const result = cartTransformRun(input);

      expect(result.operations).toHaveLength(1);
      expect(result.operations[0].merge!.price).toBeDefined();
      expect(result.operations[0].merge!.price!.percentageDecrease.value).toBe('20.00');
    });

    it('should apply fixed bundle price correctly', () => {
      // fixed_bundle_price: value is in cents. 7500 cents = $75. Original = $100.
      // Discount% = (100 - 75) / 100 * 100 = 25%
      const componentParents = JSON.stringify([{
        id: 'gid://shopify/ProductVariant/999',
        component_reference: { value: ['gid://shopify/ProductVariant/1'] },
        component_quantities: { value: [1] },
        price_adjustment: {
          method: 'fixed_bundle_price',
          value: 7500 // 7500 cents = $75
        }
      }]);

      const input = {
        presentmentCurrencyRate: 1,
        cart: {
          lines: [
            {
              id: 'gid://shopify/CartLine/1',
              quantity: 1,
              bundleId: { value: 'test-bundle-1' },
              bundleName: { value: 'Test Bundle' },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/1',
                component_parents: { value: componentParents },
                product: { id: 'gid://shopify/Product/1', title: 'Product 1' }
              },
              cost: {
                amountPerQuantity: { amount: '100.00' },
                totalAmount: { amount: '100.00' }
              }
            }
          ]
        }
      };

      const result = cartTransformRun(input);

      expect(result.operations).toHaveLength(1);
      expect(result.operations[0].merge!.price).toBeDefined();
      expect(result.operations[0].merge!.price!.percentageDecrease.value).toBe('25.00');
    });

    it('should handle multiple bundle instances separately', () => {
      const componentParents = JSON.stringify([{
        id: 'gid://shopify/ProductVariant/999',
        component_reference: { value: ['gid://shopify/ProductVariant/1'] },
        component_quantities: { value: [1] }
      }]);

      const input = {
        cart: {
          lines: [
            {
              id: 'gid://shopify/CartLine/1',
              quantity: 1,
              bundleId: { value: 'test-bundle-1_instance1' },
              bundleName: { value: 'Test Bundle' },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/1',
                component_parents: { value: componentParents },
                product: { id: 'gid://shopify/Product/1', title: 'Product 1' }
              },
              cost: {
                amountPerQuantity: { amount: '10.00' },
                totalAmount: { amount: '10.00' }
              }
            },
            {
              id: 'gid://shopify/CartLine/2',
              quantity: 1,
              bundleId: { value: 'test-bundle-1_instance2' },
              bundleName: { value: 'Test Bundle' },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/2',
                component_parents: { value: componentParents },
                product: { id: 'gid://shopify/Product/2', title: 'Product 2' }
              },
              cost: {
                amountPerQuantity: { amount: '15.00' },
                totalAmount: { amount: '15.00' }
              }
            }
          ]
        }
      };

      const result = cartTransformRun(input);

      expect(result.operations).toHaveLength(2); // Two separate bundle instances
      expect(result.operations[0].merge!.cartLines).toHaveLength(1);
      expect(result.operations[1].merge!.cartLines).toHaveLength(1);
    });

    it('should handle missing bundle configuration gracefully', () => {
      const input = createMockCartTransformInput({
        cart: {
          lines: [
            {
              id: 'gid://shopify/CartLine/1',
              quantity: 1,
              bundleId: { value: 'nonexistent-bundle' },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/1',
                product: { id: 'gid://shopify/Product/1', title: 'Product 1' }
              },
              cost: {
                amountPerQuantity: { amount: '10.00', currencyCode: 'USD' },
                totalAmount: { amount: '10.00', currencyCode: 'USD' }
              }
            }
          ]
        }
      });

      const result = cartTransformRun(input);

      expect(result.operations).toHaveLength(0);
    });

    it('should handle malformed shop metafield gracefully', () => {
      const input = createMockCartTransformInput({
        shop: {
          all_bundles: {
            value: 'invalid-json'
          }
        }
      });

      const result = cartTransformRun(input);

      expect(result.operations).toHaveLength(0);
    });

    it('should handle missing bundleParentVariantId', () => {
      const input = createMockCartTransformInput({
        shop: {
          all_bundles: {
            value: JSON.stringify([
              {
                id: 'test-bundle-1',
                name: 'Test Bundle',
                // Missing bundleParentVariantId
                pricing: {
                  enabled: false,
                  method: 'percentage_off',
                  rules: []
                }
              }
            ])
          }
        }
      });

      const result = cartTransformRun(input);

      expect(result.operations).toHaveLength(0);
    });

    it('should handle amount-based discount conditions', () => {
      // Amount condition: minimum $50 total, 20% off
      // Condition value is in cents in source: 5000 cents = $50
      const componentParents = JSON.stringify([{
        id: 'gid://shopify/ProductVariant/999',
        component_reference: { value: ['gid://shopify/ProductVariant/1'] },
        component_quantities: { value: [1] },
        price_adjustment: {
          method: 'percentage_off',
          value: 20,
          conditions: { type: 'amount', operator: 'gte', value: 5000 } // 5000 cents = $50
        }
      }]);

      const input = {
        presentmentCurrencyRate: 1,
        cart: {
          lines: [
            {
              id: 'gid://shopify/CartLine/1',
              quantity: 1,
              bundleId: { value: 'test-bundle-1' },
              bundleName: { value: 'Test Bundle' },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/1',
                component_parents: { value: componentParents },
                product: { id: 'gid://shopify/Product/1', title: 'Product 1' }
              },
              cost: {
                amountPerQuantity: { amount: '100.00' },
                totalAmount: { amount: '100.00' }
              }
            }
          ]
        }
      };

      const result = cartTransformRun(input);

      expect(result.operations).toHaveLength(1);
      expect(result.operations[0].merge!.price).toBeDefined();
      expect(result.operations[0].merge!.price!.percentageDecrease.value).toBe('20.00');
    });

    it('should merge with zero discount when conditions are not met', () => {
      // Quantity condition requires 2, but only 1 item. Discount should be 0.
      // The source always includes a price field with percentageDecrease (even when 0).
      const componentParents = JSON.stringify([{
        id: 'gid://shopify/ProductVariant/999',
        component_reference: { value: ['gid://shopify/ProductVariant/1'] },
        component_quantities: { value: [1] },
        price_adjustment: {
          method: 'percentage_off',
          value: 10,
          conditions: { type: 'quantity', operator: 'gte', value: 2 }
        }
      }]);

      const input = {
        cart: {
          lines: [
            {
              id: 'gid://shopify/CartLine/1',
              quantity: 1,
              bundleId: { value: 'test-bundle-1' },
              bundleName: { value: 'Test Bundle' },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/1',
                component_parents: { value: componentParents },
                product: { id: 'gid://shopify/Product/1', title: 'Product 1' }
              },
              cost: {
                amountPerQuantity: { amount: '10.00' },
                totalAmount: { amount: '10.00' }
              }
            }
          ]
        }
      };

      const result = cartTransformRun(input);

      expect(result.operations).toHaveLength(1);
      // Source always includes price with percentageDecrease, but value is "0.00"
      expect(result.operations[0].merge!.price).toBeDefined();
      expect(result.operations[0].merge!.price!.percentageDecrease.value).toBe('0.00');
    });
  });

  describe('error handling', () => {
    it('should handle exceptions gracefully', () => {
      const invalidInput = null as any;

      const result = cartTransformRun(invalidInput);

      expect(result.operations).toHaveLength(0);
    });

    it('should handle undefined cart lines', () => {
      const input = {
        cart: { lines: undefined as any },
        shop: { all_bundles: { value: '[]' } }
      };

      const result = cartTransformRun(input);

      expect(result.operations).toHaveLength(0);
    });

    it('should handle missing cost information', () => {
      // With undefined cost, the source will throw when accessing cost.totalAmount.amount
      // inside the try-catch, resulting in an empty operations array.
      const componentParents = JSON.stringify([{
        id: 'gid://shopify/ProductVariant/999',
        component_reference: { value: ['gid://shopify/ProductVariant/1'] },
        component_quantities: { value: [1] }
      }]);

      const input = {
        cart: {
          lines: [
            {
              id: 'gid://shopify/CartLine/1',
              quantity: 1,
              bundleId: { value: 'test-bundle-1' },
              bundleName: { value: 'Test Bundle' },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/1',
                component_parents: { value: componentParents },
                product: { id: 'gid://shopify/Product/1', title: 'Product 1' }
              },
              cost: undefined as any
            }
          ]
        }
      };

      const result = cartTransformRun(input);

      // Missing cost causes an error in the merge loop (accessing cost.totalAmount.amount)
      // which is caught by the outer try-catch, returning empty operations
      expect(result.operations).toHaveLength(0);
    });
  });
});

// ─── Free Gift Pricing ────────────────────────────────────────────────────────
//
// Helper: build a cart line. Pass stepType: 'free_gift' for free-gift lines.
function makeLine(
  id: string,
  bundleId: string,
  variantId: string,
  title: string,
  amountPer: string,
  totalAmount: string,
  quantity: number,
  componentParentsJson?: string,
  stepType?: string
) {
  return {
    id,
    quantity,
    bundleId: { value: bundleId },
    bundleName: { value: 'Test Bundle' },
    ...(stepType ? { stepType: { value: stepType } } : {}),
    merchandise: {
      __typename: 'ProductVariant',
      id: variantId,
      ...(componentParentsJson ? { component_parents: { value: componentParentsJson } } : {}),
      product: { id: `gid://shopify/Product/${id}`, title },
    },
    cost: {
      amountPerQuantity: { amount: amountPer },
      totalAmount: { amount: totalAmount },
    },
  };
}

function makeParents(discountConfig?: object) {
  return JSON.stringify([{
    id: 'gid://shopify/ProductVariant/999',
    component_reference: { value: [] },
    component_quantities: { value: [] },
    ...(discountConfig ? { price_adjustment: discountConfig } : {}),
  }]);
}

describe('Free Gift Pricing — calculateDiscountPercentage', () => {
  // ── Case 1: percentage_off with one free-gift step ──────────────────────────
  // paidTotal = $13 (T-shirt $5 + Jeans $8), freeGiftTotal = $2 (Cap), 10% off
  // targetPrice = 13 * 0.90 = 11.70
  // effectivePct = (1 - 11.70/15) * 100 = 22%
  it('percentage_off: effectivePct is higher than configured % to absorb free gift cost', () => {
    const parents = makeParents({ method: 'percentage_off', value: 10 });
    const input = {
      cart: {
        lines: [
          makeLine('L1', 'b1', 'gid://shopify/ProductVariant/1', 'T-shirt', '5.00', '5.00', 1, parents),
          makeLine('L2', 'b1', 'gid://shopify/ProductVariant/2', 'Jeans',   '8.00', '8.00', 1),
          makeLine('L3', 'b1', 'gid://shopify/ProductVariant/3', 'Cap',     '2.00', '2.00', 1, undefined, 'free_gift'),
        ],
      },
    };

    const result = cartTransformRun(input);
    expect(result.operations).toHaveLength(1);
    // effectivePct = (1 - 11.70/15) * 100 = 22.00
    expect(result.operations[0].merge!.price!.percentageDecrease.value).toBe('22.00');
  });

  // ── Case 2: fixed_amount_off with one free-gift step ────────────────────────
  // paidTotal = $50, freeGiftTotal = $20, $10 off paid items
  // targetPrice = max(0, 50 - 10) = 40
  // effectivePct = (1 - 40/70) * 100 = 42.86
  it('fixed_amount_off: discount absorbs free gift cost + amount-off on paid items', () => {
    const parents = makeParents({ method: 'fixed_amount_off', value: 1000 }); // 1000 cents = $10
    const input = {
      presentmentCurrencyRate: 1,
      cart: {
        lines: [
          makeLine('L1', 'b1', 'gid://shopify/ProductVariant/1', 'Paid',    '50.00', '50.00', 1, parents),
          makeLine('L2', 'b1', 'gid://shopify/ProductVariant/2', 'Gift',    '20.00', '20.00', 1, undefined, 'free_gift'),
        ],
      },
    };

    const result = cartTransformRun(input);
    expect(result.operations).toHaveLength(1);
    // (1 - 40/70) * 100 = 42.857... → 42.86
    expect(result.operations[0].merge!.price!.percentageDecrease.value).toBe('42.86');
  });

  // ── Case 3: fixed_bundle_price — normal (fixedPrice ≤ paidTotal) ────────────
  // paidTotal = $100, freeGiftTotal = $20, fixedPrice = $75
  // targetPrice = min(75, 100) = 75
  // effectivePct = (1 - 75/120) * 100 = 37.50
  it('fixed_bundle_price: customer pays fixedPrice when fixedPrice ≤ paidTotal', () => {
    const parents = makeParents({ method: 'fixed_bundle_price', value: 7500 }); // 7500 cents = $75
    const input = {
      presentmentCurrencyRate: 1,
      cart: {
        lines: [
          makeLine('L1', 'b1', 'gid://shopify/ProductVariant/1', 'Paid', '100.00', '100.00', 1, parents),
          makeLine('L2', 'b1', 'gid://shopify/ProductVariant/2', 'Gift',  '20.00',  '20.00', 1, undefined, 'free_gift'),
        ],
      },
    };

    const result = cartTransformRun(input);
    expect(result.operations).toHaveLength(1);
    // (1 - 75/120) * 100 = 37.50
    expect(result.operations[0].merge!.price!.percentageDecrease.value).toBe('37.50');
  });

  // ── Case 4: fixed_bundle_price — guard case (fixedPrice > paidTotal) ────────
  // paidTotal = $50, freeGiftTotal = $20, fixedPrice = $60 (> paidTotal → cap at paidTotal)
  // targetPrice = min(60, 50) = 50
  // effectivePct = (1 - 50/70) * 100 = 28.57
  it('fixed_bundle_price: caps at paidTotal when fixedPrice > paidTotal (prevents overcharge)', () => {
    const parents = makeParents({ method: 'fixed_bundle_price', value: 6000 }); // 6000 cents = $60
    const input = {
      presentmentCurrencyRate: 1,
      cart: {
        lines: [
          makeLine('L1', 'b1', 'gid://shopify/ProductVariant/1', 'Paid', '50.00', '50.00', 1, parents),
          makeLine('L2', 'b1', 'gid://shopify/ProductVariant/2', 'Gift', '20.00', '20.00', 1, undefined, 'free_gift'),
        ],
      },
    };

    const result = cartTransformRun(input);
    expect(result.operations).toHaveLength(1);
    // (1 - 50/70) * 100 = 28.571... → 28.57
    expect(result.operations[0].merge!.price!.percentageDecrease.value).toBe('28.57');
  });

  // ── Case 5: All free gift steps → 100% discount ─────────────────────────────
  it('all free-gift lines: effectivePct = 100% for all three discount methods', () => {
    for (const discountConfig of [
      { method: 'percentage_off',    value: 10 },
      { method: 'fixed_amount_off',  value: 500 },
      { method: 'fixed_bundle_price', value: 9999 },
    ]) {
      const parents = makeParents(discountConfig);
      const input = {
        presentmentCurrencyRate: 1,
        cart: {
          lines: [
            makeLine('L1', 'b1', 'gid://shopify/ProductVariant/1', 'Gift1', '30.00', '30.00', 1, parents, 'free_gift'),
          ],
        },
      };

      const result = cartTransformRun(input);
      expect(result.operations).toHaveLength(1);
      expect(result.operations[0].merge!.price!.percentageDecrease.value).toBe('100.00');
    }
  });

  // ── Case 6: Quantity condition — free gift qty excluded from threshold check ─
  // paid: 2 items, free gift: 1 item, totalQty = 3
  // condition: qty >= 3 uses paidQuantity (2) → NOT met → no discount
  // condition: qty >= 2 uses paidQuantity (2) → met → discount applied
  it('quantity condition: free gift quantity does not count toward threshold', () => {
    const parentsNoMet = makeParents({ method: 'percentage_off', value: 10, conditions: { type: 'quantity', operator: 'gte', value: 3 } });
    const inputNoMet = {
      cart: {
        lines: [
          makeLine('L1', 'b1', 'gid://shopify/ProductVariant/1', 'Paid1', '10.00', '10.00', 1, parentsNoMet),
          makeLine('L2', 'b1', 'gid://shopify/ProductVariant/2', 'Paid2', '10.00', '10.00', 1),
          makeLine('L3', 'b1', 'gid://shopify/ProductVariant/3', 'Gift',  '10.00', '10.00', 1, undefined, 'free_gift'),
        ],
      },
    };
    const resultNoMet = cartTransformRun(inputNoMet);
    expect(resultNoMet.operations[0].merge!.price!.percentageDecrease.value).toBe('0.00');

    const parentsMet = makeParents({ method: 'percentage_off', value: 10, conditions: { type: 'quantity', operator: 'gte', value: 2 } });
    const inputMet = {
      cart: {
        lines: [
          makeLine('L1', 'b1', 'gid://shopify/ProductVariant/1', 'Paid1', '10.00', '10.00', 1, parentsMet),
          makeLine('L2', 'b1', 'gid://shopify/ProductVariant/2', 'Paid2', '10.00', '10.00', 1),
          makeLine('L3', 'b1', 'gid://shopify/ProductVariant/3', 'Gift',  '10.00', '10.00', 1, undefined, 'free_gift'),
        ],
      },
    };
    const resultMet = cartTransformRun(inputMet);
    // paidTotal = $20, freeGiftTotal = $10, originalTotal = $30, 10% off paid
    // effectivePct = (1 - 18/30) * 100 = 40.00
    expect(resultMet.operations[0].merge!.price!.percentageDecrease.value).toBe('40.00');
  });

  // ── Case 7: Amount condition — free gift cost excluded from threshold check ──
  // paid = $30, free gift = $20, condition: amount >= $40
  // paidTotal ($30) < $40 → NOT met → no discount
  it('amount condition: free gift cost does not count toward amount threshold', () => {
    const parentsNoMet = makeParents({
      method: 'percentage_off', value: 10,
      conditions: { type: 'amount', operator: 'gte', value: 4000 }, // $40 threshold in cents
    });
    const input = {
      presentmentCurrencyRate: 1,
      cart: {
        lines: [
          makeLine('L1', 'b1', 'gid://shopify/ProductVariant/1', 'Paid', '30.00', '30.00', 1, parentsNoMet),
          makeLine('L2', 'b1', 'gid://shopify/ProductVariant/2', 'Gift', '20.00', '20.00', 1, undefined, 'free_gift'),
        ],
      },
    };
    const result = cartTransformRun(input);
    expect(result.operations[0].merge!.price!.percentageDecrease.value).toBe('0.00');
  });

  // ── Case 8: Free gift total > paid total → effectivePct clamps to 100% ──────
  // paidTotal = $10, freeGiftTotal = $90, 10% off
  // targetPrice = 10 * 0.90 = 9
  // effectivePct = (1 - 9/100) * 100 = 91%  (well within 100%, no clamp needed)
  it('large free gift relative to paid: effectivePct reflects the adjusted discount', () => {
    const parents = makeParents({ method: 'percentage_off', value: 10 });
    const input = {
      cart: {
        lines: [
          makeLine('L1', 'b1', 'gid://shopify/ProductVariant/1', 'Paid', '10.00', '10.00', 1, parents),
          makeLine('L2', 'b1', 'gid://shopify/ProductVariant/2', 'Gift', '90.00', '90.00', 1, undefined, 'free_gift'),
        ],
      },
    };
    const result = cartTransformRun(input);
    // (1 - 9/100) * 100 = 91.00
    expect(result.operations[0].merge!.price!.percentageDecrease.value).toBe('91.00');
  });

  // ── Case 9: Normal bundle (no free gift) is unaffected ──────────────────────
  it('normal bundle without free gift: effectivePct equals the configured percentage', () => {
    const parents = makeParents({ method: 'percentage_off', value: 15 });
    const input = {
      cart: {
        lines: [
          makeLine('L1', 'b1', 'gid://shopify/ProductVariant/1', 'Paid1', '20.00', '20.00', 2, parents),
          makeLine('L2', 'b1', 'gid://shopify/ProductVariant/2', 'Paid2', '15.00', '15.00', 1),
        ],
      },
    };
    const result = cartTransformRun(input);
    // No free gift → paidTotal = originalTotal → effectivePct = configured 15%
    expect(result.operations[0].merge!.price!.percentageDecrease.value).toBe('15.00');
  });
});