import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  
  try {
    // Get all active bundles with their data
    const allPublishedBundles = await db.bundle.findMany({
      where: { status: "active", shopId: session.shop },
      include: { steps: true, pricing: true },
    });

    console.log("=== METAFIELD DEBUG ENDPOINT ===");
    console.log("Shop:", session.shop);
    console.log("Active bundles found:", allPublishedBundles.length);

    // Helper function to safely parse JSON
    const safeJsonParse = (value: any, defaultValue: any = []) => {
      if (!value) return defaultValue;
      if (typeof value === "object") return value;
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch (error) {
          console.error("JSON parse error:", error);
          return defaultValue;
        }
      }
      return defaultValue;
    };

    const debugInfo = {
      shop: session.shop,
      bundleCount: allPublishedBundles.length,
      bundles: [],
      productMetafields: [],
      issues: []
    };

    for (const bundle of allPublishedBundles) {
      const steps = bundle.steps.map((s: any) => ({
        ...s,
        products: safeJsonParse(s.products, []),
        collections: safeJsonParse(s.collections, []),
      }));

      const bundleInfo = {
        id: bundle.id,
        name: bundle.name,
        status: bundle.status,
        stepCount: steps.length,
        totalProducts: steps.reduce((sum: number, step: any) => sum + step.products.length, 0),
        hasPricing: !!bundle.pricing,
        pricingEnabled: bundle.pricing?.enableDiscount || false,
        steps: steps.map((step: any) => ({
          id: step.id,
          name: step.name,
          productCount: step.products.length,
          products: step.products.map((p: any) => ({
            id: p.id,
            title: p.title,
            hasValidId: p.id && p.id.startsWith('gid://shopify/Product/')
          }))
        }))
      };

      debugInfo.bundles.push(bundleInfo);

      // Check for issues
      if (steps.length === 0) {
        debugInfo.issues.push(`Bundle "${bundle.name}" has no steps`);
      }

      steps.forEach((step: any) => {
        if (step.products.length === 0) {
          debugInfo.issues.push(`Bundle "${bundle.name}" step "${step.name}" has no products`);
        }

        step.products.forEach((product: any) => {
          if (!product.id) {
            debugInfo.issues.push(`Bundle "${bundle.name}" has product without ID`);
          } else if (!product.id.startsWith('gid://shopify/Product/')) {
            debugInfo.issues.push(`Bundle "${bundle.name}" has invalid product ID format: ${product.id}`);
          } else {
            // This would be created as a metafield
            debugInfo.productMetafields.push({
              ownerId: product.id,
              bundleName: bundle.name,
              productTitle: product.title
            });
          }
        });
      });
    }

    // Check current metafields
    if (debugInfo.productMetafields.length > 0) {
      const sampleProductId = debugInfo.productMetafields[0].ownerId;
      
      try {
        const metafieldCheckResponse = await admin.graphql(
          `#graphql
          query($id: ID!) {
            product(id: $id) {
              id
              title
              metafield(namespace: "bundle_discounts", key: "discount_settings") {
                id
                value
                createdAt
                updatedAt
              }
            }
          }`,
          {
            variables: {
              id: sampleProductId,
            },
          }
        );

        const metafieldData = await metafieldCheckResponse.json();
        debugInfo.sampleMetafieldCheck = {
          productId: sampleProductId,
          productTitle: metafieldData.data?.product?.title,
          hasMetafield: !!metafieldData.data?.product?.metafield,
          metafieldValue: metafieldData.data?.product?.metafield?.value || null
        };

      } catch (error) {
        debugInfo.sampleMetafieldCheck = {
          error: error.message
        };
      }
    }

    return json(debugInfo);

  } catch (error: any) {
    console.error("Debug endpoint error:", error);
    return json(
      {
        error: error.message || "Failed to debug metafields",
        stack: error.stack
      },
      { status: 500 }
    );
  }
}