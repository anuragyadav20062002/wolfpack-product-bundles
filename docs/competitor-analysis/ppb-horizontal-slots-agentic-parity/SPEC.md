# PPB Horizontal Slots Parity

## Status

In progress. Baseline slots, category controls, selection return/removal,
responsive mobile behavior, modal scroll/close behavior, cart behavior, and
desktop/narrow-mobile combined stress have current EB-first and WPB evidence.
Remaining fixture, placement, and regression rows are not yet accepted.

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
| HS01 step/category | Multi-step/category picker controls captured on mobile/desktop | Equivalent controls, filtering, and desktop equal-track row captured on 5.0.158 | Missing category row and desktop text-width sizing fixed | Accepted at 390x844 and 1280x800 |
| HS02 product cards | EB card grid, sale/compare-at pairs, and square/tall/wide sources captured | Equivalent responsive grid, compare-at hierarchy, mixed-ratio containment, and stable missing-media fallback captured | Proxy key and missing authenticated setting control fixed; currency/source dimensions differ; EB missing-media request is broken | Accepted including HS18 missing-media fallback |
| HS03 variants | Grouped selector and option 8 return captured | Equivalent grouped selector and option 8 return captured on 5.0.155/5.0.158 | Unconditional modal variant expansion fixed | Accepted grouped/individual rendering and selected identity |
| HS04 inventory | Sole sellable survivor and fully unavailable omission captured | Equivalent Ski Wax survivor and unavailable snowboard omission captured on 5.0.157 | Missing sole-survivor identity fixed | Accepted desktop/mobile; store-specific inventory counts documented |
| HS05 selection/steps | Zero-blocked, Step 1 exact target, Step 2 exact target, persistence, and Done captured | Equivalent flow captured on 5.0.157 | Configured validation copy differs; behavior and state match | Accepted mobile; final desktop stress replay pending |
| HS06 discount/footer | Zero, one, 5%, 10%, cross-step persistence, and final CTA captured | Equivalent calculations captured on 5.0.157 | Currency and configured text differ; calculations match | Discounted fixture accepted; no-discount state pending |
| HS07 loading/reload | Inline-state root appears without visible loader | Bootstrap overlay-to-final-widget trace captured on 5.0.157 | Architectural load path differs; WPB loader occupies final mount location | Accepted mobile hard reload and app-owned request health |
| HS08 cart | Three child selections transform to one discounted parent line with EB metadata | Equivalent signed runtime request and transformed parent captured on 5.0.157 | App namespaces differ; visible and transform contracts match | Accepted; both test carts cleared after capture |
| HS14 picker open/close | Desktop/mobile open, close, and backdrop states captured | Equivalent states captured on 5.0.153 | Mobile close listener fixed; no remaining open/close delta | Accepted at 390x844 and 1280x800 |
| HS09 responsive placement | 1440x900, 768x1024, 390x844, and 360x800 captured | Same viewport matrix plus real Theme Editor 520.5px mount captured through 5.0.160 | Desktop/tablet 300px host cap fixed; standalone Apps section intentionally relocates to EB-aligned product form | Accepted; full-width standalone mount is not applicable to PPB product-form ownership |
| HS10 unsupported | Native accelerated checkout bypasses EB validation at zero selections | Visual counterpart remains non-mutating and cart-safe | Unsafe parent-product checkout bypass intentionally not copied | Accepted safety divergence |
| HS15 picker selection | Product stays in picker and returns to first slot on close | Equivalent return order captured on 5.0.153 | Mobile close listener fixed | Accepted at 390x844 |
| HS16 replace/remove | Filled slot is inert; remove restores empty slot | Equivalent remove-first replacement flow captured | No remaining behavior delta | Accepted at 390x844 |
| HS17 modal scroll/focus | Mobile/desktop body lock, internal scroll, backdrop, focus, and Escape captured | Identical core behavior; WPB adds dialog semantics and Escape close | No visual or pointer interaction delta | Accepted at 390x844 and 1280x800 |
| HSS1 combined desktop | Variant 8, inventory survivor, multi-step, discounts, scrolling, and final CTA captured | Equivalent combined pass captured on 5.0.158 | Step 2 survivor price differs by store | Accepted at 1280x800 |
| HSS2 combined narrow mobile | Long content, variant 8, inventory survivor, multi-step, discounts, scrolling, ordered slots, and final CTA captured | Equivalent combined pass captured on 5.0.158 | Step 2 survivor price differs by store | Accepted at 360x800; both fixtures restored empty |
| HSR1 Product List regression | Current Product List hard reload, long category, grouped variant 8, selected drawer, 5% footer, removal, and zero overflow captured | Equivalent `PDP_INPAGE + CASCADE` pass captured on 5.0.158 | Currency differs by store | Accepted at 360x800; both fixtures restored to empty Horizontal Slots |
| HSS3 open-ended capacity | Minimum-rule overflow grows to Product 4, exact rule stops at one, removal retains session capacity, reload resets | Equivalent lifecycle captured on 5.0.159 | Missing dynamic next slot and retained capacity fixed | Accepted at 360x800; both fixtures restored empty |
| HSS4 no discount | Master toggle off preserves rules but renders original totals and no discount UI | Equivalent lifecycle captured on 5.0.160 | Disabled next-rule progress leak fixed | Accepted at 360x800; discount tiers re-enabled and fixtures restored empty |

## Acceptance boundary

This lane is not accepted until every applicable row in
`broader-PPB-template-parity.md` has EB-first evidence, an equivalent WPB pass,
an explicit delta, and current desktop/mobile verification.
