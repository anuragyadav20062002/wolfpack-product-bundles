/**
 * Inventory Webhook Handler
 *
 * Handles `inventory_levels/update` webhook topic.
 * Finds bundles containing the updated product and triggers inventory recalculation.
 */

import db from "../../../db.server";
import { AppLogger } from "../../../lib/logger";
import { syncBundleInventory } from "../../bundles/inventory-sync.server";
import type { WebhookProcessResult } from "../types";

/**
 * Handle inventory_levels/update webhook.
 *
 * 1. Extract inventory_item_id from payload
 * 2. Find bundles containing products with this inventory item
 * 3. Mark affected bundles as stale
 * 4. Trigger inventory sync for each affected bundle
 */
export async function handleInventoryUpdate(
  shopDomain: string,
  payload: any
): Promise<WebhookProcessResult> {
  try {
    const inventoryItemId = payload.inventory_item_id;

    if (!inventoryItemId) {
      return {
        success: true,
        message: "Skipped: no inventory_item_id in payload",
      };
    }

    AppLogger.info("Processing inventory update", {
      component: "webhook-processor",
      operation: "handleInventoryUpdate",
    }, { shop: shopDomain, inventoryItemId });

    // Find all step products that reference the product associated with this inventory item.
    // The webhook payload contains inventory_item_id but our StepProduct stores productId (GID).
    // We need to find which bundles might be affected.
    // Since the webhook gives us inventory_item_id (numeric), we query all step products
    // for this shop and let the sync engine handle the actual inventory check.
    const stepsWithProduct = await db.stepProduct.findMany({
      where: {
        step: {
          bundle: {
            shopId: shopDomain,
          },
        },
      },
      include: {
        step: {
          include: {
            bundle: true,
          },
        },
      },
    });

    // Get unique active bundle IDs
    const activeBundles = new Map<string, any>();
    for (const sp of stepsWithProduct) {
      const bundle = sp.step.bundle;
      if (bundle.status === "active" && !activeBundles.has(bundle.id)) {
        activeBundles.set(bundle.id, bundle);
      }
    }

    if (activeBundles.size === 0) {
      return {
        success: true,
        message: "Inventory item not in any active bundle",
      };
    }

    const bundleIds = Array.from(activeBundles.keys());

    // Mark bundles as stale
    await db.bundle.updateMany({
      where: { id: { in: bundleIds } },
      data: { inventoryStaleAt: new Date() },
    });

    // Lazy-load shopify.server to avoid triggering shopifyApp() initialization
    // at module load time (the webhook worker doesn't set SHOPIFY_API_KEY)
    const { unauthenticated } = await import("../../../shopify.server");
    const { admin } = await unauthenticated.admin(shopDomain);

    // Sync each bundle (syncBundleInventory handles debounce internally)
    const results: Array<{ bundleId: string; success: boolean }> = [];
    for (const bundleId of bundleIds) {
      try {
        const result = await syncBundleInventory(admin, bundleId);
        results.push({ bundleId, success: result.success });
      } catch (error) {
        AppLogger.error("Failed to sync bundle during webhook", {
          component: "webhook-processor",
          operation: "handleInventoryUpdate",
        }, { bundleId, error });
        results.push({ bundleId, success: false });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    if (failCount > 0) {
      return {
        success: false,
        message: `Inventory sync: ${successCount} succeeded, ${failCount} failed`,
        error: `${failCount} bundle(s) failed to sync`,
      };
    }

    return {
      success: true,
      message: `Inventory synced for ${successCount} bundle(s)`,
    };
  } catch (error) {
    AppLogger.error("Error handling inventory update", {
      component: "webhook-processor",
      operation: "handleInventoryUpdate",
    }, error);

    return {
      success: false,
      message: "Error handling inventory update",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
