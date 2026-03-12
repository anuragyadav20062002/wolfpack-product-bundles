/**
 * Metafield Synchronization Service
 *
 * This file re-exports from the modular metafield-sync/ directory
 * for backward compatibility. All implementations have been moved to:
 *
 * - metafield-sync/types.ts - Type definitions
 * - metafield-sync/utils/ - Utility functions
 * - metafield-sync/operations/ - Core operations
 * - metafield-sync/index.ts - Main barrel file
 *
 * Usage:
 * import { updateBundleProductMetafields } from "~/services/bundles/metafield-sync.server";
 * // or
 * import { updateBundleProductMetafields } from "~/services/bundles/metafield-sync";
 */

// Re-export types
export type {
  ComponentPricing,
  MetafieldSizeCheck,
  PriceAdjustment,
  BundleUiConfig,
  BundleUiStep,
  BundleUiPricing,
  BundleUiPricingRule,
  BundleUiMessaging,
  OptimizedBundleConfig,
  OptimizedStepConfig,
  OptimizedPricingConfig,
  ComponentParentsData
} from "./metafield-sync";

// Re-export utilities
export {
  checkMetafieldSize,
  safeJsonParse,
  METAFIELD_SIZE_WARNING,
  METAFIELD_SIZE_CRITICAL,
  METAFIELD_SIZE_LIMIT,
  calculateComponentPricing
} from "./metafield-sync";

// Re-export operations
export {
  ensureVariantBundleMetafieldDefinitions,
  ensurePageBundleIdMetafieldDefinition,
  updateBundleProductMetafields,
  updateCartTransformMetafield,
  updateComponentProductMetafields
} from "./metafield-sync";
