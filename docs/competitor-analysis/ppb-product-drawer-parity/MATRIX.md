---
schema_version: 1
id: ppb-product-drawer-parity-matrix
title: PPB Product Drawer Parity Matrix
type: verification-matrix
status: active
summary: Tracks EB-first storefront parity for PPB Product Grid, Horizontal Slots, and Vertical Slots drawer surfaces.
last_audited: 2026-07-17
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
| HS-D01 | Horizontal Slots | Empty slot opens picker | `PDP_MODAL + MODAL` renders horizontal selected slots and opens the picker drawer/modal from an empty slot. | Prior-live reference: modal-slot contract and Horizontal Slots capacity evidence. | Empty slot click opens picker with current step/category context. | Existing modal-slot keyboard/access tests | S | Replay when EB fixture is switched back to Horizontal Slots. |
| HS-D02 | Horizontal Slots | Picker cards | Picker cards show image/title/price/action; selected cards show check marker + `Added xN`; quantity controls hidden. | Prior-live reference: modal header/card contract. | Product picker card state matches EB behavior. | Existing modal-slot card/control tests | S | No code delta in this slice. |
| HS-D03 | Horizontal Slots | Filled slot replace/remove | Filled slots can be reopened/replaced and removed while returning to the clicked slot target. | Prior-live reference: M03/M04 matrix rows. | Replace/remove keeps slot order stable. | Existing Horizontal Slots and modal-slot tests | S | No code delta in this slice. |
| HS-D04 | Horizontal Slots | Multi-slot/overflow | Minimum rules expose one more reachable slot; exact rules do not expose overflow. | Prior-live reference: modal-slot capacity contract. | Capacity state grows for minimum rules and resets on hard reload. | Existing empty-placeholder tests | P | Existing tests already cover this behavior. |
| HS-D05 | Horizontal Slots | Mobile picker | Mobile picker shows only current step title; body owns validation toast. | Prior-live reference: modal header/toast contract. | Mobile picker close/footer/navigation remain reachable. | Existing modal accessibility tests | S | No code delta in this slice. |
| VS-D01 | Vertical Slots | Empty slot opens picker | Current live EB storefront renders `PDP_MODAL + SIMPLIFIED` with vertical empty slot rows and opens a mobile picker. | Live EB 2026-07-17: body attrs `gbbmix-template-id=SIMPLIFIED`, vertical slot rows, picker open with current step/category tabs. | WPB `5.0.189` renders `wpbmix-template-id=SIMPLIFIED`, vertical rows, and opens picker from Product 1. | Existing modal-slot and vertical tests | P | Captured through direct Chrome DevTools MCP on `yash-wolfpack` and `agent`. |
| VS-D02 | Vertical Slots | Picker cards | EB picker shows current Step 1, category tabs, product cards, variant selector, and footer summary. | Live EB 2026-07-17 mobile snapshot/evaluate data. | WPB picker shows current Step 1, category tabs, product cards, variant selector, and footer summary. | Existing modal-slot keyboard/access tests | P | WPB verified on `ppb-modal-shared-card-test`. |
| VS-D03 | Vertical Slots | Filled row replace/remove | EB vertical filled rows use image, title, remove order; clicked filled row can reopen picker. | Prior-live reference: Vertical Slots filled-row contract. | Filled row opens picker for replacement and remove does not break order. | `ppb-vertical-filled-row.test.ts` | P | Existing TDD coverage remains behavior-only. |
| VS-D04 | Vertical Slots | Multi-slot/overflow | Minimum rules keep a following empty slot; exact rules do not. | Live EB current rows: Step 1 has Product 1/Product 2, Step 2 has Product 1. | WPB Step 1 renders Product 1/Product 2 for the same minimum fixture. | Existing empty-placeholder tests | P | Current WPB fixture is one-step; EB has two-step evidence. |
| VS-D05 | Vertical Slots | Mobile picker | Mobile picker is a bottom sheet/drawer with current step title and internal scroller. | Live EB 2026-07-17 mobile picker. | WPB mobile picker opens as `bw-bs-panel--open` with product cards and close control. | Existing modal accessibility tests | P | Direct MCP evidence, no screenshots committed. |
| X-D01 | Cross-template | Template isolation | EB distinguishes Product Grid, Horizontal Slots, and Vertical Slots via template attrs and orientation flags. | EB reference and current live VS attrs. | WPB must not leak Product Grid drawer state rules into modal slots or vice versa. | Registry/orientation tests plus new Grid drawer tests | P | Product Grid drawer preservation is now explicitly covered. |
| X-D02 | Cross-template | Console/request health | Hard reload should produce app-owned widget data and no drawer-breaking console errors. | Live EB and WPB hard reloads completed. | No deployment; verify after local asset rebuild. | Browser proof | P | WPB hard reload after build returned widget version `5.0.189`; generic theme 404/preload warning observed, no drawer-breaking widget error. |
