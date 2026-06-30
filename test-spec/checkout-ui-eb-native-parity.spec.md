# Test Spec: Checkout UI EB Native Parity
**Spec ID:** checkout-ui-eb-native-parity  **Created:** 2026-06-29

## Purpose
Ensure the checkout UI extension does not add a custom bundle savings panel when Shopify native checkout line properties already provide the EB-style bundle display.

## Test Cases
### BundlePricingExtension
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Discounted bundle parent line | `_is_bundle_parent=true` with aggregate savings attributes | Component returns `null` | EB checkout uses native line properties and native discount rows, not a custom app panel |

## Acceptance Criteria
- [x] Focused checkout UI unit test passes.
- [x] Checkout UI extension validates against Shopify checkout Polaris web components.
- [x] TypeScript check for checkout UI source passes.

## 2026-06-30 Update
EB checkout proof for a discounted paid add-on shows native original/discounted
line pricing plus a bottom `TOTAL SAVINGS` row. WPB keeps cart-line targets
inert and adds a reductions-area savings row from native discount allocations
or Cart Transform bundle savings attributes.
