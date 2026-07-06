# Test Spec: FPB Runtime Inventory Refresh
**Spec ID:** fpb-runtime-inventory-refresh  **Created:** 2026-07-06

## Purpose
Verify full-page storefront product loading refreshes runtime inventory for enriched saved products when inventory tracking is enabled.

## Test Cases
### FullPageProductProcessingMethods
| # | Scenario | Input | Expected Output | Notes |
| 1 | Enriched saved StepProduct has stale availability while Storefront API reports tracked zero stock | `trackInventoryOnAddToCart=true`, enriched product with description, API variant `quantityAvailable=0`, `currentlyNotInStock=false` | Product is omitted from `stepProductData` and API is called | Prevents blocked-OOS products rendering as addable |
| 2 | Saved category product has stale availability while Storefront API reports tracked zero stock | `trackInventoryOnAddToCart=true`, category product ID, API variant `quantityAvailable=0`, `currentlyNotInStock=false` | Product is omitted from `stepProductData` and API is called | Matches the Classic same-shape fixture |
| 3 | Product grid expands variant cards after loading | `trackInventoryOnAddToCart=true`, grouped product with one tracked zero-stock variant and one backorderable zero-stock variant | Hard-OOS variant is omitted; backorderable variant remains with inventory metadata | Prevents category render from reintroducing blocked variants |
| 4 | Runtime inventory was fetched but stale category card lacks inventory fields | Variant card has only `id` and `available=true`; runtime inventory map says `quantityAvailable=0`, `currentlyNotInStock=false` | Variant is treated as not selectable | Covers live category DTO fallback |

## Acceptance Criteria
- [ ] Focused Jest test passes
