# Issue: Sync Bundle Button

**Issue ID:** sync-bundle-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-03-16
**Last Updated:** 2026-03-16

## Overview

Add a "Sync Bundle" button to the configure pages of both full-page and product-page bundles.
The button performs a hard reset: deletes the associated Shopify product/page and all bundle
metafields, then re-creates everything from the current DB state. Useful after breaking code
changes (metafield schema changes, cart transform logic changes, Shopify API version bumps).

## Related Documentation

- `docs/sync-bundle/00-BR.md` — Business requirement
- `docs/sync-bundle/02-PO-requirements.md` — Product owner requirements
- `docs/sync-bundle/03-architecture.md` — Architecture decision record

## Phases Checklist

- [x] Phase 1: `handleSyncBundle` for full-page bundle (server handler)
- [x] Phase 2: `handleSyncBundle` for product-page bundle (server handler)
- [x] Phase 3: Add `case "syncBundle"` to both route actions + update barrel exports
- [x] Phase 4: UI — Sync button + confirmation modal for full-page bundle route
- [x] Phase 5: UI — Sync button + confirmation modal for product-page bundle route
- [x] Phase 6: Lint + test run

## Progress Log

### 2026-03-16 - Implementation complete

**Phase 1 — full-page `handleSyncBundle`:**
- Added to `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
- Reads bundle from DB, deletes Shopify page via `pageDelete` mutation, re-creates via `WidgetInstallationService.createFullPageBundle()`, updates DB with new pageId/pageHandle, re-runs 3 metafield operations in parallel
- Returns `{ success: true, synced: true, message: "Bundle synced successfully" }`

**Phase 2 — product-page `handleSyncBundle`:**
- Added to `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
- Archives Shopify product (ARCHIVED status), deletes via `productDelete`, re-creates via `productCreate`, updates DB, re-runs 3 metafield operations in parallel

**Phase 3 — action dispatch:**
- Added `handleSyncBundle` export to both `handlers/index.ts` barrel files
- Added `case "syncBundle"` to both route action switches
- Added `handleSyncBundle` import to both `route.tsx` files

**Phase 4 & 5 — UI:**
- Full-page: Added `isSyncModalOpen` state, `handleSyncBundleConfirm` callback, `secondaryActions` with Sync Bundle button (destructive, disabled when isDirty or submitting), confirmation Modal
- Product-page: Same additions; also added `useRevalidator` import (was missing), `revalidator` instance
- Both routes: Added `synced` branch to fetcher.data useEffect for toast + revalidate on success

**Phase 6 — Quality:**
- ESLint: 0 errors (1535 pre-existing warnings, unchanged)
- Jest: 75/75 tests pass (no regressions)
