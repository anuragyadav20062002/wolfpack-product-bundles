# Issue: DCP Mobile Preview Toggle

**Issue ID:** dcp-mobile-preview-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-26
**Last Updated:** 2026-03-26 16:30

## Overview

Add a Desktop/Mobile viewport toggle to the DCP preview panel so merchants can check how their bundle widget renders at 375px mobile width.

## Phases Checklist
- [x] Phase 1: Add `viewportWidth` prop to `StorefrontIframePreview` components
- [x] Phase 2: Add viewport toggle state + buttons to `PreviewPanel`

## Related Documentation
- `docs/dcp-mobile-preview/00-BR.md`
- `docs/dcp-mobile-preview/02-PO-requirements.md`
- `docs/dcp-mobile-preview/03-architecture.md`
- `docs/dcp-mobile-preview/04-SDE-implementation.md`

## Progress Log

### 2026-03-26 16:30 - All phases complete
- ✅ Phase 1: `AppPreviewIframe` and `DualAppPreviewIframe` gain `viewportWidth?: number` (default `DESKTOP_WIDTH`); scale computed as `containerWidth / viewportWidth`; iframe CSS width uses `viewportWidth`; `useEffect` dep array includes `viewportWidth`; scale resets on width change
- ✅ Phase 2: `PreviewPanel` gains `ViewportMode` type, `MOBILE_WIDTH=375` const, `viewportMode` state, `viewportWidth` derived value; Desktop/Mobile toggle buttons rendered above existing footer layout toggle (reuse `TOGGLE_BTN_BASE`/`TOGGLE_BTN_ACTIVE`); `viewportWidth` passed to both iframe components

### 2026-03-26 15:45 - Starting implementation
