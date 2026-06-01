# Test Spec: Bundle Product Edit Product Admin Modal
**Spec ID:** bundle-product-edit-product-admin-modal  **Issue:** [eb-configure-completion-parity-1]  **Created:** 2026-06-01

## Purpose
Lock FPB and PPB Bundle Product `Edit Product` behavior to EB parity: App Bridge should invoke Shopify's native product editor intent before falling back to full Admin product navigation.

## Test Cases
### BundleProductEditProductAdminNavigation
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | PPB Edit Product navigation | PPB configure route source | `openProductInAdmin` invokes `edit:shopify/Product` with `gid://shopify/Product/{id}` and keeps Admin URL fallback | Matches EB native Admin product editor flow |
| 2 | FPB Edit Product navigation | FPB configure route source | `openProductInAdmin` invokes `edit:shopify/Product` with `gid://shopify/Product/{id}` and keeps Admin URL fallback | Matches EB native Admin product editor flow |

## Acceptance Criteria
- [x] Focused route source contract passes.
- [x] Chrome EB evidence shows native Shopify product editor modal.
- [x] Chrome WPB PPB evidence shows native Shopify product editor workflow.
- [x] Chrome WPB FPB evidence shows native Shopify product editor workflow.
