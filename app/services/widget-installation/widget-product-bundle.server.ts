/**
 * Widget Product Bundle Operations
 *
 * Handles validation and setup of product page bundle widgets.
 * Production-ready, App Store compliant - NO programmatic theme modifications.
 */

import { AppLogger } from "../../lib/logger";
import {
  generateProductBundleConfigurationLink
} from "./widget-theme-editor-links.server";
import type { ProductBundleWidgetStatus } from "./types";

/**
 * Validate product bundle widget setup and provide guidance
 *
 * Widget is a theme app extension — always assumed installed.
 * Returns appropriate links and guidance for merchant.
 *
 * @param admin - Shopify admin API client
 * @param shop - Shop domain
 * @param apiKey - App API key
 * @param bundleId - Bundle ID
 * @param shopifyProductId - Shopify product ID (optional)
 * @returns Widget status with configuration links
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

    // Provide links to the bundle product if it exists
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

    // No product yet
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
      widgetInstalled: true,
      requiresOneTimeSetup: false,
      message: 'Failed to check widget setup'
    };
  }
}
