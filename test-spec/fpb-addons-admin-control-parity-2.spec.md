# Test Spec: FPB Add-ons Admin Control Parity Slice 2
**Spec ID:** fpb-addons-admin-control-parity-2  **Issue:** [fpb-addons-admin-control-parity-2]  **Created:** 2026-06-05

## Purpose
Cover the second Admin UI parity slice for the Full Page Bundle `Free Gift & Add Ons` section.

## Test Cases
### Add-ons Admin Control Surface
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Step language control is active | Click top `Multi Language` | Opens scoped language modal with `Step Name` and `Step Title` | Uses existing language modal infrastructure |
| 2 | Add-ons section language control is active | Click section `Multi Language` | Opens scoped language modal with `Add on Section title` and tier title fields | Fields mirror current tier count |
| 3 | Footer language control is active | Click footer `Multi Language` | Opens scoped language modal with tier message fields | Includes message-not-met and success message |
| 4 | Footer variables are Add-ons-specific | Click `Show Variables` | Modal heading `Variables` and four Add-ons variables only | No generic discount variables |
| 5 | Selected add-on products count opens modal | Click `1 Selected` | Modal heading `Selected Products` with row actions and `Add Products` | Existing product picker remains available |
| 6 | Tier rules empty state matches reference | No tier rules | No `No rules defined yet` row | `Add Tier Rule` remains visible |
| 7 | Tiers use single-expanded behavior | Add tier | New tier expands and previous tier collapses | Header click toggles active tier |
| 8 | Tier card visual contract matches EB | Inspect tier cards | Collapsible card header has dedicated active/inactive styling hooks and delete action remains header-scoped | Enables exact card parity without affecting shared rule headers |
| 9 | New tier rule defaults match EB | Click `Add Tier Rule` | Rule defaults to quantity, `is less than or equal to`, value `1` | Matches live EB add-rule evidence |

## Acceptance Criteria
- [x] Focused tests fail before implementation and pass after.
- [x] Chrome verifies Admin UI controls in WPB.
- [x] SaveBar appears for edited add-on controls and discard resets the visible state.
