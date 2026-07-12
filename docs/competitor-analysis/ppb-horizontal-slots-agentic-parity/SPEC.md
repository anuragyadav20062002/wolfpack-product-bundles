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
| HS00 baseline | Desktop empty state captured | Desktop empty state captured on 5.0.150 | Aggregate card fixed; theme host widths differ but three-column formula matches | Accepted desktop behavior; mobile pending |
| HS01 step/category | Fixture structure confirmed in Admin and storefront | Missing | Missing | In progress |
| HS14 picker open/close | Desktop open state captured | Desktop open state captured | Header/body vertical geometry differs | Delta recorded |
| HS09 responsive placement | Missing | Missing | Missing | Pending |
| HS17 modal scroll/focus | Modal geometry and scroll owner captured; interaction proof incomplete | Missing | Missing | In progress |

## Acceptance boundary

This lane is not accepted until every applicable row in
`broader-PPB-template-parity.md` has EB-first evidence, an equivalent WPB pass,
an explicit delta, and current desktop/mobile verification.
