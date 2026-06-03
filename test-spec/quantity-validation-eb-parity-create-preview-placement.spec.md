# Test Spec: Quantity Validation EB Parity and Create Wizard Preview Placement
**Spec ID:** quantity-validation-eb-parity-create-preview-placement  **Issue:** [quantity-validation-eb-parity-create-preview-placement-1]  **Created:** 2026-06-03

## Purpose

Verify that FPB and PPB Bundle Settings expose EB-aligned Quantity Validation controls, persist their direct contracts, enforce them in storefront widgets, and that the create bundle wizard Preview button moves next to "How to configure?".

## Test Cases

### Quantity Validation Admin
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB card layout | Bundle Settings section | Enable Quantity Validation card includes enable toggle, max quantity field, Product Slots toggle, Slot Icon controls, and pro tip | EB parity |
| 2 | PPB card layout | Bundle Settings section | same controls as FPB | EB parity |
| 3 | Toggle disabled | quantity validation off | max quantity field is disabled and persists `isEnabled: false` | EB default |
| 4 | Toggle enabled | allowed quantity set | persists `validateQuantityPerProduct` with `allowedQuantity` | direct bundle field |
| 5 | Product Slots | toggle changed | persists `productSlotsEnabled` | direct bundle field |
| 6 | Slot Icon | change/reset | uses per-bundle `productSlotIconUrl` only | no DCP control |

### Storefront Runtime
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 7 | PPB quantity validation | max quantity exceeded for product | storefront prevents selecting above allowed quantity | EB behavior |
| 8 | FPB quantity validation | max quantity exceeded for product | storefront prevents selecting above allowed quantity | EB behavior |
| 9 | Product slots disabled | `productSlotsEnabled: false` | empty slot cards are not rendered | EB behavior |
| 10 | Product slots enabled | `productSlotsEnabled: true` | empty slots render with configured Slot Icon or plus fallback | EB behavior |

### Create Wizard
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 11 | Preview placement | create bundle wizard header | Preview button renders next to "How to configure?" at top | screenshot request |
| 12 | Old placement removed | wizard footer/navigation | Preview button no longer appears beside Back/Next | screenshot request |

## Acceptance Criteria

- [x] FPB and PPB Quantity Validation card matches EB control set and structure
- [x] Quantity Validation persists direct bundle-level config
- [x] Product Slots and Slot Icon remain bundle-level only
- [x] Storefront widgets enforce max per-product quantity when enabled
- [x] Storefront empty slot rendering follows `productSlotsEnabled`
- [x] Create wizard Preview button is top-aligned beside "How to configure?"
