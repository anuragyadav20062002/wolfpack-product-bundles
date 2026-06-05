# Test Spec: FPB Summary Selected Product Images
**Spec ID:** fpb-summary-selected-product-images  **Issue:** [fpb-summary-selected-product-images-1]  **Created:** 2026-06-06

## Purpose
Ensure FPB selected-product summary slots render real product images for product-level, variant-level, and Shopify image-object data shapes.

## Test Cases
### FullPageSelectedSummaryImages
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Desktop side panel selected slot receives Shopify image object | Selected item with `image: { src }` and no `imageUrl` | Rendered `img src` uses the nested `src` URL | Covers object shape from variant/product payloads |
| 2 | Mobile compact summary selected row receives variant image | Selected item with `variantImage` and product fallback | Rendered `img src` uses the variant image | Variant-as-individual products should keep variant artwork |
| 3 | Legacy expandable footer selected rows receive same normalization | Selected item without `imageUrl` but with image object | Panel and thumb strip use normalized URL instead of placeholder | Keeps non-sidebar FPB footer path covered |
| 4 | Sidebar discount prompt has no trailing bang | `Add 2 product(s) to save 10%!` | Summary sidebar renders `Add 2 product(s) to save 10%` | User-requested copy cleanup |

## Acceptance Criteria
- [x] Summary image source resolution supports string and object image shapes.
- [x] Desktop side panel, mobile compact summary, legacy footer panel, and footer thumb strip use the shared resolver.
- [x] Sidebar discount prompt removes only the trailing exclamation mark.
- [x] Focused test passes after implementation.
