# Test Spec: Cart Transform Runtime Token
**Spec ID:** cart-transform-runtime-token  **Created:** 2026-07-08

## Purpose
Verify the EB-style runtime cart contract uses a server-signed token for merge and discount validation instead of per-component `component_parents` fanout.

## Test Cases
### RuntimeTokenService
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Sign and verify deterministic payload | Valid payload + secret | Verified payload matches original | Signature covers base64url payload string |
| 2 | Reject tampered payload | Valid token with edited payload | Verification returns null | Rust mirrors this behavior |
| 3 | Validate selected variants | Bundle DB config + selected variants | Normalized component payload | Rejects unknown variants |

### RuntimeTokenRoute
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Invalid app-proxy signature | POST without valid signature | 400 | No DB lookup |
| 2 | Unknown selected variant | Signed POST with variant outside bundle | 400 | Validation blocks token |
| 3 | Valid FPB/PPB payload | Signed POST with valid selected variants | `{ token }` | Token verifies with shop secret |

### WidgetCartPayload
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Product-page FormData runtime token | Cart items + runtime token | `_wolfpack_bundle_runtime` on each line | Keeps OfferId unchanged |

### RustFunctions
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Valid token merge | Cart lines with signed runtime token | One `linesMerge` operation | No `component_parents` required |
| 2 | Tampered token | Cart lines with bad signature | No merge/discount | Fail closed |
| 3 | Add-on discount authorization | Add-on marker with valid token | Product discount candidate | Unsigned marker ignored |

### StorefrontSync
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | CartTransform owner metafields | Sync settings | Writes messaging + runtime secret | Same owner |
| 2 | Async sync | Storefront sync from DB | Does not call component variant writer | Parent/display metafields remain |

## Acceptance Criteria
- [ ] All listed test cases pass
- [ ] Raw widget source syntax checks pass
- [ ] Rust Cart Transform and Discount Function tests pass
- [ ] Widget bundles are rebuilt after raw JS edits
