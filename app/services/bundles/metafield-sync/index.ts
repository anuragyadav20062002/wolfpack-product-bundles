/**
 * Metafield Synchronization Service
 *
 * Modular service for handling all metafield operations for bundle products.
 * This module is organized into:
 * - types.ts - Type definitions
 * - utils/ - Utility functions (size checking, pricing calculations)
 * - operations/ - Core operations (definitions, bundle product, cart transform, component product)
 *
 * Usage:
 * import {
 *   updateBundleProductMetafields,
 *   updateCartTransformMetafield,
 *   updateComponentProductMetafields,
 *   ensureVariantBundleMetafieldDefinitions,
 *   calculateComponentPricing,
 *   safeJsonParse
 * } from "~/services/bundles/metafield-sync";
 */

// Export types
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
} from "./types";

// Export utilities
export {
  checkMetafieldSize,
  safeJsonParse,
  METAFIELD_SIZE_WARNING,
  METAFIELD_SIZE_CRITICAL,
  METAFIELD_SIZE_LIMIT
} from "./utils/size-check";

export { calculateComponentPricing } from "./utils/pricing";

// Export operations
export {
  ensureVariantBundleMetafieldDefinitions,
  ensureBundleMetafieldDefinitions
} from "./operations/definitions.server";

export { updateBundleProductMetafields } from "./operations/bundle-product.server";

export { updateCartTransformMetafield } from "./operations/cart-transform.server";

export { updateComponentProductMetafields } from "./operations/component-product.server";
