# Issue: Widget UX Fixes — GIF Adjust, Loading Overlay, Toast Styling

**Issue ID:** widget-ux-fixes-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-24
**Last Updated:** 2026-02-24 13:30

## Overview
Three related UX bugs:
1. Remove "Adjust Image" from the loading GIF upload section (GIFs don't need cropping)
2. Custom loading GIF not visible on storefront — debug and fix overlay z-index/display + change max size to 150x150px
3. Toast notifications not styled in full-page widget — CSS file missing toast styles

## Progress Log

### 2026-02-24 13:00 - Starting Investigation
- Explored all three issues in parallel
- Identified root causes for all three
- Next: Implement fixes

### 2026-02-24 13:30 - All Fixes Implemented

**Fix 1 — Remove "Adjust Image" from GIF FilePicker:**
- Added `hideCropEditor` prop to `FilePicker.tsx` (default: false)
- Conditionally hides "Adjust Image" button and crop editor portal when `hideCropEditor=true`
- Both configure routes pass `hideCropEditor` to loading GIF FilePicker instances

**Fix 2 — Loading GIF overlay not visible + max size:**
- Root cause: `bundle-widget-full-page.css` was missing ALL `.bundle-loading-overlay` styles
- The full-page liquid block references `bundle-widget-full-page.css` only, not `bundle-widget.css`
- Added complete loading overlay CSS to `bundle-widget-full-page.css`
- Changed max GIF size from 120x120 to 150x150 in both CSS files and both configure routes

**Fix 3 — Toast not styled in full-page widget:**
- Root cause: Same as Fix 2 — `bundle-widget-full-page.css` had no `.bundle-toast` styles
- Added complete toast CSS (including animations, undo button, mobile responsive) to `bundle-widget-full-page.css`

## Root Cause Analysis
The full-page widget uses a separate CSS file (`bundle-widget-full-page.css`) from the product-page widget (`bundle-widget.css`). When toast and loading overlay features were originally added to `bundle-widget.css`, they were never copied to the full-page CSS file. This caused both features to appear unstyled/invisible in the full-page widget.

## Files Changed
| File | Change |
|------|--------|
| `app/components/design-control-panel/settings/FilePicker.tsx` | Added `hideCropEditor` prop |
| `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` | Pass `hideCropEditor`, update max size text |
| `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` | Pass `hideCropEditor`, update max size text |
| `extensions/bundle-builder/assets/bundle-widget.css` | Update GIF max size to 150px |
| `extensions/bundle-builder/assets/bundle-widget-full-page.css` | Add loading overlay + toast CSS |

## Related Documentation
- FilePicker: `app/components/design-control-panel/settings/FilePicker.tsx`
- Full-page configure: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- Product-page configure: `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
- Widget CSS: `extensions/bundle-builder/assets/bundle-widget.css`
- Full-page CSS: `extensions/bundle-builder/assets/bundle-widget-full-page.css`
- Toast manager: `app/assets/widgets/shared/toast-manager.js`

## Phases Checklist
- [x] Phase 1: Investigate all three issues
- [x] Phase 2: Remove "Adjust Image" from GIF section
- [x] Phase 3: Fix loading GIF overlay display + max size 150x150
- [x] Phase 4: Fix toast CSS for full-page widget
- [x] Phase 5: Build widgets and verify
- [x] Phase 6: Lint and commit
