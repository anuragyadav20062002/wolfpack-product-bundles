# PL00 Add Button Centering Delta

## EB Evidence

- Surface: PPB Product List desktop, selected item removed by clicking minus at quantity `1`.
- Resulting first-row Add button:
  - Rect: `90 x 32`.
  - Display: `flex`.
  - Alignment: `align-items: center`, `justify-content: center`.
  - Padding: `4px 14px`.
  - Font: `14px`, `700`, `line-height: normal`.
  - Border radius: `5px`.

## WPB Evidence Before Fix

- Surface: PPB Product List desktop, `window.__BUNDLE_WIDGET_VERSION__ = "5.0.127"`.
- Same interaction: selected item removed by clicking minus at quantity `1`.
- Resulting first-row Add button:
  - Rect: `90 x 32`.
  - Display: `block`.
  - Alignment: `normal`.
  - Padding: `0px 10px`.
  - Font: `14px`, `700`, `line-height: 14px`.
  - Border radius: `5px`.

## Required Fix

Keep the existing 90 x 32 button geometry, but match EB's flex-centered button contents and text metrics.

## WPB Evidence After Fix

- Runtime version: `window.__BUNDLE_WIDGET_VERSION__ = "5.0.128"`.
- First-row Add button:
  - Rect: `90 x 32`.
  - Display: `flex`.
  - Alignment: `align-items: center`, `justify-content: center`.
  - Padding: `4px 14px`.
  - Font: `14px`, `700`, `line-height: normal`.
  - Border radius: `5px`.
