// Metafield Validation Service
// Ensures only active bundles are processed and filters out deleted/inactive bundles

import db from "../db.server";

export class MetafieldValidationService {

  /**
   * Validate and filter metafield data to ensure only active bundles are included
   * @param admin - Shopify Admin API GraphQL client
   * @param shopId - Shop ID for database filtering
   */
  static async validateAndCleanShopMetafields(admin: any, shopId: string) {
    console.log(`🔍 [VALIDATION] Starting metafield validation for shop ${shopId}`);

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
      console.log(`✅ [VALIDATION] Found ${activeBundles.length} active bundles in database`);

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
        console.error('❌ [VALIDATION] Could not get shop GID');
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
        console.log('ℹ️ [VALIDATION] No shop metafield found to validate');
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
            console.log(`🗑️ [VALIDATION] Removing inactive bundle from metafield: ${bundle.id} - ${bundle.name}`);
          }
          return isActive;
        });

        console.log(`🔄 [VALIDATION] Metafield validation: ${originalCount} → ${validBundles.length} bundles`);

        // 5. Update shop metafield if changes were made
        if (validBundles.length !== originalCount) {
          console.log(`📝 [VALIDATION] Updating shop metafield to remove ${originalCount - validBundles.length} inactive bundles`);

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
                value: JSON.stringify(validBundles)
              }]
            }
          });

          const updateData = await updateResponse.json();

          if (updateData.data?.metafieldsSet?.userErrors?.length > 0) {
            console.error('❌ [VALIDATION] Shop metafield update errors:', updateData.data.metafieldsSet.userErrors);
            return false;
          } else {
            console.log('✅ [VALIDATION] Shop metafield updated successfully');
            return true;
          }
        } else {
          console.log('✅ [VALIDATION] All metafield bundles are valid - no update needed');
          return true;
        }

      } catch (parseError) {
        console.error('❌ [VALIDATION] Error parsing shop metafield JSON:', parseError);
        return false;
      }

    } catch (error) {
      console.error('❌ [VALIDATION] Error validating metafields:', error);
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
    console.log(`🔍 [VALIDATION] Validating product metafields for ${productId}`);

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
        console.log(`🧹 [VALIDATION] Product ${productId} should not have bundle metafields - cleaning up`);

        const metafieldsToDelete = [
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
          console.error("❌ [VALIDATION] Product metafield cleanup errors:", result.data.metafieldsDelete.userErrors);
        } else {
          const deletedCount = result.data?.metafieldsDelete?.deletedMetafields?.length || 0;
          console.log(`✅ [VALIDATION] Cleaned up ${deletedCount} invalid metafields from product ${productId}`);
        }
      } else {
        console.log(`✅ [VALIDATION] Product ${productId} should have bundle metafields - keeping existing ones`);
      }

      return true;

    } catch (error) {
      console.error(`❌ [VALIDATION] Error validating product ${productId} metafields:`, error);
      return false;
    }
  }

  /**
   * Bulk validation of all products with bundle metafields
   * This is useful for maintenance or after bulk bundle deletions
   */
  static async bulkValidateAllProductMetafields(admin: any, shopId: string) {
    console.log(`🔍 [BULK_VALIDATION] Starting bulk validation for shop ${shopId}`);

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

      console.log(`🔍 [BULK_VALIDATION] Found ${products.length} products with bundle metafields`);

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

      console.log(`✅ [BULK_VALIDATION] Completed: ${validatedCount} products validated, ${cleanedCount} products cleaned up`);

      return { validatedCount, cleanedCount };

    } catch (error) {
      console.error('❌ [BULK_VALIDATION] Error in bulk validation:', error);
      return { validatedCount: 0, cleanedCount: 0 };
    }
  }

  /**
   * Emergency function to audit and report metafield inconsistencies
   */
  static async auditMetafieldConsistency(admin: any, shopId: string) {
    console.log(`📊 [AUDIT] Starting metafield consistency audit for shop ${shopId}`);

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

      console.log('📊 [AUDIT] Consistency Report:', JSON.stringify(audit, null, 2));

      return audit;

    } catch (error) {
      console.error('❌ [AUDIT] Error in consistency audit:', error);
      return null;
    }
  }
}