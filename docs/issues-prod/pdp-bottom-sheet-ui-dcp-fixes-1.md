# Issue: PDP Bottom-Sheet — UI Polish + DCP Integration Fixes

**Issue ID:** pdp-bottom-sheet-ui-dcp-fixes-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-04-10
**Last Updated:** 2026-04-10 20:45

## Overview

Two categories of fixes to the PDP bottom-sheet modal:

**DCP Integration gaps (broken — DCP controls have no effect):**
1. `--bundle-bottom-sheet-overlay-opacity` and `--bundle-bottom-sheet-animation-duration` are never output by the CSS generator — both DCP sliders are non-functional
2. Free gift tab hardcoded to `#1e3a8a` — ignores DCP header tab color settings

**UI improvements (bottom-sheet inner modal):**
1. Product card border: hardcoded gold `rgb(255, 202, 67)` → use `--bundle-product-card-border-color` (DCP-controlled, neutral by default)
2. Step name (`.modal-step-title`): `0.95em / font-weight 500` too small/light → more prominent
3. Discount text (`.footer-discount-text`): `13px` → slightly larger
4. Free gift subheading: hardcoded `#555555` → use `--bundle-global-secondary-text`

## Phases Checklist

- [x] Phase 1: CSS generator — add bottom-sheet overlay + animation variable output ✅
- [x] Phase 2: CSS — product card border, free gift tab colors, step name, discount text, free gift subheading ✅
- [x] Phase 3: Build widgets ✅

## Progress Log

### 2026-04-10 20:45 - All Phases Completed

**`app/lib/css-generators/css-variables-generator.ts`:**
- ✅ Added `--bundle-bottom-sheet-overlay-opacity` output — DCP overlay slider now functional
- ✅ Added `--bundle-bottom-sheet-animation-duration` output — DCP animation slider now functional

**`extensions/bundle-builder/assets/bundle-widget.css`:**
- ✅ Product card border: `rgb(255, 202, 67)` gold → `var(--bundle-product-card-border-color, #e5e7eb)` (DCP-controlled, neutral)
- ✅ Free gift tab: all 3 `#1e3a8a` hardcodes → `var(--bundle-header-tab-active-bg, ...)` — now respects DCP tab colors
- ✅ `.modal-step-title`: `0.95em / 500` → `1.1em / 700`, color uses `--bundle-global-primary-text`
- ✅ `.modal-header-discount-messaging .footer-discount-text`: `13px` → `14px`, `text-align: center`, color uses `--bundle-global-secondary-text`
- ✅ `.bw-bs-free-gift-subheading`: hardcoded `#555555` → `var(--bundle-global-secondary-text)`
- Commit: (pending)

### 2026-04-10 20:30 - Planning Complete
- ✅ Confirmed `--bundle-bottom-sheet-overlay-opacity` / `animation-duration` missing from generator
- ✅ Confirmed `--bundle-product-card-border-color` exists in generator (line 82); CSS uses wrong var name `--bundle-product-card-border`
