# Test Spec: PPB Product Grid Interaction Parity
**Spec ID:** ppb-product-grid-interaction-parity  **Created:** 2026-07-13

## Purpose

Protect the live Product Grid behavior that differs from Product List and modal
templates: accordion step placement, selected-card copy, and validation feedback.

## Test Cases

### ProductGridInteractionParity

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Selected product card | Quantity two, Grid selected action | `Added x2`; no increment/decrement controls | Matches live EB COGNIVE |
| 2 | Active middle step | Three steps, current index one | Active body follows Step 2 header | Accordion ordering |
| 3 | Incomplete Grid step | Intermediate Grid CTA | CTA remains activatable | Allows validation feedback |
| 4 | Incomplete non-Grid step | Intermediate non-Grid CTA | CTA remains disabled | Isolation guard |

## Acceptance Criteria

- [x] Product Grid selected cards use quantity-aware Added copy.
- [x] Product Grid renders all step headers with only the active body expanded.
- [x] An incomplete intermediate Product Grid CTA can surface validation feedback.
- [x] Other template CTA behavior is unchanged.
