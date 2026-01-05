/**
 * Widget Installation Flags Service
 *
 * Manages widget installation status using shop metafields instead of theme file reads.
 * This approach is "Built for Shopify" compliant and doesn't require read_themes scope.
 *
 * @see https://shopify.dev/docs/apps/build/online-store/theme-app-extensions
 */

import { AppLogger } from "../lib/logger";

// ============================================================================
// Type Definitions
// ============================================================================

export type WidgetType = 'product_page' | 'full_page';

export interface WidgetInstallationFlags {
  productPageWidgetInstalled: boolean;
  fullPageWidgetInstalled: boolean;
}

// ============================================================================
// Widget Installation Flags Service
// ============================================================================

export class WidgetInstallationFlagsService {

  /**
   * Get widget installation status from shop metafields
   *
   * Uses app-owned shop metafields to track installation status.
   * No theme file reading required - "Built for Shopify" compliant.
   *
   * @param admin - Shopify admin API client
   * @param shop - Shop domain
   * @returns Widget installation flags
   */
  static async getInstallationFlags(
    admin: any,
    shop: string
  ): Promise<WidgetInstallationFlags> {
    try {
      AppLogger.debug('Fetching widget installation flags from metafields', {
        component: 'WidgetInstallationFlagsService',
        shop
      });

      const GET_SHOP_METAFIELDS = `
        query GetShopMetafields {
          shop {
            metafield(namespace: "$app", key: "productPageWidgetInstalled") {
              value
            }
            fullPageWidget: metafield(namespace: "$app", key: "fullPageWidgetInstalled") {
              value
            }
          }
        }
      `;

      const response = await admin.graphql(GET_SHOP_METAFIELDS);
      const data = await response.json();

      const productPageInstalled = data.data?.shop?.metafield?.value === 'true';
      const fullPageInstalled = data.data?.shop?.fullPageWidget?.value === 'true';

      AppLogger.debug('Widget installation flags retrieved', {
        component: 'WidgetInstallationFlagsService',
        shop,
        productPageInstalled,
        fullPageInstalled
      });

      return {
        productPageWidgetInstalled: productPageInstalled,
        fullPageWidgetInstalled: fullPageInstalled
      };

    } catch (error) {
      AppLogger.error('Failed to get widget installation flags', {
        component: 'WidgetInstallationFlagsService',
        shop
      }, error);

      // Return false by default on error
      return {
        productPageWidgetInstalled: false,
        fullPageWidgetInstalled: false
      };
    }
  }

  /**
   * Set widget installation status in shop metafields
   *
   * Merchants can manually mark widgets as installed via the UI.
   * This updates the shop metafield to track installation status.
   *
   * @param admin - Shopify admin API client
   * @param shop - Shop domain
   * @param widgetType - Type of widget (product_page or full_page)
   * @param installed - Installation status
   */
  static async setInstallationFlag(
    admin: any,
    shop: string,
    widgetType: WidgetType,
    installed: boolean
  ): Promise<boolean> {
    try {
      AppLogger.info('Setting widget installation flag', {
        component: 'WidgetInstallationFlagsService',
        shop,
        widgetType,
        installed
      });

      const metafieldKey = widgetType === 'product_page'
        ? 'productPageWidgetInstalled'
        : 'fullPageWidgetInstalled';

      const SET_SHOP_METAFIELD = `
        mutation SetShopMetafield($metafields: [MetafieldsSetInput!]!) {
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

      const response = await admin.graphql(SET_SHOP_METAFIELD, {
        variables: {
          metafields: [{
            ownerId: `gid://shopify/Shop/${shop.replace('.myshopify.com', '')}`,
            namespace: '$app',
            key: metafieldKey,
            value: installed.toString(),
            type: 'boolean'
          }]
        }
      });

      const data = await response.json();

      if (data.data?.metafieldsSet?.userErrors?.length > 0) {
        AppLogger.error('Failed to set widget installation flag', {
          component: 'WidgetInstallationFlagsService',
          shop,
          widgetType,
          errors: data.data.metafieldsSet.userErrors
        });
        return false;
      }

      AppLogger.info('Widget installation flag set successfully', {
        component: 'WidgetInstallationFlagsService',
        shop,
        widgetType,
        installed
      });

      return true;

    } catch (error) {
      AppLogger.error('Failed to set widget installation flag', {
        component: 'WidgetInstallationFlagsService',
        shop,
        widgetType
      }, error);

      return false;
    }
  }

  /**
   * Check if a specific widget type is installed
   *
   * Convenience method to check a single widget type.
   *
   * @param admin - Shopify admin API client
   * @param shop - Shop domain
   * @param widgetType - Type of widget to check
   * @returns Installation status
   */
  static async isWidgetInstalled(
    admin: any,
    shop: string,
    widgetType: WidgetType
  ): Promise<boolean> {
    const flags = await this.getInstallationFlags(admin, shop);

    return widgetType === 'product_page'
      ? flags.productPageWidgetInstalled
      : flags.fullPageWidgetInstalled;
  }

  /**
   * Mark widget as installed (convenience method)
   *
   * @param admin - Shopify admin API client
   * @param shop - Shop domain
   * @param widgetType - Type of widget
   */
  static async markAsInstalled(
    admin: any,
    shop: string,
    widgetType: WidgetType
  ): Promise<boolean> {
    return this.setInstallationFlag(admin, shop, widgetType, true);
  }

  /**
   * Mark widget as not installed (convenience method)
   *
   * @param admin - Shopify admin API client
   * @param shop - Shop domain
   * @param widgetType - Type of widget
   */
  static async markAsNotInstalled(
    admin: any,
    shop: string,
    widgetType: WidgetType
  ): Promise<boolean> {
    return this.setInstallationFlag(admin, shop, widgetType, false);
  }
}
