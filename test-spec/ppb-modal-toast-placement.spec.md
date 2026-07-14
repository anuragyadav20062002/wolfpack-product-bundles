# Test Spec: PPB Modal Validation Toast Placement
**Spec ID:** ppb-modal-toast-placement  **Created:** 2026-07-13

## Purpose

Keep Horizontal and Vertical Slots validation feedback body-mounted and
dismissible so the toast can use EB's viewport-bottom placement with its close
affordance.

## Test Cases

### ProductPageModalValidationToast

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Modal rule validation | Modal toast options | Dismissible modal class with no container | Body ownership |

## Acceptance Criteria

- [x] Modal validation toasts are dismissible.
- [x] Modal validation toasts use the modal parity class.
- [x] Modal validation toasts do not provide a sheet container.
