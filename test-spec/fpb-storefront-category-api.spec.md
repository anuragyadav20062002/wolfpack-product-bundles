# Test Spec: FPB Storefront Category API
**Spec ID:** fpb-storefront-category-api  **Issue:** [eb-storefront-parity-1]  **Created:** 2026-06-02

## Purpose
Ensure the public FPB bundle API loads category-backed step content so the storefront widget can consume the EB-aligned category runtime contract.

## Test Cases
### api.bundle.$bundleId.json
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Loader fetches FPB bundle for storefront | Valid app-proxy request | Prisma query includes `StepProduct` and ordered `StepCategory` | Prevents empty category DTO on proxy fallback |

## Acceptance Criteria
- [ ] Public FPB bundle API includes ordered `StepCategory` rows in the bundle query.
- [ ] Existing free gift and default product response fields remain intact.
