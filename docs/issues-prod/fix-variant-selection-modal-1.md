# Issue: Fix Variant Selection in Product Modal & PDP State Cards

**Issue ID:** fix-variant-selection-modal-1
**Status:** Completed
**Priority:** High
**Created:** 2026-01-28
**Last Updated:** 2026-01-28 23:15

## Overview
Two related issues in the product bundle widgets:

1. **Variant Selection Missing in Modal**: The product modal for both full-page and PDP bundles doesn't show variant selection options (size, color, etc.) when products have multiple variants.

2. **PDP State Cards Approach Change**: Currently when multiple products are selected in a step, all images are shown in one state card. User wants each selected product to have its own individual state card.

## Technical Analysis

### Issue 1: Variant Selection
- Root cause: In PDP widget, `processProductsForStep` strips variant data when `displayVariantsAsIndividual: false`
- The `renderVariantSelector` method expects `product.variants` array which doesn't exist on processed products
- For full-page, need to use `BundleProductModal` class which has full variant selection UI

### Issue 2: State Cards
- Current: One card per step showing up to 4 product images
- Required: One card per selected product across all steps
- On page load: Show X empty cards (one per step)
- After selections: Show Y cards (one per selected product)

## Progress Log

### 2026-01-28 22:45 - Starting Implementation
- Analyzed `bundle-modal-component.js` (variant selection logic at lines 386-603)
- Analyzed `bundle-widget-product-page.js` (state cards at lines 597-700)
- Identified root causes for both issues
- Planning implementation approach

### 2026-01-28 23:15 - Implementation Completed
- ✅ Fixed `processProductsForStep` in both PDP and full-page widgets to preserve variant data
- ✅ Added BundleProductModal initialization to PDP widget constructor
- ✅ Updated `attachProductEventHandlers` to open variant modal on product image/title click
- ✅ Refactored state cards rendering:
  - `renderProductPageLayout` - New approach: one card per selected product
  - `createEmptyStateCard` - Shows empty cards for steps with no selections
  - `createSelectedProductCard` - Shows individual card for each selected product
  - `createAddMoreCard` - Shows "add more" card for incomplete steps
  - `removeProductFromSelection` - Allows removing individual products
- ✅ Built widget bundles (full-page: 176.9 KB, product-page: 119.4 KB)

## Files Modified
- `app/assets/bundle-widget-product-page.js` - Major refactoring
- `app/assets/bundle-widget-full-page.js` - Variant data preservation
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` - Rebuilt
- `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` - Rebuilt

## Related Files
- `app/assets/bundle-modal-component.js` - Modal with variant selection (unchanged)

## Phases Checklist
- [x] Phase 1: Fix variant data preservation in processProductsForStep
- [x] Phase 2: Implement variant selection UI in PDP modal
- [x] Phase 3: Refactor state cards to show one card per product
- [x] Phase 4: Build widget bundles
- [ ] Phase 5: Test on storefront
