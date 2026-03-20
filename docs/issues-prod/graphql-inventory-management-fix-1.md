# Issue: Remove inventoryManagement from GraphQL variant inputs

**Issue ID:** graphql-inventory-management-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-20
**Last Updated:** 2026-03-20 06:00

## Overview
Shopify API 2025-10 removed `inventoryManagement` from `ProductVariantsBulkInput`
(and from `ProductVariantInput` in the deprecated `productCreate(input:)` path).
Any call that includes this field causes a `GraphqlQueryError: Field is not defined`.

Observed in logs as WARN from the `create-bundle` operation's standalone
`productVariantsBulkUpdate` call. Also present in clone-bundle, cart-transform,
and both configure-page sync handlers.

For bundle products, inventory should NOT be tracked (bundles are virtual).
The field should simply be removed — the default is no inventory management,
which is the correct behaviour.

## Files to fix
- `app/routes/app/app.dashboard/handlers/handlers.server.ts`
  - Remove `inventoryManagement: "SHOPIFY"` from clone-bundle variant input
  - Remove entire UPDATE_VARIANT block (sole purpose was setting inventoryManagement)
- `app/routes/app/app.bundles.cart-transform.tsx`
  - Remove `inventoryManagement: "SHOPIFY"` from variant input
- `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
  - Remove `inventoryManagement: "NOT_MANAGED"` (two occurrences)
- `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`
  - Remove `inventoryManagement: "NOT_MANAGED"` (one occurrence)

## Progress Log

### 2026-03-20 05:30 - Starting fixes
- Created issue file
- Applied dashboard handler fixes: removed inventoryManagement from clone-bundle
  variant input; removed entire UPDATE_VARIANT block from create-bundle

### 2026-03-20 06:00 - Completed all fixes
- ✅ `app/routes/app/app.bundles.cart-transform.tsx`: removed `inventoryManagement: "SHOPIFY"`, changed `inventoryPolicy: "DENY"` → `"CONTINUE"`
- ✅ `app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts`: removed `inventoryManagement: "NOT_MANAGED"` (two occurrences)
- ✅ `app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts`: removed `inventoryManagement: "NOT_MANAGED"` (one occurrence)
- ✅ `app/routes/app/app.dashboard/handlers/handlers.server.ts`: also removed orphaned `defaultVariantId` variable (was only used by the deleted UPDATE_VARIANT block)
- Zero ESLint errors across all modified files

## Phases Checklist
- [x] Dashboard handler
- [x] Cart-transform
- [x] PDP configure handler
- [x] FPB configure handler
