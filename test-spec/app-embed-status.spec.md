# Test Spec: App Embed Status
**Spec ID:** app-embed-status  **Created:** 2026-07-07

## Purpose
Ensure Admin app-embed warnings use the configured Shopify app handle when checking the active theme app embed.

## Test Cases
### BundleConfigureLoader
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | App handle is configured | `SHOPIFY_APP_HANDLE=configured-app-handle` | `checkAppEmbedEnabled` receives `configured-app-handle` and `bundle-builder` handles | Prevents false disabled banner on stores where Shopify stores the app handle in theme settings |
| 2 | App handle is absent | no `SHOPIFY_APP_HANDLE` | `checkAppEmbedEnabled` receives only the stable `bundle-builder` extension handle | Keeps the detector deterministic without API-key or TOML fallback logic |

## Acceptance Criteria
- [x] All listed test cases pass
