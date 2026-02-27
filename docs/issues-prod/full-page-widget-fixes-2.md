# Issue: Full-Page Widget Fixes — Conditions, Hint Text, Toast, Loading GIF

**Issue ID:** full-page-widget-fixes-2
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-24
**Last Updated:** 2026-02-24 19:00

## Overview
Four bugs reported by regression tester on full-page bundles:
1. Step conditions not enforced (can proceed/add-to-cart without meeting conditions)
2. "Select 1 or more items from [step name]" text still visible
3. Toasts unstyled and appearing below footer
4. Loading GIF not visible during step changes

## Root Cause Analysis

### Issue 1: Step conditions
The condition enforcement code (committed in `533b44e`) is correct in source but the extension
hasn't been deployed to Shopify yet, so the storefront runs old code. Additionally, event
handlers (tab clicks, category tabs, variant removal) always called `renderFullPageLayout()`
even when the bundle uses `footer_side` layout, breaking sidebar state.

**Fix:** Added `reRenderFullPage()` helper that dispatches to the correct layout renderer.
Updated all event handlers to use it. The core fix still requires `shopify app deploy`.

### Issue 2: "Select 1 or more items from [step name]"
This text comes from the old deployed version of the widget. The current source does not generate
it. However, the `_getConditionHint()` method still generated "Select 1+" text inside tab-hint
spans — removed entirely.

**Fix:** Removed `_getConditionHint()` method, `hintHTML` variable, and `.tab-hint` CSS class.

### Issue 3: Toasts unstyled
The toast CSS (`position: fixed; top: 16px; z-index: 1000001`) is correct in source. The deployed
extension uses old CSS. Requires `shopify app deploy` to push latest CSS.

**Fix:** No source change needed — deployment will resolve this.

### Issue 4: Loading GIF not visible
The `.bundle-loading-overlay` had `z-index: 50` while the sticky footer has `z-index: 100`,
so the footer rendered on top of the overlay, hiding the GIF.

**Fix:** Changed `.bundle-loading-overlay` z-index from `50` to `200`.

## Files Changed
- `app/assets/bundle-widget-full-page.js` — reRenderFullPage() helper, removed _getConditionHint(), removed hintHTML
- `extensions/bundle-builder/assets/bundle-widget-full-page.css` — removed .tab-hint, overlay z-index 50→200
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` — rebuilt

## Phases Checklist
- [x] Investigate all 4 issues
- [x] Fix layout-aware dispatch (reRenderFullPage helper)
- [x] Remove tab-hint text generation
- [x] Fix loading overlay z-index
- [x] Build widgets
- [x] Commit
- [ ] `shopify app deploy` (user must run manually)
