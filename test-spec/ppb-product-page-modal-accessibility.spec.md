# Test Spec: PPB Product Page Modal Accessibility
**Spec ID:** ppb-product-page-modal-accessibility  **Created:** 2026-07-13

## Purpose
Validate keyboard-first and focus-visible behavior for the PPB modal shell so core controls remain accessible and user focus returns after modal close.

## Test Cases
### PPBProductPageModalAccessibility
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Open modal focus handoff | `openModal()` when trigger control previously held focus | First modal control (close button) receives focus and open-state focus origin is captured | Confirms keyboard entry path from product page shell to modal controls |
| 2 | Close modal focus return | Modal is closed after open via `closeModal()` | Focus is restored to the element that was active before open | Prevents keyboard focus loss |
| 3 | Keyboard navigation while modal open | Document `keydown` for Escape / ArrowLeft / ArrowRight | Escape closes modal and arrows trigger prev/next handlers | Provides core keyboard parity for modal shell controls |

## Acceptance Criteria
- [ ] Modal captures and restores focus safely across open/close.
- [ ] Keyboard shortcuts route to core modal actions (close, previous, next).
- [ ] No hard assumptions about viewport are used in modal access control.
