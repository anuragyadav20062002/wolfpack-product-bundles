# Test Spec: OOS Product Card Price
**Spec ID:** oos-product-card-price  **Created:** 2026-07-07

## Purpose
Keep out-of-stock storefront products visible with their original product information while blocking selection through the existing stock guard.

## Test Cases
### StorefrontProductNormalization
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | PPB parent card has no selectable variants | One unavailable variant priced 19.99 | One unavailable product card DTO with price 1999 | Prevents $0.00 display |
| 2 | FPB parent card has no selectable variants | One unavailable variant priced 30.00 | One unavailable product card DTO with price 3000 | Applies to Standard and Classic shared templates |
| 3 | FPB individual variant display has unavailable variants | One zero-stock variant and one backorderable variant | Both variant card DTOs render with original price and stock state | OOS is disabled, not hidden |

## Acceptance Criteria
- [ ] Out-of-stock products are not rewritten to zero-price DTOs.
- [ ] Out-of-stock variants remain renderable as disabled cards.
- [ ] Selection attempts continue to hit the existing stock toast guard.
