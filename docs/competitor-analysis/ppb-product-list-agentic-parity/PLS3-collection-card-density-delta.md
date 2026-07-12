# PLS3 Collection Card Density Delta

Date: 2026-07-13

Scope: Product Page Bundle Product List only (`PDP_INPAGE + CASCADE`).

Chrome DevTools MCP evidence:
- EB mobile card metrics: `/private/tmp/ppb-product-list-agentic-parity/PLS3-collection-reload/eb-mobile-card-metrics-2026-07-13.json`
- WPB mobile card metrics: `/private/tmp/ppb-product-list-agentic-parity/PLS3-collection-reload/wpb-mobile-card-defect-metrics-2026-07-13.json`
- WPB visual capture: `/private/tmp/ppb-product-list-agentic-parity/PLS3-collection-reload/wpb-mobile-collection-cards-defects-390-2026-07-13.png`

## Fixture

EB and WPB Step 2 both include the 28-product `Automated Collection` plus direct products. This exposed Product List rows with:
- long two-line titles;
- compare-at prices;
- native variant selectors;
- a grouped product with one sellable variant rendered as static variant text.

## EB Source Of Truth

At `390 x 844`:
- Simple rows remain `70px` high.
- `Massage Oil / Grapefruit` remains a `70px` static-variant row without overlap.
- `Yellow Sofa` remains `70px` with its native selector.
- The two subscription rows expand to `85px` because their titles wrap to two lines above price and selector.
- Titles use `14px` type; long titles occupy `36px` without colliding with the price or selector.

## WPB Defect

WPB widget `5.0.147` forces every Product List row and content wrapper to `70px`.

Measured failures:
- `Selling Plans Ski Wax` title occupies `43px`; price starts at `y + 45px`; the static variant text is still inside the title block and collides with the price.
- Subscription titles occupy `34px`, but their price starts at `y + 20px` and selector at `y + 40px`.
- The selector therefore extends past the fixed `70px` row and is clipped by the row's `overflow: hidden`.
- Price, title, and selector visibly overlap on mobile.

## Required Source Fix

- Keep ordinary Product List rows at a stable minimum of `70px`.
- Let variant-selector rows grow from their title, price, and selector content instead of forcing fixed row tracks.
- Lay out static variant identity as its own row below the price, without changing non-Product-List templates.
- Preserve the `90px` action rail and vertical-only Product List overflow.

## Implemented Fix

- Replaced the fixed card and content-wrapper heights with a `70px` minimum height.
- Made selector rows use content-driven title, price, and selector tracks.
- Gave sole-variant identity its own third grid row and extended the action rail across all three rows.
- Limited every selector to `PDP_INPAGE + CASCADE` ownership in `inpage-cascade.css`.

## Post-Fix Evidence

WPB widget `5.0.148` at `390 x 844`:
- `Selling Plans Ski Wax` remains `70px`; title, price, and static variant text no longer overlap or clip.
- Both long subscription rows expand to `84px`; their two-line titles, prices, and selectors remain separated and inside the card.
- Simple rows remain at the `70px` baseline.

Measured result: `/private/tmp/ppb-product-list-agentic-parity/PLS3-collection-reload/wpb-mobile-card-metrics-final-5-0-148-2026-07-13.json`.

Fresh screenshot proof remains pending because the Chrome extension connection became unavailable after the metric capture.
