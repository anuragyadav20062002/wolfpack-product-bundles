/**
 * Theme Template Service
 * Handles product template management for bundle container products
 * Note: Shopify restricts programmatic theme file creation
 */

import { AppLogger } from "../lib/logger";

export class ThemeTemplateService {
  private admin: any;
  private session: any;

  constructor(admin: any, session: any) {
    this.admin = admin;
    this.session = session;
  }

  /**
   * Ensures a product template exists for the given product handle
   * Returns success status and metadata
   */
  async ensureProductTemplate(productHandle: string): Promise<{
    success: boolean;
    created: boolean;
    templatePath?: string;
    message?: string;
    error?: string;
  }> {
    try {
      AppLogger.info('Ensuring template for product', { component: 'theme-template', operation: 'ensure-template' }, { productHandle });

      // Shopify restricts programmatic theme file creation
      // Return success with theme app extension instructions
      AppLogger.info('Shopify restricts theme file creation - using Theme App Extension', { component: 'theme-template' });

      return {
        success: true,
        created: false,
        templatePath: "theme-app-extension",
        message: `Bundle functionality available via theme app extension. Add the Bundle Builder block to your product template through the theme editor.`
      };

    } catch (error) {
      AppLogger.error('Error ensuring template', { component: 'theme-template', operation: 'ensure-template' }, error);
      return {
        success: false,
        created: false,
        error: (error as Error).message || "Failed to ensure template"
      };
    }
  }

  /**
   * Check if a product template exists
   */
  async templateExists(productHandle: string): Promise<boolean> {
    try {
      // Since we use theme app extensions, templates are always "available"
      return true;
    } catch (error) {
      AppLogger.error('Error checking template existence', { component: 'theme-template', operation: 'template-exists' }, error);
      return false;
    }
  }
}
