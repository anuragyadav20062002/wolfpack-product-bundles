# Issue: Sidebar Panel Layout — Product Cards Clipped on Sides

**Issue ID:** sidebar-panel-card-clipping-fix-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-03-01
**Last Updated:** 2026-03-01 14:05

## Overview

When the full-page bundle widget uses the **sidebar panel** layout (`footer_side`),
product cards in the product grid are clipped/cut off on the left and right edges.

## Root Cause

At desktop (≥1024px), `.full-page-product-grid` uses fixed-pixel column widths:

```css
grid-template-columns: repeat(
  var(--bundle-product-cards-per-row, 3),
  var(--bundle-product-card-width, 280px)
);
```

In the standard (bottom-footer) layout, the full viewport width is available for the
grid so this works. In the sidebar layout, 360px is consumed by the side panel + 80px
by content-section padding (40px × 2), leaving only ~840px for a grid that needs
3 × 280px + 2 × 20px gaps = 880px → **40px overflow**.

`overflow-x: hidden` on `.full-page-product-grid` (and on `body`) clips this overflow,
visually cutting the leftmost and rightmost card edges.

## Fix

Scope a desktop override for `.sidebar-content .full-page-product-grid` to use
`minmax(0, 1fr)` columns instead of fixed px widths. This keeps the number of columns
the merchant configured while making each column flexible to the available space.

Also remove the inherited horizontal padding (`0 16px` from tablet breakpoint) inside
the sidebar content grid, since the content section already provides adequate padding.

## Files to Modify

- `extensions/bundle-builder/assets/bundle-widget-full-page.css`

## Progress Log

### 2026-03-01 14:00 - Phase 1: CSS Fix Applied
- ✅ Added `@media (min-width: 1024px)` scoped override for `.sidebar-content .full-page-product-grid`
- ✅ Changed column sizing from `var(--bundle-product-card-width, 280px)` → `minmax(0, 1fr)`
- ✅ Reset horizontal padding to 0 (content section already provides 40px side padding)
- Files Modified:
  - `extensions/bundle-builder/assets/bundle-widget-full-page.css` (after line 3540)
- Result: Grid columns now flex to fill available width — no overflow, no clipping
- Impact: Cards always fill the sidebar-narrowed content area across all viewport widths
- Next: Commit

## Phases Checklist
- [x] Phase 1: Apply CSS fix ✅ Completed
- [ ] Phase 2: Commit
