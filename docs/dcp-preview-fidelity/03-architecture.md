# Architecture Decision Record: DCP Preview Fidelity

## Context

The Design Control Panel preview pane shows approximate React sketches of widget components.
The root cause is that these previews do not load the real widget CSS and do not use the
real widget DOM structure. Every `--bundle-*` CSS variable change is lost.

Critically, we already have:
- `generateCSSVariables(ctx)` + `generateFullPageVariables(ctx)` in
  `app/lib/css-generators/css-variables-generator.ts` — these produce ALL CSS variable
  declarations from `DesignSettings`. This is the same function the API uses to serve the
  live storefront CSS.
- `ComponentGenerator` in `app/assets/widgets/shared/component-generator.js` — produces the
  real HTML strings for every widget component.
- `bundle-widget-full-page.css` — the 2,999-line real CSS file already using all CSS vars.

We do NOT need to write any new variable-mapping logic. We reuse what exists.

## Constraints

- No new dependencies
- No iframe (cross-frame state sync is too complex)
- Backward-compatible `DesignSettings` type
- Must work inside Remix/Polaris admin app without leaking styles

## Options Considered

### Option A: Continue hand-crafting inline styles

Keep the current approach but wire more props correctly.

**Pros:** Simple, no architecture change
**Cons:** Permanent maintenance burden; every widget DOM change needs a parallel preview
change; CSS variables still not wired; structural mismatches remain
**Verdict:** ❌ Rejected — doesn't address root cause

### Option B: Scoped real CSS + ComponentGenerator HTML (Recommended)

1. Import `bundle-widget-full-page.css` as a raw string (`?raw` Vite import)
2. Inject it once as a `<style>` tag — no scoping needed because widget class names
   (`.product-card`, `.step-tab`, `.inline-qty-btn`, etc.) do not conflict with Polaris
3. Set all CSS variables on the preview wrapper div via inline `style` — variables cascade
   to all descendants automatically
4. Render real widget HTML via `dangerouslySetInnerHTML` using `ComponentGenerator`

**Pros:**
- Preview IS the real widget — identical CSS and HTML
- Automatically stays in sync with future widget changes (CSS is imported at build time)
- Reuses `generateCSSVariables` which is already tested and the source of truth
- Zero duplication of styling logic

**Cons:**
- `dangerouslySetInnerHTML` for some sub-components
- Need to suppress TypeScript for CSS custom property inline styles
- JS event handlers won't work (preview is display-only — this is intentional)

**Verdict:** ✅ Recommended

### Option C: iframe isolation

Full DOM isolation, no style leakage risk.

**Pros:** Perfect isolation
**Cons:** Cross-frame messaging required for real-time setting updates; complex state sync;
         overkill given Option B's natural namespace isolation
**Verdict:** ❌ Rejected

## Decision: Option B

### Architecture Overview

```
PreviewPanel.tsx
  └── <PreviewScope settings={settings}>   ← NEW wrapper
        ├── <style>…real widget CSS…</style>  ← injected once
        ├── wrapper div with inline CSS vars  ← all --bundle-* vars set here
        └── sub-preview children
              ├── ProductCardPreview   ← uses ComponentGenerator.renderProductCard()
              ├── StepBarPreview       ← uses ComponentGenerator.renderTab()
              ├── BundleHeaderPreview  ← uses ComponentGenerator.renderTab() for header tabs
              ├── BundleFooterPreview  ← uses existing layout (minor fixes)
              ├── PromoBannerPreview   ← uses real .promo-banner structure
              ├── GeneralPreview       ← uses ComponentGenerator.renderEmptyStateCards()
              └── GlobalColorsPreview  ← swatch-only preview, leave as-is
```

### New File: `app/lib/preview-css-vars.ts`

Converts `DesignSettings` → `Record<string, string>` of CSS var name→value pairs.

```typescript
import { generateCSSVariables, generateFullPageVariables } from './css-generators/css-variables-generator';
import type { DesignSettings } from '../types/state.types';

/**
 * Converts DesignSettings to a Record of CSS custom property name → value.
 * This is used to set CSS variables on the preview wrapper div via inline style,
 * so they cascade to all ComponentGenerator-produced HTML inside the preview.
 */
export function settingsToCSSVarRecord(settings: DesignSettings): Record<string, string> {
  const globalPrimaryButton = settings.globalPrimaryButtonColor || '#000000';
  const globalButtonText = settings.globalButtonTextColor || '#FFFFFF';
  const globalPrimaryText = settings.globalPrimaryTextColor || '#000000';
  const globalSecondaryText = settings.globalSecondaryTextColor || '#6B7280';
  const globalFooterBg = settings.globalFooterBgColor || '#FFFFFF';
  const globalFooterText = settings.globalFooterTextColor || '#000000';

  const ctx = {
    settings,
    globalPrimaryButton,
    globalButtonText,
    globalPrimaryText,
    globalSecondaryText,
    globalFooterBg,
    globalFooterText,
    bundleType: 'full_page',
    customCss: '',
  };

  // Both functions return a string of `--bundle-xxx: yyy;\n` declarations
  const varBlock = generateCSSVariables(ctx) + generateFullPageVariables(ctx);

  // Parse into a Record
  const record: Record<string, string> = {};
  for (const line of varBlock.split('\n')) {
    const match = line.match(/^\s*(--[^:]+):\s*(.+?);?\s*$/);
    if (match) {
      record[match[1].trim()] = match[2].trim();
    }
  }
  return record;
}
```

### New Component: `PreviewScope.tsx`

```tsx
// app/components/design-control-panel/preview/PreviewScope.tsx
import { useEffect, useRef } from 'react';
import type { DesignSettings } from '../../../types/state.types';
import { settingsToCSSVarRecord } from '../../../lib/preview-css-vars';
// Vite raw import — bundles the CSS string at build time
import bundleWidgetCSS from '../../../../extensions/bundle-builder/assets/bundle-widget-full-page.css?raw';

const STYLE_ID = 'dcp-preview-widget-css';

export function PreviewScope({ settings, children }: {
  settings: DesignSettings;
  children: React.ReactNode;
}) {
  // Inject the real widget CSS once into the document head
  useEffect(() => {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = bundleWidgetCSS;
      document.head.appendChild(style);
    }
    return () => { /* leave it — shared across all sub-previews */ };
  }, []);

  const cssVars = settingsToCSSVarRecord(settings);

  return (
    <div
      className="dcp-preview-scope"
      style={{
        ...(cssVars as React.CSSProperties),
        // Contain the preview in a sensible box
        position: 'relative',
        overflow: 'hidden',
        maxWidth: '720px',
        width: '100%',
      }}
    >
      {children}
    </div>
  );
}
```

### CSS Namespace Analysis — Why No Scoping Needed

| Widget CSS selectors | Polaris CSS selectors |
|---|---|
| `.product-card` | `.Polaris-Card` |
| `.step-tab` | `.Polaris-Tab` |
| `.inline-qty-btn` | `.Polaris-Button` |
| `.bundle-header-tab` | `.Polaris-Tabs__Tab` |
| `.modal-overlay` | `.Polaris-Modal-Dialog__Modal` |
| `.empty-state-card` | `.Polaris-EmptyState__Section` |

Zero namespace collision. The widget's class names are all unprefixed semantic names that
don't match any Polaris class. Safe to inject without scoping.

### Highlight Box Fix

**Problem:** `outline + outlineOffset` is clipped by any `overflow: hidden` ancestor.

**Fix:** Replace `HIGHLIGHT_STYLE` with a `HighlightBox` wrapper component:

```tsx
// Wraps a child and draws the dashed highlight around it
// Works even when the child is inside overflow:hidden because the
// highlight is drawn on the wrapper (which has overflow:visible)
function HighlightBox({ active, children }: { active: boolean; children: React.ReactNode }) {
  if (!active) return <>{children}</>;
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {children}
      <div style={{
        position: 'absolute',
        inset: '-4px',
        border: '2px dashed #5C6AC4',
        borderRadius: '4px',
        pointerEvents: 'none',
        zIndex: 9999,
      }} />
    </div>
  );
}
```

This overlay renders at `z-index: 9999` above the content but `pointerEvents: none` so it
doesn't interfere with interactions. The parent wrapper has `overflow: visible` so the
dashes are never clipped.

## Files to Modify / Create

| File | Change |
|------|--------|
| `app/lib/preview-css-vars.ts` | **CREATE** — `settingsToCSSVarRecord()` |
| `app/components/design-control-panel/preview/PreviewScope.tsx` | **CREATE** — scoped CSS + vars wrapper |
| `app/components/design-control-panel/preview/PreviewPanel.tsx` | Wrap sub-previews in `<PreviewScope>` |
| `app/components/design-control-panel/preview/ProductCardPreview.tsx` | Replace with `ComponentGenerator.renderProductCard()` HTML |
| `app/components/design-control-panel/preview/StepBarPreview.tsx` | Fix tabs with real `.step-tab` HTML; fix highlight |
| `app/components/design-control-panel/preview/BundleHeaderPreview.tsx` | Fix header tabs with real `.bundle-header-tab` HTML |
| `app/components/design-control-panel/preview/GeneralPreview.tsx` | Fix empty state with `ComponentGenerator.renderEmptyStateCards()` |
| `app/components/design-control-panel/preview/PromoBannerPreview.tsx` | Real `.promo-banner` HTML structure |
| `app/components/design-control-panel/preview/BundleFooterPreview.tsx` | Minor: fix progress bar CSS var refs |
| `vite.config.ts` or equivalent | Verify `?raw` imports work (default in Vite — likely already configured) |

## Data Model

No schema changes. `DesignSettings` type unchanged.

## Migration / Backward Compatibility

Zero breaking changes:
- All DCP settings saved/loaded identically
- Widget CSS is imported at build time — no runtime API calls
- Preview improvements are purely display-side

## Testing Approach

Manual:
1. Open DCP for a full-page bundle
2. Change button colour → preview button changes immediately
3. Change step circle size → step circles resize
4. Change tab active colour → tab active state updates
5. Dashed highlight boxes visible on every sub-section without clipping
6. Admin UI (Polaris components outside preview) unchanged
