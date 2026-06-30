# Test Spec: FPB Add-On Discount Function
**Spec ID:** fpb-addon-discount-function  **Created:** 2026-06-30

## Purpose

Verify the Discount Function path needed for EB parity on paid add-on checkout rows. Cart Transform can keep the add-on line separate and adjust price, but EB exposes the add-on reduction as a native line-level discount allocation titled `Add On`.

## Test Cases

### Add-On Line Discount Candidates
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Partial paid add-on discount | Cart line with `_bundle_step_type=addon:PERCENTAGE:10`, quantity `1`, unit price `829.00` | One product discount candidate targeting that line, `10%`, message `Add On` | Matches P09 EB `ADD ON (-...)` allocation |
| 2 | 100% add-on discount | Cart line with `_bundle_step_type=addon:PERCENTAGE:100` | One product discount candidate targeting that line, `100%`, message `Add On` | Supports free add-on tier parity |
| 3 | Non-add-on bundle line | Cart line without add-on step type | No candidate | Prevents normal bundle components from double-discounting |
| 4 | Malformed add-on token | `_bundle_step_type=addon:PERCENTAGE` or non-positive discount | No candidate | Avoids unsafe discounts from bad cart attributes |

## Acceptance Criteria

- [ ] Function emits line-level discount candidates only for selected add-on lines.
- [ ] Function supports partial and `100%` percentage discounts.
- [ ] Function uses `Add On` as the candidate message so Shopify checkout can render the native discount row.
- [ ] Cart Transform remains responsible for merge/split behavior and Checkout UI remains inert.
