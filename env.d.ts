/// <reference types="vite/client" />
/// <reference types="@remix-run/node" />

/**
 * Environment Variables Type Definitions
 *
 * This file provides TypeScript type safety for environment variables
 * used throughout the application.
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Database Configuration
      /** PostgreSQL or SQLite database connection URL */
      DATABASE_URL: string;
      /** Direct database connection URL (for migrations) */
      DIRECT_URL?: string;

      // Server Configuration
      /** Node environment (development, production, test) */
      NODE_ENV: 'development' | 'production' | 'test';
      /** Server host address (default: 0.0.0.0) */
      HOST?: string;
      /** Server port number */
      PORT?: string;
      /** Frontend development server port */
      FRONTEND_PORT?: string;

      // Shopify App Configuration
      /** Shopify App API Key (Client ID) */
      SHOPIFY_API_KEY: string;
      /** Shopify App API Secret (Client Secret) */
      SHOPIFY_API_SECRET: string;
      /** Public URL where the app is hosted */
      SHOPIFY_APP_URL: string;
      /** OAuth scopes required by the app (comma-separated) */
      SCOPES: string;
      /** Custom domain for the shop (if applicable) */
      SHOP_CUSTOM_DOMAIN?: string;

      // Shopify Extension IDs
      /** Bundle Builder theme app extension ID */
      SHOPIFY_BUNDLE_BUILDER_ID?: string;
      /** Bundle Discount Function extension ID (deprecated) */
      SHOPIFY_BUNDLE_DISCOUNT_FUNCTION_ID?: string;
      /** Bundle Cart Transform TypeScript function ID */
      SHOPIFY_BUNDLE_CART_TRANSFORM_TS_ID?: string;

      // Application Features
      /** Enable/disable application logging (default: true) */
      APP_LOGGING_ENABLED?: string;
    }
  }
}

// Export empty object to make this a module
export {};