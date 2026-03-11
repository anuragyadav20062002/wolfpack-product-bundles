/**
 * Unit Tests for Metafield Validation Service
 * Tests metafield validation, cleanup, and consistency checking
 */

import { mockShopifyAdmin, mockPrismaClient, createMockGraphQLResponse, createMockBundle } from '../../setup';
import { MetafieldValidationService } from '../../../app/services/metafield-validation.server';

// Mock the database — jest.mock is hoisted above imports by Jest, so this
// runs before the MetafieldValidationService import despite appearing after it.
jest.mock('../../../app/db.server', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { mockPrismaClient: client } = require('../../setup');
  return client;
});

describe('MetafieldValidationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateAndCleanShopMetafields', () => {
    const shopId = 'test-shop.myshopify.com';

    it('should validate and clean shop metafields successfully', async () => {
      const activeBundles = [
        createMockBundle({ id: 'bundle-1', name: 'Active Bundle 1' }),
        createMockBundle({ id: 'bundle-2', name: 'Active Bundle 2' })
      ];

      const shopMetafieldValue = JSON.stringify([
        { id: 'bundle-1', name: 'Active Bundle 1' },
        { id: 'bundle-2', name: 'Active Bundle 2' },
        { id: 'bundle-3', name: 'Deleted Bundle' } // This should be removed
      ]);

      mockPrismaClient.bundle.findMany.mockResolvedValue(activeBundles);

      mockShopifyAdmin.graphql
        // Mock shop ID query
        .mockResolvedValueOnce(createMockGraphQLResponse({
          shop: { id: 'gid://shopify/Shop/1' }
        }))
        // Mock shop metafield query
        .mockResolvedValueOnce(createMockGraphQLResponse({
          node: {
            allBundles: {
              id: 'gid://shopify/Metafield/1',
              value: shopMetafieldValue
            }
          }
        }))
        // Mock metafield update
        .mockResolvedValueOnce(createMockGraphQLResponse({
          metafieldsSet: {
            metafields: [
              { id: 'gid://shopify/Metafield/1', key: 'all_bundles', namespace: '$app' }
            ],
            userErrors: []
          }
        }));

      const result = await MetafieldValidationService.validateAndCleanShopMetafields(
        mockShopifyAdmin,
        shopId
      );

      expect(result).toBe(true);
      expect(mockPrismaClient.bundle.findMany).toHaveBeenCalledWith({
        where: { shopId, status: 'active' },
        include: {
          steps: { include: { StepProduct: true } },
          pricing: true
        }
      });

      // Verify metafield was updated to remove inactive bundle
      const updateCall = mockShopifyAdmin.graphql.mock.calls.find(call =>
        call[0].includes('metafieldsSet')
      );
      expect(updateCall).toBeDefined();
      
      const updatedValue = JSON.parse(updateCall[1].variables.metafields[0].value);
      expect(updatedValue).toHaveLength(2);
      expect(updatedValue.find((b: any) => b.id === 'bundle-3')).toBeUndefined();
    });

    it('should handle missing shop metafield', async () => {
      mockPrismaClient.bundle.findMany.mockResolvedValue([]);

      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(createMockGraphQLResponse({
          shop: { id: 'gid://shopify/Shop/1' }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          node: { allBundles: null }
        }));

      const result = await MetafieldValidationService.validateAndCleanShopMetafields(
        mockShopifyAdmin,
        shopId
      );

      expect(result).toBe(false);
    });

    it('should handle malformed metafield JSON', async () => {
      mockPrismaClient.bundle.findMany.mockResolvedValue([]);

      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(createMockGraphQLResponse({
          shop: { id: 'gid://shopify/Shop/1' }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          node: {
            allBundles: {
              id: 'gid://shopify/Metafield/1',
              value: 'invalid-json'
            }
          }
        }));

      const result = await MetafieldValidationService.validateAndCleanShopMetafields(
        mockShopifyAdmin,
        shopId
      );

      expect(result).toBe(false);
    });

    it('should handle metafield update errors', async () => {
      const activeBundles = [createMockBundle({ id: 'bundle-1' })];
      const shopMetafieldValue = JSON.stringify([
        { id: 'bundle-1', name: 'Active Bundle' },
        { id: 'bundle-2', name: 'Deleted Bundle' }
      ]);

      mockPrismaClient.bundle.findMany.mockResolvedValue(activeBundles);

      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(createMockGraphQLResponse({
          shop: { id: 'gid://shopify/Shop/1' }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          node: {
            allBundles: {
              id: 'gid://shopify/Metafield/1',
              value: shopMetafieldValue
            }
          }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          metafieldsSet: {
            metafields: [],
            userErrors: [{ field: 'value', message: 'Invalid JSON' }]
          }
        }));

      const result = await MetafieldValidationService.validateAndCleanShopMetafields(
        mockShopifyAdmin,
        shopId
      );

      expect(result).toBe(false);
    });
  });

  describe('validateProductMetafields', () => {
    const productId = 'gid://shopify/Product/123';
    const shopId = 'test-shop.myshopify.com';

    it('should clean up metafields for products not in active bundles', async () => {
      // Mock no active bundles containing this product
      mockPrismaClient.bundle.findMany.mockResolvedValue([]);

      mockShopifyAdmin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
        metafieldsDelete: {
          deletedMetafields: [
            { key: 'cart_transform_config', namespace: 'bundle_discounts', ownerId: productId }
          ],
          userErrors: []
        }
      }));

      const result = await MetafieldValidationService.validateProductMetafields(
        mockShopifyAdmin,
        productId,
        shopId
      );

      expect(result).toBe(true);
      expect(mockShopifyAdmin.graphql).toHaveBeenCalledWith(
        expect.stringContaining('metafieldsDelete'),
        expect.objectContaining({
          variables: {
            metafields: expect.arrayContaining([
              expect.objectContaining({
                ownerId: productId,
                namespace: 'bundle_discounts',
                key: 'cart_transform_config'
              })
            ])
          }
        })
      );
    });

    it('should keep metafields for products in active bundles', async () => {
      const activeBundles = [
        createMockBundle({
          id: 'bundle-1',
          steps: [{
            id: 'step-1',
            StepProduct: [{ productId: '123' }] // Product is in this bundle
          }]
        })
      ];

      mockPrismaClient.bundle.findMany.mockResolvedValue(activeBundles);

      const result = await MetafieldValidationService.validateProductMetafields(
        mockShopifyAdmin,
        '123', // Product ID without GID prefix
        shopId
      );

      expect(result).toBe(true);
      expect(mockShopifyAdmin.graphql).not.toHaveBeenCalled();
    });

    it('should handle metafield deletion errors', async () => {
      mockPrismaClient.bundle.findMany.mockResolvedValue([]);

      mockShopifyAdmin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
        metafieldsDelete: {
          deletedMetafields: [],
          userErrors: [{ field: 'metafields', message: 'Metafield not found' }]
        }
      }));

      const result = await MetafieldValidationService.validateProductMetafields(
        mockShopifyAdmin,
        productId,
        shopId
      );

      expect(result).toBe(true); // Should still return true as it's not a critical error
    });
  });

  describe('bulkValidateAllProductMetafields', () => {
    const shopId = 'test-shop.myshopify.com';

    it('should validate all products with bundle metafields', async () => {
      const productsWithMetafields = [
        {
          node: {
            id: 'gid://shopify/Product/1',
            title: 'Product 1',
            metafields: { edges: [{ node: { id: 'meta1', key: 'cart_transform_config' } }] },
            customMetafields: { edges: [] }
          }
        },
        {
          node: {
            id: 'gid://shopify/Product/2',
            title: 'Product 2',
            metafields: { edges: [] },
            customMetafields: { edges: [{ node: { id: 'meta2', key: 'component_reference' } }] }
          }
        }
      ];

      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(createMockGraphQLResponse({
          products: { edges: productsWithMetafields }
        }))
        .mockResolvedValue(createMockGraphQLResponse({
          metafieldsDelete: { deletedMetafields: [], userErrors: [] }
        }));

      mockPrismaClient.bundle.findMany.mockResolvedValue([]);

      const result = await MetafieldValidationService.bulkValidateAllProductMetafields(
        mockShopifyAdmin,
        shopId
      );

      expect(result.validatedCount).toBe(2);
      expect(result.cleanedCount).toBe(0);
      expect(mockShopifyAdmin.graphql).toHaveBeenCalledTimes(3); // 1 query + 2 delete calls
    });

    it('should handle products query errors', async () => {
      mockShopifyAdmin.graphql.mockRejectedValueOnce(new Error('Query failed'));

      const result = await MetafieldValidationService.bulkValidateAllProductMetafields(
        mockShopifyAdmin,
        shopId
      );

      expect(result.validatedCount).toBe(0);
      expect(result.cleanedCount).toBe(0);
    });
  });

  describe('auditMetafieldConsistency', () => {
    const shopId = 'test-shop.myshopify.com';

    it('should generate comprehensive audit report', async () => {
      const activeBundles = [
        createMockBundle({ id: 'bundle-1', name: 'Active Bundle 1' })
      ];
      const allBundles = [
        ...activeBundles,
        createMockBundle({ id: 'bundle-2', name: 'Inactive Bundle', status: 'draft' })
      ];

      const metafieldBundles = [
        { id: 'bundle-1', name: 'Active Bundle 1' },
        { id: 'bundle-3', name: 'Orphaned Bundle' } // Not in database
      ];

      mockPrismaClient.bundle.findMany
        .mockResolvedValueOnce(activeBundles) // Active bundles query
        .mockResolvedValueOnce(allBundles); // All bundles query

      mockShopifyAdmin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
        shop: {
          id: 'gid://shopify/Shop/1',
          allBundles: {
            value: JSON.stringify(metafieldBundles)
          }
        }
      }));

      const audit = await MetafieldValidationService.auditMetafieldConsistency(
        mockShopifyAdmin,
        shopId
      );

      expect(audit).toBeDefined();
      expect(audit.database.totalBundles).toBe(2);
      expect(audit.database.activeBundles).toBe(1);
      expect(audit.database.inactiveBundles).toBe(1);
      expect(audit.metafields.totalBundles).toBe(2);
      expect(audit.inconsistencies.bundlesInMetafieldButNotActive).toHaveLength(1);
      expect(audit.inconsistencies.bundlesInMetafieldButNotActive[0].id).toBe('bundle-3');
      expect(audit.inconsistencies.activeBundlesNotInMetafield).toHaveLength(0);
    });

    it('should handle missing shop metafield in audit', async () => {
      mockPrismaClient.bundle.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockShopifyAdmin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
        shop: {
          id: 'gid://shopify/Shop/1',
          allBundles: null
        }
      }));

      const audit = await MetafieldValidationService.auditMetafieldConsistency(
        mockShopifyAdmin,
        shopId
      );

      expect(audit).toBeDefined();
      expect(audit.metafields.totalBundles).toBe(0);
    });

    it('should handle audit errors gracefully', async () => {
      mockPrismaClient.bundle.findMany.mockRejectedValueOnce(new Error('Database error'));

      const audit = await MetafieldValidationService.auditMetafieldConsistency(
        mockShopifyAdmin,
        shopId
      );

      expect(audit).toBeNull();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle null/undefined inputs gracefully', async () => {
      const result = await MetafieldValidationService.validateProductMetafields(
        mockShopifyAdmin,
        null as any,
        'test-shop'
      );

      expect(result).toBe(false);
    });

    it('should handle GraphQL network errors', async () => {
      mockPrismaClient.bundle.findMany.mockResolvedValue([]);
      mockShopifyAdmin.graphql.mockRejectedValue(new Error('Network timeout'));

      const result = await MetafieldValidationService.validateAndCleanShopMetafields(
        mockShopifyAdmin,
        'test-shop'
      );

      expect(result).toBe(false);
    });

    it('should handle database connection errors', async () => {
      mockPrismaClient.bundle.findMany.mockRejectedValue(new Error('Database connection failed'));

      const result = await MetafieldValidationService.validateProductMetafields(
        mockShopifyAdmin,
        'gid://shopify/Product/123',
        'test-shop'
      );

      expect(result).toBe(false);
    });
  });
});