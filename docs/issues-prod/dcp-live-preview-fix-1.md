# Issue: DCP Live CSS Preview Not Updating + Section-Aware Preview

**Issue ID:** dcp-live-preview-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-26
**Last Updated:** 2026-03-26 18:00

## Overview

Two related problems with the DCP iframe preview:

1. **Live CSS not updating**: Changing a setting in the DCP (e.g. button color) doesn't reflect in
   the preview iframe in real-time.
2. **Section-aware preview broken**: Both tier pills AND header tabs are always visible in the FPB
   preview regardless of which section is active.

## Root Cause — Live CSS Preview

`@shopify/app-bridge-react` v4 creates a separate modal iframe per `<Modal>` that loads the full
app URL (`/app/design-control-panel?embedded=1&hmac=...`). The React components run in the
**app-iframe** window, but the DCP modals are rendered in separate **modal-frame** windows.

When the preview iframes fire `window.parent.postMessage({ type: 'DCP_PREVIEW_READY' }, '*')`,
`window.parent` resolves to the modal frame — NOT the app-iframe where `PreviewPanel`'s
`window.addEventListener("message", handleMessage)` is listening.

Result: `DCP_PREVIEW_READY` never arrives → `readyRef.current` stays `false` → CSS updates
queue in `pendingRef` forever, never sent.

## Fix

Replace `window.postMessage` with `BroadcastChannel('dcp-css-updates-{type}')`.
BroadcastChannel is scoped to same-origin browsing contexts regardless of frame hierarchy.
Both the app-iframe (`PreviewPanel`) and the preview iframes are at the same origin, so they
can communicate directly.

- FPB preview uses channel `dcp-css-updates-fpb`
- PDP preview uses channel `dcp-css-updates-pdp`

## Section-Aware Preview Fix

Pass `activeSubSection` to `PreviewPanel`, broadcast `DCP_SECTION_CHANGE` via BroadcastChannel,
preview page shows/hides `.bundle-tier-pill-bar` vs `.step-tabs-container` accordingly:
- `tierPills` → hide step tabs
- `headerTabs` → hide tier pills
- other → show both

## Phases Checklist
- [x] Phase 1: BroadcastChannel in preview page script + PreviewPanel + route wiring

## Progress Log

### 2026-03-26 18:20 - Completed
- ✅ `api.preview.$type.tsx`: Replaced `postMessageScript` constant with `getPreviewScript(type)` function that uses `BroadcastChannel('dcp-css-updates-{type}')`. Added `DCP_SECTION_CHANGE` handler — on `headerTabs` hides tier pills, on `tierPills` hides step tabs. `DCP_PREVIEW_READY` now broadcast via BroadcastChannel instead of `window.parent.postMessage`.
- ✅ `PreviewPanel.tsx`: Removed `readyRef`/`pendingRef`/`pushCss`/`window.addEventListener` approach. Added `channelRef` (BroadcastChannel), `latestCssVarsRef` (latest CSS for late-arriving ready signals), three effects: channel setup, CSS broadcast on settings change, section broadcast on activeSubSection change. Now destructures `activeSubSection` from props.
- ✅ `route.tsx`: Added `activeSubSection={fullPageState.activeSubSection}` and `activeSubSection={productPageState.activeSubSection}` to both `PreviewPanel` calls.

### 2026-03-26 18:00 - Starting implementation
- Files: `app/routes/api/api.preview.$type.tsx`, `app/components/design-control-panel/preview/PreviewPanel.tsx`, `app/routes/app/app.design-control-panel/route.tsx`
