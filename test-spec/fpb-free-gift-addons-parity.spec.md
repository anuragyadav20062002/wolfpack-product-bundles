# Test Spec: FPB Free Gift Add Ons Parity
**Spec ID:** fpb-free-gift-addons-parity  **Created:** 2026-06-26

## Purpose
Verify that the partially implemented FPB Free Gift & Add Ons feature matches the EB behavior documented in `internal docs/EB Free Gift Add Ons Behavior Spec.md`.

## Test Cases
### AdminDataContract
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Gifting on, add-ons off | `isPersonalizationEnabled=true`, `addonProductsEnabled=false` | Direct `personalizationData` persists the Add On step and disables tiers at runtime | EB step toggle is independent. |
| 2 | Gifting off, add-ons on | `isPersonalizationEnabled=false`, `addonProductsEnabled=true` | Direct contract can persist but storefront creates no Add On step | Robust edge; Admin confirm should disable both. |
| 3 | Numeric normalization | discount `"0100"`, amount `"001"` | Saved values are `100` and `1` | WPB must avoid EB's leading-zero quirk. |
| 4 | Disable step confirmation | Add-ons enabled, user confirms disabling gifting step | Both `isPersonalizationEnabled` and `addonProductsEnabled` become false | EB confirmation behavior. |

### StorefrontRuntime
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Both toggles off | No personalization step | No Add On nav or add-on messaging | Normal footer remains. |
| 2 | Gifting on, add-ons off | Empty Add On step | Add On nav exists; no tier products/messages | Step can exist alone. |
| 3 | Add-ons on, gifting off | Tier data without personalization step | No synthetic Add On step | Tier data alone cannot create the step. |
| 4 | Multiple tiers | Quantity thresholds 3=20%, 6=100% | Highest eligible tier wins | Do not hardcode tier 1. |
| 5 | Amount eligibility | Threshold amount and partial discount | Remaining amount/interpolation works | Uses paid subtotal only. |
| 6 | Optional add-on step | Paid steps complete, add-on threshold unmet | Shopper can proceed/add to cart without add-on | Paid validation remains authoritative. |
| 7 | Active tier products | Two tier product sets | Add On step renders only active eligible tier products | No leakage from lower tiers. |
| 8 | Discount values | `0`, `10`, `100` | Full price, partial, and free cart behavior respectively | Cart Transform consumes step type. |
| 9 | Non-positive paid step rule | Saved step rule `Quantity is equal to 0` | Rule is treated as absent for selection/update and does not block all product adds | Prevents impossible storefront state from bad Admin input. |
| 10 | Non-positive category rule | Saved category rule value `0` | Category rule is ignored instead of marking the category permanently complete or blocked | Paid validation remains usable. |

## Acceptance Criteria
- [ ] All listed automated test cases pass.
- [ ] Storefront widget assets are rebuilt after widget source changes.
- [ ] Chrome evidence covers Admin savebar persistence, desktop storefront, mobile storefront, and representative cart JSON.
