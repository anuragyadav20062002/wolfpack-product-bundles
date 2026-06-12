# Test Spec: Shared Bundle State
**Spec ID:** shared-bundle-state  **Issue:** none  **Created:** 2026-06-11

## Purpose

Create the Loop 3 shared state skeleton without changing storefront visuals.

## Test Cases

### SharedBundleState
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Creates state from bundle and selection data | bundle with two steps, selected products map | immutable-looking state with bundle, steps, selectedProducts, currentStepIndex | No rendering side effects |
| 2 | Counts selected quantity across steps | selected quantities `{0: {v1: 2}, 1: {v2: 1}}` | total quantity `3` | Selector used by FPB/PPB wiring |
| 3 | Computes selected subtotal across product data | selected quantities and step product prices | total cents sum | Selector reads product data by variant ID |
| 4 | Adds selected product immutably | current state plus step/product/quantity | returned state includes merged quantity, original unchanged | Minimal action primitive |
| 5 | Removes selected product immutably | current state plus step/variant | returned state decrements/removes, original unchanged | Minimal action primitive |

### WidgetBuildSharedModules
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Build script inlines shared engine modules | `scripts/build-widget-bundles.js` | create state, selectors, actions modules appear in `SHARED_MODULES` | Prevents storefront bundle missing imports |

## Acceptance Criteria

- [x] New shared state tests pass.
- [x] Build module inclusion test passes.
- [x] FPB and PPB each have one non-invasive selector-backed selected count helper.
