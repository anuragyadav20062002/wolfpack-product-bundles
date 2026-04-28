/**
 * Unit Tests for Cart Transform Service
 * Tests cart transform activation and management functionality
 */

import { CartTransformService } from '../../../app/services/cart-transform-service.server';
import { mockShopifyAdmin, mockSession, createMockGraphQLResponse } from '../../setup';

// The Rust function ID returned by the shopifyFunctions query mock
const MOCK_RUST_FUNCTION_ID = 'gid://shopify/ShopifyFunction/rust-1';

/** Mock for the getRustFunctionId() internal call (shopifyFunctions query) */
function rustFunctionsMock() {
  return createMockGraphQLResponse({
    shopifyFunctions: {
      edges: [{
        node: {
          id: MOCK_RUST_FUNCTION_ID,
          title: 'Bundle Cart Transform (Rust)',
          apiType: 'cart_transform',
          description: 'Wolfpack Bundles Rust/WASM port',
        }
      }]
    }
  });
}

/** Mock that returns no matching Shopify function (simulates function not deployed) */
function rustFunctionsEmptyMock() {
  return createMockGraphQLResponse({
    shopifyFunctions: { edges: [] }
  });
}

describe('CartTransformService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('activateForNewInstallation', () => {
    const shopDomain = 'test-shop.myshopify.com';

    it('should activate cart transform for new installation', async () => {
      mockShopifyAdmin.graphql
        // 1. getRustFunctionId
        .mockResolvedValueOnce(rustFunctionsMock())
        // 2. checkExisting — no existing transform
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransforms: { edges: [] }
        }))
        // 3. createCartTransform
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransformCreate: {
            cartTransform: {
              id: 'gid://shopify/CartTransform/1',
              functionId: MOCK_RUST_FUNCTION_ID
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
      expect(mockShopifyAdmin.graphql).toHaveBeenCalledTimes(3);
    });

    it('should detect existing cart transform already on Rust function', async () => {
      const existingTransformId = 'gid://shopify/CartTransform/existing';

      mockShopifyAdmin.graphql
        // 1. getRustFunctionId
        .mockResolvedValueOnce(rustFunctionsMock())
        // 2. checkExisting — transform already exists pointing to the Rust function
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransforms: {
            edges: [{
              node: {
                id: existingTransformId,
                functionId: MOCK_RUST_FUNCTION_ID
              }
            }]
          }
        }));

      const result = await CartTransformService.activateForNewInstallation(
        mockShopifyAdmin,
        shopDomain
      );

      expect(result.success).toBe(true);
      expect(result.cartTransformId).toBe(existingTransformId);
      expect(result.alreadyExists).toBe(true);
      expect(mockShopifyAdmin.graphql).toHaveBeenCalledTimes(2);
    });

    it('should handle cart transform creation errors', async () => {
      mockShopifyAdmin.graphql
        // 1. getRustFunctionId
        .mockResolvedValueOnce(rustFunctionsMock())
        // 2. checkExisting — no existing transform
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransforms: { edges: [] }
        }))
        // 3. createCartTransform — userErrors returned
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
        // 1. getRustFunctionId
        .mockResolvedValueOnce(rustFunctionsMock())
        // 2. checkExisting — no existing transform
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransforms: { edges: [] }
        }))
        // 3. createCartTransform — GraphQL errors
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
      mockShopifyAdmin.graphql
        // 1. getRustFunctionId succeeds
        .mockResolvedValueOnce(rustFunctionsMock())
        // 2. checkExisting — network error (caught internally, returns {exists: false})
        .mockRejectedValueOnce(new Error('Network error'))
        // 3. createCartTransform — network error (propagates to outer catch)
        .mockRejectedValueOnce(new Error('Network error'));

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
        // 1. getRustFunctionId
        .mockResolvedValueOnce(rustFunctionsMock())
        // 2. checkExisting — no existing transform
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransforms: { edges: [] }
        }))
        // 3. createCartTransform
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransformCreate: {
            cartTransform: {
              id: 'gid://shopify/CartTransform/1',
              functionId: MOCK_RUST_FUNCTION_ID
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
        // 1. getRustFunctionId
        .mockResolvedValueOnce(rustFunctionsMock())
        // 2. checkExisting — no existing transform
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransforms: { edges: [] }
        }))
        // 3. createCartTransform — throws
        .mockRejectedValueOnce(new Error('Setup failed'));

      const result = await CartTransformService.completeSetup(
        mockShopifyAdmin,
        shopDomain
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Setup failed');
    });
  });

  describe('function ID resolution', () => {
    it('should return failure when Rust function is not deployed', async () => {
      // getRustFunctionId returns null (empty edges — function not found)
      mockShopifyAdmin.graphql.mockResolvedValueOnce(rustFunctionsEmptyMock());

      const result = await CartTransformService.activateForNewInstallation(
        mockShopifyAdmin,
        'test-shop.myshopify.com'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('bundle-cart-transform-rs');
    });
  });

  describe('edge cases', () => {
    it('should handle malformed GraphQL responses', async () => {
      mockShopifyAdmin.graphql
        // 1. getRustFunctionId — malformed (no data) → returns null internally
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue({
            // Missing data property entirely
            shopifyFunctions: { edges: [] }
          })
        });

      const result = await CartTransformService.activateForNewInstallation(
        mockShopifyAdmin,
        'test-shop.myshopify.com'
      );

      expect(result.success).toBe(false);
    });

    it('should handle empty shop domain', async () => {
      mockShopifyAdmin.graphql
        // 1. getRustFunctionId
        .mockResolvedValueOnce(rustFunctionsMock())
        // 2. checkExisting — no existing transform
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransforms: { edges: [] }
        }))
        // 3. createCartTransform — throws
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

export {};
