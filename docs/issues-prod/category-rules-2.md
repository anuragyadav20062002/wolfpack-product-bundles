# Issue: Storefront SDK Enforces Category Rules

**Issue ID:** category-rules-2
**Status:** In Progress
**Priority:** 🟡 Medium
**Created:** 2026-05-29
**Last Updated:** 2026-05-29

## Overview

Per `docs/competitor-analysis/18-category-rules-research.md` (category-rules-1): admin UI + DB + server runtime already understand per-category conditions. The storefront SDK validators ignore them. This commit closes the gap.

## Approach

In `app/assets/widgets/shared/condition-validator.js`:

1. Add operator normalization (camelCase `greaterThanOrEqualTo` ↔ snake_case `greater_than_or_equal_to`) so the validator accepts both EB-style and Wolfpack-style operator names. Admin saves use the camelCase form; existing step-level fields use snake_case.
2. Add `evaluateCategoryRules(category, stepSelections)` — pure helper that sums selections belonging to the category and ANDs each rule's evaluation.
3. Extend `isStepConditionSatisfied(step, selections)`:
   - When any category has non-empty `conditions`, evaluate all categories with the helper and AND the results. Categories without conditions don't block.
   - Otherwise fall through to existing step-level check (no behavior change for bundles that use step rules only).

In `app/assets/sdk/validate-bundle.js`:

4. Detect the same "category mode" before building the step-level error message. When category mode is on and the step is not satisfied, return a generic "Selection requirements not met" message (per-category specific text is a follow-up).

Bump `WIDGET_VERSION` (PATCH bump), `npm run build:widgets`, prompt user for `npm run deploy:sit`.

## Files Changed

- `app/assets/widgets/shared/condition-validator.js` — operator normalizer, `evaluateCategoryRules`, branched `isStepConditionSatisfied`.
- `app/assets/sdk/validate-bundle.js` — category-mode message branch.
- `scripts/build-widget-bundles.js` — `WIDGET_VERSION` bump.

## Tests

- Extend `tests/unit/assets/condition-validator.test.ts` with:
  - Operator normalizer cases
  - `evaluateCategoryRules` standalone cases
  - `isStepConditionSatisfied` category-mode cases (single category w/ rule met / not met, two categories AND'd, mixed empty + non-empty conditions)

## Phases Checklist

- [x] Phase 1: Tests for normalizer + category helper + branched step satisfaction
- [x] Phase 2: Implement validator changes
- [x] Phase 3: Update SDK error branch
- [x] Phase 4: Bump WIDGET_VERSION 2.9.6 → 2.9.7, build widgets
- [x] Phase 5: Commit (next: user runs `npm run deploy:sit`)

**Status:** Code complete. Awaiting merchant-driven `npm run deploy:sit`.

## Progress Log

### 2026-05-29 — Implementation complete
- Added 5 new test cases to `tests/unit/assets/condition-validator.test.ts` covering: snake_case operator, camelCase operator, partial selection, two-category AND, mixed empty/non-empty conditions, selections outside category, step-level fallback when no category has conditions, LTE in category mode.
- Implemented `_normalizeOperator` (accepts both `greaterThanOrEqualTo` and `greater_than_or_equal_to`), `_sumQuantities`, `_collectCategoryProductIds`, and `evaluateCategoryRules` in `condition-validator.js`. The category helper sums only selections belonging to the category's product ids and ANDs each rule.
- Branched `isStepConditionSatisfied`: when any category has non-empty `conditions`, evaluate each category independently (categories without conditions don't gate). Otherwise fall through to existing step-level logic. Step-rule bundles see zero behavior change.
- Updated `app/assets/sdk/validate-bundle.js` to detect category mode and surface a generic "Selection requirements not met for this step." message instead of a step-level-specific message.
- Bumped `WIDGET_VERSION` `2.9.6` → `2.9.7`. Ran `npm run build:widgets`. Built files confirmed via `grep __BUNDLE_WIDGET_VERSION__ extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` → `'2.9.7'`.
- 97/97 condition validator tests + 9/9 SDK tests passing.

### 2026-05-29 — Starting implementation
- Created issue file. Adding failing tests next.
