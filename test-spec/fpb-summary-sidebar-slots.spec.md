# Test Spec: FPB Summary Sidebar Slots
**Spec ID:** fpb-summary-sidebar-slots  **Created:** 2026-06-12

## Purpose
Verify the FPB summary sidebar empty rows reflect the bundle’s required quantity for checkout, and render a single skeleton when no required-quantity signal exists.

## Test Cases
### fullPageValidationAddonsMethods.getSummarySidebarMaxItemCount
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Multi-step bundle with explicit step quantity requirements | Step A >=2, Step B =3 | `5` | Counts total required quantity needed to proceed |
| 2 | Disabled steps are present | Enabled max 2, disabled max 5 | `2` | Disabled steps do not add slots |
| 3 | No explicit required-quantity condition present | Step min 1 only, selected count 0 | `1` | Falls back to single skeleton row |
| 4 | Selected count exceeds required quantity | Step min 2, selected count 4 | `4` | Selected count still fits when it exceeds required count |

## Acceptance Criteria
- [ ] Empty summary rows use required product count, not fixed placeholders.
- [ ] No required-quantity signal yields one-row skeleton fallback.
- [ ] Disabled steps do not increase skeleton row count.
- [ ] Sidebar list CSS allows vertical scrolling when rows exceed available height.
