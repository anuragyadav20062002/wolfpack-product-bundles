# Test Spec: PPB Template Container Responsive Regression
**Spec ID:** ppb-template-container-responsive-regression  **Issue:** [ppb-template-container-responsive-regression-1]  **Created:** 2026-06-04

## Purpose
Verify PPB Product List and Horizontal Slots storefront templates do not keep fixed 345px caps when rendered inside wider storefront containers.

## Test Cases
### ProductPageTemplateResponsiveness
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Product List controls expand with container | `PDP_INPAGE` + `CASCADE` CSS | Add-to-cart and dynamic checkout use `width:100%` with no `max-width:345px` cap | Product Grid placement probe confirmed PPB templates should be responsive |
| 2 | Horizontal Slots wrapper expands with container | `PDP_MODAL` + `MODAL` CSS | Root, steps, section, grid, add-to-cart, and dynamic checkout use container-relative widths | Preserve EB narrow-column proportions through responsive grid math |
| 3 | Mobile remains constrained | Mobile media CSS | Small screens still cap to viewport width instead of overflowing | Prevents wide desktop responsiveness from breaking mobile |

## Acceptance Criteria
- [x] Focused Jest contract test fails before implementation and passes after.
- [x] Raw product-page widget/module syntax checks pass.
- [x] Widget assets are rebuilt and CSS assets remain under Shopify size limits.
