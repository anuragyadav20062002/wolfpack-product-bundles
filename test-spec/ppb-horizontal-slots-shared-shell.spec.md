# Test Spec: PPB Horizontal Slots Shared Shell
**Spec ID:** ppb-horizontal-slots-shared-shell  **Issue:** waived-widget-refactor  **Created:** 2026-06-11

## Purpose

Verify the PPB modal slot grid shell is created through the shared selected-slot wrapper, including the horizontal mode used by PPB Horizontal Slots.

## Test Cases

### PPBHorizontalSlotsSharedShell

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Modal slot grid shell | `modal-slot-template.js` source | `renderSelectedProductSlots()` wrapper with horizontal/vertical mode | Keeps existing `bw-ppb-modal-slot-grid` class. |

## Acceptance Criteria

- [x] Modal slot grid shell uses `renderSelectedProductSlots()`.
- [x] Horizontal branch maps to shared `horizontal` mode.
- [x] Existing modal slot grid class remains available for CSS and DOM queries.
