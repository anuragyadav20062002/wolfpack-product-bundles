# Test Spec: Create Wizard Contextual Save Bar
**Spec ID:** create-wizard-contextual-savebar  **Issue:** [eb-configure-completion-parity-1]  **Created:** 2026-06-01

## Purpose
Prove the bundle creation wizard uses the contextual SaveBar for persistence and no longer saves implicitly from the Next button.

## Test Cases
### CreateWizardContextualSaveBar
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Dirty wizard page renders SaveBar | Route source | SaveBar import, dirty-state open binding, Save and Discard handlers exist | Source contract for App Bridge wiring |
| 2 | Next button is navigation-only | Route source | `handleNext` gates unsaved changes and does not submit any save fetcher | Prevents regression to save-on-next |

## Acceptance Criteria
- [ ] SaveBar appears when the current wizard page differs from its saved baseline.
- [ ] Save saves only the current wizard page and stays on that page.
- [ ] Discard restores the current wizard page to its saved baseline.
- [ ] Next does not save; it advances only when the current page is clean.
