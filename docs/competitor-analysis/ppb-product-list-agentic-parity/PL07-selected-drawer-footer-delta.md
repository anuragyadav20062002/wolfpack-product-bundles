# PL07 Selected Drawer/Footer Delta

## 2026-07-11 Evidence Pass

Browser evidence source: Chrome DevTools MCP only.

EB reference: `https://yash-wolfpack.myshopify.com/products/wpb-ppb-product-list-parity-2026-07-11`

WPB fixture: `https://46twl942bo5xdbsz-82138693891.shopifypreview.com/products_preview?preview_key=cecee83a638b620eb94a26cb2da77f7a`

WPB runtime markers:
- `window.__BUNDLE_WIDGET_VERSION__ = "5.0.123"`
- `data-ppb-template-type = "PDP_INPAGE"`
- `data-ppb-design-preset = "CASCADE"`
- Active CSS asset includes `bundle-widget-product-page-cascade.css`

Measured drawer growth behavior:

| State | EB drawer | EB top gap | WPB drawer | WPB top gap | WPB issue |
|---|---:|---:|---:|---:|---|
| 1 selected, open | 115px | 10px | 115px | 11px | Acceptable 1px border difference |
| 2 selected, open | 185px | 10px | 205px | 11px | 19px bottom slack from fixed `+20` height buffer |

Live DOM experiment in WPB:
- Setting the drawer height variable to `list.scrollHeight` removed the 20px buffer but under-counted the 1px top border.
- Setting the drawer height variable to `list.scrollHeight + 1px border` produced drawer `186px`, list `185px`, top gap `11px`, and bottom slack `0px`.

Source owner:
- Drawer height is calculated in `app/assets/widgets/product-page/templates/cascade-template.js`.
- The incorrect behavior is the fixed `list.scrollHeight + 20` buffer.

Fix direction:
- Replace the fixed 20px buffer with the measured drawer top border width.
- Keep the selected list top-anchored so the header gap remains stable during 1-item to 2-item growth.

## 2026-07-11 Fix Verification

WPB refreshed runtime:
- `window.__BUNDLE_WIDGET_VERSION__ = "5.0.124"`
- Mobile viewport: `390 x 844`

Measured 2-selected open drawer after fix:
- Drawer CSS variable: `186px`
- Drawer rect height: `186px`
- List rect height: `185px`
- List scroll height: `185px`
- Top gap: `11px`
- Bottom slack: `0px`

Result:
- The old 19px bottom slack from the fixed `+20` buffer is removed.
- The selected header remains pinned to the drawer top while the drawer grows.
