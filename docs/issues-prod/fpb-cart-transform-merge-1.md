# Issue: FPB Cart Transform MERGE Not Working

**Issue ID:** fpb-cart-transform-merge-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-04-02
**Last Updated:** 2026-04-02 16:30

## Overview
Cart Transform MERGE operation never fires for Full Page Bundle (FPB) bundles. Cart lines
remain flat with no discount applied, and free-gift items are charged at full price.

## Root Causes

### RC1: FPB bundle has no `shopifyProductId` → MERGE impossible
The Cart Transform MERGE operation requires a `parentVariantId` (the bundle's container
product variant GID). This is read from the `component_parents` metafield written to each
component variant during sync. The metafield is only written when `shopifyProductId` exists.

`handleSyncBundle` guards the entire metafield block with `if (shopifyProductId)`, so if no
product exists the sync returns `{ success: true }` but writes nothing. MERGE is never set up.

**Fix:** Auto-create the Shopify product during sync when `shopifyProductId` is null, and
immediately create the URL redirect (`/products/{handle}` → `/pages/{pageHandle}`).

### RC2: `syncFullPageBundleProductTemplate` calls `themeFilesUpsert` via `ensureProductBundleTemplate`
Every FPB save/sync calls `ensureProductBundleTemplate`, which writes theme JSON files via
the `themeFilesUpsert` Admin API. This call fails on SIT with "Access denied for
themeFilesUpsert" and would require a Shopify exemption that disqualifies the app from the
**Built For Shopify (BFS) badge**.

FPB products don't need a theme template — the URL redirect (`/products/handle` →
`/pages/handle`) handles routing. The `templateSuffix` set on the product is meaningless
since customers are redirected before the template is rendered.

**Fix:** Remove `ensureProductBundleTemplate` from the FPB handler. Simplify
`syncFullPageBundleProductTemplate` to only update the Shopify product status (no
templateSuffix, no theme writes).

## Progress Log

### 2026-04-02 17:00 - Applied both fixes
- ✅ RC2: Removed `ensureProductBundleTemplate` import; replaced `syncFullPageBundleProductTemplate` with `syncFpbProductStatus` (status-only update, no theme writes, no templateSuffix)
- ✅ RC1: Added product auto-creation in `handleSyncBundle` when `shopifyProductId` is null; creates product with `ACTIVE` status, updates DB, creates URL redirect to page handle
- ✅ Lint: 0 errors (warnings are pre-existing)
- ✅ Committed

### 2026-04-02 16:30 - Starting fix
- Identified both root causes via code analysis + SIT log inspection
- Files to change: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`

## Files to Change
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`

## Phases Checklist
- [x] RC2: Remove `ensureProductBundleTemplate` call from FPB handler; simplify to `syncFpbProductStatus` (status-only update)
- [x] RC1: Add product auto-creation in `handleSyncBundle` when `shopifyProductId` is null; create URL redirect after creation
- [x] Lint (0 errors)
- [x] Commit
