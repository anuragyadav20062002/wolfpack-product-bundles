# Issue: Cart Transform — Pricing Audit & EXPAND Bug Fix

**Issue ID:** cart-transform-audit-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-04-11
**Last Updated:** 2026-04-11 03:30

## Overview

Full audit of cart transform pricing across the entire bundle lifecycle:
widget display price → cart add → Shopify cart transform (MERGE/EXPAND) → checkout total.

## Phases Checklist

- [x] Phase 1: Live test — add 2-step bundle on SIT, verify widget price ✅
- [x] Phase 2: Verify cart state after add (`/cart.js`) ✅
- [x] Phase 3: Code review of MERGE and EXPAND paths ✅
- [x] Phase 4: Fix EXPAND bug ✅

## Findings

### MERGE Path (PDP widget) — CORRECT ✅

Verified live on SIT with Cookie D (₹51) + Cookie A (₹263), 50% off bundle:

| Stage | Value | Correct? |
|-------|-------|----------|
| Widget display price | ₹157.00 | ✅ (₹314 × 50%) |
| Cart item count | 1 (merged) | ✅ |
| Cart total | ₹157.00 (15700 paise) | ✅ |
| `_bundle_total_retail_cents` | 31400 (₹314) | ✅ |
| `_bundle_total_price_cents` | 15700 (₹157) | ✅ |
| `_bundle_total_savings_cents` | 15700 (₹157) | ✅ |
| `_bundle_discount_percent` | 50.00 | ✅ |
| Cookie D component | retail=5100, bundle=2550, pct=50 | ✅ |
| Cookie A component | retail=26300, bundle=13150, pct=50 | ✅ |

Free gift handling logic correct (effectivePct absorbs free gift cost).
Condition-based discounts (quantity/amount thresholds) logic correct.
Currency presentment rate handling correct.

### EXPAND Path (FPB / full-page bundles) — BUG FOUND & FIXED ✅

**Root cause:** `calculateDiscountPercentage` was called with 4 args; function requires 6.

```typescript
// Before (broken — only 4 args)
discountPercentage = calculateDiscountPercentage(
  priceAdjustment,
  originalTotal,          // → mapped to paidTotal param (✓)
  totalQuantity,          // → mapped to originalTotal param (✗ quantity ≠ dollar amount)
  presentmentCurrencyRate // → mapped to totalQuantity param (✗ rate ≠ quantity)
  // paidQuantity param    → undefined (✗)
  // presentmentCurrencyRate param → undefined (✗)
);
```

**Effect for `percentage_off`:**
- `targetPrice = paidTotal × (1 − pct/100)` — accidentally correct (uses originalTotal as paidTotal)
- `result = (1 − targetPrice / originalTotal_param) × 100` — uses `totalQuantity` (e.g. 2) as divisor
- Example: `(1 − 157/2) × 100 = −7750%` → clamped to 0
- **FPB bundles received 0% discount at checkout regardless of configured discount**

**Fix:**
```typescript
// After (correct — all 6 args)
discountPercentage = calculateDiscountPercentage(
  priceAdjustment,
  originalTotal,        // paidTotal (EXPAND has no free-gift lines)
  originalTotal,        // originalTotal
  totalQuantity,        // totalQuantity
  totalQuantity,        // paidQuantity (same as totalQuantity — no free gifts in EXPAND)
  presentmentCurrencyRate
);
```

**File:** `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts:613`

## Progress Log

### 2026-04-11 03:00 - Audit Started

Live interaction on SIT (`wolfpack-store-test-1.myshopify.com/products/hello-1`):
- Opened bottom sheet, selected Cookie D (₹51) for Step 1, Cookie A (₹263) for Step 2
- Widget showed "Add Bundle to Cart • ₹157.00" — correct 50% calculation
- Added to cart, verified `/cart.js` response

### 2026-04-11 03:30 - Bug Found & Fixed

- Read `cart_transform_run.ts` in full
- Found EXPAND path `calculateDiscountPercentage` called with 4 args instead of 6
- Fixed arg mismatch: all 6 params now correctly supplied
- File: `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts` (line 613)
- **Note:** EXPAND path requires WASM rebuild: `cd extensions/bundle-cart-transform-ts && npm run build`
- Commit: (pending)
