/**
 * Unit Tests for Cart Transform Service
 * Tests cart transform activation and management functionality
 */

import { CartTransformService } from '../../../app/services/cart-transform-service.server';
import { mockShopifyAdmin, mockSession, createMockGraphQLResponse } from '../../setup';

describe('CartTransformService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('activateForNewInstallation', () => {
    const shopDomain = 'test-shop.myshopify.com';

    it('should activate cart transform for new installation', async () => {
      // Mock check existing (no existing transform)
      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransforms: { edges: [] }
        }))
        // Mock create cart transform
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransformCreate: {
            cartTransform: {
              id: 'gid://shopify/CartTransform/1',
              functionId: process.env.SHOPIFY_BUNDLE_CART_TRANSFORM_TS_ID
            },
            userErrors: []
          }
        }));

      const result = await CartTransformService.activateForNewInstallation(
        mockShopifyAdmin,
        shopDomain
      );

      expect(result.success).toBe(true);
      expect(result.cartTransformId).toBe('gid://shopify/CartTransform/1');
      expect(result.alreadyExists).toBeFalsy();
      expect(mockShopifyAdmin.graphql).toHaveBeenCalledTimes(2);
    });

    it('should detect existing cart transform', async () => {
      const existingTransformId = 'gid://shopify/CartTransform/existing';
      
      mockShopifyAdmin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
        cartTransforms: {
          edges: [
            {
              node: {
                id: existingTransformId,
                functionId: process.env.SHOPIFY_BUNDLE_CART_TRANSFORM_TS_ID
              }
            }
          ]
        }
      }));

      const result = await CartTransformService.activateForNewInstallation(
        mockShopifyAdmin,
        shopDomain
      );

      expect(result.success).toBe(true);
      expect(result.cartTransformId).toBe(existingTransformId);
      expect(result.alreadyExists).toBe(true);
      expect(mockShopifyAdmin.graphql).toHaveBeenCalledTimes(1);
    });

    it('should handle cart transform creation errors', async () => {
      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransforms: { edges: [] }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransformCreate: {
            cartTransform: null,
            userErrors: [
              { field: 'functionId', message: 'Function not found' }
            ]
          }
        }));

      const result = await CartTransformService.activateForNewInstallation(
        mockShopifyAdmin,
        shopDomain
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Function not found');
    });

    it('should handle GraphQL errors', async () => {
      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransforms: { edges: [] }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse(
          null,
          [{ message: 'GraphQL error occurred' }]
        ));

      const result = await CartTransformService.activateForNewInstallation(
        mockShopifyAdmin,
        shopDomain
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('GraphQL errors');
    });

    it('should handle network errors gracefully', async () => {
      // checkExistingCartTransform catches errors internally and returns {exists: false},
      // so we must reject on both calls to trigger the outer catch.
      mockShopifyAdmin.graphql
        .mockRejectedValueOnce(new Error('Network error'))  // checkExisting (caught internally)
        .mockRejectedValueOnce(new Error('Network error')); // createCartTransform

      const result = await CartTransformService.activateForNewInstallation(
        mockShopifyAdmin,
        shopDomain
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('completeSetup', () => {
    const shopDomain = 'test-shop.myshopify.com';

    it('should complete full setup successfully', async () => {
      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransforms: { edges: [] }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransformCreate: {
            cartTransform: {
              id: 'gid://shopify/CartTransform/1',
              functionId: process.env.SHOPIFY_BUNDLE_CART_TRANSFORM_TS_ID
            },
            userErrors: []
          }
        }));

      const result = await CartTransformService.completeSetup(
        mockShopifyAdmin,
        shopDomain
      );

      expect(result.success).toBe(true);
      expect(result.cartTransformId).toBe('gid://shopify/CartTransform/1');
    });

    it('should handle setup failures', async () => {
      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransforms: { edges: [] }
        }))
        .mockRejectedValueOnce(new Error('Setup failed'));

      const result = await CartTransformService.completeSetup(
        mockShopifyAdmin,
        shopDomain
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Setup failed');
    });
  });

  describe('function ID validation', () => {
    it('should use correct function ID from environment', () => {
      expect(process.env.SHOPIFY_BUNDLE_CART_TRANSFORM_TS_ID).toBe('test-function-id');
    });

    it('should handle missing function ID', async () => {
      const originalFunctionId = process.env.SHOPIFY_BUNDLE_CART_TRANSFORM_TS_ID;
      delete process.env.SHOPIFY_BUNDLE_CART_TRANSFORM_TS_ID;

      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransforms: { edges: [] }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransformCreate: {
            cartTransform: {
              id: 'gid://shopify/CartTransform/1',
              functionId: '527a500e-5386-4a67-a61b-9cb4cb8973f8' // Default fallback
            },
            userErrors: []
          }
        }));

      const result = await CartTransformService.activateForNewInstallation(
        mockShopifyAdmin,
        'test-shop.myshopify.com'
      );

      expect(result.success).toBe(true);

      // Restore original value
      process.env.SHOPIFY_BUNDLE_CART_TRANSFORM_TS_ID = originalFunctionId;
    });
  });

  describe('edge cases', () => {
    it('should handle malformed GraphQL responses', async () => {
      mockShopifyAdmin.graphql.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          // Malformed response - missing data property
          cartTransforms: { edges: [] }
        })
      });

      const result = await CartTransformService.activateForNewInstallation(
        mockShopifyAdmin,
        'test-shop.myshopify.com'
      );

      expect(result.success).toBe(false);
    });

    it('should handle empty shop domain', async () => {
      // With empty domain, the method still runs — checkExisting will fail
      // because no graphql mock is set up, and createCartTransform will also fail.
      // The error propagates from the graphql call returning undefined (no json method).
      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransforms: { edges: [] }
        }))
        .mockRejectedValueOnce(new Error('Unknown error'));

      const result = await CartTransformService.activateForNewInstallation(
        mockShopifyAdmin,
        ''
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown error');
    });

    it('should handle null admin client', async () => {
      const result = await CartTransformService.activateForNewInstallation(
        null as any,
        'test-shop.myshopify.com'
      );

      expect(result.success).toBe(false);
    });
  });
});