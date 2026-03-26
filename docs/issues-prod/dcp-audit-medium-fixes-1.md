# Issue: DCP Audit Medium Priority Fixes

**Issue ID:** dcp-audit-medium-fixes-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-27
**Last Updated:** 2026-03-27 03:15

## Overview

Medium priority fixes identified in the DCP audit (`docs/dcp-audit/DCP_AUDIT_FPB_2026-03-27.md`).

Covers:
1. Slider value labels not statically visible (ButtonSettings, QuantityVariantSettings, HeaderTabsSettings, TypographySettings)
2. "Button Typography" heading mismatch in TypographySettings.tsx
3. Promo Banner invisible in sidebar layout preview (hidden by production CSS)
4. Skeleton preview: swap product cards for skeleton cards when on Skeleton Loading section
5. Mobile tab truncation — add fade gradient overflow indicator
6. "Number of cards per row" missing desktop-only note
7. Rename "Add to Cart Button" → "Checkout Button" in nav config and panel heading

## Phases Checklist

- [x] Phase 1: Slider suffix labels + Typography heading fix
- [x] Phase 2: Promo Banner sidebar preview visibility
- [x] Phase 3: Rename "Add to Cart Button" → "Checkout Button"
- [x] Phase 4: "Number of cards per row" desktop-only helpText
- [x] Phase 5: Skeleton preview toggle (DCP_SECTION_CHANGE handler in preview script)
- [x] Phase 6: Mobile tab overflow indicator (mask-image fade gradient)

## Progress Log

### 2026-03-27 03:15 - Completed all phases

- ✅ Phase 1: Fixed `suffix` props in `ButtonSettings.tsx` (Size → `${value}px`, Border Radius → `${value}px`), `QuantityVariantSettings.tsx` (both border-radius suffix was `"px"` → `${value}px`), `HeaderTabsSettings.tsx` (added `suffix={${value}px}`), `TypographySettings.tsx` (added `suffix={${value}}`); fixed panel heading "Typography" → "Button Typography"
- ✅ Phase 2: `api.preview.$type.tsx` `pageLayoutCss` — added `.layout-sidebar .promo-banner { display: block !important; }` to override production hide rule in preview context
- ✅ Phase 3: `base.config.ts` — renamed nav label 'Add to Cart Button' → 'Checkout Button'; `AddToCartButtonSettings.tsx` — updated panel heading to match
- ✅ Phase 4: `ProductCardSettings.tsx` — added "Desktop only — mobile always shows 2 cards per row." sub-label below "Number of cards per row" heading
- ✅ Phase 5: `api.preview.$type.tsx` `getPreviewScript` — in `DCP_SECTION_CHANGE` handler, when `section === 'skeletonLoading'` save original grid HTML and replace with 6 skeleton cards; restore on any other section
- ✅ Phase 6: `bundle-widget-full-page.css` mobile media query `@media (max-width: 600px)` — added `mask-image: linear-gradient(to right, black 80%, transparent 100%)` to `.step-tabs-container` for right-edge fade overflow hint

### Files changed:
- `app/components/design-control-panel/settings/ButtonSettings.tsx`
- `app/components/design-control-panel/settings/QuantityVariantSettings.tsx`
- `app/components/design-control-panel/settings/HeaderTabsSettings.tsx`
- `app/components/design-control-panel/settings/TypographySettings.tsx`
- `app/components/design-control-panel/settings/AddToCartButtonSettings.tsx`
- `app/components/design-control-panel/settings/ProductCardSettings.tsx`
- `app/routes/api/api.preview.$type.tsx`
- `app/lib/dcp-config/base.config.ts`
- `extensions/bundle-builder/assets/bundle-widget-full-page.css`
