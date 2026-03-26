# Issue: DCP Storefront Iframe Preview — Sub-Plan 1: Shared Infrastructure

**Issue ID:** dcp-iframe-preview-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-24
**Last Updated:** 2026-03-24

## Overview

Replace the DCP modal's isolated component previews with a dual-mode preview:
- **While editing** (unsaved changes): existing CSS-variable component previews (real-time)
- **After Save** (no unsaved changes): scaled CSS iframe of the actual live storefront page

Sub-Plan 1 builds the shared infrastructure with no storefront URL wiring yet.
URLs are plumbed in Sub-Plans 2–4.

## Changes

### 1. `useDesignControlPanelState.ts`
Add `saveCount: number` state. Increment in `markAsSaved()` so the iframe `key` prop
changes after every save, forcing a reload.

### 2. `StorefrontIframePreview.tsx` (NEW)
- Renders iframe at 1440×900, CSS `transform: scale(containerWidth / 1440)`
- `transform-origin: top left`
- `pointer-events: none` (read-only)
- `sandbox="allow-scripts allow-same-origin"`
- Spinner while loading, graceful fallback on error
- `ResizeObserver` measures container width for live scale recalculation

### 3. `PreviewPanel.tsx`
Add props: `isDirty: boolean`, `previewUrl?: string | null`, `saveCount: number`.
When `!isDirty && previewUrl` → render `<StorefrontIframePreview>`.
Otherwise → existing CSS component previews (unchanged).

### 4. `route.tsx`
Thread `hasUnsavedChanges` and `saveCount` from each state hook into `PreviewPanel`.
Pass `previewUrl={null}` for now (wired in Sub-Plans 2–4).

## Progress Log

### 2026-03-24 - Implemented and committed

- ✅ Added `saveCount` (state + `saveCountRef`) to `useDesignControlPanelState`.
  `markAsSaved()` now increments `saveCountRef.current` and calls `setSaveCount` so the
  iframe key changes and forces a reload after every save.
- ✅ Created `StorefrontIframePreview.tsx`: iframe at 1440×900, CSS `transform: scale(…)`,
  `pointer-events: none`, `ResizeObserver` for live scaling, Spinner while loading,
  friendly fallback UI on error/block.
- ✅ Added `isDirty`, `previewUrl`, `saveCount` props to `PreviewPanel`. Renders
  `<StorefrontIframePreview>` when `!isDirty && previewUrl`; otherwise existing CSS
  component previews are unchanged.
- ✅ Threaded `isDirty={*.hasUnsavedChanges}`, `previewUrl={null}`, `saveCount={*.saveCount}`
  into both `<PreviewPanel>` instances in `route.tsx`. `previewUrl` is `null` until
  Sub-Plans 2–4 wire the real storefront URLs.
- ✅ Linted — 0 errors
- Files changed:
  - `app/hooks/useDesignControlPanelState.ts`
  - `app/components/design-control-panel/preview/StorefrontIframePreview.tsx` (NEW)
  - `app/components/design-control-panel/preview/PreviewPanel.tsx`
  - `app/routes/app/app.design-control-panel/route.tsx`

## Phases Checklist

- [x] Add `saveCount` to `useDesignControlPanelState`
- [x] Create `StorefrontIframePreview` component
- [x] Add dual-mode props + logic to `PreviewPanel`
- [x] Thread `isDirty`/`saveCount`/`previewUrl` through `route.tsx`
- [x] Lint + commit
