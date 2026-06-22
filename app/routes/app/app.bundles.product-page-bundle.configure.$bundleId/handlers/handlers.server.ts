/**
 * Action Handlers for Product Page Bundle Configuration
 *
 * Compatibility barrel for route-adjacent server handlers.
 */

export {
  safeJsonParse,
  handleUpdateBundleStatus,
  handleUpdateBundleProduct,
  handleGetPages,
  handleGetThemeTemplates,
  handleGetCurrentTheme,
  handleEnsureBundleTemplates,
} from "../../../../services/bundles/bundle-configure-handlers.server";

export { handleSaveBundle } from "./save-bundle.server";
export { handleSyncProduct } from "./sync-product.server";
export { handleSyncBundle } from "./sync-bundle.server";
export { handleUpdateBundleDesignTemplate } from "./design-template.server";
export { handleValidateSellingPlanGroups } from "./subscriptions.server";
export {
  handleAssignProductTemplate,
  handleValidateWidgetPlacement,
} from "./widget-placement.server";
