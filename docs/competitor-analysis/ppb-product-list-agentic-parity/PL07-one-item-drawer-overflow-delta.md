# PL07 One-Item Drawer Overflow Delta

## EB Evidence

- Surface: PPB Product List desktop, `PDP_INPAGE` / `CASCADE`.
- State: one selected item, drawer expanded.
- Interaction: reset selected items, add first product, open `View Bundle Items`, wait for the animation to settle.
- Drawer rect: `top=556`, `bottom=671`, `height=115`.
- Title rect: `top=566`, `bottom=591`, `height=25`.
- First selected row rect: `top=601`, `bottom=661`, `height=60`.
- Result: row ends `10px` inside the drawer. No selected row overflow.

## WPB Evidence Before Fix

- Surface: PPB Product List desktop, `window.__BUNDLE_WIDGET_VERSION__ = "5.0.126"`.
- State: one selected item, drawer expanded, measured after transition settled.
- Interaction: reset selected items, add first product, open `View Bundle Items`, wait `1200ms`.
- Drawer rect: `top=512`, `bottom=608`, `height=96`.
- List rect: `top=513`, `bottom=609`, `height=96`, `max-height=96`.
- First selected row rect: `top=558`, `bottom=618`, `height=60`.
- Result: selected row extends `10px` below the drawer.

## Required Fix

The one-item selected drawer needs enough expanded height for its internal title, gap, padding, and selected row, matching EB's no-overflow behavior with bottom breathing room.

## WPB Evidence After Fix

- Runtime version: `window.__BUNDLE_WIDGET_VERSION__ = "5.0.127"`.
- State: one selected item, drawer expanded, measured after transition settled.
- Drawer rect: `top=492`, `bottom=608`, `height=116`.
- List rect: `top=493`, `bottom=608`, `height=115`.
- List `scrollHeight`: `115`; drawer CSS variable: `116px`.
- First selected row rect: `top=538`, `bottom=598`, `height=60`.
- Result: selected row ends `10px` inside the drawer instead of overflowing below it.
