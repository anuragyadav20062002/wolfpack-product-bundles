import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../../shopify.server";
import db from "../../db.server";

/**
 * Product Update Webhook Handler
 *
 * Triggers when:
 * - Product title changed
 * - Product price changed
 * - Variant added/removed
 * - Inventory updated
 * - Product availability changed
 *
 * Purpose:
 * - Verify bundles using this product are still valid
 * - Log changes affecting bundles
 * - Monitor product integrity for bundle components
 *
 * Note: Widget queries Storefront API for fresh data, so no metafield
 * updates needed. This is for monitoring and logging only.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);

    if (!payload || !payload.id) {
      console.error("[PRODUCT_WEBHOOK] Invalid payload");
      return json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    const productId = `gid://shopify/Product/${payload.id}`;

    console.log(`📢 [PRODUCT_WEBHOOK] Product updated: ${productId}`);
    console.log(`📄 [PRODUCT_WEBHOOK] Title: ${payload.title}`);
    console.log(`💰 [PRODUCT_WEBHOOK] Variants: ${payload.variants?.length || 0}`);
    console.log(`📊 [PRODUCT_WEBHOOK] Status: ${payload.status}`);

    // Find bundles using this product as component
    const stepsWithProduct = await db.stepProduct.findMany({
      where: {
        productId: productId
      },
      include: {
        step: {
          include: {
            bundle: {
              select: {
                id: true,
                name: true,
                shopId: true,
                shopifyProductId: true,
                status: true
              }
            }
          }
        }
      }
    });

    if (stepsWithProduct.length === 0) {
      console.log(`ℹ️ [PRODUCT_WEBHOOK] Product not used in any bundles`);
      return json({ success: true, bundlesAffected: 0 });
    }

    const affectedBundles = stepsWithProduct.map(sp => sp.step.bundle);
    const uniqueBundles = Array.from(new Map(affectedBundles.map(b => [b.id, b])).values());

    console.log(`🎯 [PRODUCT_WEBHOOK] Product used in ${uniqueBundles.length} bundles:`);
    uniqueBundles.forEach(bundle => {
      console.log(`   - ${bundle.name} (${bundle.id}) - ${bundle.status}`);
    });

    // Check for critical changes
    const criticalChanges: string[] = [];

    // Check if product became unavailable
    if (payload.status === 'draft' || payload.status === 'archived') {
      criticalChanges.push(`Product status changed to ${payload.status}`);
    }

    // Check if all variants became unavailable
    const availableVariants = payload.variants?.filter((v: any) =>
      v.available !== false && v.inventory_policy !== 'deny'
    );

    if (availableVariants?.length === 0 && payload.variants?.length > 0) {
      criticalChanges.push('No variants available for purchase');
    }

    if (criticalChanges.length > 0) {
      console.warn(`⚠️ [PRODUCT_WEBHOOK] Critical changes detected:`);
      criticalChanges.forEach(change => console.warn(`   - ${change}`));

      // Log which bundles are affected
      console.warn(`⚠️ [PRODUCT_WEBHOOK] Affected active bundles:`);
      uniqueBundles
        .filter(b => b.status === 'active')
        .forEach(bundle => {
          console.warn(`   - ${bundle.name} (${bundle.id})`);
        });

      // TODO: Consider creating admin notification for merchant
      // TODO: Consider adding "needs_review" flag to bundles
    }

    // Note: No metafield updates needed
    // - Widget queries Storefront API for fresh product data
    // - Cart transform config doesn't include product data
    // - This webhook is for monitoring only

    return json({
      success: true,
      bundlesAffected: uniqueBundles.length,
      criticalChanges: criticalChanges.length,
      productId: productId,
      productTitle: payload.title
    });

  } catch (error) {
    console.error("[PRODUCT_WEBHOOK] Error processing webhook:", error);
    return json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
};
