# Test Spec: Parent Product Default Draft
**Spec ID:** parent-product-default-draft  **Issue:** [parent-product-default-draft-1]  **Created:** 2026-06-04  **Superseded:** 2026-07-12

## Purpose
Historical spec for a previous DRAFT default. This is superseded for Product Page Bundles by `test-spec/ppb-parent-product-default-unlisted.spec.md` after EB parity evidence confirmed EB creates parent bundle products as Shopify `UNLISTED`.

Do not use this spec as the current PPB target. FPB behavior should be changed only in a separate FPB-scoped implementation slice.

## Test Cases
### ParentProductCreation
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Historical FPB sync creates missing parent product | FPB handler source | `productCreate` creation payload used `status: "DRAFT"` | Superseded historical target |
| 2 | Historical FPB sync recreates missing parent product after page sync | FPB handler source | Recreate payload used `status: 'DRAFT'` | Superseded historical target |
| 3 | Historical PPB sync creates missing parent product | PPB handler source | `productCreate` creation payload used `status: "DRAFT"` | Superseded by PPB unlisted spec |
| 4 | Historical PPB sync recreates deleted parent product | PPB handler source | Recreate payload used `status: 'DRAFT'` | Superseded historical target |
| 5 | Unlisted explicit status sync remains available | Shared/PPB/FPB status sync source | `UNLISTED` path still syncs through explicit status update logic | Still valid |

## Acceptance Criteria
- [x] Historical work completed on 2026-06-04.
- [x] PPB target superseded by `ppb-parent-product-default-unlisted`.
