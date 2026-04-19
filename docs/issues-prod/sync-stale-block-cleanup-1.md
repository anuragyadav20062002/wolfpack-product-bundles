# Issue: Sync Bundle — Stale Block Cleanup

**Issue ID:** sync-stale-block-cleanup-1
**Status:** Completed
**Priority:** High
**Created:** 2026-04-15
**Last Updated:** 2026-04-16 10:00

## Overview

Stores that installed the app before the migration from section blocks to app embed blocks have dead block references in their Shopify theme templates (page.full-page-bundle.json, product.product-page-bundle.json). These stale blocks render as invisible display:none wrappers that interfere with the app embed, causing bundles to appear blank on the storefront.

Root cause: Sync Bundle assigned recreated pages/products to the same custom templateSuffix, so the stale template was reused.

Fix: Remove templateSuffix from all Shopify mutations. Pages/products now use the default template where the app embed renders cleanly.

## Progress Log

### 2026-04-15 16:00 - Investigation
- Discovered issue on wolfpackdemostore.myshopify.com/pages/toy-bundle
- Bundle widget rendered but was hidden behind a shopify-block wrapper with display:none
- Root cause: stale bundle-full-page section block reference in page.full-page-bundle.json template
- The app embed was also rendering, but the widget DOM ended up inside the stale block wrapper

### 2026-04-15 16:15 - Feature Pipeline (BR -> PO -> Architect -> SDE)
- Completed all 4 pipeline stages
- Decision: Remove templateSuffix from all Shopify mutations
- Documents in docs/sync-stale-block-cleanup/

### 2026-04-15 16:30 - Implementation
- Removed templateSuffix from FPB page creation (widget-full-page-bundle.server.ts)
- Removed templateSuffix from PDP product sync and creation (handlers.server.ts)
- Updated theme editor deep links to use default templates
- Converted install-fpb-widget and install-pdp-widget API routes to no-ops
- Deleted widget-theme-template.server.ts (dead code)
- Removed ensureProductBundleTemplate export from index.ts

Files modified:
- app/services/widget-installation/widget-full-page-bundle.server.ts
- app/services/widget-installation/index.ts
- app/routes/api/api.install-fpb-widget.tsx
- app/routes/api/api.install-pdp-widget.tsx
- app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts
- app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx
- app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx
- app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts

Files deleted:
- app/services/widget-installation/widget-theme-template.server.ts

### 2026-04-16 10:00 - Test cleanup
- Deleted 3 test files that covered removed behavior:
  - `tests/unit/services/ensure-product-bundle-template.test.ts` — tested deleted `ensureProductBundleTemplate`
  - `tests/unit/routes/api.install-pdp-widget.test.ts` — tested old template-writing; route is now a no-op
  - `tests/unit/routes/full-page-bundle-product-sync.test.ts` — centered on `productUpdate` + `templateSuffix` assertions that no longer exist
- Updated 4 test files to remove dead `widget-theme-template.server` mocks and align with post-API-2025-10 signatures:
  - `tests/unit/services/widget-full-page-bundle.test.ts` — dropped deleted module mock + stale `templateSuffix` fields from mocked page responses
  - `tests/unit/services/widget-full-page-bundle-preview.test.ts` — `getPreviewPageUrl` now takes `shopDomain` and returns `previewUrl`; `createFullPageBundle` no longer returns `shareablePreviewUrl`
  - `tests/unit/routes/full-page-bundle-slug.test.ts` — removed `ensureProductBundleTemplate` mock/import and related assertion
  - `tests/unit/routes/fpb-configure-preview.test.ts` — handler now calls `createFullPageBundle` with `isPublished=true` and reads `pageUrl`/`previewUrl` fields
- All 35 tests across the 4 modified files pass; no regressions elsewhere attributable to this change.

## Related Documentation
- docs/sync-stale-block-cleanup/00-BR.md
- docs/sync-stale-block-cleanup/02-PO-requirements.md
- docs/sync-stale-block-cleanup/03-architecture.md
- docs/sync-stale-block-cleanup/04-SDE-implementation.md

## Phases Checklist
- [x] Phase 1: FPB — Remove templateSuffix from page creation
- [x] Phase 2: PDP — Remove templateSuffix from product mutations
- [x] Phase 3: Update theme editor deep links
- [x] Phase 4: Remove dead widget installation code
- [x] Lint check — zero errors
- [x] TypeScript — no new errors
- [ ] Manual verification on wolfpackdemostore (pending deploy)
