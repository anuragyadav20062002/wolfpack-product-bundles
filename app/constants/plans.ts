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
    bundleLimit: 10,
    features: [
      "Up to 10 bundles",
      "Product Page Bundles",
      "Future: Full Page Bundles",
      "Discount Support",
      "All features available",
      "Standard support",
      "Community support"
    ]
  },
  grow: {
    id: "grow",
    name: "Grow Plan (Coming Soon)",
    price: 9.99,
    currencyCode: "USD",
    interval: "EVERY_30_DAYS",
    bundleLimit: 20,
    features: [
      "Up to 20 bundles",
      "More Bundle Types",
      "Discount Support",
      "Design Control Panel",
      "Future: Bundle analytics",
      "Priority support",
      "Community support"
    ]
  }
};
