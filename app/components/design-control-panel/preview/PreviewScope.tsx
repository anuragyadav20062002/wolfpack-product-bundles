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

import { useLayoutEffect } from 'react';
import type { DesignSettings } from '../../../types/state.types';
import { settingsToCSSVarRecord } from '../../../lib/preview-css-vars';
// Vite ?raw imports — bundle both CSS files as strings at build time.
// bundle-widget-full-page.css contains layout/structural styles.
// bundle-widget.css contains component styles: .bundle-header-tab, .empty-state-card, etc.
import bundleWidgetFullPageCSS from '../../../../extensions/bundle-builder/assets/bundle-widget-full-page.css?raw';
import bundleWidgetCSS from '../../../../extensions/bundle-builder/assets/bundle-widget.css?raw';

const STYLE_ID = 'dcp-bundle-widget-css';
const STYLE_ID_WIDGET = 'dcp-bundle-widget-component-css';

interface PreviewScopeProps {
  settings: DesignSettings;
  children: React.ReactNode;
}

export function PreviewScope({ settings, children }: PreviewScopeProps) {
  // Inject real widget CSS once into the document head (client-side only).
  // The style elements are shared across all sub-previews and never removed.
  // Both CSS files are needed: full-page has layout styles; bundle-widget.css has
  // component class styles (.bundle-header-tab, .empty-state-card, etc.).
  // useLayoutEffect fires synchronously after DOM mutation but before the browser paints,
  // preventing a flash of unstyled content (FOUC) on first render.
  useLayoutEffect(() => {
    if (!document.getElementById(STYLE_ID)) {
      const el = document.createElement('style');
      el.id = STYLE_ID;
      el.textContent = bundleWidgetFullPageCSS;
      document.head.appendChild(el);
    }
    if (!document.getElementById(STYLE_ID_WIDGET)) {
      const el = document.createElement('style');
      el.id = STYLE_ID_WIDGET;
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
