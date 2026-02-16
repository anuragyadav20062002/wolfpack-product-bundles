import { json } from "@remix-run/node";
import { authenticate } from "../../shopify.server";
import db from "../../db.server";
import { AppLogger } from "../../lib/logger";

export async function loader({ request }: any) {
  const { session } = await authenticate.admin(request);
  
  try {
    // Get all bundles for this shop
    const allBundles = await db.bundle.findMany({
      where: { shopId: session.shop },
      include: { 
        steps: {
          include: {
            StepProduct: true
          }
        },
        pricing: true 
      },
      orderBy: { createdAt: 'desc' }
    });

    // Helper function to safely parse JSON
    const safeJsonParse = (value: any, defaultValue: any = []) => {
      if (!value) return defaultValue;
      if (typeof value === "object") return value;
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch (error) {
          return defaultValue;
        }
      }
      return defaultValue;
    };

    const bundleReport = {
      shop: session.shop,
      totalBundles: allBundles.length,
      activeBundles: allBundles.filter(b => b.status === 'active').length,
      bundlesWithPricing: allBundles.filter(b => b.pricing?.enabled).length,
      bundlesWithProducts: 0,
      bundles: allBundles.map(bundle => {
        const steps = bundle.steps.map((s: any) => ({
          id: s.id,
          name: s.name,
          enabled: s.enabled,
          products: safeJsonParse(s.products, []),
          collections: safeJsonParse(s.collections, []),
        }));

        const totalProducts = steps.reduce((sum: number, step: any) => sum + (step.StepProduct?.length || 0), 0);
        if (totalProducts > 0) bundleReport.bundlesWithProducts++;

        return {
          id: bundle.id,
          name: bundle.name,
          status: bundle.status,
          createdAt: bundle.createdAt,
          updatedAt: bundle.updatedAt,
          stepCount: steps.length,
          totalProducts,
          hasPricing: !!bundle.pricing,
          pricingEnabled: bundle.pricing?.enabled || false,
          discountMethod: bundle.pricing?.method || null,
          rulesCount: bundle.pricing?.rules ? safeJsonParse(bundle.pricing.rules, []).length : 0,
          steps: steps.map((step: any) => ({
            id: step.id,
            name: step.name,
            enabled: step.enabled,
            productCount: step.StepProduct?.length || 0,
            collectionCount: step.collections.length,
            products: step.products.map((p: any) => ({
              id: p.id,
              title: p.title,
              hasValidGid: p.id && p.id.startsWith('gid://shopify/Product/')
            }))
          }))
        };
      })
    };

    return json(bundleReport);

  } catch (error: any) {
    AppLogger.error("Bundle check failed", { component: "api.check-bundles", operation: "loader" }, error);
    return json(
      {
        error: error.message || "Failed to check bundles",
        stack: error.stack
      },
      { status: 500 }
    );
  }
}