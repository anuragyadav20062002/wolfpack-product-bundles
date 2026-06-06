# Test Spec: Parent Product Status Stale Sync
**Spec ID:** parent-product-status-stale-sync  **Issue:** [parent-product-status-stale-sync-1]  **Created:** 2026-06-05

## Purpose
Prevent the configure UI from keeping a stale parent product status after Shopify-backed loader data changes.

## Test Cases
### ParentProductStatusUi
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Loader revalidation returns a changed parent product status | `loadedBundleProduct.status` changes from `DRAFT` to `ACTIVE` | Local `productStatus` and `bundleProduct` state sync to the new loader product without marking dirty | Covers FPB and PPB because both use `useBundleConfigurationState` |

## Acceptance Criteria
- [x] Configure state syncs Shopify-backed parent product status after loader revalidation.
- [x] Parent Product Status badge reflects the revalidated Shopify product status without a full route reload.
