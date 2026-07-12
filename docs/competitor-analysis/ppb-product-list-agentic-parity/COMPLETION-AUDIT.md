# PPB Product List Completion Audit

Date: 2026-07-13

Objective source: `pasted-text-1.txt` supplied with the active goal.

This audit treats missing or stale evidence as incomplete. It does not infer completion from source scope or passing tests.

| Objective requirement | Current authoritative evidence | Status |
|---|---|---|
| Product Page Bundle, Product List only | Runtime `PDP_INPAGE + CASCADE` markers throughout row evidence and `SPEC.md` | Proven |
| Realistic fixture permutations | PL00-PL08, PLF six-product, PLS1 combined, and PLS3 collection fixtures | Proven |
| EB inspected before WPB changes | Per-row EB source-of-truth sections and Chrome evidence paths | Proven for completed rows |
| Desktop and mobile behavior | Per-row desktop/mobile evidence | Proven except gates below |
| Narrow, default, and wide placements | `PLS7-placement-responsive-evidence.md` | Must be rechecked after `5.0.148` row-grid change |
| Empty, one, two, and overflow selected counts | PL07 evidence set | Proven; `5.0.148` did not change drawer CSS/JS |
| Available, unavailable, grouped variants, and sole sellable variant | PL03, PL04, PLS1 | Proven |
| Add/remove/increment/decrement and minimum state | PL00 quantity evidence, PL07 remove-expanded evidence | Proven |
| Empty drawer click toast | `PL-empty-drawer-toast-evidence.md` | Proven |
| Drawer open/collapse/add/remove/overflow geometry | PL07 evidence set and drawer-top geometry evidence | Proven |
| Loading occupies final widget target | `PL-loading-placement-evidence.md`, PLS1 Step 2 transition | Proven |
| Product card image/title/price/variant/action typography and wrapping | PL03, PL05, PLF, PLS3 card-density evidence | Mobile post-fix proven; desktop post-fix pending |
| Collection hydration and vertical-only overflow | `PLS3-collection-reload-evidence.md`, `PL-product-list-overflow-evidence.md` | Proven |
| Cart success/blocked and Product List cart metadata | PL02 and PL08 | Proven |
| Product Grid, Horizontal Slots, Vertical Slots isolation | `PLS6-other-template-smoke-evidence.md` | Local 50-test baseline proven; live desktop/mobile smoke pending |
| Builds, syntax, lint, graph | Per-slice commit evidence | Final aggregate recheck pending |
| Every finished slice committed | Recent parity commits through `bb3dbc34` | Proven for completed slices |

## Remaining Completion Gates

1. Chrome DevTools MCP: recheck Product List `5.0.148` card rows on desktop.
2. Chrome DevTools MCP: repeat narrow/default/wide placement probes on desktop and mobile after the row-grid change.
3. Chrome DevTools MCP: smoke Product Grid, Horizontal Slots, and Vertical Slots on desktop and mobile.
4. Run final focused behavior tests, build/syntax checks, lint, diff check, and graph rebuild against the final tree.
5. Update `SPEC.md` only after the browser evidence proves each gate.

Chrome was unavailable when this audit was written. That is an external-state blocker for live evidence, not grounds to narrow or complete the goal.
