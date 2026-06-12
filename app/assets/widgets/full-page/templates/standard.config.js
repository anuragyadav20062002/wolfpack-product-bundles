/**
 * FPB Standard template config.
 *
 * This is the migration contract for the existing DEFAULT/STANDARD preset.
 * Renderers still use legacy paths until the Standard migration completes.
 */

'use strict';

export const FPB_STANDARD_TEMPLATE_CONFIG = {
  id: 'STANDARD',
  presetId: 'DEFAULT',
  aliases: ['DEFAULT', 'STANDARD', 'DEFAULT_FBP'],
  productCard: {
    mode: 'grid',
    columns: {
      desktop: 3,
      mobile: 2,
    },
    ctaMode: 'icon',
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
    mode: 'standard',
  },
};
