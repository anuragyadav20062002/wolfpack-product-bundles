# Test Spec: FPB Add-ons Tier Action Buttons Full Width
**Spec ID:** fpb-addons-tier-action-buttons-full-width  **Issue:** [fpb-addons-tier-action-buttons-full-width-1]  **Created:** 2026-06-05

## Purpose
Ensure the Free Gift & Add Ons tier action buttons match the requested full-width treatment without changing their existing behavior.

## Test Cases
### Tier Action Button Layout
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Add Tier Rule renders in tier card | Inspect Add-ons section source | Button is wrapped in a full-width tier-rule action container | Scoped custom fallback because `s-button` did not stretch the button face |
| 2 | Add Tier Rule spacing | Inspect scoped CSS | Wrapper adds top padding before the button | Applies only to this action |
| 3 | Add Add Ons Tier renders after tier cards | Inspect Add-ons section source | Button is wrapped in a full-width add-tier action container | Existing add-tier handler remains unchanged |
| 4 | Full-width controls | Inspect scoped CSS | Both controls use the scoped `addonsTierFullWidthButton` style | Actual button face spans the card width |

## Acceptance Criteria
- [x] Focused source-contract test fails before implementation and passes after.
- [x] Chrome verifies both buttons span the Add-ons card width.
- [x] `Add Tier Rule` has visible top spacing.
