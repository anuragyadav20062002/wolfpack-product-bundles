import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import db from "../../db.server";
import { createStorefrontAccessToken } from "../../services/storefront-token.server";
import { SHOPIFY_REST_API_VERSION } from "../../constants/api";
// auth: public — fetched directly by the storefront widget (browser request, no Shopify session available)

/**
 * Public API endpoint to fetch products using Storefront API
 * This endpoint can be called from the widget without authentication
 * Route: /api/storefront-products?ids=gid://shopify/Product/123,gid://shopify/Product/456
 */

/**
 * Fetches all variants for a product using cursor-based pagination
 * Handles products with more than 100 variants
 */
async function fetchAllVariants(
  storefrontUrl: string,
  storefrontAccessToken: string,
  productId: string,
  cursor?: string
): Promise<any[]> {
  const VARIANT_QUERY = `
    query getProductVariants($id: ID!, $cursor: String) {
      product(id: $id) {
        variants(first: 100, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              title
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
              availableForSale
              image {
                url
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch(storefrontUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': storefrontAccessToken
    },
    body: JSON.stringify({
      query: VARIANT_QUERY,
      variables: { id: productId, cursor }
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch variants: ${response.status}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  const variantsData = data.data?.product?.variants;
  if (!variantsData) {
    return [];
  }

  const variants = variantsData.edges || [];
  const { hasNextPage, endCursor } = variantsData.pageInfo;

  // Recursively fetch next page if exists
  if (hasNextPage && endCursor) {
    const nextPageVariants = await fetchAllVariants(
      storefrontUrl,
      storefrontAccessToken,
      productId,
      endCursor
    );
    return [...variants, ...nextPageVariants];
  }

  return variants;
}
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const productIds = url.searchParams.get("ids");
  const shop = url.searchParams.get("shop");

  if (!productIds) {
    return json({ error: "Missing product IDs" }, { status: 400 });
  }

  if (!shop) {
    return json({ error: "Missing shop parameter" }, { status: 400 });
  }

  const ids = productIds.split(",").map(id => id.trim()).filter(Boolean);

  if (ids.length === 0) {
    return json({ error: "No valid product IDs provided" }, { status: 400 });
  }

  try {
    // First, fetch basic product info without variants to avoid over-fetching
    const STOREFRONT_QUERY = `
      query getProducts($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Product {
            id
            title
            handle
            featuredImage {
              url
            }
          }
        }
      }
    `;

    // Get storefront access token from database
    let session = await db.session.findFirst({
      where: { shop },
      select: { storefrontAccessToken: true, accessToken: true }
    });

    if (!session) {
      console.error("[STOREFRONT_API] No session found for shop:", shop);
      return json({ error: "Shop not configured. Please reinstall the app." }, { status: 404 });
    }

    // If no storefront token exists, try to create one on-demand (handles race condition)
    if (!session.storefrontAccessToken && session.accessToken) {
      console.log("[STOREFRONT_API] No storefront token found. Creating on-demand for shop:", shop);

      try {
        // Create admin-like object that matches AdminApiContext type
        const admin = {
          graphql: async (query: string, options?: any) => {
            const response = await fetch(`https://${shop}/admin/api/${SHOPIFY_REST_API_VERSION}/graphql.json`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': session!.accessToken
              },
              body: JSON.stringify({
                query,
                variables: options?.variables
              })
            });
            return response;
          }
        } as any; // Type assertion since we're creating a minimal admin context

        const token = await createStorefrontAccessToken(admin, shop);
        console.log("[STOREFRONT_API] ✅ Created storefront token on-demand");

        // Refresh session to get the new token
        session = await db.session.findFirst({
          where: { shop },
          select: { storefrontAccessToken: true, accessToken: true }
        });
      } catch (error) {
        console.error("[STOREFRONT_API] Failed to create token on-demand:", error);
        return json({ error: "Could not create storefront access token" }, { status: 500 });
      }
    }

    if (!session?.storefrontAccessToken) {
      console.error("[STOREFRONT_API] Still no storefront access token after creation attempt");
      return json({ error: "Shop not configured. Please reinstall the app." }, { status: 404 });
    }

    const storefrontAccessToken = session.storefrontAccessToken;
    const storefrontUrl = `https://${shop}/api/${SHOPIFY_REST_API_VERSION}/graphql.json`;

    const response = await fetch(storefrontUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken
      },
      body: JSON.stringify({
        query: STOREFRONT_QUERY,
        variables: { ids }
      })
    });

    if (!response.ok) {
      console.error("[STOREFRONT_API] Request failed:", response.status);
      return json({ error: "Failed to fetch from Storefront API" }, { status: 500 });
    }

    const data = await response.json();

    if (data.errors) {
      console.error("[STOREFRONT_API] GraphQL errors:", data.errors);
      return json({ error: "GraphQL errors", details: data.errors }, { status: 500 });
    }

    const nodes = data.data?.nodes || [];

    // Fetch variants for each product using cursor-based pagination
    // This ensures we get ALL variants even for products with 100+ variants
    const products = await Promise.all(
      nodes.map(async (product: any) => {
        if (!product) return null;

        try {
          // Fetch all variants with pagination
          const variantEdges = await fetchAllVariants(
            storefrontUrl,
            storefrontAccessToken,
            product.id
          );

          return {
            id: product.id,
            title: product.title,
            handle: product.handle,
            imageUrl: product.featuredImage?.url || '',
            variants: variantEdges.map((edge: any) => ({
              id: edge.node.id,
              title: edge.node.title,
              price: edge.node.price?.amount || '0',
              compareAtPrice: edge.node.compareAtPrice?.amount || null,
              available: edge.node.availableForSale,
              image: edge.node.image ? { src: edge.node.image.url } : null
            }))
          };
        } catch (error: any) {
          console.error(`[STOREFRONT_API] Failed to fetch variants for product ${product.id}:`, error.message);
          // Return product with empty variants on error
          return {
            id: product.id,
            title: product.title,
            handle: product.handle,
            imageUrl: product.featuredImage?.url || '',
            variants: []
          };
        }
      })
    );

    const validProducts = products.filter(Boolean);
    const totalVariants = validProducts.reduce((sum, p) => sum + (p?.variants?.length || 0), 0);

    console.log(`[STOREFRONT_API] Successfully fetched ${validProducts.length} products with ${totalVariants} total variants`);

    return json({
      products: validProducts,
      count: validProducts.length
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300, s-maxage=600",
        "Vary": "Accept-Encoding"
      }
    });

  } catch (error: any) {
    console.error("[STOREFRONT_API] Error:", error);
    return json({
      error: "Internal server error",
      message: error.message
    }, { status: 500 });
  }
}

// Handle OPTIONS for CORS
export async function options() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
