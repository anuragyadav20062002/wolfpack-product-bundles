# Issue: Step Condition Regression Testing & Bug Fixes

**Issue ID:** step-condition-regression-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-02-24
**Last Updated:** 2026-02-24 12:30

## Overview
Comprehensive regression testing of step conditions across both bundle types (product-page and full-page). User reported that configuring quantity > 1 on a single step still allows Add to Cart. Need to test all condition permutations, find bugs, and fix them.

## Progress Log

### 2026-02-24 11:00 - Starting Investigation
- Explored entire step conditions system (DB → API → widget)
- Identified key code paths to trace
- Creating regression testing plan
- Next: Trace code paths to find bugs

### 2026-02-24 12:00 - Bugs Found & Fixed
- Traced full-page widget code paths thoroughly
- Found 3 critical bugs, all in `app/assets/bundle-widget-full-page.js`
- Product-page widget confirmed correct — all paths properly use `ConditionValidator`
- Data flow (DB → metafield/API → widget) confirmed correct — conditions arrive as expected

**Bug 1 — `isStepCompleted()` bypasses ConditionValidator:**
- Was using `totalQuantity >= (step.minQuantity || 1)` instead of `ConditionValidator.isStepConditionSatisfied()`
- Since `minQuantity` defaults to 1, selecting just 1 item always passed — regardless of configured conditions
- Fix: Delegate entirely to `ConditionValidator.isStepConditionSatisfied(step, stepSelections)`
- Impact: `areBundleConditionsMet()`, `canProceedToNextStep()`, `isStepAccessible()` all fixed transitively

**Bug 2 — `addBundleToCart()` missing final validation guard:**
- No validation before cart submission — unlike product-page which validates all steps
- Fix: Added `validateStep()` guard with toast message and early return

**Bug 3 — Footer Next button click handler uses stale closure:**
- Used captured `canProceed` variable instead of live validation
- Fix: Replaced with `this.canProceedToNextStep()` call + added else-branch with toast notification

### 2026-02-24 12:30 - Build, Verify & Commit
- Built widgets: both bundles compile successfully (196.2KB full-page, 119.0KB product-page)
- Verified fix strings present in bundled output
- Lint: zero errors
- Committed fixes

## Regression Testing Analysis

### Data Flow (Verified Correct)
1. **DB**: BundleStep fields — conditionType, conditionOperator, conditionValue (+ operator2/value2)
2. **Metafield sync** (`bundle-product.server.ts:181-185`): All 5 condition fields passed through
3. **API endpoint** (`api.bundle.$bundleId[.]json.tsx:496-500`): All 5 condition fields included
4. **Widget**: Reads conditions from step data, passes to `ConditionValidator`

### ConditionValidator (Verified Correct)
- `isStepConditionSatisfied()`: Proper null guard, correct operator evaluation, AND logic for dual conditions
- `canUpdateQuantity()`: Only blocks increases violating upper bounds, decreases always permitted
- `_evaluateSatisfied()`: Uses strict `===` for EQUAL_TO — safe because conditionValue is Prisma `Int` (number)
- Type safety: `conditionValue` comes from Prisma as `Int?` → arrives as number in JSON → strict comparison correct

### Product-Page Widget (Verified Correct — No Bugs)
- `validateStep()` at line 1623: Delegates to `ConditionValidator.isStepConditionSatisfied()`
- `updateAddToCartButton()` at line 800: Iterates all steps with `validateStep()`
- `addToCart()` at line 1803: Final validation guard with `validateStep()` on all steps
- `isStepAccessible()` at line 1631: Uses `validateStep()` for all previous steps
- `navigateModal()` at line 1974: Uses `validateStep()` before navigation
- `updateModalNavigation()` at line 1641: Uses `validateStep()` for button disabled state

### Full-Page Widget (3 Bugs Fixed)
- `isStepCompleted()` — **FIXED**: Now delegates to `ConditionValidator.isStepConditionSatisfied()`
- `addBundleToCart()` — **FIXED**: Now validates all steps before submission
- Footer Next click handler — **FIXED**: Now uses live `this.canProceedToNextStep()` + toast
- `validateStep()` at line 2922: Already correct (delegates to ConditionValidator)
- `validateStepCondition()` at line 2900: Already correct (delegates to `canUpdateQuantity()`)
- `updateModalNavigation()` at line 2938: Already correct (uses `validateStep()`)
- `navigateModal()` at line 3275: Already correct (uses `validateStep()`)
- `renderFullPageFooter()`: Called after `updateProductSelection()` — button state refreshes correctly

### Operator Permutations Tested (Code Trace)
| Operator | canUpdateQuantity (real-time) | isStepConditionSatisfied (completion) |
|----------|------------------------------|--------------------------------------|
| equal_to | Allows up to N, blocks > N | Requires total === N |
| greater_than | No upper cap | Requires total > N |
| less_than | Blocks at >= N | Requires total < N |
| greater_than_or_equal_to | No upper cap | Requires total >= N |
| less_than_or_equal_to | Blocks at > N | Requires total <= N |
| Dual conditions (AND) | Both must allow | Both must be satisfied |
| No condition (null) | Always allows | Always satisfied (optional step) |

## Files Changed
| File | Change |
|------|--------|
| `app/assets/bundle-widget-full-page.js` | Fixed `isStepCompleted()`, `addBundleToCart()`, footer Next handler |
| `extensions/bundle-builder/assets/bundle-widget-full-page-bundled.js` | Rebuilt output |

## Related Documentation
- Condition validator: `app/assets/widgets/shared/condition-validator.js`
- Product-page widget: `app/assets/bundle-widget-product-page.js`
- Full-page widget: `app/assets/bundle-widget-full-page.js`

## Phases Checklist
- [x] Phase 1: Explore codebase and understand conditions system
- [x] Phase 2: Regression testing plan (inline above)
- [x] Phase 3: Trace code paths and identify bugs
- [x] Phase 4: Fix all identified bugs (3 bugs in full-page widget)
- [x] Phase 5: Rebuild widgets and verify
- [x] Phase 6: Lint and commit
