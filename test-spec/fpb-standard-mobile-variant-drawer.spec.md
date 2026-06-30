# Test Spec: FPB Standard Mobile Variant Drawer
**Spec ID:** fpb-standard-mobile-variant-drawer  **Created:** 2026-06-30

## Purpose
Verify that FPB Standard renders mobile variant choices through a drawer payload that preserves variant data, formatted prices, availability, and selection state.

## Test Cases
### VariantSelectorComponent
| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | Render mobile drawer for multi-variant product | Product title, image, selected variant, multiple variants, price formatter | Drawer HTML includes product title, selected price, selectable option rows, disabled unavailable row, and no undefined copy | Behavior/data only |

## Acceptance Criteria
- [x] All listed test cases pass
