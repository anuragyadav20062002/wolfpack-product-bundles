import { FPB_HORIZONTAL_TEMPLATE_CONFIG } from './horizontal.config.js';

export const horizontalTemplateMethods = {
  ensureHorizontalSidePanelSlotRuntimeStyles() {
    return this.getFullPageDesignPreset() === FPB_HORIZONTAL_TEMPLATE_CONFIG.presetId;
  },
};
