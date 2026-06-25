# Test Spec: FPB Standard Quantity Selector
**Spec ID:** fpb-standard-quantity-selector  **Created:** 2026-06-25

## Purpose
Ensure the FPB Standard product-card quantity selector decrements the selected quantity using the clicked control's selection key.

## Test Cases
### FpbStandardQuantitySelector
| # | Scenario | Input | Expected Output | Notes |
|---|----------|-------|-----------------|-------|
| 1 | Minus button is clicked after selected variant key differs from captured product object | Click `.qty-decrease[data-product-id="variant-clicked"]`; selected quantity is stored under `variant-clicked` | Calls `updateProductSelection(stepIndex, "variant-clicked", 1)` | Regression guard for Standard shared product card DOM/data drift. |
| 2 | Plus button is clicked with the same key mismatch | Click `.qty-increase[data-product-id="variant-clicked"]`; selected quantity is stored under `variant-clicked` | Calls `updateProductSelection(stepIndex, "variant-clicked", 3)` | Keeps increment and decrement key handling symmetric. |

## Acceptance Criteria
- [x] Listed test cases pass
- [x] FPB widget source and bundled asset are rebuilt
