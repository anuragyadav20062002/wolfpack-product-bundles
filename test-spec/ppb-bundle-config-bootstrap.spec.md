# Test Spec: PPB Bundle Config Bootstrap
**Spec ID:** ppb-bundle-config-bootstrap  **Created:** 2026-06-13

## Purpose
Migrate product-page bundle hydration to marker-only DOM bootstrap (`data-bundle-config`) and App Proxy API fetch (`/apps/product-bundles/api/bundle/{id}.json`) for PPB, matching the FPB bootstrap contract and removing full bundle payload from Liquid markup.

## Test Cases
### PpbBundleConfigBootstrap
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | PPB block marker payload shape | `extensions/bundle-builder/blocks/bundle-product-page.liquid` rendered with `bundle_id` | `data-bundle-config` equals `{"v":2,"type":"product_page","bundleType":"product_page","id":"<bundleId>"}` and does not include full bundle fields | Marker contract for storefront hydration |
| 2 | API hydration path | PPB fixture page with marker in `data-bundle-config` | Runtime fetches `/apps/product-bundles/api/bundle/<bundleId>.json` for initialization | No dependence on full config in DOM |
| 3 | Runtime marker rejection behavior | Invalid `data-bundle-config` payloads | Widget hides on storefront or shows theme-editor preview when applicable | Keeps non-bundle and editor behavior unchanged |

## Acceptance Criteria
- [ ] PPB block no longer writes full bundle JSON into `data-bundle-config`.
- [ ] PPB widget loads bundle from `/apps/product-bundles/api/bundle/{id}.json` and stores into `this.bundleData`.
- [ ] Single retry for 503/504 is preserved for proxy cold-start.
- [ ] Unit coverage includes marker parse vs legacy full-object rejection and init guard behavior.
