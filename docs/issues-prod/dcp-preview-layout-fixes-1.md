# Issue: DCP Preview Layout Fixes

**Issue ID:** dcp-preview-layout-fixes-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-26
**Last Updated:** 2026-03-26 14:00

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
- [x] Phase 5: Pixel-perfect parity — fix preview HTML structure + font to match live widget

## Progress Log

### 2026-03-26 - Completed all phases
- ✅ Phase 1: Added `.sidebar-layout-wrapper .step-tabs-container { flex-direction: column; width: 240px; min-width: 240px; flex-shrink: 0; ... }` and `.sidebar-layout-wrapper .step-tab { width: 100%; }` to `bundle-widget-full-page.css`. Fixes the 640px-wide black step-tabs column in sidebar layout.
- ✅ Phase 2: Capped `scale = Math.min(1, containerWidth / viewportWidth)` in both `AppPreviewIframe` and `DualAppPreviewIframe`. Added `maxWidth: viewportWidth + 'px'` to both containers. Prevents zoomed-in preview at large DCP panels.
- ✅ Phase 3: Reduced promo banner at 1024px+ from `min-height: 220px / padding: 48px` to `min-height: 160px / padding: 32px`. Recovers ~60px vertical preview space in floating layout.
- ✅ Phase 4: Narrowed `.settingsPanel` from 240px to 200px and padding from 20px to 16px. Gives preview panel ~40px more width on smaller screens.

### 2026-03-26 14:30 - Completed Phase 5: Pixel-perfect parity
- ✅ Font fix: added `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` to `html, body` in `pageLayoutCss` — eliminates browser-default "Times" serif
- ✅ Body overflow: changed from `overflow: hidden` to `overflow-y: auto` so FPB content can scroll; PDP modal is `position:fixed` so unaffected
- ✅ Bundle header: added `.bundle-header` with `.bundle-title` / `.bundle-description` to both FPB sidebar and floating previews
- ✅ Tier pills order: moved `.bundle-tier-pill-bar` to be the first child of `.bundle-widget-full-page` (before header), matching live widget's `container.insertBefore(bar, container.firstChild)` call
- ✅ FPB sidebar structure: wrapped content in `.bundle-steps.full-page-layout.layout-sidebar` + moved promo-banner inside `sidebar-content` (matches live widget)
- ✅ FPB floating structure: wrapped content in `.bundle-steps.full-page-layout` + moved promo-banner + step-tabs inside `full-page-content-section` (matches live widget)
- ✅ Product grid container: added `.full-page-product-grid-container` wrapper around `.full-page-product-grid` in both layouts
- ✅ Live widget JS fix: moved `createStepTimeline()` from inside `contentSection` to be a direct flex child of `twoColWrapper` in `renderFullPageLayoutWithSidebar()` — now matches preview 3-column structure (tabs | content | panel) and CSS rule intent
- ✅ Widget bundle rebuilt: `npm run build:widgets:full-page` → 250.2 KB

### 2026-03-26 14:00 - Starting Phase 5: Pixel-perfect parity
- Investigated live widget JS structure vs preview mock HTML — found 5 discrepancies
- Fix 1: Font — preview body uses browser-default "Times", live store inherits theme sans-serif → add system font stack to pageLayoutCss
- Fix 2: Missing bundle-header in FPB previews (both sidebar + floating)
- Fix 3: Tier pills order — live widget inserts them as container.firstChild (before header), preview has them below promo-banner
- Fix 4: step-tabs-container in sidebar layout — live JS appends it inside sidebar-content, but CSS treats it as a direct flex child of sidebar-layout-wrapper → fix live widget JS to append step-tabs directly to twoColWrapper (making it a proper 3-column layout: tabs | content | panel), then update preview HTML to match
- Fix 5: Missing full-page-product-grid-container wrapper in product grid sections
- Files to change: bundle-widget-full-page.js (widget JS), api.preview.$type.tsx (preview HTML + font), bundle-widget-full-page.css (already has correct CSS rules from Phase 1)

### 2026-03-26 - Starting implementation
- Root cause confirmed via Chrome DevTools: `.step-tabs-container` has no width/direction constraints in sidebar context
- At 2316px viewport: step-tabs = 640px, content = 1280px, side-panel = 360px (should be ~240/840/360)
- Scale at large panels: 1840/1440 = 1.28× (zoomed in, should cap at 1.0)
