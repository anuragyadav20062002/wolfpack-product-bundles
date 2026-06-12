/**
 * PPB Grid config. Legacy identifier: PDP_INPAGE + COGNIVE.
 */

'use strict';

export const PPB_GRID_TEMPLATE_CONFIG = {
  id: 'GRID',
  templateType: 'PDP_INPAGE',
  legacyPresetId: 'COGNIVE',
  aliases: ['GRID', 'COGNIVE'],
  productCard: {
    mode: 'grid',
  },
  summary: {
    mode: 'drawer',
  },
  discountProgress: {
    mode: 'simple',
    placement: ['footer', 'drawer'],
  },
};
