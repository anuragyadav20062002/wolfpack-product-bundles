# Issue: PDP Widget — Full UI Audit & Consistency Fix

**Issue ID:** pdp-widget-ui-audit-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-04-11
**Last Updated:** 2026-04-11 02:15

## Overview

Comprehensive UI audit of the PDP bottom-sheet widget across all states and viewports.
Goal: identify every visual inconsistency, fix them, and ensure full DCP alignment + mobile compatibility.

## Phases Checklist

- [x] Phase 1: Live audit — desktop viewport screenshots & DOM inspection ✅
- [x] Phase 2: Live audit — mobile viewport (390px) screenshots ✅
- [x] Phase 3: Identify all inconsistencies ✅
- [x] Phase 4: Plan fixes ✅
- [x] Phase 5: Implement fixes ✅
- [ ] Phase 6: Build + deploy + verify

## Issues Found

| # | Severity | Issue | Root Cause |
|---|----------|-------|------------|
| 1 | 🔴 Critical | Overlay opacity stuck at 0 — no background dimming | `#bw-bs-overlay` (specificity 1-0-0) in base rule beats `.bw-bs-overlay--open` (0-1-0) |
| 2 | 🔴 Critical | BS panel positions at top:0 instead of bottom:0 | `.bundle-builder-modal { top:0; height:100vh }` classic modal rule conflict (fix in fd6c70f, not yet deployed) |
| 3 | 🟠 High | Free gift Step 3 tab appears active/black even when locked | `bw-free-gift-tab` always applies active tab colors regardless of locked state |
| 4 | 🟠 High | Footer white background vs teal panel background | DCP CSS `.bundle-builder-modal .modal-footer { background: var(--bundle-footer-bg) }` resolves to white |
| 5 | 🟡 Medium | No drag handle pill on mobile | No visual affordance for swipe-to-dismiss on mobile |
| 6 | 🟡 Medium | Slot card dashed border nearly invisible (`rgb(246,246,246)`) | DCP `--bundle-empty-state-card-border` set very light |

## Fixes Applied

**`extensions/bundle-builder/assets/bundle-widget.css`:**
- ✅ Issue 1: Added `#bw-bs-overlay.bw-bs-overlay--open, .bw-bs-overlay.bw-bs-overlay--open` rule — specificity 1-1-0 beats the 1-0-0 base rule. Overlay now dims correctly.
- ✅ Issue 3: Added `.bw-bs-panel .bundle-header-tab.bw-free-gift-tab.locked` rule — shows inactive colors (gray bg, muted text) when free gift step is locked.
- ✅ Issue 4: Added `#bundle-builder-modal .bw-bs-footer, #bundle-builder-modal .modal-footer { background: transparent }` — ID selector (1-1-0) beats DCP class rule (0-2-0).
- ✅ Issue 5: Added `.bw-bs-panel::before` drag handle pill in `@media (max-width: 767px)` — 36px wide, 4px tall gray pill at panel top.

**Issue 2** (panel position conflict) — fix already in commit fd6c70f, pending deploy.

### 2026-04-11 02:15 - Grid container + footer pill group audit & fix

**Root causes found:**

**Grid container small (body shrinks to content-width):**
- Classic `.bundle-builder-modal` CSS also sets `align-items: center; justify-content: center; background: rgba(0,0,0,0.5)` (flex centering rules for its overlay use-case)
- When `bundle-builder-modal` class was added to the BS panel, these rules applied
- `align-items: center` in a column-flex container makes children shrink to content-width instead of stretching full-width
- Body measured 203px (at 2316px physical viewport) vs expected ~1158px
- Fix: Added `align-items: stretch; justify-content: flex-start; background: var(--bundle-bs-panel-bg)` to `.bw-bs-panel.bundle-builder-modal` override (specificity 0-2-0)

**Footer pill group deep audit findings:**
- Cart pill width: 66px, nav pill gap: 52px → cart pill overflowed gap by 7px on each side, overlapping PREV/NEXT buttons
- DCP CSS `.bundle-builder-modal .modal-footer .modal-nav-button.prev/next-button { padding: 12px 56px }` (specificity 0-3-0) — DCP designed for full-page modal standalone buttons, not for BS footer pill context
- This DCP padding made each button 154px wide, inflating the pill unnecessarily

**Fixes applied:**
- ✅ `align-items: stretch; justify-content: flex-start; background` added to panel override — body now fills full panel width
- ✅ Nav pill `gap: 52px` → `80px` (desktop), `72px` (mobile ≤767px) — cart pill (66px) now has 7px clearance on each side
- ✅ Added `#bundle-builder-modal .bw-bs-nav-btn.prev-button, .next-button { padding: 10px 24px }` (ID specificity 1-2-0 beats DCP 0-3-0) — compact button size suitable for pill context
- ✅ Mobile button padding: `8px 20px`, font-size `13px`

**CSS size:** 70,279 B (under 100,000 B limit) ✅

**CSS size:** 69,421 B (under 100,000 B limit) ✅
**Build:** `npm run build:widgets` — product-page 148.3 KB, full-page 257.1 KB ✅

## Progress Log

### 2026-04-11 00:45 - Planning Started

Scope: All UI components of the PDP bottom-sheet widget:
- Panel container (positioning, bg, border-radius, shadow)
- Header (tabs, close button, step title, discount bar)
- Product grid (cards: image, title, price, quantity selector, add button)
- Footer (nav pill: PREV/NEXT, cart badge pill, free gift promo)
- Overlay (opacity, click-to-close)
- Free gift step (promo banner, locked/unlocked state)
- Mobile layout (85vh height, tab wrapping, card sizing)

### 2026-04-11 01:30 - Audit Complete + Fixes Implemented

Audited via Chrome DevTools — desktop (1440×900) + mobile (390×844) viewports.
4 CSS fixes applied in `bundle-widget.css`. See Issues Found table above.

