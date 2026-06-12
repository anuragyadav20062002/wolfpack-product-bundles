# Test Spec: FPB Fixed Price Sidebar CTA
**Spec ID:** fpb-fixed-price-sidebar-cta  **Created:** 2026-06-12

## Purpose
Verify FPB Standard summary sidebar CTA text does not render stale percentage subtext for fixed bundle price rules.

## Test Cases
### fullPageBoxSelectionSidebarMethods.getSidebarTierCtaContent
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Fixed bundle price rule with stale saved subtext | `fixed_bundle_price`, `discountValue: 500000`, saved subtext `500000% off` | `{ label: "Box of 5", subtext: "Bundle for PKR5000.00" }` | Uses actual rule price |
| 2 | Percentage rule with saved subtext | `percentage_off`, saved subtext `10% off` | Saved subtext remains | Merchant copy still wins for percentage discounts |

## Acceptance Criteria
- [ ] Fixed bundle price sidebar CTA derives subtext from the pricing rule value.
- [ ] Stale percentage-looking saved subtext is not shown for fixed bundle price.
- [ ] Non-fixed-price CTA behavior is preserved.
