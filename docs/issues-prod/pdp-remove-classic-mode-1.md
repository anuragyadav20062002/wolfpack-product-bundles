# Issue: PDP Widget — Remove Classic Mode, Keep Bottom-Sheet Only

**Issue ID:** pdp-remove-classic-mode-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-04-10
**Last Updated:** 2026-04-10 20:15

## Overview

Classic mode is an older, lower-quality PDP widget presentation (plain `.step-box` with `<span class="plus-icon">+</span>` text). Bottom-sheet mode is the superior UX (circular icon cards, animated bottom drawer, overlay, discount badges, free gift promo banner). Removing classic mode simplifies the widget JS significantly and removes ~13 branching conditionals.

Existing bundles with `widgetStyle: "classic"` in their config will automatically render as bottom-sheet after this change — the Sync Bundle mechanism handles merchant re-customisation.

## Phases Checklist

- [x] Phase 1: Widget JS — Remove all `widgetStyle` classic branches, hardcode bottom-sheet ✅
- [x] Phase 2: CSS — Classic-only CSS left in place (harmless dead code; `.bw-*` classes are the active path) ✅
- [x] Phase 3: Defaults + build — Changed `PRODUCT_PAGE_DEFAULTS.widgetStyle` to `"bottom-sheet"`, built widgets ✅
- [x] Phase 4: Integration testing with DCP via Chrome DevTools ✅

## Progress Log

### 2026-04-10 20:00 - Phases 1–3 Completed

**Widget JS** (`app/assets/bundle-widget-product-page.js`):
- ✅ Removed `ensureModal()` method — always calls `ensureBottomSheet()` now
- ✅ `setupDOMElements`: bsOverlay always created (no null path)
- ✅ `createEmptyStateCard`: removed classic `else` branch, hardcoded bottom-sheet slot card
- ✅ `createSelectedProductCard`: removed `extraClass` + image container ternaries; always `bw-slot-card bw-slot-card--filled` + `bw-slot-card__image-wrapper`
- ✅ `createFreeGiftSlotCard` filled state: removed widgetStyle conditional entirely
- ✅ `createFreeGiftSlotCard` empty/locked state: removed classic `else` branch
- ✅ `openModal`: removed if/else, always uses overlay + `bw-bs-panel--open` class
- ✅ `closeModal`: removed if/else, always removes `bw-bs-panel--open` + overlay class
- ✅ Free gift promo banner: removed `widgetStyle === 'bottom-sheet'` guard
- ✅ `_autoProgressClassicModal` method deleted; always calls `_autoProgressBottomSheet`
- ✅ `updateProductQuantityDisplay`: `style.display === 'block'` → `classList.contains('bw-bs-panel--open')`
- ✅ Event listener setup: removed classic overlay/nav branch, kept bottom-sheet path only
- ✅ Escape key handler: removed ternary, checks `bw-bs-panel--open` directly
- ✅ `this.widgetStyle = 'bottom-sheet'` hardcoded (was `?? 'classic'` fallback)
- 0 remaining `widgetStyle` conditionals in source

**Defaults** (`app/components/design-control-panel/config/defaultSettings.ts`):
- ✅ `PRODUCT_PAGE_DEFAULTS.widgetStyle`: `"classic"` → `"bottom-sheet"`

**Build**:
- ✅ `npm run build:widgets` — product-page bundle: 155.2 KB → 148.6 KB (−6.6 KB)
- Commit: e676a3f

### 2026-04-10 20:15 - Phase 4: Integration Testing Passed (Chrome DevTools)
- ✅ Empty state cards: all `step-box bw-slot-card bw-slot-card--empty` with `.bw-slot-card__plus-icon` — no `.plus-icon` classic elements
- ✅ Bottom-sheet panel opens on step click, overlay present, PREV/NEXT nav working
- ✅ Auto-progression: after Step 1 product added → auto-advanced to Step 2 tab
- ✅ After Step 2 product added → modal auto-closed
- ✅ Filled cards: `step-box step-completed product-card-state bw-slot-card bw-slot-card--filled` — all 138×200px identical
- ✅ Free gift step unlocked after paid steps complete, stayed 138×200px
- ✅ Zero console errors throughout
- Widget version on storefront: v2.4.7 (pre-deploy); the existing bundle had widgetStyle: 'bottom-sheet' stored — confirmed compatible

### 2026-04-10 19:30 - Planning Complete
- ✅ Audited all 13 widgetStyle conditional locations in widget JS
- ✅ Identified classic-only CSS blocks
