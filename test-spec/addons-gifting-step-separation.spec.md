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
| 3 | Paid product is also selected as a paid add-on candidate | Paid step selected line matches add-on tier product by product/title | Paid-step total is not reduced by the add-on line discount | Add-on discount applies only after selecting the product on the add-on step. |
| 4 | Paid add-on product selected on add-on step | Selected line has add-on step index and eligible percentage tier | Add-on line discount amount is included in bundle total discount | Paid add-ons remain discounted after eligibility. |
| 5 | Paid add-on card renders active tier pricing | Add-on step product with original price `82900` and eligible `10%` tier | Card display data uses current price `74610`, compare-at price `82900`, and `10% off` badge text | Matches EB paid add-on row behavior. |
| 6 | Paid add-on card uses cart CTA copy | Paid add-on step card rendered through shared product card | Card add button uses the configured add-to-cart label | Paid add-on selection is the final cart action in EB. |
| 7 | Active multi-tier add-on product list | Tier 1 has one product, Tier 2 has one different `100%` product, paid quantity qualifies Tier 2 | Add-on step renders only Tier 2 products, max quantity matches Tier 2 product count, and stale Tier 1 selection is removed | Highest eligible tier owns the offer surface. |
| 8 | Empty add-on message templates | Add-on tier has threshold and discount but saved `addonsMessaging` strings are empty | Runtime derives EB default ineligible and eligible tier messages from the active tier | EB renders the add-on sidebar card even when custom message fields are empty. |
| 9 | Active add-on step summary | Current step is `isFreeGift=true` | Standard summary sidebar does not render the add-on eligibility section | EB only shows the add-on summary section before the shopper is on the add-on step. |
| 10 | 100% add-on discount amount | Add-on step displays as free but has an eligible `PERCENTAGE:100` tier | Selected add-on discount amount contributes the full add-on price | Supports native Add On discount proof for free-tier add-ons. |

## Acceptance Criteria
- [x] All listed test cases pass
- [x] Feature A and Feature B can be enabled independently
- [x] Widget code no longer uses tier 1 as the only add-on tier source
- [x] Generated widget bundles are rebuilt
