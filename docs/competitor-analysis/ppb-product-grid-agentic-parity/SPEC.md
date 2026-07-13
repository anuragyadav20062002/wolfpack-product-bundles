# PPB Product Grid Parity

## Status

Accepted. Runtime, responsive layout, interaction states, loading, inventory,
discount stress, missing media, real wide placement, restoration, and final
shared-template regression are proven.

## Contract

- `bundleDesignTemplate = "PDP_INPAGE"`
- `bundleDesignTemplateData.templateId = "COGNIVE"`

## Fixture

- Store: `yash-wolfpack.myshopify.com`
- Bundle: `WPB PPB Product List Parity 2026-07-11`
- Offer: `MIX-156854`
- Steps: 2
- Step 1 contains two categories, including a long-label empty category
- Current Step 1 rule: quantity greater than or equal to 2

## Evidence protocol

Browser evidence uses direct Chrome DevTools MCP only. Each accepted storefront
state requires cache-bypassed reload, runtime attributes, accessibility state,
computed geometry, interaction behavior, and an equivalent WPB pass.

## Current rows

| Case | EB | WPB | Delta | Status |
| --- | --- | --- | --- | --- |
| PG00 runtime/baseline | `PDP_INPAGE + COGNIVE` proven at 1280x800 and 390x844 | Equivalent runtime contract proven on 5.0.161 | None | Accepted runtime dispatch |
| PG01 responsive grid | Three columns in 345px host; two columns in 360px mobile grid; 15px gap and 8px side padding | Three columns in real 372.34px host; two columns in 358px mobile host; same gap/padding | Fixed 300px cap removed; exact owner width differs by theme | Accepted responsive ownership at 1280x800 and 390x844 |
| PG02 multi-step flow | One active body/grid with step navigation and Next/final CTA | Equivalent active-step flow on 5.0.161 | Both full grids were stacked before fix | Accepted desktop and 390x844 progression |
| PG03 categories/variants | Category switch resolves Pedal Ring; current variant title only | Same category/product; merchant-enabled full-width size selector | WPB retains explicit merchant capability absent from current EB settings | Accepted category switching and contained selector at 390x844 |
| PG04 selected drawer | Selected rows, quantities, prices, remove actions; zero overflow | Equivalent drawer on 5.0.162 | 28px track violated shared 56px action minimum before fix | Accepted two-item open/close/remove at 390x844 |
| PG05 loading/inventory | No app-owned loader before final Grid; current Step 2 catalog remains sellable | Grid skeleton occupies final tracks on 5.0.163; unavailable snowboard omitted; exact-one over-target blocked | Loader rows collapsed before fix; inventory identities differ by store | Accepted loading placement desktop/mobile and WPB unavailable/over-target behavior |
| PG06 selected/discount stress | Zero, one, two, and rule-bounded three-row final state; 5% then 10% | Equivalent state matrix on 5.0.163 | Currency/component prices differ | Accepted at 390x844; both fixtures restored empty |
| PG07 missing media | Live image-less `Message` card renders a broken `src="undefined"` image in the final Grid | Live image-less `Message` card uses a self-contained 400x400 neutral SVG on 5.0.164 | WPB intentionally does not copy EB's broken image request | Accepted fallback behavior at 1280x800 and 390x844; zero overflow |

## Acceptance boundary

Product Grid is not accepted until every applicable Product Grid requirement in
`broader-PPB-template-parity.md` has EB-first evidence, equivalent WPB evidence,
an explicit delta, desktop/mobile verification, and shared-template regression
proof.
