# PLF: Six-Product Fixture Permutation Delta

Date: 2026-07-11

Surface: PPB Product List desktop, `PDP_INPAGE` / `CASCADE`.

Evidence source: Chrome DevTools MCP only.

## Fixture Update

EB Admin fixture was updated from 3 products to 6 products in Category 1:

- `14k Dangling Obsidian Earrings`
- `14k Dangling Pendant Earrings`
- `14k Interlinked Earrings`
- `18k Bloom Earrings`
- `18k Fluid Lines Necklace`
- `18k Pedal Ring`

EB save completed with the Shopify Admin save bar and showed `Updated Successfully`.

WPB Admin fixture already showed the same 6 product names after its prior save.

## EB Storefront Evidence

URL:
`https://yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`

Runtime body attributes:

- `gbbmix-template-type="PDP_INPAGE"`
- `gbbmix-template-id="CASCADE"`
- `gbb-mix-consolidated-design="true"`

Measured after clearing Cache Storage and reloading:

- Product wrapper width: `345px`
- Product row height: `70px`
- Product row gap: `10px`
- Scrollable products wrapper: `max-height: 410px`, `overflow-y: auto`
- `18k Fluid Lines Necklace`: sellable row with `Add +`
- `18k Pedal Ring`: sellable row with variant selector values `6, 7, 8, 9, 10, 11` and `Add +`

Raw measurement file, not committed:
`/private/tmp/eb-ppb-product-list-six-row-evidence.json`

## WPB Storefront Evidence

URL:
`https://46twl942bo5xdbsz-82138693891.shopifypreview.com/products_preview?preview_key=cecee83a638b620eb94a26cb2da77f7a`

Runtime:

- `window.__BUNDLE_WIDGET_VERSION__ = "5.0.130"`

Measured after clearing Cache Storage and reloading:

- Product wrapper width: `456px`
- Product row height: `70px`
- Product row gap: `10px`
- `18k Fluid Lines Necklace`: out-of-stock row
- `18k Pedal Ring`: out-of-stock row, no variant selector rendered
- Empty drawer pill still shows `View Bundle Items 0`

Raw measurement file, not committed:
`/private/tmp/wpb-ppb-product-list-six-row-evidence.json`

## Delta

This is currently a fixture/data mismatch, not a proven styling bug:

- EB fixture has a sellable variant-bearing row for `18k Pedal Ring`.
- WPB fixture has `18k Pedal Ring` as out of stock, so the variant selector path cannot be compared yet.
- EB fixture has `18k Fluid Lines Necklace` sellable.
- WPB fixture has `18k Fluid Lines Necklace` out of stock.

Before changing Product List UI for this permutation, make the WPB fixture inventory/product state match EB or pick a different shared set of in-stock/variant products in both stores.

## Next Step

Use Chrome DevTools MCP against Shopify Admin to update the WPB fixture inventory or choose replacement products, then repeat the same EB/WPB storefront measurement loop.
