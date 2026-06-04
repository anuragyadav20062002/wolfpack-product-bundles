# Test Spec: Parent Product Default Draft
**Spec ID:** parent-product-default-draft  **Issue:** [parent-product-default-draft-1]  **Created:** 2026-06-04

## Purpose
Ensure generated Shopify bundle parent products are created as Shopify `DRAFT` by default for both Full Page and Product Page bundle flows.

## Test Cases
### ParentProductCreation
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB sync creates missing parent product | FPB handler source | `productCreate` creation payload uses `status: "DRAFT"` | Initial Cart Transform parent product should not be live by default |
| 2 | FPB sync recreates missing parent product after page sync | FPB handler source | Recreate payload uses `status: 'DRAFT'` | Covers page recreation fallback |
| 3 | PPB sync creates missing parent product | PPB handler source | `productCreate` creation payload uses `status: "DRAFT"` | Main PPB parent product path |
| 4 | PPB sync recreates deleted parent product | PPB handler source | Recreate payload uses `status: 'DRAFT'` | Covers product recreation fallback |
| 5 | Unlisted explicit status sync remains available | Shared/PPB/FPB status sync source | `UNLISTED` path still syncs through explicit status update logic | Do not remove ad campaign status support |

## Acceptance Criteria
- [x] Red tests fail while product creation payloads still use `ACTIVE`.
- [x] Focused tests pass after implementation.
- [x] ESLint has zero errors for changed files.
- [x] No widget build required because storefront widget assets are not changed.
