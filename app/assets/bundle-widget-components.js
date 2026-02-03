/**
 * Bundle Widget - Shared Components Library (Re-export Wrapper)
 *
 * This file re-exports all shared modules from the modular structure.
 * It maintains backward compatibility while using the new organized codebase.
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
 * MODULAR STRUCTURE
 * ============================================================================
 * The actual implementations are now in:
 * - widgets/shared/constants.js - BUNDLE_WIDGET configuration
 * - widgets/shared/currency-manager.js - Currency handling
 * - widgets/shared/bundle-data-manager.js - Bundle data utilities
 * - widgets/shared/pricing-calculator.js - Pricing calculations
 * - widgets/shared/toast-manager.js - Toast notifications
 * - widgets/shared/template-manager.js - Template variable replacement
 * - widgets/shared/component-generator.js - HTML component generation
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
 * } from './bundle-widget-components.js';
 *
 * @version 4.0.0
 * @author Wolfpack Team
 */

'use strict';

// Re-export all modules from the modular structure
export { BUNDLE_WIDGET } from './widgets/shared/constants.js';
export { CurrencyManager } from './widgets/shared/currency-manager.js';
export { BundleDataManager } from './widgets/shared/bundle-data-manager.js';
export { PricingCalculator } from './widgets/shared/pricing-calculator.js';
export { ToastManager } from './widgets/shared/toast-manager.js';
export { TemplateManager } from './widgets/shared/template-manager.js';
export { ComponentGenerator } from './widgets/shared/component-generator.js';
