import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { AppLogger } from "../lib/logger";

/**
 * Public API endpoint to fetch a single bundle by ID
 * Used by theme app extension when metafield data is not available
 *
 * GET /apps/product-bundles/api/bundle/:bundleId.json
 */
export const loader: LoaderFunction = async ({ request, params }) => {
  const url = new URL(request.url);

  // Log all incoming requests for debugging
  console.log('[APP_PROXY] Incoming request:', {
    url: url.href,
    pathname: url.pathname,
    params,
    searchParams: Object.fromEntries(url.searchParams.entries())
  });

  try {
    const { bundleId } = params;

    if (!bundleId) {
      console.log('[APP_PROXY] No bundleId in params');
      return json({ error: "Bundle ID is required" }, { status: 400 });
    }

    console.log('[APP_PROXY] Attempting authentication for bundleId:', bundleId);

    // Authenticate the request via app proxy
    const { session } = await authenticate.public.appProxy(request);

    console.log('[APP_PROXY] Authentication result:', { hasSession: !!session, shop: session?.shop });

    if (!session?.shop) {
      console.log('[APP_PROXY] No shop in session');
      return json({ error: "Shop not found" }, { status: 400 });
    }

    AppLogger.info("Fetching single bundle data", {
      component: "apps.product-bundles.api.bundle",
      operation: "loader",
      shop: session.shop,
      bundleId
    });

    // Get the bundle from database
    const bundle = await db.bundle.findFirst({
      where: {
        id: bundleId,
        shopId: session.shop,
        // Note: bundleType filter removed - not needed for single bundle lookup
        status: 'active'
      },
      include: {
        steps: {
          include: {
            StepProduct: true
          },
          orderBy: {
            position: 'asc'
          }
        },
        pricing: true
      }
    });

    if (!bundle) {
      AppLogger.warn("Bundle not found", {
        component: "apps.product-bundles.api.bundle",
        operation: "loader",
        bundleId
      });
      return json({
        success: false,
        error: "Bundle not found or not active"
      }, { status: 404 });
    }

    AppLogger.info("Found bundle", {
      component: "apps.product-bundles.api.bundle",
      operation: "loader",
      bundleId: bundle.id,
      bundleName: bundle.name
    });

    // Fetch full product details from Shopify for all products in the bundle
    const authResult = await authenticate.public.appProxy(request);
    const admin = authResult.admin;

    // Collect all unique product IDs from all steps
    const allProductIds = new Set<string>();
    bundle.steps.forEach(step => {
      step.StepProduct?.forEach(sp => {
        if (sp.productId) {
          allProductIds.add(sp.productId);
        }
      });
    });

    // Fetch product details from Shopify
    const productDetailsMap = new Map();

    if (admin && allProductIds.size > 0) {
      const productIdsArray = Array.from(allProductIds);

      // Query products in batches (max 250 per query)
      const BATCH_SIZE = 250;
      for (let i = 0; i < productIdsArray.length; i += BATCH_SIZE) {
        const batch = productIdsArray.slice(i, i + BATCH_SIZE);

        const PRODUCTS_QUERY = `
          query getProducts($ids: [ID!]!) {
            nodes(ids: $ids) {
              ... on Product {
                id
                title
                handle
                featuredImage {
                  url
                  altText
                }
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
                compareAtPriceRange {
                  maxVariantCompareAtPrice {
                    amount
                    currencyCode
                  }
                }
                variants(first: 100) {
                  edges {
                    node {
                      id
                      title
                      price
                      compareAtPrice
                      image {
                        url
                        altText
                      }
                    }
                  }
                }
              }
            }
          }
        `;

        try {
          const response = await admin.graphql(PRODUCTS_QUERY, {
            variables: {
              ids: batch.map(id => id.startsWith('gid://') ? id : `gid://shopify/Product/${id}`)
            }
          });

          const data = await response.json();

          if (data.data?.nodes) {
            data.data.nodes.forEach((product: any) => {
              if (product?.id) {
                productDetailsMap.set(product.id, product);
              }
            });
          }
        } catch (error) {
          AppLogger.error("Error fetching product details", {
            component: "apps.product-bundles.api.bundle",
            operation: "loader",
            batch: batch
          }, error);
        }
      }
    }

    // Format bundle for JavaScript widget with enriched product data
    const formattedBundle = {
      id: bundle.id,
      name: bundle.name,
      description: bundle.description,
      status: bundle.status,
      bundleType: bundle.bundleType,
      shopifyProductId: bundle.shopifyProductId,
      steps: bundle.steps.map(step => {
        // Enrich StepProduct with Shopify product details
        const enrichedStepProducts = step.StepProduct?.map(sp => {
          const productId = sp.productId?.startsWith('gid://') ? sp.productId : `gid://shopify/Product/${sp.productId}`;
          const productDetails = productDetailsMap.get(productId);

          if (productDetails) {
            // Use first variant price for consistency (already in major currency unit)
            const firstVariant = productDetails.variants?.edges?.[0]?.node;

            return {
              ...sp,
              title: productDetails.title,
              handle: productDetails.handle,
              imageUrl: productDetails.featuredImage?.url || null,
              price: firstVariant?.price || "0",
              compareAtPrice: firstVariant?.compareAtPrice || null,
              currencyCode: productDetails.priceRange?.minVariantPrice?.currencyCode || "INR",
              variants: productDetails.variants?.edges?.map((edge: any) => ({
                id: edge.node.id,
                title: edge.node.title,
                price: edge.node.price,
                compareAtPrice: edge.node.compareAtPrice,
                imageUrl: edge.node.image?.url || null
              })) || []
            };
          }

          return sp;
        }) || [];

        return {
          id: step.id,
          name: step.name,
          position: step.position,
          minQuantity: step.minQuantity,
          maxQuantity: step.maxQuantity,
          enabled: step.enabled,
          displayVariantsAsIndividual: step.displayVariantsAsIndividual,
          products: step.products || [],
          collections: step.collections || [],
          StepProduct: enrichedStepProducts,
          conditionType: step.conditionType,
          conditionOperator: step.conditionOperator,
          conditionValue: step.conditionValue
        };
      }),
      pricing: bundle.pricing ? {
        enabled: bundle.pricing.enabled,
        method: bundle.pricing.method,
        rules: bundle.pricing.rules || [],
        showFooter: bundle.pricing.showFooter,
        messages: bundle.pricing.messages || {}
      } : null
    };

    return json({
      success: true,
      bundle: formattedBundle,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    AppLogger.error("Error fetching bundle", {
      component: "apps.product-bundles.api.bundle",
      operation: "loader",
      bundleId: params.bundleId
    }, error);
    return json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
};
