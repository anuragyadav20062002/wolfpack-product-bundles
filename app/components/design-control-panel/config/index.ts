/**
 * Design Control Panel Configuration
 *
 * Exports default settings, merge utilities, and related types.
 */

// Default settings for both bundle types
export {
  PRODUCT_PAGE_DEFAULTS,
  FULL_PAGE_DEFAULTS,
  DEFAULT_SETTINGS,
  getDefaultSettings,
  type BundleType,
} from "./defaultSettings";

// Settings merge utilities
export { mergeSettings, createMergedSettings } from "./mergeSettings";
