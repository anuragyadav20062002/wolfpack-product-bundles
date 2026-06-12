# Test Spec: FPB Product Slots Scope
**Spec ID:** fpb-product-slots-scope  **Created:** 2026-06-12

## Purpose
Ensure Product Slots configuration is FPB-only and applies only to FPB summary/sidebar empty slots.

## Test Cases
### Admin Scope
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB Bundle Settings | FPB configure route | Product Slots and Slot Icon controls are present | FPB-only merchant configuration |
| 2 | PPB Bundle Settings | PPB configure route | Product Slots and Slot Icon controls are absent | PPB must not expose these controls |

### Save Scope
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | PPB save receives productSlotsEnabled/productSlotIconUrl fields | FormData includes fields | Save payload does not persist them | Ignore stale or malicious PPB form fields |

### Storefront Scope
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB selected summary slots | `productSlotsEnabled=true` | Empty sidebar slots render, using configured slot icon if present | Applies when quantity-based rules create slots |
| 2 | PPB modal/in-page slots | `productSlotsEnabled=true`, `productSlotIconUrl` present | PPB runtime does not read these fields | PPB template slots remain template-owned |

## Acceptance Criteria
- [x] Product Slots configuration is exposed only in FPB Admin.
- [x] Slot Icon configuration is exposed only in FPB Admin.
- [x] PPB save ignores Product Slots and Slot Icon form fields.
- [x] PPB storefront runtime does not read Product Slots or Slot Icon bundle settings.
- [x] FPB Product Slots contract remains intact.
