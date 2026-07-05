# Test Spec: Mantle Provider
**Spec ID:** mantle-provider  **Created:** 2026-06-12

## Purpose
Ensure the Admin app uses Mantle's React provider pattern with a server-side customer identify flow.

## Test Cases
### MantleProviderBootstrap
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Missing Mantle credentials | Empty app id, API key, or access token | Returns `null` | App should still render without Mantle |
| 2 | Valid Mantle credentials | App id, API key, Shopify access token, Admin GraphQL shop response | Calls Mantle identify and returns provider config | Uses customer `apiToken` returned by Mantle |
| 3 | Valid loader data | `mantleProvider` object from loader | App renders children through `MantleProvider` | Behavior only, no layout assertions |
| 4 | Missing loader Mantle data | `mantleProvider: null` | App renders children without `MantleProvider` | Keeps app usable without Mantle |
| 5 | App loader Mantle credentials | `MANTLE_API_KEY` differs from `SHOPIFY_API_KEY` | Loader passes `MANTLE_API_KEY` to server identify flow | Prevents Mantle identify from using Shopify client id |

## Acceptance Criteria
- [x] Mantle server helper tests pass
- [x] Admin app route provider tests pass
- [x] Lint passes on modified files
