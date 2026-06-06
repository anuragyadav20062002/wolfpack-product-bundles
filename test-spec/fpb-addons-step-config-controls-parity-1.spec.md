# Test Spec: FPB Add-ons Step Config Controls Parity
**Spec ID:** fpb-addons-step-config-controls-parity-1  **Issue:** [fpb-addons-step-config-controls-parity-1]  **Created:** 2026-06-05

## Purpose
Ensure the Free Gift & Add Ons step config row treats the Step icon, Replace button, Step Name, and Step Title as a dedicated EB parity surface.

## Test Cases
### Add-ons Step Config Controls
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Empty Add-ons step icon shows gift-box SVG | `addonDraft.stepImage` is empty | Icon box renders decorative `addonsGiftBoxDefault` SVG | Default Add-ons and Gifting step icon |
| 2 | Uploaded Add-ons step icon remains unchanged | `addonDraft.stepImage` has URL | Existing image renders with `alt="Add-ons step icon"` | No behavior change |
| 3 | Replace action remains separate | Inspect Add-ons upload controls | Replace button still opens/closes the picker | Existing FilePicker wiring remains |
| 4 | Step icon and Replace button share width | Inspect Add-ons step config CSS | Icon column, icon box, and Replace button use `--addons-icon-control-width` | Keeps upload/replace aligned |
| 5 | Icon upload group is stacked | Inspect Add-ons step config row | Gift icon appears above Replace inside `addonsIconReplaceGroup` | User correction |
| 6 | Step text group is stacked | Inspect Add-ons step config row | Step Name appears above Step Title inside `addonsStepTextGroup` | User correction |
| 7 | Both groups are inline | Inspect Add-ons step config CSS | Grid columns are icon/Replace group plus Step Name/Step Title group | Matches corrected inline grouping |
| 8 | Gift icon box height is increased | Inspect Add-ons step config CSS | Add-ons icon box has a dedicated taller height | User correction |
| 9 | First card placement matches reference | Inspect Add-ons step config CSS | Icon/Replace column is 98px, icon box is 88px tall, row gap is 10px, text stack gap is 8px | Reference screenshot correction |

## Acceptance Criteria
- [x] Dedicated test passes for this parity slice.
- [x] Chrome verifies Step icon, Replace button, Step Name, and Step Title are inline.
- [x] Slice has commit-ready issue/spec/test coverage for `[fpb-addons-step-config-controls-parity-1]`.
