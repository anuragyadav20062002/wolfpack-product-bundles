# Test Spec: Cart Bundle Details Metafield
**Spec ID:** cart-bundle-details-metafield  **Issue:** [eb-storefront-parity-1]  **Created:** 2026-06-02

## Purpose
Validate EB-aligned cart `bundle_details` metafield merging for FPB and PPB without exposing Storefront access tokens in widget code.

## Test Cases
### CartBundleDetailsRoute
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Signed app-proxy request merges existing metafield JSON | cart token, bundle key, display properties | Storefront query then `cartMetafieldsSet` mutation with merged JSON | Mirrors EB accumulated `bundle_details` blob |
| 2 | Invalid app-proxy signature | bad signature | 400 response and no Storefront API call | Prevent unsigned browser writes |
| 3 | Missing bundle key | signed request without key | 400 response | DTO validation |

### StorefrontWidgetSource
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB sync uses app-proxy route | add-to-cart path | `/apps/product-bundles/api/cart-bundle-details` POST | No direct tokenless GraphQL |
| 2 | PPB sync uses app-proxy route | add-to-cart path | `/apps/product-bundles/api/cart-bundle-details` POST | Keeps EB key format |

## Acceptance Criteria
- [ ] Route tests cover signed request merge and rejection.
- [ ] Widget source tests confirm no direct `/api/{version}/graphql.json` cart-metafield call remains.
- [ ] Raw widget JS passes `node --check`.
- [ ] Focused Jest tests pass.
