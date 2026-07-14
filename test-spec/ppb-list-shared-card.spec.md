# Test Spec: PPB List Shared Card
**Spec ID:** ppb-list-shared-card  **Issue:** waived-widget-refactor  **Created:** 2026-06-11

## Purpose

Verify the PPB List migration slice routes `PDP_INPAGE + CASCADE` product rows through the shared row-mode product-card primitive while preserving selection, variant selector, and disabled/stock behavior.

## Test Cases

### PPBListSharedCard

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | List in-page product rows | `renderInpageStepProducts()` source | Shared product-card renderer with row mode | Keeps `CASCADE` behavior during migration. |
| 2 | Selected and sold-out List rows | CASCADE step with one selected product and one out-of-stock product | Selected row renders quantity state; sold-out row renders a disabled add action | Covers current Product List shared-card behavior rather than source-string checks. |
| 3 | Variant selector change | Grouped Product List row changes from one variant to another | Product object, row `data-product-id`, current variant marker, visible price, image, and child action ids update to the selected variant | Matches EB's inline variant selector behavior. |

## Acceptance Criteria

- [x] PPB List product rows route through `renderSharedProductCard()`.
- [x] Shared card uses row mode and preserves Product List interaction behavior.
- [x] Disabled add/increase and stock badge state are preserved.
- [x] Focused behavior test covers selected quantity state and sold-out add-action disabling.
- [x] Focused behavior test covers Product List variant selector state and visible price sync.
