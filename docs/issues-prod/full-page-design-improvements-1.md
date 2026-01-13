# Issue: Full-Page Design Improvements

**Issue ID:** full-page-design-improvements-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** January 13, 2026
**Last Updated:** January 13, 2026 14:54

## Overview
Transform full-page bundle widget to match professional design from Dolphin & Dog reference screenshots.

## Progress Log

### January 13, 2026 14:30 - Planning Complete
- ✅ Analyzed current full-page bundle widget implementation
- ✅ Reviewed DCP documentation and CSS architecture
- ✅ Examined CSS connection patterns (dynamic CSS from DCP)
- ✅ Analyzed Dolphin & Dog reference screenshots
- ✅ Identified design gaps and required improvements
- ✅ Created comprehensive documentation:
  - `docs/FULL_PAGE_DESIGN_GAP_ANALYSIS.md`
  - `docs/FULL_PAGE_IMPLEMENTATION_PLAN_2026.md`
  - Plan file at `.claude/plans/graceful-marinating-wozniak.md`

### January 13, 2026 14:47 - Phase 0: Issue Tracking Setup
- ✅ Created issue tracking folder structure: `docs/issues-prod/`
- ✅ Created this issue file: `full-page-design-improvements-1.md`
- ✅ Created CLAUDE.md with mandatory guidelines
- ✅ Established commit message format: `[issue-id] type: description`
- Files Created:
  - `docs/issues-prod/full-page-design-improvements-1.md`
  - `CLAUDE.md`
- Next: Commit the setup, then begin Phase 1

### January 13, 2026 14:50 - Phase 1: Fixed Card Dimensions Started
- ⏳ Starting Phase 1 implementation
- Will modify: `extensions/bundle-builder/assets/bundle-widget-full-page.css`
- Goal: Change grid from `1fr` to fixed pixel widths
- Target: Cards maintain 280px×420px regardless of cards-per-row setting

### January 13, 2026 14:52 - Phase 1: Fixed Card Dimensions Completed
- ✅ Updated `.full-page-product-grid` CSS:
  - Changed from `1fr` to fixed `var(--bundle-product-card-width, 280px)`
  - Added `justify-content: center` for grid centering
  - Added `overflow-x: auto` for horizontal scroll fallback
  - Made gap customizable via CSS variable
- ✅ Updated `.product-card` CSS:
  - Added fixed width/height: 280px × 420px
  - Set min-width, max-width, min-height, max-height for consistency
  - Added `overflow: hidden` to prevent content overflow
- Files Modified:
  - `extensions/bundle-builder/assets/bundle-widget-full-page.css` (lines 274-296)
- Result: Product cards now maintain fixed dimensions regardless of cards-per-row setting
- Next: Commit changes, then begin Phase 2 (Configurable Spacing)

### January 13, 2026 14:54 - Phase 2: Configurable Spacing Started
- ⏳ Adding Theme Editor settings for card spacing
- Will modify:
  - `extensions/bundle-builder/blocks/bundle-full-page.liquid` (add range slider to schema)
  - `app/assets/bundle-widget-full-page.js` (read and apply spacing setting)
- Goal: Allow merchants to control card spacing (10-60px) directly in Theme Editor
- Target: Replace hardcoded 20px gap with user-configurable setting
- Next: Update Liquid schema

### January 13, 2026 15:05 - Phase 2: Configurable Spacing Completed
- ✅ Added Theme Editor range sliders to Liquid schema:
  - `product_card_spacing`: Range 10-60px, default 20px
  - `product_cards_per_row`: Range 2-6, default 4
- ✅ Added data attributes to widget container (lines 163-164)
- ✅ Updated JavaScript to read and apply settings:
  - Added to `parseConfiguration()` method (lines 229-230)
  - Created `applyCardLayoutSettings()` method to set CSS variables
  - CSS variables: `--bundle-product-card-spacing`, `--bundle-product-cards-per-row`
- Files Modified:
  - `extensions/bundle-builder/blocks/bundle-full-page.liquid` (lines 78-102, 163-164)
  - `app/assets/bundle-widget-full-page.js` (lines 229-230, 238-250)
- Result: Merchants can now control card spacing and cards-per-row directly in Theme Editor
- Next: Commit changes, then begin Phase 3 (Font Inheritance)

## Related Documentation
- `/Users/adityaawasthi/.claude/plans/graceful-marinating-wozniak.md` (Implementation Plan)
- `docs/FULL_PAGE_DESIGN_GAP_ANALYSIS.md` (Gap Analysis)
- `docs/FULL_PAGE_IMPLEMENTATION_PLAN_2026.md` (Detailed Implementation)
- `docs/DCP_IMPLEMENTATION_SUMMARY.md` (DCP Architecture)
- `docs/FULL_PAGE_CUSTOMIZATION.md` (Theme Editor Settings)

## Phases Checklist

- [x] Phase 0: Issue Tracking Setup ✅ Completed (Commit: 83ae752)
- [x] Phase 1: Fixed Card Dimensions ✅ Completed (Commit: 42f8e7d)
- [ ] Phase 2: Configurable Spacing (Current)
  - [ ] Update CSS grid to use fixed widths
  - [ ] Add database fields for card dimensions
  - [ ] Add DCP UI controls
  - [ ] Update CSS API generator
- [ ] Phase 2: Configurable Spacing
  - [ ] Add Theme Editor range slider
  - [ ] Update CSS grid gap
  - [ ] Pass settings from Liquid to JS
- [ ] Phase 3: Font Inheritance
  - [ ] Remove all hardcoded font-family declarations
  - [ ] Replace with `inherit` or remove entirely
- [ ] Phase 4: Product Variant Modal
  - [ ] Create modal HTML/CSS structure
  - [ ] Create `bundle-modal-component.js`
  - [ ] Integrate modal with main widget
  - [ ] Change button text to "Choose Options"
- [ ] Phase 5: Enhanced Card Styling
  - [ ] Update product card visuals
  - [ ] Larger product images (280px)
  - [ ] Professional shadows and hover effects
  - [ ] Remove on-card quantity/variant selectors
- [ ] Phase 6: DCP Integration
  - [ ] Add ~25 new fields to DesignSettings
  - [ ] Add 4 new DCP UI sections
  - [ ] Update CSS API generator
  - [ ] Run migrations

## Next Immediate Steps
1. [x] Create `docs/issues-prod/` folder
2. [x] Create this issue file
3. [ ] Create `CLAUDE.md` in project root
4. [ ] Make initial commit with issue tracking setup
5. [ ] Begin Phase 1 implementation

## Files Created/Modified (This Session)

### Phase 0:
- Created: `docs/issues-prod/full-page-design-improvements-1.md`
- Created: `CLAUDE.md` (pending)

### Future Phases:
- To be logged as work progresses

---

**Remember:** Update this file BEFORE and AFTER every commit!
