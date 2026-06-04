# Test Spec: Checkout UI Bundle Savings
**Spec ID:** checkout-ui-bundle-savings  **Issue:** [checkout-ui-bundle-savings-1]  **Created:** 2026-06-04

## Purpose
Verify `bundle-checkout-ui` renders only the aggregate bundle savings panel for discounted bundle parent lines and leaves non-bundle lines untouched.

## Test Cases
### BundleCheckoutUiContract
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Discounted bundle parent line | `_is_bundle_parent=true`, aggregate retail/bundle/savings attributes | Renders `Bundle Savings`, `Actual Price:`, `Bundle Price:`, `Savings:`, and `% Saved:` | `% Saved` is computed from savings divided by retail |
| 2 | Legacy redundant summary copy | Existing extension source | Does not render `Bundle (n items)`, `Show n Items`, `Hide n Items`, or per-item breakdown rows | Shopify's own component list remains outside this custom extension |
| 3 | Non-bundle checkout line | `_is_bundle_parent` absent or false | Extension returns `null` | Non-bundle products must not be hidden or altered |
| 4 | No bundle discount | Aggregate savings is zero | Extension returns `null` | Custom panel is only shown when a bundle discount exists |
| 5 | Label and value emphasis | Existing extension source | Row labels are normal text and row values use `type="strong"` | Heading may remain strong; only row labels must not be bold |

## Acceptance Criteria
- [x] All listed test cases pass
- [x] Checkout UI extension component validates against Shopify checkout Polaris web components
- [x] Focused Jest contract test passes
