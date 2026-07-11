# PPB Product List Drawer Top Geometry Delta

Date: 2026-07-11

Scope: Product Page Bundle Product List only (`PDP_INPAGE` + `CASCADE`).

Evidence files:
- EB: `/private/tmp/ppb-product-list-agentic-parity/PL-drawer-top-geometry/eb-drawer-top-geometry.json`
- WPB: `/private/tmp/ppb-product-list-agentic-parity/PL-drawer-top-geometry/wpb-drawer-top-geometry.json`

## State Tested

1. Clear storefront storage and reload.
2. Add one product and open `View Bundle Items`.
3. Measure drawer, pill, title, horizontal rule, selected rows, and bottom slack.
4. Add a second product while the drawer remains open.
5. Re-measure the same geometry.

## EB Source Of Truth

EB keeps the drawer geometry stable between one and two selected items:
- Drawer height: `115px` with one item, `185px` with two items.
- Title top gap: `10px`.
- Title-to-first-row gap: `10px`.
- Horizontal rule gap from title text: `10px`.
- Bottom slack: `9.8125px`.
- Pill overlaps the drawer top: drawer top is `7.59375px` above the pill bottom.

## WPB Current Gap

WPB is stable between one and two selected items, but the selected heading is too close to the drawer top:
- Drawer height: `106px` with one item, `176px` with two items.
- Title top gap: `1px`, caused by the requested top border and zero open-state top padding.
- Title-to-first-row gap: `10px`.
- Horizontal rule gap from title text: `10px`.
- Bottom slack: `10px`.
- Pill overlaps the drawer top: drawer top is `12px` above the pill bottom.

The drawer no longer shifts when expanding from one item to two items, but it is `9px` shorter than EB and the selected heading starts too high.

## Fix

Restore Product List open-state selected-list top padding to `10px`. Keep the drawer top border intact, so WPB should settle at EB's content height plus the 1px top border:
- One selected item: expected drawer height `116px`.
- Two selected items: expected drawer height `186px`.
- Expected title top gap: `11px` including the top border.

## WPB Post-Fix Proof

Evidence file: `/private/tmp/ppb-product-list-agentic-parity/PL-drawer-top-geometry/wpb-drawer-top-geometry-after-injected.json`

Because Shopify's CDN can continue serving the previous CSS until deployment, the exact pending CSS rule was injected before opening the drawer so the runtime height calculation used the new padding.

Measured WPB post-fix desktop state:
- One selected item: drawer height `116px`, list height `115px`, title top gap `11px`, title-to-first-row gap `10px`, bottom slack `10px`.
- Two selected items: drawer height `186px`, list height `185px`, title top gap `11px`, title-to-first-row gap `10px`, bottom slack `10px`.
- The drawer keeps the requested `1px` top border.
- The pill remains attached to the drawer top and overlaps the top border area.
- Geometry remains stable when expanding from one selected row to two selected rows.
