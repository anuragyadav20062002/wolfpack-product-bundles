# Test Spec: EB Quantity Validation Gap Fix
**Spec ID:** eb-quantity-validation-parity  **Issue:** [eb-quantity-validation-parity-1]  **Created:** 2026-06-03

## Purpose
Verify the remaining EB parity gaps for Bundle Settings -> Enable Quantity Validation: Slot Icon must remain a bundle-level empty-slot icon picker, Step Config must remain a separate per-step image/title control, and quantity validation must persist independently from Product Slots.

## Test Cases

### Admin Contracts
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB Slot Icon picker | Bundle Settings -> Change Icon | opens the bundle-level `productSlotIconUrl` picker in place | Must not navigate to Step Setup |
| 2 | PPB Slot Icon picker | Bundle Settings -> Change Icon | same bundle-level picker behavior | Matches FPB |
| 3 | Step Config purpose | Step Setup -> Step Config | per-step `stepImage` preview/upload/reset plus Step Title | Independent from Slot Icon |

### Save Contracts
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 4 | Quantity Validation on, Product Slots off | `validateQuantityPerProduct.isEnabled=true`, `productSlotsEnabled=false` | `boxSelection.validateBoxSelectionQuantity=true`; `productSlotsEnabled=false` | Split controls |
| 5 | Quantity Validation off, Product Slots on | `validateQuantityPerProduct.isEnabled=false`, `productSlotsEnabled=true` | `boxSelection.validateBoxSelectionQuantity=false`; `productSlotsEnabled=true` | Empty slots do not imply validation |

## Acceptance Criteria
- [ ] Slot Icon source contract uses `productSlotIconUrl`, not `stepImage`.
- [ ] Step Config source contract uses `stepImage`, not `productSlotIconUrl`.
- [ ] FPB and PPB save handlers persist quantity validation from `validateQuantityPerProduct.isEnabled`.
- [ ] Focused route/handler/widget tests pass.
