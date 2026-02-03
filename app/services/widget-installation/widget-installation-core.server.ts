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
import { WidgetInstallationFlagsService } from "../widget-installation-flags.server";

// Import types
import type {
  WidgetInstallationStatus,
  ThemeEditorDeepLink,
  FullPageBundleResult,
  ProductBundleWidgetStatus,
  BundleInstallationContext
} from "./types";

// Import module functions
import {
  generateThemeEditorDeepLink,
  generateProductBundleInstallationLink,
  generateProductBundleConfigurationLink
} from "./widget-theme-editor-links.server";
import { createFullPageBundle } from "./widget-full-page-bundle.server";
import { validateProductBundleWidgetSetup } from "./widget-product-bundle.server";
import {
  checkWidgetInstallation,
  checkFullPageWidgetInstallation,
  checkBundleInWidget
} from "./widget-installation-legacy.server";

/**
 * Widget Installation Service
 *
 * Static class that provides all widget installation functionality.
 * Methods are organized into categories:
 * - Widget Detection Methods (Read-Only)
 * - Deep Link Generation (Theme Editor Navigation)
 * - Full-Page Bundle Operations
 * - Product Bundle Operations
 * - Utility Methods
 * - Legacy Methods (Deprecated)
 */
export class WidgetInstallationService {

  // ==========================================================================
  // Widget Detection Methods (Read-Only)
  // ==========================================================================

  /**
   * @deprecated Use WidgetInstallationFlagsService.isWidgetInstalled() instead
   */
  static checkWidgetInstallation = checkWidgetInstallation;

  /**
   * @deprecated Use WidgetInstallationFlagsService.isWidgetInstalled() instead
   */
  static checkFullPageWidgetInstallation = checkFullPageWidgetInstallation;

  /**
   * Get smart installation context for a specific bundle
   *
   * Returns contextual information about what action the merchant should take.
   * For FULL-PAGE bundles: checks page templates
   * For PRODUCT-PAGE bundles: checks product templates
   *
   * @param admin - Shopify admin API client
   * @param shop - Shop domain
   * @param bundleId - Bundle ID
   * @param bundleType - Bundle type (full_page or product_page)
   * @param apiKey - App API key for specific app block detection
   * @param bundlePageHandle - Page handle to check if bundle is placed
   * @returns Installation context with recommended action
   */
  static async getBundleInstallationContext(
    admin: any,
    shop: string,
    bundleId: string,
    bundleType?: 'full_page' | 'product_page',
    apiKey?: string,
    bundlePageHandle?: string | null
  ): Promise<BundleInstallationContext> {
    try {
      // For full-page bundles, check metafield flags
      if (bundleType === 'full_page') {
        const widgetInstalled = await WidgetInstallationFlagsService.isWidgetInstalled(
          admin,
          shop,
          'full_page'
        );

        if (!widgetInstalled) {
          return {
            widgetInstalled: false,
            bundleConfigured: false,
            recommendedAction: 'install_widget'
          };
        }

        // For full-page bundles, check if shopifyPageHandle is set
        const bundleConfigured = !!(bundlePageHandle && bundlePageHandle.trim() !== '');

        if (bundleConfigured) {
          return {
            widgetInstalled: true,
            bundleConfigured: true,
            recommendedAction: 'configured'
          };
        } else {
          return {
            widgetInstalled: true,
            bundleConfigured: false,
            recommendedAction: 'add_bundle'
          };
        }
      }

      // For product-page bundles, check metafield flags
      const widgetInstalled = await WidgetInstallationFlagsService.isWidgetInstalled(
        admin,
        shop,
        'product_page'
      );

      if (!widgetInstalled) {
        return {
          widgetInstalled: false,
          bundleConfigured: false,
          recommendedAction: 'install_widget'
        };
      }

      // Widget is installed - always return 'configured' for PDP bundles
      // The widget installation is the key requirement
      return {
        widgetInstalled: true,
        bundleConfigured: true,
        recommendedAction: 'configured'
      };

    } catch (error) {
      AppLogger.error('Failed to get bundle installation context', {
        component: 'WidgetInstallationService',
        shop,
        bundleId
      }, error);

      return {
        widgetInstalled: false,
        bundleConfigured: false,
        recommendedAction: 'install_widget'
      };
    }
  }

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

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Check if widget needs installation prompt
   *
   * Returns true if widget is not installed or check is stale.
   *
   * @param status - Widget installation status
   * @param maxAgeMinutes - Maximum age in minutes before status is considered stale
   * @returns Whether to show installation prompt
   */
  static shouldShowInstallationPrompt(
    status: WidgetInstallationStatus | null,
    maxAgeMinutes: number = 60
  ): boolean {
    if (!status) return true;
    if (!status.installed) return true;

    // Check if status is stale
    const now = new Date();
    const checkAge = now.getTime() - status.lastChecked.getTime();
    const maxAgeMs = maxAgeMinutes * 60 * 1000;

    return checkAge > maxAgeMs;
  }

  // ==========================================================================
  // Legacy Methods (Deprecated)
  // ==========================================================================

  /**
   * @deprecated Use database records (shopifyPageHandle field) instead
   */
  static checkBundleInWidget = checkBundleInWidget;
}
