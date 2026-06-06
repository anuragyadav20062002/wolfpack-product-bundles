# Issue: FPB Bundle UI Config Metafield Size
**Issue ID:** fpb-bundle-ui-config-size-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-05
**Last Updated:** 2026-06-06 06:34

## Overview
Saving a full-page bundle with category products that include 10+ variants can fail because the `bundle_ui_config` variant metafield exceeds Shopify's 64KB limit. The widget then cannot load because metafield sync aborts.

## Progress Log
### 2026-06-05 21:33 - Investigation
- Traced the failure to `app/services/bundles/metafield-sync/operations/bundle-product.server.ts`, where `bundle_ui_config` is size-checked before `metafieldsSet`.
- Found category runtime formatting preserves rich product blobs, including full variant/image/options fields, which can push the JSON over Shopify's limit.
- Next: add a regression test for compact category runtime payloads and reduce the runtime product DTO to storefront-required fields.

### 2026-06-05 21:40 - Fixed and Verified
- Added a regression contract for rich category products with 12 variants and admin/cache-only fields.
- Updated category runtime formatting to emit compact storefront DTOs for images, options, and variants while preserving individual-variant display fields.
- Verified related formatter, FPB save, and bundle product metafield tests pass.

### 2026-06-06 06:34 - Commit Prep
- Rechecked the compaction diff and kept this batch scoped to category runtime payload size reduction, its regression test, issue/spec docs, and the metafield size note.
- Confirmed no dirty image assets are present before staging.
- Next: run the focused unit test, lint touched files, diff checks, then commit this batch.

## Related Documentation
- `internal docs/Shopify Integration/Admin API.md`
- `app/services/bundles/metafield-sync/operations/bundle-product.server.ts`
- `app/lib/bundle-config/category-runtime.ts`

## Phases Checklist
- [x] Phase 1: Root cause investigation
- [x] Phase 2: Regression test
- [x] Phase 3: Runtime payload compaction
- [x] Phase 4: Verification
