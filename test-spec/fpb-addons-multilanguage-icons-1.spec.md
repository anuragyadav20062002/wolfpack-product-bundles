# Test Spec: FPB Add-ons Multi Language Button Icons
**Spec ID:** fpb-addons-multilanguage-icons-1  **Issue:** [fpb-addons-multilanguage-icons-1]  **Created:** 2026-06-05

## Purpose
Ensure Free Gift & Add Ons Multi Language buttons show a globe icon and keep the visible `Multi Language` label.

## Test Cases
### Add-ons Multi Language Buttons
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Top Add-ons step language button has icon and label | Inspect Add-ons section source | Button contains a `globe` icon and `Multi Language` label | Preserves existing modal handler |
| 2 | Add-ons with Bundles language button has icon and label | Inspect Add-ons section source | Button contains a `globe` icon and `Multi Language` label | Preserves existing modal handler |
| 3 | Footer language button keeps Polaris icon | Inspect footer source | Footer `s-button` keeps `icon="globe"` and `Multi Language` label | Already wired in previous slice |

## Acceptance Criteria
- [x] Focused test fails before implementation and passes after.
- [x] Chrome verifies the icon appears beside the label.
