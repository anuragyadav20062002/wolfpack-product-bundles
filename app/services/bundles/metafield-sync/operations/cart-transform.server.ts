/**
 * Cart Transform Metafield Operations
 *
 * Updates cart transform metafield with all active bundles
 */

import db from "../../../../db.server";
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
  console.log("🔄 [CART_TRANSFORM_METAFIELD] Starting cart transform metafield update");
  console.log("🆔 [CART_TRANSFORM_METAFIELD] Shop ID:", shopId);

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
      console.error('🔄 [CART_TRANSFORM_METAFIELD] No cart transform found - cannot update metafields');
      return null;
    }

    console.log("🔄 [CART_TRANSFORM_METAFIELD] Found cart transform ID:", cartTransformId);

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

    console.log(`🔄 [CART_TRANSFORM_METAFIELD] Found ${allPublishedBundles.length} published bundles`);

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

    const originalSize = JSON.stringify(allPublishedBundles).length;
    const optimizedSize = JSON.stringify(optimizedBundleConfigs).length;
    console.log(`📏 [CART_TRANSFORM_METAFIELD] Size optimization: ${originalSize} → ${optimizedSize} chars (${Math.round((1 - optimizedSize / originalSize) * 100)}% reduction)`);
    console.log(`🎯 [CART_TRANSFORM_METAFIELD] Optimized bundle configs:`, JSON.stringify(optimizedBundleConfigs, null, 2));

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
    console.log("🔄 [CART_TRANSFORM_METAFIELD] GraphQL response:", JSON.stringify(data, null, 2));

    if (data.data?.metafieldsSet?.userErrors?.length > 0) {
      console.error("🔄 [CART_TRANSFORM_METAFIELD] User errors:", data.data.metafieldsSet.userErrors);
      return null;
    }

    console.log("🔄 [CART_TRANSFORM_METAFIELD] Cart transform metafield updated successfully");
    return data.data?.metafieldsSet?.metafields?.[0];
  } catch (error) {
    console.error("🔄 [CART_TRANSFORM_METAFIELD] Error updating cart transform metafield:", error);
    return null;
  }
}
