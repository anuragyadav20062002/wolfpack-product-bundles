# Issue: Cart Transform Rust Migration Backfill

**Issue ID:** cart-transform-rust-backfill-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-04-19
**Last Updated:** 2026-04-19 18:45

## Overview

After migrating the cart transform from TypeScript (`bundle-cart-transform-ts`) to Rust
(`bundle-cart-transform-rs`), existing merchants were not re-onboarded via OAuth. Their
`CartTransform` Shopify resources still point to the old TS function ID (now dead). New
merchants also silently fail because `checkExistingCartTransform` returns `exists: true`
for the stale TS-pointing resource — so `activateForNewInstallation` short-circuits and
never creates the Rust transform.

## Root Cause

`CartTransformService.checkExistingCartTransform` returns `exists: true` for ANY
CartTransform, regardless of whether it points to the Rust or TS function. Callers treat
`exists: true` as "already set up" and skip creation. The old TS function no longer exists,
so its CartTransform is a dead pointer.

Also: `api.check-cart-transform.tsx` still checks against the hardcoded TS function ID
`527a500e-5386-4a67-a61b-9cb4cb8973f8`, making its `activated` flag always false.

## Fix Plan

1. `CartTransformService`:
   - Add `getRustFunctionId(admin)` — queries `shopifyFunctions` to get the live ID for handle `bundle-cart-transform-rs`
   - Add `deleteCartTransform(admin, id)` — calls `cartTransformDelete`
   - Fix `activateForNewInstallation` — replace stale transforms instead of skipping
   - Add `backfillForShop(shopDomain)` — standalone method using `unauthenticated.admin`
   - Add `backfillAllShops()` — queries all offline sessions, runs backfill per shop

2. `api.check-cart-transform.tsx` — remove hardcoded TS function ID, use live function ID lookup

3. `api.admin.backfill-cart-transform.tsx` — protected POST route (`x-backfill-secret` header) to trigger backfill across all shops

## Progress Log

### 2026-04-19 18:45 - Fix dead detection + remove backfill route

- `createCartTransform` catches 401/402 internally and returns them via `result.error`, never reaching outer catch. Fixed by checking `result.error` for dead patterns before returning.
- Removed `api.admin.backfill-cart-transform.tsx` — backfill complete (28 shops active), endpoint no longer needed.
- 64 dead sessions (401/402) will be auto-purged from DB on next backfill trigger (via `purgeDeadSessions`).
- Files modified: `app/services/cart-transform-service.server.ts`
- Files deleted: `app/routes/api/api.admin.backfill-cart-transform.tsx`

### 2026-04-19 18:30 - Auto-purge dead sessions after backfill

- `backfillForShop` now returns `status: 'dead'` for 401/402/missing-token errors (uninstalled or billing-lapsed shops)
- `backfillAllShops` collects dead shops post-run and calls new `purgeDeadSessions()` which does a single `deleteMany` on the session table
- Summary now includes `dead` and `sessionsPurged` counts
- Files modified: `app/services/cart-transform-service.server.ts`

### 2026-04-19 18:00 - Fix backfill: bypass shopifyFunctions check

- Root cause identified: `shopifyFunctions` query returning empty via `unauthenticated.admin` offline sessions despite function being deployed. The pre-check was aborting backfill with false "not found" error for all 92 shops.
- Removed `getRustFunctionId` gating from `backfillForShop`
- Now calls `cartTransformCreate` directly with `functionHandle` — actual Shopify errors surface instead of our custom message
- Added `diagnostics` field to response: includes what `shopifyFunctions` and `cartTransforms` actually return per shop, useful for debugging
- Files modified: `app/services/cart-transform-service.server.ts`
- Next: push to Render, trigger backfill

### 2026-04-19 15:30 - Implemented

- ✅ `CartTransformService` — added `getRustFunctionId`, `deleteCartTransform`, `backfillForShop`, `backfillAllShops`
- ✅ Fixed `activateForNewInstallation` — detects stale TS transforms, deletes them, creates Rust one
- ✅ Fixed `api.check-cart-transform.tsx` — removes hardcoded TS UUID, uses live `shopifyFunctions` query
- ✅ Created `api.admin.backfill-cart-transform.tsx` — POST endpoint protected by `BACKFILL_SECRET` env var
- Files modified: `app/services/cart-transform-service.server.ts`, `app/routes/api/api.check-cart-transform.tsx`
- Files created: `app/routes/api/api.admin.backfill-cart-transform.tsx`
- Next: commit, deploy, set BACKFILL_SECRET env var, trigger backfill

## Related Documentation
- Rust function handle: `bundle-cart-transform-rs` (`extensions/bundle-cart-transform-rs/shopify.extension.toml`)
- Old TS function ID: `527a500e-5386-4a67-a61b-9cb4cb8973f8`

## Phases Checklist
- [x] Fix CartTransformService (getRustFunctionId, deleteCartTransform, backfill methods)
- [x] Fix activateForNewInstallation stale-replace logic
- [x] Fix api.check-cart-transform.tsx hardcoded function ID
- [x] Create backfill API route
- [ ] Commit + deploy to PROD
- [ ] Set BACKFILL_SECRET env var on Render
- [ ] Trigger backfill via: `curl -X POST https://<app-url>/api/admin/backfill-cart-transform -H "x-backfill-secret: <secret>"`
- [ ] Verify yash-wolfpack store has cart transform active
