# Test Spec: Engagement Endpoint Security Hardening
**Spec ID:** api-attribution-engagement-security  **Issue:** [attribution-engagement-security-1]  **Created:** 2026-06-06

## Purpose
Ensure `POST /api/attribution/engagement` only accepts valid signed app-proxy requests and valid payloads, and that CORS headers are present on both success and failure paths.

## Test Cases
### Endpoint Verification
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Unsigned request | Missing `signature` query param | 400/403 with `error` response | App-proxy verification should fail before DB write |
| 2 | Signed request with valid payload | Valid HMAC, matching `shopId`, required fields | 200 with `{ ok: true }` and one DB write | `skipDuplicates` flow exercised |
| 3 | Signed request with invalid shop mismatch | `shopId` does not match `shop` query | 400 with error, no DB write | Prevent cross-tenant writes |
| 4 | Signed request with missing required fields | Missing `bundleId` or `sessionId` | 400 + CORS headers | Input validation path covered |
| 5 | OPTIONS preflight | `OPTIONS` to signed route | 204 with CORS headers and `Allow-*` values | Browser preflight support retained |

### Security Headers
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Any handler return | success/failure response | `Vary: Origin` and no wildcard CORS on unsafe origin | CORS policy is explicit |

## Acceptance Criteria
- [ ] `api.attribution.engagement.tsx` rejects unsigned/non-verified requests.
- [ ] `api.attribution.engagement.tsx` writes only when `shopId` matches verified proxy shop and required fields pass validation.
- [ ] All response paths carry explicit CORS headers.
- [ ] Unit tests for this endpoint pass.
