# Test Spec: Product-Level Inventory Tracking
**Spec ID:** product-level-inventory-tracking  **Created:** 2026-07-02

## Purpose

Match EB's product-level inventory toggle behavior for FPB and PPB storefront widgets. The global Settings > Additional Configurations toggle controls whether live `quantityAvailable` should block zero-stock child products during bundle building, while preserving the existing unbounded behavior when inventory scope is absent or the toggle is disabled.

## Test Cases

### FullPageInventoryTracking

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Toggle enabled, tracked zero stock | Product `available=true`, `quantityAvailable=0`, `currentlyNotInStock=false` | FPB treats product as out of stock | Matches EB product-level tracking on add-to-cart. |
| 2 | Toggle disabled, tracked zero stock | Same product with control disabled | FPB does not treat product as out of stock | Preserves existing Standard stock-gate fix for stores without the toggle. |
| 3 | Toggle enabled, backorderable zero stock | Product `quantityAvailable=0`, `currentlyNotInStock=true` | FPB does not block | Shopify marks this as sellable/backorderable. |
| 4 | Toggle disabled, positive tracked stock | Product `quantityAvailable=2` with control disabled | FPB returns no stock cap | The merchant did not opt into storefront inventory quantity enforcement. |

### ProductPageInventoryTracking

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Toggle enabled, tracked zero stock | Product `available=true`, `quantityAvailable=0`, `currentlyNotInStock=false` | PPB `getVariantAvailable` returns `outOfStock=true` | Same EB global toggle behavior. |
| 2 | Toggle disabled, tracked zero stock | Same product with control disabled | PPB `getVariantAvailable` returns `outOfStock=false` | Prevents product-page bundles from blocking zero-stock Storefront data unless merchant enables the EB toggle. |
| 3 | Toggle disabled, positive tracked stock | Product `quantityAvailable=2` with control disabled | PPB returns no stock cap | Prevents quantity clamping unless the toggle is enabled. |
| 4 | Variant selector option with tracking disabled | Variant `available=true`, `quantityAvailable=0`, `currentlyNotInStock=false` | PPB keeps option enabled | Modal dropdown should follow the same opt-in rule as card quantity controls. |
| 5 | Variant selector option with tracking enabled | Same variant with control enabled | PPB disables option | Hard zero-stock tracked variants are blocked only after opt-in. |
| 6 | Backorderable variant option with tracking enabled | Variant `quantityAvailable=0`, `currentlyNotInStock=true` | PPB keeps option enabled | Backorderable zero-stock variants remain sellable. |

### CollectionInventoryPayload

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Collection endpoint with inventory scope | Offline session includes `unauthenticated_read_product_inventory`; collection variant has `quantityAvailable=0`, `currentlyNotInStock=false` | API requests and returns those fields | FPB collection-sourced products must follow the same toggle logic as manual products. |
| 2 | Collection endpoint without inventory scope | Offline session lacks inventory scope | API omits inventory-only fields and maps missing quantity to `null` | Prevents Storefront API access-denied errors on shops without the scope. |

## Acceptance Criteria

- [x] The new tests fail before implementation.
- [x] The new tests pass after implementation.
- [x] No CSS, class-name, source-order, or visual-placement assertions are added.
