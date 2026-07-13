# PPB Modal Parity Matrix (100% Modal Lane)

Objective date: 2026-07-13

This matrix tracks EB parity claims for modal-entry Product Page Bundle surfaces only.
Statuses are required evidence states for each template×feature×viewport pairing and
must reference direct EB+WPB evidence artifacts.

## Legend

- **P**: Proven with direct EB and WPB evidence for the stated state.
- **S**: Shared-path proof only (not yet template-specific EB/WPB proof).
- **T**: Not tested / not proven.
- **N/A**: Not applicable to this template/surface.

## Scope and applicability

- Horizontal Slots: `PDP_MODAL + MODAL` (Horizontal)
- Vertical Slots: `PDP_MODAL + SIMPLIFIED` (Vertical)
- Product Grid / Product List: modal-entrypoint only when the current evidence fixture explicitly renders a modal picker.
  - If no modal entrypoint is exercised in a row, status is `N/A`.

## Feature parity ledger

| ID | Feature | Required state | PL | PG | HS | VS |
| --- | --- | --- | --- | --- | --- | --- |
| MCP-1 | Product-card hierarchy (image/title/price/action/selection) | baseline modal picker card render with inventory + added state | N/A | N/A | **P** HS02, HS19 | **P** VS04 |
| MCP-2 | Product-card spacing and hover/overflow behavior | long labels + media mix + hover expansion if enabled | N/A | N/A | **P** HS02, HSS2 | **P** VS02 |
| MCP-3 | Product-card action states | default add / selected selected-count states preserved on re-open | N/A | N/A | **P** HS19 | **P** VS04 |
| MCP-4 | Category tabs | non-empty tabs + empty/disabled tab behavior + overflow scrolling | N/A | N/A | **P** HS01 | **P** VS05 |
| MCP-5 | Category tab switching | step/catalog changes after tab switch; no stale summary leak | N/A | N/A | **P** HS01 | **P** VS05 |
| MCP-6 | Step tabs / Next-Back | active/completed state and progression under exact/overflow rules | N/A | N/A | **P** HS05 | **P** VS03 |
| MCP-7 | Step progress visibility | visible when progression applies and hidden when disabled | N/A | N/A | **S** HS19 focuses modal copy only | **P** VS03 |
| MCP-8 | Discount messaging text | progress + success + locale/custom token replacement | **P** via product-list parity fixtures, non-modal | **S** shared modal-card unit/family + no modal EB replay | **P** HS06, HS19 | **P** VS03 |
| MCP-9 | Toast ownership and behavior | body-mounted, dismissible, overlay-safe | N/A | N/A | **P** HS19 | **P** VS04 |
| MCP-10 | Summary footer and pills | selected list, active state, CTA enablement, overflow handling | N/A | N/A | **S** Shared-source summary and unit tests; visual summary row captured in HS05/HS15 where applicable | **P** VS03 |
| MCP-11 | Modal accessibility | keyboard, close, backdrop, body lock, focus path baseline | N/A | N/A | **S** HS17 confirms scroll/body lock, Escape behavior diverges intentionally | **P** VS03 |
| MCP-12 | Desktop/mobile parity | 390x844 and 1280+ geometry, overflow zero | **N/A** in modal scope | **N/A** in modal scope | **P** HS09, HSS2, HSP1 | **P** VS00, VS04 |
| MCP-13 | Modal close/return behavior | close + escape + reopen + no residual state bleed | N/A | N/A | **P** HS17 | **P** VS03 |
| MCP-14 | Slot orientation isolation | horizontal or vertical slot shell only, no sibling shell bleed | N/A | N/A | **P** HS09 | **P** VS00 |

## Modal evidence debt (deferred)

- **S** status cells are not complete for modal parity closure without template-specific EB+WPB replay.
- High-priority next captures:
  1. `MCP-8`/`MCP-10` for `PG`/`PL` if modal entrypoints exist in the active fixtures.
  2. `MCP-7` and `MCP-10` for HS with equivalent desktop/mobile cross-checks.
  3. `MCP-9` for vertical/horizontal variants where variant-switched content shifts the toast container.

## Closure rule

A modal cell is only promoted to **P** when:
1) EB runtime config is captured for the same saved state,
2) EB storefront DOM/state evidence is captured,
3) WPB storefront equivalent is captured under the same fixture,
4) both desktop and mobile evidence rows exist,
5) the evidence artifacts are linked in this ledger.
