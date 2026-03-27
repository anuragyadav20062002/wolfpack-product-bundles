# Issue: Step Unconfigured Max Limit Fix

**Issue ID:** step-unconfigured-max-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-03-27
**Last Updated:** 2026-03-27 10:10
**Status:** Completed

## Overview

When a merchant configures a bundle step with **no explicit step condition** (no conditionType/conditionOperator/conditionValue), the widget was incorrectly limiting selection to 1 product per step. This was caused by:

1. Prisma schema defaults both `minQuantity` and `maxQuantity` to `1` on the `BundleStep` model.
2. `ConditionValidator.canUpdateQuantity()` enforces `maxQuantity` as an upper bound even when no condition is configured — so the default DB value of 1 silently caps all unconfigured steps.
3. `ConditionValidator.isStepConditionSatisfied()` similarly enforces the `maxQuantity` upper bound, preventing step completion with more than 1 item when no condition is set.

**Expected behavior:** When no step condition is configured, the step should have **no upper bound** — merchants can add as many products as they want. Only the minimum requirement (`minQuantity`, default 1) should be enforced at navigation time.

## Phases Checklist

- [x] Phase 1: Fix `ConditionValidator` — remove maxQuantity upper bound enforcement when no condition is set
- [x] Phase 2: Build widgets and verify

## Progress Log

### 2026-03-27 10:00 - Phase 1: Fix ConditionValidator Started
- ⏳ Modifying `app/assets/widgets/shared/condition-validator.js`
- Removing maxQuantity upper-bound check in `canUpdateQuantity()` when no condition is configured
- Removing maxQuantity upper-bound check in `isStepConditionSatisfied()` when no condition is configured
- The dim state in widgets derives from `canUpdateQuantity()` so it will be fixed automatically

### 2026-03-27 10:05 - Phase 1: Fix ConditionValidator Completed
- ✅ `canUpdateQuantity()`: When no condition configured, return `{ allowed: true }` — no maxQuantity cap
- ✅ `isStepConditionSatisfied()`: When no condition configured, only enforce minQuantity (≥1), no max cap
- ✅ Files Modified:
  - `app/assets/widgets/shared/condition-validator.js` (lines 72-80, 122-128)
- Result: Steps with no configured condition now allow unlimited product selections
- Impact: Fixes broken UX for all merchants who haven't explicitly set step conditions
- Next: Build widgets, lint, commit

## Related Documentation
- `app/assets/widgets/shared/condition-validator.js` — core validation engine
- `prisma/schema.prisma` — BundleStep model (minQuantity/maxQuantity default to 1)
