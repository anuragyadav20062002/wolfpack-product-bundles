# Test Spec: PPB Compare-At Price Visibility
**Spec ID:** ppb-compare-at-price-visibility  **Issue:** [eb-storefront-parity-1]  **Created:** 2026-06-02

## Purpose
Verify PPB storefront compare-at strike prices follow EB's `showProductComparedAtPrice` setting instead of rendering whenever product data contains a compare-at price.

## Test Cases
### ProductPageWidget
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Setting is absent/default false | Product with `compareAtPrice` | No `.product-price-strike` markup | Matches EB default |
| 2 | Setting is true | Product with `compareAtPrice` | `.product-price-strike` markup is rendered | Merchant opt-in |
| 3 | Storefront DTO | Bundle configuration | `showProductComparedAtPrice` is present with default `false` | Runtime receives setting |

## Acceptance Criteria
- [ ] Product-page DTO writes `showProductComparedAtPrice`.
- [ ] PPB widget uses a helper gate before rendering compare-at strike prices.
- [ ] Widget assets are rebuilt after version bump.
