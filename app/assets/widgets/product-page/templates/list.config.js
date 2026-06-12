/**
 * PPB List config. Legacy identifier: PDP_INPAGE + CASCADE.
 */

'use strict';

export const PPB_LIST_TEMPLATE_CONFIG = {
  id: 'LIST',
  templateType: 'PDP_INPAGE',
  legacyPresetId: 'CASCADE',
  aliases: ['LIST', 'CASCADE'],
  productCard: {
    mode: 'row',
  },
  summary: {
    mode: 'drawerRows',
  },
  discountProgress: {
    mode: 'simple',
    placement: ['footer', 'drawer'],
  },
};
