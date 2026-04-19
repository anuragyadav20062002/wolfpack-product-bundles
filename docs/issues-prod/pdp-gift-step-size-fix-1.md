# Issue: PDP Gift Step Filled Card Size Inconsistency

**Issue ID:** pdp-gift-step-size-fix-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-04-10
**Last Updated:** 2026-04-10 19:15

## Overview

On the PDP widget, when the free gift step has a product selected (filled state), the card
renders visually larger/differently than the regular filled step cards. The root cause is in
`createFreeGiftSlotCard()` in `bundle-widget-product-page.js`:

- **Regular filled steps** (`createSelectedProductCard`): use `step-box step-completed product-card-state` in classic mode, adding `bw-slot-card bw-slot-card--filled` only in bottom-sheet mode. Image container uses `step-images single-image` (classic) or `bw-slot-card__image-wrapper` (bottom-sheet). Title uses `step-name step-name-completed product-title-state`.
- **Filled gift step** (broken): always uses `step-box bw-slot-card bw-slot-card--filled` regardless of widget style, `bw-slot-card__image-wrapper` image container regardless of style, and `step-name bw-slot-card__label` title class. This produces a different visual size in classic mode.

## Phases Checklist

- [x] Phase 1: Fix filled gift step classes to match `createSelectedProductCard` ✅

## Progress Log

### 2026-04-10 19:15 - Phase 1 Completed
- ✅ `app/assets/bundle-widget-product-page.js` (`createFreeGiftSlotCard`, ~line 1029):
  - `stepBox.className`: was always `step-box bw-slot-card bw-slot-card--filled`; now uses `step-box step-completed product-card-state` (+ `bw-slot-card bw-slot-card--filled` only in bottom-sheet mode), matching `createSelectedProductCard`
  - Image container: was always `bw-slot-card__image-wrapper` / `bw-slot-card__image`; now `step-images single-image` / `step-image` in classic mode, same as regular filled cards
  - Title class: was `step-name bw-slot-card__label`; now `step-name step-name-completed product-title-state`, matching regular filled cards
- ✅ Built: `npm run build:widgets` — both bundles regenerated
- Commit: 274ce33
