# Issue: Attribution Matching — bundleId Null & orderNumber Null

**Issue ID:** attribution-matching-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-04-02
**Last Updated:** 2026-04-02 14:45

## Overview
Two inconsistencies found in the OrderAttribution record from the test purchase at
`/pages/564-2?utm_source=facebook&utm_campaign=bundles`:

### Bug 1: bundleId is null (bundle matching fails for flat orders)
The attribution API matches bundles by comparing checkout line item product IDs against
`bundle.shopifyProductId` (the container product). When Cart Transform MERGE isn't active
(e.g. first purchase before sync), the order contains **component product IDs**, not the
bundle container product ID. The DB query finds nothing → bundleId stays null → the order
is excluded from Bundle Revenue KPIs even though it was a bundle purchase.

**Fix:** Add a component-product fallback: if no direct match, query BundleStep where
any StepProduct.productId matches a line item product ID and infer the bundleId from there.

### Bug 2: orderNumber is null
The pixel sends `checkout.order.name` (cast to `any`) hoping to get the "#1001" display
string. That field is not exposed in the Shopify pixel API sandbox → null. The orderId
(numeric) is already captured, so orderNumber can be derived by stripping the GID prefix
from the order ID.

**Fix:** Set orderNumber by parsing the numeric ID from `checkout.order?.id`.

## Progress Log

### 2026-04-02 14:45 - Completed
- ✅ Bug 1: Added two-pass bundle matching in api.attribution.tsx
  - Pass 1: direct match on bundle.shopifyProductId (MERGE active)
  - Pass 2: fallback via BundleStep → StepProduct.productId (MERGE inactive)
- ✅ Bug 2: Replaced `checkout.order.name` (null) with numeric ID parsed from order GID
- ✅ Lint: 0 errors
- ✅ Committed

## Files to Change
- `app/routes/api/api.attribution.tsx`
- `extensions/wolfpack-utm-pixel/src/index.ts`

## Phases Checklist
- [x] Fix api.attribution.tsx — component product fallback matching
- [x] Fix pixel — orderNumber from order ID
- [x] Lint
- [x] Commit
