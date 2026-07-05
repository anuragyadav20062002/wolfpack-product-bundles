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
| 4 | Stale full cached payload pre-render hydration | `data-bundle-config` contains a full cached payload for the selected bundle but the app proxy returns a newer payload | Widget replaces `bundleData` and `selectedBundle` with the proxy bundle before first render | Prevents Standard/stale first paint when the live Liquid attribute has not synced yet |
| 5 | Full-page app-embed marker payload shape | Preview/page body marker is refreshed with a saved bundle | Hidden `data-wpb-full-page-bundle` marker contains only the compact bootstrap pointer and never embeds `name`, `steps`, or preset fields | Prevents app-embed hydrated pages from rendering stale Standard config before Classic |
| 6 | Save refreshes placed page marker | Existing placed FPB is saved after template change | Save handler refreshes the Shopify page body marker with the current compact pointer before writing page metafields | Avoids requiring deployment or a separate placement action for storefront template sync |

## Acceptance Criteria
- [x] Full-page block marker data no longer embeds full bundle JSON.
- [x] API route continues to return full bundle payload by default and supports `fields=bootstrap`.
- [x] `Cache-Control`, `ETag`, and `Last-Modified` headers are present and respected.
- [x] Stale full cached payloads hydrate the current proxy bundle before first render.
- [x] App-embed hydrated full-page markers no longer embed full bundle JSON.
- [x] Saving a placed FPB refreshes the compact page-body marker.
