# Issue: Store product handle in DB to fix stale preview URLs

**Issue ID:** preview-url-stale-memory-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-07
**Last Updated:** 2026-03-07 12:30

## Overview

When a user creates a full-page bundle then a product-page bundle, the "Preview Bundle" / "Add to Storefront" link can point to the wrong (stale) URL. Product-page bundle preview handles are fetched at runtime from Shopify GraphQL (not stored in DB), while full-page handles ARE stored in DB (`shopifyPageHandle`). Fix: store `shopifyProductHandle` in the DB at bundle creation time.

## Progress Log

### 2026-03-07 12:00 - Planning Complete
- ✅ Analyzed codebase: dashboard loader, configure routes, creation handler
- ✅ Identified root cause: product handles fetched at runtime via GraphQL, not persisted
- ✅ Confirmed `CREATE_BUNDLE_PRODUCT_WITH_MEDIA` mutation already returns `handle`
- ✅ Created implementation plan
- Next: Begin Phase 1 — Schema migration

### 2026-03-07 12:30 - All Phases Completed
- ✅ Phase 1: Added `shopifyProductHandle String?` to Bundle model in `prisma/schema.prisma`
  - Created migration `20260307120000_add_shopify_product_handle`
- ✅ Phase 2: Extract + save handle from `productCreate` mutation response
  - Modified `app/routes/app/app.dashboard/handlers/handlers.server.ts` (lines 418, 449)
- ✅ Phase 3: Dashboard loader now uses `bundle.shopifyProductHandle` from DB
  - Removed runtime GraphQL `GetProductHandles` query
  - Added backfill for legacy bundles: fetches handle from GraphQL and persists to DB on first load
  - Modified `app/routes/app/app.dashboard/route.tsx` (lines 63, 78-130)
- ✅ Phase 4: Both configure routes use `bundle.shopifyProductHandle` as fallback
  - Modified `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
  - Modified `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- ✅ Phase 5: Backfill integrated into dashboard loader (Phase 3)

## Phases Checklist

- [x] Phase 1: Add `shopifyProductHandle` to Prisma schema + migration
- [x] Phase 2: Save handle at bundle creation time
- [x] Phase 3: Simplify dashboard loader to use DB handle
- [x] Phase 4: Add fallback in configure route preview handlers
- [x] Phase 5: Backfill existing bundles

## Related Files

- `prisma/schema.prisma` — Bundle model
- `app/routes/app/app.dashboard/handlers/handlers.server.ts` — Bundle creation
- `app/routes/app/app.dashboard/route.tsx` — Dashboard loader + preview
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx` — Preview handler
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx` — Preview handler
