/**
 * Widget Installation Legacy Methods
 *
 * @deprecated These methods are NO LONGER USED.
 * They read theme files which requires read_themes scope.
 * For "Built for Shopify" compliance, use WidgetInstallationService instead.
 *
 * @see WidgetInstallationService.isWidgetInstalled()
 *
 * Kept for backward compatibility and reference.
 */

import { AppLogger } from "../../lib/logger";
import type { WidgetInstallationStatus } from "./types";

/**
 * @deprecated Legacy method - NO LONGER USED
 *
 * This method reads theme files which requires read_themes scope.
 * For "Built for Shopify" compliance, use WidgetInstallationService instead.
 *
 * @see WidgetInstallationService.isWidgetInstalled()
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
export async function checkWidgetInstallation(
  admin: any,
  shop: string,
  apiKey?: string
): Promise<WidgetInstallationStatus> {
  try {
    AppLogger.debug('Checking widget installation status', {
      component: 'WidgetInstallationLegacy',
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
      AppLogger.warn('No published theme found', { component: 'WidgetInstallationLegacy', shop });
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
        component: 'WidgetInstallationLegacy',
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
      component: 'WidgetInstallationLegacy',
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
          component: 'WidgetInstallationLegacy',
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
      component: 'WidgetInstallationLegacy',
      shop
    }, error);

    return { installed: false, lastChecked: new Date() };
  }
}

/**
 * @deprecated Legacy method - NO LONGER USED
 *
 * This method reads theme files which requires read_themes scope.
 * For "Built for Shopify" compliance, use WidgetInstallationService instead.
 *
 * @see WidgetInstallationService.isWidgetInstalled()
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
export async function checkFullPageWidgetInstallation(
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
      component: 'WidgetInstallationLegacy',
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
      component: 'WidgetInstallationLegacy',
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
          component: 'WidgetInstallationLegacy',
          shop,
          themeId,
          file: file.filename,
          detectionMethod: hasOurFullPageBlock ? 'specific-app-block' : 'generic-pattern'
        });

        if (content.includes(`"${bundleId}"`)) {
          bundleConfigured = true;
          AppLogger.info('Bundle configured in full-page widget', {
            component: 'WidgetInstallationLegacy',
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
      component: 'WidgetInstallationLegacy',
      shop,
      bundleId
    }, error);

    return { installed: false, bundleConfigured: false };
  }
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
export async function checkBundleInWidget(
  admin: any,
  shop: string,
  bundleId: string
): Promise<boolean> {
  try {
    AppLogger.debug('Checking if bundle is configured in widget', {
      component: 'WidgetInstallationLegacy',
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
      component: 'WidgetInstallationLegacy',
      shop,
      bundleId,
      templateCount: productTemplateFiles.length
    });

    for (const file of productTemplateFiles) {
      const content = file.body?.content || '';

      if (content.includes(`"bundle_id"`) && content.includes(`"${bundleId}"`)) {
        AppLogger.info('Bundle found in widget configuration', {
          component: 'WidgetInstallationLegacy',
          shop,
          bundleId,
          file: file.filename
        });
        return true;
      }
    }

    AppLogger.debug('Bundle not found in widget configuration', {
      component: 'WidgetInstallationLegacy',
      shop,
      bundleId,
      checkedFiles: productTemplateFiles.map((f: any) => f.filename)
    });

    return false;

  } catch (error) {
    AppLogger.error('Failed to check if bundle is in widget', {
      component: 'WidgetInstallationLegacy',
      shop,
      bundleId
    }, error);

    return false;
  }
}
