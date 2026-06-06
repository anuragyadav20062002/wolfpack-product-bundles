# Test Spec: Product Page Template Modal Close
**Spec ID:** product-page-template-modal-close  **Issue:** [eb-configure-completion-parity-1]  **Created:** 2026-06-01

## Purpose
Ensure the PPB Select Product Page Template modal closes reliably through the native Polaris close button, backdrop, Escape, and programmatic selection close paths.

## Test Cases
### ModalUtils
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Native modal close events | `dismiss`, `hide`, `close`, `afterhide` | Shared listener calls the route close handler and removes every listener on cleanup | Covers s-modal close button event variance |
| 2 | Native close click fallback | Built-in `s-modal` close button click | Shared listener falls back to a guarded close-button click path | Keeps other Admin modals resilient |

### PPBConfigureRoute
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Product template selector close | `isPageSelectionModalOpen=true` | Route renders a controlled `role=dialog` with backdrop and X button wired to `closePageSelectionModal` | Avoids the non-closing `s-modal` wrapper for this selector |

## Acceptance Criteria
- [ ] Focused modal close source-contract tests pass.
- [ ] Scoped ESLint passes with zero errors.
- [ ] Chrome smoke confirms the Select Product Page Template modal closes from the X button after opening.
