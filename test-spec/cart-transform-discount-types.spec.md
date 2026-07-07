# Test Spec: Cart Transform Discount Types
**Spec ID:** cart-transform-discount-types  **Created:** 2026-07-07

## Purpose
Verify every supported bundle discount method produces a valid Cart Transform operation and expected percentage decrease.

## Test Cases
### BundleCartTransformDiscountTypes
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | MERGE fixed amount off | Two component lines totaling $50 with $10 off | One linesMerge operation with 20% decrease | Covers fixed_amount_off in component_parents |
| 2 | MERGE fixed bundle price | Two component lines totaling $80 with $30 fixed bundle price | One linesMerge operation with 62.5% decrease | Covers fixed_bundle_price in component_parents |
| 3 | EXPAND fixed amount off | Parent line priced at $50 with $10 off | One lineExpand operation with 20% decrease | Covers fixed_amount_off in price_adjustment metafield |
| 4 | EXPAND fixed bundle price | Parent line priced at $80 with $30 fixed bundle price | One lineExpand operation with 62.5% decrease | Covers fixed_bundle_price in price_adjustment metafield |
| 5 | EXPAND buy X get Y | Parent line priced at $30, buy 2 get 1 free | One lineExpand operation with 33.3333% decrease | Confirms BXY does not fail on EXPAND |

## Acceptance Criteria
- [x] All listed test cases pass
