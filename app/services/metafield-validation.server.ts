// Metafield Validation Service
// Ensures only active bundles are processed and filters out deleted/inactive bundles

import db from "../db.server";
import { AppLogger } from "../lib/logger";
import { METAFIELD_NAMESPACE, METAFIELD_KEYS } from "../constants/metafields";

export class MetafieldValidationService {

  /**
   * Validate and filter metafield data to ensure only active bundles are included
   * @param admin - Shopify Admin API GraphQL client
   * @param shopId - Shop ID for database filtering
   */
  static async validateAndCleanShopMetafields(admin: any, shopId: string) {
    AppLogger.info('Starting metafield validation for shop', {
      component: 'validation',
      operation: 'validate-shop'
    }, { shopId });

    try {
      // 1. Get all active bundles from database
      const activeBundles = await db.bundle.findMany({
        where: {
          shopId: shopId,
          status: 'active'
        },
        include: {
          steps: {
            include: {
              StepProduct: true
            }
          },
          pricing: true
        }
      });

      const activeBundleIds = new Set(activeBundles.map(b => b.id));
      AppLogger.info('Found active bundles in database', {
        component: 'validation',
        operation: 'validate-shop'
      }, { count: activeBundles.length });

      // 2. Get shop GID
      const shopResponse = await admin.graphql(`
        query GetShopId {
          shop {
            id
          }
        }
      `);

      const shopData = await shopResponse.json();
      const shopGid = shopData.data?.shop?.id;

      if (!shopGid) {
        AppLogger.error('Could not get shop GID', {
          component: 'validation',
          operation: 'validate-shop'
        });
        return false;
      }

      // 3. Get current shop metafield
      const metafieldResponse = await admin.graphql(`
        query GetShopBundlesMetafield($ownerId: ID!) {
          node(id: $ownerId) {
            ... on Shop {
              allBundles: metafield(namespace: "$app", key: "all_bundles") {
                id
                value
              }
            }
          }
        }
      `, {
        variables: { ownerId: shopGid }
      });

      const metafieldData = await metafieldResponse.json();
      const currentMetafield = metafieldData.data?.node?.allBundles;

      if (!currentMetafield?.value) {
        AppLogger.info('No shop metafield found to validate', {
          component: 'validation',
          operation: 'validate-shop'
        });
        return false;
      }

      // 4. Parse and filter metafield bundles
      try {
        const metafieldBundles = JSON.parse(currentMetafield.value);
        const originalCount = metafieldBundles.length;

        // Filter out deleted/inactive bundles
        const validBundles = metafieldBundles.filter((bundle: any) => {
          const isActive = activeBundleIds.has(bundle.id);
          if (!isActive) {
            AppLogger.info('Removing inactive bundle from metafield', {
              component: 'validation',
              operation: 'validate-shop'
            }, { bundleId: bundle.id, bundleName: bundle.name });
          }
          return isActive;
        });

        AppLogger.info('Metafield validation complete', {
          component: 'validation',
          operation: 'validate-shop'
        }, { before: originalCount, after: validBundles.length });

        // 5. Update shop metafield if changes were made
        if (validBundles.length !== originalCount) {
          AppLogger.info('Updating shop metafield to remove inactive bundles', {
            component: 'validation',
            operation: 'validate-shop'
          }, { removedCount: originalCount - validBundles.length });

          const updateResponse = await admin.graphql(`
            mutation UpdateShopBundlesMetafield($metafields: [MetafieldsSetInput!]!) {
              metafieldsSet(metafields: $metafields) {
                metafields {
                  id
                  key
                  namespace
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `, {
            variables: {
              metafields: [{
                ownerId: shopGid,
                namespace: METAFIELD_NAMESPACE,
                key: METAFIELD_KEYS.ALL_BUNDLES,
                type: "json",
                value: JSON.stringify(validBundles)
              }]
            }
          });

          const updateData = await updateResponse.json();

          if (updateData.data?.metafieldsSet?.userErrors?.length > 0) {
            AppLogger.error('Shop metafield update errors', {
              component: 'validation',
              operation: 'validate-shop'
            }, updateData.data.metafieldsSet.userErrors);
            return false;
          } else {
            AppLogger.info('Shop metafield updated successfully', {
              component: 'validation',
              operation: 'validate-shop'
            });
            return true;
          }
        } else {
          AppLogger.info('All metafield bundles are valid - no update needed', {
            component: 'validation',
            operation: 'validate-shop'
          });
          return true;
        }

      } catch (parseError) {
        AppLogger.error('Error parsing shop metafield JSON', {
          component: 'validation',
          operation: 'validate-shop'
        }, parseError);
        return false;
      }

    } catch (error) {
      AppLogger.error('Error validating metafields', {
        component: 'validation',
        operation: 'validate-shop'
      }, error);
      return false;
    }
  }

  /**
   * Validate individual product metafields and remove invalid bundle references
   * @param admin - Shopify Admin API GraphQL client
   * @param productId - Product ID to validate
   * @param shopId - Shop ID for database filtering
   */
  static async validateProductMetafields(admin: any, productId: string, shopId: string) {
    AppLogger.info('Validating product metafields', {
      component: 'validation',
      operation: 'validate-product'
    }, { productId });

    try {
      // Get active bundles that should reference this product
      const activeBundles = await db.bundle.findMany({
        where: {
          shopId: shopId,
          status: 'active'
        },
        include: {
          steps: {
            include: {
              StepProduct: true
            }
          }
        }
      });

      // Check if this product should have any bundle metafields
      const shouldHaveBundleMetafields = activeBundles.some(bundle =>
        bundle.steps.some(step =>
          step.StepProduct?.some(sp => sp.productId === productId)
        )
      );

      const productGid = productId.startsWith('gid://')
        ? productId
        : `gid://shopify/Product/${productId}`;

      // If product shouldn't have bundle metafields, clean them up
      if (!shouldHaveBundleMetafields) {
        AppLogger.info('Product should not have bundle metafields - cleaning up', {
          component: 'validation',
          operation: 'validate-product'
        }, { productId });

        const metafieldsToDelete = [
          {
            ownerId: productGid,
            namespace: "bundle_discounts",
            key: "cart_transform_config"
          },
          {
            ownerId: productGid,
            namespace: "custom",
            key: "component_reference"
          },
          {
            ownerId: productGid,
            namespace: "custom",
            key: "component_quantities"
          },
          {
            ownerId: productGid,
            namespace: "custom",
            key: "component_parents"
          },
          {
            ownerId: productGid,
            namespace: "custom",
            key: "price_adjustment"
          }
        ];

        // Delete invalid metafields
        const response = await admin.graphql(`
          mutation MetafieldsDelete($metafields: [MetafieldIdentifierInput!]!) {
            metafieldsDelete(metafields: $metafields) {
              deletedMetafields {
                key
                namespace
                ownerId
              }
              userErrors {
                field
                message
              }
            }
          }
        `, {
          variables: { metafields: metafieldsToDelete }
        });

        const result = await response.json();

        if (result.data?.metafieldsDelete?.userErrors?.length > 0) {
          AppLogger.error('Product metafield cleanup errors', {
            component: 'validation',
            operation: 'validate-product'
          }, result.data.metafieldsDelete.userErrors);
        } else {
          const deletedCount = result.data?.metafieldsDelete?.deletedMetafields?.length || 0;
          AppLogger.info('Cleaned up invalid metafields from product', {
            component: 'validation',
            operation: 'validate-product'
          }, { productId, deletedCount });
        }
      } else {
        AppLogger.info('Product should have bundle metafields - keeping existing ones', {
          component: 'validation',
          operation: 'validate-product'
        }, { productId });
      }

      return true;

    } catch (error) {
      AppLogger.error('Error validating product metafields', {
        component: 'validation',
        operation: 'validate-product'
      }, error);
      return false;
    }
  }

  /**
   * Bulk validation of all products with bundle metafields
   * This is useful for maintenance or after bulk bundle deletions
   */
  static async bulkValidateAllProductMetafields(admin: any, shopId: string) {
    AppLogger.info('Starting bulk validation for shop', {
      component: 'validation',
      operation: 'bulk-validate'
    }, { shopId });

    try {
      // Get all products that have bundle metafields
      const productsWithMetafieldsResponse = await admin.graphql(`
        query GetProductsWithBundleMetafields {
          products(first: 250, query: "metafields.namespace:bundle_discounts OR metafields.namespace:custom") {
            edges {
              node {
                id
                title
                metafields(first: 20, namespace: "bundle_discounts") {
                  edges {
                    node {
                      id
                      key
                      namespace
                    }
                  }
                }
                customMetafields: metafields(first: 20, namespace: "custom") {
                  edges {
                    node {
                      id
                      key
                      namespace
                    }
                  }
                }
              }
            }
          }
        }
      `);

      const productsData = await productsWithMetafieldsResponse.json();
      const products = productsData.data?.products?.edges || [];

      AppLogger.info('Found products with bundle metafields', {
        component: 'validation',
        operation: 'bulk-validate'
      }, { count: products.length });

      let validatedCount = 0;
      let cleanedCount = 0;

      // Validate each product individually
      for (const productEdge of products) {
        const product = productEdge.node;
        const productId = product.id.replace('gid://shopify/Product/', '');

        const hasMetafields = product.metafields.edges.length > 0 || product.customMetafields.edges.length > 0;

        if (hasMetafields) {
          const wasValid = await this.validateProductMetafields(admin, productId, shopId);
          validatedCount++;

          if (!wasValid) {
            cleanedCount++;
          }
        }
      }

      AppLogger.info('Bulk validation completed', {
        component: 'validation',
        operation: 'bulk-validate'
      }, { validatedCount, cleanedCount });

      return { validatedCount, cleanedCount };

    } catch (error) {
      AppLogger.error('Error in bulk validation', {
        component: 'validation',
        operation: 'bulk-validate'
      }, error);
      return { validatedCount: 0, cleanedCount: 0 };
    }
  }

  /**
   * Emergency function to audit and report metafield inconsistencies
   */
  static async auditMetafieldConsistency(admin: any, shopId: string) {
    AppLogger.info('Starting metafield consistency audit for shop', {
      component: 'validation',
      operation: 'audit'
    }, { shopId });

    try {
      // Get database state
      const activeBundles = await db.bundle.findMany({
        where: { shopId: shopId, status: 'active' },
        include: { steps: { include: { StepProduct: true } } }
      });

      const allBundles = await db.bundle.findMany({
        where: { shopId: shopId },
        include: { steps: { include: { StepProduct: true } } }
      });

      // Get metafield state
      const shopResponse = await admin.graphql(`
        query GetShopId {
          shop {
            id
            allBundles: metafield(namespace: "$app", key: "all_bundles") {
              value
            }
          }
        }
      `);

      const shopData = await shopResponse.json();
      const metafieldBundles = shopData.data?.shop?.allBundles?.value
        ? JSON.parse(shopData.data.shop.allBundles.value)
        : [];

      // Generate audit report
      const audit = {
        timestamp: new Date().toISOString(),
        database: {
          totalBundles: allBundles.length,
          activeBundles: activeBundles.length,
          inactiveBundles: allBundles.length - activeBundles.length
        },
        metafields: {
          totalBundles: metafieldBundles.length
        },
        inconsistencies: {
          bundlesInMetafieldButNotActive: metafieldBundles.filter((mb: any) =>
            !activeBundles.some(ab => ab.id === mb.id)
          ).map((mb: any) => ({ id: mb.id, name: mb.name })),
          activeBundlesNotInMetafield: activeBundles.filter(ab =>
            !metafieldBundles.some((mb: any) => mb.id === ab.id)
          ).map(ab => ({ id: ab.id, name: ab.name }))
        }
      };

      AppLogger.info('Consistency audit report', {
        component: 'validation',
        operation: 'audit'
      }, audit);

      return audit;

    } catch (error) {
      AppLogger.error('Error in consistency audit', {
        component: 'validation',
        operation: 'audit'
      }, error);
      return null;
    }
  }
}