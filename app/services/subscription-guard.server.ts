/**
 * Subscription Guard Middleware
 *
 * Provides middleware and utility functions for enforcing subscription limits
 * and checking feature access based on subscription plan.
 */

import { json } from "@remix-run/node";
import { BillingService } from "./billing.server";
import { PLANS } from "../constants/plans";
import { AppLogger } from "../lib/logger";
import type { SubscriptionPlan } from "@prisma/client";

export interface SubscriptionGuardResult {
  allowed: boolean;
  plan: SubscriptionPlan;
  bundleLimit: number;
  currentBundleCount: number;
  reason?: string;
  upgradeRequired?: boolean;
}

export class SubscriptionGuard {
  /**
   * Check if shop can create a new bundle
   * Returns guard result with details
   */
  static async checkBundleCreation(shopDomain: string): Promise<SubscriptionGuardResult> {
    try {
      const info = await BillingService.getSubscriptionInfo(shopDomain);

      if (!info) {
        AppLogger.error("Could not get subscription info", {
          component: "subscription-guard",
          operation: "checkBundleCreation"
        }, { shop: shopDomain });

        return {
          allowed: false,
          plan: "free",
          bundleLimit: PLANS.free.bundleLimit,
          currentBundleCount: 0,
          reason: "Could not verify subscription status"
        };
      }

      const canCreate = info.canCreateBundle;

      if (!canCreate) {
        return {
          allowed: false,
          plan: info.plan,
          bundleLimit: info.bundleLimit,
          currentBundleCount: info.currentBundleCount,
          reason: `Bundle limit reached. You have ${info.currentBundleCount} of ${info.bundleLimit} bundles.`,
          upgradeRequired: info.plan === "free"
        };
      }

      return {
        allowed: true,
        plan: info.plan,
        bundleLimit: info.bundleLimit,
        currentBundleCount: info.currentBundleCount
      };

    } catch (error) {
      AppLogger.error("Error in subscription guard", {
        component: "subscription-guard",
        operation: "checkBundleCreation"
      }, error);

      return {
        allowed: false,
        plan: "free",
        bundleLimit: PLANS.free.bundleLimit,
        currentBundleCount: 0,
        reason: "Error checking subscription"
      };
    }
  }

  /**
   * Enforce bundle creation limit
   * Use this in bundle creation routes/actions
   *
   * Returns Response with 403 if limit reached
   * Returns null if allowed (continue with bundle creation)
   */
  static async enforceBundleLimit(shopDomain: string): Promise<Response | null> {
    const guard = await this.checkBundleCreation(shopDomain);

    if (!guard.allowed) {
      AppLogger.warn("Bundle creation blocked by subscription limit", {
        component: "subscription-guard",
        operation: "enforceBundleLimit"
      }, {
        shop: shopDomain,
        plan: guard.plan,
        currentCount: guard.currentBundleCount,
        limit: guard.bundleLimit
      });

      return json(
        {
          error: guard.reason,
          plan: guard.plan,
          bundleLimit: guard.bundleLimit,
          currentBundleCount: guard.currentBundleCount,
          upgradeRequired: guard.upgradeRequired
        },
        { status: 403 }
      );
    }

    return null;
  }

  /**
   * Get feature access for a shop
   * Returns which features are available based on subscription plan
   */
  static async getFeatureAccess(shopDomain: string) {
    const info = await BillingService.getSubscriptionInfo(shopDomain);

    if (!info) {
      return {
        plan: "free",
        features: PLANS.free.features,
        bundleLimit: PLANS.free.bundleLimit
      };
    }

    return {
      plan: info.plan,
      features: PLANS[info.plan].features,
      bundleLimit: info.bundleLimit
    };
  }

  /**
   * Check if shop has active paid subscription
   */
  static async hasPaidPlan(shopDomain: string): Promise<boolean> {
    const info = await BillingService.getSubscriptionInfo(shopDomain);
    return info?.plan === "grow" && info?.isActive;
  }

  /**
   * Check if shop is on free plan
   */
  static async isFreePlan(shopDomain: string): Promise<boolean> {
    const info = await BillingService.getSubscriptionInfo(shopDomain);
    return info?.plan === "free";
  }
}
