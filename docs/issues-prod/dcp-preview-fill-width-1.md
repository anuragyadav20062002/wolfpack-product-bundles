# Issue: DCP Preview Skewed Left / Not Filling Preview Area

**Issue ID:** dcp-preview-fill-width-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-26
**Last Updated:** 2026-03-26 16:45

## Overview

DCP preview iframes are left-aligned instead of filling the available preview area:
1. `ModalLayout.tsx` wraps the preview in `display: inline-block` — this shrinks to content width (the control bar's natural width) rather than filling the flex center column.
2. `StorefrontIframePreview.tsx` iframe containers have `width: 100%; maxWidth: viewportWidth` but no centering — for mobile (375px) the container is narrower than the preview area and left-aligns.

## Fix

- `ModalLayout.tsx`: change `display: "inline-block"` → `display: "block"` + `width: "100%"` so the wrapper fills the center column.
- `StorefrontIframePreview.tsx` (both AppPreviewIframe and DualAppPreviewIframe): add `margin: "0 auto"` to the container so mobile (375px) is centered rather than left-aligned.

## Phases Checklist
- [x] Phase 1: Fix ModalLayout wrapper + center iframe containers

## Progress Log

### 2026-03-26 17:00 - Completed
- ✅ `ModalLayout.tsx`: changed wrapper from `display: inline-block` → `display: block; width: 100%` so it fills the flex center column
- ✅ `StorefrontIframePreview.tsx` (AppPreviewIframe): added `margin: 0 auto` to iframe container — mobile preview (375px) is now centered in wider preview areas
- ✅ `StorefrontIframePreview.tsx` (DualAppPreviewIframe): same `margin: 0 auto` applied

### 2026-03-26 16:45 - Starting implementation
- Files: `app/components/design-control-panel/ModalLayout.tsx`, `app/components/design-control-panel/preview/StorefrontIframePreview.tsx`
