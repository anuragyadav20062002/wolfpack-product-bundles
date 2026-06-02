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

## Acceptance Criteria
- [x] Focused route contract passes.
- [x] Scoped lint passes with 0 errors.
- [x] Chrome SIT smoke confirms Theme Editor URL includes `previewPath` for the bundle parent product.
