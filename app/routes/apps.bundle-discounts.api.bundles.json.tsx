import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

/**
 * Public API endpoint to fetch fresh bundle data
 * This bypasses Shopify's metafield cache and returns the latest data from database
 *
 * GET /apps/bundle-discounts/api/bundles.json
 */
export const loader: LoaderFunction = async ({ request }) => {
  try {
    // Authenticate the request
    const { session } = await authenticate.public.appProxy(request);

    if (!session?.shop) {
      return json({ error: "Shop not found" }, { status: 400 });
    }

    console.log("📡 [BUNDLE_API] Fetching fresh bundle data for shop:", session.shop);

    // Get all active cart transform bundles from database
    const allBundles = await db.bundle.findMany({
      where: {
        shopId: session.shop,
        bundleType: 'cart_transform',
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

    console.log("📦 [BUNDLE_API] Found active bundles:", allBundles.length);

    // Format bundles for JavaScript widget
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
      } : null
    }));

    // Convert to object with bundle IDs as keys (same format as shop metafield)
    const bundlesObject: Record<string, any> = {};
    formattedBundles.forEach(bundle => {
      bundlesObject[bundle.id] = bundle;
    });

    console.log("✅ [BUNDLE_API] Returning bundles:", Object.keys(bundlesObject));

    return json({
      success: true,
      bundles: bundlesObject,
      bundleCount: allBundles.length,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error("❌ [BUNDLE_API] Error fetching bundles:", error);
    return json({
      success: false,
      error: (error as Error).message,
      bundles: {}
    }, { status: 500 });
  }
};
