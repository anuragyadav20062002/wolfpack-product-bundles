# Issue: DCP Settings Silently Not Saved to DB

**Issue ID:** dcp-settings-not-saved-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-19
**Last Updated:** 2026-03-19 23:30

## Overview
`buildSettingsData()` in `handlers.server.ts` was never updated when new direct Prisma columns were added to `DesignSettings`. As a result, ~40 fields are tracked dirty in the DCP UI, appear to save (success toast shown), but are silently dropped — the DB upsert never writes them. On page reload, `mergeSettings` correctly reads the columns but they're still at their default values since they were never persisted.

Also: the configure page save effect does not update the discard baselines for 5 bundle-level media/tier fields (`promoBannerBgImage`, `promoBannerBgImageCrop`, `loadingGif`, `tierConfig`, `showStepTimeline`) after a successful save, so clicking Discard after saving reverts those fields to the initial page-load values.

## Progress Log

### 2026-03-19 23:15 - Starting fix
- Identified all missing fields by cross-referencing Prisma schema with `buildSettingsData`
- Fix: add all 40 missing direct columns to `buildSettingsData` in `handlers.server.ts`
- Secondary fix: update discard baselines in configure route after successful save

### 2026-03-19 23:30 - Completed
- Phase 1: Added 40 missing direct columns to `buildSettingsData` in `handlers.server.ts` (buttonAddedBgColor/TextColor, buttonTextTransform/LetterSpacing, productCardHoverTranslateY/TransitionDuration, tileQuantityBadge*, modalCloseButton*, focusOutline*, searchInput*, skeleton*, tierPill* ×11, loadingOverlay*, widgetStyle/bottomSheet*/emptySlot*)
- Phase 2: Full-page configure route — update 5 discard baseline refs (promoBannerBgImage, promoBannerBgImageCrop, loadingGif, tierConfig, showStepTimeline) inside save success effect. Product-page configure route — update originalLoadingGifRef after markAsSaved()
- Phase 3: ESLint clean (0 errors), committed
- Files changed: `app/routes/app/app.design-control-panel/handlers.server.ts`, `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`, `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`

## Phases Checklist
- [x] Phase 1: Fix `buildSettingsData` — add all missing direct columns
- [x] Phase 2: Fix configure route discard baseline refs after save
- [x] Phase 3: ESLint, lint, commit
