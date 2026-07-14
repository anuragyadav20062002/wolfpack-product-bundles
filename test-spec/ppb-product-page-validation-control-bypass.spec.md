# Test Spec: PPB Product Page Validation Control Bypass
**Spec ID:** ppb-product-page-validation-control-bypass  **Created:** 2026-07-13

## Purpose
Demonstrate that the Product Page "Validate conditions before add to cart" control bypasses step and cart gating paths when disabled.

## Test Cases
### ProductPageValidationControl
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Validation enabled + incomplete steps | Control enabled; required step not complete | CTA remains disabled and cart/network path is blocked | Baseline gating remains active |
| 2 | Validation disabled + incomplete steps | Control disabled; required step not complete | CTA enables and cart/network path is allowed | Permits progression/cart when toggle is off |
| 3 | Step progression with modal flow + validation disabled | Control disabled; modal step has unmet condition | Next/done actions still advance | Modal tab navigation bypasses step gating |
| 4 | Auto add after last-step control enabled + validation disabled | Auto-add setting enabled; final validation would fail under strict rules | Auto-add still runs once all paid steps are selected and cart is allowed by control state | Confirms `S05` applies to auto-add path |

## Acceptance Criteria
- [ ] All listed scenarios are covered by unit tests for the affected runtime methods.
- [ ] Validation-bypass behavior is covered for button, modal navigation, and auto-add paths.
