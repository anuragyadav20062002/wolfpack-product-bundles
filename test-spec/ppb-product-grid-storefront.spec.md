# Test Spec: PPB Product Grid Storefront
**Spec ID:** ppb-product-grid-storefront  **Issue:** [ppb-product-grid-storefront-parity-1]  **Created:** 2026-06-04

## Purpose
Verify the PPB Product Grid storefront template renders EB-style `PDP_INPAGE` + `COGNIVE` product grid layout and remains isolated from Product List/Cascade.

## Test Cases
### ProductPageProductGridTemplate
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Product Grid template contract | `app/assets/bundle-widget-product-page.js` and `app/assets/widgets/product-page-css/bundle-widget.css` | COGNIVE uses a dedicated grid card style with EB-matched product image, title, price, and Add button sizing | Test values updated from live EB inspection |
| 2 | Product List isolation | `app/assets/widgets/product-page-css/bundle-widget.css` | CASCADE selectors remain separate from COGNIVE selectors | Prevents Product Grid changes from regressing Product List |
| 3 | Build output contract | `scripts/build-widget-bundles.js` and generated widget assets | Product-page widget bundle includes Product Grid changes after `npm run build:widgets` | Deployable asset parity |

## Acceptance Criteria
- [x] Focused Jest contract test fails before implementation and passes after.
- [x] Raw product-page widget/module syntax checks pass.
- [x] Widget assets are rebuilt and CSS assets remain under Shopify size limits.
