# Test Spec: FPB Clear Cart Confirmation
**Spec ID:** fpb-clear-cart-confirmation  **Created:** 2026-06-12

## Purpose
Verify that the full-page bundle clear-cart action opens a confirmation dialog on desktop and mobile, preserves selections when dismissed, and uses the existing clear/reset behavior only after confirmation.

## Test Cases
### ClearCartConfirmationMethods
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Open confirmation | Widget with selected products and fake DOM | Dialog is appended and marked open without mutating selections | Covers shared desktop/mobile entry point |
| 2 | Cancel confirmation | Open dialog, click cancel | Dialog closes and selections remain unchanged | Dismiss path |
| 3 | Confirm clear | Open dialog, click Clear Cart | Selections reset per step, current step resets to 0, transient filters clear, render hook runs | Existing clear behavior is preserved |

## Acceptance Criteria
- [x] All listed test cases pass
- [x] Desktop sidebar Clear uses the shared confirmation
- [x] Mobile summary Clear uses the shared confirmation
- [x] Widget source builds and minified assets are refreshed
