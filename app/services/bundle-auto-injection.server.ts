// Bundle Auto-Injection Service
// Automatically injects bundle widget via JavaScript on bundle product pages
// Note: Shopify restricts theme file modification, so we use JavaScript injection

import { AppLogger } from "../lib/logger";

export class BundleAutoInjectionService {

  /**
   * Set up automatic bundle widget injection for a bundle product
   * Uses JavaScript-based injection via metafields (Shopify doesn't allow theme file modification)
   */
  static async injectBundleExtensionIntoProduct(
    admin: any,
    bundleProductId: string,
    bundleId: string
  ): Promise<{ success: boolean; error?: string }> {
    AppLogger.info('Setting up automatic bundle extension injection', { 
      component: 'auto-injection', 
      operation: 'inject',
      bundleId
    }, { bundleProductId });

    try {
      // Use JavaScript injection method (only method that works with Shopify restrictions)
      return await this.injectBundleViaJavaScript(bundleProductId, bundleId);
    } catch (error) {
      AppLogger.error('Error injecting bundle extension', { 
        component: 'auto-injection', 
        operation: 'inject',
        bundleId
      }, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Inject bundle widget via JavaScript
   * This method relies on isolation metafields to trigger automatic widget display
   */
  private static async injectBundleViaJavaScript(
    bundleProductId: string,
    bundleId: string
  ): Promise<{ success: boolean; error?: string }> {
    AppLogger.debug('Using JavaScript injection method', { 
      component: 'auto-injection', 
      operation: 'inject-js',
      bundleId
    });

    // The JavaScript logic is implemented in bundle.liquid (lines 547-625):
    // 1. Detects bundle products via product tags ('bundle' or 'cart-transform')
    // 2. Checks if widget already manually placed via theme block
    // 3. If not, automatically injects widget HTML including:
    //    - Bundle widget container
    //    - Add Bundle to Cart button
    //    - Footer discount messaging (with progress bar)
    // 4. Hides default Add to Cart buttons
    // 5. Widget initializes and loads bundle data from metafields

    AppLogger.info('JavaScript injection method configured successfully', { 
      component: 'auto-injection', 
      operation: 'inject-js',
      bundleId
    });

    return { success: true };
  }

  /**
   * Remove bundle extension injection from product
   */
  static async removeBundleInjection(
    admin: any,
    bundleProductId: string
  ): Promise<{ success: boolean; error?: string }> {
    AppLogger.info('Removing bundle injection from product', { 
      component: 'auto-injection', 
      operation: 'remove'
    }, { bundleProductId });

    try {
      // Cleanup is handled by removing isolation metafields
      // This prevents the JavaScript from auto-displaying the bundle widget
      AppLogger.debug('Bundle injection removal relies on isolation metafield cleanup', { 
        component: 'auto-injection', 
        operation: 'remove'
      });

      return { success: true };

    } catch (error) {
      AppLogger.error('Error removing bundle injection', { 
        component: 'auto-injection', 
        operation: 'remove'
      }, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Verify bundle injection is working
   */
  static async verifyBundleInjection(
    admin: any,
    bundleProductId: string,
    bundleId: string
  ): Promise<{ success: boolean; injectionMethod?: string; error?: string }> {
    console.log(`🔍 [AUTO_INJECTION] Verifying bundle injection for product: ${bundleProductId}`);

    try {
      // Check for product bundle_config metafield and isolation metafields
      const CHECK_BUNDLE_METAFIELDS = `
        query checkBundleMetafields($id: ID!) {
          product(id: $id) {
            id
            handle
            bundleConfig: metafield(namespace: "$app", key: "bundle_config") {
              value
            }
            bundleProductType: metafield(namespace: "$app:bundle_isolation", key: "bundle_product_type") {
              value
            }
            ownsBundleId: metafield(namespace: "$app:bundle_isolation", key: "owns_bundle_id") {
              value
            }
          }
        }
      `;

      const response = await admin.graphql(CHECK_BUNDLE_METAFIELDS, {
        variables: { id: bundleProductId }
      });

      const data = await response.json();
      const product = data.data?.product;

      // Primary check: bundle_config metafield exists and matches bundle ID
      if (product?.bundleConfig?.value) {
        try {
          const bundleConfig = JSON.parse(product.bundleConfig.value);
          if (bundleConfig.id === bundleId) {
            console.log(`✅ [AUTO_INJECTION] Bundle injection verified via bundle_config metafield`);
            return {
              success: true,
              injectionMethod: 'product_bundle_config_metafield'
            };
          }
        } catch (parseError) {
          console.error(`❌ [AUTO_INJECTION] Error parsing bundle_config:`, parseError);
        }
      }

      // Secondary check: isolation metafields (legacy support)
      if (product?.bundleProductType?.value === 'cart_transform_bundle' &&
          product?.ownsBundleId?.value === bundleId) {
        console.log(`✅ [AUTO_INJECTION] Bundle injection verified via isolation metafields`);
        return {
          success: true,
          injectionMethod: 'isolation_metafields'
        };
      }

      return {
        success: false,
        error: 'Bundle injection not detected - bundle_config metafield missing or incorrect'
      };

    } catch (error) {
      console.error(`❌ [AUTO_INJECTION] Error verifying bundle injection:`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get bundle injection status for all bundle products
   */
  static async getBundleInjectionStatus(admin: any, shopId: string): Promise<any> {
    console.log(`📊 [AUTO_INJECTION] Getting bundle injection status for shop: ${shopId}`);

    try {
      // Get all bundle products from database
      const db = (await import("../db.server")).default;

      const bundles = await db.bundle.findMany({
        where: {
          shopId: shopId,
          status: 'active',
          bundleType: 'cart_transform',
          shopifyProductId: { not: null }
        },
        select: {
          id: true,
          name: true,
          shopifyProductId: true
        }
      });

      const injectionStatus = [];

      for (const bundle of bundles) {
        if (bundle.shopifyProductId) {
          const verification = await this.verifyBundleInjection(
            admin,
            bundle.shopifyProductId,
            bundle.id
          );

          injectionStatus.push({
            bundleId: bundle.id,
            bundleName: bundle.name,
            productId: bundle.shopifyProductId,
            injectionWorking: verification.success,
            injectionMethod: verification.injectionMethod,
            error: verification.error
          });
        }
      }

      console.log(`📊 [AUTO_INJECTION] Bundle injection status:`, injectionStatus);
      return injectionStatus;

    } catch (error) {
      console.error(`❌ [AUTO_INJECTION] Error getting injection status:`, error);
      return [];
    }
  }
}
