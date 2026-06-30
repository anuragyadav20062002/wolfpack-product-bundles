# Test Spec: FPB Standard Variant Availability
**Spec ID:** fpb-standard-variant-availability  **Created:** 2026-06-29

## Purpose
Ensure FPB Standard inline variant selection keeps the selected product availability state aligned with the selected variant, so out-of-stock variants cannot be added after a variant change.

## Test Cases
### VariantSelectorComponent
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Select unavailable fallback variant | Product currently points at available variant; requested primary value only has unavailable variants | Product `available` becomes `false` and selected variant id changes | Mirrors EB OOS blocked behavior for visible unavailable variants |

## Acceptance Criteria
- [x] Focused unit test passes.
- [x] Widget source syntax checks pass.
