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