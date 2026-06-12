# Test Spec: Shared Step Timeline State
**Spec ID:** shared-step-timeline-state  **Issue:** waived  **Created:** 2026-06-11

## Purpose
Move FPB timeline active/completed/locked class calculation into a shared selector so template renderers choose visual mode while state logic stays centralized.

## Test Cases
### TimelineStateSelector
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Active accessible step | current step entry | active class, no inactive class | Generic timeline |
| 2 | Completed included step | default completed entry | included and completed classes | Sidebar/timeline |
| 3 | Locked future step | inaccessible future entry | inactive and locked classes | Progress gating |
| 4 | Category entry current state | multiple category entry | active only when category entry is current | Existing FPB behavior |

### WidgetIntegration
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Source integration | FPB source | Imports and calls selector in timeline renderers | Covers generic and standard paths |

## Acceptance Criteria
- [x] All listed test cases pass
- [ ] Existing FPB live fixture still renders
- [x] No visual change expected
