# Test Spec: PPB List Selected Drawer Shared Row
**Spec ID:** ppb-list-selected-drawer-shared-row  **Issue:** waived-widget-refactor  **Created:** 2026-06-11

## Purpose

Verify PPB List/Cascade selected drawer items use the shared selected-row primitive while preserving remove behavior.

## Test Cases

### PPBListSelectedDrawerSharedRow

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Cascade selected drawer item | Cascade template source | Shared selected-row renderer and remove action hook | Keeps legacy drawer wrapper classes. |

## Acceptance Criteria

- [x] Cascade selected drawer items render through `renderSelectedProductRow()`.
- [x] Legacy Cascade drawer item classes remain on the row.
- [x] Remove button still calls `removeProductFromSelection(stepIndex, variantId)`.
