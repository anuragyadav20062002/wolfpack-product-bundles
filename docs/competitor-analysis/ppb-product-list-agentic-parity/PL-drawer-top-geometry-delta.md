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

## Historical WPB Gap Before Fix

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

## Initial WPB Post-Fix Proof

Evidence file: `/private/tmp/ppb-product-list-agentic-parity/PL-drawer-top-geometry/wpb-drawer-top-geometry-after-injected.json`

Because Shopify's CDN can continue serving the previous CSS until deployment, the exact pending CSS rule was injected before opening the drawer so the runtime height calculation used the new padding.

Measured WPB post-fix desktop state:
- One selected item: drawer height `116px`, list height `115px`, title top gap `11px`, title-to-first-row gap `10px`, bottom slack `10px`.
- Two selected items: drawer height `186px`, list height `185px`, title top gap `11px`, title-to-first-row gap `10px`, bottom slack `10px`.
- The drawer keeps the requested `1px` top border.
- The pill remains attached to the drawer top and overlaps the top border area.
- Geometry remains stable when expanding from one selected row to two selected rows.

## Mobile Proof

Evidence files:
- EB mobile: `/private/tmp/ppb-product-list-agentic-parity/PL-drawer-top-geometry/eb-mobile-drawer-top-geometry.json`
- WPB mobile post-fix: `/private/tmp/ppb-product-list-agentic-parity/PL-drawer-top-geometry/wpb-mobile-drawer-top-geometry-after-injected.json`

Viewport: `390 x 844`, DPR `3`.

Measured EB mobile state:
- Title top gap remains `10px`.
- Title-to-first-row gap remains `10px`.
- Drawer height is constrained to `59.1094px`.
- One selected row extends `46.078125px` below the drawer.
- Two selected rows extend `116.078125px` below the drawer.

Measured WPB mobile post-fix state:
- One selected item: drawer height `116px`, list height `115px`, title top gap `11px`, bottom slack `10px`.
- Two selected items: drawer height `186px`, list height `185px`, title top gap `11px`, bottom slack `10px`.
- The requested top border remains visible.
- The drawer remains fully contained; it does not copy EB's mobile row overflow.

Decision: keep WPB's contained mobile drawer. It preserves EB's internal spacing rhythm while avoiding EB's mobile overflow defect.

## 2026-07-13 Hard-Refresh Served Proof

Evidence files:
- EB desktop current: `/private/tmp/ppb-product-list-agentic-parity/PL-drawer-top-geometry/eb-desktop-current-hard-refresh.json`
- WPB desktop current: `/private/tmp/ppb-product-list-agentic-parity/PL-drawer-top-geometry/wpb-desktop-current-hard-refresh.json`
- EB mobile current: `/private/tmp/ppb-product-list-agentic-parity/PL-drawer-top-geometry/eb-mobile-current-hard-refresh.json`
- WPB mobile current: `/private/tmp/ppb-product-list-agentic-parity/PL-drawer-top-geometry/wpb-mobile-current-hard-refresh.json`

The hard-refresh proof removes the earlier injected-CSS caveat. WPB now serves the drawer padding and height calculation directly from the built storefront asset.

Desktop EB current:
- Viewport: `1280 x 900`.
- One selected item: drawer height `115px`, title top gap `10px`, title-to-first-row gap `10px`, bottom slack `9.8125px`.
- Two selected items after adding while open: drawer height `185px`, title top gap `10px`, title-to-first-row gap `10px`, bottom slack `9.8125px`.
- Pill overlap stays stable at `7.59375px`.

Desktop WPB current:
- Viewport: `1280 x 900`.
- Widget version: `5.0.144`.
- One selected item: drawer height `116px`, list height `115px`, title top gap `11px`, title-to-first-row gap `10px`, bottom slack `10px`.
- Two selected items after adding while open: drawer height `186px`, list height `185px`, title top gap `11px`, title-to-first-row gap `10px`, bottom slack `10px`.
- The `1px` height and top-gap delta is the requested WPB drawer top border.
- Drawer remains open while adding the second item; selected rows update from one to two without collapsing.

Mobile EB current:
- Chrome DevTools MCP viewport resolved to `500 x 844` for the EB storefront.
- One selected item: drawer height `20px`, title top gap `10px`, title-to-first-row gap `10px`, selected row overflows below the drawer by `85.1875px`.
- Two selected items after adding while open: drawer height `20px`, title top gap `10px`, title-to-first-row gap `10px`, selected rows overflow below the drawer by `155.1875px`.

Mobile WPB current:
- Viewport: `390 x 844`.
- Widget version: `5.0.144`.
- One selected item: drawer height `116px`, list height `115px`, title top gap `11px`, title-to-first-row gap `10px`, bottom slack `10px`.
- Two selected items after adding while open: drawer height `186px`, list height `185px`, title top gap `11px`, title-to-first-row gap `10px`, bottom slack `10px`.

Decision:
- No Product List source patch is needed for this lane.
- WPB now serves the intended drawer geometry without CSS injection.
- Keep the contained WPB mobile drawer instead of copying EB's mobile overflow defect.
