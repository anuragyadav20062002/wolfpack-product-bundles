# PPB Modal Parity Matrix (100% Modal Lane)

Objective date: 2026-07-13

This matrix tracks EB parity claims for modal-entry Product Page Bundle surfaces only.
Statuses are evidence-required states for each template×feature×viewport pairing.

## Legend

- **P**: Proven with direct EB and WPB evidence for the stated state.
- **S**: Shared-path proof only (not yet template-specific EB/WPB proof).
- **T**: Not tested / not proven.
- **N/A**: Not applicable to this template/surface.

## Scope and applicability

- Horizontal Slots: `PDP_MODAL + MODAL` (Horizontal)
- Vertical Slots: `PDP_MODAL + SIMPLIFIED` (Vertical)
- Product List / Product Grid: only rows where the active fixture renders an actual modal picker surface are scored.

| ID | Feature | Required state | Evidence links (current captured rows) | PL | PG | HS | VS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MCP-1 | Product-card hierarchy (image/title/price/action/selection) | Baseline modal picker card render with inventory + added state | `HS02`, `HS19`, `VS04` | N/A | N/A | **P** | **P** |
| MCP-2 | Product-card spacing, hover, overflow | Long labels + mixed media + hover-expansion path with no overflow/clipping | `HS02`, `HSS2`, `VS02` | N/A | N/A | **P** | **P** |
| MCP-3 | Product-card action states | Add / selected / count states preserved after reopen | `HS19`, `VS04` | N/A | N/A | **P** | **P** |
| MCP-4 | Category tabs | Non-empty tabs + empty/disabled behavior + scroll overflow | `HS01`, `VS05` | N/A | N/A | **P** | **P** |
| MCP-5 | Category tab switching | Switching changes catalog and step context without stale summary bleed | `HS01`, `VS05` | N/A | N/A | **P** | **P** |
| MCP-6 | Step tabs / Next-Back progression | Active/completed tab state and forward/back progression under exact/overflow | `HS05`, `VS03` | N/A | N/A | **P** | **P** |
| MCP-7 | Discount/step progress visibility | Progress text appears only in active states and hides when disabled | `HS19`, `VS03` (desktop focus; mobile gap for HS remains) | N/A | N/A | **S** | **P** |
| MCP-8 | Discount messaging text & variable replacement | `progressText`, `successText`, locale and custom tokens | `PL*` (non-modal parity baseline), `HS06`, `HS19`, `VS03` | N/A* | N/A* | **S** | **P** |
| MCP-9 | Toast ownership and behavior | Body-mounted, dismissible, overlay-safe toast geometry | `HS19`, `VS04` | N/A | N/A | **P** | **P** |
| MCP-10 | Summary footer / pills | Selected chips or list, CTA enablement/disabled behavior, overflow handling | `HS05`, `HS15`, `VS03` | N/A | N/A | **S** | **P** |
| MCP-11 | Modal accessibility baseline | Keyboard close/focus/backdrop/body lock paths | `HS17`, `VS03`, `VS11` | N/A | N/A | **S** | **P** |
| MCP-12 | Desktop/mobile parity | 390x844 and 1280+ geometry + overflow checks | `HS02`, `HS09`, `HSS2`, `HSP1`, `VS00`, `VS04` | N/A | N/A | **P** | **P** |
| MCP-13 | Modal close/open return | Close, Escape, reopen, and state restoration | `HS17`, `VS03` | N/A | N/A | **P** | **P** |
| MCP-14 | Slot orientation isolation | Only active orientation child-order and shell styles | `HS09`, `VS00` | N/A | N/A | **P** | **P** |

Notes:
- `PL*` and `PG*` entries in this modal matrix are placeholders for any future shared modal fixtures in Product List/Grid pathways.
- Cells remain **S**/**T** until EB+WPB same-state desktop and mobile evidence is captured.

## Modal evidence debt (deferred)

- **S** status cells are not complete for modal parity closure without template-specific EB+WPB replay.
- High-priority first captures:
  1. `MCP-8` and `MCP-10` for modal rows in PG/PL if modal entrypoint fixtures are added.
  2. Desktop+mobile proof for `MCP-7`/`MCP-10` in Horizontal Slots.
  3. Toast baseline re-check when variant selection changes in Vertical Slots (`MCP-9`).

## Closure rule

A modal cell is promoted to **P** only when all conditions are met:
1) EB runtime config is captured for the same saved state,
2) EB storefront DOM/state evidence is captured,
3) WPB storefront equivalent is captured under the same fixture,
4) both desktop and mobile evidence rows exist,
5) evidence artifacts are linked in this ledger.
