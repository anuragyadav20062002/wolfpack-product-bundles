/**
 * Variant Lookup Utilities
 *
 * Functions to retrieve variant information from Shopify products
 */

import { isValidShopifyProductId } from "./shopify-validators";

/**
 * Batch fetch first variant IDs for multiple products
 * Eliminates N+1 queries by fetching all variants in a single request
 */
export async function batchGetFirstVariants(
  admin: any,
  productIds: string[]
): Promise<Map<string, { success: boolean; variantId?: string; error?: string }>> {
  const results = new Map<string, { success: boolean; variantId?: string; error?: string }>();

  if (productIds.length === 0) {
    return results;
  }

  try {
    // Clean and validate product IDs
    const cleanProductIds = productIds
      .map(id => id.replace('gid://shopify/Product/', ''))
      .filter(id => isValidShopifyProductId(`gid://shopify/Product/${id}`));

    if (cleanProductIds.length === 0) {
      console.warn('[BATCH_VARIANT_LOOKUP] No valid product IDs to fetch');
      productIds.forEach(id => {
        results.set(id.replace('gid://shopify/Product/', ''), {
          success: false,
          error: 'Invalid product ID format'
        });
      });
      return results;
    }

    // Construct GIDs
    const productGids = cleanProductIds.map(id => `gid://shopify/Product/${id}`);

    const BATCH_PRODUCTS_QUERY = `
      query GetBatchProducts($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Product {
            id
            variants(first: 1) {
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      }
    `;

    console.log(`[BATCH_VARIANT_LOOKUP] Fetching variants for ${productGids.length} products in single query`);

    const response = await admin.graphql(BATCH_PRODUCTS_QUERY, {
      variables: { ids: productGids }
    });

    const data = await response.json();

    if (data.errors) {
      console.error('[BATCH_VARIANT_LOOKUP] GraphQL errors:', data.errors);
      cleanProductIds.forEach(id => {
        results.set(id, {
          success: false,
          error: 'GraphQL query error'
        });
      });
      return results;
    }

    // Process results
    const nodes = data.data?.nodes || [];
    nodes.forEach((product: any) => {
      if (product && product.id) {
        const productId = product.id.replace('gid://shopify/Product/', '');
        const variantId = product.variants?.edges?.[0]?.node?.id;

        if (variantId) {
          results.set(productId, {
            success: true,
            variantId
          });
        } else {
          results.set(productId, {
            success: false,
            error: 'No variants found'
          });
        }
      }
    });

    // Mark missing products as not found
    cleanProductIds.forEach(id => {
      if (!results.has(id)) {
        results.set(id, {
          success: false,
          error: 'Product not found (may have been deleted)'
        });
      }
    });

    console.log(`[BATCH_VARIANT_LOOKUP] Successfully fetched ${results.size} variant results`);

    return results;
  } catch (error) {
    console.error('[BATCH_VARIANT_LOOKUP] Error:', error);
    productIds.forEach(id => {
      const cleanId = id.replace('gid://shopify/Product/', '');
      results.set(cleanId, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    });
    return results;
  }
}

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
