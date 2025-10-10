import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

/**
 * Storefront API endpoint for Full-Page Bundles
 * Used by liquid theme blocks to fetch bundle configuration
 *
 * GET /api/bundles/full-page.json?id=FBP-1
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // This endpoint needs to be accessible from storefront, so we'll use a simpler auth
    const url = new URL(request.url);
    const bundleId = url.searchParams.get("id");
    const shopDomain = url.searchParams.get("shop");

    if (!bundleId) {
      return json({ error: "Bundle ID is required" }, { status: 400 });
    }

    // Try to authenticate with admin (for app-embedded access)
    let shop = shopDomain;
    try {
      const { session } = await authenticate.admin(request);
      shop = session.shop;
    } catch (error) {
      // If admin auth fails, this might be a storefront request
      // In production, you'd want to implement proper storefront authentication
      if (!shopDomain) {
        return json({ error: "Shop domain is required" }, { status: 400 });
      }
    }

    // Fetch bundle from database
    const bundle = await db.bundle.findFirst({
      where: {
        templateName: bundleId,
        bundleType: "full_page",
        shopId: shop || undefined,
      },
      include: {
        steps: {
          orderBy: { position: "asc" },
        },
        pricing: true,
      },
    });

    if (!bundle) {
      return json({ error: "Bundle not found" }, { status: 404 });
    }

    // Format bundle data for storefront
    const bundleData = {
      id: bundle.templateName,
      name: bundle.name,
      description: bundle.description,
      bundleType: "full_page",
      status: bundle.status,
      parentProduct: {
        id: bundle.shopifyProductId,
        title: `EasyBundleId : ${bundle.templateName}`,
      },
      tabs: bundle.steps.map((step) => ({
        id: step.id,
        name: step.name,
        icon: step.icon || "box",
        position: step.position,
        requireSelection: step.requireSelection,
        minQuantity: step.minQuantity,
        maxQuantity: step.maxQuantity,
        allowMultiple: step.allowMultiple,
        displayVariantsAsIndividual: step.displayVariantsAsIndividual,
        products: step.products ? (typeof step.products === "string" ? JSON.parse(step.products) : step.products) : [],
      })),
      discount: {
        enabled: bundle.pricing?.enableDiscount || false,
        method: bundle.pricing?.discountMethod || "fixed_amount_off",
        rules: bundle.pricing?.rules
          ? (typeof bundle.pricing.rules === "string"
            ? JSON.parse(bundle.pricing.rules)
            : bundle.pricing.rules)
          : [],
      },
      settings: bundle.settings
        ? (typeof bundle.settings === "string" ? JSON.parse(bundle.settings) : bundle.settings)
        : {
          layout: "sidebar-right",
          preview_sticky: true,
          button_text: "Add To Cart",
          success_message: "Success! Your ₹{discount} discount has been applied!",
          grid_columns: 3,
          enable_loading_animation: true,
        },
    };

    // Set CORS headers for storefront access
    return json(bundleData, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error fetching bundle:", error);
    return json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Handle OPTIONS requests for CORS
 */
export async function options() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
