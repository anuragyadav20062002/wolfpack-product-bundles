# Issue: EXPAND Path Component Titles Show "Component N" Instead of Product Names

**Issue ID:** expand-path-component-titles-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-02-16
**Last Updated:** 2026-02-16 13:50

## Overview

In the EXPAND path (direct add-to-cart bundles), the cart transform writes `Component ${index + 1}` as the component title because `ComponentPricingItem` from the `component_pricing` metafield has no `title` field. The MERGE path correctly uses `l.merchandise.product?.title` from cart line data. Customers see generic "Component 1", "Component 2" instead of actual product names.

## Root Cause

Data flow:
1. `batchGetFirstVariantsWithPrices()` in `variant-lookup.server.ts` — queries products but does NOT fetch `title`
2. `componentPricingData` in `bundle-product.server.ts` — has `{ variantId, priceCents, quantity }`, no `title`
3. `calculateComponentPricing()` in `pricing.ts` — returns `ComponentPricing` without `title`
4. `component_pricing` metafield — saved without titles
5. Cart transform EXPAND path — reads metafield, falls back to "Component N"

## Fix Strategy

1. Add `title` to the GraphQL query in `batchGetFirstVariantsWithPrices()`
2. Pass `title` through `componentPricingData` in `bundle-product.server.ts`
3. Add `title` to `ComponentPricing` interface in `types.ts`
4. Propagate `title` through `calculateComponentPricing()` in `pricing.ts`
5. Cart transform `ComponentPricingItem` already has optional `title` (added in previous fix)

## Phases Checklist

- [x] Phase 1: Add title to variant lookup query and return type
- [x] Phase 2: Propagate title through pricing pipeline and metafield
- [x] Phase 3: Review and commit

## Progress Log

### 2026-02-16 13:35 - Issue Created & Planning Complete
- Traced full data flow from GraphQL query to checkout UI
- Identified 4 files that need changes
- `ComponentPricingItem` in cart transform already has optional `title` from previous fix
- Next: Phase 1 - Add title to variant lookup

### 2026-02-16 13:50 - All Phases Completed
- ✅ `variant-lookup.server.ts`: Added `title` to GraphQL query and return type
- ✅ `types.ts`: Added optional `title` to `ComponentPricing` interface
- ✅ `pricing.ts`: Updated function signature and both return paths to include `title`
- ✅ `bundle-product.server.ts`: Passes `title` from variant lookup through to pricing calc
- ✅ Cart transform `ComponentPricingItem.title` already optional from previous fix
- Files Modified:
  - `app/utils/variant-lookup.server.ts` (query + return type)
  - `app/services/bundles/metafield-sync/types.ts` (interface)
  - `app/services/bundles/metafield-sync/utils/pricing.ts` (function sig + returns)
  - `app/services/bundles/metafield-sync/operations/bundle-product.server.ts` (data pipeline)

**Status:** Completed

## Related Documentation
- Variant lookup: `app/utils/variant-lookup.server.ts`
- Metafield sync: `app/services/bundles/metafield-sync/operations/bundle-product.server.ts`
- Pricing types: `app/services/bundles/metafield-sync/types.ts`
- Pricing calc: `app/services/bundles/metafield-sync/utils/pricing.ts`
