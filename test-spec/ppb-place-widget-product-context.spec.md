# Test Spec: PPB Place Widget Product Context
**Spec ID:** ppb-place-widget-product-context  **Issue:** [eb-configure-completion-parity-1]  **Created:** 2026-06-01

## Purpose
Ensure PPB `Place Widget` opens Shopify Theme Editor on the merchant-selected template while previewing the actual bundle parent product.

## Test Cases
### PpbPlaceWidgetProductContext
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Parent product handle source | PPB configure route source | Theme Editor deep link uses `bundleProduct.handle` before `bundle.shopifyProductHandle` | Loader product node is the current Shopify source |
| 2 | Template and product context separation | Merchant selects any returned template | Selected template remains passed as `template`; product preview context comes from `pageProductHandle` | Avoids hardcoded template names or wrong product preview |
| 3 | Parent product template assignment | Merchant selects `product.custom` | Route posts `assignProductTemplate` before opening Theme Editor | Prevents Shopify preview from using the product's old/default template |
| 4 | Template suffix normalization | `product`, `product.custom` | `product` maps to `null`; custom template maps to `custom` | Shopify `templateSuffix` is suffix-only |
| 5 | Draft parent product preview context | Parent product has `onlineStorePreviewUrl` | Theme Editor deep link uses the preview URL path instead of `/products/{handle}` | Draft products can be previewed, but plain handle paths can fall back to another product |

## Acceptance Criteria
- [x] Focused route contract passes.
- [x] Scoped lint passes with 0 errors.
- [x] Chrome SIT smoke confirms Theme Editor URL includes `previewPath` for the bundle parent product.
