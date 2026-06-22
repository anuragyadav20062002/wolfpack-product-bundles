# Test Spec: FPB Standard Shared Contract
**Spec ID:** fpb-standard-shared-contract  **Issue:** waived  **Created:** 2026-06-11

## Purpose
Start FPB Standard migration by adding a config contract and shared DOM hooks without changing the existing renderer behavior.

## Test Cases
### StandardConfig
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Standard identity | Config import | Standard preset id and only alias are `STANDARD` | New app payloads use canonical Standard |
| 2 | Primitive choices | Config import | Product card grid, summary rows, discount progress | Drives later renderer replacement |

### ComponentGeneratorProductCard
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Unselected card | Product, quantity 0 | Legacy classes plus `bw-product-card` hooks | No visual behavior change |
| 2 | Selected card | Product, quantity 2 | Quantity controls in shared action region | Selected state remains stable |

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] Standard config is included before Standard template in widget bundling
- [ ] Existing storefront smoke remains green
