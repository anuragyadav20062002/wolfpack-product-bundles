# Test Spec: Cart Transform Heal Removal
**Spec ID:** cart-transform-heal-removal  **Created:** 2026-07-06

## Purpose
Remove the storefront cart-transform self-heal route and scheduler while preserving the supported cart-transform status API.

## Test Cases
### RouteAndWidgetRemoval
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Removed app-proxy heal route | Filesystem state | `app/routes/api/api.cart-transform-heal.tsx` is absent | Keeps `api.check-cart-transform.tsx` |
| 2 | Widget sources no longer schedule heal calls | Raw widget source files | No `cart-transform-heal` endpoint or `_scheduleCartTransformSelfHeal` method references | Prevents storefront calls to deleted route |

## Acceptance Criteria
- [ ] All listed test cases pass
