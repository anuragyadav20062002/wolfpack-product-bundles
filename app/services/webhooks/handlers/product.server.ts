/**
 * Product Webhook Handlers
 *
 * Handles product-related webhooks:
 * - products/update
 * - products/delete
 */

import db from "../../../db.server";
import { AppLogger } from "../../../lib/logger";
import type { WebhookProcessResult } from "../types";

/**
 * Handle product update webhook
 * Monitors products used in bundles and sets bundles to draft if product becomes unavailable
 */
export async function handleProductUpdate(
  shopDomain: string,
  payload: any
): Promise<WebhookProcessResult> {
  try {
    // SAFETY: Validate payload has required fields
    if (!payload.id) {
      return {
        success: false,
        message: "Missing product ID in webhook payload",
        error: "payload.id is required"
      };
    }

    const productId = `gid://shopify/Product/${payload.id}`;
    const status = payload.status;
    const variants = payload.variants || [];

    AppLogger.info("Processing product update", {
      component: "webhook-processor",
      operation: "handleProductUpdate"
    }, { shop: shopDomain, productId, status });

    // Find all bundle steps using this product
    const stepsWithProduct = await db.stepProduct.findMany({
      where: {
        productId
      },
      include: {
        step: {
          include: {
            bundle: true
          }
        }
      }
    });

    if (stepsWithProduct.length === 0) {
      return {
        success: true,
        message: "Product not used in any bundles"
      };
    }

    // Check if product has critical changes
    const isArchived = status === "archived" || status === "draft";
    const hasNoVariants = variants.length === 0;
    const hasNoAvailableVariants = variants.every((v: any) =>
      v.inventory_policy === "deny" && v.inventory_quantity <= 0
    );

    const isCriticalChange = isArchived || hasNoVariants || hasNoAvailableVariants;

    if (isCriticalChange) {
      // Get unique bundle IDs that are currently active
      const affectedBundleIds = [
        ...new Set(
          stepsWithProduct
            .map(sp => sp.step.bundle)
            .filter(bundle => bundle.status === "active")
            .map(bundle => bundle.id)
        )
      ];

      if (affectedBundleIds.length > 0) {
        // Set affected bundles to draft
        await db.bundle.updateMany({
          where: {
            id: {
              in: affectedBundleIds
            },
            status: "active"
          },
          data: {
            status: "draft"
          }
        });

        AppLogger.warn("Set bundles to draft due to product becoming unavailable", {
          component: "webhook-processor",
          operation: "handleProductUpdate"
        }, {
          shop: shopDomain,
          productId,
          reason: isArchived ? "product_archived" : hasNoVariants ? "no_variants" : "no_available_variants",
          affectedBundles: affectedBundleIds.length
        });

        return {
          success: true,
          message: `Set ${affectedBundleIds.length} bundles to draft due to product unavailability`
        };
      }
    }

    return {
      success: true,
      message: "Product update processed, no critical changes detected"
    };

  } catch (error) {
    AppLogger.error("Error handling product update", {
      component: "webhook-processor",
      operation: "handleProductUpdate"
    }, error);

    return {
      success: false,
      message: "Error handling product update",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Handle product delete webhook
 * Removes deleted products from bundles and archives bundles with no products left
 */
export async function handleProductDelete(
  shopDomain: string,
  payload: any
): Promise<WebhookProcessResult> {
  try {
    // SAFETY: Validate payload has required fields
    if (!payload.id) {
      return {
        success: false,
        message: "Missing product ID in webhook payload",
        error: "payload.id is required"
      };
    }

    const productId = `gid://shopify/Product/${payload.id}`;

    AppLogger.info("Processing product delete", {
      component: "webhook-processor",
      operation: "handleProductDelete"
    }, { shop: shopDomain, productId });

    // Find all steps using this product
    const stepsWithProduct = await db.stepProduct.findMany({
      where: {
        productId
      },
      include: {
        step: true
      }
    });

    if (stepsWithProduct.length === 0) {
      return {
        success: true,
        message: "Product not used in any bundles"
      };
    }

    // Delete all StepProduct entries for this product
    await db.stepProduct.deleteMany({
      where: {
        productId
      }
    });

    AppLogger.info("Deleted product from bundle steps", {
      component: "webhook-processor",
      operation: "handleProductDelete"
    }, { shop: shopDomain, productId, deletedCount: stepsWithProduct.length });

    // Get unique step IDs
    const stepIds = [...new Set(stepsWithProduct.map(sp => sp.stepId))];

    // Find steps that now have no products
    const emptySteps = await db.bundleStep.findMany({
      where: {
        id: {
          in: stepIds
        }
      },
      include: {
        StepProduct: true,
        bundle: true
      }
    });

    const emptyStepIds = emptySteps
      .filter(step => step.StepProduct.length === 0)
      .map(step => step.id);

    if (emptyStepIds.length > 0) {
      // Find bundles that have empty steps
      const bundlesWithEmptySteps = await db.bundle.findMany({
        where: {
          steps: {
            some: {
              id: {
                in: emptyStepIds
              }
            }
          },
          status: "active"
        },
        select: {
          id: true
        }
      });

      if (bundlesWithEmptySteps.length > 0) {
        // Archive bundles with empty steps
        await db.bundle.updateMany({
          where: {
            id: {
              in: bundlesWithEmptySteps.map(b => b.id)
            }
          },
          data: {
            status: "archived"
          }
        });

        AppLogger.warn("Archived bundles with empty steps after product deletion", {
          component: "webhook-processor",
          operation: "handleProductDelete"
        }, {
          shop: shopDomain,
          productId,
          archivedBundles: bundlesWithEmptySteps.length
        });

        return {
          success: true,
          message: `Product deleted, archived ${bundlesWithEmptySteps.length} bundles with empty steps`
        };
      }
    }

    return {
      success: true,
      message: "Product deleted from bundle steps"
    };

  } catch (error) {
    AppLogger.error("Error handling product delete", {
      component: "webhook-processor",
      operation: "handleProductDelete"
    }, error);

    return {
      success: false,
      message: "Error handling product delete",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
