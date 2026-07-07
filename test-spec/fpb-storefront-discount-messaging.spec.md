# Test Spec: FPB Storefront Discount Messaging
**Spec ID:** fpb-storefront-discount-messaging  **Created:** 2026-07-07

## Purpose
Verify storefront discount messaging chooses the active pricing rule copy and keeps cart-transform price adjustments enabled for fixed bundle pricing.

## Test Cases
### TemplateManager
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Progress message before next tier | Multiple `ruleMessages`, next unsatisfied rule is rule 3 | Rule 3 discount text | Prevents first-rule template leakage |
| 2 | Success message after reached tier | Multiple `ruleMessages`, applicable rule is rule 2 | Rule 2 success message | Supports adaptive copy |

### MetafieldSync
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Multiple fixed bundle price rules | Pricing has 2, 3, and 4 item tiers | `price_adjustment.rules` includes all tiers | Cart transform can choose runtime tier |

### CartTransformPricing
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Quantity reaches third fixed-price tier | `paid_quantity = 3`, tiers at 2 and 3 | Effective discount uses tier 3 target price | Prevents first-rule-only pricing |

### FPBCheckoutLineProperties
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Classic fixed bundle price add-to-cart | Classic preset with fixed bundle price | No display-only marker | Cart transform remains eligible |

## Acceptance Criteria
- [x] All listed test cases pass
