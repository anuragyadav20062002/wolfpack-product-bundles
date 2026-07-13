# VS04 Live Modal and Filled-Row Re-audit

Date: 2026-07-13

## EB evidence first

- Runtime: `PDP_MODAL + SIMPLIFIED`, vertical orientation.
- Mobile modal: `390x844` viewport, panel `390x717.39px`, only the current step
  title is visible, and the product grid is two `165px` columns.
- Selected modal cards show the check marker and `Added x1`; inline quantity
  controls remain hidden.
- Invalid progression shows `Add at least 02 products on this step` in a
  dismissible, body-owned, fixed toast. Its settled bottom offset is `18vh`.
- Desktop modal: `1440x900` viewport, panel `1440x765px`, five product cards at
  approximately `230x330px`, and a centered `300x84px` footer.
- Filled mobile rows are `360x64px`, with `50px` media, the title column, then a
  `20px` remove control.

## Pre-change WPB delta

- Mobile exposed every step as a black pill rail instead of the current step
  title alone.
- Validation feedback was owned by the modal sheet, positioned above its
  footer, and had no dismiss control.
- The filled-row remove control preceded the product image in visual order.

## Source correction

- The mobile modal header now hides inactive steps and presents the active step
  as typography rather than a pill.
- Modal validation toasts are body-mounted, dismissible, and use the shared
  fixed modal-toast class.
- Vertical filled-row children use image, title, remove visual order.

## Hot-reloaded WPB proof

- Served widget: `5.0.168`.
- Runtime: `PDP_MODAL + SIMPLIFIED`, `data-ppb-slot-orientation="vertical"`.
- Mobile panel: `390x717.39px`; only Step 1 is displayed. Product cards are
  `165x264.38px`, and selected cards expose `Added x1`.
- Settled validation toast: `331.5x46px` at `x=29.25`, `y=646.09`, fixed at
  `18vh`, with a close control.
- Completed mobile rows: `358x64px`, `50x50px` image, title in the flexible
  middle column, and `20x22px` remove control on the right. Removing the first
  product reindexes the remaining item and restores Product 2/Product 3 slots.
- Desktop modal after transition: `1440x765px`; five cards at approximately
  `230x330px`; footer `300x84px`.
- No document or widget overflow at 360, 390, 768, 1280, or 1440 CSS pixels.

## Result

Accepted on the hot-reloaded dev environment. No deployment wait was used or
required.
