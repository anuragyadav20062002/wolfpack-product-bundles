/**
 * Pricing Tier Configuration Types
 *
 * Used by the admin UI (PricingTiersSection) and stored in Bundle.tierConfig.
 * The widget maps linkedBundleId → bundleId before rendering pills.
 */

export interface TierConfigEntry {
  label: string;
  linkedBundleId: string;
}

export type TierConfig = TierConfigEntry[];
