# PPB Cross-Template Final Regression

Date: 2026-07-13
Widget: `5.0.168`

## Live dispatch and leakage sweep

The WPB fixture was switched through all four templates using the authenticated
Admin customization flow. Every storefront pass used a cache-bypassed reload at
`1280x800`, zero selections, and direct Chrome DevTools MCP inspection.

| Template | Runtime | Required shell | Competing shells absent | Overflow |
| --- | --- | --- | --- | ---: |
| Product List | `PDP_INPAGE + CASCADE` | `.bw-ppb-cascade-product-list` | Grid and modal | `0` |
| Product Grid | `PDP_INPAGE + COGNIVE` | `.bw-ppb-cognive-product-grid` | List and modal | `0` |
| Horizontal Slots | `PDP_MODAL + MODAL` | `.bw-ppb-modal-slot-grid` | Grid and List | `0` |
| Vertical Slots | `PDP_MODAL + SIMPLIFIED` | `.bw-ppb-modal-slot-grid--simplified` | Grid and List | `0` |

This proves the current generated bundle contains and dispatches all four
configs without cross-template shell leakage.

After the VS04 shared modal changes, the authenticated Admin flow was repeated
on the hot-reloaded dev environment. Cache-bypassed mobile storefront passes
confirmed `PDP_INPAGE + COGNIVE`, `PDP_MODAL + MODAL` with horizontal
orientation, `PDP_INPAGE + CASCADE`, and the restored `PDP_MODAL + SIMPLIFIED`
with vertical orientation. Every pass reported zero document overflow. The
restored Vertical fixture had zero filled rows and its original three empty
rows.

## Real wider placement

The authenticated Horizon `Equal columns` setting was enabled temporarily and
saved. No synthetic width override was used.

- Vertical Slots at `1180x800`: root `570.5px`, empty row `570.5x60px`, zero overflow.
- Vertical Slots at `1440x900`: root `570.5px`, empty row `570.5x60px`, zero overflow.
- Product Grid at both viewports: root/grid `570.5px`, three
  `174.83px` tracks with 15px gaps, card `174.83x190px`, zero overflow.

The editor session was refreshed before restoration because the first session
expired with unsaved changes. In the fresh authenticated session, Equal columns
was turned off, Shopify reported `Changes saved.`, and a new live storefront
request returned the documented default `372.34px` Vertical Slots root.

## Final fixture state

- EB: `PDP_MODAL + SIMPLIFIED`, zero filled rows, three original empty rows.
- WPB: `PDP_MODAL + SIMPLIFIED`, zero filled rows, three original empty rows.
- WPB theme: Equal columns off, one product-form-owned widget root.
- Temporary missing-media products: removed from bundle categories and restored
  to price zero in both stores.

## Final focused verification

The earlier broad PPB-focused command passed 25 suites and 139 tests. The VS04
closeout added a 12-suite, 49-test focused pass covering the shared modal toast,
category behavior, registry mappings, both slot shells, Vertical editing, and
Product Grid interaction/step flow. Together they cover registry
dispatch, Grid step flow, modal category behavior, slot capacity, Vertical
filled-row editing, Product List flow/drawer/cart metadata, inventory,
compare-at prices, placeholder media, bootstrap placement, and build inclusion.

The broader related-test sweep also reported two known source-contract failures
in `bundle-widget-product-page-addons.test.ts`; they are unrelated to template
parity and were already present in the commit-hook baseline.
