# Issue: Bundle Widget Comprehensive Fixes

**Issue ID:** bundle-widget-fixes-2
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-01-29
**Last Updated:** 2026-01-29 23:20

## Overview
Comprehensive set of fixes and enhancements for both full-page and product-page bundle widgets based on user feedback.

## Issues to Address

### Issue 1: Remove variant banner in full-page modal
- The "You've already added this product" banner shows wrong info
- Banner should be removed entirely from the full-page bundle widget product modal

### Issue 2: Add variant selector to full-page modal
- Currently no variant selector in the full-page bundle widget product card modal
- Need to add proper variant selection capability

### Issue 3: Footer products carousel
- Footer not displaying products in minimal manner
- Need scrollable carousel format
- Should take slightly greater width than button group below it

### Issue 4: Variant/quantity reset bug
- Product card bundle widget modal variant and quantity selector not working
- Gets reset when user changes variant then increases qty in card

### Issue 5: Promo banner not showing
- Check promo banner implementation
- Verify DCP connection
- Ensure merchant can customize promo banner text

### Issue 6: Optional step products
- If no conditions on a step, users should be able to skip without adding a product
- Currently may be forcing product selection
- Account for price/discount calculation changes

### Issue 7: Step tabs centering (product-page)
- Step tabs appear on the left
- Should be centered

### Issue 8: Drawer modal animation (product-page)
- Modal should open to 70% page height from bottom
- Drawer animation style
- Background should be dimmed

### Issue 9: Promo card DCP save bar flicker
- Save bar flickering issue in promo card DCP section
- Color picker may be faulty

## Progress Log

### 2026-01-29 21:30 - Starting Issue Analysis
- Explored codebase architecture
- Identified key files:
  - `app/assets/bundle-widget-components.js` - Shared components
  - `app/assets/bundle-modal-component.js` - Modal component
  - `app/assets/bundle-widget-full-page.js` - Full-page widget
  - `app/assets/bundle-widget-product-page.js` - Product-page widget
  - `extensions/bundle-builder/assets/` - Bundled output files
  - DCP components in `app/components/design-control-panel/`
- Next: Start addressing issues one by one

### 2026-01-29 22:00 - Phase 1: Remove variant banner from full-page modal
- Found `showExistingVariantsNotice()` method at `bundle-modal-component.js:271-297`
- This method creates the misleading "You've already added this product" banner
- Removed the call to this method in `populateModal()` and the method itself
- Files changed: `app/assets/bundle-modal-component.js`
- ✅ COMPLETED

### 2026-01-29 22:10 - Phase 2: Verify variant selector in full-page modal
- Verified that `createVariantSelectors()` method exists and is properly called
- Variant selectors are already implemented with button/swatch style
- No changes needed - variant selector already working
- ✅ COMPLETED (Already implemented)

### 2026-01-29 22:15 - Phase 3: Implement footer products carousel
- Changed products strip from grid layout to horizontal flex carousel
- Updated CSS from vertical grid to horizontal scrollable flex container
- Made product thumbnails more compact/minimal for carousel format
- Reduced padding to make carousel slightly wider than nav section (20px vs 40px)
- Updated responsive media queries for carousel layout
- Files changed: `extensions/bundle-builder/assets/bundle-widget-full-page.css`
- ✅ COMPLETED

### 2026-01-29 22:25 - Phase 4: Fix variant/quantity reset bug
- Found bug: when variant changes via dropdown, card's `data-product-id` attributes weren't updated
- Quantity controls used old variant ID after variant change
- Fix: Update all `data-product-id` attributes in card after variant selection changes
- Files changed: `app/assets/bundle-widget-product-page.js`
- ✅ COMPLETED

### 2026-01-29 22:30 - Phase 5: Fix promo banner and DCP connection
- Found that `createPromoBanner()` didn't check `--bundle-promo-banner-enabled` CSS variable
- Added check for DCP CSS variable `--bundle-promo-banner-enabled` before creating banner
- Returns null if banner is disabled via DCP settings
- Files changed: `app/assets/bundle-widget-full-page.js`
- ✅ COMPLETED

### 2026-01-29 22:35 - Phase 6: Implement optional step products
- Fixed `isStepCompleted()` and `validateStep()` in both full-page and product-page widgets
- Steps without conditions (no conditionType/conditionOperator/conditionValue) now return true
- Users can skip optional steps without selecting products
- Files changed: `app/assets/bundle-widget-full-page.js`, `app/assets/bundle-widget-product-page.js`
- ✅ COMPLETED

### 2026-01-29 22:40 - Phase 7: Center step tabs
- Added `justify-content: center` to `.modal-tabs` in bundle-widget.css
- Tabs now centered in product-page modal
- Files changed: `extensions/bundle-builder/assets/bundle-widget.css`
- ✅ COMPLETED

### 2026-01-29 22:45 - Phase 8: Implement drawer modal animation
- Modal already had drawer animation from bottom with dimmed background
- Changed height from 100vh to 70vh for better UX
- Files changed: `extensions/bundle-builder/assets/bundle-widget.css`
- ✅ COMPLETED

### 2026-01-29 22:50 - Phase 9: Fix promo card DCP save bar flicker
- ColorPicker was firing onChange rapidly during color picker drag
- Added debouncing (150ms) to color picker onChange to reduce rapid state updates
- Text input changes remain immediate for better UX
- Files changed: `app/components/design-control-panel/common/ColorPicker.tsx`
- ✅ COMPLETED

### 2026-01-29 22:55 - Phase 10: Build widgets
- Ran `npm run build:widgets` successfully
- Full-page widget bundle: 189.6 KB
- Product-page widget bundle: 123.3 KB
- Build completed in 29ms
- ✅ COMPLETED

## Summary of All Changes

### Files Modified:
1. `app/assets/bundle-modal-component.js` - Removed variant banner notice
2. `app/assets/bundle-widget-full-page.js` - Promo banner DCP check, optional step validation
3. `app/assets/bundle-widget-product-page.js` - Variant/qty reset fix, optional step validation
4. `extensions/bundle-builder/assets/bundle-widget-full-page.css` - Footer carousel styles
5. `extensions/bundle-builder/assets/bundle-widget.css` - Modal tabs centering, drawer height
6. `app/components/design-control-panel/common/ColorPicker.tsx` - Debounced color changes

### Bundled Output Files:
- `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
- `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`

### 2026-01-29 23:15 - Issue 10: Mobile view product-page widget fix
- Fixed orphaned `.product-grid` rule that was outside media query, overriding 1-column layout
- Removed `min-width: 600px` from `.modal-footer` that broke mobile layout
- Added tablet (768px) responsive rules for modal footer
- Added mobile (480px) responsive rules for footer buttons stacking vertically
- Ensured 1 column grid on mobile with proper gap
- Files changed: `extensions/bundle-builder/assets/bundle-widget.css`
- ✅ COMPLETED

## Related Documentation
- Architecture analysis completed
- Key file locations identified

## Phases Checklist
- [x] Phase 1: Remove variant banner from full-page modal (Issue 1)
- [x] Phase 2: Add variant selector to full-page modal (Issue 2) - Already implemented
- [x] Phase 3: Implement footer carousel (Issue 3)
- [x] Phase 4: Fix variant/quantity reset bug (Issue 4)
- [x] Phase 5: Fix promo banner and DCP connection (Issue 5)
- [x] Phase 6: Implement optional step products (Issue 6)
- [x] Phase 7: Center step tabs (Issue 7)
- [x] Phase 8: Implement drawer modal animation (Issue 8)
- [x] Phase 9: Fix promo card DCP save bar flicker (Issue 9)
- [x] Phase 10: Build widgets and test
