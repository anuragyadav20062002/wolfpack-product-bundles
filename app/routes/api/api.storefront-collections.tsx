import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import prisma from "../../db.server";
import { AppLogger } from "../../lib/logger";
import { SHOPIFY_REST_API_VERSION } from "../../constants/api";
import { getOfflineSessionForShop } from "../../services/offline-token.server";
import { sessionStorage } from "../../shopify.server";

// auth: public — fetched directly by the storefront widget (browser request, no Shopify session available)

const INVENTORY_FIELDS = "quantityAvailable currentlyNotInStock";

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
    const session = await getOfflineSessionForShop(prisma, shop, sessionStorage);

    if (!session?.storefrontAccessToken) {
      AppLogger.warn("[STOREFRONT_COLLECTIONS] No storefront token found for shop", { component: "api.storefront-collections", shop });
      return json({ error: "Shop not configured. Please reinstall the app." }, { status: 404 });
    }

    const hasInventoryScope = (session.scope ?? "").includes("unauthenticated_read_product_inventory");
    const inventoryFields = hasInventoryScope ? ` ${INVENTORY_FIELDS}` : "";
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
                    options {
                      name
                      values
                    }
                    variants(first: 100) {
                      edges {
                        node {
                          id
                          title
                          selectedOptions {
                            name
                            value
                          }
                          price {
                            amount
                            currencyCode
                          }
                          compareAtPrice {
                            amount
                            currencyCode
                          }
                          weight
                          weightUnit
                          availableForSale${inventoryFields}
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
      AppLogger.error("[STOREFRONT_COLLECTIONS] Storefront API request failed", { component: "api.storefront-collections", status: response.status });
      return json({ error: "Failed to fetch from Storefront API" }, { status: 500 });
    }

    const data = await response.json();

    if (data.errors) {
      AppLogger.error("[STOREFRONT_COLLECTIONS] GraphQL errors", { component: "api.storefront-collections" }, data.errors);
      return json({ error: "GraphQL errors", details: data.errors }, { status: 500 });
    }

    // Flatten all products from all collections, tracking per-collection membership
    const allProducts: any[] = [];
    const byCollection: Record<string, string[]> = {};
    const collections = data.data?.collections?.edges || [];

    collections.forEach((collectionEdge: any) => {
      const collectionHandle = collectionEdge.node?.handle;
      const products = collectionEdge.node?.products?.edges || [];
      const collectionProductIds: string[] = [];

      products.forEach((productEdge: any) => {
        const product = productEdge.node;
        if (product) {
          collectionProductIds.push(product.id);
          allProducts.push({
            id: product.id,
            title: product.title,
            handle: product.handle,
            imageUrl: product.featuredImage?.url || '',
            options: (product.options || []).map((option: any) => ({
              name: option.name,
              values: Array.isArray(option.values) ? option.values : [],
            })),
            variants: (product.variants?.edges || []).map((edge: any) => ({
              id: edge.node.id,
              title: edge.node.title,
              option1: edge.node.selectedOptions?.[0]?.value ?? null,
              option2: edge.node.selectedOptions?.[1]?.value ?? null,
              option3: edge.node.selectedOptions?.[2]?.value ?? null,
              price: edge.node.price?.amount || '0',
              compareAtPrice: edge.node.compareAtPrice?.amount || null,
              weight: edge.node.weight ?? 0,
              weightUnit: edge.node.weightUnit ?? 'GRAMS',
              available: edge.node.availableForSale,
              quantityAvailable: typeof edge.node.quantityAvailable === 'number'
                ? edge.node.quantityAvailable
                : null,
              currentlyNotInStock: edge.node.currentlyNotInStock === true,
              image: edge.node.image ? { src: edge.node.image.url } : null
            }))
          });
        }
      });

      if (collectionHandle) {
        byCollection[collectionHandle] = collectionProductIds;
      }
    });

    // Remove duplicates (product might be in multiple collections)
    const uniqueProducts = Array.from(
      new Map(allProducts.map(p => [p.id, p])).values()
    );

    AppLogger.debug("[STOREFRONT_COLLECTIONS] Fetched products from collections", { component: "api.storefront-collections", productCount: uniqueProducts.length, collectionCount: handles.length });

    return json({
      products: uniqueProducts,
      byCollection,
      count: uniqueProducts.length
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300, s-maxage=600",
        "Vary": "Accept-Encoding"
      }
    });

  } catch (error: any) {
    AppLogger.error("[STOREFRONT_COLLECTIONS] Internal error", { component: "api.storefront-collections" }, error);
    return json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
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
