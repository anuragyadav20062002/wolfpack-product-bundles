# PPB Product List Drawer Add-While-Open Evidence

Date: 2026-07-11

Scope: Product Page Bundle Product List only (`PDP_INPAGE` + `CASCADE`).

Evidence files:
- EB: `/private/tmp/ppb-product-list-agentic-parity/PL-drawer-add-open/eb-drawer-add-open.json`
- WPB: `/private/tmp/ppb-product-list-agentic-parity/PL-drawer-add-open/wpb-drawer-add-open.json`

## State Tested

1. Clear storefront storage and reload.
2. Add one product.
3. Open `View Bundle Items`.
4. Add another product while the drawer remains open.
5. Measure drawer open state, height, selected rows, and overflow.

## EB Source Of Truth

EB keeps the selected-items drawer open and expands the drawer when a second product is added.

Measured EB desktop state:
- One selected item: drawer open, `115px` height.
- Two selected items: drawer still open, `185px` height.
- Selected row height: `60px`.
- Drawer list overflow: `auto`.
- Drawer animation timing: `0.7s`.

## WPB Current Result

WPB matches the EB behavior for this path.

Measured WPB desktop state:
- One selected item: drawer open, `106px` height.
- Two selected items: drawer still open, `176px` height.
- Selected row height: `60px`.
- Drawer list overflow: `auto`.
- Drawer animation timing: `0.7s`.
- Toggle `aria-expanded` remains `true` after adding the second product.

## Decision

No code change is needed for the add-while-open behavior. The remaining measured difference is height offset (`9px`) caused by WPB's top border/list offset treatment, which belongs to the drawer spacing/top-border parity lane rather than the state-retention behavior.
