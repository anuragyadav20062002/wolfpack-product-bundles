# Test Spec: FPB Add-ons Language Modal Parity
**Spec ID:** fpb-addons-language-modal-parity-1  **Issue:** [fpb-addons-language-modal-parity-1]  **Created:** 2026-06-05

## Purpose
Ensure the Free Gift & Add Ons step uses EB-style compact Multi Language modal variants without coupling compact modal parity to the Add-ons Step rich modal or card layout slice.

## Test Cases
### Add-ons Compact Multi Language Modal Variants
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Add-ons Section Multi Language modal | Click section Multi Language | Compact modal shows Select Language, Add on Section title, and Tier#1 Title | No rich helper headings |
| 2 | Footer Multi Language modal | Click Footer Multi Language | Compact modal shows Select Language, Tier 1 heading, Message when rule not met, Success Message | No rich helper headings |
| 3 | Compact modal action text | Save compact modal | Primary action reads `Save and close` | EB compact capitalization |

## Acceptance Criteria
- [x] Dedicated compact modal parity test passes.
- [x] Chrome verifies compact Add-ons Section and Footer Messaging Multi Language modals.
- [x] First Add-ons Step language modal is tracked separately under `fpb-addons-step-language-modal-parity-1`.
