# Issue: Sync Bundle Fails When shopifyPageId Is Null

**Issue ID:** sync-bundle-no-page-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-04-02
**Last Updated:** 2026-04-02 14:05

## Overview
"Sync Bundle" returns a 400 toast error — "Bundle has no Shopify page — save the bundle
first to create a page" — for any bundle whose `shopifyPageId` is null in the database.

This affects:
- Bundles created in SIT/PROD that never had a page (e.g. migrated records)
- Any bundle where `shopifyPageId` was cleared without a corresponding page being created

## Root Cause
`handleSyncBundle` hard-guards at line 1008 with `if (!bundle.shopifyPageId) return 400`.
The intent was to prevent the delete-then-recreate page flow from running when there's
nothing to delete. But the guard is too broad: it blocks the entire sync, including the
page creation step that would fix the missing page.

**Fix:** Make the page deletion conditional (`if (bundle.shopifyPageId)`). When there's
no page, skip straight to the page-creation step (step 4). The rest of the sync
(metafields, product creation) is unchanged.

## Progress Log

### 2026-04-02 14:05 - Completed
- ✅ Removed hard `if (!bundle.shopifyPageId) return 400` guard
- ✅ Wrapped page delete + DB clear in `if (bundle.shopifyPageId)` block
- ✅ Added `else` log: "No existing Shopify page — proceeding to create one"
- ✅ Lint: 0 errors
- ✅ Committed

## Files to Change
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`

## Phases Checklist
- [x] Remove hard guard; make page delete conditional
- [x] Lint
- [x] Commit
