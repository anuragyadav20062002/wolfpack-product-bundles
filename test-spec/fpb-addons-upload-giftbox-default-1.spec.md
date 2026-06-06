# Test Spec: FPB Add-ons Upload Gift Box Default
**Spec ID:** fpb-addons-upload-giftbox-default-1  **Issue:** [fpb-addons-upload-giftbox-default-1]  **Created:** 2026-06-05

## Purpose
Ensure the Free Gift & Add Ons section uses EB-style Add-ons card padding, grouped toggles, and matching Add-ons action button treatment.

## Test Cases
### Add-ons Step Icon Upload Default
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Add-ons card padding matches EB density | Inspect Add-ons card CSS | Step, Add-ons, Footer, and tier body use compact scoped padding | Do not change unrelated cards |
| 2 | Add-ons toggles stay grouped with titles | Inspect Add-ons card headers | Each toggle appears next to its card title | Avoid far-right toggle placement |
| 3 | Header Multi Language buttons match footer treatment | Inspect top and section Multi Language actions | Buttons use Polaris secondary globe button path | Same control system as Footer Messaging |
| 4 | Tier action buttons match current full-width treatment | Inspect Add Tier Rule and Add Add Ons Tier | Buttons use scoped full-width fallback path | Superseded by `fpb-addons-tier-action-buttons-full-width-1` because `s-button` did not stretch the button face |

## Acceptance Criteria
- [x] Focused test fails before implementation and passes after.
- [x] Chrome verifies Add-ons card padding, grouped toggles, and action buttons.
- [x] Step config controls are tracked separately in `fpb-addons-step-config-controls-parity-1`.
