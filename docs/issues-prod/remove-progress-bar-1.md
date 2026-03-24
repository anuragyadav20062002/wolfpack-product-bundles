# Issue: Remove Progress Bar from Widget

**Issue ID:** remove-progress-bar-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-24
**Last Updated:** 2026-03-24 12:00

## Overview

Remove all progress bar elements from the bundle widget. Progress bars were added as a discount
threshold visualiser but are no longer wanted. Three separate progress bars exist across widget JS
and CSS files:

1. **Side panel progress bar** — rendered conditionally in FPB side panel when pricing tiers are enabled
2. **Footer progress bar** — CSS-only dead code in `bundle-widget-full-page.css` (no JS reference)
3. **Modal footer progress bar** — CSS-only dead code in `bundle-widget.css` (no JS reference)

## Progress Log

### 2026-03-24 12:00 - Starting removal

Files to modify:
- `app/assets/bundle-widget-full-page.js` — remove side panel progress bar render + `calculateDiscountProgress` method
- `extensions/bundle-builder/assets/bundle-widget-full-page.css` — remove all footer and side panel progress CSS
- `extensions/bundle-builder/assets/bundle-widget.css` — remove modal footer progress CSS
- `app/routes/api/api.preview.$type.tsx` — remove progress bar from FPB side panel preview HTML
- Run `npm run build:widgets` after JS changes

### 2026-03-24 12:30 - Completed

- ✅ Removed side panel progress bar render block from `bundle-widget-full-page.js`
- ✅ Removed `calculateDiscountProgress()` method from `bundle-widget-full-page.js`
- ✅ Removed `.footer-progress-section/bar-container/bar-bg/bar-fill` from `bundle-widget-full-page.css`
- ✅ Removed `.full-page-footer.redesigned .footer-progress-*` from `bundle-widget-full-page.css`
- ✅ Removed `.side-panel-progress/bar-bg/bar-fill` from `bundle-widget-full-page.css`
- ✅ Removed `.modal-footer-progress-*` (dead code) from `bundle-widget.css`
- ✅ Removed progress bar from DCP preview HTML
- ✅ Rebuilt widgets — full-page: 249.6 KB, product-page: 152.1 KB
- ✅ CSS sizes: bundle-widget-full-page.css 95KB, bundle-widget.css 67KB (both under 100KB limit)

## Phases Checklist
- [x] Phase 1: Remove from JS source
- [x] Phase 2: Remove from CSS files
- [x] Phase 3: Remove from DCP preview HTML
- [x] Phase 4: Build widgets + check CSS file sizes
- [x] Phase 5: Commit
