# Test Spec: FPB Slot Icon Change Icon
**Spec ID:** fpb-slot-icon-change-icon  **Issue:** [eb-configure-completion-parity-1]  **Created:** 2026-06-01

## Purpose
Ensure FPB configure Bundle Settings → Slot Icon opens the icon picker in place instead of redirecting merchants to Step Setup.

## Test Cases
### FPBConfigureRoute
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Change Icon click | Merchant clicks Bundle Settings → Slot Icon → Change Icon | Toggles `showIconPickerForStep` for `settingsStep.id`; does not call `handleSectionChange("step_setup")` | Fixes reported redirect |
| 2 | Slot Icon persistence | Merchant picks or resets icon | Route writes `stepImage` through existing step update flow | Reuses Step Config image persistence contract |

## Acceptance Criteria
- [ ] Focused Slot Icon route contract passes.
- [ ] Scoped ESLint passes with zero errors.
- [ ] Chrome smoke confirms Change Icon stays on Bundle Settings and opens the picker.
