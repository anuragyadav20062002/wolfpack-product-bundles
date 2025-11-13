// Bundle Isolation Service
// Ensures cart transform bundles only appear on their designated bundle products
// Uses product-level metafields for optimal performance

import { AppLogger } from "../lib/logger";

export class BundleIsolationService {

  /**
   * Update bundle product metafield with bundle configuration
   * Stores bundle config on the bundle product itself for fast, isolated access
   */
  static async updateBundleProductMetafield(admin: any, bundleProductId: string, bundleConfig: any) {
    AppLogger.info('Updating bundle product metafield', { 
      component: 'isolation', 
      operation: 'update-metafield'
    }, { bundleProductId });

    try {
      // Helper function to safely parse JSON
      const safeJsonParse = (value: any, defaultValue: any = []) => {
        if (!value) return defaultValue;
        if (typeof value === "object") return value;
        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch (error) {
            AppLogger.error("JSON parse error in bundle isolation", { 
              component: 'isolation', 
              operation: 'parse-json'
            }, error);
            return defaultValue;
          }
        }
        return defaultValue;
      };


      // No transformation needed - pass through standardized nested structure
      // Rules should already be in the format: { id, condition: { type, operator, value }, discount: { method, value } }
      const ensureStandardizedRules = (rules: any[]) => {
        if (!rules || !Array.isArray(rules)) return [];

        AppLogger.debug(`Validating pricing rules structure`, {
          component: 'isolation',
          operation: 'validate-rules'
        }, { ruleCount: rules.length });

        // Simply pass through - validation happens in pricing types
        return rules;
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
          enabled: bundleConfig.pricing.enabled,
          method: bundleConfig.pricing.method,
          rules: ensureStandardizedRules(
            safeJsonParse(bundleConfig.pricing.rules, [])
          ),
          showFooter: bundleConfig.pricing.showFooter,
          showProgressBar: bundleConfig.pricing.showProgressBar,
          messages: {
            ...safeJsonParse(bundleConfig.pricing.messages, {}),
            showDiscountDisplay: safeJsonParse(bundleConfig.pricing.messages, {}).showDiscountDisplay !== false // Default to true
          }
        } : null,
        // Store both product IDs (for reference) and variant IDs (for cart transform)
        componentProductIds: Array.from(new Set(
          steps.flatMap((step: any) =>
            step.StepProduct?.map((sp: any) => sp.productId) || []
          )
        )),
        // Store component variant IDs from step products' variant data
        componentVariantIds: Array.from(new Set(
          steps.flatMap((step: any) =>
            step.StepProduct?.flatMap((sp: any) => {
              // Extract variant IDs from variants field if available
              if (sp.variants) {
                const variants = safeJsonParse(sp.variants, []);
                if (Array.isArray(variants) && variants.length > 0) {
                  return variants.map((v: any) => v.id).filter((id: any) => id && id.includes('gid://shopify/ProductVariant/'));
                }
              }
              return [];
            }) || []
          )
        ))
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

      const mutationVariables = {
        metafields: [
          {
            ownerId: bundleProductId,
            namespace: "$app",
            key: "bundleConfig",
            type: "json",
            value: JSON.stringify(bundleMetafieldData)
            // Note: access.storefront is set in metafield definition (shopify.app.toml)
            // [product.metafields.app.bundleConfig] in TOML = namespace "$app", key "bundleConfig"
          }
        ]
      };

      // Log mutation details for debugging
      console.log('=== METAFIELD MUTATION DEBUG ===');
      console.log('bundleProductId:', bundleProductId);
      console.log('namespace:', "$app");
      console.log('key:', "bundleConfig");
      console.log('value length:', JSON.stringify(bundleMetafieldData).length);
      console.log('================================');

      const response = await admin.graphql(SET_BUNDLE_CONFIG_METAFIELD, {
        variables: mutationVariables
      });

      const data = await response.json();

      // Log full response for debugging
      console.log('=== METAFIELD RESPONSE ===');
      console.log('Full response:', JSON.stringify(data, null, 2));
      console.log('Has errors:', !!data.errors);
      console.log('Has userErrors:', !!data.data?.metafieldsSet?.userErrors?.length);
      console.log('Created metafields count:', data.data?.metafieldsSet?.metafields?.length || 0);
      console.log('========================');

      // Check for GraphQL-level errors
      if (data.errors) {
        AppLogger.error('GraphQL errors in metafieldsSet', {
          component: 'isolation',
          operation: 'update-metafield'
        }, data.errors);
        console.error('GraphQL ERRORS:', JSON.stringify(data.errors, null, 2));
        return false;
      }

      if (data.data?.metafieldsSet?.userErrors?.length > 0) {
        const error = data.data.metafieldsSet.userErrors[0];
        AppLogger.error('Set bundle_config error', {
          component: 'isolation',
          operation: 'update-metafield'
        }, error);
        console.error('USER ERRORS:', JSON.stringify(data.data.metafieldsSet.userErrors, null, 2));
        return false;
      }

      // Verify metafields were created
      const createdMetafields = data.data?.metafieldsSet?.metafields || [];
      if (createdMetafields.length === 0) {
        AppLogger.error('No metafields created - mutation succeeded but returned no metafields', {
          component: 'isolation',
          operation: 'update-metafield'
        });
        console.error('NO METAFIELDS CREATED despite no errors!');
        return false;
      }

      AppLogger.info('Successfully updated bundle_config metafield', {
        component: 'isolation',
        operation: 'update-metafield'
      }, {
        bundleProductId,
        metafieldId: createdMetafields[0]?.id,
        namespace: createdMetafields[0]?.namespace,
        key: createdMetafields[0]?.key
      });
      console.log('✅ Metafield created successfully:', createdMetafields[0]?.id);
      return true;

    } catch (error) {
      AppLogger.error('Error updating bundle_config metafield', { 
        component: 'isolation', 
        operation: 'update-metafield'
      }, error);
      return false;
    }
  }

  /**
   * Get bundle configuration from product metafield
   * Each bundle product stores its own configuration
   */
  static async getBundleConfigFromProduct(admin: any, productId: string): Promise<any> {
    AppLogger.debug('Getting bundle config from product', { 
      component: 'isolation', 
      operation: 'get-bundle-config'
    }, { productId });

    try {
      const GET_BUNDLE_CONFIG = `
        query GetBundleConfig($id: ID!) {
          product(id: $id) {
            id
            bundleConfig: metafield(namespace: "$app", key: "bundleConfig") {
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
        AppLogger.info('No bundle config found for product', { 
          component: 'isolation', 
          operation: 'get-bundle-config'
        }, { productId });
        return null;
      }

      const bundleConfig = JSON.parse(bundleConfigValue);
      AppLogger.info('Found bundle config', { 
        component: 'isolation', 
        operation: 'get-bundle-config'
      }, { bundleName: bundleConfig.name, productId });
      return bundleConfig;

    } catch (error) {
      AppLogger.error('Error getting bundle config', { 
        component: 'isolation', 
        operation: 'get-bundle-config'
      }, error);
      return null;
    }
  }

  /**
   * Create bundle product isolation metafields
   * These metafields help the widget identify which bundles belong to which products
   */
  static async createBundleProductIsolationMetafields(admin: any, bundleProductId: string, bundleId: string) {
    AppLogger.info('Creating isolation metafields for bundle product', {
      component: 'isolation',
      operation: 'create-metafields',
      bundleId
    }, { bundleProductId });

    try {
      const metafields = [
        {
          ownerId: bundleProductId,
          namespace: "$app",
          key: "ownsBundleId",
          type: "single_line_text_field",
          value: bundleId
        },
        {
          ownerId: bundleProductId,
          namespace: "$app",
          key: "bundleProductType",
          type: "single_line_text_field",
          value: "cart_transform_bundle"
        },
        {
          ownerId: bundleProductId,
          namespace: "$app",
          key: "isolationCreated",
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

      console.log('=== ISOLATION METAFIELDS DEBUG ===');
      console.log('bundleProductId:', bundleProductId);
      console.log('bundleId:', bundleId);
      console.log('metafields to create:', metafields.length);
      console.log('==================================');

      const response = await admin.graphql(SET_METAFIELDS_MUTATION, {
        variables: { metafields }
      });

      const data = await response.json();

      console.log('=== ISOLATION METAFIELDS RESPONSE ===');
      console.log('Full response:', JSON.stringify(data, null, 2));
      console.log('====================================');

      if (data.errors) {
        console.error('GraphQL ERRORS in isolation metafields:', JSON.stringify(data.errors, null, 2));
        return false;
      }

      if (data.data?.metafieldsSet?.userErrors?.length > 0) {
        AppLogger.error('Metafield errors during isolation metafield creation', {
          component: 'isolation',
          operation: 'create-metafields',
          bundleId
        }, data.data.metafieldsSet.userErrors);
        console.error('USER ERRORS in isolation metafields:', JSON.stringify(data.data.metafieldsSet.userErrors, null, 2));
        return false;
      }

      const createdCount = data.data?.metafieldsSet?.metafields?.length || 0;
      AppLogger.info('Created isolation metafields', {
        component: 'isolation',
        operation: 'create-metafields',
        bundleId
      }, { count: createdCount });
      console.log(`✅ Created ${createdCount} isolation metafields`);
      return true;

    } catch (error) {
      AppLogger.error('Error creating isolation metafields', {
        component: 'isolation',
        operation: 'create-metafields',
        bundleId
      }, error);
      return false;
    }
  }

  /**
   * Clean up isolation metafields when bundle is deleted
   */
  static async cleanupIsolationMetafields(admin: any, bundleProductId: string) {
    AppLogger.info('Cleaning up isolation metafields for product', {
      component: 'isolation',
      operation: 'cleanup-metafields'
    }, { bundleProductId });

    try {
      const metafieldsToDelete = [
        {
          ownerId: bundleProductId,
          namespace: "$app",
          key: "ownsBundleId"
        },
        {
          ownerId: bundleProductId,
          namespace: "$app",
          key: "bundleProductType"
        },
        {
          ownerId: bundleProductId,
          namespace: "$app",
          key: "isolationCreated"
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
        AppLogger.error('Cleanup errors during isolation metafield deletion', {
          component: 'isolation',
          operation: 'cleanup-metafields'
        }, data.data.metafieldsDelete.userErrors);
        return false;
      }

      const deletedCount = data.data?.metafieldsDelete?.deletedMetafields?.length || 0;
      AppLogger.info('Cleaned up isolation metafields', {
        component: 'isolation',
        operation: 'cleanup-metafields'
      }, { deletedCount });
      return true;

    } catch (error) {
      AppLogger.error('Error cleaning up isolation metafields', {
        component: 'isolation',
        operation: 'cleanup-metafields'
      }, error);
      return false;
    }
  }

  /**
   * Get bundle for specific product (used by widget)
   * Returns the bundle configuration stored on this product
   */
  static async getBundleForProduct(admin: any, productId: string, shopId: string): Promise<any> {
    AppLogger.debug('Getting bundle for product', {
      component: 'isolation',
      operation: 'get-bundle-for-product'
    }, { productId, shopId });

    // Simply read bundle_config from product metafield - no filtering needed!
    return await this.getBundleConfigFromProduct(admin, productId);
  }

  /**
   * Audit bundle isolation consistency
   * Checks if bundles have proper product-level metafields
   */
  static async auditBundleIsolation(admin: any, shopId: string) {
    AppLogger.info('Auditing bundle isolation for shop', {
      component: 'isolation',
      operation: 'audit'
    }, { shopId });

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

      AppLogger.info('Product metafield audit report', {
        component: 'isolation',
        operation: 'audit'
      }, audit);

      return audit;

    } catch (error) {
      AppLogger.error('Error auditing bundle isolation', {
        component: 'isolation',
        operation: 'audit'
      }, error);
      return null;
    }
  }
}