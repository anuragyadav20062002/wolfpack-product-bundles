# Issue: Cart Transform Metafield Dead Code Cleanup

**Issue ID:** cart-transform-metafield-cleanup-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-04-03
**Last Updated:** 2026-04-03 15:00

## Overview
Audit revealed 2 dead code gaps in the cart transform metafield setup:
1. `bundleConfig` field in the Function input query requests `$app:bundle_config` — a key that is never written. Returns `null` on every invocation.
2. `updateCartTransformMetafield` / `all_bundles_config` — entire function is exported but never called from any route handler. The CartTransform-level metafield is never written, and the Function's input query doesn't read it anyway. Dead code consuming type definitions and exports.

Additionally verified:
- `bundle_ui_config` is NOT needed by the Cart Transform Function (it reads `price_adjustment`, `component_reference`, `component_quantities`, `component_pricing` directly per-variant — already optimal)
- `component_parents` write path is properly awaited in `Promise.all` at all 4 call sites

## Progress Log

### 2026-04-03 12:00 — Starting Implementation
- Files to modify:
  1. `extensions/bundle-cart-transform-ts/src/cart-transform-input.graphql` — remove dead `bundleConfig` field
  2. `app/services/bundles/metafield-sync/operations/cart-transform.server.ts` — delete entire file
  3. `app/services/bundles/metafield-sync/operations/index.ts` — remove `updateCartTransformMetafield` export
  4. `app/services/bundles/metafield-sync/index.ts` — remove `updateCartTransformMetafield` export
  5. `app/services/bundles/metafield-sync.server.ts` — remove `updateCartTransformMetafield` re-export + types
  6. `app/services/bundles/metafield-sync/types.ts` — remove `OptimizedBundleConfig`, `OptimizedStepConfig`, `OptimizedPricingConfig`

### 2026-04-03 15:00 — Dev Server Testing
- ✅ Navigated to PPB configure page on wolfpack-store-test-1 (SIT)
- ✅ Bundle with 3 products in Step 1 saved and synced successfully
- ✅ No console errors on admin configure page after sync
- ✅ Navigated to "bundle product" storefront page → added to cart → proceeded to checkout
- ✅ Checkout rendered correctly — cart transform ran without errors
- ✅ Single 401 at checkout was expected: `?dev=` param not forwarded to Shopify checkout URLs (normal dev preview limitation, not a bug)
- ✅ No functional regressions — cleanup only removed dead code that was never executed

### 2026-04-03 13:00 — Completed Implementation
- ✅ Removed dead `bundleConfig` field from `cart-transform-input.graphql` (key `bundle_config` was never written, returned null on every invocation)
- ✅ Deleted `cart-transform.server.ts` entirely — `updateCartTransformMetafield` was never called from any route handler
- ✅ Removed `updateCartTransformMetafield` export from `operations/index.ts`, `metafield-sync/index.ts`, `metafield-sync.server.ts`
- ✅ Removed `OptimizedBundleConfig`, `OptimizedStepConfig`, `OptimizedPricingConfig` types from `types.ts` (only used by deleted file)
- ✅ Verified `component_parents` write path is properly awaited in `Promise.all` at all 4 call sites — no change needed
- ✅ WASM rebuilt successfully
- ✅ Lint: 0 errors

## Phases Checklist
- [x] Remove dead `bundleConfig` field from input query
- [x] Delete `cart-transform.server.ts`
- [x] Remove dead exports from index files and metafield-sync.server.ts
- [x] Remove unused Optimized* types from types.ts
- [x] Rebuild cart transform WASM
- [x] Lint modified files
- [x] Test on dev server
- [x] Commit
