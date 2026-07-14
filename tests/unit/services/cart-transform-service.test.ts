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
  const originalSecret = process.env.SHOPIFY_API_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SHOPIFY_API_SECRET = 'test_api_secret';
  });

  afterAll(() => {
    process.env.SHOPIFY_API_SECRET = originalSecret;
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
              functionId: MOCK_RUST_FUNCTION_ID,
              blockOnFailure: true
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
      const createCall = mockShopifyAdmin.graphql.mock.calls[2];
      expect(createCall[0]).toContain('$blockOnFailure: Boolean!');
      expect(createCall[0]).toContain('blockOnFailure: $blockOnFailure');
      expect(createCall[1]).toEqual({
        variables: {
          functionHandle: 'bundle-cart-transform-rs',
          blockOnFailure: true,
        },
      });
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
                functionId: MOCK_RUST_FUNCTION_ID,
                blockOnFailure: true
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

    it('recreates an existing Rust transform when failure blocking is disabled', async () => {
      const existingTransformId = 'gid://shopify/CartTransform/unsafe';

      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(rustFunctionsMock())
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransforms: {
            edges: [{
              node: {
                id: existingTransformId,
                functionId: MOCK_RUST_FUNCTION_ID,
                blockOnFailure: false,
              }
            }]
          }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransformDelete: { deletedId: existingTransformId, userErrors: [] }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransformCreate: {
            cartTransform: {
              id: 'gid://shopify/CartTransform/safe',
              functionId: MOCK_RUST_FUNCTION_ID,
              blockOnFailure: true,
            },
            userErrors: []
          }
        }));

      const result = await CartTransformService.activateForNewInstallation(
        mockShopifyAdmin,
        shopDomain
      );

      expect(result).toEqual({
        success: true,
        cartTransformId: 'gid://shopify/CartTransform/safe',
      });
      expect(mockShopifyAdmin.graphql).toHaveBeenCalledTimes(4);
    });

    it('replaces a transform that points to a different function', async () => {
      const existingTransformId = 'gid://shopify/CartTransform/stale';

      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(rustFunctionsMock())
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransforms: {
            edges: [{
              node: {
                id: existingTransformId,
                functionId: 'gid://shopify/ShopifyFunction/old',
                blockOnFailure: true,
              }
            }]
          }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransformDelete: { deletedId: existingTransformId, userErrors: [] }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransformCreate: {
            cartTransform: {
              id: 'gid://shopify/CartTransform/current',
              functionId: MOCK_RUST_FUNCTION_ID,
              blockOnFailure: true,
            },
            userErrors: []
          }
        }));

      const result = await CartTransformService.activateForNewInstallation(
        mockShopifyAdmin,
        shopDomain
      );

      expect(result).toEqual({
        success: true,
        cartTransformId: 'gid://shopify/CartTransform/current',
      });
      expect(mockShopifyAdmin.graphql).toHaveBeenCalledTimes(4);
    });

    it('returns failure without creating when an unsafe transform cannot be deleted', async () => {
      const existingTransformId = 'gid://shopify/CartTransform/unsafe';

      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(rustFunctionsMock())
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransforms: {
            edges: [{
              node: {
                id: existingTransformId,
                functionId: MOCK_RUST_FUNCTION_ID,
                blockOnFailure: false,
              }
            }]
          }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransformDelete: {
            deletedId: null,
            userErrors: [{ field: ['id'], message: 'Delete rejected' }],
          }
        }));

      const result = await CartTransformService.activateForNewInstallation(
        mockShopifyAdmin,
        shopDomain
      );

      expect(result).toEqual({
        success: false,
        cartTransformId: existingTransformId,
        error: 'Could not replace unsafe CartTransform',
      });
      expect(mockShopifyAdmin.graphql).toHaveBeenCalledTimes(3);
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
              functionId: MOCK_RUST_FUNCTION_ID,
              blockOnFailure: true
            },
            userErrors: []
          }
        }))
        // 4. syncRuntimeTokenSecret
        .mockResolvedValueOnce(createMockGraphQLResponse({
          metafieldsSet: {
            metafields: [{ key: 'runtime_token_secret', namespace: 'app', value: 'secret' }],
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

  describe('syncCartLineMessagingSettings', () => {
    const shopDomain = 'test-shop.myshopify.com';

    it('writes cart-line messaging settings and runtime token secret to the cart transform owner metafields', async () => {
      mockShopifyAdmin.graphql
        // 1. getRustFunctionId
        .mockResolvedValueOnce(rustFunctionsMock())
        // 2. checkExisting — transform already exists pointing to the Rust function
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransforms: {
            edges: [{
              node: {
                id: 'gid://shopify/CartTransform/existing',
                functionId: MOCK_RUST_FUNCTION_ID,
                blockOnFailure: true
              }
            }]
          }
        }))
        // 3. metafieldsSet
        .mockResolvedValueOnce(createMockGraphQLResponse({
          metafieldsSet: {
            metafields: [{
              key: 'bundle_cart_line_messaging',
              namespace: 'app',
              value: '{}'
            }],
            userErrors: []
          }
        }));

      const settings = {
        isEnabled: true,
        showBundleContains: false,
        showOriginalPrice: false,
        discountDisplay: {
          isEnabled: false,
          format: 'amount_percentage'
        }
      };

      const result = await CartTransformService.syncCartLineMessagingSettings(
        mockShopifyAdmin,
        shopDomain,
        settings
      );

      expect(result.success).toBe(true);
      expect(result.cartTransformId).toBe('gid://shopify/CartTransform/existing');
      const metafieldsCall = mockShopifyAdmin.graphql.mock.calls[2];
      expect(metafieldsCall[0]).toContain('metafieldsSet');
      expect(metafieldsCall[1].variables.metafields).toEqual([
        {
          ownerId: 'gid://shopify/CartTransform/existing',
          namespace: '$app',
          key: 'bundle_cart_line_messaging',
          type: 'json',
          value: JSON.stringify(settings)
        },
        {
          ownerId: 'gid://shopify/CartTransform/existing',
          namespace: '$app',
          key: 'runtime_token_secret',
          type: 'single_line_text_field',
          value: expect.any(String)
        }
      ]);
      expect(metafieldsCall[1].variables.metafields[1].value).toHaveLength(64);
    });

    it('returns a failed result when metafield sync reports user errors', async () => {
      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(rustFunctionsMock())
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransforms: {
            edges: [{
              node: {
                id: 'gid://shopify/CartTransform/existing',
                functionId: MOCK_RUST_FUNCTION_ID,
                blockOnFailure: true
              }
            }]
          }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          metafieldsSet: {
            metafields: [],
            userErrors: [{ field: ['metafields', '0', 'value'], message: 'Invalid JSON' }]
          }
        }));

      const result = await CartTransformService.syncCartLineMessagingSettings(
        mockShopifyAdmin,
        shopDomain,
        { isEnabled: true }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
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
