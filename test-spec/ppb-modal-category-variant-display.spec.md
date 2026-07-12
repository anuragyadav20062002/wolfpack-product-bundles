# Test Spec: PPB Modal Category Variant Display
**Spec ID:** ppb-modal-category-variant-display  **Created:** 2026-07-13

## Purpose
Ensure PPB modal product cards honor the active category's variant-display configuration.

## Test Cases
### ProductPageModalMethods
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Grouped variants | Active category has `displayVariantsAsIndividualProducts: false` | Modal renders the grouped product data without expanding variants | Matches EB grouped selector behavior |
| 2 | Individual variants | Active category has `displayVariantsAsIndividualProducts: true` | Modal expands variants before rendering | Preserves the supported individual-card mode |

## Acceptance Criteria
- [ ] The active category controls modal variant expansion.
- [ ] Grouped products retain their variant selector.
- [ ] Individual-variant categories retain separate variant cards.
- [ ] Focused unit tests and direct Chrome DevTools verification pass.
