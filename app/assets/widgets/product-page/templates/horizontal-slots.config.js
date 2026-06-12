/**
 * PPB Horizontal Slots config. Legacy identifier: PDP_MODAL horizontal branch.
 */

'use strict';

export const PPB_HORIZONTAL_SLOTS_TEMPLATE_CONFIG = {
  id: 'HORIZONTAL_SLOTS',
  templateType: 'PDP_MODAL',
  legacyPresetId: 'MODAL',
  aliases: ['HORIZONTAL_SLOTS', 'MODAL'],
  slots: {
    orientation: 'horizontal',
  },
  summary: {
    mode: 'slots',
  },
  discountProgress: {
    mode: 'simple',
    placement: ['bottomSheet', 'modal'],
  },
};
