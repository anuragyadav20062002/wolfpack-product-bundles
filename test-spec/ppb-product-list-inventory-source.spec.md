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

### Storefront product APIs
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 3 | Sellable zero-quantity direct product variant | `availableForSale=true`, `quantityAvailable=0`, `currentlyNotInStock=false` | API response sets `quantityAvailable=null` and keeps `available=true` | Shopify can return zero quantity for untracked sellable variants. |
| 4 | Sellable zero-quantity collection product variant | `availableForSale=true`, `quantityAvailable=0`, `currentlyNotInStock=false` | API response sets `quantityAvailable=null` and keeps `available=true` | Collection-backed Product List data follows direct-product semantics. |
| 5 | True unavailable zero-quantity variant | `availableForSale=false`, `quantityAvailable=0` | API response keeps `quantityAvailable=0` and `available=false` | True sold-out variants remain unavailable. |
| 6 | Product with multiple variants and optional selling plan allocation data | All-variants Storefront query returns variants `6` and `7`; selling plan allocation fields are available only when `unauthenticated_read_selling_plans` is granted; Shopify may also return inventory access-denied errors with usable variant data | API response includes both variants, skips selling plan allocation fields without scope, and derives allocation `id` from `sellingPlan.id` when scope exists | Storefront `SellingPlanAllocation` has no `id` field; usable partial data must not fall back to one variant. |

## Acceptance Criteria
- [x] Focused Product Page product-data tests pass.
- [x] Storefront product API tests pass.
- [x] No CSS, class-name, source-order, or visual-placement assertions are added.
