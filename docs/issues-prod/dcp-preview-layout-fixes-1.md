# Issue: DCP Preview Layout Fixes

**Issue ID:** dcp-preview-layout-fixes-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-03-26
**Last Updated:** 2026-03-26

## Overview

Full audit of DCP preview UI using Chrome DevTools revealed 4 broken areas:

1. FPB Sidebar layout: `.step-tabs-container` expands to 640px (no width constraint in sidebar context) — creates a massive near-black left column
2. Preview iframe scales UP beyond 1:1 at large DCP panels (scale > 1.0)
3. FPB Floating layout: promo banner is 220px tall, wastes vertical preview space
4. DCP modal: settings panel (240px) + nav sidebar (220px) = 460px taken, leaving only ~564px preview at 1024px screens

## Phases Checklist
- [x] Phase 1: Fix FPB sidebar step-tabs-container layout (CSS)
- [x] Phase 2: Cap preview scale at 1.0 in StorefrontIframePreview
- [x] Phase 3: Compact promo banner in FPB floating preview
- [x] Phase 4: Narrow settings panel to 200px for more preview space

## Progress Log

### 2026-03-26 - Completed all phases
- ✅ Phase 1: Added `.sidebar-layout-wrapper .step-tabs-container { flex-direction: column; width: 240px; min-width: 240px; flex-shrink: 0; ... }` and `.sidebar-layout-wrapper .step-tab { width: 100%; }` to `bundle-widget-full-page.css`. Fixes the 640px-wide black step-tabs column in sidebar layout.
- ✅ Phase 2: Capped `scale = Math.min(1, containerWidth / viewportWidth)` in both `AppPreviewIframe` and `DualAppPreviewIframe`. Added `maxWidth: viewportWidth + 'px'` to both containers. Prevents zoomed-in preview at large DCP panels.
- ✅ Phase 3: Reduced promo banner at 1024px+ from `min-height: 220px / padding: 48px` to `min-height: 160px / padding: 32px`. Recovers ~60px vertical preview space in floating layout.
- ✅ Phase 4: Narrowed `.settingsPanel` from 240px to 200px and padding from 20px to 16px. Gives preview panel ~40px more width on smaller screens.

### 2026-03-26 - Starting implementation
- Root cause confirmed via Chrome DevTools: `.step-tabs-container` has no width/direction constraints in sidebar context
- At 2316px viewport: step-tabs = 640px, content = 1280px, side-panel = 360px (should be ~240/840/360)
- Scale at large panels: 1840/1440 = 1.28× (zoomed in, should cap at 1.0)
