# Issue: Free gift step card CSS non-uniform vs normal step cards (PDP widget)

**Issue ID:** free-gift-card-css-uniform-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-04-01
**Last Updated:** 2026-04-01

## Overview
In the PDP bundle widget (classic mode), the free gift slot card empty state uses completely
different CSS class hierarchy and dimensions than a normal empty step card.

- Normal empty card: `step-box` class → `aspect-ratio: 1/1`, `min-height: 180px`, solid border, simple `+` text icon
- Free gift empty card: `step-box bw-slot-card bw-slot-card--empty` → hardcoded `height: 200px`, dashed border in primary color, 80px circular icon with inline styles

The fix: in classic mode, `createFreeGiftSlotCard()` should use the same `step-box` structure
as `createEmptyStateCard()` (simple `+` icon + step name label), keeping only the ribbon/badge
overlay as the free gift visual differentiator. In bottom-sheet mode the existing appearance is
correct and should be unchanged.

## Progress Log

### 2026-04-01 - Identified root cause
- `createFreeGiftSlotCard()` always sets `bw-slot-card bw-slot-card--empty` regardless of widget style
- `createEmptyStateCard()` branches on `this.widgetStyle === 'bottom-sheet'` — classic mode uses plain `step-box`
- Fix: apply same `widgetStyle` branch in `createFreeGiftSlotCard()` empty/locked state

## Files Changed
- `app/assets/bundle-widget-product-page.js`
- `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js` (rebuilt)

## Phases Checklist
- [x] Identify root cause
- [x] Fix `createFreeGiftSlotCard()` to branch on widgetStyle for empty/locked state
- [x] Rebuild widgets (`npm run build:widgets:product-page`)
- [ ] Verify uniform sizing in storefront
