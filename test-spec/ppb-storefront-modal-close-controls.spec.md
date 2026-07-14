# Test Spec: PPB Storefront Modal Close Controls
**Spec ID:** ppb-storefront-modal-close-controls  **Created:** 2026-07-13

## Purpose
Ensure every rendered PPB storefront picker close control closes the modal.

## Test Cases
### ProductPageWidgetMiscMethods
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Attach modal close handlers | Desktop and mobile close buttons are rendered | Clicking either button calls `closeModal` | Covers responsive controls without asserting styling or placement |

## Acceptance Criteria
- [ ] Both modal close controls invoke the shared close behavior.
- [ ] Focused unit tests pass.
- [ ] Direct Chrome DevTools verification confirms the mobile control closes the live picker.
