import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import db from "../../db.server";
import { AppLogger } from "../../lib/logger";
import { SHOPIFY_REST_API_VERSION } from "../../constants/api";
// auth: public — fetched directly by the storefront widget (browser request, no Shopify session available)

/**
 * Public API endpoint to fetch products using Storefront API
 * This endpoint can be called from the widget without authentication
 * Route: /api/storefront-products?ids=gid://shopify/Product/123,gid://shopify/Product/456
 */

/**
 * Inventory fields that require the `unauthenticated_read_product_inventory` scope.
 * Included only when the session scope has been granted — otherwise Shopify
 * Storefront API rejects the whole query with "Access denied".
 */
const INVENTORY_FIELDS = "quantityAvailable currentlyNotInStock";

/**
 * Fetches all variants for a product using cursor-based pagination
 * Handles products with more than 100 variants.
 * When country is provided, uses @inContext to get market-correct prices from Shopify Markets.
 * When hasInventoryScope is true, requests quantityAvailable + currentlyNotInStock.
 */
async function fetchAllVariants(
  storefrontUrl: string,
  storefrontAccessToken: string,
  productId: string,
  country: string | null,
  hasInventoryScope: boolean,
  cursor?: string
): Promise<any[]> {
  const inventoryFields = hasInventoryScope ? ` ${INVENTORY_FIELDS}` : "";

  const VARIANT_QUERY = country
    ? `query getProductVariants($id: ID!, $cursor: String, $country: CountryCode!) @inContext(country: $country) {
        product(id: $id) {
          variants(first: 100, after: $cursor) {
            pageInfo { hasNextPage endCursor }
            edges {
              node {
                id title availableForSale${inventoryFields}
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
                id title availableForSale${inventoryFields}
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
      hasInventoryScope,
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

    // Storefront token is created at install time (lifecycle webhook / auth callback).
    // If it is missing here, the install flow is broken — fail clearly and fast.
    const session = await db.session.findFirst({
      where: { shop },
      select: { storefrontAccessToken: true, scope: true }
    });

    if (!session?.storefrontAccessToken) {
      AppLogger.warn("[STOREFRONT_API] No storefront token for shop — install may be incomplete", {
        component: "api.storefront-products",
        shop,
      });
      return json({ error: "Shop not configured. Please reinstall the app." }, { status: 404 });
    }

    const storefrontAccessToken = session.storefrontAccessToken;
    // quantityAvailable + currentlyNotInStock require unauthenticated_read_product_inventory.
    // Scope is synced from Shopify on install and on every app/scopes_update webhook
    // (see handleScopesUpdate in lifecycle.server.ts), so session.scope is authoritative.
    const hasInventoryScope = (session.scope ?? "").includes("unauthenticated_read_product_inventory");
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
      AppLogger.error("[STOREFRONT_API] Storefront API request failed", { component: "api.storefront-products", status: response.status });
      return json({ error: "Failed to fetch from Storefront API" }, { status: 500 });
    }

    const data = await response.json();

    if (data.errors) {
      AppLogger.error("[STOREFRONT_API] GraphQL errors", { component: "api.storefront-products" }, data.errors);
      return json({ error: "GraphQL errors", details: data.errors }, { status: 500 });
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
            country,
            hasInventoryScope
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
              // Numeric stock level; null when scope ungranted or variant is untracked.
              // Widget treats null as "unlimited / do not clamp".
              quantityAvailable: typeof edge.node.quantityAvailable === 'number'
                ? edge.node.quantityAvailable
                : null,
              // True when the variant is sold out but accepting backorders.
              currentlyNotInStock: edge.node.currentlyNotInStock === true,
              image: edge.node.image ? { src: edge.node.image.url } : null
            }))
          };
        } catch (error) {
          AppLogger.warn("[STOREFRONT_API] Failed to fetch variants for product", { component: "api.storefront-products", productId: product.id });
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

    AppLogger.debug("[STOREFRONT_API] Fetched products", { component: "api.storefront-products", productCount: validProducts.length, variantCount: totalVariants });

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

  } catch (error) {
    AppLogger.error("[STOREFRONT_API] Internal error", { component: "api.storefront-products" }, error);
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
