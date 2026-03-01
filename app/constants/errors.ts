/**
 * Error Message Constants
 *
 * Centralized error messages used across bundle configuration routes and handlers.
 * Import these instead of using inline string literals.
 */

export const ERROR_MESSAGES = {
  BUNDLE_NOT_FOUND: "Bundle not found",
  FAILED_TO_SAVE: "Failed to save changes",
  FAILED_TO_SELECT_PRODUCTS: "Failed to select products",
  FAILED_TO_SYNC_PRODUCT: "Failed to sync product",
  FAILED_TO_SELECT_BUNDLE_PRODUCT: "Failed to select bundle product",
  CANNOT_DELETE_LAST_STEP: "Cannot delete the last step",
  FAILED_TO_SELECT_COLLECTIONS: "Failed to select collections",
  FAILED_TO_SAVE_CONFIGURATION: "Failed to save bundle configuration",
  AUTH_REQUIRED: "Authentication required",
  BUNDLE_ID_REQUIRED: "Bundle ID is required",
  UNKNOWN_ACTION: "Unknown action",
  SHOP_NOT_FOUND: "Shop not found",
} as const;
