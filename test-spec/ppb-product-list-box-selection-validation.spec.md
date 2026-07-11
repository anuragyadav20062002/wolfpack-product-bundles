# Test Spec: PPB Product List Box Selection Validation
**Spec ID:** ppb-product-list-box-selection-validation  **Created:** 2026-07-11

## Purpose

Verify Product Page Bundle Product List add-to-cart honors EB's runtime box-selection validation contract: the visible quantity-option UI and checkout validation flag are separate, and only `boxSelection.validateBoxSelectionQuantity === true` gates checkout.

## Test Cases

### ProductPageCartMethods
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Validation disabled | `boxSelection.isEnabled=true`, active rule `boxQuantity=3`, `validateBoxSelectionQuantity=false`, selected quantity `1` | Checkout validation passes | EB never blocks when runtime validation flag is false. |
| 2 | Validation enabled, exact quantity | Same active rule with `validateBoxSelectionQuantity=true`, selected quantity `3` | Checkout validation passes | EB requires exact active rule quantity. |
| 3 | Validation enabled, under target | Same active rule with selected quantity `2` | Checkout validation fails with difference `1` | Prevents under-filled Product List bundles. |
| 4 | Validation enabled, over target | Same active rule with selected quantity `4` | Checkout validation fails with difference `1` | EB exact-match rule also blocks over-filled bundles. |

## Acceptance Criteria
- [x] Focused Product Page cart behavior tests pass.
- [x] No CSS, class-name, source-order, or visual-placement assertions are added.
