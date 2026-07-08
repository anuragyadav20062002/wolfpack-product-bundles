# Test Spec: EB-Style Save And Preview Flow
**Spec ID:** eb-style-save-preview-flow  **Created:** 2026-07-08

## Purpose
Verify configure Save, Sync Bundle, and Preview use an EB-style direct server flow with compact responses and no queue/status polling contract.

## Test Cases
### StorefrontSyncService
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Direct sync marks the bundle syncing and performs Shopify writes | full-page bundle sync request | synced result, no Inngest event | Save/preview path is queue-free |
| 2 | Direct sync records compact failure state | Shopify write throws | thrown error and failed DB status | UI receives compact error from route |
| 3 | Compact bundle response omits graph/status internals | bundle with steps/pricing/storefront fields | only id/type/status/Shopify handles | Prevent heavy API payloads |

### StorefrontSyncRoutes
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Sync action returns EB-style success | valid session/bundle | `{ success, statusCode, synced, message }` | No queue fields |
| 2 | Preview action returns compact success | valid session/bundle | `{ success, statusCode, ready, message }` | Single promise gate |
| 3 | Sync failure returns compact error | service throws | `{ success: false, error }` | Error toast source |

## Acceptance Criteria
- [x] No configure save or preview path calls `enqueueBundleStorefrontSync`.
- [x] No configure preview path calls `awaitStorefrontSyncReady`.
- [x] API responses do not expose `storefrontSync`, `attemptId`, `queuedAt`, `stats`, or polling state.
- [x] Preview button loading is governed by one server promise.
