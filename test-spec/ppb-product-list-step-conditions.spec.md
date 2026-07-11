# Test Spec: PPB Product List Step Conditions
**Spec ID:** ppb-product-list-step-conditions  **Created:** 2026-07-11

## Purpose

Verify Product Page Bundle Product List step and category rules match EB's storefront condition semantics for quantity, amount, and multi-step gating.

## Test Cases

### ProductPageModalStateMethods
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Category amount rule with selected variant | Category product rule `type=amount`, selected variant belongs to that product, selected product has price in cents | `validateStep(...)` returns true when selected line amount meets the threshold | EB category amount rules use selected item value, not selected quantity. |
| 2 | Category amount rule below threshold | Same rule with selected product below threshold | `validateStep(...)` returns false | Prevents checkout/next when amount rule is unmet. |
| 3 | Previous step incomplete | Two required steps, step 0 condition unmet | `isStepAccessible(1)` returns false | Product List must block forward navigation through incomplete steps. |
| 4 | Previous step complete | Same two-step setup with step 0 condition met | `isStepAccessible(1)` returns true | Product List allows forward navigation after conditions are met. |

## Acceptance Criteria
- [x] Focused Product Page condition tests pass.
- [x] No CSS, class-name, source-order, or visual-placement assertions are added.
