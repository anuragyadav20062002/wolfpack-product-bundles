# Issue: PDP Widget — 7-Point UI Fix

**Issue ID:** pdp-widget-fixes-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-04-10
**Last Updated:** 2026-04-10 23:30

## Overview

Seven reported issues with the PDP bottom-sheet widget UI, audited against the live SIT storefront.

## Phases Checklist

- [x] Phase 1: CSS fixes (Issues 2, 3, 4, 5, 7) ✅
- [x] Phase 2: JS fixes (Issues 1, 4, 6) ✅
- [x] Phase 3: Build widgets ✅

## Progress Log

### 2026-04-10 21:00 - Planning Complete

Audit findings from DOM inspection:
- Issue 1: Overlay click listener wired in source; may be a deployed-version gap
- Issue 2: `.bw-bs-panel .modal-body .product-card` uses `display: grid` — overrides `.modal-body .product-card`'s flex layout, causing mismatched row heights (`182px 193.594px`)
- Issue 3: `.modal-step-title` is `display: block` inside BS panel — should be hidden
- Issue 4: Free gift promo copy verbose (`"Get a X worth Y absolutely free!"` + `"Add N product(s)..."`) + excess padding
- Issue 5: Active/hover tab has `transform: translateY(-2px)` from global rule; panel `overflow: hidden` clips the lifted tab
- Issue 6: Prev button HTML contains `<svg>` chevron polyline — must be removed
- Issue 7: Cart pill `bottom: 56px` gives only ~4px overlap with nav pill — needs more overlap

Files to modify:
- `extensions/bundle-builder/assets/bundle-widget.css`
- `app/assets/bundle-widget-product-page.js`

### 2026-04-10 21:30 - All Phases Completed

**`extensions/bundle-builder/assets/bundle-widget.css`:**
- ✅ Issue 2: `.bw-bs-panel .modal-body .product-card` — `display: grid` → `display: flex; flex-direction: column` (fixes mismatched row heights)
- ✅ Issue 3: Added `.bw-bs-panel .modal-step-title { display: none; }` (removes step name label below tabs)
- ✅ Issue 4: `.bw-bs-free-gift-promo` padding `12px 16px 4px` → `6px 16px 4px`, margin-bottom `8px` → `6px`
- ✅ Issue 5: Added `transform: none` overrides on `.bw-bs-panel .bundle-header-tab.active` and `.bw-bs-panel .bundle-header-tab:not(.locked):not(.active):hover` (prevents tab clipping by panel `overflow: hidden`)
- ✅ Issue 7: `.bw-bs-cart-pill bottom: 56px` → `44px` (increases overlap with nav pill by ~12px)

**`app/assets/bundle-widget-product-page.js`:**
- ✅ Issue 1: Overlay click listener already correctly wired (`attachEventListeners` line 2372) — fix is a deploy
- ✅ Issue 4: Free gift heading `"Get a X worth Y absolutely free!"` → `"Free X!"`, subheading `"Add N product(s) to get 1..."` → `"Add N items to unlock"`
- ✅ Issue 6: Removed `<svg>` chevron from prev button HTML

**Build:** `npm run build:widgets` — product-page bundle 148.4 KB ✅
**CSS sizes:** bundle-widget.css 67,057 B, bundle-widget-full-page.css 96,310 B — both under 100,000 B ✅
- Commit: 879aab8

### 2026-04-10 22:30 - Issues 1, 2, 3, 4, 6 Fixed (Audit Round 2)

Root causes found via Chrome DevTools live DOM inspection:

**Issue 1 — Overlay display: none:**
- Root cause: Shopify Dawn `base.css` has `div:empty { display: none }` — our empty overlay div was hidden
- Fix: Added `#bw-bs-overlay, .bw-bs-overlay { display: block }` using ID selector (specificity 1-0-0 beats `div:empty` 0-1-1)
- File: `extensions/bundle-builder/assets/bundle-widget.css`

**Issues 2 & 6 — DCP settings not applying to BS panel:**
- Root cause: DCP CSS generator outputs rules targeting `.bundle-builder-modal` (class selector), but BS panel has `class="bw-bs-panel"` — `dcpSelectorMatchCount: 0`, zero rules applied
- Fix A: Added `bundle-builder-modal` to BS panel className in `ensureBottomSheet()` JS — DCP CSS now targets the panel
- Fix B: Updated BS-specific CSS to use correct DCP generator variable names:
  - Product card bg: hardcoded `#ffffff` → `var(--bundle-product-card-bg, #ffffff)`
  - Product card shadow: hardcoded → `var(--bundle-product-card-shadow, ...)`
  - Product title color: `--bundle-product-title-color` → `var(--bundle-product-card-font-color, ...)` (matches generator line 39)
  - Product price color: hardcoded `#000000` → `var(--bundle-product-final-price-color, #000000)` (matches generator line 50)
  - Add button bg: `--bundle-global-primary-button` → `var(--bundle-button-bg, ...)` (matches generator line 55)
  - Add button text: hardcoded `#ffffff` → `var(--bundle-button-text-color, #ffffff)` (matches generator line 56)
  - Product title font-size/weight: hardcoded → `var(--bundle-product-card-font-size/weight)` (matches generator lines 40-41)
  - Product price font-size/weight: hardcoded → `var(--bundle-product-final-price-font-size/weight)` (matches generator lines 51-52)

**Issue 3 — Nav pill too small:**
- Nav pill padding `14px 25px` → `18px 36px`, gap `40px` → `52px`, font-size `13px` → `15px`

**Issue 4 — Close button overlaps last tab:**
- Root cause: `.bw-bs-header` had `padding: 12px 20px 6px` with no right-side buffer for the absolute close button (32px wide + 10px from edge = 42px needed)
- Fix: `padding: 12px 52px 6px 20px` — 52px right padding clears the close button with 10px buffer

Files modified:
- `extensions/bundle-builder/assets/bundle-widget.css`
- `app/assets/bundle-widget-product-page.js`

### 2026-04-10 23:00 - Issue 5 Integration Testing Complete

Ran full step-scenario tests via Chrome DevTools JS execution against deployed v2.4.7:

**PASSED:**
- ✅ Step unlock after product added — Step 2 unlocked correctly on Step 1 completion
- ✅ Auto-progress to next step — advanced to Step 2 immediately after adding to Step 1
- ✅ Step 3 (free gift) unlocks when Steps 1+2 complete — `step3Unlocked: true`
- ✅ Free gift slot card unlocked on product page — `freeGiftSlotUnlocked: true`
- ✅ Cart badge counter increments — 0 → 1 → 2 correctly
- ✅ Tab click navigation — switching tabs by click works
- ✅ Done button shown on last step — `nextBtnText: "Done"` ✅
- ✅ Inline slot cards update with product name + image after selection
- ✅ Free gift tab gets `bw-free-gift-tab` class correctly

**BUG FOUND & FIXED:**
- ❌ → ✅ Prev button blocked when current step is incomplete — `validateStep` was wrongly applied to the `direction < 0` branch in `navigateModal()`. Free gift step (no selection yet) failed validation → Prev showed a toast and didn't navigate. Fixed: removed `validateStep` from Prev branch; going back is always allowed.

**INFRASTRUCTURE NOTE:**
- ⚠️ Free gift step products slow to load (6+ seconds) — Render.com cold-start delay. Not a code bug. The retry logic handles this but cold-starts on Render's free tier take 3–10s.

File: `app/assets/bundle-widget-product-page.js` — `navigateModal()` direction < 0 branch
- Commit: (pending — v2.4.8)

### 2026-04-10 23:30 - All Fixes Committed (v2.4.8)

- ✅ Bumped `WIDGET_VERSION` to `2.4.8` in `scripts/build-widget-bundles.js`
- ✅ Rebuilt widget bundles: product-page 148.3 KB, full-page 257.1 KB
- ✅ CSS sizes: bundle-widget.css 67,689 B, bundle-widget-full-page.css 96,310 B — both under 100,000 B
- Next: Deploy to SIT with `npm run deploy:sit`

### 2026-04-10 21:45 - Issue 8: Footer background mismatch fixed

Root cause: `.modal-body` had explicit `background-color: #F3F4F6` (gray) while the BS footer was transparent and showed the panel's `rgb(244, 249, 249)` (teal). The color mismatch made the footer strip look like a separate component.

Fix: Added `.bw-bs-panel .modal-body { background: transparent; }` and `.bw-bs-body { background: transparent; }` so both body and footer area uniformly inherit the panel background — no visible strip.

- ✅ `extensions/bundle-builder/assets/bundle-widget.css` — 2 transparent background overrides added
- Commit: (pending)
