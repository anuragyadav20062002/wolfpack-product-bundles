import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { updateBundleIndex } from "../services/bundles/bundle-index.server";

/**
 * Product Deletion Webhook Handler
 *
 * Triggers when: Product is deleted from store
 *
 * Actions:
 * - Remove product from bundle steps (StepProduct)
 * - Log affected bundles
 * - Update bundle index
 * - Identify bundles that may need merchant review
 *
 * Note: Widget will handle missing products gracefully
 * Cart transform continues to work with remaining products
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { topic, shop, payload, admin } = await authenticate.webhook(request);

    if (!payload || !payload.id) {
      console.error("[PRODUCT_DELETE_WEBHOOK] Invalid payload");
      return json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    const productId = `gid://shopify/Product/${payload.id}`;

    console.log(`🗑️ [PRODUCT_DELETE_WEBHOOK] Product deleted: ${productId}`);
    console.log(`📄 [PRODUCT_DELETE_WEBHOOK] Title: ${payload.title}`);

    // Find StepProducts using this product before deletion
    const stepProductsToDelete = await db.stepProduct.findMany({
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
                status: true
              }
            }
          }
        }
      }
    });

    if (stepProductsToDelete.length === 0) {
      console.log(`ℹ️ [PRODUCT_DELETE_WEBHOOK] Product not used in any bundles`);
      return json({ success: true, bundlesAffected: 0 });
    }

    const affectedBundles = stepProductsToDelete.map(sp => sp.step.bundle);
    const uniqueBundles = Array.from(new Map(affectedBundles.map(b => [b.id, b])).values());

    console.log(`🎯 [PRODUCT_DELETE_WEBHOOK] Product was used in ${uniqueBundles.length} bundles:`);
    uniqueBundles.forEach(bundle => {
      console.log(`   - ${bundle.name} (${bundle.id}) - ${bundle.status}`);
    });

    // Delete StepProduct entries
    const deletedStepProducts = await db.stepProduct.deleteMany({
      where: {
        productId: productId
      }
    });

    console.log(`🗑️ [PRODUCT_DELETE_WEBHOOK] Deleted ${deletedStepProducts.count} StepProduct entries`);

    // Find bundles that might now have empty steps
    const bundlesNeedingReview: string[] = [];

    for (const bundle of uniqueBundles) {
      const steps = await db.bundleStep.findMany({
        where: {
          bundleId: bundle.id
        },
        include: {
          StepProduct: true
        }
      });

      const emptySteps = steps.filter(step => step.StepProduct.length === 0);

      if (emptySteps.length > 0) {
        console.warn(`⚠️ [PRODUCT_DELETE_WEBHOOK] Bundle "${bundle.name}" has ${emptySteps.length} empty steps`);
        bundlesNeedingReview.push(bundle.name);

        // Log which steps are now empty
        emptySteps.forEach(step => {
          console.warn(`   - Step: ${step.name} (${step.id}) - NO PRODUCTS LEFT`);
        });

        // TODO: Consider marking bundle as draft or needs_review
        // await db.bundle.update({
        //   where: { id: bundle.id },
        //   data: { status: 'draft' }
        // });
      }
    }

    // Update bundle index
    if (admin) {
      try {
        await updateBundleIndex(admin, shop);
        console.log(`✅ [PRODUCT_DELETE_WEBHOOK] Bundle index updated`);
      } catch (error) {
        console.error(`⚠️ [PRODUCT_DELETE_WEBHOOK] Failed to update index:`, error);
      }
    }

    // Log summary
    if (bundlesNeedingReview.length > 0) {
      console.warn(`⚠️ [PRODUCT_DELETE_WEBHOOK] Bundles needing review: ${bundlesNeedingReview.join(', ')}`);
      // TODO: Send notification to merchant about affected bundles
    }

    return json({
      success: true,
      bundlesAffected: uniqueBundles.length,
      stepProductsDeleted: deletedStepProducts.count,
      bundlesNeedingReview: bundlesNeedingReview.length,
      productId: productId,
      productTitle: payload.title
    });

  } catch (error) {
    console.error("[PRODUCT_DELETE_WEBHOOK] Error processing webhook:", error);
    return json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
};
