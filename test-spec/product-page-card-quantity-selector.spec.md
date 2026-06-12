# Test Spec: Product Page Card Quantity Selector
**Spec ID:** product-page-card-quantity-selector  **Created:** 2026-06-12

## Purpose

Verify PPB product cards keep the same selected-card quantity selector behavior as FPB when the product is added from a compact/shared card surface.

## Test Cases

### ProductPageSelectionMethods
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Shared PPB card is selected | Shared product card with only an add button, `quantity = 2` | Runtime removes the add button and appends an inline quantity control with the current quantity | Covers Grid/Cascade shared-card surfaces |
| 2 | Shared PPB quantity button is clicked | Click target has `inline-qty-btn qty-increase` classes | Delegated handler treats it as a quantity control | Prevents rendered selector from being inert |

## Acceptance Criteria

- [ ] Selected PPB product cards render a functional quantity selector without requiring a full re-render.
- [ ] The test verifies behavior and state, not visual placement or CSS values.
