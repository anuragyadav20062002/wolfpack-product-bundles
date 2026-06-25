# Test Spec: FPB Standard Sidebar Add-Ons Parity
**Spec ID:** fpb-standard-sidebar-addons-parity  **Created:** 2026-06-26

## Purpose
Ensure the Standard Template FPB summary sidebar renders Free Gift & Add Ons messaging in the sidebar surface instead of suppressing it.

## Test Cases
### StandardSidebarAddons
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Standard sidebar with add-ons configured | Desktop Standard sidebar render | Add-on summary block is appended inside `.side-panel-summary-content` | Matches EB sidebar messaging surface |
| 2 | Other presets | Classic/Compact/Horizontal sidebar render | Existing free-gift section placement remains unchanged | Prevents unrelated preset regression |

## Acceptance Criteria
- [x] Standard sidebar add-on block behavior test passes.
- [x] Existing FPB Free Gift/Add Ons and Standard sidebar tests pass.
- [x] Widget source syntax check passes.
- [x] Widget assets are rebuilt after source/CSS changes.
