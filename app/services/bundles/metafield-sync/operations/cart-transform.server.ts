/**
 * Cart Transform Metafield Operations
 *
 * Updates cart transform metafield with all active bundles
 */

import db from "../../../../db.server";
import { AppLogger } from "../../../../lib/logger";
import { BundleStatus } from "../../../../constants/bundle";
import { getBundleProductVariantId } from "../../../../utils/variant-lookup.server";
import { safeJsonParse } from "../utils/size-check";
import type { OptimizedBundleConfig, OptimizedStepConfig, OptimizedPricingConfig } from "../types";

/**
 * Updates cart transform metafield with all active bundles
 */
export async function updateCartTransformMetafield(
  admin: any,
  shopId: string
): Promise<any | null> {
  AppLogger.debug("[CART_TRANSFORM_METAFIELD] Starting update", {
    component: "cart-transform.server",
    shopId,
  });

  try {
    // First get the existing cart transform ID
    const GET_CART_TRANSFORM = `
      query getCartTransform {
        cartTransforms(first: 1) {
          edges {
            node {
              id
              functionId
            }
          }
        }
      }
    `;

    const cartTransformResponse = await admin.graphql(GET_CART_TRANSFORM);
    const cartTransformData = await cartTransformResponse.json();

    const cartTransformId = cartTransformData.data?.cartTransforms?.edges?.[0]?.node?.id;

    if (!cartTransformId) {
      AppLogger.error("[CART_TRANSFORM_METAFIELD] No cart transform found — cannot update metafields", {
        component: "cart-transform.server",
        shopId,
      });
      return null;
    }

    // Fetch all published bundles for this shop
    const allPublishedBundles = await db.bundle.findMany({
      where: {
        shopId: shopId,
        status: BundleStatus.ACTIVE
      },
      include: {
        steps: {
          include: {
            StepProduct: true,
          },
        },
        pricing: true,
      },
    });

    AppLogger.debug("[CART_TRANSFORM_METAFIELD] Found published bundles", {
      component: "cart-transform.server",
      count: allPublishedBundles.length,
    });

    // Create MINIMAL optimized bundle configuration for cart transform performance
    const optimizedBundleConfigs: OptimizedBundleConfig[] = await Promise.all(
      allPublishedBundles.map(async (bundle) => {
        // Extract all product IDs from bundle steps for quick lookup
        const allBundleProductIds: string[] = [];
        const stepConfigs: OptimizedStepConfig[] = [];

        for (const step of bundle.steps) {
          const stepProductIds: string[] = [];

          // Add products from step configuration (collections/products JSON)
          const stepProducts = safeJsonParse(step.products, []);
          const stepCollections = safeJsonParse(step.collections, []);

          stepProducts.forEach((product: any) => {
            if (product.id) {
              stepProductIds.push(product.id);
              if (!allBundleProductIds.includes(product.id)) {
                allBundleProductIds.push(product.id);
              }
            }
          });

          // Add products from StepProduct relations
          step.StepProduct.forEach(product => {
            if (product.productId) {
              stepProductIds.push(product.productId);
              if (!allBundleProductIds.includes(product.productId)) {
                allBundleProductIds.push(product.productId);
              }
            }
          });

          // Only include essential step data for cart transform
          stepConfigs.push({
            id: step.id,
            name: step.name,
            minQuantity: step.minQuantity,
            maxQuantity: step.maxQuantity,
            productIds: stepProductIds,
            collections: stepCollections.map((col: any) => col.id).filter(Boolean),
            // Include conditions for cart transform validation
            conditionType: step.conditionType || undefined,
            conditionOperator: step.conditionOperator || undefined,
            conditionValue: step.conditionValue || undefined,
            conditionOperator2: step.conditionOperator2 || undefined,
            conditionValue2: step.conditionValue2 || undefined
          });
        }

        // Only include essential bundle data for cart transform
        const pricing: OptimizedPricingConfig | null = bundle.pricing ? {
          enabled: bundle.pricing.enabled,
          method: bundle.pricing.method,
          rules: safeJsonParse(bundle.pricing.rules, []),
          // Include bundle variant IDs if available
          bundleVariantId: (bundle.pricing as any).bundleVariantId || null,
          fixedPrice: (bundle.pricing as any).fixedPrice || null
        } : null;

        const optimizedBundle: OptimizedBundleConfig = {
          id: bundle.id,
          name: bundle.name,
          templateName: bundle.templateName || null,
          type: bundle.bundleType,
          allBundleProductIds, // All product IDs for quick bundle detection
          steps: stepConfigs,
          pricing,
          // Include bundle parent variant if available - fetch from bundle product
          bundleParentVariantId: await getBundleProductVariantId(admin, bundle.shopifyProductId)
        };

        return optimizedBundle;
      })
    );

    AppLogger.debug("[CART_TRANSFORM_METAFIELD] Optimized bundle configs built", {
      component: "cart-transform.server",
      originalSize: JSON.stringify(allPublishedBundles).length,
      optimizedSize: JSON.stringify(optimizedBundleConfigs).length,
    });

    // Update cart transform metafield using metafieldsSet
    const UPDATE_CART_TRANSFORM_METAFIELD = `
      mutation SetCartTransformMetafield($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            namespace
            key
            value
            owner {
              ... on CartTransform {
                id
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await admin.graphql(UPDATE_CART_TRANSFORM_METAFIELD, {
      variables: {
        metafields: [
          {
            ownerId: cartTransformId,
            namespace: "bundle_discounts",
            key: "all_bundles_config",
            type: "json",
            value: JSON.stringify(optimizedBundleConfigs)
          }
        ]
      }
    });

    const data = await response.json();

    if (data.data?.metafieldsSet?.userErrors?.length > 0) {
      AppLogger.error("[CART_TRANSFORM_METAFIELD] User errors on metafield set", {
        component: "cart-transform.server",
        shopId,
      }, data.data.metafieldsSet.userErrors);
      return null;
    }

    AppLogger.info("[CART_TRANSFORM_METAFIELD] Cart transform metafield updated", {
      component: "cart-transform.server",
      shopId,
      bundleCount: optimizedBundleConfigs.length,
    });
    return data.data?.metafieldsSet?.metafields?.[0];
  } catch (error) {
    AppLogger.error("[CART_TRANSFORM_METAFIELD] Error updating cart transform metafield", {
      component: "cart-transform.server",
      shopId,
    }, error);
    return null;
  }
}
