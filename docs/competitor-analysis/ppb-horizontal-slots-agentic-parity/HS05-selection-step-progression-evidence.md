# HS05 Selection and Step Progression Evidence

Date: 2026-07-13

## Method

EB was reset to zero selections and inspected first at 390 x 844 with direct Chrome DevTools MCP. WPB widget `5.0.157` was then reset and replayed through the same interaction sequence.

## Blocked Step 1

Both implementations leave the visible Next action active at zero selections but enforce the Step 1 quantity rule when it is activated:

- EB stays on Step 1 and shows `Add at least 02 products on this step`.
- WPB stays on Step 1 and shows its configured validation copy, `Please meet the quantity conditions for the current step before proceeding.`

The copy differs by bundle configuration; the blocking behavior is equivalent.

## Valid Step 1 and persistence

After two Step 1 selections:

- Next advances both implementations to Step 2.
- The cross-step subtotal, discounted total, and selection count remain unchanged during the transition.
- Closing the modal returns both products to the first two Step 1 slots in selection order.
- Opening the Step 2 empty slot returns directly to Step 2.
- The two Step 1 selections and footer totals persist across close/reopen.

## Final Step

Selecting exactly one Step 2 product produces a total of three items. In both implementations:

- the footer action reads `Done`;
- Done closes the picker;
- three filled main-page slots are rendered;
- the main Add Bundle to Cart action becomes enabled.

EB's final CTA was active at opacity `1` and pointer events `auto`. WPB's final CTA had `disabled=false`, opacity `1`, and pointer events `auto`.

## Result

HS05 empty, one-item, exact Step 1 target, Step 2 exact target, step advancement, close/reopen persistence, slot order, and final enabled state are accepted on mobile. Desktop uses the same state engine and has current picker/slot smoke evidence; the final desktop stress replay remains part of the lane completion audit.
