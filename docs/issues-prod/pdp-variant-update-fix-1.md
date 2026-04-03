# Issue: Fix productVariantUpdate removed in Shopify API 2025-10

**Issue ID:** pdp-variant-update-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-04-03
**Last Updated:** 2026-04-03 12:00

## Overview

The `productVariantUpdate` mutation was removed from Shopify Admin API 2025-10.
All call sites must migrate to `productVariantsBulkUpdate(productId, variants)`.

Error: `Sync failed: Field 'productVariantUpdate' doesn't exist on type 'Mutation'`

Affected files:
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts` (2 sites)
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts` (2 sites)
- `app/services/bundles/pricing-calculation.server.ts` (1 site)

## Progress Log

### 2026-04-03 12:00 - Starting fix
- Replacing all 5 occurrences of `productVariantUpdate` with `productVariantsBulkUpdate`
- Following pattern from `docs/issues-prod/productvariantsupdate-fix-1.md` (dashboard fix)

### 2026-04-03 12:05 - Completed fix
- Replaced all 5 call sites:
  - PDP handlers lines 779-794 (new product creation) — uses `productId`
  - PDP handlers lines 1006-1017 (product re-creation) — uses `newProductId`
  - FPB handlers lines 955-966 (new product creation) — uses `productId`
  - FPB handlers lines 1127-1138 (sync product creation) — uses `shopifyProductId`
  - Pricing calculation lines 358-386 (price update) — uses `productId` param
- Migration pattern: `productVariantUpdate(input: ProductVariantInput!)` → `productVariantsBulkUpdate(productId: ID!, variants: [ProductVariantsBulkInput!]!)`
- Response field: `productVariant` → `productVariants`
- ESLint: 0 errors

### 2026-04-03 12:10 - Inngest fallback guard
- Added `INNGEST_AVAILABLE` check in webhook-worker.server.ts
- When Inngest key is missing and not in dev mode, falls back to direct `WebhookProcessor.processPubSubMessage()`
- Webhooks are no longer silently dropped when INNGEST_EVENT_KEY is unset
- Updated startup log in scripts/webhook-worker.ts to show which mode is active

## Phases Checklist
- [x] Phase 1: Replace all deprecated mutations
- [x] Phase 2: Add Inngest fallback guard for missing event key
