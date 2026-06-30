# Test Spec: Checkout UI Bundle Savings
**Spec ID:** checkout-ui-bundle-savings  **Issue:** [checkout-ui-bundle-savings-1]  **Created:** 2026-06-04

## Purpose
Superseded by `checkout-ui-eb-native-parity`: EB checkout renders bundle details through Shopify native line properties and discount allocations, not through a custom app-owned savings panel.

## Test Cases
### BundleCheckoutUiContract
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Discounted bundle parent line | `_is_bundle_parent=true`, aggregate retail/bundle/savings attributes | Extension returns `null` | Native checkout line properties own the display |
| 2 | Legacy redundant summary copy | Existing extension source | Does not render `Bundle Savings`, `Actual Price`, `Bundle Price`, `Savings`, `Bundle (n items)`, `Show n Items`, `Hide n Items`, or per-item breakdown rows | Shopify's own component list remains outside this custom extension |
| 3 | Non-bundle checkout line | `_is_bundle_parent` absent or false | Extension returns `null` | Non-bundle products must not be hidden or altered |
| 4 | No bundle discount | Aggregate savings is zero | Extension returns `null` | Same inert behavior as discounted parent lines |

## Acceptance Criteria
- [ ] Superseding EB native parity test passes.
- [ ] Checkout UI extension component validates against Shopify checkout Polaris web components.
