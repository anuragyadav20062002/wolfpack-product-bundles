# Test Spec: Cart Transform OfferId Grouping
**Spec ID:** cart-transform-offer-id-grouping  **Issue:** [eb-storefront-parity-1]  **Created:** 2026-06-02

## Purpose
Validate that storefront component lines group for Cart Transform using EB `_easyBundle:OfferId` and `_bundleName`, not private `_bundle_id` attributes.

## Test Cases
### CartTransformInputQuery
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Function input query reads EB attributes | `run.graphql` | `_easyBundle:OfferId` and `_bundleName` are queried | No private `_bundle_id` query |

### RustMerge
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Two component lines share EB OfferId base | `MIX-894502_K1K_1`, `MIX-894502_K1K_2` | One merge operation | EB base key is `{offerId}_{sessionKey}` |

### StorefrontWidgetSource
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB cart payload emits public EB fields only | source scan | `_easyBundle:OfferId`, `_bundleName`; no `_bundle_id` component property | JSON `/cart/add.js` remains |
| 2 | PPB cart payload emits public EB fields only | source scan | `_easyBundle:OfferId`, `_bundleName`; no `_bundle_id`/`_bundle_name` component property | Multipart `/cart/add` remains |

## Acceptance Criteria
- [ ] Rust Function tests pass.
- [ ] Widget source tests pass.
- [ ] Raw widget JS passes `node --check`.
- [ ] Widget bundles are rebuilt with a new version.
