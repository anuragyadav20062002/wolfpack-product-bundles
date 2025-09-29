// Metafield Cleanup Service for Bundle Deletion
// Handles comprehensive cleanup of all bundle-related metafields

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
    console.log(`🧹 [CLEANUP] Starting metafield cleanup for bundle ${bundleId}`);

    try {
      // 1. Clean up bundle product metafields (both custom and standard)
      await this.cleanupBundleProductMetafields(admin, shopifyProductId);

      // 2. Clean up component product metafields
      if (componentProductIds.length > 0) {
        await this.cleanupComponentProductMetafields(admin, componentProductIds);
      }

      // 3. Update shop-level metafields to remove bundle from global list
      await this.updateShopMetafieldsAfterDeletion(admin, bundleId);

      console.log(`✅ [CLEANUP] Completed metafield cleanup for bundle ${bundleId}`);

    } catch (error) {
      console.error(`❌ [CLEANUP] Failed to cleanup metafields for bundle ${bundleId}:`, error);
      throw error;
    }
  }

  /**
   * Clean up metafields on the bundle product itself
   */
  private static async cleanupBundleProductMetafields(admin: any, shopifyProductId: string) {
    const productGid = shopifyProductId.startsWith('gid://')
      ? shopifyProductId
      : `gid://shopify/Product/${shopifyProductId}`;

    const metafieldsToDelete = [
      // Custom bundle configuration metafields
      {
        ownerId: productGid,
        namespace: "bundle_discounts",
        key: "cart_transform_config"
      },
      {
        ownerId: productGid,
        namespace: "bundle_discounts",
        key: "discount_function_config"
      },
      // Standard Shopify metafields for cart transform compatibility
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
        key: "price_adjustment"
      },
      // Legacy app metafields if they exist
      {
        ownerId: productGid,
        namespace: "$app:bundle_discount",
        key: "bundle_discount_data"
      }
    ];

    console.log(`🧹 [CLEANUP] Deleting ${metafieldsToDelete.length} metafields from bundle product ${productGid}`);

    await this.batchDeleteMetafields(admin, metafieldsToDelete);
  }

  /**
   * Clean up component_parents metafields from component products
   */
  private static async cleanupComponentProductMetafields(admin: any, componentProductIds: string[]) {
    const metafieldsToDelete = [];

    for (const productId of componentProductIds) {
      const productGid = productId.startsWith('gid://')
        ? productId
        : `gid://shopify/Product/${productId}`;

      metafieldsToDelete.push({
        ownerId: productGid,
        namespace: "custom",
        key: "component_parents"
      });
    }

    if (metafieldsToDelete.length > 0) {
      console.log(`🧹 [CLEANUP] Deleting component_parents metafields from ${metafieldsToDelete.length} component products`);
      await this.batchDeleteMetafields(admin, metafieldsToDelete);
    }
  }

  /**
   * Update shop-level metafields to remove deleted bundle from global bundle list
   */
  private static async updateShopMetafieldsAfterDeletion(admin: any, deletedBundleId: string) {
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
        console.error('❌ [CLEANUP] Could not get shop GID');
        return;
      }

      // Get current shop metafield with all bundles
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

      if (currentMetafield?.value) {
        try {
          const allBundles = JSON.parse(currentMetafield.value);

          // Filter out the deleted bundle
          const filteredBundles = allBundles.filter((bundle: any) => bundle.id !== deletedBundleId);

          console.log(`🧹 [CLEANUP] Updating shop metafield: ${allBundles.length} → ${filteredBundles.length} bundles`);

          // Update the shop metafield with filtered bundles
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
                namespace: "$app",
                key: "all_bundles",
                type: "json",
                value: JSON.stringify(filteredBundles)
              }]
            }
          });

          const updateData = await updateResponse.json();

          if (updateData.data?.metafieldsSet?.userErrors?.length > 0) {
            console.error('❌ [CLEANUP] Shop metafield update errors:', updateData.data.metafieldsSet.userErrors);
          } else {
            console.log('✅ [CLEANUP] Shop metafield updated successfully');
          }

        } catch (parseError) {
          console.error('❌ [CLEANUP] Error parsing shop metafield JSON:', parseError);
        }
      } else {
        console.log('ℹ️ [CLEANUP] No shop metafield found to update');
      }

    } catch (error) {
      console.error('❌ [CLEANUP] Error updating shop metafields:', error);
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
          console.error("🚨 [CLEANUP] Metafield deletion errors:", result.data.metafieldsDelete.userErrors);
        } else {
          const deletedCount = result.data?.metafieldsDelete?.deletedMetafields?.length || 0;
          totalDeleted += deletedCount;
          console.log(`✅ [CLEANUP] Successfully deleted ${deletedCount} metafields in this batch`);
        }
      } catch (error) {
        console.error("❌ [CLEANUP] Error in batch metafield deletion:", error);
      }
    }

    console.log(`🎉 [CLEANUP] Total metafields deleted: ${totalDeleted} out of ${metafields.length} requested`);
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

      console.log(`🔍 [CLEANUP] Verification: metafield ${namespace}:${key} ${exists ? 'still exists' : 'successfully deleted'}`);

      return !exists; // Return true if metafield no longer exists
    } catch (error) {
      console.error('❌ [CLEANUP] Verification error:', error);
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
    console.log('🚨 [EMERGENCY_CLEANUP] Starting emergency cleanup of all bundle metafields');

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

          console.log(`🗑️ [EMERGENCY_CLEANUP] Deleted definition: ${definition.node.namespace}:${definition.node.key}`);
        }
      }

      console.log('✅ [EMERGENCY_CLEANUP] Emergency cleanup completed');

    } catch (error) {
      console.error('❌ [EMERGENCY_CLEANUP] Emergency cleanup failed:', error);
      throw error;
    }
  }
}