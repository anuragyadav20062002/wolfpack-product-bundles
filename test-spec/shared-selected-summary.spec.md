# Test Spec: Shared Selected Summary
**Spec ID:** shared-selected-summary  **Issue:** waived  **Created:** 2026-06-11

## Purpose
Define the shared selected-product row and slot summary primitives before template migration.

## Test Cases
### SelectedProductRow
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Filled removable row | Product, quantity, price | Stable row DOM with remove action | Uses prepared display data |
| 2 | Default/included row | Product with `isDefault` | Included badge and no remove button | Preserves default product behavior |
| 3 | Empty row | No product | Skeleton row DOM | Used by sidebars/trays |
| 4 | Escaping | HTML in title | Escaped text | Prevents HTML injection |
| 5 | Sidebar summary controls | Product with quantity and remove action | Quantity is rendered as a plain number and the remove action renders an icon-only control | No CSS/layout assertion |

### SelectedProductSlots
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Mixed slot list | Empty, filled, default, free gift locked | Stable slot DOM for all states | Works from prepared data |
| 2 | Select/remove actions | Empty and filled slots | `data-action` attributes are present | Event handlers can delegate |
| 3 | Vertical mode | Slots with mode option | Mode class changes only | No business logic |

## Acceptance Criteria
- [x] All listed test cases pass
- [x] Shared components are included in widget bundles
- [x] Raw FPB and PPB CSS define stable row and slot classes
