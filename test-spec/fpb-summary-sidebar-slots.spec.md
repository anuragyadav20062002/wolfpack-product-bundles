# Test Spec: FPB Summary Sidebar Slots
**Spec ID:** fpb-summary-sidebar-slots  **Created:** 2026-06-12

## Purpose
Verify the FPB summary sidebar empty rows reflect the maximum number of items that can be added to the full bundle instead of a hard-coded skeleton count.

## Test Cases
### fullPageValidationAddonsMethods.getSummarySidebarMaxItemCount
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Multi-step bundle with max quantities | Enabled steps max 1 and 3 | `4` | Counts total bundle capacity |
| 2 | Disabled steps are present | Enabled max 2, disabled max 5 | `2` | Disabled steps do not add slots |
| 3 | Missing max quantity | Step min 2, selected count 4 | `4` | Selected count still fits when it exceeds configured fallback |

## Acceptance Criteria
- [ ] Empty summary rows use bundle capacity, not a fixed count.
- [ ] Disabled steps do not increase skeleton row count.
- [ ] Sidebar list CSS allows vertical scrolling when rows exceed available height.
