# Issue: Full Page Bundle Product Card Layout Fixes

**Issue ID:** full-page-card-layout-fixes-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-12
**Last Updated:** 2026-03-12 21:00

## Overview

Two visual issues in full page bundles:
1. Product cards shift down when a product is added — the inline quantity controls are a different height than the add button, causing the card to resize on toggle
2. Too much spacing between product cards, especially in sidebar layout

## Root Causes

**Issue 1 — Card shift:**
`.product-add-btn` had `padding: 14px 20px` with no explicit height. Its rendered height varied with font-size (typically 47–51px). `.inline-quantity-controls` derived its 48px height from `.inline-qty-btn { height: 48px }`. The mismatch caused the card (which has `height: auto`) to grow/shrink on toggle, shifting all cards in the grid row.

**Issue 2 — Excessive spacing:**
- Base desktop grid used `gap: var(--bundle-product-card-spacing, 20px)` — 20px default
- `.sidebar-content .full-page-product-grid` override used `minmax(0, 1fr)` columns but inherited the 20px gap — proportionally much more noticeable with fluid columns
- TS/CSS defaults were 20px

## Fixes

1. `bundle-widget-full-page.css` — `.product-add-btn`: added `height: 48px; box-sizing: border-box; padding: 0 20px` (removes variable-height padding, locks to 48px)
2. `bundle-widget-full-page.css` — `.inline-quantity-controls`: added `height: 48px; box-sizing: border-box` (explicit to match add button)
3. `bundle-widget-full-page.css` — base desktop grid: changed gap fallback `20px` → `12px`
4. `bundle-widget-full-page.css` — sidebar grid override: added explicit `gap: var(--bundle-product-card-spacing, 12px)` so it doesn't silently inherit base fallback
5. `defaultSettings.ts` — `productCardSpacing` default: `20` → `12` for both PRODUCT_PAGE and FULL_PAGE
6. `css-variables-generator.ts` — fallback: `productCardSpacing || 20` → `productCardSpacing || 12`

## Progress Log

### 2026-03-12 21:00 - Fixed

- ✅ All 6 CSS/TS changes above
- ✅ Rebuilt `bundle-widget-full-page-bundled.js` (v1.3.4)
- Next: `shopify app deploy`

## Phases Checklist

- [x] Phase 1: Fix button/controls height mismatch
- [x] Phase 2: Reduce card spacing defaults
- [ ] Phase 3: Deploy
