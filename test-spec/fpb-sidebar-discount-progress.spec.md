# Test Spec: FPB Sidebar Discount Progress
**Spec ID:** fpb-sidebar-discount-progress  **Created:** 2026-06-13

## Purpose
Verify FPB summary sidebars render discount messaging plus both simple and step-based progress UI across all four full-page presets.

## Test Cases
### SidebarProgress
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Step-based progress across presets | STANDARD, CLASSIC, COMPACT, HORIZONTAL with progress type `step_based` | Sidebar renders discount message and `.fpb-dp-step_based.fpb-dp-sidebar` through the shared helper | No CSS/layout assertions |
| 2 | Simple progress across presets | STANDARD, CLASSIC, COMPACT, HORIZONTAL with progress type `simple` | Sidebar renders discount message and `.fpb-dp-simple.fpb-dp-sidebar` through the shared helper | No CSS/layout assertions |

## Acceptance Criteria
- [x] Discount message renders once above the sidebar progress area.
- [x] Simple progress renders in every FPB preset sidebar.
- [x] Step-based progress renders in every FPB preset sidebar.
