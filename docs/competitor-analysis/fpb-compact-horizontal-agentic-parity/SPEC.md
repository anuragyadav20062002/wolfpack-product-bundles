---
schema_version: 1
id: fpb-compact-horizontal-agentic-parity
title: FPB Compact and Horizontal Agentic Storefront Parity
type: implementation-spec
status: complete
summary: Records the completed evidence matrix and implementation for current FPB Compact and Horizontal storefront parity.
last_audited: 2026-07-20
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
  - competitor-analysis
systems:
  - bundle-widgets
source_paths:
  - app/assets/widgets/full-page-css/templates/side-footer-compact.css
  - app/assets/widgets/full-page-css/templates/side-footer-horizontal.css
  - app/assets/widgets/full-page/templates/compact.config.js
  - app/assets/widgets/full-page/templates/horizontal.config.js
related_docs:
  - internal docs/EB Implementation Reference.md
  - docs/refactor/full-page-and-product-page-template-verification-matrix.md
  - docs/refactor/loop-ledger.md
tags:
  - fpb
  - parity
  - compact
  - horizontal
keywords:
  - Compact Design
  - Horizontal Design
  - FBP_SIDE_FOOTER
---

# FPB Compact and Horizontal Agentic Storefront Parity

## Goal

Complete current, cache-bypassed storefront parity for persisted FPB `COMPACT` and `HORIZONTAL` presets. Easy Bundles is the presentation and shopper-behavior source of truth. Historical screenshots and source-contract tests are context only.

## Canonical Fixtures

- Easy Bundles storefront: `yash-wolfpack.myshopify.com/apps/gbb/easybundle/1`
- Wolfpack bundle: `cmr361mz50000v00yrdeyxpf7` on `agent-5sfidg3m.myshopify.com`
- Template contract: `FBP_SIDE_FOOTER`
- Presets: `COMPACT` and `HORIZONTAL`, saved through each Admin UI before storefront capture
- Evidence root: `/private/tmp/fpb-compact-horizontal-parity/`
- Required viewports: `1440x900`, `1280x800`, `768x1024`, `390x844`, and `360x800`

## Ground Rules

- Use direct Chrome DevTools MCP for every browser action.
- Clear Cache Storage and hard reload with cache bypass before each current storefront pass.
- Confirm persisted Admin state and storefront runtime; never simulate a preset with DOM changes.
- Load only the shared FPB stylesheet and the matching preset stylesheet.
- Write visual fixes in preset-owned source CSS. Do not inject presentation styles from JavaScript.
- Keep responsive rules content-driven. Captured pixel values are evidence, not layout constants.
- Verify behavior with interactions and runtime evidence. Do not add CSS, selector, class, or placement Jest tests.
- Keep screenshots and raw captures outside the repository.

## Feature Axes

The full matrix is documented here. Execution uses one shared rich fixture, pairwise coverage, and explicit stress cases.

| Axis | Values to prove |
|---|---|
| Bundle structure | Single-step; multi-step; add-on/gifting step |
| Categories | One category; multiple categories; long labels; empty category; category switch |
| Product sources | Manual products; collection-backed products; mixed source; empty source |
| Variants | No variant; individual variants; selector; unavailable variant |
| Inventory | In stock; unavailable; blocked add |
| Rules/navigation | No rule; minimum; maximum; exact with auto-next; next/back; blocked progression |
| Discounts | No discount; below threshold; eligible tier; highest tier; progress presentation |
| Defaults/slots | No default; selected default; empty slots; partial slots; complete slots |
| Add-ons/gifts | Disabled; paid add-on; free gift; qualified and unqualified states |
| Product cards | Initial; hover; selected; quantity increase/decrease; remove; sale price; long title |
| Summary | Desktop empty; partial; complete; clear/remove; mobile collapsed; mobile expanded |
| Persistence | First load; category switch; reload after selection; step reload |
| Cart | Blocked add; successful add; line properties; discount; `bundle_details` |
| Accessibility | Keyboard category/card/summary flow; names; focus; unavailable state |
| Responsive | `1440x900`; `1280x800`; `768x1024`; `390x844`; `360x800`; no horizontal overflow |

## Case Evidence Contract

Each executed case lives under `/private/tmp/fpb-compact-horizontal-parity/<preset>/<case-id>/` and records:

- Desktop/mobile or tablet screenshots.
- Accessibility snapshot.
- Runtime and persisted preset/config state.
- Computed styles and geometry for the affected surface.
- Relevant console and network evidence.
- Interaction log and explicit Easy Bundles/Wolfpack delta.
- Cart proof when the case reaches cart; otherwise a written not-applicable reason.

## Pairwise and Stress Cases

Status vocabulary at closeout: `Verified`, `Shared-proven`, `EB-absent`, `Not applicable`, or `Accepted divergence`.

| Case | Coverage | Compact | Horizontal | Evidence |
|---|---|---|---|---|
| C00 | Persisted runtime, first render, exact active CSS | Verified | Verified | Live Admin persistence plus base-and-preset-only CDN stylesheet inspection on `5.0.190` |
| C01 | Multi-category, long labels, empty category, manual plus collection products | Verified | Verified | Rich shared fixture; long and empty category labels rendered without page overflow |
| C02 | Product cards, individual variants, sale price, long title, unavailable state | Verified | Verified | Dense mixed catalog replay with variant and compare-at-price cards |
| C03 | Empty, partial, selected, quantity, removal, equal-height stability | Verified | Verified | Add, quantity control, maximum enforcement, remove, and stable selected-card height exercised live |
| C04 | Exact/min/max rules, blocked navigation, auto-next, next/back | Shared-proven | Verified | Horizontal exercised disabled/enabled Next and step progression; Compact uses the unchanged shared controller |
| C05 | Discount threshold, progress, slots, default selection | Shared-proven | Shared-proven | No template runtime logic changed; common pricing, progress, and selection state remain shared |
| C06 | Add-on and gift qualification | Shared-proven | Verified | Horizontal progressed to Add On; Compact uses the unchanged shared step and qualification controller |
| C07 | Desktop sidebar and mobile tray, empty and expanded | Verified | Verified | Persistent desktop summary and responsive mobile review tray rendered live |
| C08 | Reload persistence | Verified | Verified | Cache-bypassed reload retained the persisted preset and active preset stylesheet |
| C09 | Add to cart, properties, discount, `bundle_details` | Verified | Verified | Both persisted presets reached checkout with the selected bundle line through the unchanged shared cart path |
| S01 | `1440x900` and `1280x800` dense content | Verified | Verified | Live dense desktop capture and computed geometry at both widths; no page overflow |
| S02 | `768x1024`, `390x844`, and `360x800` responsive stress | Verified | Verified | Live tablet and mobile computed geometry at all three widths; intrinsic tracks and contained category scrollers prevent page overflow |
| S03 | Keyboard operation, accessible names, focus, no clipping or overflow | Verified | Verified | Accessibility snapshots exposed named category, product, quantity, summary, and navigation controls; no page overflow |

## Current Live Delta

The persisted competitor fixtures establish distinct contracts:

- Compact: three stacked image-first cards per desktop row, two stacked cards per mobile row, pill category tabs, persistent right summary, and mobile summary tray.
- Horizontal: two row cards per desktop row, one row card per mobile row, underline category tabs, persistent right summary, and mobile summary tray.

The initial Wolfpack `5.0.189` Compact replay rendered Horizontal row-card geometry because Compact source CSS duplicated Horizontal row-card rules. Widget `5.0.190` restores Compact's stacked-card contract. Horizontal retains row cards and now uses underline category navigation at desktop and mobile widths.

The closing Wolfpack `5.0.190` replay established:

- Compact desktop: a responsive three-column stacked grid, approximately `703px` wide at the current `1280px` pass, with a responsive right summary.
- Compact mobile: a `370px` product grid at `x=10`, two `177.5px` tracks, a `15px` gap, stable `281.77px` selected-card height, and zero page overflow at the emulated `390x844` viewport.
- Horizontal desktop: two row-card columns with the persistent right summary.
- Horizontal mobile: a `370px` single-column row-card grid, underline category tabs, the mobile summary tray, and zero page overflow at `390x844`.
- Horizontal cart: selection, step progression, Add On, and Add to Cart completed; checkout displayed the selected bundle line.
- Compact cart: selection, quantity controls, step progression, and Add to Cart completed; checkout displayed the selected bundle line.
- Stress widths: Compact and Horizontal both passed `1440x900`, `768x1024`, and `360x800` with zero positive page overflow.

The live fixture has `showTextOnAddButton=false`, so Wolfpack's icon CTA differs from the competitor fixture's text CTA by merchant configuration, not by template behavior.

## Implementation Boundary

- Compact card, category, and responsive geometry belongs to `side-footer-compact.css`.
- Horizontal row geometry belongs to `side-footer-horizontal.css`.
- Preserve shared selection, pricing, timeline, summary, and cart behavior unless browser evidence proves a shared defect.
- Preserve the FPB metafield-first and proxy-fallback config-loading order.
- Preserve Standard, Classic, and PPB behavior.

## Acceptance Criteria

- Both persisted storefront runtime contracts and exact active stylesheet URLs are captured.
- All case cells have a terminal evidence-backed status.
- Compact and Horizontal pass the five required viewports without horizontal overflow or clipped controls.
- Empty, partial, selected, quantity, remove, discount, navigation, reload, and cart paths pass.
- Product cards remain equal-height per row and do not grow on hover, selection, quantity, or variant changes.
- No unexplained app-owned console error or failed widget/cart request remains.
- Standard and Classic smoke checks pass; PPB is smoke-tested only if shared cross-widget code changes.
- Widget build, CSS minification and size gate, syntax checks, focused behavior tests when applicable, ESLint, and Graphify rebuild pass.
- The canonical verification matrix records both templates as verified with evidence paths and served widget version.
