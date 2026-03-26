# Issue: DCP FPB Preview — Smooth Layout Toggle Transition

**Issue ID:** dcp-fpb-preview-layout-transition-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-25
**Last Updated:** 2026-03-25 01:00

## Overview

When the merchant clicks the "Sidebar | Floating Footer" toggle in the DCP FPB preview panel,
the current implementation changes `effectiveUrl` (which changes the iframe `src`), causing a
full iframe reload. This produces a jarring blank-white flash while the new layout loads.

**Target behaviour:** Layout toggle is instant and smooth — no reload flash, no spinner.

## Root Cause

`PreviewPanel.tsx` drives the preview with a single `<AppPreviewIframe>` whose URL is rebuilt
when `fpbFooterLayout` state changes. Changing `src` on an `<iframe>` forces the browser to
perform a full document navigation (blank → load), which takes 200–600 ms and produces a
visible white flash.

## Fix: Dual Hidden Iframes + CSS Opacity Crossfade

Render **both** layout variants as iframes simultaneously on mount. Keep them both warm and
receiving CSS var updates. Toggle visibility with a 150 ms `opacity` transition — no reload,
no flash, sub-frame perceived latency.

### Changes

**`app/components/design-control-panel/preview/PreviewPanel.tsx`**

- Replace single `<AppPreviewIframe>` with two iframes (one per layout)
- Both are mounted immediately with their respective `?footerLayout=` URLs
- Active iframe: `opacity: 1`, pointer-events: auto
- Inactive iframe: `opacity: 0`, pointer-events: none
- CSS transition: `opacity 150ms ease` on both
- `postMessage(DCP_CSS_UPDATE)` pushed to **both** iframe windows
- Separate `iframeReadyRef` per layout; separate `pendingCssRef` per layout

## Files Modified

- `app/components/design-control-panel/preview/PreviewPanel.tsx` — dual-iframe logic, source-matched ready tracking
- `app/components/design-control-panel/preview/StorefrontIframePreview.tsx` — new `DualAppPreviewIframe` component

## Phases Checklist

- [x] Phase 1: Rewrite PreviewPanel to dual-iframe + opacity toggle
- [x] Phase 2: Lint
- [x] Phase 3: Commit

## Progress Log

### 2026-03-25 00:45 — Starting implementation

### 2026-03-25 01:00 — All phases completed

- ✅ Added `DualAppPreviewIframe` to `StorefrontIframePreview.tsx`
  - Both iframes (`urlA` sidebar, `urlB` floating) mounted on component mount
  - Active iframe: `opacity: 1`, `pointer-events: auto`
  - Inactive iframe: `opacity: 0`, `pointer-events: none`
  - `transition: opacity 150ms ease` — sub-frame perceived switch latency
  - Loading spinner shown only until the *active* iframe's `onLoad` fires
  - Inactive iframe loads silently in the background
- ✅ Rewrote `PreviewPanel.tsx`
  - FPB: uses `DualAppPreviewIframe` with separate `sidebarRef` / `floatingRef`
  - PDP: unchanged — single `AppPreviewIframe`
  - `DCP_PREVIEW_READY` source-matched to correct iframe ref via `e.source` comparison
  - CSS var updates pushed to **both** FPB iframes on every settings change
  - Pending CSS buffered independently per iframe
  - Footer layout toggle no longer changes any iframe URL — zero reload on switch
- ✅ Linted — 0 errors
