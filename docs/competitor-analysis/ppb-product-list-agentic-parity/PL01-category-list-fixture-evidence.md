# PL01 Category List Fixture Evidence

Date: 2026-07-12

Scope: Product Page Bundle Product List only (`PDP_INPAGE` + `CASCADE`).

Evidence files:
- EB desktop: `/private/tmp/ppb-product-list-agentic-parity/PL01-category-list/eb-desktop-category-state.json`
- WPB desktop: `/private/tmp/ppb-product-list-agentic-parity/PL01-category-list/wpb-desktop-category-state.json`
- EB mobile: `/private/tmp/ppb-product-list-agentic-parity/PL01-category-list/eb-mobile-category-state.json`
- WPB mobile: `/private/tmp/ppb-product-list-agentic-parity/PL01-category-list/wpb-mobile-category-state.json`

## State Tested

1. Clear cart, local storage, session storage, and Cache Storage.
2. Reload EB and WPB Product List storefronts.
3. Capture category/tab candidates, active-state attributes, visible Product List rows, and runtime/template markers.
4. Repeat on desktop and a real `390px` mobile viewport.

## EB Current Fixture

Desktop:
- Viewport: `1280 x 800`.
- Category/tab controls found: `0`.
- Visible Product List rows: `6`.

Mobile:
- Viewport: `390px` wide.
- Category/tab controls found: `0`.
- Visible Product List rows: `6`.

Visible rows:
- `14k Dangling Obsidian Earrings`
- `14k Dangling Pendant Earrings`
- `14k Interlinked Earrings`
- `18k Bloom Earrings`
- `18k Fluid Lines Necklace`
- `18k Pedal Ring`

## WPB Current Fixture

Desktop on widget version `5.0.136`:
- Template marker: `PDP_INPAGE`.
- Design preset marker: `CASCADE`.
- Category/tab controls found: `0`.
- Visible Product List rows: `6`.

Mobile on widget version `5.0.136`:
- Template marker: `PDP_INPAGE`.
- Design preset marker: `CASCADE`.
- Category/tab controls found: `0`.
- Visible Product List rows: `6`.

Visible rows match EB:
- `14k Dangling Obsidian Earrings`
- `14k Dangling Pendant Earrings`
- `14k Interlinked Earrings`
- `18k Bloom Earrings`
- `18k Fluid Lines Necklace`
- `18k Pedal Ring`

## Decision

PL01 multiple-category behavior cannot be proven from the current fixture because neither EB nor WPB renders category controls, long category labels, an empty category, or category switching states.

No Product List source patch is justified from this evidence. The next PL01 step is fixture setup in EB and WPB with at least:
- two populated categories,
- one long category label,
- one empty category,
- category switching on desktop and mobile.

After that fixture exists, repeat this same Chrome DevTools MCP probe and compare active/inactive tab styling, wrapping, empty-state behavior, and row updates.
