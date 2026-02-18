/**
 * Widget Installation Service - Core
 *
 * Main service class that composes all widget installation functionality.
 * Provides widget installation detection and deep linking for Theme App Extensions.
 * Compliant with Shopify App Store policies - NO programmatic theme modifications.
 *
 * @see https://shopify.dev/docs/apps/build/online-store/theme-app-extensions
 */

import { AppLogger } from "../../lib/logger";
// Import types
import type {
  ThemeEditorDeepLink,
  FullPageBundleResult,
  ProductBundleWidgetStatus,
} from "./types";

// Import module functions
import {
  generateThemeEditorDeepLink,
  generateProductBundleInstallationLink,
  generateProductBundleConfigurationLink
} from "./widget-theme-editor-links.server";
import { createFullPageBundle } from "./widget-full-page-bundle.server";
import { validateProductBundleWidgetSetup } from "./widget-product-bundle.server";
/**
 * Widget Installation Service
 *
 * Static class that provides all widget installation functionality.
 * Methods are organized into categories:
 * - Deep Link Generation (Theme Editor Navigation)
 * - Full-Page Bundle Operations
 * - Product Bundle Operations
 */
export class WidgetInstallationService {

  // ==========================================================================
  // Deep Link Generation (Theme Editor Navigation)
  // ==========================================================================

  /**
   * Generate theme editor deep link with bundle ID pre-population
   */
  static generateThemeEditorDeepLink = generateThemeEditorDeepLink;

  /**
   * Generate installation link for a specific bundle on product pages
   */
  static generateProductBundleInstallationLink = generateProductBundleInstallationLink;

  /**
   * Generate configuration link for bundle on a specific product
   */
  static generateProductBundleConfigurationLink = generateProductBundleConfigurationLink;

  // ==========================================================================
  // Full-Page Bundle Operations (Production-Ready)
  // ==========================================================================

  /**
   * Create a full-page bundle with production-ready, App Store compliant flow
   */
  static createFullPageBundle = createFullPageBundle;

  // ==========================================================================
  // Product Bundle Operations (Production-Ready)
  // ==========================================================================

  /**
   * Validate product bundle widget setup and provide guidance
   */
  static validateProductBundleWidgetSetup = validateProductBundleWidgetSetup;

}
