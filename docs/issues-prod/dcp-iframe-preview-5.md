# Issue: DCP Preview — Option 3 App-Served Preview Page

**Issue ID:** dcp-iframe-preview-5
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-03-24
**Last Updated:** 2026-03-24 10:00

## Overview

Pivot from dual-mode preview (CSS components while editing / storefront iframe after save) to
Option 3: a single always-on app-served preview page. The preview page is same-origin as the
app, enabling real-time CSS variable injection via `postMessage`. The merchant sees all widget
components together in context, and can interact with them (open modal for PDP, etc.).

### Why Option 3

The dual-mode approach had two problems:
1. The CSS component previews are isolated — they show one section at a time, not the full widget
2. The storefront iframe has X-Frame-Options and requires saving before refreshing

Option 3 fixes both:
- Shows ALL components together in a realistic layout
- Real-time CSS updates via postMessage (no save required)
- Interactive: the PDP modal can be opened/closed

## Progress Log

### 2026-03-24 00:00 - Starting Option 3 Implementation

**Changes planned:**
- Create `app/routes/api/api.preview.$type.tsx` — app-served preview HTML page
- Modify `app/components/design-control-panel/preview/PreviewPanel.tsx` — remove dual-mode,
  always show iframe, send postMessage on settings change
- Modify `app/components/design-control-panel/preview/StorefrontIframePreview.tsx` — remove
  pointer-events:none, remove saveCount prop, add iframeRef forwarding
- Modify `app/routes/app/app.design-control-panel/route.tsx` — simplify loader, build
  preview URLs from SHOPIFY_APP_URL (no more product/page handle queries)

**Expected outcome:** DCP preview always shows a realistic, interactive widget layout that
updates in real-time as the merchant changes settings.

## Related Documentation
- Plan: `.claude/plans/starry-crunching-dawn.md`
- Previous sub-plans: `dcp-iframe-preview-1.md` through `dcp-iframe-preview-4.md`

### 2026-03-24 10:00 - Completed Option 3 Implementation

- ✅ Created `app/routes/api/api.preview.$type.tsx` — serves PDP + FPB preview HTML
  - Inlines widget CSS (read from extension assets via fs.readFileSync)
  - Loads initial design settings CSS from `/api/design-settings/{shop}`
  - Listens for `postMessage({ type: 'DCP_CSS_UPDATE', vars: '...' })`
  - Signals readiness via `postMessage({ type: 'DCP_PREVIEW_READY' })`
- ✅ Rewrote `PreviewPanel.tsx` — always-on iframe, sends postMessage on settings change
  - Handles ready protocol (buffers pending CSS until iframe signals ready)
  - Removed all dual-mode logic (isDirty/saveCount switches)
- ✅ Rewrote `StorefrontIframePreview.tsx` → renamed internaly to `AppPreviewIframe`
  - Removed `pointer-events: none` (interactive preview)
  - Removed `saveCount` prop
  - Added `forwardRef` for iframe ref passing
- ✅ Simplified DCP loader — removed product/page GraphQL queries and template writes
  - Preview URLs now built from `SHOPIFY_APP_URL` (instant, no DB/GraphQL)
- Next: test visually on dev store

## Phases Checklist
- [x] Phase 1: Create app-served preview HTML route
- [x] Phase 2: Modify PreviewPanel for always-on iframe + postMessage
- [x] Phase 3: Modify StorefrontIframePreview (remove dual-mode props)
- [x] Phase 4: Simplify DCP loader (app URL based preview URLs)
- [ ] Phase 5: Test and commit
