# Issue: Shared Widget Components — Bug Fixes & Simplification

**Issue ID:** shared-widget-bugfixes-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-27
**Last Updated:** 2026-02-27 12:30

## Overview
Full audit of `app/assets/widgets/shared/` identified 19 issues across 10 files — 6 critical bugs, 8 high/warn issues, and 5 info-level items.

## Progress Log

### 2026-02-27 12:00 - Starting all fixes
- Audit completed, plan approved
- Fixing all 19 items across 3 phases

### 2026-02-27 12:15 - Phase 1 Complete (Critical Fixes)
- ✅ template-manager.js: Fixed replacement order (double-brace first via combined regex)
- ✅ pricing-calculator.js: Fixed `.sort()` mutation with spread copy
- ✅ currency-manager.js: Added `rate: 1` to fallback, added `console.warn` to catch
- ✅ bundle-data-manager.js: Throw on invalid bundleType instead of empty else
- ✅ default-loading-animation.js: Added `export` keyword, re-exported from index.js

### 2026-02-27 12:20 - Phase 2 Complete (High/Warn Fixes)
- ✅ pricing-calculator.js: Simplified variant price to `Number()` (all cents in pipeline)
- ✅ pricing-calculator.js: Clamped `discountAmount` to `totalPrice`
- ✅ bundle-data-manager.js: `selectBundle` now includes `'published'` status
- ✅ component-generator.js + toast-manager.js: Added `escapeHtml` for XSS prevention
- ✅ bundle-data-manager.js: Removed silent `bundles[0]` fallback, returns null + warns
- ✅ component-generator.js: Removed redundant `=== null` check
- ✅ template-manager.js: Added warning for missing discount values
- ✅ toast-manager.js: Replaced inline `onclick` with `addEventListener`

### 2026-02-27 12:25 - Phase 3 Complete (Info Items)
- ✅ condition-validator.js: Added comment explaining IIFE pattern divergence
- ✅ template-manager.js: Combined to single regex pass per variable
- ✅ constants.js + component-generator.js: Extracted `PLACEHOLDER_IMAGE` constant
- ✅ bundle-data-manager.js: Added `window.Shopify?.designMode`, removed `window.parent !== window`
- ✅ index.js: Added note about ConditionValidator's separate import path

### 2026-02-27 12:30 - Verification
- ✅ ESLint: 0 errors (files in .eslintignore, warnings only)
- ✅ Widget build: Both bundles built successfully (211.3KB + 122.1KB)
- ✅ Tests: 81 passed, 3 pre-existing failures (not caused by these changes)

## Files Modified
1. `app/assets/widgets/shared/template-manager.js`
2. `app/assets/widgets/shared/pricing-calculator.js`
3. `app/assets/widgets/shared/currency-manager.js`
4. `app/assets/widgets/shared/bundle-data-manager.js`
5. `app/assets/widgets/shared/default-loading-animation.js`
6. `app/assets/widgets/shared/index.js`
7. `app/assets/widgets/shared/component-generator.js`
8. `app/assets/widgets/shared/toast-manager.js`
9. `app/assets/widgets/shared/constants.js`
10. `app/assets/widgets/shared/condition-validator.js`
11. `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` (rebuilt)
12. `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` (rebuilt)

## Phases Checklist
- [x] Phase 1: Critical fixes (#1-6)
- [x] Phase 2: High/Warn fixes (#7-14)
- [x] Phase 3: Info items (#15-19)
- [x] Lint check
- [x] Widget build
- [x] Test run
