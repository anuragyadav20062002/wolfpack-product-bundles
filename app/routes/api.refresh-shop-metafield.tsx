import { json } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

/**
 * Manual API endpoint to force refresh shop-level bundle metafield
 *
 * Usage:
 * POST /api/refresh-shop-metafield
 *
 * This will update shop.metafields.custom.all_bundles with current bundles from database
 */
export const action: ActionFunction = async ({ request }) => {
  console.log("🔄 [REFRESH_METAFIELD] Starting manual shop metafield refresh");

  try {
    const { admin, session } = await authenticate.admin(request);

    // Get shop global ID
    const GET_SHOP_ID = `
      query getShopId {
        shop {
          id
        }
      }
    `;

    const shopResponse = await admin.graphql(GET_SHOP_ID);
    const shopData = await shopResponse.json();

    if (!shopData.data?.shop?.id) {
      throw new Error('Failed to get shop global ID');
    }

    const shopGlobalId = shopData.data.shop.id;
    console.log("🆔 [REFRESH_METAFIELD] Shop ID:", shopGlobalId);

    // Get all active cart transform bundles from database
    const allBundles = await db.bundle.findMany({
      where: {
        shopId: session.shop,
        bundleType: 'cart_transform',
        status: 'active' // Only include active bundles
      },
      include: {
        steps: {
          include: {
            StepProduct: true
          }
        },
        pricing: true
      }
    });

    console.log("📦 [REFRESH_METAFIELD] Found active bundles:", allBundles.length);
    console.log("📋 [REFRESH_METAFIELD] Bundle IDs:", allBundles.map(b => b.id));

    // Format bundles for Liquid extension
    const formattedBundles = allBundles.map(bundle => ({
      id: bundle.id,
      name: bundle.name,
      description: bundle.description,
      status: bundle.status,
      bundleType: bundle.bundleType,
      shopifyProductId: bundle.shopifyProductId,
      steps: bundle.steps.map(step => ({
        id: step.id,
        name: step.name,
        position: step.position,
        minQuantity: step.minQuantity,
        maxQuantity: step.maxQuantity,
        enabled: step.enabled,
        displayVariantsAsIndividual: step.displayVariantsAsIndividual,
        products: step.products || [],
        collections: step.collections || [],
        StepProduct: step.StepProduct || [],
        conditionType: step.conditionType,
        conditionOperator: step.conditionOperator,
        conditionValue: step.conditionValue
      })),
      pricing: bundle.pricing ? {
        enabled: bundle.pricing.enableDiscount,
        method: bundle.pricing.discountMethod,
        rules: bundle.pricing.rules || [],
        showFooter: bundle.pricing.showFooter,
        messages: bundle.pricing.messages || {}
      } : null,
      matching: {
        // For cart transform bundles, match based on Bundle Product
      }
    }));

    // Convert to object with bundle IDs as keys
    const bundlesObject: Record<string, any> = {};
    formattedBundles.forEach(bundle => {
      bundlesObject[bundle.id] = bundle;
    });

    console.log("🔧 [REFRESH_METAFIELD] Formatted bundles object keys:", Object.keys(bundlesObject));

    // Update shop metafield
    const SET_SHOP_METAFIELD = `
      mutation setShopMetafield($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            namespace
            key
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const metafieldResponse = await admin.graphql(SET_SHOP_METAFIELD, {
      variables: {
        metafields: [
          {
            ownerId: shopGlobalId,
            namespace: 'custom',
            key: 'all_bundles',
            type: 'json',
            value: JSON.stringify(bundlesObject)
          }
        ]
      }
    });

    const metafieldResult = await metafieldResponse.json();

    if (metafieldResult.data?.metafieldsSet?.userErrors?.length > 0) {
      console.error("❌ [REFRESH_METAFIELD] Metafield update errors:", metafieldResult.data.metafieldsSet.userErrors);
      throw new Error(metafieldResult.data.metafieldsSet.userErrors[0].message);
    }

    console.log("✅ [REFRESH_METAFIELD] Shop metafield updated successfully");

    return json({
      success: true,
      bundlesCount: allBundles.length,
      bundleIds: allBundles.map(b => b.id),
      message: `Shop metafield refreshed with ${allBundles.length} active bundles`
    });

  } catch (error) {
    console.error("❌ [REFRESH_METAFIELD] Error:", error);
    return json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
};
