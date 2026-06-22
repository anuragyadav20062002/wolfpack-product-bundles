# Test Spec: FPB Standard Preset Contract
**Spec ID:** fpb-standard-preset-contract  **Created:** 2026-06-21

## Purpose
Make `STANDARD` the canonical FPB Standard preset value. `DEFAULT` and `DEFAULT_FBP` must not be treated as Standard aliases for new app payloads.

## Test Cases
### FPBStandardPresetContract
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Missing FPB preset | Full-page bundle without `bundleDesignPresetId` | `STANDARD` | Fallback value is Standard |
| 2 | Standard selection mapping | `templateKey: "standard"` | `bundleDesignPresetId: "STANDARD"` | New creation/configuration contract |
| 3 | Widget preset attribute | Missing or `STANDARD` preset | `data-fpb-design-preset="STANDARD"` | No `DEFAULT` output |
| 4 | Registry Standard lookup | `presetId: "STANDARD"` | Standard config | No `DEFAULT`/`DEFAULT_FBP` aliases |
| 5 | Runtime Standard marker | Missing or `STANDARD` preset | `STANDARD`, `fpb-preset-standard`, `fpb-d` | Storefront runtime fallback stays Standard |
| 6 | New FPB bundle creation | `bundleType: "full_page"` | DB create writes `bundleDesignTemplate: "FBP_SIDE_FOOTER"` and `bundleDesignPresetId: "STANDARD"` | Creation source of truth |

## Acceptance Criteria
- [ ] Focused FPB preset contract tests fail before implementation.
- [ ] Focused FPB preset contract tests pass after implementation.
- [ ] Widget assets are rebuilt after raw widget/CSS changes.
