# Test Spec: Parent Product Status UI Mismatch
**Spec ID:** parent-product-status-ui-mismatch  **Issue:** [parent-product-status-ui-mismatch-1]  **Created:** 2026-06-04

## Purpose
Ensure the Admin configure UI mirrors Shopify parent product status instead of labeling all non-active states as `Unlisted`.

## Test Cases
### ParentProductStatusUi
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB parent product is Draft | FPB route source | Status card can render `Draft` | Fresh bundle default status |
| 2 | PPB parent product is Draft | PPB route source | Status card can render `Draft` | Fresh bundle default status |
| 3 | FPB parent product is Draft | FPB route source | `UnlistedBundleBanner` only gates on `unlisted` | Draft should not show unlisted warning |
| 4 | PPB parent product is Draft | PPB route source | `UnlistedBundleBanner` only gates on `unlisted` | Draft should not show unlisted warning |
| 5 | Parent product is Unlisted | FPB and PPB route source | `Unlisted` label and warning path remain available | Preserve campaign visibility behavior |

## Acceptance Criteria
- [x] Red tests fail against the current non-active-as-unlisted UI.
- [x] Focused tests pass after implementation.
- [x] ESLint has zero errors for changed files.
- [x] No widget build required because storefront widget assets are not changed.
