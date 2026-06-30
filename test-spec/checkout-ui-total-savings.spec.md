# Test Spec: Checkout UI Total Savings
**Spec ID:** checkout-ui-total-savings  **Created:** 2026-06-30

## Purpose
Match EB checkout order-summary savings behavior for bundle carts without reintroducing the removed cart-line savings panel.

## Test Cases
### TotalSavingsExtension
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | No savings | Empty discounts and no bundle savings attributes | Component returns `null` | Avoids noise on undiscounted carts |
| 2 | Native add-on discount | Line discount allocation for selected add-on | `TOTAL SAVINGS` row with formatted amount | Matches EB native checkout proof |
| 3 | Cart Transform savings | Bundle parent `_bundle_total_savings_cents` with no native allocation | Same savings amount is included | Covers merged parent bundle savings |

## Acceptance Criteria
- [x] Focused checkout UI unit test passes.
- [x] Shopify checkout UI component validation passes for `purchase.checkout.reductions.render-after`.
- [x] Checkout UI TypeScript check passes.
