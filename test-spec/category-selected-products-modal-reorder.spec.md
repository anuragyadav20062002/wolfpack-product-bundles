# Test Spec: Category Selected Products Modal Reorder
**Spec ID:** category-selected-products-modal-reorder  **Created:** 2026-07-01

## Purpose
Verify that Step Setup category selected-product reordering uses a deterministic data helper before wiring the EB-style modal UI.

## Test Cases
### moveArrayItem
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Move an item forward | `[a,b,c,d]`, `from=1`, `to=3` | `[a,c,d,b]` | Product drag from middle to bottom |
| 2 | Move an item backward | `[a,b,c,d]`, `from=3`, `to=1` | `[a,d,b,c]` | Product drag from bottom to middle |
| 3 | Invalid index | `[a,b]`, `from=-1`, `to=1` | Original order | Guard bad drag events |
| 4 | Same index | `[a,b]`, `from=1`, `to=1` | Original order | No-op drag |

## Acceptance Criteria
- [x] Selected category products are opened from the selected-count chip, not rendered inline.
- [x] Selected category products can be reordered in the modal.
- [x] Reordering preserves item objects and does not mutate the source array.
