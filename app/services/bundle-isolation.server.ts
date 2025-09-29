// Bundle Isolation Service
// Ensures cart transform bundles only appear on their designated bundle products

export class BundleIsolationService {

  /**
   * Update shop metafield with proper bundle isolation data
   * Only includes bundles with their designated product mappings
   */
  static async updateShopBundlesWithIsolation(admin: any, shopId: string) {
    console.log(`🔒 [ISOLATION] Updating shop bundles with isolation rules for shop: ${shopId}`);

    try {
      // Get all active bundles from database with their product relationships
      const db = (await import("../db.server")).default;

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

      console.log(`🔒 [ISOLATION] Found ${activeBundles.length} active bundles to process`);

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
        console.error('❌ [ISOLATION] Could not get shop GID');
        return false;
      }

      // Process bundles with isolation rules
      const isolatedBundles = activeBundles.map(bundle => {
        // Helper function to safely parse JSON
        const safeJsonParse = (value: any, defaultValue: any = []) => {
          if (!value) return defaultValue;
          if (typeof value === "object") return value;
          if (typeof value === "string") {
            try {
              return JSON.parse(value);
            } catch (error) {
              console.error("JSON parse error:", error);
              return defaultValue;
            }
          }
          return defaultValue;
        };

        const steps = bundle.steps.map(step => ({
          id: step.id,
          name: step.name,
          position: step.position,
          minQuantity: step.minQuantity,
          maxQuantity: step.maxQuantity,
          enabled: step.enabled,
          displayVariantsAsIndividual: step.displayVariantsAsIndividual,
          products: safeJsonParse(step.products, []),
          collections: safeJsonParse(step.collections, []),
          StepProduct: step.StepProduct || [],
          conditionType: step.conditionType,
          conditionOperator: step.conditionOperator,
          conditionValue: step.conditionValue
        }));

        return {
          id: bundle.id,
          name: bundle.name,
          description: bundle.description,
          status: bundle.status,
          bundleType: bundle.bundleType,
          shopifyProductId: bundle.shopifyProductId, // Key for isolation!
          steps: steps,
          pricing: bundle.pricing ? {
            enabled: bundle.pricing.enableDiscount,
            method: bundle.pricing.discountMethod,
            rules: safeJsonParse(bundle.pricing.rules, []),
            showFooter: bundle.pricing.showFooter,
            messages: safeJsonParse(bundle.pricing.messages, {})
          } : null,
          // ISOLATION: Only show this bundle on its designated product
          isolation: {
            restrictToProductId: bundle.shopifyProductId, // Bundle only shows on this specific product
            bundleProductOnly: true, // Flag to indicate this bundle is isolated to its bundle product
            componentProductIds: steps.flatMap(step =>
              step.StepProduct?.map((sp: any) => sp.productId) || []
            )
          }
        };
      });

      // Update shop metafield with isolated bundles
      const SET_SHOP_METAFIELD = `
        mutation SetShopBundlesMetafield($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              id
              key
              namespace
              value
            }
            userErrors {
              field
              message
              code
            }
          }
        }
      `;

      const response = await admin.graphql(SET_SHOP_METAFIELD, {
        variables: {
          metafields: [
            {
              ownerId: shopGid,
              namespace: "$app",
              key: "all_bundles",
              type: "json",
              value: JSON.stringify(isolatedBundles)
            }
          ]
        }
      });

      const data = await response.json();

      if (data.data?.metafieldsSet?.userErrors?.length > 0) {
        const error = data.data.metafieldsSet.userErrors[0];
        console.error("❌ [ISOLATION] Set error:", error);
        return false;
      }

      console.log(`✅ [ISOLATION] Successfully updated shop metafield with ${isolatedBundles.length} isolated bundles`);
      return true;

    } catch (error) {
      console.error("❌ [ISOLATION] Error updating isolated bundles metafield:", error);
      return false;
    }
  }

  /**
   * Validate bundle should show on current product
   * This function is used by the widget to determine if a bundle should display
   */
  static validateBundleForProduct(bundle: any, currentProductId: string): boolean {
    console.log(`🔍 [VALIDATION] Checking if bundle ${bundle.id} should show on product ${currentProductId}`);

    // Extract product ID from GID format if needed
    const normalizeProductId = (id: string): string => {
      if (id.includes('gid://shopify/Product/')) {
        return id.replace('gid://shopify/Product/', '');
      }
      return id.toString();
    };

    const normalizedCurrentProductId = normalizeProductId(currentProductId);

    // Check if bundle has isolation rules
    if (bundle.isolation && bundle.isolation.restrictToProductId) {
      const normalizedBundleProductId = normalizeProductId(bundle.isolation.restrictToProductId);

      const isAllowed = normalizedBundleProductId === normalizedCurrentProductId;

      console.log(`🔒 [VALIDATION] Bundle ${bundle.id} isolated to product ${normalizedBundleProductId}, current: ${normalizedCurrentProductId}, allowed: ${isAllowed}`);

      return isAllowed;
    }

    // Fallback: Check if bundle product ID matches (legacy support)
    if (bundle.shopifyProductId) {
      const normalizedBundleProductId = normalizeProductId(bundle.shopifyProductId);
      const isAllowed = normalizedBundleProductId === normalizedCurrentProductId;

      console.log(`🔒 [VALIDATION] Bundle ${bundle.id} legacy check - bundle product: ${normalizedBundleProductId}, current: ${normalizedCurrentProductId}, allowed: ${isAllowed}`);

      return isAllowed;
    }

    // If no isolation rules, allow (for backward compatibility)
    console.log(`⚠️ [VALIDATION] Bundle ${bundle.id} has no isolation rules - allowing for backward compatibility`);
    return true;
  }

  /**
   * Create bundle product isolation metafields
   * These metafields help the widget identify which bundles belong to which products
   */
  static async createBundleProductIsolationMetafields(admin: any, bundleProductId: string, bundleId: string) {
    console.log(`🏷️ [ISOLATION_METAFIELDS] Creating isolation metafields for bundle product: ${bundleProductId}`);

    try {
      const metafields = [
        {
          ownerId: bundleProductId,
          namespace: "$app:bundle_isolation",
          key: "owns_bundle_id",
          type: "single_line_text_field",
          value: bundleId
        },
        {
          ownerId: bundleProductId,
          namespace: "$app:bundle_isolation",
          key: "bundle_product_type",
          type: "single_line_text_field",
          value: "cart_transform_bundle"
        },
        {
          ownerId: bundleProductId,
          namespace: "$app:bundle_isolation",
          key: "isolation_created",
          type: "single_line_text_field",
          value: new Date().toISOString()
        }
      ];

      const SET_METAFIELDS_MUTATION = `
        mutation SetIsolationMetafields($metafields: [MetafieldsSetInput!]!) {
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
      `;

      const response = await admin.graphql(SET_METAFIELDS_MUTATION, {
        variables: { metafields }
      });

      const data = await response.json();

      if (data.data?.metafieldsSet?.userErrors?.length > 0) {
        console.error('❌ [ISOLATION_METAFIELDS] Metafield errors:', data.data.metafieldsSet.userErrors);
        return false;
      }

      console.log(`✅ [ISOLATION_METAFIELDS] Created ${data.data?.metafieldsSet?.metafields?.length || 0} isolation metafields`);
      return true;

    } catch (error) {
      console.error('❌ [ISOLATION_METAFIELDS] Error creating isolation metafields:', error);
      return false;
    }
  }

  /**
   * Clean up isolation metafields when bundle is deleted
   */
  static async cleanupIsolationMetafields(admin: any, bundleProductId: string) {
    console.log(`🧹 [CLEANUP_ISOLATION] Cleaning up isolation metafields for product: ${bundleProductId}`);

    try {
      const metafieldsToDelete = [
        {
          ownerId: bundleProductId,
          namespace: "$app:bundle_isolation",
          key: "owns_bundle_id"
        },
        {
          ownerId: bundleProductId,
          namespace: "$app:bundle_isolation",
          key: "bundle_product_type"
        },
        {
          ownerId: bundleProductId,
          namespace: "$app:bundle_isolation",
          key: "isolation_created"
        }
      ];

      const DELETE_METAFIELDS_MUTATION = `
        mutation DeleteIsolationMetafields($metafields: [MetafieldIdentifierInput!]!) {
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
      `;

      const response = await admin.graphql(DELETE_METAFIELDS_MUTATION, {
        variables: { metafields: metafieldsToDelete }
      });

      const data = await response.json();

      if (data.data?.metafieldsDelete?.userErrors?.length > 0) {
        console.error('❌ [CLEANUP_ISOLATION] Cleanup errors:', data.data.metafieldsDelete.userErrors);
        return false;
      }

      const deletedCount = data.data?.metafieldsDelete?.deletedMetafields?.length || 0;
      console.log(`✅ [CLEANUP_ISOLATION] Cleaned up ${deletedCount} isolation metafields`);
      return true;

    } catch (error) {
      console.error('❌ [CLEANUP_ISOLATION] Error cleaning up isolation metafields:', error);
      return false;
    }
  }

  /**
   * Get bundle for specific product (used by widget)
   * Returns only the bundle that should show on the current product
   */
  static async getBundleForProduct(admin: any, productId: string, shopId: string): Promise<any> {
    console.log(`🔍 [GET_BUNDLE] Getting bundle for product: ${productId}`);

    try {
      // Get shop bundles metafield
      const shopResponse = await admin.graphql(`
        query GetShopBundlesMetafield {
          shop {
            id
            allBundles: metafield(namespace: "$app", key: "all_bundles") {
              value
            }
          }
        }
      `);

      const shopData = await shopResponse.json();
      const metafieldValue = shopData.data?.shop?.allBundles?.value;

      if (!metafieldValue) {
        console.log('ℹ️ [GET_BUNDLE] No shop bundles metafield found');
        return null;
      }

      const allBundles = JSON.parse(metafieldValue);

      // Find bundle that should show on this product
      const bundleForProduct = allBundles.find((bundle: any) =>
        this.validateBundleForProduct(bundle, productId)
      );

      if (bundleForProduct) {
        console.log(`✅ [GET_BUNDLE] Found bundle for product ${productId}: ${bundleForProduct.name}`);
      } else {
        console.log(`ℹ️ [GET_BUNDLE] No bundle found for product ${productId}`);
      }

      return bundleForProduct;

    } catch (error) {
      console.error('❌ [GET_BUNDLE] Error getting bundle for product:', error);
      return null;
    }
  }

  /**
   * Audit bundle isolation consistency
   * Checks if bundles are properly isolated and identifies issues
   */
  static async auditBundleIsolation(admin: any, shopId: string) {
    console.log(`📊 [AUDIT_ISOLATION] Auditing bundle isolation for shop: ${shopId}`);

    try {
      // Get database bundles
      const db = (await import("../db.server")).default;

      const dbBundles = await db.bundle.findMany({
        where: { shopId: shopId, status: 'active' },
        select: {
          id: true,
          name: true,
          shopifyProductId: true,
          bundleType: true
        }
      });

      // Get metafield bundles
      const shopResponse = await admin.graphql(`
        query GetShopBundlesMetafield {
          shop {
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

      // Analyze isolation
      const audit = {
        timestamp: new Date().toISOString(),
        database: {
          totalBundles: dbBundles.length,
          cartTransformBundles: dbBundles.filter(b => b.bundleType === 'cart_transform').length,
          bundlesWithProducts: dbBundles.filter(b => b.shopifyProductId).length,
          bundlesWithoutProducts: dbBundles.filter(b => !b.shopifyProductId).length
        },
        metafields: {
          totalBundles: metafieldBundles.length,
          bundlesWithIsolation: metafieldBundles.filter((b: any) => b.isolation?.restrictToProductId).length,
          bundlesWithoutIsolation: metafieldBundles.filter((b: any) => !b.isolation?.restrictToProductId).length
        },
        isolation: {
          properlyIsolatedBundles: metafieldBundles.filter((b: any) =>
            b.isolation?.restrictToProductId && b.shopifyProductId
          ).length,
          potentialConflicts: metafieldBundles.filter((b: any) =>
            !b.isolation?.restrictToProductId && b.bundleType === 'cart_transform'
          ).map((b: any) => ({ id: b.id, name: b.name }))
        }
      };

      console.log('📊 [AUDIT_ISOLATION] Isolation Audit Report:', JSON.stringify(audit, null, 2));

      return audit;

    } catch (error) {
      console.error('❌ [AUDIT_ISOLATION] Error auditing bundle isolation:', error);
      return null;
    }
  }
}