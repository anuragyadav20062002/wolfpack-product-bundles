# Issue: Widget Asset Files — Bug Fixes & Simplification

**Issue ID:** widget-assets-bugfixes-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-27
**Last Updated:** 2026-02-27 15:00

## Overview
Audit of `app/assets/` (excluding `widgets/shared/` which was already fixed) identified 13 issues across 3 files — 5 critical bugs, 5 high/warn issues, and 3 info-level items.

## Files in Scope
1. `app/assets/bundle-widget-full-page.js`
2. `app/assets/bundle-widget-product-page.js`
3. `app/assets/bundle-modal-component.js`
4. `app/assets/bundle-widget-components.js` (clean barrel file — no changes needed)

## Progress Log

### 2026-02-27 14:00 - Starting audit and fixes
- Full audit completed, 13 issues identified
- Planning fix implementation

### 2026-02-27 15:00 - All fixes implemented

#### Critical Fixes
- ✅ full-page.js: Promo banner now uses `BUNDLE_WIDGET.DISCOUNT_METHODS` constants instead of wrong string literals (`'percentage'` → `'percentage_off'`, etc.)
- ✅ full-page.js: Removed `discountValue * 100` double-conversion (values already in cents from DB)
- ✅ full-page.js: Replaced custom `currencyInfo` object with `CurrencyManager.getCurrencyInfo()`
- ✅ full-page.js: Changed `r.minQuantity` to `r.condition?.value` for discount threshold (correct nested rule structure)
- ✅ modal.js: Removed vestigial `inventory_quantity !== 0` check (Storefront API uses `availableForSale`)

#### XSS Prevention
- ✅ full-page.js: Escaped bundle name, description, promo banner text via `ComponentGenerator.escapeHtml()`
- ✅ full-page.js: Escaped product titles in modal rendering, tile footer, collection tabs, search "no match" message
- ✅ product-page.js: Escaped bundle name, description in header
- ✅ product-page.js: Escaped product titles in modal product card rendering

#### Hardcoded Placeholder URLs
- ✅ full-page.js: Replaced all `via.placeholder.com` URLs with `BUNDLE_WIDGET.PLACEHOLDER_IMAGE`
- ✅ product-page.js: Replaced all `via.placeholder.com` URLs with `BUNDLE_WIDGET.PLACEHOLDER_IMAGE`
- ✅ modal.js: Replaced `via.placeholder.com` URL with `BUNDLE_WIDGET.PLACEHOLDER_IMAGE`

#### Other
- ✅ modal.js: Changed `parseFloat()` price comparison to `Number()` for integer cents

### Verification
- ✅ ESLint: 0 errors (files in .eslintignore, warnings only)
- ✅ Widget build: Both bundles built successfully (211.6KB + 122.2KB)
- ✅ Tests: 283 passed, 18 pre-existing failures (not caused by these changes)

## Files Modified
1. `app/assets/bundle-widget-full-page.js`
2. `app/assets/bundle-widget-product-page.js`
3. `app/assets/bundle-modal-component.js`
4. `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` (rebuilt)
5. `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` (rebuilt)

## Phases Checklist
- [x] Audit all files
- [x] Fix critical bugs
- [x] Fix XSS vulnerabilities
- [x] Replace hardcoded URLs
- [x] Lint check
- [x] Widget build
- [x] Test run
