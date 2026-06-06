# Issue: Edit Bundle Flow — Integration & Unit Tests (FPB + PPB)

**Issue ID:** edit-bundle-flow-tests-1
**Status:** In Progress
**Priority:** 🔴 High
**Created:** 2026-05-18
**Last Updated:** 2026-05-18 10:00

## Overview

Comprehensive unit and integration test coverage for the entire edit-bundle flow for both
Full Page Bundle (FPB) and Product Page Bundle (PPB) configure routes. Covers pure-function
utilities, `handleSaveBundle`, `handleUpdateBundleStatus`, and `handleSyncProduct` action
handlers for both bundle types.

## Phases Checklist

- [x] Phase 1: Issue file created
- [x] Phase 2: Test spec written (`test-spec/edit-bundle-flow.spec.md`)
- [x] Phase 3: Pure function unit tests — `normaliseShopifyProductId`, `safeJsonParse`
- [x] Phase 4: FPB `handleSaveBundle` unit tests
- [x] Phase 5: PPB `handleSaveBundle` unit tests
- [x] Phase 6: Shared `handleUpdateBundleStatus` unit tests
- [x] Phase 7: FPB `handleSyncProduct` unit tests
- [x] Phase 8: PPB `handleSyncProduct` unit tests

## Progress Log

### 2026-05-18 10:00 - Starting test suite
- Creating issue file and test-spec
- Writing 7 test files covering the full edit-bundle flow for both routes
- Files to create: test-spec/edit-bundle-flow.spec.md + 6 test files under tests/unit/

## Related Documentation
- FPB handler: `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
- PPB handler: `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
- Shared handler: `app/services/bundles/bundle-configure-handlers.server.ts`
