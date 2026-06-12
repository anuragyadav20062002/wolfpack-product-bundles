/**
 * Bundle Widget - Shared Components Library
 *
 * This is the barrel file that re-exports all shared modules.
 * Import from this file to get all utilities in one place.
 *
 * ============================================================================
 * ARCHITECTURE ROLE
 * ============================================================================
 * This is the SECOND file loaded in the bundle widget system:
 * 1. bundle-widget.js (loader) - Detects bundle type
 * 2. THIS FILE (components) - Provides shared utilities
 * 3. bundle-widget-{type}.js - Widget-specific implementation
 *
 * ============================================================================
 * EXPORTED MODULES
 * ============================================================================
 *
 * CONSTANTS:
 * - BUNDLE_WIDGET: Global configuration and constants
 *
 * UTILITIES:
 * - CurrencyManager: Multi-currency handling and money formatting
 * - BundleDataManager: Fetching and managing bundle data from Shopify
 * - PricingCalculator: Bundle pricing, discounts, and totals
 * - ToastManager: User notifications and feedback
 * - TemplateManager: Dynamic message templating with variables
 *
 * UI COMPONENTS:
 * - ComponentGenerator: Generates HTML for all UI elements
 *   - Product cards (with variants, quantities, pricing)
 *   - Empty state cards (placeholder UI)
 *   - Modal structure (for full-page bundles)
 *   - Progress bars (discount progress tracking)
 *   - Tabs (step navigation)
 *   - Footer components (pricing summary, CTA buttons)
 *
 * ============================================================================
 * USAGE BY WIDGETS
 * ============================================================================
 * Both product-page and full-page widgets import from this library:
 *
 * import {
 *   BUNDLE_WIDGET,
 *   CurrencyManager,
 *   BundleDataManager,
 *   PricingCalculator,
 *   ToastManager,
 *   TemplateManager,
 *   ComponentGenerator
 * } from './widgets/shared/index.js';
 *
 * ============================================================================
 * BENEFITS OF THIS ARCHITECTURE
 * ============================================================================
 * 1. NO CODE DUPLICATION: Shared code written once, used everywhere
 * 2. CONSISTENCY: Same business logic across both bundle types
 * 3. MAINTAINABILITY: Fix bugs in one place, applies to all widgets
 * 4. SMALLER FILES: Widget files only contain layout-specific code
 * 5. TESTABILITY: Can test utilities independently of widgets
 *
 * @version 4.0.0
 * @author Wolfpack Team
 */

'use strict';

// Re-export all modules
export { BUNDLE_WIDGET } from './constants.js';
export { CurrencyManager } from './currency-manager.js';
export { BundleDataManager } from './bundle-data-manager.js';
export { PricingCalculator } from './pricing-calculator.js';
export { ToastManager } from './toast-manager.js';
export { TemplateManager } from './template-manager.js';
export { ComponentGenerator } from './component-generator.js';
export { createDefaultLoadingAnimation } from './default-loading-animation.js';
export { VariantSelectorComponent } from './variant-selector.js';
export { renderDiscountProgress } from './components/discount-progress.js';
export {
  createBundleBannerElement,
  createStepBannerImageElement,
} from './components/bundle-banners.js';
export { renderQuantityControl } from './components/quantity-control.js';
export { renderSelectedProductRow } from './components/selected-product-row.js';
export { renderSelectedProductSlots } from './components/selected-product-slots.js';
export { renderSharedProductCard } from './components/product-card.js';
export { renderStepTimelineEntry } from './components/step-timeline.js';
export { createBundleState } from './engine/create-bundle-state.js';
export {
  getCurrentStep,
  getDiscountProgressData,
  getSelectedEntries,
  getSelectedProductEntries,
  getSelectedQuantity,
  getSelectedSubtotalCents,
  getTimelineEntryState,
} from './engine/bundle-selectors.js';
export {
  buildCartLineDisplayProperties,
  buildCartLineSourceProperties,
} from './engine/cart-lines.js';
export {
  buildProductPageCartFormData,
  extractBundleDetailsSourceProperties,
} from './engine/cart-submit.js';
export {
  addSelectedProduct,
  clearStepSelection,
  removeSelectedProduct,
} from './engine/bundle-actions.js';
export { shouldRenderInlineVariantSelector } from './variant-selector-policy.js';
// NOTE: ConditionValidator uses IIFE + module.exports for Jest compat.
// Import it directly: import './condition-validator.js' (it sets a global in IIFE builds).
