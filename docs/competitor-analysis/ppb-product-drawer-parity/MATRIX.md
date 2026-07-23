---
schema_version: 1
id: ppb-product-drawer-parity-matrix
title: PPB Product Drawer Parity Matrix
type: verification-matrix
status: active
summary: Tracks EB-first storefront parity for PPB Product Grid, Horizontal Slots, and Vertical Slots drawer surfaces.
last_audited: 2026-07-20
owners:
  - Wolfpack Product Bundles
domains:
  - storefront
systems:
  - product-page-bundle-widget
source_paths:
  - app/assets/widgets/product-page
related_docs:
  - docs/competitor-analysis/ppb-feature-to-storefront-matrix.md
  - docs/competitor-analysis/ppb-product-modal-parity-matrix.md
  - internal docs/EB Implementation Reference.md
tags:
  - ppb
  - parity
keywords:
  - product drawer parity
  - Product Grid
  - Horizontal Slots
  - Vertical Slots
---

# PPB Product Drawer Parity Matrix

**Scope:** Product Grid selected drawer/footer, Horizontal Slots picker drawer/modal and filled slots, Vertical Slots picker drawer/modal and filled rows.

**Evidence rule:** Promote a row to **P** only with EB-first storefront evidence and equivalent WPB evidence. Source tests alone are not enough.

## Status Keys

| Status | Meaning |
| --- | --- |
| **P** | Proven with EB-first storefront evidence and equivalent WPB proof |
| **S** | Shared-path or prior-live evidence exists; replay if the row changes |
| **X** | Tested and accepted divergence |
| **E** | EB-absent in the tested configuration |
| **N/A** | Structurally not applicable |
| **T** | Not yet tested in this drawer-focused pass |

## Matrix

| Row ID | Template | Fixture state | EB drawer contract | EB evidence | WPB expected behavior | TDD coverage | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PG-D01 | Product Grid | Empty/closed selected drawer | `PDP_INPAGE + COGNIVE` uses the in-page selected-items drawer/footer path; empty state stays closed. | Prior-live reference: `internal docs/EB Implementation Reference.md` Product Grid interaction contract. | Empty selected drawer remains closed and does not show stale selected rows. | `ppb-list-selected-entries.test.ts` drawer state helpers | S | Replay when EB fixture is switched back to Product Grid. |
| PG-D02 | Product Grid | One selected product | Selected card switches to quantity-aware `Added xN`; selected drawer count reflects total quantity. | Prior-live reference: Product Grid section in EB reference. | Drawer count and row data update without losing state. | New Product Grid preservation tests in `ppb-list-selected-entries.test.ts` | P | WPB hard reload on 2026-07-17 confirmed `PDP_INPAGE + COGNIVE`; selecting one item showed `Added x1` and selected row data. |
| PG-D03 | Product Grid | Multiple selections/overflow | Selected row list preserves selection identity and scrolls after the visible-row cap. | Prior-live reference plus existing `getCascadeSelectedDrawerHeight` evidence. | Open Product Grid drawer remains open after selection/removal re-renders. | New Product Grid render/update preservation tests | P | WPB 2026-07-17: opened Product Grid drawer, selected a second item, drawer retained open classes/`aria-expanded=true` and showed both rows. |
| PG-D04 | Product Grid | Validation/CTA/toast | Incomplete `Next` stays active and shows a non-dismissible bottom toast. | Prior-live reference: Product Grid validation contract. | CTA feedback is not suppressed by disabled action state. | Existing Product Grid interaction tests | S | No code delta in this slice. |
| PG-D05 | Product Grid | Mobile drawer | Mobile keeps card actions reachable and drawer state stable. | Prior-live reference: Product Grid mobile card contract. | Mobile hard reload preserves template attrs and drawer behavior. | Browser proof only | T | Needs EB replay after template switch. |
| PG-D06 | Product Grid | Variant/long-title/media row | Selection identity is category + variant scoped; grouped selector visual reset does not overwrite stored selected row. | Prior-live reference: Product Grid selected-card state contract. | Selected row uses stored selected variant, not the current selector default. | Existing Product Grid interaction tests | S | No code delta in this slice. |
| HS-D01 | Horizontal Slots | Empty slot opens picker | `PDP_MODAL + MODAL` renders horizontal selected slots and opens the picker drawer/modal from an empty slot. | Live EB 2026-07-20: Horizontal Slots fixture opened the shared picker from an empty slot on desktop and mobile. | WPB cache-cleared replay exposed `PDP_MODAL + MODAL`, horizontal orientation, and the clicked Step 2 context. | Existing modal-slot keyboard/access tests | P | Direct Chrome DevTools MCP replay at 1280x800 and 390x844. |
| HS-D02 | Horizontal Slots | Picker cards | Picker cards show image/title/price/action; selected cards show check marker + `Added xN`; quantity controls hidden. | Live EB 2026-07-20: shared desktop/mobile card grid and selection state captured. | WPB selection changed the action to `Added x1`, kept quantity controls hidden, and retained the one-item footer count. | Existing modal-slot card/control tests | P | Desktop shell was 1280x680 with four 254.75px cards; mobile used two 165px columns. |
| HS-D03 | Horizontal Slots | Filled slot replace/remove | Filled slots can be reopened/replaced and removed while returning to the clicked slot target. | Live EB filled-slot contract and prior M03/M04 evidence. | WPB filled slot reopened; selecting a different product replaced the exact-one selection without a validation toast; remove restored the empty slot. | `ppb-vertical-filled-row.test.ts` replacement case plus modal-slot tests | P | Fresh desktop replay completed the empty, select, close, reopen, replace, remove loop. |
| HS-D04 | Horizontal Slots | Multi-slot/overflow | Minimum rules expose one more reachable slot; exact rules do not expose overflow. | Live EB fixture exposed Step 1 Product 1/Product 2 and exact-one Step 2 Product 1. | WPB hard reload exposed the same two-slot minimum and one-slot exact capacities. | `ppb-horizontal-slots-empty-placeholders.test.ts` | P | Live capacity proof reconciled with focused behavior coverage. |
| HS-D05 | Horizontal Slots | Mobile picker | Mobile picker shows only current step title; body owns validation toast. | Live EB 2026-07-20: 390x844 panel measured 390x717.39 with a 147px header and reachable 270x76 footer. | WPB matched the panel/header/body/footer geometry, showed only the current step, and exposed a 45x45 close control without a duplicate handle. | Existing modal accessibility and toast-placement tests | P | Cache Storage cleared and hard reload bypassed cache before replay. |
| VS-D01 | Vertical Slots | Empty slot opens picker | `PDP_MODAL + SIMPLIFIED` renders vertical empty slot rows and opens the shared picker. | Live EB 2026-07-20: Vertical Slots fixture opened from Product 1 on desktop and mobile. | WPB exposed `PDP_MODAL + SIMPLIFIED`, vertical orientation, and opened the picker from Product 1. | Existing modal-slot and vertical tests | P | Direct Chrome DevTools MCP replay on both storefronts. |
| VS-D02 | Vertical Slots | Picker cards | EB picker shows the compact step rail, product cards, category context, and footer summary. | Live EB 2026-07-20: desktop shell measured 1280x680 with 351px comparable cards; mobile shell measured 390x717.39. | WPB matched shell/rail/footer geometry; comparable Step 1 cards measured about 351px desktop and 264px mobile. | Existing modal-slot keyboard/access tests plus `ppb-modal-step-rail.test.ts` | P | Responsive card height is content-driven; mixed product content may grow beyond the comparable baseline. |
| VS-D03 | Vertical Slots | Filled row replace/remove | EB vertical filled rows use image, title, remove order; clicked filled row can reopen picker. | Live EB filled-row contract and prior Vertical Slots evidence. | WPB filled row reopened; exact-one replacement changed the product with count one and no toast; remove restored Product 1. | `ppb-vertical-filled-row.test.ts` | P | Fresh desktop replay proved replacement and remove behavior. |
| VS-D04 | Vertical Slots | Multi-slot/overflow | Minimum rules keep a following empty slot; exact rules do not. | Live EB rows exposed Step 1 Product 1/Product 2 and Step 2 Product 1. | WPB rendered the same minimum-rule and exact-rule capacities after hard reload. | Existing empty-placeholder tests | P | Capacity behavior is shared by the two modal-slot orientations. |
| VS-D05 | Vertical Slots | Mobile picker | Mobile picker is a bottom sheet/drawer with current step title and internal scroller. | Live EB 2026-07-20: panel, header, body, close, cards, and footer measured at 390x844. | WPB matched the 390x717.39 panel, 147px header, body scroller, 45x45 close, two-column cards, and 270x76 footer. | Existing modal accessibility tests | P | Cache-cleared direct MCP evidence; no screenshots committed. |
| X-D01 | Cross-template | Template isolation | EB distinguishes Product Grid, Horizontal Slots, and Vertical Slots via template attrs and orientation flags. | EB reference and current live VS attrs. | WPB must not leak Product Grid drawer state rules into modal slots or vice versa. | Registry/orientation tests plus new Grid drawer tests | P | Product Grid drawer preservation is now explicitly covered. |
| X-D02 | Cross-template | Console/request health | Hard reload should produce app-owned widget data and no drawer-breaking console errors. | Live EB and WPB hard reloads completed. | No deployment; verify after local asset rebuild. | Browser proof | P | WPB hard reload after build returned widget version `5.0.189`; generic theme 404/preload warning observed, no drawer-breaking widget error. |
