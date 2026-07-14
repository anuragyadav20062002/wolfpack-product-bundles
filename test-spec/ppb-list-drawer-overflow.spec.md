# Test Spec: PPB Product List Drawer Overflow
**Spec ID:** ppb-list-drawer-overflow  **Created:** 2026-07-11

## Purpose
Verify the Product List selected drawer height helper caps the visible drawer content once three selected rows are present, matching EB's scrollable drawer behavior.

## Test Cases
### CascadeSelectedDrawerHeight
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | One/two-row natural sizing | `scrollHeight=175`, border `1px` | `176` | Selected heading starts at the drawer top while bottom breathing room remains. |
| 2 | Three-row overflow cap | title `25px`, three rows `60px`, row gap `10px`, top padding `0px`, bottom padding `10px`, border `1px` | `236` | Excludes bottom padding from the visible cap so the list scrolls like EB. |

## Acceptance Criteria
- [ ] Natural drawer sizing remains unchanged for short selected lists.
- [ ] Three selected rows cap to the EB-style visible drawer height.
