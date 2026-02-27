# SDE Implementation Plan: DCP Preview Fidelity

## Overview

Replace the hand-crafted inline-style preview components with real widget CSS + real
`ComponentGenerator` HTML, wired to `DesignSettings` via the existing
`generateCSSVariables` / `generateFullPageVariables` functions.

**Files to create:**
- `app/lib/preview-css-vars.ts`
- `app/components/design-control-panel/preview/PreviewScope.tsx`

**Files to modify:**
- `app/components/design-control-panel/preview/PreviewPanel.tsx`
- `app/components/design-control-panel/preview/ProductCardPreview.tsx`
- `app/components/design-control-panel/preview/StepBarPreview.tsx`
- `app/components/design-control-panel/preview/BundleHeaderPreview.tsx`
- `app/components/design-control-panel/preview/GeneralPreview.tsx`
- `app/components/design-control-panel/preview/PromoBannerPreview.tsx`

**Files unchanged:**
- `BundleFooterPreview.tsx` — minor CSS var ref fix only (no structural rewrite)
- `GlobalColorsPreview.tsx` — swatch palette, intentionally simplified
- `app/types/state.types.ts` — no type changes
- `vite.config.ts` — `?raw` imports work without fs.allow changes

---

## Phase 1: `settingsToCSSVarRecord` utility

**File:** `app/lib/preview-css-vars.ts`

Create a function that converts `DesignSettings` to a `Record<string, string>` of CSS
variable name → value pairs by reusing `generateCSSVariables` + `generateFullPageVariables`.

```typescript
import { generateCSSVariables, generateFullPageVariables } from './css-generators/css-variables-generator';
import type { DesignSettings } from '../types/state.types';

export function settingsToCSSVarRecord(settings: DesignSettings): Record<string, string> {
  const g = {
    globalPrimaryButton: settings.globalPrimaryButtonColor || '#000000',
    globalButtonText:    settings.globalButtonTextColor    || '#FFFFFF',
    globalPrimaryText:   settings.globalPrimaryTextColor   || '#000000',
    globalSecondaryText: settings.globalSecondaryTextColor || '#6B7280',
    globalFooterBg:      settings.globalFooterBgColor      || '#FFFFFF',
    globalFooterText:    settings.globalFooterTextColor    || '#000000',
  };
  const ctx = { settings, ...g, bundleType: 'full_page', customCss: '' };
  const block = generateCSSVariables(ctx) + generateFullPageVariables(ctx);
  const record: Record<string, string> = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^\s*(--[^:]+):\s*(.+?);?\s*$/);
    if (m) record[m[1].trim()] = m[2].trim();
  }
  return record;
}
```

---

## Phase 2: `PreviewScope` wrapper component

**File:** `app/components/design-control-panel/preview/PreviewScope.tsx`

Injects the real widget CSS (once, via `useEffect`) and applies all CSS variables on the
wrapper div so they cascade to all child HTML.

```tsx
import { useEffect } from 'react';
import type { DesignSettings } from '../../../types/state.types';
import { settingsToCSSVarRecord } from '../../../lib/preview-css-vars';
import bundleWidgetCSS from '../../../../extensions/bundle-builder/assets/bundle-widget-full-page.css?raw';

const STYLE_ID = 'dcp-bundle-widget-css';

export function PreviewScope({
  settings,
  children,
}: {
  settings: DesignSettings;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!document.getElementById(STYLE_ID)) {
      const el = document.createElement('style');
      el.id = STYLE_ID;
      el.textContent = bundleWidgetCSS;
      document.head.appendChild(el);
    }
  }, []);

  const cssVars = settingsToCSSVarRecord(settings);

  return (
    <div
      className="bundle-widget dcp-preview-scope"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      style={cssVars as any}
    >
      {children}
    </div>
  );
}
```

Note: the `bundle-widget` class triggers the widget CSS's top-level scope rules.

---

## Phase 3: `PreviewPanel.tsx` — wrap sub-previews

Import `PreviewScope` and wrap the rendered sub-preview in it. The `settings` prop is
already available in `PreviewPanel`. Only wrap the previews that render real widget HTML
(ProductCard, StepBar, Header — not GlobalColors which is intentionally schematic).

```tsx
// Add to imports
import { PreviewScope } from './PreviewScope';

// In the render, wrap the sub-preview:
<PreviewScope settings={settings}>
  {/* sub-preview content */}
</PreviewScope>
```

Check: `PreviewPanel` already receives `settings: DesignSettings` — confirm and use it.

---

## Phase 4: `ProductCardPreview.tsx` — real HTML

Replace the hand-coded card React JSX with `ComponentGenerator.renderProductCard()` HTML
plus a selected-state version side-by-side.

**Approach:** Import ComponentGenerator (ES module from `app/assets/widgets/shared/`).
Use `dangerouslySetInnerHTML`. If module resolution fails at build time, inline the HTML
template string directly (matching ComponentGenerator output exactly).

```tsx
import { ComponentGenerator } from '../../../assets/widgets/shared/component-generator.js';

const DUMMY_PRODUCT = {
  id: 'preview-product',
  title: 'Sample Product',
  imageUrl: 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png',
  price: 2999,  // in cents — displayed via CurrencyManager
  variants: [],
};
const DUMMY_CURRENCY = { display: { format: '${{amount}}' } };

// Unselected card:
const unselectedHTML = ComponentGenerator.renderProductCard(DUMMY_PRODUCT, 0, DUMMY_CURRENCY);
// Selected card:
const selectedHTML = ComponentGenerator.renderProductCard(DUMMY_PRODUCT, 2, DUMMY_CURRENCY);
```

**Note on CurrencyManager:** `ComponentGenerator.renderProductCard` calls
`CurrencyManager.formatMoney(price, format)`. To avoid any import issues, check if
`CurrencyManager` is exported separately. If bundling fails, just inline the HTML string
that matches ComponentGenerator output (class names must match exactly).

**Layout:** Show two cards side-by-side: unselected | selected. Add `<HighlightBox>` around
when `activeSubSection === "productCard"`.

Also show the modal preview for `activeSubSection === "productCardContent"` using
`ComponentGenerator.createModalHTML()` rendered via `dangerouslySetInnerHTML`.

---

## Phase 5: `StepBarPreview.tsx` — real step tab HTML

Replace the tabs section (`activeSubSection === "stepBarTabs"`) with real `.step-tab` HTML
using `ComponentGenerator.renderTab()`.

```javascript
const tab1 = ComponentGenerator.renderTab(
  { name: 'Shoes' }, 0, true,  false, false  // active, not completed, not locked
);
const tab2 = ComponentGenerator.renderTab(
  { name: 'Laces' }, 1, false, true,  false  // completed
);
const tab3 = ComponentGenerator.renderTab(
  { name: 'Cleaner' }, 2, false, false, true  // locked
);
```

Wrap in `.step-tabs-container`:
```html
<div class="step-tabs-container">
  {tab1}{tab2}{tab3}
</div>
```

**Step circles:** The circle structure (67px hardcoded) is close to the real 69px default.
Keep the current circle structure but replace hardcoded sizes with the CSS variable values —
since `PreviewScope` sets `--bundle-step-timeline-circle-size`, and the real `.step-timeline`
CSS uses this variable, switch to rendering real `.step-timeline` HTML:

```html
<div class="step-timeline">
  <div class="step-timeline-step">
    <div class="step-timeline-circle completed">✓</div>
    <div class="step-timeline-name">Step 1</div>
  </div>
  <div class="step-timeline-step">
    <div class="step-timeline-circle active">2</div>
    <div class="step-timeline-name">Step 2</div>
  </div>
  <div class="step-timeline-step">
    <div class="step-timeline-circle locked">3</div>
    <div class="step-timeline-name">Step 3</div>
  </div>
</div>
```

**Highlight boxes:** Replace `HIGHLIGHT_STYLE` with `HighlightBox` component (see Phase 9).

---

## Phase 6: `BundleHeaderPreview.tsx` — real tab HTML

Replace the hand-coded tab buttons with `ComponentGenerator.renderTab()` output (same as
Phase 5). The tabs already receive CSS vars from `PreviewScope`.

For `activeSubSection === "headerText"`: This sub-section shows conditions + discount text.
The real widget renders these in `.bundle-header-instructions` with real CSS variables:
`--bundle-conditions-text-color`, `--bundle-conditions-text-font-size`,
`--bundle-discount-text-color`, `--bundle-discount-text-font-size`.
Replace inline styles with real HTML structure:

```html
<div class="bundle-header-instructions">
  <h2 class="bundle-header-title">Choose 3 products</h2>
  <p class="bundle-header-subtitle">Add 2 more to get 10% off</p>
</div>
```

---

## Phase 7: `GeneralPreview.tsx` — real empty state cards

Replace the custom empty state cards with `ComponentGenerator.renderEmptyStateCards()`:

```tsx
const emptyHTML = ComponentGenerator.renderEmptyStateCards('Select item', 3);
```

For `activeSubSection === "addToCartButton"`: keep as-is (no real widget equivalent in preview).
For `activeSubSection === "toasts"`: keep as-is.

---

## Phase 8: `PromoBannerPreview.tsx` — real structure

Replace the text-only banner with the real `.promo-banner` HTML:

```html
<div class="promo-banner">
  <div class="promo-banner-content">
    <div class="promo-banner-subtitle">Special Offer</div>
    <div class="promo-banner-title">Add any 3 products, get 20% off!</div>
    <div class="promo-banner-note">*Discount applied automatically at checkout</div>
  </div>
</div>
```

CSS vars for `--bundle-promo-banner-bg`, `--bundle-promo-banner-title-color`, etc. are
already set by `PreviewScope`. Remove the inline style duplications.

---

## Phase 9: `HighlightBox` component — fix dashed outlines

**Problem:** `outline + outlineOffset` is clipped by `overflow: hidden` ancestors.

**Solution:** Create a `HighlightBox` wrapper that positions an overlay `<div>` outside the
component's own DOM tree:

```tsx
// In a shared file or at top of each preview component
function HighlightBox({ active, children }: { active: boolean; children: React.ReactNode }) {
  if (!active) return <>{children}</>;
  return (
    <div style={{ position: 'relative', display: 'contents' }}>
      {children}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '-4px',
          border: '2px dashed #5C6AC4',
          borderRadius: '4px',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      />
    </div>
  );
}
```

Replace all `{...(activeSubSection === "xxx" ? HIGHLIGHT_STYLE : {})}` patterns with:
```tsx
<HighlightBox active={activeSubSection === "xxx"}>
  {/* the highlighted element */}
</HighlightBox>
```

`display: 'contents'` means the wrapper div has no visual box — the child renders normally.
The overlay `<div>` with `position: absolute` is positioned relative to the nearest
positioned ancestor, not clipped by any overflow.

For this to work, the nearest positioned ancestor must be the preview panel container,
not an `overflow: hidden` wrapper. Verify each usage site.

---

## Phase 10: Index export

Update `app/components/design-control-panel/preview/index.ts` to export `PreviewScope`.

---

## Build & Verification Checklist

- [ ] `npm run build` — TypeScript compiles without new errors
- [ ] `?raw` import resolves (bundle-widget-full-page.css included in build output)
- [ ] DCP preview renders real widget HTML structure (inspect element in browser)
- [ ] Changing button colour → preview button updates immediately (CSS var injection works)
- [ ] Dashed highlight boxes visible on every sub-section, no clipping
- [ ] Polaris admin UI unaffected (no style bleed from widget CSS)
- [ ] `npx eslint --max-warnings 9999` → 0 errors on modified files

## Rollback Notes

All changes are isolated to:
- `app/lib/preview-css-vars.ts` (new file — delete)
- `app/components/design-control-panel/preview/PreviewScope.tsx` (new file — delete)
- Preview component files — revert with git

No DB, no metafields, no widget source changes.

## Issue File

Create `docs/issues-prod/dcp-preview-fidelity-1.md` at start of implementation.
Commit prefix: `[dcp-preview-fidelity-1]`
