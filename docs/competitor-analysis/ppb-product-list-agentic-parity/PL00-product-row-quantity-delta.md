# PL00 Product Row Quantity Delta

## 2026-07-11 Evidence Pass

Browser evidence source: Chrome DevTools MCP only.

EB reference: `https://yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`

WPB fixture: `https://46twl942bo5xdbsz-82138693891.shopifypreview.com/products_preview?preview_key=cecee83a638b620eb94a26cb2da77f7a`

Viewport:
- Mobile: `390 x 844`

Measured EB Product List row:
- Row width: `345px`
- Row columns: `245px 90px`
- Add button: `90px x 32px`
- Selected quantity wrapper: `90px x 32px`
- Quantity buttons: `32px x 32px`

Measured WPB before fix:
- Runtime version: `5.0.124`
- Row width: `347px`
- Row columns: `70px 267px`
- Product List action variable: `clamp(70px, 24vw, 82px)`
- Add button: `82px x 32px`
- Selected quantity buttons: `29px x 32px`

Delta:
- WPB mobile action rail is capped at `82px`, while EB keeps `90px`.
- The narrowed rail shrinks selected quantity controls and makes the selected state visibly tighter than EB.

Source owner:
- `app/assets/widgets/product-page-css/templates/inpage-cascade.css`
- The mobile media rule overrides `--bw-ppb-cascade-product-action-width` to `clamp(70px, 24vw, 82px)`.

Fix direction:
- Keep the Product List action rail at `90px` on mobile so default Add and selected quantity controls match EB.

## 2026-07-11 Fix Verification

WPB refreshed runtime:
- `window.__BUNDLE_WIDGET_VERSION__ = "5.0.125"`
- Mobile viewport: `390 x 844`

Measured WPB after fix:
- Product List action variable: `90px`
- Default Add button: `90px x 32px`
- Selected quantity wrapper: `90px x 32px`
- Quantity decrement button: `32px x 32px`
- Quantity value: `24px x 25.2px`
- Quantity increment button: `32px x 32px`

Result:
- The previous `82px` mobile action rail is removed.
- Default Add and selected quantity controls now match EB's measured `90px` rail and `32px` control buttons.
