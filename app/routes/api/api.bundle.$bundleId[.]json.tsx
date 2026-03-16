import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { authenticate } from "../../shopify.server";
import db from "../../db.server";
import { AppLogger } from "../../lib/logger";
import { BundleStatus } from "../../constants/bundle";
import { ERROR_MESSAGES } from "../../constants/errors";

/**
 * Public API endpoint to fetch a single bundle by ID
 * Used by the full-page bundle widget via Shopify App Proxy
 *
 * GET /apps/product-bundles/api/bundle/:bundleId.json
 *
 * Supports sparse fieldsets for optimized responses:
 * ?fields=id,name,steps.products.id,steps.products.title
 *
 * Examples:
 * - Full response: /api/bundle/123.json
 * - Minimal: /api/bundle/123.json?fields=id,name,status
 * - Nested: /api/bundle/123.json?fields=id,name,steps.id,steps.name,steps.products.id
 */

/**
 * Filters an object to include only the specified fields.
 * Supports nested field notation (e.g., "steps.products.id")
 */
function filterFields(obj: any, requestedFields: string[]): any {
  if (!requestedFields || requestedFields.length === 0) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => filterFields(item, requestedFields));
  }

  const result: any = {};
  const fieldsMap = new Map<string, string[]>();

  requestedFields.forEach(field => {
    const parts = field.split('.');
    const root = parts[0];

    if (!fieldsMap.has(root)) {
      fieldsMap.set(root, []);
    }

    if (parts.length > 1) {
      fieldsMap.get(root)!.push(parts.slice(1).join('.'));
    } else {
      fieldsMap.get(root)!.push('*');
    }
  });

  for (const [field, subFields] of fieldsMap.entries()) {
    if (Object.prototype.hasOwnProperty.call(obj, field)) {
      if (subFields.includes('*')) {
        result[field] = obj[field];
      } else if (subFields.length > 0) {
        result[field] = filterFields(obj[field], subFields);
      }
    }
  }

  return result;
}

function parseFieldsParam(fieldsParam: string | null): string[] | null {
  if (!fieldsParam) return null;
  return fieldsParam
    .split(',')
    .map(f => f.trim())
    .filter(f => f.length > 0);
}

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

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const url = new URL(request.url);
  const requestedFields = parseFieldsParam(url.searchParams.get('fields'));

  try {
    const { bundleId } = params;

    if (!bundleId) {
      return json({ error: ERROR_MESSAGES.BUNDLE_ID_REQUIRED }, { status: 400, headers: CORS_HEADERS });
    }

    // Authenticate via Shopify App Proxy — one call, get both session and admin.
    // Per Shopify docs: authenticate.public.appProxy(request) returns { session, admin, liquid }.
    // session.shop is the shop's myshopify.com domain (used for DB scoping).
    // admin is the Admin API client backed by the shop's offline token.
    const { session, admin } = await authenticate.public.appProxy(request);

    if (!session?.shop) {
      return json({ error: ERROR_MESSAGES.SHOP_NOT_FOUND }, { status: 400, headers: CORS_HEADERS });
    }

    AppLogger.info("Fetching bundle", {
      component: "api.bundle",
      operation: "loader",
      shop: session.shop,
      bundleId
    });

    // Allow draft and active bundles — merchants can test before publishing.
    // Unlisted bundles are intentionally excluded from storefront serving.
    // Archived bundles are excluded — they are taken offline.
    const bundle = await db.bundle.findFirst({
      where: {
        id: bundleId,
        shopId: session.shop,
        status: {
          in: [BundleStatus.DRAFT, BundleStatus.ACTIVE]
        }
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
      AppLogger.warn(ERROR_MESSAGES.BUNDLE_NOT_FOUND, {
        component: "api.bundle",
        operation: "loader",
        bundleId,
        shop: session.shop
      });
      return json({
        success: false,
        error: "Bundle not found or not active"
      }, { status: 404, headers: CORS_HEADERS });
    }

    AppLogger.info("Found bundle", {
      component: "api.bundle",
      operation: "loader",
      bundleId: bundle.id,
      bundleName: bundle.name
    });

    // Fetch full product details from Shopify Admin API for all bundle products.
    // admin is available when the shop has an offline token (standard for installed apps).
    const productDetailsMap = new Map<string, any>();

    const allProductIds = new Set<string>();
    bundle.steps.forEach(step => {
      step.StepProduct?.forEach(sp => {
        if (sp.productId) allProductIds.add(sp.productId);
      });
    });

    if (admin && allProductIds.size > 0) {
      const productIdsArray = Array.from(allProductIds);
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
          AppLogger.error("Error fetching product details batch", {
            component: "api.bundle",
            operation: "loader",
            batchSize: batch.length
          }, error);
        }
      }
    }

    // Format bundle for the widget with enriched Shopify product data
    const extractNumericId = (gid: string) => {
      const match = gid.match(/\/(\d+)$/);
      return match ? match[1] : gid;
    };

    const formattedBundle = {
      id: bundle.id,
      name: bundle.name,
      description: bundle.description,
      status: bundle.status,
      bundleType: bundle.bundleType,
      fullPageLayout: bundle.fullPageLayout ?? null,
      shopifyProductId: bundle.shopifyProductId,
      promoBannerBgImage: bundle.promoBannerBgImage ?? null,
      promoBannerBgImageCrop: bundle.promoBannerBgImageCrop ?? null,
      loadingGif: bundle.loadingGif ?? null,
      steps: bundle.steps.map(step => {
        const enrichedStepProducts = step.StepProduct?.map(sp => {
          const productId = sp.productId?.startsWith('gid://')
            ? sp.productId
            : `gid://shopify/Product/${sp.productId}`;
          const productDetails = productDetailsMap.get(productId);

          if (productDetails) {
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
                id: extractNumericId(edge.node.id),
                gid: edge.node.id,
                title: edge.node.title,
                price: edge.node.price,
                compareAtPrice: edge.node.compareAtPrice,
                imageUrl: edge.node.image?.url || null
              })) || []
            };
          }

          return sp;
        }) || [];

        const productsArray = enrichedStepProducts.map(esp => ({
          id: esp.productId,
          title: esp.title,
          handle: (esp as any).handle || '',
          images: esp.imageUrl ? [{ url: esp.imageUrl }] : [],
          featuredImage: esp.imageUrl ? { url: esp.imageUrl } : null,
          price: Math.round(parseFloat((esp as any).price || "0") * 100),
          compareAtPrice: (esp as any).compareAtPrice
            ? Math.round(parseFloat((esp as any).compareAtPrice) * 100)
            : null,
          available: true,
          variants: ((esp as any).variants as any[])?.map((v: any) => ({
            id: v.id,
            title: v.title,
            price: Math.round(parseFloat(v.price || "0") * 100),
            compareAtPrice: v.compareAtPrice
              ? Math.round(parseFloat(v.compareAtPrice) * 100)
              : null,
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
          products: productsArray,
          collections: step.collections || [],
          StepProduct: enrichedStepProducts,
          conditionType: step.conditionType,
          conditionOperator: step.conditionOperator,
          conditionValue: step.conditionValue,
          conditionOperator2: step.conditionOperator2,
          conditionValue2: step.conditionValue2
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

    const responsePayload = {
      success: true,
      bundle: formattedBundle,
      timestamp: new Date().toISOString()
    };

    // Apply sparse fieldsets if requested
    if (requestedFields) {
      const bundleFields = requestedFields.map(f => `bundle.${f}`);
      const filtered = filterFields(responsePayload, ['success', 'timestamp', ...bundleFields]);
      return json(filtered, {
        headers: {
          ...CORS_HEADERS,
          'Cache-Control': 'public, max-age=10, s-maxage=30, must-revalidate',
          'Vary': 'Accept-Encoding'
        }
      });
    }

    return json(responsePayload, {
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'public, max-age=10, s-maxage=30, must-revalidate',
        'Vary': 'Accept-Encoding'
      }
    });

  } catch (error) {
    AppLogger.error("Error fetching bundle", {
      component: "api.bundle",
      operation: "loader",
      bundleId: params.bundleId
    }, error);
    return json({
      success: false,
      error: (error as Error).message
    }, { status: 500, headers: CORS_HEADERS });
  }
};
