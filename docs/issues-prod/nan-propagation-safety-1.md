# Issue: NaN Propagation Can Show "NaN" Prices in Checkout

**Issue ID:** nan-propagation-safety-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-16
**Last Updated:** 2026-02-16 15:30

## Overview

One invalid `parseFloat` result in the cart transform produces NaN, which cascades through every calculation and ultimately writes `"NaN"` as attribute values. The checkout UI then displays literal "NaN" as prices and item counts. `Math.max(0, Math.min(100, NaN))` also returns NaN — the clamp doesn't protect against it.

## Findings

### Cart Transform:
1. `parseFloat(l.cost.amountPerQuantity.amount)` — NaN if invalid string
2. `parseFloat(l.cost.totalAmount.amount)` — NaN if invalid string
3. `calculateDiscountPercentage` clamp: `Math.max(0, Math.min(100, NaN))` → NaN
4. `discountPercentage.toFixed(2)` → `"NaN"` → sent to Shopify as percentageDecrease
5. `parent.id` not validated before use as parentVariantId

### Checkout UI:
1. `parseInt("NaN", 10)` → NaN → "Bundle (NaN items)"
2. `formatMoney(NaN)` → Intl.NumberFormat displays literal "NaN"
3. `parseComponents` truthy trap: `"abc" || 0` → `"abc"` not `0`
4. `formatPercent` doesn't guard against NaN result from Number()

## Fix Strategy

- Cart transform: Add `safeParseFloat` helper that returns 0 on NaN
- Cart transform: Fix clamp to return 0 on NaN
- Cart transform: Validate parent.id before creating merge operation
- Checkout UI: Add NaN guards on all parseInt results
- Checkout UI: Guard formatMoney against NaN input
- Checkout UI: Use Number() coercion in parseComponents

## Phases Checklist

- [x] Phase 1: Cart transform NaN safety
- [x] Phase 2: Checkout UI NaN safety
- [x] Phase 3: Review and commit

## Progress Log

### 2026-02-16 15:30 - Issue Created
- Full audit of both files for NaN propagation paths
- Identified 7 distinct vulnerability points
- Next: Fix cart transform first (source of truth)

### 2026-02-16 15:45 - All Phases Completed

**Cart Transform fixes:**
- Added `safeParseFloat()` helper — returns 0 on NaN/Infinity/undefined
- Replaced all 3 `parseFloat` calls on cost amounts with `safeParseFloat`
- Fixed NaN-unsafe clamp: `Number.isFinite(result)` check before `Math.max/min`
- Added `parent.id` validation before merge operation creation

**Checkout UI fixes:**
- Added `safeInt()` and `safeFloat()` helpers for attribute parsing
- Replaced all `parseInt`/`parseFloat` on attributes with safe versions
- Added `Number.isFinite` guard in `formatMoney` — prevents "NaN" display
- Added `Number.isFinite` guard in `formatPercent`
- Replaced truthy `|| 0` in `parseComponents` with `Number()` + `Number.isFinite` coercion
- Used `String(val ?? '')` for title fields instead of truthy `|| ''`

**Files Modified:**
- `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts`
- `extensions/bundle-checkout-ui/src/Checkout.tsx`

**Status:** Completed
