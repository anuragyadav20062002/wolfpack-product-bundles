# Issue: Fix Product Card Layout

**Issue ID:** fix-product-card-layout-1
**Status:** Completed
**Priority:** High
**Created:** 2026-01-25
**Last Updated:** 2026-01-25 01:50

## Overview
Fix multiple product card layout issues in the full-page bundle widget:
1. Variant selector should be visible for products with variants
2. Product cards need a visible outline/border
3. ADD TO BUNDLE button is being cut off due to orientation/layout issues
4. Remove margin-bottom below discount messaging text in footer
5. Verify custom CSS is connected and working properly

## Progress Log

### 2026-01-25 01:30 - Starting Issue Investigation
- Analyzed bundle-widget-full-page.css for current styling
- Found variant selector has `display: none` at line 671-673
- Found product card border is barely visible: `border: 1px solid rgba(0, 0, 0, 0.08)`
- Found footer discount message has `margin-bottom: 12px` at line 1180
- Need to adjust card layout to prevent button cutoff

### 2026-01-25 01:45 - Completed All CSS Fixes
- Changed variant selector from `display: none` to `display: block` with proper styling
- Updated product card border from barely visible to `border: 2px solid var(--bundle-product-card-border-color, #E5E7EB)`
- Removed fixed height constraint on product cards (changed from fixed height to auto with min-height)
- Updated border-radius from 8px to 16px for better visual appearance
- Added hover border color state
- Reduced content wrapper padding for better spacing
- Updated button styling with margin-top: auto to push it to bottom
- Changed footer discount message margin-bottom from 12px to 0
- Verified custom CSS is properly connected via api.design-settings.$shopDomain.tsx

Files modified:
- extensions/bundle-builder/assets/bundle-widget-full-page.css

## Files to Modify
- `extensions/bundle-builder/assets/bundle-widget-full-page.css` - Main CSS fixes
- `app/assets/bundle-widget-components.js` - Update ComponentGenerator for variant selector

## Related Documentation
- CLAUDE.md - Project guidelines

### 2026-01-25 01:50 - Completed Build and Commit
- Built widget bundles with `npm run build:widgets`
- Committed changes with proper issue ID prefix
- Pushed to branch `claude/fix-product-card-layout-FzR2o`
- Commit hash: 54d8da9

## Phases Checklist
- [x] Phase 1: Fix variant selector visibility
- [x] Phase 2: Add visible border to product cards
- [x] Phase 3: Fix button cutoff issue
- [x] Phase 4: Remove footer margin
- [x] Phase 5: Verify custom CSS connection
- [x] Phase 6: Build and test
