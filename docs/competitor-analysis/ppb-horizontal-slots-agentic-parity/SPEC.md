# PPB Horizontal Slots Parity

## Status

In progress. Baseline slots, category controls, selection return/removal,
responsive mobile behavior, and modal scroll/close behavior have current EB-first
and WPB evidence. Remaining pairwise, stress, placement, cart, and regression rows
are not yet accepted.

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
| HS03 variants | Grouped Pedal Ring selector with options 6-11 captured | Equivalent grouped selector and selected identity captured on 5.0.155 | Unconditional modal variant expansion fixed; EB stale-first-variant bug not copied | Accepted grouped/individual rendering; mixed inventory remains HS04 |
| HS14 picker open/close | Desktop/mobile open, close, and backdrop states captured | Equivalent states captured on 5.0.153 | Mobile close listener fixed; no remaining open/close delta | Accepted at 390x844 and 1280x800 |
| HS09 responsive placement | 1440x900, 768x1024, 390x844, and 360x800 captured | Same viewport matrix captured on 5.0.154 | Desktop/tablet 300px host cap fixed; real 520px/full-width placement still pending | Viewport matrix accepted; placement matrix in progress |
| HS15 picker selection | Product stays in picker and returns to first slot on close | Equivalent return order captured on 5.0.153 | Mobile close listener fixed | Accepted at 390x844 |
| HS16 replace/remove | Filled slot is inert; remove restores empty slot | Equivalent remove-first replacement flow captured | No remaining behavior delta | Accepted at 390x844 |
| HS17 modal scroll/focus | Mobile/desktop body lock, internal scroll, backdrop, focus, and Escape captured | Identical core behavior; WPB adds dialog semantics and Escape close | No visual or pointer interaction delta | Accepted at 390x844 and 1280x800 |

## Acceptance boundary

This lane is not accepted until every applicable row in
`broader-PPB-template-parity.md` has EB-first evidence, an equivalent WPB pass,
an explicit delta, and current desktop/mobile verification.
