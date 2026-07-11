# Test Spec: PPB Product List Inventory Source
**Spec ID:** ppb-product-list-inventory-source  **Created:** 2026-07-11

## Purpose

Verify Product Page Bundle Product List product hydration follows EB storefront inventory semantics for true Storefront API unavailability without hiding zero-quantity variants only because their quantity is zero.

## Test Cases

### ProductPageProductDataMethods
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Grouped product with unavailable first variant | First variant has `available=false`; second variant has `available=true` | Product card chooses the available variant and variant selector data excludes the unavailable variant | EB omits true unavailable variants before customer selection. |
| 2 | Individual variants include unavailable and sellable variants | One variant has `available=false`; one has `available=true`, `quantityAvailable=0` | Only the true unavailable variant is omitted; the zero-quantity sellable variant remains in Product List data | Zero quantity alone is not the same as Storefront `availableForSale=false`. |

## Acceptance Criteria
- [x] Focused Product Page product-data tests pass.
- [x] No CSS, class-name, source-order, or visual-placement assertions are added.
