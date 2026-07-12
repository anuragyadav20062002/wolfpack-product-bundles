# PPB Horizontal Slots Parity

## Status

In progress. EB fixture establishment and the first desktop empty/open states are
captured. WPB comparison has not started.

## Contract

- `bundleDesignTemplate = "PDP_MODAL"`
- preset/template ID = `"MODAL"`
- slot orientation = horizontal

## Fixture

- Store: `yash-wolfpack.myshopify.com`
- Bundle product: `WPB PPB Product List Parity 2026-07-11`
- Storefront: `/products/wpb-ppb-product-list-parity-2026-07-11`
- Current EB template: Horizontal Slots
- Steps: 2
- Current visible empty-slot requirements: Step 1 has 2 slots; Step 2 has 1 slot
- Current product sources include manual products and a collection-backed category
- Step 1 includes a second category with a long label
- Step rules currently require exactly 1 item on the inspected Step 2 draft state

## Evidence protocol

All browser evidence is collected with direct Chrome DevTools MCP. Cache Storage
is cleared when available and the page is reloaded with cache bypass before the
state is accepted. Temporary screenshots live under
`/private/tmp/ppb-remaining-template-parity/horizontal-slots/` and are not
committed.

## Current row status

| Case | EB | WPB | Delta | Status |
| --- | --- | --- | --- | --- |
| HS00 baseline | Desktop/mobile empty states captured | Desktop/mobile empty states captured on 5.0.151 | Aggregate card and 300px mobile cap fixed | Accepted empty behavior at 1280x800 and 390x844 |
| HS01 step/category | Multi-step/category picker controls captured | Modal category controls and filtering captured on 5.0.152 | Missing category row fixed | Accepted at 390x844; desktop smoke pending |
| HS14 picker open/close | Desktop/mobile open state captured | Mobile category/header/open state captured | Category behavior fixed; remaining desktop/focus checks pending | In progress |
| HS09 responsive placement | 390px host captured | 390px host captured | Mobile grid cap fixed; remaining viewports pending | In progress |
| HS17 modal scroll/focus | Modal geometry and scroll owner captured | Mobile body-scroll/footer persistence captured | Whole-panel scrolling fixed; focus proof incomplete | In progress |

## Acceptance boundary

This lane is not accepted until every applicable row in
`broader-PPB-template-parity.md` has EB-first evidence, an equivalent WPB pass,
an explicit delta, and current desktop/mobile verification.
