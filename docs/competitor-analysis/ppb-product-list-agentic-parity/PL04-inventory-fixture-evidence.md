# PL04 Inventory Fixture Evidence

Date: 2026-07-12

Scope: Product Page Bundle Product List only (`PDP_INPAGE` + `CASCADE`).

Evidence files:
- EB desktop: `/private/tmp/ppb-product-list-agentic-parity/PL04-inventory/eb-desktop-inventory-state.json`
- WPB desktop: `/private/tmp/ppb-product-list-agentic-parity/PL04-inventory/wpb-desktop-inventory-state.json`
- EB mobile: `/private/tmp/ppb-product-list-agentic-parity/PL04-inventory/eb-mobile-inventory-state.json`
- WPB mobile: `/private/tmp/ppb-product-list-agentic-parity/PL04-inventory/wpb-mobile-inventory-state.json`
- EB desktop refresh: `/private/tmp/ppb-product-list-agentic-parity/PL04-inventory/eb-desktop-inventory-state-refresh.json`
- EB mobile refresh: `/private/tmp/ppb-product-list-agentic-parity/PL04-inventory/eb-mobile-inventory-state-refresh.json`
- WPB desktop refresh: `/private/tmp/ppb-product-list-agentic-parity/PL04-inventory/wpb-desktop-inventory-state-refresh.json`
- WPB mobile refresh: `/private/tmp/ppb-product-list-agentic-parity/PL04-inventory/wpb-mobile-inventory-state-refresh.json`

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

## Refresh Pass

Chrome DevTools MCP was re-run against the same EB and WPB Product List fixtures after cache clearing and cache-bypass navigation.

EB refresh:
- Desktop and mobile both render the same six visible rows.
- Sold-out/out-of-stock/unavailable copy present: `false`.
- Disabled product Add controls: none.
- Disabled variant options: none.
- `18k Pedal Ring` exposes selectable variants `6`, `7`, `8`, `9`, `10`, `11`.

WPB refresh:
- Desktop and mobile both render the same six visible rows.
- Widget version: `5.0.136`.
- Runtime markers remain `data-ppb-template-type="PDP_INPAGE"` and `data-ppb-design-preset="CASCADE"`.
- Sold-out/out-of-stock/unavailable copy present: `false`.
- Disabled product Add controls: none.
- Disabled variant options: none.
- `18k Pedal Ring` exposes selectable variants `6`, `7`, `8`, `9`, `10`, `11`.

Refresh decision: unchanged. The current fixture still does not exercise PL04's required sold-out product row or unavailable variant state. WPB matches EB for the enabled-only inventory state, and no source patch is justified until an EB fixture exposes the missing inventory states.

## 2026-07-13 mixed-inventory fixture

Chrome DevTools MCP was used to configure and inspect both stores.

EB fixture:
- `Massage Oil / Grapefruit` was set to `1` available; Pepper and Rosemary remained `0` with sell-when-out-of-stock disabled.
- All three variants were selected into Step 2.
- EB renders one `Massage Oil` row using Grapefruit, shows `Grapefruit` as plain variant text below the price, and exposes no selector because only one variant is sellable.
- Pepper and Rosemary are absent rather than disabled or labelled sold out.
- Evidence: `/private/tmp/ppb-product-list-agentic-parity/PL04-inventory/eb-admin-massage-oil-grapefruit-stock-2026-07-13.json`, `/private/tmp/ppb-product-list-agentic-parity/PL04-inventory/eb-desktop-massage-oil-step2-2026-07-13.json`, and `/private/tmp/ppb-product-list-agentic-parity/PL04-inventory/eb-desktop-massage-oil-dom-2026-07-13.json`.

WPB mirror fixture:
- `Selling Plans Ski Wax` has one sellable variant and two unavailable variants.
- The fully unavailable `The Out of Stock Snowboard` was also selected into Step 2.
- WPB correctly omits the fully unavailable product and the two unavailable variants.
- WPB renders the surviving `Selling Plans Ski Wax` variant as a plain product row but omits its variant identity.
- Evidence: `/private/tmp/ppb-product-list-agentic-parity/PL04-inventory/wpb-admin-step2-inventory-products-save-2026-07-13.json` and `/private/tmp/ppb-product-list-agentic-parity/PL04-inventory/wpb-desktop-step2-inventory-settled-2026-07-13.json`.

Measured delta:
- EB retains the sole surviving variant title after filtering; WPB loses the original multi-variant context and renders no variant title.
- Preserve the original variant count during Product Page inventory normalization, then expose the sole sellable variant title only to Product List/Cascade cards. Do not reintroduce unavailable options or a sold-out row.

## 2026-07-13 implementation proof

Widget `5.0.147` preserves the source variant count during Product Page normalization and adds the sole sellable variant title only to grouped Cascade/Product List card data.

Final desktop and mobile results:
- WPB renders `Selling Plans Ski Wax` with the sole sellable variant title `Special Selling Plans Ski Wax`.
- The row has no variant selector because there is only one customer-selectable variant.
- The other two unavailable variants remain absent.
- The fully unavailable `The Out of Stock Snowboard` remains absent.
- No sold-out/out-of-stock/unavailable copy is rendered, matching EB's omission behavior.
- Product rows retain the same `70px` height at desktop and `390x844` mobile.

Final evidence:
- EB mobile: `/private/tmp/ppb-product-list-agentic-parity/PL04-inventory/eb-mobile-step2-mixed-inventory-390-2026-07-13.json`
- WPB desktop: `/private/tmp/ppb-product-list-agentic-parity/PL04-inventory/wpb-desktop-step2-distinct-sole-variant-5-0-147.json`
- WPB mobile: `/private/tmp/ppb-product-list-agentic-parity/PL04-inventory/wpb-mobile-step2-distinct-sole-variant-390-5-0-147.json`

Decision: PL04 is accepted for fully unavailable products and partially unavailable grouped variants on desktop and mobile.
