# PL07 Remove While Drawer Expanded Evidence

Date: 2026-07-12

Scope: Product Page Bundle Product List only (`PDP_INPAGE` + `CASCADE`).

Evidence files:
- EB desktop: `/private/tmp/ppb-product-list-agentic-parity/PL07-remove-expanded/eb-desktop-remove-expanded.json`
- WPB desktop: `/private/tmp/ppb-product-list-agentic-parity/PL07-remove-expanded/wpb-desktop-remove-expanded.json`
- EB mobile: `/private/tmp/ppb-product-list-agentic-parity/PL07-remove-expanded/eb-mobile-remove-expanded.json`
- WPB mobile: `/private/tmp/ppb-product-list-agentic-parity/PL07-remove-expanded/wpb-mobile-remove-expanded.json`

## State Tested

1. Clear storefront cart, local storage, session storage, and Cache Storage.
2. Reload the Product List storefront.
3. Select the first two visible Product List rows.
4. Open the selected-products drawer.
5. Click the first drawer-row remove control.
6. Measure selected drawer rows, drawer open class, drawer height, and toggle text before and after removal.

## EB Source Of Truth

Desktop:
- Before remove: two selected drawer rows.
- After remove: one selected drawer row remains.
- Drawer class stays open: `gbbMixCascadeCartDrawerContainer--open`.
- Drawer height shrinks from `185px` to `115px`.
- Toggle copy remains `View Bundle Items`.

Mobile:
- Viewport: `390px` wide.
- Before remove: two selected drawer rows.
- After remove: one selected drawer row remains.
- Drawer class stays open: `gbbMixCascadeCartDrawerContainer--open`.
- Toggle copy remains `View Bundle Items`.
- EB reports a `20px` drawer container height while rows overflow outside it. This is the same mobile overflow behavior already called out in the drawer geometry lane.

## WPB Result

Desktop on widget version `5.0.136`:
- Before remove: two selected drawer rows.
- After remove: one selected drawer row remains.
- Drawer class stays open: `bw-ppb-cascade-selected-drawer--open gbbMixCascadeCartDrawerContainer--open`.
- Drawer height shrinks from `186px` to `116px`.
- Toggle copy remains `View Bundle Items`.

Mobile on widget version `5.0.136`:
- Viewport: `390px` wide.
- Before remove: two selected drawer rows.
- After remove: one selected drawer row remains.
- Drawer class stays open: `bw-ppb-cascade-selected-drawer--open gbbMixCascadeCartDrawerContainer--open`.
- Drawer height shrinks from `186px` to `116px`.
- Toggle copy remains `View Bundle Items`.

## Decision

No Product List source patch is needed for remove-while-expanded behavior. WPB matches EB's state behavior: removing an item from the expanded drawer updates the selected rows in place and does not collapse the drawer.

WPB intentionally keeps the mobile drawer contained instead of copying EB's mobile row overflow defect. That matches the prior decision in `PL-drawer-top-geometry-delta.md`.
