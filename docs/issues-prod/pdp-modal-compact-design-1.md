# Issue: PDP Modal Compact Design - Match Clean Reference

**Issue ID:** pdp-modal-compact-design-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-02-14
**Last Updated:** 2026-02-14 15:40

## Overview
The PDP bundle modal has oversized internal elements making the design unusable. Cards are too tall (420px min-height), images too large (200px), only 3 columns instead of 5, excessive padding everywhere. Need to match the clean skeleton reference with compact cards, 5-column grid, and minimal spacing. Also hardcode user-specified CSS defaults (without !important).

## Progress Log

### 2026-02-14 15:40 - Planning Complete
- Analyzed current CSS vs reference skeleton image
- Identified all oversized defaults in `bundle-widget.css`
- Key changes:
  - Grid: 3 cols → 5 cols desktop
  - Card min-height: 420px → auto
  - Image height: 200px → auto with aspect-ratio
  - Card padding: 20px → 12px
  - Header/tabs: reduce padding and margins
  - Modal height: 80vh → 90vh
  - Button: remove uppercase/letter-spacing, compact
  - Hardcode user CSS (product-add-btn orange, product-title sizing, etc.)
- Files to modify:
  - `extensions/bundle-builder/assets/bundle-widget.css`
- Next: Begin Phase 1

### 2026-02-14 16:00 - All Phases Completed
- ✅ Files Modified:
  - `extensions/bundle-builder/assets/bundle-widget.css`
- ✅ Changes:
  - Modal height: 80vh → 90vh (more visible content)
  - Modal header: padding reduced from 40px calc → 12px 24px 8px
  - Drawer handle: tighter top position
  - Step title: 1.4em bold → 0.95em medium weight
  - Tabs wrapper: margin-bottom 24px → 8px
  - Tabs: padding 14px 32px → 10px 24px, min-height 48→38, min-width 140→100
  - Tab arrows: 40px → 32px
  - Product grid: 3 cols → 5 cols default desktop, added 4-col 1024px breakpoint
  - Product cards: min-height 420px → auto, padding 20px → 12px, border simplified
  - Product image: fixed 200px height → auto with aspect-ratio 1/1
  - Product title: 16px → 14px
  - Price row: removed bg/border/padding decorations
  - Add button: removed uppercase/letter-spacing/gradient, compact 10px 16px padding
  - Quantity selector: simplified styling, reduced padding
  - Variant selector: compact 8px 12px padding, simplified
  - Modal body: padding reduced to 16px 24px
  - Modal footer: padding 24px 40px → 12px 24px
  - Nav buttons: removed uppercase/letter-spacing, compact
  - Close button: 40px → 32px
  - Mobile 480px: 2-col grid (not 1), tighter padding
  - Hardcoded: .inline-quantity-controls, .footer-total-section .total-label, .footer-products-tiles-wrapper, mobile full-page-product-grid
- ✅ Widget bundles built successfully

## Phases Checklist
- [x] Phase 1: Compact modal layout (grid, cards, header, footer)
- [x] Phase 2: Hardcode user-specified CSS defaults
- [x] Phase 3: Build widget bundles and verify
