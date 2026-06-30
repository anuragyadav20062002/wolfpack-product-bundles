# Test Spec: FPB Add-On Product Card Discount Badges
**Spec ID:** fpb-addon-product-card-discount-badges  **Created:** 2026-06-30

## Purpose

Verify add-on product-card discount data supports both partial and 100% percentage tiers so Standard storefront cards can render EB-style discount badges.

## Test Cases

### Add-On Discount Display Data
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Partial add-on discount | Add-on step, 10% tier, product price 82900 | price 74610, compare-at 82900, badge `10% off` | Existing paid add-on row |
| 2 | 100% add-on discount | Add-on step, 100% tier, product price 82900 | price 0, compare-at 82900, badge `100% off` | EB add-on free tier is discount-driven, not a generic free-gift badge |

## Acceptance Criteria

- [x] Add-on discount display data preserves original price for both partial and 100% tiers.
- [x] 100% tiers expose `100% off` badge text for product-card rendering.
