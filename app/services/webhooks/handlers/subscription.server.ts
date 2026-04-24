/**
 * Subscription Webhook Handlers
 *
 * Handles subscription-related webhooks:
 * - app_subscriptions/update
 * - app_subscriptions/cancelled
 * - app_subscriptions/approaching_capped_amount
 */

import db from "../../../db.server";
import { AppLogger } from "../../../lib/logger";
import { PLANS } from "../../../constants/plans";
import { BundleStatus } from "../../../constants/bundle";
import { SubscriptionStatus as SubscriptionStatusValue } from "../../../constants/subscription";
import { ERROR_MESSAGES } from "../../../constants/errors";
import type { SubscriptionStatus } from "@prisma/client";
import type { ShopifySubscriptionStatus, WebhookProcessResult } from "../types";

/**
 * Map Shopify subscription status to our schema
 * https://shopify.dev/docs/api/admin-graphql/latest/enums/AppSubscriptionStatus
 */
export function mapSubscriptionStatus(
  shopifyStatus: ShopifySubscriptionStatus
): SubscriptionStatus {
  const statusMap: Record<ShopifySubscriptionStatus, SubscriptionStatus> = {
    ACTIVE: SubscriptionStatusValue.active,
    CANCELLED: SubscriptionStatusValue.cancelled,
    DECLINED: SubscriptionStatusValue.declined,
    EXPIRED: SubscriptionStatusValue.expired,
    FROZEN: SubscriptionStatusValue.frozen,
    PENDING: SubscriptionStatusValue.pending
  };

  return statusMap[shopifyStatus] || SubscriptionStatusValue.pending;
}

/**
 * Handle subscription update webhook
 * Maps Shopify subscription status and handles downgrades
 */
export async function handleSubscriptionUpdate(
  shopDomain: string,
  payload: any
): Promise<WebhookProcessResult> {
  try {
    const shopifySubscriptionId = payload.app_subscription?.admin_graphql_api_id;
    const status: ShopifySubscriptionStatus = payload.app_subscription?.status;
    const name = payload.app_subscription?.name;
    const trialDaysRemaining = payload.app_subscription?.trial_days_remaining;
    const currentPeriodEnd = payload.app_subscription?.current_period_end;

    if (!shopifySubscriptionId) {
      return {
        success: false,
        message: "Missing subscription ID in webhook payload",
        error: "shopifySubscriptionId is required"
      };
    }

    AppLogger.info("Processing subscription update", {
      component: "webhook-processor",
      operation: "handleSubscriptionUpdate"
    }, { shop: shopDomain, status, shopifySubscriptionId });

    // Find shop
    const shop = await db.shop.findUnique({
      where: { shopDomain }
    });

    if (!shop) {
      return {
        success: false,
        message: ERROR_MESSAGES.SHOP_NOT_FOUND,
        error: `Shop ${shopDomain} not found in database`
      };
    }

    // Find subscription in database
    const subscription = await db.subscription.findUnique({
      where: { shopifySubscriptionId }
    });

    if (!subscription) {
      AppLogger.warn("Subscription not found in database", {
        component: "webhook-processor",
        operation: "handleSubscriptionUpdate"
      }, { shop: shopDomain, shopifySubscriptionId });

      return {
        success: true,
        message: "Subscription not found in database (may have been created elsewhere)"
      };
    }

    // Map Shopify status to our schema
    const mappedStatus = mapSubscriptionStatus(status);

    // Update subscription
    // SAFETY: Explicitly handle cancelledAt based on status
    if (mappedStatus === SubscriptionStatusValue.cancelled) {
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          status: mappedStatus,
          name: name || subscription.name,
          trialDaysRemaining,
          currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : subscription.currentPeriodEnd,
          cancelledAt: new Date()
        }
      });
    } else {
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          status: mappedStatus,
          name: name || subscription.name,
          trialDaysRemaining,
          currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : subscription.currentPeriodEnd
        }
      });
    }

    // Handle downgrade to free plan
    const shouldDowngrade = [
      SubscriptionStatusValue.cancelled,
      SubscriptionStatusValue.expired,
      SubscriptionStatusValue.frozen
    ].includes(mappedStatus);

    if (shouldDowngrade && subscription.plan !== "free") {
      AppLogger.info("Downgrading subscription to free plan", {
        component: "webhook-processor",
        operation: "handleSubscriptionUpdate"
      }, { shop: shopDomain, previousPlan: subscription.plan });

      // SAFETY: Check if shop already has an active free subscription
      const existingFreeSubscription = await db.subscription.findFirst({
        where: {
          shopId: shop.id,
          plan: "free",
          status: SubscriptionStatusValue.active
        }
      });

      let freeSubscription;
      if (existingFreeSubscription) {
        // Use existing free subscription
        freeSubscription = existingFreeSubscription;
        AppLogger.info("Using existing free subscription", {
          component: "webhook-processor",
          operation: "handleSubscriptionUpdate"
        }, { shop: shopDomain, freeSubscriptionId: existingFreeSubscription.id });
      } else {
        // Create new free plan subscription
        freeSubscription = await db.subscription.create({
          data: {
            shopId: shop.id,
            plan: "free",
            status: SubscriptionStatusValue.active,
            name: PLANS.free.name,
            price: 0,
            currencyCode: "USD"
          }
        });
      }

      // Update shop's current subscription
      await db.shop.update({
        where: { id: shop.id },
        data: {
          currentSubscriptionId: freeSubscription.id
        }
      });

      // Check if bundle count exceeds free plan limit
      const bundleCount = await db.bundle.count({
        where: {
          shopId: shopDomain,
          status: {
            in: [BundleStatus.ACTIVE, BundleStatus.DRAFT]
          }
        }
      });

      const freeLimit = PLANS.free.bundleLimit;

      if (bundleCount > freeLimit) {
        AppLogger.info("Bundle count exceeds free plan limit, archiving excess", {
          component: "webhook-processor",
          operation: "handleSubscriptionUpdate"
        }, { shop: shopDomain, bundleCount, limit: freeLimit });

        // Get bundles to archive (keep oldest bundles, archive newest)
        const bundlesToArchive = await db.bundle.findMany({
          where: {
            shopId: shopDomain,
            status: {
              in: [BundleStatus.ACTIVE, BundleStatus.DRAFT]
            }
          },
          orderBy: {
            createdAt: "desc"
          },
          skip: freeLimit,
          select: {
            id: true
          }
        });

        // Archive excess bundles
        await db.bundle.updateMany({
          where: {
            id: {
              in: bundlesToArchive.map(b => b.id)
            }
          },
          data: {
            status: "archived"
          }
        });

        AppLogger.info("Archived excess bundles", {
          component: "webhook-processor",
          operation: "handleSubscriptionUpdate"
        }, { shop: shopDomain, archivedCount: bundlesToArchive.length });
      }
    }

    return {
      success: true,
      message: `Subscription updated to ${mappedStatus}`
    };

  } catch (error) {
    AppLogger.error("Error handling subscription update", {
      component: "webhook-processor",
      operation: "handleSubscriptionUpdate"
    }, error);

    return {
      success: false,
      message: "Error handling subscription update",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Handle subscription cancellation webhook
 * Triggered when a subscription is cancelled by the merchant or Shopify
 */
export async function handleSubscriptionCancelled(
  shopDomain: string,
  payload: any
): Promise<WebhookProcessResult> {
  try {
    const shopifySubscriptionId = payload.app_subscription?.admin_graphql_api_id;

    if (!shopifySubscriptionId) {
      return {
        success: false,
        message: "Missing subscription ID in webhook payload",
        error: "shopifySubscriptionId is required"
      };
    }

    AppLogger.info("Processing subscription cancellation", {
      component: "webhook-processor",
      operation: "handleSubscriptionCancelled"
    }, { shop: shopDomain, shopifySubscriptionId });

    // Find shop
    const shop = await db.shop.findUnique({
      where: { shopDomain }
    });

    if (!shop) {
      return {
        success: false,
        message: ERROR_MESSAGES.SHOP_NOT_FOUND,
        error: `Shop ${shopDomain} not found in database`
      };
    }

    // Find and update subscription
    const subscription = await db.subscription.findUnique({
      where: { shopifySubscriptionId }
    });

    if (!subscription) {
      AppLogger.warn("Cancelled subscription not found in database", {
        component: "webhook-processor",
        operation: "handleSubscriptionCancelled"
      }, { shop: shopDomain, shopifySubscriptionId });

      return {
        success: true,
        message: "Subscription not found (may have been deleted)"
      };
    }

    // Mark subscription as cancelled
    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatusValue.cancelled,
        cancelledAt: new Date()
      }
    });

    // SAFETY: Check if shop already has an active free subscription
    const existingFreeSubscription = await db.subscription.findFirst({
      where: {
        shopId: shop.id,
        plan: "free",
        status: SubscriptionStatusValue.active
      }
    });

    let freeSubscription;
    if (existingFreeSubscription) {
      // Use existing free subscription
      freeSubscription = existingFreeSubscription;
      AppLogger.info("Using existing free subscription", {
        component: "webhook-processor",
        operation: "handleSubscriptionCancelled"
      }, { shop: shopDomain, freeSubscriptionId: existingFreeSubscription.id });
    } else {
      // Create new free plan subscription
      freeSubscription = await db.subscription.create({
        data: {
          shopId: shop.id,
          plan: "free",
          status: SubscriptionStatusValue.active,
          name: PLANS.free.name,
          price: 0,
          currencyCode: "USD"
        }
      });
    }

    // Update shop's current subscription
    await db.shop.update({
      where: { id: shop.id },
      data: {
        currentSubscriptionId: freeSubscription.id
      }
    });

    // Check if bundle count exceeds free plan limit
    const bundleCount = await db.bundle.count({
      where: {
        shopId: shopDomain,
        status: {
          in: [BundleStatus.ACTIVE, BundleStatus.DRAFT]
        }
      }
    });

    const freeLimit = PLANS.free.bundleLimit;

    if (bundleCount > freeLimit) {
      AppLogger.info("Bundle count exceeds free plan limit, archiving excess", {
        component: "webhook-processor",
        operation: "handleSubscriptionCancelled"
      }, { shop: shopDomain, bundleCount, limit: freeLimit });

      // Get bundles to archive (keep oldest bundles, archive newest)
      const bundlesToArchive = await db.bundle.findMany({
        where: {
          shopId: shopDomain,
          status: {
            in: [BundleStatus.ACTIVE, BundleStatus.DRAFT]
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        skip: freeLimit,
        select: {
          id: true
        }
      });

      // Archive excess bundles
      await db.bundle.updateMany({
        where: {
          id: {
            in: bundlesToArchive.map(b => b.id)
          }
        },
        data: {
          status: "archived"
        }
      });

      AppLogger.info("Archived excess bundles", {
        component: "webhook-processor",
        operation: "handleSubscriptionCancelled"
      }, { shop: shopDomain, archivedCount: bundlesToArchive.length });
    }

    AppLogger.info("Subscription cancelled, downgraded to free plan", {
      component: "webhook-processor",
      operation: "handleSubscriptionCancelled"
    }, { shop: shopDomain, subscriptionId: subscription.id });

    return {
      success: true,
      message: "Subscription cancelled and downgraded to free plan"
    };

  } catch (error) {
    AppLogger.error("Error handling subscription cancellation", {
      component: "webhook-processor",
      operation: "handleSubscriptionCancelled"
    }, error);

    return {
      success: false,
      message: "Error handling subscription cancellation",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Handle approaching capped amount webhook
 * Triggered when usage-based charges reach 90% of their cap
 * Note: Currently for usage-based billing (future feature)
 */
export async function handleSubscriptionApproachingCap(
  shopDomain: string,
  payload: any
): Promise<WebhookProcessResult> {
  try {
    const shopifySubscriptionId = payload.app_subscription?.admin_graphql_api_id;
    const cappedAmount = payload.app_subscription?.capped_amount;
    const balance = payload.balance;

    AppLogger.info("Subscription approaching capped amount", {
      component: "webhook-processor",
      operation: "handleSubscriptionApproachingCap"
    }, { shop: shopDomain, shopifySubscriptionId, cappedAmount, balance });

    // For now, just log the event
    // In the future, you can implement:
    // 1. Send email notification to merchant
    // 2. Display in-app banner
    // 3. Suggest upgrade to higher tier

    return {
      success: true,
      message: "Approaching capped amount event logged"
    };

  } catch (error) {
    AppLogger.error("Error handling approaching capped amount", {
      component: "webhook-processor",
      operation: "handleSubscriptionApproachingCap"
    }, error);

    return {
      success: false,
      message: "Error handling approaching capped amount",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Handle one-time purchase update webhook
 * Tracks one-time app charges and updates
 */
export async function handlePurchaseUpdate(
  shopDomain: string,
  payload: any
): Promise<WebhookProcessResult> {
  try {
    const chargeId = payload.app_purchase_one_time?.admin_graphql_api_id;
    const status = payload.app_purchase_one_time?.status;

    AppLogger.info("Processing one-time purchase update", {
      component: "webhook-processor",
      operation: "handlePurchaseUpdate"
    }, { shop: shopDomain, status, chargeId });

    // For now, we just log the purchase update
    // You can add database tracking here if needed
    return {
      success: true,
      message: `One-time purchase update processed: ${status}`
    };

  } catch (error) {
    AppLogger.error("Error handling purchase update", {
      component: "webhook-processor",
      operation: "handlePurchaseUpdate"
    }, error);

    return {
      success: false,
      message: "Error handling purchase update",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
