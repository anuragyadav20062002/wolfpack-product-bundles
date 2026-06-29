# Test Spec: Dashboard Background Tasks
**Spec ID:** dashboard-background-tasks  **Created:** 2026-06-28

## Purpose
Keep non-critical Dashboard maintenance calls out of the immediate loader call stack so the Admin document can start responding before background app-embed refresh and web-pixel reconnect work begins.

## Test Cases
### DashboardBackgroundTasks
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Queue non-critical work | `task` callback | Callback is not called immediately | Preserves loader response path. |
| 2 | Timer turn runs | Pending timer | Callback is called once | Maintenance still executes. |

## Acceptance Criteria
- [ ] App-embed cache refresh is scheduled as background work.
- [ ] Web-pixel reconnect is scheduled as background work.
- [ ] Loader critical data return remains unchanged.
