# Test Spec: PPB Hide Out Of Stock Products
**Spec ID:** ppb-hide-out-of-stock-products  **Created:** 2026-07-16

## Purpose

Verify PPB product normalization follows the saved Product Page `hideOutOfStockProducts` control for unavailable Storefront variants.

## Test Cases

### ProductPageProductDataMethods

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Hide OOS disabled keeps unavailable variants in grouped product selector | Grouped product with one available variant and two `available:false` variants; `hideOutOfStockProducts=false` | Product card remains on the first sellable variant, but its `variants` list includes all three variants with unavailable flags preserved | Mirrors EB Product Grid false-state evidence where `Massage Oil` showed `Grapefruit`, `Pepper`, and `Rosemary` |
| 2 | Existing hide/default behavior still filters unavailable variants | Existing product-processing tests with default controls | Existing expectations still pass | Prevents regression of current true/default behavior |

## Acceptance Criteria

- [ ] The new false-state product-processing test fails before implementation.
- [ ] The new and existing product-page product-processing tests pass after implementation.
- [ ] Raw PPB widget source passes syntax check.
- [ ] Widget bundle is rebuilt because PPB widget source changed.
