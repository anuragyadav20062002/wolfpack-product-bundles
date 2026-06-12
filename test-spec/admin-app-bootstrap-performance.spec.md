# Test Spec: Admin App Bootstrap Performance
**Spec ID:** admin-app-bootstrap-performance  **Created:** 2026-06-12

## Purpose
Ensure the embedded Admin app keeps Shopify authentication on the critical path while moving non-critical offline-session maintenance out of the initial render path. Shopify App Bridge owns BFS Web Vitals collection, so the old custom LCP beacon path must not remain active.

## Test Cases
### AppLayoutLoader
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Offline migration is slow | `authenticate.admin` resolves; offline migration promise stays pending | Loader resolves with app bootstrap data without waiting for migration | Prevents migration from delaying LCP |
| 2 | Offline migration fails after response | migration rejects after loader resolves | Error is logged and loader result remains successful | Maintenance failure should not block shell render |

## Acceptance Criteria
- [ ] The app layout loader awaits Shopify auth.
- [ ] The app layout loader does not await offline-session migration.
- [ ] Background migration failures are logged.
- [ ] The custom `/api/web-vitals` telemetry path is fully removed.
