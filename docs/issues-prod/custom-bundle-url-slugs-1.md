---
name: custom-bundle-url-slugs-1
description: Custom brandable URL slugs for full-page bundles
type: project
---

# Issue: Custom Brandable URL Slugs for Full-Page Bundles

**Issue ID:** custom-bundle-url-slugs-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-17
**Last Updated:** 2026-03-17 11:30

## Overview

Full-page bundle pages currently receive machine-generated, UUID-derived handles (`bundle-{mongoId}`), producing non-brandable URLs. This feature adds a "Page URL slug" field to the configure page that defaults to a slugified bundle name, is editable before/after placement, and updates the Shopify page handle via `pageUpdate` on save.

## Reference
- BR: `docs/custom-bundle-url-slugs/00-BR.md`
- PO: `docs/custom-bundle-url-slugs/02-PO-requirements.md`
- Architecture: `docs/custom-bundle-url-slugs/03-architecture.md`
- SDE Plan: `docs/custom-bundle-url-slugs/04-SDE-implementation.md`

## Files to Modify / Create
1. `app/lib/slug-utils.ts` — NEW: slugify, validateSlug, resolveUniqueHandle
2. `app/services/widget-installation/types.ts` — extend FullPageBundleResult
3. `app/services/widget-installation/widget-full-page-bundle.server.ts` — accept desiredSlug, add renamePageHandle
4. `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` — pass desiredSlug, add handleRenamePageSlug
5. `app/hooks/useBundleForm.ts` — add pageSlug state
6. `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` — add Storefront Page card

## Test Files to Create
1. `tests/unit/lib/slug-utils.test.ts`
2. `tests/unit/services/widget-full-page-bundle.test.ts`
3. `tests/unit/routes/full-page-bundle-slug.test.ts`

## Phases Checklist

- [x] Phase 1: slug-utils.ts — tests + implementation ✅
- [x] Phase 2: Service layer — types + createFullPageBundle + renamePageHandle (tests + impl) ✅
- [x] Phase 3: Handler layer — handleValidateWidgetPlacement + handleRenamePageSlug (tests + impl) ✅
- [x] Phase 4: UI layer — useBundleForm + route.tsx (no TDD required for UI) ✅
- [x] Phase 5: Lint, full test run, commit ✅

## Progress Log

### 2026-03-17 11:00 - Planning Complete
- ✅ BR, PO, Architecture documents created
- ✅ SDE implementation plan written
- ✅ Issue file created
- Next: Begin Phase 1 — slug-utils.ts

### 2026-03-17 11:30 - All Phases Completed
- ✅ Phase 1: Created `app/lib/slug-utils.ts` — `slugify()`, `validateSlug()`, `resolveUniqueHandle()` (25 tests)
- ✅ Phase 2: Extended `widget-full-page-bundle.server.ts` — optional `desiredSlug` param + `renamePageHandle()` (7 tests); extended `types.ts` with `slugAdjusted` field
- ✅ Phase 3: Extended `handleValidateWidgetPlacement` with `desiredSlug`; added `handleRenamePageSlug`; updated barrel export (7 tests)
- ✅ Phase 4: Extended `useBundleForm` with `pageSlug`/`setPageSlug`/`hasManuallyEditedSlug` + auto-update from bundle name; added "Storefront Page" card to route.tsx; wired slug into Add to Storefront and Save actions
- ✅ Phase 5: 425/425 tests pass, 0 ESLint errors
- Files Created: `app/lib/slug-utils.ts`, `tests/unit/lib/slug-utils.test.ts`, `tests/unit/services/widget-full-page-bundle.test.ts`, `tests/unit/routes/full-page-bundle-slug.test.ts`, `docs/custom-bundle-url-slugs/04-SDE-implementation.md`
- Files Modified: `app/hooks/useBundleForm.ts`, `app/hooks/useBundleConfigurationState.ts`, `app/services/widget-installation/types.ts`, `app/services/widget-installation/widget-full-page-bundle.server.ts`, `handlers/handlers.server.ts`, `handlers/index.ts`, `route.tsx`

**Total Tests Added:** 39 (25 + 7 + 7)
**Status:** Completed ✅
