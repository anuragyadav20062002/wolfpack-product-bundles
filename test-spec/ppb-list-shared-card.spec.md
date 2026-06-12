# Test Spec: PPB List Shared Card
**Spec ID:** ppb-list-shared-card  **Issue:** waived-widget-refactor  **Created:** 2026-06-11

## Purpose

Verify the PPB List migration slice routes `PDP_INPAGE + CASCADE` product rows through the shared row-mode product-card primitive while preserving legacy List classes and disabled/stock states.

## Test Cases

### PPBListSharedCard

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | List in-page product rows | `renderInpageStepProducts()` source | Shared product-card renderer with row mode | Keeps `CASCADE` data/classes during migration. |

## Acceptance Criteria

- [x] PPB List product rows route through `renderSharedProductCard()`.
- [x] Shared card uses row mode and legacy List classes.
- [x] Disabled add/increase and stock badge state are preserved.
