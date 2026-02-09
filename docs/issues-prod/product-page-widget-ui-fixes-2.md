# Issue: Product Page Widget UI Fixes

**Issue ID:** product-page-widget-ui-fixes-2
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-09
**Last Updated:** 2026-02-09 13:15

## Overview
Multiple UI issues on the product-page bundle widget and admin configuration page.

## Progress Log

### 2026-02-09 12:00 - Completed Widget Fixes (Phase 1)
- Fixed variant lookup bug in renderSelectedProductCards()
- Removed progress bar (JS + CSS)
- Redesigned discount pill (moved to widget top-right)
- Made toast notifications smaller/minimal
- Fixed modal tab z-index clipping

### 2026-02-09 13:15 - Completed Admin UI Fixes (Phase 2)
- **Scroll to new step:** Modified `addStep()` in `useBundleSteps.ts` to return new step ID; updated Add Step button click handler in product-page configure route to use `requestAnimationFrame` + `scrollIntoView` to scroll to the new step card; added `data-step-id` attribute to step card divs for targeting
- **Widget installation banner:** Added 15-second polling `useEffect` in product-page configure route (was missing — full-page route had it); also updated `handleDismissBanner` to clear `localStorage` flag when user dismisses the "installation in progress" banner
- Files modified: `app/hooks/useBundleSteps.ts`, `app/routes/app.bundles.product-page-bundle.configure.$bundleId.tsx`

## Phases Checklist
- [x] Phase 1: Fix variant lookup bug
- [x] Phase 2: Remove progress bar
- [x] Phase 3: Redesign discount pill
- [x] Phase 4: Smaller toast notifications
- [x] Phase 5: Fix modal tab z-index
- [x] Phase 6: Scroll to new step on Add Step click
- [x] Phase 7: Fix widget installation banner (add polling + dismiss clears flag)
- [x] Phase 8: Clean up obsolete theme editor settings (progress bar removed)
