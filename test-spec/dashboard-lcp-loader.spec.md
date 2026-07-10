# Test Spec: Dashboard LCP Loader
**Spec ID:** dashboard-lcp-loader  **Created:** 2026-07-10

## Purpose
Protect the dashboard first paint from optional Shopify app-embed detection latency.

## Test Cases
### DashboardLoaderPerformance
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | App-embed detection is still pending | Dashboard loader request with bundle query resolved and app-embed lookup unresolved | Loader resolves initial deferred payload and exposes app-embed status as a deferred promise | Prevents Shopify theme lookup from blocking Admin LCP |

## Acceptance Criteria
- [ ] Dashboard loader returns initial bundle data without waiting for app-embed detection.
- [ ] Deferred payload still contains app-embed status for hydration.
