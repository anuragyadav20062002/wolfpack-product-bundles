# Test Spec: PPB Product List Storefront
**Spec ID:** ppb-product-list-storefront  **Issue:** [polaris-prop-types-and-ppb-product-list-parity-1]  **Created:** 2026-06-04

## Purpose
Verify the PPB Product List storefront template renders through the dedicated `PDP_INPAGE` + `CASCADE` path with EB-style product rows and footer controls.

## Test Cases
### BundleWidgetProductPageCascadeTemplate
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Product List source contract | `app/assets/bundle-widget-product-page.js` | Contains CASCADE template helper, cascade product list rows, selected drawer toggle, and no in-row quantity selector for Product List | Guards storefront JS path |
| 2 | Product List CSS contract | `app/assets/widgets/product-page-css/bundle-widget.css` | Contains CASCADE-scoped product row, selected drawer, footer, CTA, and dynamic checkout styles | Guards EB visual structure |

## Acceptance Criteria
- [x] Focused Jest contract test passes.
- [x] Raw product-page widget JavaScript passes syntax check.
- [x] Widget assets are rebuilt and CSS assets are minified.
