# Issue: Theme Editor Settings Audit and Fix

**Issue ID:** theme-editor-settings-audit-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-02
**Last Updated:** 2026-02-02 15:15

---

## Overview

Audit of theme editor settings revealed several settings that are defined but not working because CSS variable names don't match or JavaScript doesn't read the data attributes.

## Audit Findings

### PDP Bundle (`bundle-product-page.liquid`)

**BROKEN SETTINGS:**
1. `button_height` → Sets `--button-height` but CSS uses `--bundle-add-to-cart-button-height`
2. `step_tab_border_radius` → Sets `--modal-tab-border-radius` but CSS uses `--bundle-header-tab-radius`

**UNUSED VARIABLES:**
- `success_color` sets `--modal-footer-success-color` and `--footer-text-color` which are never used in CSS

### Full-Page Bundle (`bundle-full-page.liquid`)

**BROKEN SETTINGS:**
1. `show_step_timeline` → `data-show-step-timeline` is set but JavaScript never reads it
2. `show_category_tabs` → `data-show-category-tabs` is set but JavaScript never reads it

---

## Progress Log

### 2026-02-02 15:00 - Starting Fixes

**Planned Changes:**
1. Update `bundle-product-page.liquid` to use correct CSS variable names:
   - `--button-height` → `--bundle-add-to-cart-button-height`
   - `--modal-tab-border-radius` → `--bundle-header-tab-radius`
   - Remove unused `--modal-footer-success-color` and `--footer-text-color`

2. Update `bundle-widget-full-page.js` to read and use:
   - `showStepTimeline` config value
   - `showCategoryTabs` config value

3. Rebuild widget bundles

### 2026-02-02 15:15 - All Fixes Completed

**Files Modified:**

1. `extensions/bundle-builder/blocks/bundle-product-page.liquid`
   - Changed `--button-height` → `--bundle-add-to-cart-button-height` (line 345)
   - Changed `--modal-tab-border-radius` → `--bundle-header-tab-radius` (line 360)
   - Removed unused `--modal-footer-success-color` variable
   - Removed unused `--footer-text-color` variable

2. `app/assets/bundle-widget-full-page.js`
   - Added `showStepTimeline` config parsing from `dataset.showStepTimeline`
   - Added `showCategoryTabs` config parsing from `dataset.showCategoryTabs`
   - Added conditional rendering for step timeline (only renders when `showStepTimeline` is true)
   - Added conditional rendering for category tabs (only renders when `showCategoryTabs` is true)

3. `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
   - Rebuilt with updated logic

**Verification:**
- ✅ PDP liquid file now uses correct CSS variable names
- ✅ Full-page JS now reads and uses showStepTimeline config
- ✅ Full-page JS now reads and uses showCategoryTabs config
- ✅ Widget bundles rebuilt successfully (203.1 KB full-page, 123.9 KB product-page)

---

## Phases Checklist

- [x] Phase 1: Fix PDP liquid file CSS variable names
- [x] Phase 2: Fix Full-Page JS to read show/hide settings
- [x] Phase 3: Rebuild widget bundles
- [x] Phase 4: Verify fixes

---

## Related Files

- `extensions/bundle-builder/blocks/bundle-product-page.liquid`
- `extensions/bundle-builder/blocks/bundle-full-page.liquid`
- `app/assets/bundle-widget-full-page.js`
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
