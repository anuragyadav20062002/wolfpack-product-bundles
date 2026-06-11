# Test Spec: PPB Vertical Slots Shared Shell
**Spec ID:** ppb-vertical-slots-shared-shell  **Issue:** waived  **Created:** 2026-06-11

## Purpose
Prove the PPB vertical slot shell uses the shared selected-slots wrapper in vertical mode while preserving the existing simplified slot classes.

## Test Cases
### VerticalShell
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Source contract | Modal slot source | Shared selected-slots import and vertical mode | Covers first-class vertical shell |
| 2 | Runtime section | Dummy widget with vertical resolver | Section contains shared slot wrapper and simplified class | DOM contract |

## Acceptance Criteria
- [x] All listed test cases pass
- [ ] Existing PPB live vertical fixture still renders
- [x] No regression in horizontal slot shell test
