/**
 * Unit Tests for Bundle Product Manager Service
 * Tests bundle product creation, publishing, and management functionality
 */

import { BundleProductManagerService } from '../../../app/services/bundle-product-manager.server';
import { mockShopifyAdmin, createMockGraphQLResponse, createMockBundle } from '../../setup';

describe('BundleProductManagerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAndPublishBundleProduct', () => {
    const mockBundle = createMockBundle({
      name: 'Test Bundle',
      pricing: {
        enabled: true,
        method: 'percentage_off',
        rules: [{ discountValue: 10 }]
      }
    });

    const mockComponentProducts = [
      { id: 'gid://shopify/Product/1', minQuantity: 1 },
      { id: 'gid://shopify/Product/2', minQuantity: 1 }
    ];

    it('should create and publish a bundle product successfully', async () => {
      // Mock product price queries
      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(createMockGraphQLResponse({
          product: {
            variants: {
              edges: [{ node: { price: '25.00' } }]
            }
          }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          product: {
            variants: {
              edges: [{ node: { price: '15.00' } }]
            }
          }
        }))
        // Mock product creation
        .mockResolvedValueOnce(createMockGraphQLResponse({
          productCreate: {
            product: {
              id: 'gid://shopify/Product/999',
              title: 'Test Bundle - Bundle',
              handle: 'test-bundle-bundle-123',
              status: 'ACTIVE',
              variants: {
                edges: [{ node: { id: 'gid://shopify/ProductVariant/999', price: '36.00' } }]
              }
            },
            userErrors: []
          }
        }))
        // Mock publications query
        .mockResolvedValueOnce(createMockGraphQLResponse({
          publications: {
            edges: [
              { node: { id: 'gid://shopify/Publication/1', name: 'Online Store', app: null } }
            ]
          }
        }))
        // Mock publish mutation
        .mockResolvedValueOnce(createMockGraphQLResponse({
          publishablePublish: {
            publishable: { availablePublicationCount: 1, publicationCount: 1 },
            userErrors: []
          }
        }))
        // Mock metafields set
        .mockResolvedValueOnce(createMockGraphQLResponse({
          metafieldsSet: {
            metafields: [
              { id: 'gid://shopify/Metafield/1', key: 'bundle_id', namespace: '$app:bundle_isolation' }
            ],
            userErrors: []
          }
        }));

      const result = await BundleProductManagerService.createAndPublishBundleProduct(
        mockShopifyAdmin,
        mockBundle,
        mockComponentProducts
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('gid://shopify/Product/999');
      expect(result.title).toBe('Test Bundle - Bundle');
      expect(mockShopifyAdmin.graphql).toHaveBeenCalledTimes(6);
    });

    it('should calculate bundle price correctly with percentage discount', async () => {
      // Mock product prices
      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(createMockGraphQLResponse({
          product: { variants: { edges: [{ node: { price: '20.00' } }] } }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          product: { variants: { edges: [{ node: { price: '30.00' } }] } }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          productCreate: {
            product: {
              id: 'gid://shopify/Product/999',
              title: 'Test Bundle - Bundle',
              variants: { edges: [{ node: { id: 'gid://shopify/ProductVariant/999', price: '45.00' } }] }
            },
            userErrors: []
          }
        }))
        .mockResolvedValue(createMockGraphQLResponse({}));

      await BundleProductManagerService.createAndPublishBundleProduct(
        mockShopifyAdmin,
        mockBundle,
        mockComponentProducts
      );

      // Verify the product creation call includes correct pricing
      const productCreateCall = mockShopifyAdmin.graphql.mock.calls.find(call => 
        call[0].includes('productCreate')
      );
      expect(productCreateCall).toBeDefined();
      
      const variables = productCreateCall[1].variables;
      expect(parseFloat(variables.input.variants[0].price)).toBe(45.00); // 50 * 0.9 = 45
    });

    it('should handle product creation errors gracefully', async () => {
      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(createMockGraphQLResponse({
          product: { variants: { edges: [{ node: { price: '25.00' } }] } }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          product: { variants: { edges: [{ node: { price: '15.00' } }] } }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          productCreate: {
            product: null,
            userErrors: [{ field: 'title', message: 'Title cannot be blank' }]
          }
        }));

      const result = await BundleProductManagerService.createAndPublishBundleProduct(
        mockShopifyAdmin,
        mockBundle,
        mockComponentProducts
      );

      expect(result).toBeNull();
    });

    it('should handle missing product prices with fallback', async () => {
      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(createMockGraphQLResponse({ product: null }))
        .mockResolvedValueOnce(createMockGraphQLResponse({ product: null }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          productCreate: {
            product: {
              id: 'gid://shopify/Product/999',
              title: 'Test Bundle - Bundle',
              variants: { edges: [{ node: { price: '1.00' } }] }
            },
            userErrors: []
          }
        }))
        .mockResolvedValue(createMockGraphQLResponse({}));

      await BundleProductManagerService.createAndPublishBundleProduct(
        mockShopifyAdmin,
        mockBundle,
        mockComponentProducts
      );

      const productCreateCall = mockShopifyAdmin.graphql.mock.calls.find(call => 
        call[0].includes('productCreate')
      );
      const variables = productCreateCall[1].variables;
      expect(variables.input.variants[0].price).toBe('1.00'); // Fallback price
    });
  });

  describe('updateBundleProductConfiguration', () => {
    it('should update bundle product price and configuration', async () => {
      const bundleProductId = 'gid://shopify/Product/999';
      const mockBundle = createMockBundle();
      const mockComponentProducts = [
        { id: 'gid://shopify/Product/1', minQuantity: 2 }
      ];

      mockShopifyAdmin.graphql
        // Mock product price query
        .mockResolvedValueOnce(createMockGraphQLResponse({
          product: { variants: { edges: [{ node: { price: '20.00' } }] } }
        }))
        // Mock variant ID query
        .mockResolvedValueOnce(createMockGraphQLResponse({
          product: {
            variants: { edges: [{ node: { id: 'gid://shopify/ProductVariant/999' } }] }
          }
        }))
        // Mock variant update
        .mockResolvedValueOnce(createMockGraphQLResponse({
          productVariantUpdate: {
            productVariant: { id: 'gid://shopify/ProductVariant/999', price: '40.00' },
            userErrors: []
          }
        }));

      const result = await BundleProductManagerService.updateBundleProductConfiguration(
        mockShopifyAdmin,
        bundleProductId,
        mockBundle,
        mockComponentProducts
      );

      expect(result).toBe(true);
      expect(mockShopifyAdmin.graphql).toHaveBeenCalledTimes(3);
    });

    it('should handle variant update errors', async () => {
      const bundleProductId = 'gid://shopify/Product/999';
      const mockBundle = createMockBundle();
      const mockComponentProducts = [{ id: 'gid://shopify/Product/1', minQuantity: 1 }];

      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(createMockGraphQLResponse({
          product: { variants: { edges: [{ node: { price: '20.00' } }] } }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          product: { variants: { edges: [{ node: { id: 'gid://shopify/ProductVariant/999' } }] } }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          productVariantUpdate: {
            productVariant: null,
            userErrors: [{ field: 'price', message: 'Price must be positive' }]
          }
        }));

      const result = await BundleProductManagerService.updateBundleProductConfiguration(
        mockShopifyAdmin,
        bundleProductId,
        mockBundle,
        mockComponentProducts
      );

      expect(result).toBe(false);
    });
  });

  describe('deleteBundleProduct', () => {
    it('should delete bundle product successfully', async () => {
      const productId = 'gid://shopify/Product/999';

      mockShopifyAdmin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
        productDelete: {
          deletedProductId: productId,
          userErrors: []
        }
      }));

      const result = await BundleProductManagerService.deleteBundleProduct(
        mockShopifyAdmin,
        productId
      );

      expect(result).toBe(true);
      expect(mockShopifyAdmin.graphql).toHaveBeenCalledWith(
        expect.stringContaining('productDelete'),
        { variables: { input: { id: productId } } }
      );
    });

    it('should handle deletion errors', async () => {
      const productId = 'gid://shopify/Product/999';

      mockShopifyAdmin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
        productDelete: {
          deletedProductId: null,
          userErrors: [{ field: 'id', message: 'Product not found' }]
        }
      }));

      const result = await BundleProductManagerService.deleteBundleProduct(
        mockShopifyAdmin,
        productId
      );

      expect(result).toBe(false);
    });
  });

  describe('pricing calculations', () => {
    it('should calculate fixed amount discount correctly', async () => {
      const mockBundle = createMockBundle({
        pricing: {
          enabled: true,
          method: 'fixed_amount_off',
          rules: [{ discountValue: 5 }]
        }
      });

      const mockComponentProducts = [
        { id: 'gid://shopify/Product/1', minQuantity: 1 }
      ];

      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(createMockGraphQLResponse({
          product: { variants: { edges: [{ node: { price: '25.00' } }] } }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          productCreate: {
            product: {
              id: 'gid://shopify/Product/999',
              variants: { edges: [{ node: { price: '20.00' } }] }
            },
            userErrors: []
          }
        }))
        .mockResolvedValue(createMockGraphQLResponse({}));

      await BundleProductManagerService.createAndPublishBundleProduct(
        mockShopifyAdmin,
        mockBundle,
        mockComponentProducts
      );

      const productCreateCall = mockShopifyAdmin.graphql.mock.calls.find(call => 
        call[0].includes('productCreate')
      );
      const variables = productCreateCall[1].variables;
      expect(variables.input.variants[0].price).toBe('20.00'); // 25 - 5 = 20
    });

    it('should calculate fixed bundle price correctly', async () => {
      const mockBundle = createMockBundle({
        pricing: {
          enabled: true,
          method: 'fixed_bundle_price',
          rules: [{ discountValue: 30 }]
        }
      });

      const mockComponentProducts = [
        { id: 'gid://shopify/Product/1', minQuantity: 1 }
      ];

      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(createMockGraphQLResponse({
          product: { variants: { edges: [{ node: { price: '50.00' } }] } }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          productCreate: {
            product: {
              id: 'gid://shopify/Product/999',
              variants: { edges: [{ node: { price: '30.00' } }] }
            },
            userErrors: []
          }
        }))
        .mockResolvedValue(createMockGraphQLResponse({}));

      await BundleProductManagerService.createAndPublishBundleProduct(
        mockShopifyAdmin,
        mockBundle,
        mockComponentProducts
      );

      const productCreateCall = mockShopifyAdmin.graphql.mock.calls.find(call => 
        call[0].includes('productCreate')
      );
      const variables = productCreateCall[1].variables;
      expect(variables.input.variants[0].price).toBe('30.00'); // Fixed price
    });

    it('should enforce minimum price of 0.01', async () => {
      const mockBundle = createMockBundle({
        pricing: {
          enabled: true,
          method: 'fixed_amount_off',
          rules: [{ discountValue: 100 }] // Discount larger than product price
        }
      });

      const mockComponentProducts = [
        { id: 'gid://shopify/Product/1', minQuantity: 1 }
      ];

      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(createMockGraphQLResponse({
          product: { variants: { edges: [{ node: { price: '5.00' } }] } }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          productCreate: {
            product: {
              id: 'gid://shopify/Product/999',
              variants: { edges: [{ node: { price: '0.01' } }] }
            },
            userErrors: []
          }
        }))
        .mockResolvedValue(createMockGraphQLResponse({}));

      await BundleProductManagerService.createAndPublishBundleProduct(
        mockShopifyAdmin,
        mockBundle,
        mockComponentProducts
      );

      const productCreateCall = mockShopifyAdmin.graphql.mock.calls.find(call => 
        call[0].includes('productCreate')
      );
      const variables = productCreateCall[1].variables;
      expect(variables.input.variants[0].price).toBe('0.01'); // Minimum price enforced
    });
  });
});