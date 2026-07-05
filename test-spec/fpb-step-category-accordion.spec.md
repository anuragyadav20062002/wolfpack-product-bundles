# Test Spec: FPB Step Category Accordion
**Spec ID:** fpb-step-category-accordion  **Created:** 2026-07-03

## Purpose
Keep the FPB Step Setup category accordion focused on product/collection selection for single-category steps, while preserving category-name editing when multiple categories need distinct storefront labels.

## Test Cases
### FpbStepCategoryAccordion
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Single category accordion content | Open accordion with one `StepCategory` | Category name text box is not rendered; Products/Collections controls remain visible | Matches requested focused content state |
| 2 | Multi-category accordion content | Open accordion with two `StepCategory` rows | Category name text box is rendered for the active category | Required to label multiple storefront categories |

## Acceptance Criteria
- [x] Single-category FPB accordion hides the category-name text box.
- [x] Multi-category FPB accordion keeps the category-name text box.
- [x] Products/Collections controls remain visible in both states.
