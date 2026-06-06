# Test Spec: FPB and PPB Cart Line Property DTOs
**Spec ID:** fpb-ppb-cart-line-properties  **Issue:** [eb-storefront-parity-1]  **Created:** 2026-06-02

## Purpose
Move storefront cart line properties toward EB parity by emitting the public EB bundle properties and removing step attribution from cart payloads.

## Test Cases
### StorefrontCartProperties
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB component line properties | Raw full-page widget source | includes `Box`, `_bundleName`, `_easyBundle:prodQty`, `_easyBundle:OfferId` | EB FPB payload |
| 2 | PPB component line properties | Raw product-page widget source | includes `Box`, `_bundleName`, `_easyBundle:prodQty`, `_easyBundle:OfferId` | EB PPB payload |
| 3 | Step details omitted | Raw widget sources | no `_step_index` or `_step_name` cart properties | EB tracks step info client-side only |
| 4 | WPB transform grouping retained | Raw widget sources | `_bundle_id` still present | Temporary compatibility until transform migration |

## Acceptance Criteria
- [ ] FPB lines emit EB public cart properties.
- [ ] PPB lines emit EB public cart properties.
- [ ] FPB/PPB cart properties omit step attribution.
- [ ] Existing `_bundle_id` grouping remains for the current Cart Transform.
- [ ] Raw widget syntax passes `node --check`.
- [ ] Widget assets are rebuilt before commit.
