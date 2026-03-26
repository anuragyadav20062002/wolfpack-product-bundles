# SDE Implementation Plan: DCP Mobile Preview Toggle

## Overview

Two files modified: `StorefrontIframePreview.tsx` (add `viewportWidth` prop to both iframe components) and `PreviewPanel.tsx` (add viewport toggle state + buttons).

## Phase 1: Update `StorefrontIframePreview.tsx`

- Add `viewportWidth?: number` (default `DESKTOP_WIDTH`) to `AppPreviewIframeProps`
- Replace all `DESKTOP_WIDTH` references in `AppPreviewIframe` with `viewportWidth`
- Add `viewportWidth?: number` to `DualAppPreviewIframeProps`
- Replace all `DESKTOP_WIDTH` references in `DualAppPreviewIframe` with `viewportWidth`
- The `DESKTOP_WIDTH` constant stays as the default fallback

## Phase 2: Update `PreviewPanel.tsx`

- Add `MOBILE_WIDTH = 375` constant
- Add `viewportMode: "desktop" | "mobile"` state (default `"desktop"`)
- Derive `viewportWidth = viewportMode === "mobile" ? MOBILE_WIDTH : DESKTOP_WIDTH`
- Add viewport toggle row (Desktop / Mobile buttons) above the existing footer layout toggle row
- Pass `viewportWidth` to `DualAppPreviewIframe` and `AppPreviewIframe`

## Build & Verification Checklist
- [ ] TypeScript compiles without new errors
- [ ] FPB modal: Desktop toggle → 1440px preview (unchanged)
- [ ] FPB modal: Mobile toggle → 375px preview (widget CSS media queries fire at mobile breakpoints)
- [ ] FPB footer layout toggle still works independently
- [ ] PDP modal: viewport toggle visible and functional
- [ ] Settings changes still push to iframe via postMessage in both viewport modes
- [ ] No extra iframes created

## Rollback Notes
Changes are contained to two files. Revert is a single `git revert`.
