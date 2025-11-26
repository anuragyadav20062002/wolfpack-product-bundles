/**
 * Variant Lookup Utilities
 *
 * Functions to retrieve variant information from Shopify products
 */

import { isValidShopifyProductId } from "./shopify-validators";

/**
 * Get the first variant ID for a product
 */
export async function getFirstVariantId(
  admin: any,
  productId: string
): Promise<{ success: boolean; variantId?: string; error?: string; productId: string }> {
  try {
    // Remove gid prefix if present to get just the ID
    const cleanProductId = productId.replace('gid://shopify/Product/', '');

    // Validate that it's a proper Shopify product ID (numeric)
    if (!isValidShopifyProductId(productId)) {
      const errorMsg = `Invalid product ID format (expected numeric Shopify ID, got "${cleanProductId}")`;
      console.error(`❌ [VARIANT_LOOKUP] ${errorMsg}`);
      return { success: false, error: errorMsg, productId: cleanProductId };
    }

    const PRODUCT_QUERY = `
      query GetProduct($id: ID!) {
        product(id: $id) {
          id
          title
          variants(first: 1) {
            edges {
              node {
                id
              }
            }
          }
        }
      }
    `;

    const response = await admin.graphql(PRODUCT_QUERY, {
      variables: {
        id: `gid://shopify/Product/${cleanProductId}`
      }
    });

    const data = await response.json();

    if (data.data?.product?.variants?.edges?.[0]?.node?.id) {
      const variantId = data.data.product.variants.edges[0].node.id;
      console.log(`✅ [VARIANT_LOOKUP] Found variant ${variantId} for product ${cleanProductId}`);
      return { success: true, variantId, productId: cleanProductId };
    }

    const errorMsg = `Product not found in Shopify (may have been deleted)`;
    console.error(`❌ [VARIANT_LOOKUP] ${errorMsg} - Product ID: ${productId}`);
    return { success: false, error: errorMsg, productId: cleanProductId };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ [VARIANT_LOOKUP] GraphQL error for product ${productId}:`, errorMsg);
    return { success: false, error: `API error: ${errorMsg}`, productId: productId.replace('gid://shopify/Product/', '') };
  }
}

/**
 * Get bundle product variant ID
 */
export async function getBundleProductVariantId(admin: any, shopifyProductId: string | null): Promise<string | null> {
  if (!shopifyProductId) {
    return null;
  }

  try {
    const GET_BUNDLE_PRODUCT_VARIANT = `
      query GetBundleProductVariant($id: ID!) {
        product(id: $id) {
          variants(first: 1) {
            edges {
              node {
                id
              }
            }
          }
        }
      }
    `;

    const response = await admin.graphql(GET_BUNDLE_PRODUCT_VARIANT, {
      variables: { id: shopifyProductId }
    });

    const data = await response.json();
    const variantId = data.data?.product?.variants?.edges?.[0]?.node?.id;

    console.log(`🔍 [VARIANT_LOOKUP] Product ${shopifyProductId} → Variant ${variantId}`);
    return variantId || null;
  } catch (error) {
    console.error(`❌ [VARIANT_LOOKUP] Failed to get variant for product ${shopifyProductId}:`, error);
    return null;
  }
}
