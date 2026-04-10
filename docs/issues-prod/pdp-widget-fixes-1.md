# Issue: PDP Widget — 7-Point UI Fix

**Issue ID:** pdp-widget-fixes-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-04-10
**Last Updated:** 2026-04-10 21:30

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

### 2026-04-10 21:45 - Issue 8: Footer background mismatch fixed

Root cause: `.modal-body` had explicit `background-color: #F3F4F6` (gray) while the BS footer was transparent and showed the panel's `rgb(244, 249, 249)` (teal). The color mismatch made the footer strip look like a separate component.

Fix: Added `.bw-bs-panel .modal-body { background: transparent; }` and `.bw-bs-body { background: transparent; }` so both body and footer area uniformly inherit the panel background — no visible strip.

- ✅ `extensions/bundle-builder/assets/bundle-widget.css` — 2 transparent background overrides added
- Commit: (pending)
