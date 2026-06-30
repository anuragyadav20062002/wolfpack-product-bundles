# Test Spec: Add-On Discount Function Service
**Spec ID:** addon-discount-function-service  **Created:** 2026-06-30

## Purpose
Verify the server-side activation contract for the FPB add-on Discount Function used to match EB's native `Add On` discount allocation rows.

## Test Cases
### AddOnDiscountFunctionService
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | No existing discount | Deployed add-on function exists and no automatic app discount matches it | Creates an automatic app discount titled `Add On` with PRODUCT class and EB combination flags | Uses Admin GraphQL only |
| 2 | Existing discount | Existing automatic app discount uses the same function ID | Returns success with `alreadyExists: true` and does not create another discount | Prevents duplicate active discounts |
| 3 | Function missing | `shopifyFunctions` has no add-on function | Returns failure and does not create a discount | Covers deploy-not-complete state |
| 4 | Create user error | Shopify returns `discountAutomaticAppCreate.userErrors` | Returns failure with the user error text | Keeps failure visible to install/heal paths |

## Acceptance Criteria
- [ ] Focused service tests pass.
- [ ] GraphQL operations validate against Shopify Admin schema.
- [ ] Activation does not hardcode a deployed function UUID.
- [ ] Created discount mirrors EB `discountClasses` and `combinesWith` behavior.
