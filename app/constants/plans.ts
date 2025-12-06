/**
 * Subscription Plan Configurations
 *
 * Shared constants for subscription plans.
 * Can be imported by both client and server code.
 */

import type { SubscriptionPlan } from "@prisma/client";

export interface PlanConfig {
  id: SubscriptionPlan;
  name: string;
  price: number;
  currencyCode: string;
  interval: "EVERY_30_DAYS" | "ANNUAL";
  bundleLimit: number;
  features: string[];
}

export const PLANS: Record<SubscriptionPlan, PlanConfig> = {
  free: {
    id: "free",
    name: "Free Plan",
    price: 0,
    currencyCode: "USD",
    interval: "EVERY_30_DAYS",
    bundleLimit: 3,
    features: [
      "Up to 3 bundles",
      "Basic bundle builder",
      "Cart transformation",
      "Community support"
    ]
  },
  grow: {
    id: "grow",
    name: "Grow Plan",
    price: 9.99,
    currencyCode: "USD",
    interval: "EVERY_30_DAYS",
    bundleLimit: 20,
    features: [
      "Up to 20 bundles",
      "Advanced bundle builder",
      "Cart transformation",
      "Priority support",
      "Future: Advanced analytics",
      "Future: Custom styling"
    ]
  }
};
