# Issue: FPB Sidebar Layout — 3 CSS/JS Bugs

**Issue ID:** sidebar-layout-bugs-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-24
**Last Updated:** 2026-03-24

## Overview

Three bugs identified via Chrome DevTools audit on `wolfpack-store-test-1.myshopify.com/pages/radhe-radhe`
(sidebar layout bundle):

1. **Product cards stacked** — cards render at fixed 280px width inside grid columns that are only
   ~206px wide (sidebar steals 360px + 80px side padding). Cards overflow and wrap/stack.
2. **Layout shift on product add** — auto-advance on step completion calls `reRenderFullPage()` which
   tears down and rebuilds the entire DOM. In sidebar mode this causes a jarring full-page redraw.
3. **Tooltip clipped** — locked step tab tooltip (`bottom: calc(100% + 8px)`, position absolute) is
   clipped by `.sidebar-layout-wrapper .sidebar-content { overflow: auto }`.

## Root Causes

**Bug 1:** `@media (min-width:1024px)` sidebar grid override sets `minmax(0, 1fr)` columns but the
base desktop rule at the same breakpoint sets `.product-card { min-width: 280px }`. The card's
fixed min-width overrides the flexible column, causing overflow.

**Bug 2:** `updateProductSelection()` auto-advance always calls `reRenderFullPage()` regardless of
layout. Sidebar mode doesn't need a full re-render — only the product grid content and side panel
need updating.

**Bug 3:** `.sidebar-layout-wrapper .sidebar-content` has `overflow: auto`. Any absolutely-positioned
child that renders outside the scrollable box is clipped. The tooltip appears ~24px above the tabs
which puts it outside the content section's bounding box.

## Confirmed via DevTools

- Tooltip: `tooltipRect.top = 33.4px` < `contentSectionTop = 57px` → clipped
- Card: computed card width `280px` vs grid column width `206.25px` (4 cols in 885px grid)

## Fix Plan

**Fix 1 (CSS):** Add `.sidebar-content .product-card` reset inside the `@media (min-width:1024px)`
sidebar block:
```css
width: 100%;
min-width: 0;
max-width: 100%;
```

**Fix 2 (CSS):** Change `.sidebar-layout-wrapper .sidebar-content` from `overflow: auto` to
`overflow: visible` so the tooltip is not clipped. Page scroll is handled naturally by the body;
the sticky side panel remains in place via `position: sticky`.

**Fix 3 (JS):** In `updateProductSelection()` auto-advance block, detect sidebar layout
(`this.selectedBundle.layout === 'sidebar'`) and do surgical update instead of `reRenderFullPage()`.

## Progress Log

### 2026-03-24 - Identified via DevTools audit

- Audited sidebar layout bundle at wolfpack-store-test-1.myshopify.com/pages/radhe-radhe
- Confirmed all 3 bugs with computed styles and DOM measurements

### 2026-03-24 - Implemented and committed

- ✅ Fix 1 (CSS): Added `.sidebar-content .product-card { width:100%; min-width:0; max-width:100% }`
  inside the `@media (min-width:1024px)` sidebar block in `bundle-widget-full-page.css`
- ✅ Fix 2 (CSS): Added `overflow: visible` to `.sidebar-layout-wrapper .sidebar-content` in
  `bundle-widget-full-page.css` to stop tooltip clip
- ✅ Fix 3 (JS): Added `_sidebarAdvanceToNextStep()` method that surgically swaps the product grid,
  category tabs, and search input without re-mounting the entire two-column layout.
  Updated auto-advance block in `updateProductSelection()` to call it when layout is `footer_side`.
- ✅ Bumped WIDGET_VERSION: 2.3.4 → 2.3.5 (PATCH — bug fix)
- ✅ Built widget bundles (FP: 250.7 KB, PP: 152.1 KB)
- ✅ CSS size check: 96,790 B < 100,000 B limit ✅
- ✅ Linted — 0 errors
- Files changed:
  - `extensions/bundle-builder/assets/bundle-widget-full-page.css`
  - `app/assets/bundle-widget-full-page.js`
  - `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js`
  - `extensions/bundle-builder/assets/bundle-widget-product-page-bundled.js`
  - `scripts/build-widget-bundles.js`
- Next: `shopify app deploy` (manual) + validate on live store

## Phases Checklist

- [x] Fix 1: CSS card width reset in sidebar grid block
- [x] Fix 2: CSS overflow visible on sidebar-content
- [x] Fix 3: JS surgical update for sidebar auto-advance
- [x] Bump WIDGET_VERSION + build widget bundles
- [x] Lint + commit
- [ ] Validate on live store after deploy
