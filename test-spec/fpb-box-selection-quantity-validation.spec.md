# Test Spec: FPB Box Selection Quantity Validation
**Spec ID:** fpb-box-selection-quantity-validation  **Issue:** [eb-configure-completion-parity-1]  **Created:** 2026-06-01

## Purpose
Verify EB-style Bundle Settings quantity validation reaches the storefront runtime and gates Add to Cart by exact active box quantity.

## Test Cases
### SaveRuntimeContract
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB validation enabled | Pricing display quantity options plus `productSlotsEnabled=true` | Saved `boxSelection.validateBoxSelectionQuantity=true` | Rules remain pricing-derived |
| 2 | PPB validation enabled | Pricing display quantity options plus `productSlotsEnabled=true` | Saved `boxSelection.validateBoxSelectionQuantity=true` | Keeps PPB configure aligned |

### StorefrontRuntimeContract
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Validation enabled | Active box rule quantity and selected item quantity | Runtime compares exact equality | Mirrors EB decompiled gate |
| 2 | Add to Cart actions | Final/conditionless CTA paths | CTA blocks when exact quantity is unmet | FPB storefront only |

## Acceptance Criteria
- [ ] Save tests prove validation flag is persisted into `boxSelection`.
- [ ] Widget source contract proves exact active-rule quantity validation is present.
- [ ] Focused tests, widget build, scoped lint, and graph rebuild pass.
