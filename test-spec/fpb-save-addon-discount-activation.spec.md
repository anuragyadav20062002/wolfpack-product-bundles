# Test Spec: FPB Save Add-On Discount Activation
**Spec ID:** fpb-save-addon-discount-activation  **Created:** 2026-07-01

## Purpose
Ensure FPB bundle saves activate the add-on Discount Function when Free Gift & Add Ons paid add-ons are enabled, so selected add-on cart lines can receive native Shopify `Add On` discount allocations.

## Test Cases
### FPBHandleSaveBundle
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Add-ons enabled | `personalizationData.addonProducts.isEnabled=true` | Calls `AddOnDiscountFunctionService.completeSetup(admin, shop)` | Save remains the merchant lifecycle hook after initial auth |
| 2 | Add-ons disabled | `personalizationData.addonProducts.isEnabled=false` | Does not call discount activation | Avoids unnecessary Admin GraphQL calls |

## Acceptance Criteria
- [x] Focused FPB save route tests pass.
- [x] Existing add-on discount service tests still pass.
