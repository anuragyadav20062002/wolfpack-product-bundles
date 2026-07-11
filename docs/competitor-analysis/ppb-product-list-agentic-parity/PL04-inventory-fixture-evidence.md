# PL04 Inventory Fixture Evidence

Date: 2026-07-12

Scope: Product Page Bundle Product List only (`PDP_INPAGE` + `CASCADE`).

Evidence files:
- EB desktop: `/private/tmp/ppb-product-list-agentic-parity/PL04-inventory/eb-desktop-inventory-state.json`
- WPB desktop: `/private/tmp/ppb-product-list-agentic-parity/PL04-inventory/wpb-desktop-inventory-state.json`
- EB mobile: `/private/tmp/ppb-product-list-agentic-parity/PL04-inventory/eb-mobile-inventory-state.json`
- WPB mobile: `/private/tmp/ppb-product-list-agentic-parity/PL04-inventory/wpb-mobile-inventory-state.json`

## State Tested

1. Clear cart, local storage, session storage, and Cache Storage.
2. Reload Product List storefront.
3. Capture rendered product rows, add-control enabled state, variant option disabled state, and sold-out/out-of-stock copy presence.
4. Repeat on desktop and a real `390px` mobile viewport.

## Current EB Fixture

Desktop:
- Viewport: `1280 x 800`.
- Row count: `6`.
- Sold-out/out-of-stock copy present: `false`.
- Disabled add controls: none.
- Disabled variant options: none.

Mobile:
- Viewport: `390px` wide.
- Row count: `6`.
- Sold-out/out-of-stock copy present: `false`.
- Disabled add controls: none.
- Disabled variant options: none.

Visible rows:
- `14k Dangling Obsidian Earrings`
- `14k Dangling Pendant Earrings`
- `14k Interlinked Earrings`
- `18k Bloom Earrings`
- `18k Fluid Lines Necklace`
- `18k Pedal Ring`

## Current WPB Fixture

Desktop on widget version `5.0.136`:
- Viewport: `1280 x 800`.
- Row count: `6`.
- Sold-out/out-of-stock copy present: `false`.
- Disabled add controls: none.
- Disabled variant options: none.

Mobile on widget version `5.0.136`:
- Viewport: `390px` wide.
- Row count: `6`.
- Sold-out/out-of-stock copy present: `false`.
- Disabled add controls: none.
- Disabled variant options: none.

Visible rows match the current EB fixture:
- `14k Dangling Obsidian Earrings`
- `14k Dangling Pendant Earrings`
- `14k Interlinked Earrings`
- `18k Bloom Earrings`
- `18k Fluid Lines Necklace`
- `18k Pedal Ring`

## Decision

PL04 out-of-stock and unavailable-variant behavior cannot be proven from the current fixture because both EB and WPB storefronts currently expose only enabled rows and enabled variant options.

No Product List source patch is justified from this evidence. The next PL04 step is fixture setup: create or select a shared Product List fixture where EB and WPB both include at least one sold-out product row and one unavailable variant option, then repeat the same desktop/mobile measurement loop.
