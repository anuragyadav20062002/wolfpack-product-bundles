# Test Spec: FPB Standard Variant Availability
**Spec ID:** fpb-standard-variant-availability  **Created:** 2026-06-29

## Purpose
Ensure FPB inline variant selection only exposes selectable grouped variant values and keeps the selected product availability state aligned with the selected variant.

## Test Cases
### VariantSelectorComponent
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Render grouped selector with unavailable-only value | Product currently points at available variant; another primary value only has unavailable variants | Rendered selector includes the available value and omits the unavailable-only value | Storefront should not expose unavailable-only grouped choices |
| 2 | Select unavailable-only primary value | Product currently points at available variant; requested primary value only has unavailable variants | Product remains on the available variant and no change callback fires | Prevents hidden/unavailable variants from entering bundle selection |

## Acceptance Criteria
- [x] Focused unit test passes.
- [x] Widget source syntax checks pass.
