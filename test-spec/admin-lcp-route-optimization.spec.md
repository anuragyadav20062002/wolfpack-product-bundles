# Test Spec: Admin LCP Route Optimization
**Spec ID:** admin-lcp-route-optimization  **Created:** 2026-06-28

## Purpose
Reduce local Admin LCP on routes that exceeded 2500 ms during Shopify Admin iframe sampling while preserving route behavior.

## Test Cases

### RouteOptimization
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Cart-transform Admin list route remains removed | Route file inventory | `/app/bundles/cart-transform` route files are absent; API/function support remains | Existing integration test covers this |
| 2 | Pricing route can paint before subscription lookup settles | `/app/pricing` loader | Route returns deferred subscription data and renders a skeleton while it resolves | Targets local 2592 ms sample |
| 3 | Attribution route can paint before analytics queries settle | `/app/attribution` loader | Route returns deferred analytics data and renders a fixed shell/skeleton while it resolves | Targets local 5280 ms sample |
| 4 | Dashboard route removes avoidable sequential DB wait | `/app/dashboard` loader | Bundle and shop metadata reads start concurrently before secondary work | Targets local 4476 ms sample |

## Acceptance Criteria
- [ ] Focused cart-transform route removal test passes.
- [ ] Pricing route still renders quota, plan cards, comparison, and FAQ after deferred data resolves.
- [ ] Attribution route still renders pixel status, funnel, charts, matrix, activity, and campaigns after deferred data resolves.
- [ ] Local Admin debug bridge shows improved LCP samples on affected routes after reload.
