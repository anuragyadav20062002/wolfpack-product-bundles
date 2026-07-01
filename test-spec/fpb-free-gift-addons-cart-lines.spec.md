# Test Spec: FPB Free Gift Add Ons Cart-Line Parity
**Spec ID:** fpb-free-gift-addons-cart-lines  **Created:** 2026-06-27

## Purpose
Validate checkout/cart-line parity for Free Gift & Add Ons across FPB storefront flows and prevent non-configured toast regressions.

## Test Cases
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Add-on tier selected with eligible threshold | Bundle with active Free Gift & Add Ons step and one chargeable add-on product selected | Add-on line is emitted as separate cart line with `_addon_product: true`, `_addon_offer_id`, `_addonTierId`, `_boxProduct`, `_uniqueWpbItemKey`, and `_bundle_step_type` discount marker. Parent line has `_addon_offer_id` when add-on bundle is configured | Matches EB runtime shape from storefront cart add flow |
| 2 | Add-ons with no selected products | Add-ons configured but step has no selected product
variants for discount conditions | No add-on cart line is emitted | Add-ons remain optional unless explicitly selected |
| 3 | Invalid/zero step condition in live editor | Bundle step conditionValue set to `0` (edge config) | No `This step allows exactly 0 products only` toast; UI returns configuration error message instead of malformed singular/plural text | Prevents misleading zero-capacity toast regression |

## Acceptance Criteria
- [ ] Cart lines for add-on products remain separate from paid bundle component lines.
- [ ] Add-on line metadata aligns with EB runtime contract for active tiers and offer IDs.
- [ ] Zero-capacity step validation feedback no longer shows malformed "exactly 0" text.
