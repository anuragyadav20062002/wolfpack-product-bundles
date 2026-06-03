# Test Spec: PPB Horizontal Slots Storefront
**Spec ID:** ppb-horizontal-slots-storefront  **Issue:** [ppb-horizontal-slots-storefront-parity-1]  **Created:** 2026-06-04

## Purpose
Verify the PPB Horizontal Slots storefront template uses a dedicated modal-slot module and renders EB-style `PDP_MODAL` + `MODAL` narrow slot trigger styling.

## Test Cases
### ProductPageHorizontalSlotsTemplate
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Modal-slot module build path | `scripts/build-widget-bundles.js` and `app/assets/widgets/product-page/templates/modal-slot-template.js` | Product-page modules include modal-slot before cascade and before main widget source | Keeps template code modular |
| 2 | Main widget installs modal-slot module | `app/assets/bundle-widget-product-page.js` | Imports and installs `installModalSlotTemplate(BundleWidgetProductPage)` before initialization | Preserves runtime methods |
| 3 | Horizontal Slots CSS parity | `app/assets/widgets/product-page-css/bundle-widget.css` | Contains `PDP_MODAL` + `MODAL` + horizontal-scoped 104x200 slot card, 80x80 placeholder visual, CTA, and dynamic checkout styles | Keeps SIMPLIFIED unaffected |

## Acceptance Criteria
- [ ] Focused Jest contract test fails before implementation and passes after.
- [ ] Raw product-page widget and modal-slot module pass syntax checks.
- [ ] Widget assets are rebuilt and CSS assets remain under Shopify size limits.
