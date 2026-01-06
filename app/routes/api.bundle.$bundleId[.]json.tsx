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

// Handle OPTIONS preflight requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const url = new URL(request.url);

  // ENHANCED LOGGING - Log all incoming requests for debugging
  console.log('═══════════════════════════════════════════════════════════');
  console.log('[APP_PROXY] 🔍 INCOMING REQUEST:', {
    timestamp: new Date().toISOString(),
    url: url.href,
    pathname: url.pathname,
    method: request.method,
    params,
    searchParams: Object.fromEntries(url.searchParams.entries()),
    headers: {
      'user-agent': request.headers.get('user-agent'),
      'referer': request.headers.get('referer'),
      'x-shopify-shop-domain': request.headers.get('x-shopify-shop-domain'),
      'x-forwarded-for': request.headers.get('x-forwarded-for')
    }
  });
  console.log('═══════════════════════════════════════════════════════════');

  try {
    const { bundleId } = params;

    if (!bundleId) {
      console.log('[APP_PROXY] ❌ No bundleId in params');
      return json({ error: "Bundle ID is required" }, {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    console.log('[APP_PROXY] 📝 Bundle ID extracted:', bundleId);
    console.log('[APP_PROXY] 🔐 Attempting authentication...');

    // Authenticate the request via app proxy
    const { session } = await authenticate.public.appProxy(request);

    console.log('[APP_PROXY] Authentication result:', { hasSession: !!session, shop: session?.shop });

    if (!session?.shop) {
      console.log('[APP_PROXY] No shop in session');
      return json({ error: "Shop not found" }, {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
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
      }, {
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    AppLogger.info("Found bundle", {
      component: "apps.product-bundles.api.bundle",
      operation: "loader",
      bundleId: bundle.id,
      bundleName: bundle.name
    });

    console.log('[API_DEBUG] Bundle found:', {
      bundleId: bundle.id,
      bundleName: bundle.name,
      stepsCount: bundle.steps.length,
      steps: bundle.steps.map(s => ({
        stepId: s.id,
        stepName: s.name,
        stepProductCount: s.StepProduct?.length || 0,
        stepProducts: s.StepProduct?.map(sp => ({
          id: sp.id,
          productId: sp.productId,
          title: sp.title,
          hasImageUrl: !!sp.imageUrl
        }))
      }))
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

    console.log('[API_DEBUG] Collected product IDs:', {
      totalUniqueProducts: allProductIds.size,
      productIds: Array.from(allProductIds)
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

          console.log('[API_DEBUG] GraphQL response for batch:', {
            batchSize: batch.length,
            batchIds: batch,
            hasData: !!data.data,
            hasNodes: !!data.data?.nodes,
            nodesCount: data.data?.nodes?.length || 0,
            nodes: data.data?.nodes?.map((n: any) => ({
              id: n?.id,
              title: n?.title,
              hasVariants: !!n?.variants,
              variantsCount: n?.variants?.edges?.length || 0
            }))
          });

          if (data.data?.nodes) {
            data.data.nodes.forEach((product: any) => {
              if (product?.id) {
                productDetailsMap.set(product.id, product);
              }
            });
          }
        } catch (error) {
          console.error('[API_DEBUG] GraphQL query failed:', error);
          AppLogger.error("Error fetching product details", {
            component: "apps.product-bundles.api.bundle",
            operation: "loader",
            batch: batch
          }, error);
        }
      }
    }

    console.log('[API_DEBUG] Product details map:', {
      mapSize: productDetailsMap.size,
      mapKeys: Array.from(productDetailsMap.keys())
    });

    // Format bundle for JavaScript widget with enriched product data
    const formattedBundle = {
      id: bundle.id,
      name: bundle.name,
      description: bundle.description,
      status: bundle.status,
      bundleType: bundle.bundleType,
      shopifyProductId: bundle.shopifyProductId,
      steps: bundle.steps.map(step => {
        console.log('[API_DEBUG] Processing step:', {
          stepId: step.id,
          stepName: step.name,
          stepProductCount: step.StepProduct?.length || 0
        });

        // Enrich StepProduct with Shopify product details
        const enrichedStepProducts = step.StepProduct?.map(sp => {
          const productId = sp.productId?.startsWith('gid://') ? sp.productId : `gid://shopify/Product/${sp.productId}`;
          const productDetails = productDetailsMap.get(productId);

          console.log('[API_DEBUG] Enriching product:', {
            stepProductId: sp.id,
            originalProductId: sp.productId,
            normalizedProductId: productId,
            foundInMap: !!productDetails,
            dbTitle: sp.title,
            dbImageUrl: sp.imageUrl
          });

          if (productDetails) {
            // Use first variant price for consistency (already in major currency unit)
            const firstVariant = productDetails.variants?.edges?.[0]?.node;

            // Extract numeric ID from variant GID for cart API compatibility
            const extractNumericId = (gid: string) => {
              const match = gid.match(/\/(\d+)$/);
              return match ? match[1] : gid;
            };

            const enrichedProduct = {
              ...sp,
              title: productDetails.title,
              handle: productDetails.handle,
              imageUrl: productDetails.featuredImage?.url || null,
              price: firstVariant?.price || "0",
              compareAtPrice: firstVariant?.compareAtPrice || null,
              currencyCode: productDetails.priceRange?.minVariantPrice?.currencyCode || "INR",
              variants: productDetails.variants?.edges?.map((edge: any) => ({
                id: extractNumericId(edge.node.id), // Extract numeric ID for cart compatibility
                gid: edge.node.id, // Keep full GID for reference
                title: edge.node.title,
                price: edge.node.price,
                compareAtPrice: edge.node.compareAtPrice,
                imageUrl: edge.node.image?.url || null
              })) || []
            };

            console.log('[API_DEBUG] Enriched product result:', {
              stepProductId: sp.id,
              title: enrichedProduct.title,
              hasImageUrl: !!enrichedProduct.imageUrl,
              price: enrichedProduct.price,
              variantsCount: enrichedProduct.variants.length
            });

            return enrichedProduct;
          }

          console.log('[API_DEBUG] No product details found, returning original StepProduct');
          return sp;
        }) || [];

        console.log('[API_DEBUG] Enriched step products:', {
          stepId: step.id,
          enrichedCount: enrichedStepProducts.length,
          enrichedProducts: enrichedStepProducts.map(esp => ({
            title: esp.title,
            hasImageUrl: !!esp.imageUrl,
            hasPrice: !!esp.price,
            hasVariants: !!esp.variants && esp.variants.length > 0
          }))
        });

        // Populate products array for loader (transforms enriched StepProduct to products format)
        const productsArray = enrichedStepProducts.map(esp => ({
          id: esp.productId,
          title: esp.title,
          handle: esp.handle,
          images: esp.imageUrl ? [{ url: esp.imageUrl }] : [],
          featuredImage: esp.imageUrl ? { url: esp.imageUrl } : null,
          price: Math.round(parseFloat(esp.price || "0") * 100), // Convert to cents for loader
          compareAtPrice: esp.compareAtPrice ? Math.round(parseFloat(esp.compareAtPrice) * 100) : null,
          available: true,
          variants: esp.variants?.map(v => ({
            id: v.id, // Already numeric
            title: v.title,
            price: Math.round(parseFloat(v.price || "0") * 100),
            compareAtPrice: v.compareAtPrice ? Math.round(parseFloat(v.compareAtPrice) * 100) : null,
            image: v.imageUrl ? { url: v.imageUrl } : null,
            available: true
          })) || []
        }));

        return {
          id: step.id,
          name: step.name,
          position: step.position,
          minQuantity: step.minQuantity,
          maxQuantity: step.maxQuantity,
          enabled: step.enabled,
          displayVariantsAsIndividual: step.displayVariantsAsIndividual,
          products: productsArray, // Populate for loader compatibility
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

    console.log('[API_DEBUG] Final response structure:', {
      success: true,
      bundleId: formattedBundle.id,
      bundleName: formattedBundle.name,
      stepsCount: formattedBundle.steps.length,
      steps: formattedBundle.steps.map(s => ({
        stepId: s.id,
        stepName: s.name,
        productsArrayLength: s.products.length,
        stepProductLength: s.StepProduct.length,
        stepProductSample: s.StepProduct[0] ? {
          title: s.StepProduct[0].title,
          hasImageUrl: !!s.StepProduct[0].imageUrl,
          hasPrice: !!s.StepProduct[0].price,
          hasVariants: !!s.StepProduct[0].variants
        } : null
      }))
    });

    return json({
      success: true,
      bundle: formattedBundle,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
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
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
};
