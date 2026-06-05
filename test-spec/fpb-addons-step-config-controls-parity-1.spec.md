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
| 5 | Step fields use most available row space | Inspect Add-ons step config CSS | Text field column is `minmax(0, 1fr)` and `min-width: 0` | Step Name and Step Title take remaining width |
| 6 | Step field order is stable | Inspect Add-ons step config row | Step Name appears before Step Title | Matches EB row sequence |

## Acceptance Criteria
- [x] Dedicated test passes for this parity slice.
- [x] Chrome verifies Step icon, Replace button, Step Name, and Step Title layout.
- [x] Slice has commit-ready issue/spec/test coverage for `[fpb-addons-step-config-controls-parity-1]`.
