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

    // Format bundle for JavaScript widget
    const formattedBundle = {
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
