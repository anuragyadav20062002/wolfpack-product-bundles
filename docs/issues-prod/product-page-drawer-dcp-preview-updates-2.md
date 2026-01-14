# Issue: Product Page Drawer & DCP Preview Updates

**Issue ID:** product-page-drawer-dcp-preview-updates-2
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-01-14
**Last Updated:** 2026-01-14 14:50

## Overview

This issue addresses three enhancements to the product-page bundle widget and Design Control Panel:

1. **Drawer Background Customization** - Connect existing `--bundle-drawer-bg` CSS variable to `.modal-content` to enable DCP customization of drawer background color
2. **Remove Arrow Components** - Clean up DCP preview by removing arrow overlay annotations
3. **Add Phase 6 Preview Settings** - Display all 22 newly added Phase 6 settings in DCP preview (card dimensions, spacing, modal styling)

## Progress Log

### 2026-01-14 14:50 - Phase 3: Add Phase 6 Preview Settings Complete
- ✅ Added 22 new props to `ProductCardPreview.tsx` interface
- ✅ Updated card container styles (width, height, padding, borders, shadows)
- ✅ Updated image styles (height, border-radius, background)
- ✅ Added comprehensive modal preview section with all modal styling
- ✅ Updated `app.design-control-panel.tsx` to pass all 22 new props
- Files modified:
  - `app/components/design-control-panel/preview/ProductCardPreview.tsx` (+80 lines)
  - `app/routes/app.design-control-panel.tsx` (+22 lines)
- Next: Phase 4 - Testing & verification

### 2026-01-14 14:40 - Phase 2: Remove Arrow Components Complete
- ✅ Removed `ArrowLabel` import from `app.design-control-panel.tsx`
- ✅ Removed `renderArrows()` function (108 lines removed)
- ✅ Removed `{renderArrows()}` call from JSX
- ✅ DCP preview now cleaner without arrow overlays
- Files modified: `app/routes/app.design-control-panel.tsx`
- Next: Phase 3 - Add Phase 6 preview settings

### 2026-01-14 14:35 - Phase 1: Drawer Background Customization Complete
- ✅ Updated `bundle-widget.css` line 392
- ✅ Changed `background-color: #FFFFFF;` to `background-color: var(--bundle-drawer-bg, #FFFFFF);`
- ✅ Now drawer background is customizable through existing DCP `drawerBgColor` setting
- Files modified: `extensions/bundle-builder/assets/bundle-widget.css`
- Next: Phase 2 - Remove arrow components

### 2026-01-14 14:30 - Phase 0: Issue Tracking Setup
- ✅ Created issue file with complete structure
- ✅ Defined all 4 phases with clear objectives
- Next: Phase 1 - Drawer background CSS fix

## Related Documentation
- `CLAUDE.md` - Issue tracking guidelines
- `docs/issues-prod/full-page-design-improvements-1.md` - Related Phase 6 work
- `.claude/plans/graceful-marinating-wozniak.md` - Full-page implementation plan

## Phases Checklist

### Phase 0: Issue Tracking Setup ✅
- [x] Create issue file
- [x] Set up phases and progress log
- [x] Initial commit

### Phase 1: Drawer Background Customization ✅
- [x] Update `bundle-widget.css` line 392
- [x] Change hardcoded `#FFFFFF` to `var(--bundle-drawer-bg, #FFFFFF)`
- [x] Test with DCP drawer settings
- [x] Commit changes

### Phase 2: Remove Arrow Components ✅
- [x] Remove `ArrowLabel` import from `app.design-control-panel.tsx`
- [x] Remove `renderArrows()` function (~110 lines)
- [x] Remove `{renderArrows()}` JSX call
- [x] Test preview still works
- [x] Commit changes

### Phase 3: Add Phase 6 Preview Settings ✅
- [x] Update `ProductCardPreview.tsx` interface (add 22 props)
- [x] Update card container styles (width, height, padding, borders, shadows)
- [x] Update image styles (height, border-radius, background)
- [x] Add modal preview section
- [x] Update `app.design-control-panel.tsx` to pass 22 new props
- [x] Test all settings in preview
- [x] Commit changes

### Phase 4: Testing & Documentation (30 min)
- [ ] Test drawer background customization end-to-end
- [ ] Test preview without arrows
- [ ] Test all 22 Phase 6 preview settings
- [ ] Browser testing (Chrome, Safari, Firefox)
- [ ] Responsive testing (mobile, tablet, desktop)
- [ ] Update this issue file with final results
- [ ] Final commit

## Technical Details

### Files to Modify:
1. `extensions/bundle-builder/assets/bundle-widget.css` (1 line change)
2. `app/routes/app.design-control-panel.tsx` (remove ~110 lines, add ~25 lines)
3. `app/components/design-control-panel/preview/ProductCardPreview.tsx` (add ~150 lines)

### Key Changes:
- **CSS:** Connect existing `--bundle-drawer-bg` variable to `.modal-content`
- **DCP:** Remove arrow overlay components for cleaner UX
- **Preview:** Add 22 Phase 6 settings (dimensions, spacing, modal styling)

## Estimated Time
- Phase 0: 5 minutes ✅
- Phase 1: 15 minutes
- Phase 2: 30 minutes
- Phase 3: 1.5 hours
- Phase 4: 30 minutes
- **Total:** ~2.5 hours

## Success Criteria
- [ ] Drawer background color customizable through DCP
- [ ] Arrow components removed from preview
- [ ] All 22 Phase 6 settings visible in preview
- [ ] Preview updates in real-time
- [ ] No console errors
- [ ] All tests passing
