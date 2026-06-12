import { FPB_CLASSIC_TEMPLATE_CONFIG } from './classic.config.js';

export const classicTemplateMethods = {
  ensureClassicPresetRuntimeStyles() {
    return this.getFullPageDesignPreset() === FPB_CLASSIC_TEMPLATE_CONFIG.presetId;
  },
};
