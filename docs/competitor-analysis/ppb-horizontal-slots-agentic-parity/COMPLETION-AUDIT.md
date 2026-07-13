# Horizontal Slots Completion Audit

Date: 2026-07-13
Status: In progress — completion is not yet proven.

## Contract and fixture

| Requirement | Status | Current evidence / remaining proof |
| --- | --- | --- |
| `PDP_MODAL + MODAL` | Proven | Live body/widget attributes and served modal stylesheet recorded in HS09/HS17. |
| Horizontal orientation | Proven | `data-ppb-slot-orientation="horizontal"` on live widget and steps. |
| Multiple steps/categories and long label | Proven | HS01 desktop/mobile. |
| Manual and collection products | Proven | HS03/HS04 API and live card inventories. |
| Normal, grouped variants, sole survivor, unavailable product | Proven | HS03/HS04. |
| Long title | Proven | Long category and product titles remain contained in HS01/HS02. |
| Sale plus compare-at price | Missing | EB shows compare-at prices. WPB bundle persists `showCompareAtPrices=false`; the configure route has state/save support but exposes no authenticated UI control. No code or DB bypass used. |
| Square/tall/wide images | Missing | Current products do not prove mixed source-image ratios independently of the fixed card media container. |
| Missing-image fallback | Missing | No equivalent live missing-image fixture has been established. |
| Percentage discount progression | Proven | HS06 plus HSS1. |
| No-discount state | Missing | Current dedicated fixture has active 5%/10% tiers. |
| Empty/one/multiple/exact states | Proven | HS00, HS05, HS06. |
| Over-target and maximum/overflow selection | Proven | HSS3 proves minimum-rule overflow through three Step 1 products, dynamic Product 4 reachability, four filled cards, retained capacity after removal, exact-rule termination, and reload reset on 5.0.159. |

## Placement and responsive matrix

| Requirement | Status | Current evidence / remaining proof |
| --- | --- | --- |
| 1280x800, 1440x900, 768x1024, 390x844, 360x800 | Proven | HS02/HS09. |
| Default product-information placement | Proven | Real mounted WPB/EB product pages in HS09. |
| 300px and 360px placement behavior | Proven | Real 300/360-era measurements plus fluid-source correction in HS09. |
| Approximately 520px placement | Missing | No real mounted 520px host proof. Synthetic width overrides are not accepted. |
| Full-width/section placement | Missing | No real theme/editor placement proof. |
| No overflow/clipping/overlap and reachable controls | Proven for captured matrix | HS02, HS09, HS17, HSS1. Must be repeated for remaining real placements. |

## Runtime behavior

| Requirement | Status | Current evidence / remaining proof |
| --- | --- | --- |
| Loading and first hard reload | Proven | HS07, including cold proxy and request health. |
| Empty/partial/full slots and slot order | Proven | HS00, HS05, HS15, HSS1. |
| Picker open/close/header/tabs/categories/footer | Proven | HS01, HS14, HS17. |
| Product card image/title/price/action hierarchy | Proven baseline | HS02. Compare-at/fallback media remain fixture gaps above. |
| Variant selector and selected identity | Proven | HS03 and HSS1. |
| Available/unavailable behavior | Proven | HS04. |
| Selection, remove, replace flow | Proven | HS15/HS16. |
| Multi-step advance and persistence | Proven | HS05/HSS1. |
| Backdrop/body lock/internal scroll/focus/Escape | Proven | HS17. |
| Discount progression and final CTA | Proven for discounted fixture | HS06/HSS1. No-discount state remains missing. |
| Validation toast and blocked state | Proven | HS05. |
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
| Product Grid/Vertical Slots leakage | Not yet provable | Those lanes must be completed before final shared-source regression. |
| Final focused tests/build/lint/graphify | Partial | Each implementation slice passed; final lane-wide run remains. |
| Fixture restored and carts clean | Proven current | Both fixtures restored to zero selections; both carts confirmed empty after HS08/HS10. Must recheck at final handoff. |
| Clean worktree and focused commits | Proven current | Recheck after the remaining gates. |

## Current completion decision

Horizontal Slots is not complete. The missing live fixture states, real
wide/full-width placements, and current cross-template regression prevent
acceptance under `broader-PPB-template-parity.md`.
