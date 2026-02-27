/**
 * Preview CSS Variables
 *
 * Converts DesignSettings into a Record of CSS custom property name → value pairs.
 * Used by PreviewScope to inject all --bundle-* variables onto the preview wrapper,
 * so real widget CSS resolves correctly inside the preview.
 *
 * Reuses generateCSSVariables / generateFullPageVariables — the same functions
 * the API endpoint uses to serve the live storefront design-settings CSS.
 */

import { generateCSSVariables, generateFullPageVariables } from './css-generators/css-variables-generator';
import type { CSSDesignSettings, CSSGenerationContext } from './css-generators/types';
import type { DesignSettings } from '../types/state.types';

export function settingsToCSSVarRecord(settings: DesignSettings): Record<string, string> {
  const globalPrimaryButton = settings.globalPrimaryButtonColor || '#000000';
  const globalButtonText    = settings.globalButtonTextColor    || '#FFFFFF';
  const globalPrimaryText   = settings.globalPrimaryTextColor   || '#000000';
  const globalSecondaryText = settings.globalSecondaryTextColor || '#6B7280';
  const globalFooterBg      = settings.globalFooterBgColor      || '#FFFFFF';
  const globalFooterText    = settings.globalFooterTextColor    || '#000000';

  const ctx: CSSGenerationContext = {
    settings: settings as CSSDesignSettings,
    globalPrimaryButton,
    globalButtonText,
    globalPrimaryText,
    globalSecondaryText,
    globalFooterBg,
    globalFooterText,
    bundleType: 'full_page',
    customCss: '',
  };

  const block = generateCSSVariables(ctx) + generateFullPageVariables(ctx);

  const record: Record<string, string> = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^\s*(--[^:]+):\s*(.+?);?\s*$/);
    if (m) {
      record[m[1].trim()] = m[2].trim();
    }
  }
  return record;
}
