# Test Spec: FPB Classic Shared Components
**Spec ID:** fpb-classic-shared-components  **Issue:** waived-widget-refactor  **Created:** 2026-06-11

## Purpose

Verify the FPB Classic migration slice uses shared product card and selected slot primitives without replacing unrelated templates.

## Test Cases

### FPBClassicSharedComponents

| # | Scenario | Input | Expected Output | Notes |
|---|---|---|---|---|
| 1 | CLASSIC product cards | `createProductCard()` source | Shared card renderer handles Classic | Preserves grid mode. |
| 2 | Classic sidebar slots | `renderClassicSidebarSlots()` source | Shared selected-slots renderer and remove action | Existing undo behavior remains caller-owned. |

## Acceptance Criteria

- [ ] CLASSIC product cards route through `renderSharedProductCard()`.
- [ ] Classic sidebar slot summary routes through `renderSelectedProductSlots()`.
- [ ] Remove buttons keep `data-action="remove-selected-product"`.
