# Issue: Centralize Constants & Mappings (Phase 2)

**Issue ID:** centralize-constants-phase2-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-02-28
**Last Updated:** 2026-02-28 16:00

## Overview
Phase 2 of constants centralization. Migrates remaining ~30 files to use BundleStatus/BundleType/FullPageLayout enums, eliminates duplicate type aliases, creates error message and API version constants, and centralizes API version strings.

## Progress Log

### 2026-02-28 14:00 - Starting Implementation
- Creating `app/constants/errors.ts` and `app/constants/api.ts`
- Migrating remaining files to use centralized enums
- Eliminating duplicate BundleStatus/BundleType type aliases

### 2026-02-28 16:00 - Completed Implementation
- Created `app/constants/errors.ts` (ERROR_MESSAGES) and `app/constants/api.ts` (SHOPIFY_REST_API_VERSION)
- Added CART_TRANSFORM to BundleType enum
- Eliminated duplicate BundleStatus/BundleType type aliases in 5 files (state.types, useBundleForm, both configure route types, useBundleConfigurationState)
- Migrated 7 services to use BundleStatus/BundleType enums
- Migrated 10 route files (API routes, dashboard, cart-transform, configure handlers)
- Updated 3 storefront routes and 1 handler to use SHOPIFY_REST_API_VERSION constant
- Fixed stale 2024-10 API version in full-page handler -> uses centralized constant
- Migrated design-settings, preview-css-vars, app.state.service, dashboard types
- Added DesignBundleType narrowing type for design panel context (excludes CART_TRANSFORM)
- Fixed AppStateContext to use string literal types matching service signatures
- TypeScript: 0 errors, ESLint: 0 errors (1994 pre-existing warnings)

### Files Created
- `app/constants/api.ts`
- `app/constants/errors.ts`

### Files Modified (30)
- `app/constants/bundle.ts` - Added CART_TRANSFORM enum value
- `app/types/state.types.ts` - Replaced local type aliases with re-exports
- `app/hooks/useBundleForm.ts` - Import BundleStatus from constants
- `app/hooks/useBundleConfigurationState.ts` - Import+re-export BundleStatus
- `app/hooks/useDesignControlPanelState.ts` - Added DesignBundleType, narrowed selectedBundleType
- `app/contexts/AppStateContext.tsx` - Fixed design settings method signatures
- `app/lib/preview-css-vars.ts` - BundleType.FULL_PAGE
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/types.ts` - Re-export BundleStatus
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/types.ts` - Re-export BundleStatus
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` - BundleStatus, BundleType, SHOPIFY_REST_API_VERSION
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts` - BundleStatus, BundleType
- `app/routes/app/app.dashboard/handlers/handlers.server.ts` - BundleStatus, BundleType
- `app/routes/app/app.dashboard/route.tsx` - BundleStatus, BundleType, FullPageLayout
- `app/routes/app/app.dashboard/types.ts` - Import BundleStatus, BundleType from constants
- `app/routes/app/app.bundles.cart-transform.tsx` - BundleStatus, BundleType
- `app/routes/api/api.bundles.json.tsx` - BundleStatus
- `app/routes/api/api.bundle.$bundleId.json.tsx` - BundleStatus
- `app/routes/api/api.check-bundles.ts` - BundleStatus
- `app/routes/api/api.design-settings.$shopDomain.tsx` - BundleType
- `app/routes/api/api.storefront-products.tsx` - SHOPIFY_REST_API_VERSION
- `app/routes/api/api.storefront-collections.tsx` - SHOPIFY_REST_API_VERSION
- `app/services/bundles/bundle-configure-handlers.server.ts` - BundleStatus, BundleType, SHOPIFY_REST_API_VERSION
- `app/services/bundles/metafield-sync/operations/cart-transform.server.ts` - BundleStatus
- `app/services/bundles/metafield-sync/operations/bundle-product.server.ts` - BundleStatus, BundleType
- `app/services/bundle-analytics.server.ts` - BundleStatus, BundleType
- `app/services/billing.server.ts` - BundleStatus
- `app/services/webhooks/handlers/product.server.ts` - BundleStatus
- `app/services/webhooks/handlers/subscription.server.ts` - BundleStatus
- `app/services/metafield-validation.server.ts` - BundleStatus
- `app/services/app.state.service.ts` - BundleType

## Phases Checklist
- [x] Create app/constants/errors.ts
- [x] Create app/constants/api.ts
- [x] Add CART_TRANSFORM to BundleType enum
- [x] Eliminate duplicate type aliases
- [x] Migrate services to use enums
- [x] Migrate routes to use enums
- [x] Migrate hooks/contexts to use enums
- [ ] Fix design defaults divergence (deferred to separate issue)
- [ ] Update error messages in routes/handlers (constants created, usage deferred)
- [x] Update API versions in routes/services
- [x] Lint and verify
- [x] Commit
