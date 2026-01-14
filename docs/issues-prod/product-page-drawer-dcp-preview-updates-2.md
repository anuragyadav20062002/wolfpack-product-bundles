# Issue: Product Page Drawer & DCP Preview Updates

**Issue ID:** product-page-drawer-dcp-preview-updates-2
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-01-14
**Last Updated:** 2026-01-14 14:30

## Overview

This issue addresses three enhancements to the product-page bundle widget and Design Control Panel:

1. **Drawer Background Customization** - Connect existing `--bundle-drawer-bg` CSS variable to `.modal-content` to enable DCP customization of drawer background color
2. **Remove Arrow Components** - Clean up DCP preview by removing arrow overlay annotations
3. **Add Phase 6 Preview Settings** - Display all 22 newly added Phase 6 settings in DCP preview (card dimensions, spacing, modal styling)

## Progress Log

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

### Phase 1: Drawer Background Customization (15 min)
- [ ] Update `bundle-widget.css` line 392
- [ ] Change hardcoded `#FFFFFF` to `var(--bundle-drawer-bg, #FFFFFF)`
- [ ] Test with DCP drawer settings
- [ ] Commit changes

### Phase 2: Remove Arrow Components (30 min)
- [ ] Remove `ArrowLabel` import from `app.design-control-panel.tsx`
- [ ] Remove `renderArrows()` function (~110 lines)
- [ ] Remove `{renderArrows()}` JSX call
- [ ] Test preview still works
- [ ] Commit changes

### Phase 3: Add Phase 6 Preview Settings (1.5 hours)
- [ ] Update `ProductCardPreview.tsx` interface (add 22 props)
- [ ] Update card container styles (width, height, padding, borders, shadows)
- [ ] Update image styles (height, border-radius, background)
- [ ] Add modal preview section
- [ ] Update `app.design-control-panel.tsx` to pass 22 new props
- [ ] Test all settings in preview
- [ ] Commit changes

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
