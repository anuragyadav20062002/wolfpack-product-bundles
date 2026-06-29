# Test Spec: Condition Validator
**Spec ID:** condition-validator  **Created:** 2026-06-29

## Purpose
Verify shared storefront step/category rule validation for quantity and amount rules.

## Test Cases

### ConditionValidator
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Category quantity rule | Category with quantity condition and selected product quantities | Rule is satisfied only when category quantity threshold is met | Existing coverage |
| 2 | Category amount rule | Category with amount condition and selected product amounts | Rule is satisfied when selected category amount reaches the configured amount threshold | P04 regression |

## Acceptance Criteria
- [x] All listed test cases pass.
