/**
 * Widget Installation Detection Service
 *
 * Detects whether the Bundle Widget has been installed in the merchant's theme
 * and provides deep linking functionality for easy installation.
 */

import { AppLogger } from "../lib/logger";

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

export class WidgetInstallationService {
  /**
   * Check if the Bundle Widget block exists in the current theme
   *
   * Uses Shopify Admin GraphQL API to check for:
   * 1. Theme template files that contain the bundle widget block
   * 2. JSON template files with app block references
   */
  static async checkWidgetInstallation(
    admin: any,
    shop: string
  ): Promise<WidgetInstallationStatus> {
    try {
      AppLogger.debug('Checking widget installation status', {
        component: 'WidgetInstallationService',
        shop
      });

      // 1. Get Current Published Theme
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

      // 2. Fetch Template Files
      // FIX: Updated structure to use edges -> node and correct fragment placement
      // Note: 'query' parameter is not supported on files field in API 2025-10+
      // We fetch all files and filter client-side instead
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
        variables: {
          themeId
        }
      });
      const filesData = await filesResponse.json();

      // FIX: Check for 'edges' instead of 'nodes'
      if (!filesData?.data?.theme?.files?.edges) {
        AppLogger.warn('Could not fetch theme files', {
          component: 'WidgetInstallationService',
          shop,
          themeId
        });
        return { installed: false, themeId, themeName, lastChecked: new Date() };
      }

      // FIX: Map edges to nodes
      const files = filesData.data.theme.files.edges.map((edge: any) => edge.node);
      
      // Filter is now largely redundant due to the query param, but good for safety
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
        // FIX: Access content via the nested body object
        const content = file.body?.content || '';

        AppLogger.debug('Scanning template file', {
          component: 'WidgetInstallationService',
          shop,
          file: file.filename,
          contentLength: content.length,
          hasBundleType: content.includes('"type": "Bundle"'),
          hasWolfpackText: content.includes('Wolfpack: Product Bundles'),
          hasAppBlock: content.includes('"type": "app"'),
          hasExtension: content.includes('shopify://apps/')
        });

        if (content.includes('"type": "Bundle"') ||
            content.includes('Wolfpack: Product Bundles') ||
            content.includes('bundle')) {
          widgetFound = true;
          AppLogger.info('Widget installation detected', {
            component: 'WidgetInstallationService',
            shop,
            themeId,
            file: file.filename
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
   * Generate enhanced theme editor deep link with bundle ID pre-population
   *
   * Reference: https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration
   *
   * @param shop - Shop domain (with or without .myshopify.com)
   * @param apiKey - App API key (client_id from shopify.app.toml)
   * @param blockHandle - Block handle (filename without .liquid)
   * @param bundleId - Optional bundle ID to pre-populate
   * @param template - Template to open (default: product)
   * @param target - Where to add the block (default: newAppsSection)
   */
  static generateThemeEditorDeepLink(
    shop: string,
    apiKey: string,
    blockHandle: string = 'bundle',
    bundleId?: string,
    template: string = 'product',
    target: string = 'newAppsSection'
  ): ThemeEditorDeepLink {
    // Clean shop domain (remove .myshopify.com if present)
    const shopDomain = shop.replace('.myshopify.com', '');

    // CRITICAL: Use app's API key (client_id), not extension UUID
    const appBlockId = `${apiKey}/${blockHandle}`;

    // Build URL parameters
    const params = new URLSearchParams({
      template: template,
      addAppBlockId: appBlockId,
      target: target
    });

    // Add bundle ID if provided (enables auto-configuration in theme editor)
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
   * Generate installation link for a specific bundle
   * Opens theme editor with bundle pre-selected
   */
  static generateBundleInstallationLink(
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

    // Add product handle if provided
    if (productHandle) {
      params.append('productHandle', productHandle);
    }

    const url = `https://${shopDomain}.myshopify.com/admin/themes/current/editor?${params.toString()}`;

    return url;
  }

  /**
   * Check if widget needs installation prompt
   * Returns true if widget is not installed or check is stale
   */
  static shouldShowInstallationPrompt(
    status: WidgetInstallationStatus | null,
    maxAgeMinutes: number = 60
  ): boolean {
    if (!status) return true;
    if (!status.installed) return true;

    // Check if status is stale (older than maxAgeMinutes)
    const now = new Date();
    const checkAge = now.getTime() - status.lastChecked.getTime();
    const maxAgeMs = maxAgeMinutes * 60 * 1000;

    return checkAge > maxAgeMs;
  }

  /**
   * Check if a specific bundle is configured in the installed widget
   *
   * Looks for bundle ID references in:
   * 1. Theme template JSON (block settings)
   * 2. Widget block configuration
   *
   * This helps determine if we need to "add bundle to widget" vs "install widget"
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

      // First get the current published theme
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
      // Note: 'query' parameter is not supported on files field in API 2025-10+
      // We fetch all files and filter client-side instead
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
        variables: {
          themeId
        }
      });
      const filesData = await filesResponse.json();

      if (!filesData?.data?.theme?.files?.edges) {
        return false;
      }

      // Map edges to nodes
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

        AppLogger.debug('Checking template for bundle ID', {
          component: 'WidgetInstallationService',
          shop,
          bundleId,
          file: file.filename,
          hasBundleIdKey: content.includes(`"bundle_id"`),
          hasBundleIdValue: content.includes(`"${bundleId}"`),
          hasAnyBundleId: content.includes('bundle_id')
        });

        // Check if this template contains our bundle ID in settings
        // Look for "bundle_id": "bundleId" pattern
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

      // Return false on error (conservative approach)
      return false;
    }
  }

  /**
   * Check if full-page bundle widget exists in page templates
   * Full-page bundles are placed on 'page' templates, not 'product' templates
   */
  static async checkFullPageBundleInstallation(
    admin: any,
    shop: string,
    bundleId: string
  ): Promise<{
    installed: boolean;
    bundleConfigured: boolean;
    themeId?: string;
    themeName?: string;
  }> {
    try {
      AppLogger.debug('Checking full-page bundle installation', {
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

      // Fetch page template files (not product templates!)
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

      // Filter for PAGE templates (not product templates)
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

        AppLogger.debug('Scanning page template file', {
          component: 'WidgetInstallationService',
          shop,
          file: file.filename,
          contentLength: content.length,
          hasFullPageHandle: content.includes('bundle-full-page'),
          hasFullPageName: content.includes('Bundle - Full Page'),
          hasBundleId: content.includes(`"${bundleId}"`),
          hasAppBlock: content.includes('"type": "app"')
        });

        // Check if page template contains full-page bundle block
        if (content.includes('bundle-full-page') || content.includes('Bundle - Full Page')) {
          widgetFound = true;
          AppLogger.info('Full-page widget installation detected', {
            component: 'WidgetInstallationService',
            shop,
            themeId,
            file: file.filename
          });

          // Check if THIS specific bundle is configured
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
      AppLogger.error('Failed to check full-page bundle installation', {
        component: 'WidgetInstallationService',
        shop,
        bundleId
      }, error);

      return { installed: false, bundleConfigured: false };
    }
  }

  /**
   * Get smart installation status for a specific bundle
   * Returns contextual information about what action the merchant should take
   *
   * For FULL-PAGE bundles: checks page templates
   * For PRODUCT-PAGE bundles: checks product templates
   */
  static async getBundleInstallationContext(
    admin: any,
    shop: string,
    bundleId: string,
    bundleType?: 'full_page' | 'product_page'
  ): Promise<{
    widgetInstalled: boolean;
    bundleConfigured: boolean;
    recommendedAction: 'install_widget' | 'add_bundle' | 'configured' | 'update_bundle';
    themeName?: string;
  }> {
    try {
      // For full-page bundles, check page templates
      if (bundleType === 'full_page') {
        const fullPageStatus = await this.checkFullPageBundleInstallation(admin, shop, bundleId);

        if (!fullPageStatus.installed) {
          return {
            widgetInstalled: false,
            bundleConfigured: false,
            recommendedAction: 'install_widget',
            themeName: fullPageStatus.themeName
          };
        }

        if (fullPageStatus.bundleConfigured) {
          return {
            widgetInstalled: true,
            bundleConfigured: true,
            recommendedAction: 'configured',
            themeName: fullPageStatus.themeName
          };
        } else {
          return {
            widgetInstalled: true,
            bundleConfigured: false,
            recommendedAction: 'add_bundle',
            themeName: fullPageStatus.themeName
          };
        }
      }

      // For product-page bundles, check product templates (existing logic)
      const widgetStatus = await this.checkWidgetInstallation(admin, shop);

      if (!widgetStatus.installed) {
        return {
          widgetInstalled: false,
          bundleConfigured: false,
          recommendedAction: 'install_widget',
          themeName: widgetStatus.themeName
        };
      }

      const bundleConfigured = await this.checkBundleInWidget(admin, shop, bundleId);

      if (bundleConfigured) {
        return {
          widgetInstalled: true,
          bundleConfigured: true,
          recommendedAction: 'configured',
          themeName: widgetStatus.themeName
        };
      } else {
        return {
          widgetInstalled: true,
          bundleConfigured: false,
          recommendedAction: 'add_bundle',
          themeName: widgetStatus.themeName
        };
      }

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

  /**
   * Automatically place widget in theme on product template
   * Uses Shopify Admin GraphQL API to programmatically add app block
   *
   * @param admin - Shopify admin API client
   * @param shop - Shop domain
   * @param apiKey - App API key (client_id)
   * @param bundleId - Bundle ID to configure in the widget
   * @param templateName - Template to add widget to (default: 'product')
   * @returns Success status and details
   */
  static async autoPlaceWidget(
    admin: any,
    shop: string,
    apiKey: string,
    bundleId?: string,
    templateName: string = 'product'
  ): Promise<{
    success: boolean;
    message: string;
    themeId?: string;
    themeName?: string;
    templatePath?: string;
    error?: string;
  }> {
    try {
      AppLogger.info('Auto-placing widget in theme', {
        component: 'WidgetInstallationService',
        shop,
        templateName,
        bundleId
      });

      // 1. Get current published theme
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
        return {
          success: false,
          message: 'No published theme found',
          error: 'No published theme found'
        };
      }

      const theme = themeData.data.themes.edges[0].node;
      const themeId = theme.id;
      const themeName = theme.name;

      AppLogger.info('Found theme for auto-placement', {
        component: 'WidgetInstallationService',
        themeId,
        themeName
      });

      // 2. Read current product template
      const templateFilename = `templates/${templateName}.json`;
      const READ_TEMPLATE_QUERY = `
        query ReadTemplate($themeId: ID!, $filename: String!) {
          theme(id: $themeId) {
            files(filenames: [$filename], first: 1) {
              nodes {
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
      `;

      const templateResponse = await admin.graphql(READ_TEMPLATE_QUERY, {
        variables: {
          themeId,
          filename: templateFilename
        }
      });
      const templateData = await templateResponse.json();

      if (!templateData?.data?.theme?.files?.nodes?.length) {
        return {
          success: false,
          message: `Template ${templateFilename} not found in theme`,
          themeId,
          themeName,
          error: `Template ${templateFilename} not found`
        };
      }

      const templateFile = templateData.data.theme.files.nodes[0];
      const templateContent = templateFile.body?.content;

      if (!templateContent) {
        return {
          success: false,
          message: 'Template content is empty',
          themeId,
          themeName,
          error: 'Template content is empty'
        };
      }

      // 3. Parse and modify template JSON
      let templateJson;
      try {
        templateJson = JSON.parse(templateContent);
      } catch (parseError) {
        AppLogger.error('Failed to parse template JSON', {
          component: 'WidgetInstallationService',
          templateFilename
        }, parseError);
        return {
          success: false,
          message: 'Failed to parse template JSON',
          themeId,
          themeName,
          error: 'Invalid template JSON'
        };
      }

      // Check if sections exist
      if (!templateJson.sections) {
        templateJson.sections = {};
      }

      // Generate unique section ID for app block
      const sectionId = `app_bundle_${Date.now()}`;

      // Add bundle app block to sections
      // Format: shopify://apps/{apiKey}/blocks/{blockHandle}/{extensionUuid}
      // For simplicity, we'll use the pattern: apps/{apiKey}/blocks/bundle
      const appBlockType = `shopify://apps/${apiKey}/blocks/bundle`;

      templateJson.sections[sectionId] = {
        type: appBlockType,
        settings: {
          enabled: true,
          ...(bundleId && { bundle_id: bundleId })
        }
      };

      // Add section to order (after main product section if it exists)
      if (!templateJson.order) {
        templateJson.order = [];
      }

      // Try to place after 'main' section, or at the beginning
      const mainIndex = templateJson.order.indexOf('main');
      if (mainIndex !== -1) {
        templateJson.order.splice(mainIndex + 1, 0, sectionId);
      } else {
        templateJson.order.unshift(sectionId);
      }

      AppLogger.info('Modified template JSON with bundle block', {
        component: 'WidgetInstallationService',
        sectionId,
        appBlockType
      });

      // 4. Write updated template back to theme
      const UPSERT_TEMPLATE_MUTATION = `
        mutation UpsertTemplate($themeId: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) {
          themeFilesUpsert(themeId: $themeId, files: $files) {
            upsertedThemeFiles {
              filename
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const upsertResponse = await admin.graphql(UPSERT_TEMPLATE_MUTATION, {
        variables: {
          themeId,
          files: [{
            filename: templateFilename,
            body: {
              type: 'TEXT',
              value: JSON.stringify(templateJson, null, 2)
            }
          }]
        }
      });
      const upsertData = await upsertResponse.json();

      // Check for errors
      if (upsertData?.data?.themeFilesUpsert?.userErrors?.length > 0) {
        const errors = upsertData.data.themeFilesUpsert.userErrors;
        AppLogger.error('Theme file upsert failed', {
          component: 'WidgetInstallationService',
          errors
        });
        return {
          success: false,
          message: `Failed to update template: ${errors.map((e: any) => e.message).join(', ')}`,
          themeId,
          themeName,
          error: errors[0].message
        };
      }

      AppLogger.info('Successfully auto-placed widget', {
        component: 'WidgetInstallationService',
        shop,
        themeId,
        themeName,
        templatePath: templateFilename
      });

      return {
        success: true,
        message: `Widget automatically placed on ${templateName} template`,
        themeId,
        themeName,
        templatePath: templateFilename
      };

    } catch (error) {
      AppLogger.error('Failed to auto-place widget', {
        component: 'WidgetInstallationService',
        shop,
        templateName
      }, error);

      return {
        success: false,
        message: 'Failed to automatically place widget',
        error: (error as Error).message
      };
    }
  }

  /**
   * Validate and prepare widget placement for FULL-PAGE bundles (on pages, not products)
   *
   * For full-page bundles:
   * - No product template needed
   * - No container product required
   * - Opens page editor instead of product editor
   *
   * @param admin - Shopify admin API client
   * @param shop - Shop domain
   * @param apiKey - App API key
   * @param bundleId - Bundle ID to configure
   * @param pageHandle - Optional page handle to navigate to
   * @returns Validation result with installation link
   */
  /**
   * Create a Shopify page automatically for full-page bundle with SMART AUTOMATION
   * - Creates page with bundle ID metafield
   * - Uses Shopify's theme editor deep linking to auto-add app block
   * - No special permissions required (no themeFilesUpsert needed!)
   * - Merchant just clicks "Add" in theme editor - pre-configured and ready!
   */
  static async createFullPageBundlePageAutomated(
    admin: any,
    shop: string,
    apiKey: string,
    bundleId: string,
    bundleName: string
  ): Promise<{
    success: boolean;
    installationLink?: string;
    pageId?: string;
    pageHandle?: string;
    error?: string;
    errorType?: 'page_creation_failed' | 'metafield_failed' | 'unknown';
  }> {
    try {
      AppLogger.info('Creating SMART AUTOMATED full-page bundle page', {
        component: 'WidgetInstallationService',
        shop,
        bundleId,
        bundleName
      });

      // Step 1: Create the page
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
            body: `<div style="text-align: center; padding: 60px 20px;">
  <h1 style="font-size: 2em; margin-bottom: 20px;">${bundleName}</h1>
  <p style="color: #666; font-size: 1.1em;">Loading bundle builder...</p>
</div>`,
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

      // Step 3: Build theme editor deep link to auto-add app block
      const shopDomain = shop.replace('.myshopify.com', '');
      const appBlockId = `${apiKey}/bundle-full-page`;

      // Theme editor deep link with auto-add parameters
      // This opens the theme editor with the app block ready to add - merchant just clicks "Add"
      const themeEditorUrl = `https://${shopDomain}.myshopify.com/admin/themes/current/editor?` +
        `previewPath=/pages/${pageHandle}&` +
        `addAppBlockId=${appBlockId}&` +
        `target=newAppsSection`;

      AppLogger.info('SMART AUTOMATION completed successfully!', {
        component: 'WidgetInstallationService',
        shop,
        bundleId,
        pageId: createdPage.id,
        pageHandle: createdPage.handle,
        themeEditorUrl
      });

      return {
        success: true,
        installationLink: themeEditorUrl,
        pageId: createdPage.id,
        pageHandle: createdPage.handle
      };

    } catch (error) {
      AppLogger.error('Failed to create automated full-page bundle', {
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

  static async validateAndPrepareFullPageWidgetPlacement(
    admin: any,
    shop: string,
    apiKey: string,
    bundleId: string,
    pageHandle?: string
  ): Promise<{
    success: boolean;
    installationLink?: string;
    error?: string;
    message?: string;
  }> {
    try {
      AppLogger.info('Preparing full-page bundle widget placement', {
        component: 'WidgetInstallationService',
        shop,
        bundleId,
        pageHandle
      });

      const shopDomain = shop.replace('.myshopify.com', '');
      const appBlockId = `${apiKey}/bundle-full-page`;

      // Build theme editor URL for page template
      const params = new URLSearchParams({
        template: 'page',  // Page template, not product
        addAppBlockId: appBlockId,
        target: 'newAppsSection',
        bundleId: bundleId
      });

      // Add page handle if provided
      if (pageHandle) {
        params.append('pageHandle', pageHandle);
      }

      const url = `https://${shopDomain}.myshopify.com/admin/themes/current/editor?${params.toString()}`;

      AppLogger.info('Generated full-page widget placement link', {
        component: 'WidgetInstallationService',
        shop,
        bundleId,
        pageHandle,
        url
      });

      return {
        success: true,
        installationLink: url,
        message: 'Ready to place widget on page template'
      };

    } catch (error) {
      AppLogger.error('Failed to prepare full-page widget placement', {
        component: 'WidgetInstallationService',
        shop,
        bundleId
      }, error);

      return {
        success: false,
        error: 'Failed to prepare widget placement. Please try again.'
      };
    }
  }

  /**
   * Validate and prepare widget placement for a bundle product
   *
   * Checks:
   * 1. Template name is provided
   * 2. Template exists in theme
   * 3. Product is published to Online Store
   *
   * @returns Validation result with installation link or error
   */
  static async validateAndPrepareWidgetPlacement(
    admin: any,
    shop: string,
    apiKey: string,
    bundleId: string,
    templateName: string | null | undefined,
    shopifyProductId: string | null | undefined
  ): Promise<{
    success: boolean;
    installationLink?: string;
    error?: string;
    errorType?: 'missing_template' | 'template_not_found' | 'product_not_published' | 'missing_product_id' | 'unknown';
  }> {
    try {
      // 1. Check if template name is provided
      if (!templateName || templateName.trim() === '') {
        return {
          success: false,
          error: 'Please specify a Bundle Container Template name before placing the widget',
          errorType: 'missing_template'
        };
      }

      // 2. Check if product ID exists
      if (!shopifyProductId) {
        return {
          success: false,
          error: 'Bundle product ID not found. Please save the bundle first.',
          errorType: 'missing_product_id'
        };
      }

      // 3. Get current theme
      const CURRENT_THEME_QUERY = `
        query GetCurrentTheme {
          themes(first: 1, roles: [MAIN]) {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      `;

      const themeResponse = await admin.graphql(CURRENT_THEME_QUERY);
      const themeData = await themeResponse.json();

      if (!themeData?.data?.themes?.edges?.length) {
        return {
          success: false,
          error: 'No published theme found',
          errorType: 'unknown'
        };
      }

      const theme = themeData.data.themes.edges[0].node;
      const themeId = theme.id;

      // 4. Check if template exists in theme
      const normalizedTemplateName = templateName.startsWith('product.') ? templateName : `product.${templateName}`;
      const templateFilename = `templates/${normalizedTemplateName}.json`;

      const CHECK_TEMPLATE_QUERY = `
        query CheckTemplate($themeId: ID!, $filename: String!) {
          theme(id: $themeId) {
            files(filenames: [$filename], first: 1) {
              nodes {
                filename
              }
            }
          }
        }
      `;

      const templateCheckResponse = await admin.graphql(CHECK_TEMPLATE_QUERY, {
        variables: {
          themeId,
          filename: templateFilename
        }
      });
      const templateCheckData = await templateCheckResponse.json();

      const templateExists = templateCheckData?.data?.theme?.files?.nodes?.length > 0;

      if (!templateExists) {
        return {
          success: false,
          error: `Template "${normalizedTemplateName}" not found in your theme. Please create this template first or use an existing template name.`,
          errorType: 'template_not_found'
        };
      }

      // 5. Check if product is published to Online Store and auto-publish if needed
      // First, get all available publications to find Online Store publication ID
      const GET_PUBLICATIONS = `
        query GetPublications {
          publications(first: 10) {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      `;

      const publicationsResponse = await admin.graphql(GET_PUBLICATIONS);
      const publicationsData = await publicationsResponse.json();

      const onlineStorePublication = publicationsData.data?.publications?.edges?.find(
        (edge: any) => edge.node.name === 'Online Store'
      );

      if (onlineStorePublication) {
        // Check if product is published to this specific publication
        const CHECK_PUBLICATION_QUERY = `
          query CheckProductPublication($productId: ID!, $publicationId: ID!) {
            product(id: $productId) {
              id
              publishedOnPublication(publicationId: $publicationId)
            }
          }
        `;

        const publicationResponse = await admin.graphql(CHECK_PUBLICATION_QUERY, {
          variables: {
            productId: shopifyProductId,
            publicationId: onlineStorePublication.node.id
          }
        });
        const publicationData = await publicationResponse.json();

        const isPublishedToOnlineStore = publicationData?.data?.product?.publishedOnPublication === true;

        if (!isPublishedToOnlineStore) {
          // Try to publish it automatically
          try {
            const PUBLISH_PRODUCT = `
              mutation publishToOnlineStore($id: ID!, $input: [PublicationInput!]!) {
                publishablePublish(id: $id, input: $input) {
                  publishable {
                    availablePublicationsCount {
                      count
                    }
                  }
                  userErrors {
                    field
                    message
                  }
                }
              }
            `;

            const publishResult = await admin.graphql(PUBLISH_PRODUCT, {
              variables: {
                id: shopifyProductId,
                input: [
                  {
                    publicationId: onlineStorePublication.node.id
                  }
                ]
              }
            });

            const publishData = await publishResult.json();

            if (publishData?.data?.publishablePublish?.userErrors?.length > 0) {
              AppLogger.error('Failed to auto-publish product', {
                component: 'WidgetInstallationService',
                errors: publishData.data.publishablePublish.userErrors
              });

              return {
                success: false,
                error: 'Product is not published to Online Store. Please publish the bundle product first.',
                errorType: 'product_not_published'
              };
            }

            AppLogger.info('Auto-published product to Online Store for widget placement', {
              component: 'WidgetInstallationService',
              productId: shopifyProductId,
              bundleId
            });
          } catch (publishError) {
            AppLogger.error('Failed to auto-publish product', {
              component: 'WidgetInstallationService'
            }, publishError);

            return {
              success: false,
              error: 'Product is not published to Online Store. Please publish the bundle product first.',
              errorType: 'product_not_published'
            };
          }
        }
      }

      // 6. Fetch the actual product handle (not just the ID)
      const GET_PRODUCT_HANDLE = `
        query GetProductHandle($id: ID!) {
          product(id: $id) {
            id
            handle
          }
        }
      `;

      const productHandleResponse = await admin.graphql(GET_PRODUCT_HANDLE, {
        variables: {
          id: shopifyProductId
        }
      });
      const productHandleData = await productHandleResponse.json();
      const productHandle = productHandleData?.data?.product?.handle;

      if (!productHandle) {
        return {
          success: false,
          error: 'Could not fetch product handle. Please try again.',
          errorType: 'unknown'
        };
      }

      // 7. Generate installation link for the specific product with the specified template
      const shopDomain = shop.replace('.myshopify.com', '');
      const appBlockId = `${apiKey}/bundle`;

      const params = new URLSearchParams({
        template: normalizedTemplateName,
        addAppBlockId: appBlockId,
        target: 'newAppsSection',
        bundleId: bundleId,
        productHandle: productHandle  // Include product handle in params
      });

      const url = `https://${shopDomain}.myshopify.com/admin/themes/current/editor?${params.toString()}`;

      AppLogger.info('Generated validated widget placement link', {
        component: 'WidgetInstallationService',
        shop,
        templateName: normalizedTemplateName,
        bundleId,
        productHandle
      });

      return {
        success: true,
        installationLink: url
      };

    } catch (error) {
      AppLogger.error('Failed to validate widget placement', {
        component: 'WidgetInstallationService',
        shop,
        bundleId
      }, error);

      return {
        success: false,
        error: 'Failed to validate widget placement. Please try again.',
        errorType: 'unknown'
      };
    }
  }
}
