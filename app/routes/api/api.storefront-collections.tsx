import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import db from "../../db.server";
import { SHOPIFY_REST_API_VERSION } from "../../constants/api";

// auth: public — fetched directly by the storefront widget (browser request, no Shopify session available)

/**
 * Public API endpoint to fetch products from collections using Storefront API
 * This replaces the legacy /collections/{handle}/products.json REST endpoint
 * Route: /api/storefront-collections?handles=collection-1,collection-2&shop=store.myshopify.com
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const collectionHandles = url.searchParams.get("handles");
  const shop = url.searchParams.get("shop");

  if (!collectionHandles) {
    return json({ error: "Missing collection handles" }, { status: 400 });
  }

  if (!shop) {
    return json({ error: "Missing shop parameter" }, { status: 400 });
  }

  const handles = collectionHandles.split(",").map(h => h.trim()).filter(Boolean);

  if (handles.length === 0) {
    return json({ error: "No valid collection handles provided" }, { status: 400 });
  }

  try {
    // GraphQL query to fetch products from multiple collections
    const STOREFRONT_QUERY = `
      query getCollectionProducts($query: String!) {
        collections(first: 10, query: $query) {
          edges {
            node {
              id
              handle
              products(first: 250) {
                edges {
                  node {
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
            }
          }
        }
      }
    `;

    // Get storefront access token from database
    const session = await db.session.findFirst({
      where: { shop },
      select: { storefrontAccessToken: true }
    });

    if (!session?.storefrontAccessToken) {
      console.error("[STOREFRONT_COLLECTIONS] No storefront token found for shop:", shop);
      return json({ error: "Shop not configured. Please reinstall the app." }, { status: 404 });
    }

    const storefrontAccessToken = session.storefrontAccessToken;
    const storefrontUrl = `https://${shop}/api/${SHOPIFY_REST_API_VERSION}/graphql.json`;

    // Build query filter for handles
    const queryFilter = handles.map(h => `handle:${h}`).join(" OR ");

    const response = await fetch(storefrontUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken
      },
      body: JSON.stringify({
        query: STOREFRONT_QUERY,
        variables: { query: queryFilter }
      })
    });

    if (!response.ok) {
      console.error("[STOREFRONT_COLLECTIONS] Request failed:", response.status);
      return json({ error: "Failed to fetch from Storefront API" }, { status: 500 });
    }

    const data = await response.json();

    if (data.errors) {
      console.error("[STOREFRONT_COLLECTIONS] GraphQL errors:", data.errors);
      return json({ error: "GraphQL errors", details: data.errors }, { status: 500 });
    }

    // Flatten all products from all collections
    const allProducts: any[] = [];
    const collections = data.data?.collections?.edges || [];

    collections.forEach((collectionEdge: any) => {
      const products = collectionEdge.node?.products?.edges || [];
      products.forEach((productEdge: any) => {
        const product = productEdge.node;
        if (product) {
          allProducts.push({
            id: product.id,
            title: product.title,
            handle: product.handle,
            imageUrl: product.featuredImage?.url || '',
            variants: (product.variants?.edges || []).map((edge: any) => ({
              id: edge.node.id,
              title: edge.node.title,
              price: edge.node.price?.amount || '0',
              available: edge.node.availableForSale,
              image: edge.node.image ? { src: edge.node.image.url } : null
            }))
          });
        }
      });
    });

    // Remove duplicates (product might be in multiple collections)
    const uniqueProducts = Array.from(
      new Map(allProducts.map(p => [p.id, p])).values()
    );

    console.log(`[STOREFRONT_COLLECTIONS] Successfully fetched ${uniqueProducts.length} unique products from ${handles.length} collections`);

    return json({
      products: uniqueProducts,
      count: uniqueProducts.length
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300, s-maxage=600",
        "Vary": "Accept-Encoding"
      }
    });

  } catch (error: any) {
    console.error("[STOREFRONT_COLLECTIONS] Error:", error);
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
