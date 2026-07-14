# PPB Product List Quantity Selector Delta

Date: 2026-07-11

Scope: Product Page Bundle Product List only (`PDP_INPAGE` + `CASCADE`).

Evidence files:
- EB: `/private/tmp/ppb-product-list-agentic-parity/PL-baseline-quantity/eb-quantity-metrics-selected.json`
- WPB: `/private/tmp/ppb-product-list-agentic-parity/PL-baseline-quantity/wpb-quantity-metrics-selected.json`

## EB Source Of Truth

After adding one product, EB keeps the selected quantity selector inside a `90px` by `32px` action area.

Measured EB selected state:
- Wrapper: `90px` x `32px`, transparent background, `border-radius: 100px`, `justify-content: space-between`.
- Decrement button: `32px` x `32px`, black background, white text, `5px` radius.
- Quantity value: natural text width (`6.921875px` for `1`), `14px`, `500`, `line-height: 25.2px`.
- Increment button: `32px` x `32px`, black background, white text, `5px` radius.

## WPB Current Gap

WPB matches the outer control, buttons, color, radius, font size, and row height, but the quantity value inherits the shared PPB `min-width: 24px`.

Measured WPB selected state:
- Wrapper: `90px` x `32px`, transparent background, `border-radius: 100px`, `justify-content: space-between`.
- Decrement button: `32px` x `32px`.
- Quantity value: `24px` wide because of shared `.inline-qty-display`.
- Increment button: `32px` x `32px`.

Impact: the number consumes too much horizontal space, leaving roughly `1px` gaps between the value and buttons instead of EB's natural-width spacing.

## Fix

Add a Product List-scoped override for `.bw-quantity-control__value` under `PDP_INPAGE` + `CASCADE`:
- `min-width: auto`
- `width: auto`
- `flex: 0 0 auto`
- `text-align: center`

This keeps the fix local to Product List and avoids changing shared quantity controls used by other PPB and FPB templates.
