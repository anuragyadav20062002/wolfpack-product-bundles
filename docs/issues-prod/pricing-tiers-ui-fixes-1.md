# Issue: Pricing Tiers UI Fixes + Theme Editor Cleanup

**Issue ID:** pricing-tiers-ui-fixes-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-17
**Last Updated:** 2026-03-17 23:45

## Overview

Six UI/UX fixes across the Pricing Tiers section and related areas:
1. Remove 'Full-page only' badge from PricingTiersSection
2. Add SVG icon in EmptyState image placeholder
3. Fix: Discard unsaved changes doesn't reset tierConfig/showStepTimeline state
4. Remove redundant 'Add first tier' button from EmptyState
5. Remove `show_step_timeline` from theme editor (keep only in Admin UI)
6. Update promo banner FORMAT/SIZE in Images & GIFs section

## Phases Checklist

- [x] Phase 1: All 6 fixes ✅

## Progress Log

### 2026-03-17 23:45 - All Fixes Completed

- ✅ `app/components/PricingTiersSection.tsx` — removed 'Full-page only' badge; added tiered-bars SVG data URI to EmptyState image; removed redundant 'Add first tier' action from EmptyState; reordered import to fix ESLint import/first error
- ✅ `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` — added `originalTierConfigRef` + `originalShowStepTimelineRef`; handleDiscard now resets `tierConfig` and `showStepTimeline` to original values; updated promo banner FORMAT to "JPG, PNG, WebP, GIF, SVG, AVIF" and RECOMMENDED SIZE to "1600 × 400 px · 4:1 ratio"
- ✅ `extensions/bundle-builder/blocks/bundle-full-page.liquid` — removed `show_step_timeline` schema block (lines 59–64) and `data-show-step-timeline` data attribute (line 257)
- ✅ `extensions/bundle-builder/locales/en.default.schema.json` — removed `show_step_timeline_label` and `show_step_timeline_info` locale strings
- ✅ Zero ESLint errors; 37 tests passing, zero regressions

**Files Modified:**
- `app/components/PricingTiersSection.tsx`
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- `extensions/bundle-builder/blocks/bundle-full-page.liquid`
- `extensions/bundle-builder/locales/en.default.schema.json`
