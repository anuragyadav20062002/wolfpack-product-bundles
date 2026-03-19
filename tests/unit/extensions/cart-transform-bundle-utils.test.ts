/**
 * Unit Tests for Cart Transform Bundle Utils
 * Tests utility functions for bundle processing and validation
 */

import {
  normalizeProductId,
  extractProductIdFromVariantGid,
  getAllBundleDataFromCart,
  checkCartMeetsBundleConditions,
  parseBundleDataFromMetafield,
  getApplicableDiscountRule
} from '../../../extensions/bundle-cart-transform-ts/src/cart-transform-bundle-utils';

describe('Cart Transform Bundle Utils', () => {
  describe('normalizeProductId', () => {
    it('should return GID as-is when already in correct format', () => {
      const gid = 'gid://shopify/Product/123';
      expect(normalizeProductId(gid)).toBe(gid);
    });

    it('should convert numeric ID to GID format', () => {
      expect(normalizeProductId('123')).toBe('gid://shopify/Product/123');
    });

    it('should convert test product IDs to GID format', () => {
      expect(normalizeProductId('product1')).toBe('gid://shopify/Product/1');
      expect(normalizeProductId('product123')).toBe('gid://shopify/Product/123');
    });

    it('should extract GID from string containing GID pattern', () => {
      const input = 'some-prefix-gid://shopify/Product/456-suffix';
      expect(normalizeProductId(input)).toBe('gid://shopify/Product/456');
    });

    it('should handle alphanumeric product identifiers', () => {
      expect(normalizeProductId('abc123')).toBe('gid://shopify/Product/abc123');
      expect(normalizeProductId('test-product')).toBe('gid://shopify/Product/test-product');
    });

    it('should return original ID when normalization fails', () => {
      expect(normalizeProductId('')).toBe('');
      expect(normalizeProductId('invalid@#$%')).toBe('invalid@#$%');
    });

    it('should handle null/undefined inputs', () => {
      expect(normalizeProductId(null as any)).toBe('');
      expect(normalizeProductId(undefined as any)).toBe('');
    });
  });

  describe('extractProductIdFromVariantGid', () => {
    it('should return product GID unchanged', () => {
      const productGid = 'gid://shopify/Product/123';
      expect(extractProductIdFromVariantGid(productGid)).toBe(productGid);
    });

    it('should return variant GID as-is when no product data available', () => {
      const variantGid = 'gid://shopify/ProductVariant/456';

      const result = extractProductIdFromVariantGid(variantGid);

      // The function returns the variant GID unchanged and logs a warning
      // via CartTransformLogger (not console.log), so we just verify the return value
      expect(result).toBe(variantGid);
    });
  });

  describe('getAllBundleDataFromCart', () => {
    it('should detect bundle from bundleConfig metafield', () => {
      const cart = {
        lines: [
          {
            merchandise: {
              __typename: 'ProductVariant',
              id: 'gid://shopify/ProductVariant/1',
              bundleConfig: {
                value: JSON.stringify({
                  id: 'bundle-1',
                  name: 'Test Bundle',
                  allBundleProductIds: ['gid://shopify/Product/1', 'gid://shopify/Product/2'],
                  pricing: {
                    enableDiscount: true,
                    discountMethod: 'percentage_off',
                    rules: [{ minimumQuantity: 2, percentageOff: 10 }]
                  }
                })
              },
              product: {
                id: 'gid://shopify/Product/999',
                title: 'Bundle Product'
              }
            }
          }
        ]
      };

      const shop = {};
      const bundles = getAllBundleDataFromCart(cart, shop);

      expect(bundles).toHaveLength(1);
      expect(bundles[0].id).toBe('bundle-1');
      expect(bundles[0].name).toBe('Test Bundle');
      expect(bundles[0].bundleParentVariantId).toBe('gid://shopify/ProductVariant/1');
    });

    it('should detect bundle from component metafields', () => {
      const cart = {
        lines: [
          {
            merchandise: {
              __typename: 'ProductVariant',
              id: 'gid://shopify/ProductVariant/1',
              componentReference: {
                value: JSON.stringify(['gid://shopify/ProductVariant/2', 'gid://shopify/ProductVariant/3'])
              },
              componentQuantities: {
                value: JSON.stringify([1, 1])
              },
              product: {
                id: 'gid://shopify/Product/999',
                title: 'Bundle Product'
              }
            }
          }
        ]
      };

      const shop = {};
      const bundles = getAllBundleDataFromCart(cart, shop);

      expect(bundles).toHaveLength(1);
      expect(bundles[0].id).toBe('gid://shopify/ProductVariant/1');
      expect(bundles[0].name).toBe('Bundle Product');
      expect(bundles[0].componentReferences).toEqual(['gid://shopify/ProductVariant/2', 'gid://shopify/ProductVariant/3']);
    });

    it('should not detect bundle from legacy product metafield (no longer supported)', () => {
      // Legacy product-level metafield detection was removed.
      // Only componentReference and bundleConfig on the variant are supported.
      const cart = {
        lines: [
          {
            merchandise: {
              __typename: 'ProductVariant',
              id: 'gid://shopify/ProductVariant/1',
              product: {
                id: 'gid://shopify/Product/999',
                title: 'Bundle Product',
                metafield: {
                  value: JSON.stringify({
                    id: 'legacy-bundle',
                    name: 'Legacy Bundle',
                    allBundleProductIds: ['gid://shopify/Product/1']
                  })
                }
              }
            }
          }
        ]
      };

      const shop = {};
      const bundles = getAllBundleDataFromCart(cart, shop);

      expect(bundles).toHaveLength(0);
    });

    it('should not detect bundle from cart line attributes alone (requires metafields)', () => {
      // Cart line attribute detection without componentReference/bundleConfig
      // on the variant is no longer supported. The source only checks variant
      // metafields (componentReference, bundleConfig).
      const cart = {
        lines: [
          {
            merchandise: {
              __typename: 'ProductVariant',
              id: 'gid://shopify/ProductVariant/1',
              product: {
                id: 'gid://shopify/Product/1',
                title: 'Component Product'
              }
            },
            attribute: {
              key: '_wolfpack_bundle_id',
              value: 'widget-bundle-1'
            }
          }
        ]
      };

      const shop = {
        metafield: {
          value: JSON.stringify({
            'widget-bundle-1': {
              name: 'Widget Bundle',
              pricing: {
                enableDiscount: true,
                discountMethod: 'percentage_off',
                rules: [{ numberOfProducts: 2, percentageOff: 15 }]
              }
            }
          })
        }
      };

      const bundles = getAllBundleDataFromCart(cart, shop);

      expect(bundles).toHaveLength(0);
    });

    it('should handle empty cart gracefully', () => {
      const cart = { lines: [] };
      const shop = {};
      const bundles = getAllBundleDataFromCart(cart, shop);

      expect(bundles).toHaveLength(0);
    });

    it('should avoid duplicate bundles', () => {
      const cart = {
        lines: [
          {
            merchandise: {
              __typename: 'ProductVariant',
              id: 'gid://shopify/ProductVariant/1',
              bundleConfig: {
                value: JSON.stringify({
                  id: 'bundle-1',
                  name: 'Test Bundle'
                })
              },
              product: { id: 'gid://shopify/Product/999', title: 'Bundle Product' }
            }
          },
          {
            merchandise: {
              __typename: 'ProductVariant',
              id: 'gid://shopify/ProductVariant/2',
              bundleConfig: {
                value: JSON.stringify({
                  id: 'bundle-1', // Same bundle ID
                  name: 'Test Bundle'
                })
              },
              product: { id: 'gid://shopify/Product/999', title: 'Bundle Product' }
            }
          }
        ]
      };

      const shop = {};
      const bundles = getAllBundleDataFromCart(cart, shop);

      expect(bundles).toHaveLength(1); // Should only have one bundle despite two lines
    });
  });

  describe('checkCartMeetsBundleConditions', () => {
    const mockBundleData = {
      id: 'test-bundle',
      name: 'Test Bundle',
      allBundleProductIds: ['gid://shopify/Product/1', 'gid://shopify/Product/2'],
      bundleParentVariantId: 'gid://shopify/ProductVariant/999',
      pricing: {
        enableDiscount: true,
        discountMethod: 'percentage_off',
        rules: [
          {
            discountOn: 'total',
            minimumQuantity: 2,
            numberOfProducts: 2,
            fixedAmountOff: 0,
            percentageOff: 10
          }
        ]
      }
    };

    it('should find bundle parent line and set up for expansion', () => {
      const cart = {
        lines: [
          {
            id: 'gid://shopify/CartLine/1',
            quantity: 1,
            merchandise: {
              id: 'gid://shopify/ProductVariant/999', // Matches bundleParentVariantId
              product: { id: 'gid://shopify/Product/999', title: 'Bundle Product' }
            },
            cost: {
              totalAmount: { amount: '50.00', currencyCode: 'USD' }
            }
          }
        ]
      };

      const result = checkCartMeetsBundleConditions(cart, mockBundleData);

      expect(result.bundleParentLine).toBeDefined();
      expect(result.bundleParentLine.id).toBe('gid://shopify/CartLine/1');
      expect(result.meetsConditions).toBe(true);
      expect(result.totalBundleQuantity).toBe(1);
      expect(result.totalOriginalCost).toBe(50);
    });

    it('should find component lines and check merge conditions', () => {
      const cart = {
        lines: [
          {
            id: 'gid://shopify/CartLine/1',
            quantity: 1,
            merchandise: {
              id: 'gid://shopify/ProductVariant/1',
              product: { id: 'gid://shopify/Product/1', title: 'Product 1' }
            },
            cost: {
              totalAmount: { amount: '25.00', currencyCode: 'USD' }
            }
          },
          {
            id: 'gid://shopify/CartLine/2',
            quantity: 1,
            merchandise: {
              id: 'gid://shopify/ProductVariant/2',
              product: { id: 'gid://shopify/Product/2', title: 'Product 2' }
            },
            cost: {
              totalAmount: { amount: '30.00', currencyCode: 'USD' }
            }
          }
        ]
      };

      const result = checkCartMeetsBundleConditions(cart, mockBundleData);

      expect(result.componentLines).toHaveLength(2);
      expect(result.meetsConditions).toBe(true);
      expect(result.totalBundleQuantity).toBe(2);
      expect(result.totalOriginalCost).toBe(55);
      expect(result.totalDiscountedCost).toBe(49.5); // 10% discount applied
    });

    it('should handle insufficient quantity for bundle conditions', () => {
      const cart = {
        lines: [
          {
            id: 'gid://shopify/CartLine/1',
            quantity: 1,
            merchandise: {
              id: 'gid://shopify/ProductVariant/1',
              product: { id: 'gid://shopify/Product/1', title: 'Product 1' }
            },
            cost: {
              totalAmount: { amount: '25.00', currencyCode: 'USD' }
            }
          }
        ]
      };

      const result = checkCartMeetsBundleConditions(cart, mockBundleData);

      expect(result.componentLines).toHaveLength(1);
      expect(result.meetsConditions).toBe(false); // Only 1 item, needs 2
      expect(result.totalDiscountedCost).toBe(25); // No discount applied
    });

    it('should match products by bundle ID attribute', () => {
      const cart = {
        lines: [
          {
            id: 'gid://shopify/CartLine/1',
            quantity: 1,
            merchandise: {
              id: 'gid://shopify/ProductVariant/1',
              product: { id: 'gid://shopify/Product/3', title: 'Product 3' }
            },
            attribute: { key: '_wolfpack_bundle_id', value: 'test-bundle' },
            cost: {
              totalAmount: { amount: '20.00', currencyCode: 'USD' }
            }
          },
          {
            id: 'gid://shopify/CartLine/2',
            quantity: 1,
            merchandise: {
              id: 'gid://shopify/ProductVariant/2',
              product: { id: 'gid://shopify/Product/4', title: 'Product 4' }
            },
            attribute: { key: '_wolfpack_bundle_id', value: 'test-bundle' },
            cost: {
              totalAmount: { amount: '25.00', currencyCode: 'USD' }
            }
          }
        ]
      };

      const result = checkCartMeetsBundleConditions(cart, mockBundleData);

      expect(result.componentLines).toHaveLength(2);
      expect(result.meetsConditions).toBe(true);
      expect(result.totalOriginalCost).toBe(45);
    });

    it('should apply fixed amount discount correctly', () => {
      const bundleWithFixedDiscount = {
        ...mockBundleData,
        pricing: {
          enableDiscount: true,
          discountMethod: 'fixed_amount_off',
          rules: [
            {
              discountOn: 'total',
              minimumQuantity: 2,
              fixedAmountOff: 10,
              percentageOff: 0
            }
          ]
        }
      };

      const cart = {
        lines: [
          {
            id: 'gid://shopify/CartLine/1',
            quantity: 1,
            merchandise: {
              id: 'gid://shopify/ProductVariant/1',
              product: { id: 'gid://shopify/Product/1', title: 'Product 1' }
            },
            cost: { totalAmount: { amount: '25.00', currencyCode: 'USD' } }
          },
          {
            id: 'gid://shopify/CartLine/2',
            quantity: 1,
            merchandise: {
              id: 'gid://shopify/ProductVariant/2',
              product: { id: 'gid://shopify/Product/2', title: 'Product 2' }
            },
            cost: { totalAmount: { amount: '30.00', currencyCode: 'USD' } }
          }
        ]
      };

      const result = checkCartMeetsBundleConditions(cart, bundleWithFixedDiscount);

      expect(result.totalOriginalCost).toBe(55);
      expect(result.totalDiscountedCost).toBe(45); // 55 - 10 = 45
    });

    it('should apply fixed bundle price correctly', () => {
      const bundleWithFixedPrice = {
        ...mockBundleData,
        pricing: {
          enableDiscount: true,
          discountMethod: 'fixed_bundle_price',
          fixedPrice: 40,
          rules: [
            {
              discountOn: 'total',
              minimumQuantity: 2,
              fixedAmountOff: 0,
              percentageOff: 0
            }
          ]
        }
      };

      const cart = {
        lines: [
          {
            id: 'gid://shopify/CartLine/1',
            quantity: 1,
            merchandise: {
              id: 'gid://shopify/ProductVariant/1',
              product: { id: 'gid://shopify/Product/1', title: 'Product 1' }
            },
            cost: { totalAmount: { amount: '25.00', currencyCode: 'USD' } }
          },
          {
            id: 'gid://shopify/CartLine/2',
            quantity: 1,
            merchandise: {
              id: 'gid://shopify/ProductVariant/2',
              product: { id: 'gid://shopify/Product/2', title: 'Product 2' }
            },
            cost: { totalAmount: { amount: '30.00', currencyCode: 'USD' } }
          }
        ]
      };

      const result = checkCartMeetsBundleConditions(cart, bundleWithFixedPrice);

      expect(result.totalOriginalCost).toBe(55);
      expect(result.totalDiscountedCost).toBe(40); // Fixed price
    });
  });

  describe('parseBundleDataFromMetafield', () => {
    it('should parse valid bundle data and normalize product IDs', () => {
      const metafieldValue = JSON.stringify({
        id: 'bundle-1',
        name: 'Test Bundle',
        allBundleProductIds: ['123', 'product456', 'gid://shopify/Product/789'],
        pricing: {
          enableDiscount: true,
          discountMethod: 'percentage_off',
          rules: [{ minimumQuantity: 2, percentageOff: 10 }]
        }
      });

      const result = parseBundleDataFromMetafield(metafieldValue);

      expect(result).toBeDefined();
      expect(result!.id).toBe('bundle-1');
      expect(result!.name).toBe('Test Bundle');
      expect(result!.allBundleProductIds).toEqual([
        'gid://shopify/Product/123',
        'gid://shopify/Product/456',
        'gid://shopify/Product/789'
      ]);
    });

    it('should handle invalid JSON gracefully', () => {
      const result = parseBundleDataFromMetafield('invalid-json');
      expect(result).toBeNull();
    });

    it('should handle empty metafield value', () => {
      const result = parseBundleDataFromMetafield('');
      expect(result).toBeNull();
    });
  });

  describe('getApplicableDiscountRule', () => {
    const bundleData = {
      id: 'test-bundle',
      name: 'Test Bundle',
      allBundleProductIds: [],
      pricing: {
        enableDiscount: true,
        discountMethod: 'percentage_off',
        rules: [
          {
            discountOn: 'total',
            minimumQuantity: 2,
            numberOfProducts: 2,
            fixedAmountOff: 0,
            percentageOff: 10
          },
          {
            discountOn: 'total',
            minimumQuantity: 5,
            numberOfProducts: 5,
            fixedAmountOff: 0,
            percentageOff: 20
          }
        ]
      }
    };

    it('should return best applicable rule based on quantity', () => {
      const rule = getApplicableDiscountRule(bundleData, 5);

      expect(rule).toBeDefined();
      expect(rule!.percentageOff).toBe(20); // Higher discount for 5+ items
    });

    it('should return lower tier rule when higher tier not met', () => {
      const rule = getApplicableDiscountRule(bundleData, 3);

      expect(rule).toBeDefined();
      expect(rule!.percentageOff).toBe(10); // Lower discount for 2-4 items
    });

    it('should return null when no rules are applicable', () => {
      const rule = getApplicableDiscountRule(bundleData, 1);
      expect(rule).toBeNull();
    });

    it('should handle bundle with no pricing rules', () => {
      const bundleWithoutRules = {
        ...bundleData,
        pricing: {
          enableDiscount: false,
          discountMethod: 'percentage_off',
          rules: []
        }
      };

      const rule = getApplicableDiscountRule(bundleWithoutRules, 5);
      expect(rule).toBeNull();
    });

    it('should handle bundle with null pricing', () => {
      const bundleWithoutPricing = {
        ...bundleData,
        pricing: null
      };

      const rule = getApplicableDiscountRule(bundleWithoutPricing, 5);
      expect(rule).toBeNull();
    });

    it('should handle legacy numberOfProducts field', () => {
      const bundleWithLegacyField = {
        ...bundleData,
        pricing: {
          enableDiscount: true,
          discountMethod: 'percentage_off',
          rules: [
            {
              discountOn: 'total',
              numberOfProducts: 3, // Legacy field
              fixedAmountOff: 0,
              percentageOff: 15
            }
          ]
        }
      };

      const rule = getApplicableDiscountRule(bundleWithLegacyField as any, 3);

      expect(rule).toBeDefined();
      expect(rule!.percentageOff).toBe(15);
    });
  });
});