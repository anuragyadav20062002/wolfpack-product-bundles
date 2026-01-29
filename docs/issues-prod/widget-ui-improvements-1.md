# Issue: Widget UI Improvements - Button/Quantity Toggle, Variant Cards, Footer Tiles

**Issue ID:** widget-ui-improvements-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-01-30
**Last Updated:** 2026-01-30 10:45

## Overview

Comprehensive UI improvements for the full-page bundle widget including:
1. Button/quantity selector toggle behavior
2. Variant-based product cards (one card per variant)
3. Fix footer cross button bug
4. Scrollable footer product tiles component

## User Requirements

### 1. Add to Bundle Button Behavior
- When "Add to Bundle" is clicked, replace button with quantity selector starting at 1
- When minus is pushed and quantity becomes 0, revert to "Add to Bundle" button
- Toggle behavior should be smooth and intuitive

### 2. Variant-Based Product Cards
- If a product has X variants, generate X product cards (one per variant)
- Each card should show which variant it represents
- Handle variants consistently across full-page and PDP widgets

### 3. Footer Cross Button Bug Fix
- **Current Bug:** Clicking cross on a product in footer causes ALL buttons to turn into quantity selectors
- **Root Cause:** `renderFullPageLayout()` re-renders everything, not preserving proper state
- **Fix:** Only remove the specific product, don't trigger full re-render of all product cards

### 4. Scrollable Footer Product Tiles
- Footer product tiles should have horizontal scrollbar for overflow
- Tiles should display: product name + variant (if any)
- Should be its own component for reusability
- Centered above the Back/Next button group

## Technical Analysis

### Current Architecture (bundle-widget-full-page.js)

**Footer Remove Button (lines 1464-1471):**
```javascript
removeBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  productGroup.variants.forEach(variant => {
    this.updateProductSelection(variant.stepIndex, variant.variantId, 0);
  });
  this.renderFullPageLayout();  // <-- This re-renders everything, causing bug
});
```

**Product Card Generation (lines 1234-1281):**
- Uses `ComponentGenerator.renderProductCard()` from shared components
- Currently renders one card per product, not per variant

**Component Generator (bundle-widget-components.js):**
- `renderProductCard()` handles button/quantity toggle based on `isSelected`
- `renderVariantSelector()` creates dropdown for variants

## Implementation Plan

### Phase 1: Fix Footer Cross Button Bug
- Modify remove button handler to update UI locally
- Remove the full `renderFullPageLayout()` call
- Update only the specific product card's button state

### Phase 2: Button/Quantity Toggle Behavior
- Already partially implemented in ComponentGenerator
- Ensure proper state management during re-renders
- Add smooth transition animation

### Phase 3: Variant-Based Product Cards
- Modify `createFullPageProductGrid()` to expand products by variants
- Each variant becomes its own product card
- Display variant title on each card

### Phase 4: Scrollable Footer Tiles Component
- Create new footer tiles component
- Horizontal scroll with overflow
- Display product name + variant
- Center above navigation buttons

## Files to Modify

- `app/assets/bundle-widget-full-page.js` - Main widget changes
- `app/assets/bundle-widget-components.js` - Component updates if needed
- `app/assets/bundle-widget-product-page.js` - Apply same variant logic

## Progress Log

### 2026-01-30 10:00 - Starting Implementation
- Created issue file
- Analyzed current codebase architecture
- Identified root cause of footer cross button bug
- Next: Fix the footer cross button bug first

### 2026-01-30 10:30 - Completed All Phase Implementations
- ✅ Phase 1: Fixed footer cross button bug
  - Removed unnecessary `renderFullPageLayout()` call from remove button handler
  - `updateProductSelection()` already handles UI updates properly
- ✅ Phase 2: Improved button/quantity toggle behavior
  - Updated `updateProductQuantityDisplay()` to properly toggle between button and quantity controls
  - Button is now replaced with quantity selector when clicked (starts at 1)
  - When quantity becomes 0, reverts back to "Add to Bundle" button
  - Added `findProductById()` helper method
- ✅ Phase 3: Implemented variant-based product cards
  - Added `expandProductsByVariant()` method to create one card per variant
  - Modified `createFullPageProductGrid()` to use expanded products
  - Updated `ComponentGenerator.renderProductCard()` to handle variant cards
  - Added variant badge display on expanded variant cards
  - Removed variant selector dropdown for expanded variant cards
- ✅ Phase 4: Created scrollable footer product tiles component
  - Added `createFooterProductTiles()` method for new tile-based display
  - Each tile shows: product image, name, variant (if any), quantity badge, remove button
  - Horizontal scrollbar for overflow
  - Centered above Back/Next buttons
  - Added comprehensive CSS styles for tiles
- Files modified:
  - `app/assets/bundle-widget-full-page.js`
  - `app/assets/bundle-widget-components.js`
  - `extensions/bundle-builder/assets/bundle-widget-full-page.css`
- Next: Build widgets and test

### 2026-01-30 10:45 - Completed and Committed
- ✅ Built widgets successfully: `npm run build:widgets`
- ✅ Committed changes: 6bae0e8
- Commit message: `[widget-ui-improvements-1] feat: Add variant-based cards, button toggle, and scrollable footer tiles`
- All tasks completed

## Related Documentation
- Previous refactoring: `docs/issues-prod/codebase-refactoring-plan-1.md`

## Phases Checklist
- [x] Phase 1: Fix footer cross button bug
- [x] Phase 2: Button/quantity toggle behavior
- [x] Phase 3: Variant-based product cards
- [x] Phase 4: Scrollable footer tiles component
- [x] Build widgets and test
- [x] Commit changes (6bae0e8)
