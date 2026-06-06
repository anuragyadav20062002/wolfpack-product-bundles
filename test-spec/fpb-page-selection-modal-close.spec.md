# Test Spec: FPB Page Selection Modal Close
**Spec ID:** fpb-page-selection-modal-close  **Issue:** [eb-configure-completion-parity-1]  **Created:** 2026-06-01

## Purpose
Ensure the FPB page/template selector does not depend on `s-modal` close events and can always be closed through app-owned React state.

## Test Cases
### FPBPageSelectionModalCloseContract
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Modal surface implementation | FPB configure route source | Page selector renders behind `isPageSelectionModalOpen &&` with `role="dialog"` and no `pageSelectionModalRef` | Prevents stale `s-modal` close state |
| 2 | Close interactions | FPB configure route source | Backdrop and gray X button call the page-selection close handlers directly | Covers user-reported non-closing modal |

## Acceptance Criteria
- [x] Controlled dialog contract is present
- [x] Close button and backdrop are wired directly to app state
