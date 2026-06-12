/**
 * FPB Horizontal template config.
 *
 * This maps the existing HORIZONTAL preset to shared row primitives before the
 * runtime CSS installer is replaced.
 */

'use strict';

export const FPB_HORIZONTAL_TEMPLATE_CONFIG = {
  id: 'HORIZONTAL',
  presetId: 'HORIZONTAL',
  aliases: ['HORIZONTAL'],
  productCard: {
    mode: 'row',
    columns: {
      desktop: 1,
      mobile: 1,
    },
    ctaMode: 'iconOrText',
  },
  summary: {
    mode: 'rows',
    emptyState: 'skeletonRows',
  },
  discountProgress: {
    mode: 'stepped',
    placement: ['sidebar', 'mobileTray'],
  },
  timeline: {
    mode: 'horizontal',
  },
};
