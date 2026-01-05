/**
 * Widget Installation Service - Production Ready
 *
 * Provides widget installation detection and deep linking for Theme App Extensions.
 * Compliant with Shopify App Store policies - NO programmatic theme modifications.
 *
 * @see https://shopify.dev/docs/apps/build/online-store/theme-app-extensions
 */

import { AppLogger } from "../lib/logger";
import { WidgetInstallationFlagsService } from "./widget-installation-flags.server";

// ============================================================================
// Type Definitions
// ============================================================================

export interface WidgetInstallationStatus {
  installed: boolean;
  themeId?: string;
  themeName?: string;
  lastChecked: Date;
}

export interface ThemeEditorDeepLink {
  url: string;
  template: string;
  bundleId?: string;
}

export interface FullPageBundleResult {
  success: boolean;
  pageId?: string;
  pageHandle?: string;
  pageUrl?: string;
  widgetInstallationRequired?: boolean;
  widgetInstallationLink?: string;
  error?: string;
  errorType?: 'page_creation_failed' | 'metafield_failed' | 'widget_not_installed' | 'unknown';
}

export interface ProductBundleWidgetStatus {
  widgetInstalled: boolean;
  installationLink?: string;
  productUrl?: string;
  configurationLink?: string;
  message: string;
  requiresOneTimeSetup: boolean;
}

export interface BundleInstallationContext {
  widgetInstalled: boolean;
  bundleConfigured: boolean;
  recommendedAction: 'install_widget' | 'add_bundle' | 'configured' | 'update_bundle';
  themeName?: string;
}

// ============================================================================
// Widget Installation Service
// ============================================================================

export class WidgetInstallationService {

  // ==========================================================================
  // Widget Detection Methods (Read-Only)
  // ==========================================================================

  /**
   * @deprecated Legacy method - NO LONGER USED
   *
   * This method reads theme files which requires read_themes scope.
   * For "Built for Shopify" compliance, use WidgetInstallationFlagsService instead.
   *
   * @see WidgetInstallationFlagsService.isWidgetInstalled()
   *
   * Check if the Bundle Widget block exists in product templates
   *
   * Uses Shopify Admin GraphQL API to check for app block references.
   * This is a READ-ONLY operation - no theme modifications.
   *
   * @param admin - Shopify admin API client
   * @param shop - Shop domain
   * @param apiKey - App API key to check for specific app block references
   * @returns Installation status
   */
  static async checkWidgetInstallation(
    admin: any,
    shop: string,
    apiKey?: string
  ): Promise<WidgetInstallationStatus> {
    try {
      AppLogger.debug('Checking widget installation status', {
        component: 'WidgetInstallationService',
        shop
      });

      // Get current published theme
      const CURRENT_THEME_QUERY = `
        query GetCurrentTheme {
          themes(first: 1, roles: [MAIN]) {
            edges {
              node {
                id
                name
                role
              }
            }
          }
        }
      `;

      const themeResponse = await admin.graphql(CURRENT_THEME_QUERY);
      const themeData = await themeResponse.json();

      if (!themeData?.data?.themes?.edges?.length) {
        AppLogger.warn('No published theme found', { component: 'WidgetInstallationService', shop });
        return { installed: false, lastChecked: new Date() };
      }

      const theme = themeData.data.themes.edges[0].node;
      const themeId = theme.id;
      const themeName = theme.name;

      // Fetch template files
      const TEMPLATE_FILES_QUERY = `
        query GetTemplateFiles($themeId: ID!) {
          theme(id: $themeId) {
            files(first: 100) {
              edges {
                node {
                  filename
                  body {
                    ... on OnlineStoreThemeFileBodyText {
                      content
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const filesResponse = await admin.graphql(TEMPLATE_FILES_QUERY, {
        variables: { themeId }
      });
      const filesData = await filesResponse.json();

      if (!filesData?.data?.theme?.files?.edges) {
        AppLogger.warn('Could not fetch theme files', {
          component: 'WidgetInstallationService',
          shop,
          themeId
        });
        return { installed: false, themeId, themeName, lastChecked: new Date() };
      }

      const files = filesData.data.theme.files.edges.map((edge: any) => edge.node);
      const productTemplateFiles = files.filter((file: any) =>
        file.filename.includes('templates/product') &&
        file.filename.endsWith('.json')
      );

      let widgetFound = false;

      AppLogger.debug('Checking product template files for widget', {
        component: 'WidgetInstallationService',
        shop,
        templateCount: productTemplateFiles.length,
        templates: productTemplateFiles.map((f: any) => f.filename)
      });

      for (const file of productTemplateFiles) {
        const content = file.body?.content || '';

        const hasOurAppBlock = apiKey && (
          content.includes(`shopify://apps/${apiKey}/blocks/bundle`)
        );

        const hasGenericBundlePattern = !apiKey && (
          content.includes('"type": "Bundle"') ||
          content.includes('Wolfpack: Product Bundles')
        );

        if (hasOurAppBlock || hasGenericBundlePattern) {
          widgetFound = true;
          AppLogger.info('Widget installation detected', {
            component: 'WidgetInstallationService',
            shop,
            themeId,
            file: file.filename,
            detectionMethod: hasOurAppBlock ? 'specific-app-block' : 'generic-pattern'
          });
          break;
        }
      }

      return {
        installed: widgetFound,
        themeId,
        themeName,
        lastChecked: new Date()
      };

    } catch (error) {
      AppLogger.error('Failed to check widget installation', {
        component: 'WidgetInstallationService',
        shop
      }, error);

      return { installed: false, lastChecked: new Date() };
    }
  }

  /**
   * @deprecated Legacy method - NO LONGER USED
   *
   * This method reads theme files which requires read_themes scope.
   * For "Built for Shopify" compliance, use WidgetInstallationFlagsService instead.
   *
   * @see WidgetInstallationFlagsService.isWidgetInstalled()
   *
   * Check if full-page bundle widget exists in page templates
   *
   * Full-page bundles are placed on 'page' templates, not 'product' templates.
   * This is a READ-ONLY operation.
   *
   * @param admin - Shopify admin API client
   * @param shop - Shop domain
   * @param bundleId - Bundle ID to check for
   * @param apiKey - App API key for specific app block detection
   * @returns Installation status with bundle configuration flag
   */
  static async checkFullPageWidgetInstallation(
    admin: any,
    shop: string,
    bundleId: string,
    apiKey?: string
  ): Promise<{
    installed: boolean;
    bundleConfigured: boolean;
    themeId?: string;
    themeName?: string;
  }> {
    try {
      AppLogger.debug('Checking full-page bundle widget installation', {
        component: 'WidgetInstallationService',
        shop,
        bundleId
      });

      // Get current published theme
      const CURRENT_THEME_QUERY = `
        query GetCurrentTheme {
          themes(first: 1, roles: [MAIN]) {
            edges {
              node {
                id
                name
                role
              }
            }
          }
        }
      `;

      const themeResponse = await admin.graphql(CURRENT_THEME_QUERY);
      const themeData = await themeResponse.json();

      if (!themeData?.data?.themes?.edges?.length) {
        return { installed: false, bundleConfigured: false };
      }

      const theme = themeData.data.themes.edges[0].node;
      const themeId = theme.id;
      const themeName = theme.name;

      // Fetch page template files
      const TEMPLATE_FILES_QUERY = `
        query GetTemplateFiles($themeId: ID!) {
          theme(id: $themeId) {
            files(first: 100) {
              edges {
                node {
                  filename
                  body {
                    ... on OnlineStoreThemeFileBodyText {
                      content
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const filesResponse = await admin.graphql(TEMPLATE_FILES_QUERY, {
        variables: { themeId }
      });
      const filesData = await filesResponse.json();

      if (!filesData?.data?.theme?.files?.edges) {
        return { installed: false, bundleConfigured: false, themeId, themeName };
      }

      const files = filesData.data.theme.files.edges.map((edge: any) => edge.node);
      const pageTemplateFiles = files.filter((file: any) =>
        file.filename.includes('templates/page') &&
        file.filename.endsWith('.json')
      );

      let widgetFound = false;
      let bundleConfigured = false;

      AppLogger.debug('Checking page template files for full-page widget', {
        component: 'WidgetInstallationService',
        shop,
        bundleId,
        templateCount: pageTemplateFiles.length,
        templates: pageTemplateFiles.map((f: any) => f.filename)
      });

      for (const file of pageTemplateFiles) {
        const content = file.body?.content || '';

        const hasOurFullPageBlock = apiKey &&
          content.includes(`shopify://apps/${apiKey}/blocks/bundle-full-page`);

        const hasGenericFullPagePattern = !apiKey && (
          content.includes('bundle-full-page') ||
          content.includes('Bundle - Full Page')
        );

        if (hasOurFullPageBlock || hasGenericFullPagePattern) {
          widgetFound = true;
          AppLogger.info('Full-page widget installation detected', {
            component: 'WidgetInstallationService',
            shop,
            themeId,
            file: file.filename,
            detectionMethod: hasOurFullPageBlock ? 'specific-app-block' : 'generic-pattern'
          });

          if (content.includes(`"${bundleId}"`)) {
            bundleConfigured = true;
            AppLogger.info('Bundle configured in full-page widget', {
              component: 'WidgetInstallationService',
              shop,
              bundleId,
              file: file.filename
            });
          }
          break;
        }
      }

      return {
        installed: widgetFound,
        bundleConfigured: bundleConfigured,
        themeId,
        themeName
      };

    } catch (error) {
      AppLogger.error('Failed to check full-page bundle widget installation', {
        component: 'WidgetInstallationService',
        shop,
        bundleId
      }, error);

      return { installed: false, bundleConfigured: false };
    }
  }

  /**
   * Get smart installation context for a specific bundle
   *
   * Returns contextual information about what action the merchant should take.
   * For FULL-PAGE bundles: checks page templates
   * For PRODUCT-PAGE bundles: checks product templates
   *
   * @param admin - Shopify admin API client
   * @param shop - Shop domain
   * @param bundleId - Bundle ID
   * @param bundleType - Bundle type (full_page or product_page)
   * @param apiKey - App API key for specific app block detection
   * @param bundlePageHandle - Page handle to check if bundle is placed
   * @returns Installation context with recommended action
   */
  static async getBundleInstallationContext(
    admin: any,
    shop: string,
    bundleId: string,
    bundleType?: 'full_page' | 'product_page',
    apiKey?: string,
    bundlePageHandle?: string | null
  ): Promise<BundleInstallationContext> {
    try {
      // For full-page bundles, check metafield flags
      if (bundleType === 'full_page') {
        const widgetInstalled = await WidgetInstallationFlagsService.isWidgetInstalled(
          admin,
          shop,
          'full_page'
        );

        if (!widgetInstalled) {
          return {
            widgetInstalled: false,
            bundleConfigured: false,
            recommendedAction: 'install_widget'
          };
        }

        // For full-page bundles, check if shopifyPageHandle is set
        const bundleConfigured = !!(bundlePageHandle && bundlePageHandle.trim() !== '');

        if (bundleConfigured) {
          return {
            widgetInstalled: true,
            bundleConfigured: true,
            recommendedAction: 'configured'
          };
        } else {
          return {
            widgetInstalled: true,
            bundleConfigured: false,
            recommendedAction: 'add_bundle'
          };
        }
      }

      // For product-page bundles, check metafield flags
      const widgetInstalled = await WidgetInstallationFlagsService.isWidgetInstalled(
        admin,
        shop,
        'product_page'
      );

      if (!widgetInstalled) {
        return {
          widgetInstalled: false,
          bundleConfigured: false,
          recommendedAction: 'install_widget'
        };
      }

      // Widget is installed - always return 'configured' for PDP bundles
      // The widget installation is the key requirement
      return {
        widgetInstalled: true,
        bundleConfigured: true,
        recommendedAction: 'configured'
      };

    } catch (error) {
      AppLogger.error('Failed to get bundle installation context', {
        component: 'WidgetInstallationService',
        shop,
        bundleId
      }, error);

      return {
        widgetInstalled: false,
        bundleConfigured: false,
        recommendedAction: 'install_widget'
      };
    }
  }

  // ==========================================================================
  // Deep Link Generation (Theme Editor Navigation)
  // ==========================================================================

  /**
   * Generate theme editor deep link with bundle ID pre-population
   *
   * Opens theme editor with the specified app block pre-selected.
   * Supports bundle ID parameter for auto-configuration.
   *
   * @param shop - Shop domain (with or without .myshopify.com)
   * @param apiKey - App API key (client_id from shopify.app.toml)
   * @param blockHandle - Block handle (filename without .liquid)
   * @param bundleId - Optional bundle ID to pre-populate
   * @param template - Template to open (default: product)
   * @param target - Where to add the block (default: newAppsSection)
   * @returns Deep link object with URL
   */
  static generateThemeEditorDeepLink(
    shop: string,
    apiKey: string,
    blockHandle: string = 'bundle',
    bundleId?: string,
    template: string = 'product',
    target: string = 'newAppsSection'
  ): ThemeEditorDeepLink {
    const shopDomain = shop.replace('.myshopify.com', '');
    const appBlockId = `${apiKey}/${blockHandle}`;

    const params = new URLSearchParams({
      template: template,
      addAppBlockId: appBlockId,
      target: target
    });

    if (bundleId) {
      params.append('bundleId', bundleId);
    }

    const url = `https://${shopDomain}.myshopify.com/admin/themes/current/editor?${params.toString()}`;

    AppLogger.debug('Generated theme editor deep link', {
      component: 'WidgetInstallationService',
      shop,
      template,
      bundleId,
      appBlockId,
      url
    });

    return {
      url,
      template,
      bundleId
    };
  }

  /**
   * Generate installation link for a specific bundle on product pages
   *
   * Opens theme editor with bundle pre-selected for easy placement.
   * Merchant can then configure position and styling.
   *
   * @param shop - Shop domain
   * @param apiKey - App API key
   * @param bundleId - Bundle ID
   * @param productHandle - Optional product handle to navigate to
   * @returns Installation URL
   */
  static generateProductBundleInstallationLink(
    shop: string,
    apiKey: string,
    bundleId: string,
    productHandle?: string
  ): string {
    const shopDomain = shop.replace('.myshopify.com', '');
    const appBlockId = `${apiKey}/bundle`;

    const params = new URLSearchParams({
      template: 'product',
      addAppBlockId: appBlockId,
      target: 'newAppsSection',
      bundleId: bundleId
    });

    if (productHandle) {
      params.append('productHandle', productHandle);
    }

    return `https://${shopDomain}.myshopify.com/admin/themes/current/editor?${params.toString()}`;
  }

  /**
   * Generate configuration link for bundle on a specific product
   *
   * Opens theme editor on the product page where merchant can
   * configure the bundle widget settings.
   *
   * @param shop - Shop domain
   * @param apiKey - App API key
   * @param bundleId - Bundle ID
   * @param productHandle - Product handle to navigate to
   * @returns Configuration URL
   */
  static generateProductBundleConfigurationLink(
    shop: string,
    apiKey: string,
    bundleId: string,
    productHandle: string
  ): string {
    const shopDomain = shop.replace('.myshopify.com', '');
    const appBlockId = `${apiKey}/bundle`;

    const params = new URLSearchParams({
      context: 'apps',
      template: 'product',
      addAppBlockId: appBlockId,
      target: 'mainSection',
      bundleId: bundleId,
      productHandle: productHandle
    });

    return `https://${shopDomain}.myshopify.com/admin/themes/current/editor?${params.toString()}`;
  }

  // ==========================================================================
  // Full-Page Bundle Operations (Production-Ready)
  // ==========================================================================

  /**
   * Create a full-page bundle with production-ready, App Store compliant flow
   *
   * UPDATED FLOW (Single-Click Experience):
   * 1. Creates page with bundle_id metafield immediately
   * 2. Checks if full-page widget is installed in theme
   * 3. If NOT installed: Returns page info + installation link to that specific page
   * 4. If installed: Returns storefront URL where bundle is live
   *
   * This ensures the page exists BEFORE guiding the user to install the widget,
   * eliminating the need for a second "Add to Storefront" click.
   *
   * NO THEME MODIFICATIONS - Fully compliant with Shopify App Store policies.
   *
   * @param admin - Shopify admin API client
   * @param shop - Shop domain
   * @param apiKey - App API key
   * @param bundleId - Bundle ID to associate with page
   * @param bundleName - Bundle name for page title
   * @returns Result with page URL or installation link
   */
  static async createFullPageBundle(
    admin: any,
    shop: string,
    apiKey: string,
    bundleId: string,
    bundleName: string
  ): Promise<FullPageBundleResult> {
    try {
      AppLogger.info('Creating full-page bundle (single-click mode)', {
        component: 'WidgetInstallationService',
        shop,
        bundleId,
        bundleName
      });

      // Step 1: Create page with metafield FIRST (regardless of widget status)
      const pageHandle = `bundle-${bundleId.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      const pageTitle = bundleName || `Bundle ${bundleId}`;

      const CREATE_PAGE = `
        mutation createPage($page: PageCreateInput!) {
          pageCreate(page: $page) {
            page {
              id
              title
              handle
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const pageResponse = await admin.graphql(CREATE_PAGE, {
        variables: {
          page: {
            title: pageTitle,
            handle: pageHandle,
            body: '',
            isPublished: true
          }
        }
      });

      const pageData = await pageResponse.json();

      if (pageData.data?.pageCreate?.userErrors?.length > 0) {
        const errors = pageData.data.pageCreate.userErrors;
        AppLogger.error('Page creation failed', {
          component: 'WidgetInstallationService',
          errors
        });
        return {
          success: false,
          error: `Failed to create page: ${errors[0].message}`,
          errorType: 'page_creation_failed'
        };
      }

      const createdPage = pageData.data?.pageCreate?.page;

      if (!createdPage) {
        return {
          success: false,
          error: 'Page creation failed - no page returned',
          errorType: 'page_creation_failed'
        };
      }

      AppLogger.info('Page created successfully', {
        component: 'WidgetInstallationService',
        pageId: createdPage.id,
        pageHandle: createdPage.handle
      });

      // Step 2: Add bundle ID as page metafield (for widget to read)
      const SET_METAFIELD = `
        mutation setPageMetafield($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              id
              key
              value
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const metafieldResponse = await admin.graphql(SET_METAFIELD, {
        variables: {
          metafields: [{
            ownerId: createdPage.id,
            namespace: '$app',
            key: 'bundle_id',
            value: bundleId,
            type: 'single_line_text_field'
          }]
        }
      });

      const metafieldData = await metafieldResponse.json();

      if (metafieldData.data?.metafieldsSet?.userErrors?.length > 0) {
        AppLogger.warn('Metafield creation failed (non-critical)', {
          component: 'WidgetInstallationService',
          errors: metafieldData.data.metafieldsSet.userErrors
        });
      } else {
        AppLogger.info('Bundle ID metafield added to page', {
          component: 'WidgetInstallationService',
          pageId: createdPage.id,
          bundleId
        });
      }

      // Step 3: Check if widget is installed using metafield flags
      // Built for Shopify compliant - no theme file reads required!
      const widgetInstalled = await WidgetInstallationFlagsService.isWidgetInstalled(
        admin,
        shop,
        'full_page'
      );

      const shopDomain = shop.replace('.myshopify.com', '');
      const pageUrl = `https://${shopDomain}.myshopify.com/pages/${pageHandle}`;

      // If widget NOT installed, return page info + installation link to this specific page
      if (!widgetInstalled) {
        const appBlockId = `${apiKey}/bundle-full-page`;

        // Create deep link to theme editor with the actual page preview
        // CRITICAL: Use previewPath to load the actual page (not template preview)
        // This ensures page.metafields[app_namespace].bundle_id is available in Liquid
        const installLink = `https://${shopDomain}.myshopify.com/admin/themes/current/editor?` +
          `previewPath=/pages/${pageHandle}&addAppBlockId=${appBlockId}&target=mainSection`;

        AppLogger.info('Page created, but widget not installed - returning setup link', {
          component: 'WidgetInstallationService',
          shop,
          bundleId,
          pageHandle: createdPage.handle,
          installLink
        });

        return {
          success: true,
          pageId: createdPage.id,
          pageHandle: createdPage.handle,
          pageUrl: pageUrl,
          widgetInstallationRequired: true,
          widgetInstallationLink: installLink
        };
      }

      // Step 4: Widget is installed - return success with storefront URL
      AppLogger.info('Full-page bundle created successfully (widget already installed)', {
        component: 'WidgetInstallationService',
        shop,
        bundleId,
        pageId: createdPage.id,
        pageHandle: createdPage.handle,
        pageUrl
      });

      return {
        success: true,
        pageId: createdPage.id,
        pageHandle: createdPage.handle,
        pageUrl: pageUrl
      };

    } catch (error) {
      AppLogger.error('Failed to create full-page bundle', {
        component: 'WidgetInstallationService',
        shop,
        bundleId
      }, error);

      return {
        success: false,
        error: `Failed to create page: ${(error as Error).message}`,
        errorType: 'unknown'
      };
    }
  }

  // ==========================================================================
  // Product Bundle Operations (Production-Ready)
  // ==========================================================================

  /**
   * Validate product bundle widget setup and provide guidance
   *
   * Checks if the bundle widget is installed using metafield flags.
   * Returns appropriate links and guidance for merchant.
   *
   * Built for Shopify compliant - uses metafields instead of theme file reads.
   *
   * @param admin - Shopify admin API client
   * @param shop - Shop domain
   * @param apiKey - App API key
   * @param bundleId - Bundle ID
   * @param shopifyProductId - Shopify product ID (optional)
   * @returns Widget status with installation/configuration links
   */
  static async validateProductBundleWidgetSetup(
    admin: any,
    shop: string,
    apiKey: string,
    bundleId: string,
    shopifyProductId?: string
  ): Promise<ProductBundleWidgetStatus> {
    try {
      AppLogger.info('Validating product bundle widget setup', {
        component: 'WidgetInstallationService',
        shop,
        bundleId,
        shopifyProductId
      });

      // Check if widget is already installed using metafield flags
      const widgetInstalled = await WidgetInstallationFlagsService.isWidgetInstalled(
        admin,
        shop,
        'product_page'
      );

      if (!widgetInstalled) {
        // Widget not installed - provide one-time setup link
        const installLink = this.generateProductBundleInstallationLink(
          shop,
          apiKey,
          bundleId
        );

        AppLogger.info('Product widget not installed, returning setup link', {
          component: 'WidgetInstallationService',
          shop,
          bundleId
        });

        return {
          widgetInstalled: false,
          requiresOneTimeSetup: true,
          installationLink: installLink,
          message: 'One-time setup: Please add the Bundle Widget to your product template'
        };
      }

      // Widget is installed! Now provide links to the bundle product
      if (shopifyProductId) {
        // Get product handle
        const GET_PRODUCT = `
          query GetProduct($id: ID!) {
            product(id: $id) {
              id
              handle
            }
          }
        `;

        const productResponse = await admin.graphql(GET_PRODUCT, {
          variables: { id: shopifyProductId }
        });
        const productData = await productResponse.json();
        const productHandle = productData?.data?.product?.handle;

        if (productHandle) {
          const shopDomain = shop.replace('.myshopify.com', '');
          const productUrl = `https://${shopDomain}.myshopify.com/products/${productHandle}`;
          const configLink = this.generateProductBundleConfigurationLink(
            shop,
            apiKey,
            bundleId,
            productHandle
          );

          AppLogger.info('Product bundle ready', {
            component: 'WidgetInstallationService',
            shop,
            bundleId,
            productHandle
          });

          return {
            widgetInstalled: true,
            requiresOneTimeSetup: false,
            productUrl: productUrl,
            configurationLink: configLink,
            message: 'Bundle is ready! View it on your storefront or configure in theme editor'
          };
        }
      }

      // Widget installed, but no product yet
      return {
        widgetInstalled: true,
        requiresOneTimeSetup: false,
        message: 'Bundle widget is installed. Create a bundle product to see it on your storefront.'
      };

    } catch (error) {
      AppLogger.error('Failed to validate product bundle widget setup', {
        component: 'WidgetInstallationService',
        shop,
        bundleId
      }, error);

      return {
        widgetInstalled: false,
        requiresOneTimeSetup: true,
        message: 'Failed to check widget installation status'
      };
    }
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Check if widget needs installation prompt
   *
   * Returns true if widget is not installed or check is stale.
   *
   * @param status - Widget installation status
   * @param maxAgeMinutes - Maximum age in minutes before status is considered stale
   * @returns Whether to show installation prompt
   */
  static shouldShowInstallationPrompt(
    status: WidgetInstallationStatus | null,
    maxAgeMinutes: number = 60
  ): boolean {
    if (!status) return true;
    if (!status.installed) return true;

    // Check if status is stale
    const now = new Date();
    const checkAge = now.getTime() - status.lastChecked.getTime();
    const maxAgeMs = maxAgeMinutes * 60 * 1000;

    return checkAge > maxAgeMs;
  }

  /**
   * @deprecated Legacy method - NO LONGER USED
   *
   * This method reads theme files which requires read_themes scope.
   * For "Built for Shopify" compliance, widget configuration is tracked
   * via database records (shopifyPageHandle field) instead.
   *
   * Check if a specific bundle is configured in the installed widget
   *
   * Looks for bundle ID references in theme template JSON.
   *
   * @param admin - Shopify admin API client
   * @param shop - Shop domain
   * @param bundleId - Bundle ID to check for
   * @returns Whether bundle is configured in widget
   */
  static async checkBundleInWidget(
    admin: any,
    shop: string,
    bundleId: string
  ): Promise<boolean> {
    try {
      AppLogger.debug('Checking if bundle is configured in widget', {
        component: 'WidgetInstallationService',
        shop,
        bundleId
      });

      // Get current published theme
      const CURRENT_THEME_QUERY = `
        query GetCurrentTheme {
          themes(first: 1, roles: [MAIN]) {
            edges {
              node {
                id
                name
                role
              }
            }
          }
        }
      `;

      const themeResponse = await admin.graphql(CURRENT_THEME_QUERY);
      const themeData = await themeResponse.json();

      if (!themeData?.data?.themes?.edges?.length) {
        return false;
      }

      const theme = themeData.data.themes.edges[0].node;
      const themeId = theme.id;

      // Get product template files
      const TEMPLATE_FILES_QUERY = `
        query GetTemplateFiles($themeId: ID!) {
          theme(id: $themeId) {
            files(first: 100) {
              edges {
                node {
                  filename
                  body {
                    ... on OnlineStoreThemeFileBodyText {
                      content
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const filesResponse = await admin.graphql(TEMPLATE_FILES_QUERY, {
        variables: { themeId }
      });
      const filesData = await filesResponse.json();

      if (!filesData?.data?.theme?.files?.edges) {
        return false;
      }

      const files = filesData.data.theme.files.edges.map((edge: any) => edge.node);
      const productTemplateFiles = files.filter((file: any) =>
        file.filename.includes('templates/product') &&
        file.filename.endsWith('.json')
      );

      AppLogger.debug('Checking templates for bundle ID', {
        component: 'WidgetInstallationService',
        shop,
        bundleId,
        templateCount: productTemplateFiles.length
      });

      for (const file of productTemplateFiles) {
        const content = file.body?.content || '';

        if (content.includes(`"bundle_id"`) && content.includes(`"${bundleId}"`)) {
          AppLogger.info('Bundle found in widget configuration', {
            component: 'WidgetInstallationService',
            shop,
            bundleId,
            file: file.filename
          });
          return true;
        }
      }

      AppLogger.debug('Bundle not found in widget configuration', {
        component: 'WidgetInstallationService',
        shop,
        bundleId,
        checkedFiles: productTemplateFiles.map((f: any) => f.filename)
      });

      return false;

    } catch (error) {
      AppLogger.error('Failed to check if bundle is in widget', {
        component: 'WidgetInstallationService',
        shop,
        bundleId
      }, error);

      return false;
    }
  }
}
