# Test Spec: FPB Storefront Category API
**Spec ID:** fpb-storefront-category-api  **Issue:** [eb-storefront-parity-1]  **Created:** 2026-06-02

## Purpose
Ensure the public FPB bundle API loads category-backed step content so the storefront widget can consume the EB-aligned category runtime contract.

## Test Cases
### api.bundle.$bundleId.json
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Loader fetches FPB bundle for storefront | Valid app-proxy request | Prisma query includes `StepProduct` and ordered `StepCategory` | Prevents empty category DTO on proxy fallback |
| 2 | Runtime category product compaction preserves weight | Hydrated category product with product and variant weight fields | Compact runtime product keeps `weight` and `weightUnit` on product and variants | Required for category weight rules |
| 3 | Collection-backed category hydration preserves weight | Storefront collection product variant with `weight` and `weightUnit` | `/api/storefront-collections` response keeps variant weight fields | Required for category weight rules on collection products |
| 4 | Collection-backed category hydration preserves variant options | Storefront collection product with `options` and variant `selectedOptions` | `/api/storefront-collections` response keeps product `options` and variant `option1` / `option2` / `option3` | Required for grouped product cards to render the inline variant selector when `Display variants as individual products` is off |

## Acceptance Criteria
- [ ] Public FPB bundle API includes ordered `StepCategory` rows in the bundle query.
- [ ] Existing free gift and default product response fields remain intact.
- [ ] Category runtime payloads preserve product and variant weight fields.
- [ ] Collection-backed category products preserve variant weight fields.
- [ ] Collection-backed category products preserve variant selector option data.
