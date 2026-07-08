# Test Spec: Cart Transform Query Complexity
**Spec ID:** cart-transform-query-complexity  **Created:** 2026-07-08

## Purpose
Keep the Cart Transform input query below Shopify's complexity limit while preserving runtime-token merge behavior.

## Test Cases
### CartTransformQueryComplexity
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Query avoids redundant add-on grouping attribute | `run.graphql` | Does not select `_addon_offer_id` | Parent add-on group ID is derived from `_wolfpackProductBundle:OfferId` base |
| 2 | Runtime token fields remain selected | `run.graphql` | Selects `_wolfpack_bundle_runtime` and `runtime_token_secret` | Required trust boundary |

## Acceptance Criteria
- [x] All listed test cases pass
