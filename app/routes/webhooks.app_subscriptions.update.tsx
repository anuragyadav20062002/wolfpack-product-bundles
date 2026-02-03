import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { AppLogger } from "../lib/logger";
import { PLANS } from "../constants/plans";

/**
 * App Subscription Update Webhook Handler
 *
 * Triggered when a subscription status changes in Shopify, including:
 * - Subscription activated
 * - Subscription cancelled (from Shopify admin)
 * - Subscription expired
 * - Subscription frozen (payment failed)
 *
 * This ensures our database stays in sync with Shopify's billing status.
 *
 * Webhook topic: APP_SUBSCRIPTIONS_UPDATE
 */

interface SubscriptionWebhookPayload {
  app_subscription: {
    admin_graphql_api_id: string;
    name: string;
    status: string;
    created_at: string;
    updated_at: string;
    currency: string;
    capped_amount?: string;
  };
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  AppLogger.info("Subscription update webhook received", {
    component: "webhooks.app_subscriptions.update",
    operation: "webhook-received",
    topic,
    shop
  });

  try {
    const subscriptionData = payload as SubscriptionWebhookPayload;
    const shopifySubscriptionId = subscriptionData.app_subscription?.admin_graphql_api_id;
    const newStatus = subscriptionData.app_subscription?.status?.toLowerCase();

    if (!shopifySubscriptionId || !newStatus) {
      AppLogger.warn("Invalid subscription webhook payload", {
        component: "webhooks.app_subscriptions.update",
        operation: "validate-payload"
      }, { payload });
      return new Response("Invalid payload", { status: 400 });
    }

    AppLogger.info("Processing subscription status change", {
      component: "webhooks.app_subscriptions.update",
      operation: "process-status-change"
    }, {
      shop,
      shopifySubscriptionId,
      newStatus
    });

    // Find the subscription in our database
    const subscription = await db.subscription.findFirst({
      where: {
        shopifySubscriptionId,
      },
      include: {
        shop: true
      }
    });

    if (!subscription) {
      AppLogger.warn("Subscription not found in database", {
        component: "webhooks.app_subscriptions.update",
        operation: "find-subscription"
      }, { shopifySubscriptionId, shop });

      // This could be a subscription created outside our app flow
      return new Response("Subscription not found", { status: 200 });
    }

    // Map Shopify status to our status
    const statusMap: Record<string, string> = {
      active: "active",
      cancelled: "cancelled",
      declined: "declined",
      expired: "expired",
      frozen: "frozen",
      pending: "pending",
    };

    const mappedStatus = statusMap[newStatus] || newStatus;
    const previousStatus = subscription.status;

    // Update subscription status in database
    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: mappedStatus as any,
        ...(mappedStatus === "cancelled" && { cancelledAt: new Date() }),
      }
    });

    AppLogger.info("Subscription status updated", {
      component: "webhooks.app_subscriptions.update",
      operation: "update-status"
    }, {
      shop,
      subscriptionId: subscription.id,
      previousStatus,
      newStatus: mappedStatus
    });

    // Handle downgrade protection if subscription was cancelled
    if (mappedStatus === "cancelled" && previousStatus === "active" && subscription.plan === "grow") {
      await handleDowngrade(subscription.shop.shopDomain, subscription.shopId);
    }

    // Clear currentSubscriptionId if subscription is no longer active
    if (mappedStatus !== "active" && mappedStatus !== "pending") {
      await db.shop.update({
        where: { id: subscription.shopId },
        data: { currentSubscriptionId: null }
      });

      AppLogger.info("Cleared current subscription reference", {
        component: "webhooks.app_subscriptions.update",
        operation: "clear-current-subscription"
      }, { shop, subscriptionId: subscription.id });
    }

    return new Response("OK", { status: 200 });

  } catch (error) {
    AppLogger.error("Error processing subscription webhook", {
      component: "webhooks.app_subscriptions.update",
      operation: "process-webhook"
    }, error);

    // Return 200 to prevent Shopify from retrying
    // We log the error for manual investigation
    return new Response("Error processed", { status: 200 });
  }
};

/**
 * Handle downgrade from Grow to Free plan
 * Archives excess bundles beyond the free plan limit
 */
async function handleDowngrade(shopDomain: string, shopId: string): Promise<void> {
  try {
    const freeLimit = PLANS.free.bundleLimit;

    // Get all active/draft bundles ordered by creation date (oldest first)
    const bundles = await db.bundle.findMany({
      where: {
        shopId: shopDomain,
        status: { in: ["active", "draft"] }
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, status: true }
    });

    if (bundles.length <= freeLimit) {
      AppLogger.info("No excess bundles to archive", {
        component: "webhooks.app_subscriptions.update",
        operation: "handle-downgrade"
      }, { shopDomain, bundleCount: bundles.length, freeLimit });
      return;
    }

    // Keep the first N bundles (oldest), archive the rest
    const bundlesToKeep = bundles.slice(0, freeLimit);
    const bundlesToArchive = bundles.slice(freeLimit);

    AppLogger.info("Archiving excess bundles on downgrade", {
      component: "webhooks.app_subscriptions.update",
      operation: "archive-bundles"
    }, {
      shopDomain,
      totalBundles: bundles.length,
      keeping: bundlesToKeep.length,
      archiving: bundlesToArchive.length
    });

    // Archive excess bundles
    const archiveIds = bundlesToArchive.map(b => b.id);
    await db.bundle.updateMany({
      where: {
        id: { in: archiveIds }
      },
      data: {
        status: "archived"
      }
    });

    AppLogger.info("Excess bundles archived successfully", {
      component: "webhooks.app_subscriptions.update",
      operation: "archive-complete"
    }, {
      shopDomain,
      archivedBundleIds: archiveIds,
      archivedBundleNames: bundlesToArchive.map(b => b.name)
    });

  } catch (error) {
    AppLogger.error("Error handling downgrade", {
      component: "webhooks.app_subscriptions.update",
      operation: "handle-downgrade"
    }, error);
    // Don't throw - we want the webhook to complete
  }
}
