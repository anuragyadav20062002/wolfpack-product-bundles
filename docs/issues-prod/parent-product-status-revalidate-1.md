# Issue: Parent Product Status Revalidation
**Issue ID:** parent-product-status-revalidate-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-06-05
**Last Updated:** 2026-06-05 20:19

## Overview
The Bundle Product status badge is rendered from Shopify product status, but after merchants change the parent product from Draft to Active through the Shopify Product editor intent, the configure UI keeps showing the stale loader value until a full page refresh.

## Progress Log
### 2026-06-05 20:06 - Investigation
- Confirmed FPB and PPB configure routes render status through `getParentProductStatusUi`.
- Found `openProductInAdmin` invokes `edit:shopify/Product` but does not revalidate the Remix loader after the merchant edits the Shopify product.
- Next steps: add route contract coverage for post-editor revalidation, wire revalidation after intent open and on Admin focus/visibility return, then run focused tests.

### 2026-06-05 20:07 - Revalidation wired
- Added route contract coverage requiring FPB and PPB `openProductInAdmin` to arm Shopify-backed status revalidation.
- Added `refreshParentProductStatusFromShopify` in both configure routes. It revalidates through Remix loader after the Product editor intent opens, and again on focus/visibility return from the Shopify editor workflow.
- Verification: `npx jest tests/unit/routes/parent-product-status-ui.test.ts --runInBand` passed 3 tests.

### 2026-06-05 20:19 - Completed verification before commit
- Verified the status revalidation contract in the combined modified-test set: `npx jest tests/unit/assets/bundle-widget-full-page-template-layout.test.ts tests/unit/lib/analytics-helpers.test.ts tests/unit/routes/fpb-addons-admin-layout.test.ts tests/unit/routes/fpb-addons-step-config-controls-parity.test.ts tests/unit/routes/fpb-bundle-settings-surface-contract.test.ts tests/unit/routes/fpb-save-bundle.test.ts tests/unit/services/widget-full-page-bundle.test.ts tests/unit/routes/fpb-addons-selected-products-modal.test.ts tests/unit/routes/fpb-configure-preview.test.ts tests/unit/services/widget-full-page-bundle-preview.test.ts tests/unit/routes/parent-product-status-ui.test.ts tests/unit/assets/bundle-widget-full-page-discount-display.test.ts --runInBand` passed 153 tests.
- Verified modified files with lint before commit.

## Related Documentation
- `docs/issues-prod/parent-product-status-ui-mismatch-1.md`
- `test-spec/parent-product-status-revalidate.spec.md`

## Phases Checklist
- [x] Phase 1: Add regression coverage for post-editor revalidation
- [x] Phase 2: Wire FPB and PPB Edit Product helpers to refresh Shopify-backed status
- [x] Phase 3: Focused tests and lint
