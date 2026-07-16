# Test Spec: PPB Product Drawer Parity
**Spec ID:** ppb-product-drawer-parity  **Created:** 2026-07-17

## Purpose

Protect PPB drawer behavior for Product Grid, Horizontal Slots, and Vertical Slots while keeping visual parity proof in Chrome DevTools MCP instead of CSS/source-grep tests.

## Test Cases

### ProductGridSelectedDrawer

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Product Grid footer re-render with open drawer | Product Grid template, footer contains open selected drawer | `cascadeSelectedDrawerState` remains open with measured height before footer replacement | Prevents Grid collapsing the shared selected drawer after re-render |
| 2 | Product Grid selection update with open drawer | Product Grid template, selected drawer open, selection quantity changes | Drawer state remains open and height is preserved before update methods run | Mirrors EB COGNIVE selected drawer continuity |
| 3 | Product List unchanged | Cascade template, footer contains open selected drawer | Existing Cascade preservation remains unchanged | Regression guard for shared drawer owner |

### ModalSlotDrawers

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Vertical Slots empty slot opens picker | `PDP_MODAL + SIMPLIFIED`, empty slot click | Picker opens for clicked step | Covered by existing vertical filled-row/modal tests |
| 2 | Minimum-rule slot capacity | `greater_than_or_equal_to` condition and selected count at/above minimum | One additional empty slot remains available | Covered by existing empty-placeholder tests |
| 3 | Exact-rule slot capacity | `equal_to` condition and selected count at target | No overflow slot is appended | Covered by existing empty-placeholder tests |

## Acceptance Criteria

- [x] Product Grid selected drawer preservation is tested before implementation.
- [x] Existing modal-slot drawer behavior tests still pass.
- [x] No unit test asserts CSS, class names as visual contracts, or source placement.
- [x] Browser proof uses direct Chrome DevTools MCP with cache-bypassed hard reload.
