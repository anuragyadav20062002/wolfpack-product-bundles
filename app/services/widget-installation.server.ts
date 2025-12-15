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

      // Query for the current published theme
      const CURRENT_THEME_QUERY = `
        query GetCurrentTheme {
          themes(first: 1, query: "role:main") {
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
        AppLogger.warn('No published theme found', {
          component: 'WidgetInstallationService',
          shop
        });
        return {
          installed: false,
          lastChecked: new Date()
        };
      }

      const theme = themeData.data.themes.edges[0].node;
      const themeId = theme.id;
      const themeName = theme.name;

      // Check if product template contains bundle widget block
      // Look for templates/product.json which would contain app block references
      const TEMPLATE_FILES_QUERY = `
        query GetTemplateFiles($themeId: ID!) {
          theme(id: $themeId) {
            files(first: 50) {
              nodes {
                filename
                ... on OnlineStoreThemeFileBodyText {
                  body {
                    content
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

      if (!filesData?.data?.theme?.files?.nodes) {
        AppLogger.warn('Could not fetch theme files', {
          component: 'WidgetInstallationService',
          shop,
          themeId
        });
        return {
          installed: false,
          themeId,
          themeName,
          lastChecked: new Date()
        };
      }

      // Check for bundle widget in template files
      const files = filesData.data.theme.files.nodes;
      const productTemplateFiles = files.filter((file: any) =>
        file.filename.includes('templates/product') &&
        file.filename.endsWith('.json')
      );

      let widgetFound = false;

      for (const file of productTemplateFiles) {
        const content = file.body?.content || '';

        // Check if content contains reference to bundle widget block
        // Look for "type": "bundle" or block handle reference
        if (content.includes('"type": "bundle"') ||
            content.includes('bundle-builder') ||
            content.includes('bundle_builder')) {
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

      // Return conservative result on error
      return {
        installed: false,
        lastChecked: new Date()
      };
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
   * Generate generic installation link (no bundle pre-selected)
   * Useful for general setup instructions
   */
  static generateGenericInstallationLink(
    shop: string,
    apiKey: string
  ): string {
    const deepLink = this.generateThemeEditorDeepLink(
      shop,
      apiKey,
      'bundle',
      undefined,
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

      // First get the current theme
      const CURRENT_THEME_QUERY = `
        query GetCurrentTheme {
          themes(first: 1, query: "role:main") {
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
        return false;
      }

      const theme = themeData.data.themes.edges[0].node;
      const themeId = theme.id;

      // Get product template files
      const TEMPLATE_FILES_QUERY = `
        query GetTemplateFiles($themeId: ID!) {
          theme(id: $themeId) {
            files(first: 50) {
              nodes {
                filename
                ... on OnlineStoreThemeFileBodyText {
                  body {
                    content
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

      if (!filesData?.data?.theme?.files?.nodes) {
        return false;
      }

      // Check for bundle ID in template files
      const files = filesData.data.theme.files.nodes;
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
}
