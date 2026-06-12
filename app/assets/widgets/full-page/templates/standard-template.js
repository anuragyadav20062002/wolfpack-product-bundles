import { FPB_STANDARD_TEMPLATE_CONFIG } from './standard.config.js';

export const standardTemplateMethods = {
  ensureStandardPresetRuntimeStyles() {
    return this.getFullPageDesignPreset() === FPB_STANDARD_TEMPLATE_CONFIG.presetId;
  },
};
