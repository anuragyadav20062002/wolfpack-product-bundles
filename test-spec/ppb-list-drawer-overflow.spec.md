# Test Spec: PPB Product List Drawer Overflow
**Spec ID:** ppb-list-drawer-overflow  **Created:** 2026-07-11

## Purpose
Verify the Product List selected drawer height helper caps the visible drawer content once three selected rows are present, matching EB's scrollable drawer behavior.

## Test Cases
### CascadeSelectedDrawerHeight
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | One/two-row natural sizing | `scrollHeight=185`, border `1px` | `186` | Existing behavior stays unchanged. |
| 2 | Three-row overflow cap | title `25px`, three rows `60px`, row gap `10px`, top padding `10px`, bottom padding `10px`, border `1px` | `246` | Excludes bottom padding to make list scrollable. |

## Acceptance Criteria
- [ ] Natural drawer sizing remains unchanged for short selected lists.
- [ ] Three selected rows cap to the EB-style visible drawer height.
