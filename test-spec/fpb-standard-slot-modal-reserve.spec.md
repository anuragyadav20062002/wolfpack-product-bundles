# Test Spec: FPB Standard Slots And Modal Reserved Controls
**Spec ID:** fpb-standard-slot-modal-reserve  **Created:** 2026-07-07

## Purpose
Verify behavior changes for Standard summary slot removal and modal layout stability without asserting visual CSS.

## Test Cases
### StandardSidebarSlotTiles
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Filled Standard sidebar slot is removable | One selected product in `_renderStandardSidebarSlotTiles` | A remove button is rendered and delegates to `removeSummarySelectedProduct` | No CSS/class placement assertions |

## Acceptance Criteria
- [x] The focused Standard sidebar slot behavior test fails before implementation.
- [x] The focused Standard sidebar slot behavior test passes after implementation.
- [x] Widget source syntax checks pass.
- [x] Widget JS/CSS assets are rebuilt.
