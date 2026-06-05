# Test Spec: FPB Add-ons Step Language Modal Parity
**Spec ID:** fpb-addons-step-language-modal-parity-1  **Issue:** [fpb-addons-step-language-modal-parity-1]  **Created:** 2026-06-05

## Purpose
Ensure the first Free Gift & Add Ons Multi Language modal, opened from Add-Ons and Gifting Step, keeps the rich EB modal layout as a dedicated parity surface.

## Test Cases
### Add-ons Step Rich Language Modal
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Step language action target | Click top Add-ons Multi Language | Modal target is `addon-step` | Separate from section/footer modals |
| 2 | Rich modal layout | Open top Add-ons Multi Language | Layout is `rich` | Shows EB helper headings |
| 3 | Step fields | Open top Add-ons Multi Language | Fields are Step Name=`Step Text` and Step Title=`Step Subtext` | EB first modal field defaults |
| 4 | Rich body headings | Inspect shared modal component | Rich body contains Translations, Choose language to edit, Custom Text, Text Settings | EB first modal structure |
| 5 | Rich save label | Inspect shared modal component | Primary action uses default `Save and Close` when no compact save label is supplied | EB first modal capitalization |

## Acceptance Criteria
- [x] Dedicated first-modal parity test passes.
- [x] Chrome verifies the first Add-ons Multi Language modal.
- [x] Slice is committed with `[fpb-addons-step-language-modal-parity-1]`.
