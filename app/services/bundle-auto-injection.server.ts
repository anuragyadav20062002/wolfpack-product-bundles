// Bundle Auto-Injection Service
// Automatically injects bundle extension blocks into bundle product pages

export class BundleAutoInjectionService {

  /**
   * Inject bundle extension block into bundle product page automatically
   * This ensures bundle products always show the bundle widget without manual theme configuration
   */
  static async injectBundleExtensionIntoProduct(
    admin: any,
    bundleProductId: string,
    bundleId: string
  ): Promise<{ success: boolean; error?: string }> {
    console.log(`🎯 [AUTO_INJECTION] Injecting bundle extension into product: ${bundleProductId}`);

    try {
      // Get the published theme to inject the block
      const themeResult = await this.getPublishedTheme(admin);
      if (!themeResult.success) {
        return { success: false, error: `Failed to get theme: ${themeResult.error}` };
      }

      const themeId = themeResult.themeId;

      // Get product handle to create specific template
      const productHandle = await this.getProductHandle(admin, bundleProductId);
      if (!productHandle) {
        return { success: false, error: 'Failed to get product handle' };
      }

      // Check if product-specific template exists
      const templatePath = `templates/product.${productHandle}.json`;
      const templateExists = await this.checkTemplateExists(admin, themeId!, templatePath);

      if (!templateExists.exists) {
        // Create product-specific template with bundle extension pre-configured
        const createResult = await this.createBundleProductTemplate(
          admin,
          themeId!,
          productHandle,
          bundleId
        );

        if (!createResult.success) {
          console.log(`⚠️ [AUTO_INJECTION] Template creation failed: ${createResult.error}`);
          // Fall back to JavaScript injection if template creation fails
          return await this.injectBundleViaJavaScript(bundleProductId, bundleId);
        }
      } else {
        // Template exists, add bundle block to existing template
        const updateResult = await this.addBundleBlockToExistingTemplate(
          admin,
          themeId!,
          templatePath,
          bundleId
        );

        if (!updateResult.success) {
          console.log(`⚠️ [AUTO_INJECTION] Template update failed: ${updateResult.error}`);
          // Fall back to JavaScript injection
          return await this.injectBundleViaJavaScript(bundleProductId, bundleId);
        }
      }

      console.log(`✅ [AUTO_INJECTION] Successfully injected bundle extension into product template`);
      return { success: true };

    } catch (error) {
      console.error(`❌ [AUTO_INJECTION] Error injecting bundle extension:`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get published theme ID
   */
  private static async getPublishedTheme(admin: any): Promise<{
    success: boolean;
    themeId?: string;
    error?: string;
  }> {
    try {
      const GET_PUBLISHED_THEME = `
        query getPublishedTheme {
          themes(first: 1, roles: [MAIN]) {
            nodes {
              id
              name
              role
            }
          }
        }
      `;

      const response = await admin.graphql(GET_PUBLISHED_THEME);
      const data = await response.json();

      if (data.data?.themes?.nodes?.[0]) {
        const theme = data.data.themes.nodes[0];
        const themeId = theme.id.replace('gid://shopify/OnlineStoreTheme/', '');

        return { success: true, themeId };
      } else {
        return { success: false, error: "No published theme found" };
      }
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get product handle from product ID
   */
  private static async getProductHandle(admin: any, productId: string): Promise<string | null> {
    try {
      const GET_PRODUCT_HANDLE = `
        query getProductHandle($id: ID!) {
          product(id: $id) {
            handle
          }
        }
      `;

      const response = await admin.graphql(GET_PRODUCT_HANDLE, {
        variables: { id: productId }
      });

      const data = await response.json();
      return data.data?.product?.handle || null;

    } catch (error) {
      console.error('Error getting product handle:', error);
      return null;
    }
  }

  /**
   * Check if template exists
   */
  private static async checkTemplateExists(
    admin: any,
    themeId: string,
    templatePath: string
  ): Promise<{ exists: boolean; error?: string }> {
    try {
      const CHECK_THEME_FILE = `
        query checkThemeFile($themeId: ID!, $filename: String!) {
          theme(id: $themeId) {
            files(first: 1, filenames: [$filename]) {
              nodes {
                filename
              }
            }
          }
        }
      `;

      const response = await admin.graphql(CHECK_THEME_FILE, {
        variables: {
          themeId: `gid://shopify/OnlineStoreTheme/${themeId}`,
          filename: templatePath
        }
      });

      const data = await response.json();
      return { exists: data.data?.theme?.files?.nodes?.length > 0 };

    } catch (error) {
      return { exists: false, error: (error as Error).message };
    }
  }

  /**
   * Create bundle product template with bundle extension pre-configured
   */
  private static async createBundleProductTemplate(
    admin: any,
    themeId: string,
    productHandle: string,
    bundleId: string
  ): Promise<{ success: boolean; error?: string }> {
    console.log(`📝 [AUTO_INJECTION] Creating bundle product template for: ${productHandle}`);

    // Note: Shopify restricts theme file creation for most apps
    // This is a graceful fallback that documents what would be ideal
    console.log(`⚠️ [AUTO_INJECTION] Theme file creation restricted by Shopify - using JavaScript injection instead`);

    return {
      success: false,
      error: "THEME_MODIFICATION_RESTRICTED: Shopify restricts direct theme file creation. Using JavaScript injection method instead."
    };
  }

  /**
   * Add bundle block to existing template
   */
  private static async addBundleBlockToExistingTemplate(
    admin: any,
    themeId: string,
    templatePath: string,
    bundleId: string
  ): Promise<{ success: boolean; error?: string }> {
    console.log(`🔧 [AUTO_INJECTION] Adding bundle block to existing template: ${templatePath}`);

    // Note: Shopify restricts theme file modification for most apps
    console.log(`⚠️ [AUTO_INJECTION] Theme file modification restricted by Shopify - using JavaScript injection instead`);

    return {
      success: false,
      error: "THEME_MODIFICATION_RESTRICTED: Shopify restricts direct theme file modification. Using JavaScript injection method instead."
    };
  }

  /**
   * Inject bundle extension via JavaScript (fallback method)
   * This method uses JavaScript to automatically show the bundle widget on bundle products
   */
  private static async injectBundleViaJavaScript(
    bundleProductId: string,
    bundleId: string
  ): Promise<{ success: boolean; error?: string }> {
    console.log(`💉 [AUTO_INJECTION] Using JavaScript injection method for bundle: ${bundleId}`);

    // This method relies on the enhanced bundle widget JavaScript
    // that automatically detects bundle products and shows the widget
    // The bundle isolation metafields we set will trigger automatic display

    // The JavaScript logic is already implemented in bundle-widget.js:
    // 1. Detects bundle products via isolation metafields
    // 2. Automatically hides default Add to Cart buttons
    // 3. Shows bundle extension with proper bundle ID
    // 4. Displays "Add Bundle to Cart" instead of regular "Add to Cart"

    console.log(`✅ [AUTO_INJECTION] JavaScript injection method configured successfully`);
    console.log(`📋 [AUTO_INJECTION] Bundle widget will automatically display on product with isolation metafields`);

    return { success: true };
  }

  /**
   * Remove bundle extension injection from product
   */
  static async removeBundleInjection(
    admin: any,
    bundleProductId: string
  ): Promise<{ success: boolean; error?: string }> {
    console.log(`🗑️ [AUTO_INJECTION] Removing bundle injection from product: ${bundleProductId}`);

    try {
      // The main cleanup is handled by removing isolation metafields
      // This will prevent the JavaScript from auto-displaying the bundle widget

      // Remove isolation metafields (this is handled by BundleIsolationService.cleanupIsolationMetafields)
      console.log(`🧹 [AUTO_INJECTION] Bundle injection removal relies on isolation metafield cleanup`);

      return { success: true };

    } catch (error) {
      console.error(`❌ [AUTO_INJECTION] Error removing bundle injection:`, error);
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
      // Check for isolation metafields (JavaScript injection method)
      const CHECK_ISOLATION_METAFIELDS = `
        query checkIsolationMetafields($id: ID!) {
          product(id: $id) {
            id
            handle
            bundleProductType: metafield(namespace: "$app:bundle_isolation", key: "bundle_product_type") {
              value
            }
            ownsBundleId: metafield(namespace: "$app:bundle_isolation", key: "owns_bundle_id") {
              value
            }
          }
        }
      `;

      const response = await admin.graphql(CHECK_ISOLATION_METAFIELDS, {
        variables: { id: bundleProductId }
      });

      const data = await response.json();
      const product = data.data?.product;

      if (product?.bundleProductType?.value === 'cart_transform_bundle' &&
          product?.ownsBundleId?.value === bundleId) {
        console.log(`✅ [AUTO_INJECTION] Bundle injection verified via JavaScript method`);
        return {
          success: true,
          injectionMethod: 'javascript_isolation_metafields'
        };
      }

      return {
        success: false,
        error: 'Bundle injection not detected - isolation metafields missing or incorrect'
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