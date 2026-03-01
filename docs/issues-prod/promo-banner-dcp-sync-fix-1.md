# Issue: Promo Banner Not Syncing with DCP - Shows Bundle Name Instead of Discount

**Issue ID:** promo-banner-dcp-sync-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-01-29
**Last Updated:** 2026-01-29 10:35

## Overview

The promo banner is showing the bundle name ("WASD") instead of syncing properly with DCP settings and discount configuration. When discount is not enabled or no rules exist, the promo banner should NOT display, but currently it falls back to showing the bundle name as a hero banner.

### Expected Behavior
1. If promo banner is disabled in DCP → No banner shown
2. If promo banner is enabled AND discount is enabled with rules → Show discount promo message
3. If promo banner is enabled BUT no discount configured → No banner shown (nothing to promote)

### Actual Behavior
- Promo banner shows bundle name "WASD" even when no discount is configured
- This happens because the fallback logic at line 1036-1041 in `bundle-widget-full-page.js` shows bundle name when no discount info is available

## Root Cause Analysis

In `app/assets/bundle-widget-full-page.js`, the `createPromoBanner()` function:

1. Checks if `promoBannerEnabled === '0'` (DCP setting) - if disabled, returns null ✅
2. Tries to build promo title from discount rules (`pricing?.enabled && rules.length > 0`) ✅
3. **BUG**: Falls back to showing bundle name when no promo title was built ❌

```js
// Lines 1036-1041 - THE PROBLEM
if (!promoTitle) {
  promoTitle = this.selectedBundle?.name || 'Build Your Bundle';
  promoSubtitle = '';
  promoNote = '';
}
```

## Solution

Remove the fallback to bundle name. If no discount promo title was built and no custom banner message exists, return `null` to hide the promo banner entirely.

## Files to Modify

1. `app/assets/bundle-widget-full-page.js` - Fix promo banner logic
2. `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` - Rebuild bundle

## Progress Log

### 2026-01-29 10:30 - Starting Fix
- Analyzed the issue: promo banner showing "WASD" (bundle name) instead of discount info
- Found root cause in `createPromoBanner()` function
- The fallback logic incorrectly shows bundle name when no discount is configured
- Fix: Return null when no discount promo is available

### 2026-01-29 10:35 - Fix Completed
- Modified `app/assets/bundle-widget-full-page.js` lines 1036-1041
- Removed fallback to bundle name when no discount is configured
- Now returns `null` (no banner) when no discount promo title was built
- Rebuilt widget bundle: `npm run build:widgets:full-page`
- Files changed:
  - `app/assets/bundle-widget-full-page.js`
  - `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`

## Related Documentation

- DCP Settings: `app/components/design-control-panel/settings/PromoBannerSettings.tsx`
- CSS Variables: `app/lib/css-generators/css-variables-generator.ts`
- Default Settings: `app/components/design-control-panel/config/defaultSettings.ts`

## Phases Checklist

- [x] Phase 1: Analyze issue and identify root cause
- [x] Phase 2: Fix promo banner logic in widget JS
- [x] Phase 3: Rebuild widget bundle
- [ ] Phase 4: Test in storefront
