# PPB Product List Overflow Evidence

Date: 2026-07-11

Scope: Product Page Bundle Product List only (`PDP_INPAGE` + `CASCADE`).

Evidence files:
- EB desktop: `/private/tmp/ppb-product-list-agentic-parity/PL-product-list-overflow/eb-desktop-product-list-overflow.json`
- WPB desktop: `/private/tmp/ppb-product-list-agentic-parity/PL-product-list-overflow/wpb-desktop-product-list-overflow-direct-reset.json`
- EB mobile: `/private/tmp/ppb-product-list-agentic-parity/PL-product-list-overflow/eb-mobile-product-list-overflow-direct.json`
- WPB mobile: `/private/tmp/ppb-product-list-agentic-parity/PL-product-list-overflow/wpb-mobile-product-list-overflow.json`

## State Tested

1. Clear storefront storage and Cache Storage.
2. Reload the storefront.
3. Wait for Product List rows to render.
4. Measure the product-list container computed overflow, client size, scroll size, and scrollTop movement.
5. Attempt vertical scrolling by setting `scrollTop = 9999`.

## EB Source Of Truth

Measured EB desktop state:
- Product list class: `gbbMixCascadeProductsWrapper`.
- `max-height`: `410px`.
- `overflow-x`: `hidden`.
- `overflow-y`: `auto`.
- `clientHeight`: `410`.
- `scrollHeight`: `485`.
- Vertical scrollTop moved from `0` to `75`.
- No horizontal overflow: `clientWidth` and `scrollWidth` both `339`.

Measured EB mobile state with the six-row fixture:
- Product list class: `gbbMixCascadeProductsWrapper`.
- `max-height`: `100%`.
- `overflow-x`: `hidden`.
- `overflow-y`: `auto`.
- `clientHeight`: `485`.
- `scrollHeight`: `485`.
- No vertical overflow for this fixture.
- No horizontal overflow: `clientWidth` and `scrollWidth` both `360`.

## WPB Current Result

Measured WPB desktop state:
- Product list class: `bw-ppb-inpage-step-grid bw-ppb-cascade-product-list`.
- Widget version: `5.0.133`.
- `max-height`: `410px`.
- `overflow-x`: `hidden`.
- `overflow-y`: `auto`.
- `clientHeight`: `410`.
- `scrollHeight`: `472`.
- Vertical scrollTop moved from `0` to `62`.
- No horizontal overflow: `clientWidth` and `scrollWidth` both `357`.

Measured WPB mobile state:
- Product list class: `bw-ppb-inpage-step-grid bw-ppb-cascade-product-list`.
- Widget version: `5.0.133`.
- `max-height`: `410px`.
- `overflow-x`: `hidden`.
- `overflow-y`: `auto`.
- `clientHeight`: `410`.
- `scrollHeight`: `472`.
- Vertical scrollTop moved from `0` to `62`.
- No horizontal overflow: `clientWidth` and `scrollWidth` both `358`.

## Decision

No source patch is needed for the requested scroll behavior. WPB is vertically scrollable beyond the product-list cap and does not introduce horizontal scrolling.

Parity note: EB desktop uses the same `410px` cap and vertical-only overflow. EB mobile does not overflow with this six-row fixture because its measured list height is `485px`; WPB intentionally keeps the same capped Product List behavior on mobile so long lists do not push the page indefinitely.

## 2026-07-12 Re-check

Evidence files:
- WPB desktop: `/private/tmp/ppb-product-list-scroll-current-desktop.json`
- WPB mobile: `/private/tmp/ppb-product-list-scroll-current.json`

Chrome DevTools MCP re-check against WPB widget `5.0.136` confirms the Product List scroller is still attached to the rendered `PDP_INPAGE + CASCADE` grid:
- Desktop: `max-height: 410px`, `overflow-x: hidden`, `overflow-y: auto`, `clientHeight: 410`, `scrollHeight: 472`, `scrollTop` moved from `0` to `62`, no horizontal overflow.
- Mobile: `max-height: 410px`, `overflow-x: hidden`, `overflow-y: auto`, `clientHeight: 410`, `scrollHeight: 472`, `scrollTop` moved from `0` to `62`, no horizontal overflow.

Decision remains unchanged: no source patch is needed. The current source owner is `app/assets/widgets/product-page-css/templates/inpage-cascade.css`; the generated deployment asset `extensions/bundle-builder/assets/bundle-widget-product-page-cascade.css` already contains the vertical-only overflow rule.
