# HS17 Modal Scroll, Backdrop, and Keyboard Evidence

Date: 2026-07-13

## Method

EB was inspected first with direct Chrome DevTools MCP after cache-bypassing reloads. The same probes were then repeated on WPB widget `5.0.153` at 390 x 844 and 1280 x 800.

## Mobile

### EB

- Opening an empty slot sets `body` overflow to `hidden`.
- The modal occupies the bottom 85% of the viewport after its opening transition.
- The modal body owns vertical overflow and its footer remains outside that scroll owner.
- The full-viewport overlay closes the modal and restores body overflow.
- Focus remains on `BODY`; the picker does not move focus into a control.
- Escape does not close the picker.

### WPB

- Opening an empty slot sets `body` overflow to `hidden`.
- The modal settles to the same bottom-sheet height after its opening transition.
- `.bw-bs-body` owns vertical overflow and the footer remains outside that scroll owner.
- The full-viewport overlay closes the modal and restores body overflow.
- Focus remains on `BODY`, matching EB.
- Escape additionally closes the picker and restores body overflow.
- The panel exposes `role="dialog"` and `aria-modal="true"`; EB exposes neither on its picker wrapper.

The additional Escape and dialog semantics are retained because they do not change the pointer interaction model or visual parity.

## Desktop

After allowing the height transition and product rendering to settle:

- Both implementations use a bottom-fixed sheet occupying 85% of the 1280 x 800 viewport.
- Both lock document body scrolling.
- Both use an internal vertically scrollable body with a fixed header/footer region.
- Both expose a full-viewport backdrop.
- Both retain focus on `BODY` on open.
- Each exposes only its desktop close control at this viewport.

## Runtime contract

WPB served widget `5.0.153` with:

- `body[wpbmix-template-type="PDP_MODAL"]`
- `body[wpbmix-template-id="MODAL"]`
- `data-ppb-slot-orientation="horizontal"` on the widget container and bundle steps

## Result

HS17 is accepted for current EB parity at mobile and desktop. Focus behavior is an explicitly matched absence, while WPB retains non-visual accessibility improvements for dialog semantics and Escape dismissal.
