# Test Spec: UnlistedBundleBanner

**Spec ID:** unlisted-bundle-banner  **Issue:** [feedback-jun26-6]  **Created:** 2026-05-29

## Purpose

`UnlistedBundleBanner` warns merchants that the bundle's parent product is Unlisted and provides a `Manage` action so they can flip Status to Active. The configure route supplies the same App Bridge navigation callback used by the Bundle Product card's `Edit Product` button.

Helper `buildShopifyProductAdminUrl(shop, productId)` extracts the numeric product id from a GID like `gid://shopify/Product/12345` and returns `https://admin.shopify.com/store/{store-name}/products/12345`.

## Test Cases

### buildShopifyProductAdminUrl

| # | Scenario | Input | Expected Output |
|---|---|---|---|
| 1 | Full GID + .myshopify shop | `("s.myshopify.com", "gid://shopify/Product/12345")` | `https://admin.shopify.com/store/s/products/12345` |
| 2 | Bare numeric id | `("s.myshopify.com", "12345")` | `https://admin.shopify.com/store/s/products/12345` |
| 3 | Shop without .myshopify.com | `("my-store", "gid://shopify/Product/12345")` | `https://admin.shopify.com/store/my-store/products/12345` |
| 4 | Null productId | `("s.myshopify.com", null)` | `null` |
| 5 | Empty productId | `("s.myshopify.com", "")` | `null` |

### UnlistedBundleBanner render contract

| # | Scenario | Assertion |
|---|---|---|
| 6 | `productId = null` → component returns null | `container.innerHTML === ""` |
| 7 | `productId = "gid://shopify/Product/12345"` → banner mounts | rendered HTML contains "Your bundle is Unlisted" + CTA label "Manage" |
| 8 | CTA clicked | supplied `onManage` callback runs instead of opening a new tab directly |
| 9 | FPB + PPB configure routes render banner | both routes pass their existing `openProductInAdmin` navigation through `onManage` |

## Acceptance Criteria

- [x] All 9 test cases pass
- [x] Helper is pure
- [x] No competitor keywords in source
