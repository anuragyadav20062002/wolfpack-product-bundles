# Test Spec: PPB Product List Category Steps
**Spec ID:** ppb-product-list-category-steps  **Created:** 2026-07-11

## Purpose
Verify Product Page Bundle Product List category-step expansion behavior without source-grep tests.

## Test Cases
### SingleStepCategoryExpansion
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Control enabled with one step and multiple categories | `useSingleStepCategoriesAsBundleSteps=true`, one step, two categories | Returns one visible step per category | Category conditions override step conditions when present |
| 2 | Control disabled | `useSingleStepCategoriesAsBundleSteps=false` | Returns original bundle object | No runtime expansion |
| 3 | Default or free-gift step | enabled control with `isDefault` or `isFreeGift` | Returns original bundle object | Non-required steps are preserved |

## Acceptance Criteria
- [x] All listed test cases pass
- [x] Source-grep test for this behavior is removed
