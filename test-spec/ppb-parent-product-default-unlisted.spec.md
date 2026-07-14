# Test Spec: PPB Parent Product Default Unlisted
**Spec ID:** ppb-parent-product-default-unlisted  **Created:** 2026-07-12

## Purpose
Ensure Product Page Bundle parent products follow EB's parent-product visibility contract: automatically created parent products start as Shopify `UNLISTED`, show the unlisted troubleshooting description, and remain previewable even when local status tracking is unavailable.

## Test Cases
### PpbParentProductCreation
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | First PPB parent product creation | PPB bundle has no `shopifyProductId` | `productCreate` uses `status: "UNLISTED"` | Matches EB direct-link-only default |
| 2 | First PPB parent product description | PPB bundle has no `shopifyProductId` | `descriptionHtml` includes `Your Bundle is Unlisted` and discoverability instructions | Merchant sees why the product is hidden from collections/search |
| 3 | First PPB parent product post-create status | Created PPB parent for an active bundle | No immediate `UpdateProductStatus` call sets the product back to `ACTIVE` | Prevents first-create activation drift |

### PpbPreviewUrl
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Untracked status with Shopify preview URL | `bundleStatus: "untracked"` and `onlineStorePreviewUrl` | Uses the Shopify preview URL | Draft/untracked products still preview |
| 2 | Untracked status with only handle | `bundleStatus: "untracked"` and product handle | Constructs `/products/{handle}` direct URL | Direct preview still works when Shopify does not return a preview URL |

## Acceptance Criteria
- [x] Focused PPB sync product tests pass.
- [x] Focused PPB preview URL tests pass.
- [x] Existing unlisted description helper test remains green.
