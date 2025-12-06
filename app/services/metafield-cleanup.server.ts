// Metafield Cleanup Service for Bundle Deletion
// Handles comprehensive cleanup of all bundle-related metafields

import { AppLogger } from "../lib/logger";

export class MetafieldCleanupService {

  /**
   * Clean up all bundle-related metafields when deleting a bundle
   * @param admin - Shopify Admin API GraphQL client
   * @param bundleId - Database bundle ID
   * @param shopifyProductId - Shopify product ID (without gid prefix)
   * @param componentProductIds - Array of component product IDs
   */
  static async cleanupBundleMetafields(
    admin: any,
    bundleId: string,
    shopifyProductId: string,
    componentProductIds: string[] = []
  ) {
    AppLogger.info('Starting metafield cleanup for bundle', {
      component: 'cleanup',
      operation: 'cleanup-bundle'
    }, { bundleId, shopifyProductId });

    try {
      // 1. Clean up bundle product metafields (both custom and standard)
      await this.cleanupBundleProductMetafields(admin, shopifyProductId);

      // 2. Clean up component product metafields
      if (componentProductIds.length > 0) {
        await this.cleanupComponentProductMetafields(admin, componentProductIds);
      }

      // 3. Update shop-level metafields to remove bundle from global list
      await this.updateShopMetafieldsAfterDeletion(admin, bundleId);

      AppLogger.info('Completed metafield cleanup for bundle', {
        component: 'cleanup',
        operation: 'cleanup-bundle'
      }, { bundleId });

    } catch (error) {
      AppLogger.error('Failed to cleanup metafields for bundle', {
        component: 'cleanup',
        operation: 'cleanup-bundle'
      }, error);
      throw error;
    }
  }

  /**
   * Clean up metafields on the bundle product itself
   * Updated for Hybrid Architecture (#3)
   */
  private static async cleanupBundleProductMetafields(admin: any, shopifyProductId: string) {
    const productGid = shopifyProductId.startsWith('gid://')
      ? shopifyProductId
      : `gid://shopify/Product/${shopifyProductId}`;

    const metafieldsToDelete = [
      // Widget configuration metafield (defined in shopify.app.toml)
      {
        ownerId: productGid,
        namespace: "$app",
        key: "bundleConfig"
      },
      // Cart transform configuration metafield
      {
        ownerId: productGid,
        namespace: "$app",
        key: "cartTransformConfig"
      },
      // Bundle isolation metafields
      {
        ownerId: productGid,
        namespace: "$app",
        key: "ownsBundleId"
      },
      {
        ownerId: productGid,
        namespace: "$app",
        key: "bundleProductType"
      },
      {
        ownerId: productGid,
        namespace: "$app",
        key: "isolationCreated"
      }
    ];

    AppLogger.info('Deleting active metafields from bundle product', {
      component: 'cleanup',
      operation: 'cleanup-bundle-product'
    }, { productGid, count: metafieldsToDelete.length });

    await this.batchDeleteMetafields(admin, metafieldsToDelete);
  }

  /**
   * Clean up metafields from component products
   * Simplified - no component product metafields to clean (using $app:bundle_config on bundle product only)
   */
  private static async cleanupComponentProductMetafields(admin: any, componentProductIds: string[]) {
    AppLogger.info('Skipping component product cleanup - no metafields stored on component products', {
      component: 'cleanup',
      operation: 'cleanup-component-products'
    });
    // No metafields on component products in optimized architecture
  }

  /**
   * Update shop-level metafields to remove deleted bundle from global bundle list
   * Updated for Hybrid Architecture (#3) - uses bundle index
   * Public method - can be called independently for soft deletes
   */
  static async updateShopMetafieldsAfterDeletion(admin: any, deletedBundleId: string) {
    try {
      // Get shop GID
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
          component: 'cleanup',
          operation: 'update-shop-metafields'
        });
        return;
      }

      // NEW: Get current bundle index (Hybrid Architecture)
      const metafieldResponse = await admin.graphql(`
        query GetBundleIndex($ownerId: ID!) {
          node(id: $ownerId) {
            ... on Shop {
              bundleIndex: metafield(namespace: "$app", key: "bundleIndex") {
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
      const currentMetafield = metafieldData.data?.node?.bundleIndex;

      if (currentMetafield?.value) {
        try {
          const bundleIndex = JSON.parse(currentMetafield.value);

          // Filter out the deleted bundle
          const filteredBundles = bundleIndex.bundles.filter((bundle: any) => bundle.id !== deletedBundleId);

          AppLogger.info('Updating bundle index', {
            component: 'cleanup',
            operation: 'update-shop-metafields'
          }, { before: bundleIndex.bundles.length, after: filteredBundles.length });

          // Update the shop metafield with filtered bundles
          const updateResponse = await admin.graphql(`
            mutation UpdateBundleIndex($metafields: [MetafieldsSetInput!]!) {
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
                namespace: "$app",
                key: "bundleIndex",
                type: "json",
                value: JSON.stringify({
                  bundles: filteredBundles,
                  updatedAt: new Date().toISOString()
                })
              }]
            }
          });

          const updateData = await updateResponse.json();

          if (updateData.data?.metafieldsSet?.userErrors?.length > 0) {
            AppLogger.error('Bundle index update errors', {
              component: 'cleanup',
              operation: 'update-shop-metafields'
            }, updateData.data.metafieldsSet.userErrors);
          } else {
            AppLogger.info('Bundle index updated successfully', {
              component: 'cleanup',
              operation: 'update-shop-metafields'
            });
          }

        } catch (parseError) {
          AppLogger.error('Error parsing bundle index JSON', {
            component: 'cleanup',
            operation: 'update-shop-metafields'
          }, parseError);
        }
      } else {
        AppLogger.info('No bundle index found to update', {
          component: 'cleanup',
          operation: 'update-shop-metafields'
        });
      }

    } catch (error) {
      AppLogger.error('Error updating shop metafields', {
        component: 'cleanup',
        operation: 'update-shop-metafields'
      }, error);
    }
  }

  /**
   * Batch delete metafields with API limits (max 25 per request)
   */
  private static async batchDeleteMetafields(admin: any, metafields: any[]) {
    if (metafields.length === 0) return;

    const chunks = this.chunkArray(metafields, 25);
    let totalDeleted = 0;

    for (const chunk of chunks) {
      try {
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
          variables: { metafields: chunk }
        });

        const result = await response.json();

        if (result.data?.metafieldsDelete?.userErrors?.length > 0) {
          AppLogger.error('Metafield deletion errors', {
            component: 'cleanup',
            operation: 'batch-delete'
          }, result.data.metafieldsDelete.userErrors);
        } else {
          const deletedCount = result.data?.metafieldsDelete?.deletedMetafields?.length || 0;
          totalDeleted += deletedCount;
          AppLogger.info('Successfully deleted metafields in batch', {
            component: 'cleanup',
            operation: 'batch-delete'
          }, { deletedCount });
        }
      } catch (error) {
        AppLogger.error('Error in batch metafield deletion', {
          component: 'cleanup',
          operation: 'batch-delete'
        }, error);
      }
    }

    AppLogger.info('Total metafields deleted', {
      component: 'cleanup',
      operation: 'batch-delete'
    }, { totalDeleted, requested: metafields.length });
  }

  /**
   * Verify metafields were actually deleted
   */
  static async verifyCleanup(admin: any, productId: string, namespace: string, key: string): Promise<boolean> {
    try {
      const productGid = productId.startsWith('gid://')
        ? productId
        : `gid://shopify/Product/${productId}`;

      const response = await admin.graphql(`
        query CheckMetafield($id: ID!, $namespace: String!, $key: String!) {
          product(id: $id) {
            metafield(namespace: $namespace, key: $key) {
              id
            }
          }
        }
      `, {
        variables: {
          id: productGid,
          namespace,
          key
        }
      });

      const data = await response.json();
      const exists = data.data?.product?.metafield !== null;

      AppLogger.info('Metafield verification', {
        component: 'cleanup',
        operation: 'verify'
      }, { namespace, key, exists, status: exists ? 'still exists' : 'successfully deleted' });

      return !exists; // Return true if metafield no longer exists
    } catch (error) {
      AppLogger.error('Verification error', {
        component: 'cleanup',
        operation: 'verify'
      }, error);
      return false;
    }
  }

  /**
   * Utility to split arrays into chunks of specified size
   */
  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Emergency cleanup - remove all bundle metafields by namespace
   * Use with caution - this removes ALL bundle-related metafields
   */
  static async emergencyCleanupAllBundleMetafields(admin: any) {
    AppLogger.warn('Starting emergency cleanup of all bundle metafields', {
      component: 'cleanup',
      operation: 'emergency-cleanup'
    });

    try {
      // Get all metafield definitions for bundle namespaces
      const namespaces = ["bundle_discounts", "$app:bundle_discount"];

      for (const namespace of namespaces) {
        const definitionsResponse = await admin.graphql(`
          query GetMetafieldDefinitions($namespace: String!) {
            metafieldDefinitions(first: 100, namespace: $namespace) {
              edges {
                node {
                  id
                  namespace
                  key
                }
              }
            }
          }
        `, { variables: { namespace } });

        const definitionsData = await definitionsResponse.json();
        const definitions = definitionsData.data?.metafieldDefinitions?.edges || [];

        // Delete definitions and all associated metafields
        for (const definition of definitions) {
          await admin.graphql(`
            mutation DeleteDefinition($id: ID!) {
              metafieldDefinitionDelete(id: $id, deleteAllAssociatedMetafields: true) {
                deletedDefinitionId
                userErrors { field message }
              }
            }
          `, { variables: { id: definition.node.id } });

          AppLogger.info('Deleted definition', {
            component: 'cleanup',
            operation: 'emergency-cleanup'
          }, { namespace: definition.node.namespace, key: definition.node.key });
        }
      }

      AppLogger.info('Emergency cleanup completed', {
        component: 'cleanup',
        operation: 'emergency-cleanup'
      });

    } catch (error) {
      AppLogger.error('Emergency cleanup failed', {
        component: 'cleanup',
        operation: 'emergency-cleanup'
      }, error);
      throw error;
    }
  }
}