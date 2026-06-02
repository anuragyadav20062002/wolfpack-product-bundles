# Test Spec: SDK Cart EB Contract
**Spec ID:** sdk-cart-eb-contract  **Issue:** [eb-storefront-parity-1]  **Created:** 2026-06-02

## Purpose
Verify SDK-mode product-page bundles emit the same EB-compatible storefront cart contract as the non-SDK PPB widget.

## Test Cases
### buildCartItems
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Selected products are converted to EB cart line properties | SDK state with two selected products | Lines include `Box`, `_bundleName`, `_easyBundle:OfferId`, `_easyBundle:prodQty` | Private `_bundle_id`, `_bundle_name`, and `_step_index` are absent |
| 2 | One add operation shares one offer-session key | Two selected products in one call | Both `_easyBundle:OfferId` values share `{offerId}_{sessionKey}` and use item indexes | Matches EB PPB grouping |
| 3 | Numeric offer IDs are normalized | `offerId: "894502"` | `_easyBundle:OfferId` starts with `MIX-894502_` | Avoids hardcoded template assumptions |
| 4 | Bundle details metadata is generated | Discounted SDK state | Display properties include `Box`, `Items`, `Retail Price`, `You Save` | Feeds app-proxy cart metafield sync |

## Acceptance Criteria
- [ ] SDK cart tests pass.
- [ ] SDK raw source passes `node --check`.
- [ ] SDK bundle is rebuilt before deploy.
