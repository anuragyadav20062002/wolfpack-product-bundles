# Test Spec: PPB Product Page Card Click Add Toggle
**Spec ID:** ppb-product-page-card-click-setting  **Created:** 2026-07-13

## Purpose
Ensure the product-card click-to-add control resolves from product page controls settings and is wired to a deterministic helper path that can be covered by unit tests.

## Test Cases
### ProductCardClickSetting
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | No controls settings | `config.controlsSettings` missing | `false` | Defaults to explicit-action behavior |
| 2 | Active-controls flag enabled | `controlsSettings.activeControls.addToCartWhenProductCardClicked = true` | `true` | Card-click is enabled |
| 3 | Legacy settings-controls path enabled | `controlsSettings.settingsControls.productPage.addToCartWhenProductCardClicked = true` | `true` | Keeps API shape compatibility |
| 4 | Singular admin alias enabled | `controlsSettings.activeControls.addToBundleOnProductCardClick = "true"` | `true` | Matches settings-runtime alias |
| 5 | String validation bypass flag | `controlsSettings.activeControls.validateConditionsBeforeAddToCart = "false"` | `false` | Enables parsing of checkbox-like string inputs |

## Acceptance Criteria
- [ ] All listed test cases pass
