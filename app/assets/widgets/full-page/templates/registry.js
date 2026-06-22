/**
 * Full-page template registry.
 *
 * Resolves full-page preset identifiers to the four FPB target
 * templates while current installer files are still being retired.
 */

'use strict';

import { FPB_STANDARD_TEMPLATE_CONFIG } from './standard.config.js';
import { FPB_CLASSIC_TEMPLATE_CONFIG } from './classic.config.js';
import { FPB_COMPACT_TEMPLATE_CONFIG } from './compact.config.js';
import { FPB_HORIZONTAL_TEMPLATE_CONFIG } from './horizontal.config.js';

export const FPB_TEMPLATE_CONFIGS = {
  STANDARD: FPB_STANDARD_TEMPLATE_CONFIG,
  CLASSIC: FPB_CLASSIC_TEMPLATE_CONFIG,
  COMPACT: FPB_COMPACT_TEMPLATE_CONFIG,
  HORIZONTAL: FPB_HORIZONTAL_TEMPLATE_CONFIG,
};

export function resolveFullPageTemplateConfig({ presetId = '', templateId = '' } = {}) {
  const rawPreset = String(presetId || templateId || 'STANDARD').toUpperCase();

  return Object.values(FPB_TEMPLATE_CONFIGS).find((config) =>
    config.id === rawPreset
    || config.presetId === rawPreset
    || config.aliases?.includes(rawPreset)
  ) || FPB_TEMPLATE_CONFIGS.STANDARD;
}
