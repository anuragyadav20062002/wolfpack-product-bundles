# Test Spec: PPB Product Page Footer Discount Progress
**Spec ID:** ppb-product-page-footer-discount-progress
**Created:** 2026-07-13

## Purpose
Verify PPB footer progress messaging handles amount-based discount conditions using cent-scaled math and renders correctly formatted currency in condition text.

## Test Cases
### Product Page Footer Discount Messaging
| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Quantity rule progress remains existing behavior | `conditionType: 'quantity'`, selected subtotal/qty below threshold | Existing quantity messaging path unchanged | Regression guard
| 2 | Amount rule formats remaining amount correctly | `conditionType: 'amount'`, `conditionValue: 2000`, selected total `1000` cents | Message contains `Add $ 10.00 more` | Prevents cent vs currency mismatch
| 3 | Amount rule does not multiply by extra 100x | `conditionType: 'amount'`, `conditionValue: 1500`, selected total `1000` cents | Message contains `Add $ 5.00 more` and does not contain `Add $ 1500.00 more` | Targets the prior unit bug
| 4 | Custom discount variables are replaced in progress text | Progress template uses `discountConditionDiff`, `discountValue`, `discountValueUnit` | Variable tokens resolve correctly for percentage rules | Covers D09 custom copy behavior
| 5 | Amount-condition variable replacement uses unit-aware value tokens | Amount rule with fixed-amount discount and template using condition/value placeholders | `conditionText` shows currency and `discountValue` is formatted with `$` unit | Covers D09 remaining-amount and unit formatting variables

## Acceptance Criteria
- [ ] Unit coverage includes amount-based progress text for PPB footer
- [ ] Unit coverage includes custom discount variables for PPB footer templates
- [ ] Amount and quantity progress both remain behaviorally stable
