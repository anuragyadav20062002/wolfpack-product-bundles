# Issue: Complete calculateBundlePrice() for fixed_amount_off and fixed_bundle_price

**Issue ID:** bundle-price-discount-methods-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-04-16
**Last Updated:** 2026-04-16 17:20

## Overview

`calculateBundlePrice()` in `app/services/bundles/pricing-calculation.server.ts` only applies discounts for `percentage_off`. The `fixed_amount_off` and `fixed_bundle_price` branches are missing, so bundles with those discount methods produce an undiscounted display price on their Shopify variant product — meaning Google Shopping, Meta Catalog, and TikTok Shop feeds see the wrong (inflated) price.

## Root Cause

Lines 305–315 of `pricing-calculation.server.ts`:
```typescript
if (rules.length > 0 && bundle.pricing.method === 'percentage_off') { ... }
```
No `else if` branches for the other two discount methods. They silently fall through.

## Unit Conversion

From `app/types/pricing.ts` (authoritative):
- `percentage_off` → `discount.value` is 0–100 (percent)
- `fixed_amount_off` → `discount.value` is in **cents** (e.g. 500 = $5.00 off)
- `fixed_bundle_price` → `discount.value` is in **cents** (e.g. 2999 = $29.99 final price)

`totalPrice` inside `calculateBundlePrice()` accumulates in **dollars** (from Shopify GraphQL price strings). So cents must be divided by 100 before use.

## Fix

Add two branches after the `percentage_off` block:
- `fixed_amount_off`: subtract `discountValue / 100` from `totalPrice`
- `fixed_bundle_price`: set `totalPrice = discountValue / 100` directly

Both then fall through to the existing `Math.max(totalPrice, MINIMUM_BUNDLE_PRICE)` clamp.

## Files Changed

- `tests/unit/services/pricing-creation.test.ts` — new tests for both methods
- `app/services/bundles/pricing-calculation.server.ts` — fix discount block

## Progress Log

### 2026-04-16 17:12 - Starting implementation
- Writing failing tests for `fixed_amount_off` and `fixed_bundle_price`
- Then implementing the fix
- Files: pricing-creation.test.ts, pricing-calculation.server.ts

### 2026-04-16 17:20 - Completed
- ✅ Added `debug: jest.fn()` to mock (pre-existing omission caused all 11 tests to fail)
- ✅ Added 4 new failing tests: fixed_amount_off happy path, fixed_amount_off exceeds total (clamp), fixed_bundle_price happy path, fixed_bundle_price at zero (clamp)
- ✅ Implemented fix: replaced single `percentage_off`-only `if` block with `if / else if / else if` covering all three discount methods
- ✅ Unit conversion: `fixed_amount_off` and `fixed_bundle_price` values are in cents → divide by 100 before applying to dollar-denominated `totalPrice`
- ✅ All 11 tests pass, 0 regressions
- ✅ Lint: 0 new errors (pre-existing `import/first` error in test file is from the jest.mock-before-import hoisting pattern; confirmed present before this change)

## Phases Checklist
- [x] Phase 1: Write failing tests for fixed_amount_off and fixed_bundle_price
- [x] Phase 2: Implement the fix in calculateBundlePrice()
- [x] Phase 3: All tests pass (11/11)
- [x] Phase 4: Lint clean (0 new errors)
- [ ] Phase 5: Commit
