import { FPB_COMPACT_TEMPLATE_CONFIG } from './compact.config.js';

export const compactTemplateMethods = {
  ensureCompactPresetRuntimeStyles() {
    return this.getFullPageDesignPreset() === FPB_COMPACT_TEMPLATE_CONFIG.presetId;
  },
};
