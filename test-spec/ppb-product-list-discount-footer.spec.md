# Test Spec: PPB Product List Discount Footer
**Spec ID:** ppb-product-list-discount-footer  **Created:** 2026-07-11

## Purpose

Verify Product Page Bundle Product List cascade footer discount messaging follows EB's rule-targeting semantics for tiered progress and success text.

## Test Cases

### CascadeTemplateDiscountFooter
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | First tier met, second tier unmet | Quantity tiers at 2 and 4, selected quantity 2 | Footer renders rule 2 progress message with remaining quantity and rule 2 discount value | EB progress messaging targets the next unmet rule. |
| 2 | All tiers met | Same tiers, selected quantity 4 | Footer renders the applied rule success message with the best tier discount value | EB success messaging uses the qualifying/applied tier. |

## Acceptance Criteria
- [x] Focused Product List discount footer tests pass.
- [x] No CSS, class-name, source-order, or visual-placement assertions are added.
