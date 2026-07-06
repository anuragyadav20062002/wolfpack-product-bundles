# Test Spec: FPB Summary Sidebar Slots
**Spec ID:** fpb-summary-sidebar-slots  **Created:** 2026-06-12

## Purpose
Verify the FPB summary sidebar empty rows and slot tiles reflect the EB storefront quantity target for the current bundle: active bundle quantity option first, then bundle-wide step quantity requirements, then a minimal fallback.

## Test Cases
### fullPageValidationAddonsMethods.getSummarySidebarMaxItemCount
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Multi-step bundle with explicit step quantity requirements | Step A >=2, Step B =3 | `5` | Counts total required quantity needed to proceed |
| 2 | Disabled or non-rule quantity hints are present | Enabled min 1, disabled max 5 | `1` | Only active box quantity and explicit step quantity rules add target slots |
| 3 | No explicit required-quantity condition present | Step min 1 only, selected count 0 | `1` | Falls back to single skeleton row |
| 4 | Selected count exceeds required quantity | Step min 2, selected count 4 | `4` | Selected count still fits when it exceeds required count |
| 5 | Active bundle quantity option with no step quantity rule | Box selection active at `3`, selected count 0 | `3` | Live EB Classic proof shows active box quantity drives summary slot count |
| 6 | Classic desktop summary uses shared target | Step A =2, Step B =3, no box selection | `5` | Classic should not use current-step-only slot count |
| 7 | Mobile slot tiles use shared target | Shared summary target returns `3` | `3` rendered slot tiles | Mobile footer should not use selected-count-plus-one fallback when EB target is higher |

## Acceptance Criteria
- [ ] Empty summary rows use required product count, not fixed placeholders.
- [ ] No required-quantity signal yields one-row skeleton fallback.
- [ ] Disabled steps do not increase skeleton row count.
- [ ] Active Bundle Quantity Options drive Standard skeleton and Classic slot counts.
- [ ] Classic desktop and mobile slot renderers use the same target count as Standard.
- [ ] Sidebar list CSS allows vertical scrolling when rows exceed available height.
