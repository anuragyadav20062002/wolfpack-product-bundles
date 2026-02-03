/**
 * Widget Theme Editor Deep Links
 *
 * Generates theme editor deep links for widget installation and configuration.
 * These links open the Shopify theme editor with pre-configured settings.
 */

import { AppLogger } from "../../lib/logger";
import type { ThemeEditorDeepLink } from "./types";

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
export function generateThemeEditorDeepLink(
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
    component: 'WidgetThemeEditorLinks',
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
export function generateProductBundleInstallationLink(
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
export function generateProductBundleConfigurationLink(
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
