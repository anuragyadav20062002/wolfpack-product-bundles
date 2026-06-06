# Test Spec: Parent Product Status Revalidation
**Spec ID:** parent-product-status-revalidate  **Issue:** [parent-product-status-revalidate-1]  **Created:** 2026-06-05

## Purpose
Keep the Bundle Product status badge synchronized with Shopify after merchants edit the parent product through the native Shopify product editor intent.

## Test Cases
### ProductEditorRevalidation
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | FPB Edit Product intent opens | FPB configure route source | Product editor helper schedules loader revalidation | Badge should refresh without manual page reload |
| 2 | PPB Edit Product intent opens | PPB configure route source | Product editor helper schedules loader revalidation | Same behavior across bundle types |
| 3 | Merchant returns from product editor | Visibility/focus event | Loader revalidates once and removes listeners | Captures modal close / focus-return workflow |
| 4 | Intent falls back to Admin URL | Intent failure path | Same revalidation hook is still armed | New tab/full page fallback can still update on focus return |

## Acceptance Criteria
- [ ] `openProductInAdmin` in both configure routes arms a Shopify-status revalidation after editor open.
- [ ] The revalidation uses Remix loader revalidation, not local status guessing.
- [ ] Focused route contract tests pass.
