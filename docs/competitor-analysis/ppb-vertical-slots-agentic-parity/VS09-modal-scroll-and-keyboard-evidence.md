# VS09 Vertical Slots Modal Scroll and Keyboard Evidence

Date: 2026-07-13

Scope: feature-to-storefront matrix row `M08` for Product Page Bundle Vertical
Slots (`PDP_MODAL + SIMPLIFIED`). Chrome DevTools MCP was used directly for all
browser evidence. Browser screenshots were inspected but are not committed.

## Shared Desktop Behavior — 1280 x 800

EB and WPB both:

- render a modal backdrop and sheet;
- set document body overflow to `hidden` while the picker is open; and
- keep the product catalog in an internally scrollable modal body.

The EB modal body measured 913 px of scroll content inside a 520 px body. The
WPB modal body was also the scroll owner rather than the document. Both desktop
documents reported zero horizontal overflow.

## Shared Mobile Behavior — 390 x 844

EB:

- body overflow changed to `hidden` while open;
- modal body scroll height was 1194 px;
- the mobile close control was visible;
- activating close removed the open modal and restored body overflow; and
- document horizontal overflow was zero.

WPB widget `5.0.169`:

- body overflow changed to `hidden` while open;
- modal body scroll height was 1014 px;
- the mobile close button was visible with `aria-label="Close"`;
- activating close removed the open modal and restored body overflow; and
- document horizontal overflow was zero.

## Keyboard Difference

Desktop EB did not move initial focus into the modal. Repeated Tab presses
continued through the underlying theme header, and Escape did not close the
picker.

Desktop WPB also did not move initial focus into the modal or trap repeated Tab
presses. Unlike EB, Escape closed the picker and restored document scrolling.

## Decision

Matrix row `M08` is an accepted accessibility/safety divergence for Vertical
Slots. Backdrop, body lock, internal scrolling, close controls, and overflow
match. WPB intentionally retains the stronger Escape-to-close behavior. Focus
containment remains unresolved and is not counted as keyboard-access proof for
matrix row `Q05`.
