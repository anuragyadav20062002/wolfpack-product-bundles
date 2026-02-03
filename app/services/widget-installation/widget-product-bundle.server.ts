/**
 * Widget Product Bundle Operations
 *
 * Handles validation and setup of product page bundle widgets.
 * Production-ready, App Store compliant - NO programmatic theme modifications.
 */

import { AppLogger } from "../../lib/logger";
import { WidgetInstallationFlagsService } from "../widget-installation-flags.server";
import {
  generateProductBundleInstallationLink,
  generateProductBundleConfigurationLink
} from "./widget-theme-editor-links.server";
import type { ProductBundleWidgetStatus } from "./types";

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
export async function validateProductBundleWidgetSetup(
  admin: any,
  shop: string,
  apiKey: string,
  bundleId: string,
  shopifyProductId?: string
): Promise<ProductBundleWidgetStatus> {
  try {
    AppLogger.info('Validating product bundle widget setup', {
      component: 'WidgetProductBundle',
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
      const installLink = generateProductBundleInstallationLink(
        shop,
        apiKey,
        bundleId
      );

      AppLogger.info('Product widget not installed, returning setup link', {
        component: 'WidgetProductBundle',
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
        const configLink = generateProductBundleConfigurationLink(
          shop,
          apiKey,
          bundleId,
          productHandle
        );

        AppLogger.info('Product bundle ready', {
          component: 'WidgetProductBundle',
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
      component: 'WidgetProductBundle',
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
