# PLS3 Collection And Reload Evidence

Date: 2026-07-13

Scope: Product Page Bundle Product List only (`PDP_INPAGE + CASCADE`).

## Fixture

- EB Step 2 and WPB Step 2 each use the 28-product `Automated Collection` alongside direct products.
- The stores have different inventory, so post-hydration visible-row counts are expected to differ.
- EB does not preserve an empty manual PPB category; the no-product substate remains EB-absent and is not implemented as WPB-only behavior.

## Collection Hydration

Chrome DevTools MCP captured WPB requesting:

`GET /apps/product-bundles/api/storefront-collections?handles=automated-collection&shop=agent...`

The request returned `200` with all 28 collection source records. WPB then rendered 22 sellable rows after inventory filtering. EB's runtime collection also contained 28 source records and rendered 24 sellable rows after its store-specific inventory filtering.

WPB response evidence: `/private/tmp/ppb-product-list-agentic-parity/PLS3-collection-reload/wpb-storefront-collections-response-2026-07-13.network-response`.

## Overflow And Reload State

At desktop width:
- WPB: `clientHeight 410`, `scrollHeight 1752`, `overflowY auto`.
- EB: `clientHeight 410`, `scrollHeight 1959`, `overflowY auto`.
- Both hydrate collection products into the same capped, vertically scrollable Product List region.

At mobile width, WPB retains the explicit `410px` vertical-scroll threshold requested for long Product Lists. EB expands the full list in the captured store. This intentional WPB behavior is documented in `PL-product-list-overflow-evidence.md` and is not treated as an accidental card overflow.

The Step 2 transition and hard reload both hydrate the collection through the Product List target. Loading-position evidence remains covered by `PL-loading-placement-evidence.md` and the combined transition proof in `PLS1-combined-stress-evidence.md`.

## Card Density Follow-Up

The collection fixture exposed fixed-height card defects for long titles, selectors, and sole-variant identity. The measured delta and widget `5.0.148` correction are recorded in `PLS3-collection-card-density-delta.md`.

## Final Recheck

Widget `5.0.148` passed the desktop card geometry check and the repeated desktop/mobile placement probes. Ordinary rows remain at the `70px` baseline, long selector rows grow without overlap or clipping, and no tested placement creates horizontal overflow.

Decision: PLS3 collection hydration, reload behavior, overflow, and the collection-exposed card-density states are accepted.
