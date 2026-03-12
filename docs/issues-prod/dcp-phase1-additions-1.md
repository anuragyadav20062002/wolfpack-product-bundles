# Issue: DCP Phase 1 Additions

**Issue ID:** dcp-phase1-additions-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-12
**Last Updated:** 2026-03-12 16:00

## Overview

Adds ~30 new design settings to the Design Control Panel (DCP), covering:
- Search Input styling (bg, border, focus border, text, placeholder, icon, clear button)
- Skeleton Loading colors (base, shimmer, highlight)
- Card Hover & Transitions (translate Y distance, transition duration)
- Tile Quantity Badge (bg + text color)
- Modal Close Button (color, bg, hover color)
- Loading Overlay (bg + text color)
- Button Typography (text-transform, letter-spacing)
- Progress Bar Shape (height, border radius)
- Focus / Accessibility outline (color, width)

All new settings extend the existing CSS variable pipeline:
`DesignSettings type` → `defaultSettings.ts` → `prisma/schema.prisma` → `css-variables-generator.ts` → widget CSS → browser

## Progress Log

### 2026-03-12 - Feature Pipeline Complete (BR → PO → Architect stages)
- Docs: `docs/dcp-phase1-additions/00-BR.md`, `02-PO-requirements.md`, `03-architecture.md`
- Architecture decision: Extend existing CSS variable pipeline, all new fields nullable with @default

### 2026-03-12 - Type System & Defaults
- Added 30 new fields to `app/components/design-control-panel/types.ts`
- Added defaults to `app/components/design-control-panel/config/defaultSettings.ts` (both PRODUCT_PAGE and FULL_PAGE)
- Added 30 nullable fields to `prisma/schema.prisma` with @default values

### 2026-03-12 - CSS Variable Generator
- Added new CSS variable block to `app/lib/css-generators/css-variables-generator.ts`
- CSS variable names match existing widget CSS references exactly
- `--bundle-card-hover-translate-y` generates full `translateY(...)` value (not just px)

### 2026-03-12 - New Settings Panel Components
- Created: SearchInputSettings.tsx, SkeletonSettings.tsx, QuantityBadgeSettings.tsx
- Created: LoadingStateSettings.tsx, TypographySettings.tsx, AccessibilitySettings.tsx
- Created: ModalCloseButtonSettings.tsx
- Extended: ProductCardSettings.tsx (Hover & Animation section)
- Extended: FooterDiscountProgressSettings.tsx (Progress Bar Shape section)
- Updated: SettingsPanel.tsx (7 new cases)
- Updated: NavigationSidebar.tsx (7 new nav items)

### 2026-03-12 - Widget CSS Updates
- `bundle-widget-full-page.css`: product-card transition uses `--bundle-card-transition-duration`
- `bundle-widget-full-page.css`: product-card hover uses `--bundle-card-hover-translate-y`
- `bundle-widget-full-page.css`: footer progress bar uses `--bundle-progress-bar-height/radius`
- `bundle-widget-full-page.css`: product-add-btn uses `--bundle-button-text-transform/letter-spacing`
- `bundle-widget-full-page.css`: focus outline rules added
- `bundle-widget.css`: product-card hover uses CSS vars, transition added
- `bundle-widget.css`: modal-footer-progress-bar uses `--bundle-progress-bar-height/radius`
- `bundle-widget.css`: add-bundle-to-cart uses `--bundle-button-text-transform/letter-spacing`
- `bundle-widget.css`: focus outline rules added
- Tile quantity badge in `bundle-widget-full-page.css` uses `--bundle-tile-badge-bg/text`
- Modal close button in `bundle-widget.css` uses `--bundle-modal-close-*` vars

### 2026-03-12 - Widget JS Updates
- `bundle-widget-full-page.js`: skeleton loading colors use CSS vars (--bundle-skeleton-*)
- `bundle-widget-product-page.js`: debug indicator uses `--bundle-loading-overlay-*` CSS vars

### 2026-03-12 - Build & Commit
- WIDGET_VERSION bumped: 1.2.2 → 1.3.0 (MINOR bump for new DCP controls)
- Rebuilt both widget bundles: `npm run build:widgets`
- ESLint: 0 errors, warnings are pre-existing

## Related Documentation
- `docs/dcp-phase1-additions/00-BR.md`
- `docs/dcp-phase1-additions/02-PO-requirements.md`
- `docs/dcp-phase1-additions/03-architecture.md`

## Phases Checklist
- [x] Feature Pipeline (BR → PO → Architect)
- [x] Type system & defaults
- [x] Prisma schema fields
- [x] CSS variable generator
- [x] Settings panel components (7 new)
- [x] SettingsPanel.tsx & NavigationSidebar.tsx
- [x] Widget CSS updates (both CSS files)
- [x] Widget JS updates (skeleton + debug indicator)
- [x] Build widgets
- [x] ESLint check
- [x] Issue file & commit
- [x] DCP Preview components for new Phase 1 settings
- [x] Remove progress bar controls from DCP (no progress bar in widget)

### 2026-03-12 16:00 - Removing progress bar controls from DCP
- Removing: footerProgressBarFilledColor, footerProgressBarEmptyColor color pickers
- Removing: progressBarHeight, progressBarBorderRadius sliders (Progress Bar Shape section)
- Renaming section: "Discount Text & Progress Bar" → "Discount Text"
- Removing progress bar shape preview from BundleFooterPreview
- Removing stale props from PreviewPanel → BundleFooterPreview call

### 2026-03-12 15:00 - Completed DCP Preview Components
- ✅ ProductCardPreview.tsx: Added searchInput (default + focused states), skeletonLoading (animated skeleton cards), typography (button with CSS vars)
- ✅ GeneralPreview.tsx: Added loadingState (inline overlay indicator), modalCloseButton (.close-button class in modal header), accessibility (focused button + input with focus ring)
- ✅ BundleFooterPreview.tsx: Added quantityBadge (footer tiles with real .tile-quantity-badge class), added progress bar visual to footerDiscountProgress panel using .modal-footer-progress-bar class
- ✅ PreviewPanel.tsx: Added quantityBadge to footer group, added loadingState/modalCloseButton/accessibility to general group
- All previews use real widget CSS class names so CSS variables from PreviewScope apply automatically
- ESLint: 0 errors (2 pre-existing warnings in BundleFooterPreview unrelated to changes)

### 2026-03-12 - Hotfix: modal-footer-total-pill shows $0.00
- Bug: `.total-price-final` and `.total-price-strike` spans never updated after product selection
- Root cause: `updateFooterMessaging()` was a stub (just `return;`)
- Fix: Added total pill update at end of `updateAddToCartButton()` in `bundle-widget-product-page.js`
- WIDGET_VERSION bumped: 1.3.0 → 1.3.1 (PATCH)
- Files changed: `app/assets/bundle-widget-product-page.js`, `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`, `scripts/build-widget-bundles.js`

### 2026-03-12 - Fix: Sidebar layout spacing issues
- Bug 1: Large gray promo banner rendered at top of sidebar layout content
  - Fix: `.layout-sidebar .promo-banner { display: none !important; }` in bundle-widget-full-page.css
- Bug 2: Card spacing messed up in sidebar layout
  - Fix: Added `justify-content: stretch` and `margin-top: 0` to the sidebar grid override
  - `justify-content: center` from base rule was causing centering gaps with 1fr columns
  - `margin-top: 0` removes redundant top margin (sidebar-content padding already handles spacing)
- Files changed: `extensions/bundle-builder/assets/bundle-widget-full-page.css` (CSS-only, no rebuild needed)
