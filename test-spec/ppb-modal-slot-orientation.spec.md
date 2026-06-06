# Test Spec: PPB Modal Slot Orientation Runtime Contract
**Spec ID:** ppb-modal-slot-orientation  **Issue:** [eb-storefront-parity-1]  **Created:** 2026-06-02

## Purpose
Ensure Product Page Bundle modal slot layouts follow EB's consumed JSON contract by exposing and consuming `renderFilledSlotsAsHorizontalStacked` instead of hardcoding slot orientation from the template display name.

## Test Cases
### BundleConfigContracts
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Horizontal Slots template | `PDP_MODAL` + `MODAL` | `true` | EB horizontal modal slots render stacked horizontally |
| 2 | Vertical Slots template | `PDP_MODAL` + `SIMPLIFIED` | `false` | EB vertical modal slots render as full-width rows |
| 3 | In-page templates | `PDP_INPAGE` + `CASCADE` | `null` | Field applies only to modal slots |

### BundleFormatter
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | PPB horizontal modal | Product-page bundle with `PDP_MODAL` + `MODAL` | Runtime JSON includes `renderFilledSlotsAsHorizontalStacked: true` | Metafield/API payload parity |
| 2 | PPB vertical modal | Product-page bundle with `PDP_MODAL` + `SIMPLIFIED` | Runtime JSON includes `renderFilledSlotsAsHorizontalStacked: false` | Metafield/API payload parity |

### ProductPageWidget
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Widget source contract | Raw widget JS/CSS | Widget reads `renderFilledSlotsAsHorizontalStacked`, emits `data-ppb-slot-orientation`, and CSS keys vertical layout from that orientation | Prevents template-name-only coupling |
| 2 | In-page product markup | Raw widget JS | Quantity increase button appears once in the in-page card template | Prevents duplicate `+` controls |

## Acceptance Criteria
- [ ] Server runtime JSON exposes the EB modal slot orientation field.
- [ ] Product metafield sync carries the same field.
- [ ] Widget layout uses the orientation field.
- [ ] Raw widget JS passes syntax check.
- [ ] Widget assets are rebuilt before commit.
