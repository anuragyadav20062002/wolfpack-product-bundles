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
| 5 | Product List has multiple steps | In-page Cascade template with two configured steps | Step-flow mode is enabled | Other PPB templates and single-step Product List retain their existing layout. |
| 6 | Product List forward navigation blocked | Current step is incomplete | Navigation target remains the current step and reports blocked | Next must not expose a later step before its rule passes. |
| 7 | Product List forward navigation allowed | Current step is complete and another step exists | Navigation target is the next step | Mirrors EB's manual Next action. |
| 8 | Product List backward navigation | Current step is the second step | Navigation target is the previous step without validation | Mirrors EB's Back control. |
| 9 | Product List terminal navigation | Current step is the final step | Forward navigation reports final state | The primary action becomes Add Bundle to Cart on the final step. |
| 10 | Product List exact-rule over-target message | Exact quantity rule with value 1 rejects another selection | `Add exactly 01 products on this step` | Matches EB's Product List validation feedback. |

## Acceptance Criteria
- [x] Focused Product Page condition tests pass.
- [x] No CSS, class-name, source-order, or visual-placement assertions are added.
- [x] Product List step-flow mode is scoped to multi-step `PDP_INPAGE + CASCADE` bundles.
- [x] Forward, backward, blocked, and final navigation decisions pass focused tests.
- [x] Exact-rule Product List feedback matches the EB message contract.
