# Test Spec: Render Health Route
**Spec ID:** render-health-route  **Created:** 2026-07-02

## Purpose
Verify the public `/health` endpoint used by Render HTTP health checks.

## Test Cases
### HealthRouteLoader
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Healthy app and database | GET `/health`; DB ping resolves | HTTP 200, `{ status: "ok" }`, `Cache-Control: no-store` | Satisfies Render 2xx success criteria. |
| 2 | Database ping fails | GET `/health`; DB ping rejects | HTTP 503, `{ status: "error" }`, `Cache-Control: no-store` | Fails closed so Render does not route to an unhealthy instance. |

## Acceptance Criteria
- [x] All listed test cases pass
- [x] Endpoint is public and does not require Shopify session auth
- [x] Endpoint performs a lightweight DB readiness query
