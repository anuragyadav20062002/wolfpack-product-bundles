# Test Spec: App Embed Status
**Spec ID:** app-embed-status  **Created:** 2026-07-07

## Purpose
Ensure Admin app-embed warnings use the configured Shopify app handle when checking the active theme app embed.

## Test Cases
### BundleConfigureLoader
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | App handle is configured | `SHOPIFY_APP_HANDLE=configured-app-handle` | `checkAppEmbedEnabled` receives `configured-app-handle`, prod/SIT app handles, and `bundle-builder` handles | Prevents false disabled banner on stores where Shopify stores the app handle in theme settings |
| 2 | App handle is absent | no `SHOPIFY_APP_HANDLE` | `checkAppEmbedEnabled` receives the stable `bundle-builder`, `wolfpack-product-bundles-4`, and `wolfpack-product-bundles-sit` handles | Keeps the detector deterministic without API-key fallback logic |

### AppEmbedCheck
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 3 | Live theme is checked | MAIN theme disabled | `enabled=false`, `themeId` is the MAIN theme | Live storefront status is based on the active published theme only |
| 4 | MAIN query is scoped | App embed status is requested | Admin GraphQL uses `themes(first: 1, roles: [MAIN])` | Keeps Preview and banner checks aligned with EB-style active-theme detection |

## Acceptance Criteria
- [x] All listed test cases pass
