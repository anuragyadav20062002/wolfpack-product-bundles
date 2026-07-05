# Test Spec: FPB BXY Cart Transform Rounding
**Spec ID:** fpb-bxy-cart-transform-rounding  **Created:** 2026-07-04

## Purpose
Verify buy-X-get-Y bundle cart metadata uses the exact discounted total and savings cents for mixed-price component bundles.

## Test Cases
### CartTransformMerge
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Mixed-price buy 2 get 1 free bundle | Three component lines priced 82900, 61900, and 32900 cents with buy 2 get 1 at 100% off lowest-priced item | `_bundle_total_retail_cents=177700`, `_bundle_total_price_cents=144800`, `_bundle_total_savings_cents=32900` | Prevents per-component percentage rounding from leaking into parent metadata |

## Acceptance Criteria
- [x] All listed test cases pass
