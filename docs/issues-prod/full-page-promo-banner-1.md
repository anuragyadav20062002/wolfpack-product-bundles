# Issue: Full-Page Bundle Promo-Banner Implementation

**Issue ID:** full-page-promo-banner-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-01-26
**Last Updated:** 2026-01-26 09:00

---

## Overview

The full-page bundle page shows a page-title div with the page name (e.g., "StrangeObjectsinmirror") instead of the promo-banner. The promo-banner component exists in the widget code but is never rendered. Need to:
1. Hide the page-title div
2. Show the promo-banner with light-gray background as default
3. Make promo-banner parameters customizable from DCP

## Progress Log

### 2026-01-26 08:30 - Investigation Complete

**Findings:**
- `createPromoBanner()` method exists in `bundle-widget-full-page.js` (lines 923-982)
- CSS styling exists in `bundle-widget-full-page.css` (lines 376-442)
- Method is NEVER called or appended to DOM
- No DCP settings for promo-banner customization
- Page-title is from Shopify theme template, not widget

### 2026-01-26 09:00 - Implementation Complete

**Files Modified:**

1. **app/types/state.types.ts**
   - Added `PromoBannerSettings` interface with 11 customizable properties
   - Added to `DesignSettings` extends list

2. **app/components/design-control-panel/config/defaultSettings.ts**
   - Added promo-banner defaults to `PRODUCT_PAGE_DEFAULTS` (disabled by default)
   - Added promo-banner defaults to `FULL_PAGE_DEFAULTS` (enabled with light-gray #F3F4F6)

3. **app/routes/api.design-settings.$shopDomain.tsx**
   - Added CSS variables generation for all promo-banner settings:
     - `--bundle-promo-banner-enabled`
     - `--bundle-promo-banner-bg`
     - `--bundle-promo-banner-title-color`
     - `--bundle-promo-banner-title-font-size`
     - `--bundle-promo-banner-title-font-weight`
     - `--bundle-promo-banner-subtitle-color`
     - `--bundle-promo-banner-subtitle-font-size`
     - `--bundle-promo-banner-note-color`
     - `--bundle-promo-banner-note-font-size`
     - `--bundle-promo-banner-radius`
     - `--bundle-promo-banner-padding`

4. **app/assets/bundle-widget-full-page.js**
   - Added `hidePageTitle()` method to hide theme's page title element
   - Updated `renderFullPageLayout()` to call `hidePageTitle()` and render promo-banner
   - Promo-banner now renders at the top before step timeline

5. **extensions/bundle-builder/assets/bundle-widget-full-page.css**
   - Updated promo-banner styles to use DCP CSS variables
   - Changed default background from gradient to light-gray (#F3F4F6)
   - Removed pattern overlay for cleaner appearance
   - Updated text colors to work with light background

**Build Verification:**
- TypeScript compilation: Passed
- Widget bundle build: Passed (167.0 KB full-page, 112.1 KB product-page)

---

## DCP Settings Available

| Setting | Default (Full-Page) | Description |
|---------|---------------------|-------------|
| promoBannerEnabled | true | Show/hide the promo banner |
| promoBannerBgColor | #F3F4F6 | Background color (light gray) |
| promoBannerTitleColor | #111827 | Title text color |
| promoBannerTitleFontSize | 28 | Title font size in pixels |
| promoBannerTitleFontWeight | 700 | Title font weight |
| promoBannerSubtitleColor | #6B7280 | Subtitle text color |
| promoBannerSubtitleFontSize | 16 | Subtitle font size |
| promoBannerNoteColor | #9CA3AF | Note/italic text color |
| promoBannerNoteFontSize | 14 | Note font size |
| promoBannerBorderRadius | 16 | Border radius in pixels |
| promoBannerPadding | 32 | Padding in pixels |

---

## Related Documentation
- CLAUDE.md - Project guidelines
- docs/issues-prod/codebase-refactoring-plan-1.md - Refactoring plan (to continue after)
