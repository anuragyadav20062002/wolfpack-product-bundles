# Issue: Toast Notification — Full DCP Customization

**Issue ID:** toast-dcp-full-customization-1
**Status:** TODO
**Priority:** 🟡 Medium
**Created:** 2026-03-19
**Last Updated:** 2026-03-19

## Overview
The bundle widget toast notifications (e.g. "Please select products before continuing") currently only expose two DCP settings: `toastBgColor` and `toastTextColor`. Merchants want complete visual control over the toast — border, roundness, opacity, animation speed, font size, and shadow.

## Current State (Audit)

**Toast HTML structure:**
```html
<div id="bundle-toast" class="bundle-toast">
  <span>Message</span>
  <svg class="toast-close">...</svg>
</div>
<!-- With undo action: -->
<div class="bundle-toast bundle-toast-with-undo">
  <span class="toast-message">Message</span>
  <button class="toast-undo-btn">Undo</button>
  <svg class="toast-close">...</svg>
</div>
```

**CSS file locations:**
- Product-page widget: `extensions/bundle-builder/assets/bundle-widget.css` (~line 1596)
- Full-page widget: `extensions/bundle-builder/assets/bundle-widget-full-page.css` (~line 3307)
- JS manager: `app/assets/widgets/shared/toast-manager.js`

**Currently hardcoded values (candidates for CSS variable migration):**
| Property | Hardcoded Value | Desired Variable |
|----------|----------------|-----------------|
| border-radius | `8px` | `--bundle-toast-border-radius` |
| box-shadow | `0 4px 12px rgba(0,0,0,0.15)` | `--bundle-toast-box-shadow` |
| animation duration | `0.3s` | `--bundle-toast-animation-duration` |
| entry animation | slideDown (top→0) | should be configurable (top vs bottom) |
| font-size | `13px` | `--bundle-toast-font-size` |
| font-weight | `500` | `--bundle-toast-font-weight` |
| padding | `10px 20px` | `--bundle-toast-padding` |
| border | none | `--bundle-toast-border-color`, `--bundle-toast-border-width` |
| opacity (background) | 1 | (can be achieved via rgba in bg color) |

**Currently variable-driven:**
- `--bundle-toast-bg` → `toastBgColor`
- `--bundle-toast-text` → `toastTextColor`

## Requested DCP Controls

New settings to expose in `ToastsSettings.tsx`:
1. **Background Color** (existing `toastBgColor`)
2. **Text Color** (existing `toastTextColor`)
3. **Border Radius** (new `toastBorderRadius` — integer px)
4. **Border Color** (new `toastBorderColor`)
5. **Border Width** (new `toastBorderWidth` — integer px)
6. **Font Size** (new `toastFontSize` — integer px)
7. **Font Weight** (new `toastFontWeight` — integer 400/500/600/700)
8. **Animation Duration** (new `toastAnimationDuration` — integer ms, e.g. 200/300/400/500)
9. **Box Shadow** (new `toastBoxShadow` — text input)
10. **Enter from Bottom** (new `toastEnterFromBottom` — boolean toggle: default false = from top)
    - Note: User observed the Skai Lama demo toast as coming from the bottom. Current code slides from top. This boolean would flip animation direction.

## Implementation Scope

This is a **multi-layer feature** requiring the full feature pipeline:

### 1. Prisma Schema (new fields on `DesignSettings`)
- `toastBorderRadius Int?` (default 8)
- `toastBorderColor String?` (default "transparent")
- `toastBorderWidth Int?` (default 0)
- `toastFontSize Int?` (default 13)
- `toastFontWeight Int?` (default 500)
- `toastAnimationDuration Int?` (default 300) ← milliseconds
- `toastBoxShadow String?` (default "0 4px 12px rgba(0,0,0,0.15)")
- `toastEnterFromBottom Boolean` (default false)

### 2. TypeScript Type (`DesignSettings` interface)
Add all above fields with correct types.

### 3. Default Settings
Add to both `PRODUCT_PAGE_DEFAULTS` and `FULL_PAGE_DEFAULTS`.

### 4. CSS Variable Generator (`css-variables-generator.ts`)
```css
--bundle-toast-border-radius: ${s.toastBorderRadius ?? 8}px;
--bundle-toast-border-color: ${s.toastBorderColor ?? 'transparent'};
--bundle-toast-border-width: ${s.toastBorderWidth ?? 0}px;
--bundle-toast-font-size: ${s.toastFontSize ?? 13}px;
--bundle-toast-font-weight: ${s.toastFontWeight ?? 500};
--bundle-toast-animation-duration: ${s.toastAnimationDuration ?? 300}ms;
--bundle-toast-box-shadow: ${s.toastBoxShadow ?? '0 4px 12px rgba(0,0,0,0.15)'};
```

For `toastEnterFromBottom`: needs widget JS change — pass the variable to `ToastManager` or use a CSS class toggle.

### 5. Widget CSS (both CSS files)
Replace hardcoded values with `var(--bundle-toast-*)` references.

### 6. ToastsSettings.tsx
Add all new controls (ColorInputs, range sliders, toggles).

### 7. Widget Rebuild + Deploy
Run `npm run build:widgets`, increment `WIDGET_VERSION`, then `shopify app deploy`.

## Notes / Observations
- The user perceived the Skai Lama toast as "sliding in from the bottom". Current code shows `slideDown` (from top). The live Skai Lama store may have a custom override via Custom CSS. The `toastEnterFromBottom` boolean will address this.
- Background opacity: Can be achieved by the merchant using an rgba value in the background color picker (e.g. `rgba(0,0,0,0.85)`). No separate opacity control needed.
- The undo button styling (`.toast-undo-btn`) could also be exposed in a future iteration.

## IMPORTANT: Run feature-pipeline BEFORE implementing
Per CLAUDE.md, all new features must run through BR → PO → Architecture → SDE pipeline before any code changes.

## Phases Checklist
- [ ] Run feature-pipeline skill
- [ ] Prisma migration: add new toast fields
- [ ] TypeScript type: add fields to DesignSettings
- [ ] Default settings: add defaults to both bundle types
- [ ] CSS generator: add new --bundle-toast-* variables
- [ ] Widget CSS: replace hardcoded values with var() references
- [ ] ToastsSettings.tsx: add new controls
- [ ] Widget rebuild + version bump
- [ ] DCP preview update for toast (GeneralPreview.tsx, toasts section)
- [ ] Deploy + verify
