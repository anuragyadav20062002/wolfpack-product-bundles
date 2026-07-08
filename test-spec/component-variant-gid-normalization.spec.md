# Test Spec: Component Variant GID Normalization
**Spec ID:** component-variant-gid-normalization  **Created:** 2026-07-07

## Purpose
Ensure component product metafield sync writes Shopify `component_parents` to valid ProductVariant GIDs even when cached bundle product variants are stored as numeric IDs.

## Test Cases
### ComponentVariantMetafields
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Cached StepProduct variants are numeric | Variants `51659604984106` and `51658221388074` | `ownerId` and `component_reference.value` use `gid://shopify/ProductVariant/...` | Cart Transform can read `$app:component_parents` on selected variants |
| 2 | Fixed bundle pricing is configured | `fixed_bundle_price` rule with `fixedBundlePrice: 770` | `price_adjustment` keeps method, value, and quantity condition | Keeps real merchant fixed-price bundles discountable after MERGE |

## Acceptance Criteria
- [x] Numeric cached variant IDs are normalized before metafield writes.
- [x] Existing component-product metafield sync tests pass.
- [x] Cart Transform input query still validates against Shopify schema.
- [x] Rust Cart Transform tests still pass.

