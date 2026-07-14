# Test Spec: PPB Empty Step Cart Validation
**Spec ID:** ppb-empty-step-cart-validation  **Created:** 2026-07-15

## Purpose
Verify Product Page Bundle cart validation ignores enabled steps that contain no configured products or categories with products.

## Test Cases
### ProductPageCartValidation
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Empty enabled step follows a complete paid step | Step 1 has selected product; Step 2 has no products/categories | Add-to-cart proceeds | Matches current EB Product Grid fixture behaviour |
| 2 | Non-empty enabled step follows a complete paid step but is incomplete | Step 1 selected; Step 2 has configured products and no selection | Add-to-cart is blocked | Preserves required-step validation |

## Acceptance Criteria
- [x] All listed test cases pass
