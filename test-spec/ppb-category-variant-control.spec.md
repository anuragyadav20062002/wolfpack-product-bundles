# Test Spec: PPB Category Variant Control
**Spec ID:** ppb-category-variant-control  **Created:** 2026-07-15

## Purpose
Match EB's PPB category-level variant display control so each category can independently render product variants as individual products.

## Test Cases
### PPB category variant control
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Enable one category | Two categories are false; enable category index 1 | Only category index 1 becomes true | Sibling categories remain unchanged |
| 2 | Accordion placement | Expanded PPB category accordion | Checkbox renders inside that category's accordion body | Matches live EB placement |

## Acceptance Criteria
- [x] Updating one category does not modify sibling categories.
- [x] Every expanded PPB category accordion owns its checkbox.
- [x] The step-level aggregate checkbox is removed.
- [x] Existing category-level save/runtime field remains unchanged.
