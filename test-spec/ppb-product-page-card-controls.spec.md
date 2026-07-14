# Test Spec: PPB Product Page Card Controls
**Spec ID:** ppb-product-page-card-controls  **Created:** 2026-07-13

## Purpose
Validate widget control-parsing and rendering paths for product-card visibility toggles that affect quantity controls, description expansion, and hover behavior.

## Test Cases
### PPB Product Page Card Controls
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Parse quantity selector visibility control | `parseConfiguration()` with `displayQuantityInput`/`displayQuantitySelectorOnCard`/`displayQuantity` and dataset fallback | `config.showQuantitySelectorOnCard` is boolean with dataset fallback when control is missing | Covers `C13` shared-path evidence |
| 2 | Parse see-more and hover alias controls | `parseConfiguration()` with `displaySeeMore` and `productCardHoverExpansion` in active controls | `config.displaySeeMoreLink` and `config.expandProductCardOnHover` are true | Covers `C14`/`C15` shared-path evidence |
| 3 | Honor showQuantity selector in in-page row card render | `_renderInpageStepProducts()` with control on/off | Renders or omits `.product-quantity-wrapper` as expected | Proves `C13` control flow |
| 4 | Render see-more and hover classes from shared card options | `renderSharedProductCard()` with `displaySeeMoreLink` / `expandProductCardOnHover` set | Output includes `bw-product-card--see-more` and `bw-product-card--hover-expand` as configured | Proves `C14`/`C15` output controls |

## Acceptance Criteria
- [ ] Product-page config parser maps card visibility controls across aliases.
- [ ] In-page row rendering uses the quantity selector toggle.
- [ ] Shared product card renderer reflects see-more and hover options.
- [ ] Test evidence is linked to matrix updates for `C13`, `C14`, and `C15`.
