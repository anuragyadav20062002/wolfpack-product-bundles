# PL07 Selected Drawer Heading Gap Delta

## Scope

- Surface: PPB Product List desktop, `PDP_INPAGE` / `CASCADE`.
- State: drawer expanded with one selected item, then another item added while the drawer remains open.
- Evidence source: Chrome DevTools MCP measurements only.

## EB Baseline

- One selected item:
  - Drawer top: `677.3`
  - Heading top: `677.3`
  - Top gap: `0`
  - Heading to first row gap: `10`
  - Heading rule gap: `10`
- Two selected items after adding while open:
  - Drawer top: `677.3`
  - Heading top: `677.3`
  - Top gap: `0`
  - Heading to first row gap: `10`
  - Heading rule gap: `10`

EB keeps the selected heading pinned to the drawer top and does not change the heading or rule spacing when the selected row count changes.

## WPB Before

- Version: `5.0.129`
- One selected item:
  - Drawer top: `491.75`
  - Heading top: `502.75`
  - Top gap: `11`
  - Heading to first row gap: `10`
  - Heading rule gap: `10`
- Two selected items after adding while open:
  - Drawer top: `421.75`
  - Heading top: `432.75`
  - Top gap: `11`
  - Heading to first row gap: `10`
  - Heading rule gap: `10`

WPB no longer increased the gap while moving from one selected item to two selected items, but the drawer still kept an EB-mismatching top inset.

## Fix

Remove the Product List selected-list top padding in `app/assets/widgets/product-page-css/templates/inpage-cascade.css`.

The drawer keeps the requested top border and bottom breathing room, while the selected heading starts at the drawer top like EB.

## WPB After

- Version: `5.0.130`
- One selected item:
  - Drawer top: `501.75`
  - Heading top: `502.75`
  - Top gap: `1`
  - Heading to first row gap: `10`
  - Heading rule gap: `10`
  - List padding top: `0`
  - List padding bottom: `10`
- Two selected items after adding while open:
  - Drawer top: `431.75`
  - Heading top: `432.75`
  - Top gap: `1`
  - Heading to first row gap: `10`
  - Heading rule gap: `10`
  - List padding top: `0`
  - List padding bottom: `10`

The remaining `1px` delta is the requested WPB top border. The selected heading gap stays stable when the drawer expands from one selected row to two selected rows, and the horizontal rule gap does not wrap or shift.
