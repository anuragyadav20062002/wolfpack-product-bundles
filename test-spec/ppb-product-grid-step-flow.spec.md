# Test Spec: PPB Product Grid Step Flow
**Spec ID:** ppb-product-grid-step-flow  **Created:** 2026-07-13

## Purpose

Ensure multi-step Product Grid renders one active step at a time, matching the
live EB `PDP_INPAGE + COGNIVE` flow instead of stacking every step grid.

## Test Cases

### ProductGridStepFlow

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Multi-step Product Grid | In-page, Grid, two steps | Active-step flow enabled | Live EB contract |
| 2 | Single-step Product Grid | In-page, Grid, one step | Active-step flow disabled | No redundant navigation |
| 3 | Modal template | Modal, non-Grid, two steps | Active-step flow disabled | Isolation guard |

## Acceptance Criteria

- [x] Multi-step Product Grid uses the active-step navigation flow.
- [x] Single-step Grid and modal templates retain their existing behavior.
- [x] Product-page widget assets are rebuilt after the implementation.
