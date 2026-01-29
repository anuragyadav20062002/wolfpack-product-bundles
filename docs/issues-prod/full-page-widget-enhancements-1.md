# Issue: Full-Page Bundle Widget Enhancements

**Issue ID:** full-page-widget-enhancements-1
**Status:** Complete - Ready for Testing
**Priority:** 🟡 Medium
**Created:** 2026-01-28
**Last Updated:** 2026-01-29 01:15

## Overview

Six requirements to enhance the full-page bundle widget. Two features are already complete (variant selector and image carousel), four require implementation: multi-variant selection, promo banner persistence fix, price z-index fix, and footer scrollbar with grid layout.

## Requirements

### Completed (Verification Only)
1. ✅ **Variant selector in modal** - Already implemented in issue `fix-variant-selection-modal-1`
2. ✅ **Image carousel in modal** - Already implemented in issue `fix-variant-selection-modal-1`

### To Implement
3. 🐛 **Price z-index fix** (Req 5) - Price obscured by overlay when product card selected
4. 🐛 **Promo banner save bug** (Req 4) - Settings don't persist after save
5. ✨ **Footer scrollbar** (Req 6) - Max 4 products visible with scrollbar for overflow
6. 🎨 **Multi-variant selection** (Req 3) - Allow buying multiple variants of same product

## Progress Log

### 2026-01-29 01:15 - Additional Bug Fixes
- ✅ Fixed promo banner not syncing from DCP to storefront
  - Added promoBannerSettings extraction in `api.design-settings.$shopDomain.tsx`
- ✅ Fixed bundle title flash before banner loads
  - Added early `hidePageTitle()` call in `init()` before async operations
- ✅ Fixed variant selector not working when displayVariantsAsIndividual is enabled
  - Updated `processProductsForStep()` to preserve parent product data (variants, options, parentProductId, parentTitle, images, description)
  - Updated modal's `populateModal()` to use parentTitle if available
  - Updated modal's `createVariantSelectors()` to pre-select current variant's options
- ✅ Rebuilt widget bundles (185.8 KB full-page, 119.4 KB product-page)
- Files modified: 4 files
  - `/app/routes/api.design-settings.$shopDomain.tsx`
  - `/app/assets/bundle-widget-full-page.js`
  - `/app/assets/bundle-modal-component.js`
  - `/extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`

### 2026-01-29 00:30 - All Phases Complete
- ✅ Phase 1: Completed price z-index fix and promo banner persistence
- ✅ Phase 2: Implemented footer 4-column grid with scrollbar
- ✅ Phase 3: Implemented multi-variant selection UX
- ✅ Built all widget bundles successfully
- Files modified: 5 files (CSS, JS, TSX, Prisma schema, merge settings)
- Next: Commit changes and test in storefront

### 2026-01-28 23:45 - Started Issue Tracking
- Created issue file for full-page widget enhancements
- Set up todo list with 8 tasks across 4 phases
- Began Phase 1 implementation

## Files to Modify

### Phase 1: Quick Wins
- `/extensions/bundle-builder/assets/bundle-widget-full-page.css` - Price z-index fix
- `/app/routes/app.design-control-panel.tsx` - Promo banner field persistence

### Phase 2: Footer Grid
- `/app/assets/bundle-widget-full-page.js` - Footer grid container HTML
- `/extensions/bundle-builder/assets/bundle-widget-full-page.css` - Grid layout and scrollbar

### Phase 3: Multi-Variant
- `/app/assets/bundle-modal-component.js` - Existing variant detection and notice
- `/app/assets/bundle-widget-full-page.js` - Multi-variant footer display and breakdown popup
- `/extensions/bundle-builder/assets/bundle-widget-full-page.css` - Multi-variant styles

### Phase 4: Verification
- Verify modal features in `/app/assets/bundle-modal-component.js`

### Build Output
- `/extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` - Regenerated after JS changes

## Phases Checklist

- [x] Phase 1: Quick Wins (30 min)
  - [x] Fix price z-index issue
  - [x] Fix promo banner save bug
  - [x] Remove price container styling (additional fix)
- [x] Phase 2: Footer Enhancement (60 min)
  - [x] Changed footer to CSS grid layout
  - [x] Implement scrollbar with max 4 products visible
  - [x] Add responsive behavior (4→3→2 columns)
- [x] Phase 3: Multi-Variant Selection (3-4 hours)
  - [x] Add existing variant detection in modal
  - [x] Modify footer to display multiple variants
  - [x] Create variant breakdown popup
  - [x] Add all required CSS styles
- [ ] Phase 4: Verification (15 min)
  - [ ] Test modal variant selector
  - [ ] Test image carousel
  - [ ] Verify all features work together
- [x] Build and Test
  - [x] Run npm run build:widgets
  - [ ] Test in storefront
  - [ ] Verify no console errors

## Related Documentation
- Implementation plan: `.claude/plans/graceful-marinating-wozniak.md`
- Modal implementation: `docs/issues-prod/fix-variant-selection-modal-1.md`
- Promo banner feature: `docs/issues-prod/full-page-promo-banner-1.md`

## Testing Strategy

### Per-Requirement Testing
- **Price z-index:** Select product, verify price visible
- **Promo banner:** Enable, save, reload, verify persists
- **Footer scrollbar:** Add 5+ products, verify scrollbar appears
- **Multi-variant:** Add multiple variants, verify footer displays correctly, test breakdown popup
- **Modal features:** Verify variant selector and carousel work

### Integration Testing
- Complete user journey from product selection to checkout
- Test with different product types (1 variant, many variants, no images, many images)
- Test on different screen sizes (desktop, tablet, mobile)
- Browser testing: Chrome, Safari, Mobile Safari, Chrome Mobile

## Success Criteria
- [ ] Price visible on selected product cards
- [ ] Promo banner settings persist after save
- [ ] Footer shows max 4 products per row with scrollbar
- [ ] Users can add multiple variants of same product
- [ ] Footer displays multi-variant products correctly
- [ ] Variant breakdown popup works
- [ ] Modal variant selector and carousel verified
- [ ] All changes tested on mobile
- [ ] No console errors
- [ ] Widgets built and deployed
