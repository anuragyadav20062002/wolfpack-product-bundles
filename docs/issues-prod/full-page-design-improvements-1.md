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

### January 13, 2026 15:10 - Phase 3: Font Inheritance Started
- ⏳ Removing hardcoded fonts from full-page bundle CSS
- Will modify: `extensions/bundle-builder/assets/bundle-widget-full-page.css`
- Goal: Replace all `font-family: 'Quattrocento Sans', sans-serif;` with `font-family: inherit;`
- Target: Widget fonts will inherit from store theme automatically
- Next: Find all hardcoded font declarations

### January 13, 2026 15:15 - Phase 3: Font Inheritance Completed
- ✅ Found 21 instances of hardcoded font-family declarations
- ✅ Replaced all `font-family: 'Quattrocento Sans', sans-serif;` with `font-family: inherit;`
- ✅ Verified no hardcoded fonts remain in CSS file
- Files Modified:
  - `extensions/bundle-builder/assets/bundle-widget-full-page.css` (21 replacements)
- Result: Widget fonts now inherit from store theme automatically
- Impact: Widget will match store branding typography without configuration
- Next: Commit changes, then begin Phase 4 (Product Variant Modal)

### January 13, 2026 15:20 - Phase 4: Product Variant Modal Started
- ⏳ Building product variant modal component (Most Complex Phase)
- Will create:
  - Modal CSS (~500 lines) in `bundle-widget-full-page.css`
  - New file: `app/assets/bundle-modal-component.js` (~400 lines)
- Will modify:
  - `app/assets/bundle-widget-full-page.js` (integrate modal, change button behavior)
  - `extensions/bundle-builder/blocks/bundle-full-page.liquid` (load modal script)
- Goal: Professional modal with image gallery, variant selection, quantity controls
- Target: "Choose Options" button opens modal instead of direct add
- Next: Add modal CSS structure

### January 13, 2026 15:45 - Phase 4: Product Variant Modal Completed
- ✅ Created comprehensive modal CSS (~400 lines):
  - Modal overlay with backdrop blur
  - 2-column layout (60% images / 40% details)
  - Image gallery with clickable thumbnails
  - Variant selector dropdowns
  - Quantity controls with +/- buttons
  - Professional "Add To Box" button
  - Close button with hover animation
  - Responsive mobile layout (stacks vertically)
  - Smooth transitions and animations
- ✅ Created `app/assets/bundle-modal-component.js` (450 lines):
  - BundleProductModal class with full functionality
  - Image gallery management
  - Variant selection logic
  - Quantity controls
  - Price updates based on variant
  - Availability checking
  - Integration with main widget
  - ESC key and outside-click closing
- ✅ Updated `app/assets/bundle-widget-full-page.js`:
  - Initialize modal in constructor
  - Changed button text: "Add to Bundle" → "Choose Options"
  - Changed button text when added: "Added to Bundle" → "✓ Added to Bundle"
  - Updated button click handler to open modal
  - Fallback to direct add if modal unavailable
  - Allow toggling off when already added
- ✅ Updated `extensions/bundle-builder/blocks/bundle-full-page.liquid`:
  - Load modal component script before widget
  - Sequential loading: modal → widget
  - Error handling with fallback
- Files Created:
  - `app/assets/bundle-modal-component.js` (450 lines - NEW)
- Files Modified:
  - `extensions/bundle-builder/assets/bundle-widget-full-page.css` (+400 lines modal CSS)
  - `app/assets/bundle-widget-full-page.js` (constructor, button handler, text updates)
  - `extensions/bundle-builder/blocks/bundle-full-page.liquid` (script loading)
- Result: Professional modal opens when clicking "Choose Options"
- Impact: Users can now view full product details, select variants, and choose quantity before adding
- Next: Commit changes, then begin Phase 5 (Enhanced Card Styling)

### January 13, 2026 16:00 - Phase 5: Enhanced Card Styling Started
- ⏳ Improving product card visuals to match reference screenshots
- Will modify: `extensions/bundle-builder/assets/bundle-widget-full-page.css`
- Changes planned:
  - Larger product images (from 200px to 280px height)
  - Remove on-card quantity selectors (no longer needed with modal)
  - Remove on-card variant selectors (moved to modal)
  - Better shadows and hover effects
  - Cleaner card layout with better spacing
  - Professional "Choose Options" button styling
- Goal: Match Dolphin & Dog reference screenshot aesthetics
- Target: Clean, minimalist cards with prominent imagery
- Next: Update product image height

### January 13, 2026 16:10 - Phase 5: Enhanced Card Styling Completed
- ✅ Increased product image height from 200px to 280px
- ✅ Hidden on-card quantity selector (moved to modal)
- ✅ Hidden on-card variant selector (moved to modal)
- ✅ Updated card styling:
  - Background changed to white (#FFFFFF) for cleaner look
  - Added border-radius (8px) for rounded corners
  - Increased padding from 8-9px to 12px
  - Added subtle border (1px solid rgba(0,0,0,0.08))
  - Added base shadow (0 2px 8px rgba(0,0,0,0.04))
  - Enhanced hover shadow (0 8px 24px rgba(0,0,0,0.12))
- Files Modified:
  - `extensions/bundle-builder/assets/bundle-widget-full-page.css` (5 updates)
- Result: Cards now have professional, minimalist design matching reference screenshot
- Impact: Cleaner UI with focus on product imagery and "Choose Options" CTA
- Next: Commit changes, then begin Phase 6 (DCP Integration)

## Related Documentation
- `/Users/adityaawasthi/.claude/plans/graceful-marinating-wozniak.md` (Implementation Plan)
- `docs/FULL_PAGE_DESIGN_GAP_ANALYSIS.md` (Gap Analysis)
- `docs/FULL_PAGE_IMPLEMENTATION_PLAN_2026.md` (Detailed Implementation)
- `docs/DCP_IMPLEMENTATION_SUMMARY.md` (DCP Architecture)
- `docs/FULL_PAGE_CUSTOMIZATION.md` (Theme Editor Settings)

## Phases Checklist

- [x] Phase 0: Issue Tracking Setup ✅ Completed (Commit: 83ae752)
- [x] Phase 1: Fixed Card Dimensions ✅ Completed (Commit: 42f8e7d)
- [x] Phase 2: Configurable Spacing ✅ Completed (Commit: 9c041c2)
- [x] Phase 3: Font Inheritance ✅ Completed (Commit: a685480)
- [x] Phase 4: Product Variant Modal ✅ Completed (Commit: 56195cf)
- [ ] Phase 5: Enhanced Card Styling (Next)
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
