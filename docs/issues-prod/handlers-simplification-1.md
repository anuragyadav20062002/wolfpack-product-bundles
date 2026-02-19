# Issue: Handlers Simplification

**Issue ID:** handlers-simplification-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-02-19
**Last Updated:** 2026-02-19 05:30

## Overview

Code-simplification audit of all four `handlers.server.ts` files identified 10 CRITICAL findings,
17 WARN findings, and 7 INFO findings. Fixing in recommended priority order:

1. C1–C6: MIXED_PROMISES + SILENT_SWALLOW (widget silently fails but returns success)
2. C9–C10: TRIPLE_VALIDATION — duplicate UUID validation (dead code / latent bug)
3. C7–C8: ANY_ESCAPE at boundaries — `admin: any, session: any` on all exported handlers
4. W14: ~95% file duplication between full-page and product-page handlers

## Files In Scope

- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
- `app/routes/app/app.design-control-panel/handlers.server.ts`
- `app/routes/app/app.dashboard/handlers/handlers.server.ts`

## Phases Checklist

- [x] Phase 1: Fix C1–C6 — MIXED_PROMISES + SILENT_SWALLOW in both bundle handlers ✅
- [x] Phase 2: Fix C9–C10 — TRIPLE_VALIDATION — extract normaliseShopifyProductId ✅
- [x] Phase 3: Fix C7–C8 — ANY_ESCAPE — proper types on all exported handler signatures ✅
- [ ] Phase 4: Fix W14 — consolidate near-identical files into shared module

## Progress Log

### 2026-02-19 04:00 - Phase 1 Completed

- ✅ C1/C2: Replaced `Promise.all` with `Promise.allSettled` in both bundle handlers
- ✅ C3/C4: Removed inner silent swallow from standard metafields IIFE
- ✅ C5/C6: Removed outer catch that swallowed all metafield failures; critical failures now propagate
- ✅ W3/W4: Added Layer 1 transport error check before `userErrors` in product status mutation (handleSaveBundle)
- ✅ W5/W6: `handleUpdateBundleStatus` now reads and checks the GQL response (both error layers)
- ✅ W7/W8: GENERIC_CATCH fixed in `handleSaveBundle` outer catch — `instanceof Error` guard
- ✅ W9/W10: GENERIC_CATCH fixed in `handleSyncProduct` catch
- Files modified:
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
  - `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
- Lint: 0 errors
- Next: Phase 2 — TRIPLE_VALIDATION (extract normaliseShopifyProductId)

### 2026-02-19 05:00 - Phase 2 Completed

- ✅ C9/C10: Extracted `normaliseShopifyProductId()` — validates + normalises in a single boundary call
- ✅ Replaced upfront UUID-only check loop with normalise-in-place loop (IDs mutated before Prisma `.map()`)
- ✅ Removed 40-line duplicate validation block inside Prisma `.map()` in both files — now a single comment + `product.id` reference
- Files modified:
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
  - `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
- Lint: 0 errors
- Next: Phase 3 — ANY_ESCAPE (proper types on exported handler signatures)

### 2026-02-19 05:30 - Phase 3 Completed

- ✅ C7/C8: Added `import type { AdminApiContext } from "@shopify/shopify-app-remix/server"` and `import type { Session } from "@shopify/shopify-api"` to both files
- ✅ Replaced all 10 occurrences of `admin: any, session: any` (and `_session: any` variants) with `admin: AdminApiContext["admin"], session: Session` across both files
- Files modified:
  - `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
  - `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
- Lint: 0 errors (warnings only, pre-existing)
- Next: Phase 4 — W14 file duplication consolidation

### 2026-02-19 03:30 - Issue Created, Starting Phase 1
- Audit produced by `/code-simplification` skill subagent
- 10 CRITICAL, 17 WARN, 7 INFO findings across 4 files
- Starting with MIXED_PROMISES + SILENT_SWALLOW (highest user-visible impact)
- Next: Read both full-page and product-page handler files
