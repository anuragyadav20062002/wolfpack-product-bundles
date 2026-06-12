/**
 * Product-page template registry.
 *
 * Normalizes legacy EB-compatible identifiers to the four PPB target templates.
 */

'use strict';

import { PPB_GRID_TEMPLATE_CONFIG } from './grid.config.js';
import { PPB_LIST_TEMPLATE_CONFIG } from './list.config.js';
import { PPB_HORIZONTAL_SLOTS_TEMPLATE_CONFIG } from './horizontal-slots.config.js';
import { PPB_VERTICAL_SLOTS_TEMPLATE_CONFIG } from './vertical-slots.config.js';

export const PPB_TEMPLATE_CONFIGS = {
  GRID: PPB_GRID_TEMPLATE_CONFIG,
  LIST: PPB_LIST_TEMPLATE_CONFIG,
  HORIZONTAL_SLOTS: PPB_HORIZONTAL_SLOTS_TEMPLATE_CONFIG,
  VERTICAL_SLOTS: PPB_VERTICAL_SLOTS_TEMPLATE_CONFIG,
};

export function resolveProductPageTemplateConfig({
  templateType = '',
  designPreset = '',
  renderFilledSlotsAsHorizontalStacked,
} = {}) {
  if (templateType === 'PDP_INPAGE') {
    if (designPreset === 'COGNIVE') return PPB_TEMPLATE_CONFIGS.GRID;
    if (designPreset === 'CASCADE') return PPB_TEMPLATE_CONFIGS.LIST;
  }

  if (templateType === 'PDP_MODAL') {
    if (typeof renderFilledSlotsAsHorizontalStacked === 'boolean') {
      return renderFilledSlotsAsHorizontalStacked
        ? PPB_TEMPLATE_CONFIGS.HORIZONTAL_SLOTS
        : PPB_TEMPLATE_CONFIGS.VERTICAL_SLOTS;
    }

    return designPreset === 'SIMPLIFIED'
      ? PPB_TEMPLATE_CONFIGS.VERTICAL_SLOTS
      : PPB_TEMPLATE_CONFIGS.HORIZONTAL_SLOTS;
  }

  return null;
}
