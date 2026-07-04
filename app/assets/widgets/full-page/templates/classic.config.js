/**
 * FPB Classic template config.
 *
 * The existing CLASSIC preset stays on legacy rendering until the template
 * migration replaces the installer with config-driven renderers.
 */

'use strict';

export const FPB_CLASSIC_TEMPLATE_CONFIG = {
  id: 'CLASSIC',
  presetId: 'CLASSIC',
  aliases: ['CLASSIC'],
  productCard: {
    mode: 'grid',
    columns: {
      desktop: 4,
      mobile: 2,
    },
    ctaMode: 'iconOrText',
  },
  summary: {
    mode: 'slots',
    emptyState: 'slotGrid',
  },
  discountProgress: {
    mode: 'stepped',
    placement: ['sidebar', 'mobileTray'],
  },
  timeline: {
    mode: 'standard',
  },
};
