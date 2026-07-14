# Test Spec: PPB Modal Category Tabs
**Spec ID:** ppb-modal-category-tabs  **Created:** 2026-07-13

## Purpose

Verify that PPB modal-slot templates expose the current step's categories inside
the product picker and use the active category to filter its products.

## Test Cases

### PPBModalCategoryTabs

| # | Scenario | Input | Expected Output | Notes |
| --- | --- | --- | --- | --- |
| 1 | Multi-category step | Two named categories | Two modal category buttons; first active | EB HS14 contract |
| 2 | Switch category | Activate second category | Active index changes and modal products rerender | Same step remains open |
| 3 | Single category | One category | Category row remains hidden | Avoid redundant chrome |
| 4 | Step switch | Different step categories | Active category initializes independently per step | Preserve per-step state |

## Acceptance Criteria

- [x] Modal picker renders current-step category controls when multiple categories exist.
- [x] Category activation rerenders products for the current step.
- [x] Modal products are filtered through the active category contract.
- [x] Single-category steps do not render redundant category controls.
- [x] Category state remains independent per step.
