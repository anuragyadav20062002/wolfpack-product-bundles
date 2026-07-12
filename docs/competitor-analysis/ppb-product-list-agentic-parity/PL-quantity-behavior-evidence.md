# PPB Product List Quantity Behavior Evidence

Date: 2026-07-11

Scope: Product Page Bundle Product List only (`PDP_INPAGE` + `CASCADE`).

Evidence files:
- EB desktop: `/private/tmp/ppb-product-list-agentic-parity/PL-quantity-behavior/eb-desktop-quantity-behavior-corrected.json`
- WPB desktop: `/private/tmp/ppb-product-list-agentic-parity/PL-quantity-behavior/wpb-desktop-quantity-behavior-corrected.json`
- EB mobile: `/private/tmp/ppb-product-list-agentic-parity/PL-quantity-behavior/eb-mobile-quantity-behavior-corrected.json`
- WPB mobile: `/private/tmp/ppb-product-list-agentic-parity/PL-quantity-behavior/wpb-mobile-quantity-behavior-corrected.json`

## State Tested

1. Clear storefront storage and Cache Storage.
2. Reload the storefront.
3. Wait for Product List rows to render.
4. Measure the first row default `Add +` button.
5. Click `Add +` and measure the selected quantity control.
6. Click increment and verify quantity `2`.
7. Click decrement and verify quantity `1`.
8. Click decrement again and verify the control returns to `Add +`.

## EB Source Of Truth

Measured EB desktop behavior:
- Default `Add +`: `90px x 32px`, `14px`, `700`, black background, `5px` radius.
- After add: decrement button `32px x 32px`, quantity value natural width, increment button `32px x 32px`.
- Quantity value: `14px`, `500`, `25.2px` line-height.
- Increment changes `1` to `2`.
- Decrement changes `2` to `1`.
- Decrement at `1` removes the selected state and restores the default `Add +` button.
- The decrement button is not disabled at quantity `1`.

Measured EB mobile behavior:
- Default `Add +`: `90px x 32px`, `12px`, `700`, black background, `5px` radius.
- Selected quantity wrapper: `90px x 32px`, transparent background, `100px` radius, `space-between`.
- Decrement/increment buttons: `32px x 32px`, `14px`, `700`, `25.2px` line-height.
- Quantity value: `12px`, `500`, `21.6px` line-height.
- Increment/decrement state transitions match desktop.

## WPB Current Result

Measured WPB desktop behavior on widget version `5.0.133`:
- Default `Add +`: `90px x 32px`, `14px`, `700`, black background, `5px` radius.
- Selected quantity wrapper: `90px x 32px`, transparent background, `100px` radius, `space-between`.
- Decrement/increment buttons: `32px x 32px`, `14px`, `700`, `25.2px` line-height.
- Quantity value: natural width, `14px`, `500`, `25.2px` line-height.
- Increment changes `1` to `2`.
- Decrement changes `2` to `1`.
- Decrement at `1` removes the selected state and restores the default `Add +` button.
- The decrement button is not disabled at quantity `1`, matching EB's remove-on-next-decrement behavior.

Measured WPB mobile behavior on widget version `5.0.133`:
- Default `Add +`: `90px x 32px`, `12px`, `700`, black background, `5px` radius.
- Selected quantity wrapper: `90px x 32px`, transparent background, `100px` radius, `space-between`.
- Decrement/increment buttons: `32px x 32px`, `14px`, `700`, `25.2px` line-height.
- Quantity value: natural width, `12px`, `500`, `21.6px` line-height.
- Increment/decrement state transitions match EB.

## Decision

No source patch is needed for this state. WPB now matches EB's Product List quantity behavior and sizing across desktop and mobile for default add, selected quantity, increment, decrement, and the quantity-one remove state.

## 2026-07-13 Radius Correction

The July 11 pass treated the transparent selected quantity wrapper's `100px` radius as acceptable because the wrapper was the measured node. A later Chrome DevTools MCP leaf-button check showed the visible EB selected action uses the same `5px` radius as the default Add action.

Updated evidence:
- EB selected leaf proof: `/private/tmp/ppb-product-list-agentic-parity/PL00-quantity-radius/eb-desktop-after-selected-radius-leaf.json`
- WPB served before fix: `/private/tmp/ppb-product-list-agentic-parity/PL00-quantity-radius/wpb-selected-radius-current-page5.json`
- WPB local proof after source fix: `/private/tmp/ppb-product-list-agentic-parity/PL00-quantity-radius/wpb-selected-radius-local-proof.json`

Updated decision:
- Product List selected quantity wrapper should use the same `5px` radius as the unselected Add action.
- The fix is documented in `PL00-product-row-quantity-delta.md` and shipped in widget version `5.0.145`.
