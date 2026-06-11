/**
 * FPB Compact template config.
 *
 * This maps the existing COMPACT preset to shared primitives before the
 * runtime CSS installer is replaced.
 */

'use strict';

export const FPB_COMPACT_TEMPLATE_CONFIG = {
  id: 'COMPACT',
  presetId: 'COMPACT',
  aliases: ['COMPACT'],
  productCard: {
    mode: 'compact',
    columns: {
      desktop: 3,
      mobile: 2,
    },
    ctaMode: 'iconOrText',
  },
  summary: {
    mode: 'compactSlots',
    emptyState: 'slotGrid',
  },
  discountProgress: {
    mode: 'stepped',
    placement: ['sidebar', 'mobileTray'],
  },
  timeline: {
    mode: 'compact',
  },
};
