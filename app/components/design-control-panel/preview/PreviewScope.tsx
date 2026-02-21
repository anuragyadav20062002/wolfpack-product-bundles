/**
 * PreviewScope
 *
 * Wrapper component that:
 *   1. Injects the real bundle-widget-full-page.css into the document head once
 *      (the CSS uses CSS custom properties for all visual settings)
 *   2. Sets all --bundle-* CSS variables on the wrapper div as inline style,
 *      derived from the current DesignSettings via settingsToCSSVarRecord()
 *
 * Because CSS variables cascade to all descendants, any real widget HTML rendered
 * inside this wrapper will resolve its var() calls correctly, giving a pixel-accurate
 * preview without duplicating any styling logic.
 *
 * The widget CSS class names (.product-card, .step-tab, .inline-qty-btn, etc.)
 * do not overlap with Polaris class names, so no CSS scoping is needed.
 */

import { useEffect } from 'react';
import type { DesignSettings } from '../../../types/state.types';
import { settingsToCSSVarRecord } from '../../../lib/preview-css-vars';
// Vite ?raw import — bundles the CSS as a string at build time
import bundleWidgetCSS from '../../../../extensions/bundle-builder/assets/bundle-widget-full-page.css?raw';

const STYLE_ID = 'dcp-bundle-widget-css';

interface PreviewScopeProps {
  settings: DesignSettings;
  children: React.ReactNode;
}

export function PreviewScope({ settings, children }: PreviewScopeProps) {
  // Inject real widget CSS once into the document head (client-side only).
  // The style element is shared across all sub-previews and never removed.
  useEffect(() => {
    if (!document.getElementById(STYLE_ID)) {
      const el = document.createElement('style');
      el.id = STYLE_ID;
      el.textContent = bundleWidgetCSS;
      document.head.appendChild(el);
    }
  }, []);

  // Build CSS variable record from current settings
  const cssVars = settingsToCSSVarRecord(settings);

  return (
    <div
      className="bundle-widget dcp-preview-scope"
      // CSS custom properties are valid inline style values; cast needed for TS
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      style={cssVars as any}
    >
      {children}
    </div>
  );
}
