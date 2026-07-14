# PPB Product List Loading Placement Evidence

Date: 2026-07-11

Scope: Product Page Bundle Product List only (`PDP_INPAGE` + `CASCADE`).

Evidence files:
- EB desktop final: `/private/tmp/ppb-product-list-agentic-parity/PL-loading-placement/eb-desktop-final-placement.json`
- EB mobile final: `/private/tmp/ppb-product-list-agentic-parity/PL-loading-placement/eb-mobile-final-placement.json`
- WPB desktop final: `/private/tmp/ppb-product-list-agentic-parity/PL-loading-placement/wpb-desktop-final-placement-after-reload.json`
- WPB desktop loading simulation before fix: `/private/tmp/ppb-product-list-agentic-parity/PL-loading-placement/wpb-desktop-loading-placement-simulation-doccoords.json`
- WPB desktop loading simulation after fix: `/private/tmp/ppb-product-list-agentic-parity/PL-loading-placement/wpb-desktop-loading-placement-fixed-simulation.json`
- WPB mobile final: `/private/tmp/ppb-product-list-agentic-parity/PL-loading-placement/wpb-mobile-final-placement-after-reload.json`
- WPB mobile loading simulation: `/private/tmp/ppb-product-list-agentic-parity/PL-loading-placement/wpb-mobile-loading-placement-simulation.json`

## Method

1. Use Chrome DevTools MCP only.
2. Set Slow 3G and 4x CPU slowdown.
3. Clear storefront storage and Cache Storage before reload.
4. Measure final Product List and first-row geometry on EB and WPB.
5. Attempt to catch live loading states after reload.
6. For WPB, when the live loading state completed before MCP could capture it, insert the exact loading markup used by `renderInpageProductLoadingRows()` into the live Product List target, measure it, then restore the original DOM.

The WPB simulation is not a source substitute. It verifies placement in the real browser with the same target element and CSS classes that the source renderer uses while avoiding persistent storefront changes.

## EB Reference

EB desktop final Product List:
- List class: `gbbMixCascadeProductsWrapper`.
- List rect: `x=837.5`, `y=353.3`, `width=345`, `height=410`.
- First row rect: `x=837.5`, `y=353.3`, `width=331`, `height=70`.
- `max-height`: `410px`.
- `overflow-x`: `hidden`.
- `overflow-y`: `auto`.

EB mobile final Product List:
- List class: `gbbMixCascadeProductsWrapper`.
- List rect: `x=15`, `y=656.3`, `width=360`, `height=485`.
- First row rect: `x=15`, `y=656.3`, `width=360`, `height=70`.
- `max-height`: `100%`.
- `overflow-x`: `hidden`.
- `overflow-y`: `auto`.

EB app-owned loading DOM was not present by the time MCP could inspect the page after throttled reload. The final placement establishes the reference slot: the first product row starts at the top-left of the Product List container.

## WPB Gap Before Fix

WPB final desktop Product List:
- Widget version: `5.0.133`.
- List rect: `x=856.7`, `docY=358`, `width=372.3`, `height=410`.
- First row rect: `x=856.7`, `docY=358`, `width=357.3`, `height=70`.

WPB desktop loading simulation before fix:
- Loading list rect: `x=856.7`, `docY=396.4`, `width=372.3`, `height=232`.
- First loading row rect: `x=856.7`, `docY=396.4`, `width=372.3`, `height=70`.
- Placement delta: loading row `docY` was `+38.4px` from the final row position.
- Width delta: loading row was `+15px` wider than the final row because the final list reserved scrollbar space and the short loading shell did not.

This confirmed the user-reported issue: on desktop, the loading shell could appear lower than the final Product List position and then jump when products rendered.

## Fix

Source owner: `app/assets/widgets/product-page-css/templates/inpage-cascade.css`.

Patch:
- Add `scrollbar-gutter: stable` to `.bw-ppb-cascade-product-list`.
- Add `.bw-ppb-cascade-product-list[aria-busy="true"] { min-height: var(--bw-ppb-cascade-product-list-max-height); }`.

Rationale:
- `_renderInpageStepProducts()` already sets `aria-busy="true"` on the same target that later receives final product rows.
- The CSS fix reserves the final Product List height during loading without changing render logic.
- Stable scrollbar gutter keeps loading row content width aligned with final rows.

## WPB Result After Fix Simulation

WPB desktop after applying the CSS patch in-browser:
- List before: `docY=358`, `height=410`, `width=372.3`.
- Loading list: `docY=358`, `height=410`, `width=372.3`.
- First final row: `docY=358`, `width=357.3`, `height=70`.
- First loading row: `docY=358`, `width=357.3`, `height=70`.
- Placement delta: `0`.
- Width delta: `0`.
- Footer `docY`: unchanged at `821`.

WPB mobile loading simulation:
- Final list: `x=16`, `y=437`, `width=358`, `height=410`.
- First final row: `x=16`, `y=437`, `width=358`, `height=70`.
- Loading list: `x=16`, `y=437`, `width=358`, `height=232`.
- First loading row: `x=16`, `y=437`, `width=358`, `height=70`.
- Placement delta: `0`.
- Width delta: `0`.

The source patch preserves mobile placement and removes the desktop loading jump.

## Verification

Commands:
- `npm run build:widgets`
- `npm run minify:assets css`
- `npx eslint --max-warnings 9999 scripts/build-widget-bundles.js` — zero errors; file is ignored by the lint config.
- `node --check scripts/build-widget-bundles.js`
- `npm run graphify:rebuild` — sandboxed run failed with `Operation not permitted`; escalated rerun succeeded and reported no topology changes.

Generated widget version: `5.0.134`.
