/**
 * Unit Tests for Bundle Product Manager API Route
 * Tests API endpoints for bundle product management
 */

import { describe, it, beforeEach } from 'node:test';
import { action, loader } from '../../../app/routes/api.bundle-product-manager';
import { mockShopifyAdmin, mockSession, mockPrismaClient, createMockGraphQLResponse, createMockBundle } from '../../setup';

// Mock dependencies
jest.mock('../../../app/shopify.server', () => ({
  authenticate: {
    admin: jest.fn().mockResolvedValue({
      admin: mockShopifyAdmin,
      session: mockSession
    })
  }
}));

jest.mock('../../../app/db.server', () => mockPrismaClient);

jest.mock('../../../app/services/bundle-product-manager.server', () => ({
  BundleProductManagerService: {
    createAndPublishBundleProduct: jest.fn(),
    updateBundleProductConfiguration: jest.fn(),
    deleteBundleProduct: jest.fn()
  }
}));

jest.mock('../../../app/services/bundle-isolation.server', () => ({
  BundleIsolationService: {
    createBundleProductIsolationMetafields: jest.fn(),
    updateBundleProductMetafield: jest.fn(),
    getBundleForProduct: jest.fn(),
    auditBundleIsolation: jest.fn()
  }
}));

const { BundleProductManagerService } = require('../../../app/services/bundle-product-manager.server');
const { BundleIsolationService } = require('../../../app/services/bundle-isolation.server');

describe('Bundle Product Manager API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('action function', () => {
    const createMockRequest = (action: string, additionalData: Record<string, string> = {}) => {
      const formData = new FormData();
      formData.append('action', action);
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });

      return {
        formData: jest.fn().mockResolvedValue(formData)
      } as any;
    };

    describe('create_bundle_product action', () => {
      it('should create bundle product successfully', async () => {
        const bundleId = 'test-bundle-1';
        const mockBundle = createMockBundle({ id: bundleId });
        
        mockPrismaClient.bundle.findUnique.mockResolvedValue({
          ...mockBundle,
          steps: [{
            StepProduct: [
              { productId: 'gid://shopify/Product/1', title: 'Product 1', minQuantity: 1, maxQuantity: 1 }
            ]
          }],
          pricing: { enabled: true }
        });

        mockPrismaClient.bundle.update.mockResolvedValue(mockBundle);

        BundleProductManagerService.createAndPublishBundleProduct.mockResolvedValue({
          id: 'gid://shopify/Product/999',
          title: 'Test Bundle - Bundle',
          handle: 'test-bundle-bundle',
          status: 'ACTIVE'
        });

        BundleIsolationService.createBundleProductIsolationMetafields.mockResolvedValue(true);
        BundleIsolationService.updateBundleProductMetafield.mockResolvedValue(true);

        const request = createMockRequest('create_bundle_product', { bundleId });
        const response = await action({ request });
        const data = await response.json();

        expect(data.success).toBe(true);
        expect(data.bundleProduct.id).toBe('gid://shopify/Product/999');
        expect(mockPrismaClient.bundle.findUnique).toHaveBeenCalledWith({
          where: { id: bundleId, shopId: mockSession.shop },
          include: {
            steps: { include: { StepProduct: true } },
            pricing: true
          }
        });
      });

      it('should return error when bundleId is missing', async () => {
        const request = createMockRequest('create_bundle_product');
        const response = await action({ request });
        const data = await response.json();

        expect(data.success).toBe(false);
        expect(data.error).toBe('bundleId is required');
        expect(response.status).toBe(400);
      });

      it('should return error when bundle not found', async () => {
        mockPrismaClient.bundle.findUnique.mockResolvedValue(null);

        const request = createMockRequest('create_bundle_product', { bundleId: 'nonexistent' });
        const response = await action({ request });
        const data = await response.json();

        expect(data.success).toBe(false);
        expect(data.error).toBe('Bundle not found');
        expect(response.status).toBe(404);
      });

      it('should return error when bundle already has a product', async () => {
        const mockBundle = createMockBundle({ shopifyProductId: 'gid://shopify/Product/existing' });
        mockPrismaClient.bundle.findUnique.mockResolvedValue(mockBundle);

        const request = createMockRequest('create_bundle_product', { bundleId: 'test-bundle' });
        const response = await action({ request });
        const data = await response.json();

        expect(data.success).toBe(false);
        expect(data.error).toBe('Bundle already has a bundle product');
        expect(response.status).toBe(400);
      });

      it('should return error when bundle has no component products', async () => {
        const mockBundle = createMockBundle();
        mockPrismaClient.bundle.findUnique.mockResolvedValue({
          ...mockBundle,
          steps: [],
          pricing: null
        });

        const request = createMockRequest('create_bundle_product', { bundleId: 'test-bundle' });
        const response = await action({ request });
        const data = await response.json();

        expect(data.success).toBe(false);
        expect(data.error).toBe('Bundle must have at least one component product');
        expect(response.status).toBe(400);
      });

      it('should handle bundle product creation failure', async () => {
        const mockBundle = createMockBundle();
        mockPrismaClient.bundle.findUnique.mockResolvedValue({
          ...mockBundle,
          steps: [{
            StepProduct: [{ productId: 'gid://shopify/Product/1', title: 'Product 1', minQuantity: 1, maxQuantity: 1 }]
          }],
          pricing: null
        });

        BundleProductManagerService.createAndPublishBundleProduct.mockResolvedValue(null);

        const request = createMockRequest('create_bundle_product', { bundleId: 'test-bundle' });
        const response = await action({ request });
        const data = await response.json();

        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to create bundle product');
        expect(response.status).toBe(500);
      });
    });

    describe('update_bundle_product action', () => {
      it('should update bundle product successfully', async () => {
        const bundleId = 'test-bundle-1';
        const mockBundle = createMockBundle({ 
          id: bundleId, 
          shopifyProductId: 'gid://shopify/Product/999' 
        });
        
        mockPrismaClient.bundle.findUnique.mockResolvedValue({
          ...mockBundle,
          steps: [{
            StepProduct: [
              { productId: 'gid://shopify/Product/1', title: 'Product 1', minQuantity: 1, maxQuantity: 1 }
            ]
          }],
          pricing: { enabled: true }
        });

        BundleProductManagerService.updateBundleProductConfiguration.mockResolvedValue(true);
        BundleIsolationService.updateBundleProductMetafield.mockResolvedValue(true);

        const request = createMockRequest('update_bundle_product', { bundleId });
        const response = await action({ request });
        const data = await response.json();

        expect(data.success).toBe(true);
        expect(data.message).toBe('Bundle product updated successfully');
      });

      it('should return error when bundle has no product to update', async () => {
        const mockBundle = createMockBundle({ shopifyProductId: null });
        mockPrismaClient.bundle.findUnique.mockResolvedValue(mockBundle);

        const request = createMockRequest('update_bundle_product', { bundleId: 'test-bundle' });
        const response = await action({ request });
        const data = await response.json();

        expect(data.success).toBe(false);
        expect(data.error).toBe('Bundle does not have a bundle product to update');
        expect(response.status).toBe(400);
      });

      it('should handle update failure', async () => {
        const mockBundle = createMockBundle({ 
          shopifyProductId: 'gid://shopify/Product/999' 
        });
        
        mockPrismaClient.bundle.findUnique.mockResolvedValue({
          ...mockBundle,
          steps: [{
            StepProduct: [{ productId: 'gid://shopify/Product/1', title: 'Product 1', minQuantity: 1, maxQuantity: 1 }]
          }],
          pricing: null
        });

        BundleProductManagerService.updateBundleProductConfiguration.mockResolvedValue(false);

        const request = createMockRequest('update_bundle_product', { bundleId: 'test-bundle' });
        const response = await action({ request });
        const data = await response.json();

        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to update bundle product');
        expect(response.status).toBe(500);
      });
    });

    describe('get_bundle_for_product action', () => {
      it('should get bundle for product successfully', async () => {
        const productId = 'gid://shopify/Product/123';
        const mockBundle = { id: 'bundle-1', name: 'Test Bundle' };

        BundleIsolationService.getBundleForProduct.mockResolvedValue(mockBundle);

        const request = createMockRequest('get_bundle_for_product', { productId });
        const response = await action({ request });
        const data = await response.json();

        expect(data.success).toBe(true);
        expect(data.bundle).toEqual(mockBundle);
        expect(data.message).toBe('Bundle found for product');
      });

      it('should handle no bundle found', async () => {
        BundleIsolationService.getBundleForProduct.mockResolvedValue(null);

        const request = createMockRequest('get_bundle_for_product', { productId: 'gid://shopify/Product/123' });
        const response = await action({ request });
        const data = await response.json();

        expect(data.success).toBe(true);
        expect(data.bundle).toBeNull();
        expect(data.message).toBe('No bundle found for product');
      });

      it('should return error when productId is missing', async () => {
        const request = createMockRequest('get_bundle_for_product');
        const response = await action({ request });
        const data = await response.json();

        expect(data.success).toBe(false);
        expect(data.error).toBe('productId is required');
        expect(response.status).toBe(400);
      });
    });

    describe('audit_bundle_isolation action', () => {
      it('should run audit successfully', async () => {
        const mockAudit = {
          timestamp: new Date().toISOString(),
          totalBundles: 5,
          isolatedBundles: 3,
          issues: []
        };

        BundleIsolationService.auditBundleIsolation.mockResolvedValue(mockAudit);

        const request = createMockRequest('audit_bundle_isolation');
        const response = await action({ request });
        const data = await response.json();

        expect(data.success).toBe(true);
        expect(data.audit).toEqual(mockAudit);
        expect(data.message).toBe('Bundle isolation audit completed');
      });
    });

    describe('fix_bundle_product_publishing action', () => {
      it('should fix publishing successfully', async () => {
        const bundleId = 'test-bundle';
        const mockBundle = createMockBundle({ 
          id: bundleId,
          shopifyProductId: 'gid://shopify/Product/999' 
        });

        mockPrismaClient.bundle.findUnique.mockResolvedValue(mockBundle);

        mockShopifyAdmin.graphql
          .mockResolvedValueOnce(createMockGraphQLResponse({
            publications: {
              edges: [
                { node: { id: 'gid://shopify/Publication/1', name: 'Online Store', app: null } }
              ]
            }
          }))
          .mockResolvedValueOnce(createMockGraphQLResponse({
            publishablePublish: {
              publishable: { availablePublicationCount: 1, publicationCount: 1 },
              userErrors: []
            }
          }));

        const request = createMockRequest('fix_bundle_product_publishing', { bundleId });
        const response = await action({ request });
        const data = await response.json();

        expect(data.success).toBe(true);
        expect(data.message).toBe('Bundle product published to online store successfully');
      });

      it('should handle missing online store publication', async () => {
        const bundleId = 'test-bundle';
        const mockBundle = createMockBundle({ 
          shopifyProductId: 'gid://shopify/Product/999' 
        });

        mockPrismaClient.bundle.findUnique.mockResolvedValue(mockBundle);

        mockShopifyAdmin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
          publications: { edges: [] } // No online store publication
        }));

        const request = createMockRequest('fix_bundle_product_publishing', { bundleId });
        const response = await action({ request });
        const data = await response.json();

        expect(data.success).toBe(false);
        expect(data.error).toBe('Online store publication not found');
        expect(response.status).toBe(500);
      });

      it('should handle publishing errors', async () => {
        const bundleId = 'test-bundle';
        const mockBundle = createMockBundle({ 
          shopifyProductId: 'gid://shopify/Product/999' 
        });

        mockPrismaClient.bundle.findUnique.mockResolvedValue(mockBundle);

        mockShopifyAdmin.graphql
          .mockResolvedValueOnce(createMockGraphQLResponse({
            publications: {
              edges: [
                { node: { id: 'gid://shopify/Publication/1', name: 'Online Store', app: null } }
              ]
            }
          }))
          .mockResolvedValueOnce(createMockGraphQLResponse({
            publishablePublish: {
              publishable: null,
              userErrors: [{ field: 'id', message: 'Product not found' }]
            }
          }));

        const request = createMockRequest('fix_bundle_product_publishing', { bundleId });
        const response = await action({ request });
        const data = await response.json();

        expect(data.success).toBe(false);
        expect(data.error).toContain('Publishing failed: Product not found');
        expect(response.status).toBe(500);
      });
    });

    describe('validate_bundle_isolation action', () => {
      it('should validate bundle isolation successfully', async () => {
        const productId = 'gid://shopify/Product/123';
        const bundleId = 'test-bundle';

        mockShopifyAdmin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
          shop: {
            allBundles: {
              value: JSON.stringify([
                {
                  id: bundleId,
                  name: 'Test Bundle',
                  shopifyProductId: 'gid://shopify/Product/999',
                  isolation: { productIds: [productId] }
                }
              ])
            }
          }
        }));

        const request = createMockRequest('validate_bundle_isolation', { productId, bundleId });
        const response = await action({ request });
        const data = await response.json();

        expect(data.success).toBe(true);
        expect(data.isValid).toBe(true);
        expect(data.bundle.id).toBe(bundleId);
        expect(data.message).toBe('Bundle is valid for product');
      });

      it('should handle missing shop metafield', async () => {
        mockShopifyAdmin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
          shop: { allBundles: null }
        }));

        const request = createMockRequest('validate_bundle_isolation', { 
          productId: 'gid://shopify/Product/123', 
          bundleId: 'test-bundle' 
        });
        const response = await action({ request });
        const data = await response.json();

        expect(data.success).toBe(false);
        expect(data.error).toBe('No shop bundles metafield found');
        expect(response.status).toBe(404);
      });

      it('should handle bundle not found in metafield', async () => {
        mockShopifyAdmin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
          shop: {
            allBundles: {
              value: JSON.stringify([
                { id: 'other-bundle', name: 'Other Bundle' }
              ])
            }
          }
        }));

        const request = createMockRequest('validate_bundle_isolation', { 
          productId: 'gid://shopify/Product/123', 
          bundleId: 'nonexistent-bundle' 
        });
        const response = await action({ request });
        const data = await response.json();

        expect(data.success).toBe(false);
        expect(data.error).toBe('Bundle not found in shop metafield');
        expect(response.status).toBe(404);
      });

      it('should require both productId and bundleId', async () => {
        const request = createMockRequest('validate_bundle_isolation', { productId: 'gid://shopify/Product/123' });
        const response = await action({ request });
        const data = await response.json();

        expect(data.success).toBe(false);
        expect(data.error).toBe('productId and bundleId are required');
        expect(response.status).toBe(400);
      });
    });

    describe('unknown action', () => {
      it('should return error for unknown action', async () => {
        const request = createMockRequest('unknown_action');
        const response = await action({ request });
        const data = await response.json();

        expect(data.success).toBe(false);
        expect(data.error).toBe('Unknown action: unknown_action');
        expect(response.status).toBe(400);
      });
    });

    describe('error handling', () => {
      it('should handle unexpected errors', async () => {
        mockPrismaClient.bundle.findUnique.mockRejectedValue(new Error('Database connection failed'));

        const request = createMockRequest('create_bundle_product', { bundleId: 'test-bundle' });
        const response = await action({ request });
        const data = await response.json();

        expect(data.success).toBe(false);
        expect(data.error).toContain('API error: Database connection failed');
        expect(response.status).toBe(500);
      });
    });
  });

  describe('loader function', () => {
    it('should return API documentation', async () => {
      const response = await loader();
      const data = await response.json();

      expect(data.message).toBe('Bundle Product Manager API');
      expect(data.availableActions).toContain('create_bundle_product');
      expect(data.availableActions).toContain('update_bundle_product');
      expect(data.availableActions).toContain('get_bundle_for_product');
      expect(data.usage.method).toBe('POST');
    });
  });
});