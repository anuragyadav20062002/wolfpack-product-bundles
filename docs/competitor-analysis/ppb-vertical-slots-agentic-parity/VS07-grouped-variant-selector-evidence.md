# VS07 Vertical Slots Grouped Variant Selector Evidence

Date: 2026-07-13

Scope: feature-to-storefront matrix row `C06` for Product Page Bundle Vertical
Slots (`PDP_MODAL + SIMPLIFIED`). Chrome DevTools MCP was used directly for all
browser evidence. Browser screenshots were inspected but are not committed.

## Fixture

The equivalent EB and WPB Step 1 Category 1 catalogs contain `18k Pedal Ring`
as a grouped multi-variant product. Both storefront pickers render the variant
options `6`, `7`, `8`, `9`, `10`, and `11`.

Runtime identity used for the selected `10` variant:

- EB variant ID: `45038876688580`.
- WPB variant ID: `48720161276163`.

The store-specific IDs differ as expected; the product title and selected
option identity are equivalent.

## Desktop Replay — 1280 x 800

EB:

1. Opened the Step 1 Vertical picker and activated Category 1.
2. Confirmed the grouped selector contained options `6–11`.
3. Changed the selection from `6` to `10` and activated `Add to Cart`.
4. Confirmed the product card retained variant ID `45038876688580`, selected
   option `10`, and action state `Added x1`.
5. Closed the picker and confirmed the filled row retained title
   `18k Pedal Ring`, variant title `10`, and the same variant ID.

WPB:

1. Opened the equivalent Step 1 Vertical picker and confirmed options `6–11`.
2. Changed the selection from `6` to `10` and activated `Add to Cart`.
3. Confirmed the selected product card retained variant ID `48720161276163`,
   selected option `10`, and action state `Added x1`.
4. Closed the picker and confirmed the filled row rendered
   `18k Pedal Ring - 10`, used the same variant ID, and retained matching image
   alternative text.

## Mobile Replay — 390 x 844

The same EB-first sequence was repeated at the required mobile viewport. EB
retained variant `45038876688580` and visible variant title `10` in the filled
row. WPB retained variant `48720161276163` and rendered
`18k Pedal Ring - 10` in the filled row. Both documents reported zero
horizontal overflow.

## Decision

Matrix row `C06` is Proven for Vertical Slots. This evidence isolates the
grouped selector, selected variant identity, selected card state, and filled-row
identity on the Vertical template itself.
