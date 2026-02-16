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

### 2026-02-16 15:05 - All Phases Completed
- Added `else` branch at line 636 with fallback values (0 for all prices)
- Logs a warning when pricing is missing for a component variant
- Component still appears in checkout UI with title and quantity
- Files Modified:
  - `extensions/bundle-cart-transform-ts/src/cart_transform_run.ts` (lines 636-645)

**Status:** Completed
