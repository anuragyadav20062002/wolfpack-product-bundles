# Test Spec: FPB Rule Operator Scope
**Spec ID:** fpb-rule-operator-scope  **Created:** 2026-06-12

## Purpose
Ensure FPB Step Rules and Category Rules only support the three EB comparison operators: equal to, greater than or equal to, and less than or equal to.

## Test Cases
### AdminConstants
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Step rule operator options | `STEP_CONDITION_OPERATOR_OPTIONS` | `equal_to`, `greater_than_or_equal_to`, `less_than_or_equal_to` only | Admin must not expose strict `>` or `<` |
| 2 | Category rule operator options | `CATEGORY_CONDITION_OPERATOR_OPTIONS` | `equalTo`, `greaterThanOrEqualTo`, `lessThanOrEqualTo` only | Category rules use EB camelCase payload values |

### StorefrontValidator
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Step rule validator operators | `ConditionValidator.OPERATORS` | three supported operators only | Runtime source of truth |
| 2 | Unsupported strict greater-than rule reaches storefront | `greater_than` | step not satisfied | Prevent stale/invalid strict operator from passing |
| 3 | Unsupported strict less-than rule reaches storefront | `less_than` | step not satisfied | Prevent stale/invalid strict operator from passing |
| 4 | Category strict operator reaches storefront | `greaterThan` / `lessThan` | category rule not satisfied | Applies to category-rule mode too |

## Acceptance Criteria
- [x] Admin Step Rule operator options expose exactly `=`, `>=`, `<=`.
- [x] Admin Category Rule operator options expose exactly `=`, `>=`, `<=`.
- [x] Storefront Step Rule validation supports exactly `=`, `>=`, `<=`.
- [x] Storefront Category Rule validation supports exactly `=`, `>=`, `<=`.
- [x] FPB Rules Configuration doc records the three-operator invariant.
