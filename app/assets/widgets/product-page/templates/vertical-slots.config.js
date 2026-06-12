/**
 * PPB Vertical Slots config. Legacy identifier: PDP_MODAL + SIMPLIFIED or
 * PDP_MODAL with renderFilledSlotsAsHorizontalStacked set false.
 */

'use strict';

export const PPB_VERTICAL_SLOTS_TEMPLATE_CONFIG = {
  id: 'VERTICAL_SLOTS',
  templateType: 'PDP_MODAL',
  legacyPresetId: 'SIMPLIFIED',
  aliases: ['VERTICAL_SLOTS', 'SIMPLIFIED'],
  slots: {
    orientation: 'vertical',
  },
  summary: {
    mode: 'verticalSlots',
  },
  discountProgress: {
    mode: 'simple',
    placement: ['bottomSheet', 'modal'],
  },
};
