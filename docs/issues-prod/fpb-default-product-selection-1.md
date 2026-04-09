# Issue: FPB Default Product Selection — Grid, Footer & Tab UX

**Issue ID:** fpb-default-product-selection-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-04-09
**Last Updated:** 2026-04-09 17:00

## Overview
When a step is configured as a default step (`isDefault: true`, `defaultVariantId` set), the pre-selected
product is only shown on the step tab count ("1 selected") but NOT in the product grid, NOT in the footer,
and the user CAN remove it via the footer. Root cause: variant ID format mismatch in `_initDefaultProducts()`.

Also: default step tabs have no visual distinction, and the step is incorrectly locked when previous steps
are incomplete.

## Root Cause (confirmed via Chrome DevTools)

`_initDefaultProducts()` stores: `selectedProducts[1]["gid://shopify/ProductVariant/52734772805926"] = 1`

`processProductsForStep()` builds card variantId via `extractId()` → `"52734772805926"` (numeric only)

Key mismatch → `currentQuantity = 0` → card appears unselected; `getAllSelectedProductsData()` can't find the
product → footer shows "0 Products" with wrong total.

## Progress Log

### 2026-04-09 16:30 - Phase 1 Completed
- ✅ Fixed ID normalization in `_initDefaultProducts()`: now uses `this.extractId()` to store numeric key, matching the key produced by `processProductsForStep()`. Fixes the root cause — default product now appears selected in the grid.
- ✅ Made default steps always accessible in `isStepAccessible()`: early return `if (steps[stepIndex]?.isDefault) return true` so the tab is never locked even when previous steps are incomplete.
- ✅ Added "Included" tab styling: default step tabs get `step-tab--included` class, dashed border, "Included" green badge, green lock icon, product images shown.
- ✅ Added read-only product card behavior: `createProductCard()` adds `fpb-card--default-included` class + "Included" badge; `attachProductCardListeners()` early-returns for default steps (no add/remove/qty interaction).
- ✅ Fixed footer count: removed `filter(p => !p.isDefault)` from both the toggle text count and the CTA `hasSelection` check so default products are included.
- ✅ Added CSS for all new classes (`.step-tab--included`, `.tab-count--included`, `.tab-lock--included`, `.fpb-card--default-included`, `.fpb-included-badge`).
- ✅ Rebuilt: `npm run build:widgets` — 256.5 KB FPB bundle. CSS 95,859 B (under 100 KB limit).
- ✅ Lint: 0 errors.
- Files Modified:
  - `app/assets/bundle-widget-full-page.js` (lines ~1257, ~1672, ~1906, ~1975, ~1195, ~2314, ~3850)
  - `extensions/bundle-builder/assets/bundle-widget-full-page.css` (lines ~4156 — new section)
  - `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` (rebuilt)
- Next: Deploy to SIT, verify via Chrome DevTools

## Phases Checklist
- [x] Phase 1: Fix ID mismatch + accessibility + tab UX + card UX + footer count ✅
- [x] Phase 2: Deploy + verified by merchant ✅

### 2026-04-09 17:00 - All Phases Completed

**Total Commits:** 1
**Files Modified:** 3

**Status:** Completed
