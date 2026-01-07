import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import db from "../db.server";
import { createStorefrontAccessToken } from "../services/storefront-token.server";
import { authenticate } from "../shopify.server";

/**
 * Public API endpoint to fetch products using Storefront API
 * This endpoint can be called from the widget without authentication
 * Route: /api/storefront-products?ids=gid://shopify/Product/123,gid://shopify/Product/456
 */
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
            variants(first: 100) {
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
            const response = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
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
    const storefrontUrl = `https://${shop}/api/2025-01/graphql.json`;

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

    // Transform to expected format
    const products = (data.data?.nodes || []).map((product: any) => {
      if (!product) return null;

      return {
        id: product.id,
        title: product.title,
        handle: product.handle,
        imageUrl: product.featuredImage?.url || '',
        variants: (product.variants?.edges || []).map((edge: any) => ({
          id: edge.node.id,
          title: edge.node.title,
          price: edge.node.price?.amount || '0',
          compareAtPrice: edge.node.compareAtPrice?.amount || null,
          available: edge.node.availableForSale,
          image: edge.node.image ? { src: edge.node.image.url } : null
        }))
      };
    }).filter(Boolean);

    console.log(`[STOREFRONT_API] Successfully fetched ${products.length} products`);

    return json({
      products,
      count: products.length
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
