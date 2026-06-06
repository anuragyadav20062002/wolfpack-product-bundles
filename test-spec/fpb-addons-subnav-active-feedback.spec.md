# Test Spec: FPB Add-ons Subnav Active Feedback
**Spec ID:** fpb-addons-subnav-active-feedback  **Issue:** [fpb-addons-subnav-active-feedback-1]  **Created:** 2026-06-05

## Purpose
Ensure the Free Gift & Add Ons child nav item gives visible active feedback when clicked.

## Test Cases
### Section Nav Feedback
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Free Gift & Add Ons is active | `activeSection === "free_gift_addons"` | Child button receives `subNavItemActive` | Existing route behavior |
| 2 | Child button active state renders visibly | Inspect CSS | `.subNavItemActive` has gray background and radius | Matches Step Setup feedback |
| 3 | Hover and active state remain usable | Inspect CSS | Active child keeps readable text and full-row hit area | Avoid text-only feedback |

## Acceptance Criteria
- [ ] Focused source guard passes.
- [ ] Chrome verifies Free Gift & Add Ons has active gray background when selected.
