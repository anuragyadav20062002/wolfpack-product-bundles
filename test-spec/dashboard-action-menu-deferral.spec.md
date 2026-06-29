# Test Spec: Dashboard Action Menu Deferral
**Spec ID:** dashboard-action-menu-deferral  **Created:** 2026-06-28

## Purpose
Keep hidden per-row clone/delete popover content out of the Dashboard first render while preserving visible row action buttons.

## Test Cases
### DashboardActionMenuState
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | No row menu is open | `activeMenuBundleId: null`, `bundleId: "bundle-1"` | `false` | Hidden popover content is not mounted initially. |
| 2 | Matching row menu is open | `activeMenuBundleId: "bundle-1"`, `bundleId: "bundle-1"` | `true` | Opened row menu content renders. |
| 3 | Different row menu is open | `activeMenuBundleId: "bundle-1"`, `bundleId: "bundle-2"` | `false` | Other rows stay deferred. |

## Acceptance Criteria
- [ ] Edit, preview, and more buttons remain visible on first render.
- [ ] Clone/delete popover content mounts only for the opened row.
- [ ] Existing clone/delete callbacks remain unchanged.
