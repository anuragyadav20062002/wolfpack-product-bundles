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

      for (const file of productTemplateFiles) {
        // FIX: Access content via the nested body object
        const content = file.body?.content || '';

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
    bundleId: string
  ): string {
    const deepLink = this.generateThemeEditorDeepLink(
      shop,
      apiKey,
      'bundle',
      bundleId,
      'product',
      'newAppsSection'
    );

    return deepLink.url;
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

      for (const file of productTemplateFiles) {
        const content = file.body?.content || '';

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
        bundleId
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
   * Get smart installation status for a specific bundle
   * Returns contextual information about what action the merchant should take
   */
  static async getBundleInstallationContext(
    admin: any,
    shop: string,
    bundleId: string
  ): Promise<{
    widgetInstalled: boolean;
    bundleConfigured: boolean;
    recommendedAction: 'install_widget' | 'add_bundle' | 'configured' | 'update_bundle';
    themeName?: string;
  }> {
    try {
      // Check if widget is installed
      const widgetStatus = await this.checkWidgetInstallation(admin, shop);

      if (!widgetStatus.installed) {
        // Widget not installed at all
        return {
          widgetInstalled: false,
          bundleConfigured: false,
          recommendedAction: 'install_widget',
          themeName: widgetStatus.themeName
        };
      }

      // Widget is installed, check if THIS bundle is configured
      const bundleConfigured = await this.checkBundleInWidget(admin, shop, bundleId);

      if (bundleConfigured) {
        // Widget installed and this bundle is already configured
        return {
          widgetInstalled: true,
          bundleConfigured: true,
          recommendedAction: 'configured',
          themeName: widgetStatus.themeName
        };
      } else {
        // Widget installed but this bundle is NOT configured
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

      // Default to install_widget on error
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

      // 5. Check if product is published to Online Store
      const CHECK_PUBLICATION_QUERY = `
        query CheckProductPublication($productId: ID!) {
          product(id: $productId) {
            id
            publishedOnCurrentPublication
            publications(first: 10) {
              edges {
                node {
                  name
                  publishDate
                }
              }
            }
          }
        }
      `;

      const publicationResponse = await admin.graphql(CHECK_PUBLICATION_QUERY, {
        variables: {
          productId: shopifyProductId
        }
      });
      const publicationData = await publicationResponse.json();

      const isPublishedToOnlineStore = publicationData?.data?.product?.publications?.edges?.some(
        (edge: any) => edge.node.name === 'Online Store' && edge.node.publishDate
      );

      if (!isPublishedToOnlineStore) {
        // Try to publish it automatically
        try {
          const GET_PUBLICATIONS = `
            query {
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

            await admin.graphql(PUBLISH_PRODUCT, {
              variables: {
                id: shopifyProductId,
                input: [
                  {
                    publicationId: onlineStorePublication.node.id
                  }
                ]
              }
            });

            AppLogger.info('Auto-published product to Online Store for widget placement', {
              component: 'WidgetInstallationService',
              productId: shopifyProductId,
              bundleId
            });
          }
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

      // 6. Extract product handle from GID
      const productHandle = shopifyProductId.split('/').pop() || '';

      // 7. Generate installation link for the specific product with the specified template
      const shopDomain = shop.replace('.myshopify.com', '');
      const appBlockId = `${apiKey}/bundle`;

      const params = new URLSearchParams({
        template: normalizedTemplateName,
        addAppBlockId: appBlockId,
        target: 'newAppsSection',
        bundleId: bundleId
      });

      const url = `https://${shopDomain}.myshopify.com/admin/themes/current/editor?${params.toString()}&productHandle=${productHandle}`;

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
