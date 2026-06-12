# Bundle Widget Refactor Baseline Template Matrix

Captured: 2026-06-11

Scope: Loop 1 from `bundle_widget_refactor_agentic_loop_all_templates.md`. This is a baseline only; no widget source changes were made.

## Fixture Context

| Fixture | Admin edit URL | Storefront URL |
|---|---|---|
| FPB fixture | `https://admin.shopify.com/store/agent-5sfidg3m/apps/wolfpack-product-bundles-sit/app/bundles/full-page-bundle/configure/cmpznom360001v0wqjqm3cv3a` | `https://agent-5sfidg3m.myshopify.com/pages/wpb-fresh-fpb-template-parity-2026-06-04` |
| PPB fixture | `https://admin.shopify.com/store/agent-5sfidg3m/apps/wolfpack-product-bundles-sit/app/bundles/product-page-bundle/configure/cmpzr5n3s0000v0glfwuklzgd` | `https://agent-5sfidg3m.myshopify.com/products/wpb-fresh-ppb-template-parity-2026-06-04-97524` |

Shop context:

- Shopify Admin store: `agent-5sfidg3m`
- Embedded app: `wolfpack-product-bundles-sit`
- Storefront password gate: password `1`
- Runtime widget version observed on all storefront captures: `3.0.23`
- Screenshot output directory: `/private/tmp/wpb-template-baseline-2026-06-11`
- Screenshot files are investigation artifacts and should not be committed.

## Public Reference Assets

| Template | Reference asset |
|---|---|
| FPB Standard | `public/FPB-Standard.png` |
| FPB Classic | `public/FPB-Classic.png` |
| FPB Compact | `public/FPB-Compact..png` |
| FPB Horizontal | `public/FPB-Horizontal.png` |
| PPB Grid | `public/PPB-Grid.png` |
| PPB List | `public/PPB-List.png` |
| PPB Horizontal Slots | `public/PPB-HorizontalSlots.png` |
| PPB Vertical Slots | `public/PPB-VerticalSlots.png` |

## Baseline Matrix

| Template | Runtime identifier | Desktop screenshot | Mobile screenshot | Desktop baseline | Mobile baseline | Console notes | Obvious issues / follow-ups |
|---|---|---|---|---|---|---|---|
| FPB Standard | Root class: `bundle-widget-container bundle-widget-full-page fpb-d fpb-preset-default` | `/private/tmp/wpb-template-baseline-2026-06-11/fpb-standard-desktop.png` | `/private/tmp/wpb-template-baseline-2026-06-11/fpb-standard-mobile.png` | 1440px viewport, no horizontal overflow, `scrollWidth=1440`, first card about `314.56x352`. | 390px viewport, no horizontal overflow, first card about `177.5x264`, mobile summary/footer tray present. | Quirks Mode issue appeared once; no hard JS errors. | Confirm selected-state card height and quantity control behavior during migration. |
| FPB Classic | Root class: `bundle-widget-container bundle-widget-full-page fpb-preset-classic` | `/private/tmp/wpb-template-baseline-2026-06-11/fpb-classic-desktop.png` | `/private/tmp/wpb-template-baseline-2026-06-11/fpb-classic-mobile.png` | 1440px viewport, no horizontal overflow, first card about `208.23x312.23`. | 390px viewport, no horizontal overflow, first card about `177.5x263`, mobile summary/footer tray present. | No hard JS errors. | Classic uses smaller dense cards; preserve grid density while moving to shared product card. |
| FPB Compact | Root class: `bundle-widget-container bundle-widget-full-page fpb-preset-compact` | `/private/tmp/wpb-template-baseline-2026-06-11/fpb-compact-desktop.png` | `/private/tmp/wpb-template-baseline-2026-06-11/fpb-compact-mobile.png` | 1440px viewport, no horizontal overflow, first card about `255x359`. | 390px viewport, no horizontal overflow, first card about `170x245`, mobile summary/footer tray present. | No hard JS errors. | Compact has image-heavy density; verify selected state does not break card rhythm. |
| FPB Horizontal | Root class: `bundle-widget-container bundle-widget-full-page fpb-h fpb-preset-horizontal` | `/private/tmp/wpb-template-baseline-2026-06-11/fpb-horizontal-desktop.png` | `/private/tmp/wpb-template-baseline-2026-06-11/fpb-horizontal-mobile.png` | 1440px viewport, no horizontal overflow, `scrollWidth=1429`, first card about `300x420`. | 390px viewport, no horizontal overflow, first card about `355x136`, mobile summary/footer tray present. | No hard JS errors; only `[bugsnag] Loaded`, content-visibility verbose logs, and intermittent label issue. | Horizontal switches card shape sharply between desktop and mobile; keep explicit layout mode in template config. |
| PPB Grid | Body attrs: `gbbmix-template-id=COGNIVE`, `gbbmix-template-type=PDP_INPAGE`, `gbb-mix-consolidated-design=true` | `/private/tmp/wpb-template-baseline-2026-06-11/ppb-grid-desktop.png` | `/private/tmp/wpb-template-baseline-2026-06-11/ppb-grid-mobile.png` | 1440px viewport, no horizontal overflow, `scrollWidth=1429`, modal trigger present, card count observed as 14. | 390px viewport, no horizontal overflow, same body attrs. | No hard JS errors; only content-visibility verbose logs and `[bugsnag] Loaded`. | Card selector sometimes hits wrapper/root nodes, so future DOM contract should expose stable product-card selectors. |
| PPB List | Body attrs: `gbbmix-template-id=CASCADE`, `gbbmix-template-type=PDP_INPAGE`, `gbb-mix-consolidated-design=true` | `/private/tmp/wpb-template-baseline-2026-06-11/ppb-list-desktop.png` | `/private/tmp/wpb-template-baseline-2026-06-11/ppb-list-mobile.png` | 1440px viewport, no horizontal overflow, `scrollWidth=1429`, card count observed as 14. | 390px viewport, no horizontal overflow, same body attrs. | Quirks Mode issue appeared; no hard JS errors. | Current list template owns selected drawer/footer behavior; isolate that into shared summary/footer primitives. |
| PPB Horizontal Slots | Body attrs: `gbbmix-template-id=MODAL`, `gbbmix-template-type=PDP_MODAL`, `gbb-mix-consolidated-design=true`; class hints include `bw-ppb-modal-slot-grid` | `/private/tmp/wpb-template-baseline-2026-06-11/ppb-horizontal-slots-desktop.png` | `/private/tmp/wpb-template-baseline-2026-06-11/ppb-horizontal-slots-mobile.png` | 1440px viewport, no horizontal overflow, `scrollWidth=1429`, card count observed as 4 before modal interaction. | 390px viewport, no horizontal overflow, `scrollWidth=390`, card count observed as 28 after mobile reload/recommendation content. | No hard JS errors. | Admin template modal selected/persisted the template but `Next` stayed disabled during save; storefront confirmed persisted state. Need stable slot orientation config and product-card selectors. |
| PPB Vertical Slots | Body attrs: `gbbmix-template-id=SIMPLIFIED`, `gbbmix-template-type=PDP_MODAL`, `gbb-mix-consolidated-design=true`; class hints include `bw-ppb-modal-slot-section--simplified`, `bw-ppb-modal-slot-grid--simplified`, `bw-ppb-primary-cta--modal-vertical` | `/private/tmp/wpb-template-baseline-2026-06-11/ppb-vertical-slots-desktop.png` | `/private/tmp/wpb-template-baseline-2026-06-11/ppb-vertical-slots-mobile.png` | 1440px viewport, no horizontal overflow, `scrollWidth=1429`, first visible slot/card area about `425.66x395.19`. | 390px viewport, no horizontal overflow, `scrollWidth=390`, first visible slot/card area about `358x389.59`. | No hard JS errors. | Admin template modal showed the same disabled-`Next` save behavior; storefront confirmed persisted state. Vertical modal layout is currently inferred by simplified classes and should become explicit config. |

## Baseline Observations

- All 8 templates have desktop and mobile screenshots.
- No template showed horizontal page overflow in the captured empty baseline state.
- PPB modal-slot templates persist from the Admin template modal even when the modal UI does not advance after clicking `Next`; storefront runtime attributes are the reliable confirmation.
- PPB product-card probing is noisy because selectors match wrappers and slot containers. The refactor should add a stable shared product card DOM contract with predictable selectors/data attributes.
- FPB templates already expose clear root template classes, while PPB templates rely on body attributes plus scattered class hints.
- Tablet, selected-state, quantity, remove, discount, and add-to-cart checks remain for later migration loops; Loop 1 required desktop and mobile baseline screenshots only.

## Next Loop Entry Point

Loop 2 should add guardrails before touching widget behavior:

- File-size report for `.js` and `.css` files over 500 lines.
- Runtime CSS string check, especially `style.textContent` and large injected template strings.
- Prototype/template installer usage report for `installXTemplate` patterns.
- Legacy violations should be reported first, not made CI-failing immediately.
