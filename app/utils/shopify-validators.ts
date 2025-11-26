/**
 * Shopify Data Validation Utilities
 *
 * Functions to validate Shopify-specific data formats
 */

/**
 * Check if a string is a UUID
 */
export function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Validate if a product ID is a valid Shopify numeric ID
 */
export function isValidShopifyProductId(productId: string): boolean {
  const cleanId = productId.replace('gid://shopify/Product/', '');
  // Shopify product IDs are numeric strings
  return /^\d+$/.test(cleanId);
}
