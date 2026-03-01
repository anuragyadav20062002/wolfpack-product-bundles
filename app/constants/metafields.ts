/**
 * Metafield Constants
 *
 * Centralized namespace and key constants for Shopify metafields.
 * Import these instead of using hardcoded strings across services.
 */

export const METAFIELD_NAMESPACE = "$app" as const;

export const METAFIELD_KEYS = {
  COMPONENT_REFERENCE: "component_reference",
  COMPONENT_QUANTITIES: "component_quantities",
  COMPONENT_PARENTS: "component_parents",
  COMPONENT_PRICING: "component_pricing",
  BUNDLE_UI_CONFIG: "bundle_ui_config",
  ALL_BUNDLES: "all_bundles",
  BUNDLE_INDEX: "bundleIndex",
  BUNDLE_CONFIG: "bundleConfig",
} as const;
