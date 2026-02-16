# Issue: Update DCP Preview Components

**Issue ID:** dcp-preview-updates-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-02-16
**Last Updated:** 2026-02-16 13:00

## Overview
Update Design Control Panel preview components to:
1. Add visual highlight indicators (dashed border) showing which element is being edited
2. Add BundleTypeToggle to all footer subsections (not just `footer`)
3. Refactor duplicated footer markup into shared layout components
4. Create GlobalColorsPreview to replace blank `null` return

## Progress Log

### 2026-02-16 12:00 - Starting Implementation
- Adding highlight styles to all preview components
- Refactoring BundleFooterPreview to extract shared layouts
- Creating GlobalColorsPreview component
- Files to modify: PreviewPanel.tsx, ProductCardPreview.tsx, BundleFooterPreview.tsx, BundleHeaderPreview.tsx, GeneralPreview.tsx, StepBarPreview.tsx, PromoBannerPreview.tsx
- New file: GlobalColorsPreview.tsx

### 2026-02-16 12:30 - Completed Implementation
- Added HIGHLIGHT_STYLE (2px dashed #5C6AC4) to all preview components
- Passed activeSubSection to ProductCardPreview from PreviewPanel
- Refactored BundleFooterPreview: extracted ProductPageFooterLayout and FullPageFooterLayout shared components
- Added BundleTypeToggle to all 4 footer subsections (was only on `footer`)
- Created GlobalColorsPreview with mini bundle mockup + color swatches
- Updated PreviewPanel to route `globalColors` to new preview component
- Verified: `npx tsc --noEmit` — no new errors; `npx remix vite:build` — success
- Files changed: PreviewPanel.tsx, ProductCardPreview.tsx, BundleFooterPreview.tsx, BundleHeaderPreview.tsx, GeneralPreview.tsx, StepBarPreview.tsx, PromoBannerPreview.tsx
- Files created: GlobalColorsPreview.tsx

## Phases Checklist
- [x] Phase 1: ProductCardPreview highlights + pass activeSubSection
- [x] Phase 2: BundleFooterPreview refactor + highlights + toggle for all subsections
- [x] Phase 3: BundleHeaderPreview + GeneralPreview + StepBarPreview + PromoBannerPreview highlights
- [x] Phase 4: GlobalColorsPreview creation + PreviewPanel routing
- [x] Phase 5: TypeScript + build verification
- [x] Phase 6: Ensure preview elements match storefront appearance

### 2026-02-16 13:00 - Storefront Accuracy Fixes
Compared all preview components against actual storefront CSS/HTML and fixed discrepancies:

**ProductCardPreview:**
- Removed price row bg/border/padding (storefront has bare price row, no colored container)
- Changed product title from single-line truncation to 2-line `-webkit-line-clamp` (matches storefront)
- Added gradient background, uppercase, letter-spacing, box-shadow to "Add to Bundle" button
- Replaced standalone quantity selector with inline quantity controls (storefront hides qty, shows inline ±)
- Replaced modal `<select>` dropdown with button-style variant selectors (matches storefront modal)

**BundleFooterPreview:**
- Product-page total pill: padding `10px 20px` (was 6px 16px), borderRadius `8px` (was 6px)
- Product-page footer: added `border-top: 1px solid #E5E7EB` and `boxShadow: 0 -2px 8px`
- Product-page buttons: border `2px` (was 1px), padding `10px 28px` (was 12px 56px), removed uppercase/letter-spacing
- Added box-shadow to Next button
- Full-page footer: removed visual progress bar (storefront only shows text message, not a bar)
- Full-page total section: increased "Total" label to 16px/600 weight (was 11px)

**BundleHeaderPreview:**
- Active tab: stronger shadow `0 4px 12px` (was 0 1px 3px), added `translateY(-2px)` lift, added border matching bg
- Removed 2× and 1.2× font-size multipliers from conditions/discount text (now uses actual setting values)

**GeneralPreview:**
- Toast: borderRadius `8px` (was 11px), shadow `0 4px 12px rgba(0,0,0,0.15)` (was 0 4px 16px rgba(0,0,0,0.2))

**Verified:** `npx tsc --noEmit` — no new errors; `npx remix vite:build` — success
