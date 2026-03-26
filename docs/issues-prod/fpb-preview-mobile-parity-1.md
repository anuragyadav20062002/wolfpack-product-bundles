# Issue: FPB Preview Mobile Parity

**Issue ID:** fpb-preview-mobile-parity-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-26
**Last Updated:** 2026-03-26 16:30

## Overview

The DCP FPB preview iframe is missing the mobile bottom bar elements that the live widget renders at ≤767px. At mobile (375px viewport), the live widget:
- Hides `.full-page-side-panel` via CSS (`display: none !important`)
- Appends `.fpb-mobile-backdrop`, `.fpb-mobile-bottom-sheet` (with full side panel content), and `.fpb-mobile-bottom-bar` (toggle + total + CTA) to `document.body`

The preview HTML was missing these three elements entirely, causing an empty gap at the bottom of the mobile preview. Also, both FPB root divs had a redundant `style="min-height:100vh;"` inline attribute (CSS already handles this).

## Phases Checklist
- [x] Phase 1: Add mobile bottom bar/sheet/backdrop to `fpbSidebarHtml` + remove redundant inline styles

## Progress Log

### 2026-03-26 16:30 - Completed Phase 1
- ✅ Added `.fpb-mobile-backdrop` (empty div, `position:fixed`, shown via `.is-open` class) after `.bundle-widget-full-page` close tag in `fpbSidebarHtml`
- ✅ Added `.fpb-mobile-bottom-sheet` with full side panel content (discount message, item count, product rows, total, nav buttons) — `position:fixed bottom:56px`, `transform:translateY(100%)` default (slides up on `.is-open`)
- ✅ Added `.fpb-mobile-bottom-bar` with toggle button (`fpb-caret` + `fpb-mobile-toggle-count`), total div, CTA button — `position:fixed bottom:0`, `display:flex` at ≤767px via CSS media query
- ✅ Removed redundant `style="min-height:100vh;"` from both `fpbSidebarHtml` and `fpbFloatingHtml` root divs (CSS `.bundle-widget-full-page { min-height: 100vh }` in `pageLayoutCss` handles this)
- Floating layout correctly NOT changed — `.full-page-footer.floating-card` is `position:fixed` and renders correctly at mobile without additional elements

### 2026-03-26 16:00 - Starting implementation
- File to change: `app/routes/api/api.preview.$type.tsx`
- Add `.fpb-mobile-backdrop` (empty), `.fpb-mobile-bottom-sheet` (side panel content), `.fpb-mobile-bottom-bar` (toggle + total + CTA) after `</div><!-- /.bundle-widget-full-page -->` in `fpbSidebarHtml`
- Remove `style="min-height:100vh;"` from both FPB root divs (CSS handles this via `.bundle-widget-full-page { min-height: 100vh; }` in `pageLayoutCss`)
- Floating layout does NOT need mobile bar — `.full-page-footer.floating-card` uses `position: fixed` and stays visible at all viewports
