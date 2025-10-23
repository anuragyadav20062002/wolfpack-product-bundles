/**
 * Integration Tests for Complete Bundle Workflow
 * Tests end-to-end bundle creation, cart transform, and metafield management
 */

import { BundleProductManagerService } from '../../app/services/bundle-product-manager.server';
import { CartTransformService } from '../../app/services/cart-transform-service.server';
import { MetafieldValidationService } from '../../app/services/metafield-validation.server';
import { cartTransformRun } from '../../extensions/bundle-cart-transform-ts/src/cart_transform_run';
import { 
  mockShopifyAdmin, 
  mockPrismaClient, 
  createMockGraphQLResponse, 
  createMockBundle,
  createMockBundleStep,
  createMockStepProduct,
  createMockBundlePricing
} from '../setup';

// Mock the database
jest.mock('../../app/db.server', () => mockPrismaClient);

describe('Bundle Workflow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Bundle Creation and Cart Transform Flow', () => {
    it('should create bundle, activate cart transform, and process cart correctly', async () => {
      const shopId = 'test-shop.myshopify.com';
      
      // Step 1: Create bundle in database
      const mockBundle = createMockBundle({
        id: 'integration-bundle-1',
        name: 'Integration Test Bundle',
        shopId
      });

      const mockStep = createMockBundleStep({
        bundleId: mockBundle.id,
        name: 'Choose Main Product'
      });

      const mockStepProducts = [
        createMockStepProduct({
          stepId: mockStep.id,
          productId: 'gid://shopify/Product/1',
          title: 'Product 1'
        }),
        createMockStepProduct({
          stepId: mockStep.id,
          productId: 'gid://shopify/Product/2',
          title: 'Product 2'
        })
      ];

      const mockPricing = createMockBundlePricing({
        bundleId: mockBundle.id,
        rules: [
          {
            conditionType: 'quantity',
            value: 2,
            discountValue: 15
          }
        ]
      });

      // Mock database responses
      mockPrismaClient.bundle.findUnique.mockResolvedValue({
        ...mockBundle,
        steps: [{
          ...mockStep,
          StepProduct: mockStepProducts
        }],
        pricing: mockPricing
      });

      // Step 2: Activate cart transform
      mockShopifyAdmin.graphql
        // Check existing cart transforms
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransforms: { edges: [] }
        }))
        // Create cart transform
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransformCreate: {
            cartTransform: {
              id: 'gid://shopify/CartTransform/1',
              functionId: process.env.SHOPIFY_BUNDLE_CART_TRANSFORM_TS_ID
            },
            userErrors: []
          }
        }));

      const cartTransformResult = await CartTransformService.activateForNewInstallation(
        mockShopifyAdmin,
        shopId
      );

      expect(cartTransformResult.success).toBe(true);
      expect(cartTransformResult.cartTransformId).toBe('gid://shopify/CartTransform/1');

      // Step 3: Create bundle product
      mockShopifyAdmin.graphql
        // Mock product price queries
        .mockResolvedValueOnce(createMockGraphQLResponse({
          product: { variants: { edges: [{ node: { price: '25.00' } }] } }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          product: { variants: { edges: [{ node: { price: '30.00' } }] } }
        }))
        // Mock product creation
        .mockResolvedValueOnce(createMockGraphQLResponse({
          productCreate: {
            product: {
              id: 'gid://shopify/Product/999',
              title: 'Integration Test Bundle - Bundle',
              handle: 'integration-test-bundle-bundle-123',
              status: 'ACTIVE',
              variants: {
                edges: [{ node: { id: 'gid://shopify/ProductVariant/999', price: '46.75' } }]
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

      const componentProducts = mockStepProducts.map(sp => ({
        id: sp.productId,
        title: sp.title,
        minQuantity: sp.minQuantity,
        maxQuantity: sp.maxQuantity
      }));

      const bundleProduct = await BundleProductManagerService.createAndPublishBundleProduct(
        mockShopifyAdmin,
        mockBundle,
        componentProducts
      );

      expect(bundleProduct).toBeDefined();
      expect(bundleProduct.id).toBe('gid://shopify/Product/999');

      // Step 4: Test cart transform with created bundle
      const cartTransformInput = {
        cart: {
          lines: [
            {
              id: 'gid://shopify/CartLine/1',
              quantity: 1,
              bundleId: { value: 'integration-bundle-1' },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/1',
                product: { id: 'gid://shopify/Product/1', title: 'Product 1' }
              },
              cost: {
                amountPerQuantity: { amount: '25.00', currencyCode: 'USD' },
                totalAmount: { amount: '25.00', currencyCode: 'USD' }
              }
            },
            {
              id: 'gid://shopify/CartLine/2',
              quantity: 1,
              bundleId: { value: 'integration-bundle-1' },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/2',
                product: { id: 'gid://shopify/Product/2', title: 'Product 2' }
              },
              cost: {
                amountPerQuantity: { amount: '30.00', currencyCode: 'USD' },
                totalAmount: { amount: '30.00', currencyCode: 'USD' }
              }
            }
          ]
        },
        shop: {
          all_bundles: {
            value: JSON.stringify([
              {
                id: 'integration-bundle-1',
                name: 'Integration Test Bundle',
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
      };

      const transformResult = cartTransformRun(cartTransformInput);

      expect(transformResult.operations).toHaveLength(1);
      expect(transformResult.operations[0].merge).toBeDefined();
      expect(transformResult.operations[0].merge.cartLines).toHaveLength(2);
      expect(transformResult.operations[0].merge.parentVariantId).toBe('gid://shopify/ProductVariant/999');
      expect(transformResult.operations[0].merge.price).toBeDefined();
      expect(transformResult.operations[0].merge.price.percentageDecrease.value).toBe('15');

      // Verify all GraphQL calls were made
      expect(mockShopifyAdmin.graphql).toHaveBeenCalledTimes(8);
    });

    it('should handle bundle update workflow correctly', async () => {
      const shopId = 'test-shop.myshopify.com';
      const bundleId = 'update-test-bundle';
      
      // Mock existing bundle with product
      const existingBundle = createMockBundle({
        id: bundleId,
        name: 'Updated Bundle Name',
        shopId,
        shopifyProductId: 'gid://shopify/Product/888'
      });

      const updatedStep = createMockBundleStep({
        bundleId,
        name: 'Updated Step'
      });

      const updatedStepProducts = [
        createMockStepProduct({
          stepId: updatedStep.id,
          productId: 'gid://shopify/Product/3',
          title: 'Updated Product 1',
          minQuantity: 2 // Changed quantity
        })
      ];

      const updatedPricing = createMockBundlePricing({
        bundleId,
        rules: [
          {
            conditionType: 'quantity',
            value: 2,
            discountValue: 20 // Increased discount
          }
        ]
      });

      mockPrismaClient.bundle.findUnique.mockResolvedValue({
        ...existingBundle,
        steps: [{
          ...updatedStep,
          StepProduct: updatedStepProducts
        }],
        pricing: updatedPricing
      });

      // Mock update bundle product configuration
      mockShopifyAdmin.graphql
        // Mock product price query
        .mockResolvedValueOnce(createMockGraphQLResponse({
          product: { variants: { edges: [{ node: { price: '40.00' } }] } }
        }))
        // Mock variant ID query
        .mockResolvedValueOnce(createMockGraphQLResponse({
          product: {
            variants: { edges: [{ node: { id: 'gid://shopify/ProductVariant/888' } }] }
          }
        }))
        // Mock variant update
        .mockResolvedValueOnce(createMockGraphQLResponse({
          productVariantUpdate: {
            productVariant: { id: 'gid://shopify/ProductVariant/888', price: '64.00' },
            userErrors: []
          }
        }));

      const componentProducts = updatedStepProducts.map(sp => ({
        id: sp.productId,
        title: sp.title,
        minQuantity: sp.minQuantity,
        maxQuantity: sp.maxQuantity
      }));

      const updateResult = await BundleProductManagerService.updateBundleProductConfiguration(
        mockShopifyAdmin,
        existingBundle.shopifyProductId,
        existingBundle,
        componentProducts
      );

      expect(updateResult).toBe(true);

      // Test cart transform with updated bundle
      const cartTransformInput = {
        cart: {
          lines: [
            {
              id: 'gid://shopify/CartLine/1',
              quantity: 2, // Meets new minimum
              bundleId: { value: bundleId },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/3',
                product: { id: 'gid://shopify/Product/3', title: 'Updated Product 1' }
              },
              cost: {
                amountPerQuantity: { amount: '40.00', currencyCode: 'USD' },
                totalAmount: { amount: '80.00', currencyCode: 'USD' }
              }
            }
          ]
        },
        shop: {
          all_bundles: {
            value: JSON.stringify([
              {
                id: bundleId,
                name: 'Updated Bundle Name',
                bundleParentVariantId: 'gid://shopify/ProductVariant/888',
                pricing: {
                  enabled: true,
                  method: 'percentage_off',
                  rules: [
                    {
                      conditionType: 'quantity',
                      value: 2,
                      discountValue: 20
                    }
                  ]
                }
              }
            ])
          }
        }
      };

      const transformResult = cartTransformRun(cartTransformInput);

      expect(transformResult.operations).toHaveLength(1);
      expect(transformResult.operations[0].merge.price.percentageDecrease.value).toBe('20');
    });
  });

  describe('Metafield Validation Integration', () => {
    it('should validate and clean metafields after bundle deletion', async () => {
      const shopId = 'test-shop.myshopify.com';
      
      // Mock active bundles (one deleted)
      const activeBundles = [
        createMockBundle({ id: 'active-bundle-1', name: 'Active Bundle 1' })
      ];

      // Mock shop metafield with deleted bundle
      const shopMetafieldValue = JSON.stringify([
        { id: 'active-bundle-1', name: 'Active Bundle 1' },
        { id: 'deleted-bundle-2', name: 'Deleted Bundle 2' }
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

      const validationResult = await MetafieldValidationService.validateAndCleanShopMetafields(
        mockShopifyAdmin,
        shopId
      );

      expect(validationResult).toBe(true);

      // Verify the metafield was updated to remove deleted bundle
      const updateCall = mockShopifyAdmin.graphql.mock.calls.find(call =>
        call[0].includes('metafieldsSet')
      );
      expect(updateCall).toBeDefined();
      
      const updatedValue = JSON.parse(updateCall[1].variables.metafields[0].value);
      expect(updatedValue).toHaveLength(1);
      expect(updatedValue[0].id).toBe('active-bundle-1');
    });

    it('should audit metafield consistency across database and Shopify', async () => {
      const shopId = 'test-shop.myshopify.com';
      
      const activeBundles = [
        createMockBundle({ id: 'bundle-1', name: 'Active Bundle 1' }),
        createMockBundle({ id: 'bundle-2', name: 'Active Bundle 2' })
      ];

      const allBundles = [
        ...activeBundles,
        createMockBundle({ id: 'bundle-3', name: 'Draft Bundle', status: 'draft' })
      ];

      const metafieldBundles = [
        { id: 'bundle-1', name: 'Active Bundle 1' },
        { id: 'bundle-4', name: 'Orphaned Bundle' } // Not in database
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
      expect(audit.database.totalBundles).toBe(3);
      expect(audit.database.activeBundles).toBe(2);
      expect(audit.database.inactiveBundles).toBe(1);
      expect(audit.metafields.totalBundles).toBe(2);
      
      // Check inconsistencies
      expect(audit.inconsistencies.bundlesInMetafieldButNotActive).toHaveLength(1);
      expect(audit.inconsistencies.bundlesInMetafieldButNotActive[0].id).toBe('bundle-4');
      
      expect(audit.inconsistencies.activeBundlesNotInMetafield).toHaveLength(1);
      expect(audit.inconsistencies.activeBundlesNotInMetafield[0].id).toBe('bundle-2');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle cart transform activation failure gracefully', async () => {
      const shopId = 'test-shop.myshopify.com';

      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransforms: { edges: [] }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransformCreate: {
            cartTransform: null,
            userErrors: [
              { field: 'functionId', message: 'Function not found or not deployed' }
            ]
          }
        }));

      const result = await CartTransformService.activateForNewInstallation(
        mockShopifyAdmin,
        shopId
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Function not found');
    });

    it('should handle bundle product creation failure and cleanup', async () => {
      const mockBundle = createMockBundle();
      const componentProducts = [
        { id: 'gid://shopify/Product/1', minQuantity: 1 }
      ];

      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(createMockGraphQLResponse({
          product: { variants: { edges: [{ node: { price: '25.00' } }] } }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          productCreate: {
            product: null,
            userErrors: [
              { field: 'title', message: 'Title has already been taken' }
            ]
          }
        }));

      const result = await BundleProductManagerService.createAndPublishBundleProduct(
        mockShopifyAdmin,
        mockBundle,
        componentProducts
      );

      expect(result).toBeNull();
    });

    it('should handle network errors during cart transform processing', async () => {
      const cartTransformInput = {
        cart: {
          lines: [
            {
              id: 'gid://shopify/CartLine/1',
              quantity: 1,
              bundleId: { value: 'test-bundle' },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/1',
                product: { id: 'gid://shopify/Product/1', title: 'Product 1' }
              },
              cost: {
                amountPerQuantity: { amount: '25.00', currencyCode: 'USD' },
                totalAmount: { amount: '25.00', currencyCode: 'USD' }
              }
            }
          ]
        },
        shop: {
          all_bundles: {
            value: 'malformed-json-that-will-cause-error'
          }
        }
      };

      // Should handle malformed JSON gracefully
      const result = cartTransformRun(cartTransformInput);
      expect(result.operations).toHaveLength(0);
    });

    it('should handle database connection failures during validation', async () => {
      const shopId = 'test-shop.myshopify.com';
      
      mockPrismaClient.bundle.findMany.mockRejectedValue(new Error('Database connection timeout'));

      const result = await MetafieldValidationService.validateAndCleanShopMetafields(
        mockShopifyAdmin,
        shopId
      );

      expect(result).toBe(false);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large number of bundle lines efficiently', async () => {
      const cartLines = [];
      const bundleConfigs = [];

      // Create 50 bundle lines
      for (let i = 1; i <= 50; i++) {
        cartLines.push({
          id: `gid://shopify/CartLine/${i}`,
          quantity: 1,
          bundleId: { value: `bundle-${Math.floor(i / 10) + 1}` },
          merchandise: {
            __typename: 'ProductVariant',
            id: `gid://shopify/ProductVariant/${i}`,
            product: { id: `gid://shopify/Product/${i}`, title: `Product ${i}` }
          },
          cost: {
            amountPerQuantity: { amount: '10.00', currencyCode: 'USD' },
            totalAmount: { amount: '10.00', currencyCode: 'USD' }
          }
        });
      }

      // Create 5 bundle configurations
      for (let i = 1; i <= 5; i++) {
        bundleConfigs.push({
          id: `bundle-${i}`,
          name: `Bundle ${i}`,
          bundleParentVariantId: `gid://shopify/ProductVariant/${900 + i}`,
          pricing: {
            enabled: true,
            method: 'percentage_off',
            rules: [{ conditionType: 'quantity', value: 2, discountValue: 10 }]
          }
        });
      }

      const cartTransformInput = {
        cart: { lines: cartLines },
        shop: { all_bundles: { value: JSON.stringify(bundleConfigs) } }
      };

      const startTime = Date.now();
      const result = cartTransformRun(cartTransformInput);
      const endTime = Date.now();

      expect(result.operations).toHaveLength(5); // One operation per bundle
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle bulk metafield validation efficiently', async () => {
      const shopId = 'test-shop.myshopify.com';
      
      // Mock 100 products with metafields
      const productsWithMetafields = [];
      for (let i = 1; i <= 100; i++) {
        productsWithMetafields.push({
          node: {
            id: `gid://shopify/Product/${i}`,
            title: `Product ${i}`,
            metafields: { edges: [{ node: { id: `meta${i}`, key: 'cart_transform_config' } }] },
            customMetafields: { edges: [] }
          }
        });
      }

      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(createMockGraphQLResponse({
          products: { edges: productsWithMetafields }
        }))
        .mockResolvedValue(createMockGraphQLResponse({
          metafieldsDelete: { deletedMetafields: [], userErrors: [] }
        }));

      mockPrismaClient.bundle.findMany.mockResolvedValue([]);

      const startTime = Date.now();
      const result = await MetafieldValidationService.bulkValidateAllProductMetafields(
        mockShopifyAdmin,
        shopId
      );
      const endTime = Date.now();

      expect(result.validatedCount).toBe(100);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});