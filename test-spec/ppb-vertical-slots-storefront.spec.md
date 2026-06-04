# Test Spec: PPB Vertical Slots Storefront
**Spec ID:** ppb-vertical-slots-storefront  **Issue:** [ppb-vertical-slots-storefront-parity-1]  **Created:** 2026-06-04

## Purpose
Verify the PPB Vertical Slots storefront template renders EB-style `PDP_MODAL` + `SIMPLIFIED` vertical slot layout and remains isolated from Horizontal Slots.

## Test Cases
### ProductPageVerticalSlotsTemplate
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Vertical Slots template contract | `app/assets/widgets/product-page-css/bundle-widget.css` and `modal-slot-template.js` | SIMPLIFIED vertical slots use EB-matched row card, copy, image block, CTA, and dynamic checkout styling | Test values updated from live EB inspection |
| 2 | Horizontal Slots isolation | `app/assets/widgets/product-page-css/bundle-widget.css` | MODAL horizontal selectors remain separate from SIMPLIFIED vertical selectors | Prevents vertical fixes from regressing Horizontal Slots |
| 3 | Build output contract | `scripts/build-widget-bundles.js` and generated widget assets | Product-page widget bundle includes Vertical Slots changes after build | Deployable asset parity |

## Acceptance Criteria
- [x] Focused Jest contract test fails before implementation and passes after.
- [x] Raw product-page widget/module syntax checks pass.
- [x] Widget assets are rebuilt and CSS assets remain under Shopify size limits.
