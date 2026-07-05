# Test Spec: FPB Variant Option Normalization
**Spec ID:** fpb-variant-option-normalization  **Created:** 2026-07-03

## Purpose
Ensure FPB storefront product normalization preserves variant option names and values when Admin/runtime payloads contain Shopify `selectedOptions` instead of pre-flattened `option1`, `option2`, and `option3` fields.

## Test Cases
### FullPageProductProcessing
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Grouped multi-variant product from Admin payload | Product with `variants[].selectedOptions` and no `product.options` | Normalized product has `options` names and variants have `option1` / `option2` values | Required for Classic inline variant selector |

### CategoryRuntime
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Runtime compact product from saved Admin data | Product variants include `selectedOptions` but no `option1` fields or `options` list | Runtime product has compact `options` names and variants have `option1` / `option2`; raw `selectedOptions` is still stripped | Prevents metafield/proxy payloads from dropping selector data before the browser |

## Acceptance Criteria
- [x] All listed test cases pass
