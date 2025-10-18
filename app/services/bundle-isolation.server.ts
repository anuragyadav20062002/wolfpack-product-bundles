// Bundle Isolation Service
// Ensures cart transform bundles only appear on their designated bundle products
// Uses product-level metafields for optimal performance

export class BundleIsolationService {

  /**
   * Update bundle product metafield with bundle configuration
   * Stores bundle config on the bundle product itself for fast, isolated access
   */
  static async updateBundleProductMetafield(admin: any, bundleProductId: string, bundleConfig: any) {
    console.log(`🔒 [ISOLATION] Updating bundle product metafield for product: ${bundleProductId}`);

    try {
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


      // Helper function to transform pricing rules to standardized format
      // Standardized fields used by both widget and cart transform
      const transformPricingRules = (rules: any[], discountMethod: string) => {
        if (!rules || !Array.isArray(rules)) return [];

        console.log(`🔧 [TRANSFORM_RULES] Transforming ${rules.length} pricing rules for method: ${discountMethod}`);

        return rules.map((rule: any) => {
          // Create clean rule with standardized field names only
          const transformedRule: any = {
            id: rule.id,
            condition: rule.condition || 'gte',
            value: rule.numberOfProducts || rule.value || 0,
          };

          // Handle different discount methods with standardized field names
          if (discountMethod === 'fixed_bundle_price') {
            // For fixed bundle price, use 'price' and 'fixedBundlePrice' fields
            const priceValue = rule.fixedBundlePrice || 0;
            transformedRule.price = priceValue;
            transformedRule.fixedBundlePrice = priceValue;
          } else {
            // For fixed_amount_off and percentage_off, use 'discountValue' field
            transformedRule.discountValue = rule.discountValue || "0";
          }

          console.log(`  ✅ Transformed rule: ${JSON.stringify(rule)} → ${JSON.stringify(transformedRule)}`);
          return transformedRule;
        });
      };

      const steps = bundleConfig.steps.map((step: any) => ({
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

      const bundleMetafieldData = {
        id: bundleConfig.id,
        name: bundleConfig.name,
        description: bundleConfig.description,
        status: bundleConfig.status,
        bundleType: bundleConfig.bundleType,
        shopifyProductId: bundleProductId,
        bundleParentVariantId: bundleConfig.bundleParentVariantId || null,
        steps: steps,
        pricing: bundleConfig.pricing ? {
          enabled: bundleConfig.pricing.enableDiscount,
          method: bundleConfig.pricing.discountMethod,
          rules: transformPricingRules(
            safeJsonParse(bundleConfig.pricing.rules, []),
            bundleConfig.pricing.discountMethod
          ),
          showFooter: bundleConfig.pricing.showFooter,
          messages: safeJsonParse(bundleConfig.pricing.messages, {})
        } : null,
        componentProductIds: steps.flatMap((step: any) =>
          step.StepProduct?.map((sp: any) => sp.productId) || []
        )
      };

      const SET_BUNDLE_CONFIG_METAFIELD = `
        mutation SetBundleConfigMetafield($metafields: [MetafieldsSetInput!]!) {
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

      const response = await admin.graphql(SET_BUNDLE_CONFIG_METAFIELD, {
        variables: {
          metafields: [
            {
              ownerId: bundleProductId,
              namespace: "$app",
              key: "bundle_config",
              type: "json",
              value: JSON.stringify(bundleMetafieldData)
            }
          ]
        }
      });

      const data = await response.json();

      if (data.data?.metafieldsSet?.userErrors?.length > 0) {
        const error = data.data.metafieldsSet.userErrors[0];
        console.error("❌ [ISOLATION] Set bundle_config error:", error);
        return false;
      }

      console.log(`✅ [ISOLATION] Successfully updated bundle_config metafield for product ${bundleProductId}`);
      return true;

    } catch (error) {
      console.error("❌ [ISOLATION] Error updating bundle_config metafield:", error);
      return false;
    }
  }

  /**
   * Get bundle configuration from product metafield
   * Each bundle product stores its own configuration
   */
  static async getBundleConfigFromProduct(admin: any, productId: string): Promise<any> {
    console.log(`🔍 [GET_BUNDLE] Getting bundle config from product: ${productId}`);

    try {
      const GET_BUNDLE_CONFIG = `
        query GetBundleConfig($id: ID!) {
          product(id: $id) {
            id
            bundleConfig: metafield(namespace: "$app", key: "bundle_config") {
              value
            }
          }
        }
      `;

      const response = await admin.graphql(GET_BUNDLE_CONFIG, {
        variables: { id: productId }
      });

      const data = await response.json();
      const bundleConfigValue = data.data?.product?.bundleConfig?.value;

      if (!bundleConfigValue) {
        console.log(`ℹ️ [GET_BUNDLE] No bundle config found for product ${productId}`);
        return null;
      }

      const bundleConfig = JSON.parse(bundleConfigValue);
      console.log(`✅ [GET_BUNDLE] Found bundle config: ${bundleConfig.name}`);
      return bundleConfig;

    } catch (error) {
      console.error(`❌ [GET_BUNDLE] Error getting bundle config:`, error);
      return null;
    }
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
   * Returns the bundle configuration stored on this product
   */
  static async getBundleForProduct(admin: any, productId: string, shopId: string): Promise<any> {
    console.log(`🔍 [GET_BUNDLE] Getting bundle for product: ${productId}`);

    // Simply read bundle_config from product metafield - no filtering needed!
    return await this.getBundleConfigFromProduct(admin, productId);
  }

  /**
   * Audit bundle isolation consistency
   * Checks if bundles have proper product-level metafields
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

      // Check each bundle product for bundle_config metafield
      const metafieldChecks = await Promise.all(
        dbBundles
          .filter(b => b.shopifyProductId)
          .map(async (bundle) => {
            try {
              const bundleConfig = await this.getBundleConfigFromProduct(admin, bundle.shopifyProductId!);
              return {
                bundleId: bundle.id,
                bundleName: bundle.name,
                productId: bundle.shopifyProductId,
                hasMetafield: !!bundleConfig,
                metafieldValid: bundleConfig?.id === bundle.id
              };
            } catch (error) {
              return {
                bundleId: bundle.id,
                bundleName: bundle.name,
                productId: bundle.shopifyProductId,
                hasMetafield: false,
                metafieldValid: false,
                error: (error as Error).message
              };
            }
          })
      );

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
          totalChecked: metafieldChecks.length,
          bundlesWithMetafield: metafieldChecks.filter(c => c.hasMetafield).length,
          bundlesWithoutMetafield: metafieldChecks.filter(c => !c.hasMetafield).length,
          metafieldsValid: metafieldChecks.filter(c => c.metafieldValid).length,
          metafieldsInvalid: metafieldChecks.filter(c => c.hasMetafield && !c.metafieldValid).length
        },
        details: metafieldChecks
      };

      console.log('📊 [AUDIT_ISOLATION] Product Metafield Audit Report:', JSON.stringify(audit, null, 2));

      return audit;

    } catch (error) {
      console.error('❌ [AUDIT_ISOLATION] Error auditing bundle isolation:', error);
      return null;
    }
  }
}