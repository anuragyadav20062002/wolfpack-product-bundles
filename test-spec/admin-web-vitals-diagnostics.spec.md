# Test Spec: Admin Web Vitals Diagnostics
**Spec ID:** admin-web-vitals-diagnostics  **Created:** 2026-06-28

## Purpose
Verify temporary Admin iframe LCP diagnostics used to inspect Shopify Web Vitals samples while cross-origin iframe access blocks direct DevTools reads.

## Test Cases

### AdminWebVitalsDiagnostics
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Debug iframe bridge is not installed in committed runtime | `wpbWebVitalsDebug=1` while diagnostics load | No parent-frame `message` listener is registered | Recreate only temporarily in dev/SIT for major Admin UI LCP passes |
| 2 | Debug iframe bridge is disabled outside debug mode | Same message while debug is disabled | No message response | Prevents normal merchant sessions from exposing diagnostics |

## Acceptance Criteria
- [ ] Debug bridge is installed only when `wpbWebVitalsDebug=1` or debug localStorage is enabled.
- [ ] Bridge response includes enough data to verify LCP samples from Shopify Admin parent context.
- [ ] Existing LCP diagnostics tests continue to pass.
