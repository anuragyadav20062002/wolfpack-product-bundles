import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { AppLogger } from "../lib/logger";
import { MetafieldCleanupService } from "../services/metafield-cleanup.server";
import { BillingService } from "../services/billing.server";

/**
 * App Uninstall Webhook Handler
 *
 * Triggered when merchant uninstalls the app from their store.
 * Performs comprehensive cleanup:
 * 1. Delete all bundle-related metafields (shop and product level)
 * 2. Delete database records (bundles, sessions, etc.)
 * 3. Clean up metafield definitions (optional)
 *
 * Note: This webhook can trigger multiple times, so all operations
 * should be idempotent.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic, admin } = await authenticate.webhook(request);

  AppLogger.info("App uninstall initiated", {
    component: "webhooks.app.uninstalled",
    operation: "uninstall-start",
    topic,
    shop
  });

  try {
    // Step 0: Cancel active subscription in Shopify if exists
    if (admin) {
      try {
        const cancelResult = await BillingService.cancelSubscription(admin, shop);
        if (cancelResult.success) {
          AppLogger.info("Subscription cancelled on uninstall", {
            component: "webhooks.app.uninstalled",
            operation: "cancel-subscription"
          }, { shop });
        }
      } catch (subscriptionError) {
        // Log error but continue with cleanup
        AppLogger.error("Failed to cancel subscription on uninstall", {
          component: "webhooks.app.uninstalled",
          operation: "cancel-subscription"
        }, subscriptionError);
      }
    }

    // Step 1: Get all bundles for this shop before deletion
    const bundles = await db.bundle.findMany({
      where: { shopId: shop },
      include: {
        steps: {
          include: {
            StepProduct: true
          }
        }
      }
    });

    AppLogger.info("Found bundles to cleanup", {
      component: "webhooks.app.uninstalled",
      operation: "get-bundles"
    }, { count: bundles.length });

    // Step 2: Clean up metafields for each bundle
    if (admin && bundles.length > 0) {
      for (const bundle of bundles) {
        try {
          if (bundle.shopifyProductId) {
            // Collect component product IDs
            const componentProductIds = Array.from(new Set(
              bundle.steps
                .flatMap(step => step.StepProduct || [])
                .map(sp => sp.productId)
                .filter(Boolean)
            ));

            // Clean up bundle metafields (product-level)
            await MetafieldCleanupService.cleanupBundleMetafields(
              admin,
              bundle.id,
              bundle.shopifyProductId,
              componentProductIds
            );

            AppLogger.info("Cleaned up bundle metafields", {
              component: "webhooks.app.uninstalled",
              operation: "cleanup-bundle"
            }, { bundleId: bundle.id });
          }
        } catch (bundleError) {
          // Log error but continue with other bundles
          AppLogger.error("Failed to cleanup bundle metafields", {
            component: "webhooks.app.uninstalled",
            operation: "cleanup-bundle"
          }, { bundleId: bundle.id, error: bundleError });
        }
      }

      // Step 3: Clean up shop-level metafields
      try {
        await cleanupShopMetafields(admin);
        AppLogger.info("Cleaned up shop-level metafields", {
          component: "webhooks.app.uninstalled",
          operation: "cleanup-shop-metafields"
        });
      } catch (shopMetafieldError) {
        AppLogger.error("Failed to cleanup shop metafields", {
          component: "webhooks.app.uninstalled",
          operation: "cleanup-shop-metafields"
        }, shopMetafieldError);
      }
    }

    // Step 4: Delete database records (bundles will cascade delete steps, pricing, etc.)
    if (bundles.length > 0) {
      const deletedBundles = await db.bundle.deleteMany({
        where: { shopId: shop }
      });

      AppLogger.info("Deleted bundles from database", {
        component: "webhooks.app.uninstalled",
        operation: "delete-db-records"
      }, { count: deletedBundles.count });
    }

    // Step 5: Delete sessions
    // Webhook requests can trigger multiple times and after an app has already been uninstalled.
    // If this webhook already ran, the session may have been deleted previously.
    if (session) {
      await db.session.deleteMany({ where: { shop } });
      AppLogger.info("Deleted sessions", {
        component: "webhooks.app.uninstalled",
        operation: "delete-sessions"
      });
    }

    // Step 6: Delete all remaining shop data
    // Delete DesignSettings for this shop
    try {
      const deletedDesignSettings = await db.designSettings.deleteMany({
        where: { shopId: shop }
      });
      AppLogger.info("Deleted design settings", {
        component: "webhooks.app.uninstalled",
        operation: "delete-design-settings"
      }, { count: deletedDesignSettings.count });
    } catch (designSettingsError) {
      AppLogger.error("Failed to delete design settings", {
        component: "webhooks.app.uninstalled",
        operation: "delete-design-settings"
      }, designSettingsError);
    }

    // Delete QueuedJobs for this shop
    try {
      const deletedJobs = await db.queuedJob.deleteMany({
        where: { shopId: shop }
      });
      AppLogger.info("Deleted queued jobs", {
        component: "webhooks.app.uninstalled",
        operation: "delete-queued-jobs"
      }, { count: deletedJobs.count });
    } catch (jobsError) {
      AppLogger.error("Failed to delete queued jobs", {
        component: "webhooks.app.uninstalled",
        operation: "delete-queued-jobs"
      }, jobsError);
    }

    // Delete ComplianceRecords for this shop
    try {
      const deletedCompliance = await db.complianceRecord.deleteMany({
        where: { shop: shop }
      });
      AppLogger.info("Deleted compliance records", {
        component: "webhooks.app.uninstalled",
        operation: "delete-compliance-records"
      }, { count: deletedCompliance.count });
    } catch (complianceError) {
      AppLogger.error("Failed to delete compliance records", {
        component: "webhooks.app.uninstalled",
        operation: "delete-compliance-records"
      }, complianceError);
    }

    // Delete WebhookEvents for this shop
    try {
      const deletedWebhookEvents = await db.webhookEvent.deleteMany({
        where: { shopDomain: shop }
      });
      AppLogger.info("Deleted webhook events", {
        component: "webhooks.app.uninstalled",
        operation: "delete-webhook-events"
      }, { count: deletedWebhookEvents.count });
    } catch (webhookEventsError) {
      AppLogger.error("Failed to delete webhook events", {
        component: "webhooks.app.uninstalled",
        operation: "delete-webhook-events"
      }, webhookEventsError);
    }

    // Step 7: Delete Shop record (this will cascade delete Subscriptions)
    try {
      const deletedShop = await db.shop.deleteMany({
        where: { shopDomain: shop }
      });
      AppLogger.info("Deleted shop record", {
        component: "webhooks.app.uninstalled",
        operation: "delete-shop"
      }, { count: deletedShop.count });
    } catch (shopDeleteError) {
      AppLogger.error("Failed to delete shop record", {
        component: "webhooks.app.uninstalled",
        operation: "delete-shop"
      }, shopDeleteError);
    }

    AppLogger.info("App uninstall completed successfully - all data removed", {
      component: "webhooks.app.uninstalled",
      operation: "uninstall-complete",
      shop
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    AppLogger.error("App uninstall failed", {
      component: "webhooks.app.uninstalled",
      operation: "uninstall-error"
    }, error);

    // Return 200 anyway to prevent Shopify from retrying
    // (retries won't help if there's a fundamental error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
};

/**
 * Clean up shop-level metafields created by the app
 */
async function cleanupShopMetafields(admin: any) {
  try {
    // Get shop GID
    const shopResponse = await admin.graphql(`
      query GetShopId {
        shop {
          id
        }
      }
    `);

    const shopData = await shopResponse.json();
    const shopGid = shopData.data?.shop?.id;

    if (!shopGid) {
      AppLogger.error('Could not get shop GID', {
        component: 'webhooks.app.uninstalled',
        operation: 'cleanup-shop-metafields'
      });
      return;
    }

    // List of shop-level metafields to delete
    const shopMetafieldsToDelete = [
      {
        ownerId: shopGid,
        namespace: "$app",
        key: "bundleIndex"
      },
      {
        ownerId: shopGid,
        namespace: "$app",
        key: "serverUrl"
      },
      {
        ownerId: shopGid,
        namespace: "$app",
        key: "lastSync"
      }
      // Add any other shop-level metafields your app creates
    ];

    // Delete shop metafields
    const DELETE_METAFIELDS = `
      mutation DeleteMetafields($metafields: [MetafieldIdentifierInput!]!) {
        metafieldsDelete(metafields: $metafields) {
          deletedMetafields {
            key
            namespace
            ownerId
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await admin.graphql(DELETE_METAFIELDS, {
      variables: { metafields: shopMetafieldsToDelete }
    });

    const data = await response.json();

    if (data.data?.metafieldsDelete?.userErrors?.length > 0) {
      AppLogger.warn('Some shop metafields could not be deleted', {
        component: 'webhooks.app.uninstalled',
        operation: 'cleanup-shop-metafields'
      }, data.data.metafieldsDelete.userErrors);
    }

    const deletedCount = data.data?.metafieldsDelete?.deletedMetafields?.length || 0;

    AppLogger.info('Shop metafields deleted', {
      component: 'webhooks.app.uninstalled',
      operation: 'cleanup-shop-metafields'
    }, { deletedCount });

  } catch (error) {
    AppLogger.error('Error cleaning up shop metafields', {
      component: 'webhooks.app.uninstalled',
      operation: 'cleanup-shop-metafields'
    }, error);
    throw error;
  }
}
