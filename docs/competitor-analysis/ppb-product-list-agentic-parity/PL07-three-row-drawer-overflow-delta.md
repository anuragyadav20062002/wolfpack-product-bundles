# PL07 Three-Row Drawer Overflow Delta

## EB Evidence

- Surface: PPB Product List desktop, `PDP_INPAGE` / `CASCADE`.
- State: all three current fixture products selected, drawer expanded.
- Drawer rect: `top=426`, `bottom=671`, `height=245`.
- Selected list metrics:
  - `scrollHeight=255`
  - `clientHeight=245`
  - `overflow-y=auto`
  - `padding=10px`
- Row geometry:
  - Row 1: `top=471`, `bottom=531`
  - Row 2: `top=541`, `bottom=601`
  - Row 3: `top=611`, `bottom=671`
- Result: third row touches the drawer bottom. The list clips the bottom padding and is scrollable.

## WPB Evidence Before Fix

- Runtime version: `window.__BUNDLE_WIDGET_VERSION__ = "5.0.128"`.
- State: all three current fixture products selected, drawer expanded.
- Drawer rect: `top=352`, `bottom=608`, `height=256`.
- Selected list metrics:
  - `scrollHeight=255`
  - `clientHeight=255`
  - `overflow-y=auto`
  - `padding=10px`
- Row geometry:
  - Row 1: `top=398`, `bottom=458`
  - Row 2: `top=468`, `bottom=528`
  - Row 3: `top=538`, `bottom=598`
- Result: WPB keeps the full bottom padding visible and sizes the drawer taller than EB.

## Required Fix

When three or more selected rows exist, cap the drawer to the visible height of the title plus three rows and their gaps, excluding bottom padding. This preserves the scrollable overflow behavior EB shows while keeping one- and two-row drawers content-sized.

## WPB Evidence After Fix

- Runtime version: `window.__BUNDLE_WIDGET_VERSION__ = "5.0.129"`.
- State: all three current fixture products selected, drawer expanded.
- Drawer rect: `top=362`, `bottom=608`, `height=246`.
- Selected list metrics:
  - `scrollHeight=255`
  - `clientHeight=246`
  - `overflow-y=auto`
  - `padding=10px`
- Row geometry:
  - Row 1: `top=408`, `bottom=468`
  - Row 2: `top=478`, `bottom=538`
  - Row 3: `top=548`, `bottom=608`
- Result: third row touches the drawer bottom and the selected list is scrollable.
