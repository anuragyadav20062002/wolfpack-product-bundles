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
      const input = createMockCartTransformInput({
        cart: {
          lines: [
            {
              id: 'gid://shopify/CartLine/1',
              quantity: 2,
              bundleId: { value: 'test-bundle-1' },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/1',
                product: { id: 'gid://shopify/Product/1', title: 'Product 1' }
              },
              cost: {
                amountPerQuantity: { amount: '10.00', currencyCode: 'USD' },
                totalAmount: { amount: '20.00', currencyCode: 'USD' }
              }
            },
            {
              id: 'gid://shopify/CartLine/2',
              quantity: 1,
              bundleId: { value: 'test-bundle-1' },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/2',
                product: { id: 'gid://shopify/Product/2', title: 'Product 2' }
              },
              cost: {
                amountPerQuantity: { amount: '15.00', currencyCode: 'USD' },
                totalAmount: { amount: '15.00', currencyCode: 'USD' }
              }
            }
          ]
        }
      });

      const result = cartTransformRun(input);

      expect(result.operations).toHaveLength(1);
      expect(result.operations[0].merge).toBeDefined();
      expect(result.operations[0].merge.cartLines).toHaveLength(2);
      expect(result.operations[0].merge.parentVariantId).toBe('gid://shopify/ProductVariant/999');
      expect(result.operations[0].merge.title).toBe('Test Bundle');
    });

    it('should apply percentage discount when conditions are met', () => {
      const input = createMockCartTransformInput({
        cart: {
          lines: [
            {
              id: 'gid://shopify/CartLine/1',
              quantity: 2,
              bundleId: { value: 'test-bundle-1' },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/1',
                product: { id: 'gid://shopify/Product/1', title: 'Product 1' }
              },
              cost: {
                amountPerQuantity: { amount: '10.00', currencyCode: 'USD' },
                totalAmount: { amount: '20.00', currencyCode: 'USD' }
              }
            },
            {
              id: 'gid://shopify/CartLine/2',
              quantity: 1,
              bundleId: { value: 'test-bundle-1' },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/2',
                product: { id: 'gid://shopify/Product/2', title: 'Product 2' }
              },
              cost: {
                amountPerQuantity: { amount: '15.00', currencyCode: 'USD' },
                totalAmount: { amount: '15.00', currencyCode: 'USD' }
              }
            }
          ]
        },
        shop: {
          all_bundles: {
            value: JSON.stringify([
              {
                id: 'test-bundle-1',
                name: 'Test Bundle',
                bundleParentVariantId: 'gid://shopify/ProductVariant/999',
                pricing: {
                  enabled: true,
                  method: 'percentage_off',
                  rules: [
                    {
                      conditionType: 'quantity',
                      value: 2,
                      discountValue: 15
                    }
                  ]
                }
              }
            ])
          }
        }
      });

      const result = cartTransformRun(input);

      expect(result.operations).toHaveLength(1);
      expect(result.operations[0].merge.price).toBeDefined();
      expect(result.operations[0].merge.price.percentageDecrease.value).toBe('15');
    });

    it('should apply fixed amount discount correctly', () => {
      const input = createMockCartTransformInput({
        cart: {
          lines: [
            {
              id: 'gid://shopify/CartLine/1',
              quantity: 1,
              bundleId: { value: 'test-bundle-1' },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/1',
                product: { id: 'gid://shopify/Product/1', title: 'Product 1' }
              },
              cost: {
                amountPerQuantity: { amount: '50.00', currencyCode: 'USD' },
                totalAmount: { amount: '50.00', currencyCode: 'USD' }
              }
            }
          ]
        },
        shop: {
          all_bundles: {
            value: JSON.stringify([
              {
                id: 'test-bundle-1',
                name: 'Test Bundle',
                bundleParentVariantId: 'gid://shopify/ProductVariant/999',
                pricing: {
                  enabled: true,
                  method: 'fixed_amount_off',
                  rules: [
                    {
                      conditionType: 'quantity',
                      value: 1,
                      discountValue: 10
                    }
                  ]
                }
              }
            ])
          }
        }
      });

      const result = cartTransformRun(input);

      expect(result.operations).toHaveLength(1);
      expect(result.operations[0].merge.price).toBeDefined();
      expect(result.operations[0].merge.price.percentageDecrease.value).toBe('20'); // 10/50 = 20%
    });

    it('should apply fixed bundle price correctly', () => {
      const input = createMockCartTransformInput({
        cart: {
          lines: [
            {
              id: 'gid://shopify/CartLine/1',
              quantity: 1,
              bundleId: { value: 'test-bundle-1' },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/1',
                product: { id: 'gid://shopify/Product/1', title: 'Product 1' }
              },
              cost: {
                amountPerQuantity: { amount: '100.00', currencyCode: 'USD' },
                totalAmount: { amount: '100.00', currencyCode: 'USD' }
              }
            }
          ]
        },
        shop: {
          all_bundles: {
            value: JSON.stringify([
              {
                id: 'test-bundle-1',
                name: 'Test Bundle',
                bundleParentVariantId: 'gid://shopify/ProductVariant/999',
                pricing: {
                  enabled: true,
                  method: 'fixed_bundle_price',
                  rules: [
                    {
                      conditionType: 'quantity',
                      value: 1,
                      discountValue: 75
                    }
                  ]
                }
              }
            ])
          }
        }
      });

      const result = cartTransformRun(input);

      expect(result.operations).toHaveLength(1);
      expect(result.operations[0].merge.price).toBeDefined();
      expect(result.operations[0].merge.price.percentageDecrease.value).toBe('25'); // (100-75)/100 = 25%
    });

    it('should handle multiple bundle instances separately', () => {
      const input = createMockCartTransformInput({
        cart: {
          lines: [
            {
              id: 'gid://shopify/CartLine/1',
              quantity: 1,
              bundleId: { value: 'test-bundle-1_instance1' },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/1',
                product: { id: 'gid://shopify/Product/1', title: 'Product 1' }
              },
              cost: {
                amountPerQuantity: { amount: '10.00', currencyCode: 'USD' },
                totalAmount: { amount: '10.00', currencyCode: 'USD' }
              }
            },
            {
              id: 'gid://shopify/CartLine/2',
              quantity: 1,
              bundleId: { value: 'test-bundle-1_instance2' },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/2',
                product: { id: 'gid://shopify/Product/2', title: 'Product 2' }
              },
              cost: {
                amountPerQuantity: { amount: '15.00', currencyCode: 'USD' },
                totalAmount: { amount: '15.00', currencyCode: 'USD' }
              }
            }
          ]
        },
        shop: {
          all_bundles: {
            value: JSON.stringify([
              {
                id: 'test-bundle-1',
                name: 'Test Bundle',
                bundleParentVariantId: 'gid://shopify/ProductVariant/999',
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

      expect(result.operations).toHaveLength(2); // Two separate bundle instances
      expect(result.operations[0].merge.cartLines).toHaveLength(1);
      expect(result.operations[1].merge.cartLines).toHaveLength(1);
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
      const input = createMockCartTransformInput({
        cart: {
          lines: [
            {
              id: 'gid://shopify/CartLine/1',
              quantity: 1,
              bundleId: { value: 'test-bundle-1' },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/1',
                product: { id: 'gid://shopify/Product/1', title: 'Product 1' }
              },
              cost: {
                amountPerQuantity: { amount: '100.00', currencyCode: 'USD' },
                totalAmount: { amount: '100.00', currencyCode: 'USD' }
              }
            }
          ]
        },
        shop: {
          all_bundles: {
            value: JSON.stringify([
              {
                id: 'test-bundle-1',
                name: 'Test Bundle',
                bundleParentVariantId: 'gid://shopify/ProductVariant/999',
                pricing: {
                  enabled: true,
                  method: 'percentage_off',
                  rules: [
                    {
                      conditionType: 'amount',
                      value: 50, // Minimum $50
                      discountValue: 20
                    }
                  ]
                }
              }
            ])
          }
        }
      });

      const result = cartTransformRun(input);

      expect(result.operations).toHaveLength(1);
      expect(result.operations[0].merge.price).toBeDefined();
      expect(result.operations[0].merge.price.percentageDecrease.value).toBe('20');
    });

    it('should merge without discount when conditions are not met', () => {
      const input = createMockCartTransformInput({
        cart: {
          lines: [
            {
              id: 'gid://shopify/CartLine/1',
              quantity: 1, // Only 1 item, but rule requires 2
              bundleId: { value: 'test-bundle-1' },
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
        },
        shop: {
          all_bundles: {
            value: JSON.stringify([
              {
                id: 'test-bundle-1',
                name: 'Test Bundle',
                bundleParentVariantId: 'gid://shopify/ProductVariant/999',
                pricing: {
                  enabled: true,
                  method: 'percentage_off',
                  rules: [
                    {
                      conditionType: 'quantity',
                      value: 2, // Requires 2 items
                      discountValue: 10
                    }
                  ]
                }
              }
            ])
          }
        }
      });

      const result = cartTransformRun(input);

      expect(result.operations).toHaveLength(1);
      expect(result.operations[0].merge.price).toBeUndefined(); // No discount applied
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
      const input = createMockCartTransformInput({
        cart: {
          lines: [
            {
              id: 'gid://shopify/CartLine/1',
              quantity: 1,
              bundleId: { value: 'test-bundle-1' },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/1',
                product: { id: 'gid://shopify/Product/1', title: 'Product 1' }
              },
              cost: undefined as any
            }
          ]
        }
      });

      const result = cartTransformRun(input);

      expect(result.operations).toHaveLength(1); // Should still create operation
      expect(result.operations[0].merge.price).toBeUndefined(); // No discount due to missing cost
    });
  });
});