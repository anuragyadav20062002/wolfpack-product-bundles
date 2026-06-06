# Test Spec: Bundle Details Cart Metafield
**Spec ID:** bundle-details-cart-metafield  **Issue:** [eb-storefront-parity-1]  **Created:** 2026-06-02

## Purpose
Verify FPB and PPB storefront widgets follow EB's cart metafield contract by merging `bundle_details` through the Storefront API while keeping cart add resilient.

## Test Cases
### StorefrontCartMetafieldContract
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB cart add completes | Selected FPB component lines | JSON `/cart/add.js` still posts component items | Existing FPB transport must not regress |
| 2 | FPB bundle details sync | FPB offer ID and session key | `bundle_details` key uses `{offerId}_{sessionKey}` | No item index suffix |
| 3 | PPB cart add completes | Selected PPB component lines | Multipart `/cart/add` still posts component items | Existing PPB transport must not regress |
| 4 | PPB bundle details sync | PPB offer ID and session key | `bundle_details` key uses `{offerId}_{sessionKey}` before cart add | Matches EB PPB order |
| 5 | Storefront scopes configured | Shopify app configs | `unauthenticated_read_checkouts` and `unauthenticated_write_checkouts` requested | Required for cart metafield read/write |

## Acceptance Criteria
- [ ] Both widgets contain `GetCartMetafield` and `cartMetafieldsSet`.
- [ ] Both widgets use `key: 'bundle_details'` in the default app-reserved namespace.
- [ ] Sync failures are non-fatal and do not block cart add.
- [ ] Shopify app configs request Storefront cart read/write scopes.
