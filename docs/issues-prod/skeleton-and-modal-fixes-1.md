# Issue: Skeleton Loading & Product Card Modal Fixes

**Issue ID:** skeleton-and-modal-fixes-1
**Status:** Completed
**Priority:** High
**Created:** 2026-01-16
**Last Updated:** 2026-01-16 10:00

## Overview

Two main fixes required:
1. Update loading skeleton for product cards to be solid pulsating cards without button skeletons inside (both widget types)
2. Fix product card modal not opening when clicking on product cards in full-page bundle widget

## Requirements

### 1. Loading Skeleton Update
- Skeleton cards should appear as solid pulsating blocks
- Remove internal skeleton elements (buttons, quantity selectors)
- Apply to both full-page and product-page widgets
- Maintain consistent card dimensions during loading

### 2. Product Card Modal Fix
- Modal should open when clicking anywhere on the product card (image, title, or card body)
- Modal should display: title, description, price, quantity selector, main photo, photo gallery
- Add DCP settings for quantity selector visibility (product card and modal)
- Clicking quantity buttons should NOT open modal (just adjust quantity)

## Progress Log

### 2026-01-16 10:00 - Starting Implementation
- Analyzed existing codebase
- Identified files to modify:
  - `app/assets/bundle-widget-full-page.js` (skeleton + click handlers)
  - `app/assets/bundle-widget-product-page.js` (skeleton)
  - `app/assets/bundle-widget-components.js` (product card rendering)
  - `app/assets/bundle-modal-component.js` (modal component)
- Next: Implement skeleton changes

### 2026-01-16 10:30 - Completed Implementation
- Updated loading skeleton to solid pulsating cards (both widgets)
  - Removed internal button/quantity skeletons
  - Added smooth pulsating animation effect
- Fixed product card modal opening on click
  - Added click handlers for product image and title
  - Modal now opens when clicking anywhere on the card (except quantity buttons)
  - Fixed step lookup in event handlers
- Added DCP settings for quantity selector visibility
  - `showQuantitySelectorOnCard` config option (both widgets)
  - `showQuantitySelectorInModal` config option (full-page widget)
  - Updated ComponentGenerator.renderProductCard to accept options
  - Updated modal to conditionally show quantity section
- Files modified:
  - `app/assets/bundle-widget-full-page.js`
  - `app/assets/bundle-widget-product-page.js`
  - `app/assets/bundle-widget-components.js`
  - `app/assets/bundle-modal-component.js`
- Next: Build widget bundles

## Files to Modify

1. `app/assets/bundle-widget-full-page.js`
   - Update `createProductGridLoadingState()` method
   - Add product card click handler for modal opening

2. `app/assets/bundle-widget-product-page.js`
   - Update `renderModalProductsLoading()` method

3. `app/assets/bundle-widget-components.js`
   - Update `renderProductCard()` to accept stepId parameter
   - Add data-step-id to product cards and buttons

4. `app/assets/bundle-modal-component.js`
   - Ensure modal displays all required info (already has title, description, price, quantity, images)

## Phases Checklist

- [x] Phase 1: Update loading skeleton (solid pulsating cards)
- [x] Phase 2: Fix product card click handler for modal
- [x] Phase 3: Add DCP settings for quantity selector
- [x] Phase 4: Build widget bundles and test

## Related Documentation
- CLAUDE.md (widget build process)
- docs/FULL_PAGE_DESIGN_GAP_ANALYSIS.md
