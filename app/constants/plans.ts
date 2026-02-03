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
      "Full Page Bundles",
      "Basic discount rules",
      "Standard support",
      "Community access"
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
      "All bundle types included",
      "Advanced discount rules",
      "Design Control Panel",
      "Bundle analytics (coming soon)",
      "Priority support",
      "Early access to new features"
    ]
  }
};

// Features exclusive to Grow plan (for feature gating)
// NOTE: Feature gating is currently DISABLED - all features available to all plans
// To re-enable, uncomment the features below:
export const GROW_ONLY_FEATURES = [
  // "design_control_panel",
  // "advanced_discounts",
  // "priority_support",
  // "bundle_analytics",
  // "early_access"
] as const;

export type GrowOnlyFeature = typeof GROW_ONLY_FEATURES[number];
