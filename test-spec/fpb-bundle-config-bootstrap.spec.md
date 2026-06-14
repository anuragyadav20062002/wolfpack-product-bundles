# Test Spec: FPB Bundle Config Bootstrap
**Spec ID:** fpb-bundle-config-bootstrap  **Created:** 2026-06-13

## Purpose
Shift FPB full-page hydration to a compact bootstrap marker (`data-bundle-config`) plus proxy fallback, and keep API caching behavior explicit.

## Test Cases
### FpbBundleConfigBootstrap
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Full-page block marker payload shape | `extensions/bundle-builder/blocks/bundle-full-page.liquid` rendered with valid `bundle_id` | `data-bundle-config` contains `{"v":2,"type":"full_page","bundleType":"full_page","id":...}` and does not include large bundle JSON | Marker remains stable and lightweight |
| 2 | Bundle API bootstrap projection | `GET /apps/product-bundles/api/bundle/{id}.json?fields=bootstrap` | Response returns `success`, `timestamp`, and `bootstrap` fields only for projection path | No full `bundle` payload is required for bootstrap calls |
| 3 | API cache revalidation | Repeat request with `If-None-Match` and `If-Modified-Since` | Server returns `304` and empty body for unchanged bundle revision | Keeps storefront repeated loads cheap |

## Acceptance Criteria
- [ ] Full-page block marker data no longer embeds full bundle JSON.
- [ ] API route continues to return full bundle payload by default and supports `fields=bootstrap`.
- [ ] `Cache-Control`, `ETag`, and `Last-Modified` headers are present and respected.
