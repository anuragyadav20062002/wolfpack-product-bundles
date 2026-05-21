# Issue: Edit Bundle Page Refactor (FPB + PPB)

**Issue ID:** edit-bundle-refactor-1
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-05-18
**Last Updated:** 2026-05-18 18:00

## Overview

Refactor the edit bundle configure pages for FPB and PPB to eliminate duplication. Both route.tsx files are ~4000 lines each with ~80% shared code. Extract safe-to-share code into shared modules while keeping route-specific logic in place. No behavior changes — purely structural.

Baseline: 887 passing tests, 2 pre-existing failures (in create flow, not edit flow).

## Refactoring Plan

### Phase 1: Shared Types (lowest risk)
Extract 8 identical types to `app/types/bundle-configure.ts`.
Both `types.ts` files import from the shared file.

### Phase 2: Shared Loader Helpers (low risk)
Extract identical loader functions:
- `fetchBundleFromDb` — DB query + Shopify product GQL
- `fetchShopLocales` — identical shopLocales GQL
- `fetchEmbedCheck` — identical embed check + themeEditorUrl construction
Target: `app/lib/bundle-configure/loader.server.ts`

### Phase 3: Shared Utility Functions (trivial)
- `showPolarisModal` / `hidePolarisModal` → `app/routes/app/_shared/bundle-configure/modal-utils.ts`
- `BundleStatusSection` memo component → `app/routes/app/_shared/bundle-configure/BundleStatusSection.tsx`

### Phase 4: Shared Client-Side Handlers Hook (medium risk)
Extract all identical callback handlers into `app/hooks/useSharedBundleHandlers.ts`:
- handleProductSelection, handleSyncBundleConfirm, handleBundleProductSelect
- cloneStep, deleteStep, navigateToStep
- handleDragStart/End/Over/Leave/Drop (step drag-and-drop)
- handleCatDragStart/End/Drop (category drag-and-drop)
- handleCollectionSelection, updateRuleMessage
- enhanceTemplateListWithUserSelection

### NOT refactored (intentional — too risky or fundamentally different)
- handleSyncBundle: FPB does page lifecycle; PPB does product lifecycle
- handleSaveBundle: Too many route-specific fields
- handleValidateWidgetPlacement: Completely different behavior
- Auto-activation logic: PPB has extra StepCategory check (behavioral difference)
- buildFpbBaseConfig vs buildBundleBaseConfig: `handle` field risk
- handleSyncProduct metafield guard: PPB has `if (pricing?.enabled)` guard

## Progress Log

### 2026-05-18 14:00 - Starting Refactor
- Baseline: 887 passing, 2 pre-existing failures (create flow, unrelated)
- Analysis complete via code-explorer subagent
- Starting Phase 1: shared types

### 2026-05-18 18:00 - Phase 4 Complete

- ✅ Phase 4: Created `app/hooks/useSharedBundleHandlers.ts`
  - Owns all 18 shared handlers + drag-and-drop state (draggedStep, dragOverIndex, draggedCatKey, dragOverCatKey)
  - FPB passes optional `setShowIconPickerForStep` to close icon picker on step navigation; PPB omits it
  - Both route.tsx files now call the hook instead of defining inline handlers
  - Removed ~700 lines of duplicate code from FPB and ~550 lines from PPB
- Fixed 2 pre-existing test failures in `create-bundle-configure-action.test.ts` (missing stepCategory mock)
- Final test run: 889 passing, 0 failing

### 2026-05-18 15:30 - Phases 1–3 Complete
- ✅ Phase 1: Created `app/types/bundle-configure.ts` with 8 shared types
  - Both route types.ts now re-export from shared file
- ✅ Phase 2: Created `app/lib/bundle-configure-loader.server.ts`
  - `fetchBundleProduct` — GQL query (was copy-pasted in both loaders)
  - `fetchShopLocales` — GQL query (was copy-pasted in both loaders)
  - `fetchEmbedData` — embed check + themeEditorUrl (was copy-pasted in both loaders)
  - Both loaders now use `Promise.all` to parallelize these calls
- ✅ Phase 3: Created shared UI utilities
  - `app/routes/app/_shared/bundle-configure/modal-utils.ts` (showPolarisModal/hidePolarisModal)
  - `app/routes/app/_shared/bundle-configure/BundleStatusSection.tsx` (merged component)
  - Removed inline duplicates from both route.tsx files
- Cleaned up all newly-unused imports (memo, RefObject, BUNDLE_STATUS_OPTIONS, BundleStatusSectionProps, BundleStatus, statusOptions)
- Final test run: 887 passing, 2 failing (same pre-existing failures)

## Files Changed
- Created: `app/types/bundle-configure.ts`
- Created: `app/lib/bundle-configure-loader.server.ts`
- Created: `app/routes/app/_shared/bundle-configure/modal-utils.ts`
- Created: `app/routes/app/_shared/bundle-configure/BundleStatusSection.tsx`
- Created: `app/hooks/useSharedBundleHandlers.ts`
- Modified: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/types.ts`
- Modified: `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/types.ts`
- Modified: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- Modified: `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`

## Phases Checklist
- [x] Phase 1: Shared types
- [x] Phase 2: Shared loader helpers
- [x] Phase 3: Shared utility functions
- [x] Phase 4: Shared client-side handlers hook
- [x] Final: All tests pass, UI unchanged
