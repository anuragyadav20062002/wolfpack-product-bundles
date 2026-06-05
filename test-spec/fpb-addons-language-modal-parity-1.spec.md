# Test Spec: FPB Add-ons Language Modal Parity
**Spec ID:** fpb-addons-language-modal-parity-1  **Issue:** [fpb-addons-language-modal-parity-1]  **Created:** 2026-06-05

## Purpose
Ensure the Free Gift & Add Ons step uses three distinct EB-style Multi Language modal variants without coupling the modal parity work to the Add-ons card layout slice.

## Test Cases
### Add-ons Multi Language Modal Variants
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Add-ons Step Multi Language modal | Click top Multi Language | Rich modal shows Translations, Choose language to edit, Custom Text, Text Settings, Step Name=`Step Text`, Step Title=`Step Subtext` | EB first modal shape |
| 2 | Add-ons Section Multi Language modal | Click section Multi Language | Compact modal shows Select Language, Add on Section title, and Tier#1 Title | No rich helper headings |
| 3 | Footer Multi Language modal | Click Footer Multi Language | Compact modal shows Select Language, Tier 1 heading, Message when rule not met, Success Message | No rich helper headings |
| 4 | Compact modal action text | Save compact modal | Primary action reads `Save and close` | EB compact capitalization |
| 5 | Rich modal action text | Save rich modal | Primary action keeps `Save and Close` | Existing shared rich modal behavior |

## Acceptance Criteria
- [x] Dedicated modal parity test passes.
- [x] Chrome verifies all three Add-ons Multi Language modals.
- [x] Modal parity changes are tracked under `fpb-addons-language-modal-parity-1`.
