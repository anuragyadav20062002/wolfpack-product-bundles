# Issue: PDP Bundle Auto-Template

**Issue ID:** pdp-bundle-auto-template-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-17
**Last Updated:** 2026-03-17 20:30

## Overview

Auto-apply `templates/product.product-page-bundle.json` (with `bundle-product-page` block)
to the linked Shopify product when a product-page bundle is saved or synced.
Eliminates manual Theme Editor setup for merchants.

## Related Documentation
- docs/pdp-bundle-auto-template/00-BR.md
- docs/pdp-bundle-auto-template/02-PO-requirements.md
- docs/pdp-bundle-auto-template/03-architecture.md
- docs/pdp-bundle-auto-template/04-SDE-implementation.md

## Phases Checklist

- [x] Phase 1: ensureProductBundleTemplate() with 13 tests ✅
- [x] Phase 2: Export + wire into handleSaveBundle + handleSyncBundle ✅

## Progress Log

### 2026-03-17 20:30 - All Phases Completed

- ✅ `PRODUCT_TEMPLATE_KEY` + `PRODUCT_BLOCK_HANDLE` constants added
- ✅ `ensureProductBundleTemplate()` added to `widget-theme-template.server.ts`
- ✅ Extracted `appendBundleWidgetSection()` — both build fns share logic
- ✅ `readBaseProductTemplate()` — clones `product.json`, minimal fallback
- ✅ UUID resolution moved before base template read (fail fast) in both functions
- ✅ Exported from `index.ts`
- ✅ `handleSaveBundle`: template ensure + `templateSuffix` merged into productUpdate mutation
- ✅ `handleSyncBundle`: template ensure + `templateSuffix` on re-created product
- ✅ 13 new tests, 510 total passing, zero regressions
- ✅ Zero lint errors

**Files Modified:**
- `app/services/widget-installation/widget-theme-template.server.ts`
- `app/services/widget-installation/index.ts`
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts`

**Files Created:**
- `tests/unit/services/ensure-product-bundle-template.test.ts`
- `docs/pdp-bundle-auto-template/` (BR, PO, Architecture, SDE plan)
- `docs/issues-prod/pdp-bundle-auto-template-1.md`
