# Test Spec: FPB Add-ons Selected Products Modal
**Spec ID:** fpb-addons-selected-products-modal  **Issue:** [fpb-addons-selected-products-modal-1]  **Created:** 2026-06-05

## Purpose
Prevent the Add-ons selected-products modal from breaking when the merchant adds products from inside the modal.

## Test Cases
### Selected Products Modal Picker Stack
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Add Products is clicked inside selected-products modal | `handleAddonSelectedProductAdd(tierIndex, { reopenSelectedProductsModal: true })` | Selected-products modal is hidden before `shopify.resourcePicker` opens | Prevents modal-stack conflict |
| 2 | Resource picker returns selection from modal flow | Picker returns products | Tier products update and selected-products modal reopens for same tier | Keeps merchant in selected-products context |
| 3 | Main tier Add Products remains direct | Tier body Add Products button | Calls picker without selected-products modal reopen option | Existing primary flow unchanged |
| 4 | Selected-products modal Close is clicked | Footer Close button | Button uses Polaris `commandFor` and `command="--hide"` and the close handler hides the overlay | Prevents stuck modal |

## Acceptance Criteria
- [x] Focused source guard passes.
- [x] Chrome verifies picker selection no longer leaves an empty modal shell.
- [x] Modal still updates selected Add-ons products.
- [x] Chrome verifies footer Close dismisses the selected-products modal.
