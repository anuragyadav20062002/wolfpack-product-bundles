# Test Spec: FPB Title Flash
**Spec ID:** fpb-title-flash  **Created:** 2026-07-06

## Purpose
Prevent full-page widgets from emitting their own `.bundle-title` header during setup before `renderHeader()` runs.

## Test Cases
### FullPageWidgetHeader
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Full-page widget creates DOM elements before renderUI | Selected bundle with `bundleType: full_page` | Header is hidden and contains no `.bundle-title` markup | Prevents widget-owned title flash between append and hide |
| 2 | Non-full-page context creates a header | Selected bundle with non-FPB bundle type | Existing `.bundle-title` markup remains | Guards against widening the change |

## Acceptance Criteria
- [x] Full-page widget header creation does not emit a visible bundle title before `renderHeader()`.
- [x] Non-full-page title header behavior is preserved.
- [x] Focused tests pass.
