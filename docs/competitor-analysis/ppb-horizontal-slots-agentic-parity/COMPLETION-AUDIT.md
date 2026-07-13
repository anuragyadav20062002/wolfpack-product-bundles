# Horizontal Slots Completion Audit

Date: 2026-07-13
Status: Accepted

## Contract and fixture

| Requirement | Status | Current evidence / remaining proof |
| --- | --- | --- |
| `PDP_MODAL + MODAL` | Proven | Live body/widget attributes and served modal stylesheet recorded in HS09/HS17. |
| Horizontal orientation | Proven | `data-ppb-slot-orientation="horizontal"` on live widget and steps. |
| Multiple steps/categories and long label | Proven | HS01 desktop/mobile. |
| Manual and collection products | Proven | HS03/HS04 API and live card inventories. |
| Normal, grouped variants, sole survivor, unavailable product | Proven | HS03/HS04. |
| Long title | Proven | Long category and product titles remain contained in HS01/HS02. |
| Sale plus compare-at price | Proven | HS02 mixed-media evidence proves EB-first sale pairs, the authenticated WPB setting, proxy runtime key, persistence, and equivalent live pairs. |
| Square/tall/wide images | Proven | HS02 directly measures natural and rendered dimensions for square, tall, and wide sources in both live pickers. |
| Missing-image fallback | Proven | HS18 uses equivalent live `Message` products with no media. EB exposes a broken `undefined` image; WPB 5.0.164 renders a self-contained decoded fallback at desktop/mobile with zero overflow. |
| Percentage discount progression | Proven | HS06 plus HSS1. |
| No-discount state | Proven | HSS4 disables only the master toggle, proves original totals/no discount UI on EB and WPB 5.0.160, then restores the 5%/10% tiers. |
| Empty/one/multiple/exact states | Proven | HS00, HS05, HS06. |
| Over-target and maximum/overflow selection | Proven | HSS3 proves minimum-rule overflow through three Step 1 products, dynamic Product 4 reachability, four filled cards, retained capacity after removal, exact-rule termination, and reload reset on 5.0.159. |

## Placement and responsive matrix

| Requirement | Status | Current evidence / remaining proof |
| --- | --- | --- |
| 1280x800, 1440x900, 768x1024, 390x844, 360x800 | Proven | HS02/HS09. |
| Default product-information placement | Proven | Real mounted WPB/EB product pages in HS09. |
| 300px and 360px placement behavior | Proven | Real 300/360-era measurements plus fluid-source correction in HS09. |
| Approximately 520px placement | Proven | HSP1 uses the saved Horizon Equal columns setting for a real 520.5px widget mount at 1180x800; no synthetic host or width override. |
| Full-width/section placement | Not applicable, constraint proven | HSP1 saves a real new Apps section and proves runtime relocation into the EB-aligned native product-form footprint; the temporary section is then removed. |
| No overflow/clipping/overlap and reachable controls | Proven | HS02, HS09, HS17, HSS1, and HSP1 cover the viewport matrix plus the real 520.5px mount and responsive picker. |

## Runtime behavior

| Requirement | Status | Current evidence / remaining proof |
| --- | --- | --- |
| Loading and first hard reload | Proven | HS07, including cold proxy and request health. |
| Empty/partial/full slots and slot order | Proven | HS00, HS05, HS15, HSS1. |
| Picker open/close/header/tabs/categories/footer | Proven | HS01, HS14, HS17. |
| Product card image/title/price/action hierarchy | Proven | HS02 proves the baseline, compare-at hierarchy, and mixed source ratios; HS18 proves the missing-image fallback at desktop/mobile. |
| Variant selector and selected identity | Proven | HS03 and HSS1. |
| Available/unavailable behavior | Proven | HS04. |
| Selection, remove, replace flow | Proven | HS15/HS16. |
| Multi-step advance and persistence | Proven | HS05/HSS1. |
| Backdrop/body lock/internal scroll/focus/Escape | Proven | HS17. |
| Discount progression and final CTA | Proven | HS06/HSS1 cover active tiers; HSS4 covers disabled pricing with retained rules on 5.0.160. |
| Validation toast and blocked state | Proven | HS19 re-proves EB rule copy, modal ownership, and exact desktop/mobile toast geometry on dev widget 5.0.166. |
| Cart request, transform, metadata | Proven | HS08. |
| Dynamic checkout | Accepted safety divergence | HS10 documents EB's invalid parent-product bypass and WPB's non-mutating surface. |
| Console and app-owned request health | Proven for reload/cart passes | HS07/HS08. |
| Theme typography/selector conflicts | Proven for captured states | HS01/HS02/HS04 computed-style evidence. Remaining fixtures/placements still require replay. |

## Regression and closeout gates

| Requirement | Status | Remaining proof |
| --- | --- | --- |
| Horizontal combined desktop stress | Proven | HSS1. |
| Horizontal combined narrow-mobile stress | Proven | HSS2 combines long content, grouped variant 8, inventory survivor, discounts, scrolling, ordered slots, final CTA, and zero document overflow at 360x800. |
| Product List remains accepted | Proven | HSR1 re-proves hard reload, long category, grouped variant 8, selected drawer, 5% footer, removal, dedicated WPB CASCADE asset, and zero overflow at 360x800. |
| Product Grid/Vertical Slots leakage | Proven | Final live four-template regression proves dedicated shells and absence of competing template shells on 5.0.165. |
| Final focused tests/build/lint/graphify | Proven | HS19 adds 17 focused behavior tests across the modal copy, step validation, and incremental selected marker; widget 5.0.166 builds/minifies and passes syntax/lint. |
| Fixture restored and carts clean | Proven current | Both fixtures restored to zero selections; both carts confirmed empty after HS08/HS10. Must recheck at final handoff. |
| Clean worktree and focused commits | Proven current | Recheck after the remaining gates. |

## Current completion decision

Horizontal Slots satisfies the per-template completion criteria in
`broader-PPB-template-parity.md`, including the reopened HS19 modal-card/toast
details verified through the hot-reloaded Shopify dev preview on widget 5.0.166.
