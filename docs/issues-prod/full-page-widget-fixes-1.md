# Issue: Full-Page Widget Fixes - ComponentGenerator & Step Tabs

**Issue ID:** full-page-widget-fixes-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-01-16
**Last Updated:** 2026-01-16 00:30

## Overview

Fixed two issues with the full-page bundle widget:
1. `ComponentGenerator` undefined error in theme editor
2. Step navigation redesigned from timeline circles to clickable tabs

## Error Details

### Error 1: ComponentGenerator undefined
```
[FULL_PAGE_LAYOUT] Error loading products: TypeError: Cannot read properties of undefined (reading 'ComponentGenerator')
    at BundleWidgetFullPage.createProductCard (bundle-widget-full-page-bundled.js:2662:45)
```

**Root Cause:** Code referenced `window.BUNDLE_WIDGET.ComponentGenerator` but `ComponentGenerator` is a class in the same IIFE scope after bundling, not attached to `window.BUNDLE_WIDGET`.

### Issue 2: Step tabs UX
User requested clickable tabs for steps (like product page widget) instead of timeline circles.

## Solution

### Fix 1: ComponentGenerator reference
Changed from:
```javascript
window.BUNDLE_WIDGET.ComponentGenerator.renderProductCard(...)
```
To:
```javascript
ComponentGenerator.renderProductCard(...)
```

### Fix 2: Step tabs implementation
- Replaced `createStepTimeline()` with new tab-based implementation
- Added `getStepProductImages()` helper method
- Tabs show: step number, step name, selection count, product thumbnails, checkmark/lock icons
- Uses existing DCP tab CSS variables for styling consistency

## Progress Log

### 2026-01-16 00:30 - Fixes Implemented
- ✅ Fixed ComponentGenerator reference in `createProductCard()` method
- ✅ Rewrote `createStepTimeline()` to render clickable tabs instead of timeline circles
- ✅ Added `getStepProductImages()` helper for tab thumbnails
- ✅ Added 170 lines of CSS for `.step-tabs-container` and `.step-tab` using DCP variables
- ✅ Rebuilt widget bundles
- Files modified:
  - `app/assets/bundle-widget-full-page.js`
  - `extensions/bundle-builder/assets/bundle-widget-full-page.css`
  - `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`

## CSS Variables Used (DCP Compatible)
- `--bundle-tabs-active-bg-color`
- `--bundle-tabs-active-text-color`
- `--bundle-tabs-inactive-bg-color`
- `--bundle-tabs-inactive-text-color`
- `--bundle-tabs-border-color`
- `--bundle-tabs-border-radius`

## Related Documentation
- CLAUDE.md: Widget bundle build process

## Phases Checklist
- [x] Phase 1: Fix ComponentGenerator error
- [x] Phase 2: Implement step tabs
- [x] Phase 3: Add CSS with DCP variables
- [x] Phase 4: Rebuild bundles
- [x] Phase 5: Test in theme editor
