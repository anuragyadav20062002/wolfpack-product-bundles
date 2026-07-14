# Test Spec: PPB Grid Shared Card
**Spec ID:** ppb-grid-shared-card  **Issue:** waived-widget-refactor  **Created:** 2026-06-11

## Purpose

Verify the PPB Grid migration slice routes `PDP_INPAGE + COGNIVE` cards through the shared grid-mode product-card primitive without removing disabled and stock states.

## Test Cases

### PPBGridSharedCard

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Grid in-page product cards | `renderInpageStepProducts()` source | Shared product-card renderer with grid mode | Keeps existing `COGNIVE` data/classes during migration. |
| 2 | Grid description disabled | Product with description and `description: ""` option | Shared card output contains no description markup or text | Cognive cards do not display merchant product descriptions. |

## Acceptance Criteria

- [x] PPB Grid product cards route through `renderSharedProductCard()`.
- [x] Shared card keeps Grid mode and legacy Grid class.
- [x] Disabled add/increase and stock badge state are preserved.
- [x] Cognive Grid cards omit product descriptions.
