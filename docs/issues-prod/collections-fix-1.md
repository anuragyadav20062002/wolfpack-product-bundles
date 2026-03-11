# Issue: Fix Collections End-to-End (Metafield, Widget, Inventory)

**Issue ID:** collections-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-09
**Last Updated:** 2026-03-09 10:00

## Overview

Collections are stored in `BundleStep.collections` (JSON) but never propagate through the full stack:

1. **Metafield sync** — `step.collections` never expanded into `component_reference`/`bundle_ui_config` → cart transform never sees collection products → checkout fails for collection-only steps.
2. **Widget tab filter** — `activeCollection.products` is never set → tab filter shows all products regardless of active collection tab.
3. **`bundle_ui_config`** — Missing `collections` field in step mapping → widget can't render collection tabs or fetch collection products at all.
4. **Inventory sync** — `step.StepProduct` only; collection products ignored → wrong inventory calculated.

## Root Cause

`bundle-product.server.ts` `productIdMap` loop and `bundleUiConfig.steps` builder only process `step.StepProduct` / `step.products` — never `step.collections`.

## Phases Checklist

- [x] Phase 1 — Create issue file
- [x] Phase 2 — Fix `bundle-product.server.ts`: add collections to bundleUiConfig + productIdMap
- [x] Phase 3 — Fix `api.storefront-collections.tsx`: return `byCollection` map
- [x] Phase 4 — Fix `bundle-widget-full-page.js`: use `byCollection` for tab filter
- [x] Phase 5 — Fix `inventory-sync.server.ts`: include collection products
- [x] Phase 6 — Fix `hasProducts` validation in configure handlers
- [x] Phase 7 — Build widgets + lint + commit

## Progress Log

### 2026-03-09 10:30 — Completed all phases

**Changes made:**
- `bundle-product.server.ts`: Added collection product fetching loop (Admin API `collection(handle:)` query) to populate `productIdMap`; added `collections` field to `bundleUiConfig.steps` mapping
- `api.storefront-collections.tsx`: Added `byCollection: { [handle]: string[] }` to response so widget can map products back to their source collection
- `bundle-widget-full-page.js`: Added `this.stepCollectionProductIds` map; `loadStepProducts` stores `byCollection` from API response; `createFullPageProductGrid` now filters by collection product IDs instead of the broken `activeCollection.products` reference
- `inventory-sync.server.ts`: Extended `syncBundleInventory` to fetch products from `step.collections` JSON and include them in `componentProducts`
- Both configure handlers: `hasProducts` validation now also accepts steps with only `collections`

### 2026-03-09 10:00 — Starting all phases

**Files to modify:**
- `app/services/bundles/metafield-sync/operations/bundle-product.server.ts`
- `app/routes/api/api.storefront-collections.tsx`
- `app/assets/bundle-widget-full-page.js`
- `app/services/bundles/inventory-sync.server.ts`
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts`

## Related Documentation

- `docs/ad-ready-bundles/` — Phase 1-3 feature docs
- `CLAUDE.md` — Issue tracking guidelines
