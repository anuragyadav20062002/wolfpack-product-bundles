# Issue: Fix Deprecated productVariantUpdate GraphQL Mutation

**Issue ID:** productvariantsupdate-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-17
**Last Updated:** 2026-03-17 23:45

## Overview

Fix `[APP:WARN] Field 'productVariantUpdate' doesn't exist on type 'Mutation'` error thrown
during bundle creation. The mutation was deprecated by Shopify and removed from the Admin API.

## Phases Checklist

- [x] Phase 1: Replace deprecated mutation with `productVariantsBulkUpdate` ✅ Completed

## Progress Log

### 2026-03-17 23:45 - Phase 1: Fix Applied

- ✅ `app/routes/app/app.dashboard/handlers/handlers.server.ts` lines 464–479
- Replaced `productVariantUpdate(input: ProductVariantInput!)` with
  `productVariantsBulkUpdate(productId: ID!, variants: [ProductVariantsBulkInput!]!)`
- New variables shape: `{ productId: shopifyProductId, variants: [{ id, inventoryManagement }] }`
- Error response field changed from `productVariant { id }` → `productVariants { id }`

**Status:** Ready for deploy
