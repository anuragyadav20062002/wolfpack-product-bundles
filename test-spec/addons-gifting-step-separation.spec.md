# Test Spec: Add-ons / Gifting Step Separation
**Spec ID:** addons-gifting-step-separation  **Created:** 2026-06-21

## Purpose
Lock EB parity for the two separate Free Gift & Add Ons controls:

- Add-Ons and Gifting Step is a real bundle step/tab with its own toggle, name, title, and icon.
- Add-Ons with Bundles is an independent add-on tier system with its own toggle, products, thresholds, discounts, and messages.

## Test Cases
### FullPagePersonalizationAddons
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Gifting step enabled, add-ons with bundles disabled | `isPersonalizationEnabled=true`, `addonProducts.isEnabled=false` | Widget appends an `isFreeGift` step with no tier-discount gating | Feature A must work by itself. |
| 2 | Add-ons with bundles enabled, gifting step disabled | `isPersonalizationEnabled=false`, `addonProducts.isEnabled=true` | Widget does not append an `isFreeGift` step | Feature B must not create the Feature A step. |
| 3 | Add-ons with bundles has multiple tiers | Tier 1 `20%`, Tier 2 `100%` | Tier evaluation can select the applicable tier instead of hardcoding tier 1 | EB setup supports multiple tiers. |

### FullPageValidationAddons
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Free-gift step has no tier discount config | `isFreeGift=true`, no `addonTiers` | Unlock depends on prior paid steps only | Feature A step behavior. |
| 2 | Multiple add-on tiers include selected products beyond tier 1 | `addonTiers[1].selectedAddonProducts.length > 0` | Bundle is not conditionless | Feature B tiers cannot be ignored. |

## Acceptance Criteria
- [x] All listed test cases pass
- [x] Feature A and Feature B can be enabled independently
- [x] Widget code no longer uses tier 1 as the only add-on tier source
- [x] Generated widget bundles are rebuilt
