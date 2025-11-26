/**
 * End-to-End Tests for Complete Bundle Flow
 * Tests the entire bundle lifecycle from creation to cart processing
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

describe('Complete Bundle Flow E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Full Bundle Lifecycle', () => {
    it('should complete entire bundle workflow from creation to cart processing', async () => {
      const shopId = 'e2e-test-shop.myshopify.com';
      const bundleId = 'e2e-test-bundle';

      // === PHASE 1: Bundle Creation ===
      console.log('Phase 1: Creating bundle in database...');
      
      const bundle = createMockBundle({
        id: bundleId,
        name: 'E2E Test Bundle',
        shopId,
        status: 'active'
      });

      const step1 = createMockBundleStep({
        id: 'step-1',
        bundleId,
        name: 'Choose Main Product',
        minQuantity: 1,
        maxQuantity: 1
      });

      const step2 = createMockBundleStep({
        id: 'step-2',
        bundleId,
        name: 'Choose Add-on',
        minQuantity: 1,
        maxQuantity: 2
      });

      const stepProducts = [
        createMockStepProduct({
          stepId: 'step-1',
          productId: 'gid://shopify/Product/100',
          title: 'Main Product'
        }),
        createMockStepProduct({
          stepId: 'step-2',
          productId: 'gid://shopify/Product/200',
          title: 'Add-on Product 1'
        }),
        createMockStepProduct({
          stepId: 'step-2',
          productId: 'gid://shopify/Product/201',
          title: 'Add-on Product 2'
        })
      ];

      const pricing = createMockBundlePricing({
        bundleId,
        enableDiscount: true,
        discountMethod: 'percentage_off',
        rules: [
          {
            conditionType: 'quantity',
            value: 2,
            discountValue: 15
          },
          {
            conditionType: 'quantity',
            value: 3,
            discountValue: 25
          }
        ]
      });

      // Mock database queries for bundle creation
      mockPrismaClient.bundle.findUnique.mockResolvedValue({
        ...bundle,
        steps: [
          { ...step1, StepProduct: [stepProducts[0]] },
          { ...step2, StepProduct: [stepProducts[1], stepProducts[2]] }
        ],
        pricing
      });

      // === PHASE 2: Cart Transform Activation ===
      console.log('Phase 2: Activating cart transform...');
      
      mockShopifyAdmin.graphql
        // Check existing cart transforms
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransforms: { edges: [] }
        }))
        // Create cart transform
        .mockResolvedValueOnce(createMockGraphQLResponse({
          cartTransformCreate: {
            cartTransform: {
              id: 'gid://shopify/CartTransform/e2e-test',
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
      expect(cartTransformResult.cartTransformId).toBe('gid://shopify/CartTransform/e2e-test');

      // === PHASE 3: Bundle Product Creation ===
      console.log('Phase 3: Creating bundle product...');
      
      mockShopifyAdmin.graphql
        // Mock product price queries
        .mockResolvedValueOnce(createMockGraphQLResponse({
          product: { variants: { edges: [{ node: { price: '50.00' } }] } }
        }))
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
              id: 'gid://shopify/Product/e2e-bundle',
              title: 'E2E Test Bundle - Bundle',
              handle: 'e2e-test-bundle-bundle',
              status: 'ACTIVE',
              variants: {
                edges: [{ node: { id: 'gid://shopify/ProductVariant/e2e-bundle', price: '105.00' } }]
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
              { id: 'gid://shopify/Metafield/1', key: 'ownsBundleId', namespace: '$app' }
            ],
            userErrors: []
          }
        }));

      const componentProducts = stepProducts.map(sp => ({
        id: sp.productId,
        title: sp.title,
        minQuantity: sp.minQuantity,
        maxQuantity: sp.maxQuantity
      }));

      const bundleProduct = await BundleProductManagerService.createAndPublishBundleProduct(
        mockShopifyAdmin,
        bundle,
        componentProducts
      );

      expect(bundleProduct).toBeDefined();
      expect(bundleProduct.id).toBe('gid://shopify/Product/e2e-bundle');
      expect(bundleProduct.title).toBe('E2E Test Bundle - Bundle');

      // Update bundle with product ID
      mockPrismaClient.bundle.update.mockResolvedValue({
        ...bundle,
        shopifyProductId: bundleProduct.id
      });

      // === PHASE 4: Shop Metafield Update ===
      console.log('Phase 4: Updating shop metafields...');
      
      const shopBundleConfig = {
        id: bundleId,
        name: bundle.name,
        bundleParentVariantId: 'gid://shopify/ProductVariant/e2e-bundle',
        shopifyProductId: bundleProduct.id,
        pricing: {
          enabled: true,
          method: 'percentage_off',
          rules: [
            { conditionType: 'quantity', value: 2, discountValue: 15 },
            { conditionType: 'quantity', value: 3, discountValue: 25 }
          ]
        },
        steps: [
          {
            id: 'step-1',
            name: 'Choose Main Product',
            products: [{ id: 'gid://shopify/Product/100', title: 'Main Product' }]
          },
          {
            id: 'step-2',
            name: 'Choose Add-on',
            products: [
              { id: 'gid://shopify/Product/200', title: 'Add-on Product 1' },
              { id: 'gid://shopify/Product/201', title: 'Add-on Product 2' }
            ]
          }
        ]
      };

      // === PHASE 5: Cart Transform Testing - Scenario 1 (2 items, 15% discount) ===
      console.log('Phase 5a: Testing cart transform with 2 items (15% discount)...');
      
      const cartInput2Items = {
        cart: {
          lines: [
            {
              id: 'gid://shopify/CartLine/1',
              quantity: 1,
              bundleId: { value: bundleId },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/100',
                product: { id: 'gid://shopify/Product/100', title: 'Main Product' }
              },
              cost: {
                amountPerQuantity: { amount: '50.00', currencyCode: 'USD' },
                totalAmount: { amount: '50.00', currencyCode: 'USD' }
              }
            },
            {
              id: 'gid://shopify/CartLine/2',
              quantity: 1,
              bundleId: { value: bundleId },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/200',
                product: { id: 'gid://shopify/Product/200', title: 'Add-on Product 1' }
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
            value: JSON.stringify([shopBundleConfig])
          }
        }
      };

      const result2Items = cartTransformRun(cartInput2Items);

      expect(result2Items.operations).toHaveLength(1);
      expect(result2Items.operations[0].merge).toBeDefined();
      expect(result2Items.operations[0].merge.cartLines).toHaveLength(2);
      expect(result2Items.operations[0].merge.parentVariantId).toBe('gid://shopify/ProductVariant/e2e-bundle');
      expect(result2Items.operations[0].merge.price).toBeDefined();
      expect(result2Items.operations[0].merge.price.percentageDecrease.value).toBe('15');

      // === PHASE 6: Cart Transform Testing - Scenario 2 (3 items, 25% discount) ===
      console.log('Phase 5b: Testing cart transform with 3 items (25% discount)...');
      
      const cartInput3Items = {
        cart: {
          lines: [
            {
              id: 'gid://shopify/CartLine/1',
              quantity: 1,
              bundleId: { value: bundleId },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/100',
                product: { id: 'gid://shopify/Product/100', title: 'Main Product' }
              },
              cost: {
                amountPerQuantity: { amount: '50.00', currencyCode: 'USD' },
                totalAmount: { amount: '50.00', currencyCode: 'USD' }
              }
            },
            {
              id: 'gid://shopify/CartLine/2',
              quantity: 1,
              bundleId: { value: bundleId },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/200',
                product: { id: 'gid://shopify/Product/200', title: 'Add-on Product 1' }
              },
              cost: {
                amountPerQuantity: { amount: '25.00', currencyCode: 'USD' },
                totalAmount: { amount: '25.00', currencyCode: 'USD' }
              }
            },
            {
              id: 'gid://shopify/CartLine/3',
              quantity: 1,
              bundleId: { value: bundleId },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/201',
                product: { id: 'gid://shopify/Product/201', title: 'Add-on Product 2' }
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
            value: JSON.stringify([shopBundleConfig])
          }
        }
      };

      const result3Items = cartTransformRun(cartInput3Items);

      expect(result3Items.operations).toHaveLength(1);
      expect(result3Items.operations[0].merge.cartLines).toHaveLength(3);
      expect(result3Items.operations[0].merge.price.percentageDecrease.value).toBe('25');

      // === PHASE 7: Metafield Validation ===
      console.log('Phase 6: Validating metafields...');
      
      mockPrismaClient.bundle.findMany.mockResolvedValue([
        {
          ...bundle,
          steps: [
            { ...step1, StepProduct: [stepProducts[0]] },
            { ...step2, StepProduct: [stepProducts[1], stepProducts[2]] }
          ]
        }
      ]);

      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(createMockGraphQLResponse({
          shop: { id: 'gid://shopify/Shop/1' }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          node: {
            allBundles: {
              id: 'gid://shopify/Metafield/shop-bundles',
              value: JSON.stringify([shopBundleConfig])
            }
          }
        }));

      const validationResult = await MetafieldValidationService.validateAndCleanShopMetafields(
        mockShopifyAdmin,
        shopId
      );

      expect(validationResult).toBe(true);

      // === PHASE 8: Bundle Update Test ===
      console.log('Phase 7: Testing bundle update...');
      
      const updatedBundle = {
        ...bundle,
        name: 'Updated E2E Test Bundle',
        shopifyProductId: bundleProduct.id
      };

      const updatedPricing = {
        ...pricing,
        rules: [
          { conditionType: 'quantity', value: 2, discountValue: 20 }, // Increased discount
          { conditionType: 'quantity', value: 3, discountValue: 30 }
        ]
      };

      mockPrismaClient.bundle.findUnique.mockResolvedValue({
        ...updatedBundle,
        steps: [
          { ...step1, StepProduct: [stepProducts[0]] },
          { ...step2, StepProduct: [stepProducts[1]] } // Removed one product
        ],
        pricing: updatedPricing
      });

      mockShopifyAdmin.graphql
        // Mock product price query (only 2 products now)
        .mockResolvedValueOnce(createMockGraphQLResponse({
          product: { variants: { edges: [{ node: { price: '50.00' } }] } }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          product: { variants: { edges: [{ node: { price: '25.00' } }] } }
        }))
        // Mock variant ID query
        .mockResolvedValueOnce(createMockGraphQLResponse({
          product: {
            variants: { edges: [{ node: { id: 'gid://shopify/ProductVariant/e2e-bundle' } }] }
          }
        }))
        // Mock variant update
        .mockResolvedValueOnce(createMockGraphQLResponse({
          productVariantUpdate: {
            productVariant: { id: 'gid://shopify/ProductVariant/e2e-bundle', price: '75.00' },
            userErrors: []
          }
        }));

      const updatedComponentProducts = [stepProducts[0], stepProducts[1]].map(sp => ({
        id: sp.productId,
        title: sp.title,
        minQuantity: sp.minQuantity,
        maxQuantity: sp.maxQuantity
      }));

      const updateResult = await BundleProductManagerService.updateBundleProductConfiguration(
        mockShopifyAdmin,
        bundleProduct.id,
        updatedBundle,
        updatedComponentProducts
      );

      expect(updateResult).toBe(true);

      // Test cart transform with updated bundle
      const updatedShopBundleConfig = {
        ...shopBundleConfig,
        name: 'Updated E2E Test Bundle',
        pricing: {
          enabled: true,
          method: 'percentage_off',
          rules: [
            { conditionType: 'quantity', value: 2, discountValue: 20 }
          ]
        }
      };

      const cartInputUpdated = {
        cart: {
          lines: [
            {
              id: 'gid://shopify/CartLine/1',
              quantity: 1,
              bundleId: { value: bundleId },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/100',
                product: { id: 'gid://shopify/Product/100', title: 'Main Product' }
              },
              cost: {
                amountPerQuantity: { amount: '50.00', currencyCode: 'USD' },
                totalAmount: { amount: '50.00', currencyCode: 'USD' }
              }
            },
            {
              id: 'gid://shopify/CartLine/2',
              quantity: 1,
              bundleId: { value: bundleId },
              merchandise: {
                __typename: 'ProductVariant',
                id: 'gid://shopify/ProductVariant/200',
                product: { id: 'gid://shopify/Product/200', title: 'Add-on Product 1' }
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
            value: JSON.stringify([updatedShopBundleConfig])
          }
        }
      };

      const resultUpdated = cartTransformRun(cartInputUpdated);

      expect(resultUpdated.operations).toHaveLength(1);
      expect(resultUpdated.operations[0].merge.price.percentageDecrease.value).toBe('20'); // Updated discount

      console.log('✅ E2E Test completed successfully!');
      
      // Verify all phases completed successfully
      expect(cartTransformResult.success).toBe(true);
      expect(bundleProduct.id).toBe('gid://shopify/Product/e2e-bundle');
      expect(result2Items.operations[0].merge.price.percentageDecrease.value).toBe('15');
      expect(result3Items.operations[0].merge.price.percentageDecrease.value).toBe('25');
      expect(validationResult).toBe(true);
      expect(updateResult).toBe(true);
      expect(resultUpdated.operations[0].merge.price.percentageDecrease.value).toBe('20');
    });

    it('should handle bundle deletion workflow', async () => {
      const shopId = 'e2e-test-shop.myshopify.com';
      const bundleId = 'bundle-to-delete';
      
      console.log('Testing bundle deletion workflow...');

      // Mock bundle with product
      const bundleToDelete = createMockBundle({
        id: bundleId,
        shopifyProductId: 'gid://shopify/Product/to-delete'
      });

      // Phase 1: Delete bundle product
      mockShopifyAdmin.graphql.mockResolvedValueOnce(createMockGraphQLResponse({
        productDelete: {
          deletedProductId: 'gid://shopify/Product/to-delete',
          userErrors: []
        }
      }));

      const deleteResult = await BundleProductManagerService.deleteBundleProduct(
        mockShopifyAdmin,
        bundleToDelete.shopifyProductId
      );

      expect(deleteResult).toBe(true);

      // Phase 2: Clean up metafields
      mockPrismaClient.bundle.findMany.mockResolvedValue([]); // No active bundles

      const shopMetafieldWithDeletedBundle = JSON.stringify([
        { id: bundleId, name: 'Bundle to Delete' }
      ]);

      mockShopifyAdmin.graphql
        .mockResolvedValueOnce(createMockGraphQLResponse({
          shop: { id: 'gid://shopify/Shop/1' }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          node: {
            allBundles: {
              id: 'gid://shopify/Metafield/1',
              value: shopMetafieldWithDeletedBundle
            }
          }
        }))
        .mockResolvedValueOnce(createMockGraphQLResponse({
          metafieldsSet: {
            metafields: [
              { id: 'gid://shopify/Metafield/1', key: 'all_bundles', namespace: '$app' }
            ],
            userErrors: []
          }
        }));

      const cleanupResult = await MetafieldValidationService.validateAndCleanShopMetafields(
        mockShopifyAdmin,
        shopId
      );

      expect(cleanupResult).toBe(true);

      // Verify metafield was cleaned
      const updateCall = mockShopifyAdmin.graphql.mock.calls.find(call =>
        call[0].includes('metafieldsSet')
      );
      expect(updateCall).toBeDefined();
      
      const updatedValue = JSON.parse(updateCall[1].variables.metafields[0].value);
      expect(updatedValue).toHaveLength(0); // Bundle removed

      console.log('✅ Bundle deletion workflow completed successfully!');
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should recover from cart transform processing errors', async () => {
      console.log('Testing error recovery scenarios...');

      // Test malformed shop metafield
      const cartInputWithBadMetafield = {
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
            value: 'invalid-json-data'
          }
        }
      };

      const result = cartTransformRun(cartInputWithBadMetafield);
      expect(result.operations).toHaveLength(0); // Should handle gracefully

      // Test missing bundle configuration
      const cartInputWithMissingBundle = {
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
                amountPerQuantity: { amount: '25.00', currencyCode: 'USD' },
                totalAmount: { amount: '25.00', currencyCode: 'USD' }
              }
            }
          ]
        },
        shop: {
          all_bundles: {
            value: JSON.stringify([
              { id: 'other-bundle', name: 'Other Bundle' }
            ])
          }
        }
      };

      const result2 = cartTransformRun(cartInputWithMissingBundle);
      expect(result2.operations).toHaveLength(0); // Should handle gracefully

      console.log('✅ Error recovery scenarios completed successfully!');
    });
  });

  describe('Performance Under Load', () => {
    it('should handle multiple concurrent bundle operations', async () => {
      console.log('Testing performance under load...');

      const shopId = 'performance-test-shop.myshopify.com';
      
      // Create multiple bundles concurrently
      const bundlePromises = [];
      for (let i = 1; i <= 10; i++) {
        const bundleId = `perf-bundle-${i}`;
        
        mockPrismaClient.bundle.findUnique.mockResolvedValue({
          id: bundleId,
          name: `Performance Bundle ${i}`,
          shopId,
          steps: [{
            StepProduct: [
              { productId: `gid://shopify/Product/${i}`, title: `Product ${i}`, minQuantity: 1, maxQuantity: 1 }
            ]
          }],
          pricing: { enabled: false }
        });

        mockShopifyAdmin.graphql
          .mockResolvedValue(createMockGraphQLResponse({
            product: { variants: { edges: [{ node: { price: '25.00' } }] } }
          }))
          .mockResolvedValue(createMockGraphQLResponse({
            productCreate: {
              product: {
                id: `gid://shopify/Product/bundle-${i}`,
                title: `Performance Bundle ${i} - Bundle`,
                variants: { edges: [{ node: { price: '25.00' } }] }
              },
              userErrors: []
            }
          }))
          .mockResolvedValue(createMockGraphQLResponse({}));

        const bundle = createMockBundle({ id: bundleId, name: `Performance Bundle ${i}` });
        const componentProducts = [{ id: `gid://shopify/Product/${i}`, minQuantity: 1 }];

        bundlePromises.push(
          BundleProductManagerService.createAndPublishBundleProduct(
            mockShopifyAdmin,
            bundle,
            componentProducts
          )
        );
      }

      const startTime = Date.now();
      const results = await Promise.all(bundlePromises);
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      expect(results.every(result => result !== null)).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds

      console.log(`✅ Performance test completed in ${endTime - startTime}ms`);
    });
  });
});