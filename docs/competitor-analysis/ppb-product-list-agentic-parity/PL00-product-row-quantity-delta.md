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
- Add button typography: `12px`, `700`, `line-height: normal`
- Selected quantity wrapper: `90px x 32px`
- Quantity buttons: `32px x 32px`
- Quantity button typography: `14px`, `700`, `25.2px`
- Quantity value typography: `12px`, `500`, `21.6px`

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

## 2026-07-11 Typography Follow-up

Measured EB mobile action typography:
- Add button: `12px`, `700`, `line-height: normal`
- Quantity decrement/increment buttons: `14px`, `700`, `25.2px`
- Quantity value: `12px`, `500`, `21.6px`

Measured WPB mobile action typography on version `5.0.125`:
- Add button: `14px`, `700`, `14px`
- Quantity decrement/increment buttons: `14px`, `700`, `25.2px`
- Quantity value: `14px`, `500`, `25.2px`

Delta:
- WPB Add text and selected quantity value are too large on mobile.
- WPB +/- buttons already match EB and should not change.

Source owner:
- `app/assets/widgets/product-page-css/templates/inpage-cascade.css`
- The Product List `.product-add-btn` and `.bw-quantity-control__value` rules own these values.

Fix direction:
- Add a mobile-scoped override so Product List Add text and quantity value use EB's measured `12px` typography while leaving +/- controls at `14px`.

## 2026-07-11 Typography Fix Verification

WPB refreshed runtime:
- `window.__BUNDLE_WIDGET_VERSION__ = "5.0.126"`
- Mobile viewport: `390 x 844`

Measured WPB after typography fix:
- Add button: `90px x 32px`, `12px`, `700`, `line-height: normal`
- Quantity decrement button: `32px x 32px`, `14px`, `700`, `25.2px`
- Quantity value: `24px x 21.59px`, `12px`, `500`, `21.6px`
- Quantity increment button: `32px x 32px`, `14px`, `700`, `25.2px`

Result:
- Add text now matches EB's measured mobile typography.
- Quantity value now matches EB's measured mobile typography.
- Quantity decrement/increment button typography remains unchanged and still matches EB.

## 2026-07-13 Selected Radius Follow-up

Browser evidence source: Chrome DevTools MCP only.

Evidence files:
- EB selected leaf proof: `/private/tmp/ppb-product-list-agentic-parity/PL00-quantity-radius/eb-desktop-after-selected-radius-leaf.json`
- WPB served before fix: `/private/tmp/ppb-product-list-agentic-parity/PL00-quantity-radius/wpb-selected-radius-current-page5.json`
- WPB local proof after source fix: `/private/tmp/ppb-product-list-agentic-parity/PL00-quantity-radius/wpb-selected-radius-local-proof.json`
- WPB local proof screenshot: `/private/tmp/ppb-product-list-agentic-parity/PL00-quantity-radius/wpb-selected-radius-local-proof.png`

Measured EB selected state:
- Visible selected action uses the same `5px` radius as the default Add action.
- EB's hidden quantity wrapper can report `100px`, but the visible selected Product List action remains `90px x 32px` with `5px` rounding.

Measured WPB before fix on served widget `5.0.144`:
- Selected quantity wrapper: `90px x 32px`, transparent background, `100px` radius.
- Quantity decrement/increment buttons: `32px x 32px`, `5px` radius.

Fix:
- Add `--bw-ppb-cascade-action-radius: 5px`.
- Use it for Product List Add, selected quantity wrapper, and selected quantity buttons.
- This prevents the selected state from reading as a pill while keeping the inner buttons unchanged.

Local proof after source fix:
- Served storefront was still `5.0.144`, so the new source rule was injected as a temporary local proof layer.
- Selected quantity wrapper measured `5px`.
- Quantity decrement/increment buttons measured `5px`.

Deploy note:
- The built extension assets now carry widget version `5.0.145`; the live storefront will show this change after the next Shopify app deploy and CDN propagation.
