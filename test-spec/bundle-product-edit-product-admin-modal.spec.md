# Test Spec: Bundle Product Edit Product Admin Modal
**Spec ID:** bundle-product-edit-product-admin-modal  **Issue:** [eb-configure-completion-parity-1]  **Created:** 2026-06-01

## Purpose
Lock FPB and PPB Bundle Product `Edit Product` behavior to EB parity: App Bridge navigation should open Shopify's native Admin product editor modal instead of a host-specific new tab.

## Test Cases
### BundleProductEditProductAdminNavigation
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | PPB Edit Product navigation | PPB configure route source | `openProductInAdmin` uses `shopify.navigate(adminProductUrl)` and has no `trycloudflare.com` branch | Matches EB native Admin modal flow |
| 2 | FPB Edit Product navigation | FPB configure route source | `openProductInAdmin` uses `shopify.navigate(adminProductUrl)` and has no `trycloudflare.com` branch | Matches EB native Admin modal flow |

## Acceptance Criteria
- [x] Focused route source contract passes.
- [x] Chrome EB evidence shows native Shopify product editor modal.
- [x] Chrome WPB PPB evidence shows native Shopify product editor modal or has a documented blocker.
- [x] Chrome WPB FPB evidence shows native Shopify product editor modal or has a documented blocker.
