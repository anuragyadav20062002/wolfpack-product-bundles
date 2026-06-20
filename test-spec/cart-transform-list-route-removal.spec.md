# Test Spec: Cart Transform List Route Removal
**Spec ID:** cart-transform-list-route-removal  **Created:** 2026-06-21

## Purpose
Ensure the obsolete Admin cart-transform bundles list page is removed without deleting cart-transform backend/API support.

## Test Cases
### CartTransformListRouteRemoval
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Obsolete Admin list route is absent | Route file inventory | `/app/bundles/cart-transform` route and route-local list modules do not exist | Prevents reintroducing the no-op list page |
| 2 | Runtime/API cart-transform support remains | Route file inventory | API cart-transform routes still exist | Removal is Admin page only |

## Acceptance Criteria
- [ ] The obsolete Admin cart-transform list route files are absent.
- [ ] Cart-transform API support remains in place.
- [ ] Focused integration test passes.
