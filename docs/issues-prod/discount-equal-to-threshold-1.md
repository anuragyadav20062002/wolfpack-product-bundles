# Issue: Discount "equal_to" condition shows wrong message when exceeded

**Issue ID:** discount-equal-to-threshold-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-24
**Last Updated:** 2026-02-24 19:30

## Overview
When a discount rule has condition `equal_to: 4` (quantity), adding 5 items shows
"Just 0 more items to unlock a discount!" instead of the success message template.
The discount text template is shown instead of the success message.

## Root Cause
`PricingCalculator.checkCondition()` uses strict equality (`value === targetValue`) for the
`equal_to` operator. With 5 items and a target of 4, `5 === 4` is false, so:
1. `calculateDiscount()` returns `hasDiscount: false`
2. `getNextDiscountRule()` returns the rule as "unsatisfied"
3. Footer renders discount text template with `conditionText = "0 items"` (clamped by Math.max)

For discount pricing rules, `equal_to: N` should mean "at threshold N or above" — once you
meet the quantity, the discount applies regardless of exceeding it.

## Fix
Changed `checkCondition()` to treat `equal_to` as `>=` (greater than or equal). This only
affects `PricingCalculator` — step conditions use the separate `ConditionValidator` module
which has its own exact-match logic.

## Files Changed
- `app/assets/widgets/shared/pricing-calculator.js` — `equal_to` → `>=`
- Both bundled widget files rebuilt

## Phases Checklist
- [x] Investigate root cause
- [x] Fix checkCondition equal_to operator
- [x] Build widgets
- [x] Commit
