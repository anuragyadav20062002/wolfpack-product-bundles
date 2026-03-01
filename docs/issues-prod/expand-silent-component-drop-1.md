# Issue: EXPAND Path Silently Drops Components Missing Pricing Data

**Issue ID:** expand-silent-component-drop-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-16
**Last Updated:** 2026-02-16 15:00

## Overview

In the EXPAND path of `cart_transform_run.ts` (lines 621-637), when a component variant in `componentReferences` has no matching entry in `pricingMap`, it is silently skipped. The component is not added to `componentDetails` and its pricing is not accumulated into bundle totals. This means:

1. The checkout UI shows fewer components than the bundle actually contains
2. Bundle totals (retail, bundle price, savings) are understated
3. The customer sees an incomplete bundle breakdown with no indication something is missing

## Root Cause

Line 625: `if (pricing) {` — when `pricingMap.get(variantId)` returns `undefined` (pricing metafield missing/stale for that variant), the entire component is dropped from display.

## Fix Strategy

When pricing data is missing for a component, use fallback values instead of skipping:
- Use 0 for prices (we don't know the price)
- Use 0 for discount/savings
- Still show the component in the checkout UI with its title and quantity

## Phases Checklist

- [x] Phase 1: Add fallback for missing pricing in EXPAND path
- [x] Phase 2: Review and commit

## Progress Log

### 2026-02-16 15:00 - Issue Created
- Identified silent drop at line 625 of cart_transform_run.ts
- Components without pricing data are completely invisible to customers
- Next: Add fallback values when pricing is missing

### 2026-02-16 15:05 - Phase 1 (Initial Approach)
- Added `else` branch with fallback zeros ($0.00 prices)
- Commit: 9a4fa31

### 2026-02-16 15:20 - Phase 1 (Revised: Hide Rather Than Fabricate)
- Reverted fallback zeros approach — showing $0.00 is misrepresentation
- New approach: if ANY component is missing pricing, clear entire breakdown
- Checkout UI falls back to simple "Bundle (N items)" view
- Principle: hide inaccurate data rather than fabricate it (0% error tolerance)
- Files Modified:
  - `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts` (lines 636-660)

**Status:** Completed
