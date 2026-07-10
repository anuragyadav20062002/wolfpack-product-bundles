# Test Spec: FPB Category Section Rows
**Spec ID:** fpb-category-section-rows  **Created:** 2026-07-10

## Purpose

Prevent the Standard full-page template from rendering both category tabs and collapsed category rows, while preserving the Classic template's category row behavior.

## Test Cases
### FullPageProductGridMethods
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Standard category rows | `STANDARD` preset, one step with two category entries | `createCategorySectionRows()` returns `null` | Standard should show category tabs only. |
| 2 | Classic category rows | `CLASSIC` preset, one step with two category entries | `createCategorySectionRows()` returns a row for the inactive category | Classic keeps category pills/rows. |

## Acceptance Criteria
- [ ] Standard FPB does not render collapsed category rows.
- [ ] Classic FPB still renders collapsed category rows.
- [ ] No CSS, class-name, or visual-placement assertions are added.
