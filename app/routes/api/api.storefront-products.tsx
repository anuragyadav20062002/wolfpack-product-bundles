import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import db from "../../db.server";
import { createStorefrontAccessToken } from "../../services/storefront-token.server";
import { SHOPIFY_REST_API_VERSION } from "../../constants/api";
// auth: public — fetched directly by the storefront widget (browser request, no Shopify session available)

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * Public API endpoint to fetch products using Storefront API
 * This endpoint can be called from the widget without authentication
 * Route: /api/storefront-products?ids=gid://shopify/Product/123,gid://shopify/Product/456
 */

/**
 * Fetches all variants for a product using cursor-based pagination
 * Handles products with more than 100 variants.
 * When country is provided, uses @inContext to get market-correct prices from Shopify Markets.
 */
async function fetchAllVariants(
  storefrontUrl: string,
  storefrontAccessToken: string,
  productId: string,
  country: string | null,
  cursor?: string
): Promise<any[]> {
  const VARIANT_QUERY = country
    ? `query getProductVariants($id: ID!, $cursor: String, $country: CountryCode!) @inContext(country: $country) {
        product(id: $id) {
          variants(first: 100, after: $cursor) {
            pageInfo { hasNextPage endCursor }
            edges {
              node {
                id title availableForSale
                price { amount currencyCode }
                compareAtPrice { amount currencyCode }
                image { url }
              }
            }
          }
        }
      }`
    : `query getProductVariants($id: ID!, $cursor: String) {
        product(id: $id) {
          variants(first: 100, after: $cursor) {
            pageInfo { hasNextPage endCursor }
            edges {
              node {
                id title availableForSale
                price { amount currencyCode }
                compareAtPrice { amount currencyCode }
                image { url }
              }
            }
          }
        }
      }`;

  const variables: Record<string, string | undefined> = { id: productId, cursor };
  if (country) variables.country = country;

  const response = await fetch(storefrontUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': storefrontAccessToken
    },
    body: JSON.stringify({ query: VARIANT_QUERY, variables })
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
      country,
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
  // ISO 3166-1 alpha-2 country code from the customer's browser context (e.g. "CA", "DE").
  // When provided, Storefront API returns market-correct prices via @inContext.
  const country = url.searchParams.get("country") || null;

  if (!productIds) {
    return json({ error: "Missing product IDs" }, { status: 400, headers: CORS_HEADERS });
  }

  if (!shop) {
    return json({ error: "Missing shop parameter" }, { status: 400, headers: CORS_HEADERS });
  }

  const ids = productIds.split(",").map(id => id.trim()).filter(Boolean);

  if (ids.length === 0) {
    return json({ error: "No valid product IDs provided" }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    // Fetch basic product info. Use @inContext when country is available so
    // featured image URLs are market-correct (no pricing on this query).
    const STOREFRONT_QUERY = country
      ? `query getProducts($ids: [ID!]!, $country: CountryCode!) @inContext(country: $country) {
          nodes(ids: $ids) {
            ... on Product { id title handle featuredImage { url } }
          }
        }`
      : `query getProducts($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Product { id title handle featuredImage { url } }
          }
        }`;

    // Get storefront access token from database
    let session = await db.session.findFirst({
      where: { shop },
      select: { storefrontAccessToken: true, accessToken: true }
    });

    if (!session) {
      console.error("[STOREFRONT_API] No session found for shop:", shop);
      return json({ error: "Shop not configured. Please reinstall the app." }, { status: 404, headers: CORS_HEADERS });
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
        return json({ error: "Could not create storefront access token" }, { status: 500, headers: CORS_HEADERS });
      }
    }

    if (!session?.storefrontAccessToken) {
      console.error("[STOREFRONT_API] Still no storefront access token after creation attempt");
      return json({ error: "Shop not configured. Please reinstall the app." }, { status: 404, headers: CORS_HEADERS });
    }

    const storefrontAccessToken = session.storefrontAccessToken;
    const storefrontUrl = `https://${shop}/api/${SHOPIFY_REST_API_VERSION}/graphql.json`;

    const mainVariables: Record<string, unknown> = { ids };
    if (country) mainVariables.country = country;

    const response = await fetch(storefrontUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken
      },
      body: JSON.stringify({ query: STOREFRONT_QUERY, variables: mainVariables })
    });

    if (!response.ok) {
      console.error("[STOREFRONT_API] Request failed:", response.status);
      return json({ error: "Failed to fetch from Storefront API" }, { status: 500, headers: CORS_HEADERS });
    }

    const data = await response.json();

    if (data.errors) {
      console.error("[STOREFRONT_API] GraphQL errors:", data.errors);
      return json({ error: "GraphQL errors", details: data.errors }, { status: 500, headers: CORS_HEADERS });
    }

    const nodes = data.data?.nodes || [];

    // Fetch variants for each product using cursor-based pagination
    // This ensures we get ALL variants even for products with 100+ variants
    const products = await Promise.all(
      nodes.map(async (product: any) => {
        if (!product) return null;

        try {
          // Fetch all variants with pagination; pass country for market-correct prices
          const variantEdges = await fetchAllVariants(
            storefrontUrl,
            storefrontAccessToken,
            product.id,
            country
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
        ...CORS_HEADERS,
        "Cache-Control": "public, max-age=300, s-maxage=600",
        "Vary": "Accept-Encoding"
      }
    });

  } catch (error: any) {
    console.error("[STOREFRONT_API] Error:", error);
    return json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500, headers: CORS_HEADERS });
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
