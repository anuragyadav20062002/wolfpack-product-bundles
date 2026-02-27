# Issue: Remove showProgressBar Dead Code

**Issue ID:** remove-show-progress-bar-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-02-22
**Last Updated:** 2026-02-22 12:00

## Overview

`showProgressBar` was a feature for displaying a fill-bar + quantity counter in the
full-page bundle modal footer. It was removed from both widgets by design (default was
`false`; the UI feature was removed). Dead code remains throughout types, hooks, route
files, Prisma upserts, clone operations, and the DB schema.

## Previous Commits (from discount-messaging-templates-fix-1)

- `35fd627` — Removed `showProgressBar` from widgets, API endpoint, sync paths, metafield
  sync types, and `BundleUiMessaging` interface
- `447c490` — Removed from product-page widget `updateMessagesFromBundle()` and both
  handler sync path `messages` objects

## Remaining Work (this issue)

All the following still reference `showProgressBar`:
- `app/types/pricing.ts` — `PricingDisplay` interface, validation check, default factory
- `app/types/state.types.ts` — `PricingSettings` interface
- `app/hooks/useBundlePricing.ts` — state, setter, `getPricingData`, deps, return object
- `app/hooks/useBundleConfigurationState.ts` — originalValues, reset, markAsSaved
- Both configure `types.ts` files — `BundlePricing` interface
- Both configure `route.tsx` files — formData.append, dep array, hidden input, originalValues
- `app/routes/app/app.bundles.cart-transform.tsx` — bundle clone
- `app/routes/app/app.dashboard/handlers/handlers.server.ts` — bundle clone
- Both handlers `handlers.server.ts` — Prisma upsert create/update
- `prisma/schema.prisma` — `showProgressBar Boolean @default(false)` field
- Prisma migration needed to drop the column

## Progress Log

### 2026-02-22 - Starting Complete Removal
- Phase 1: Remove from type files
- Phase 2: Remove from hooks
- Phase 3: Remove from configure routes and route types
- Phase 4: Remove from clone operations
- Phase 5: Remove from Prisma upserts
- Phase 6: Remove from Prisma schema + create migration
- Phase 7: Lint, rebuild widgets, commit

## Progress Log

### 2026-02-22 12:00 - Completed Full Removal

- ✅ Phase 1: Removed from `app/types/pricing.ts` (PricingDisplay interface, validation, factory)
- ✅ Phase 1: Removed from `app/types/state.types.ts` (PricingSettings interface)
- ✅ Phase 1: Removed from both configure route `types.ts` (BundlePricing interface)
- ✅ Phase 2: Removed from `useBundlePricing.ts` (state, setter, getPricingData, return object)
- ✅ Phase 2: Removed from `useBundleConfigurationState.ts` (originalValues, reset, markAsSaved)
- ✅ Phase 3: Removed from full-page route (formData, dep array, hidden input, originalValues)
- ✅ Phase 3: Removed from product-page route (formData, dep array, hidden input)
- ✅ Phase 4: Removed from `app.bundles.cart-transform.tsx` clone
- ✅ Phase 4: Removed from `app.dashboard/handlers/handlers.server.ts` clone
- ✅ Phase 5: Removed from full-page handler Prisma upsert (create + update)
- ✅ Phase 5: Removed from product-page handler Prisma upsert (create + update)
- ✅ Phase 6: Removed `showProgressBar Boolean @default(false)` from prisma/schema.prisma
- ✅ Phase 6: Created migration `20260222000000_fix_drift_and_remove_show_progress_bar` and applied
- ✅ Phase 7: 0 ESLint errors, Prisma client regenerated

Files modified:
- `app/types/pricing.ts`
- `app/types/state.types.ts`
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/types.ts`
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/types.ts`
- `app/hooks/useBundlePricing.ts`
- `app/hooks/useBundleConfigurationState.ts`
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx`
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx`
- `app/routes/app/app.bundles.cart-transform.tsx`
- `app/routes/app/app.dashboard/handlers/handlers.server.ts`
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
- `prisma/schema.prisma`
- `prisma/migrations/20260222000000_fix_drift_and_remove_show_progress_bar/migration.sql`

## Phases Checklist

- [x] Phase 1: Type files (`pricing.ts`, `state.types.ts`, both `types.ts`)
- [x] Phase 2: Hooks (`useBundlePricing.ts`, `useBundleConfigurationState.ts`)
- [x] Phase 3: Configure routes (formData, dep arrays, hidden inputs, originalValues)
- [x] Phase 4: Clone operations (`cart-transform.tsx`, `app.dashboard/handlers`)
- [x] Phase 5: Prisma upserts (both handlers)
- [x] Phase 6: Prisma schema + migration
- [x] Phase 7: Lint + Prisma generate + commit
