# Issue: Per-Component Prices Show Per-Unit Values Next to Total Quantity

**Issue ID:** per-unit-vs-total-pricing-display-1
**Status:** Completed
**Priority:** 🟡 Medium
**Created:** 2026-02-16
**Last Updated:** 2026-02-16 15:00

## Overview

In the checkout UI expanded component list, each component shows `{quantity}x {title}` with per-unit pricing. For example: "2x Premium T-Shirt — Retail: $49.00, Bundle: $44.10". The $49.00 is per-unit, but shown next to "2x", creating ambiguity. The header totals are correct (multiplied by quantity), but the per-component breakdown is per-unit.

Both MERGE and EXPAND paths write per-unit prices to the compact array format:
- MERGE (line 455): `retailCents = amountPerQuantity * 100` (per-unit)
- EXPAND (line 627): `pricing.retailPrice` (per-unit from metafield)

But quantity is total: MERGE uses `l.quantity`, EXPAND uses `componentQuantities[index] * line.quantity`.

## Fix Strategy

Multiply prices by quantity in the checkout UI display when rendering the expanded component list. This keeps per-unit data in the transport format (useful for future needs) while showing totals to the customer.

## Phases Checklist

- [x] Phase 1: Update Checkout.tsx to multiply component prices by quantity for display
- [x] Phase 2: Review and commit

## Progress Log

### 2026-02-16 15:00 - Issue Created
- Traced per-unit values through both MERGE and EXPAND paths
- Header totals are already correct (pre-multiplied)
- Per-component expanded list needs quantity multiplication
- Next: Update Checkout.tsx display

### 2026-02-16 15:10 - All Phases Completed
- Multiplied `retailPrice`, `bundlePrice`, and `savingsAmount` by `component.quantity` in display
- Percentage stays as-is (per-unit percentage is same as total percentage)
- Per-unit data preserved in transport format for future use
- Files Modified:
  - `extensions/bundle-checkout-ui/src/Checkout.tsx` (lines 204, 210, 222)

**Status:** Completed
