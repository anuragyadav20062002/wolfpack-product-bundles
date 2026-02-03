/**
 * Billing Service
 *
 * Handles all subscription billing operations including:
 * - Creating subscriptions
 * - Checking subscription status
 * - Canceling subscriptions
 * - Fetching subscription details
 * - Plan limits enforcement
 */

import db from "../db.server";
import { AppLogger } from "../lib/logger";
import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { PLANS } from "../constants/plans";

export interface CreateSubscriptionParams {
  shopDomain: string;
  plan: SubscriptionPlan;
  returnUrl: string;
  test?: boolean;
}

export interface CreateSubscriptionResult {
  success: boolean;
  confirmationUrl?: string;
  subscriptionId?: string;
  error?: string;
}

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  bundleLimit: number;
  currentBundleCount: number;
  canCreateBundle: boolean;
  isActive: boolean;
}

export class BillingService {
  /**
   * Create a new subscription using Shopify's appSubscriptionCreate mutation
   */
  static async createSubscription(
    admin: any,
    params: CreateSubscriptionParams
  ): Promise<CreateSubscriptionResult> {
    // Use dedicated test charges flag, defaulting to true for safety
    // Only set SHOPIFY_TEST_CHARGES=false in real production environment
    const useTestCharges = process.env.SHOPIFY_TEST_CHARGES !== "false";
    const { shopDomain, plan, returnUrl, test = useTestCharges } = params;

    // Can't create paid subscription for free plan
    if (plan === "free") {
      return {
        success: false,
        error: "Cannot create subscription for free plan"
      };
    }

    const planConfig = PLANS[plan];

    try {
      AppLogger.info("Creating subscription", {
        component: "billing.server",
        operation: "createSubscription"
      }, { shop: shopDomain, plan, price: planConfig.price });

      const CREATE_SUBSCRIPTION = `
        mutation CreateAppSubscription(
          $name: String!,
          $returnUrl: URL!,
          $test: Boolean!,
          $lineItems: [AppSubscriptionLineItemInput!]!
        ) {
          appSubscriptionCreate(
            name: $name,
            returnUrl: $returnUrl,
            test: $test,
            lineItems: $lineItems
          ) {
            appSubscription {
              id
              name
              status
              currentPeriodEnd
              test
            }
            confirmationUrl
            userErrors {
              field
              message
            }
          }
        }
      `;

      const response = await admin.graphql(CREATE_SUBSCRIPTION, {
        variables: {
          name: planConfig.name,
          returnUrl,
          test,
          lineItems: [
            {
              plan: {
                appRecurringPricingDetails: {
                  interval: planConfig.interval,
                  price: {
                    amount: planConfig.price,
                    currencyCode: planConfig.currencyCode
                  }
                }
              }
            }
          ]
        }
      });

      const data = await response.json();

      if (data.data?.appSubscriptionCreate?.userErrors?.length > 0) {
        const errors = data.data.appSubscriptionCreate.userErrors;
        AppLogger.error("Failed to create subscription", {
          component: "billing.server",
          operation: "createSubscription"
        }, { errors });

        return {
          success: false,
          error: errors.map((e: any) => e.message).join(", ")
        };
      }

      const appSubscription = data.data?.appSubscriptionCreate?.appSubscription;
      const confirmationUrl = data.data?.appSubscriptionCreate?.confirmationUrl;

      if (!appSubscription || !confirmationUrl) {
        return {
          success: false,
          error: "Failed to get subscription confirmation URL"
        };
      }

      // Get shop record
      const shop = await db.shop.findUnique({
        where: { shopDomain }
      });

      if (!shop) {
        throw new Error(`Shop not found: ${shopDomain}`);
      }

      // Create subscription record in database
      const subscription = await db.subscription.create({
        data: {
          shopId: shop.id,
          shopifySubscriptionId: appSubscription.id,
          plan,
          status: "pending",
          name: planConfig.name,
          price: planConfig.price,
          currencyCode: planConfig.currencyCode,
          confirmationUrl,
          returnUrl
        }
      });

      AppLogger.info("Subscription created successfully", {
        component: "billing.server",
        operation: "createSubscription"
      }, {
        shop: shopDomain,
        subscriptionId: subscription.id,
        shopifySubscriptionId: appSubscription.id
      });

      return {
        success: true,
        confirmationUrl,
        subscriptionId: subscription.id
      };

    } catch (error) {
      AppLogger.error("Error creating subscription", {
        component: "billing.server",
        operation: "createSubscription"
      }, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Get subscription information for a shop
   */
  static async getSubscriptionInfo(shopDomain: string): Promise<SubscriptionInfo | null> {
    try {
      const shop = await db.shop.findUnique({
        where: { shopDomain },
        include: {
          subscriptions: {
            where: {
              status: "active"
            },
            orderBy: {
              createdAt: "desc"
            },
            take: 1
          }
        }
      });

      if (!shop) {
        return null;
      }

      // Get current bundle count
      const bundleCount = await db.bundle.count({
        where: {
          shopId: shopDomain,
          status: {
            in: ["active", "draft"]
          }
        }
      });

      // If no active subscription, user is on free plan
      const activeSubscription = shop.subscriptions[0];
      const plan = activeSubscription?.plan || "free";
      const status = activeSubscription?.status || "active";
      const bundleLimit = PLANS[plan].bundleLimit;

      return {
        plan,
        status,
        bundleLimit,
        currentBundleCount: bundleCount,
        canCreateBundle: bundleCount < bundleLimit,
        isActive: status === "active"
      };

    } catch (error) {
      AppLogger.error("Error getting subscription info", {
        component: "billing.server",
        operation: "getSubscriptionInfo"
      }, error);
      return null;
    }
  }

  /**
   * Check if shop can create more bundles
   */
  static async canCreateBundle(shopDomain: string): Promise<boolean> {
    const info = await this.getSubscriptionInfo(shopDomain);
    if (!info) return false;
    return info.canCreateBundle;
  }

  /**
   * Get bundle limit for shop's current plan
   */
  static async getBundleLimit(shopDomain: string): Promise<number> {
    const info = await this.getSubscriptionInfo(shopDomain);
    if (!info) return PLANS.free.bundleLimit;
    return info.bundleLimit;
  }

  /**
   * Confirm subscription after merchant approval
   * This is called from the returnUrl callback
   *
   * IMPROVED: Now verifies subscription status with Shopify API before confirming
   */
  static async confirmSubscription(
    admin: any,
    shopDomain: string,
    shopifySubscriptionId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const shop = await db.shop.findUnique({
        where: { shopDomain }
      });

      if (!shop) {
        return { success: false, error: "Shop not found" };
      }

      // Find pending subscription
      const subscription = await db.subscription.findFirst({
        where: {
          shopId: shop.id,
          shopifySubscriptionId,
          status: "pending"
        }
      });

      if (!subscription) {
        return { success: false, error: "Subscription not found or already confirmed" };
      }

      // IMPROVEMENT: Verify subscription status with Shopify API
      const VERIFY_SUBSCRIPTION = `
        query GetAppSubscription($id: ID!) {
          node(id: $id) {
            ... on AppSubscription {
              id
              name
              status
              currentPeriodEnd
              test
            }
          }
        }
      `;

      const response = await admin.graphql(VERIFY_SUBSCRIPTION, {
        variables: {
          id: shopifySubscriptionId
        }
      });

      const data = await response.json();
      const appSubscription = data.data?.node;

      if (!appSubscription) {
        AppLogger.error("Failed to verify subscription with Shopify", {
          component: "billing.server",
          operation: "confirmSubscription"
        }, { shopifySubscriptionId });

        return { success: false, error: "Could not verify subscription with Shopify" };
      }

      // Only confirm if Shopify reports it as ACTIVE
      if (appSubscription.status !== "ACTIVE") {
        AppLogger.warn("Subscription not active in Shopify", {
          component: "billing.server",
          operation: "confirmSubscription"
        }, { shopifySubscriptionId, status: appSubscription.status });

        return { success: false, error: `Subscription status is ${appSubscription.status}, expected ACTIVE` };
      }

      // IMPROVEMENT: Store billing period information
      const currentPeriodEnd = appSubscription.currentPeriodEnd
        ? new Date(appSubscription.currentPeriodEnd)
        : null;

      // Update subscription status to active with verified data
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: currentPeriodEnd
        }
      });

      // Update shop's current subscription
      await db.shop.update({
        where: { id: shop.id },
        data: {
          currentSubscriptionId: subscription.id
        }
      });

      AppLogger.info("Subscription confirmed and verified with Shopify", {
        component: "billing.server",
        operation: "confirmSubscription"
      }, {
        shop: shopDomain,
        subscriptionId: subscription.id,
        currentPeriodEnd: currentPeriodEnd?.toISOString()
      });

      return { success: true };

    } catch (error) {
      AppLogger.error("Error confirming subscription", {
        component: "billing.server",
        operation: "confirmSubscription"
      }, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(
    admin: any,
    shopDomain: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const shop = await db.shop.findUnique({
        where: { shopDomain },
        include: {
          subscriptions: {
            where: { status: "active" },
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      });

      if (!shop || !shop.subscriptions[0]) {
        return { success: false, error: "No active subscription found" };
      }

      const subscription = shop.subscriptions[0];

      // Only cancel if it's a paid subscription
      if (subscription.plan === "free") {
        return { success: true }; // Nothing to cancel for free plan
      }

      // Cancel in Shopify
      if (subscription.shopifySubscriptionId) {
        const CANCEL_SUBSCRIPTION = `
          mutation CancelAppSubscription($id: ID!) {
            appSubscriptionCancel(id: $id) {
              appSubscription {
                id
                status
              }
              userErrors {
                field
                message
              }
            }
          }
        `;

        const response = await admin.graphql(CANCEL_SUBSCRIPTION, {
          variables: {
            id: subscription.shopifySubscriptionId
          }
        });

        const data = await response.json();

        if (data.data?.appSubscriptionCancel?.userErrors?.length > 0) {
          const errors = data.data.appSubscriptionCancel.userErrors;
          AppLogger.error("Failed to cancel subscription in Shopify", {
            component: "billing.server",
            operation: "cancelSubscription"
          }, { errors });
        }
      }

      // Update subscription status in database
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "cancelled",
          cancelledAt: new Date()
        }
      });

      // Clear shop's current subscription
      await db.shop.update({
        where: { id: shop.id },
        data: {
          currentSubscriptionId: null
        }
      });

      // Handle downgrade protection - archive excess bundles
      await this.handleDowngradeProtection(shopDomain);

      AppLogger.info("Subscription cancelled", {
        component: "billing.server",
        operation: "cancelSubscription"
      }, { shop: shopDomain, subscriptionId: subscription.id });

      return { success: true };

    } catch (error) {
      AppLogger.error("Error cancelling subscription", {
        component: "billing.server",
        operation: "cancelSubscription"
      }, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Create or get shop record
   */
  static async ensureShop(shopDomain: string, shopName?: string, email?: string) {
    try {
      const existingShop = await db.shop.findUnique({
        where: { shopDomain }
      });

      if (existingShop) {
        return existingShop;
      }

      // Create new shop with free plan subscription
      const shop = await db.shop.create({
        data: {
          shopDomain,
          name: shopName,
          email,
          subscriptions: {
            create: {
              plan: "free",
              status: "active",
              name: PLANS.free.name,
              price: 0,
              currencyCode: "USD"
            }
          }
        },
        include: {
          subscriptions: true
        }
      });

      // Set current subscription to the free plan
      await db.shop.update({
        where: { id: shop.id },
        data: {
          currentSubscriptionId: shop.subscriptions[0].id
        }
      });

      AppLogger.info("Shop created with free plan", {
        component: "billing.server",
        operation: "ensureShop"
      }, { shop: shopDomain });

      return shop;

    } catch (error) {
      AppLogger.error("Error ensuring shop", {
        component: "billing.server",
        operation: "ensureShop"
      }, error);
      throw error;
    }
  }

  /**
   * Handle downgrade protection when subscription is cancelled
   * Archives excess bundles beyond the free plan limit
   */
  static async handleDowngradeProtection(shopDomain: string): Promise<{
    archived: number;
    archivedBundleIds: string[];
  }> {
    try {
      const freeLimit = PLANS.free.bundleLimit;

      // Get all active/draft bundles ordered by creation date (oldest first to keep)
      const bundles = await db.bundle.findMany({
        where: {
          shopId: shopDomain,
          status: { in: ["active", "draft"] }
        },
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, status: true }
      });

      if (bundles.length <= freeLimit) {
        AppLogger.info("No excess bundles to archive on downgrade", {
          component: "billing.server",
          operation: "handleDowngradeProtection"
        }, { shop: shopDomain, bundleCount: bundles.length, freeLimit });

        return { archived: 0, archivedBundleIds: [] };
      }

      // Keep the oldest N bundles, archive the newest ones (most recent additions)
      const bundlesToKeep = bundles.slice(0, freeLimit);
      const bundlesToArchive = bundles.slice(freeLimit);
      const archiveIds = bundlesToArchive.map(b => b.id);

      AppLogger.info("Archiving excess bundles on downgrade", {
        component: "billing.server",
        operation: "handleDowngradeProtection"
      }, {
        shop: shopDomain,
        totalBundles: bundles.length,
        keeping: bundlesToKeep.length,
        archiving: bundlesToArchive.length,
        archivedNames: bundlesToArchive.map(b => b.name)
      });

      // Archive excess bundles
      await db.bundle.updateMany({
        where: {
          id: { in: archiveIds }
        },
        data: {
          status: "archived"
        }
      });

      AppLogger.info("Excess bundles archived successfully", {
        component: "billing.server",
        operation: "handleDowngradeProtection"
      }, {
        shop: shopDomain,
        archivedCount: archiveIds.length,
        archivedIds: archiveIds
      });

      return {
        archived: archiveIds.length,
        archivedBundleIds: archiveIds
      };

    } catch (error) {
      AppLogger.error("Error in downgrade protection", {
        component: "billing.server",
        operation: "handleDowngradeProtection"
      }, error);

      // Return empty result on error - don't fail the cancellation
      return { archived: 0, archivedBundleIds: [] };
    }
  }

  /**
   * Check if a feature is available for the shop's current plan
   */
  static async isFeatureAvailable(
    shopDomain: string,
    feature: string
  ): Promise<boolean> {
    // NOTE: Feature gating is currently DISABLED - all features available to all plans
    // To re-enable, uncomment the features below:
    const GROW_ONLY_FEATURES: string[] = [
      // "design_control_panel",
      // "advanced_discounts",
      // "priority_support",
      // "bundle_analytics",
      // "early_access"
    ];

    // If not a Grow-only feature, it's available to all
    if (!GROW_ONLY_FEATURES.includes(feature)) {
      return true;
    }

    // Check current plan
    const info = await this.getSubscriptionInfo(shopDomain);
    if (!info) return false;

    return info.plan === "grow" && info.isActive;
  }
}
