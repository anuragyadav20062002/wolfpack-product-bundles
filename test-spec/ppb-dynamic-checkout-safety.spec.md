# Test Spec: PPB Dynamic Checkout Safety
**Spec ID:** ppb-dynamic-checkout-safety  **Created:** 2026-07-15

## Purpose
Verify Product Page Bundle storefront rendering prevents native accelerated checkout from bypassing bundle validation.

## Test Cases
### ProductPageDomMethods
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Product form has Shopify payment button outside the PPB container | Product form root containing `.shopify-payment-button` | Native accelerated checkout is hidden and marked by WPB | Widget still renders its non-mutating visual Buy it now surface |

## Acceptance Criteria
- [x] All listed test cases pass
