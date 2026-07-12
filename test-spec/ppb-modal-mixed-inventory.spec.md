# Test Spec: PPB Modal Mixed Inventory
**Spec ID:** ppb-modal-mixed-inventory  **Created:** 2026-07-13

## Purpose
Ensure the PPB modal preserves customer-visible identity after unavailable variants are filtered.

## Test Cases
### ModalVariantDisplay
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | One sellable survivor | Product had multiple source variants but retains one named variant | Return that variant title for plain-text rendering | Matches EB `Grapefruit` behavior |
| 2 | Default-only product | Product has one default variant | Return no extra label | Avoids redundant `Default Title` copy |
| 3 | Normal single-variant product | Product never had multiple source variants | Return no extra label | Label is specific to inventory-filtered identity |

## Acceptance Criteria
- [ ] Unavailable variants remain omitted.
- [ ] A fully unavailable product remains omitted.
- [ ] The sole sellable surviving variant is visible without a selector.
- [ ] Focused unit tests and direct Chrome DevTools verification pass.
