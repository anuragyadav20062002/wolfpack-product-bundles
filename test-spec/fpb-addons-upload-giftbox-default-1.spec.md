# Test Spec: FPB Add-ons Upload Gift Box Default
**Spec ID:** fpb-addons-upload-giftbox-default-1  **Issue:** [fpb-addons-upload-giftbox-default-1]  **Created:** 2026-06-05

## Purpose
Ensure the Free Gift & Add Ons section uses EB-style Add-ons card padding, the default gift-box icon upload box, grouped toggles, and matching Add-ons action button treatment.

## Test Cases
### Add-ons Step Icon Upload Default
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Empty Add-ons step icon shows gift-box SVG | `addonDraft.stepImage` is empty | Icon box renders a decorative `addonsGiftBoxDefault` SVG | Replaces text-only placeholder |
| 2 | Uploaded Add-ons step icon remains unchanged | `addonDraft.stepImage` has URL | Existing image renders with `alt="Add-ons step icon"` | No behavior change |
| 3 | Replace action remains separate | Inspect Add-ons upload controls | Replace button still opens the picker | Existing FilePicker wiring remains |
| 4 | Add-ons card padding matches EB density | Inspect Add-ons card CSS | Step, Add-ons, Footer, and tier body use compact scoped padding | Do not change unrelated cards |
| 5 | Add-ons toggles stay grouped with titles | Inspect Add-ons card headers | Each toggle appears next to its card title | Avoid far-right toggle placement |
| 6 | Header Multi Language buttons match footer treatment | Inspect top and section Multi Language actions | Buttons use Polaris secondary globe button path | Same control system as Footer Messaging |
| 7 | Tier action buttons match footer treatment | Inspect Add Tier Rule and Add Add Ons Tier | Buttons use Polaris secondary button path | No custom CSS button path |
| 8 | Step text fields use remaining row width | Inspect Add-ons step media row | Upload column is fixed and Step Name / Step Title column is `minmax(0, 1fr)` | Fields take most available space |

## Acceptance Criteria
- [x] Focused test fails before implementation and passes after.
- [x] Chrome verifies the default gift-box SVG appears in the Add-ons upload box.
- [x] Chrome verifies Add-ons card padding, grouped toggles, action buttons, and upload/text-field sizing.
